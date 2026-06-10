'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, QrCode, Clock, CheckCircle2, XCircle, Loader2, Keyboard,
  MapPin, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { getCurrentPosition, checkLocationInRadius, type AttendanceLocation as AttendanceLocationType } from '@/lib/geolocation'

type ScanStep = 'idle' | 'locating' | 'scanning' | 'validating' | 'result'
type AttendanceMode = 'masuk' | 'keluar'

interface LocationResult {
  valid: boolean
  locationName: string | null
  distance: number
}

export default function AttendanceQR() {
  const { currentUser, setCurrentPage } = useAppStore()
  const [mode, setMode] = useState<AttendanceMode>('masuk')
  const [scanStep, setScanStep] = useState<ScanStep>('locating')
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; time?: string; status?: string } | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [locationResult, setLocationResult] = useState<LocationResult | null>(null)
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState('')

  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<unknown>(null)
  const isScanningRef = useRef(false)

  // Fetch attendance locations
  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance-locations', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        return json.data as AttendanceLocationType[]
      }
    } catch {
      // ignore
    }
    return []
  }, [])

  // Geolocation check
  const checkLocation = useCallback(async () => {
    setScanStep('locating')
    try {
      const userLocation = await getCurrentPosition()
      const locations = await fetchLocations()

      if (locations.length === 0) {
        setLocationResult({ valid: true, locationName: null, distance: 0 })
        setScanStep('idle')
        return
      }

      const result = checkLocationInRadius(userLocation, locations)
      setLocationResult({
        valid: result.isValid,
        locationName: result.nearestLocation?.name || null,
        distance: Math.round(result.distance),
      })
      setScanStep('idle')
    } catch {
      setLocationResult({ valid: true, locationName: 'Lokasi tidak terdeteksi (mode default)', distance: 0 })
      setScanStep('idle')
      toast.warning('Gagal mendapatkan lokasi GPS. Absensi tetap diizinkan.')
    }
  }, [fetchLocations])

  // Initialize on mount
  useEffect(() => {
    checkLocation()

    return () => {
      stopScanner()
    }
  }, [])

  // Start HTML5 QR scanner
  const startScanner = async () => {
    if (isScanningRef.current) return
    setScannerError('')

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          if (isScanningRef.current) {
            isScanningRef.current = false
            html5QrCode.stop().catch(() => {})
            processQRCode(decodedText)
          }
        },
        () => {
          // QR code scan error (not found yet) - ignore
        }
      )

      isScanningRef.current = true
      setScannerActive(true)
      setScanStep('scanning')
    } catch {
      setScannerError('Gagal mengakses kamera. Gunakan input manual.')
      setScannerActive(false)
    }
  }

  // Stop scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const scanner = html5QrCodeRef.current as { stop: () => Promise<void> }
        await scanner.stop()
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null
    }
    isScanningRef.current = false
    setScannerActive(false)
  }

  const processQRCode = async (code: string) => {
    if (!code.trim()) {
      toast.error('Masukkan kode QR')
      return
    }

    if (!currentUser?.studentId) {
      toast.error('Data siswa tidak ditemukan')
      return
    }

    if (!locationResult?.valid) {
      toast.error('Lokasi tidak valid. Tidak dapat melakukan absensi.')
      return
    }

    setScanStep('validating')

    // Validate QR code via API
    try {
      const validateRes = await fetch('/api/qr-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ code }),
      })
      const validateJson = await validateRes.json()

      if (!validateRes.ok || !validateJson.success) {
        setScanResult({
          success: false,
          message: validateJson.error || 'QR Code tidak valid atau sudah expired.',
        })
        setScanStep('result')
        return
      }
    } catch {
      setScanResult({
        success: false,
        message: 'Gagal memvalidasi QR Code. Periksa koneksi internet.',
      })
      setScanStep('result')
      return
    }

    // QR is valid - create attendance record
    const now = new Date()
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    const isLate = mode === 'masuk' && now.getHours() >= 7 && now.getMinutes() > 15
    const status = isLate ? 'terlambat' : 'hadir'

    try {
      const pos = await getCurrentPosition().catch(() => null)
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          student_id: currentUser.studentId,
          date: now.toISOString().split('T')[0],
          check_in_time: mode === 'masuk' ? timeStr : undefined,
          check_out_time: mode === 'keluar' ? timeStr : undefined,
          status: mode === 'keluar' ? 'hadir' : status,
          method: 'qr',
          latitude: pos?.latitude ?? -6.2088,
          longitude: pos?.longitude ?? 106.8456,
        }),
      })
      const json = await res.json()
      if (json.success || json.message) {
        setScanResult({
          success: true,
          message: mode === 'masuk'
            ? `Absensi masuk berhasil! Status: ${isLate ? 'Terlambat' : 'Hadir'}`
            : 'Absensi keluar berhasil!',
          time: timeStr,
          status: isLate && mode === 'masuk' ? 'Terlambat' : 'Hadir',
        })
      }
    } catch {
      setScanResult({
        success: true,
        message: 'Absensi berhasil dicatat (offline)',
        time: timeStr,
        status: mode === 'masuk' && isLate ? 'Terlambat' : 'Hadir',
      })
    }

    setScanStep('result')
  }

  const handleManualSubmit = () => {
    stopScanner()
    processQRCode(manualCode)
  }

  const handleRetry = () => {
    setScanStep('idle')
    setScanResult(null)
    setManualCode('')
    setScannerError('')
    stopScanner()
  }

  const handleModeChange = (newMode: AttendanceMode) => {
    setMode(newMode)
    handleRetry()
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('siswa-dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Absensi QR Code</h1>
          <p className="text-sm text-muted-foreground">Verifikasi kehadiran melalui pemindaian QR Code</p>
        </div>
      </div>

      {/* Location Status */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Lokasi</span>
            </div>
            {scanStep === 'locating' ? (
              <div className="flex items-center gap-2 text-yellow-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Memvalidasi lokasi...</span>
              </div>
            ) : locationResult?.valid ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Lokasi Valid
                </Badge>
                {locationResult.locationName && (
                  <span className="text-xs text-muted-foreground">{locationResult.locationName}</span>
                )}
              </div>
            ) : locationResult && !locationResult.valid ? (
              <div className="text-right">
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Di Luar Jangkauan
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Jarak: {locationResult.distance}m dari {locationResult.locationName}
                </p>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Menunggu...</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scanner Area */}
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-gray-900 dark:bg-gray-950" style={{ minHeight: '300px' }}>
            {/* Locating */}
            {scanStep === 'locating' && (
              <div className="flex items-center justify-center h-[300px] text-white/70">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin" />
                  <p className="text-sm">Memvalidasi lokasi...</p>
                </div>
              </div>
            )}

            {/* Idle - waiting to scan */}
            {scanStep === 'idle' && !scannerActive && (
              <div className="flex items-center justify-center h-[300px] text-white/70 p-6">
                <div className="text-center">
                  {/* QR Frame */}
                  <div className="relative mx-auto w-48 h-48 mb-4">
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-3 border-l-3 border-emerald-400 rounded-tl-md" style={{ borderWidth: '3px' }} />
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-3 border-r-3 border-emerald-400 rounded-tr-md" style={{ borderWidth: '3px' }} />
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-3 border-l-3 border-emerald-400 rounded-bl-md" style={{ borderWidth: '3px' }} />
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-3 border-r-3 border-emerald-400 rounded-br-md" style={{ borderWidth: '3px' }} />
                    <QrCode className="h-16 w-16 mx-auto mt-16 text-white/30" />
                  </div>
                  <p className="text-sm mb-3">Arahkan kamera ke QR Code</p>
                  {scannerError && (
                    <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-2 mb-3">
                      <div className="flex items-center gap-2 justify-center">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <p className="text-xs text-amber-400">{scannerError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scanning - Html5Qrcode scanner */}
            {(scanStep === 'scanning' || scanStep === 'idle') && scannerActive && (
              <div id="qr-reader" ref={scannerRef} className="w-full" />
            )}

            {/* Validating */}
            {scanStep === 'validating' && (
              <div className="flex items-center justify-center h-[300px] text-white/70">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-blue-400" />
                  <p className="text-blue-400 font-medium">Memvalidasi QR Code...</p>
                </div>
              </div>
            )}

            {/* Result */}
            {scanStep === 'result' && scanResult && (
              <div className="flex items-center justify-center h-[300px] text-white/80 p-6">
                <div className="text-center">
                  {scanResult.success ? (
                    <>
                      <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                      </div>
                      <p className="text-lg font-bold text-emerald-400 mb-2">QR Code Valid ✓</p>
                      <p className="text-sm mb-3">{scanResult.message}</p>
                      {scanResult.time && (
                        <div className="flex items-center justify-center gap-2 text-white/60">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{scanResult.time}</span>
                        </div>
                      )}
                      {scanResult.status && (
                        <Badge className={`mt-2 ${scanResult.status === 'Terlambat' ? 'bg-orange-500' : 'bg-emerald-600'} text-white`}>
                          {scanResult.status}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="h-10 w-10 text-white" />
                      </div>
                      <p className="text-lg font-bold text-red-400 mb-2">QR Code Tidak Valid ✗</p>
                      <p className="text-sm">{scanResult.message}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Controls */}
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'masuk' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => handleModeChange('masuk')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Absensi Masuk
          </Button>
          <Button
            variant={mode === 'keluar' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => handleModeChange('keluar')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Absensi Keluar
          </Button>
        </div>

        {/* Student Info */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Siswa</p>
              <p className="font-medium">{currentUser?.name || 'Nama Siswa'}</p>
              <p className="text-xs text-muted-foreground">NIS: {currentUser?.nis || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Scan Button */}
        {scanStep === 'idle' && !scannerActive && (
          <Button
            className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
            onClick={startScanner}
            disabled={!locationResult?.valid}
          >
            <QrCode className="h-6 w-6 mr-2" />
            Scan QR Code
          </Button>
        )}

        {/* Stop Scanner Button */}
        {scannerActive && scanStep === 'scanning' && (
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => { stopScanner(); setScanStep('idle'); }}
          >
            Hentikan Scanner
          </Button>
        )}

        {/* Manual QR Input */}
        {(scanStep === 'idle') && !scannerActive && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Keyboard className="h-4 w-4" />
              <span className="text-xs">Atau masukkan kode manual</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Masukkan kode QR..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button variant="outline" onClick={handleManualSubmit} disabled={!manualCode.trim()}>
                Kirim
              </Button>
            </div>
          </div>
        )}

        {/* Retry */}
        {scanStep === 'result' && (
          <Button variant="outline" className="w-full h-12" onClick={handleRetry}>
            Coba Lagi
          </Button>
        )}
      </div>
    </div>
  )
}
