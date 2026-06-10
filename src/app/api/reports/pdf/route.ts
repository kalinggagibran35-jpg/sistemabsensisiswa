import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth'
import { generateAttendanceReportPDF } from '@/lib/pdf-generator'

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
    const totalHadir = attendance.filter((a) => a.status === 'hadir').length
    const totalTidakHadir = attendance.filter((a) => a.status === 'tidak_hadir').length
    const totalTerlambat = attendance.filter((a) => a.status === 'terlambat').length
    const totalIzin = attendance.filter((a) => a.status === 'izin').length
    const totalSakit = attendance.filter((a) => a.status === 'sakit').length
    const total = attendance.length
    const persentaseKehadiran = total > 0 ? ((totalHadir + totalTerlambat) / total) * 100 : 0

    // Per-student summary
    const studentMap = new Map<string, {
      student_id: string
      name: string
      nis: string
      class_name: string
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
          nis: a.student.nis,
          class_name: a.student.class.name,
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

    // Get school name from settings
    const schoolSetting = await db.settings.findUnique({
      where: { key: 'school_name' },
    })
    const schoolName = schoolSetting?.value || 'Sekolah'

    // Get class name if filtered
    let className: string | undefined
    if (class_id) {
      const cls = await db.class.findUnique({ where: { id: class_id } })
      className = cls?.name
    }

    // Generate PDF
    const doc = generateAttendanceReportPDF({
      schoolName,
      reportTitle: 'Laporan Absensi Siswa',
      dateRange: `${effectiveStartDate || 'N/A'} s/d ${effectiveEndDate || 'N/A'}`,
      className,
      summaryStats: {
        totalHadir,
        totalTidakHadir,
        totalTerlambat,
        totalIzin,
        totalSakit,
        persentaseKehadiran,
      },
      students: Array.from(studentMap.values()).map((s) => ({
        nama: s.name,
        nis: s.nis,
        kelas: s.class_name,
        hadir: s.hadir,
        tidakHadir: s.tidak_hadir,
        terlambat: s.terlambat,
        izin: s.izin,
        sakit: s.sakit,
        persentase: s.total > 0 ? ((s.hadir + s.terlambat) / s.total) * 100 : 0,
      })),
    })

    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan-absensi-${effectiveStartDate || 'report'}-${effectiveEndDate || 'report'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF report error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
