import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'admin' | 'wali_kelas' | 'guru_bk' | 'siswa'

export type Page =
  | 'login' | 'reset-password'
  | 'admin-dashboard' | 'admin-classes' | 'admin-students' | 'admin-teachers' | 'admin-counselors'
  | 'admin-attendance' | 'admin-leave-requests' | 'admin-reports' | 'admin-wa-schedules'
  | 'admin-settings' | 'admin-activity-logs' | 'admin-audit-logs' | 'admin-locations'
  | 'admin-face-registration' | 'admin-qr-code' | 'admin-academic-year'
  | 'wali-dashboard' | 'wali-students' | 'wali-leave-requests' | 'wali-attendance' | 'wali-reports'
  | 'guru-dashboard' | 'guru-students' | 'guru-leave-requests' | 'guru-reports'
  | 'siswa-dashboard' | 'siswa-leave-request' | 'siswa-attendance'
  | 'attendance-face' | 'attendance-qr' | 'student-profile'
  | 'profile'

export interface CurrentUser {
  id: string
  email: string
  name: string
  role: Role
  photo_url: string | null
  phone: string | null
  // Role-specific data
  studentId?: string
  teacherId?: string
  counselorId?: string
  classId?: string
  nis?: string
}

interface AppState {
  // Auth
  currentUser: CurrentUser | null
  isAuthenticated: boolean
  currentPage: Page
  darkMode: boolean
  sidebarOpen: boolean
  selectedStudentId: string | null

  // Actions
  login: (user: CurrentUser) => void
  logout: () => void
  setCurrentPage: (page: Page) => void
  setDarkMode: (dark: boolean) => void
  toggleSidebar: () => void
  setSelectedStudentId: (id: string | null) => void
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const stored = localStorage.getItem('attendance-app-store')
  if (!stored) return {}
  try {
    const parsed = JSON.parse(stored)
    const user = parsed?.state?.currentUser
    if (!user) return {}
    return {
      'x-user-id': user.id,
      'x-user-role': user.role,
      'x-user-name': user.name,
    }
  } catch {
    return {}
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth state
      currentUser: null,
      isAuthenticated: false,
      currentPage: 'login',
      darkMode: false,
      sidebarOpen: true,
      selectedStudentId: null,

      // Actions
      login: (user: CurrentUser) => {
        let defaultPage: Page = 'login'
        switch (user.role) {
          case 'admin':
            defaultPage = 'admin-dashboard'
            break
          case 'wali_kelas':
            defaultPage = 'wali-dashboard'
            break
          case 'guru_bk':
            defaultPage = 'guru-dashboard'
            break
          case 'siswa':
            defaultPage = 'siswa-dashboard'
            break
        }
        set({
          currentUser: user,
          isAuthenticated: true,
          currentPage: defaultPage,
        })
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          currentPage: 'login',
          selectedStudentId: null,
          sidebarOpen: true,
        })
      },

      setCurrentPage: (page: Page) => {
        set({ currentPage: page })
      },

      setDarkMode: (dark: boolean) => {
        set({ darkMode: dark })
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setSelectedStudentId: (id: string | null) => {
        set({ selectedStudentId: id })
      },
    }),
    {
      name: 'attendance-app-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        currentPage: state.currentPage,
        darkMode: state.darkMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
