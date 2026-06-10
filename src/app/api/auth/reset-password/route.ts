import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email harus diisi' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, link reset password akan dikirim',
      })
    }

    // In production, send email with reset link
    // For demo, just reset password to default
    await db.user.update({
      where: { id: user.id },
      data: { password: 'reset123' },
    })

    return NextResponse.json({
      success: true,
      message: 'Password telah direset ke: reset123',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
