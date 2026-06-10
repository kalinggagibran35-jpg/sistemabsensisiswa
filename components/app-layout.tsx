'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard, School, Users, UserCog, Brain, ScanFace, QrCode,
  MapPin, ClipboardCheck, FileText, BarChart3, MessageSquare, Calendar,
  Settings, FileSearch, Shield, FileDown, AlertTriangle, ClipboardList,
  User, Menu, Sun, Moon, LogOut, GraduationCap, X, ChevronLeft
} from 'lucide-react'
import { useAppStore, type Page, type Role } from '@/lib/store'
import NotificationPanel from '@/components/notification-panel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  icon: React.ElementType
  label: string
  page: Page
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: Record<Role, NavGroup[]> = {
  admin: [
    {
      title: 'Menu Utama',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', page: 'admin-dashboard' },
      ],
    },
    {
      title: 'Manajemen',
      items: [
        { icon: School, label: 'Manajemen Kelas', page: 'admin-classes' },
        { icon: Users, label: 'Manajemen Siswa', page: 'admin-students' },
        { icon: UserCog, label: 'Manajemen Wali Kelas', page: 'admin-teachers' },
        { icon: Brain, label: 'Manajemen Guru BK', page: 'admin-counselors' },
      ],
    },
    {
      title: 'Absensi',
      items: [
        { icon: ScanFace, label: 'Registrasi Wajah', page: 'admin-face-registration' },
        { icon: QrCode, label: 'Generate QR Code', page: 'admin-qr-code' },
        { icon: MapPin, label: 'Pengaturan Lokasi', page: 'admin-locations' },
        { icon: ClipboardCheck, label: 'Absensi Manual', page: 'admin-attendance' },
        { icon: FileText, label: 'Izin/Sakit', page: 'admin-leave-requests' },
      ],
    },
    {
      title: 'Laporan',
      items: [
        { icon: BarChart3, label: 'Laporan Absensi', page: 'admin-reports' },
        { icon: MessageSquare, label: 'Jadwal Laporan WA', page: 'admin-wa-schedules' },
      ],
    },
    {
      title: 'Sistem',
      items: [
        { icon: Calendar, label: 'Tahun Ajaran', page: 'admin-academic-year' },
        { icon: Settings, label: 'Pengaturan Sistem', page: 'admin-settings' },
        { icon: FileSearch, label: 'Log Aktivitas', page: 'admin-activity-logs' },
        { icon: Shield, label: 'Audit Log', page: 'admin-audit-logs' },
      ],
    },
  ],
  wali_kelas: [
    {
      title: 'Menu Utama',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', page: 'wali-dashboard' },
      ],
    },
    {
      title: 'Kelas',
      items: [
        { icon: Users, label: 'Daftar Siswa', page: 'wali-students' },
        { icon: ClipboardCheck, label: 'Rekap Kehadiran', page: 'wali-attendance' },
        { icon: FileText, label: 'Izin/Sakit', page: 'wali-leave-requests' },
      ],
    },
    {
      title: 'Laporan',
      items: [
        { icon: FileDown, label: 'Laporan PDF', page: 'wali-reports' },
      ],
    },
    {
      title: 'Akun',
      items: [
        { icon: User, label: 'Profil Akun', page: 'profile' },
      ],
    },
  ],
  guru_bk: [
    {
      title: 'Menu Utama',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', page: 'guru-dashboard' },
      ],
    },
    {
      title: 'Bimbingan',
      items: [
        { icon: Users, label: 'Detail Siswa', page: 'guru-students' },
        { icon: AlertTriangle, label: 'Laporan Pelanggaran', page: 'guru-leave-requests' },
        { icon: School, label: 'Rekap Semua Kelas', page: 'guru-reports' },
      ],
    },
    {
      title: 'Akun',
      items: [
        { icon: User, label: 'Profil Akun', page: 'profile' },
      ],
    },
  ],
  siswa: [
    {
      title: 'Menu Utama',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', page: 'siswa-dashboard' },
      ],
    },
    {
      title: 'Absensi',
      items: [
        { icon: ScanFace, label: 'Absensi Wajah', page: 'attendance-face' },
        { icon: QrCode, label: 'Absensi QR Code', page: 'attendance-qr' },
        { icon: ClipboardList, label: 'Riwayat Absensi', page: 'siswa-attendance' },
        { icon: FileText, label: 'Pengajuan Izin/Sakit', page: 'siswa-leave-request' },
      ],
    },
    {
      title: 'Akun',
      items: [
        { icon: User, label: 'Profil Akun', page: 'profile' },
      ],
    },
  ],
}

const roleLabels: Record<Role, string> = {
  admin: 'Administrator',
  wali_kelas: 'Wali Kelas',
  guru_bk: 'Guru BK',
  siswa: 'Siswa',
}

function SidebarNavGroup({ group, currentPage, onNavigate, collapsed }: { group: NavGroup; currentPage: Page; onNavigate: (page: Page) => void; collapsed: boolean }) {
  return (
    <div className="mb-1">
      {!collapsed && group.title && (
        <div className="px-4 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            {group.title}
          </span>
        </div>
      )}
      <div className="space-y-0.5 px-3">
        {group.items.map((item) => {
          const isActive = currentPage === item.page
          const Icon = item.icon
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, currentPage, setCurrentPage, darkMode, setDarkMode, sidebarOpen, toggleSidebar, logout } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  if (!currentUser) return null

  const groups = navGroups[currentUser.role] || []
  const userInitials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleNavigate = (page: Page) => {
    setCurrentPage(page)
    setMobileMenuOpen(false)
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-full border-r border-sidebar-border bg-sidebar transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-9 h-9 bg-sidebar-primary rounded-lg shrink-0">
            <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-sidebar-foreground truncate">SAS</h2>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">Sistem Absensi Sekolah</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 min-h-0 py-2 custom-scrollbar">
          {groups.map((group, idx) => (
            <SidebarNavGroup
              key={idx}
              group={group}
              currentPage={currentPage}
              onNavigate={handleNavigate}
              collapsed={collapsed}
            />
          ))}
        </ScrollArea>

        {/* Collapse Toggle */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-xs"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Tutup Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border z-50 flex flex-col animate-in slide-in-from-left duration-300">
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 bg-sidebar-primary rounded-lg">
                  <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-sidebar-foreground">SAS</h2>
                  <p className="text-[10px] text-sidebar-foreground/50">Sistem Absensi Sekolah</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <ScrollArea className="flex-1 min-h-0 py-2">
              {groups.map((group, idx) => (
                <SidebarNavGroup
                  key={idx}
                  group={group}
                  currentPage={currentPage}
                  onNavigate={handleNavigate}
                  collapsed={false}
                />
              ))}
            </ScrollArea>

            {/* Mobile User Info */}
            <div className="border-t border-sidebar-border p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.photo_url || undefined} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-sidebar-foreground/50">{roleLabels[currentUser.role]}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 sm:px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Page Title */}
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold hidden sm:block">Sistem Absensi Sekolah</h1>
              <h1 className="text-lg font-semibold sm:hidden">SAS</h1>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notifications */}
            <NotificationPanel />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.photo_url || undefined} alt={currentUser.name} />
                    <AvatarFallback className="bg-emerald-600 text-white text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{roleLabels[currentUser.role]}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigate('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profil Akun
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
