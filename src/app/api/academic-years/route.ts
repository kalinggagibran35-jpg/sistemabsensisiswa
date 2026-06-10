import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'

export async function GET() {
  try {
    const academicYears = await db.academicYear.findMany({
      include: {
        classes: {
          include: {
            students: {
              where: { status: 'active' },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { name: 'desc' },
    })

    const data = academicYears.map((ay) => ({
      id: ay.id,
      name: ay.name,
      is_active: ay.is_active,
      is_archived: ay.is_archived,
      created_at: ay.created_at,
      updated_at: ay.updated_at,
      class_count: ay.classes.length,
      total_students: ay.classes.reduce((sum, c) => sum + c.students.length, 0),
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Get academic years error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, is_active } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nama tahun ajaran harus diisi' },
        { status: 400 }
      )
    }

    // If setting as active, deactivate others
    if (is_active) {
      await db.academicYear.updateMany({
        where: { is_active: true },
        data: { is_active: false },
      })
    }

    const academicYear = await db.academicYear.create({
      data: {
        name,
        is_active: is_active || false,
      },
    })

    // Log activity
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'tambah_tahun_ajaran',
      details: `Menambah tahun ajaran: ${name}`,
    })

    return NextResponse.json({
      success: true,
      data: academicYear,
    })
  } catch (error) {
    console.error('Create academic year error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, is_active, is_archived } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID tahun ajaran harus diisi' },
        { status: 400 }
      )
    }

    // If setting as active, deactivate others
    if (is_active) {
      await db.academicYear.updateMany({
        where: { is_active: true },
        data: { is_active: false },
      })
    }

    const academicYear = await db.academicYear.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(is_active !== undefined && { is_active }),
        ...(is_archived !== undefined && { is_archived }),
      },
    })

    // Log activity
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'ganti_tahun_ajaran',
      details: `Mengubah tahun ajaran: ${name || academicYear.name}`,
    })

    return NextResponse.json({
      success: true,
      data: academicYear,
    })
  } catch (error) {
    console.error('Update academic year error:', error)
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
        { error: 'ID tahun ajaran harus diisi' },
        { status: 400 }
      )
    }

    await db.academicYear.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Tahun ajaran berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete academic year error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
