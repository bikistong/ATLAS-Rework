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
  UserProfile,
} from '../../types/atlas';
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

function buildKapLetterheadParagraphs(kapProfile: KapProfile): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: kapProfile.namaKap.toUpperCase(),
          bold: true,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Kantor Akuntan Publik · Izin Usaha: ${kapProfile.nomorIzinKap}`,
          size: 18,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: {
        bottom: {
          color: '0F172A',
          space: 6,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `${kapProfile.alamat}, ${kapProfile.kota} · Telp: ${kapProfile.telepon} · Email: ${kapProfile.email}`,
          size: 18,
          color: '475569',
        }),
      ],
    }),
  ];
}

export async function generateEngagementLetterDocx(params: {
  kapProfile: KapProfile;
  client: ClientEntity;
  workspace: EngagementWorkspaceData;
  totalBudgetFee: number;
}): Promise<string> {
  const { kapProfile, client, workspace, totalBudgetFee } = params;
  const { header } = workspace;

  const doc = new Document({
    sections: [
      {
        children: [
          ...buildKapLetterheadParagraphs(kapProfile),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `${kapProfile.kota}, ${formatIdDate(header.tanggalPerikatan)}`,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Nomor: ${header.nomorSuratPerikatan}`, bold: true, size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Perihal: Surat Perikatan Audit atas Laporan Keuangan Tahun Buku ${header.tahunBuku}`,
                bold: true,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Kepada Yth.', size: 21 })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Direksi dan Dewan Komisaris ${client.namaKlien}`,
                bold: true,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${client.alamat}, ${client.kota}, ${client.provinsi}`,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 },
            children: [new TextRun({ text: '1. Tujuan dan Ruang Lingkup Audit (SA 210)', bold: true, size: 22 })],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `Dengan hormat, melalui surat ini kami (${kapProfile.namaKap}) menegaskan penerimaan dan pemahaman kami atas penugasan ${header.jenisLayanan} pada ${client.namaKlien} untuk periode ${formatIdDate(header.periodeMulai)} sampai dengan ${formatIdDate(header.periodeSelesai)} yang disusun berdasarkan ${client.sakDigunakan}.`,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 },
            children: [new TextRun({ text: '2. Tanggung Jawab Auditor & Manajemen', bold: true, size: 22 })],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `Audit kami akan dilaksanakan berdasarkan ${header.standarAudit} (SPAP) yang diterbitkan oleh Institut Akuntan Publik Indonesia (IAPI). Kami menegaskan bahwa opini auditor independen ditetapkan berdasarkan bukti audit yang diperoleh dan tidak menjanjikan opini Wajar Tanpa Pengecualian (WTP) sebelum pemeriksaan selesai.`,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `Manajemen bertanggung jawab penuh atas penyusunan dan penyajian wajar laporan keuangan sesuai ${client.sakDigunakan}, pengendalian internal yang memadai, serta pemberian akses tanpa batas terhadap seluruh catatan akuntansi, dokumen pendukung, dan personel entitas.`,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 },
            children: [new TextRun({ text: '3. Imbalan Jasa Profesional & Kerahasiaan', bold: true, size: 22 })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Berdasarkan estimasi alokasi waktu perikatan (indeks A120), anggaran imbalan jasa audit ditetapkan sebesar Rp ${formatAuditNumber(totalBudgetFee)} (di luar PPN dan biaya keluar tunai bila relevan). Seluruh informasi klien dijaga kerahasiaannya kecuali diwajibkan oleh hukum atau regulator.`,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 240, after: 100 },
            children: [
              new TextRun({ text: `Hormat kami, ${kapProfile.namaKap}`, bold: true, size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { before: 420 },
            children: [
              new TextRun({
                text: `${kapProfile.namaPemimpin} — Pemimpin Rekan (${kapProfile.nomorIzinAp})`,
                bold: true,
                size: 21,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeClient = client.namaKlien.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const filename = `A130_Surat_Perikatan_${safeClient}_${header.tahunBuku}.docx`;
  saveDocxBlob(blob, filename);
  return filename;
}

export async function generateAssignmentLetterDocx(params: {
  kapProfile: KapProfile;
  client: ClientEntity;
  workspace: EngagementWorkspaceData;
  users: UserProfile[];
}): Promise<string> {
  const { kapProfile, client, workspace, users } = params;
  const { header, teamMembers, a120 } = workspace;

  const teamRows = teamMembers.map((tm, index) => {
    const user = users.find((u) => u.id === tm.userId);
    const totalJam =
      tm.rencanaJamPraperikatan + tm.rencanaJamRiskResponse + tm.rencanaJamPelaporan;
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ text: String(index + 1), alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ text: user?.namaLengkap ?? tm.userId })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ text: user?.inisial ?? '-', alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ text: tm.peranTim })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({ text: `${totalJam} Jam`, alignment: AlignmentType.RIGHT }),
          ],
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        children: [
          ...buildKapLetterheadParagraphs(kapProfile),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: 'SURAT TUGAS TIM PERIKATAN AUDIT', bold: true, size: 26 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: `Nomor: ${header.nomorSuratTugas}`, size: 21 })],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `Sehubungan dengan Surat Perikatan Nomor ${header.nomorSuratPerikatan}, ${kapProfile.namaKap} dengan ini menugaskan tim perikatan di bawah ini untuk melaksanakan audit atas laporan keuangan ${client.namaKlien} Tahun Buku ${header.tahunBuku} pada periode pelaksanaan ${formatIdDate(a120.tanggalMulai)} s.d. ${formatIdDate(a120.tanggalSelesai)} (${a120.hariEfektif} hari kerja efektif):`,
                size: 21,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'No', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Nama Personel', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Inisial', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Peran Tim', bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Alokasi Jam', bold: true })] })],
                  }),
                ],
              }),
              ...teamRows,
            ],
          }),
          new Paragraph({
            spacing: { before: 240, after: 160 },
            children: [
              new TextRun({
                text: `Seluruh personel yang ditugaskan wajib menjaga independensi, objektivitas, dan kerahasiaan sesuai Kode Etik Profesi Akuntan Publik serta SPAP (SA 220 & SPM 1).`,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 160 },
            children: [
              new TextRun({
                text: `${kapProfile.kota}, ${formatIdDate(header.tanggalPerikatan)}`,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 420 },
            children: [
              new TextRun({
                text: `${kapProfile.namaPemimpin} (${kapProfile.nomorIzinAp})`,
                bold: true,
                size: 21,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeClient = client.namaKlien.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const filename = `A140_Surat_Tugas_${safeClient}_${header.tahunBuku}.docx`;
  saveDocxBlob(blob, filename);
  return filename;
}
