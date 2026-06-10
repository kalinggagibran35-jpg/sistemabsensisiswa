'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Settings, Clock, Users, Calendar, Palette, Plus, Trash2, Upload, Save } from 'lucide-react'

interface Holiday {
  id: string
  date: string
  name: string
}

export default function AdminSettings() {
  const { darkMode, setDarkMode } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false)
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' })

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/settings', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setSettings(json.data)
    } catch {
      toast.error('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await fetch('/api/holidays', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setHolidays(json.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchHolidays()
  }, [fetchSettings, fetchHolidays])

  const saveSettings = async (updated: Record<string, string>) => {
    try {
      setSaving(true)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ settings: updated }),
      })
      const json = await res.json()
      if (json.success) {
        setSettings(json.data)
        toast.success('Pengaturan berhasil disimpan')
      } else {
        toast.error('Gagal menyimpan pengaturan')
      }
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      toast.error('Tanggal dan nama hari libur harus diisi')
      return
    }
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newHoliday),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Hari libur berhasil ditambahkan')
        setHolidayDialogOpen(false)
        setNewHoliday({ date: '', name: '' })
        fetchHolidays()
      } else {
        toast.error(json.error || 'Gagal menambahkan hari libur')
      }
    } catch {
      toast.error('Gagal menambahkan hari libur')
    }
  }

  const handleDeleteHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/holidays?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        toast.success('Hari libur berhasil dihapus')
        fetchHolidays()
      }
    } catch {
      toast.error('Gagal menghapus hari libur')
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Sistem</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi pengaturan aplikasi absensi</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general"><Settings className="h-4 w-4 mr-1" /> Umum</TabsTrigger>
          <TabsTrigger value="attendance-time"><Clock className="h-4 w-4 mr-1" /> Jam Absensi</TabsTrigger>
          <TabsTrigger value="attendance-config"><Users className="h-4 w-4 mr-1" /> Kehadiran</TabsTrigger>
          <TabsTrigger value="holidays"><Calendar className="h-4 w-4 mr-1" /> Libur</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="h-4 w-4 mr-1" /> Tampilan</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pengaturan Umum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Nama Sekolah</Label>
                <Input
                  className="mt-1"
                  value={settings.school_name || ''}
                  onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm">Logo Sekolah</Label>
                <div className="mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Klik atau seret file untuk mengunggah logo</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG (Maks. 2MB)</p>
                </div>
              </div>
              <div>
                <Label className="text-sm">Tahun Ajaran Aktif</Label>
                <Input className="mt-1" value={settings.academic_year || '-'} disabled />
              </div>
              <Button onClick={() => saveSettings({ school_name: settings.school_name })} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Time Settings */}
        <TabsContent value="attendance-time" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pengaturan Jam Absensi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Jam Masuk</Label>
                  <Input
                    type="time"
                    className="mt-1"
                    value={settings.attendance_start_time || '07:00'}
                    onChange={(e) => setSettings({ ...settings, attendance_start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm">Jam Terlambat</Label>
                  <Input
                    type="time"
                    className="mt-1"
                    value={settings.late_threshold_time || '07:30'}
                    onChange={(e) => setSettings({ ...settings, late_threshold_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm">Jam Keluar Minimum</Label>
                  <Input
                    type="time"
                    className="mt-1"
                    value={settings.checkout_min_time || '15:00'}
                    onChange={(e) => setSettings({ ...settings, checkout_min_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm">Batas Waktu Absensi Keluar</Label>
                  <Input
                    type="time"
                    className="mt-1"
                    value={settings.checkout_max_time || '16:00'}
                    onChange={(e) => setSettings({ ...settings, checkout_max_time: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={() => saveSettings({
                attendance_start_time: settings.attendance_start_time,
                late_threshold_time: settings.late_threshold_time,
                checkout_min_time: settings.checkout_min_time,
                checkout_max_time: settings.checkout_max_time,
              })} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Config */}
        <TabsContent value="attendance-config" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pengaturan Kehadiran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Ambang Batas Kehadiran (%)</Label>
                  <span className="text-sm font-bold">{settings.attendance_threshold || '80'}%</span>
                </div>
                <Slider
                  value={[parseInt(settings.attendance_threshold || '80')]}
                  min={50}
                  max={100}
                  step={1}
                  onValueChange={(v) => setSettings({ ...settings, attendance_threshold: String(v[0]) })}
                />
                <p className="text-xs text-muted-foreground mt-1">Siswa di bawah ambang batas ini akan ditandai</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Threshold Pengenalan Wajah</Label>
                  <span className="text-sm font-bold">{settings.face_recognition_threshold || '0.6'}</span>
                </div>
                <Slider
                  value={[parseFloat(settings.face_recognition_threshold || '0.6')]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(v) => setSettings({ ...settings, face_recognition_threshold: String(v[0].toFixed(2)) })}
                />
                <p className="text-xs text-muted-foreground mt-1">Semakin tinggi = semakin ketat pengenalan</p>
              </div>
              <Button onClick={() => saveSettings({
                attendance_threshold: settings.attendance_threshold,
                face_recognition_threshold: settings.face_recognition_threshold,
              })} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays */}
        <TabsContent value="holidays" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Kalender Cuti/Libur</CardTitle>
                <Button size="sm" onClick={() => setHolidayDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Tambah Hari Libur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {holidays.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-2">Tanggal</th>
                        <th className="text-left p-2">Nama Hari Libur</th>
                        <th className="text-center p-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.map((h) => (
                        <tr key={h.id} className="border-b hover:bg-muted/30">
                          <td className="p-2">{new Date(h.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                          <td className="p-2">{h.name}</td>
                          <td className="p-2 text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteHoliday(h.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">Belum ada hari libur yang ditambahkan</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pengaturan Tampilan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Mode Gelap</p>
                  <p className="text-sm text-muted-foreground">Aktifkan tampilan gelap untuk kenyamanan mata</p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Holiday Dialog */}
      <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Hari Libur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Tanggal</Label>
              <Input type="date" className="mt-1" value={newHoliday.date} onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm">Nama Hari Libur</Label>
              <Input className="mt-1" value={newHoliday.name} onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })} placeholder="Contoh: Hari Kemerdekaan" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHolidayDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddHoliday}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
