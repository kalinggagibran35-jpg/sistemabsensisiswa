'use client'

import { useAppStore, type Page } from '@/lib/store'
import LoginPage from '@/components/login-page'
import ResetPasswordPage from '@/components/reset-password-page'
import AppLayout from '@/components/app-layout'
import ProfilePage from '@/components/profile-page'
import AdminDashboard from '@/components/admin-dashboard'
import AdminClasses from '@/components/admin-classes'
import AdminStudents from '@/components/admin-students'
import AdminTeachers from '@/components/admin-teachers'
import AdminCounselors from '@/components/admin-counselors'
import AdminFaceRegistration from '@/components/admin-face-registration'
import AdminQRCode from '@/components/admin-qr-code'
import AdminLocations from '@/components/admin-locations'
import AdminAttendance from '@/components/admin-attendance'
import AdminLeaveRequests from '@/components/admin-leave-requests'
import AdminReports from '@/components/admin-reports'
import AdminWASchedules from '@/components/admin-wa-schedules'
import AdminAcademicYear from '@/components/admin-academic-year'
import AdminSettings from '@/components/admin-settings'
import AdminActivityLogs from '@/components/admin-activity-logs'
import AdminAuditLogs from '@/components/admin-audit-logs'
import AttendanceFace from '@/components/attendance-face'
import AttendanceQR from '@/components/attendance-qr'
import WaliDashboard from '@/components/wali-dashboard'
import WaliLeaveRequests from '@/components/wali-leave-requests'
import WaliAttendance from '@/components/wali-attendance'
import WaliReports from '@/components/wali-reports'
import GuruDashboard from '@/components/guru-dashboard'
import GuruStudents from '@/components/guru-students'
import GuruReports from '@/components/guru-reports'
import SiswaDashboard from '@/components/siswa-dashboard'
import SiswaLeaveRequest from '@/components/siswa-leave-request'
import SiswaAttendance from '@/components/siswa-attendance'
import StudentProfile from '@/components/student-profile'
import WaliStudents from '@/components/wali-students'
import GuruLeaveRequests from '@/components/guru-leave-requests'

function renderCurrentPage(currentPage: Page) {
  switch (currentPage) {
    case 'profile':
      return <ProfilePage />
    case 'admin-dashboard':
      return <AdminDashboard />
    case 'admin-classes':
      return <AdminClasses />
    case 'admin-students':
      return <AdminStudents />
    case 'admin-teachers':
      return <AdminTeachers />
    case 'admin-counselors':
      return <AdminCounselors />
    case 'admin-face-registration':
      return <AdminFaceRegistration />
    case 'admin-qr-code':
      return <AdminQRCode />
    case 'admin-locations':
      return <AdminLocations />
    case 'admin-attendance':
      return <AdminAttendance />
    case 'admin-leave-requests':
      return <AdminLeaveRequests />
    case 'admin-reports':
      return <AdminReports />
    case 'admin-wa-schedules':
      return <AdminWASchedules />
    case 'admin-academic-year':
      return <AdminAcademicYear />
    case 'admin-settings':
      return <AdminSettings />
    case 'admin-activity-logs':
      return <AdminActivityLogs />
    case 'admin-audit-logs':
      return <AdminAuditLogs />
    case 'attendance-face':
      return <AttendanceFace />
    case 'attendance-qr':
      return <AttendanceQR />
    case 'wali-dashboard':
      return <WaliDashboard />
    case 'wali-leave-requests':
      return <WaliLeaveRequests />
    case 'wali-attendance':
      return <WaliAttendance />
    case 'wali-reports':
      return <WaliReports />
    case 'guru-dashboard':
      return <GuruDashboard />
    case 'guru-students':
      return <GuruStudents />
    case 'guru-reports':
      return <GuruReports />
    case 'siswa-dashboard':
      return <SiswaDashboard />
    case 'siswa-leave-request':
      return <SiswaLeaveRequest />
    case 'siswa-attendance':
      return <SiswaAttendance />
    case 'student-profile':
      return <StudentProfile />
    case 'wali-students':
      return <WaliStudents />
    case 'guru-leave-requests':
      return <GuruLeaveRequests />
    default: {
      // All pages should be handled above; fallback for safety
      const _exhaustive: never = currentPage
      return (
        <div className="p-4 sm:p-6">
          <p className="text-muted-foreground">Halaman tidak ditemukan</p>
        </div>
      )
    }
  }
}

export default function Home() {
  const { isAuthenticated, currentPage } = useAppStore()

  if (!isAuthenticated) {
    if (currentPage === 'reset-password') return <ResetPasswordPage />
    return <LoginPage />
  }

  return (
    <AppLayout>
      {renderCurrentPage(currentPage)}
    </AppLayout>
  )
}
