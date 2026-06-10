'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, ScanFace, Clock, MapPin, CheckCircle2, XCircle, Loader2, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { loadModels, detectFace, isDemoMode as checkDemoMode, findBestMatch, descriptorFromArray } from '@/lib/face-recognition'
import { getCurrentPosition, checkLocationInRadius, type AttendanceLocation as AttendanceLocationType } from '@/lib/geolocation'

type ScanStep = 'idle' | 'locating' | 'location_result' | 'loading_models' | 'detecting' | 'recognizing' | 'result'
type AttendanceMode = 'masuk' | 'keluar'

interface LocationResult {
  valid: boolean
  locationName: string | null
  distance: number
}

export default function AttendanceFace() {
  const { currentUser, setCurrentPage } = useAppStore()
  const [mode, setMode] = useState<AttendanceMode>('masuk')
  const [scanStep, setScanStep] = useState<ScanStep>('locating')
  const [locationResult, setLocationResult] = useState<LocationResult | null>(null)
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; time?: string; status?: string } | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [demoCountdown, setDemoCountdown] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
        // No locations configured - allow by default
        setLocationResult({ valid: true, locationName: null, distance: 0 })
        setScanStep('location_result')
        return
      }

      const result = checkLocationInRadius(userLocation, locations)
      setLocationResult({
        valid: result.isValid,
        locationName: result.nearestLocation?.name || null,
        distance: Math.round(result.distance),
      })
      setScanStep('location_result')
    } catch {
      // Geolocation failed - allow anyway in demo mode
      setLocationResult({ valid: true, locationName: 'Lokasi tidak terdeteksi (mode default)', distance: 0 })
      setScanStep('location_result')
      toast.warning('Gagal mendapatkan lokasi GPS. Absensi tetap diizinkan.')
    }
  }, [fetchLocations])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch {
      toast.error('Gagal mengakses kamera. Pastikan izin kamera diberikan.')
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [])

  // Initialize on mount - use ref to avoid setState in effect
  const initRef = useRef(false)
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const init = async () => {
      await checkLocation()
      await startCamera()
    }
    init()

    return () => {
      stopCamera()
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  })

  const handleScan = async () => {
    if (!locationResult?.valid) {
      toast.error('Lokasi tidak valid. Tidak dapat melakukan absensi.')
      return
    }

    if (!currentUser?.studentId) {
      toast.error('Data siswa tidak ditemukan')
      return
    }

    setScanResult(null)

    // Try loading models
    setScanStep('loading_models')
    let modelsLoaded = false
    try {
      modelsLoaded = await loadModels()
      setDemoMode(!modelsLoaded)
    } catch {
      setDemoMode(true)
    }

    if (demoMode || !modelsLoaded) {
      // Demo mode: auto-succeed after countdown
      setScanStep('detecting')
      setDemoCountdown(3)

      countdownRef.current = setInterval(() => {
        setDemoCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      demoTimerRef.current = setTimeout(async () => {
        setScanStep('recognizing')
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Demo: always succeed
        const now = new Date()
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        const isLate = mode === 'masuk' && now.getHours() >= 7 && now.getMinutes() > 15
        const status = isLate ? 'terlambat' : 'hadir'

        try {
          const pos = await getCurrentPosition().catch(() => null)
          await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              student_id: currentUser.studentId,
              date: now.toISOString().split('T')[0],
              check_in_time: mode === 'masuk' ? timeStr : undefined,
              check_out_time: mode === 'keluar' ? timeStr : undefined,
              status: mode === 'keluar' ? 'hadir' : status,
              method: 'face',
              latitude: pos?.latitude ?? -6.2088,
              longitude: pos?.longitude ?? 106.8456,
            }),
          })
        } catch {
          // offline fallback
        }

        setScanResult({
          success: true,
          message: mode === 'masuk'
            ? `Absensi masuk berhasil! Status: ${isLate ? 'Terlambat' : 'Hadir'}`
            : 'Absensi keluar berhasil!',
          time: timeStr,
          status: isLate && mode === 'masuk' ? 'Terlambat' : 'Hadir',
        })
        setScanStep('result')
      }, 3500)

      return
    }

    // Real face-api.js mode
    setScanStep('detecting')

    try {
      if (!videoRef.current) {
        setScanResult({ success: false, message: 'Kamera tidak tersedia' })
        setScanStep('result')
        return
      }

      const detection = await detectFace(videoRef.current)
      setScanStep('recognizing')

      if (!detection) {
        setScanResult({
          success: false,
          message: 'Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.',
        })
        setScanStep('result')
        return
      }

      // Fetch stored descriptors
      const descRes = await fetch(`/api/face-descriptors?student_id=${currentUser.studentId}`, { headers: getAuthHeaders() })
      const descJson = await descRes.json()

      let matched = false

      if (descJson.success && descJson.data && descJson.data.length > 0) {
        const storedDescriptors = descJson.data.map((d: { id: string; descriptor_data: string }) => ({
          id: d.id,
          descriptor: descriptorFromArray(JSON.parse(d.descriptor_data)),
        }))

        // Get threshold from settings
        let threshold = 0.6
        try {
          const settingsRes = await fetch('/api/settings', { headers: getAuthHeaders() })
          const settingsJson = await settingsRes.json()
          if (settingsJson.success && settingsJson.data?.face_recognition_threshold) {
            threshold = parseFloat(settingsJson.data.face_recognition_threshold)
          }
        } catch {
          // use default
        }

        const matchResult = findBestMatch(detection.descriptor, storedDescriptors, threshold)
        matched = !!matchResult
      } else {
        // No stored descriptors - try matching against all students
        const allDescRes = await fetch('/api/face-descriptors', { headers: getAuthHeaders() })
        const allDescJson = await allDescRes.json()
        if (allDescJson.success && allDescJson.data && allDescJson.data.length > 0) {
          const storedDescriptors = allDescJson.data
            .filter((d: { student_id: string }) => d.student_id === currentUser.studentId)
            .map((d: { id: string; descriptor_data: string }) => ({
              id: d.id,
              descriptor: descriptorFromArray(JSON.parse(d.descriptor_data)),
            }))

          if (storedDescriptors.length > 0) {
            let threshold = 0.6
            try {
              const settingsRes = await fetch('/api/settings', { headers: getAuthHeaders() })
              const settingsJson = await settingsRes.json()
              if (settingsJson.success && settingsJson.data?.face_recognition_threshold) {
                threshold = parseFloat(settingsJson.data.face_recognition_threshold)
              }
            } catch {
              // use default
            }
            const matchResult = findBestMatch(detection.descriptor, storedDescriptors, threshold)
            matched = !!matchResult
          } else {
            // No descriptor stored for this student yet, auto-allow for first time
            matched = true
          }
        } else {
          matched = true // No descriptors in system yet
        }
      }

      if (matched) {
        const now = new Date()
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        const isLate = mode === 'masuk' && now.getHours() >= 7 && now.getMinutes() > 15
        const status = isLate ? 'terlambat' : 'hadir'

        try {
          const pos = await getCurrentPosition().catch(() => null)
          await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              student_id: currentUser.studentId,
              date: now.toISOString().split('T')[0],
              check_in_time: mode === 'masuk' ? timeStr : undefined,
              check_out_time: mode === 'keluar' ? timeStr : undefined,
              status: mode === 'keluar' ? 'hadir' : status,
              method: 'face',
              latitude: pos?.latitude ?? -6.2088,
              longitude: pos?.longitude ?? 106.8456,
            }),
          })
        } catch {
          // offline fallback
        }

        setScanResult({
          success: true,
          message: mode === 'masuk'
            ? `Absensi masuk berhasil! Status: ${isLate ? 'Terlambat' : 'Hadir'}`
            : 'Absensi keluar berhasil!',
          time: timeStr,
          status: isLate && mode === 'masuk' ? 'Terlambat' : 'Hadir',
        })
      } else {
        setScanResult({
          success: false,
          message: 'Wajah tidak dikenali. Silakan coba lagi atau hubungi admin.',
        })
      }
    } catch {
      setScanResult({
        success: false,
        message: 'Terjadi kesalahan saat pengenalan wajah.',
      })
    }

    setScanStep('result')
  }

  const handleRetry = () => {
    setScanStep('idle')
    setScanResult(null)
    setDemoCountdown(0)
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
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
          <h1 className="text-2xl font-bold">Absensi Wajah</h1>
          <p className="text-sm text-muted-foreground">Verifikasi kehadiran melalui pengenalan wajah</p>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {demoMode && (scanStep === 'detecting' || scanStep === 'recognizing') && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Mode Demo</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">Model AI belum tersedia, menggunakan simulasi pengenalan wajah</p>
          </div>
        </div>
      )}

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

      {/* Camera Area */}
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-gray-900 dark:bg-gray-950 aspect-[3/4] flex items-center justify-center">
            {/* Real video element */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {/* Camera not active yet */}
            {!cameraActive && (
              <div className="text-center text-white/70">
                <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin" />
                <p className="text-sm">Mengaktifkan Kamera...</p>
              </div>
            )}

            {/* Loading models */}
            {cameraActive && scanStep === 'loading_models' && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40">
                <div className="text-center text-white/80">
                  <ScanFace className="h-10 w-10 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Memuat model AI...</p>
                </div>
              </div>
            )}

            {/* Camera active - idle */}
            {cameraActive && scanStep === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                {/* Face outline */}
                <div className="relative mx-auto w-48 h-60">
                  <div className="absolute inset-0 border-2 border-white/30 rounded-[50%] border-dashed" />
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                  {/* Pulsing circle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-2 border-emerald-400/50 rounded-full animate-ping" />
                  </div>
                </div>
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <p className="text-sm text-white/80">Posisikan wajah Anda di dalam area</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-400">Kamera Aktif</span>
                  </div>
                </div>
              </div>
            )}

            {/* Detecting face */}
            {cameraActive && scanStep === 'detecting' && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                <div className="text-center text-white/80">
                  <div className="relative mx-auto w-48 h-60 mb-4">
                    <div className="absolute inset-0 border-2 border-yellow-400 rounded-[50%] animate-pulse" />
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-yellow-400 rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-yellow-400 rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-yellow-400 rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-yellow-400 rounded-br-lg" />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />
                    <span className="text-yellow-400 font-medium">
                      {demoMode ? `Simulasi deteksi... ${demoCountdown > 0 ? `(${demoCountdown}d)` : ''}` : 'Mendeteksi wajah...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recognizing face */}
            {cameraActive && scanStep === 'recognizing' && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                <div className="text-center text-white/80">
                  <div className="relative mx-auto w-48 h-60 mb-4">
                    <div className="absolute inset-0 border-2 border-blue-400 rounded-[50%]" />
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle2 className="h-12 w-12 text-blue-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    <span className="text-blue-400 font-medium">Mengenali wajah...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            {scanStep === 'result' && scanResult && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60">
                <div className="text-center text-white/80 p-6">
                  {scanResult.success ? (
                    <>
                      <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                      </div>
                      <p className="text-lg font-bold text-emerald-400 mb-2">Berhasil!</p>
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
                      <p className="text-lg font-bold text-red-400 mb-2">Gagal</p>
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

        {/* Student Name */}
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
        {scanStep === 'idle' && cameraActive && (
          <Button
            className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
            onClick={handleScan}
            disabled={!locationResult?.valid}
          >
            <ScanFace className="h-6 w-6 mr-2" />
            Scan Wajah
          </Button>
        )}

        {/* Retry Button */}
        {scanStep === 'result' && (
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleRetry}
          >
            Coba Lagi
          </Button>
        )}
      </div>
    </div>
  )
}
