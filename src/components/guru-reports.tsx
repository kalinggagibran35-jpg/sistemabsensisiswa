'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle, Search, Eye, User,
} from 'lucide-react'
import { toast } from 'sonner'

interface ViolationStudent {
  student_id: string
  name: string
  nis: string
  class_name: string
  class_major: string
  total_absences: number
  total_days: number
  attendance_percentage: number
}

interface ClassItem {
  id: string
  name: string
  major: string
}

export default function GuruReports() {
  const { setCurrentPage, setSelectedStudentId } = useAppStore()
  const [violations, setViolations] = useState<ViolationStudent[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterClass, setFilterClass] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  const getDefaultDateRange = () => {
    const now = new Date()
    const end = now.toISOString().split('T')[0]
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    return { start, end }
  }

  const fetchViolations = useCallback(async () => {
    try {
      setLoading(true)
      const { start, end } = getDefaultDateRange()
      const startDate = filterStartDate || start
      const endDate = filterEndDate || end

      const params = new URLSearchParams()
      params.set('start_date', startDate)
      params.set('end_date', endDate)
      params.set('status', 'tidak_hadir')
      if (filterClass) params.set('class_id', filterClass)

      const res = await fetch(`/api/reports?${params.toString()}`, { headers: getAuthHeaders() })
      const json = await res.json()

      if (json.success && json.data?.studentSummary) {
        // Filter students with >= 3 absences
        const violationList = json.data.studentSummary
          .filter((s: { tidak_hadir: number }) => s.tidak_hadir >= 3)
          .map((s: {
            student_id: string
            name: string
            class_name: string
            class_major: string
            total: number
            tidak_hadir: number
            hadir: number
          }) => ({
            student_id: s.student_id,
            name: s.name,
            nis: '',
            class_name: s.class_name,
            class_major: s.class_major,
            total_absences: s.tidak_hadir,
            total_days: s.total,
            attendance_percentage: s.total > 0 ? Math.round(((s.hadir + s.total - s.tidak_hadir - s.hadir > 0 ? s.hadir : s.total - s.tidak_hadir) / s.total) * 100) : 0,
          }))

        // Correct attendance percentage calculation
        for (const v of violationList) {
          const studentData = json.data.studentSummary.find(
            (s: { student_id: string }) => s.student_id === v.student_id
          )
          if (studentData) {
            const present = studentData.hadir + studentData.terlambat
            v.attendance_percentage = studentData.total > 0
              ? Math.round((present / studentData.total) * 100)
              : 0
          }
        }

        setViolations(violationList)
      } else {
        setViolations([])
      }
    } catch {
      toast.error('Gagal memuat laporan pelanggaran')
    } finally {
      setLoading(false)
    }
  }, [filterClass, filterStartDate, filterEndDate])

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setClassList(json.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    fetchViolations()
  }, [fetchViolations])

  const handleViewProfile = (studentId: string) => {
    setSelectedStudentId(studentId)
    setCurrentPage('student-profile')
  }

  const getViolationLevel = (absences: number) => {
    if (absences >= 7) return { level: 'Kritis', color: 'bg-red-600 text-white' }
    if (absences >= 5) return { level: 'Tinggi', color: 'bg-orange-500 text-white' }
    return { level: 'Sedang', color: 'bg-yellow-500 text-white' }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Laporan Pelanggaran</h1>
        <p className="text-muted-foreground text-sm">Siswa dengan ketidakhadiran tinggi (≥ 3 kali per minggu)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{violations.length}</p>
            <p className="text-xs text-muted-foreground">Total Pelanggaran</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{violations.filter(v => v.total_absences >= 5).length}</p>
            <p className="text-xs text-muted-foreground">Level Tinggi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{violations.filter(v => v.total_absences >= 7).length}</p>
            <p className="text-xs text-muted-foreground">Level Kritis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {violations.length > 0 ? Math.round(violations.reduce((a, b) => a + b.attendance_percentage, 0) / violations.length) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Rata-rata Kehadiran</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Kelas</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">Semua Kelas</option>
                {classList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Mulai Tanggal</span>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Sampai Tanggal</span>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violation Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">No</th>
                  <th className="text-left p-3">Nama</th>
                  <th className="text-left p-3">NIS</th>
                  <th className="text-left p-3">Kelas</th>
                  <th className="text-center p-3">Tidak Hadir Minggu Ini</th>
                  <th className="text-center p-3">% Kehadiran</th>
                  <th className="text-center p-3">Level</th>
                  <th className="text-center p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {violations.length > 0 ? violations.map((v, i) => {
                  const violation = getViolationLevel(v.total_absences)
                  return (
                    <tr key={v.student_id} className="border-b hover:bg-muted/30">
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-medium">{v.name}</td>
                      <td className="p-3">{v.nis || '-'}</td>
                      <td className="p-3">{v.class_name}</td>
                      <td className="p-3 text-center">
                        <Badge className="bg-red-600 text-white">
                          {v.total_absences} hari
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-medium ${v.attendance_percentage < 80 ? 'text-red-600' : v.attendance_percentage < 90 ? 'text-orange-500' : 'text-emerald-600'}`}>
                          {v.attendance_percentage}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={`text-xs ${violation.color}`}>
                          {violation.level}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewProfile(v.student_id)} title="Lihat Profil">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p>Tidak ada siswa dengan pelanggaran ketidakhadiran</p>
                      <p className="text-xs mt-1">Semua siswa memiliki kehadiran yang baik dalam periode ini</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Kategori Pelanggaran</p>
              <Separator className="my-2" />
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><Badge className="bg-yellow-500 text-white text-[10px] mr-2">Sedang</Badge> 3-4 hari tidak hadir per minggu</p>
                <p><Badge className="bg-orange-500 text-white text-[10px] mr-2">Tinggi</Badge> 5-6 hari tidak hadir per minggu</p>
                <p><Badge className="bg-red-600 text-white text-[10px] mr-2">Kritis</Badge> ≥ 7 hari tidak hadir per minggu - perlu tindakan segera</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
