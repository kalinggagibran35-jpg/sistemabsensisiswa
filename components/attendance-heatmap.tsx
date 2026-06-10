'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getAuthHeaders } from '@/lib/store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

interface HeatmapProps {
  data: Array<{ date: string; percentage: number; isHoliday: boolean }>
  onMonthChange?: (month: number, year: number) => void
}

export default function AttendanceHeatmap({ data, onMonthChange }: HeatmapProps) {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (onMonthChange) {
      onMonthChange(selectedMonth, selectedYear)
    }
  }, [selectedMonth, selectedYear, onMonthChange])

  const getColor = (percentage: number, isHoliday: boolean) => {
    if (isHoliday) return 'bg-gray-200 dark:bg-gray-700'
    if (percentage >= 90) return 'bg-emerald-500'
    if (percentage >= 70) return 'bg-yellow-400'
    if (percentage >= 50) return 'bg-orange-400'
    if (percentage > 0) return 'bg-red-400'
    return 'bg-muted'
  }

  const getTextColor = (percentage: number, isHoliday: boolean) => {
    if (isHoliday) return 'text-gray-500 dark:text-gray-400'
    if (percentage >= 50 || percentage > 0) return 'text-white'
    return 'text-muted-foreground'
  }

  const getTooltip = (day: number) => {
    const entry = data[day - 1]
    if (!entry) return ''
    if (entry.isHoliday) return `${entry.date}: Hari libur/weekend`
    if (entry.percentage === 0) return `${entry.date}: Tidak ada data`
    return `${entry.date}: ${entry.percentage}% kehadiran`
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Belum ada data heatmap untuk bulan ini
      </div>
    )
  }

  // Build calendar grid
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1)
  let startDayOfWeek = firstDay.getDay() // 0=Sun
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1 // Convert to Mon=0

  const daysInMonth = data.length

  // Build weeks
  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = Array(startDayOfWeek).fill(null)
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    weeks.push(currentWeek)
  }

  // Generate year options
  const currentYear = today.getFullYear()
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="space-y-4">
      {/* Month/Year Selectors */}
      <div className="flex items-center gap-3">
        <Select
          value={String(selectedMonth)}
          onValueChange={(v) => setSelectedMonth(parseInt(v))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Pilih Bulan" />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem key={i} value={String(i + 1)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => setSelectedYear(parseInt(v))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Tahun" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Grid */}
      <TooltipProvider>
        <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1 text-xs">
          {/* Header row */}
          <div />
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-muted-foreground font-medium pb-1">{d}</div>
          ))}

          {/* Day rows */}
          {weeks.map((week, wi) => (
            <div key={wi} className="contents">
              <div />
              {week.map((day, di) => (
                <Tooltip key={`${wi}-${di}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={`aspect-square rounded-sm flex items-center justify-center text-[10px] cursor-default ${
                        day ? getColor(data[day - 1].percentage, data[day - 1].isHoliday) : ''
                      }`}
                    >
                      {day && (
                        <span className={getTextColor(data[day - 1].percentage, data[day - 1].isHoliday)}>
                          {day}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  {day && (
                    <TooltipContent>
                      <p>{getTooltip(day)}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Kehadiran:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" /> ≥90%
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-yellow-400" /> 70-89%
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-orange-400" /> 50-69%
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-400" /> &lt;50%
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" /> Libur
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted" /> Tidak ada data
        </div>
      </div>
    </div>
  )
}

// Standalone Card wrapper for the heatmap
export function AttendanceHeatmapCard() {
  const [heatmapData, setHeatmapData] = useState<Array<{ date: string; percentage: number; isHoliday: boolean }>>([])
  const [loading, setLoading] = useState(true)

  const fetchHeatmapData = useCallback(async (month: number, year: number) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard?role=admin&heatmapMonth=${month}&heatmapYear=${year}`, { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success && json.data.heatmapData) {
        setHeatmapData(json.data.heatmapData)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const today = new Date()
    fetchHeatmapData(today.getMonth() + 1, today.getFullYear())
  }, [fetchHeatmapData])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Heatmap Kehadiran Per Hari</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && heatmapData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Memuat data heatmap...
          </div>
        ) : (
          <AttendanceHeatmap
            data={heatmapData}
            onMonthChange={fetchHeatmapData}
          />
        )}
      </CardContent>
    </Card>
  )
}
