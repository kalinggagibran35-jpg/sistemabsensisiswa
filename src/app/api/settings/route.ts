import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { requireAuth, requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error)
    }
    const settings = await db.settings.findMany({
      orderBy: { key: 'asc' },
    })

    // Convert to key-value object
    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }

    return NextResponse.json({ success: true, data: settingsMap })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireRole(request, ['admin'])
    if (!auth.authorized) {
      return auth.error === 'Unauthorized' ? unauthorizedResponse() : forbiddenResponse()
    }
    const body = await request.json()
    const { settings, userName, userRole, userId } = body as {
      settings: Record<string, string>
      userName?: string
      userRole?: string
      userId?: string
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Data settings tidak valid' },
        { status: 400 }
      )
    }

    // Upsert each setting
    const operations = Object.entries(settings).map(([key, value]) =>
      db.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )

    await Promise.all(operations)

    // Log activity for each changed setting
    for (const key of Object.keys(settings)) {
      await logActivity({
        userId,
        userName: userName || 'Admin',
        userRole: userRole || 'admin',
        activityType: 'edit_pengaturan',
        details: `Mengubah pengaturan: ${key}`,
      })
    }

    // Return updated settings
    const updatedSettings = await db.settings.findMany({
      orderBy: { key: 'asc' },
    })

    const settingsMap: Record<string, string> = {}
    for (const s of updatedSettings) {
      settingsMap[s.key] = s.value
    }

    return NextResponse.json({
      success: true,
      data: settingsMap,
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
