'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { Plus, Pencil, Trash2, MapPin, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/store'

interface LocationItem {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
  class_id: string | null
  class: { id: string; name: string; major: string } | null
  active_qr_count: number
}

interface ClassItem {
  id: string
  name: string
  major: string
}

export default function AdminLocations() {
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form
  const [formName, setFormName] = useState('')
  const [formLatitude, setFormLatitude] = useState('')
  const [formLongitude, setFormLongitude] = useState('')
  const [formRadius, setFormRadius] = useState('')
  const [formClassId, setFormClassId] = useState('')

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/locations', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setLocations(json.data)
    } catch {
      toast.error('Gagal memuat data lokasi')
    } finally {
      setLoading(false)
    }
  }, [])

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
    fetchLocations()
    fetchClasses()
  }, [fetchLocations, fetchClasses])

  const resetForm = () => {
    setFormName('')
    setFormLatitude('')
    setFormLongitude('')
    setFormRadius('')
    setFormClassId('')
    setSelectedLocation(null)
    setIsEditing(false)
  }

  const openAddDialog = () => {
    resetForm()
    setIsEditing(false)
    setShowAddDialog(true)
  }

  const openEditDialog = (loc: LocationItem) => {
    setFormName(loc.name)
    setFormLatitude(String(loc.latitude))
    setFormLongitude(String(loc.longitude))
    setFormRadius(String(loc.radius_meters))
    setFormClassId(loc.class_id || '')
    setSelectedLocation(loc)
    setIsEditing(true)
    setShowAddDialog(true)
  }

  const handleSaveLocation = async () => {
    if (!formName || !formLatitude || !formLongitude || !formRadius) {
      toast.error('Semua field wajib harus diisi')
      return
    }
    setSaving(true)
    try {
      if (isEditing && selectedLocation) {
        const res = await fetch('/api/locations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            id: selectedLocation.id,
            name: formName,
            latitude: parseFloat(formLatitude),
            longitude: parseFloat(formLongitude),
            radius_meters: parseInt(formRadius),
            class_id: formClassId || null,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Lokasi berhasil diperbarui')
          setShowAddDialog(false)
          fetchLocations()
        } else {
          toast.error(json.error || 'Gagal memperbarui lokasi')
        }
      } else {
        const res = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            name: formName,
            latitude: parseFloat(formLatitude),
            longitude: parseFloat(formLongitude),
            radius_meters: parseInt(formRadius),
            class_id: formClassId || null,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Lokasi berhasil ditambahkan')
          setShowAddDialog(false)
          fetchLocations()
        } else {
          toast.error(json.error || 'Gagal menambahkan lokasi')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLocation = async () => {
    if (!selectedLocation) return
    setSaving(true)
    try {
      const res = await fetch(`/api/locations?id=${selectedLocation.id}`, { method: 'DELETE', headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        toast.success('Lokasi berhasil dihapus')
        setShowDeleteDialog(false)
        fetchLocations()
      } else {
        toast.error(json.error || 'Gagal menghapus lokasi')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan Lokasi Absensi</h1>
          <p className="text-muted-foreground text-sm">Atur lokasi dan radius absensi GPS</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Lokasi
        </Button>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardContent className="p-0">
          <div className="h-64 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 rounded-t-xl flex items-center justify-center relative overflow-hidden">
            {/* Map grid pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full" style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }} />
            </div>
            {/* Location markers */}
            {locations.map((loc, i) => (
              <div
                key={loc.id}
                className="absolute"
                style={{
                  left: `${20 + (i * 25) % 60}%`,
                  top: `${25 + (i * 20) % 50}%`,
                }}
              >
                <div className="relative">
                  <MapPin className="h-8 w-8 text-emerald-600 fill-emerald-200 dark:fill-emerald-800" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-black/20 rounded-full blur-sm" />
                  {/* Radius circle */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-emerald-400/30 rounded-full"
                    style={{ width: '80px', height: '80px' }}
                  />
                </div>
              </div>
            ))}
            {/* Center text */}
            <div className="text-center z-10">
              <MapPin className="h-12 w-12 mx-auto text-emerald-600 mb-2" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Peta Lokasi Absensi</p>
              <p className="text-xs text-muted-foreground">{locations.length} lokasi terdaftar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Cards */}
      {locations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{loc.name}</p>
                      {loc.class && (
                        <p className="text-xs text-muted-foreground">Kelas: {loc.class.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(loc)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { setSelectedLocation(loc); setShowDeleteDialog(true) }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latitude</span>
                    <span className="font-mono">{loc.latitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longitude</span>
                    <span className="font-mono">{loc.longitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Radius</span>
                    <Badge variant="outline" className="text-xs">{loc.radius_meters}m</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">QR Aktif</span>
                    <div className="flex items-center gap-1">
                      <QrCode className="h-3 w-3" />
                      <span>{loc.active_qr_count}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Lokasi Absensi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">No</th>
                  <th className="text-left p-3">Nama</th>
                  <th className="text-left p-3">Latitude</th>
                  <th className="text-left p-3">Longitude</th>
                  <th className="text-center p-3">Radius (m)</th>
                  <th className="text-left p-3">Kelas</th>
                  <th className="text-center p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {locations.length > 0 ? locations.map((loc, i) => (
                  <tr key={loc.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{loc.name}</td>
                    <td className="p-3 font-mono text-xs">{loc.latitude}</td>
                    <td className="p-3 font-mono text-xs">{loc.longitude}</td>
                    <td className="p-3 text-center">{loc.radius_meters}</td>
                    <td className="p-3">{loc.class?.name || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(loc)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => { setSelectedLocation(loc); setShowDeleteDialog(true) }} title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">Belum ada data lokasi</td>
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
            <DialogTitle>{isEditing ? 'Edit Lokasi' : 'Tambah Lokasi'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lokasi</Label>
              <Input placeholder="Contoh: Gerbang Utama Sekolah" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input type="number" step="any" placeholder="-6.200000" value={formLatitude} onChange={(e) => setFormLatitude(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input type="number" step="any" placeholder="106.816666" value={formLongitude} onChange={(e) => setFormLongitude(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Radius (meter)</Label>
              <Input type="number" placeholder="100" value={formRadius} onChange={(e) => setFormRadius(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kelas (opsional)</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
              >
                <option value="">Semua Kelas</option>
                {classList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} - {c.major}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleSaveLocation} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Lokasi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus lokasi <strong>{selectedLocation?.name}</strong>?
              QR Code yang terkait lokasi ini juga akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLocation} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
