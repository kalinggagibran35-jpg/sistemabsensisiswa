'use client'

import { useState } from 'react'
import { Camera, Loader2, Save, User as UserIcon } from 'lucide-react'
import { useAppStore, getAuthHeaders } from '@/lib/store'
import { changePassword } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  wali_kelas: 'Wali Kelas',
  guru_bk: 'Guru BK',
  siswa: 'Siswa',
}

export default function ProfilePage() {
  const { currentUser } = useAppStore()
  const [name, setName] = useState(currentUser?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)

  // Password change state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  if (!currentUser) return null

  const userInitials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSaveName = async () => {
    if (!name.trim()) return
    setSavingName(true)
    setNameSuccess(false)
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id: currentUser.id, name: name.trim() }),
      })
      if (res.ok) {
        setNameSuccess(true)
        setTimeout(() => setNameSuccess(false), 3000)
      }
    } catch {
      // silently fail
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Semua field harus diisi')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok')
      return
    }

    setSavingPassword(true)
    try {
      const result = await changePassword(currentUser.id, oldPassword, newPassword)
      if (result.success) {
        setPasswordSuccess(true)
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordSuccess(false), 3000)
      } else {
        setPasswordError(result.error || 'Gagal mengubah password')
      }
    } catch {
      setPasswordError('Terjadi kesalahan jaringan')
    } finally {
      setSavingPassword(false)
    }
  }

  const handlePhotoUpload = () => {
    // Simulated photo upload
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      // In a real app, this would upload the file
      alert('Upload foto berhasil disimulasikan!')
    }
    input.click()
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={currentUser.photo_url || undefined} alt={currentUser.name} />
                <AvatarFallback className="bg-emerald-600 text-white text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handlePhotoUpload}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Ubah foto"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold">{currentUser.name}</h2>
              <p className="text-muted-foreground text-sm mt-0.5">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <UserIcon className="h-3 w-3" />
                  {roleLabels[currentUser.role]}
                </span>
                {currentUser.nis && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    NIS: {currentUser.nis}
                  </span>
                )}
              </div>
              {currentUser.phone && (
                <p className="text-muted-foreground text-sm mt-1">Telepon: {currentUser.phone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Name Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ubah Nama</CardTitle>
          <CardDescription>Perbarui nama tampilan akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
                className="h-10"
              />
            </div>
            <Button
              onClick={handleSaveName}
              disabled={savingName || !name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
            >
              {savingName ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan
            </Button>
          </div>
          {nameSuccess && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">Nama berhasil diperbarui!</p>
          )}
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ubah Password</CardTitle>
          <CardDescription>Perbarui password akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                Password berhasil diubah!
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="old-password">Password Lama</Label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password lama"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru (min. 6 karakter)"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={savingPassword}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Ubah Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
