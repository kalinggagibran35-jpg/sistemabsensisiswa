'use client'

import { useState } from 'react'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { loginUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const { login, setCurrentPage } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email harus diisi')
      return
    }
    if (!password.trim()) {
      setError('Password harus diisi')
      return
    }

    setLoading(true)
    try {
      const result = await loginUser(email, password)
      if (result.success && result.user) {
        login(result.user)
      } else {
        setError(result.error || 'Gagal masuk')
      }
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-950 dark:via-background dark:to-emerald-950 p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300/20 dark:bg-emerald-700/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/25 mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Sistem Absensi Sekolah</h1>
          <p className="text-muted-foreground mt-1">Silakan masuk ke akun Anda</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@sekolah.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentPage('reset-password')}
                  className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors"
                >
                  Lupa Password?
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-2">Akun Demo:</p>
              <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                <div className="flex justify-between px-2 py-1 rounded bg-muted/50">
                  <span>Admin</span>
                  <span className="font-mono">admin@sekolah.id</span>
                </div>
                <div className="flex justify-between px-2 py-1 rounded bg-muted/50">
                  <span>Wali Kelas</span>
                  <span className="font-mono">budi@sekolah.id</span>
                </div>
                <div className="flex justify-between px-2 py-1 rounded bg-muted/50">
                  <span>Guru BK</span>
                  <span className="font-mono">dewi@sekolah.id</span>
                </div>
                <div className="flex justify-between px-2 py-1 rounded bg-muted/50">
                  <span>Siswa (Ahmad)</span>
                  <span className="font-mono">ahmad@sekolah.id</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">Password: <span className="font-mono">admin123</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
