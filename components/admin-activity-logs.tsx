'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/store'
import { FileSearch, RefreshCw } from 'lucide-react'
import DataTablePagination from '@/components/ui/data-table-pagination'

interface ActivityLog {
  id: string
  user_id: string | null
  user_name: string
  user_role: string
  activity_type: string
  details: string | null
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  wali_kelas: 'Wali Kelas',
  guru_bk: 'Guru BK',
  siswa: 'Siswa',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  wali_kelas: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  guru_bk: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  siswa: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

const ACTIVITY_COLORS: Record<string, string> = {
  login: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  logout: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  update: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  reject: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function AdminActivityLogs() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [userFilter, setUserFilter] = useState('')
  const [activityTypeFilter, setActivityTypeFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (activityTypeFilter && activityTypeFilter !== 'all') params.set('activity_type', activityTypeFilter)

      const res = await fetch(`/api/activity-logs?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        let filtered = json.data as ActivityLog[]
        // Client-side date filtering
        if (startDate) {
          filtered = filtered.filter((l) => l.created_at >= startDate)
        }
        if (endDate) {
          filtered = filtered.filter((l) => l.created_at <= endDate + 'T23:59:59')
        }
        // Client-side user filtering
        if (userFilter) {
          filtered = filtered.filter((l) =>
            l.user_name.toLowerCase().includes(userFilter.toLowerCase())
          )
        }
        setLogs(filtered)
        setTotal(json.total || filtered.length)
      }
    } catch {
      toast.error('Gagal memuat log aktivitas')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, activityTypeFilter, startDate, endDate, userFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  if (loading && logs.length === 0) {
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
          <h1 className="text-2xl font-bold">Log Aktivitas</h1>
          <p className="text-muted-foreground text-sm">Riwayat aktivitas pengguna sistem</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Pengguna</Label>
              <Input className="mt-1" placeholder="Cari nama pengguna..." value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1) }} />
            </div>
            <div>
              <Label className="text-xs">Jenis Aktivitas</Label>
              <Select value={activityTypeFilter} onValueChange={(v) => { setActivityTypeFilter(v); setPage(1) }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Semua" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Buat Data</SelectItem>
                  <SelectItem value="update">Ubah Data</SelectItem>
                  <SelectItem value="delete">Hapus Data</SelectItem>
                  <SelectItem value="approve">Setujui</SelectItem>
                  <SelectItem value="reject">Tolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Dari Tanggal</Label>
              <Input type="date" className="mt-1" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
            </div>
            <div>
              <Label className="text-xs">Sampai Tanggal</Label>
              <Input type="date" className="mt-1" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} />
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
                  <th className="text-left p-3">Waktu</th>
                  <th className="text-left p-3">Pengguna</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Jenis Aktivitas</th>
                  <th className="text-left p-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3 font-medium">{log.user_name}</td>
                    <td className="p-3">
                      <Badge className={ROLE_COLORS[log.user_role] || ''} variant="secondary">
                        {ROLE_LABELS[log.user_role] || log.user_role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={ACTIVITY_COLORS[log.activity_type] || 'bg-gray-100 text-gray-700'} variant="secondary">
                        {log.activity_type}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{log.details || '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      <FileSearch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      Belum ada log aktivitas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
      />
    </div>
  )
}
