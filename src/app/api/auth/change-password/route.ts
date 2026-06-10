import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, oldPassword, newPassword } = body

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.password !== oldPassword) {
      return NextResponse.json(
        { error: 'Password lama salah' },
        { status: 401 }
      )
    }

    await db.user.update({
      where: { id: userId },
      data: { password: newPassword },
    })

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
