'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Search, Eye, Pencil, ChevronDown, ChevronUp, User, ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'

interface StudentItem {
  id: string
  nis: string
  user_id: string
  class_id: string
  parent_whatsapp: string | null
  face_registered: boolean
  status: string
  user: { id: string; name: string; email: string; phone: string | null; photo_url: string | null }
  class: { id: string; name: string; major: string }
}

interface AttendanceRecord {
  id: string
  date: string
  check_in_time: string
  check_out_time: string | null
  status: string
  method: string
  notes: string | null
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

export default function GuruStudents() {
  const { setCurrentPage, setSelectedStudentId } = useAppStore()
  const [students, setStudents] = useState<StudentItem[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('')

  // Expanded student
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editStudent, setEditStudent] = useState<StudentItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editParentWA, setEditParentWA] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('status', 'active')
      if (filterClass) params.set('class_id', filterClass)
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/students?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setStudents(json.data)
    } catch {
      toast.error('Gagal memuat data siswa')
    } finally {
      setLoading(false)
    }
  }, [filterClass, searchQuery])

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
    fetchStudents()
  }, [fetchStudents])

  const fetchAttendanceHistory = async (studentId: string) => {
    setLoadingHistory(true)
    try {
      const params = new URLSearchParams()
      params.set('student_id', studentId)
      const res = await fetch(`/api/attendance?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setAttendanceHistory(json.data)
    } catch {
      toast.error('Gagal memuat riwayat kehadiran')
    } finally {
      setLoadingHistory(false)
    }
  }

  const toggleExpand = (studentId: string) => {
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null)
      setAttendanceHistory([])
    } else {
      setExpandedStudentId(studentId)
      fetchAttendanceHistory(studentId)
    }
  }

  const openEditDialog = (student: StudentItem) => {
    setEditStudent(student)
    setEditName(student.user.name)
    setEditPhone(student.user.phone || '')
    setEditParentWA(student.parent_whatsapp || '')
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editStudent) return
    setSaving(true)
    try {
      const res = await fetch(`/api/students?id=${editStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: editName,
          email: editStudent.user.email,
          nis: editStudent.nis,
          class_id: editStudent.class_id,
          parent_whatsapp: editParentWA || null,
          phone: editPhone || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Data siswa berhasil diperbarui')
        setShowEditDialog(false)
        fetchStudents()
      } else {
        toast.error(json.error || 'Gagal memperbarui data')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleViewProfile = (studentId: string) => {
    setSelectedStudentId(studentId)
    setCurrentPage('student-profile')
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
        <h1 className="text-2xl font-bold">Detail Siswa</h1>
        <p className="text-muted-foreground text-sm">Lihat data dan riwayat kehadiran siswa</p>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <div className="space-y-3">
        {students.length > 0 ? students.map((s) => (
          <Card key={s.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Student row */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30"
                onClick={() => toggleExpand(s.id)}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{s.user.name}</p>
                  <p className="text-xs text-muted-foreground">NIS: {s.nis} | {s.class?.name || 'Tanpa Kelas'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.face_registered ? 'default' : 'secondary'} className="text-xs">
                    {s.face_registered ? 'Wajah Terdaftar' : 'Belum Terdaftar'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); openEditDialog(s) }}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleViewProfile(s.id) }}
                    title="Lihat Profil"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {expandedStudentId === s.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded: Attendance History */}
              {expandedStudentId === s.id && (
                <div className="border-t bg-muted/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium text-sm">Riwayat Kehadiran</h4>
                  </div>
                  {loadingHistory ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((n) => (
                        <Skeleton key={n} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : attendanceHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2">Tanggal</th>
                            <th className="text-left p-2">Masuk</th>
                            <th className="text-left p-2">Keluar</th>
                            <th className="text-center p-2">Status</th>
                            <th className="text-left p-2">Metode</th>
                            <th className="text-left p-2">Catatan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceHistory.slice(0, 10).map((a) => (
                            <tr key={a.id} className="border-b">
                              <td className="p-2">{a.date}</td>
                              <td className="p-2">{a.check_in_time}</td>
                              <td className="p-2">{a.check_out_time || '-'}</td>
                              <td className="p-2 text-center">
                                <Badge className={`text-xs ${statusColors[a.status] || ''}`}>
                                  {statusLabels[a.status] || a.status}
                                </Badge>
                              </td>
                              <td className="p-2 capitalize">{a.method}</td>
                              <td className="p-2 max-w-[120px] truncate">{a.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {attendanceHistory.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Menampilkan 10 dari {attendanceHistory.length} catatan
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat kehadiran</p>
                  )}

                  {/* Student Details */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{s.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Telepon</p>
                      <p className="text-sm">{s.user.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">WA Orangtua</p>
                      <p className="text-sm">{s.parent_whatsapp || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={s.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {s.status === 'active' ? 'Aktif' : 'Arsip'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tidak ada data siswa</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Siswa</DialogTitle>
          </DialogHeader>
          {editStudent && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{editStudent.user.name}</p>
                <p className="text-sm text-muted-foreground">NIS: {editStudent.nis} | {editStudent.class?.name}</p>
              </div>
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor Telepon</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Nomor telepon siswa"
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor WA Orangtua</Label>
                <Input
                  value={editParentWA}
                  onChange={(e) => setEditParentWA(e.target.value)}
                  placeholder="62812345678"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
