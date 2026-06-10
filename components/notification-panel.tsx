'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, Trash2, Inbox } from 'lucide-react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export default function NotificationPanel() {
  const { currentUser } = useAppStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id, mark_all: false }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch {
      // silently fail
    }
  }

  const markAllAsRead = async () => {
    if (!currentUser) return
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ user_id: currentUser.id, mark_all: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {
      // silently fail
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Baru saja'
      if (diffMins < 60) return `${diffMins} menit lalu`
      if (diffHours < 24) return `${diffHours} jam lalu`
      if (diffDays < 7) return `${diffDays} hari lalu`
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifikasi</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Inbox className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Belum ada notifikasi</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`px-4 py-3 transition-colors ${
                      notification.is_read
                        ? 'bg-transparent'
                        : 'bg-emerald-50/50 dark:bg-emerald-900/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                          <p className={`text-sm font-medium truncate ${notification.is_read ? 'text-muted-foreground' : ''}`}>
                            {notification.title}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
                          title="Tandai dibaca"
                        >
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
