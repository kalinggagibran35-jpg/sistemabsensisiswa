import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const locations = await db.attendanceLocation.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        radius_meters: true,
        class_id: true,
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ success: true, data: locations })
  } catch (error) {
    console.error('Get attendance locations error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
