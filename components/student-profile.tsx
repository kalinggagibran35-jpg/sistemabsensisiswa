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
import { ArrowLeft, User, Mail, Phone, ScanFace } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const CHART_COLORS = ['#10b981', '#ef4444', '#f97316', '#3b82f6', '#8b5cf6']

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

interface StudentData {
  id: string
  nis: string
  parent_whatsapp: string | null
  face_registered: boolean
  status: string
  user: { name: string; email: string; photo_url: string | null }
  class: { name: string; major: string }
}

interface AttendanceRecord {
  id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: string
  notes: string | null
}

export default function StudentProfile() {
  const { selectedStudentId, setCurrentPage } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<StudentData | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const fetchStudent = useCallback(async () => {
    if (!selectedStudentId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/students?id=${selectedStudentId}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        const found = json.data.find((s: { id: string }) => s.id === selectedStudentId)
        if (found) setStudent(found)
      } else if (json.success && json.data) {
        setStudent(json.data)
      }
    } catch {
      toast.error('Gagal memuat data siswa')
    } finally {
      setLoading(false)
    }
  }, [selectedStudentId])

  const fetchAttendance = useCallback(async () => {
    if (!selectedStudentId) return
    try {
      const params = new URLSearchParams()
      params.set('student_id', selectedStudentId)
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      const res = await fetch(`/api/attendance?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        let data: AttendanceRecord[] = (json.data || []).map((r: { id: string; date: string; check_in_time: string | null; check_out_time: string | null; status: string; notes: string | null }) => ({
          id: r.id, date: r.date, check_in_time: r.check_in_time, check_out_time: r.check_out_time, status: r.status, notes: r.notes,
        }))
        if (statusFilter && statusFilter !== 'all') {
          data = data.filter((r) => r.status === statusFilter)
        }
        setAttendance(data)
      }
    } catch { /* ignore */ }
  }, [selectedStudentId, startDate, endDate, statusFilter])

  useEffect(() => { fetchStudent() }, [fetchStudent])
  useEffect(() => { fetchAttendance() }, [fetchAttendance])

  // Build monthly chart data (last 12 months)
  const monthlyData = (() => {
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthName = d.toLocaleDateString('id-ID', { month: 'short' })
      const monthRecords = attendance.filter((r) => {
        const rd = new Date(r.date)
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear()
      })
      months.push({
        name: monthName,
        Hadir: monthRecords.filter((r) => r.status === 'hadir').length,
        'Tidak Hadir': monthRecords.filter((r) => r.status === 'tidak_hadir').length,
      })
    }
    return months
  })()

  // Pie chart data - attendance distribution
  const distribution = [
    { name: 'Hadir', value: attendance.filter((r) => r.status === 'hadir').length },
    { name: 'Sakit', value: attendance.filter((r) => r.status === 'sakit').length },
    { name: 'Izin', value: attendance.filter((r) => r.status === 'izin').length },
    { name: 'Alpa', value: attendance.filter((r) => r.status === 'tidak_hadir').length },
  ].filter((d) => d.value > 0)

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
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('admin-students')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Profil Siswa</h1>
          <p className="text-muted-foreground text-sm">Detail informasi dan riwayat kehadiran siswa</p>
        </div>
      </div>

      {/* Student Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              {student?.user?.photo_url ? (
                <img src={student.user.photo_url} alt={student.user.name} className="w-20 h-20 rounded-xl object-cover" />
              ) : (
                <User className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Nama Lengkap</p>
                <p className="font-semibold">{student?.user?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NIS</p>
                <p className="font-semibold">{student?.nis || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kelas</p>
                <p className="font-semibold">{student?.class?.name || '-'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{student?.user?.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">WA Orangtua</p>
                  <p className="text-sm">{student?.parent_whatsapp || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={student?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'} variant="secondary">
                    {student?.status === 'active' ? 'Aktif' : 'Arsip'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ScanFace className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Registrasi Wajah</p>
                  <Badge className={student?.face_registered ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} variant="secondary">
                    {student?.face_registered ? 'Terdaftar' : 'Belum Terdaftar'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kehadiran Bulanan (12 Bulan Terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="Hadir" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
                <Bar dataKey="Tidak Hadir" fill={CHART_COLORS[1]} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            {distribution.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={250}>
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {distribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {distribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-sm">{entry.name}</span>
                      <span className="text-sm font-semibold ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Belum ada data kehadiran</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Kehadiran</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div>
              <Label className="text-xs">Dari</Label>
              <Input type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Sampai</Label>
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
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Tanggal</th>
                  <th className="text-left p-3">Masuk</th>
                  <th className="text-left p-3">Keluar</th>
                  <th className="text-left p-3">Jam</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length > 0 ? attendance.map((r) => (
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
                    <td className="p-3 text-muted-foreground text-xs">{r.notes || '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">Belum ada data kehadiran</td>
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
