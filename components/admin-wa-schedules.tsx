'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Plus, Pause, Play, Send, FileEdit, BarChart3, History, Trash2,
} from 'lucide-react'
import { getAuthHeaders } from '@/lib/store'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface ScheduleLog {
  id: string
  sent_at: string
  status: string
  total_sent: number
  total_failed: number
  details: string | null
}

interface Schedule {
  id: string
  name: string
  type: string
  send_time: string
  day_of_week: string | null
  recipient_type: string
  class_filter: string | null
  template_message: string | null
  status: string
  logs: ScheduleLog[]
}

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function AdminWASchedules() {
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [statsDialogOpen, setStatsDialogOpen] = useState(false)
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [form, setForm] = useState({
    name: '', type: 'daily', send_time: '07:30', day_of_week: 'Senin',
    recipient_type: 'orangtua', class_filter: '', template_message: '', status: 'active',
  })
  const [templateText, setTemplateText] = useState('')

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/wa-schedules', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setSchedules(json.data)
    } catch {
      toast.error('Gagal memuat jadwal')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  const handleSave = async () => {
    if (!form.name || !form.send_time || !form.recipient_type) {
      toast.error('Nama, waktu kirim, dan tipe penerima harus diisi')
      return
    }
    try {
      const url = '/api/wa-schedules'
      const method = selectedSchedule ? 'PUT' : 'POST'
      const body = selectedSchedule ? { id: selectedSchedule.id, ...form } : form
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.success) {
        toast.success(selectedSchedule ? 'Jadwal berhasil diperbarui' : 'Jadwal berhasil ditambahkan')
        setDialogOpen(false)
        setSelectedSchedule(null)
        fetchSchedules()
      } else {
        toast.error(json.error || 'Gagal menyimpan jadwal')
      }
    } catch {
      toast.error('Gagal menyimpan jadwal')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/wa-schedules?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        toast.success('Jadwal berhasil dihapus')
        fetchSchedules()
      }
    } catch {
      toast.error('Gagal menghapus jadwal')
    }
  }

  const handleTogglePause = async (schedule: Schedule) => {
    const newStatus = schedule.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch('/api/wa-schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id: schedule.id, status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(newStatus === 'paused' ? 'Jadwal dijeda' : 'Jadwal diaktifkan kembali')
        fetchSchedules()
      }
    } catch {
      toast.error('Gagal mengubah status')
    }
  }

  const handleManualSend = (schedule: Schedule) => {
    toast.success(`Laporan "${schedule.name}" berhasil dikirim secara manual`)
  }

  const openTemplateEditor = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setTemplateText(schedule.template_message || 'Assalamualaikum, {{nama_siswa}} dari kelas {{kelas}} hari ini {{status_kehadiran}}. Waktu masuk: {{waktu_masuk}}. Persentase kehadiran bulan ini: {{persentase_kehadiran}}%.')
    setTemplateDialogOpen(true)
  }

  const saveTemplate = async () => {
    if (!selectedSchedule) return
    try {
      const res = await fetch('/api/wa-schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id: selectedSchedule.id, template_message: templateText }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Template berhasil disimpan')
        setTemplateDialogOpen(false)
        fetchSchedules()
      }
    } catch {
      toast.error('Gagal menyimpan template')
    }
  }

  const renderPreview = () => {
    if (!templateText) return ''
    return templateText
      .replace('{{nama_siswa}}', 'Ahmad Rizki')
      .replace('{{kelas}}', 'X RPL')
      .replace('{{status_kehadiran}}', 'Hadir')
      .replace('{{waktu_masuk}}', '07:15')
      .replace('{{persentase_kehadiran}}', '92')
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Aktif</Badge>
      case 'paused': return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Paused</Badge>
      default: return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">Inactive</Badge>
    }
  }

  const typeLabel = (type: string) => type === 'daily' ? 'Harian' : 'Mingguan'
  const recipientLabel = (r: string) => {
    switch (r) {
      case 'orangtua': return 'Orangtua'
      case 'wali_kelas': return 'Wali Kelas'
      case 'both': return 'Keduanya'
      default: return r
    }
  }

  const openAddDialog = () => {
    setSelectedSchedule(null)
    setForm({ name: '', type: 'daily', send_time: '07:30', day_of_week: 'Senin', recipient_type: 'orangtua', class_filter: '', template_message: '', status: 'active' })
    setDialogOpen(true)
  }

  const openEditDialog = (s: Schedule) => {
    setSelectedSchedule(s)
    setForm({
      name: s.name, type: s.type, send_time: s.send_time, day_of_week: s.day_of_week || 'Senin',
      recipient_type: s.recipient_type, class_filter: s.class_filter || '', template_message: s.template_message || '', status: s.status,
    })
    setDialogOpen(true)
  }

  // Stats
  const statsCards = selectedSchedule ? [
    { title: 'Rata-rata Waktu Kirim', value: '3.2 detik', sub: 'Bulan ini' },
    { title: 'Tingkat Keberhasilan', value: '96.5%', sub: 'Dari 200 pengiriman' },
    { title: 'Total Terkirim', value: String(selectedSchedule.logs?.filter((l) => l.status === 'berhasil').length || 0), sub: 'Sepanjang waktu' },
    { title: 'Total Gagal', value: String(selectedSchedule.logs?.filter((l) => l.status === 'gagal').length || 0), sub: 'Sepanjang waktu' },
  ] : []

  const deliveryTrendData = [
    { name: 'Minggu 1', Terkirim: 18, Gagal: 1 },
    { name: 'Minggu 2', Terkirim: 20, Gagal: 0 },
    { name: 'Minggu 3', Terkirim: 19, Gagal: 2 },
    { name: 'Minggu 4', Terkirim: 21, Gagal: 1 },
  ]

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jadwal Laporan WhatsApp</h1>
          <p className="text-muted-foreground text-sm">Atur jadwal pengiriman laporan kehadiran via WhatsApp</p>
        </div>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Jadwal
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Nama Jadwal</th>
                  <th className="text-left p-3">Jenis</th>
                  <th className="text-left p-3">Waktu Kirim</th>
                  <th className="text-left p-3">Hari</th>
                  <th className="text-left p-3">Penerima</th>
                  <th className="text-left p-3">Filter Kelas</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length > 0 ? schedules.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3">{typeLabel(s.type)}</td>
                    <td className="p-3">{s.send_time}</td>
                    <td className="p-3">{s.type === 'weekly' ? s.day_of_week : 'Setiap hari'}</td>
                    <td className="p-3">{recipientLabel(s.recipient_type)}</td>
                    <td className="p-3">{s.class_filter || 'Semua'}</td>
                    <td className="p-3">{statusBadge(s.status)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title={s.status === 'active' ? 'Pause' : 'Resume'} onClick={() => handleTogglePause(s)}>
                          {s.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Kirim Manual" onClick={() => handleManualSend(s)}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Customisasi Template" onClick={() => openTemplateEditor(s)}>
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Statistik" onClick={() => { setSelectedSchedule(s); setStatsDialogOpen(true) }}>
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Log Pengiriman" onClick={() => { setSelectedSchedule(s); setLogDialogOpen(true) }}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEditDialog(s)}>
                          <FileEdit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Hapus" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Belum ada jadwal laporan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Nama Jadwal</Label>
              <Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama jadwal" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Jenis Laporan</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Waktu Pengiriman</Label>
                <Input type="time" className="mt-1" value={form.send_time} onChange={(e) => setForm({ ...form, send_time: e.target.value })} />
              </div>
            </div>
            {form.type === 'weekly' && (
              <div>
                <Label className="text-sm">Hari Pengiriman</Label>
                <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HARI.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-sm">Penerima</Label>
              <Select value={form.recipient_type} onValueChange={(v) => setForm({ ...form, recipient_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="orangtua">Orangtua</SelectItem>
                  <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                  <SelectItem value="both">Keduanya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Filter Kelas (opsional)</Label>
              <Input className="mt-1" value={form.class_filter} onChange={(e) => setForm({ ...form, class_filter: e.target.value })} placeholder="Contoh: X RPL" />
            </div>
            <div>
              <Label className="text-sm">Template Pesan</Label>
              <Textarea className="mt-1" rows={3} value={form.template_message} onChange={(e) => setForm({ ...form, template_message: e.target.value })} placeholder="Gunakan {{nama_siswa}}, {{kelas}}, {{status_kehadiran}}, dll" />
            </div>
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customisasi Template Pesan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Template Pesan</Label>
              <Textarea className="mt-1" rows={5} value={templateText} onChange={(e) => setTemplateText(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">
                Placeholder: {'{{nama_siswa}}'}, {'{{kelas}}'}, {'{{status_kehadiran}}'}, {'{{waktu_masuk}}'}, {'{{persentase_kehadiran}}'}
              </p>
            </div>
            <div>
              <Label className="text-sm">Preview</Label>
              <div className="mt-1 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm whitespace-pre-wrap border">
                {renderPreview()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Batal</Button>
            <Button onClick={saveTemplate}>Simpan Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Statistik Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {statsCards.map((c) => (
                <Card key={c.title}>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">{c.title}</p>
                    <p className="text-lg font-bold">{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tren Pengiriman</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deliveryTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="Terkirim" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Gagal" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  <th className="text-left p-2">Waktu Kirim</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-center p-2">Terkirim</th>
                  <th className="text-center p-2">Gagal</th>
                  <th className="text-left p-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {selectedSchedule?.logs && selectedSchedule.logs.length > 0 ? selectedSchedule.logs.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="p-2">{l.sent_at ? new Date(l.sent_at).toLocaleString('id-ID') : '-'}</td>
                    <td className="p-2">
                      <Badge className={l.status === 'berhasil' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} variant="secondary">
                        {l.status === 'berhasil' ? 'Berhasil' : 'Gagal'}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">{l.total_sent}</td>
                    <td className="p-2 text-center">{l.total_failed}</td>
                    <td className="p-2 text-xs text-muted-foreground">{l.details || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Belum ada log pengiriman</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
