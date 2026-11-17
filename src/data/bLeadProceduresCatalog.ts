import { BLUEPRINTS, isWorksheet } from './blueprintLoader';
import { LeadScheduleInstance, SubstantiveTestItem } from '../types/atlas';

export const LEAD_AUDIT_CONCLUSIONS: LeadScheduleInstance['auditConclusion'][] = [
  'Akun tersebut telah disajikan secara wajar',
  'Akun tersebut disajikan secara wajar dengan pengecualian jurnal yang belum disesuaikan',
  'Akun tersebut tidak disajikan secara wajar',
  'Tidak dapat memberikan kesimpulan karena pembatasan lingkup pemeriksaan',
];

const LEAD_TO_HORIZONTAL_COL: Record<string, { procCol: string; asersiCol: string }> = {
  L02: { procCol: 'C', asersiCol: 'D' },
  L03: { procCol: 'C', asersiCol: 'D' },
  L05: { procCol: 'E', asersiCol: 'F' },
  L06: { procCol: 'K', asersiCol: 'L' },
  L07: { procCol: 'AO', asersiCol: 'AP' },
  L08: { procCol: 'I', asersiCol: 'J' },
  L09: { procCol: 'G', asersiCol: 'H' },
  L10: { procCol: 'G', asersiCol: 'H' },
  L11: { procCol: 'G', asersiCol: 'H' },
  L12: { procCol: 'AQ', asersiCol: 'AR' },
  L13: { procCol: 'M', asersiCol: 'N' },
  L14: { procCol: 'M', asersiCol: 'N' },
  L15: { procCol: 'O', asersiCol: 'P' },
  L16: { procCol: 'G', asersiCol: 'H' },
  L17: { procCol: 'Q', asersiCol: 'R' },
  L18: { procCol: 'U', asersiCol: 'V' },
  L19: { procCol: 'U', asersiCol: 'V' },
  L20: { procCol: 'W', asersiCol: 'X' },
  L21: { procCol: 'U', asersiCol: 'V' },
  L22: { procCol: 'S', asersiCol: 'T' },
  L23: { procCol: 'S', asersiCol: 'T' },
  L24: { procCol: 'S', asersiCol: 'T' },
  L25: { procCol: 'S', asersiCol: 'T' },
  L26: { procCol: 'U', asersiCol: 'V' },
  L27: { procCol: 'U', asersiCol: 'V' },
  L28: { procCol: 'W', asersiCol: 'X' },
  L29: { procCol: 'W', asersiCol: 'X' },
  L30: { procCol: 'W', asersiCol: 'X' },
  L32: { procCol: 'Y', asersiCol: 'Z' },
  L33: { procCol: 'Y', asersiCol: 'Z' },
  L34: { procCol: 'Y', asersiCol: 'Z' },
  L35: { procCol: 'Y', asersiCol: 'Z' },
  L36: { procCol: 'Y', asersiCol: 'Z' },
  L37: { procCol: 'AA', asersiCol: 'AB' },
  L38: { procCol: 'AA', asersiCol: 'AB' },
  L39: { procCol: 'AC', asersiCol: 'AD' },
  L40: { procCol: 'AG', asersiCol: 'AH' },
  L41: { procCol: 'AE', asersiCol: 'AF' },
  L42: { procCol: 'AG', asersiCol: 'AH' },
  L43: { procCol: 'AG', asersiCol: 'AH' },
  L44: { procCol: 'AG', asersiCol: 'AH' },
};

const SUPPLEMENTAL_PROCEDURES: Record<
  string,
  { procedureType: 'Analitis Substantif' | 'Substantif Rinci'; procedureText: string; targetAssertions: string }[]
> = {
  L31: [
    {
      procedureType: 'Analitis Substantif',
      procedureText: 'Bandingkan saldo liabilitas imbalan pasca kerja serta beban jasa kini dengan periode sebelumnya dan tingkat pergantian karyawan.',
      targetAssertions: 'C, E, V',
    },
    {
      procedureType: 'Substantif Rinci',
      procedureText: 'Peroleh laporan aktuaris independen, evaluasi kompetensi aktuaris (SA 500), serta uji kewajaran asumsi tingkat diskonto, kenaikan gaji, dan mortalitas.',
      targetAssertions: 'V, A&C',
    },
    {
      procedureType: 'Substantif Rinci',
      procedureText: 'Rekonsiliasi data demografis karyawan yang diserahkan ke aktuaris terhadap daftar gaji (payroll) resmi per tanggal neraca.',
      targetAssertions: 'C, E, A&C',
    },
    {
      procedureType: 'Substantif Rinci',
      procedureText: 'Verifikasi pemisahan pengakuan komponen laba rugi (biaya jasa & bunga neto) dengan penghasilan komprehensif lain (pengukuran kembali aktuaria) serta kecukupan pengungkapan CALK.',
      targetAssertions: 'P&D',
    },
  ],
  L45: [
    {
      procedureType: 'Analitis Substantif',
      procedureText: 'Bandingkan pendapatan bunga, keuntungan selisih kurs, dan pendapatan non-operasional lainnya dengan periode sebelumnya serta ekspektasi saldo kas/deposito.',
      targetAssertions: 'C, E, A&C',
    },
    {
      procedureType: 'Substantif Rinci',
      procedureText: 'Lakukan vouching atas transaksi pendapatan lain-lain yang material ke rekening koran, nota kredit, dan dokumen kontrak terkait serta uji pisah batas akhir tahun.',
      targetAssertions: 'E, A&C, V',
    },
    {
      procedureType: 'Substantif Rinci',
      procedureText: 'Lakukan perhitungan ulang laba/rugi pelepasan aset tetap atau selisih kurs mata uang asing dan periksa penyajian net/gross di Laporan Laba Rugi.',
      targetAssertions: 'V, P&D',
    },
  ],
  L46: [
    {
      procedureType: 'Analitis Substantif',
      procedureText: 'Bandingkan total beban bunga dan administrasi bank periode berjalan terhadap rata-rata saldo pinjaman dan suku bunga efektif perjanjian kredit.',
      targetAssertions: 'C, E, V',
    },
    {
      procedureType: 'Substantif Rinci',
      procedureText: 'Rekalkulasi akrual bunga pinjaman per akhir periode (utang bunga / accrued interest) berdasarkan jadwal angsuran bank dan dokumen perjanjian kredit.',
      targetAssertions: 'C, A&C, V',
    },
    {
      procedureType: 'Substantif Rinci',
      procedureText: 'Vouching mutasi beban bunga dan provisi/administrasi bank ke bukti debit rekening koran bank serta periksa ketepatan klasifikasi di laporan laba rugi dan arus kas.',
      targetAssertions: 'E, P&D',
    },
  ],
  L47: [
    {
      procedureType: 'Analitis Substantif',
      procedureText: 'Bandingkan tarif pajak efektif (Effective Tax Rate) terhadap tarif pajak penghasilan badan statutori dan analisis penyebab koreksi fiskal material.',
      targetAssertions: 'C, V',
    },
    {
      procedureType: 'Substantif Rinci',
      procedureText: 'Periksa rekonsiliasi fiskal komersial ke laba kena pajak (SPT Tahunan PPh Badan), verifikasi koreksi beda tetap & beda waktu serta perhitungan aset/liabilitas pajak tangguhan.',
      targetAssertions: 'A&C, V, P&D',
    },
    {
      procedureType: 'Substantif Rinci',
      procedureText: 'Lakukan vouching pembayaran angsuran PPh 25, kredit pajak PPh 22/23, dan Surat Setoran Pajak (SSP/NTPN) serta periksa surat ketetapan pajak bila ada.',
      targetAssertions: 'E, A&C',
    },
  ],
};

function normalizeAssertions(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return 'C, E, V';
  if (cleaned === 'CEA' || cleaned === 'C E A') return 'C, E, A&C';
  if (cleaned === 'CEV' || cleaned === 'C E V') return 'C, E, V';
  if (cleaned === 'CEAV' || cleaned === 'C E A V') return 'C, E, A&C, V';
  return cleaned;
}

export function getSeededProceduresForLead(
  leadCode: string,
  title: string
): SubstantiveTestItem[] {
  const mapping = LEAD_TO_HORIZONTAL_COL[leadCode];
  const phSheet = BLUEPRINTS.part3?.['prosedur horizontal'];

  if (mapping && isWorksheet(phSheet)) {
    const items: SubstantiveTestItem[] = [];
    let currentType: 'Analitis Substantif' | 'Substantif Rinci' = 'Analitis Substantif';
    let seq = 1;

    for (const row of phSheet.non_empty_rows) {
      if (row.row < 9) continue;
      const procCell = row.cells.find((c) => c.cell === `${mapping.procCol}${row.row}`);
      const asersiCell = row.cells.find((c) => c.cell === `${mapping.asersiCol}${row.row}`);
      const rawText = procCell?.value?.replace(/\u00a0/g, ' ').trim() ?? '';
      if (!rawText || rawText === 'X') continue;

      const upper = rawText.toUpperCase();
      if (upper.includes('PROSEDUR ANALITIS')) {
        currentType = 'Analitis Substantif';
        continue;
      }
      if (upper.includes('PROSEDUR SUBTANTIF') || upper.includes('PROSEDUR SUBSTANTIF')) {
        currentType = 'Substantif Rinci';
        continue;
      }

      items.push({
        id: `${leadCode}-proc-${seq}`,
        procedureNumber: seq,
        procedureType: currentType,
        procedureText: rawText,
        targetAssertions: normalizeAssertions(asersiCell?.value ?? 'C, E, V'),
        executionStatus: 'Belum Dilaksanakan',
        workpaperReference: leadCode,
        auditConclusion: '',
      });
      seq += 1;
    }

    if (items.length > 0) {
      return items;
    }
  }

  const supplemental = SUPPLEMENTAL_PROCEDURES[leadCode];
  if (supplemental && supplemental.length > 0) {
    return supplemental.map((s, idx) => ({
      id: `${leadCode}-proc-${idx + 1}`,
      procedureNumber: idx + 1,
      procedureType: s.procedureType,
      procedureText: s.procedureText,
      targetAssertions: s.targetAssertions,
      executionStatus: 'Belum Dilaksanakan',
      workpaperReference: leadCode,
      auditConclusion: '',
    }));
  }

  return [
    {
      id: `${leadCode}-proc-1`,
      procedureNumber: 1,
      procedureType: 'Analitis Substantif',
      procedureText: `Bandingkan saldo ${title} periode berjalan dengan periode komparatif dan telaah fluktuasi signifikan terhadap ekspektasi bisnis entitas.`,
      targetAssertions: 'C, E, V',
      executionStatus: 'Belum Dilaksanakan',
      workpaperReference: leadCode,
      auditConclusion: '',
    },
    {
      id: `${leadCode}-proc-2`,
      procedureNumber: 2,
      procedureType: 'Substantif Rinci',
      procedureText: `Rekonsiliasi rincian sub-ledger atau daftar rincian ${title} dengan saldo buku besar (General Ledger) pada WSTB per tanggal pelaporan.`,
      targetAssertions: 'C, A&C, V',
      executionStatus: 'Belum Dilaksanakan',
      workpaperReference: leadCode,
      auditConclusion: '',
    },
    {
      id: `${leadCode}-proc-3`,
      procedureNumber: 3,
      procedureType: 'Substantif Rinci',
      procedureText: `Lakukan pengujian rinci (vouching/tracing/konfirmasi eksternal) atas sampel transaksi dan saldo akhir ${title} ke dokumen sumber independen.`,
      targetAssertions: 'E, A&C, V',
      executionStatus: 'Belum Dilaksanakan',
      workpaperReference: leadCode,
      auditConclusion: '',
    },
    {
      id: `${leadCode}-proc-4`,
      procedureNumber: 4,
      procedureType: 'Substantif Rinci',
      procedureText: `Evaluasi ketepatan klasifikasi, pisah batas (cut-off), serta kecukupan pengungkapan pos ${title} pada Catatan atas Laporan Keuangan sesuai SAK.`,
      targetAssertions: 'A&C, P&D',
      executionStatus: 'Belum Dilaksanakan',
      workpaperReference: leadCode,
      auditConclusion: '',
    },
  ];
}
