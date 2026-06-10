import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}
    if (year) {
      where.date = { startsWith: year }
    }

    const holidays = await db.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ success: true, data: holidays })
  } catch (error) {
    console.error('Get holidays error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, name } = body

    if (!date || !name) {
      return NextResponse.json(
        { error: 'Tanggal dan nama hari libur harus diisi' },
        { status: 400 }
      )
    }

    // Check if holiday already exists for this date
    const existing = await db.holiday.findFirst({
      where: { date },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Hari libur untuk tanggal ini sudah ada' },
        { status: 409 }
      )
    }

    const holiday = await db.holiday.create({
      data: { date, name },
    })

    return NextResponse.json({
      success: true,
      data: holiday,
    })
  } catch (error) {
    console.error('Create holiday error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, date, name } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID hari libur harus diisi' },
        { status: 400 }
      )
    }

    const holiday = await db.holiday.update({
      where: { id },
      data: {
        ...(date && { date }),
        ...(name && { name }),
      },
    })

    return NextResponse.json({
      success: true,
      data: holiday,
    })
  } catch (error) {
    console.error('Update holiday error:', error)
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
        { error: 'ID hari libur harus diisi' },
        { status: 400 }
      )
    }

    await db.holiday.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Hari libur berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete holiday error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
