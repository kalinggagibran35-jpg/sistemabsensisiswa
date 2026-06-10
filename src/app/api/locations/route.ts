import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const locations = await db.attendanceLocation.findMany({
      include: {
        class: {
          select: { id: true, name: true, major: true },
        },
        qr_codes: {
          where: { is_active: true },
          select: { id: true },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    const data = locations.map((l) => ({
      id: l.id,
      name: l.name,
      latitude: l.latitude,
      longitude: l.longitude,
      radius_meters: l.radius_meters,
      class_id: l.class_id,
      class: l.class,
      active_qr_count: l.qr_codes.length,
      created_at: l.created_at,
      updated_at: l.updated_at,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Get locations error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, latitude, longitude, radius_meters, class_id } = body

    if (!name || latitude === undefined || longitude === undefined || !radius_meters) {
      return NextResponse.json(
        { error: 'Nama, latitude, longitude, dan radius harus diisi' },
        { status: 400 }
      )
    }

    const location = await db.attendanceLocation.create({
      data: {
        name,
        latitude,
        longitude,
        radius_meters,
        class_id: class_id || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: location,
    })
  } catch (error) {
    console.error('Create location error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, latitude, longitude, radius_meters, class_id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID lokasi harus diisi' },
        { status: 400 }
      )
    }

    const location = await db.attendanceLocation.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(radius_meters !== undefined && { radius_meters }),
        ...(class_id !== undefined && { class_id }),
      },
    })

    return NextResponse.json({
      success: true,
      data: location,
    })
  } catch (error) {
    console.error('Update location error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID lokasi harus diisi' },
        { status: 400 }
      )
    }

    await db.attendanceLocation.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Lokasi absensi berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete location error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
