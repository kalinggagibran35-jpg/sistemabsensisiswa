import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')

    const where: Record<string, unknown> = {}
    if (student_id) where.student_id = student_id

    const descriptors = await db.faceDescriptor.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ success: true, data: descriptors })
  } catch (error) {
    console.error('Get face descriptors error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, descriptor_data } = body

    if (!student_id || !descriptor_data) {
      return NextResponse.json(
        { error: 'student_id dan descriptor_data harus diisi' },
        { status: 400 }
      )
    }

    // Store descriptor as JSON string
    const descriptor = await db.faceDescriptor.create({
      data: {
        student_id,
        descriptor_data: JSON.stringify(descriptor_data),
      },
    })

    // Update student face_registered status
    await db.student.update({
      where: { id: student_id },
      data: { face_registered: true },
    })

    return NextResponse.json({
      success: true,
      data: descriptor,
    })
  } catch (error) {
    console.error('Create face descriptor error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID deskriptor harus diisi' },
        { status: 400 }
      )
    }

    await db.faceDescriptor.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Deskriptor wajah berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete face descriptor error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
