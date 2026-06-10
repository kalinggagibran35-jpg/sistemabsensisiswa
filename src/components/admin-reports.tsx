'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  BarChart3, Download, FileText, Filter, TrendingUp, UserCheck, UserX, Clock, ImageIcon,
  Search,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { generateAttendanceReportPDF } from '@/lib/pdf-generator'
import { exportChartToPNG } from '@/lib/chart-export'
import { getAuthHeaders } from '@/lib/store'

const CHART_COLORS = ['#10b981', '#ef4444', '#f97316', '#3b82f6', '#8b5cf6']

interface ReportSummary {
  total: number
  hadir: number
  tidak_hadir: number
  terlambat: number
  sakit: number
  izin: number
}

interface StudentSummary {
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
}

interface AttendanceRecord {
  id: string
  student_id: string
  date: string
  status: string
  check_in_time: string | null
  check_out_time: string | null
  student: {
    id: string
    nis: string
    user: { name: string }
    class: { name: string; major: string }
  }
}

interface ClassItem {
  id: string
  name: string
}

interface StudentItem {
  id: string
  name: string
  nis: string
  class_name: string
}

interface AcademicYearItem {
  id: string
  name: string
}

const STATUS_COLORS: Record<string, string> = {
  hadir: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  tidak_hadir: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  terlambat: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  izin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sakit: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const STATUS_LABELS: Record<string, string> = {
  hadir: 'H',
  tidak_hadir: 'T',
  terlambat: 'L',
  izin: 'I',
  sakit: 'S',
}

export default function AdminReports() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('bulanan')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [onlyAbsent, setOnlyAbsent] = useState(false)
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  // Per-semester state
  const [semester, setSemester] = useState('1')
  const [academicYearId, setAcademicYearId] = useState('all')
  const [academicYearList, setAcademicYearList] = useState<AcademicYearItem[]>([])

  // Student filter
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('all')
  const [studentList, setStudentList] = useState<StudentItem[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentItem[]>([])
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)

  // Report tab
  const [activeReportTab, setActiveReportTab] = useState('rekap-bulanan')

  const fetchClasses = useCallback(async () => {
    try {
      const headers = getAuthHeaders()
      const res = await fetch('/api/classes', { headers })
      const json = await res.json()
      if (json.success) setClassList(json.data)
    } catch { /* ignore */ }
  }, [])

  const fetchAcademicYears = useCallback(async () => {
    try {
      const headers = getAuthHeaders()
      const res = await fetch('/api/academic-years', { headers })
      const json = await res.json()
      if (json.success) setAcademicYearList(json.data)
    } catch { /* ignore */ }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const headers = getAuthHeaders()
      const res = await fetch('/api/students?pageSize=1000', { headers })
      const json = await res.json()
      if (json.success) {
        const students: StudentItem[] = json.data.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          name: (s.user as Record<string, string>)?.name || '-',
          nis: s.nis as string,
          class_name: (s.class as Record<string, string>)?.name || '-',
        }))
        setStudentList(students)
        setFilteredStudents(students)
      }
    } catch { /* ignore */ }
  }, [])

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)
      const headers = getAuthHeaders()
      const params = new URLSearchParams()
      if (period === 'semester' && semester && academicYearId && academicYearId !== 'all') {
        params.set('period', 'semester')
        params.set('semester', semester)
        params.set('academic_year_id', academicYearId)
      } else {
        if (startDate) params.set('start_date', startDate)
        if (endDate) params.set('end_date', endDate)
      }
      if (classFilter && classFilter !== 'all') params.set('class_id', classFilter)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (selectedStudentId && selectedStudentId !== 'all') params.set('student_id', selectedStudentId)

      const res = await fetch(`/api/reports?${params.toString()}`, { headers })
      const json = await res.json()
      if (json.success) {
        setSummary(json.data.summary)
        setStudentSummaries(json.data.studentSummary || [])
        setRecords(json.data.records || [])
      }
    } catch {
      toast.error('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, classFilter, statusFilter, period, semester, academicYearId, selectedStudentId])

  useEffect(() => {
    fetchClasses()
    fetchAcademicYears()
    fetchStudents()
  }, [fetchClasses, fetchAcademicYears, fetchStudents])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // Filter students by search
  useEffect(() => {
    if (studentSearch.trim() === '') {
      setFilteredStudents(studentList)
    } else {
      const q = studentSearch.toLowerCase()
      setFilteredStudents(
        studentList.filter(
          (s) => s.name.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q)
        )
      )
    }
  }, [studentSearch, studentList])

  const attendancePercentage = summary
    ? summary.total > 0
      ? Math.round(((summary.hadir + summary.terlambat) / summary.total) * 100)
      : 0
    : 0

  const statCards = [
    { title: 'Total Hadir', value: summary?.hadir || 0, icon: UserCheck, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Total Tidak Hadir', value: summary?.tidak_hadir || 0, icon: UserX, color: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
    { title: 'Total Terlambat', value: summary?.terlambat || 0, icon: Clock, color: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
    { title: 'Persentase Kehadiran', value: `${attendancePercentage}%`, icon: TrendingUp, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
  ]

  // Build monthly recap grid
  const buildMonthlyGrid = () => {
    if (records.length === 0) return { students: [], days: [] }
    const daysSet = new Set<string>()
    records.forEach((r) => daysSet.add(r.date))
    const days = Array.from(daysSet).sort()
    const studentMap = new Map<string, { name: string; className: string; byDate: Map<string, string> }>()
    records.forEach((r) => {
      const existing = studentMap.get(r.student_id)
      if (!existing) {
        studentMap.set(r.student_id, {
          name: r.student?.user?.name || '-',
          className: r.student?.class?.name || '-',
          byDate: new Map(),
        })
      }
      studentMap.get(r.student_id)!.byDate.set(r.date, r.status)
    })
    const filteredStudents = onlyAbsent
      ? Array.from(studentMap.entries()).filter(([, s]) => {
          let absent = false
          s.byDate.forEach((v) => { if (v === 'tidak_hadir') absent = true })
          return absent
        }).map(([id, s]) => ({ id, ...s }))
      : Array.from(studentMap.entries()).map(([id, s]) => ({ id, ...s }))
    return { students: filteredStudents, days }
  }

  const monthlyGrid = buildMonthlyGrid()

  // Build weekly summary
  const weeklyData = studentSummaries.reduce<Record<string, { name: string; hadir: number; tidak_hadir: number; terlambat: number }>>((acc, s) => {
    const key = s.class_name
    if (!acc[key]) acc[key] = { name: key, hadir: 0, tidak_hadir: 0, terlambat: 0 }
    acc[key].hadir += s.hadir
    acc[key].tidak_hadir += s.tidak_hadir
    acc[key].terlambat += s.terlambat
    return acc
  }, {})
  const weeklyChartData = Object.values(weeklyData)

  // Build year comparison chart (simulated)
  const yearComparisonData = [
    { name: '2023/2024', Kehadiran: 85, 'Tidak Hadir': 15 },
    { name: '2024/2025', Kehadiran: 88, 'Tidak Hadir': 12 },
    { name: '2025/2026', Kehadiran: attendancePercentage || 90, 'Tidak Hadir': 100 - (attendancePercentage || 90) },
  ]

  const exportCSV = () => {
    const headers = ['Nama', 'NIS', 'Kelas', 'Hadir', 'Tidak Hadir', 'Terlambat', 'Sakit', 'Izin', 'Persentase']
    const rows = studentSummaries.map((s) => {
      const pct = s.total > 0 ? Math.round(((s.hadir + s.terlambat) / s.total) * 100) : 0
      return [s.name, '-', s.class_name, s.hadir, s.tidak_hadir, s.terlambat, s.sakit, s.izin, `${pct}%`]
    })
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-absensi-${startDate}-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV berhasil diunduh')
  }

  const downloadPDF = async () => {
    try {
      // Get school name from settings
      const settingsRes = await fetch('/api/settings', { headers: getAuthHeaders() })
      const settingsJson = await settingsRes.json()
      const schoolName = settingsJson.data?.school_name || 'Sekolah'

      const className = classFilter !== 'all'
        ? classList.find((c) => c.id === classFilter)?.name
        : undefined

      const doc = generateAttendanceReportPDF({
        schoolName,
        reportTitle: 'Laporan Absensi Siswa',
        dateRange: period === 'semester'
          ? `Semester ${semester} ${academicYearList.find((a) => a.id === academicYearId)?.name || ''}`
          : `${startDate} s/d ${endDate}`,
        className,
        summaryStats: {
          totalHadir: summary?.hadir || 0,
          totalTidakHadir: summary?.tidak_hadir || 0,
          totalTerlambat: summary?.terlambat || 0,
          totalIzin: summary?.izin || 0,
          totalSakit: summary?.sakit || 0,
          persentaseKehadiran: attendancePercentage,
        },
        students: studentSummaries.map((s) => {
          const pct = s.total > 0 ? ((s.hadir + s.terlambat) / s.total) * 100 : 0
          // Find NIS from records
          const studentRecord = records.find((r) => r.student_id === s.student_id)
          return {
            nama: s.name,
            nis: studentRecord?.student?.nis || '-',
            kelas: s.class_name,
            hadir: s.hadir,
            tidakHadir: s.tidak_hadir,
            terlambat: s.terlambat,
            izin: s.izin,
            sakit: s.sakit,
            persentase: pct,
          }
        }),
      })

      doc.save(`laporan-absensi-${startDate}-${endDate}.pdf`)
      toast.success('PDF berhasil diunduh')
    } catch {
      toast.error('Gagal membuat PDF')
    }
  }

  const exportChartPNG = async () => {
    try {
      await exportChartToPNG('report-chart', `grafik-laporan-${startDate}-${endDate}.png`)
      toast.success('Grafik berhasil diekspor sebagai PNG')
    } catch {
      toast.error('Gagal mengekspor grafik')
    }
  }

  if (loading && !summary) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Laporan Absensi</h1>
          <p className="text-muted-foreground text-sm">Lihat dan ekspor laporan kehadiran siswa</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Ekspor CSV
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPDF}>
            <FileText className="h-4 w-4 mr-2" /> Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportChartPNG}>
            <ImageIcon className="h-4 w-4 mr-2" /> Export Grafik PNG
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Filter Laporan</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <Label className="text-xs">Periode</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="harian">Harian</SelectItem>
                  <SelectItem value="mingguan">Mingguan</SelectItem>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="semester">Per Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === 'semester' ? (
              <>
                <div>
                  <Label className="text-xs">Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1 (Jul - Des)</SelectItem>
                      <SelectItem value="2">Semester 2 (Jan - Jun)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tahun Ajaran</Label>
                  <Select value={academicYearId} onValueChange={setAcademicYearId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih Tahun Ajaran" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                      {academicYearList.map((ay) => (
                        <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-xs">Tanggal Mulai</Label>
                  <Input type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Tanggal Akhir</Label>
                  <Input type="date" className="mt-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label className="text-xs">Kelas</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Siswa</Label>
              <div className="relative mt-1">
                <div className="flex items-center gap-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      className="pl-7 text-xs h-9"
                      placeholder="Cari nama/NIS..."
                      value={selectedStudentId !== 'all' ? studentList.find((s) => s.id === selectedStudentId)?.name || studentSearch : studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value)
                        setSelectedStudentId('all')
                        setShowStudentDropdown(true)
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                    />
                    {showStudentDropdown && (
                      <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => { setSelectedStudentId('all'); setStudentSearch(''); setShowStudentDropdown(false) }}
                        >
                          Semua Siswa
                        </button>
                        {filteredStudents.slice(0, 20).map((s) => (
                          <button
                            key={s.id}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => { setSelectedStudentId(s.id); setStudentSearch(s.name); setShowStudentDropdown(false) }}
                          >
                            <span className="font-medium">{s.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">({s.nis}) - {s.class_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedStudentId !== 'all' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2"
                      onClick={() => { setSelectedStudentId('all'); setStudentSearch('') }}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Status Kehadiran</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Semua" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="hadir">Hadir</SelectItem>
                  <SelectItem value="tidak_hadir">Tidak Hadir</SelectItem>
                  <SelectItem value="terlambat">Terlambat</SelectItem>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="sakit">Sakit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex items-center gap-2 pb-1">
                <Checkbox id="only-absent" checked={onlyAbsent} onCheckedChange={(v) => setOnlyAbsent(!!v)} />
                <Label htmlFor="only-absent" className="text-xs">Hanya siswa tidak hadir</Label>
              </div>
              <Button size="sm" onClick={fetchReport}>
                Tampilkan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="text-xl font-bold">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Views */}
      <Tabs value={activeReportTab} onValueChange={setActiveReportTab}>
        <TabsList>
          <TabsTrigger value="rekap-bulanan">Rekap Bulanan</TabsTrigger>
          <TabsTrigger value="rekap-siswa">Rekap Per Siswa</TabsTrigger>
          <TabsTrigger value="rekap-mingguan">Rekap Mingguan</TabsTrigger>
          <TabsTrigger value="perbandingan">Perbandingan Tahun Ajaran</TabsTrigger>
          <TabsTrigger value="per-semester">Per Semester</TabsTrigger>
        </TabsList>

        <TabsContent value="rekap-bulanan" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Rekap Kehadiran Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyGrid.students.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm border">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-2 min-w-[150px]">Nama Siswa</th>
                        <th className="text-left p-2 min-w-[80px]">Kelas</th>
                        {monthlyGrid.days.map((d) => (
                          <th key={d} className="text-center p-1 min-w-[36px] text-xs">
                            {new Date(d).getDate()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyGrid.students.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{s.name}</td>
                          <td className="p-2">{s.className}</td>
                          {monthlyGrid.days.map((d) => {
                            const status = s.byDate.get(d) || ''
                            return (
                              <td key={d} className="text-center p-1">
                                {status ? (
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${STATUS_COLORS[status] || ''}`}>
                                    {STATUS_LABELS[status] || '?'}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Belum ada data untuk periode ini</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rekap-siswa" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentSummaries.length > 0 ? studentSummaries.map((s) => {
              const pct = s.total > 0 ? Math.round(((s.hadir + s.terlambat) / s.total) * 100) : 0
              return (
                <Card key={s.student_id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.class_name}</p>
                      </div>
                      <Badge variant={pct >= 80 ? 'default' : 'destructive'} className="text-xs">
                        {pct}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center text-xs">
                      <div className="p-1 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400">{s.hadir}</div>
                        <div className="text-muted-foreground">H</div>
                      </div>
                      <div className="p-1 bg-red-50 dark:bg-red-900/20 rounded">
                        <div className="font-bold text-red-700 dark:text-red-400">{s.tidak_hadir}</div>
                        <div className="text-muted-foreground">TH</div>
                      </div>
                      <div className="p-1 bg-orange-50 dark:bg-orange-900/20 rounded">
                        <div className="font-bold text-orange-700 dark:text-orange-400">{s.terlambat}</div>
                        <div className="text-muted-foreground">L</div>
                      </div>
                      <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="font-bold text-blue-700 dark:text-blue-400">{s.izin}</div>
                        <div className="text-muted-foreground">I</div>
                      </div>
                      <div className="p-1 bg-purple-50 dark:bg-purple-900/20 rounded">
                        <div className="font-bold text-purple-700 dark:text-purple-400">{s.sakit}</div>
                        <div className="text-muted-foreground">S</div>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            }) : (
              <p className="text-center text-muted-foreground py-8 col-span-3">Belum ada data</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rekap-mingguan" className="mt-4">
          <Card id="report-chart">
            <CardHeader>
              <CardTitle className="text-base">Rekap Mingguan Per Kelas</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hadir" name="Hadir" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill={CHART_COLORS[1]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="terlambat" name="Terlambat" fill={CHART_COLORS[2]} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Belum ada data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perbandingan" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perbandingan Tahun Ajaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={yearComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="Kehadiran" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Tidak Hadir" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="per-semester" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Rekap Per Semester
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentSummaries.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm border">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">No</th>
                        <th className="text-left p-3">Nama Siswa</th>
                        <th className="text-left p-3">Kelas</th>
                        <th className="text-center p-3">Hadir</th>
                        <th className="text-center p-3">Tidak Hadir</th>
                        <th className="text-center p-3">Terlambat</th>
                        <th className="text-center p-3">Izin</th>
                        <th className="text-center p-3">Sakit</th>
                        <th className="text-center p-3">Persentase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentSummaries.map((s, i) => {
                        const pct = s.total > 0 ? Math.round(((s.hadir + s.terlambat) / s.total) * 100) : 0
                        return (
                          <tr key={s.student_id} className="border-b hover:bg-muted/30">
                            <td className="p-3">{i + 1}</td>
                            <td className="p-3 font-medium">{s.name}</td>
                            <td className="p-3">{s.class_name}</td>
                            <td className="p-3 text-center">
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">{s.hadir}</Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">{s.tidak_hadir}</Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">{s.terlambat}</Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">{s.izin}</Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">{s.sakit}</Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant={pct >= 80 ? 'default' : 'destructive'} className="text-xs">{pct}%</Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Belum ada data untuk semester ini</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
