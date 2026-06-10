import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity, logStudentAudit } from '@/lib/logger'
import { requireAuth, requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error)
    }
    const { searchParams } = new URL(request.url)
    const class_id = searchParams.get('class_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const where: Record<string, unknown> = {}
    if (class_id) where.class_id = class_id
    if (status) where.status = status
    if (search) {
      where.OR = [
        { nis: { contains: search } },
        { user: { name: { contains: search } } },
      ]
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              photo_url: true,
              phone: true,
            },
          },
          class: {
            include: {
              academic_year: true,
              class_teachers: {
                include: {
                  teacher: {
                    include: { user: { select: { name: true } } },
                  },
                },
              },
            },
          },
          face_descriptors: {
            select: { id: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.student.count({ where }),
    ])

    const data = students.map((s) => ({
      id: s.id,
      nis: s.nis,
      user_id: s.user_id,
      class_id: s.class_id,
      parent_whatsapp: s.parent_whatsapp,
      face_registered: s.face_registered,
      face_descriptor_count: s.face_descriptors.length,
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
      user: s.user,
      class: {
        id: s.class.id,
        name: s.class.name,
        major: s.class.major,
        academic_year: s.class.academic_year,
        teachers: s.class.class_teachers.map((ct) => ({
          id: ct.teacher.id,
          name: ct.teacher.user.name,
        })),
      },
    }))

    return NextResponse.json({ success: true, data, total, page, pageSize })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireRole(request, ['admin'])
    if (!auth.authorized) {
      return auth.error === 'Unauthorized' ? unauthorizedResponse() : forbiddenResponse()
    }
    const body = await request.json()
    const { email, password, name, nis, class_id, phone, parent_whatsapp, photo_url } = body

    if (!email || !password || !name || !nis || !class_id) {
      return NextResponse.json(
        { error: 'Email, password, nama, NIS, dan kelas harus diisi' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    // Check if NIS already exists
    const existingNis = await db.student.findUnique({
      where: { nis },
    })

    if (existingNis) {
      return NextResponse.json(
        { error: 'NIS sudah terdaftar' },
        { status: 409 }
      )
    }

    // Create user first
    const user = await db.user.create({
      data: {
        email,
        password,
        name,
        role: 'siswa',
        phone: phone || null,
        photo_url: photo_url || null,
      },
    })

    // Create student
    const student = await db.student.create({
      data: {
        user_id: user.id,
        nis,
        class_id,
        parent_whatsapp: parent_whatsapp || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        class: true,
      },
    })

    // Log activity
    await logActivity({
      userId: user.id,
      userName: name,
      userRole: 'admin',
      activityType: 'tambah_siswa',
      details: `Menambah siswa: ${name}`,
    })

    return NextResponse.json({
      success: true,
      data: student,
    })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireRole(request, ['admin'])
    if (!auth.authorized) {
      return auth.error === 'Unauthorized' ? unauthorizedResponse() : forbiddenResponse()
    }
    const body = await request.json()
    const { id, name, email, nis, class_id, parent_whatsapp, status, face_registered, password } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID siswa harus diisi' },
        { status: 400 }
      )
    }

    const student = await db.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        class: { select: { id: true, name: true, major: true } },
      },
    })
    if (!student) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    // Track changes for audit logging
    const changedByName = 'Admin'
    const changedById: string | undefined = undefined

    // Update user info
    const userUpdateData: Record<string, unknown> = {}
    if (name && name !== student.user.name) {
      userUpdateData.name = name
      await logStudentAudit({
        studentId: id,
        changedById,
        changedByName,
        fieldName: 'name',
        oldValue: student.user.name,
        newValue: name,
      })
    }
    if (email && email !== student.user.email) {
      userUpdateData.email = email
      await logStudentAudit({
        studentId: id,
        changedById,
        changedByName,
        fieldName: 'email',
        oldValue: student.user.email,
        newValue: email,
      })
    }
    if (password) {
      userUpdateData.password = password
    }
    if (Object.keys(userUpdateData).length > 0) {
      await db.user.update({
        where: { id: student.user_id },
        data: userUpdateData,
      })
    }

    // Update student info
    const studentUpdateData: Record<string, unknown> = {}
    if (nis && nis !== student.nis) {
      studentUpdateData.nis = nis
      await logStudentAudit({
        studentId: id,
        changedById,
        changedByName,
        fieldName: 'nis',
        oldValue: student.nis,
        newValue: nis,
      })
    }
    if (class_id && class_id !== student.class_id) {
      studentUpdateData.class_id = class_id
      await logStudentAudit({
        studentId: id,
        changedById,
        changedByName,
        fieldName: 'class_id',
        oldValue: student.class_id,
        newValue: class_id,
      })
    }
    if (parent_whatsapp !== undefined && parent_whatsapp !== student.parent_whatsapp) {
      studentUpdateData.parent_whatsapp = parent_whatsapp || null
      await logStudentAudit({
        studentId: id,
        changedById,
        changedByName,
        fieldName: 'parent_whatsapp',
        oldValue: student.parent_whatsapp || '',
        newValue: parent_whatsapp || '',
      })
    }
    if (status && status !== student.status) {
      studentUpdateData.status = status
      await logStudentAudit({
        studentId: id,
        changedById,
        changedByName,
        fieldName: 'status',
        oldValue: student.status,
        newValue: status,
      })
    }
    if (face_registered !== undefined && face_registered !== student.face_registered) {
      studentUpdateData.face_registered = face_registered
      await logStudentAudit({
        studentId: id,
        changedById,
        changedByName,
        fieldName: 'face_registered',
        oldValue: String(student.face_registered),
        newValue: String(face_registered),
      })
    }
    if (Object.keys(studentUpdateData).length > 0) {
      await db.student.update({
        where: { id },
        data: studentUpdateData,
      })
    }

    // Log activity
    const finalName = name || student.user.name
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'edit_siswa',
      details: `Mengedit siswa: ${finalName}`,
    })

    const result = await db.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } },
        class: { select: { id: true, name: true, major: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = requireRole(request, ['admin'])
    if (!auth.authorized) {
      return auth.error === 'Unauthorized' ? unauthorizedResponse() : forbiddenResponse()
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID siswa harus diisi' },
        { status: 400 }
      )
    }

    const student = await db.student.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    })
    if (!student) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    const studentName = student.user.name

    // Log activity before delete
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'hapus_siswa',
      details: `Menghapus siswa: ${studentName}`,
    })

    // Delete student and associated user
    await db.student.delete({ where: { id } })
    await db.user.delete({ where: { id: student.user_id } })

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
