import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error)
    }
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const userId = searchParams.get('userId')
    const heatmapMonth = searchParams.get('heatmapMonth')
    const heatmapYear = searchParams.get('heatmapYear')

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const monthEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() + mondayOffset)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // Single query for holidays
    const holidays = await db.holiday.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      select: { date: true },
    })
    const holidayDates = new Set(holidays.map((h) => h.date))

    function countWorkingDays(startStr: string, endStr: string): number {
      const start = new Date(startStr)
      const end = new Date(endStr)
      let count = 0
      const current = new Date(start)
      while (current <= end) {
        const day = current.getDay()
        const dateStr = current.toISOString().split('T')[0]
        if (day !== 0 && day !== 6 && !holidayDates.has(dateStr)) count++
        current.setDate(current.getDate() + 1)
      }
      return count
    }

    const expectedWorkingDays = countWorkingDays(monthStart, monthEnd)
    const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

    if (role === 'admin') {
      // Batch all queries in parallel
      const [
        totalStudents,
        todayAttendance,
        monthAttendance,
        trend7DaysData,
        studentsWithAttendance,
        classes,
        checkedInList,
        allActiveStudents,
        pendingLeaveRequests,
        totalClasses,
        totalTeachers,
      ] = await Promise.all([
        db.student.count({ where: { status: 'active' } }),
        db.attendance.findMany({
          where: { date: todayStr },
          select: { status: true, student_id: true },
        }),
        db.attendance.findMany({
          where: { date: { gte: monthStart } },
          select: { date: true, status: true },
        }),
        db.attendance.findMany({
          where: { date: { gte: weekStartStr } },
          select: { date: true, status: true },
        }),
        db.student.findMany({
          where: { status: 'active' },
          include: {
            user: { select: { name: true } },
            class: { select: { name: true } },
            attendances: {
              where: { date: { gte: monthStart } },
              select: { date: true, status: true },
            },
          },
        }),
        db.class.findMany({
          include: {
            students: {
              where: { status: 'active' },
              include: {
                attendances: {
                  where: { date: { gte: monthStart } },
                  select: { date: true, status: true },
                },
              },
            },
          },
        }),
        db.attendance.findMany({
          where: { date: todayStr, status: { in: ['hadir', 'terlambat'] } },
          include: {
            student: {
              include: {
                user: { select: { name: true } },
                class: { select: { name: true } },
              },
            },
          },
          orderBy: { check_in_time: 'asc' },
        }),
        db.student.findMany({
          where: { status: 'active' },
          include: {
            user: { select: { name: true } },
            class: { select: { name: true } },
          },
        }),
        db.leaveRequest.count({ where: { status: 'pending' } }),
        db.class.count(),
        db.teacher.count(),
      ])

      const hadirToday = todayAttendance.filter((a) => a.status === 'hadir').length
      const terlambatToday = todayAttendance.filter((a) => a.status === 'terlambat').length
      const tidakHadirToday = todayAttendance.filter((a) => a.status === 'tidak_hadir').length
      const sakitToday = todayAttendance.filter((a) => a.status === 'sakit').length
      const izinToday = todayAttendance.filter((a) => a.status === 'izin').length
      const checkedInStudentIds = new Set(todayAttendance.map((a) => a.student_id))
      const absentCount = Math.max(0, totalStudents - checkedInStudentIds.size - tidakHadirToday - sakitToday - izinToday)

      const monthHadir = monthAttendance.filter((a) => a.status === 'hadir' && !holidayDates.has(a.date)).length
      const monthTerlambat = monthAttendance.filter((a) => a.status === 'terlambat' && !holidayDates.has(a.date)).length
      const monthTotal = monthAttendance.filter((a) => !holidayDates.has(a.date)).length
      const monthlyPercentage = monthTotal > 0 ? Math.round(((monthHadir + monthTerlambat) / monthTotal) * 100) : 0

      // Build trend from single query
      const trend7Days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dayAttendance = trend7DaysData.filter((a) => a.date === dateStr)
        const isHoliday = holidayDates.has(dateStr)
        trend7Days.push({
          name: dayLabels[d.getDay()],
          date: dateStr,
          Hadir: isHoliday ? 0 : dayAttendance.filter((a) => a.status === 'hadir').length,
          'Tidak Hadir': isHoliday ? 0 : dayAttendance.filter((a) => a.status === 'tidak_hadir').length,
          Terlambat: isHoliday ? 0 : dayAttendance.filter((a) => a.status === 'terlambat').length,
          isHoliday,
        })
      }

      const studentRankings = studentsWithAttendance
        .map((s) => {
          const validAttendances = s.attendances.filter((a) => !holidayDates.has(a.date))
          const hadir = validAttendances.filter((a) => a.status === 'hadir').length
          const terlambat = validAttendances.filter((a) => a.status === 'terlambat').length
          const tidakHadir = validAttendances.filter((a) => a.status === 'tidak_hadir').length
          const pct = expectedWorkingDays > 0 ? Math.round(((hadir + terlambat) / expectedWorkingDays) * 100) : 0
          return {
            id: s.id,
            name: s.user.name,
            className: s.class.name,
            present: hadir + terlambat,
            absent: tidakHadir,
            total: validAttendances.length,
            percentage: Math.min(pct, 100),
          }
        })
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 10)

      const classComparison = classes.map((c) => {
        const validAttendances = c.students.flatMap((s) => s.attendances.filter((a) => !holidayDates.has(a.date)))
        const totalAtt = validAttendances.length
        const hadirAtt = validAttendances.filter((a) => a.status === 'hadir').length
        const terlambatAtt = validAttendances.filter((a) => a.status === 'terlambat').length
        const pct = totalAtt > 0 ? Math.round(((hadirAtt + terlambatAtt) / totalAtt) * 100) : 0
        return { name: c.name, percentage: pct, totalStudents: c.students.length }
      })

      const checkedInIds = new Set(todayAttendance.map((a) => a.student_id))
      const notCheckedInList = allActiveStudents.filter((s) => !checkedInIds.has(s.id))

      let heatmapData: Array<{ date: string; percentage: number; isHoliday: boolean }> = []
      if (heatmapMonth && heatmapYear) {
        heatmapData = await buildHeatmapData(parseInt(heatmapYear), parseInt(heatmapMonth))
      } else {
        heatmapData = await buildHeatmapData(today.getFullYear(), today.getMonth() + 1)
      }

      return NextResponse.json({
        success: true,
        data: {
          role: 'admin',
          totalStudents,
          totalClasses,
          totalTeachers,
          presentToday: hadirToday,
          lateToday: terlambatToday,
          absentToday: absentCount,
          sickToday: sakitToday,
          permissionToday: izinToday,
          tidakHadirToday,
          attendancePercentage: monthlyPercentage,
          expectedWorkingDays,
          pendingLeaveRequests,
          trend7Days,
          distribution: { hadir: hadirToday, tidak_hadir: tidakHadirToday, terlambat: terlambatToday, izin: izinToday, sakit: sakitToday },
          studentRankings,
          classComparison,
          checkedInList: checkedInList.map((a) => ({
            id: a.id,
            student_id: a.student_id,
            status: a.status,
            check_in_time: a.check_in_time,
            student: {
              id: a.student.id,
              nis: a.student.nis,
              user: { name: a.student.user.name },
              class: { name: a.student.class.name },
            },
          })),
          notCheckedInList: notCheckedInList.map((s) => ({ id: s.id, name: s.user.name, className: s.class.name })),
          heatmapData,
        },
      })
    }

    if (role === 'wali_kelas' && userId) {
      const teacher = await db.teacher.findFirst({
        where: { user_id: userId },
        include: { class_teachers: { include: { class: true } } },
      })

      if (!teacher) {
        return NextResponse.json({
          success: true,
          data: { role: 'wali_kelas', totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0, attendancePercentage: 0, pendingLeaveRequests: 0, classes: [], trend7Days: [], classStats: [] },
        })
      }

      const classIds = teacher.class_teachers.map((ct) => ct.class_id)

      const [totalStudents, todayAttendance, monthAttendance, trend7DaysData, pendingLeaveRequests] = await Promise.all([
        db.student.count({ where: { class_id: { in: classIds }, status: 'active' } }),
        db.attendance.findMany({
          where: { date: todayStr, student: { class_id: { in: classIds } } },
          select: { status: true, student_id: true },
        }),
        db.attendance.findMany({
          where: { date: { gte: monthStart }, student: { class_id: { in: classIds } } },
          select: { date: true, status: true },
        }),
        db.attendance.findMany({
          where: { date: { gte: weekStartStr }, student: { class_id: { in: classIds } } },
          select: { date: true, status: true },
        }),
        db.leaveRequest.count({ where: { status: 'pending', student: { class_id: { in: classIds } } } }),
      ])

      const hadirToday = todayAttendance.filter((a) => a.status === 'hadir').length
      const terlambatToday = todayAttendance.filter((a) => a.status === 'terlambat').length
      const tidakHadirToday = todayAttendance.filter((a) => a.status === 'tidak_hadir').length
      const sakitToday = todayAttendance.filter((a) => a.status === 'sakit').length
      const izinToday = todayAttendance.filter((a) => a.status === 'izin').length
      const checkedInStudentIds = new Set(todayAttendance.map((a) => a.student_id))
      const absentCount = Math.max(0, totalStudents - checkedInStudentIds.size - tidakHadirToday - sakitToday - izinToday)

      const monthHadir = monthAttendance.filter((a) => a.status === 'hadir' && !holidayDates.has(a.date)).length
      const monthTerlambat = monthAttendance.filter((a) => a.status === 'terlambat' && !holidayDates.has(a.date)).length
      const monthTotal = monthAttendance.filter((a) => !holidayDates.has(a.date)).length
      const monthlyPercentage = monthTotal > 0 ? Math.round(((monthHadir + monthTerlambat) / monthTotal) * 100) : 0

      const trend7Days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dayAttendance = trend7DaysData.filter((a) => a.date === dateStr)
        const isHoliday = holidayDates.has(dateStr)
        trend7Days.push({
          name: dayLabels[d.getDay()],
          date: dateStr,
          Hadir: isHoliday ? 0 : dayAttendance.filter((a) => a.status === 'hadir').length,
          'Tidak Hadir': isHoliday ? 0 : dayAttendance.filter((a) => a.status === 'tidak_hadir').length,
          Terlambat: isHoliday ? 0 : dayAttendance.filter((a) => a.status === 'terlambat').length,
          isHoliday,
        })
      }

      const classStats = await Promise.all(
        teacher.class_teachers.map(async (ct) => {
          const classStudents = await db.student.findMany({
            where: { class_id: ct.class_id, status: 'active' },
            include: {
              user: { select: { name: true } },
              attendances: { where: { date: todayStr }, select: { status: true } },
            },
          })
          const presentCount = classStudents.filter((s) => s.attendances.some((a) => a.status === 'hadir')).length
          const lateCount = classStudents.filter((s) => s.attendances.some((a) => a.status === 'terlambat')).length
          const absentStudents = classStudents
            .filter((s) => s.attendances.length === 0 || s.attendances.some((a) => a.status === 'tidak_hadir'))
            .map((s) => ({ id: s.id, name: s.user.name }))
          return {
            id: ct.class.id,
            name: ct.class.name,
            studentCount: classStudents.length,
            presentToday: presentCount,
            absentToday: absentStudents.length,
            lateToday: lateCount,
            absentStudents,
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: {
          role: 'wali_kelas',
          totalStudents,
          presentToday: hadirToday,
          absentToday: absentCount,
          lateToday: terlambatToday,
          attendancePercentage: monthlyPercentage,
          expectedWorkingDays,
          pendingLeaveRequests,
          classes: teacher.class_teachers.map((ct) => ({ id: ct.class.id, name: ct.class.name, major: ct.class.major })),
          trend7Days,
          classStats,
        },
      })
    }

    if (role === 'guru_bk') {
      const [totalStudents, todayAttendance, classes, weekAttendance, trend7DaysData] = await Promise.all([
        db.student.count({ where: { status: 'active' } }),
        db.attendance.findMany({ where: { date: todayStr }, select: { status: true } }),
        db.class.findMany({
          include: {
            students: {
              where: { status: 'active' },
              include: { attendances: { where: { date: todayStr }, select: { status: true } } },
            },
          },
        }),
        db.attendance.findMany({
          where: { date: { gte: weekStartStr }, status: 'tidak_hadir' },
          include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
        }),
        db.attendance.findMany({
          where: { date: { gte: weekStartStr } },
          select: { date: true, status: true },
        }),
      ])

      const hadirToday = todayAttendance.filter((a) => a.status === 'hadir').length
      const terlambatToday = todayAttendance.filter((a) => a.status === 'terlambat').length
      const tidakHadirToday = todayAttendance.filter((a) => a.status === 'tidak_hadir').length
      const attendancePercentage = totalStudents > 0 ? Math.round(((hadirToday + terlambatToday) / totalStudents) * 100) : 0

      const classOverview = classes.map((c) => {
        const present = c.students.filter((s) => s.attendances.some((a) => a.status === 'hadir')).length
        const late = c.students.filter((s) => s.attendances.some((a) => a.status === 'terlambat')).length
        const absent = c.students.length - present - late
        const pct = c.students.length > 0 ? Math.round(((present + late) / c.students.length) * 100) : 0
        return { id: c.id, name: c.name, studentCount: c.students.length, presentToday: present, absentToday: absent, lateToday: late, attendancePct: pct }
      })

      const validWeekAttendance = weekAttendance.filter((a) => !holidayDates.has(a.date))
      const absenceCounts: Record<string, { id: string; name: string; className: string; count: number }> = {}
      validWeekAttendance.forEach((a) => {
        const sid = a.student_id
        if (!absenceCounts[sid]) {
          absenceCounts[sid] = { id: sid, name: a.student.user.name, className: a.student.class.name, count: 0 }
        }
        absenceCounts[sid].count++
      })
      const violationStudents = Object.values(absenceCounts).filter((s) => s.count >= 3).sort((a, b) => b.count - a.count)

      const trend7Days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dayAttendance = trend7DaysData.filter((a) => a.date === dateStr)
        const isHoliday = holidayDates.has(dateStr)
        trend7Days.push({
          name: dayLabels[d.getDay()],
          date: dateStr,
          Hadir: isHoliday ? 0 : dayAttendance.filter((a) => a.status === 'hadir').length,
          'Tidak Hadir': isHoliday ? 0 : dayAttendance.filter((a) => a.status === 'tidak_hadir').length,
          Terlambat: isHoliday ? 0 : dayAttendance.filter((a) => a.status === 'terlambat').length,
          isHoliday,
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          role: 'guru_bk',
          totalStudents,
          presentToday: hadirToday,
          absentToday: tidakHadirToday,
          lateToday: terlambatToday,
          attendancePercentage,
          violationCount: violationStudents.length,
          violationStudents,
          classOverview,
          trend7Days,
        },
      })
    }

    if (role === 'siswa' && userId) {
      const student = await db.student.findFirst({ where: { user_id: userId } })

      if (!student) {
        return NextResponse.json({
          success: true,
          data: { role: 'siswa', totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, sickDays: 0, permissionDays: 0, attendancePercentage: 0, todayStatus: 'belum_absen', todayCheckIn: null, todayCheckOut: null, monthlyStats: { hadir: 0, tidak_hadir: 0, terlambat: 0, izin: 0, sakit: 0 }, recentRecords: [] },
        })
      }

      const [monthAttendance, todayRecord, allAttendance] = await Promise.all([
        db.attendance.findMany({ where: { student_id: student.id, date: { gte: monthStart } }, orderBy: { date: 'desc' } }),
        db.attendance.findFirst({ where: { student_id: student.id, date: todayStr } }),
        db.attendance.findMany({ where: { student_id: student.id }, select: { status: true } }),
      ])

      const validMonthAttendance = monthAttendance.filter((a) => !holidayDates.has(a.date))
      const monthlyStats = {
        hadir: validMonthAttendance.filter((a) => a.status === 'hadir').length,
        tidak_hadir: validMonthAttendance.filter((a) => a.status === 'tidak_hadir').length,
        terlambat: validMonthAttendance.filter((a) => a.status === 'terlambat').length,
        izin: validMonthAttendance.filter((a) => a.status === 'izin').length,
        sakit: validMonthAttendance.filter((a) => a.status === 'sakit').length,
      }

      const monthHadir = monthlyStats.hadir + monthlyStats.terlambat
      const attendancePercentage = expectedWorkingDays > 0 ? Math.round((monthHadir / expectedWorkingDays) * 100) : 0

      return NextResponse.json({
        success: true,
        data: {
          role: 'siswa',
          totalDays: allAttendance.length,
          presentDays: allAttendance.filter((a) => a.status === 'hadir').length,
          absentDays: allAttendance.filter((a) => a.status === 'tidak_hadir').length,
          lateDays: allAttendance.filter((a) => a.status === 'terlambat').length,
          sickDays: allAttendance.filter((a) => a.status === 'sakit').length,
          permissionDays: allAttendance.filter((a) => a.status === 'izin').length,
          attendancePercentage: Math.min(attendancePercentage, 100),
          expectedWorkingDays,
          todayStatus: todayRecord?.status || 'belum_absen',
          todayCheckIn: todayRecord?.check_in_time || null,
          todayCheckOut: todayRecord?.check_out_time || null,
          monthlyStats,
          recentRecords: validMonthAttendance.slice(0, 10).map((a) => ({ id: a.id, date: a.date, check_in_time: a.check_in_time, check_out_time: a.check_out_time, status: a.status })),
        },
      })
    }

    return NextResponse.json({ error: 'Parameter tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function buildHeatmapData(year: number, month: number): Promise<Array<{ date: string; percentage: number; isHoliday: boolean }>> {
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const startDate = `${monthStr}-01`
  const endDate = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`

  const [attendance, holidays, totalStudents] = await Promise.all([
    db.attendance.findMany({ where: { date: { gte: startDate, lte: endDate } }, select: { date: true, status: true } }),
    db.holiday.findMany({ where: { date: { gte: startDate, lte: endDate } }, select: { date: true } }),
    db.student.count({ where: { status: 'active' } }),
  ])

  const holidayDates = new Set(holidays.map((h) => h.date))
  const result: Array<{ date: string; percentage: number; isHoliday: boolean }> = []

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`
    const dayOfWeek = new Date(year, month - 1, day).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = holidayDates.has(dateStr) || isWeekend
    const dayAttendance = attendance.filter((a) => a.date === dateStr)
    const hadir = dayAttendance.filter((a) => a.status === 'hadir').length
    const terlambat = dayAttendance.filter((a) => a.status === 'terlambat').length
    const percentage = totalStudents > 0 && !isHoliday ? Math.round(((hadir + terlambat) / totalStudents) * 100) : 0
    result.push({ date: dateStr, percentage: isHoliday ? 0 : percentage, isHoliday })
  }

  return result
}
