import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    const where: Record<string, unknown> = {}
    if (user_id) where.user_id = user_id

    const notifications = await db.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, data: notifications })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, mark_all, user_id } = body

    if (mark_all && user_id) {
      // Mark all notifications as read for a user
      await db.notification.updateMany({
        where: { user_id, is_read: false },
        data: { is_read: true },
      })

      return NextResponse.json({
        success: true,
        message: 'Semua notifikasi ditandai sudah dibaca',
      })
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID notifikasi harus diisi' },
        { status: 400 }
      )
    }

    const notification = await db.notification.update({
      where: { id },
      data: { is_read: true },
    })

    return NextResponse.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, title, message, type } = body

    if (!user_id || !title || !message) {
      return NextResponse.json(
        { error: 'User ID, judul, dan pesan harus diisi' },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        user_id,
        title,
        message,
        type: type || 'info',
      },
    })

    return NextResponse.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
