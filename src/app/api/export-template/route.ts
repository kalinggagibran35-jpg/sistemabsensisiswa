import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = requireRole(request, ['admin'])
    if (!auth.authorized) {
      return auth.error === 'Unauthorized' ? unauthorizedResponse() : forbiddenResponse()
    }
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'students' | 'teachers' | 'counselors'
    const mode = searchParams.get('mode') as 'import' | 'edit'

    if (!type || !mode) {
      return NextResponse.json(
        { error: 'Type dan mode harus diisi' },
        { status: 400 }
      )
    }

    let csv = ''

    if (type === 'students') {
      if (mode === 'import') {
        csv = 'Nama,Email,NIS,Kelas,Nomor WA Orangtua\n'
      } else {
        // Edit mode: return existing student data with ID
        const students = await db.student.findMany({
          where: { status: 'active' },
          include: {
            user: { select: { name: true, email: true } },
            class: { select: { name: true } },
          },
          orderBy: { nis: 'asc' },
        })
        csv = 'NIS,Nama,Kelas,Nomor WA Orangtua\n'
        for (const s of students) {
          csv += `"${s.nis}","${s.user.name}","${s.class.name}","${s.parent_whatsapp || ''}"\n`
        }
      }
    } else if (type === 'teachers') {
      if (mode === 'import') {
        csv = 'Nama,Email,Password,Kelas Diampu,No. WA\n'
      } else {
        // Edit mode: return existing teacher data
        const teachers = await db.teacher.findMany({
          include: {
            user: { select: { name: true, email: true } },
            class_teachers: { include: { class: { select: { name: true } } } },
          },
        })
        csv = 'Email,Nama,Kelas Diampu,No. WA\n'
        for (const t of teachers) {
          const classNames = t.class_teachers.map((ct) => ct.class.name).join(';')
          csv += `"${t.user.email}","${t.user.name}","${classNames}","${t.phone || ''}"\n`
        }
      }
    } else if (type === 'counselors') {
      if (mode === 'import') {
        csv = 'Nama,Email,Password,No. WA\n'
      } else {
        // Edit mode: return existing counselor data
        const counselors = await db.counselor.findMany({
          include: {
            user: { select: { name: true, email: true } },
          },
        })
        csv = 'Email,Nama,No. WA\n'
        for (const c of counselors) {
          csv += `"${c.user.email}","${c.user.name}","${c.phone || ''}"\n`
        }
      }
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="template_${mode}_${type}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export template error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
