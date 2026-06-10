'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Upload, FileText, Send } from 'lucide-react'

interface LeaveRequest {
  id: string
  type: string
  reason: string
  start_date: string
  end_date: string
  status: string
  created_at: string
  evidence_url: string | null
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved_wali_kelas: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved_admin: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  approved_wali_kelas: 'Disetujui Wali',
  approved_admin: 'Disetujui Admin',
  rejected: 'Ditolak',
}

export default function SiswaLeaveRequest() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [form, setForm] = useState({
    start_date: '',
    type: 'izin',
    reason: '',
  })
  const [evidenceName, setEvidenceName] = useState('')

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      if (currentUser?.studentId) {
        const res = await fetch(`/api/leave-requests?student_id=${currentUser.studentId}`, { headers: getAuthHeaders() })
        const json = await res.json()
        if (json.success) setRequests(json.data || [])
      }
    } catch {
      toast.error('Gagal memuat pengajuan')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.studentId])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleSubmit = async () => {
    if (!form.start_date || !form.reason) {
      toast.error('Tanggal dan alasan harus diisi')
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          student_id: currentUser?.studentId,
          type: form.type,
          reason: form.reason,
          start_date: form.start_date,
          end_date: form.start_date,
          evidence_url: evidenceName || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Pengajuan berhasil dikirim')
        setForm({ start_date: '', type: 'izin', reason: '' })
        setEvidenceName('')
        fetchRequests()
      } else {
        toast.error(json.error || 'Gagal mengirim pengajuan')
      }
    } catch {
      toast.error('Gagal mengirim pengajuan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileSelect = () => {
    // Simulated file upload
    setEvidenceName('bukti_izin.jpg')
    toast.success('Bukti berhasil diunggah')
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengajuan Izin/Sakit</h1>
        <p className="text-muted-foreground text-sm">Ajukan izin atau sakit kepada wali kelas</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formulir Pengajuan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Tanggal Izin/Sakit</Label>
            <Input type="date" className="mt-1" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <Label className="text-sm">Jenis</Label>
            <RadioGroup value={form.type} onValueChange={(v) => setForm({ ...form, type: v })} className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="izin" id="izin" />
                <Label htmlFor="izin" className="text-sm cursor-pointer">Izin</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sakit" id="sakit" />
                <Label htmlFor="sakit" className="text-sm cursor-pointer">Sakit</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label className="text-sm">Alasan</Label>
            <Textarea className="mt-1" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Jelaskan alasan izin/sakit Anda..." />
          </div>
          <div>
            <Label className="text-sm">Upload Bukti (Opsional)</Label>
            <div className="mt-1">
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition"
                onClick={handleFileSelect}
              >
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm text-muted-foreground">
                  {evidenceName || 'Klik atau seret file untuk mengunggah'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Gambar, PDF (Maks. 5MB)</p>
              </div>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
            <Send className="h-4 w-4 mr-2" /> {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
          </Button>
        </CardContent>
      </Card>

      {/* My Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengajuan Saya</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Tgl Pengajuan</th>
                  <th className="text-left p-3">Tgl Izin/Sakit</th>
                  <th className="text-left p-3">Jenis</th>
                  <th className="text-left p-3">Alasan</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? requests.map((req) => (
                  <tr key={req.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="p-3">{req.start_date}</td>
                    <td className="p-3">
                      <Badge className={req.type === 'izin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'} variant="secondary">
                        {req.type === 'izin' ? 'Izin' : 'Sakit'}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-xs truncate">{req.reason}</td>
                    <td className="p-3">
                      <Badge className={STATUS_BADGE[req.status] || ''} variant="secondary">
                        {STATUS_LABELS[req.status] || req.status}
                      </Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      Belum ada pengajuan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
