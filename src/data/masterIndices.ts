import { PartGroup } from '../types/atlas';
import { MASTER_LEAD_HEADERS } from './masterLeadHeaders';

export interface MasterIndexMeta {
  kodeIndeks: string;
  namaIndeks: string;
  partGroup: PartGroup;
  parentIndeks: string | null;
  urutan: number;
  isConditional: boolean;
  saRelevan?: string;
  isReferenceOnly?: boolean;
}

export interface SidebarFolderGroup {
  partGroup: PartGroup;
  label: string;
  shortCode: string;
}

export const SIDEBAR_GROUPS: SidebarFolderGroup[] = [
  { partGroup: 'Part0', label: 'Ikhtisar Perikatan', shortCode: 'HOME' },
  { partGroup: 'Part1', label: 'Pra-Perikatan & Penerimaan', shortCode: 'A1' },
  { partGroup: 'Part2', label: 'Penilaian Risiko & Perencanaan', shortCode: 'A2' },
  { partGroup: 'Part3', label: 'Pelaksanaan & Siklus Audit', shortCode: 'B' },
  { partGroup: 'Part4', label: 'Lead Schedule Pos Akun', shortCode: 'L02-L47' },
  { partGroup: 'Part5', label: 'Penyelesaian & Pelaporan', shortCode: 'C' },
];

export const MASTER_INDICES: MasterIndexMeta[] = [
  // Part 0 - Home & Referensi
  { kodeIndeks: 'HOME', namaIndeks: 'Informasi Perikatan & Ikhtisar KKP', partGroup: 'Part0', parentIndeks: null, urutan: 0, isConditional: false, saRelevan: 'SA 220 / SA 230' },
  { kodeIndeks: 'HUB', namaIndeks: 'Engagement Hub — Gate Perikatan', partGroup: 'Part0', parentIndeks: null, urutan: 1, isConditional: false, isReferenceOnly: true },
  { kodeIndeks: 'MASTER_KAP', namaIndeks: 'Profil KAP & Personil Tim', partGroup: 'Part0', parentIndeks: null, urutan: 2, isConditional: false, isReferenceOnly: true },
  { kodeIndeks: 'AuditCycle', namaIndeks: 'Siklus Audit (Audit Cycle)', partGroup: 'Part0', parentIndeks: null, urutan: 3, isConditional: false, isReferenceOnly: true },
  { kodeIndeks: 'Daftar Lampiran', namaIndeks: 'Daftar Lampiran Indeks KKP', partGroup: 'Part0', parentIndeks: null, urutan: 4, isConditional: false, isReferenceOnly: true },
  { kodeIndeks: 'Singkatan', namaIndeks: 'Daftar Singkatan & Istilah', partGroup: 'Part0', parentIndeks: null, urutan: 5, isConditional: false, isReferenceOnly: true },
  { kodeIndeks: 'Petunjuk Isi', namaIndeks: 'Petunjuk Pengisian Singkat', partGroup: 'Part0', parentIndeks: null, urutan: 6, isConditional: false, isReferenceOnly: true },

  // Part 1 - Modul A1 Pra-Perikatan
  { kodeIndeks: 'A110', namaIndeks: 'Analisis Penerimaan & Keberlanjutan', partGroup: 'Part1', parentIndeks: null, urutan: 10, isConditional: false, saRelevan: 'SA 220, SPM 1' },
  { kodeIndeks: 'A1101', namaIndeks: 'Isu Pelaporan Keuangan Terdahulu', partGroup: 'Part1', parentIndeks: 'A110', urutan: 11, isConditional: false, saRelevan: 'SA 510' },
  { kodeIndeks: 'A1102', namaIndeks: 'Integritas Manajemen', partGroup: 'Part1', parentIndeks: 'A110', urutan: 12, isConditional: false, saRelevan: 'SA 220' },
  { kodeIndeks: 'A1102.1', namaIndeks: 'Identifikasi PMPJ / Anti Pencucian Uang', partGroup: 'Part1', parentIndeks: 'A1102', urutan: 13, isConditional: false, saRelevan: 'UU TPPU / PMPJ' },
  { kodeIndeks: 'A1103', namaIndeks: 'Kompetensi, Waktu & Independensi Tim', partGroup: 'Part1', parentIndeks: 'A110', urutan: 14, isConditional: false, saRelevan: 'SA 220, Kode Etik' },
  { kodeIndeks: 'A1105', namaIndeks: 'Komunikasi dengan Auditor Pendahulu', partGroup: 'Part1', parentIndeks: 'A110', urutan: 15, isConditional: true, saRelevan: 'SA 300, Kode Etik' },
  { kodeIndeks: 'A120', namaIndeks: 'Alokasi Jam Jasa & Perencanaan Lainnya', partGroup: 'Part1', parentIndeks: null, urutan: 16, isConditional: false, saRelevan: 'SA 220, SA 300' },
  { kodeIndeks: 'A130', namaIndeks: 'Surat Perikatan (Engagement Letter)', partGroup: 'Part1', parentIndeks: null, urutan: 17, isConditional: false, saRelevan: 'SA 210' },
  { kodeIndeks: 'A140', namaIndeks: 'Surat Tugas Tim Perikatan', partGroup: 'Part1', parentIndeks: null, urutan: 18, isConditional: false, saRelevan: 'SA 220, SPM 1' },
  { kodeIndeks: 'A150', namaIndeks: 'Pernyataan Independensi Personel', partGroup: 'Part1', parentIndeks: null, urutan: 19, isConditional: false, saRelevan: 'SA 200, Kode Etik' },
  { kodeIndeks: 'A160', namaIndeks: 'Komunikasi Tim Perikatan', partGroup: 'Part1', parentIndeks: null, urutan: 20, isConditional: false, saRelevan: 'SA 240, SA 300' },
  { kodeIndeks: 'ASM2', namaIndeks: 'Audit Strategy Memorandum (ASM Awal)', partGroup: 'Part1', parentIndeks: 'A160', urutan: 21, isConditional: false, saRelevan: 'SA 300' },
  { kodeIndeks: 'A170', namaIndeks: 'Prosedur Saldo Awal Tahun Pertama', partGroup: 'Part1', parentIndeks: null, urutan: 22, isConditional: true, saRelevan: 'SA 510' },

  // Part 2 - Modul A2 Penilaian Risiko
  { kodeIndeks: 'A210', namaIndeks: 'Materialitas Awal (OM, PM, AMPT)', partGroup: 'Part2', parentIndeks: null, urutan: 30, isConditional: false, saRelevan: 'SA 320' },
  { kodeIndeks: 'A220', namaIndeks: 'Prosedur Analitis Awal & ASM Awal', partGroup: 'Part2', parentIndeks: null, urutan: 31, isConditional: false, saRelevan: 'SA 315, SA 520' },
  { kodeIndeks: 'A230', namaIndeks: 'Pemahaman Entitas, Lingkungan & Fraud', partGroup: 'Part2', parentIndeks: null, urutan: 32, isConditional: false, saRelevan: 'SA 315, SA 240' },
  { kodeIndeks: 'A240', namaIndeks: 'Inherent Risk (Risiko Bawaan)', partGroup: 'Part2', parentIndeks: null, urutan: 33, isConditional: false, saRelevan: 'SA 315' },
  { kodeIndeks: 'A250', namaIndeks: 'Control Risk (Pengendalian Internal)', partGroup: 'Part2', parentIndeks: null, urutan: 34, isConditional: false, saRelevan: 'SA 315, SA 330' },
  { kodeIndeks: 'A260', namaIndeks: 'Komunikasi TCWG & Internal Audit (SPI)', partGroup: 'Part2', parentIndeks: null, urutan: 35, isConditional: false, saRelevan: 'SA 260, SA 610' },
  { kodeIndeks: 'A270', namaIndeks: 'Risk of Material Misstatement (RoMM)', partGroup: 'Part2', parentIndeks: null, urutan: 36, isConditional: false, saRelevan: 'SA 315, SA 330' },
  { kodeIndeks: 'A280', namaIndeks: 'Audit Strategy Memorandum (ASM Update)', partGroup: 'Part2', parentIndeks: null, urutan: 37, isConditional: false, saRelevan: 'SA 300' },

  // Part 3 - Modul B Core
  { kodeIndeks: 'B100', namaIndeks: 'WSTB, Impor TB & Jurnal AJE/RJE', partGroup: 'Part3', parentIndeks: null, urutan: 40, isConditional: false, saRelevan: 'SA 330, SA 450' },
  { kodeIndeks: 'B120', namaIndeks: 'Laporan Keuangan Audited (FS)', partGroup: 'Part3', parentIndeks: 'B100', urutan: 41, isConditional: false, saRelevan: 'SA 700' },
  { kodeIndeks: 'B210', namaIndeks: 'Estimasi Akuntansi', partGroup: 'Part3', parentIndeks: null, urutan: 42, isConditional: false, saRelevan: 'SA 540' },
  { kodeIndeks: 'B220', namaIndeks: 'Transaksi dengan Pihak Berelasi', partGroup: 'Part3', parentIndeks: null, urutan: 43, isConditional: false, saRelevan: 'SA 550' },
  { kodeIndeks: 'B230', namaIndeks: 'Peristiwa Kemudian (Subsequent Events)', partGroup: 'Part3', parentIndeks: null, urutan: 44, isConditional: false, saRelevan: 'SA 560' },
  { kodeIndeks: 'B240', namaIndeks: 'Kelangsungan Usaha (Going Concern)', partGroup: 'Part3', parentIndeks: null, urutan: 45, isConditional: false, saRelevan: 'SA 570' },
  { kodeIndeks: 'B250', namaIndeks: 'Surat Representasi Manajemen', partGroup: 'Part3', parentIndeks: null, urutan: 46, isConditional: false, saRelevan: 'SA 580' },
  { kodeIndeks: 'B260', namaIndeks: 'Penggunaan Pekerjaan Pakar Auditor', partGroup: 'Part3', parentIndeks: null, urutan: 47, isConditional: false, saRelevan: 'SA 620' },
  { kodeIndeks: 'B270', namaIndeks: 'Penggunaan Pekerjaan Pakar Manajemen', partGroup: 'Part3', parentIndeks: null, urutan: 48, isConditional: false, saRelevan: 'SA 500' },
  { kodeIndeks: 'B280', namaIndeks: 'Komitmen dan Kontinjensi', partGroup: 'Part3', parentIndeks: null, urutan: 49, isConditional: false, saRelevan: 'SA 501' },

  // Part 4 - 45 Lead Schedules (L02 - L47)
  ...MASTER_LEAD_HEADERS.map((lh, idx) => ({
    kodeIndeks: lh.leadCode,
    namaIndeks: `${lh.title}`,
    partGroup: 'Part4' as PartGroup,
    parentIndeks: null,
    urutan: 100 + idx,
    isConditional: false,
    saRelevan: 'SA 330, SA 500, SA 530',
  })),

  // Part 5 - Modul C Penyelesaian & Pelaporan
  { kodeIndeks: 'C100', namaIndeks: 'Ikhtisar Salah Saji Belum Dikoreksi (SAD)', partGroup: 'Part5', parentIndeks: null, urutan: 200, isConditional: false, saRelevan: 'SA 450' },
  { kodeIndeks: 'C110', namaIndeks: 'Penilaian Materialitas Akhir', partGroup: 'Part5', parentIndeks: null, urutan: 201, isConditional: false, saRelevan: 'SA 320, SA 450' },
  { kodeIndeks: 'C120', namaIndeks: 'Prosedur Analitis Akhir & Grafik', partGroup: 'Part5', parentIndeks: null, urutan: 202, isConditional: false, saRelevan: 'SA 520' },
  { kodeIndeks: 'C210', namaIndeks: 'Reviu Kelengkapan Format LAI', partGroup: 'Part5', parentIndeks: null, urutan: 203, isConditional: false, saRelevan: 'SA 700, SA 705' },
  { kodeIndeks: 'C220', namaIndeks: 'Checklist Pengungkapan CALK (SAK)', partGroup: 'Part5', parentIndeks: null, urutan: 204, isConditional: false, saRelevan: 'SA 700, SAK' },
  { kodeIndeks: 'C230', namaIndeks: 'Audit Final Memorandum', partGroup: 'Part5', parentIndeks: null, urutan: 205, isConditional: false, saRelevan: 'SA 220, SA 230' },
  { kodeIndeks: 'C300', namaIndeks: 'Penelaahan Mutu (EQCR)', partGroup: 'Part5', parentIndeks: null, urutan: 206, isConditional: true, saRelevan: 'SA 220, SPM 1' },
  { kodeIndeks: 'C400', namaIndeks: 'Evaluasi Bukti & Draft Opini LAI', partGroup: 'Part5', parentIndeks: null, urutan: 207, isConditional: false, saRelevan: 'SA 700, SA 705, SA 706' },
];

export const SINGKATAN_CATALOG: { kode: string; kepanjangan: string; kategori: string }[] = [
  { kode: 'A & C', kepanjangan: 'Accuracy & Cut-off', kategori: 'Asersi Audit' },
  { kode: 'C', kepanjangan: 'Completeness', kategori: 'Asersi Audit' },
  { kode: 'E', kepanjangan: 'Existence', kategori: 'Asersi Audit' },
  { kode: 'V', kepanjangan: 'Valuation', kategori: 'Asersi Audit' },
  { kode: 'P & D', kepanjangan: 'Presentation & Disclosure', kategori: 'Asersi Audit' },
  { kode: 'AP', kepanjangan: 'Analytical Procedures / Akuntan Publik', kategori: 'Metodologi' },
  { kode: 'AMPT', kepanjangan: 'Audit Misstatement Posting Threshold', kategori: 'Materialitas' },
  { kode: 'OM', kepanjangan: 'Overall Materiality (Materialitas Keseluruhan)', kategori: 'Materialitas' },
  { kode: 'PM', kepanjangan: 'Performance Materiality (Materialitas Pelaksanaan)', kategori: 'Materialitas' },
  { kode: 'CR', kepanjangan: 'Control Risk (Risiko Pengendalian)', kategori: 'Risiko' },
  { kode: 'IR', kepanjangan: 'Inherent Risk (Risiko Bawaan)', kategori: 'Risiko' },
  { kode: 'RoMM', kepanjangan: 'Risk of Material Misstatement', kategori: 'Risiko' },
  { kode: 'H / M / L', kepanjangan: 'High / Moderate / Low', kategori: 'Skala Risiko' },
  { kode: 'TOC', kepanjangan: 'Test of Control (Pengujian Pengendalian)', kategori: 'Pengujian' },
  { kode: 'TOD', kepanjangan: 'Test of Details (Pengujian Rinci)', kategori: 'Pengujian' },
  { kode: 'SAP', kepanjangan: 'Substantive Analytical Procedures / Standar Akuntansi Pemerintahan', kategori: 'Pengujian / Standar' },
  { kode: 'EBIT', kepanjangan: 'Earning Before Interest and Tax', kategori: 'Rasio Keuangan' },
  { kode: 'EBITDA', kepanjangan: 'Earning Before Interest, Tax, Depreciation, and Amortization', kategori: 'Rasio Keuangan' },
  { kode: 'EBT', kepanjangan: 'Earning Before Tax (Laba/Rugi Sebelum Pajak)', kategori: 'Rasio Keuangan' },
  { kode: 'SA', kepanjangan: 'Standar Audit (SPAP - IAPI)', kategori: 'Regulasi' },
  { kode: 'SAK', kepanjangan: 'Standar Akuntansi Keuangan (Konvergensi IFRS)', kategori: 'Regulasi' },
  { kode: 'SAK ETAP', kepanjangan: 'Standar Akuntansi Keuangan Entitas Tanpa Akuntabilitas Publik', kategori: 'Regulasi' },
  { kode: 'SOP', kepanjangan: 'Standard Operating Procedure', kategori: 'Tata Kelola' },
  { kode: 'TCWG', kepanjangan: 'Those Charged with Governance', kategori: 'Tata Kelola' },
  { kode: 'EQCR', kepanjangan: 'Engagement Quality Control Review', kategori: 'Pengendalian Mutu' },
  { kode: 'AJE / RJE', kepanjangan: 'Audit Journal Entry / Reclassification Journal Entry', kategori: 'Koreksi Audit' },
  { kode: 'WSTB', kepanjangan: 'Working Sheet Trial Balance', kategori: 'Kertas Kerja' },
  { kode: 'LAI', kepanjangan: 'Laporan Auditor Independen', kategori: 'Pelaporan' },
  { kode: 'M / TM', kepanjangan: 'Material / Tidak Material', kategori: 'Evaluasi' },
  { kode: 'S / TS', kepanjangan: 'Signifikan / Tidak Signifikan', kategori: 'Evaluasi' },
  { kode: 'I / YE', kepanjangan: 'Interim / Year End', kategori: 'Periode' },
];
