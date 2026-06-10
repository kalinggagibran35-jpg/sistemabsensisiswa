'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/store'
import { Calendar, CheckCircle, Archive, Eye, AlertTriangle } from 'lucide-react'

interface AcademicYear {
  id: string
  name: string
  is_active: boolean
  is_archived: boolean
  created_at: string
  class_count: number
  total_students: number
}

export default function AdminAcademicYear() {
  const [loading, setLoading] = useState(true)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [changeDialogOpen, setChangeDialogOpen] = useState(false)
  const [newYearName, setNewYearName] = useState('')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null)
  const [archiveData, setArchiveData] = useState<AcademicYear | null>(null)

  const fetchYears = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/academic-years', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setAcademicYears(json.data)
    } catch {
      toast.error('Gagal memuat data tahun ajaran')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchYears() }, [fetchYears])

  const activeYear = academicYears.find((y) => y.is_active)
  const archivedYears = academicYears.filter((y) => y.is_archived && !y.is_active)

  const handleChangeYear = () => {
    if (!newYearName.trim()) {
      toast.error('Nama tahun ajaran harus diisi')
      return
    }
    setConfirmDialogOpen(true)
  }

  const confirmChangeYear = async () => {
    try {
      // Archive current active year
      if (activeYear) {
        await fetch('/api/academic-years', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ id: activeYear.id, is_active: false, is_archived: true }),
        })
      }
      // Create new active year
      const res = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: newYearName, is_active: true }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Tahun ajaran berhasil diganti')
        setChangeDialogOpen(false)
        setConfirmDialogOpen(false)
        setNewYearName('')
        fetchYears()
      } else {
        toast.error(json.error || 'Gagal mengganti tahun ajaran')
      }
    } catch {
      toast.error('Gagal mengganti tahun ajaran')
    }
  }

  const handleArchiveView = (year: AcademicYear) => {
    setArchiveData(year)
    setArchiveDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tahun Ajaran</h1>
        <p className="text-muted-foreground text-sm">Kelola tahun ajaran aktif dan arsip</p>
      </div>

      {/* Active Year Card */}
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tahun Ajaran Aktif</p>
                <p className="text-2xl font-bold">{activeYear?.name || 'Belum ada'}</p>
                {activeYear && (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-muted-foreground">{activeYear.class_count} kelas</span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{activeYear.total_students} siswa</span>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={() => setChangeDialogOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" /> Ganti Tahun Ajaran Aktif
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Archived Years */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="h-4 w-4" /> Tahun Ajaran Diarsipkan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {archivedYears.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Nama Tahun Ajaran</th>
                    <th className="text-center p-3">Jumlah Kelas</th>
                    <th className="text-center p-3">Total Siswa</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-center p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedYears.map((y) => (
                    <tr key={y.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{y.name}</td>
                      <td className="p-3 text-center">{y.class_count}</td>
                      <td className="p-3 text-center">{y.total_students}</td>
                      <td className="p-3">
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" variant="secondary">Diarsipkan</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Button variant="outline" size="sm" onClick={() => handleArchiveView(y)}>
                          <Eye className="h-4 w-4 mr-1" /> Lihat Data
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">Belum ada tahun ajaran yang diarsipkan</p>
          )}
        </CardContent>
      </Card>

      {/* Change Year Dialog */}
      <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ganti Tahun Ajaran Aktif</DialogTitle>
            <DialogDescription>Masukkan nama tahun ajaran baru yang akan diaktifkan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Tahun Ajaran Baru</Label>
              <Input className="mt-1" value={newYearName} onChange={(e) => setNewYearName(e.target.value)} placeholder="Contoh: 2026/2027" />
            </div>
            {activeYear && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">Perhatian</p>
                  <p className="text-yellow-600 dark:text-yellow-400">Tahun ajaran <strong>{activeYear.name}</strong> akan diarsipkan. Semua data kehadiran akan disimpan dan dapat dilihat kembali.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeDialogOpen(false)}>Batal</Button>
            <Button onClick={handleChangeYear}>Lanjutkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Tahun Ajaran</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengganti tahun ajaran aktif menjadi <strong>{newYearName}</strong>.
              Tahun ajaran sebelumnya akan diarsipkan. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChangeYear}>Ya, Ganti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Data Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Data Tahun Ajaran {archiveData?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{archiveData?.class_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Kelas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{archiveData?.total_students || 0}</p>
                  <p className="text-xs text-muted-foreground">Siswa</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Data kehadiran tahun ajaran ini tersimpan dalam arsip dan dapat diakses melalui laporan.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
