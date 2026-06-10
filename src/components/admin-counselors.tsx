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
import { Plus, Pencil, Trash2, Download, Upload, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore, getAuthHeaders } from '@/lib/store'

interface CounselorItem {
  id: string
  user_id: string
  phone: string | null
  user: { id: string; name: string; email: string; phone: string | null }
}

interface ImportError {
  row: number
  field: string
  message: string
}

export default function AdminCounselors() {
  const { currentUser } = useAppStore()
  const [counselors, setCounselors] = useState<CounselorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedCounselor, setSelectedCounselor] = useState<CounselorItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formPhone, setFormPhone] = useState('')

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<string[][]>([])
  const [importRows, setImportRows] = useState<Record<string, string>[]>([])
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: ImportError[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)

  const fetchCounselors = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/counselors?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setCounselors(json.data)
    } catch {
      toast.error('Gagal memuat data guru BK')
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    fetchCounselors()
  }, [fetchCounselors])

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormPhone('')
    setSelectedCounselor(null)
    setIsEditing(false)
  }

  const openAddDialog = () => {
    resetForm()
    setIsEditing(false)
    setShowAddDialog(true)
  }

  const openEditDialog = (counselor: CounselorItem) => {
    setFormName(counselor.user.name)
    setFormEmail(counselor.user.email)
    setFormPassword('')
    setFormPhone(counselor.phone || counselor.user.phone || '')
    setSelectedCounselor(counselor)
    setIsEditing(true)
    setShowAddDialog(true)
  }

  const handleSaveCounselor = async () => {
    if (!formName || !formEmail) {
      toast.error('Nama dan email harus diisi')
      return
    }
    if (!isEditing && !formPassword) {
      toast.error('Password harus diisi untuk guru BK baru')
      return
    }
    setSaving(true)
    try {
      if (isEditing && selectedCounselor) {
        const res = await fetch('/api/counselors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            id: selectedCounselor.id,
            name: formName,
            phone: formPhone || null,
            ...(formPassword ? { password: formPassword } : {}),
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Guru BK berhasil diperbarui')
          setShowAddDialog(false)
          fetchCounselors()
        } else {
          toast.error(json.error || 'Gagal memperbarui guru BK')
        }
      } else {
        const res = await fetch('/api/counselors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            password: formPassword,
            phone: formPhone || null,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Guru BK berhasil ditambahkan')
          setShowAddDialog(false)
          fetchCounselors()
        } else {
          toast.error(json.error || 'Gagal menambahkan guru BK')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCounselor = async () => {
    if (!selectedCounselor) return
    setSaving(true)
    try {
      const res = await fetch(`/api/counselors?id=${selectedCounselor.id}`, { method: 'DELETE', headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        toast.success('Guru BK berhasil dihapus')
        setShowDeleteDialog(false)
        fetchCounselors()
      } else {
        toast.error(json.error || 'Gagal menghapus guru BK')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadTemplate = async (mode: 'import' | 'edit') => {
    try {
      const res = await fetch(`/api/export-template?type=counselors&mode=${mode}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Gagal mengunduh template')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = mode === 'import' ? 'template_import_guru_bk.csv' : 'template_edit_guru_bk.csv'
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
          type: 'counselors',
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
        fetchCounselors()
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
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Guru BK</h1>
          <p className="text-muted-foreground text-sm">Kelola data guru bimbingan konseling</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Guru BK
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
                  <th className="text-left p-3">No. WA</th>
                  <th className="text-center p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {counselors.length > 0 ? counselors.map((c, i) => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{c.user.name}</td>
                    <td className="p-3">{c.user.email}</td>
                    <td className="p-3">{c.phone || c.user.phone || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(c)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => { setSelectedCounselor(c); setShowDeleteDialog(true) }} title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">Belum ada data guru BK</td>
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
            <DialogTitle>{isEditing ? 'Edit Guru BK' : 'Tambah Guru BK'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input placeholder="Nama lengkap" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="Email guru BK" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isEditing ? 'Password (kosongkan jika tidak diubah)' : 'Password'}</Label>
              <Input type="password" placeholder="Password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>No. WA</Label>
              <Input placeholder="62812345678" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleSaveCounselor} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) { setImportFile(null); setImportPreview([]); setImportRows([]); setImportResult(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Data Guru BK</DialogTitle>
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
            <AlertDialogTitle>Hapus Guru BK</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus guru BK <strong>{selectedCounselor?.user.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCounselor} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
