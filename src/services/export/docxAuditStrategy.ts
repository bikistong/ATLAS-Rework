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

function buildCell(text: string, bold = false, shaded = false): TableCell {
  return new TableCell({
    shading: shaded ? { fill: 'F1F5F9' } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 19 })],
      }),
    ],
  });
}

export async function generateAsmUpdateDocx(params: {
  kapProfile: KapProfile;
  client: ClientEntity;
  workspace: EngagementWorkspaceData;
}): Promise<string> {
  const { kapProfile, client, workspace } = params;
  const { header, a210, a230Items, a240Rows, a250Cycles, a260, a270Rows, a280 } = workspace;

  const significantAccounts = a240Rows.filter((r) => r.isSignificantAccount);
  const highRommRows = a270Rows.filter((r) => r.overallRomm === 'High');
  const fraudActive = a230Items.some((i) => i.kodeSubIndeks === 'A230.7' && i.hasilAnalisis === 'Ya');

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
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Izin Usaha KAP: ${kapProfile.nomorIzinKap} · ${kapProfile.alamat}, ${kapProfile.kota}`,
                size: 18,
                color: '475569',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
              bottom: { color: '0F172A', space: 6, style: BorderStyle.SINGLE, size: 12 },
            },
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `Pemimpin Rekan: ${kapProfile.namaPemimpin} · Email: ${kapProfile.email}`,
                size: 18,
                color: '475569',
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'AUDIT STRATEGY MEMORANDUM (ASM UPDATE — INDEKS A280)',
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [
              new TextRun({
                text: `${client.namaKlien} · Tahun Buku ${header.tahunBuku} · Kerangka ${client.sakDigunakan}`,
                size: 20,
                color: '334155',
              }),
            ],
          }),

          // Section 1: Identitas Perikatan & Materialitas SA 320
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 160, after: 80 },
            children: [new TextRun({ text: '1. Materialitas Perencanaan (Indeks A210 — SA 320)', bold: true, size: 22 })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  buildCell('Parameter SA 320', true, true),
                  buildCell('Basis / Margin', true, true),
                  buildCell('Nilai (Rp)', true, true),
                ],
              }),
              new TableRow({
                children: [
                  buildCell('Acuan Saldo Benchmark'),
                  buildCell(a210.acuanSaldo),
                  buildCell(`Rp ${formatAuditNumber(a210.nilaiSaldoAcuan)}`),
                ],
              }),
              new TableRow({
                children: [
                  buildCell('Overall Materiality (OM)'),
                  buildCell(`${a210.marginOmPersen}% dari Acuan`),
                  buildCell(`Rp ${formatAuditNumber(a210.nilaiOm)}`),
                ],
              }),
              new TableRow({
                children: [
                  buildCell('Performance Materiality (PM)'),
                  buildCell(`${a210.marginPmPersen}% dari OM`),
                  buildCell(`Rp ${formatAuditNumber(a210.nilaiPm)}`),
                ],
              }),
              new TableRow({
                children: [
                  buildCell('Clearly Trivial / AMPT'),
                  buildCell(`${a210.marginAmptPersen}% dari PM`),
                  buildCell(`Rp ${formatAuditNumber(a210.nilaiAmpt)}`),
                ],
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 100, after: 140 },
            children: [
              new TextRun({
                text: `Pertimbangan Profesional OM: ${a210.pertimbanganOm || '-'}`,
                size: 19,
              }),
            ],
          }),

          // Section 2: Ringkasan Penilaian Risiko (A230-A260)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 140, after: 80 },
            children: [new TextRun({ text: '2. Ikhtisar Penilaian Entitas, Akun Signifikan & Pengendalian', bold: true, size: 22 })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Prosedur Analitis Awal (A220): ${workspace.a220Simpulan ?? 'Hasil analisis awal tidak terdapat risiko salah saji material'}`,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Faktor Risiko Kecurangan SA 240 (A230.7): ${fraudActive ? 'TERIDENTIFIKASI INDIKASI FRAUD RISK (RoMM Terkunci High pada akun terdampak)' : 'Tidak ditemukan indikasi risiko kecurangan material'}`,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Akun Signifikan (A240): ${significantAccounts.length} pos akun signifikan (${significantAccounts.map((a) => a.leadCode).join(', ') || '-'})`,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Evaluasi Pengendalian Internal (A250): ${a250Cycles.filter((c) => c.controlRiskLevel === 'Low').length} siklus CR Low, ${a250Cycles.filter((c) => c.controlRiskLevel === 'Moderate').length} CR Moderate, ${a250Cycles.filter((c) => c.controlRiskLevel === 'High').length} CR High.`,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: `• Komunikasi TCWG (SA 260) & SPI (SA 610): ${a260.simpulanTcwg} | SPI: ${a260.simpulanInternalAudit}.`,
                size: 19,
              }),
            ],
          }),

          // Section 3: Akun dengan RoMM High
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 140, after: 80 },
            children: [new TextRun({ text: `3. Matriks Risiko Salah Saji Material Tinggi — High RoMM (${highRommRows.length} Akun)`, bold: true, size: 22 })],
          }),
          ...(highRommRows.length > 0
            ? [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        buildCell('Lead', true, true),
                        buildCell('Nama Pos Akun', true, true),
                        buildCell('Siklus', true, true),
                        buildCell('Respon Audit Komprehensif', true, true),
                      ],
                    }),
                    ...highRommRows.slice(0, 20).map(
                      (r) =>
                        new TableRow({
                          children: [
                            buildCell(r.leadCode),
                            buildCell(r.namaAkun),
                            buildCell(r.cycleCode),
                            buildCell(r.responAuditKomprehensif),
                          ],
                        })
                    ),
                  ],
                }),
              ]
            : [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Tidak terdapat akun dengan overall RoMM High pada matriks A270 saat ini.',
                      size: 19,
                    }),
                  ],
                }),
              ]),

          // Section 4: Strategi Audit Mutakhir (A280)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
            children: [new TextRun({ text: '4. Penetapan Strategi Audit & Rencana Fase B (SA 300)', bold: true, size: 22 })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Pendekatan Audit Utama: ${a280.pendekatanAuditUtama}`,
                bold: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Target Penyelesaian Fase B (Respon Risiko): ${formatIdDate(a280.targetPenyelesaianFaseB)}`,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 80 },
            children: [
              new TextRun({
                text: `Ringkasan Area Risiko Tinggi: ${a280.ringkasanAreaRisikoTinggi || '-'}`,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60 },
            children: [
              new TextRun({
                text: `Alokasi Tim Lapangan: ${a280.alokasiTimLapangan || '-'}`,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 240 },
            children: [
              new TextRun({
                text: `${kapProfile.kota}, ${formatIdDate(new Date().toISOString().slice(0, 10))} — Disusun oleh Tim Perikatan ${kapProfile.namaKap}`,
                size: 19,
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
  const filename = `ASM_Update_${safeClient}.docx`;
  saveDocxBlob(blob, filename);
  return filename;
}
