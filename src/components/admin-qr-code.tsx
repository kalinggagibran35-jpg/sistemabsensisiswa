'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { QrCode, Plus, Printer, RefreshCw, Copy, Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/store'
import { generateQRCodeDataURL } from '@/lib/qr-code'

interface LocationItem {
  id: string
  name: string
}

interface QRCodeItem {
  id: string
  code: string
  location_id: string | null
  is_active: boolean
  expires_at: string
  created_at: string
  location: { id: string; name: string } | null
}

export default function AdminQRCode() {
  const [qrCodes, setQRCodes] = useState<QRCodeItem[]>([])
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [expiresIn, setExpiresIn] = useState('30')
  const [activeQR, setActiveQR] = useState<QRCodeItem | null>(null)
  const [qrImageDataURL, setQrImageDataURL] = useState<string | null>(null)

  const fetchQRCodes = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/qr-codes', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        setQRCodes(json.data)
        const active = json.data.find((q: QRCodeItem) => q.is_active)
        if (active) setActiveQR(active)
      }
    } catch {
      toast.error('Gagal memuat data QR Code')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setLocations(json.data)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchQRCodes()
    fetchLocations()
  }, [fetchQRCodes, fetchLocations])

  // Generate QR code image when activeQR changes
  useEffect(() => {
    if (activeQR) {
      generateQRCodeDataURL(activeQR.code).then(setQrImageDataURL).catch(() => setQrImageDataURL(null))
    } else {
      setQrImageDataURL(null)
    }
  }, [activeQR])

  const handleGenerateQR = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/qr-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          location_id: selectedLocationId || null,
          expires_in_minutes: parseInt(expiresIn) || 30,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('QR Code berhasil dibuat')
        setActiveQR(json.data)
        setShowGenerateDialog(false)
        fetchQRCodes()
      } else {
        toast.error(json.error || 'Gagal membuat QR Code')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Kode QR disalin ke clipboard')
  }

  const handlePrint = () => {
    toast.info('Fitur cetak akan membuka dialog cetak browser')
    setTimeout(() => window.print(), 500)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const exp = new Date(expiresAt)
    const diff = exp.getTime() - now.getTime()
    if (diff <= 0) return 'Kadaluarsa'
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes} menit lagi`
    const hours = Math.floor(minutes / 60)
    return `${hours} jam ${minutes % 60} menit lagi`
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Generate QR Code</h1>
          <p className="text-muted-foreground text-sm">Buat kode QR untuk absensi siswa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchQRCodes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowGenerateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate QR Code Baru
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Active QR Code Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Aktif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeQR ? (
              <>
                {/* QR Code Display - Real QR Code Image */}
                <div className="flex justify-center">
                  <div className="relative p-4 bg-white rounded-xl border-2 border-dashed border-emerald-300">
                    {qrImageDataURL ? (
                      <img
                        src={qrImageDataURL}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                      </div>
                    )}
                    {/* Active indicator */}
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-emerald-600 text-xs">
                        <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                        Aktif
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* QR Code Details */}
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Kode QR</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono flex-1 break-all">{activeQR.code}</code>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleCopyCode(activeQR.code)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Lokasi
                      </p>
                      <p className="text-sm font-medium">{activeQR.location?.name || 'Semua lokasi'}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Berlaku Hingga
                      </p>
                      <p className="text-sm font-medium">{getTimeRemaining(activeQR.expires_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Print Button */}
                <Button variant="outline" className="w-full" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak QR Code
                </Button>
              </>
            ) : (
              <div className="text-center py-12">
                <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-30" />
                <p className="text-muted-foreground">Belum ada QR Code aktif</p>
                <p className="text-xs text-muted-foreground mt-1">Klik &quot;Generate QR Code Baru&quot; untuk membuat</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right - QR Code History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="text-left p-2">Kode</th>
                    <th className="text-left p-2">Lokasi</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-left p-2">Kadaluarsa</th>
                  </tr>
                </thead>
                <tbody>
                  {qrCodes.length > 0 ? qrCodes.map((qr) => (
                    <tr key={qr.id} className="border-b hover:bg-muted/30">
                      <td className="p-2">
                        <code className="text-xs font-mono">
                          {qr.code.substring(0, 8)}...
                        </code>
                      </td>
                      <td className="p-2">{qr.location?.name || '-'}</td>
                      <td className="p-2 text-center">
                        <Badge variant={qr.is_active ? 'default' : 'secondary'} className={`text-xs ${qr.is_active ? 'bg-emerald-600' : ''}`}>
                          {qr.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {formatDate(qr.expires_at)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">Belum ada riwayat QR Code</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate QR Code Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lokasi Absensi</Label>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lokasi</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Berlaku Selama</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
              >
                <option value="15">15 menit</option>
                <option value="30">30 menit</option>
                <option value="60">1 jam</option>
                <option value="120">2 jam</option>
                <option value="480">8 jam</option>
              </select>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ QR Code sebelumnya untuk lokasi yang sama akan otomatis dinonaktifkan.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Batal</Button>
            <Button onClick={handleGenerateQR} disabled={generating}>
              {generating ? 'Membuat...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
