'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Pencil, Trash2, Download, Upload, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore, getAuthHeaders } from '@/lib/store'

interface TeacherItem {
  id: string
  user_id: string
  phone: string | null
  user: { id: string; name: string; email: string; phone: string | null }
  classes: { id: string; name: string; major: string; student_count: number }[]
}

interface ClassItem {
  id: string
  name: string
  major: string
}

interface ImportError {
  row: number
  field: string
  message: string
}

export default function AdminTeachers() {
  const { currentUser } = useAppStore()
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formClassIds, setFormClassIds] = useState<string[]>([])

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<string[][]>([])
  const [importRows, setImportRows] = useState<Record<string, string>[]>([])
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: ImportError[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/teachers?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setTeachers(json.data)
    } catch {
      toast.error('Gagal memuat data wali kelas')
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setClassList(json.data)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormPhone('')
    setFormClassIds([])
    setSelectedTeacher(null)
    setIsEditing(false)
  }

  const openAddDialog = () => {
    resetForm()
    setIsEditing(false)
    setShowAddDialog(true)
  }

  const openEditDialog = (teacher: TeacherItem) => {
    setFormName(teacher.user.name)
    setFormEmail(teacher.user.email)
    setFormPassword('')
    setFormPhone(teacher.phone || teacher.user.phone || '')
    setFormClassIds(teacher.classes.map((c) => c.id))
    setSelectedTeacher(teacher)
    setIsEditing(true)
    setShowAddDialog(true)
  }

  const toggleClassAssignment = (classId: string) => {
    setFormClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    )
  }

  const handleSaveTeacher = async () => {
    if (!formName || !formEmail) {
      toast.error('Nama dan email harus diisi')
      return
    }
    if (!isEditing && !formPassword) {
      toast.error('Password harus diisi untuk guru baru')
      return
    }
    setSaving(true)
    try {
      if (isEditing && selectedTeacher) {
        const res = await fetch('/api/teachers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            id: selectedTeacher.id,
            name: formName,
            phone: formPhone || null,
            class_ids: formClassIds,
            ...(formPassword ? { password: formPassword } : {}),
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Wali kelas berhasil diperbarui')
          setShowAddDialog(false)
          fetchTeachers()
        } else {
          toast.error(json.error || 'Gagal memperbarui wali kelas')
        }
      } else {
        const res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            password: formPassword,
            phone: formPhone || null,
            class_ids: formClassIds,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Wali kelas berhasil ditambahkan')
          setShowAddDialog(false)
          fetchTeachers()
        } else {
          toast.error(json.error || 'Gagal menambahkan wali kelas')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return
    setSaving(true)
    try {
      const res = await fetch(`/api/teachers?id=${selectedTeacher.id}`, { method: 'DELETE', headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        toast.success('Wali kelas berhasil dihapus')
        setShowDeleteDialog(false)
        fetchTeachers()
      } else {
        toast.error(json.error || 'Gagal menghapus wali kelas')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadTemplate = async (mode: 'import' | 'edit') => {
    try {
      const res = await fetch(`/api/export-template?type=teachers&mode=${mode}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Gagal mengunduh template')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = mode === 'import' ? 'template_import_wali_kelas.csv' : 'template_edit_wali_kelas.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Template berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh template')
    }
  }

  const parseCSV = (text: string): { rows: Record<string, string>[]; preview: string[][] } => {
    const lines = text.split('\n').filter((line) => line.trim())
    if (lines.length === 0) return { rows: [], preview: [] }

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0])
    const rows: Record<string, string>[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx] || ''
      })
      if (Object.values(row).some((v) => v)) {
        rows.push(row)
      }
    }

    const preview = lines.slice(0, 6).map((line) => parseCSVLine(line))
    return { rows, preview }
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportResult(null)
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const { rows, preview } = parseCSV(text)
        setImportRows(rows)
        setImportPreview(preview)
      }
      reader.readAsText(file)
      setShowImportDialog(true)
    }
    e.target.value = ''
  }

  const handleConfirmImport = async () => {
    if (importRows.length === 0) {
      toast.error('Tidak ada data untuk diimport')
      return
    }
    setImporting(true)
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          type: 'teachers',
          data: importRows,
          userName: currentUser?.name || 'Admin',
          userRole: currentUser?.role || 'admin',
          userId: currentUser?.id,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setImportResult(json.data)
        if (json.data.failed === 0) {
          toast.success(`Import berhasil: ${json.data.success} data`)
        } else {
          toast.warning(`Import selesai: ${json.data.success} berhasil, ${json.data.failed} gagal`)
        }
        fetchTeachers()
      } else {
        toast.error(json.error || 'Gagal mengimport data')
      }
    } catch {
      toast.error('Terjadi kesalahan saat import')
    } finally {
      setImporting(false)
    }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Wali Kelas</h1>
          <p className="text-muted-foreground text-sm">Kelola data wali kelas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Wali Kelas
          </Button>
          <Button variant="outline" onClick={() => handleDownloadTemplate('import')}>
            <Download className="h-4 w-4 mr-2" />
            Unduh Template
          </Button>
          <Button variant="outline" onClick={() => { if (importFileRef.current) importFileRef.current.click() }}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
        <input type="file" ref={importFileRef} className="hidden" accept=".csv" onChange={handleImportFile} />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
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
                  <th className="text-left p-3">Nama</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Kelas Diampu</th>
                  <th className="text-left p-3">No. WA</th>
                  <th className="text-center p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length > 0 ? teachers.map((t, i) => (
                  <tr key={t.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{t.user.name}</td>
                    <td className="p-3">{t.user.email}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {t.classes.length > 0 ? t.classes.map((c) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">{c.name}</Badge>
                        )) : (
                          <span className="text-xs text-muted-foreground">Belum ditetapkan</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{t.phone || t.user.phone || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(t)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => { setSelectedTeacher(t); setShowDeleteDialog(true) }} title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">Belum ada data wali kelas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Wali Kelas' : 'Tambah Wali Kelas'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input placeholder="Nama lengkap" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="Email guru" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isEditing ? 'Password (kosongkan jika tidak diubah)' : 'Password'}</Label>
              <Input type="password" placeholder="Password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>No. WA</Label>
              <Input placeholder="62812345678" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kelas Diampu</Label>
              <ScrollArea className="max-h-40 border rounded-md p-2">
                <div className="space-y-2">
                  {classList.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`cls-${c.id}`}
                        checked={formClassIds.includes(c.id)}
                        onCheckedChange={() => toggleClassAssignment(c.id)}
                      />
                      <label htmlFor={`cls-${c.id}`} className="text-sm cursor-pointer">
                        {c.name} - {c.major}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleSaveTeacher} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) { setImportFile(null); setImportPreview([]); setImportRows([]); setImportResult(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Data Wali Kelas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!importFile ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
                onClick={() => importFileRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Klik atau seret file CSV ke sini</p>
                <p className="text-xs text-muted-foreground mt-1">Format: .csv</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{importFile.name}</span>
                  <Badge variant="secondary" className="text-xs">{(importFile.size / 1024).toFixed(1)} KB</Badge>
                  <Badge variant="outline" className="text-xs">{importRows.length} baris data</Badge>
                </div>
                {importPreview.length > 0 && (
                  <div className="overflow-x-auto max-h-48">
                    <p className="text-sm font-medium mb-2">Preview Data:</p>
                    <table className="w-full text-xs border">
                      <thead>
                        <tr className="bg-muted">
                          {importPreview[0].map((cell, j) => (
                            <th key={j} className="p-2 border text-left font-medium">{cell}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(1).map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j} className="p-2 border">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {importResult && (
                  <div className="space-y-2">
                    <div className={`p-3 rounded-lg ${importResult.failed > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                      <p className={`text-sm font-medium ${importResult.failed > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        Import selesai: {importResult.success} berhasil, {importResult.failed} gagal
                      </p>
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="max-h-32 overflow-y-auto border rounded-lg p-2">
                        <p className="text-xs font-medium mb-1">Detail Error:</p>
                        {importResult.errors.map((err, i) => (
                          <p key={i} className="text-xs text-red-600">
                            Baris {err.row} - {err.field}: {err.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Tutup</Button>
            {importFile && !importResult && (
              <Button onClick={handleConfirmImport} disabled={importing}>
                {importing ? 'Mengimport...' : `Konfirmasi Import (${importRows.length} data)`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Wali Kelas</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus wali kelas <strong>{selectedTeacher?.user.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeacher} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
