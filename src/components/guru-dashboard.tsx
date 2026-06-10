'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Users, UserCheck, UserX, Clock, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const CHART_COLORS = ['#10b981', '#ef4444', '#f97316']

interface ClassOverview {
  id: string
  name: string
  studentCount: number
  presentToday: number
  absentToday: number
  lateToday: number
  attendancePct: number
}

interface ViolationStudent {
  id: string
  name: string
  className: string
  count: number
}

interface DashboardData {
  totalStudents: number
  presentToday: number
  absentToday: number
  lateToday: number
  attendancePercentage: number
  violationCount: number
  violationStudents: ViolationStudent[]
  classOverview: ClassOverview[]
  trend7Days: Array<{ name: string; date: string; Hadir: number; 'Tidak Hadir': number; Terlambat: number }>
}

export default function GuruDashboard() {
  const { currentUser, setCurrentPage } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard?role=guru_bk&userId=${currentUser?.id}`, { headers: getAuthHeaders() })
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

  useEffect(() => { fetchData() }, [fetchData])

  const totalStudents = dashboardData?.totalStudents || 0
  const presentToday = dashboardData?.presentToday || 0
  const absentToday = dashboardData?.absentToday || 0
  const lateToday = dashboardData?.lateToday || 0
  const attendancePct = dashboardData?.attendancePercentage || 0
  const classOverview = dashboardData?.classOverview || []
  const violationCount = dashboardData?.violationCount || 0
  const violationStudents = dashboardData?.violationStudents || []
  const trend7Days = dashboardData?.trend7Days || []

  const handleClassClick = () => {
    setCurrentPage('guru-students')
  }

  const statCards = [
    { title: 'Total Siswa', value: totalStudents, icon: Users, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Hadir Hari Ini', value: presentToday, icon: UserCheck, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    { title: 'Tidak Hadir', value: absentToday, icon: UserX, color: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
    { title: 'Terlambat', value: lateToday, icon: Clock, color: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
    { title: 'Persentase Kehadiran', value: `${attendancePct}%`, icon: TrendingUp, color: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  ]

  const chartData = classOverview.map((c) => ({
    name: c.name,
    Hadir: c.presentToday,
    'Tidak Hadir': c.absentToday,
  }))

  if (loading || !dashboardData) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Guru BK</h1>
          <p className="text-muted-foreground text-sm">Ringkasan statistik bimbingan konseling</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Class Summary Table + Violation Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rekap Kehadiran Per Kelas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Kelas</th>
                    <th className="text-center p-3">Total Siswa</th>
                    <th className="text-center p-3">Hadir</th>
                    <th className="text-center p-3">Tidak Hadir</th>
                    <th className="text-center p-3">% Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {classOverview.length > 0 ? classOverview.map((cls) => (
                    <tr key={cls.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={handleClassClick}>
                      <td className="p-3 font-medium text-emerald-600 hover:underline">{cls.name}</td>
                      <td className="p-3 text-center">{cls.studentCount}</td>
                      <td className="p-3 text-center text-emerald-600">{cls.presentToday}</td>
                      <td className="p-3 text-center text-red-600">{cls.absentToday}</td>
                      <td className="p-3 text-center">
                        <Badge variant={cls.attendancePct >= 80 ? 'default' : 'destructive'} className="text-xs">
                          {cls.attendancePct}%
                        </Badge>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Belum ada data kelas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Violation Alert Card */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Peringatan Pelanggaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-red-600">{violationCount}</p>
              <p className="text-sm text-muted-foreground mt-1">siswa dengan ≥3 ketidakhadiran minggu ini</p>
            </div>
            {violationStudents.length > 0 && (
              <div className="mt-3 space-y-2">
                {violationStudents.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.className}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">{s.count}x tidak hadir</Badge>
                  </div>
                ))}
              </div>
            )}
            <Button className="w-full mt-3" variant="outline" onClick={() => setCurrentPage('guru-reports')}>
              Lihat Detail Pelanggaran
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grafik Kehadiran 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {trend7Days.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Hadir" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
                <Bar dataKey="Tidak Hadir" fill={CHART_COLORS[1]} radius={[2, 2, 0, 0]} />
                <Bar dataKey="Terlambat" fill={CHART_COLORS[2]} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Belum ada data</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
