'use client'

import { useState } from 'react'
import { GraduationCap, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { resetPassword } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const { setCurrentPage } = useAppStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email harus diisi')
      return
    }

    setLoading(true)
    try {
      const result = await resetPassword(email)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Gagal mereset password')
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
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground mt-1">Masukkan email untuk mengatur ulang password</p>
        </div>

        {/* Reset Card */}
        <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardContent className="p-6">
            {success ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Email Terkirim!</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Link reset password telah dikirim ke <span className="font-medium text-foreground">{email}</span>. 
                    Silakan cek inbox email Anda.
                  </p>
                </div>
                <Button
                  onClick={() => setCurrentPage('login')}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium"
                >
                  Kembali ke Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                    {error}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="nama@sekolah.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                    className="h-11"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Link Reset'
                  )}
                </Button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Login
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
