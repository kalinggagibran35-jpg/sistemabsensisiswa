import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { requireAuth, requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error)
    }
    const { searchParams } = new URL(request.url)
    const academic_year_id = searchParams.get('academic_year_id')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (academic_year_id) where.academic_year_id = academic_year_id
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { major: { contains: search } },
      ]
    }

    const classes = await db.class.findMany({
      where,
      include: {
        academic_year: true,
        students: {
          where: { status: 'active' },
          select: { id: true },
        },
        class_teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const data = classes.map((c) => ({
      id: c.id,
      name: c.name,
      major: c.major,
      academic_year_id: c.academic_year_id,
      academic_year: c.academic_year,
      student_count: c.students.length,
      teachers: c.class_teachers.map((ct) => ({
        id: ct.teacher.id,
        name: ct.teacher.user.name,
        email: ct.teacher.user.email,
      })),
      created_at: c.created_at,
      updated_at: c.updated_at,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Get classes error:', error)
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
    const { name, major, academic_year_id, teacher_ids } = body

    if (!name || !major || !academic_year_id) {
      return NextResponse.json(
        { error: 'Nama, jurusan, dan tahun ajaran harus diisi' },
        { status: 400 }
      )
    }

    const cls = await db.class.create({
      data: {
        name,
        major,
        academic_year_id,
      },
    })

    // Assign teachers if provided
    if (teacher_ids && Array.isArray(teacher_ids) && teacher_ids.length > 0) {
      await db.classTeacher.createMany({
        data: teacher_ids.map((teacher_id: string) => ({
          class_id: cls.id,
          teacher_id,
        })),
      })
    }

    const result = await db.class.findUnique({
      where: { id: cls.id },
      include: {
        academic_year: true,
        class_teachers: {
          include: {
            teacher: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    // Log activity
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'tambah_kelas',
      details: `Menambah kelas: ${name}`,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Create class error:', error)
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
    const { id, name, major, academic_year_id, teacher_ids } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID kelas harus diisi' },
        { status: 400 }
      )
    }

    const existing = await db.class.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (major) updateData.major = major
    if (academic_year_id) updateData.academic_year_id = academic_year_id

    await db.class.update({
      where: { id },
      data: updateData,
    })

    // Update teacher assignments if provided
    if (teacher_ids && Array.isArray(teacher_ids)) {
      await db.classTeacher.deleteMany({
        where: { class_id: id },
      })
      if (teacher_ids.length > 0) {
        await db.classTeacher.createMany({
          data: teacher_ids.map((teacher_id: string) => ({
            class_id: id,
            teacher_id,
          })),
        })
      }
    }

    // Log activity
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'edit_kelas',
      details: `Mengedit kelas: ${name || existing.name}`,
    })

    const result = await db.class.findUnique({
      where: { id },
      include: {
        academic_year: true,
        students: { where: { status: 'active' }, select: { id: true } },
        class_teachers: {
          include: {
            teacher: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: result ? {
        ...result,
        student_count: result.students.length,
        teachers: result.class_teachers.map((ct) => ({
          id: ct.teacher.id,
          name: ct.teacher.user.name,
          email: ct.teacher.user.email,
        })),
      } : null,
    })
  } catch (error) {
    console.error('Update class error:', error)
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
        { error: 'ID kelas harus diisi' },
        { status: 400 }
      )
    }

    const existing = await db.class.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      )
    }

    // Log activity before delete
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'hapus_kelas',
      details: `Menghapus kelas: ${existing.name}`,
    })

    await db.class.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete class error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
