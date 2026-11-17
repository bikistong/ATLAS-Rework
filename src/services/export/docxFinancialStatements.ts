import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import FileSaver from 'file-saver';
import {
  ClientEntity,
  EngagementWorkspaceData,
  KapProfile,
} from '../../types/atlas';
import { computeFinancialStatements } from '../../utils/bCoreFormulas';
import { formatAuditNumber, formatIdDate } from '../../utils/formatters';

function saveDocxBlob(blob: Blob, filename: string): void {
  const saveFn =
    typeof FileSaver === 'function'
      ? FileSaver
      : (FileSaver as unknown as { saveAs?: (data: Blob, name: string) => void }).saveAs;
  if (saveFn) {
    saveFn(blob, filename);
  }
}

function makeCell(
  text: string,
  options: { bold?: boolean; shaded?: boolean; align?: 'left' | 'right' } = {}
): TableCell {
  return new TableCell({
    shading: options.shaded ? { fill: 'F1F5F9' } : undefined,
    children: [
      new Paragraph({
        alignment: options.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: Boolean(options.bold),
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function makeStatementRow(
  label: string,
  curr: number,
  prior: number,
  bold = false,
  shaded = false
): TableRow {
  return new TableRow({
    children: [
      makeCell(label, { bold, shaded }),
      makeCell(formatAuditNumber(curr), { bold, shaded, align: 'right' }),
      makeCell(formatAuditNumber(prior), { bold, shaded, align: 'right' }),
    ],
  });
}

export async function generateFinancialStatementsDocx(params: {
  kapProfile: KapProfile;
  client: ClientEntity;
  workspace: EngagementWorkspaceData;
}): Promise<string> {
  const { kapProfile, client, workspace } = params;
  const fs = computeFinancialStatements(workspace.trialBalance, workspace.journals);
  const currYear = workspace.header.tahunBuku;
  const priorYear = currYear - 1;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: kapProfile.namaKap.toUpperCase(),
                bold: true,
                size: 26,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
              bottom: { color: '0F172A', space: 6, style: BorderStyle.SINGLE, size: 12 },
            },
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${kapProfile.alamat}, ${kapProfile.kota} · Izin KAP: ${kapProfile.nomorIzinKap}`,
                size: 17,
                color: '475569',
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: client.namaKlien.toUpperCase(),
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `LAPORAN KEUANGAN AUDITED (INDEKS B120) · TAHUN BUKU ${currYear} & ${priorYear} · ${client.sakDigunakan} (Disajikan dalam Rupiah)`,
                size: 18,
                color: '334155',
              }),
            ],
          }),

          // 1. Laporan Posisi Keuangan (Neraca)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 140, after: 80 },
            children: [new TextRun({ text: `1. Laporan Posisi Keuangan (Per 31 Desember ${currYear} & ${priorYear})`, bold: true, size: 21 })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Pos Laporan Posisi Keuangan', { bold: true, shaded: true }),
                  makeCell(`Audited ${currYear} (Rp)`, { bold: true, shaded: true, align: 'right' }),
                  makeCell(`Audited ${priorYear} (Rp)`, { bold: true, shaded: true, align: 'right' }),
                ],
              }),
              ...fs.neraca.asetLancarLines.map((l) => makeStatementRow(l.label, l.current, l.prior)),
              makeStatementRow('Jumlah Aset Lancar', fs.neraca.totalAsetLancar, fs.neraca.priorTotalAsetLancar, true, true),
              ...fs.neraca.asetTidakLancarLines.map((l) => makeStatementRow(l.label, l.current, l.prior)),
              makeStatementRow('Jumlah Aset Tidak Lancar', fs.neraca.totalAsetTidakLancar, fs.neraca.priorTotalAsetTidakLancar, true, true),
              makeStatementRow('TOTAL ASET', fs.neraca.totalAset, fs.neraca.priorTotalAset, true, true),
              ...fs.neraca.liabilitasPendekLines.map((l) => makeStatementRow(l.label, l.current, l.prior)),
              makeStatementRow('Jumlah Liabilitas Jangka Pendek', fs.neraca.totalLiabilitasPendek, fs.neraca.priorTotalLiabilitasPendek, true, true),
              ...fs.neraca.liabilitasPanjangLines.map((l) => makeStatementRow(l.label, l.current, l.prior)),
              makeStatementRow('Jumlah Liabilitas Jangka Panjang', fs.neraca.totalLiabilitasPanjang, fs.neraca.priorTotalLiabilitasPanjang, true, true),
              makeStatementRow('Jumlah Liabilitas', fs.neraca.totalLiabilitas, fs.neraca.priorTotalLiabilitas, true, true),
              ...fs.neraca.ekuitasLines.map((l) => makeStatementRow(l.label, l.current, l.prior)),
              makeStatementRow('Jumlah Ekuitas', fs.neraca.totalEkuitas, fs.neraca.priorTotalEkuitas, true, true),
              makeStatementRow('TOTAL LIABILITAS DAN EKUITAS', fs.neraca.totalLiabilitasDanEkuitas, fs.neraca.priorTotalLiabilitasDanEkuitas, true, true),
            ],
          }),

          // 2. Laporan Laba Rugi & OCI
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 220, after: 80 },
            children: [new TextRun({ text: `2. Laporan Laba Rugi & Penghasilan Komprehensif Lain`, bold: true, size: 21 })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Pos Laba Rugi', { bold: true, shaded: true }),
                  makeCell(`Audited ${currYear} (Rp)`, { bold: true, shaded: true, align: 'right' }),
                  makeCell(`Audited ${priorYear} (Rp)`, { bold: true, shaded: true, align: 'right' }),
                ],
              }),
              makeStatementRow('Pendapatan Usaha Bersih', fs.labaRugi.pendapatanBersih, fs.labaRugi.priorPendapatanBersih, true),
              makeStatementRow('Beban Pokok Penjualan', -fs.labaRugi.totalHpp, -fs.labaRugi.priorTotalHpp),
              makeStatementRow('Laba Bruto', fs.labaRugi.labaBruto, fs.labaRugi.priorLabaBruto, true, true),
              makeStatementRow('Beban Operasional', -fs.labaRugi.totalBebanOperasional, -fs.labaRugi.priorTotalBebanOperasional),
              makeStatementRow('Laba Usaha', fs.labaRugi.labaUsaha, fs.labaRugi.priorLabaUsaha, true, true),
              makeStatementRow('Pendapatan (Beban) Non-Operasional Bersih', fs.labaRugi.pendapatanBebanLainBersih, fs.labaRugi.priorPendapatanBebanLainBersih),
              makeStatementRow('Laba Sebelum Pajak Penghasilan', fs.labaRugi.labaSebelumPajak, fs.labaRugi.priorLabaSebelumPajak, true),
              makeStatementRow('Beban Pajak Penghasilan', -fs.labaRugi.bebanPajak, -fs.labaRugi.priorBebanPajak),
              makeStatementRow('LABA BERSIH TAHUN BERJALAN', fs.labaRugi.labaBersih, fs.labaRugi.priorLabaBersih, true, true),
              makeStatementRow('Penghasilan Komprehensif Lain (OCI)', fs.labaRugi.ociTahunBerjalan, fs.labaRugi.priorOciTahunBerjalan),
              makeStatementRow('TOTAL PENGHASILAN KOMPREHENSIF', fs.labaRugi.totalPenghasilanKomprehensif, fs.labaRugi.priorTotalPenghasilanKomprehensif, true, true),
            ],
          }),

          // 3. Laporan Perubahan Ekuitas
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 220, after: 80 },
            children: [new TextRun({ text: '3. Laporan Perubahan Ekuitas', bold: true, size: 21 })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Komponen Ekuitas', { bold: true, shaded: true }),
                  makeCell('Nilai (Rp)', { bold: true, shaded: true, align: 'right' }),
                ],
              }),
              new TableRow({ children: [makeCell('Modal Saham & Agio Awal Periode'), makeCell(formatAuditNumber(fs.perubahanEkuitas.modalAwal), { align: 'right' })] }),
              new TableRow({ children: [makeCell('Penambahan (Pengurangan) Modal Disetor'), makeCell(formatAuditNumber(fs.perubahanEkuitas.penambahanModal), { align: 'right' })] }),
              new TableRow({ children: [makeCell('Saldo Laba Awal Periode'), makeCell(formatAuditNumber(fs.perubahanEkuitas.saldoLabaAwal), { align: 'right' })] }),
              new TableRow({ children: [makeCell('Laba Bersih Tahun Berjalan'), makeCell(formatAuditNumber(fs.perubahanEkuitas.labaBersihBerjalan), { align: 'right' })] }),
              new TableRow({ children: [makeCell('Dividen / Penyesuaian Saldo Laba'), makeCell(formatAuditNumber(fs.perubahanEkuitas.dividenAtauPenyesuaian), { align: 'right' })] }),
              new TableRow({ children: [makeCell('Penghasilan Komprehensif Lain (OCI)'), makeCell(formatAuditNumber(fs.perubahanEkuitas.ociAkhir), { align: 'right' })] }),
              new TableRow({ children: [makeCell('TOTAL EKUITAS AKHIR PERIODE', { bold: true, shaded: true }), makeCell(formatAuditNumber(fs.perubahanEkuitas.totalEkuitasAkhir), { bold: true, shaded: true, align: 'right' })] }),
            ],
          }),

          // 4. Laporan Arus Kas (Metode Tidak Langsung)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 220, after: 80 },
            children: [new TextRun({ text: '4. Laporan Arus Kas (Metode Tidak Langsung)', bold: true, size: 21 })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Aktivitas Arus Kas', { bold: true, shaded: true }),
                  makeCell(`Tahun Buku ${currYear} (Rp)`, { bold: true, shaded: true, align: 'right' }),
                ],
              }),
              new TableRow({ children: [makeCell('Laba Bersih Tahun Berjalan'), makeCell(formatAuditNumber(fs.arusKas.labaBersih), { align: 'right' })] }),
              new TableRow({ children: [makeCell('Penyesuaian Penyusutan & Amortisasi'), makeCell(formatAuditNumber(fs.arusKas.penyesuaianPenyusutan), { align: 'right' })] }),
              new TableRow({ children: [makeCell('Perubahan Piutang & Persediaan & Modal Kerja'), makeCell(formatAuditNumber(fs.arusKas.perubahanPiutang + fs.arusKas.perubahanPersediaan + fs.arusKas.perubahanAsetLancarLain + fs.arusKas.perubahanLiabilitasOperasi), { align: 'right' })] }),
              new TableRow({ children: [makeCell('Arus Kas Bersih dari Aktivitas Operasi', { bold: true, shaded: true }), makeCell(formatAuditNumber(fs.arusKas.arusKasOperasi), { bold: true, shaded: true, align: 'right' })] }),
              new TableRow({ children: [makeCell('Arus Kas Bersih dari Aktivitas Investasi', { bold: true }), makeCell(formatAuditNumber(fs.arusKas.arusKasInvestasi), { bold: true, align: 'right' })] }),
              new TableRow({ children: [makeCell('Arus Kas Bersih dari Aktivitas Pendanaan', { bold: true }), makeCell(formatAuditNumber(fs.arusKas.arusKasPendanaan), { bold: true, align: 'right' })] }),
              new TableRow({ children: [makeCell('Kenaikan (Penurunan) Bersih Kas & Setara Kas', { bold: true, shaded: true }), makeCell(formatAuditNumber(fs.arusKas.kenaikanBersihKas), { bold: true, shaded: true, align: 'right' })] }),
              new TableRow({ children: [makeCell('Kas & Setara Kas Awal Tahun'), makeCell(formatAuditNumber(fs.arusKas.kasAwal), { align: 'right' })] }),
              new TableRow({ children: [makeCell('KAS & SETARA KAS AKHIR TAHUN', { bold: true, shaded: true }), makeCell(formatAuditNumber(fs.arusKas.kasAkhirNeraca), { bold: true, shaded: true, align: 'right' })] }),
            ],
          }),

          new Paragraph({
            spacing: { before: 220 },
            children: [
              new TextRun({
                text: `Status Validasi Neraca: ${fs.neraca.isNeracaBalanced ? 'NERACA BALANCED' : `TIDAK SEIMBANG (Selisih Rp ${formatAuditNumber(fs.neraca.selisihNeraca)})`} · Dicetak pada ${formatIdDate(new Date().toISOString().slice(0, 10))} oleh ${kapProfile.namaKap}.`,
                size: 17,
                italics: true,
                color: '475569',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeClient = client.namaKlien.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const filename = `LK_Audited_${safeClient}_${currYear}.docx`;
  saveDocxBlob(blob, filename);
  return filename;
}
