import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { checkLoginRateLimit, recordFailedLogin, clearLoginAttempts, sanitizeInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      )
    }

    // Sanitize email
    email = sanitizeInput(email)

    // Check rate limiting
    const rateLimit = checkLoginRateLimit(email)
    if (!rateLimit.allowed) {
      const retryMinutes = Math.ceil(rateLimit.retryAfterMs / 60000)
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login. Coba lagi dalam ${retryMinutes} menit.` },
        { status: 429 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        student: {
          include: { class: true },
        },
        teacher: {
          include: {
            class_teachers: {
              include: { class: true },
            },
          },
        },
        counselor: true,
      },
    })

    if (!user || user.password !== password) {
      // Record failed login attempt
      recordFailedLogin(email)
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Clear login attempts on success
    clearLoginAttempts(email)

    // Log login activity
    await logActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      activityType: 'login',
      details: `Login berhasil`,
    })

    // Build role-specific response
    const userData: Record<string, unknown> = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      photo_url: user.photo_url,
      phone: user.phone,
    }

    if (user.role === 'siswa' && user.student) {
      userData.studentId = user.student.id
      userData.classId = user.student.class_id
      userData.nis = user.student.nis
    }

    if (user.role === 'wali_kelas' && user.teacher) {
      userData.teacherId = user.teacher.id
      const firstClass = user.teacher.class_teachers[0]
      if (firstClass) {
        userData.classId = firstClass.class_id
      }
    }

    if (user.role === 'guru_bk' && user.counselor) {
      userData.counselorId = user.counselor.id
    }

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
