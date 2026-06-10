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
    const student_id = searchParams.get('student_id')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const class_id = searchParams.get('class_id')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const where: Record<string, unknown> = {}
    if (student_id) where.student_id = student_id
    if (status) where.status = status
    if (type) where.type = type
    if (class_id) {
      where.student = { class_id }
    }

    const [leaveRequests, total] = await Promise.all([
      db.leaveRequest.findMany({
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
          approved_wali: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.leaveRequest.count({ where }),
    ])

    return NextResponse.json({ success: true, data: leaveRequests, total, page, pageSize })
  } catch (error) {
    console.error('Get leave requests error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, type, reason, evidence_url, start_date, end_date, userName, userRole, userId } = body

    if (!student_id || !type || !reason || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Semua field wajib harus diisi' },
        { status: 400 }
      )
    }

    const validTypes = ['izin', 'sakit']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipe izin tidak valid' },
        { status: 400 }
      )
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        student_id,
        type,
        reason,
        evidence_url: evidence_url || null,
        start_date,
        end_date,
        status: 'pending',
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
            class: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    // Log activity
    await logActivity({
      userId,
      userName: userName || leaveRequest.student.user.name,
      userRole: userRole || 'siswa',
      activityType: 'ajukan_izin_sakit',
      details: `Mengajukan ${type}: ${leaveRequest.student.user.name} (${start_date} - ${end_date})`,
    })

    // Notify wali kelas of the student's class
    if (leaveRequest.student.class?.id) {
      const classTeachers = await db.classTeacher.findMany({
        where: { class_id: leaveRequest.student.class.id },
        include: {
          teacher: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
      })

      for (const ct of classTeachers) {
        await createNotification({
          userId: ct.teacher.user.id,
          title: 'Pengajuan Izin/Sakit Baru',
          message: `Pengajuan izin/sakit baru dari ${leaveRequest.student.user.name}`,
          type: 'info',
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: leaveRequest,
    })
  } catch (error) {
    console.error('Create leave request error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = requireRole(request, ['admin', 'wali_kelas'])
    if (!auth.authorized) {
      return auth.error === 'Unauthorized' ? unauthorizedResponse() : forbiddenResponse()
    }
    const body = await request.json()
    const { id, status, approved_by_wali_id, approved_by_admin_id, approverName, approverRole, approverId } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID dan status harus diisi' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'approved_wali_kelas', 'approved_admin', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { status }
    if (approved_by_wali_id) updateData.approved_by_wali_id = approved_by_wali_id
    if (approved_by_admin_id) updateData.approved_by_admin_id = approved_by_admin_id

    const leaveRequest = await db.leaveRequest.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
          },
        },
        approved_wali: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    })

    // Log activity
    await logActivity({
      userId: approverId,
      userName: approverName || 'Admin',
      userRole: approverRole || 'admin',
      activityType: status === 'rejected' ? 'reject_izin_sakit' : 'approve_izin_sakit',
      details: `${status === 'rejected' ? 'Menolak' : 'Menyetujui'} pengajuan ${leaveRequest.type} dari ${leaveRequest.student.user.name}`,
    })

    // Notification logic based on approval status
    if (status === 'approved_wali_kelas') {
      // Notify admins that wali kelas has approved
      const admins = await db.user.findMany({
        where: { role: 'admin' },
        select: { id: true },
      })
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: 'Pengajuan Izin/Sakit Disetujui Wali Kelas',
          message: `Pengajuan izin/sakit dari ${leaveRequest.student.user.name} menunggu approval Anda`,
          type: 'warning',
        })
      }
    }

    if (status === 'approved_admin') {
      // Notify student that their request is fully approved
      await createNotification({
        userId: leaveRequest.student.user.id,
        title: 'Pengajuan Izin/Sakit Disetujui',
        message: `Pengajuan ${leaveRequest.type} Anda telah disetujui`,
        type: 'success',
      })
    }

    if (status === 'rejected') {
      // Notify student that their request is rejected
      await createNotification({
        userId: leaveRequest.student.user.id,
        title: 'Pengajuan Izin/Sakit Ditolak',
        message: `Pengajuan ${leaveRequest.type} Anda ditolak`,
        type: 'error',
      })
    }

    return NextResponse.json({
      success: true,
      data: leaveRequest,
    })
  } catch (error) {
    console.error('Update leave request error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
