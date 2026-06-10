'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Pencil, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface ClassItem {
  id: string
  name: string
  major: string
  academic_year_id: string
  academic_year: { id: string; name: string }
  student_count: number
  teachers: { id: string; name: string; email: string }[]
  created_at: string
}

interface TeacherItem {
  id: string
  user: { name: string; email: string }
  classes: { id: string; name: string }[]
}

interface AcademicYear {
  id: string
  name: string
  is_active: boolean
}

export default function AdminClasses() {
  const { currentUser } = useAppStore()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formMajor, setFormMajor] = useState('')
  const [formAcademicYearId, setFormAcademicYearId] = useState('')
  const [assignTeacherIds, setAssignTeacherIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/classes', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setClasses(json.data)
    } catch {
      toast.error('Gagal memuat data kelas')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/teachers', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setTeachers(json.data)
    } catch {
      // silently fail
    }
  }, [])

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await fetch('/api/academic-years', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setAcademicYears(json.data)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchClasses()
    fetchTeachers()
    fetchAcademicYears()
  }, [fetchClasses, fetchTeachers, fetchAcademicYears])

  const resetForm = () => {
    setFormName('')
    setFormMajor('')
    setFormAcademicYearId(academicYears.find((ay) => ay.is_active)?.id || '')
    setIsEditing(false)
    setSelectedClass(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsEditing(false)
    setShowAddDialog(true)
  }

  const openEditDialog = (cls: ClassItem) => {
    setFormName(cls.name)
    setFormMajor(cls.major)
    setFormAcademicYearId(cls.academic_year_id)
    setSelectedClass(cls)
    setIsEditing(true)
    setShowAddDialog(true)
  }

  const openAssignDialog = (cls: ClassItem) => {
    setSelectedClass(cls)
    setAssignTeacherIds(cls.teachers.map((t) => t.id))
    setShowAssignDialog(true)
  }

  const openDeleteDialog = (cls: ClassItem) => {
    setSelectedClass(cls)
    setShowDeleteDialog(true)
  }

  const handleSaveClass = async () => {
    if (!formName || !formMajor || !formAcademicYearId) {
      toast.error('Semua field harus diisi')
      return
    }
    setSaving(true)
    try {
      if (isEditing && selectedClass) {
        const res = await fetch('/api/classes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            id: selectedClass.id,
            name: formName,
            major: formMajor,
            academic_year_id: formAcademicYearId,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Kelas berhasil diperbarui')
          setShowAddDialog(false)
          fetchClasses()
        } else {
          toast.error(json.error || 'Gagal memperbarui kelas')
        }
      } else {
        const res = await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            name: formName,
            major: formMajor,
            academic_year_id: formAcademicYearId,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Kelas berhasil ditambahkan')
          setShowAddDialog(false)
          fetchClasses()
        } else {
          toast.error(json.error || 'Gagal menambahkan kelas')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleAssignTeachers = async () => {
    if (!selectedClass) return
    setSaving(true)
    try {
      const res = await fetch('/api/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          id: selectedClass.id,
          teacher_ids: assignTeacherIds,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Wali kelas berhasil ditetapkan')
        setShowAssignDialog(false)
        fetchClasses()
      } else {
        toast.error(json.error || 'Gagal menetapkan wali kelas')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClass = async () => {
    if (!selectedClass) return
    setSaving(true)
    try {
      const res = await fetch(`/api/classes?id=${selectedClass.id}`, { method: 'DELETE', headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        toast.success('Kelas berhasil dihapus')
        setShowDeleteDialog(false)
        fetchClasses()
      } else {
        toast.error(json.error || 'Gagal menghapus kelas')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const toggleTeacherAssignment = (teacherId: string) => {
    setAssignTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    )
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Kelas</h1>
          <p className="text-muted-foreground text-sm">Kelola data kelas dan jurusan</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Kelas
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">No</th>
                  <th className="text-left p-3">Nama Kelas</th>
                  <th className="text-left p-3">Jurusan</th>
                  <th className="text-left p-3">Wali Kelas</th>
                  <th className="text-center p-3">Jumlah Siswa</th>
                  <th className="text-center p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {classes.length > 0 ? classes.map((cls, i) => (
                  <tr key={cls.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{cls.name}</td>
                    <td className="p-3">{cls.major}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {cls.teachers.length > 0 ? cls.teachers.map((t) => (
                          <Badge key={t.id} variant="secondary" className="text-xs">{t.name}</Badge>
                        )) : (
                          <span className="text-xs text-muted-foreground">Belum ditetapkan</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">{cls.student_count}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(cls)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAssignDialog(cls)} title="Assign Wali Kelas">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => openDeleteDialog(cls)} title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">Belum ada data kelas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Kelas' : 'Tambah Kelas'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className">Nama Kelas</Label>
              <Input
                id="className"
                placeholder="Contoh: X RPL"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classMajor">Jurusan</Label>
              <Input
                id="classMajor"
                placeholder="Contoh: Rekayasa Perangkat Lunak"
                value={formMajor}
                onChange={(e) => setFormMajor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academicYear">Tahun Ajaran</Label>
              <select
                id="academicYear"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formAcademicYearId}
                onChange={(e) => setFormAcademicYearId(e.target.value)}
              >
                <option value="">Pilih Tahun Ajaran</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} {ay.is_active ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleSaveClass} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Wali Kelas Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Wali Kelas - {selectedClass?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {teachers.length > 0 ? teachers.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Checkbox
                    id={`teacher-${t.id}`}
                    checked={assignTeacherIds.includes(t.id)}
                    onCheckedChange={() => toggleTeacherAssignment(t.id)}
                  />
                  <label htmlFor={`teacher-${t.id}`} className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium">{t.user.name}</p>
                    <p className="text-xs text-muted-foreground">{t.user.email}</p>
                  </label>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data guru</p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Batal</Button>
            <Button onClick={handleAssignTeachers} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kelas <strong>{selectedClass?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan dan semua data terkait kelas ini akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
