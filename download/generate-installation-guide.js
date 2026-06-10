const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, TabStopType, TabStopPosition, ExternalHyperlink,
  LevelFormat, TableOfContents, SectionType,
} = require("docx");
const fs = require("fs");

// ============================================================
// PALETTE — Education / Tech (Warm Teal)
// ============================================================
const P = {
  primary: "15857A",
  body: "1C2A3D",
  secondary: "5B6B7D",
  accent: "15857A",
  surface: "F0EDE5",
};
const t = {
  headerBg: "15857A",
  headerText: "FFFFFF",
  accentLine: "15857A",
  innerLine: "D5D0C8",
  surface: "F0EDE5",
};
const c = (hex) => hex.replace("#", "");

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function safeText(value, placeholder) {
  if (value === undefined || value === null || value === "" || String(value) === "NaN" || String(value) === "undefined") {
    return placeholder || "【Please fill in】";
  }
  return String(value);
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function bodyNoIndent(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function codeBlock(lines) {
  return lines.map((line) =>
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 276 },
      shading: { type: ShadingType.CLEAR, fill: "F5F5F0" },
      indent: { left: 360 },
      children: [new TextRun({ text: line, size: 20, font: { ascii: "Consolas", eastAsia: "Consolas" }, color: c(P.body) })],
    })
  );
}

function bulletItem(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function numberedItem(text, reference, level = 0) {
  return new Paragraph({
    numbering: { reference, level },
    spacing: { line: 312 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function tipBox(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 120, line: 312 },
    indent: { left: 360 },
    shading: { type: ShadingType.CLEAR, fill: "E8F5F0" },
    children: [
      new TextRun({ text: "\u2139\uFE0F Tip: ", bold: true, size: 22, color: c(P.accent), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

function warningBox(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 120, line: 312 },
    indent: { left: 360 },
    shading: { type: ShadingType.CLEAR, fill: "FFF3E0" },
    children: [
      new TextRun({ text: "\u26A0\uFE0F Peringatan: ", bold: true, size: 22, color: "E65100", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

// ============================================================
// TABLE HELPERS
// ============================================================
function makeTable(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 21, color: t.headerText, font: { ascii: "Calibri", eastAsia: "SimHei" } })] })],
        shading: { type: ShadingType.CLEAR, fill: t.headerBg },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
      })
    ),
  });

  const dataRows = rows.map((row, idx) =>
    new TableRow({
      cantSplit: true,
      children: row.map((cell) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: safeText(cell, "-"), size: 21, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
          shading: idx % 2 === 0 ? { type: ShadingType.CLEAR, fill: t.surface } : { type: ShadingType.CLEAR, fill: "FFFFFF" },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          width: { size: Math.floor(100 / row.length), type: WidthType.PERCENTAGE },
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: t.innerLine },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [headerRow, ...dataRows],
  });
}

// ============================================================
// COVER — Recipe R1 (Pure Paragraph Left)
// ============================================================
function buildCover() {
  const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: allNoBorders,
      rows: [
        new TableRow({
          height: { value: 16838, rule: "exact" },
          children: [
            new TableCell({
              borders: allNoBorders,
              verticalAlign: "top",
              width: { size: 100, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ spacing: { before: 3200 }, children: [] }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 1200 },
                  spacing: { line: 920, lineRule: "atLeast" },
                  children: [
                    new TextRun({ text: "Panduan Instalasi", size: 72, bold: true, color: "15857A", font: { ascii: "Calibri", eastAsia: "SimHei" } }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 1200 },
                  spacing: { before: 80, line: 680, lineRule: "atLeast" },
                  children: [
                    new TextRun({ text: "Sistem Absensi Sekolah", size: 52, bold: true, color: "2A4A3A", font: { ascii: "Calibri", eastAsia: "SimHei" } }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 1200 },
                  spacing: { before: 40, line: 480, lineRule: "atLeast" },
                  children: [
                    new TextRun({ text: "dengan Pengenalan Wajah", size: 40, color: "5B6B7D", font: { ascii: "Calibri", eastAsia: "SimHei" } }),
                  ],
                }),
                new Paragraph({ spacing: { before: 600 }, children: [] }),
                // Accent line
                new Paragraph({
                  indent: { left: 1200, right: 4000 },
                  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "FF6A3B", space: 8 } },
                  spacing: { after: 200 },
                  children: [],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 1200 },
                  spacing: { before: 200, line: 360 },
                  children: [
                    new TextRun({ text: "Versi 1.0  |  Juni 2026", size: 22, color: "707070", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 1200 },
                  spacing: { before: 80, line: 360 },
                  children: [
                    new TextRun({ text: "Next.js 16  \u00B7  React 19  \u00B7  TypeScript  \u00B7  Prisma  \u00B7  SQLite/PostgreSQL", size: 20, color: "90989F", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  indent: { left: 1200 },
                  spacing: { before: 80, line: 360 },
                  children: [
                    new TextRun({ text: "face-api.js  \u00B7  QR Code  \u00B7  Geolocation  \u00B7  shadcn/ui", size: 20, color: "90989F", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];
}

// ============================================================
// NUMBERING CONFIG
// ============================================================
const numberingConfig = [];
const lists = [
  "prereq-os", "prereq-software", "install-clone", "install-env", "install-deps", "install-db",
  "install-seed", "install-face", "install-dev", "install-build", "install-prod",
  "vercel-steps", "supabase-steps", "docker-steps", "troubleshoot-steps",
  "env-local", "env-staging", "env-prod",
];
lists.forEach((ref) => {
  numberingConfig.push({
    reference: ref,
    levels: [
      {
        level: 0,
        format: LevelFormat.DECIMAL,
        text: "%1.",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      },
    ],
  });
});

// ============================================================
// DOCUMENT ASSEMBLY
// ============================================================
const pgSize = { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
    heading1: {
      run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) },
      paragraph: { spacing: { before: 360, after: 160, line: 312 } },
    },
    heading2: {
      run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) },
      paragraph: { spacing: { before: 240, after: 120, line: 312 } },
    },
    heading3: {
      run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.primary) },
      paragraph: { spacing: { before: 200, after: 100, line: 312 } },
    },
  },
  numbering: { config: numberingConfig },
  sections: [
    // ===== SECTION 1: COVER =====
    {
      properties: {
        page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCover(),
    },
    // ===== SECTION 2: TOC (FRONT MATTER) =====
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize,
          margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" })],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 360 },
          children: [new TextRun({ text: "Daftar Isi", bold: true, size: 32, font: { eastAsia: "SimHei", ascii: "Calibri" }, color: c(P.primary) })],
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: "Catatan: Daftar Isi ini dibuat melalui field codes. Untuk memastikan nomor halaman akurat, klik kanan pada Daftar Isi dan pilih \"Update Field\".",
              italics: true,
              size: 18,
              color: "888888",
            }),
          ],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // ===== SECTION 3: BODY =====
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize,
          margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" })],
            }),
          ],
        }),
      },
      children: [
        // ==========================================
        // BAB 1: PENDAHULUAN
        // ==========================================
        heading("1. Pendahuluan"),
        body("Sistem Absensi Sekolah dengan Pengenalan Wajah adalah aplikasi web berbasis Next.js 16 yang dirancang untuk mengotomatisasi proses absensi di lingkungan sekolah. Sistem ini mengintegrasikan teknologi pengenalan wajah (face recognition) menggunakan face-api.js, pemindaian QR Code dinamis, validasi geolokasi berbasis radius (Haversine), serta notifikasi WhatsApp untuk memberikan solusi absensi yang komprehensif dan aman. Aplikasi ini mendukung empat peran pengguna utama: Admin, Wali Kelas, Guru BK, dan Siswa, masing-masing dengan fitur dan akses yang disesuaikan."),
        body("Dokumen panduan ini disusun untuk membantu pengguna dan administrator dalam melakukan proses instalasi, konfigurasi, dan deployment sistem. Panduan ini mencakup langkah-langkah mulai dari persyaratan sistem, instalasi lokal untuk pengembangan, hingga deployment ke platform cloud seperti Vercel dan Supabase. Setiap tahap dijelaskan secara detail agar proses instalasi dapat berjalan lancar tanpa hambatan berarti."),
        body("Aplikasi dibangun menggunakan stack teknologi modern yang meliputi Next.js 16 dengan App Router, React 19, TypeScript, Prisma ORM, serta antarmuka pengguna berbasis shadcn/ui dan Tailwind CSS 4. Database default yang digunakan adalah SQLite untuk kemudahan pengembangan lokal, namun sistem ini dirancang agar dapat dengan mudah dimigrasikan ke PostgreSQL melalui Supabase untuk kebutuhan produksi yang lebih robust dan skalabel."),

        heading("1.1 Arsitektur Sistem", HeadingLevel.HEADING_2),
        body("Aplikasi ini menggunakan arsitektur single-page application (SPA) yang dikelola melalui Zustand state management di sisi klien. Meskipun dibangun di atas Next.js yang mendukung file-based routing, sistem ini menggunakan pendekatan client-side routing dimana navigasi antar halaman dikendalikan oleh state currentPage di Zustand store. Hal ini memungkinkan transisi antar halaman yang cepat tanpa perlu reload penuh, serta memudahkan pengelolaan state autentikasi dan sesi pengguna secara konsisten di seluruh aplikasi."),
        body("Pada sisi server, aplikasi menyediakan lebih dari 20 API endpoints yang menangani operasi CRUD untuk entitas utama seperti pengguna, siswa, guru, kelas, absensi, izin, laporan, dan lainnya. Autentikasi menggunakan pendekatan custom header-based auth dimana klien mengirimkan header x-user-id, x-user-role, dan x-user-name yang divalidasi oleh middleware API di sisi server. Pendekatan ini dipilih untuk kesederhanaan implementasi demo, namun untuk produksi sangat direkomendasikan untuk bermigrasi ke Supabase Auth yang menyediakan keamanan berlapis termasuk JWT, refresh token, dan session management."),

        heading("1.2 Tech Stack", HeadingLevel.HEADING_2),
        makeTable(
          ["Komponen", "Teknologi", "Versi"],
          [
            ["Framework", "Next.js (App Router)", "16.x"],
            ["UI Library", "React", "19.x"],
            ["Bahasa", "TypeScript", "5.x"],
            ["Styling", "Tailwind CSS + shadcn/ui", "4.x"],
            ["State Management", "Zustand", "5.x"],
            ["ORM", "Prisma", "6.x"],
            ["Database (Dev)", "SQLite", "Bawaan"],
            ["Database (Prod)", "PostgreSQL (Supabase)", "-"],
            ["Face Recognition", "face-api.js", "0.22.x"],
            ["QR Code", "qrcode + html5-qrcode", "1.5.x / 2.3.x"],
            ["PDF Generator", "jsPDF + jspdf-autotable", "4.x / 5.x"],
            ["Excel I/O", "xlsx (SheetJS)", "0.18.x"],
            ["Charts", "Recharts", "2.x"],
            ["Package Manager", "Bun", "1.x"],
            ["Runtime", "Node.js (alternatif)", "18.x+"],
          ]
        ),

        // ==========================================
        // BAB 2: PERSYARATAN SISTEM
        // ==========================================
        heading("2. Persyaratan Sistem"),
        body("Sebelum memulai proses instalasi, pastikan sistem Anda memenuhi persyaratan minimum yang akan dijelaskan pada bagian ini. Kegagalan dalam memenuhi persyaratan dapat menyebabkan error saat instalasi dependency, build, atau runtime. Persyaratan dibagi menjadi dua kategori: persyaratan sistem operasi dan perangkat lunak yang harus terinstall."),

        heading("2.1 Sistem Operasi", HeadingLevel.HEADING_2),
        body("Aplikasi ini dapat berjalan di berbagai sistem operasi mayoritas. Berikut adalah sistem operasi yang didukung beserta catatan khusus untuk masing-masing platform:"),
        makeTable(
          ["Sistem Operasi", "Versi Minimum", "Catatan"],
          [
            ["Windows", "10 / Server 2019+", "Gunakan WSL2 untuk kompatibilitas terbaik"],
            ["macOS", "12 (Monterey)+", "Chip Apple Silicon (M1/M2/M3) didukung penuh"],
            ["Ubuntu/Debian", "20.04+", "Rekomendasi untuk deployment server produksi"],
            ["CentOS/RHEL", "8+", "Butuh repository tambahan untuk Bun"],
          ]
        ),

        heading("2.2 Perangkat Lunak yang Dibutuhkan", HeadingLevel.HEADING_2),
        body("Berikut adalah daftar perangkat lunak yang wajib dan opsional untuk menginstal dan menjalankan aplikasi ini. Pastikan semua perangkat lunak wajib terinstall sebelum melanjutkan ke tahap instalasi."),

        new Paragraph({
          keepNext: true,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "Wajib:", bold: true, size: 24, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        makeTable(
          ["Perangkat Lunak", "Versi Minimum", "Fungsi", "Cara Cek Versi"],
          [
            ["Bun", "1.0+", "Package manager & runtime", "bun --version"],
            ["Node.js", "18.17+", "Runtime alternatif", "node --version"],
            ["Git", "2.30+", "Version control", "git --version"],
            ["Prisma CLI", "6.x", "Database migration & generation", "npx prisma --version"],
          ]
        ),

        new Paragraph({
          keepNext: true,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "Opsional:", bold: true, size: 24, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        makeTable(
          ["Perangkat Lunak", "Fungsi", "Kapan Dibutuhkan"],
          [
            ["Docker + Docker Compose", "Containerized deployment", "Deploy ke server produksi"],
            ["Vercel CLI", "Deployment ke Vercel", "Deploy ke cloud Vercel"],
            ["Supabase CLI", "Manajemen database Supabase", "Menggunakan Supabase sebagai database"],
            ["PostgreSQL", "Database produksi", "Jika tidak menggunakan Supabase"],
          ]
        ),

        heading("2.3 Instalasi Bun", HeadingLevel.HEADING_2),
        body("Bun adalah package manager dan JavaScript runtime yang direkomendasikan untuk proyek ini. Bun menawarkan kecepatan instalasi dependency yang jauh lebih cepat dibanding npm atau yarn. Berikut cara instalasi Bun di berbagai sistem operasi:"),
        ...codeBlock([
          "# macOS / Linux (via curl)",
          "curl -fsSL https://bun.sh/install | bash",
          "",
          "# Windows (via PowerShell)",
          "powershell -c \"irm bun.sh/install.ps1 | iex\"",
          "",
          "# Menggunakan npm (alternatif cross-platform)",
          "npm install -g bun",
          "",
          "# Verifikasi instalasi",
          "bun --version",
        ]),

        heading("2.4 Persyaratan Hardware", HeadingLevel.HEADING_2),
        makeTable(
          ["Komponen", "Minimum", "Rekomendasi"],
          [
            ["RAM", "4 GB", "8 GB+"],
            ["Penyimpanan", "2 GB", "5 GB+"],
            ["CPU", "2 core", "4 core+"],
            ["Kamera (untuk face recognition)", "Webcam 720p", "Webcam 1080p"],
            ["GPS/Geolokasi", "Browser dengan Geolocation API", "Perangkat dengan GPS built-in"],
          ]
        ),

        // ==========================================
        // BAB 3: INSTALASI LOKAL (DEVELOPMENT)
        // ==========================================
        heading("3. Instalasi Lokal (Development)"),
        body("Bagian ini menjelaskan langkah-langkah lengkap untuk menyiapkan lingkungan pengembangan lokal. Ikuti setiap langkah secara berurutan untuk memastikan sistem berjalan dengan baik. Proses instalasi ini mengasumsikan Anda menggunakan SQLite sebagai database (default untuk development), yang tidak memerlukan setup database server terpisah."),

        heading("3.1 Clone Repository", HeadingLevel.HEADING_2),
        body("Langkah pertama adalah meng-clone (mengunduh) source code proyek dari repository Git. Buka terminal atau command prompt dan jalankan perintah berikut:"),
        ...codeBlock([
          "# Clone repository",
          "git clone <URL_REPOSITORY> sistem-absensi",
          "",
          "# Masuk ke direktori proyek",
          "cd sistem-absensi",
        ]),
        body("Ganti <URL_REPOSITORY> dengan URL Git repository yang sesuai. Jika repository bersifat private, Anda akan diminta untuk memasukkan kredensial autentikasi (username dan personal access token). Pastikan Anda memiliki akses yang diperlukan ke repository sebelum melanjutkan."),

        heading("3.2 Konfigurasi Environment Variables", HeadingLevel.HEADING_2),
        body("File .env berisi konfigurasi environment yang diperlukan oleh aplikasi. Buat file .env di root directory proyek (atau salin dari .env.example jika tersedia) dengan konten berikut:"),
        ...codeBlock([
          "# Database",
          "DATABASE_URL=\"file:./db/custom.db\"",
          "",
          "# Jika menggunakan PostgreSQL/Supabase (produksi):",
          "# DATABASE_URL=\"postgresql://user:password@host:5432/dbname?schema=public\"",
          "",
          "# Supabase (opsional - untuk produksi)",
          "# NEXT_PUBLIC_SUPABASE_URL=\"https://your-project.supabase.co\"",
          "# NEXT_PUBLIC_SUPABASE_ANON_KEY=\"your-anon-key\"",
          "# SUPABASE_SERVICE_ROLE_KEY=\"your-service-role-key\"",
          "",
          "# WhatsApp API (opsional)",
          "# WAHA_API_URL=\"http://localhost:3001\"",
          "# WAHA_API_KEY=\"your-waha-api-key\"",
          "",
          "# Email/SMTP (opsional)",
          "# SMTP_HOST=\"smtp.gmail.com\"",
          "# SMTP_PORT=\"587\"",
          "# SMTP_USER=\"your-email@gmail.com\"",
          "# SMTP_PASS=\"your-app-password\"",
        ]),
        warningBox("Untuk tahap development lokal, Anda hanya perlu mengisi DATABASE_URL. Variabel lainnya bersifat opsional dan hanya diperlukan jika ingin mengaktifkan fitur integrasi tertentu seperti WhatsApp notification atau email."),

        heading("3.3 Instalasi Dependencies", HeadingLevel.HEADING_2),
        body("Setelah konfigurasi environment variables, langkah selanjutnya adalah menginstal semua package dependency yang diperlukan oleh proyek. Proyek ini menggunakan Bun sebagai package manager utama, namun Anda juga dapat menggunakan npm jika lebih familiar:"),
        ...codeBlock([
          "# Menggunakan Bun (rekomendasi - lebih cepat)",
          "bun install",
          "",
          "# Menggunakan npm (alternatif)",
          "npm install",
          "",
          "# Menggunakan yarn (alternatif)",
          "yarn install",
        ]),
        body("Proses instalasi akan mengunduh sekitar 88 package dependency termasuk framework Next.js, komponen UI shadcn/ui, ORM Prisma, library face-api.js, dan berbagai package pendukung lainnya. Waktu instalasi bervariasi tergantung koneksi internet, namun dengan Bun biasanya hanya memerlukan waktu 10-30 detik."),

        heading("3.4 Setup Database", HeadingLevel.HEADING_2),
        body("Setelah dependencies terinstal, langkah berikutnya adalah menyiapkan database. Proses ini meliputi generate Prisma client, membuat skema database, dan mengisi data awal (seeding). Jalankan perintah-perintah berikut secara berurutan:"),
        ...codeBlock([
          "# Step 1: Generate Prisma Client",
          "bunx prisma generate",
          "",
          "# Step 2: Buat skema database (push ke SQLite)",
          "bunx prisma db push",
          "",
          "# Step 3: Isi data awal (seed)",
          "bunx prisma db seed",
        ]),
        tipBox("Jika perintah bunx tidak dikenali, gunakan npx sebagai alternatif: npx prisma generate, npx prisma db push, npx prisma db seed."),

        heading("3.5 Data Awal (Seed Data)", HeadingLevel.HEADING_2),
        body("Proses seeding akan membuat data awal yang diperlukan untuk menjalankan sistem. Data ini sangat berguna untuk keperluan testing dan demonstrasi. Berikut adalah data yang akan dibuat secara otomatis oleh script seed:"),
        makeTable(
          ["Data", "Jumlah", "Detail"],
          [
            ["Akun Admin", "1", "admin@sekolah.id / admin123"],
            ["Akun Guru (Wali Kelas)", "2", "budi@sekolah.id, siti@sekolah.id / admin123"],
            ["Akun Guru BK", "1", "dewi@sekolah.id / admin123"],
            ["Akun Siswa", "10", "ahmad@sekolah.id, dst. / admin123"],
            ["Kelas", "3", "X RPL, XI RPL, XII RPL"],
            ["Tahun Ajaran", "1", "2025/2026"],
            ["Lokasi Absensi", "1", "Gerbang Utama (-6.2088, 106.8456)"],
            ["Hari Libur", "10", "Hari libur nasional Indonesia 2025"],
            ["Pengaturan Sistem", "7", "Jam masuk, keluar, batas terlambat, dll."],
          ]
        ),
        warningBox("Password default untuk semua akun seed adalah admin123. Sangat disarankan untuk mengubah password ini segera setelah login pertama kali, terutama pada lingkungan produksi."),

        heading("3.6 Setup Model Face Recognition", HeadingLevel.HEADING_2),
        body("Aplikasi menggunakan face-api.js untuk fitur pengenalan wajah. Model AI yang diperlukan sudah tersedia di direktori /public/models/ pada proyek. Model-model ini harus dapat diakses oleh browser melalui URL publik agar fitur pengenalan wajah dapat berfungsi. Berikut adalah file-file model yang diperlukan:"),
        makeTable(
          ["Model", "File", "Fungsi"],
          [
            ["TinyFaceDetector", "tiny_face_detector_model-shard1 + manifest", "Deteksi wajah secara real-time"],
            ["FaceLandmark68", "face_landmark_68_model-shard1 + manifest", "Deteksi 68 titik landmark wajah"],
            ["FaceRecognition", "face_recognition_model-shard1 + manifest", "Ekstraksi deskriptor wajah (128-dim)"],
          ]
        ),
        body("Jika file model tidak ada atau rusak, Anda dapat mengunduhnya secara manual dari repository resmi face-api.js weights di GitHub dan menempatkannya di folder /public/models/. Aplikasi akan otomatis masuk ke mode demo (simulasi) jika model tidak dapat dimuat, sehingga fitur absensi tetap dapat digunakan meskipun tanpa pengenalan wajah sesungguhnya."),

        heading("3.7 Menjalankan Server Development", HeadingLevel.HEADING_2),
        body("Setelah semua langkah di atas selesai, Anda siap menjalankan server development. Server ini mendukung hot-reload sehingga setiap perubahan pada kode akan otomatis diperbarui di browser tanpa perlu restart manual:"),
        ...codeBlock([
          "# Menggunakan Bun",
          "bun run dev",
          "",
          "# Menggunakan npm",
          "npm run dev",
        ]),
        body("Server akan berjalan di http://localhost:3000. Buka browser dan akses URL tersebut untuk melihat aplikasi. Anda akan diarahkan ke halaman login. Gunakan salah satu kredensial dari data seed yang telah dibuat sebelumnya untuk masuk ke sistem. Pastikan webcam tersedia dan izin kamera diberikan jika ingin menguji fitur pengenalan wajah."),

        heading("3.8 Build untuk Produksi", HeadingLevel.HEADING_2),
        body("Untuk membangun versi produksi yang telah dioptimasi, jalankan perintah berikut. Proses build akan menghasilkan output standalone di direktori .next/standalone/ yang dapat di-deploy tanpa perlu menginstal dependencies secara lengkap di server target:"),
        ...codeBlock([
          "# Build produksi",
          "bun run build",
          "",
          "# Jalankan server produksi",
          "bun run start",
        ]),
        body("Perintah build akan menyalin file static dan public ke dalam direktori standalone, sehingga server produksi dapat berjalan hanya dengan file-file yang ada di .next/standalone/. Konfigurasi ini sudah diatur dalam next.config.ts dengan output: \"standalone\". Server produksi secara default berjalan di port 3000 dan dapat diubah melalui environment variable PORT."),

        // ==========================================
        // BAB 4: KONFIGURASI ENVIRONMENT
        // ==========================================
        heading("4. Konfigurasi Environment Detail"),
        body("Bagian ini menjelaskan secara rinci setiap variabel environment yang dapat dikonfigurasi dalam file .env. Pemahaman yang baik tentang setiap variabel akan membantu Anda menyesuaikan sistem sesuai kebutuhan deployment yang berbeda, baik untuk lingkungan development, staging, maupun produksi."),

        heading("4.1 Variabel Database", HeadingLevel.HEADING_2),
        makeTable(
          ["Variabel", "Wajib", "Default", "Deskripsi"],
          [
            ["DATABASE_URL", "Ya", "file:./db/custom.db", "Connection string database. Gunakan format file: untuk SQLite, postgresql:// untuk PostgreSQL"],
          ]
        ),
        body("Untuk SQLite, gunakan format file:./relative/path/to/db.sqlite atau file:/absolute/path/to/db.sqlite. Untuk PostgreSQL di Supabase, format connection string adalah postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres. Pastikan untuk menggunakan connection pooler URL (port 6543) untuk koneksi dari serverless/edge functions, dan direct connection URL (port 5432) untuk koneksi jangka panjang."),

        heading("4.2 Variabel Supabase", HeadingLevel.HEADING_2),
        makeTable(
          ["Variabel", "Wajib", "Deskripsi"],
          [
            ["NEXT_PUBLIC_SUPABASE_URL", "Tidak", "URL proyek Supabase (https://xxx.supabase.co)"],
            ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Tidak", "Anon/public key untuk akses client-side"],
            ["SUPABASE_SERVICE_ROLE_KEY", "Tidak", "Service role key untuk akses admin (server-side only)"],
          ]
        ),
        body("Key Supabase dapat diperoleh dari dashboard Supabase di Settings > API. NEXT_PUBLIC_ prefix diperlukan agar variabel dapat diakses dari sisi klien (browser). Service role key harus disimpan rahasia dan hanya digunakan di sisi server karena memiliki akses penuh tanpa batasan Row Level Security (RLS). Jangan pernah mengekspos service role key di kode client-side atau repository publik."),

        heading("4.3 Variabel WhatsApp (WAHA API)", HeadingLevel.HEADING_2),
        makeTable(
          ["Variabel", "Wajib", "Deskripsi"],
          [
            ["WAHA_API_URL", "Tidak", "URL server WAHA API (default: http://localhost:3001)"],
            ["WAHA_API_KEY", "Tidak", "API key untuk autentikasi ke WAHA server"],
          ]
        ),
        body("WAHA (WhatsApp HTTP API) adalah layanan pihak ketiga yang memungkinkan pengiriman pesan WhatsApp secara terprogram. Untuk mengaktifkan fitur notifikasi WhatsApp, Anda perlu menjalankan server WAHA secara terpisah dan mengkonfigurasi variabel ini. Konsultasikan dokumentasi WAHA di https://waha.devlike.pro untuk panduan instalasi dan konfigurasi server WAHA."),

        heading("4.4 Variabel Email/SMTP", HeadingLevel.HEADING_2),
        makeTable(
          ["Variabel", "Wajib", "Deskripsi"],
          [
            ["SMTP_HOST", "Tidak", "Hostname SMTP server (contoh: smtp.gmail.com)"],
            ["SMTP_PORT", "Tidak", "Port SMTP (587 untuk TLS, 465 untuk SSL)"],
            ["SMTP_USER", "Tidak", "Username/email untuk autentikasi SMTP"],
            ["SMTP_PASS", "Tidak", "Password atau app-specific password"],
          ]
        ),
        body("Konfigurasi email digunakan untuk fitur reset password dan pengiriman laporan via email. Jika menggunakan Gmail, Anda perlu membuat App Password di pengaturan keamanan akun Google karena password reguler tidak dapat digunakan untuk akses SMTP. Caranya: buka Google Account > Security > 2-Step Verification > App passwords > buat password baru untuk aplikasi ini."),

        // ==========================================
        // BAB 5: DEPLOYMENT KE VERCEL
        // ==========================================
        heading("5. Deployment ke Vercel"),
        body("Vercel adalah platform deployment yang direkomendasikan untuk aplikasi Next.js. Vercel menyediakan hosting gratis untuk proyek personal dan tim kecil, dengan fitur automatic deployments dari Git, preview deployments untuk setiap pull request, dan edge functions untuk performa optimal. Bagian ini menjelaskan langkah-langkah deployment secara lengkap."),

        heading("5.1 Persiapan Repository", HeadingLevel.HEADING_2),
        body("Sebelum melakukan deployment, pastikan source code telah di-push ke repository Git (GitHub, GitLab, atau Bitbucket). Pastikan juga file .env tidak ikut ter-push ke repository demi keamanan. Tambahkan .env ke file .gitignore jika belum ada. Selain itu, pastikan project dapat di-build tanpa error dengan menjalankan perintah bun run build secara lokal terlebih dahulu."),

        heading("5.2 Langkah Deployment", HeadingLevel.HEADING_2),
        numberedItem("Buka https://vercel.com dan login menggunakan akun GitHub/GitLab/Bitbucket Anda.", "vercel-steps"),
        numberedItem("Klik tombol \"Add New\" > \"Project\" untuk membuat proyek baru.", "vercel-steps"),
        numberedItem("Pilih repository Git yang berisi source code sistem absensi.", "vercel-steps"),
        numberedItem("Pada halaman konfigurasi, atur Framework Preset ke \"Next.js\".", "vercel-steps"),
        numberedItem("Pada bagian Environment Variables, tambahkan semua variabel yang diperlukan sesuai Tabel di Bab 4. Minimal DATABASE_URL harus diisi.", "vercel-steps"),
        numberedItem("Klik \"Deploy\" dan tunggu proses build selesai (biasanya 2-5 menit).", "vercel-steps"),
        numberedItem("Setelah berhasil, Vercel akan memberikan URL publik untuk mengakses aplikasi.", "vercel-steps"),
        numberedItem("Lakukan testing awal dengan mengakses URL tersebut dan login menggunakan akun admin.", "vercel-steps"),

        heading("5.3 Konfigurasi Custom Domain", HeadingLevel.HEADING_2),
        body("Jika Anda memiliki domain sendiri, Anda dapat menghubungkannya ke deployment Vercel. Masuk ke dashboard proyek > Settings > Domains, lalu tambahkan domain Anda. Vercel akan memberikan instruksi DNS yang perlu dikonfigurasi di registrar domain Anda. Umumnya Anda perlu menambahkan CNAME record yang mengarah ke cname.vercel-dns.com. Setelah DNS terpropagasi (biasanya 1-24 jam), SSL certificate akan otomatis dikonfigurasi oleh Vercel."),

        heading("5.4 Catatan Penting untuk Vercel + SQLite", HeadingLevel.HEADING_2),
        warningBox("SQLite tidak cocok untuk deployment di Vercel karena filesystem bersifat ephemeral (sementara). Data akan hilang setiap kali deployment baru dilakukan. Untuk produksi di Vercel, WAJIB menggunakan PostgreSQL melalui Supabase atau layanan database eksternal lainnya. Lihat Bab 6 untuk panduan migrasi ke Supabase."),

        // ==========================================
        // BAB 6: INTEGRASI SUPABASE
        // ==========================================
        heading("6. Integrasi Supabase"),
        body("Supabase adalah platform Backend-as-a-Service yang menyediakan database PostgreSQL terkelola, autentikasi, storage, dan realtime subscriptions. Migrasi dari SQLite ke Supabase direkomendasikan untuk lingkungan produksi karena menawarkan skalabilitas, keamanan, dan reliabilitas yang jauh lebih baik. Bagian ini menjelaskan langkah-langkah integrasi secara komprehensif."),

        heading("6.1 Membuat Proyek Supabase", HeadingLevel.HEADING_2),
        numberedItem("Buka https://supabase.com dan buat akun jika belum memiliki.", "supabase-steps"),
        numberedItem("Klik \"New Project\" dan isi detail proyek (nama, password database, region).", "supabase-steps"),
        numberedItem("Pilih region yang paling dekat dengan pengguna target untuk latensi terendah.", "supabase-steps"),
        numberedItem("Tunggu hingga proyek selesai diprovisioning (biasanya 1-2 menit).", "supabase-steps"),
        numberedItem("Catat Project URL dan API keys dari Settings > API.", "supabase-steps"),

        heading("6.2 Migrasi Database ke PostgreSQL", HeadingLevel.HEADING_2),
        body("Proses migrasi dari SQLite ke PostgreSQL melibatkan beberapa langkah penting. Pertama, Anda perlu mengubah konfigurasi Prisma untuk menggunakan PostgreSQL sebagai provider. Kemudian, jalankan migrasi untuk membuat skema di database Supabase. Berikut langkah-langkah detailnya:"),
        ...codeBlock([
          "# Step 1: Ubah prisma/schema.prisma",
          "# Ganti: provider = \"sqlite\"",
          "# Dengan:  provider = \"postgresql\"",
          "",
          "# Step 2: Update DATABASE_URL di .env",
          "# DATABASE_URL=\"postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres\"",
          "",
          "# Step 3: Generate Prisma Client untuk PostgreSQL",
          "bunx prisma generate",
          "",
          "# Step 4: Buat dan jalankan migrasi",
          "bunx prisma migrate dev --name init",
          "",
          "# Step 5: Seed database",
          "bunx prisma db seed",
        ]),
        body("Perlu diperhatikan bahwa beberapa tipe data di SQLite memiliki perbedaan dengan PostgreSQL. Contohnya, String di SQLite akan dipetakan ke text di PostgreSQL, dan DateTime akan dipetakan ke timestamp(3). Prisma akan menangani konversi tipe data ini secara otomatis selama skema Prisma didefinisikan dengan benar. Pastikan untuk menguji semua fitur setelah migrasi untuk memastikan tidak ada data yang hilang atau bermasalah."),

        heading("6.3 Mengaktifkan Supabase Auth", HeadingLevel.HEADING_2),
        body("Supabase Auth menyediakan sistem autentikasi yang lengkap dengan dukungan email/password, OAuth (Google, GitHub, dll.), magic link, dan multi-factor authentication. Untuk mengintegrasikan Supabase Auth ke dalam aplikasi, Anda perlu menginstal package @supabase/supabase-js dan @supabase/auth-helpers-nextjs, kemudian membuat Supabase client di sisi klien dan server. Dokumentasi lengkap tersedia di https://supabase.com/docs/guides/auth."),

        heading("6.4 Mengaktifkan Supabase Storage", HeadingLevel.HEADING_2),
        body("Supabase Storage memungkinkan penyimpanan file (foto profil, bukti izin, dll.) tanpa perlu mengelola server file sendiri. Buat bucket storage di dashboard Supabase, atur kebijakan akses (public atau private), dan gunakan Supabase client SDK untuk upload/download file. Kebijakan Row Level Security (RLS) dapat dikonfigurasi untuk membatasi akses file berdasarkan peran pengguna."),

        // ==========================================
        // BAB 7: DEPLOYMENT DENGAN DOCKER
        // ==========================================
        heading("7. Deployment dengan Docker"),
        body("Docker memungkinkan Anda untuk memaketkan aplikasi beserta semua dependensinya ke dalam container yang konsisten dan dapat di-deploy di mana saja. Pendekatan ini sangat ideal untuk deployment ke server VPS, cloud provider, atau lingkungan on-premise. Bagian ini menjelaskan cara membuat Dockerfile dan menjalankan aplikasi menggunakan Docker."),

        heading("7.1 Dockerfile", HeadingLevel.HEADING_2),
        body("Berikut adalah Dockerfile yang direkomendasikan untuk aplikasi ini. Dockerfile menggunakan multi-stage build untuk menghasilkan image yang sekecil mungkin sambil tetap memastikan semua dependensi runtime tersedia:"),
        ...codeBlock([
          "FROM oven/bun:1 AS base",
          "WORKDIR /app",
          "",
          "# Install dependencies",
          "FROM base AS deps",
          "COPY package.json bun.lock ./",
          "RUN bun install --frozen-lockfile",
          "",
          "# Build",
          "FROM base AS builder",
          "COPY --from=deps /app/node_modules ./node_modules",
          "COPY . .",
          "RUN bunx prisma generate",
          "RUN bun run build",
          "",
          "# Production",
          "FROM base AS runner",
          "ENV NODE_ENV=production",
          "WORKDIR /app",
          "COPY --from=builder /app/.next/standalone ./",
          "COPY --from=builder /app/.next/static ./.next/static",
          "COPY --from=builder /app/public ./public",
          "COPY --from=builder /app/prisma ./prisma",
          "COPY --from=builder /app/db ./db",
          "EXPOSE 3000",
          "CMD [\"bun\", \"server.js\"]",
        ]),

        heading("7.2 Docker Compose", HeadingLevel.HEADING_2),
        body("Untuk deployment yang lebih mudah dengan database PostgreSQL, Anda dapat menggunakan Docker Compose. File docker-compose.yml berikut mendefinisikan layanan aplikasi dan database PostgreSQL:"),
        ...codeBlock([
          "version: '3.8'",
          "services:",
          "  app:",
          "    build: .",
          "    ports:",
          "      - \"3000:3000\"",
          "    environment:",
          "      - DATABASE_URL=postgresql://postgres:password@db:5432/absensi",
          "    depends_on:",
          "      - db",
          "  db:",
          "    image: postgres:16-alpine",
          "    environment:",
          "      - POSTGRES_DB=absensi",
          "      - POSTGRES_PASSWORD=password",
          "    volumes:",
          "      - pgdata:/var/lib/postgresql/data",
          "    ports:",
          "      - \"5432:5432\"",
          "volumes:",
          "  pgdata:",
        ]),
        ...codeBlock([
          "# Jalankan dengan Docker Compose",
          "docker-compose up -d",
          "",
          "# Lihat logs",
          "docker-compose logs -f app",
          "",
          "# Stop",
          "docker-compose down",
        ]),

        heading("7.3 Reverse Proxy dengan Caddy", HeadingLevel.HEADING_2),
        body("Proyek ini sudah menyertakan file Caddyfile yang dikonfigurasi untuk melakukan reverse proxy dari port 81 ke port 3000 dimana aplikasi Next.js berjalan. Caddy juga secara otomatis mengelola SSL/TLS certificate melalui Let's Encrypt. Berikut konfigurasi Caddy yang sudah tersedia:"),
        ...codeBlock([
          ":81 {",
          "    reverse_proxy localhost:3000 {",
          "        header_up Host {host}",
          "        header_up X-Forwarded-For {remote_host}",
          "        header_up X-Forwarded-Proto {scheme}",
          "        header_up X-Real-IP {remote_host}",
          "    }",
          "}",
        ]),
        body("Untuk domain produksi, ganti :81 dengan nama domain Anda (contoh: absensi.sekolah.sch.id). Caddy akan otomatis mengurus sertifikat SSL. Pastikan domain sudah mengarah ke IP server melalui DNS A record sebelum menjalankan Caddy."),

        // ==========================================
        // BAB 8: STRUKTUR PROYEK
        // ==========================================
        heading("8. Struktur Proyek"),
        body("Memahami struktur proyek sangat penting untuk pengembangan dan pemeliharaan sistem. Berikut adalah penjelasan lengkap mengenai organisasi file dan direktori dalam proyek ini:"),
        ...codeBlock([
          "sistem-absensi/",
          "\u251C\u2500\u2500 prisma/",
          "\u2502   \u251C\u2500\u2500 schema.prisma       # Skema database (19 model)",
          "\u2502   \u2514\u2500\u2500 seed.ts            # Script pengisian data awal",
          "\u251C\u2500\u2500 public/",
          "\u2502   \u251C\u2500\u2500 models/            # Model AI face-api.js",
          "\u2502   \u2514\u2500\u2500 logo.svg           # Logo aplikasi",
          "\u251C\u2500\u2500 src/",
          "\u2502   \u251C\u2500\u2500 app/",
          "\u2502   \u2502   \u251C\u2500\u2500 layout.tsx     # Root layout",
          "\u2502   \u2502   \u251C\u2500\u2500 page.tsx       # Entry point (SPA router)",
          "\u2502   \u2502   \u251C\u2500\u2500 globals.css   # Global styles",
          "\u2502   \u2502   \u2514\u2500\u2500 api/          # 20+ API routes",
          "\u2502   \u251C\u2500\u2500 components/",
          "\u2502   \u2502   \u251C\u2500\u2500 ui/           # 40+ shadcn/ui components",
          "\u2502   \u2502   \u251C\u2500\u2500 admin-*.tsx   # Halaman Admin (16 file)",
          "\u2502   \u2502   \u251C\u2500\u2500 wali-*.tsx    # Halaman Wali Kelas (5 file)",
          "\u2502   \u2502   \u251C\u2500\u2500 guru-*.tsx    # Halaman Guru BK (4 file)",
          "\u2502   \u2502   \u251C\u2500\u2500 siswa-*.tsx   # Halaman Siswa (3 file)",
          "\u2502   \u2502   \u2514\u2500\u2500 shared/*.tsx  # Komponen bersama",
          "\u2502   \u251C\u2500\u2500 hooks/             # Custom React hooks",
          "\u2502   \u2514\u2500\u2500 lib/",
          "\u2502       \u251C\u2500\u2500 store.ts       # Zustand global state",
          "\u2502       \u251C\u2500\u2500 db.ts          # Prisma client singleton",
          "\u2502       \u251C\u2500\u2500 auth.ts        # Client-side auth helpers",
          "\u2502       \u251C\u2500\u2500 api-auth.ts    # Server-side auth middleware",
          "\u2502       \u251C\u2500\u2500 face-recognition.ts  # Face API integration",
          "\u2502       \u251C\u2500\u2500 geolocation.ts # Geolocation + Haversine",
          "\u2502       \u251C\u2500\u2500 qr-code.ts     # QR code generation",
          "\u2502       \u251C\u2500\u2500 pdf-generator.ts # jsPDF reports",
          "\u2502       \u251C\u2500\u2500 logger.ts      # Activity & audit logging",
          "\u2502       \u251C\u2500\u2500 security.ts    # Rate limiting + sanitization",
          "\u2502       \u2514\u2500\u2500 utils.ts       # Utility functions",
          "\u251C\u2500\u2500 .env                    # Environment variables",
          "\u251C\u2500\u2500 next.config.ts          # Next.js configuration",
          "\u251C\u2500\u2500 package.json             # Dependencies & scripts",
          "\u251C\u2500\u2500 tailwind.config.ts       # Tailwind configuration",
          "\u251C\u2500\u2500 tsconfig.json            # TypeScript configuration",
          "\u2514\u2500\u2500 Caddyfile               # Reverse proxy config",
        ]),

        // ==========================================
        // BAB 9: SCRIPT YANG TERSEDIA
        // ==========================================
        heading("9. Script yang Tersedia"),
        body("Proyek ini menyediakan sejumlah script yang dapat dijalankan melalui Bun atau npm. Script-script ini didefinisikan dalam file package.json dan memudahkan berbagai operasi mulai dari development hingga deployment. Berikut adalah daftar lengkap script beserta penjelasannya:"),
        makeTable(
          ["Script", "Perintah", "Deskripsi"],
          [
            ["dev", "next dev -p 3000", "Menjalankan server development dengan hot-reload di port 3000"],
            ["build", "next build + copy files", "Membuat build produksi standalone yang dioptimasi"],
            ["start", "bun .next/standalone/server.js", "Menjalankan server produksi dari build standalone"],
            ["lint", "eslint .", "Memeriksa kualitas kode dengan ESLint"],
            ["db:push", "prisma db push", "Mendorong skema Prisma ke database tanpa migrasi"],
            ["db:generate", "prisma generate", "Menghasilkan Prisma Client berdasarkan skema"],
            ["db:migrate", "prisma migrate dev", "Membuat dan menjalankan migrasi database"],
            ["db:reset", "prisma migrate reset", "Reset database dan menjalankan ulang migrasi + seed"],
          ]
        ),
        tipBox("Gunakan bun run <script> untuk menjalankan script dengan Bun, atau npm run <script> untuk menjalankan dengan npm. Contoh: bun run dev atau npm run dev."),

        // ==========================================
        // BAB 10: TROUBLESHOOTING
        // ==========================================
        heading("10. Troubleshooting"),
        body("Bagian ini berisi solusi untuk masalah-masalah umum yang mungkin ditemui selama proses instalasi, konfigurasi, atau pengoperasian sistem. Jika Anda mengalami masalah yang tidak tercakup di sini, silakan periksa issue tracker di repository proyek atau buat issue baru dengan deskripsi masalah yang detail."),

        heading("10.1 Masalah Instalasi", HeadingLevel.HEADING_2),
        makeTable(
          ["Masalah", "Penyebab", "Solusi"],
          [
            ["bun install gagal/timeout", "Koneksi internet lambat atau registry tidak dapat diakses", "Coba gunakan npm install sebagai alternatif, atau set registry: bun config set registry https://registry.npmjs.org"],
            ["prisma generate error", "Prisma CLI tidak terinstal atau versi tidak kompatibel", "Jalankan: bun add -d prisma@latest, lalu bunx prisma generate"],
            ["prisma db push gagal", "File database terkunci atau path salah", "Pastikan tidak ada proses lain yang mengakses file .db. Hapus file db/custom.db lalu jalankan ulang prisma db push"],
            ["TypeScript error saat build", "Tipe data tidak sesuai atau missing dependencies", "Jalankan bun install ulang. Jika masih error, hapus node_modules dan bun.lock lalu install ulang"],
          ]
        ),

        heading("10.2 Masalah Runtime", HeadingLevel.HEADING_2),
        makeTable(
          ["Masalah", "Penyebab", "Solusi"],
          [
            ["Halaman blank/putih", "JavaScript error di browser", "Buka Developer Tools (F12) > Console untuk melihat error. Pastikan semua dependencies terinstal"],
            ["Login gagal", "Database belum di-seed atau kredensial salah", "Pastikan prisma db seed sudah dijalankan. Gunakan kredensial: admin@sekolah.id / admin123"],
            ["Face recognition tidak berfungsi", "Model AI tidak dimuat atau webcam tidak tersedia", "Pastikan folder /public/models/ berisi file model. Izinkan akses kamera di browser. Sistem akan otomatis masuk mode demo jika model tidak tersedia"],
            ["QR Code scan gagal", "Kamera tidak tersedia atau izin ditolak", "Pastikan browser mendukung getUserMedia API. Izinkan akses kamera saat diminta"],
            ["Geolocation tidak akurat", "Browser tidak mendukung atau GPS tidak tersedia", "Geolokasi membutuhkan HTTPS di production. Di localhost, browser mungkin memberikan akurasi rendah. Pastikan izin lokasi diaktifkan"],
            ["Dashboard menampilkan data random", "Fitur demo mode aktif (menggunakan Math.random)", "Pastikan database terisi data absensi yang valid. Dashboard akan menampilkan data real ketika ada record absensi di database"],
          ]
        ),

        heading("10.3 Masalah Deployment", HeadingLevel.HEADING_2),
        makeTable(
          ["Masalah", "Penyebab", "Solusi"],
          [
            ["Build gagal di Vercel", "Environment variables belum dikonfigurasi", "Tambahkan DATABASE_URL dan variabel lainnya di Vercel Project Settings > Environment Variables"],
            ["Data hilang setelah redeploy di Vercel", "SQLite filesystem bersifat ephemeral", "Wajib migrasi ke PostgreSQL/Supabase untuk deployment Vercel. Lihat Bab 6"],
            ["Prisma Client error di production", "Binary engine tidak kompatibel", "Tambahkan engineType = \"library\" di generator block prisma/schema.prisma"],
            ["CORS error saat akses API", "Konfigurasi origin tidak sesuai", "Pastikan NEXT_PUBLIC_SUPABASE_URL dan domain aplikasi dikonfigurasi dengan benar"],
            ["502 Bad Gateway", "Aplikasi belum siap atau port salah", "Pastikan server berjalan di port 3000. Cek logs: docker-compose logs app atau vercel logs"],
          ]
        ),

        heading("10.4 Reset Total", HeadingLevel.HEADING_2),
        body("Jika Anda mengalami masalah yang tidak dapat diselesaikan dan ingin memulai dari awal, Anda dapat melakukan reset total dengan langkah-langkah berikut:"),
        ...codeBlock([
          "# Hapus semua generated files dan database",
          "rm -rf node_modules .next db/custom.db bun.lock",
          "",
          "# Install ulang dependencies",
          "bun install",
          "",
          "# Setup database dari awal",
          "bunx prisma generate",
          "bunx prisma db push",
          "bunx prisma db seed",
          "",
          "# Jalankan server development",
          "bun run dev",
        ]),

        // ==========================================
        // BAB 11: KEAMANAN PRODUKSI
        // ==========================================
        heading("11. Keamanan untuk Produksi"),
        body("Sebelum menerapkan sistem ini di lingkungan produksi, ada beberapa aspek keamanan yang harus diperhatikan dan dikonfigurasi. Keamanan adalah aspek kritis yang tidak boleh diabaikan, terutama karena sistem ini menangani data pribadi siswa termasuk biometrik wajah. Berikut adalah checklist keamanan yang harus dipenuhi:"),

        heading("11.1 Checklist Keamanan", HeadingLevel.HEADING_2),
        bulletItem("Ganti semua password default (admin123) dengan password yang kuat (minimal 8 karakter, kombinasi huruf besar, kecil, angka, dan simbol)"),
        bulletItem("Migrasi dari SQLite ke PostgreSQL/Supabase untuk keandalan dan keamanan data"),
        bulletItem("Implementasikan Supabase Auth untuk menggantikan custom header-based auth yang kurang aman"),
        bulletItem("Aktifkan HTTPS di seluruh komunikasi (SSL/TLS certificate melalui Caddy, Nginx, atau Vercel)"),
        bulletItem("Enkripsi password menggunakan bcrypt atau argon2 (saat ini masih plaintext)"),
        bulletItem("Konfigurasi rate limiting untuk mencegah brute force attack pada endpoint autentikasi"),
        bulletItem("Atur CORS policy untuk membatasi origin yang dapat mengakses API"),
        bulletItem("Simpan semua secret dan API key di environment variables, jangan hardcode di source code"),
        bulletItem("Aktifkan Row Level Security (RLS) di Supabase untuk pembatasan akses data berbasis peran"),
        bulletItem("Lakukan backup database secara berkala (minimal harian untuk data absensi)"),
        bulletItem("Implementasikan CSRF protection untuk form submission"),
        bulletItem("Audit dan perbarui dependencies secara berkala untuk menutup vulnerability yang diketahui"),

        heading("11.2 Keamanan Data Biometrik", HeadingLevel.HEADING_2),
        body("Data deskriptor wajah (face descriptor) yang disimpan dalam database merupakan data biometrik yang bersifat sensitif. Meskipun data ini berupa vektor numerik 128-dimensi yang tidak dapat langsung dikonversi kembali menjadi gambar wajah, tetap diperlukan penanganan khusus. Pastikan untuk mengenkripsi data deskriptor saat penyimpanan (encryption at rest), membatasi akses hanya melalui API yang terautentikasi, serta menyediakan mekanisme penghapusan data atas permintaan pengguna sesuai regulasi perlindungan data pribadi yang berlaku."),

        // ==========================================
        // BAB 12: AKUN DEFAULT & PANDUAN LOGIN
        // ==========================================
        heading("12. Akun Default dan Panduan Login"),
        body("Setelah melakukan instalasi dan seeding database, Anda dapat langsung mengakses sistem menggunakan akun-akun default yang telah disediakan. Berikut adalah daftar lengkap akun default beserta peran dan aksesnya masing-masing. Perlu diingat bahwa akun-akun ini hanya ditujukan untuk keperluan development dan testing, bukan untuk penggunaan produksi."),

        heading("12.1 Daftar Akun Default", HeadingLevel.HEADING_2),
        makeTable(
          ["Email", "Password", "Peran", "Akses Utama"],
          [
            ["admin@sekolah.id", "admin123", "Admin", "Full access: dashboard, manajemen siswa/guru/kelas, absensi, laporan, pengaturan sistem"],
            ["budi@sekolah.id", "admin123", "Wali Kelas", "Dashboard wali kelas, data siswa per kelas, absensi kelas, laporan kelas"],
            ["siti@sekolah.id", "admin123", "Wali Kelas", "Dashboard wali kelas, data siswa per kelas, absensi kelas, laporan kelas"],
            ["dewi@sekolah.id", "admin123", "Guru BK", "Dashboard BK, data siswa, permohonan izin, laporan BK"],
            ["ahmad@sekolah.id", "admin123", "Siswa", "Dashboard siswa, riwayat absensi, pengajuan izin"],
          ]
        ),

        heading("12.2 Panduan Login Pertama", HeadingLevel.HEADING_2),
        body("Untuk login pertama kali, ikuti langkah-langkah berikut: pertama, buka browser dan akses URL aplikasi (http://localhost:3000 untuk development). Kedua, masukkan email dan password sesuai tabel di atas. Ketiga, setelah berhasil login, segera ubah password default melalui menu Profil atau Pengaturan Akun. Keempat, untuk akun admin, lanjutkan dengan mengkonfigurasi pengaturan sistem seperti jam absensi, batas terlambat, dan lokasi absensi melalui menu Settings. Kelima, daftarkan wajah siswa melalui menu Face Registration agar fitur absensi dengan pengenalan wajah dapat berfungsi optimal."),

        // ==========================================
        // BAB 13: FAQ
        // ==========================================
        heading("13. Pertanyaan yang Sering Diajukan (FAQ)"),
        body("Bagian ini berisi kompilasi pertanyaan yang sering diajukan beserta jawabannya. Jika pertanyaan Anda tidak tercantum di sini, silakan merujuk ke Bab 10 (Troubleshooting) atau buat issue di repository proyek."),

        heading("13.1 Umum", HeadingLevel.HEADING_2),
        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: "Q: Apakah aplikasi ini gratis?", bold: true, size: 24, color: c(P.accent), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        body("Ya, source code aplikasi ini bersifat open source dan dapat digunakan secara gratis. Namun, untuk deployment produksi, Anda mungkin perlu membayar layanan hosting (Vercel, Supabase, VPS) tergantung kebutuhan dan skala penggunaan. Vercel dan Supabase menyediakan tier gratis yang cukup untuk sekolah kecil hingga menengah."),

        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: "Q: Berapa jumlah siswa maksimal yang didukung?", bold: true, size: 24, color: c(P.accent), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        body("Dengan SQLite, sistem dapat menangani hingga ribuan record absensi tanpa masalah signifikan. Untuk skala lebih besar (ribuan siswa aktif), sangat direkomendasikan menggunakan PostgreSQL melalui Supabase yang dapat menangani ratusan ribu hingga jutaan record dengan performa optimal."),

        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: "Q: Apakah bisa digunakan tanpa koneksi internet?", bold: true, size: 24, color: c(P.accent), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        body("Untuk penggunaan lokal (localhost), aplikasi dapat berjalan tanpa koneksi internet. Namun, fitur face recognition membutuhkan model AI yang dimuat dari server lokal, dan fitur geolokasi membutuhkan akses GPS yang tidak bergantung pada internet. Notifikasi WhatsApp dan fitur yang bergantung pada layanan cloud (Supabase, Vercel) tentu membutuhkan koneksi internet."),

        heading("13.2 Teknis", HeadingLevel.HEADING_2),
        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: "Q: Kenapa face recognition kadang tidak akurat?", bold: true, size: 24, color: c(P.accent), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        body("Akurasi face recognition dipengaruhi oleh beberapa faktor: kualitas webcam, pencahayaan, sudut wajah, dan kualitas foto saat pendaftaran wajah. Untuk hasil terbaik, pastikan pencahayaan cukup merata, wajah menghadap langsung ke kamera, dan gunakan webcam dengan resolusi minimal 720p. Threshold kecocokan juga dapat disesuaikan di pengaturan sistem (default: 0.6, semakin kecil semakin ketat)."),

        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: "Q: Bagaimana cara memigrasikan dari SQLite ke PostgreSQL?", bold: true, size: 24, color: c(P.accent), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        body("Panduan lengkap migrasi tersedia di Bab 6. Secara singkat: ubah provider di prisma/schema.prisma dari sqlite ke postgresql, update DATABASE_URL di .env, jalankan prisma migrate dev, lalu prisma db seed. Pastikan untuk membackup data SQLite sebelum migrasi jika ada data penting yang perlu dipertahankan."),

        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: "Q: Apakah mendukung multi-bahasa?", bold: true, size: 24, color: c(P.accent), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        body("Saat ini antarmuka aplikasi tersedia dalam Bahasa Indonesia. Library next-intl sudah terinstal sebagai dependency dan siap dikonfigurasi jika diperlukan dukungan multi-bahasa di masa depan. Implementasi multi-bahasa memerlukan pembuatan file terjemahan dan konfigurasi routing locale."),

      ],
    },
  ],
});

// ============================================================
// GENERATE
// ============================================================
async function main() {
  const buffer = await Packer.toBuffer(doc);
  const outputPath = "/home/z/my-project/download/Panduan_Instalasi_Sistem_Absensi_Sekolah.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log("Document generated:", outputPath);
}

main().catch(console.error);
