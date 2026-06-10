import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }
    }

    const teachers = await db.teacher.findMany({
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
        class_teachers: {
          include: {
            class: {
              include: {
                academic_year: true,
                students: {
                  where: { status: 'active' },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    const data = teachers.map((t) => ({
      id: t.id,
      user_id: t.user_id,
      phone: t.phone,
      created_at: t.created_at,
      updated_at: t.updated_at,
      user: t.user,
      classes: t.class_teachers.map((ct) => ({
        id: ct.class.id,
        name: ct.class.name,
        major: ct.class.major,
        academic_year: ct.class.academic_year,
        student_count: ct.class.students.length,
      })),
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Get teachers error:', error)
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
    const { email, password, name, phone, photo_url, class_ids } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, dan nama harus diisi' },
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

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password,
        name,
        role: 'wali_kelas',
        phone: phone || null,
        photo_url: photo_url || null,
      },
    })

    // Create teacher
    const teacher = await db.teacher.create({
      data: {
        user_id: user.id,
        phone: phone || null,
      },
    })

    // Assign to classes if provided
    if (class_ids && Array.isArray(class_ids) && class_ids.length > 0) {
      await db.classTeacher.createMany({
        data: class_ids.map((class_id: string) => ({
          class_id,
          teacher_id: teacher.id,
        })),
      })
    }

    // Log activity
    await logActivity({
      userId: user.id,
      userName: name,
      userRole: 'admin',
      activityType: 'tambah_wali_kelas',
      details: `Menambah wali kelas: ${name}`,
    })

    const result = await db.teacher.findUnique({
      where: { id: teacher.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        class_teachers: {
          include: { class: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Create teacher error:', error)
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
    const { id, name, phone, photo_url, class_ids } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID guru harus diisi' },
        { status: 400 }
      )
    }

    const teacher = await db.teacher.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Guru tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update user info
    if (name || phone || photo_url) {
      await db.user.update({
        where: { id: teacher.user_id },
        data: {
          ...(name && { name }),
          ...(phone !== undefined && { phone }),
          ...(photo_url !== undefined && { photo_url }),
        },
      })
    }

    // Update teacher phone
    if (phone !== undefined) {
      await db.teacher.update({
        where: { id },
        data: { phone },
      })
    }

    // Update class assignments if provided
    if (class_ids && Array.isArray(class_ids)) {
      // Remove existing assignments
      await db.classTeacher.deleteMany({
        where: { teacher_id: id },
      })

      // Add new assignments
      if (class_ids.length > 0) {
        await db.classTeacher.createMany({
          data: class_ids.map((class_id: string) => ({
            class_id,
            teacher_id: id,
          })),
        })
      }
    }

    // Log activity
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'edit_wali_kelas',
      details: `Mengedit wali kelas: ${name || teacher.user.name}`,
    })

    const result = await db.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        class_teachers: {
          include: { class: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Update teacher error:', error)
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
        { error: 'ID guru harus diisi' },
        { status: 400 }
      )
    }

    const teacher = await db.teacher.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Guru tidak ditemukan' },
        { status: 404 }
      )
    }

    // Log activity before delete
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'hapus_wali_kelas',
      details: `Menghapus wali kelas: ${teacher.user.name}`,
    })

    // Delete teacher (cascade deletes class_teachers, and user)
    await db.teacher.delete({
      where: { id },
    })

    // Delete the associated user
    await db.user.delete({
      where: { id: teacher.user_id },
    })

    return NextResponse.json({
      success: true,
      message: 'Guru berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete teacher error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
