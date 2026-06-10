import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateAttendanceReportPDF(params: {
  schoolName: string;
  reportTitle: string;
  dateRange: string;
  className?: string;
  summaryStats: { totalHadir: number; totalTidakHadir: number; totalTerlambat: number; totalIzin: number; totalSakit: number; persentaseKehadiran: number };
  students: Array<{
    nama: string;
    nis: string;
    kelas: string;
    hadir: number;
    tidakHadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    persentase: number;
  }>;
}) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.text(params.schoolName || 'Sekolah', 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text(params.reportTitle, 105, 22, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Periode: ${params.dateRange}`, 105, 28, { align: 'center' });
  if (params.className) {
    doc.text(`Kelas: ${params.className}`, 105, 33, { align: 'center' });
  }
  
  // Summary stats box
  doc.setFontSize(11);
  doc.text('Ringkasan Statistik', 14, 42);
  doc.setFontSize(9);
  doc.text(`Hadir: ${params.summaryStats.totalHadir}`, 14, 48);
  doc.text(`Tidak Hadir: ${params.summaryStats.totalTidakHadir}`, 60, 48);
  doc.text(`Terlambat: ${params.summaryStats.totalTerlambat}`, 110, 48);
  doc.text(`Izin: ${params.summaryStats.totalIzin}`, 14, 54);
  doc.text(`Sakit: ${params.summaryStats.totalSakit}`, 60, 54);
  doc.text(`Kehadiran: ${params.summaryStats.persentaseKehadiran.toFixed(1)}%`, 110, 54);
  
  // Table
  autoTable(doc, {
    startY: 60,
    head: [['No', 'Nama', 'NIS', 'Kelas', 'Hadir', 'TH', 'Terlambat', 'Izin', 'Sakit', '%']],
    body: params.students.map((s, i) => [
      i + 1,
      s.nama,
      s.nis,
      s.kelas,
      s.hadir,
      s.tidakHadir,
      s.terlambat,
      s.izin,
      s.sakit,
      s.persentase.toFixed(1) + '%'
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [5, 150, 105] }, // Emerald
    alternateRowStyles: { fillColor: [240, 253, 244] },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, doc.internal.pageSize.height - 10);
  }
  
  return doc;
}
