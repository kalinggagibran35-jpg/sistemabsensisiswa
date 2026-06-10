'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ClipboardCheck, Download, FileText } from 'lucide-react'
import { generateAttendanceReportPDF } from '@/lib/pdf-generator'

interface AttendanceRecord {
  id: string
  student_id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: string
  student: {
    id: string
    nis: string
    user: { name: string }
    class: { name: string }
  }
}

interface ClassItem {
  id: string
  name: string
}

const STATUS_BADGE: Record<string, string> = {
  hadir: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  tidak_hadir: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  terlambat: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  izin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sakit: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const STATUS_LABELS: Record<string, string> = {
  hadir: 'Hadir', tidak_hadir: 'Tidak Hadir', terlambat: 'Terlambat', izin: 'Izin', sakit: 'Sakit',
}

export default function WaliAttendance() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [period, setPeriod] = useState('harian')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState('all')

  const fetchClasses = useCallback(async () => {
    try {
      const headers = getAuthHeaders()
      const res = await fetch('/api/classes', { headers })
      const json = await res.json()
      if (json.success) setClassList(json.data)
    } catch { /* ignore */ }
  }, [])

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true)
      const headers = getAuthHeaders()
      const params = new URLSearchParams()
      params.set('date', selectedDate)
      if (selectedClass && selectedClass !== 'all') params.set('class_id', selectedClass)

      const res = await fetch(`/api/attendance?${params.toString()}`, { headers })
      const json = await res.json()
      if (json.success) setRecords(json.data)
    } catch {
      toast.error('Gagal memuat data kehadiran')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, selectedClass])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  const downloadPDF = async () => {
    try {
      const headers = getAuthHeaders()
      const settingsRes = await fetch('/api/settings', { headers })
      const settingsJson = await settingsRes.json()
      const schoolName = settingsJson.data?.school_name || 'Sekolah'

      const className = selectedClass !== 'all'
        ? classList.find((c) => c.id === selectedClass)?.name
        : undefined

      // Build summary from records
      const totalHadir = records.filter((r) => r.status === 'hadir').length
      const totalTidakHadir = records.filter((r) => r.status === 'tidak_hadir').length
      const totalTerlambat = records.filter((r) => r.status === 'terlambat').length
      const totalIzin = records.filter((r) => r.status === 'izin').length
      const totalSakit = records.filter((r) => r.status === 'sakit').length
      const total = records.length
      const persentase = total > 0 ? ((totalHadir + totalTerlambat) / total) * 100 : 0

      // Build per-student summary from records
      const studentMap = new Map<string, { nama: string; nis: string; kelas: string; hadir: number; tidakHadir: number; terlambat: number; izin: number; sakit: number; total: number }>()
      records.forEach((r) => {
        const existing = studentMap.get(r.student_id)
        if (!existing) {
          studentMap.set(r.student_id, {
            nama: r.student?.user?.name || '-',
            nis: r.student?.nis || '-',
            kelas: r.student?.class?.name || '-',
            hadir: r.status === 'hadir' ? 1 : 0,
            tidakHadir: r.status === 'tidak_hadir' ? 1 : 0,
            terlambat: r.status === 'terlambat' ? 1 : 0,
            izin: r.status === 'izin' ? 1 : 0,
            sakit: r.status === 'sakit' ? 1 : 0,
            total: 1,
          })
        } else {
          existing.total++
          if (r.status === 'hadir') existing.hadir++
          if (r.status === 'tidak_hadir') existing.tidakHadir++
          if (r.status === 'terlambat') existing.terlambat++
          if (r.status === 'izin') existing.izin++
          if (r.status === 'sakit') existing.sakit++
        }
      })

      const doc = generateAttendanceReportPDF({
        schoolName,
        reportTitle: 'Rekap Kehadiran Siswa',
        dateRange: selectedDate,
        className,
        summaryStats: {
          totalHadir,
          totalTidakHadir,
          totalTerlambat,
          totalIzin,
          totalSakit,
          persentaseKehadiran: persentase,
        },
        students: Array.from(studentMap.values()).map((s) => ({
          ...s,
          persentase: s.total > 0 ? ((s.hadir + s.terlambat) / s.total) * 100 : 0,
        })),
      })

      doc.save(`rekap-kehadiran-${selectedDate}.pdf`)
      toast.success('PDF berhasil diunduh')
    } catch {
      toast.error('Gagal membuat PDF')
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rekap Kehadiran</h1>
          <p className="text-muted-foreground text-sm">Rekap kehadiran siswa kelas Anda</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadPDF}>
          <Download className="h-4 w-4 mr-2" /> Download PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Periode</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="harian">Harian</SelectItem>
                  <SelectItem value="mingguan">Mingguan</SelectItem>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tanggal</Label>
              <Input type="date" className="mt-1" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">No</th>
                  <th className="text-left p-3">Nama Siswa</th>
                  <th className="text-left p-3">NIS</th>
                  <th className="text-left p-3">Tanggal</th>
                  <th className="text-left p-3">Waktu Masuk</th>
                  <th className="text-left p-3">Waktu Keluar</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? records.map((r, i) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{r.student?.user?.name || '-'}</td>
                    <td className="p-3">{r.student?.nis || '-'}</td>
                    <td className="p-3">{r.date}</td>
                    <td className="p-3">{r.check_in_time || '-'}</td>
                    <td className="p-3">{r.check_out_time || '-'}</td>
                    <td className="p-3">
                      <Badge className={STATUS_BADGE[r.status] || ''} variant="secondary">
                        {STATUS_LABELS[r.status] || r.status}
                      </Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      Belum ada data kehadiran untuk tanggal ini
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
