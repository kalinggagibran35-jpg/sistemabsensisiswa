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
import { ClipboardList, UserCheck, UserX, Clock, TrendingUp, RefreshCw } from 'lucide-react'

interface AttendanceRecord {
  id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: string
  notes: string | null
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

export default function SiswaAttendance() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchAttendance = useCallback(async () => {
    if (!currentUser?.studentId) return
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('student_id', currentUser.studentId)
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const res = await fetch(`/api/attendance?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        let data: AttendanceRecord[] = (json.data || []).map((r: { id: string; date: string; check_in_time: string | null; check_out_time: string | null; status: string; notes: string | null }) => ({
          id: r.id,
          date: r.date,
          check_in_time: r.check_in_time,
          check_out_time: r.check_out_time,
          status: r.status,
          notes: r.notes,
        }))
        if (statusFilter && statusFilter !== 'all') {
          data = data.filter((r) => r.status === statusFilter)
        }
        setRecords(data)
      }
    } catch {
      toast.error('Gagal memuat riwayat absensi')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.studentId, startDate, endDate, statusFilter])

  useEffect(() => { fetchAttendance() }, [fetchAttendance])

  // Stats
  const stats = {
    hadir: records.filter((r) => r.status === 'hadir').length,
    tidak_hadir: records.filter((r) => r.status === 'tidak_hadir').length,
    terlambat: records.filter((r) => r.status === 'terlambat').length,
    pct: records.length > 0
      ? Math.round(((records.filter((r) => r.status === 'hadir' || r.status === 'terlambat').length) / records.length) * 100)
      : 0,
  }

  // Calculate total hours
  const calcHours = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return '-'
    const [h1, m1] = checkIn.split(':').map(Number)
    const [h2, m2] = checkOut.split(':').map(Number)
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
    const hours = Math.floor(diff / 60)
    const mins = diff % 60
    return `${hours}j ${mins}m`
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const statCards = [
    { title: 'Total Hadir', value: stats.hadir, icon: UserCheck, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Tidak Hadir', value: stats.tidak_hadir, icon: UserX, color: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
    { title: 'Terlambat', value: stats.terlambat, icon: Clock, color: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
    { title: 'Persentase Kehadiran', value: `${stats.pct}%`, icon: TrendingUp, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Absensi</h1>
          <p className="text-muted-foreground text-sm">Riwayat kehadiran Anda</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAttendance}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Dari Tanggal</Label>
              <Input type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Sampai Tanggal</Label>
              <Input type="date" className="mt-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Tanggal</th>
                  <th className="text-left p-3">Waktu Masuk</th>
                  <th className="text-left p-3">Waktu Keluar</th>
                  <th className="text-left p-3">Total Jam</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? records.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="p-3">{r.check_in_time || '-'}</td>
                    <td className="p-3">{r.check_out_time || '-'}</td>
                    <td className="p-3">{calcHours(r.check_in_time, r.check_out_time)}</td>
                    <td className="p-3">
                      <Badge className={STATUS_BADGE[r.status] || ''} variant="secondary">
                        {STATUS_LABELS[r.status] || r.status}
                      </Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      Belum ada riwayat absensi
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
