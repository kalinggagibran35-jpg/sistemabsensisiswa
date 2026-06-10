'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Users, UserCheck, UserX, Clock, TrendingUp, Download, RefreshCw,
} from 'lucide-react'
import { AttendanceHeatmapCard } from '@/components/attendance-heatmap'
import { exportChartToPNG } from '@/lib/chart-export'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const CHART_COLORS = ['#10b981', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6']

interface DashboardData {
  totalStudents: number
  totalClasses: number
  totalTeachers: number
  presentToday: number
  lateToday: number
  absentToday: number
  sickToday: number
  permissionToday: number
  tidakHadirToday: number
  attendancePercentage: number
  pendingLeaveRequests: number
  trend7Days: Array<{ name: string; date: string; Hadir: number; 'Tidak Hadir': number; Terlambat: number }>
  distribution: { hadir: number; tidak_hadir: number; terlambat: number; izin: number; sakit: number }
  studentRankings: Array<{ id: string; name: string; className: string; present: number; absent: number; percentage: number }>
  classComparison: Array<{ name: string; percentage: number; totalStudents: number }>
  checkedInList: Array<{
    id: string
    student_id: string
    status: string
    check_in_time: string
    student: { id: string; nis: string; user: { name: string }; class: { name: string } }
  }>
  notCheckedInList: Array<{ id: string; name: string; className: string }>
  heatmapData: Array<{ date: string; percentage: number; isHoliday: boolean }>
}

export default function AdminDashboard() {
  const { currentUser } = useAppStore()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard?role=admin&userId=${currentUser?.id}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        setDashboardData(json.data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  // Pie chart data from real distribution
  const pieData = dashboardData
    ? [
        { name: 'Hadir', value: dashboardData.distribution.hadir },
        { name: 'Tidak Hadir', value: dashboardData.distribution.tidak_hadir },
        { name: 'Terlambat', value: dashboardData.distribution.terlambat },
        { name: 'Izin', value: dashboardData.distribution.izin },
        { name: 'Sakit', value: dashboardData.distribution.sakit },
      ].filter((d) => d.value > 0)
    : []

  const checkedInCount = dashboardData?.checkedInList?.length || 0
  const notCheckedInCount = dashboardData?.notCheckedInList?.length || 0

  if (loading || !dashboardData) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Siswa',
      value: dashboardData.totalStudents,
      subtitle: `${dashboardData.totalClasses} kelas, ${dashboardData.totalTeachers} guru`,
      icon: Users,
      color: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Hadir Hari Ini',
      value: dashboardData.presentToday,
      subtitle: dashboardData.totalStudents > 0 ? `${Math.round((dashboardData.presentToday / dashboardData.totalStudents) * 100)}% dari total` : 'Belum ada data',
      icon: UserCheck,
      color: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Tidak Hadir',
      value: dashboardData.absentToday,
      subtitle: 'Hari ini',
      icon: UserX,
      color: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Terlambat',
      value: dashboardData.lateToday,
      subtitle: 'Hari ini',
      icon: Clock,
      color: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Kehadiran Bulan Ini',
      value: `${dashboardData.attendancePercentage}%`,
      subtitle: dashboardData.attendancePercentage >= 80 ? 'Tren baik ↑' : 'Perlu perhatian ↓',
      icon: TrendingUp,
      color: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground text-sm">Ringkasan statistik dan aktivitas sekolah</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Row 1 - Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{card.title}</p>
                  <p className="text-xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{card.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1.5 - Heatmap */}
      <AttendanceHeatmapCard />

      {/* Row 2 - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Attendance Trend */}
        <Card id="trend-chart">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Grafik Tren Kehadiran (7 Hari)</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Ekspor PNG" onClick={() => exportChartToPNG('trend-chart', 'tren-kehadiran.png')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData.trend7Days && dashboardData.trend7Days.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dashboardData.trend7Days}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Hadir" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Tidak Hadir" fill={CHART_COLORS[3]} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Terlambat" fill={CHART_COLORS[2]} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Belum ada data tren kehadiran
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Attendance Distribution */}
        <Card id="distribution-chart">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Distribusi Status Kehadiran</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Ekspor PNG" onClick={() => exportChartToPNG('distribution-chart', 'distribusi-kehadiran.png')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-sm">{entry.name}</span>
                      <span className="text-sm font-semibold ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Belum ada data kehadiran hari ini
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 - Tables & Horizontal Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Students with Lowest Attendance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 10 Siswa Kehadiran Terendah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="text-left p-2">No</th>
                    <th className="text-left p-2">Nama</th>
                    <th className="text-left p-2">Kelas</th>
                    <th className="text-center p-2">Hadir</th>
                    <th className="text-center p-2">TH</th>
                    <th className="text-center p-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.studentRankings && dashboardData.studentRankings.length > 0 ? dashboardData.studentRankings.map((s, i) => (
                    <tr key={s.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{s.name}</td>
                      <td className="p-2">{s.className}</td>
                      <td className="p-2 text-center">{s.present}</td>
                      <td className="p-2 text-center">{s.absent}</td>
                      <td className="p-2 text-center">
                        <Badge variant={s.percentage < 80 ? 'destructive' : 'secondary'} className="text-xs">
                          {s.percentage}%
                        </Badge>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">Belum ada data kehadiran bulan ini</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Class Attendance Comparison */}
        <Card id="class-comparison-chart">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Perbandingan Kehadiran Antar Kelas</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Ekspor PNG" onClick={() => exportChartToPNG('class-comparison-chart', 'perbandingan-kelas.png')}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData.classComparison && dashboardData.classComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dashboardData.classComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="percentage" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} name="Kehadiran %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Belum ada data perbandingan kelas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4 - Real-time Attendance Status */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Status Absensi Real-time</CardTitle>
            <Badge variant="outline" className="text-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Checked In */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                Sudah Absensi Masuk ({checkedInCount})
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {checkedInCount > 0 ? dashboardData.checkedInList.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{a.student?.user?.name || '-'}</p>
                      <p className="text-xs text-muted-foreground">{a.student?.class?.name || '-'}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-emerald-600 text-xs">{a.status === 'hadir' ? 'Hadir' : a.status === 'terlambat' ? 'Terlambat' : a.status}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{a.check_in_time || '-'}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Belum ada yang absensi</p>
                )}
              </div>
            </div>

            {/* Not Checked In */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <UserX className="h-4 w-4 text-red-500" />
                Belum Absensi ({notCheckedInCount})
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {notCheckedInCount > 0 ? dashboardData.notCheckedInList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.className}</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-red-600">Belum Absensi</Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Semua siswa sudah absensi!</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
