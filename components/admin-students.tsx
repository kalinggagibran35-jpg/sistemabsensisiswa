'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus, Pencil, Trash2, Download, Upload, Eye, Archive, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import DataTablePagination from '@/components/ui/data-table-pagination'

interface StudentItem {
  id: string
  nis: string
  user_id: string
  class_id: string
  parent_whatsapp: string | null
  face_registered: boolean
  face_descriptor_count: number
  status: string
  user: { id: string; name: string; email: string; phone: string | null; photo_url: string | null }
  class: { id: string; name: string; major: string }
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

export default function AdminStudents() {
  const { currentUser, setCurrentPage, setSelectedStudentId } = useAppStore()
  const [students, setStudents] = useState<StudentItem[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formNis, setFormNis] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formParentWA, setFormParentWA] = useState('')
  const [formPassword, setFormPassword] = useState('')

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<string[][]>([])
  const [importHeaders, setImportHeaders] = useState<string[]>([])
  const [importRows, setImportRows] = useState<Record<string, string>[]>([])
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: ImportError[] } | null>(null)
  const [importType, setImportType] = useState<'import' | 'edit'>('import')
  const [importing, setImporting] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterClass) params.set('class_id', filterClass)
      if (filterStatus) params.set('status', filterStatus)
      if (searchQuery) params.set('search', searchQuery)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      const res = await fetch(`/api/students?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        setStudents(json.data)
        setTotal(json.total)
      }
    } catch {
      toast.error('Gagal memuat data siswa')
    } finally {
      setLoading(false)
    }
  }, [filterClass, filterStatus, searchQuery, page, pageSize])

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
    fetchStudents()
  }, [fetchStudents])

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormNis('')
    setFormClassId('')
    setFormParentWA('')
    setFormPassword('')
    setSelectedStudent(null)
    setIsEditing(false)
  }

  const openAddDialog = () => {
    resetForm()
    setIsEditing(false)
    setShowAddDialog(true)
  }

  const openEditDialog = (student: StudentItem) => {
    setFormName(student.user.name)
    setFormEmail(student.user.email)
    setFormNis(student.nis)
    setFormClassId(student.class_id)
    setFormParentWA(student.parent_whatsapp || '')
    setFormPassword('')
    setSelectedStudent(student)
    setIsEditing(true)
    setShowAddDialog(true)
  }

  const handleSaveStudent = async () => {
    if (!formName || !formEmail || !formNis || !formClassId) {
      toast.error('Semua field wajib harus diisi')
      return
    }
    if (!isEditing && !formPassword) {
      toast.error('Password harus diisi untuk siswa baru')
      return
    }
    setSaving(true)
    try {
      if (isEditing && selectedStudent) {
        const res = await fetch(`/api/students?id=${selectedStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            nis: formNis,
            class_id: formClassId,
            parent_whatsapp: formParentWA || null,
            ...(formPassword ? { password: formPassword } : {}),
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Siswa berhasil diperbarui')
          setShowAddDialog(false)
          fetchStudents()
        } else {
          toast.error(json.error || 'Gagal memperbarui siswa')
        }
      } else {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            nis: formNis,
            class_id: formClassId,
            parent_whatsapp: formParentWA || null,
            password: formPassword,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Siswa berhasil ditambahkan')
          setShowAddDialog(false)
          fetchStudents()
        } else {
          toast.error(json.error || 'Gagal menambahkan siswa')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return
    setSaving(true)
    try {
      const res = await fetch(`/api/students?id=${selectedStudent.id}`, { method: 'DELETE', headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        toast.success('Siswa berhasil dihapus')
        setShowDeleteDialog(false)
        fetchStudents()
      } else {
        toast.error(json.error || 'Gagal menghapus siswa')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveStudent = async () => {
    if (!selectedStudent) return
    setSaving(true)
    try {
      const newStatus = selectedStudent.status === 'active' ? 'archived' : 'active'
      const res = await fetch(`/api/students?id=${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(newStatus === 'archived' ? 'Siswa berhasil diarsipkan' : 'Siswa berhasil diaktifkan kembali')
        setShowArchiveDialog(false)
        fetchStudents()
      } else {
        toast.error(json.error || 'Gagal mengubah status')
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

  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[]; preview: string[][] } => {
    const lines = text.split('\n').filter((line) => line.trim())
    if (lines.length === 0) return { headers: [], rows: [], preview: [] }

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
    return { headers, rows, preview }
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'import' | 'edit') => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportType(type)
      setImportResult(null)
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const { headers, rows, preview } = parseCSV(text)
        setImportHeaders(headers)
        setImportRows(rows)
        setImportPreview(preview)
      }
      reader.readAsText(file)
      setShowImportDialog(true)
    }
    // Reset file input
    e.target.value = ''
  }

  const handleConfirmImport = async () => {
    if (importRows.length === 0) {
      toast.error('Tidak ada data untuk diimport')
      return
    }
    setImporting(true)
    try {
      const apiType = importType === 'edit' ? 'students-edit' : 'students'
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          type: apiType,
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
        fetchStudents()
      } else {
        toast.error(json.error || 'Gagal mengimport data')
      }
    } catch {
      toast.error('Terjadi kesalahan saat import')
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = async (mode: 'import' | 'edit') => {
    try {
      const res = await fetch(`/api/export-template?type=students&mode=${mode}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Gagal mengunduh template')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = mode === 'import' ? 'template_import_siswa.csv' : 'template_edit_massal_siswa.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Template berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh template')
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Siswa</h1>
          <p className="text-muted-foreground text-sm">Kelola data siswa terdaftar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Siswa
          </Button>
          <Button variant="outline" onClick={() => handleDownloadTemplate('import')}>
            <Download className="h-4 w-4 mr-2" />
            Unduh Template Import
          </Button>
          <Button variant="outline" onClick={() => { if (importFileRef.current) importFileRef.current.click() }}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Import
          </Button>
          <Button variant="outline" onClick={() => handleDownloadTemplate('edit')}>
            <Download className="h-4 w-4 mr-2" />
            Unduh Template Edit Massal
          </Button>
          <Button variant="outline" onClick={() => { if (editFileRef.current) editFileRef.current.click() }}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Edit Massal
          </Button>
        </div>
        <input type="file" ref={importFileRef} className="hidden" accept=".csv" onChange={(e) => handleImportFile(e, 'import')} />
        <input type="file" ref={editFileRef} className="hidden" accept=".csv" onChange={(e) => handleImportFile(e, 'edit')} />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIS..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filterClass}
              onChange={(e) => { setFilterClass(e.target.value); setPage(1) }}
            >
              <option value="">Semua Kelas</option>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="archived">Arsip</option>
            </select>
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
                  <th className="text-left p-3">NIS</th>
                  <th className="text-left p-3">Kelas</th>
                  <th className="text-left p-3">WA Orangtua</th>
                  <th className="text-center p-3">Wajah</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-center p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? students.map((s, i) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{(page - 1) * pageSize + i + 1}</td>
                    <td className="p-3 font-medium">{s.user.name}</td>
                    <td className="p-3">{s.nis}</td>
                    <td className="p-3">{s.class?.name || '-'}</td>
                    <td className="p-3">{s.parent_whatsapp || '-'}</td>
                    <td className="p-3 text-center">
                      <Badge variant={s.face_registered ? 'default' : 'destructive'} className="text-xs">
                        {s.face_registered ? 'Terdaftar' : 'Belum'}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={s.status === 'active' ? 'default' : 'secondary'} className={`text-xs ${s.status === 'active' ? 'bg-emerald-600' : ''}`}>
                        {s.status === 'active' ? 'Aktif' : 'Arsip'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(s)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => { setSelectedStudent(s); setShowDeleteDialog(true) }} title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedStudent(s); setShowArchiveDialog(true) }} title={s.status === 'active' ? 'Arsipkan' : 'Aktifkan'}>
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewProfile(s.id)} title="Lihat Profil">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">Tidak ada data siswa</td>
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

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Siswa' : 'Tambah Siswa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input placeholder="Nama lengkap siswa" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="Email siswa" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>NIS</Label>
              <Input placeholder="Nomor Induk Siswa" value={formNis} onChange={(e) => setFormNis(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kelas</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
              >
                <option value="">Pilih Kelas</option>
                {classList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} - {c.major}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nomor WA Orangtua</Label>
              <Input placeholder="62812345678" value={formParentWA} onChange={(e) => setFormParentWA(e.target.value)} />
            </div>
            {!isEditing && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="Password akun siswa" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
              </div>
            )}
            {isEditing && (
              <div className="space-y-2">
                <Label>Password (kosongkan jika tidak diubah)</Label>
                <Input type="password" placeholder="Password baru (opsional)" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleSaveStudent} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) { setImportFile(null); setImportPreview([]); setImportRows([]); setImportHeaders([]); setImportResult(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{importType === 'edit' ? 'Edit Massal Siswa' : 'Import Data Siswa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!importFile ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
                onClick={() => {
                  if (importType === 'edit' && editFileRef.current) editFileRef.current.click()
                  else if (importFileRef.current) importFileRef.current.click()
                }}
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
            <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus siswa <strong>{selectedStudent?.user.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedStudent?.status === 'active' ? 'Arsipkan Siswa' : 'Aktifkan Kembali Siswa'}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStudent?.status === 'active'
                ? `Apakah Anda yakin ingin mengarsipkan siswa ${selectedStudent?.user.name}? Siswa yang diarsipkan tidak akan muncul di daftar aktif.`
                : `Apakah Anda yakin ingin mengaktifkan kembali siswa ${selectedStudent?.user.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveStudent} disabled={saving}>
              {saving ? 'Memproses...' : 'Konfirmasi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
