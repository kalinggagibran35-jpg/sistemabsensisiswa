import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const auth = requireAuth(request)
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error)
    }

    const { searchParams } = new URL(request.url)
    const class_id = searchParams.get('class_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const status = searchParams.get('status')
    const student_id = searchParams.get('student_id')
    const period = searchParams.get('period')
    const semester = searchParams.get('semester')
    const academic_year_id = searchParams.get('academic_year_id')

    // Build date range based on period/semester
    let effectiveStartDate = start_date
    let effectiveEndDate = end_date

    if (period === 'semester' && semester && academic_year_id) {
      const academicYear = await db.academicYear.findUnique({
        where: { id: academic_year_id },
      })
      if (academicYear) {
        const yearStr = academicYear.name.split('/')[0]
        const year = parseInt(yearStr)
        if (semester === '1') {
          effectiveStartDate = `${year}-07-01`
          effectiveEndDate = `${year}-12-31`
        } else {
          effectiveStartDate = `${year + 1}-01-01`
          effectiveEndDate = `${year + 1}-06-30`
        }
      }
    }

    const where: Record<string, unknown> = {}
    if (class_id) {
      where.student = { class_id }
    }
    if (student_id) {
      where.student_id = student_id
    }
    if (status) where.status = status
    if (effectiveStartDate && effectiveEndDate) {
      where.date = { gte: effectiveStartDate, lte: effectiveEndDate }
    } else if (effectiveStartDate) {
      where.date = { gte: effectiveStartDate }
    } else if (effectiveEndDate) {
      where.date = { lte: effectiveEndDate }
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { id: true, name: true, major: true } },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { check_in_time: 'asc' }],
    })

    // Build summary statistics
    const summary = {
      total: attendance.length,
      hadir: attendance.filter((a) => a.status === 'hadir').length,
      terlambat: attendance.filter((a) => a.status === 'terlambat').length,
      tidak_hadir: attendance.filter((a) => a.status === 'tidak_hadir').length,
      sakit: attendance.filter((a) => a.status === 'sakit').length,
      izin: attendance.filter((a) => a.status === 'izin').length,
    }

    // Per-student summary
    const studentMap = new Map<string, {
      student_id: string
      name: string
      class_name: string
      class_major: string
      total: number
      hadir: number
      terlambat: number
      tidak_hadir: number
      sakit: number
      izin: number
    }>()

    for (const a of attendance) {
      const existing = studentMap.get(a.student_id)
      if (!existing) {
        studentMap.set(a.student_id, {
          student_id: a.student_id,
          name: a.student.user.name,
          class_name: a.student.class.name,
          class_major: a.student.class.major,
          total: 1,
          hadir: a.status === 'hadir' ? 1 : 0,
          terlambat: a.status === 'terlambat' ? 1 : 0,
          tidak_hadir: a.status === 'tidak_hadir' ? 1 : 0,
          sakit: a.status === 'sakit' ? 1 : 0,
          izin: a.status === 'izin' ? 1 : 0,
        })
      } else {
        existing.total++
        if (a.status === 'hadir') existing.hadir++
        if (a.status === 'terlambat') existing.terlambat++
        if (a.status === 'tidak_hadir') existing.tidak_hadir++
        if (a.status === 'sakit') existing.sakit++
        if (a.status === 'izin') existing.izin++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        studentSummary: Array.from(studentMap.values()),
        records: attendance,
      },
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
