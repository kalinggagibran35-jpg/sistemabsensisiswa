'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { FileText, UserCheck, UserX, TrendingUp, Download } from 'lucide-react'
import { generateAttendanceReportPDF } from '@/lib/pdf-generator'

interface ClassItem {
  id: string
  name: string
}

interface StudentSummary {
  student_id: string
  name: string
  class_name: string
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
    class: { name: string }
  }
}

export default function WaliReports() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('bulanan')
  const [selectedClass, setSelectedClass] = useState('all')
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summaryStats, setSummaryStats] = useState({ hadir: 0, tidak_hadir: 0, terlambat: 0, sakit: 0, izin: 0, total: 0, pct: 0 })

  const fetchClasses = useCallback(async () => {
    try {
      const headers = getAuthHeaders()
      const res = await fetch('/api/classes', { headers })
      const json = await res.json()
      if (json.success) setClassList(json.data)
    } catch { /* ignore */ }
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const headers = getAuthHeaders()
      const now = new Date()
      const startDate = selectedPeriod === 'bulanan'
        ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        : new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      const endDate = now.toISOString().split('T')[0]

      const params = new URLSearchParams()
      params.set('start_date', startDate)
      params.set('end_date', endDate)
      if (selectedClass && selectedClass !== 'all') params.set('class_id', selectedClass)

      const res = await fetch(`/api/reports?${params.toString()}`, { headers })
      const json = await res.json()
      if (json.success) {
        setStudentSummaries(json.data.studentSummary || [])
        setRecords(json.data.records || [])
        const s = json.data.summary
        const pct = s.total > 0 ? Math.round(((s.hadir + s.terlambat) / s.total) * 100) : 0
        setSummaryStats({ hadir: s.hadir, tidak_hadir: s.tidak_hadir, terlambat: s.terlambat, sakit: s.sakit, izin: s.izin, total: s.total, pct })
      }
    } catch {
      toast.error('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, selectedClass])

  useEffect(() => { fetchClasses() }, [fetchClasses])
  useEffect(() => { fetchReports() }, [fetchReports])

  const downloadPDF = async () => {
    try {
      const headers = getAuthHeaders()
      const settingsRes = await fetch('/api/settings', { headers })
      const settingsJson = await settingsRes.json()
      const schoolName = settingsJson.data?.school_name || 'Sekolah'

      const className = selectedClass !== 'all'
        ? classList.find((c) => c.id === selectedClass)?.name
        : undefined

      const now = new Date()
      const startDateStr = selectedPeriod === 'bulanan'
        ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        : new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      const endDateStr = now.toISOString().split('T')[0]

      const doc = generateAttendanceReportPDF({
        schoolName,
        reportTitle: 'Laporan Kehadiran Siswa',
        dateRange: `${startDateStr} s/d ${endDateStr}`,
        className,
        summaryStats: {
          totalHadir: summaryStats.hadir,
          totalTidakHadir: summaryStats.tidak_hadir,
          totalTerlambat: summaryStats.terlambat,
          totalIzin: summaryStats.izin,
          totalSakit: summaryStats.sakit,
          persentaseKehadiran: summaryStats.pct,
        },
        students: studentSummaries.map((s) => {
          const pct = s.total > 0 ? ((s.hadir + s.terlambat) / s.total) * 100 : 0
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

      doc.save(`laporan-kehadiran-${startDateStr}-${endDateStr}.pdf`)
      toast.success('PDF berhasil diunduh')
    } catch {
      toast.error('Gagal membuat PDF')
    }
  }

  const statCards = [
    { title: 'Total Hadir', value: summaryStats.hadir, icon: UserCheck, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Total Tidak Hadir', value: summaryStats.tidak_hadir, icon: UserX, color: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
    { title: 'Total Terlambat', value: summaryStats.terlambat, icon: TrendingUp, color: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
    { title: 'Persentase Kehadiran', value: `${summaryStats.pct}%`, icon: TrendingUp, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
  ]

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Kehadiran</h1>
          <p className="text-muted-foreground text-sm">Lihat dan unduh laporan kehadiran siswa</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadPDF}>
          <Download className="h-4 w-4 mr-2" /> Download PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Periode</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="semester">Per Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Kelas</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
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

      {/* Student Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tabel Kehadiran Siswa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">No</th>
                  <th className="text-left p-3">Nama Siswa</th>
                  <th className="text-left p-3">Kelas</th>
                  <th className="text-center p-3">Hadir</th>
                  <th className="text-center p-3">Tidak Hadir</th>
                  <th className="text-center p-3">Terlambat</th>
                  <th className="text-center p-3">Sakit</th>
                  <th className="text-center p-3">Izin</th>
                  <th className="text-center p-3">%</th>
                </tr>
              </thead>
              <tbody>
                {studentSummaries.length > 0 ? studentSummaries.map((s, i) => {
                  const pct = s.total > 0 ? Math.round(((s.hadir + s.terlambat) / s.total) * 100) : 0
                  return (
                    <tr key={s.student_id} className="border-b hover:bg-muted/30">
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3">{s.class_name}</td>
                      <td className="p-3 text-center">{s.hadir}</td>
                      <td className="p-3 text-center">{s.tidak_hadir}</td>
                      <td className="p-3 text-center">{s.terlambat}</td>
                      <td className="p-3 text-center">{s.sakit}</td>
                      <td className="p-3 text-center">{s.izin}</td>
                      <td className="p-3 text-center">
                        <Badge variant={pct >= 80 ? 'default' : 'destructive'} className="text-xs">{pct}%</Badge>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      Belum ada data laporan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
