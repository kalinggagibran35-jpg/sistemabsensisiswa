'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Camera, CheckCircle, User, ScanFace, AlertTriangle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/store'
import { loadModels, registerFace, isDemoMode as checkDemoMode, isModelsLoaded } from '@/lib/face-recognition'
import { descriptorToArray } from '@/lib/face-recognition'

interface StudentItem {
  id: string
  nis: string
  face_registered: boolean
  user: { name: string; email: string }
  class: { name: string }
}

interface RecentRegistration {
  id: string
  name: string
  className: string
  registeredAt: string
}

type RegistrationStep = 'idle' | 'loading_models' | 'camera_active' | 'capturing' | 'processing' | 'success' | 'error'

export default function AdminFaceRegistration() {
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [step, setStep] = useState<RegistrationStep>('idle')
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([])
  const [demoMode, setDemoMode] = useState(false)
  const [captureProgress, setCaptureProgress] = useState(0)
  const [captureRound, setCaptureRound] = useState(0) // 0, 1, 2 for 3 photos
  const [capturedPhotos, setCapturedPhotos] = useState<number[][]>([]) // store descriptor arrays
  const [errorMessage, setErrorMessage] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalCaptures = 3

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/students?status=active', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) {
        setStudents(json.data)
      }
    } catch {
      toast.error('Gagal memuat data siswa')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
    return () => {
      stopCamera()
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current)
    }
  }, [fetchStudents])

  const unregisteredStudents = students.filter((s) => !s.face_registered)

  const startCamera = async () => {
    if (!selectedStudentId) {
      toast.error('Pilih siswa terlebih dahulu')
      return
    }

    setStep('loading_models')
    setCaptureRound(0)
    setCapturedPhotos([])
    setCaptureProgress(0)

    // Try loading models
    try {
      const loaded = await loadModels()
      if (!loaded) {
        setDemoMode(true)
      } else {
        setDemoMode(false)
      }
    } catch {
      setDemoMode(true)
    }

    // Start camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStep('camera_active')
    } catch {
      toast.error('Gagal mengakses kamera. Pastikan izin kamera diberikan.')
      setStep('idle')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleTakePhoto = async () => {
    if (!selectedStudentId || !videoRef.current) return

    setStep('capturing')
    setErrorMessage('')

    if (demoMode) {
      // Demo mode: simulate capture with auto-succeed after delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate a fake descriptor for demo purposes
      const fakeDescriptor = Array.from({ length: 128 }, () => Math.random() * 0.5 - 0.25)
      const newPhotos = [...capturedPhotos, fakeDescriptor]
      setCapturedPhotos(newPhotos)
      const newRound = captureRound + 1
      setCaptureRound(newRound)
      setCaptureProgress((newRound / totalCaptures) * 100)

      if (newRound >= totalCaptures) {
        await saveFaceDescriptors(newPhotos)
      } else {
        setStep('camera_active')
        toast.success(`Foto ${newRound} dari ${totalCaptures} berhasil! ${newRound < totalCaptures ? 'Silakan ubah posisi wajah.' : ''}`)
      }
      return
    }

    // Real face-api.js mode
    try {
      const descriptor = await registerFace(videoRef.current)
      if (!descriptor) {
        setErrorMessage('Wajah tidak terdeteksi. Pastikan wajah terlihat jelas di kamera.')
        setStep('camera_active')
        toast.error('Wajah tidak terdeteksi')
        return
      }

      const descriptorArray = descriptorToArray(descriptor)
      const newPhotos = [...capturedPhotos, descriptorArray]
      setCapturedPhotos(newPhotos)
      const newRound = captureRound + 1
      setCaptureRound(newRound)
      setCaptureProgress((newRound / totalCaptures) * 100)

      if (newRound >= totalCaptures) {
        await saveFaceDescriptors(newPhotos)
      } else {
        setStep('camera_active')
        toast.success(`Foto ${newRound} dari ${totalCaptures} berhasil! Silakan ubah sedikit posisi wajah Anda.`)
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat mendeteksi wajah.')
      setStep('camera_active')
      toast.error('Gagal mendeteksi wajah')
    }
  }

  const saveFaceDescriptors = async (photos: number[][]) => {
    setStep('processing')
    try {
      // Save each descriptor to the API
      for (const descriptorData of photos) {
        await fetch('/api/face-descriptors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            student_id: selectedStudentId,
            descriptor_data: descriptorData,
          }),
        })
      }

      // Update student face_registered status
      const res = await fetch(`/api/students?id=${selectedStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ face_registered: true }),
      })
      const json = await res.json()

      if (json.success) {
        const student = students.find((s) => s.id === selectedStudentId)
        toast.success(`Wajah ${student?.user.name || 'siswa'} berhasil didaftarkan`)
        setRecentRegistrations((prev) => [
          {
            id: selectedStudentId,
            name: student?.user.name || 'Siswa',
            className: student?.class?.name || '-',
            registeredAt: new Date().toLocaleString('id-ID'),
          },
          ...prev,
        ])
        setStep('success')
        stopCamera()
        fetchStudents()
      } else {
        setErrorMessage(json.error || 'Gagal mendaftarkan wajah')
        setStep('error')
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat menyimpan data wajah')
      setStep('error')
      toast.error('Terjadi kesalahan')
    }
  }

  const handleReset = () => {
    stopCamera()
    setStep('idle')
    setCaptureRound(0)
    setCapturedPhotos([])
    setCaptureProgress(0)
    setErrorMessage('')
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current)
  }

  const handleSelectStudent = (id: string) => {
    if (step !== 'idle') return
    setSelectedStudentId(id)
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
      <div>
        <h1 className="text-2xl font-bold">Registrasi Wajah</h1>
        <p className="text-muted-foreground text-sm">Daftarkan wajah siswa untuk absensi pengenalan wajah</p>
      </div>

      {/* Demo Mode Banner */}
      {demoMode && step !== 'idle' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Mode Demo</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">Model AI belum tersedia, menggunakan simulasi. Data wajah akan disimpan sebagai placeholder.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Camera Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kamera Registrasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Student Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Siswa (Belum Terdaftar)</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedStudentId}
                onChange={(e) => handleSelectStudent(e.target.value)}
                disabled={step !== 'idle'}
              >
                <option value="">-- Pilih Siswa --</option>
                {unregisteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name} - {s.nis} ({s.class?.name || '-'})
                  </option>
                ))}
              </select>
              {unregisteredStudents.length === 0 && (
                <p className="text-xs text-emerald-600">Semua siswa sudah terdaftar wajahnya!</p>
              )}
            </div>

            {/* Camera Area */}
            <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
              {/* Hidden video element for real camera */}
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover ${step === 'camera_active' || step === 'capturing' ? 'block' : 'hidden'}`}
                playsInline
                muted
              />
              {/* Hidden canvas for capturing frames */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Loading models */}
              {step === 'loading_models' && (
                <div className="text-center text-white/70 z-10">
                  <ScanFace className="h-12 w-12 mx-auto mb-3 animate-spin" />
                  <p className="text-sm">Memuat model AI...</p>
                  <p className="text-xs mt-1 text-white/50">Mohon tunggu sebentar</p>
                </div>
              )}

              {/* Idle state */}
              {step === 'idle' && (
                <div className="text-center text-gray-400">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Kamera belum aktif</p>
                  <p className="text-xs mt-1">Pilih siswa lalu aktifkan kamera</p>
                </div>
              )}

              {/* Camera active */}
              {step === 'camera_active' && (
                <>
                  {/* Face outline overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-40 h-52 border-2 border-emerald-400/60 rounded-full" />
                  </div>
                  {/* Status indicator */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded">Kamera Aktif</span>
                  </div>
                  {/* Capture progress */}
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-emerald-600 text-white">
                      Foto {captureRound} dari {totalCaptures}
                    </Badge>
                  </div>
                  {/* Student name overlay */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <p className="text-white text-sm font-medium bg-black/40 px-2 py-1 rounded">
                      {students.find((s) => s.id === selectedStudentId)?.user.name || 'Siswa'}
                    </p>
                  </div>
                  {/* Instruction */}
                  <div className="absolute bottom-3 right-3 z-10">
                    <p className="text-white/70 text-xs bg-black/40 px-2 py-1 rounded">
                      {captureRound === 0 ? 'Posisikan wajah di depan kamera' : captureRound === 1 ? 'Sedikit menghadap ke kiri' : 'Sedikit menghadap ke kanan'}
                    </p>
                  </div>
                </>
              )}

              {/* Capturing */}
              {step === 'capturing' && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-40 h-52 border-2 border-yellow-400 rounded-full animate-pulse" />
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                    <ScanFace className="h-4 w-4 text-yellow-400 animate-spin" />
                    <span className="text-yellow-400 text-xs font-medium">Mendeteksi wajah...</span>
                  </div>
                </>
              )}

              {/* Processing */}
              {step === 'processing' && (
                <div className="text-center text-white/70 z-10">
                  <ScanFace className="h-12 w-12 mx-auto mb-3 animate-spin text-emerald-400" />
                  <p className="text-sm text-emerald-400">Menyimpan data wajah...</p>
                </div>
              )}

              {/* Success */}
              {step === 'success' && (
                <div className="text-center text-white/80 z-10">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-emerald-400">Registrasi Berhasil!</p>
                  <p className="text-xs text-white/50 mt-1">{totalCaptures} foto wajah telah disimpan</p>
                </div>
              )}

              {/* Error */}
              {step === 'error' && (
                <div className="text-center text-white/80 z-10">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-red-400">Gagal</p>
                  <p className="text-xs text-white/50 mt-1">{errorMessage}</p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {(step === 'camera_active' || step === 'capturing' || step === 'processing') && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress Registrasi</span>
                  <span>{captureRound}/{totalCaptures} foto</span>
                </div>
                <Progress value={captureProgress} className="h-2" />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {step === 'idle' && (
                <Button onClick={startCamera} className="flex-1" disabled={unregisteredStudents.length === 0 || !selectedStudentId}>
                  <Camera className="h-4 w-4 mr-2" />
                  Aktifkan Kamera
                </Button>
              )}

              {(step === 'camera_active') && (
                <>
                  <Button onClick={handleTakePhoto} className="flex-1" disabled={step === 'capturing'}>
                    <ScanFace className="h-4 w-4 mr-2" />
                    Ambil Foto ({captureRound + 1}/{totalCaptures})
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Batal
                  </Button>
                </>
              )}

              {(step === 'success' || step === 'error') && (
                <>
                  <Button onClick={handleReset} className="flex-1" variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Registrasi Lagi
                  </Button>
                  <Button onClick={() => { handleReset(); setSelectedStudentId(''); }} className="flex-1">
                    Selesai
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right - Recent Registrations & Stats */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{students.filter((s) => s.face_registered).length}</p>
                  <p className="text-xs text-muted-foreground">Wajah Terdaftar</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{unregisteredStudents.length}</p>
                  <p className="text-xs text-muted-foreground">Belum Terdaftar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recently Registered */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Baru Terdaftar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {recentRegistrations.length > 0 ? recentRegistrations.map((r) => (
                  <div key={r.id + r.registeredAt} className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.className}</p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">{r.registeredAt}</p>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada registrasi baru</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Unregistered Students List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Siswa Belum Terdaftar Wajah</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {unregisteredStudents.length > 0 ? unregisteredStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{s.user.name}</p>
                      <p className="text-xs text-muted-foreground">{s.class?.name || '-'}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => { setSelectedStudentId(s.id) }}
                      disabled={step !== 'idle'}
                    >
                      Pilih
                    </Button>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Semua siswa sudah terdaftar</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
