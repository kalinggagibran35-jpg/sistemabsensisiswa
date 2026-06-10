'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Eye, Image as ImageIcon, FileText, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface LeaveRequestItem {
  id: string
  student_id: string
  type: string
  reason: string
  evidence_url: string | null
  start_date: string
  end_date: string
  status: string
  approved_by_wali_id: string | null
  approved_by_admin_id: string | null
  created_at: string
  student: {
    id: string
    nis: string
    user: { name: string; photo_url: string | null }
    class: { id: string; name: string; major: string }
  }
  approved_wali?: {
    user: { name: string }
  } | null
}

interface ClassItem {
  id: string
  name: string
  major: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500 text-white',
  approved_wali_kelas: 'bg-blue-600 text-white',
  approved_admin: 'bg-emerald-600 text-white',
  rejected: 'bg-red-600 text-white',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  approved_wali_kelas: 'Disetujui Wali',
  approved_admin: 'Disetujui Admin',
  rejected: 'Ditolak',
}

const typeColors: Record<string, string> = {
  izin: 'bg-blue-600 text-white',
  sakit: 'bg-red-600 text-white',
}

const typeLabels: Record<string, string> = {
  izin: 'Izin',
  sakit: 'Sakit',
}

export default function GuruLeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterClass, setFilterClass] = useState('')

  // Dialogs
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestItem | null>(null)

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterType) params.set('type', filterType)
      if (filterClass) params.set('class_id', filterClass)
      const res = await fetch(`/api/leave-requests?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setLeaveRequests(json.data)
    } catch {
      toast.error('Gagal memuat data izin/sakit')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType, filterClass])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setClassList(json.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    fetchLeaveRequests()
  }, [fetchLeaveRequests])

  const openDetail = (item: LeaveRequestItem) => {
    setSelectedRequest(item)
    setShowDetailDialog(true)
  }

  const openEvidence = (item: LeaveRequestItem) => {
    setSelectedRequest(item)
    setShowEvidenceDialog(true)
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Izin/Sakit Siswa</h1>
        <p className="text-muted-foreground text-sm">Lihat pengajuan izin dan sakit dari semua kelas (hanya lihat)</p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Mode Hanya Lihat</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Sebagai Guru BK, Anda dapat melihat data izin/sakit seluruh kelas tetapi tidak dapat menyetujui atau menolak pengajuan.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="approved_wali_kelas">Disetujui Wali</option>
                <option value="approved_admin">Disetujui Admin</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Jenis</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Semua Jenis</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Kelas</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">Semua Kelas</option>
                {classList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{leaveRequests.filter((r) => r.status === 'pending').length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{leaveRequests.filter((r) => r.status === 'approved_wali_kelas').length}</p>
            <p className="text-xs text-muted-foreground">Disetujui Wali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{leaveRequests.filter((r) => r.status === 'approved_admin').length}</p>
            <p className="text-xs text-muted-foreground">Disetujui Admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{leaveRequests.filter((r) => r.status === 'rejected').length}</p>
            <p className="text-xs text-muted-foreground">Ditolak</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">No</th>
                  <th className="text-left p-3">Nama Siswa</th>
                  <th className="text-left p-3">Kelas</th>
                  <th className="text-left p-3">Tgl Pengajuan</th>
                  <th className="text-left p-3">Tgl Izin/Sakit</th>
                  <th className="text-center p-3">Jenis</th>
                  <th className="text-left p-3">Alasan</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-center p-3">Bukti</th>
                  <th className="text-center p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.length > 0 ? leaveRequests.map((r, i) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => openDetail(r)}>
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{r.student?.user?.name || '-'}</td>
                    <td className="p-3">{r.student?.class?.name || '-'}</td>
                    <td className="p-3">{formatDate(r.created_at)}</td>
                    <td className="p-3">{r.start_date} - {r.end_date}</td>
                    <td className="p-3 text-center">
                      <Badge className={`text-xs ${typeColors[r.type] || 'bg-gray-500 text-white'}`}>
                        {typeLabels[r.type] || r.type}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-[200px] truncate">{r.reason}</td>
                    <td className="p-3 text-center">
                      <Badge className={`text-xs ${statusColors[r.status] || 'bg-gray-500 text-white'}`}>
                        {statusLabels[r.status] || r.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      {r.evidence_url ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-blue-600 p-0 h-auto"
                          onClick={(e) => { e.stopPropagation(); openEvidence(r) }}
                        >
                          Lihat Bukti
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(r)} title="Detail">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p>Tidak ada data izin/sakit</p>
                      <p className="text-xs mt-1">Belum ada pengajuan izin/sakit dari siswa</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog (read-only) */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan Izin/Sakit</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nama Siswa</p>
                  <p className="font-medium">{selectedRequest.student?.user?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kelas</p>
                  <p className="font-medium">{selectedRequest.student?.class?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NIS</p>
                  <p className="font-medium">{selectedRequest.student?.nis}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jenis</p>
                  <Badge className={`text-xs ${typeColors[selectedRequest.type]}`}>
                    {typeLabels[selectedRequest.type]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Pengajuan</p>
                  <p className="font-medium">{formatDate(selectedRequest.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={`text-xs ${statusColors[selectedRequest.status]}`}>
                    {statusLabels[selectedRequest.status]}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Tanggal Izin/Sakit</p>
                <p className="font-medium">{selectedRequest.start_date} s.d. {selectedRequest.end_date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alasan</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.reason}</p>
              </div>
              {selectedRequest.approved_wali && (
                <div>
                  <p className="text-xs text-muted-foreground">Disetujui Wali Kelas</p>
                  <p className="font-medium">{selectedRequest.approved_wali.user.name}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Bukti</p>
                {selectedRequest.evidence_url ? (
                  <div className="border rounded-lg p-4 bg-muted/50 flex items-center gap-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Bukti tersedia</p>
                      <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => { setShowDetailDialog(false); openEvidence(selectedRequest) }}>
                        Lihat Bukti
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Tidak ada bukti dilampirkan</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Dialog */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bukti Pengajuan</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedRequest.student?.user?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {typeLabels[selectedRequest.type]} - {selectedRequest.start_date} s.d. {selectedRequest.end_date}
                </p>
              </div>
              <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center bg-muted/30 min-h-[200px]">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Bukti: {selectedRequest.evidence_url}</p>
                <p className="text-xs text-muted-foreground mt-1">(Preview simulasi)</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEvidenceDialog(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
