'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Users, UserCheck, UserX, TrendingUp, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const CHART_COLORS = ['#10b981', '#ef4444', '#f97316']

interface ClassStats {
  id: string
  name: string
  studentCount: number
  presentToday: number
  absentToday: number
  lateToday: number
  absentStudents: { id: string; name: string }[]
}

interface LeaveRequest {
  id: string
  student: { user: { name: string }; class: { name: string } }
  type: string
  reason: string
  start_date: string
  status: string
}

interface DashboardData {
  totalStudents: number
  presentToday: number
  absentToday: number
  lateToday: number
  attendancePercentage: number
  pendingLeaveRequests: number
  classes: Array<{ id: string; name: string; major: string }>
  trend7Days: Array<{ name: string; date: string; Hadir: number; 'Tidak Hadir': number; Terlambat: number }>
  classStats: ClassStats[]
}

export default function WaliDashboard() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard?role=wali_kelas&userId=${currentUser?.id}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        setDashboardData(json.data)
      }
    } catch {
      toast.error('Gagal memuat dashboard')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  const fetchLeaveRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/leave-requests?status=pending', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        setLeaveRequests((json.data || []).slice(0, 5))
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchData()
    fetchLeaveRequests()
  }, [fetchData, fetchLeaveRequests])

  const totalStudents = dashboardData?.totalStudents || 0
  const presentToday = dashboardData?.presentToday || 0
  const absentToday = dashboardData?.absentToday || 0
  const attendancePct = dashboardData?.attendancePercentage || 0
  const classStats = dashboardData?.classStats || []
  const trend7Days = dashboardData?.trend7Days || []

  const statCards = [
    { title: 'Total Siswa Kelas', value: totalStudents, icon: Users, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Hadir Hari Ini', value: presentToday, icon: UserCheck, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    { title: 'Tidak Hadir', value: absentToday, icon: UserX, color: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
    { title: 'Persentase Kehadiran', value: `${attendancePct}%`, icon: TrendingUp, color: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  ]

  if (loading || !dashboardData) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Wali Kelas</h1>
          <p className="text-muted-foreground text-sm">Ringkasan kehadiran kelas Anda</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchData(); fetchLeaveRequests() }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stat Cards */}
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

      {/* Per Class Stats */}
      {classStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {classStats.map((cls) => (
            <Card key={cls.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{cls.name}</CardTitle>
                  <Badge variant="outline">{cls.studentCount} siswa</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{cls.presentToday}</p>
                    <p className="text-xs text-muted-foreground">Hadir</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{cls.absentToday}</p>
                    <p className="text-xs text-muted-foreground">Tidak Hadir</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{cls.lateToday}</p>
                    <p className="text-xs text-muted-foreground">Terlambat</p>
                  </div>
                </div>
                {cls.absentStudents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Siswa Tidak Hadir:</p>
                    <div className="space-y-1">
                      {cls.absentStudents.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-sm">
                          <XCircle className="h-3 w-3 text-red-500" />
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {cls.absentStudents.length === 0 && (
                  <p className="text-sm text-muted-foreground">Semua siswa hadir hari ini!</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Attendance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tren Kehadiran 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {trend7Days.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Hadir" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Tidak Hadir" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Terlambat" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Belum ada data tren kehadiran
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengajuan Izin/Sakit Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequests.length > 0 ? (
            <div className="space-y-3">
              {leaveRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{req.student?.user?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.student?.class?.name || '-'} • {req.type === 'izin' ? 'Izin' : 'Sakit'} • {req.start_date}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{req.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-700" variant="secondary">Pending</Badge>
                    <Button size="sm" variant="outline" className="text-emerald-600">
                      <CheckCircle className="h-4 w-4 mr-1" /> Setujui
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Tidak ada pengajuan izin/sakit yang menunggu</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
