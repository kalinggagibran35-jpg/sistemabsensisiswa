import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = requireRole(request, ['admin'])
    if (!auth.authorized) {
      return auth.error === 'Unauthorized' ? unauthorizedResponse() : forbiddenResponse()
    }
    const body = await request.json()
    const { type, data, userName, userRole, userId } = body as {
      type: 'students' | 'teachers' | 'counselors' | 'students-edit'
      data: Record<string, string>[]
      userName?: string
      userRole?: string
      userId?: string
    }

    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Type dan data harus diisi' },
        { status: 400 }
      )
    }

    const errors: Array<{ row: number; field: string; message: string }> = []
    let success = 0
    let failed = 0

    if (type === 'students-edit') {
      // Edit existing students by NIS
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        try {
          const nis = row['NIS'] || row['nis']
          if (!nis) {
            errors.push({ row: i + 1, field: 'NIS', message: 'NIS wajib diisi' })
            failed++
            continue
          }

          const student = await db.student.findUnique({ where: { nis } })
          if (!student) {
            errors.push({ row: i + 1, field: 'NIS', message: `Siswa dengan NIS ${nis} tidak ditemukan` })
            failed++
            continue
          }

          const studentUpdateData: Record<string, unknown> = {}
          const userUpdateData: Record<string, unknown> = {}

          const name = row['Nama'] || row['nama']
          if (name) userUpdateData.name = name

          const parentWA = row['Nomor WA Orangtua'] || row['WA Orangtua'] || row['parent_whatsapp']
          if (parentWA !== undefined) studentUpdateData.parent_whatsapp = parentWA || null

          const className = row['Kelas'] || row['kelas']
          if (className) {
            const cls = await db.class.findFirst({ where: { name: className } })
            if (cls) studentUpdateData.class_id = cls.id
          }

          if (Object.keys(userUpdateData).length > 0) {
            await db.user.update({ where: { id: student.user_id }, data: userUpdateData })
          }
          if (Object.keys(studentUpdateData).length > 0) {
            await db.student.update({ where: { id: student.id }, data: studentUpdateData })
          }

          success++
        } catch (err) {
          errors.push({ row: i + 1, field: 'general', message: String(err) })
          failed++
        }
      }

      await logActivity({
        userId,
        userName: userName || 'Admin',
        userRole: userRole || 'admin',
        activityType: 'edit_massal_siswa',
        details: `Edit massal siswa: ${success} berhasil, ${failed} gagal`,
      })
    } else if (type === 'students') {
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        try {
          const name = row['Nama'] || row['nama']
          const email = row['Email'] || row['email']
          const nis = row['NIS'] || row['nis']
          const className = row['Kelas'] || row['kelas']
          const parentWA = row['Nomor WA Orangtua'] || row['WA Orangtua'] || row['parent_whatsapp']

          // Validate required fields
          if (!name) { errors.push({ row: i + 1, field: 'Nama', message: 'Nama wajib diisi' }); failed++; continue }
          if (!email) { errors.push({ row: i + 1, field: 'Email', message: 'Email wajib diisi' }); failed++; continue }
          if (!nis) { errors.push({ row: i + 1, field: 'NIS', message: 'NIS wajib diisi' }); failed++; continue }
          if (!className) { errors.push({ row: i + 1, field: 'Kelas', message: 'Kelas wajib diisi' }); failed++; continue }

          // Check NIS uniqueness
          const existingNis = await db.student.findUnique({ where: { nis } })
          if (existingNis) { errors.push({ row: i + 1, field: 'NIS', message: `NIS ${nis} sudah terdaftar` }); failed++; continue }

          // Check email uniqueness
          const existingEmail = await db.user.findUnique({ where: { email } })
          if (existingEmail) { errors.push({ row: i + 1, field: 'Email', message: `Email ${email} sudah terdaftar` }); failed++; continue }

          // Validate WA format if provided
          if (parentWA) {
            const waRegex = /^(62|08)\d{8,13}$/
            if (!waRegex.test(parentWA.replace(/[\s-]/g, ''))) {
              errors.push({ row: i + 1, field: 'Nomor WA Orangtua', message: 'Format WA tidak valid (harus diawali 62/08, min 10 digit)' })
              failed++
              continue
            }
          }

          // Find class
          const cls = await db.class.findFirst({ where: { name: className } })
          if (!cls) { errors.push({ row: i + 1, field: 'Kelas', message: `Kelas ${className} tidak ditemukan` }); failed++; continue }

          // Create user
          const user = await db.user.create({
            data: {
              email,
              password: nis, // Default password is NIS
              name,
              role: 'siswa',
              phone: null,
            },
          })

          // Create student
          await db.student.create({
            data: {
              user_id: user.id,
              nis,
              class_id: cls.id,
              parent_whatsapp: parentWA || null,
            },
          })

          success++
        } catch (err) {
          errors.push({ row: i + 1, field: 'general', message: String(err) })
          failed++
        }
      }

      await logActivity({
        userId,
        userName: userName || 'Admin',
        userRole: userRole || 'admin',
        activityType: 'import_siswa',
        details: `Import siswa: ${success} berhasil, ${failed} gagal`,
      })
    } else if (type === 'teachers') {
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        try {
          const name = row['Nama'] || row['nama']
          const email = row['Email'] || row['email']
          const password = row['Password'] || row['password']
          const phone = row['No. WA'] || row['Nomor WA'] || row['phone']
          const classNames = row['Kelas Diampu'] || row['kelas'] || ''

          if (!name) { errors.push({ row: i + 1, field: 'Nama', message: 'Nama wajib diisi' }); failed++; continue }
          if (!email) { errors.push({ row: i + 1, field: 'Email', message: 'Email wajib diisi' }); failed++; continue }

          // Check email uniqueness
          const existingEmail = await db.user.findUnique({ where: { email } })
          if (existingEmail) { errors.push({ row: i + 1, field: 'Email', message: `Email ${email} sudah terdaftar` }); failed++; continue }

          // Validate WA format if provided
          if (phone) {
            const waRegex = /^(62|08)\d{8,13}$/
            if (!waRegex.test(phone.replace(/[\s-]/g, ''))) {
              errors.push({ row: i + 1, field: 'No. WA', message: 'Format WA tidak valid' })
              failed++
              continue
            }
          }

          // Create user
          const user = await db.user.create({
            data: {
              email,
              password: password || email,
              name,
              role: 'wali_kelas',
              phone: phone || null,
            },
          })

          // Create teacher
          const teacher = await db.teacher.create({
            data: {
              user_id: user.id,
              phone: phone || null,
            },
          })

          // Assign to classes if provided
          if (classNames) {
            const classNameList = classNames.split(';').map((c: string) => c.trim()).filter(Boolean)
            for (const cn of classNameList) {
              const cls = await db.class.findFirst({ where: { name: cn } })
              if (cls) {
                await db.classTeacher.create({
                  data: { class_id: cls.id, teacher_id: teacher.id },
                }).catch(() => { /* ignore duplicate */ })
              }
            }
          }

          success++
        } catch (err) {
          errors.push({ row: i + 1, field: 'general', message: String(err) })
          failed++
        }
      }

      await logActivity({
        userId,
        userName: userName || 'Admin',
        userRole: userRole || 'admin',
        activityType: 'import_wali_kelas',
        details: `Import wali kelas: ${success} berhasil, ${failed} gagal`,
      })
    } else if (type === 'counselors') {
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        try {
          const name = row['Nama'] || row['nama']
          const email = row['Email'] || row['email']
          const password = row['Password'] || row['password']
          const phone = row['No. WA'] || row['Nomor WA'] || row['phone']

          if (!name) { errors.push({ row: i + 1, field: 'Nama', message: 'Nama wajib diisi' }); failed++; continue }
          if (!email) { errors.push({ row: i + 1, field: 'Email', message: 'Email wajib diisi' }); failed++; continue }

          // Check email uniqueness
          const existingEmail = await db.user.findUnique({ where: { email } })
          if (existingEmail) { errors.push({ row: i + 1, field: 'Email', message: `Email ${email} sudah terdaftar` }); failed++; continue }

          // Validate WA format if provided
          if (phone) {
            const waRegex = /^(62|08)\d{8,13}$/
            if (!waRegex.test(phone.replace(/[\s-]/g, ''))) {
              errors.push({ row: i + 1, field: 'No. WA', message: 'Format WA tidak valid' })
              failed++
              continue
            }
          }

          // Create user
          const user = await db.user.create({
            data: {
              email,
              password: password || email,
              name,
              role: 'guru_bk',
              phone: phone || null,
            },
          })

          // Create counselor
          await db.counselor.create({
            data: {
              user_id: user.id,
              phone: phone || null,
            },
          })

          success++
        } catch (err) {
          errors.push({ row: i + 1, field: 'general', message: String(err) })
          failed++
        }
      }

      await logActivity({
        userId,
        userName: userName || 'Admin',
        userRole: userRole || 'admin',
        activityType: 'import_guru_bk',
        details: `Import guru BK: ${success} berhasil, ${failed} gagal`,
      })
    }

    return NextResponse.json({
      success: true,
      data: { success: success, failed: failed, errors },
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
