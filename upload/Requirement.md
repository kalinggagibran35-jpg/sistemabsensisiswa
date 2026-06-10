# Dokumen Kebutuhan

## 1. Ringkasan Aplikasi

**Nama Aplikasi**: Sistem Absensi dengan Pengenalan Wajah

**Deskripsi**: Aplikasi web untuk mengelola absensi siswa menggunakan teknologi pengenalan wajah dan validasi lokasi. Sistem mendukung absensi masuk/keluar via pemindaian wajah atau QR code, manajemen izin/sakit digital, notifikasi real-time, laporan kehadiran otomatis via WhatsApp, rekap PDF, manajemen kelas dan tahun ajaran, serta dashboard analitik untuk admin, wali kelas, guru BK, dan siswa.

## 2. Pengguna dan Skenario Penggunaan

### 2.1 Pengguna Target
- **Admin**: Mengelola siswa, wali kelas, guru BK, kelas, tahun ajaran, lokasi absensi, registrasi wajah, absensi manual, jadwal laporan WA, pengaturan sistem, approval izin/sakit, log aktivitas, reset password, catatan absensi, threshold pengenalan wajah, multiple lokasi absensi, edit massal via file, customisasi template WA, pause/resume jadwal, pengiriman laporan manual, pengaturan libur, arsip siswa, dark mode
- **Wali Kelas**: Memantau kehadiran kelas yang diampu (dapat lebih dari satu kelas), approval izin/sakit siswa kelasnya, melihat rekap kehadiran, download laporan PDF, edit data siswa, registrasi wajah siswa
- **Guru BK**: Memantau kehadiran semua kelas, melihat detail siswa, laporan pelanggaran kehadiran, menerima notifikasi WA otomatis, edit data siswa, registrasi wajah siswa
- **Siswa**: Melakukan absensi (wajah/QR code), mengajukan izin/sakit, melihat riwayat absensi pribadi, menerima reminder absensi

### 2.2 Skenario Penggunaan Utama
- Admin mengatur tahun ajaran aktif dan mengarsip data tahun ajaran sebelumnya
- Admin membuat kelas baru dan menugaskan wali kelas ke kelas tersebut (wali kelas dapat mengampu lebih dari satu kelas)
- Admin mengunduh template import siswa/wali kelas/guru BK, mengisi data, dan mengupload file untuk import massal atau edit massal
- Admin atau wali kelas atau guru BK mendaftarkan wajah siswa baru atau generate QR code untuk absensi
- Admin mengatur multiple lokasi absensi (koordinat dan radius) untuk kelas atau gedung berbeda
- Admin mengatur threshold pengenalan wajah untuk akurasi deteksi
- Admin membuat jadwal pengiriman laporan kehadiran otomatis via WhatsApp dan dapat pause/resume jadwal
- Admin mengcustomisasi template pesan WhatsApp untuk laporan
- Admin mengirim laporan kehadiran manual di luar jadwal
- Admin melihat statistik pengiriman laporan WA (rata-rata waktu kirim, tingkat keberhasilan)
- Sistem mengirim laporan kehadiran otomatis ke orangtua dan wali kelas sesuai jadwal
- Sistem mengirim notifikasi WA otomatis ke guru BK untuk siswa dengan ketidakhadiran >= 3 kali per minggu
- Sistem mengirim notifikasi email untuk laporan kehadiran
- Sistem mengirim reminder otomatis ke siswa yang belum absensi
- Admin melihat dashboard dengan statistik real-time, grafik tren kehadiran, heatmap, top 10 siswa absen terbanyak, perbandingan antar kelas
- Admin mengelola absensi manual (tambah, edit, hapus, bulk action) dan menambahkan catatan pada record absensi
- Admin melihat log aktivitas sistem untuk audit dan riwayat perubahan data siswa
- Admin mengatur kalender cuti/libur sekolah
- Admin mengarsipkan data siswa yang lulus atau pindah
- Admin mengaktifkan dark mode untuk dashboard
- Admin export grafik kehadiran ke format PNG
- Siswa berada di lokasi absensi dan melakukan absensi masuk/keluar dengan scan wajah atau scan QR code dinamis
- Siswa mengajukan izin/sakit dengan upload bukti (surat dokter/foto)
- Wali kelas atau admin menerima notifikasi real-time untuk pengajuan izin/sakit dan melakukan approval (approval bertingkat: wali kelas → admin)
- Wali kelas melihat dashboard kelas dengan statistik kehadiran dan daftar siswa
- Wali kelas download laporan PDF rekap kehadiran kelas
- Guru BK melihat dashboard BK dengan statistik semua kelas dan laporan pelanggaran kehadiran
- Admin/wali kelas/guru BK/siswa melihat halaman profil lengkap siswa dengan grafik kehadiran bulanan, persentase hadir/sakit/izin/alpa, riwayat lengkap
- Admin/wali kelas/guru BK melihat laporan kehadiran per minggu, per semester, atau perbandingan antar tahun ajaran
- Admin/wali kelas/guru BK memfilter laporan hanya untuk siswa yang tidak hadir
- Semua pengguna mengelola profil akun (edit foto, ganti password, reset password via email)
- Semua pengguna menerima notifikasi in-app real-time untuk peristiwa penting

## 3. Struktur Halaman dan Fungsi

```
Aplicasi Absensi
├── Halaman Login
├── Halaman Reset Password
├── Dashboard Admin
│   ├── Widget Statistik Real-time
│   ├── Grafik Tren Kehadiran (7 hari/mingguan/bulanan)
│   ├── Heatmap Kehadiran Per Hari
│   ├── Grafik Distribusi Status Kehadiran Hari Ini
│   ├── Tabel Top 10 Siswa Absensi Terendah Bulan Ini
│   ├── Perbandingan Kehadiran Antar Kelas
│   ├── Status Absensi Real-time
│   ├── Manajemen Kelas
│   │   ├── Daftar Kelas
│   │   ├── Tambah Kelas
│   │   ├── Edit Kelas
│   │   ├── Hapus Kelas
│   │   └── Assign Wali Kelas (multiple kelas)
│   ├── Manajemen Siswa
│   │   ├── Daftar Siswa
│   │   ├── Tambah Siswa
│   │   ├── Edit Siswa
│   │   ├── Hapus Siswa
│   │   ├── Unduh Template Import
│   │   ├── Upload File Import
│   │   ├── Unduh Template Edit Massal
│   │   ├── Upload File Edit Massal
│   │   ├── Arsipkan Siswa
│   │   └── Lihat Profil Lengkap Siswa
│   ├── Registrasi Wajah
│   ├── Generate QR Code Absensi (dinamis)
│   ├── Pengaturan Lokasi Absensi (multiple lokasi)
│   ├── Manajemen Wali Kelas
│   │   ├── Daftar Wali Kelas
│   │   ├── Tambah Wali Kelas
│   │   ├── Edit Wali Kelas
│   │   ├── Hapus Wali Kelas
│   │   ├── Unduh Template Import
│   │   ├── Upload File Import
│   │   ├── Unduh Template Edit Massal
│   │   └── Upload File Edit Massal
│   ├── Manajemen Guru BK
│   │   ├── Daftar Guru BK
│   │   ├── Tambah Guru BK
│   │   ├── Edit Guru BK
│   │   ├── Hapus Guru BK
│   │   ├── Unduh Template Import
│   │   ├── Upload File Import
│   │   ├── Unduh Template Edit Massal
│   │   └── Upload File Edit Massal
│   ├── Manajemen Absensi Manual
│   │   ├── Daftar Record Absensi
│   │   ├── Tambah Absensi Manual
│   │   ├── Edit Absensi Manual
│   │   ├── Hapus Absensi Manual
│   │   ├── Tambah Catatan pada Absensi
│   │   └── Bulk Action Absensi
│   ├── Manajemen Izin/Sakit
│   │   ├── Daftar Pengajuan Izin/Sakit
│   │   ├── Approval/Reject Pengajuan (approval bertingkat)
│   │   └── Lihat Bukti Upload
│   ├── Laporan Absensi
│   │   ├── Filter Laporan (termasuk filter hanya siswa tidak hadir)
│   │   ├── Ringkasan Statistik Laporan
│   │   ├── Rekap Bulanan Per Siswa
│   │   ├── Rekap Bulanan Per Kelas
│   │   ├── Rekap Mingguan
│   │   ├── Rekap Per Semester
│   │   ├── Perbandingan Antar Tahun Ajaran
│   │   ├── Ekspor CSV
│   │   ├── Download PDF
│   │   └── Export Grafik ke PNG
│   ├── Jadwal Laporan WA
│   │   ├── Daftar Jadwal
│   │   ├── Tambah Jadwal
│   │   ├── Edit Jadwal
│   │   ├── Hapus Jadwal
│   │   ├── Pause/Resume Jadwal
│   │   ├── Kirim Laporan Manual
│   │   ├── Customisasi Template Pesan WA
│   │   ├── Statistik Pengiriman
│   │   └── Log Pengiriman
│   ├── Pengaturan Tahun Ajaran
│   │   ├── Tahun Ajaran Aktif
│   │   ├── Arsip Tahun Ajaran
│   │   └── Ganti Tahun Ajaran Aktif
│   ├── Pengaturan Sistem
│   │   ├── Pengaturan Umum
│   │   ├── Pengaturan Jam Absensi
│   │   ├── Pengaturan Ambang Batas Kehadiran
│   │   ├── Pengaturan Threshold Pengenalan Wajah
│   │   ├── Pengaturan Batas Waktu Absensi Keluar
│   │   ├── Kalender Cuti/Libur Sekolah
│   │   └── Dark Mode Toggle
│   ├── Log Aktivitas Sistem
│   ├── Audit Log Perubahan Data Siswa
│   ├── Notifikasi In-App
│   └── Profil Akun
├── Dashboard Wali Kelas
│   ├── Statistik Kehadiran Kelas (multiple kelas)
│   ├── Daftar Siswa Kelas
│   ├── Rekap Kehadiran Kelas
│   ├── Download Laporan PDF Kelas
│   ├── Manajemen Siswa Kelas
│   │   ├── Edit Siswa
│   │   └── Registrasi Wajah Siswa
│   ├── Manajemen Izin/Sakit Kelas
│   │   ├── Daftar Pengajuan Izin/Sakit
│   │   ├── Approval Pengajuan (tingkat pertama)
│   │   └── Lihat Bukti Upload
│   ├── Notifikasi In-App
│   └── Profil Akun
├── Dashboard Guru BK
│   ├── Statistik Kehadiran Semua Kelas
│   ├── Rekap Semua Kelas
│   ├── Detail Siswa
│   ├── Laporan Pelanggaran Kehadiran
│   ├── Manajemen Siswa
│   │   ├── Edit Siswa
│   │   └── Registrasi Wajah Siswa
│   ├── Notifikasi In-App
│   └── Profil Akun
├── Dashboard Siswa
│   ├── Riwayat Absensi Pribadi
│   ├── Pengajuan Izin/Sakit
│   │   ├── Form Pengajuan
│   │   ├── Upload Bukti
│   │   └── Status Pengajuan
│   ├── Notifikasi In-App
│   ├── Reminder Absensi
│   └── Profil Akun
├── Halaman Absensi (Scan Wajah)
│   ├── Absensi Masuk
│   └── Absensi Keluar
├── Halaman Absensi (Scan QR Code Dinamis)
│   ├── Absensi Masuk
│   └── Absensi Keluar
└── Halaman Profil Lengkap Siswa
    ├── Informasi Siswa
    ├── Grafik Kehadiran Bulanan
    ├── Persentase Hadir/Sakit/Izin/Alpa
    └── Riwayat Absensi Lengkap
```

### 3.1 Halaman Login

**Fungsi**:
- Pengguna memasukkan kredensial (email dan password)
- Sistem memvalidasi kredensial melalui Supabase Auth
- Setelah berhasil login, pengguna diarahkan ke dashboard sesuai peran
- Terdapat link ke halaman reset password

### 3.2 Halaman Reset Password

**Fungsi**:
- Pengguna memasukkan email yang terdaftar
- Sistem mengirim link reset password ke email pengguna via Supabase Auth
- Pengguna mengklik link di email dan diarahkan ke halaman untuk memasukkan password baru
- Sistem memperbarui password pengguna

### 3.3 Dashboard Admin

#### 3.3.1 Widget Statistik Real-time
**Fungsi**:
- Menampilkan jumlah total siswa, jumlah hadir hari ini, jumlah tidak hadir hari ini, jumlah terlambat hari ini, persentase kehadiran bulan berjalan

#### 3.3.2 Grafik Tren Kehadiran
**Fungsi**:
- Menampilkan grafik bar chart atau line chart untuk 7 hari terakhir, mingguan, atau bulanan
- Sumbu X: tanggal/minggu/bulan, sumbu Y: jumlah siswa hadir/tidak hadir/terlambat
- Admin dapat memilih periode tampilan (7 hari/mingguan/bulanan)
- Admin dapat export grafik ke format PNG

#### 3.3.3 Heatmap Kehadiran Per Hari
**Fungsi**:
- Menampilkan heatmap kalender dengan warna berbeda untuk setiap hari berdasarkan persentase kehadiran
- Warna hijau untuk kehadiran tinggi, kuning untuk sedang, merah untuk rendah
- Admin dapat memilih bulan yang ditampilkan

#### 3.3.4 Grafik Distribusi Status Kehadiran Hari Ini
**Fungsi**:
- Menampilkan grafik pie chart atau donut chart distribusi status kehadiran hari ini (hadir, tidak hadir, terlambat, izin, sakit)

#### 3.3.5 Tabel Top 10 Siswa Absensi Terendah Bulan Ini
**Fungsi**:
- Menampilkan tabel 10 siswa dengan jumlah kehadiran terendah bulan berjalan
- Kolom: nama siswa, kelas, jumlah hadir, jumlah tidak hadir, persentase kehadiran

#### 3.3.6 Perbandingan Kehadiran Antar Kelas
**Fungsi**:
- Menampilkan grafik bar chart perbandingan persentase kehadiran antar kelas bulan berjalan
- Sumbu X: nama kelas, sumbu Y: persentase kehadiran

#### 3.3.7 Status Absensi Real-time
**Fungsi**:
- Menampilkan daftar siswa yang sudah absensi masuk hari ini beserta waktu absensi
- Menampilkan daftar siswa yang belum absensi
- Menampilkan daftar siswa yang sudah absensi keluar beserta waktu absensi
- Data diperbarui secara otomatis tanpa refresh halaman

#### 3.3.8 Manajemen Kelas

**3.3.8.1 Daftar Kelas**
**Fungsi**:
- Menampilkan tabel kelas: nama kelas, jurusan, wali kelas (dapat lebih dari satu), jumlah siswa
- Menyediakan tombol tambah, edit, hapus kelas, assign wali kelas

**3.3.8.2 Tambah Kelas**
**Fungsi**:
- Admin mengisi formulir: nama kelas, jurusan
- Sistem menyimpan data kelas ke database

**3.3.8.3 Edit Kelas**
**Fungsi**:
- Admin memilih kelas dari daftar
- Admin mengubah nama kelas atau jurusan
- Sistem memperbarui data di database

**3.3.8.4 Hapus Kelas**
**Fungsi**:
- Admin memilih kelas yang akan dihapus
- Sistem menampilkan konfirmasi penghapusan
- Setelah konfirmasi, sistem menghapus data kelas dari database

**3.3.8.5 Assign Wali Kelas**
**Fungsi**:
- Admin memilih kelas dari daftar
- Admin memilih satu atau lebih wali kelas dari dropdown
- Sistem menyimpan assignment wali kelas ke kelas tersebut

#### 3.3.9 Manajemen Siswa

**3.3.9.1 Daftar Siswa**
**Fungsi**:
- Menampilkan tabel siswa: nama, email, kelas, NIS, nomor WA orangtua, status registrasi wajah, status (aktif/arsip)
- Menyediakan tombol tambah, edit, hapus, unduh template import, upload file import, unduh template edit massal, upload file edit massal, arsipkan siswa, lihat profil lengkap

**3.3.9.2 Tambah Siswa**
**Fungsi**:
- Admin mengisi formulir: nama, email, kelas, NIS, nomor WA orangtua
- Sistem menyimpan data siswa ke database

**3.3.9.3 Edit Siswa**
**Fungsi**:
- Admin memilih siswa dari daftar
- Admin mengubah data siswa
- Sistem menyimpan riwayat perubahan ke audit log
- Sistem memperbarui data di database

**3.3.9.4 Hapus Siswa**
**Fungsi**:
- Admin memilih siswa yang akan dihapus
- Sistem menampilkan konfirmasi penghapusan
- Setelah konfirmasi, sistem menghapus data siswa dan data wajah terkait dari database

**3.3.9.5 Unduh Template Import**
**Fungsi**:
- Admin mengklik tombol unduh template
- Sistem menghasilkan file template Excel/CSV dengan kolom: nama_lengkap, nis, kelas, jurusan, nomor_wa_orangtua
- File template diunduh ke perangkat admin

**3.3.9.6 Upload File Import**
**Fungsi**:
- Admin memilih file Excel/CSV yang sudah diisi
- Sistem membaca dan memvalidasi data file
- Sistem menampilkan preview data
- Admin mengkonfirmasi import
- Sistem menyimpan data siswa secara massal ke database
- Sistem menampilkan hasil import (jumlah berhasil, jumlah gagal, detail error)

**3.3.9.7 Unduh Template Edit Massal**
**Fungsi**:
- Admin mengklik tombol unduh template edit massal
- Sistem menghasilkan file Excel/CSV berisi data siswa yang sudah ada dengan kolom: id, nama_lengkap, nis, kelas, jurusan, nomor_wa_orangtua
- File template diunduh ke perangkat admin

**3.3.9.8 Upload File Edit Massal**
**Fungsi**:
- Admin memilih file Excel/CSV yang sudah diedit
- Sistem membaca dan memvalidasi data file
- Sistem menampilkan preview perubahan data
- Admin mengkonfirmasi edit massal
- Sistem memperbarui data siswa secara massal di database
- Sistem menyimpan riwayat perubahan ke audit log
- Sistem menampilkan hasil edit massal (jumlah berhasil, jumlah gagal, detail error)

**3.3.9.9 Arsipkan Siswa**
**Fungsi**:
- Admin memilih siswa yang akan diarsipkan (lulus atau pindah)
- Sistem menampilkan konfirmasi pengarsipan
- Setelah konfirmasi, sistem mengubah status siswa menjadi arsip
- Data siswa tetap tersimpan di database tetapi tidak muncul di daftar siswa aktif

**3.3.9.10 Lihat Profil Lengkap Siswa**
**Fungsi**:
- Admin memilih siswa dari daftar
- Sistem menampilkan halaman profil lengkap siswa (lihat 3.10)

#### 3.3.10 Registrasi Wajah
**Fungsi**:
- Admin atau wali kelas atau guru BK memilih siswa yang belum terdaftar wajahnya
- Sistem mengaktifkan kamera untuk menangkap wajah siswa
- Sistem mendeteksi wajah menggunakan face-api.js
- Admin/wali kelas/guru BK mengambil beberapa foto wajah dari berbagai sudut
- Sistem menyimpan data wajah (face descriptors) ke Supabase Storage dan menghubungkannya dengan data siswa

#### 3.3.11 Generate QR Code Absensi
**Fungsi**:
- Admin mengklik tombol generate QR code
- Sistem menghasilkan QR code unik dinamis yang berubah setiap sesi atau setiap jam
- Admin dapat menampilkan QR code di layar atau mencetak untuk ditempel di lokasi absensi
- Sistem menyimpan QR code dan masa berlakunya ke database

#### 3.3.12 Pengaturan Lokasi Absensi
**Fungsi**:
- Admin dapat menambah multiple lokasi absensi untuk kelas atau gedung berbeda
- Admin mengatur titik koordinat lokasi absensi (latitude dan longitude) untuk setiap lokasi
- Admin mengatur radius lokasi absensi dalam meter untuk setiap lokasi
- Admin dapat menugaskan lokasi tertentu ke kelas tertentu
- Sistem menyimpan pengaturan lokasi ke database
- Sistem menyimpan riwayat perubahan lokasi absensi

#### 3.3.13 Manajemen Wali Kelas

**3.3.13.1 Daftar Wali Kelas**
**Fungsi**:
- Menampilkan tabel wali kelas: nama, email, kelas yang diampu (dapat lebih dari satu), nomor WA
- Menyediakan tombol tambah, edit, hapus, unduh template import, upload file import, unduh template edit massal, upload file edit massal

**3.3.13.2 Tambah Wali Kelas**
**Fungsi**:
- Admin mengisi formulir: nama, email, password, kelas yang diampu (dapat pilih multiple kelas), nomor WA
- Sistem membuat akun wali kelas dengan role wali_kelas di Supabase Auth
- Sistem menyimpan data wali kelas ke database

**3.3.13.3 Edit Wali Kelas**
**Fungsi**:
- Admin memilih wali kelas dari daftar
- Admin mengubah data wali kelas (termasuk kelas yang diampu)
- Sistem memperbarui data di database

**3.3.13.4 Hapus Wali Kelas**
**Fungsi**:
- Admin memilih wali kelas yang akan dihapus
- Sistem menampilkan konfirmasi penghapusan
- Setelah konfirmasi, sistem menghapus akun dan data wali kelas dari database

**3.3.13.5 Unduh Template Import**
**Fungsi**:
- Admin mengklik tombol unduh template
- Sistem menghasilkan file template Excel/CSV dengan kolom: nama_lengkap, username, password, kelas_diampu (dapat multiple, dipisah koma), nomor_wa
- File template diunduh ke perangkat admin

**3.3.13.6 Upload File Import**
**Fungsi**:
- Admin memilih file Excel/CSV yang sudah diisi
- Sistem membaca dan memvalidasi data file
- Sistem menampilkan preview data
- Admin mengkonfirmasi import
- Sistem membuat akun wali kelas secara massal dengan role wali_kelas di Supabase Auth
- Sistem menyimpan data wali kelas secara massal ke database
- Sistem menampilkan hasil import (jumlah berhasil, jumlah gagal, detail error)

**3.3.13.7 Unduh Template Edit Massal**
**Fungsi**:
- Admin mengklik tombol unduh template edit massal
- Sistem menghasilkan file Excel/CSV berisi data wali kelas yang sudah ada dengan kolom: id, nama_lengkap, username, kelas_diampu, nomor_wa
- File template diunduh ke perangkat admin

**3.3.13.8 Upload File Edit Massal**
**Fungsi**:
- Admin memilih file Excel/CSV yang sudah diedit
- Sistem membaca dan memvalidasi data file
- Sistem menampilkan preview perubahan data
- Admin mengkonfirmasi edit massal
- Sistem memperbarui data wali kelas secara massal di database
- Sistem menampilkan hasil edit massal (jumlah berhasil, jumlah gagal, detail error)

#### 3.3.14 Manajemen Guru BK

**3.3.14.1 Daftar Guru BK**
**Fungsi**:
- Menampilkan tabel guru BK: nama, email, nomor WA
- Menyediakan tombol tambah, edit, hapus, unduh template import, upload file import, unduh template edit massal, upload file edit massal

**3.3.14.2 Tambah Guru BK**
**Fungsi**:
- Admin mengisi formulir: nama, email, password, nomor WA
- Sistem membuat akun guru BK dengan role guru_bk di Supabase Auth
- Sistem menyimpan data guru BK ke database

**3.3.14.3 Edit Guru BK**
**Fungsi**:
- Admin memilih guru BK dari daftar
- Admin mengubah data guru BK
- Sistem memperbarui data di database

**3.3.14.4 Hapus Guru BK**
**Fungsi**:
- Admin memilih guru BK yang akan dihapus
- Sistem menampilkan konfirmasi penghapusan
- Setelah konfirmasi, sistem menghapus akun dan data guru BK dari database

**3.3.14.5 Unduh Template Import**
**Fungsi**:
- Admin mengklik tombol unduh template
- Sistem menghasilkan file template Excel/CSV dengan kolom: nama_lengkap, username, password, nomor_wa
- File template diunduh ke perangkat admin

**3.3.14.6 Upload File Import**
**Fungsi**:
- Admin memilih file Excel/CSV yang sudah diisi
- Sistem membaca dan memvalidasi data file
- Sistem menampilkan preview data
- Admin mengkonfirmasi import
- Sistem membuat akun guru BK secara massal dengan role guru_bk di Supabase Auth
- Sistem menyimpan data guru BK secara massal ke database
- Sistem menampilkan hasil import (jumlah berhasil, jumlah gagal, detail error)

**3.3.14.7 Unduh Template Edit Massal**
**Fungsi**:
- Admin mengklik tombol unduh template edit massal
- Sistem menghasilkan file Excel/CSV berisi data guru BK yang sudah ada dengan kolom: id, nama_lengkap, username, nomor_wa
- File template diunduh ke perangkat admin

**3.3.14.8 Upload File Edit Massal**
**Fungsi**:
- Admin memilih file Excel/CSV yang sudah diedit
- Sistem membaca dan memvalidasi data file
- Sistem menampilkan preview perubahan data
- Admin mengkonfirmasi edit massal
- Sistem memperbarui data guru BK secara massal di database
- Sistem menampilkan hasil edit massal (jumlah berhasil, jumlah gagal, detail error)

#### 3.3.15 Manajemen Absensi Manual

**3.3.15.1 Daftar Record Absensi**
**Fungsi**:
- Menampilkan tabel record absensi: nama siswa, NIS, kelas, tanggal, waktu masuk, waktu keluar, status kehadiran, catatan
- Menyediakan filter berdasarkan kelas, tanggal, status kehadiran
- Menyediakan tombol tambah, edit, hapus, tambah catatan, bulk action

**3.3.15.2 Tambah Absensi Manual**
**Fungsi**:
- Admin mengisi formulir: pilih siswa, tanggal, waktu masuk, waktu keluar (opsional), status kehadiran, catatan (opsional)
- Sistem memvalidasi tidak ada duplikat absensi untuk siswa yang sama pada tanggal yang sama
- Sistem menyimpan record absensi ke database

**3.3.15.3 Edit Absensi Manual**
**Fungsi**:
- Admin memilih record absensi dari daftar
- Admin mengubah data absensi (termasuk catatan)
- Sistem memvalidasi perubahan dan memperbarui data di database

**3.3.15.4 Hapus Absensi Manual**
**Fungsi**:
- Admin memilih record absensi yang akan dihapus
- Sistem menampilkan konfirmasi penghapusan
- Setelah konfirmasi, sistem menghapus record absensi dari database

**3.3.15.5 Tambah Catatan pada Absensi**
**Fungsi**:
- Admin memilih record absensi dari daftar
- Admin menambahkan atau mengedit catatan pada record absensi
- Sistem menyimpan catatan ke database

**3.3.15.6 Bulk Action Absensi**
**Fungsi**:
- Admin memilih tanggal tertentu
- Admin memilih beberapa siswa menggunakan checkbox
- Admin memilih action: tandai sebagai hadir atau tandai sebagai tidak hadir
- Sistem membuat atau memperbarui record absensi untuk siswa yang dipilih pada tanggal tersebut

#### 3.3.16 Manajemen Izin/Sakit

**3.3.16.1 Daftar Pengajuan Izin/Sakit**
**Fungsi**:
- Menampilkan tabel pengajuan izin/sakit: nama siswa, kelas, tanggal pengajuan, tanggal izin/sakit, jenis (izin/sakit), alasan, status (pending/approved_wali_kelas/approved_admin/rejected), bukti upload
- Menyediakan filter berdasarkan kelas, status, jenis

**3.3.16.2 Approval/Reject Pengajuan**
**Fungsi**:
- Admin melihat pengajuan yang sudah diapprove oleh wali kelas (status: approved_wali_kelas)
- Admin melihat detail pengajuan dan bukti upload
- Admin mengklik tombol approve atau reject
- Sistem memperbarui status pengajuan di database (approved_admin atau rejected)
- Sistem mengirim notifikasi in-app ke siswa tentang hasil approval

**3.3.16.3 Lihat Bukti Upload**
**Fungsi**:
- Admin mengklik link bukti upload pada pengajuan
- Sistem menampilkan gambar atau file bukti yang diupload siswa

#### 3.3.17 Laporan Absensi

**3.3.17.1 Filter Laporan**
**Fungsi**:
- Admin memilih filter: per kelas, per siswa, per rentang tanggal, per status kehadiran, hanya siswa tidak hadir, per minggu, per semester, perbandingan antar tahun ajaran
- Sistem menampilkan data absensi sesuai filter

**3.3.17.2 Ringkasan Statistik Laporan**
**Fungsi**:
- Menampilkan ringkasan statistik berdasarkan filter: total hadir, total tidak hadir, total terlambat, total izin, total sakit, persentase kehadiran

**3.3.17.3 Rekap Bulanan Per Siswa**
**Fungsi**:
- Admin memilih bulan dan tahun
- Sistem menampilkan grid kehadiran: baris berisi nama siswa, kolom berisi hari-hari dalam bulan
- Setiap sel menampilkan status kehadiran siswa pada hari tersebut (hadir, tidak hadir, terlambat, izin, sakit)

**3.3.17.4 Rekap Bulanan Per Kelas**
**Fungsi**:
- Admin memilih kelas, bulan, dan tahun
- Sistem menampilkan grid kehadiran untuk semua siswa di kelas tersebut

**3.3.17.5 Rekap Mingguan**
**Fungsi**:
- Admin memilih minggu dan tahun
- Sistem menampilkan data absensi siswa untuk minggu tersebut

**3.3.17.6 Rekap Per Semester**
**Fungsi**:
- Admin memilih semester (1 atau 2) dan tahun ajaran
- Sistem menampilkan data absensi siswa untuk semester tersebut

**3.3.17.7 Perbandingan Antar Tahun Ajaran**
**Fungsi**:
- Admin memilih dua atau lebih tahun ajaran untuk dibandingkan
- Sistem menampilkan grafik perbandingan persentase kehadiran antar tahun ajaran

**3.3.17.8 Ekspor CSV**
**Fungsi**:
- Admin dapat mengekspor laporan dalam format CSV
- Laporan berisi data absensi sesuai filter: nama siswa, NIS, kelas, tanggal, waktu masuk, waktu keluar, status kehadiran

**3.3.17.9 Download PDF**
**Fungsi**:
- Admin dapat mengekspor laporan dalam format PDF
- Laporan berisi data absensi sesuai filter dan ringkasan statistik
- Sistem menghasilkan PDF di browser dan admin dapat langsung download

**3.3.17.10 Export Grafik ke PNG**
**Fungsi**:
- Admin dapat export grafik kehadiran (tren, heatmap, distribusi) ke format PNG
- Sistem menghasilkan file PNG dan admin dapat langsung download

#### 3.3.18 Jadwal Laporan WA

**3.3.18.1 Daftar Jadwal**
**Fungsi**:
- Menampilkan tabel jadwal pengiriman laporan WA: nama jadwal, jenis laporan (harian/mingguan), waktu pengiriman, hari pengiriman, penerima, filter kelas, status (aktif/nonaktif/paused)
- Menyediakan tombol tambah, edit, hapus, pause/resume, kirim manual, customisasi template, lihat statistik, lihat log pengiriman

**3.3.18.2 Tambah Jadwal**
**Fungsi**:
- Admin mengisi formulir konfigurasi jadwal: nama jadwal, jenis laporan (daily/weekly), waktu pengiriman, hari pengiriman, penerima (orangtua/wali kelas/keduanya), filter kelas, status aktif/nonaktif
- Sistem menyimpan jadwal ke tabel report_schedules di database

**3.3.18.3 Edit Jadwal**
**Fungsi**:
- Admin memilih jadwal dari daftar
- Admin mengubah konfigurasi jadwal
- Sistem memperbarui data jadwal di database

**3.3.18.4 Hapus Jadwal**
**Fungsi**:
- Admin memilih jadwal yang akan dihapus
- Sistem menampilkan konfirmasi penghapusan
- Setelah konfirmasi, sistem menghapus jadwal dari database

**3.3.18.5 Pause/Resume Jadwal**
**Fungsi**:
- Admin memilih jadwal dari daftar
- Admin mengklik tombol pause atau resume
- Sistem memperbarui status jadwal menjadi paused atau aktif
- Jadwal yang di-pause tidak akan mengirim laporan sampai di-resume

**3.3.18.6 Kirim Laporan Manual**
**Fungsi**:
- Admin memilih jadwal dari daftar
- Admin mengklik tombol kirim manual
- Sistem mengirim laporan WA sesuai konfigurasi jadwal di luar waktu terjadwal
- Sistem mencatat log pengiriman manual

**3.3.18.7 Customisasi Template Pesan WA**
**Fungsi**:
- Admin memilih jadwal dari daftar
- Admin mengklik tombol customisasi template
- Sistem menampilkan editor template pesan WA dengan placeholder dinamis (nama siswa, kelas, status kehadiran, dll)
- Admin mengedit template pesan
- Sistem menyimpan template ke database

**3.3.18.8 Statistik Pengiriman**
**Fungsi**:
- Admin memilih jadwal dari daftar
- Sistem menampilkan statistik pengiriman: rata-rata waktu kirim, tingkat keberhasilan (persentase berhasil vs gagal), total WA terkirim, total WA gagal
- Sistem menampilkan grafik tren pengiriman

**3.3.18.9 Log Pengiriman**
**Fungsi**:
- Menampilkan riwayat pengiriman laporan WA: nama jadwal, waktu kirim, status (berhasil/gagal), jumlah WA terkirim, jumlah gagal
- Admin dapat memfilter log berdasarkan jadwal atau rentang tanggal

#### 3.3.19 Pengaturan Tahun Ajaran

**3.3.19.1 Tahun Ajaran Aktif**
**Fungsi**:
- Menampilkan tahun ajaran yang sedang aktif (contoh: 2025/2026)
- Admin dapat melihat informasi tahun ajaran aktif

**3.3.19.2 Arsip Tahun Ajaran**
**Fungsi**:
- Menampilkan daftar tahun ajaran yang sudah diarsipkan
- Admin dapat melihat data absensi tahun ajaran sebelumnya

**3.3.19.3 Ganti Tahun Ajaran Aktif**
**Fungsi**:
- Admin mengklik tombol ganti tahun ajaran
- Admin memasukkan tahun ajaran baru (contoh: 2026/2027)
- Sistem mengarsipkan data tahun ajaran sebelumnya
- Sistem mengatur tahun ajaran baru sebagai aktif
- Sistem menyimpan pengaturan ke database

#### 3.3.20 Pengaturan Sistem

**3.3.20.1 Pengaturan Umum**
**Fungsi**:
- Admin mengisi atau mengubah: nama sekolah, logo sekolah (upload gambar ke Supabase Storage), tahun ajaran aktif
- Sistem menyimpan pengaturan ke tabel settings di database

**3.3.20.2 Pengaturan Jam Absensi**
**Fungsi**:
- Admin mengatur: jam masuk (batas waktu hadir), jam terlambat, jam keluar minimum
- Sistem menggunakan pengaturan ini untuk menentukan status kehadiran siswa secara otomatis
- Sistem menyimpan pengaturan ke tabel settings di database

**3.3.20.3 Pengaturan Ambang Batas Kehadiran**
**Fungsi**:
- Admin mengatur persentase kehadiran minimum untuk peringatan
- Sistem menggunakan pengaturan ini untuk menampilkan notifikasi atau peringatan jika kehadiran siswa di bawah ambang batas
- Sistem menyimpan pengaturan ke tabel settings di database

**3.3.20.4 Pengaturan Threshold Pengenalan Wajah**
**Fungsi**:
- Admin mengatur confidence threshold untuk face recognition (nilai antara 0-1)
- Sistem menggunakan threshold ini untuk menentukan apakah wajah yang dipindai cocok dengan data wajah tersimpan
- Sistem menyimpan pengaturan ke tabel settings di database

**3.3.20.5 Pengaturan Batas Waktu Absensi Keluar**
**Fungsi**:
- Admin mengatur deadline jam keluar (contoh: 15:00)
- Sistem menggunakan pengaturan ini untuk validasi absensi keluar
- Sistem menyimpan pengaturan ke tabel settings di database

**3.3.20.6 Kalender Cuti/Libur Sekolah**
**Fungsi**:
- Admin menambah, mengedit, atau menghapus tanggal cuti/libur sekolah
- Sistem menyimpan kalender cuti/libur ke database
- Sistem tidak menghitung hari libur dalam perhitungan persentase kehadiran

**3.3.20.7 Dark Mode Toggle**
**Fungsi**:
- Admin dapat mengaktifkan atau menonaktifkan dark mode untuk dashboard
- Sistem menyimpan preferensi dark mode ke database atau local storage
- Sistem menerapkan tema dark mode ke seluruh halaman dashboard

#### 3.3.21 Log Aktivitas Sistem
**Fungsi**:
- Menampilkan tabel log aktivitas: waktu, pengguna (nama dan role), aktivitas (login, tambah siswa, edit absensi, dll), detail aktivitas
- Admin dapat memfilter log berdasarkan pengguna, jenis aktivitas, atau rentang tanggal

#### 3.3.22 Audit Log Perubahan Data Siswa
**Fungsi**:
- Menampilkan tabel riwayat perubahan data siswa: waktu, pengguna yang melakukan perubahan, nama siswa, field yang diubah, nilai lama, nilai baru
- Admin dapat memfilter log berdasarkan siswa atau rentang tanggal

#### 3.3.23 Notifikasi In-App
**Fungsi**:
- Menampilkan bell icon di header dengan badge jumlah notifikasi belum dibaca
- Admin dapat mengklik bell icon untuk melihat daftar notifikasi
- Notifikasi muncul saat: ada pengajuan izin/sakit baru, ada siswa yang tidak hadir tanpa keterangan, ada absensi manual yang ditambahkan oleh admin lain
- Admin dapat menandai notifikasi sebagai sudah dibaca

#### 3.3.24 Profil Akun
**Fungsi**:
- Admin dapat melihat dan mengedit profil: nama, foto profil (upload ke Supabase Storage), email
- Admin dapat mengganti password dengan memasukkan password lama dan password baru
- Sistem memperbarui data profil di database dan Supabase Auth

### 3.4 Dashboard Wali Kelas

#### 3.4.1 Statistik Kehadiran Kelas
**Fungsi**:
- Menampilkan jumlah total siswa di semua kelas yang diampu (dapat lebih dari satu kelas)
- Menampilkan jumlah siswa yang hadir hari ini per kelas
- Menampilkan jumlah siswa yang tidak hadir hari ini per kelas
- Menampilkan daftar siswa yang sudah absensi masuk hari ini beserta waktu absensi per kelas
- Menampilkan daftar siswa yang belum absensi hari ini per kelas

#### 3.4.2 Daftar Siswa Kelas
**Fungsi**:
- Menampilkan tabel siswa di semua kelas yang diampu: nama, NIS, email, kelas, status registrasi wajah
- Wali kelas dapat melihat data siswa
- Wali kelas dapat mengklik nama siswa untuk melihat profil lengkap siswa
- Wali kelas dapat mengedit data siswa

#### 3.4.3 Rekap Kehadiran Kelas
**Fungsi**:
- Wali kelas memilih periode rekap (harian, mingguan, bulanan, atau per semester)
- Wali kelas memilih tanggal, minggu, bulan, atau semester yang diinginkan
- Sistem menampilkan data absensi siswa di semua kelas yang diampu: nama siswa, NIS, kelas, tanggal, waktu masuk, waktu keluar, status kehadiran
- Wali kelas dapat melihat detail riwayat absensi per siswa dengan memilih siswa tertentu

#### 3.4.4 Download Laporan PDF Kelas
**Fungsi**:
- Wali kelas memilih periode laporan (bulanan atau per semester)
- Wali kelas mengklik tombol download PDF
- Sistem menghasilkan PDF rekap kehadiran kelas dengan ringkasan statistik
- Wali kelas dapat langsung download PDF dari browser

#### 3.4.5 Manajemen Siswa Kelas

**3.4.5.1 Edit Siswa**
**Fungsi**:
- Wali kelas memilih siswa dari daftar siswa kelasnya
- Wali kelas mengubah data siswa
- Sistem menyimpan riwayat perubahan ke audit log
- Sistem memperbarui data di database

**3.4.5.2 Registrasi Wajah Siswa**
**Fungsi**:
- Wali kelas memilih siswa yang belum terdaftar wajahnya dari kelasnya
- Sistem mengaktifkan kamera untuk menangkap wajah siswa
- Sistem mendeteksi wajah menggunakan face-api.js
- Wali kelas mengambil beberapa foto wajah dari berbagai sudut
- Sistem menyimpan data wajah (face descriptors) ke Supabase Storage dan menghubungkannya dengan data siswa

#### 3.4.6 Manajemen Izin/Sakit Kelas

**3.4.6.1 Daftar Pengajuan Izin/Sakit**
**Fungsi**:
- Menampilkan tabel pengajuan izin/sakit siswa di semua kelas yang diampu: nama siswa, kelas, tanggal pengajuan, tanggal izin/sakit, jenis (izin/sakit), alasan, status (pending/approved_wali_kelas/approved_admin/rejected), bukti upload
- Menyediakan filter berdasarkan kelas, status, jenis

**3.4.6.2 Approval Pengajuan**
**Fungsi**:
- Wali kelas memilih pengajuan dengan status pending dari daftar
- Wali kelas melihat detail pengajuan dan bukti upload
- Wali kelas mengklik tombol approve (tingkat pertama)
- Sistem memperbarui status pengajuan menjadi approved_wali_kelas di database
- Sistem mengirim notifikasi in-app ke admin untuk approval tingkat kedua

**3.4.6.3 Lihat Bukti Upload**
**Fungsi**:
- Wali kelas mengklik link bukti upload pada pengajuan
- Sistem menampilkan gambar atau file bukti yang diupload siswa

#### 3.4.7 Notifikasi In-App
**Fungsi**:
- Menampilkan bell icon di header dengan badge jumlah notifikasi belum dibaca
- Wali kelas dapat mengklik bell icon untuk melihat daftar notifikasi
- Notifikasi muncul saat: ada pengajuan izin/sakit baru dari siswa kelasnya, ada siswa di kelasnya yang tidak hadir 3 hari berturut-turut tanpa keterangan
- Wali kelas dapat menandai notifikasi sebagai sudah dibaca

#### 3.4.8 Profil Akun
**Fungsi**:
- Wali kelas dapat melihat dan mengedit profil: nama, foto profil (upload ke Supabase Storage), email
- Wali kelas dapat mengganti password dengan memasukkan password lama dan password baru
- Sistem memperbarui data profil di database dan Supabase Auth

### 3.5 Dashboard Guru BK

#### 3.5.1 Statistik Kehadiran Semua Kelas
**Fungsi**:
- Menampilkan jumlah total siswa dari semua kelas
- Menampilkan jumlah siswa yang hadir hari ini dari semua kelas
- Menampilkan jumlah siswa yang tidak hadir hari ini dari semua kelas
- Menampilkan jumlah siswa yang terlambat hari ini dari semua kelas
- Menampilkan persentase kehadiran bulan berjalan untuk semua siswa

#### 3.5.2 Rekap Semua Kelas
**Fungsi**:
- Menampilkan tabel ringkasan kehadiran per kelas: nama kelas, total siswa, jumlah hadir hari ini, jumlah tidak hadir hari ini, persentase kehadiran bulan berjalan
- Guru BK dapat mengklik nama kelas untuk melihat detail siswa di kelas tersebut

#### 3.5.3 Detail Siswa
**Fungsi**:
- Guru BK dapat mencari siswa berdasarkan nama, NIS, atau kelas
- Sistem menampilkan data siswa: nama, NIS, kelas, email, nomor WA orangtua
- Guru BK dapat melihat riwayat absensi siswa yang dipilih: tanggal, waktu masuk, waktu keluar, status kehadiran
- Guru BK dapat memfilter riwayat absensi berdasarkan rentang tanggal
- Guru BK dapat mengklik nama siswa untuk melihat profil lengkap siswa
- Guru BK dapat mengedit data siswa

#### 3.5.4 Laporan Pelanggaran Kehadiran
**Fungsi**:
- Menampilkan tabel siswa dengan ketidakhadiran >= 3 kali dalam 1 minggu berjalan
- Kolom tabel: nama siswa, NIS, kelas, jumlah tidak hadir minggu ini, persentase kehadiran bulan berjalan
- Guru BK dapat memfilter berdasarkan kelas atau rentang tanggal

#### 3.5.5 Manajemen Siswa

**3.5.5.1 Edit Siswa**
**Fungsi**:
- Guru BK memilih siswa dari daftar
- Guru BK mengubah data siswa
- Sistem menyimpan riwayat perubahan ke audit log
- Sistem memperbarui data di database

**3.5.5.2 Registrasi Wajah Siswa**
**Fungsi**:
- Guru BK memilih siswa yang belum terdaftar wajahnya
- Sistem mengaktifkan kamera untuk menangkap wajah siswa
- Sistem mendeteksi wajah menggunakan face-api.js
- Guru BK mengambil beberapa foto wajah dari berbagai sudut
- Sistem menyimpan data wajah (face descriptors) ke Supabase Storage dan menghubungkannya dengan data siswa

#### 3.5.6 Notifikasi In-App
**Fungsi**:
- Menampilkan bell icon di header dengan badge jumlah notifikasi belum dibaca
- Guru BK dapat mengklik bell icon untuk melihat daftar notifikasi
- Notifikasi muncul saat: ada siswa yang tidak hadir >= 3 kali dalam 1 minggu berjalan tanpa keterangan
- Guru BK dapat menandai notifikasi sebagai sudah dibaca

#### 3.5.7 Profil Akun
**Fungsi**:
- Guru BK dapat melihat dan mengedit profil: nama, foto profil (upload ke Supabase Storage), email
- Guru BK dapat mengganti password dengan memasukkan password lama dan password baru
- Sistem memperbarui data profil di database dan Supabase Auth

### 3.6 Dashboard Siswa

#### 3.6.1 Riwayat Absensi Pribadi
**Fungsi**:
- Menampilkan tabel riwayat absensi siswa yang login: tanggal, waktu masuk, waktu keluar, total jam kehadiran, status kehadiran
- Siswa dapat memfilter berdasarkan rentang tanggal

#### 3.6.2 Pengajuan Izin/Sakit

**3.6.2.1 Form Pengajuan**
**Fungsi**:
- Siswa mengisi formulir pengajuan izin/sakit: tanggal izin/sakit, jenis (izin/sakit), alasan
- Siswa mengupload bukti (surat dokter/foto) ke Supabase Storage
- Siswa mengklik tombol submit
- Sistem menyimpan pengajuan ke database dengan status pending
- Sistem mengirim notifikasi in-app ke wali kelas

**3.6.2.2 Upload Bukti**
**Fungsi**:
- Siswa mengklik tombol upload bukti
- Siswa memilih file gambar atau PDF dari perangkat
- Sistem mengupload file ke Supabase Storage
- Sistem menyimpan URL file ke database

**3.6.2.3 Status Pengajuan**
**Fungsi**:
- Menampilkan tabel pengajuan izin/sakit siswa: tanggal pengajuan, tanggal izin/sakit, jenis, alasan, status (pending/approved_wali_kelas/approved_admin/rejected)
- Siswa dapat melihat status pengajuan yang sudah diajukan

#### 3.6.3 Notifikasi In-App
**Fungsi**:
- Menampilkan bell icon di header dengan badge jumlah notifikasi belum dibaca
- Siswa dapat mengklik bell icon untuk melihat daftar notifikasi
- Notifikasi muncul saat: pengajuan izin/sakit diapprove atau direject, siswa tidak hadir 3 hari berturut-turut tanpa keterangan
- Siswa dapat menandai notifikasi sebagai sudah dibaca

#### 3.6.4 Reminder Absensi
**Fungsi**:
- Sistem mengirim reminder otomatis ke siswa yang belum absensi masuk pada waktu tertentu (contoh: 30 menit setelah jam masuk)
- Reminder muncul sebagai notifikasi in-app
- Sistem dapat mengirim reminder via WhatsApp jika dikonfigurasi

#### 3.6.5 Profil Akun
**Fungsi**:
- Siswa dapat melihat dan mengedit profil: nama, foto profil (upload ke Supabase Storage), email
- Siswa dapat mengganti password dengan memasukkan password lama dan password baru
- Sistem memperbarui data profil di database dan Supabase Auth

### 3.7 Halaman Absensi (Scan Wajah)

#### 3.7.1 Absensi Masuk
**Fungsi**:
- Sistem meminta izin akses lokasi dari browser
- Sistem mendeteksi lokasi siswa menggunakan Geolocation API
- Sistem menghitung jarak antara lokasi siswa dengan titik koordinat lokasi absensi yang ditugaskan ke kelas siswa
- Jika siswa berada di dalam radius lokasi absensi, sistem mengaktifkan kamera
- Jika siswa berada di luar radius lokasi absensi, sistem menampilkan pesan bahwa siswa harus berada di lokasi absensi dan kamera tidak dapat diaktifkan
- Siswa memposisikan wajah di depan kamera
- Sistem mendeteksi dan mengenali wajah menggunakan face-api.js
- Sistem mencocokkan wajah dengan data wajah yang tersimpan di database menggunakan threshold yang dikonfigurasi admin
- Jika wajah teridentifikasi, sistem mencatat waktu absensi masuk dan lokasi ke database
- Sistem menentukan status kehadiran (hadir atau terlambat) berdasarkan pengaturan jam absensi
- Sistem menampilkan notifikasi keberhasilan atau kegagalan absensi

#### 3.7.2 Absensi Keluar
**Fungsi**:
- Sistem meminta izin akses lokasi dari browser
- Sistem mendeteksi lokasi siswa menggunakan Geolocation API
- Sistem menghitung jarak antara lokasi siswa dengan titik koordinat lokasi absensi yang ditugaskan ke kelas siswa
- Jika siswa berada di dalam radius lokasi absensi, sistem mengaktifkan kamera
- Jika siswa berada di luar radius lokasi absensi, sistem menampilkan pesan bahwa siswa harus berada di lokasi absensi dan kamera tidak dapat diaktifkan
- Siswa memposisikan wajah di depan kamera
- Sistem mendeteksi dan mengenali wajah menggunakan face-api.js
- Sistem mencocokkan wajah dengan data wajah yang tersimpan di database menggunakan threshold yang dikonfigurasi admin
- Jika wajah teridentifikasi, sistem memvalidasi waktu keluar tidak melebihi batas waktu yang dikonfigurasi
- Sistem mencatat waktu absensi keluar dan lokasi ke database
- Sistem menampilkan notifikasi keberhasilan atau kegagalan absensi

### 3.8 Halaman Absensi (Scan QR Code Dinamis)

#### 3.8.1 Absensi Masuk
**Fungsi**:
- Sistem meminta izin akses lokasi dari browser
- Sistem mendeteksi lokasi siswa menggunakan Geolocation API
- Sistem menghitung jarak antara lokasi siswa dengan titik koordinat lokasi absensi yang ditugaskan ke kelas siswa
- Jika siswa berada di dalam radius lokasi absensi, sistem mengaktifkan kamera untuk scan QR code
- Jika siswa berada di luar radius lokasi absensi, sistem menampilkan pesan bahwa siswa harus berada di lokasi absensi dan kamera tidak dapat diaktifkan
- Siswa mengarahkan kamera ke QR code dinamis yang ditampilkan di lokasi absensi
- Sistem membaca QR code dan memvalidasi QR code tersebut masih berlaku untuk sesi atau jam saat ini
- Sistem mengidentifikasi siswa berdasarkan akun yang login
- Sistem mencatat waktu absensi masuk dan lokasi ke database
- Sistem menentukan status kehadiran (hadir atau terlambat) berdasarkan pengaturan jam absensi
- Sistem menampilkan notifikasi keberhasilan atau kegagalan absensi

#### 3.8.2 Absensi Keluar
**Fungsi**:
- Sistem meminta izin akses lokasi dari browser
- Sistem mendeteksi lokasi siswa menggunakan Geolocation API
- Sistem menghitung jarak antara lokasi siswa dengan titik koordinat lokasi absensi yang ditugaskan ke kelas siswa
- Jika siswa berada di dalam radius lokasi absensi, sistem mengaktifkan kamera untuk scan QR code
- Jika siswa berada di luar radius lokasi absensi, sistem menampilkan pesan bahwa siswa harus berada di lokasi absensi dan kamera tidak dapat diaktifkan
- Siswa mengarahkan kamera ke QR code dinamis yang ditampilkan di lokasi absensi
- Sistem membaca QR code dan memvalidasi QR code tersebut masih berlaku untuk sesi atau jam saat ini
- Sistem mengidentifikasi siswa berdasarkan akun yang login
- Sistem memvalidasi waktu keluar tidak melebihi batas waktu yang dikonfigurasi
- Sistem mencatat waktu absensi keluar dan lokasi ke database
- Sistem menampilkan notifikasi keberhasilan atau kegagalan absensi

### 3.9 Halaman Profil Lengkap Siswa

#### 3.9.1 Informasi Siswa
**Fungsi**:
- Menampilkan informasi lengkap siswa: nama, NIS, kelas, jurusan, email, nomor WA orangtua, foto profil, status (aktif/arsip)

#### 3.9.2 Grafik Kehadiran Bulanan
**Fungsi**:
- Menampilkan grafik bar chart atau line chart kehadiran siswa untuk 12 bulan terakhir
- Sumbu X: bulan, sumbu Y: jumlah hari hadir

#### 3.9.3 Persentase Hadir/Sakit/Izin/Alpa
**Fungsi**:
- Menampilkan grafik pie chart atau donut chart distribusi status kehadiran siswa untuk bulan berjalan atau tahun ajaran berjalan
- Menampilkan persentase untuk setiap status: hadir, sakit, izin, alpa (tidak hadir tanpa keterangan)

#### 3.9.4 Riwayat Absensi Lengkap
**Fungsi**:
- Menampilkan tabel riwayat absensi siswa: tanggal, waktu masuk, waktu keluar, total jam kehadiran, status kehadiran, catatan
- Pengguna dapat memfilter berdasarkan rentang tanggal atau status kehadiran

## 4. Aturan Bisnis dan Logika

### 4.1 Autentikasi dan Otorisasi
- Setiap pengguna harus login sebelum mengakses sistem
- Sistem mendukung empat role: admin, wali_kelas, guru_bk, dan user (siswa)
- Admin memiliki akses penuh ke semua fitur
- Wali kelas dapat mengakses dashboard wali kelas, melihat data siswa kelasnya, mengedit data siswa kelasnya, registrasi wajah siswa kelasnya, melihat rekap kehadiran kelasnya, approval izin/sakit siswa kelasnya (tingkat pertama), download laporan PDF kelas
- Guru BK dapat mengakses dashboard guru BK, melihat data semua siswa dari semua kelas, mengedit data siswa, registrasi wajah siswa, melihat rekap kehadiran semua kelas, melihat laporan pelanggaran kehadiran
- Siswa hanya dapat mengakses halaman absensi, dashboard siswa, pengajuan izin/sakit, dan profil akun
- Sistem menggunakan Supabase Auth untuk manajemen sesi
- Sistem menyediakan fitur reset password via email menggunakan Supabase Auth

### 4.2 Manajemen Kelas
- Admin dapat membuat, mengedit, dan menghapus kelas
- Admin dapat menugaskan satu atau lebih wali kelas ke kelas tertentu
- Satu wali kelas dapat mengampu lebih dari satu kelas
- Data kelas disimpan di tabel classes di database

### 4.3 Manajemen Tahun Ajaran
- Admin dapat mengatur tahun ajaran aktif
- Saat admin mengganti tahun ajaran aktif, sistem mengarsipkan data absensi tahun ajaran sebelumnya
- Data absensi tahun ajaran sebelumnya tetap dapat diakses melalui menu arsip
- Data siswa, wali kelas, guru BK, dan kelas tidak diarsipkan, tetap dapat digunakan untuk tahun ajaran baru

### 4.4 Registrasi Wajah
- Setiap siswa harus memiliki data wajah terdaftar sebelum dapat melakukan absensi via scan wajah
- Satu siswa dapat memiliki beberapa foto wajah untuk meningkatkan akurasi pengenalan
- Data wajah disimpan dalam bentuk face descriptors di Supabase Storage
- Admin, wali kelas, atau guru BK dapat melakukan registrasi wajah siswa

### 4.5 QR Code Absensi
- Admin dapat generate QR code unik dinamis untuk sesi absensi
- QR code berubah setiap sesi atau setiap jam untuk meningkatkan keamanan
- Siswa dapat melakukan absensi dengan scan QR code sebagai alternatif scan wajah
- Sistem memvalidasi QR code masih berlaku untuk sesi atau jam saat ini sebelum mencatat absensi

### 4.6 Validasi Lokasi Absensi
- Sistem menggunakan Geolocation API browser untuk mendeteksi lokasi siswa
- Admin mengatur multiple lokasi absensi (titik koordinat dan radius) untuk kelas atau gedung berbeda
- Admin dapat menugaskan lokasi tertentu ke kelas tertentu
- Sistem menghitung jarak antara lokasi siswa dengan titik koordinat lokasi absensi yang ditugaskan ke kelas siswa
- Kamera hanya dapat diaktifkan jika siswa berada di dalam radius lokasi absensi
- Jika siswa berada di luar radius, sistem menampilkan pesan dan kamera tidak dapat diaktifkan
- Lokasi siswa saat absensi dicatat ke database bersama dengan data absensi
- Sistem menyimpan riwayat perubahan lokasi absensi

### 4.7 Proses Absensi
- Siswa hanya dapat melakukan absensi masuk satu kali per hari
- Siswa hanya dapat melakukan absensi keluar setelah melakukan absensi masuk
- Sistem mencatat timestamp absensi berdasarkan waktu server
- Jika wajah tidak teridentifikasi atau QR code tidak valid setelah beberapa percobaan, sistem menampilkan pesan kesalahan
- Sistem memvalidasi waktu absensi keluar tidak melebihi batas waktu yang dikonfigurasi admin

### 4.8 Pengenalan Wajah
- Sistem menggunakan face-api.js untuk mendeteksi dan mengenali wajah di browser
- Sistem menghitung tingkat kemiripan wajah yang dipindai dengan data wajah tersimpan
- Sistem menggunakan confidence threshold yang dikonfigurasi admin untuk menentukan apakah wajah teridentifikasi
- Jika tingkat kemiripan melebihi threshold, wajah dianggap teridentifikasi
- Jika tidak ada wajah yang cocok, sistem menolak absensi

### 4.9 Penentuan Status Kehadiran
- Sistem menggunakan pengaturan jam absensi untuk menentukan status kehadiran siswa
- Jika siswa absensi masuk sebelum atau pada jam masuk yang ditentukan, status adalah hadir
- Jika siswa absensi masuk setelah jam masuk tetapi sebelum jam terlambat, status adalah terlambat
- Jika siswa tidak melakukan absensi masuk dan tidak ada pengajuan izin/sakit yang diapprove, status adalah tidak hadir (alpa)
- Jika siswa memiliki pengajuan izin yang diapprove, status adalah izin
- Jika siswa memiliki pengajuan sakit yang diapprove, status adalah sakit
- Sistem tidak menghitung hari libur/cuti sekolah dalam perhitungan persentase kehadiran

### 4.10 Pengajuan Izin/Sakit
- Siswa dapat mengajukan izin/sakit melalui dashboard siswa
- Siswa mengisi formulir: tanggal izin/sakit, jenis (izin/sakit), alasan
- Siswa mengupload bukti (surat dokter/foto) ke Supabase Storage
- Sistem menyimpan pengajuan ke database dengan status pending
- Sistem mengirim notifikasi in-app ke wali kelas
- Wali kelas dapat melihat pengajuan dan melakukan approval tingkat pertama
- Setelah approval wali kelas, status pengajuan menjadi approved_wali_kelas
- Sistem mengirim notifikasi in-app ke admin untuk approval tingkat kedua
- Admin dapat melihat pengajuan yang sudah diapprove wali kelas dan melakukan approval atau reject
- Setelah approval/reject admin, sistem mengirim notifikasi in-app ke siswa
- Jika pengajuan diapprove admin, sistem memperbarui status kehadiran siswa pada tanggal tersebut menjadi izin atau sakit

### 4.11 Manajemen Absensi Manual
- Admin dapat menambah, mengedit, dan menghapus record absensi secara manual
- Admin dapat menambahkan catatan pada record absensi
- Sistem memvalidasi tidak ada duplikat absensi untuk siswa yang sama pada tanggal yang sama
- Admin dapat melakukan bulk action untuk menandai beberapa siswa sebagai hadir atau tidak hadir pada tanggal tertentu
- Bulk action tidak boleh membuat duplikat absensi per siswa per hari

### 4.12 Laporan Absensi
- Laporan harian menampilkan data absensi untuk tanggal tertentu
- Laporan mingguan menampilkan data absensi untuk minggu tertentu
- Laporan bulanan menampilkan data absensi untuk bulan tertentu
- Laporan per semester menampilkan data absensi untuk semester tertentu
- Sistem menghitung total jam kehadiran berdasarkan selisih waktu masuk dan keluar
- Status kehadiran ditentukan berdasarkan ada tidaknya data absensi masuk, waktu absensi masuk, dan status pengajuan izin/sakit
- Admin dapat memfilter laporan berdasarkan kelas, siswa, rentang tanggal, status kehadiran, atau hanya siswa tidak hadir
- Admin dapat melihat perbandingan kehadiran antar tahun ajaran
- Admin dapat mengekspor laporan ke format CSV atau PDF
- Admin dapat export grafik kehadiran ke format PNG
- Wali kelas dapat download laporan PDF rekap kehadiran kelas yang diampu

### 4.13 Real-time Update
- Status absensi di dashboard admin, dashboard wali kelas, dan dashboard guru BK diperbarui secara otomatis saat ada siswa yang melakukan absensi
- Sistem menggunakan Supabase Realtime untuk sinkronisasi data

### 4.14 Notifikasi In-App Real-time
- Sistem menyimpan notifikasi di tabel notifications
- Notifikasi ditampilkan di bell icon di header dengan badge jumlah notifikasi belum dibaca
- Notifikasi muncul saat:
  - Siswa: pengajuan izin/sakit diapprove atau direject, siswa tidak hadir 3 hari berturut-turut tanpa keterangan, reminder absensi
  - Wali kelas: ada pengajuan izin/sakit baru dari siswa kelasnya, ada siswa di kelasnya yang tidak hadir 3 hari berturut-turut tanpa keterangan
  - Guru BK: ada siswa yang tidak hadir >= 3 kali dalam 1 minggu berjalan tanpa keterangan
  - Admin: ada pengajuan izin/sakit yang sudah diapprove wali kelas, ada siswa yang tidak hadir tanpa keterangan, ada absensi manual yang ditambahkan oleh admin lain
- Pengguna dapat menandai notifikasi sebagai sudah dibaca
- Sistem menggunakan Supabase Realtime untuk push notifikasi real-time

### 4.15 Import Data via Upload File
- Template file untuk siswa berisi kolom: nama_lengkap, nis, kelas, jurusan, nomor_wa_orangtua
- Template file untuk wali kelas berisi kolom: nama_lengkap, username, password, kelas_diampu (dapat multiple, dipisah koma), nomor_wa
- Template file untuk guru BK berisi kolom: nama_lengkap, username, password, nomor_wa
- Sistem memvalidasi data file sebelum import: kolom wajib harus terisi, NIS tidak boleh duplikat, username tidak boleh duplikat, format nomor WA harus valid
- Sistem menampilkan preview data sebelum admin mengkonfirmasi import
- Setelah konfirmasi, sistem menyimpan data secara massal ke database (bulk insert)
- Jika ada data yang gagal diimport, sistem menampilkan detail error untuk setiap baris yang gagal

### 4.16 Edit Massal via Upload File
- Template file edit massal untuk siswa berisi kolom: id, nama_lengkap, nis, kelas, jurusan, nomor_wa_orangtua
- Template file edit massal untuk wali kelas berisi kolom: id, nama_lengkap, username, kelas_diampu, nomor_wa
- Template file edit massal untuk guru BK berisi kolom: id, nama_lengkap, username, nomor_wa
- Sistem memvalidasi data file sebelum edit massal: id harus valid, kolom wajib harus terisi, NIS tidak boleh duplikat, username tidak boleh duplikat, format nomor WA harus valid
- Sistem menampilkan preview perubahan data sebelum admin mengkonfirmasi edit massal
- Setelah konfirmasi, sistem memperbarui data secara massal di database (bulk update)
- Sistem menyimpan riwayat perubahan ke audit log
- Jika ada data yang gagal diedit, sistem menampilkan detail error untuk setiap baris yang gagal

### 4.17 Jadwal Laporan WA Otomatis
- Admin dapat membuat, mengedit, menghapus, pause, atau resume jadwal pengiriman laporan WA
- Jadwal disimpan di tabel report_schedules dengan konfigurasi: nama jadwal, jenis laporan (daily/weekly), waktu pengiriman, hari pengiriman, penerima, filter kelas, status (aktif/nonaktif/paused), template pesan
- Supabase Edge Function send-scheduled-reports dipanggil oleh pg_cron setiap menit
- Edge Function mengecek jadwal yang seharusnya berjalan pada waktu saat ini dan status aktif (bukan paused)
- Untuk setiap jadwal aktif yang waktunya cocok, sistem mengambil data absensi siswa sesuai filter kelas
- Sistem menggunakan template pesan yang sudah dicustomisasi admin dengan placeholder dinamis (nama siswa, kelas, status kehadiran, dll)
- Sistem mengirim WA ke orangtua setiap siswa jika penerima adalah orangtua atau keduanya
- Sistem mengirim WA ke wali kelas jika penerima adalah wali kelas atau keduanya
- Sistem mencatat log pengiriman di tabel report_schedule_logs dengan informasi: waktu kirim, status (berhasil/gagal), jumlah WA terkirim, jumlah gagal
- Sistem menghitung statistik pengiriman: rata-rata waktu kirim, tingkat keberhasilan
- Admin dapat mengirim laporan manual di luar jadwal
- Notifikasi WA menggunakan WAHA API (waha.devlike.pro)

### 4.18 Notifikasi WA Otomatis ke Guru BK
- Sistem menjalankan proses pengecekan ketidakhadiran siswa setiap minggu (dapat dikonfigurasi, misalnya setiap Jumat)
- Sistem mengidentifikasi siswa yang tidak hadir >= 3 kali dalam 1 minggu berjalan tanpa keterangan (tidak ada pengajuan izin/sakit yang diapprove)
- Sistem mengambil daftar semua guru BK yang terdaftar beserta nomor WA mereka
- Sistem mengirim notifikasi WA ke semua guru BK yang berisi:
  - Daftar nama siswa dengan ketidakhadiran >= 3 kali
  - Kelas masing-masing siswa
  - Jumlah ketidakhadiran minggu ini untuk setiap siswa
- Sistem mencatat log pengiriman notifikasi ke guru BK
- Notifikasi WA menggunakan WAHA API (waha.devlike.pro)

### 4.19 Notifikasi Email untuk Laporan Kehadiran
- Sistem dapat mengirim laporan kehadiran via email menggunakan Supabase Edge Function dan SMTP
- Admin dapat mengkonfigurasi pengiriman email untuk laporan harian atau mingguan
- Email berisi ringkasan kehadiran siswa dan link ke dashboard untuk detail lengkap
- Sistem mencatat log pengiriman email

### 4.20 Reminder Otomatis untuk Siswa Belum Absensi
- Sistem mengirim reminder otomatis ke siswa yang belum absensi masuk pada waktu tertentu (contoh: 30 menit setelah jam masuk)
- Reminder muncul sebagai notifikasi in-app
- Sistem dapat mengirim reminder via WhatsApp jika dikonfigurasi
- Sistem mencatat log pengiriman reminder

### 4.21 Isi Pesan Laporan WA

**Pesan ke Orangtua Siswa**:
- Nama siswa dan kelas
- Tanggal laporan
- Status kehadiran hari ini atau minggu ini (Hadir/Tidak Hadir/Terlambat/Izin/Sakit)
- Waktu masuk dan waktu keluar (jika hadir)
- Total hari hadir bulan berjalan dan persentase kehadiran

**Pesan ke Wali Kelas**:
- Nama kelas yang diampu
- Tanggal laporan
- Ringkasan: total siswa, jumlah hadir, jumlah tidak hadir, jumlah terlambat, jumlah izin, jumlah sakit
- Daftar nama siswa yang tidak hadir hari itu atau minggu itu

**Pesan ke Guru BK**:
- Tanggal laporan (minggu berjalan)
- Daftar siswa dengan ketidakhadiran >= 3 kali minggu ini tanpa keterangan
- Untuk setiap siswa: nama, kelas, jumlah tidak hadir minggu ini

### 4.22 Profil Akun
- Semua pengguna (admin, wali kelas, guru BK, siswa) dapat mengedit profil: nama, foto profil, email
- Semua pengguna dapat mengganti password dengan memasukkan password lama dan password baru
- Semua pengguna dapat reset password via email jika lupa password
- Foto profil diupload ke Supabase Storage
- Sistem memperbarui data profil di tabel profiles dan Supabase Auth

### 4.23 Log Aktivitas Sistem
- Sistem mencatat aktivitas pengguna: login, tambah siswa, edit siswa, hapus siswa, tambah absensi manual, edit absensi manual, hapus absensi manual, approval izin/sakit, dll
- Log disimpan di tabel activity_logs dengan informasi: waktu, user_id, nama pengguna, role, jenis aktivitas, detail aktivitas
- Admin dapat melihat dan memfilter log aktivitas

### 4.24 Audit Log Perubahan Data Siswa
- Sistem mencatat riwayat perubahan data siswa: waktu, pengguna yang melakukan perubahan, nama siswa, field yang diubah, nilai lama, nilai baru
- Audit log disimpan di tabel student_audit_logs
- Admin dapat melihat dan memfilter audit log berdasarkan siswa atau rentang tanggal

### 4.25 Pengaturan Sistem
- Admin dapat mengatur nama sekolah, logo sekolah, tahun ajaran aktif
- Admin dapat mengatur jam masuk, jam terlambat, jam keluar minimum, batas waktu absensi keluar
- Admin dapat mengatur persentase kehadiran minimum untuk peringatan
- Admin dapat mengatur confidence threshold untuk face recognition
- Admin dapat mengatur kalender cuti/libur sekolah
- Admin dapat mengaktifkan atau menonaktifkan dark mode
- Pengaturan disimpan di tabel settings
- Sistem menggunakan pengaturan ini untuk menentukan status kehadiran siswa dan menampilkan peringatan

### 4.26 Halaman Profil Lengkap Siswa
- Admin, wali kelas (untuk siswa kelasnya), guru BK, dan siswa (untuk dirinya sendiri) dapat mengakses halaman profil lengkap siswa
- Halaman profil lengkap menampilkan informasi siswa, grafik kehadiran bulanan, persentase hadir/sakit/izin/alpa, dan riwayat absensi lengkap (termasuk catatan)
- Data ditampilkan berdasarkan tahun ajaran aktif

### 4.27 Arsip Siswa
- Admin dapat mengarsipkan siswa yang lulus atau pindah
- Data siswa yang diarsipkan tetap tersimpan di database tetapi tidak muncul di daftar siswa aktif
- Admin dapat melihat daftar siswa yang diarsipkan
- Data absensi siswa yang diarsipkan tetap dapat diakses

### 4.28 Dark Mode
- Admin dapat mengaktifkan atau menonaktifkan dark mode untuk dashboard
- Preferensi dark mode disimpan di database atau local storage
- Sistem menerapkan tema dark mode ke seluruh halaman dashboard

## 5. Kondisi Pengecualian dan Batas

| Kondisi | Penanganan |
|---------|------------|
| Siswa belum terdaftar wajahnya | Sistem menampilkan pesan bahwa wajah belum terdaftar dan mengarahkan ke admin/wali kelas/guru BK untuk registrasi |
| Siswa berada di luar radius lokasi absensi | Sistem menampilkan pesan bahwa siswa harus berada di lokasi absensi dan kamera tidak dapat diaktifkan |
| Browser tidak mendukung Geolocation API | Sistem menampilkan pesan bahwa browser tidak mendukung fitur lokasi |
| Siswa menolak izin akses lokasi | Sistem menampilkan pesan bahwa izin akses lokasi diperlukan untuk melakukan absensi |
| Wajah tidak terdeteksi oleh kamera | Sistem menampilkan pesan untuk memposisikan wajah dengan benar dan mencoba lagi |
| Wajah terdeteksi tetapi tidak dikenali | Sistem menampilkan pesan bahwa wajah tidak dikenali dan menyarankan untuk menghubungi admin/wali kelas/guru BK |
| QR code tidak valid atau sudah kadaluarsa | Sistem menampilkan pesan bahwa QR code tidak valid atau sudah kadaluarsa |
| Siswa sudah absensi masuk hari ini | Sistem menampilkan pesan bahwa absensi masuk sudah tercatat |
| Siswa belum absensi masuk tetapi mencoba absensi keluar | Sistem menampilkan pesan bahwa harus absensi masuk terlebih dahulu |
| Siswa absensi keluar melebihi batas waktu yang dikonfigurasi | Sistem menampilkan pesan bahwa waktu absensi keluar sudah melebihi batas |
| Kamera tidak dapat diakses | Sistem menampilkan pesan kesalahan dan meminta izin akses kamera |
| Koneksi database terputus | Sistem menampilkan pesan kesalahan dan menyarankan untuk mencoba lagi |
| Admin mencoba menghapus siswa yang memiliki data absensi | Sistem menampilkan konfirmasi bahwa data absensi terkait juga akan dihapus |
| Admin mencoba menghapus kelas yang memiliki siswa | Sistem menampilkan pesan bahwa kelas tidak dapat dihapus karena masih memiliki siswa |
| Admin mencoba menghapus wali kelas | Sistem menampilkan konfirmasi penghapusan akun wali kelas |
| Admin mencoba menghapus guru BK | Sistem menampilkan konfirmasi penghapusan akun guru BK |
| Wali kelas mencoba mengakses fitur yang hanya tersedia untuk admin | Sistem menampilkan pesan bahwa akses ditolak |
| Guru BK mencoba mengakses fitur yang hanya tersedia untuk admin | Sistem menampilkan pesan bahwa akses ditolak |
| Wali kelas belum ditugaskan ke kelas tertentu | Sistem menampilkan pesan bahwa wali kelas belum memiliki kelas yang diampu |
| Ekspor laporan gagal | Sistem menampilkan pesan kesalahan dan menyarankan untuk mencoba lagi |
| Koordinat lokasi absensi belum diatur oleh admin | Sistem menampilkan pesan bahwa lokasi absensi belum dikonfigurasi |
| File yang diupload tidak sesuai format template | Sistem menampilkan pesan kesalahan dan meminta admin untuk menggunakan template yang benar |
| File yang diupload berisi data duplikat (NIS atau username) | Sistem menampilkan pesan kesalahan dan menunjukkan baris data yang duplikat |
| File yang diupload berisi kolom wajib yang kosong | Sistem menampilkan pesan kesalahan dan menunjukkan baris data yang tidak lengkap |
| File yang diupload berisi format nomor WA yang tidak valid | Sistem menampilkan pesan kesalahan dan menunjukkan baris data dengan nomor WA tidak valid |
| API waha.devlike.pro tidak dapat diakses | Sistem menampilkan pesan bahwa laporan WA gagal dikirim dan menyimpan log dengan status gagal |
| Admin membuat jadwal dengan waktu yang sama untuk kelas yang sama | Sistem menampilkan pesan peringatan bahwa sudah ada jadwal serupa |
| Jadwal laporan WA gagal dijalankan oleh pg_cron | Sistem mencatat error di log pengiriman dengan status gagal |
| Pengiriman laporan WA terjadwal gagal untuk beberapa nomor | Sistem mencatat jumlah berhasil dan gagal di log pengiriman |
| Pengiriman notifikasi WA ke guru BK gagal | Sistem mencatat log pengiriman dengan status gagal |
| Admin menghapus jadwal yang sedang berjalan | Sistem menghentikan jadwal dan tidak mengirim laporan berikutnya |
| Admin mencoba menambah absensi manual untuk siswa yang sudah ada absensi pada tanggal yang sama | Sistem menampilkan pesan bahwa absensi untuk siswa tersebut pada tanggal tersebut sudah ada |
| Admin melakukan bulk action untuk siswa yang sudah memiliki absensi pada tanggal yang dipilih | Sistem melewati siswa tersebut dan hanya memproses siswa yang belum memiliki absensi |
| Pengguna mencoba mengganti password dengan password lama yang salah | Sistem menampilkan pesan bahwa password lama tidak sesuai |
| Pengguna mengupload foto profil dengan ukuran terlalu besar | Sistem menampilkan pesan bahwa ukuran file terlalu besar |
| Admin belum mengatur pengaturan jam absensi | Sistem menggunakan nilai default untuk menentukan status kehadiran |
| Tidak ada guru BK yang terdaftar saat sistem mengirim notifikasi mingguan | Sistem melewati proses pengiriman notifikasi ke guru BK |
| Siswa mengajukan izin/sakit tanpa upload bukti | Sistem menampilkan pesan bahwa bukti upload wajib diisi |
| Wali kelas atau admin mencoba approval pengajuan izin/sakit yang sudah diproses | Sistem menampilkan pesan bahwa pengajuan sudah diproses |
| Admin mencoba generate QR code tanpa mengatur lokasi absensi | Sistem menampilkan pesan bahwa lokasi absensi harus diatur terlebih dahulu |
| Siswa mencoba scan QR code di luar radius lokasi absensi | Sistem menampilkan pesan bahwa siswa harus berada di lokasi absensi |
| Admin mencoba mengganti tahun ajaran aktif tanpa konfirmasi | Sistem menampilkan konfirmasi bahwa data tahun ajaran sebelumnya akan diarsipkan |
| Pengguna mencoba mengakses data tahun ajaran yang tidak aktif | Sistem menampilkan data dari arsip tahun ajaran sebelumnya |
| Pengguna lupa password | Pengguna dapat menggunakan fitur reset password via email |
| Admin mencoba pause jadwal yang sudah di-pause | Sistem menampilkan pesan bahwa jadwal sudah dalam status paused |
| Admin mencoba resume jadwal yang sudah aktif | Sistem menampilkan pesan bahwa jadwal sudah dalam status aktif |
| Admin mencoba kirim laporan manual untuk jadwal yang nonaktif | Sistem menampilkan pesan bahwa jadwal harus aktif untuk kirim manual |
| Admin mencoba edit template pesan WA dengan placeholder yang tidak valid | Sistem menampilkan pesan kesalahan dan daftar placeholder yang valid |
| Wali kelas mencoba approval pengajuan izin/sakit yang bukan dari kelasnya | Sistem menampilkan pesan bahwa akses ditolak |
| Admin mencoba arsipkan siswa yang sudah diarsipkan | Sistem menampilkan pesan bahwa siswa sudah dalam status arsip |
| Admin mencoba export grafik yang belum di-render | Sistem menampilkan pesan untuk menunggu grafik selesai di-render |
| Sistem mengirim reminder absensi ke siswa yang sudah absensi | Sistem melewati siswa tersebut dan hanya mengirim reminder ke siswa yang belum absensi |
| Admin mencoba set threshold pengenalan wajah di luar range 0-1 | Sistem menampilkan pesan bahwa nilai threshold harus antara 0 dan 1 |
| Admin mencoba set batas waktu absensi keluar lebih awal dari jam masuk | Sistem menampilkan pesan bahwa batas waktu keluar harus setelah jam masuk |
| Admin mencoba tambah lokasi absensi tanpa koordinat atau radius | Sistem menampilkan pesan bahwa koordinat dan radius wajib diisi |
| Admin mencoba assign lokasi ke kelas yang sudah memiliki lokasi | Sistem menampilkan konfirmasi untuk mengganti lokasi yang sudah ada |
| Wali kelas atau guru BK mencoba registrasi wajah siswa yang sudah terdaftar | Sistem menampilkan pesan bahwa wajah siswa sudah terdaftar dan menawarkan opsi untuk update |
| Admin mencoba edit massal dengan file yang berisi id tidak valid | Sistem menampilkan pesan kesalahan dan menunjukkan baris data dengan id tidak valid |
| Pengiriman email laporan kehadiran gagal | Sistem mencatat log pengiriman dengan status gagal |

## 6. Kriteria Penerimaan

1. Admin login ke sistem menggunakan kredensial yang valid
2. Admin melihat dashboard dengan widget statistik real-time, grafik tren kehadiran (7 hari/mingguan/bulanan), heatmap kehadiran per hari, grafik distribusi status kehadiran hari ini, tabel top 10 siswa absensi terendah, perbandingan kehadiran antar kelas, dan status absensi real-time
3. Admin mengatur pengaturan sistem: nama sekolah, logo sekolah, tahun ajaran aktif, jam masuk, jam terlambat, jam keluar minimum, batas waktu absensi keluar, persentase kehadiran minimum, confidence threshold pengenalan wajah, kalender cuti/libur sekolah, dan dark mode
4. Admin membuat kelas baru dan menugaskan satu atau lebih wali kelas ke kelas tersebut
5. Admin mengatur multiple lokasi absensi (titik koordinat dan radius) untuk kelas atau gedung berbeda dan menugaskan lokasi ke kelas tertentu
6. Admin mengunduh template file untuk import data siswa, mengisi template, dan mengupload file tersebut
7. Sistem memvalidasi data file, menampilkan preview data, admin mengkonfirmasi import, dan sistem menyimpan data siswa secara massal ke database
8. Admin mengunduh template file edit massal untuk siswa, mengedit data, dan mengupload file tersebut
9. Sistem memvalidasi data file, menampilkan preview perubahan, admin mengkonfirmasi edit massal, sistem memperbarui data siswa secara massal, dan menyimpan riwayat perubahan ke audit log
10. Admin atau wali kelas atau guru BK mendaftarkan wajah siswa baru melalui halaman registrasi wajah dengan mengambil beberapa foto wajah
11. Admin generate QR code absensi dinamis yang berubah setiap sesi atau setiap jam dan menampilkan QR code di layar atau mencetak untuk ditempel di lokasi absensi
12. Admin membuat jadwal laporan WA harian untuk orangtua siswa dengan waktu pengiriman pukul 16:00 dan mengaktifkan jadwal tersebut
13. Admin mengcustomisasi template pesan WA untuk jadwal dengan placeholder dinamis
14. Sistem menjalankan jadwal sesuai waktu yang ditentukan, mengirim laporan kehadiran ke nomor WA orangtua siswa menggunakan template yang sudah dicustomisasi, dan mencatat log pengiriman
15. Admin melihat statistik pengiriman laporan WA (rata-rata waktu kirim, tingkat keberhasilan)
16. Admin pause jadwal laporan WA, sistem menghentikan pengiriman, admin resume jadwal, sistem melanjutkan pengiriman
17. Admin mengirim laporan WA manual di luar jadwal
18. Sistem menjalankan proses pengecekan ketidakhadiran siswa setiap minggu, mengidentifikasi siswa dengan ketidakhadiran >= 3 kali tanpa keterangan, dan mengirim notifikasi WA ke semua guru BK yang terdaftar
19. Sistem mengirim notifikasi email untuk laporan kehadiran
20. Siswa berada di lokasi absensi yang telah ditentukan dan melakukan absensi masuk dengan memindai wajah, sistem berhasil mengenali wajah menggunakan threshold yang dikonfigurasi admin, menentukan status kehadiran (hadir atau terlambat), dan mencatat waktu masuk serta lokasi
21. Siswa berada di lokasi absensi dan melakukan absensi masuk dengan scan QR code dinamis, sistem memvalidasi QR code masih berlaku untuk sesi atau jam saat ini, menentukan status kehadiran, dan mencatat waktu masuk serta lokasi
22. Siswa melakukan absensi keluar sebelum batas waktu yang dikonfigurasi, sistem mencatat waktu keluar
23. Sistem mengirim reminder otomatis ke siswa yang belum absensi masuk 30 menit setelah jam masuk
24. Siswa mengajukan izin/sakit melalui dashboard siswa dengan mengisi formulir dan mengupload bukti (surat dokter/foto)
25. Sistem menyimpan pengajuan ke database dengan status pending dan mengirim notifikasi in-app ke wali kelas
26. Wali kelas menerima notifikasi in-app tentang pengajuan izin/sakit baru dari siswa kelasnya
27. Wali kelas melihat daftar pengajuan izin/sakit, melihat detail pengajuan dan bukti upload, dan melakukan approval tingkat pertama
28. Sistem memperbarui status pengajuan menjadi approved_wali_kelas dan mengirim notifikasi in-app ke admin
29. Admin melihat pengajuan yang sudah diapprove wali kelas, melihat detail pengajuan, dan melakukan approval tingkat kedua
30. Sistem memperbarui status pengajuan menjadi approved_admin dan mengirim notifikasi in-app ke siswa tentang hasil approval
31. Sistem memperbarui status kehadiran siswa pada tanggal tersebut menjadi izin
32. Wali kelas login ke sistem dan melihat dashboard kelas yang menampilkan statistik kehadiran semua kelas yang diampu hari ini
33. Wali kelas mengedit data siswa kelasnya dan sistem menyimpan riwayat perubahan ke audit log
34. Wali kelas melihat rekap kehadiran kelas (harian, mingguan, bulanan, per semester) dan download laporan PDF rekap kehadiran kelas
35. Guru BK login ke sistem dan melihat dashboard BK yang menampilkan statistik kehadiran semua kelas
36. Guru BK melihat rekap semua kelas dengan persentase kehadiran per kelas
37. Guru BK mencari siswa tertentu, melihat detail riwayat absensi siswa tersebut, dan mengedit data siswa
38. Guru BK melihat laporan pelanggaran kehadiran yang menampilkan siswa dengan ketidakhadiran >= 3 kali dalam 1 minggu berjalan tanpa keterangan
39. Admin mengklik nama siswa dari daftar siswa dan melihat halaman profil lengkap siswa dengan informasi siswa, grafik kehadiran bulanan, persentase hadir/sakit/izin/alpa, dan riwayat absensi lengkap (termasuk catatan)
40. Admin mengelola absensi manual (tambah, edit, hapus, tambah catatan, bulk action) dan sistem memvalidasi tidak ada duplikat absensi per siswa per hari
41. Admin melihat log aktivitas sistem untuk audit dan memfilter log berdasarkan pengguna atau jenis aktivitas
42. Admin melihat audit log perubahan data siswa dan memfilter berdasarkan siswa atau rentang tanggal
43. Admin mengatur tahun ajaran baru, sistem mengarsipkan data absensi tahun ajaran sebelumnya, dan mengatur tahun ajaran baru sebagai aktif
44. Admin melihat data absensi tahun ajaran sebelumnya melalui menu arsip tahun ajaran
45. Admin mengarsipkan siswa yang lulus atau pindah, data siswa tetap tersimpan tetapi tidak muncul di daftar siswa aktif
46. Admin melihat laporan kehadiran dengan filter per minggu, per semester, atau perbandingan antar tahun ajaran
47. Admin memfilter laporan hanya untuk siswa yang tidak hadir
48. Admin export grafik kehadiran ke format PNG
49. Admin mengaktifkan dark mode, sistem menerapkan tema dark mode ke seluruh halaman dashboard
50. Semua pengguna menerima notifikasi in-app real-time untuk peristiwa penting (pengajuan izin/sakit, approval, siswa tidak hadir tanpa keterangan, reminder absensi, dll)
51. Semua pengguna mengedit profil akun (nama, foto profil) dan mengganti password, sistem berhasil memperbarui data profil
52. Pengguna lupa password, menggunakan fitur reset password via email, menerima link reset password, dan berhasil mengatur password baru

## 7. Fitur yang Tidak Diimplementasikan pada Periode Ini

- Notifikasi WA otomatis saat siswa baru ditambahkan atau diimport (ke orangtua)
- Notifikasi WA otomatis saat akun wali kelas atau guru BK baru dibuat atau diimport (berisi kredensial login)
- Notifikasi push untuk pengingat absensi
- Integrasi dengan sistem akademik atau administrasi sekolah eksternal
- Pengaturan jadwal pelajaran dan kelas
- Fitur approval atau verifikasi manual untuk absensi yang gagal
- Multi-bahasa (hanya mendukung Bahasa Indonesia)
- Backup dan restore data otomatis
- Dashboard analitik lanjutan (prediksi kehadiran, analisis pola, dll)
- Validasi format file upload selain Excel/CSV
- Retry otomatis untuk notifikasi WA yang gagal terkirim
- Notifikasi WA otomatis ke orangtua saat pengajuan izin/sakit diapprove atau direject
- Fitur chat atau komunikasi antar pengguna
- Integrasi dengan sistem pembayaran atau keuangan
- Fitur absensi berbasis NFC
- Pengaturan hak akses granular untuk admin (role-based access control)
- Fitur ekspor data siswa, wali kelas, atau guru BK ke file
- Fitur import absensi dari file eksternal
- Dashboard untuk orangtua siswa
- Notifikasi SMS untuk laporan kehadiran
- Fitur absensi untuk kegiatan ekstrakurikuler atau acara khusus
- Integrasi dengan sistem biometrik lain (fingerprint, iris scan)
- Fitur laporan kehadiran per mata pelajaran
- Fitur notifikasi untuk wali kelas saat ada siswa yang terlambat
- Customisasi tampilan dashboard per pengguna
- Fitur export log aktivitas sistem
- Pengaturan retention policy untuk data absensi lama
- Integrasi dengan kalender sekolah
- Fitur laporan kehadiran untuk rapat atau pertemuan guru
- Fitur upload bukti dalam format video untuk pengajuan izin/sakit
- Fitur absensi via aplikasi mobile native (iOS/Android)
- Fitur geofencing otomatis untuk mendeteksi siswa masuk/keluar area sekolah
- Fitur prediksi kehadiran siswa berdasarkan data historis
- Fitur integrasi dengan Google Calendar atau Outlook Calendar
- Fitur customisasi warna tema dashboard per pengguna
- Fitur multi-tenant untuk beberapa sekolah dalam satu sistem
- Fitur API publik untuk integrasi dengan sistem eksternal
- Fitur webhook untuk notifikasi real-time ke sistem eksternal