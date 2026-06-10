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

    const counselors = await db.counselor.findMany({
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
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ success: true, data: counselors })
  } catch (error) {
    console.error('Get counselors error:', error)
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
    const { email, password, name, phone, photo_url } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, dan nama harus diisi' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: {
        email,
        password,
        name,
        role: 'guru_bk',
        phone: phone || null,
        photo_url: photo_url || null,
      },
    })

    const counselor = await db.counselor.create({
      data: {
        user_id: user.id,
        phone: phone || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Log activity
    await logActivity({
      userId: user.id,
      userName: name,
      userRole: 'admin',
      activityType: 'tambah_guru_bk',
      details: `Menambah guru BK: ${name}`,
    })

    return NextResponse.json({
      success: true,
      data: counselor,
    })
  } catch (error) {
    console.error('Create counselor error:', error)
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
    const { id, name, phone, photo_url } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID guru BK harus diisi' },
        { status: 400 }
      )
    }

    const counselor = await db.counselor.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    })

    if (!counselor) {
      return NextResponse.json(
        { error: 'Guru BK tidak ditemukan' },
        { status: 404 }
      )
    }

    if (name || phone || photo_url) {
      await db.user.update({
        where: { id: counselor.user_id },
        data: {
          ...(name && { name }),
          ...(phone !== undefined && { phone }),
          ...(photo_url !== undefined && { photo_url }),
        },
      })
    }

    if (phone !== undefined) {
      await db.counselor.update({
        where: { id },
        data: { phone },
      })
    }

    // Log activity
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'edit_guru_bk',
      details: `Mengedit guru BK: ${name || counselor.user.name}`,
    })

    const result = await db.counselor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Update counselor error:', error)
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
        { error: 'ID guru BK harus diisi' },
        { status: 400 }
      )
    }

    const counselor = await db.counselor.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    })

    if (!counselor) {
      return NextResponse.json(
        { error: 'Guru BK tidak ditemukan' },
        { status: 404 }
      )
    }

    // Log activity before delete
    await logActivity({
      userName: 'Admin',
      userRole: 'admin',
      activityType: 'hapus_guru_bk',
      details: `Menghapus guru BK: ${counselor.user.name}`,
    })

    await db.counselor.delete({ where: { id } })
    await db.user.delete({ where: { id: counselor.user_id } })

    return NextResponse.json({
      success: true,
      message: 'Guru BK berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete counselor error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
