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
  Search, Eye, Pencil, ScanFace, Users, Mail, Phone, User,
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

interface ClassItem {
  id: string
  name: string
  major: string
}

export default function WaliStudents() {
  const { currentUser, setCurrentPage, setSelectedStudentId } = useAppStore()
  const [students, setStudents] = useState<StudentItem[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('')

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editStudent, setEditStudent] = useState<StudentItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editParentWA, setEditParentWA] = useState('')
  const [saving, setSaving] = useState(false)

  // Face registration dialog
  const [showFaceDialog, setShowFaceDialog] = useState(false)
  const [faceStudent, setFaceStudent] = useState<StudentItem | null>(null)
  const [faceProcessing, setFaceProcessing] = useState(false)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('status', 'active')
      if (filterClass) params.set('class_id', filterClass)
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/students?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        // Filter to only show students from wali kelas assigned classes
        if (!filterClass && classList.length > 0) {
          const myClassIds = classList.map((c) => c.id)
          setStudents(json.data.filter((s: StudentItem) => myClassIds.includes(s.class_id)))
        } else {
          setStudents(json.data)
        }
      }
    } catch {
      toast.error('Gagal memuat data siswa')
    } finally {
      setLoading(false)
    }
  }, [filterClass, searchQuery, classList])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        // In a real app, filter by teacher assignment
        // For now show all classes
        setClassList(json.data)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    if (classList.length > 0 || filterClass || searchQuery) {
      fetchStudents()
    }
  }, [fetchStudents, classList, filterClass, searchQuery])

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

  const openFaceDialog = (student: StudentItem) => {
    setFaceStudent(student)
    setShowFaceDialog(true)
  }

  const handleFaceRegister = async () => {
    if (!faceStudent) return
    setFaceProcessing(true)
    try {
      // Simulate face registration process
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const res = await fetch(`/api/students?id=${faceStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: faceStudent.user.name,
          email: faceStudent.user.email,
          nis: faceStudent.nis,
          class_id: faceStudent.class_id,
          parent_whatsapp: faceStudent.parent_whatsapp,
          face_registered: true,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Wajah ${faceStudent.user.name} berhasil didaftarkan`)
        setShowFaceDialog(false)
        fetchStudents()
      } else {
        toast.error(json.error || 'Gagal mendaftarkan wajah')
      }
    } catch {
      toast.error('Terjadi kesalahan saat mendaftarkan wajah')
    } finally {
      setFaceProcessing(false)
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
        <h1 className="text-2xl font-bold">Daftar Siswa</h1>
        <p className="text-muted-foreground text-sm">Data siswa di kelas yang Anda ampu</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{students.length}</p>
            <p className="text-xs text-muted-foreground">Total Siswa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{students.filter((s) => s.face_registered).length}</p>
            <p className="text-xs text-muted-foreground">Wajah Terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{students.filter((s) => !s.face_registered).length}</p>
            <p className="text-xs text-muted-foreground">Belum Daftar Wajah</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{classList.length}</p>
            <p className="text-xs text-muted-foreground">Kelas Diampu</p>
          </CardContent>
        </Card>
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
              <option value="">Semua Kelas Saya</option>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">No</th>
                  <th className="text-left p-3">Nama</th>
                  <th className="text-left p-3">NIS</th>
                  <th className="text-left p-3">Kelas</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-center p-3">Status Wajah</th>
                  <th className="text-center p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? students.map((s, i) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="font-medium">{s.user.name}</span>
                      </div>
                    </td>
                    <td className="p-3">{s.nis}</td>
                    <td className="p-3">{s.class?.name || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[180px]">{s.user.email}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={s.face_registered ? 'default' : 'secondary'} className="text-xs">
                        {s.face_registered ? 'Terdaftar' : 'Belum Terdaftar'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewProfile(s.id)}
                          title="Lihat Profil"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(s)}
                          title="Edit Data"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openFaceDialog(s)}
                          title="Daftarkan Wajah"
                        >
                          <ScanFace className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p>Tidak ada data siswa</p>
                      <p className="text-xs mt-1">Belum ada siswa di kelas yang Anda ampu</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Student Dialog */}
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
                <Label className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Nomor Telepon
                </Label>
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

      {/* Face Registration Dialog */}
      <Dialog open={showFaceDialog} onOpenChange={setShowFaceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrasi Wajah</DialogTitle>
          </DialogHeader>
          {faceStudent && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{faceStudent.user.name}</p>
                <p className="text-sm text-muted-foreground">NIS: {faceStudent.nis} | {faceStudent.class?.name}</p>
              </div>
              {faceStudent.face_registered ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                  <ScanFace className="h-10 w-10 mx-auto text-emerald-600 mb-2" />
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">Wajah sudah terdaftar</p>
                  <p className="text-xs text-muted-foreground mt-1">Anda dapat mendaftarkan ulang wajah jika diperlukan</p>
                </div>
              ) : (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                  <ScanFace className="h-10 w-10 mx-auto text-orange-600 mb-2" />
                  <p className="font-medium text-orange-700 dark:text-orange-400">Wajah belum terdaftar</p>
                  <p className="text-xs text-muted-foreground mt-1">Siswa perlu mendaftarkan wajah untuk absensi wajah</p>
                </div>
              )}
              {/* Simulated camera area */}
              <div className="relative bg-gray-900 dark:bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-40 border-2 border-dashed border-white/30 rounded-full" />
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${faceProcessing ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-white/70 text-xs">{faceProcessing ? 'Memproses...' : 'Kamera Aktif'}</span>
                </div>
                <p className="text-white/50 text-sm">Simulasi Kamera</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFaceDialog(false)}>Batal</Button>
            <Button onClick={handleFaceRegister} disabled={faceProcessing} className="bg-emerald-600 hover:bg-emerald-700">
              {faceProcessing ? 'Memproses...' : 'Ambil Foto & Daftarkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
