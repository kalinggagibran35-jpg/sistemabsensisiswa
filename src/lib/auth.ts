import type { CurrentUser } from './store'

export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: CurrentUser; error?: string }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'Gagal masuk' }
    }
    return { success: true, user: data.user }
  } catch {
    return { success: false, error: 'Terjadi kesalahan jaringan' }
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'Gagal mereset password' }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Terjadi kesalahan jaringan' }
  }
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oldPassword, newPassword }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'Gagal mengubah password' }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Terjadi kesalahan jaringan' }
  }
}
