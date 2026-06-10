'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus, Pencil, Trash2, MessageSquare, Search, ListChecks,
} from 'lucide-react'
import { toast } from 'sonner'
import DataTablePagination from '@/components/ui/data-table-pagination'

interface AttendanceItem {
  id: string
  student_id: string
  date: string
  check_in_time: string
  check_out_time: string | null
  status: string
  method: string
  notes: string | null
  student: {
    id: string
    nis: string
    user: { name: string }
    class: { id: string; name: string; major: string }
  }
}

interface StudentItem {
  id: string
  nis: string
  user: { name: string }
  class: { id: string; name: string }
}

interface ClassItem {
  id: string
  name: string
  major: string
}

const statusColors: Record<string, string> = {
  hadir: 'bg-emerald-600 text-white',
  tidak_hadir: 'bg-red-600 text-white',
  terlambat: 'bg-orange-500 text-white',
  izin: 'bg-blue-600 text-white',
  sakit: 'bg-purple-600 text-white',
}

const statusLabels: Record<string, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak Hadir',
  terlambat: 'Terlambat',
  izin: 'Izin',
  sakit: 'Sakit',
}

export default function AdminAttendance() {
  const { currentUser } = useAppStore()
  const [attendance, setAttendance] = useState<AttendanceItem[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [studentList, setStudentList] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  // Selected item
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceItem | null>(null)

  // Add/Edit form
  const [formStudentId, setFormStudentId] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formCheckIn, setFormCheckIn] = useState('')
  const [formCheckOut, setFormCheckOut] = useState('')
  const [formStatus, setFormStatus] = useState('hadir')
  const [formNotes, setFormNotes] = useState('')
  const [formSearch, setFormSearch] = useState('')

  // Bulk form
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0])
  const [bulkStatus, setBulkStatus] = useState('hadir')
  const [bulkSelected, setBulkSelected] = useState<string[]>([])

  // Note form
  const [noteText, setNoteText] = useState('')

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterDate) params.set('date', filterDate)
      if (filterClass) params.set('class_id', filterClass)
      if (filterStatus) params.set('status', filterStatus)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      const res = await fetch(`/api/attendance?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        setAttendance(json.data)
        setTotal(json.total)
      }
    } catch {
      toast.error('Gagal memuat data absensi')
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterClass, filterStatus, page, pageSize])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setClassList(json.data)
    } catch {
      // silent
    }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('status', 'active')
      const res = await fetch(`/api/students?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setStudentList(json.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchClasses()
    fetchStudents()
  }, [fetchClasses, fetchStudents])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  const resetForm = () => {
    setFormStudentId('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormCheckIn('')
    setFormCheckOut('')
    setFormStatus('hadir')
    setFormNotes('')
    setFormSearch('')
  }

  const openAddDialog = () => {
    resetForm()
    setShowAddDialog(true)
  }

  const openEditDialog = (item: AttendanceItem) => {
    setSelectedAttendance(item)
    setFormStudentId(item.student_id)
    setFormDate(item.date)
    setFormCheckIn(item.check_in_time)
    setFormCheckOut(item.check_out_time || '')
    setFormStatus(item.status)
    setFormNotes(item.notes || '')
    setShowEditDialog(true)
  }

  const openNoteDialog = (item: AttendanceItem) => {
    setSelectedAttendance(item)
    setNoteText(item.notes || '')
    setShowNoteDialog(true)
  }

  const openDeleteDialog = (item: AttendanceItem) => {
    setSelectedAttendance(item)
    setShowDeleteDialog(true)
  }

  const handleAddAttendance = async () => {
    if (!formStudentId || !formDate || !formCheckIn || !formStatus) {
      toast.error('Siswa, tanggal, waktu masuk, dan status wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          student_id: formStudentId,
          date: formDate,
          check_in_time: formCheckIn,
          check_out_time: formCheckOut || null,
          status: formStatus,
          method: 'manual',
          notes: formNotes || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Absensi berhasil ditambahkan')
        setShowAddDialog(false)
        fetchAttendance()
      } else {
        toast.error(json.error || 'Gagal menambahkan absensi')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleEditAttendance = async () => {
    if (!selectedAttendance || !formCheckIn || !formStatus) {
      toast.error('Waktu masuk dan status wajib diisi')
      return
    }
    setSaving(true)
    try {
      // Use PUT with the attendance record ID
      const res = await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          id: selectedAttendance.id,
          check_in_time: formCheckIn,
          check_out_time: formCheckOut || null,
          status: formStatus,
          notes: formNotes || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Absensi berhasil diperbarui')
        setShowEditDialog(false)
        fetchAttendance()
      } else {
        toast.error(json.error || 'Gagal memperbarui absensi')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAttendance = async () => {
    if (!selectedAttendance) return
    setSaving(true)
    try {
      const res = await fetch(`/api/attendance?id=${selectedAttendance.id}`, { method: 'DELETE', headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        toast.success('Absensi berhasil dihapus')
        setShowDeleteDialog(false)
        fetchAttendance()
      } else {
        toast.error(json.error || 'Gagal menghapus absensi')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNote = async () => {
    if (!selectedAttendance) return
    setSaving(true)
    try {
      // Use PUT with the attendance record ID to update notes
      const res = await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          id: selectedAttendance.id,
          notes: noteText || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Catatan berhasil disimpan')
        setShowNoteDialog(false)
        fetchAttendance()
      } else {
        toast.error(json.error || 'Gagal menyimpan catatan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAction = async () => {
    if (bulkSelected.length === 0) {
      toast.error('Pilih minimal satu siswa')
      return
    }
    if (!bulkDate) {
      toast.error('Tanggal harus diisi')
      return
    }
    setSaving(true)
    try {
      let successCount = 0
      for (const studentId of bulkSelected) {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            student_id: studentId,
            date: bulkDate,
            check_in_time: bulkStatus === 'tidak_hadir' ? '00:00' : '07:00',
            status: bulkStatus,
            method: 'manual',
          }),
        })
        const json = await res.json()
        if (json.success) successCount++
      }
      toast.success(`${successCount} absensi berhasil ditambahkan`)
      setShowBulkDialog(false)
      setBulkSelected([])
      fetchAttendance()
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const toggleBulkStudent = (id: string) => {
    setBulkSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const toggleAllBulk = () => {
    if (bulkSelected.length === studentList.length) {
      setBulkSelected([])
    } else {
      setBulkSelected(studentList.map((s) => s.id))
    }
  }

  const filteredStudents = studentList.filter((s) =>
    s.user.name.toLowerCase().includes(formSearch.toLowerCase()) ||
    s.nis.toLowerCase().includes(formSearch.toLowerCase())
  )

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Absensi Manual</h1>
          <p className="text-muted-foreground text-sm">Input dan kelola data absensi siswa</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Absensi
          </Button>
          <Button variant="outline" onClick={() => { setBulkDate(new Date().toISOString().split('T')[0]); setBulkSelected([]); setShowBulkDialog(true) }}>
            <ListChecks className="h-4 w-4 mr-2" />
            Bulk Action
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tanggal</Label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full sm:w-auto"
              />
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Kelas</Label>
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
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Status</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="hadir">Hadir</option>
                <option value="tidak_hadir">Tidak Hadir</option>
                <option value="terlambat">Terlambat</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
              </select>
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
                  <th className="text-left p-3">Kelas</th>
                  <th className="text-left p-3">Tanggal</th>
                  <th className="text-left p-3">Waktu Masuk</th>
                  <th className="text-left p-3">Waktu Keluar</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-left p-3">Catatan</th>
                  <th className="text-center p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length > 0 ? attendance.map((a, i) => (
                  <tr key={a.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{(page - 1) * pageSize + i + 1}</td>
                    <td className="p-3 font-medium">{a.student?.user?.name || '-'}</td>
                    <td className="p-3">{a.student?.nis || '-'}</td>
                    <td className="p-3">{a.student?.class?.name || '-'}</td>
                    <td className="p-3">{a.date}</td>
                    <td className="p-3">{a.check_in_time}</td>
                    <td className="p-3">{a.check_out_time || '-'}</td>
                    <td className="p-3 text-center">
                      <Badge className={`text-xs ${statusColors[a.status] || 'bg-gray-500 text-white'}`}>
                        {statusLabels[a.status] || a.status}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-[150px] truncate">{a.notes || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(a)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => openDeleteDialog(a)} title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openNoteDialog(a)} title="Tambah Catatan">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-muted-foreground">Tidak ada data absensi</td>
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

      {/* Add Attendance Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Absensi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Siswa</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau NIS..."
                  value={formSearch}
                  onChange={(e) => setFormSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
              >
                <option value="">Pilih Siswa</option>
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name} - {s.nis} ({s.class?.name || 'Tanpa Kelas'})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Waktu Masuk</Label>
                <Input
                  type="time"
                  value={formCheckIn}
                  onChange={(e) => setFormCheckIn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Waktu Keluar (opsional)</Label>
                <Input
                  type="time"
                  value={formCheckOut}
                  onChange={(e) => setFormCheckOut(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status Kehadiran</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="hadir">Hadir</option>
                <option value="tidak_hadir">Tidak Hadir</option>
                <option value="terlambat">Terlambat</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                placeholder="Catatan tambahan..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleAddAttendance} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Attendance Dialog - uses PUT with ID */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Absensi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedAttendance?.student?.user?.name}</p>
              <p className="text-sm text-muted-foreground">NIS: {selectedAttendance?.student?.nis} | {selectedAttendance?.student?.class?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={formDate}
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Waktu Masuk</Label>
                <Input
                  type="time"
                  value={formCheckIn}
                  onChange={(e) => setFormCheckIn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Waktu Keluar</Label>
                <Input
                  type="time"
                  value={formCheckOut}
                  onChange={(e) => setFormCheckOut(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status Kehadiran</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="hadir">Hadir</option>
                <option value="tidak_hadir">Tidak Hadir</option>
                <option value="terlambat">Terlambat</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                placeholder="Catatan tambahan..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
            <Button onClick={handleEditAttendance} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Action - Absensi Massal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Tanggal</Label>
              <Input
                type="date"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Aksi</Label>
              <div className="flex gap-2">
                <Button
                  variant={bulkStatus === 'hadir' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBulkStatus('hadir')}
                >
                  Tandai Hadir
                </Button>
                <Button
                  variant={bulkStatus === 'tidak_hadir' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setBulkStatus('tidak_hadir')}
                >
                  Tandai Tidak Hadir
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pilih Siswa</Label>
                <Button variant="ghost" size="sm" onClick={toggleAllBulk}>
                  {bulkSelected.length === studentList.length ? 'Batal Semua' : 'Pilih Semua'}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-2">
                {studentList.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                    <Checkbox
                      checked={bulkSelected.includes(s.id)}
                      onCheckedChange={() => toggleBulkStudent(s.id)}
                    />
                    <span className="text-sm">{s.user.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{s.nis} - {s.class?.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{bulkSelected.length} siswa dipilih</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Batal</Button>
            <Button onClick={handleBulkAction} disabled={saving || bulkSelected.length === 0}>
              {saving ? 'Memproses...' : `Konfirmasi (${bulkSelected.length} siswa)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Catatan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedAttendance?.student?.user?.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedAttendance?.date} | {statusLabels[selectedAttendance?.status || '']}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                placeholder="Tambahkan catatan..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>Batal</Button>
            <Button onClick={handleSaveNote} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Catatan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Absensi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus absensi <strong>{selectedAttendance?.student?.user?.name}</strong> pada tanggal {selectedAttendance?.date}?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAttendance} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
