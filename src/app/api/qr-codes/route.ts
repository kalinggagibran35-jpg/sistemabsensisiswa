import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const is_active = searchParams.get('is_active')
    const location_id = searchParams.get('location_id')

    const where: Record<string, unknown> = {}
    if (is_active !== null && is_active !== undefined) {
      where.is_active = is_active === 'true'
    }
    if (location_id) where.location_id = location_id

    const qrCodes = await db.qRCode.findMany({
      where,
      include: {
        location: {
          select: { id: true, name: true, latitude: true, longitude: true },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ success: true, data: qrCodes })
  } catch (error) {
    console.error('Get QR codes error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support "validate" action for QR code scanning
    if (body.action === 'validate') {
      const { code } = body
      if (!code) {
        return NextResponse.json(
          { valid: false, message: 'Kode QR harus diisi' },
          { status: 400 }
        )
      }

      const qrCode = await db.qRCode.findUnique({
        where: { code },
        include: { location: true },
      })

      if (!qrCode) {
        return NextResponse.json({
          valid: false,
          message: 'Kode QR tidak valid',
        })
      }

      if (!qrCode.is_active) {
        return NextResponse.json({
          valid: false,
          message: 'Kode QR sudah tidak aktif',
        })
      }

      const now = new Date()
      const expiresAt = new Date(qrCode.expires_at)
      if (now > expiresAt) {
        await db.qRCode.update({
          where: { id: qrCode.id },
          data: { is_active: false },
        })
        return NextResponse.json({
          valid: false,
          message: 'Kode QR sudah kadaluarsa',
        })
      }

      return NextResponse.json({
        valid: true,
        message: 'Kode QR valid',
        data: {
          id: qrCode.id,
          code: qrCode.code,
          location: qrCode.location,
          expires_at: qrCode.expires_at,
        },
      })
    }

    // Default action: generate QR code
    const { location_id, expires_in_minutes } = body

    const expiresIn = expires_in_minutes || 30 // Default 30 minutes
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000).toISOString()

    // Deactivate existing active QR codes for this location
    if (location_id) {
      await db.qRCode.updateMany({
        where: { location_id, is_active: true },
        data: { is_active: false },
      })
    }

    const code = randomUUID()

    const qrCode = await db.qRCode.create({
      data: {
        code,
        location_id: location_id || null,
        expires_at: expiresAt,
        is_active: true,
      },
      include: {
        location: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: qrCode,
    })
  } catch (error) {
    console.error('Create QR code error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Kode QR harus diisi' },
        { status: 400 }
      )
    }

    // Validate QR code
    const qrCode = await db.qRCode.findUnique({
      where: { code },
      include: {
        location: true,
      },
    })

    if (!qrCode) {
      return NextResponse.json(
        { error: 'Kode QR tidak valid' },
        { status: 404 }
      )
    }

    if (!qrCode.is_active) {
      return NextResponse.json(
        { error: 'Kode QR sudah tidak aktif' },
        { status: 400 }
      )
    }

    const now = new Date()
    const expiresAt = new Date(qrCode.expires_at)
    if (now > expiresAt) {
      // Mark as inactive
      await db.qRCode.update({
        where: { id: qrCode.id },
        data: { is_active: false },
      })
      return NextResponse.json(
        { error: 'Kode QR sudah kadaluarsa' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: qrCode.id,
        code: qrCode.code,
        location: qrCode.location,
        expires_at: qrCode.expires_at,
      },
    })
  } catch (error) {
    console.error('Validate QR code error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
