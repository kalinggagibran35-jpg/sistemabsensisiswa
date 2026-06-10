import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const schedules = await db.reportSchedule.findMany({
      include: {
        logs: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ success: true, data: schedules })
  } catch (error) {
    console.error('Get WA schedules error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      type,
      send_time,
      day_of_week,
      recipient_type,
      class_filter,
      template_message,
      status,
    } = body

    if (!name || !type || !send_time || !recipient_type) {
      return NextResponse.json(
        { error: 'Nama, tipe, waktu kirim, dan tipe penerima harus diisi' },
        { status: 400 }
      )
    }

    const validTypes = ['daily', 'weekly']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipe jadwal tidak valid' },
        { status: 400 }
      )
    }

    if (type === 'weekly' && !day_of_week) {
      return NextResponse.json(
        { error: 'Hari dalam seminggu harus diisi untuk jadwal mingguan' },
        { status: 400 }
      )
    }

    const schedule = await db.reportSchedule.create({
      data: {
        name,
        type,
        send_time,
        day_of_week: day_of_week || null,
        recipient_type,
        class_filter: class_filter || null,
        template_message: template_message || null,
        status: status || 'active',
      },
    })

    return NextResponse.json({
      success: true,
      data: schedule,
    })
  } catch (error) {
    console.error('Create WA schedule error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, type, send_time, day_of_week, recipient_type, class_filter, template_message, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID jadwal harus diisi' },
        { status: 400 }
      )
    }

    const schedule = await db.reportSchedule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(send_time && { send_time }),
        ...(day_of_week !== undefined && { day_of_week }),
        ...(recipient_type && { recipient_type }),
        ...(class_filter !== undefined && { class_filter }),
        ...(template_message !== undefined && { template_message }),
        ...(status && { status }),
      },
    })

    return NextResponse.json({
      success: true,
      data: schedule,
    })
  } catch (error) {
    console.error('Update WA schedule error:', error)
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
        { error: 'ID jadwal harus diisi' },
        { status: 400 }
      )
    }

    await db.reportSchedule.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Jadwal laporan WA berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete WA schedule error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
