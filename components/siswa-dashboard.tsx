'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  User, ScanFace, QrCode, FileText, Clock, CheckCircle, XCircle,
  RefreshCw,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
} from 'recharts'

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

interface DashboardData {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  sickDays: number
  permissionDays: number
  attendancePercentage: number
  todayStatus: string
  todayCheckIn: string | null
  todayCheckOut: string | null
  monthlyStats: { hadir: number; tidak_hadir: number; terlambat: number; izin: number; sakit: number }
  recentRecords: Array<{
    id: string
    date: string
    check_in_time: string | null
    check_out_time: string | null
    status: string
  }>
}

export default function SiswaDashboard() {
  const { currentUser, setCurrentPage } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard?role=siswa&userId=${currentUser?.id}`, { headers: getAuthHeaders() })
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

  const todayStatus = dashboardData?.todayStatus || null
  const todayCheckIn = dashboardData?.todayCheckIn || null
  const todayCheckOut = dashboardData?.todayCheckOut || null
  const monthlyStats = dashboardData?.monthlyStats || { hadir: 0, tidak_hadir: 0, terlambat: 0, izin: 0, sakit: 0 }
  const recentRecords = dashboardData?.recentRecords || []

  const chartData = [
    { name: 'H', value: monthlyStats.hadir, fill: '#10b981' },
    { name: 'TH', value: monthlyStats.tidak_hadir, fill: '#ef4444' },
    { name: 'L', value: monthlyStats.terlambat, fill: '#f97316' },
    { name: 'I', value: monthlyStats.izin, fill: '#3b82f6' },
    { name: 'S', value: monthlyStats.sakit, fill: '#8b5cf6' },
  ].filter((d) => d.value > 0)

  if (loading || !dashboardData) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Welcome Card */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Selamat Datang, {currentUser?.name || 'Siswa'}!</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-200 dark:bg-emerald-800/50">
              <User className="h-8 w-8 text-emerald-700 dark:text-emerald-300" />
            </div>
          </div>
          {todayStatus && todayStatus !== 'belum_absen' && (
            <div className="mt-3">
              <Badge className={STATUS_BADGE[todayStatus] || ''}>
                Status hari ini: {STATUS_LABELS[todayStatus] || todayStatus}
              </Badge>
            </div>
          )}
          {todayStatus === 'belum_absen' && (
            <div className="mt-3">
              <Badge variant="outline" className="text-muted-foreground">
                Belum absensi hari ini
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Kehadiran Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <CheckCircle className={`h-5 w-5 ${todayCheckIn ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Jam Masuk</p>
                <p className="font-bold">{todayCheckIn || 'Belum absen'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Clock className={`h-5 w-5 ${todayCheckOut ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Jam Keluar</p>
                <p className="font-bold">{todayCheckOut || 'Belum absen'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              {todayStatus && todayStatus !== 'belum_absen' ? (
                <Badge className={STATUS_BADGE[todayStatus] || ''}>
                  {STATUS_LABELS[todayStatus] || todayStatus}
                </Badge>
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-bold">{todayStatus && todayStatus !== 'belum_absen' ? STATUS_LABELS[todayStatus] : 'Belum absen'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setCurrentPage('attendance-face')}>
          <CardContent className="p-4 text-center">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 inline-block mb-2">
              <ScanFace className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="font-semibold">Absensi Wajah</p>
            <p className="text-xs text-muted-foreground">Absen dengan pengenalan wajah</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setCurrentPage('attendance-qr')}>
          <CardContent className="p-4 text-center">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 inline-block mb-2">
              <QrCode className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-semibold">Absensi QR Code</p>
            <p className="text-xs text-muted-foreground">Absen dengan scan QR Code</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition" onClick={() => setCurrentPage('siswa-leave-request')}>
          <CardContent className="p-4 text-center">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 inline-block mb-2">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="font-semibold">Ajukan Izin/Sakit</p>
            <p className="text-xs text-muted-foreground">Kirim pengajuan izin atau sakit</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan Kehadiran Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{monthlyStats.hadir}</p>
                <p className="text-xs text-muted-foreground">Hadir</p>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{monthlyStats.tidak_hadir}</p>
                <p className="text-xs text-muted-foreground">TH</p>
              </div>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{monthlyStats.terlambat}</p>
                <p className="text-xs text-muted-foreground">Terlambat</p>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{monthlyStats.izin}</p>
                <p className="text-xs text-muted-foreground">Izin</p>
              </div>
              <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{monthlyStats.sakit}</p>
                <p className="text-xs text-muted-foreground">Sakit</p>
              </div>
            </div>
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <rect key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Riwayat Absensi Terakhir</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('siswa-attendance')}>
              Lihat Semua →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Tanggal</th>
                  <th className="text-left p-3">Masuk</th>
                  <th className="text-left p-3">Keluar</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.length > 0 ? recentRecords.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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
                    <td colSpan={4} className="p-6 text-center text-muted-foreground">Belum ada riwayat absensi</td>
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
