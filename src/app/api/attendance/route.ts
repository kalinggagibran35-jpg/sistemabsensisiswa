import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity, createNotification } from '@/lib/logger'
import { requireAuth, requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error)
    }
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const class_id = searchParams.get('class_id')
    const student_id = searchParams.get('student_id')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const where: Record<string, unknown> = {}
    if (date) where.date = date
    if (student_id) where.student_id = student_id
    if (status) where.status = status
    if (class_id) {
      where.student = { class_id }
    }

    const [attendance, total] = await Promise.all([
      db.attendance.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: { id: true, name: true, photo_url: true },
              },
              class: {
                select: { id: true, name: true, major: true },
              },
            },
          },
        },
        orderBy: [{ date: 'desc' }, { check_in_time: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.attendance.count({ where }),
    ])

    return NextResponse.json({ success: true, data: attendance, total, page, pageSize })
  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireRole(request, ['admin', 'wali_kelas'])
    if (!auth.authorized) {
      return auth.error === 'Unauthorized' ? unauthorizedResponse() : forbiddenResponse()
    }
    const body = await request.json()
    const {
      student_id,
      date,
      check_in_time,
      check_out_time,
      status,
      method,
      latitude,
      longitude,
      notes,
    } = body

    if (!student_id || !date || !check_in_time || !status || !method) {
      return NextResponse.json(
        { error: 'Student ID, tanggal, waktu masuk, status, dan metode harus diisi' },
        { status: 400 }
      )
    }

    // Check if attendance already exists for this student on this date
    const existing = await db.attendance.findFirst({
      where: {
        student_id,
        date,
      },
    })

    if (existing) {
      // Update existing record (e.g., add check-out time)
      const updated = await db.attendance.update({
        where: { id: existing.id },
        data: {
          check_out_time: check_out_time || existing.check_out_time,
          status,
          notes: notes || existing.notes,
          latitude: latitude ?? existing.latitude,
          longitude: longitude ?? existing.longitude,
        },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              class: { select: { name: true } },
            },
          },
        },
      })

      // Log activity
      await logActivity({
        userName: 'System',
        userRole: method === 'manual' ? 'admin' : 'siswa',
        activityType: 'edit_absensi',
        details: `Mengedit absensi: ${updated.student.user.name} - ${date}`,
      })

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Data absensi diperbarui',
      })
    }

    const attendance = await db.attendance.create({
      data: {
        student_id,
        date,
        check_in_time,
        check_out_time: check_out_time || null,
        status,
        method,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        notes: notes || null,
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
            class: { select: { name: true } },
          },
        },
      },
    })

    // Log activity
    await logActivity({
      userName: 'System',
      userRole: method === 'manual' ? 'admin' : 'siswa',
      activityType: 'tambah_absensi',
      details: `Menambah absensi: ${attendance.student.user.name} - ${date}`,
    })

    // If manual entry by admin, notify student
    if (method === 'manual' && attendance.student.user.id) {
      await createNotification({
        userId: attendance.student.user.id,
        title: 'Absensi Dicatat',
        message: `Absensi Anda pada ${date} telah dicatat manual oleh admin dengan status: ${status}`,
        type: 'info',
      })
    }

    return NextResponse.json({
      success: true,
      data: attendance,
    })
  } catch (error) {
    console.error('Create attendance error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireRole(request, ['admin', 'wali_kelas'])
    if (!auth.authorized) {
      return auth.error === 'Unauthorized' ? unauthorizedResponse() : forbiddenResponse()
    }
    const body = await request.json()
    const { id, check_in_time, check_out_time, status, notes, latitude, longitude } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID absensi harus diisi' },
        { status: 400 }
      )
    }

    const existing = await db.attendance.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Data absensi tidak ditemukan' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (check_in_time) updateData.check_in_time = check_in_time
    if (check_out_time !== undefined) updateData.check_out_time = check_out_time
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude

    const updated = await db.attendance.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    })

    // Log activity
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'edit_absensi',
      details: `Mengedit absensi: ${updated.student.user.name} - ${updated.date}`,
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Update attendance error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = requireRole(request, ['admin', 'wali_kelas'])
    if (!auth.authorized) {
      return auth.error === 'Unauthorized' ? unauthorizedResponse() : forbiddenResponse()
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID absensi harus diisi' },
        { status: 400 }
      )
    }

    const existing = await db.attendance.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Data absensi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Log activity before delete
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'hapus_absensi',
      details: `Menghapus absensi: ${existing.student.user.name} - ${existing.date}`,
    })

    await db.attendance.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Data absensi berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete attendance error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
