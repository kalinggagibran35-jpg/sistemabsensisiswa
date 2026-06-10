import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (in reverse dependency order)
  console.log('🧹 Cleaning existing data...');
  await prisma.faceDescriptor.deleteMany();
  await prisma.studentAuditLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reportScheduleLog.deleteMany();
  await prisma.reportSchedule.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.attendanceLocation.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.classTeacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.counselor.deleteMany();
  await prisma.class.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // 1. Default Admin User
  // ============================================
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sekolah.id',
      password: 'admin123', // In production, this should be hashed
      name: 'Administrator',
      role: 'admin',
      phone: '081234567890',
    },
  });

  // ============================================
  // 2. Default Settings
  // ============================================
  console.log('⚙️ Creating default settings...');
  const defaultSettings = [
    { key: 'school_name', value: 'SMA Negeri 1 Contoh' },
    { key: 'attendance_time_in', value: '07:00' },
    { key: 'attendance_time_late', value: '07:30' },
    { key: 'attendance_time_out', value: '15:00' },
    { key: 'attendance_out_deadline', value: '16:00' },
    { key: 'attendance_threshold', value: '80' },
    { key: 'face_threshold', value: '0.6' },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.create({ data: setting });
  }

  // ============================================
  // 3. Default Academic Year
  // ============================================
  console.log('📅 Creating academic year...');
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2025/2026',
      is_active: true,
      is_archived: false,
    },
  });

  // ============================================
  // 4. Sample Classes (3 classes)
  // ============================================
  console.log('🏫 Creating classes...');
  const classes = await Promise.all([
    prisma.class.create({
      data: {
        name: 'X',
        major: 'Rekayasa Perangkat Lunak',
        academic_year_id: academicYear.id,
      },
    }),
    prisma.class.create({
      data: {
        name: 'XI',
        major: 'Rekayasa Perangkat Lunak',
        academic_year_id: academicYear.id,
      },
    }),
    prisma.class.create({
      data: {
        name: 'XII',
        major: 'Rekayasa Perangkat Lunak',
        academic_year_id: academicYear.id,
      },
    }),
  ]);

  // ============================================
  // 5. Sample Teachers (2 teachers / wali kelas)
  // ============================================
  console.log('👨‍🏫 Creating teachers...');
  const teacherUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'budi@sekolah.id',
        password: 'admin123',
        name: 'Budi Santoso, S.Pd.',
        role: 'wali_kelas',
        phone: '081234567891',
      },
    }),
    prisma.user.create({
      data: {
        email: 'siti@sekolah.id',
        password: 'admin123',
        name: 'Siti Rahayu, S.Pd.',
        role: 'wali_kelas',
        phone: '081234567892',
      },
    }),
  ]);

  const teachers = await Promise.all([
    prisma.teacher.create({
      data: {
        user_id: teacherUsers[0].id,
        phone: '081234567891',
      },
    }),
    prisma.teacher.create({
      data: {
        user_id: teacherUsers[1].id,
        phone: '081234567892',
      },
    }),
  ]);

  // Assign teachers to classes (ClassTeacher junction)
  await Promise.all([
    prisma.classTeacher.create({
      data: {
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
      },
    }),
    prisma.classTeacher.create({
      data: {
        class_id: classes[1].id,
        teacher_id: teachers[1].id,
      },
    }),
  ]);

  // ============================================
  // 6. Sample Counselor (1 guru BK)
  // ============================================
  console.log('🧑‍💼 Creating counselor...');
  const counselorUser = await prisma.user.create({
    data: {
      email: 'dewi@sekolah.id',
      password: 'admin123',
      name: 'Dewi Lestari, S.Psi.',
      role: 'guru_bk',
      phone: '081234567893',
    },
  });

  const counselor = await prisma.counselor.create({
    data: {
      user_id: counselorUser.id,
      phone: '081234567893',
    },
  });

  // ============================================
  // 7. Sample Students (10 students)
  // ============================================
  console.log('🎓 Creating students...');
  const studentData = [
    { name: 'Ahmad Fauzi', nis: '20250001', classIdx: 0, parentWa: '6281234560001' },
    { name: 'Rina Wulandari', nis: '20250002', classIdx: 0, parentWa: '6281234560002' },
    { name: 'Rizky Pratama', nis: '20250003', classIdx: 0, parentWa: '6281234560003' },
    { name: 'Dina Safitri', nis: '20250004', classIdx: 0, parentWa: '6281234560004' },
    { name: 'Eko Saputra', nis: '20250101', classIdx: 1, parentWa: '6281234560005' },
    { name: 'Fitri Handayani', nis: '20250102', classIdx: 1, parentWa: '6281234560006' },
    { name: 'Gilang Ramadhan', nis: '20250103', classIdx: 1, parentWa: '6281234560007' },
    { name: 'Hani Mulyani', nis: '20250201', classIdx: 2, parentWa: '6281234560008' },
    { name: 'Irfan Maulana', nis: '20250202', classIdx: 2, parentWa: '6281234560009' },
    { name: 'Jasmine Putri', nis: '20250203', classIdx: 2, parentWa: '6281234560010' },
  ];

  const students = [];
  for (const sd of studentData) {
    const studentUser = await prisma.user.create({
      data: {
        email: sd.nis === '20250001' ? 'ahmad@sekolah.id' : `${sd.nis}@sekolah.id`,
        password: 'admin123',
        name: sd.name,
        role: 'siswa',
      },
    });

    const student = await prisma.student.create({
      data: {
        user_id: studentUser.id,
        nis: sd.nis,
        class_id: classes[sd.classIdx].id,
        parent_whatsapp: sd.parentWa,
        face_registered: false,
        status: 'active',
      },
    });

    students.push(student);
  }

  // ============================================
  // 8. Sample Attendance Location
  // ============================================
  console.log('📍 Creating attendance location...');
  await prisma.attendanceLocation.create({
    data: {
      name: 'Gerbang Utama Sekolah',
      latitude: -6.2088,
      longitude: 106.8456,
      radius_meters: 100,
      class_id: null, // Global for all classes
    },
  });

  // ============================================
  // 9. Sample Holidays
  // ============================================
  console.log('🎉 Creating holidays...');
  const holidays = [
    { date: '2025-01-01', name: 'Tahun Baru' },
    { date: '2025-01-29', name: 'Tahun Baru Imlek' },
    { date: '2025-03-31', name: 'Hari Raya Idul Fitri' },
    { date: '2025-04-01', name: 'Hari Raya Idul Fitri' },
    { date: '2025-05-01', name: 'Hari Buruh Internasional' },
    { date: '2025-05-12', name: 'Hari Raya Waisak' },
    { date: '2025-06-01', name: 'Hari Lahir Pancasila' },
    { date: '2025-06-07', name: 'Hari Raya Idul Adha' },
    { date: '2025-08-17', name: 'Hari Kemerdekaan RI' },
    { date: '2025-12-25', name: 'Hari Natal' },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.create({ data: holiday });
  }

  // ============================================
  // Summary
  // ============================================
  console.log('\n✅ Seeding completed!');
  console.log('──────────────────────────────');
  console.log(`👤 Admin user: admin@sekolah.id / admin123`);
  console.log(`👨‍🏫 Teachers: ${teachers.length}`);
  console.log(`🧑‍💼 Counselors: 1`);
  console.log(`🎓 Students: ${students.length}`);
  console.log(`🏫 Classes: ${classes.length}`);
  console.log(`📅 Academic Year: ${academicYear.name}`);
  console.log(`⚙️ Settings: ${defaultSettings.length}`);
  console.log(`🎉 Holidays: ${holidays.length}`);
  console.log('──────────────────────────────');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
