import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const activity_type = searchParams.get('activity_type')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const where: Record<string, unknown> = {}
    if (user_id) where.user_id = user_id
    if (activity_type) where.activity_type = activity_type

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.activityLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Get activity logs error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, user_name, user_role, activity_type, details } = body

    if (!user_name || !user_role || !activity_type) {
      return NextResponse.json(
        { error: 'Nama user, role, dan tipe aktivitas harus diisi' },
        { status: 400 }
      )
    }

    const log = await db.activityLog.create({
      data: {
        user_id: user_id || null,
        user_name,
        user_role,
        activity_type,
        details: details || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: log,
    })
  } catch (error) {
    console.error('Create activity log error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
