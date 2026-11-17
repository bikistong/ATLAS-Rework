import {
  A210Materiality,
  A230EntityRiskItem,
  A240InherentRiskRow,
  A250ControlCycle,
  A250ControlTestItem,
  A270RommRow,
  AuditAssertion,
  AuditJournalEntry,
  EngagementWorkspaceData,
  MaterialityBenchmark,
  RiskLevel,
  TrialBalanceAccount,
} from '../types/atlas';
import { MATERIALITY_BENCHMARKS } from '../data/a2Catalog';
import { computeOverallRomm } from './formatters';

export const AUDIT_ASSERTIONS: AuditAssertion[] = ['C', 'E', 'A&C', 'V', 'P&D'];

// ============================================================================
// 1. HELPER SALDO WSTB / FS DINAMIS (ATURAN ANTI-BUG #3)
// ============================================================================

export interface NetAccountBalances {
  saldoBerjalan: number;
  saldoLalu: number;
}

/**
 * Menghitung saldo berjalan (Unaudited + Jurnal AJE/RJE Accepted) dan saldo pembanding
 * untuk setiap baris Trial Balance agar A210 & A220 selalu sinkron dengan FS/WSTB klien aktif.
 */
export function computeTrialBalanceNetBalances(
  account: TrialBalanceAccount,
  acceptedJournals: AuditJournalEntry[] = []
): NetAccountBalances {
  const adjDelta = acceptedJournals
    .filter((j) => j.statusPersetujuan === 'Accepted')
    .reduce((sum, j) => {
      const lineSum = j.lines
        .filter((l) => l.accountId === account.id || l.kodeAkun === account.kodeAkun)
        .reduce((ls, l) => {
          if (account.posisiNormal === 'Debit') {
            return ls + (l.posisi === 'Debit' ? l.nilai : -l.nilai);
          }
          return ls + (l.posisi === 'Kredit' ? l.nilai : -l.nilai);
        }, 0);
      return sum + lineSum;
    }, 0);

  const rawCurrent =
    account.posisiNormal === 'Debit'
      ? account.unauditedDebit - account.unauditedCredit
      : account.unauditedCredit - account.unauditedDebit;

  const rawPrior =
    account.posisiNormal === 'Debit'
      ? account.pembandingDebit - account.pembandingCredit
      : account.pembandingCredit - account.pembandingDebit;

  return {
    saldoBerjalan: rawCurrent + adjDelta,
    saldoLalu: rawPrior,
  };
}

/**
 * Menghitung agregasi Laporan Keuangan dari Trial Balance & Jurnal Accepted.
 * Dipakai oleh A210 (8 opsi benchmark) dan A220.2 (13 rasio keuangan).
 */
export interface FinancialStatementAggregates {
  totalAset: number;
  asetLancar: number;
  asetTidakLancar: number;
  kasSetaraKas: number;
  piutangUsaha: number;
  persediaan: number;
  totalLiabilitas: number;
  liabilitasJangkaPendek: number;
  liabilitasJangkaPanjang: number;
  utangUsaha: number;
  totalEkuitas: number;
  asetBersih: number;
  pendapatan: number;
  hpp: number;
  labaBruto: number;
  bebanOperasional: number;
  bebanBunga: number;
  bebanPenyusutan: number;
  bebanPajak: number;
  pendapatanLain: number;
  bebanLain: number;
  ebit: number;
  ebitda: number;
  labaSebelumPajak: number;
  labaBersih: number;
}

function signAdjustedGroupValue(
  tb: TrialBalanceAccount,
  net: number
): number {
  const isDebitGroup = tb.groupAkun === 'ASET' || tb.groupAkun === 'BEBAN';
  if (isDebitGroup) {
    return tb.posisiNormal === 'Debit' ? net : -net;
  }
  return tb.posisiNormal === 'Kredit' ? net : -net;
}

export function computeFinancialAggregates(
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[] = [],
  period: 'current' | 'prior' = 'current'
): FinancialStatementAggregates {
  let asetLancar = 0;
  let asetTidakLancar = 0;
  let kasSetaraKas = 0;
  let piutangUsaha = 0;
  let persediaan = 0;
  let liabilitasJangkaPendek = 0;
  let liabilitasJangkaPanjang = 0;
  let utangUsaha = 0;
  let totalEkuitas = 0;
  let pendapatan = 0;
  let hpp = 0;
  let bebanOperasional = 0;
  let bebanBunga = 0;
  let bebanPenyusutan = 0;
  let bebanPajak = 0;
  let pendapatanLain = 0;
  let bebanLain = 0;

  for (const tb of trialBalance) {
    const nets = computeTrialBalanceNetBalances(tb, period === 'current' ? journals : []);
    const val = period === 'current' ? nets.saldoBerjalan : nets.saldoLalu;
    const grpVal = signAdjustedGroupValue(tb, val);

    if (tb.groupAkun === 'ASET') {
      const kLower = tb.kelompokAkun.toLowerCase();
      if (kLower.includes('tidak lancar') || ['L12', 'L13', 'L14', 'L15', 'L16'].includes(tb.leadCode)) {
        asetTidakLancar += grpVal;
      } else {
        asetLancar += grpVal;
      }
      if (tb.leadCode === 'L02' || tb.leadCode === 'L03' || tb.headerAkun.toLowerCase().includes('kas')) {
        kasSetaraKas += grpVal;
      }
      if (tb.leadCode === 'L05' || tb.headerAkun.toLowerCase().includes('piutang')) {
        piutangUsaha += grpVal;
      }
      if (tb.leadCode === 'L06' || tb.headerAkun.toLowerCase().includes('persediaan')) {
        persediaan += grpVal;
      }
    } else if (tb.groupAkun === 'LIABILITAS') {
      const kLower = tb.kelompokAkun.toLowerCase();
      if (kLower.includes('panjang') || ['L28', 'L29', 'L30', 'L31'].includes(tb.leadCode)) {
        liabilitasJangkaPanjang += grpVal;
      } else {
        liabilitasJangkaPendek += grpVal;
      }
      if (tb.leadCode === 'L17' || tb.headerAkun.toLowerCase().includes('utang usaha') || tb.headerAkun.toLowerCase().includes('hutang dagang')) {
        utangUsaha += grpVal;
      }
    } else if (tb.groupAkun === 'EKUITAS_ASET_BERSIH') {
      totalEkuitas += grpVal;
    } else if (tb.groupAkun === 'PENDAPATAN') {
      if (tb.leadCode === 'L45' || tb.kelompokAkun.toLowerCase().includes('non-operasional')) {
        pendapatanLain += grpVal;
      } else {
        pendapatan += grpVal;
      }
    } else if (tb.groupAkun === 'BEBAN') {
      if (tb.leadCode === 'L39' || tb.kelompokAkun.toLowerCase().includes('pokok')) {
        hpp += grpVal;
      } else if (tb.leadCode === 'L46' || tb.headerAkun.toLowerCase().includes('bunga') || tb.namaAkun.toLowerCase().includes('bunga')) {
        bebanBunga += grpVal;
      } else if (tb.leadCode === 'L47' || tb.namaAkun.toLowerCase().includes('pajak penghasilan')) {
        bebanPajak += grpVal;
      } else if (tb.kelompokAkun.toLowerCase().includes('non-operasional')) {
        bebanLain += grpVal;
      } else {
        bebanOperasional += grpVal;
        if (tb.leadCode === 'L43' || tb.namaAkun.toLowerCase().includes('penyusutan')) {
          bebanPenyusutan += grpVal;
        }
      }
    }
  }

  const totalAset = asetLancar + asetTidakLancar;
  const totalLiabilitas = liabilitasJangkaPendek + liabilitasJangkaPanjang;
  const asetBersih = totalAset - totalLiabilitas;
  const labaBruto = pendapatan - hpp;
  const ebit = labaBruto - bebanOperasional + pendapatanLain - bebanLain;
  const ebitda = ebit + bebanPenyusutan;
  const labaSebelumPajak = ebit - bebanBunga;
  const labaBersih = labaSebelumPajak - bebanPajak;

  return {
    totalAset,
    asetLancar,
    asetTidakLancar,
    kasSetaraKas,
    piutangUsaha,
    persediaan,
    totalLiabilitas,
    liabilitasJangkaPendek,
    liabilitasJangkaPanjang,
    utangUsaha,
    totalEkuitas,
    asetBersih,
    pendapatan,
    hpp,
    labaBruto,
    bebanOperasional,
    bebanBunga,
    bebanPenyusutan,
    bebanPajak,
    pendapatanLain,
    bebanLain,
    ebit,
    ebitda,
    labaSebelumPajak,
    labaBersih,
  };
}

/**
 * ATURAN ANTI-BUG #3: Tarik nilaiSaldoAcuan secara dinamis dari agregasi FS/WSTB klien aktif.
 */
export function computeBenchmarkValueFromTrialBalance(
  trialBalance: TrialBalanceAccount[],
  benchmark: MaterialityBenchmark,
  journals: AuditJournalEntry[] = [],
  customBenchmarkValue = 0
): number {
  const agg = computeFinancialAggregates(trialBalance, journals, 'current');
  switch (benchmark) {
    case 'Total Aset':
      return Math.abs(agg.totalAset);
    case 'Aset bersih':
      return Math.abs(agg.asetBersih !== 0 ? agg.asetBersih : agg.totalEkuitas);
    case 'Jumlah Pendapatan':
      return Math.abs(agg.pendapatan);
    case 'Jumlah HPP':
      return Math.abs(agg.hpp);
    case 'Laba sebelum pajak':
      return Math.abs(agg.labaSebelumPajak);
    case 'Laba sebelum bunga, pajak, penyusutan, dan amortisasi':
      return Math.abs(agg.ebitda);
    case 'Total Liabilitas':
      return Math.abs(agg.totalLiabilitas);
    case 'Lainnya (seperti acuan dari auditor induk)':
      return Math.max(0, Number.isFinite(customBenchmarkValue) ? customBenchmarkValue : 0);
    default:
      return Math.abs(agg.totalAset);
  }
}

// ============================================================================
// 2. A210 — KALKULATOR & VALIDATOR MATERIALITAS SA 320
// ============================================================================

export interface A210ValidationResult {
  valid: boolean;
  amptError: string | null;
  pmOutOfRange: boolean;
  pmNeedsJustification: boolean;
  omOutOfNormalRange: boolean;
  omRangeLabel: string;
}

export function validateA210Materiality(a210: A210Materiality): A210ValidationResult {
  const spec = MATERIALITY_BENCHMARKS.find((b) => b.benchmark === a210.acuanSaldo);
  const minOm = spec?.normalMinPct ?? 0.5;
  const maxOm = spec?.normalMaxPct ?? 5.0;

  const amptError =
    a210.marginAmptPersen > 5 || a210.marginAmptPersen < 0
      ? 'Validasi Keras SA 320: Persentase AMPT harus berada antara 0% hingga maksimal 5% dari Performance Materiality.'
      : null;

  const pmOutOfRange = a210.marginPmPersen < 50 || a210.marginPmPersen > 80;
  const pmNeedsJustification = pmOutOfRange && a210.pertimbanganPm.trim().length < 100;
  const omOutOfNormalRange = a210.marginOmPersen < minOm || a210.marginOmPersen > maxOm;

  return {
    valid: !amptError && !pmNeedsJustification && a210.nilaiOm > 0,
    amptError,
    pmOutOfRange,
    pmNeedsJustification,
    omOutOfNormalRange,
    omRangeLabel: `${minOm}%–${maxOm}%`,
  };
}

export function recalculateA210FromState(
  current: A210Materiality,
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[] = []
): A210Materiality {
  const nilaiSaldoAcuan = computeBenchmarkValueFromTrialBalance(
    trialBalance,
    current.acuanSaldo,
    journals,
    current.customBenchmarkValue ?? current.nilaiSaldoAcuan
  );
  const safeOmPct = Math.max(0, Number.isFinite(current.marginOmPersen) ? current.marginOmPersen : 0);
  const safePmPct = Math.max(0, Math.min(100, Number.isFinite(current.marginPmPersen) ? current.marginPmPersen : 0));
  const safeAmptPct = Math.max(0, Math.min(5, Number.isFinite(current.marginAmptPersen) ? current.marginAmptPersen : 0));

  const nilaiOm = Math.round((nilaiSaldoAcuan * safeOmPct) / 100);
  const nilaiPm = Math.round((nilaiOm * safePmPct) / 100);
  const nilaiAmpt = Math.round((nilaiPm * safeAmptPct) / 100);

  return {
    ...current,
    nilaiSaldoAcuan,
    marginOmPersen: safeOmPct,
    nilaiOm,
    marginPmPersen: safePmPct,
    nilaiPm,
    marginAmptPersen: safeAmptPct,
    nilaiAmpt,
  };
}

export function canSignOffA210Prepared(a210: A210Materiality): { allowed: boolean; reason?: string } {
  const check = validateA210Materiality(a210);
  if (a210.nilaiSaldoAcuan <= 0 || a210.nilaiOm <= 0) {
    return {
      allowed: false,
      reason: 'Sign-off A210 ditolak: Nilai Saldo Acuan dan Overall Materiality (OM) harus lebih dari 0 (periksa Trial Balance / WSTB).',
    };
  }
  if (check.amptError) {
    return { allowed: false, reason: check.amptError };
  }
  if (check.pmNeedsJustification) {
    return {
      allowed: false,
      reason: `Sign-off A210 ditolak: Margin PM (${a210.marginPmPersen}%) di luar rentang wajar 50%–80%, wajib isi Pertimbangan PM minimal 100 karakter (saat ini ${a210.pertimbanganPm.trim().length} karakter).`,
    };
  }
  if (a210.pertimbanganOm.trim().length < 20) {
    return {
      allowed: false,
      reason: 'Sign-off A210 ditolak: Dokumentasi Pertimbangan Profesional OM minimal 20 karakter.',
    };
  }
  return { allowed: true };
}

// ============================================================================
// 3. A220 — ANALISIS HORIZONTAL, VERTIKAL & 13 RASIO KEUANGAN (SA 520)
// ============================================================================

export interface A220AnalyticalRow {
  accountId: string;
  kodeAkun: string;
  namaAkun: string;
  leadCode: string;
  groupAkun: TrialBalanceAccount['groupAkun'];
  saldoBerjalan: number;
  saldoLalu: number;
  perubahanNominal: number;
  perubahanPersen: number | null;
  commonSizeBerjalanPersen: number | null;
  commonSizeLaluPersen: number | null;
  isFluktuasiSignifikan: boolean;
}

export interface A220RatioItem {
  id: string;
  kelompok: 'Likuiditas' | 'Solvabilitas' | 'Profitabilitas' | 'Aktivitas';
  namaRasio: string;
  rumus: string;
  satuan: 'x' | '%' | 'hari';
  nilaiBerjalan: number | null;
  nilaiLalu: number | null;
  delta: number | null;
  interpretasi: string;
}

export function computeA220HorizontalVertical(
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[],
  performanceMateriality: number
): A220AnalyticalRow[] {
  const aggCurr = computeFinancialAggregates(trialBalance, journals, 'current');
  const aggPrev = computeFinancialAggregates(trialBalance, [], 'prior');

  return trialBalance.map((tb) => {
    const nets = computeTrialBalanceNetBalances(tb, journals);
    const saldoBerjalan = nets.saldoBerjalan;
    const saldoLalu = nets.saldoLalu;
    const perubahanNominal = saldoBerjalan - saldoLalu;
    const perubahanPersen =
      saldoLalu !== 0 ? (perubahanNominal / Math.abs(saldoLalu)) * 100 : null;

    const isBs =
      tb.groupAkun === 'ASET' ||
      tb.groupAkun === 'LIABILITAS' ||
      tb.groupAkun === 'EKUITAS_ASET_BERSIH';

    const baseCurr = isBs ? aggCurr.totalAset : aggCurr.pendapatan;
    const basePrev = isBs ? aggPrev.totalAset : aggPrev.pendapatan;

    const commonSizeBerjalanPersen =
      baseCurr !== 0 ? (saldoBerjalan / baseCurr) * 100 : null;
    const commonSizeLaluPersen =
      basePrev !== 0 ? (saldoLalu / basePrev) * 100 : null;

    const isFluktuasiSignifikan =
      performanceMateriality > 0 &&
      Math.abs(perubahanNominal) >= performanceMateriality &&
      perubahanPersen !== null &&
      Math.abs(perubahanPersen) >= 20;

    return {
      accountId: tb.id,
      kodeAkun: tb.kodeAkun,
      namaAkun: tb.namaAkun,
      leadCode: tb.leadCode,
      groupAkun: tb.groupAkun,
      saldoBerjalan,
      saldoLalu,
      perubahanNominal,
      perubahanPersen,
      commonSizeBerjalanPersen,
      commonSizeLaluPersen,
      isFluktuasiSignifikan,
    };
  });
}

function safeDiv(num: number, den: number): number | null {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
  return num / den;
}

export function computeA220FinancialRatios(
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[] = []
): A220RatioItem[] {
  const c = computeFinancialAggregates(trialBalance, journals, 'current');
  const p = computeFinancialAggregates(trialBalance, [], 'prior');

  const build = (
    id: string,
    kelompok: A220RatioItem['kelompok'],
    namaRasio: string,
    rumus: string,
    satuan: A220RatioItem['satuan'],
    nilaiBerjalan: number | null,
    nilaiLalu: number | null,
    interpretasi: string
  ): A220RatioItem => ({
    id,
    kelompok,
    namaRasio,
    rumus,
    satuan,
    nilaiBerjalan,
    nilaiLalu,
    delta: nilaiBerjalan !== null && nilaiLalu !== null ? nilaiBerjalan - nilaiLalu : null,
    interpretasi,
  });

  const currQuickNum = c.kasSetaraKas + c.piutangUsaha;
  const prevQuickNum = p.kasSetaraKas + p.piutangUsaha;

  const pct = (v: number | null) => (v === null ? null : v * 100);
  const days = (v: number | null) => (v === null ? null : v * 365);

  return [
    // 1. Likuiditas (3)
    build(
      'liq-current',
      'Likuiditas',
      'Current Ratio',
      'Aset Lancar / Liabilitas Jk. Pendek',
      'x',
      safeDiv(c.asetLancar, c.liabilitasJangkaPendek),
      safeDiv(p.asetLancar, p.liabilitasJangkaPendek),
      'Mengukur kemampuan entitas melunasi kewajiban lancar dengan aset lancar.'
    ),
    build(
      'liq-quick',
      'Likuiditas',
      'Quick Ratio (Acid Test)',
      '(Kas + Setara Kas + Piutang Usaha) / Liabilitas Jk. Pendek',
      'x',
      safeDiv(currQuickNum, c.liabilitasJangkaPendek),
      safeDiv(prevQuickNum, p.liabilitasJangkaPendek),
      'Mengukur likuiditas jangka pendek tanpa mengandalkan pencairan persediaan.'
    ),
    build(
      'liq-cash',
      'Likuiditas',
      'Cash Ratio',
      '(Kas + Setara Kas) / Liabilitas Jk. Pendek',
      'x',
      safeDiv(c.kasSetaraKas, c.liabilitasJangkaPendek),
      safeDiv(p.kasSetaraKas, p.liabilitasJangkaPendek),
      'Mengukur cakupan kas dan setara kas langsung terhadap utang lancar.'
    ),

    // 2. Solvabilitas (3)
    build(
      'sol-dar',
      'Solvabilitas',
      'Debt to Asset Ratio (DAR)',
      'Total Liabilitas / Total Aset',
      'x',
      safeDiv(c.totalLiabilitas, c.totalAset),
      safeDiv(p.totalLiabilitas, p.totalAset),
      'Proporsi aset entitas yang dibiayai melalui kewajiban/utang.'
    ),
    build(
      'sol-der',
      'Solvabilitas',
      'Debt to Equity Ratio (DER)',
      'Total Liabilitas / Total Ekuitas',
      'x',
      safeDiv(c.totalLiabilitas, c.totalEkuitas),
      safeDiv(p.totalLiabilitas, p.totalEkuitas),
      'Menunjukkan leverage keuangan serta potensi risiko covenant pinjaman.'
    ),
    build(
      'sol-icr',
      'Solvabilitas',
      'Interest Coverage Ratio',
      'EBIT / Beban Bunga',
      'x',
      safeDiv(c.ebit, c.bebanBunga),
      safeDiv(p.ebit, p.bebanBunga),
      'Kemampuan laba operasional menutup beban bunga periode berjalan.'
    ),

    // 3. Profitabilitas (4)
    build(
      'prof-gpm',
      'Profitabilitas',
      'Gross Profit Margin (GPM)',
      '(Laba Bruto / Pendapatan) × 100%',
      '%',
      pct(safeDiv(c.labaBruto, c.pendapatan)),
      pct(safeDiv(p.labaBruto, p.pendapatan)),
      'Efisiensi margin penjualan setelah dikurangi beban pokok penjualan.'
    ),
    build(
      'prof-npm',
      'Profitabilitas',
      'Net Profit Margin (NPM)',
      '(Laba Bersih / Pendapatan) × 100%',
      '%',
      pct(safeDiv(c.labaBersih, c.pendapatan)),
      pct(safeDiv(p.labaBersih, p.pendapatan)),
      'Persentase laba bersih yang dihasilkan dari setiap rupiah pendapatan.'
    ),
    build(
      'prof-roa',
      'Profitabilitas',
      'Return on Assets (ROA)',
      '(Laba Bersih / Total Aset) × 100%',
      '%',
      pct(safeDiv(c.labaBersih, c.totalAset)),
      pct(safeDiv(p.labaBersih, p.totalAset)),
      'Efektivitas pemanfaatan total aset untuk menghasilkan laba bersih.'
    ),
    build(
      'prof-roe',
      'Profitabilitas',
      'Return on Equity (ROE)',
      '(Laba Bersih / Total Ekuitas) × 100%',
      '%',
      pct(safeDiv(c.labaBersih, c.totalEkuitas)),
      pct(safeDiv(p.labaBersih, p.totalEkuitas)),
      'Tingkat imbal hasil atas ekuitas pemegang saham.'
    ),

    // 4. Aktivitas (3)
    build(
      'act-tato',
      'Aktivitas',
      'Total Asset Turnover (TATO)',
      'Pendapatan / Total Aset',
      'x',
      safeDiv(c.pendapatan, c.totalAset),
      safeDiv(p.pendapatan, p.totalAset),
      'Frekuensi perputaran total aset dalam menghasilkan pendapatan usaha.'
    ),
    build(
      'act-dso',
      'Aktivitas',
      'Days Sales Outstanding (DSO)',
      '(Piutang Usaha / Pendapatan) × 365',
      'hari',
      days(safeDiv(c.piutangUsaha, c.pendapatan)),
      days(safeDiv(p.piutangUsaha, p.pendapatan)),
      'Rata-rata hari penagihan piutang usaha; lonjakan DSO mengindikasikan risiko kolektibilitas.'
    ),
    build(
      'act-dsi',
      'Aktivitas',
      'Days Sales of Inventory (DSI)',
      '(Persediaan / HPP) × 365',
      'hari',
      days(safeDiv(c.persediaan, c.hpp)),
      days(safeDiv(p.persediaan, p.hpp)),
      'Rata-rata hari persediaan mengendap; kenaikan tajam menandakan risiko slow-moving/obsolescence.'
    ),
  ];
}

// ============================================================================
// 4. A240 — AKUN SIGNIFIKAN & INHERENT RISK GATE
// ============================================================================

export function computeLeadBalancesMap(
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[] = []
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const tb of trialBalance) {
    const { saldoBerjalan } = computeTrialBalanceNetBalances(tb, journals);
    totals[tb.leadCode] = (totals[tb.leadCode] ?? 0) + saldoBerjalan;
  }
  return totals;
}

/**
 * Mengumpulkan semua leadCode yang terpapar Fraud Risk dari A230 (khususnya A230.7 = 'Ya'
 * atau item mana pun yang memiliki isFraudRisk = true).
 */
export function getFraudRiskLeadCodes(a230Items: A230EntityRiskItem[]): Set<string> {
  const flagged = new Set<string>();
  const a230_7 = a230Items.find((i) => i.kodeSubIndeks === 'A230.7');
  const isFraudActive = a230_7 ? a230_7.hasilAnalisis === 'Ya' : false;

  for (const item of a230Items) {
    if (item.kodeSubIndeks === 'A230.7') {
      if (isFraudActive) {
        for (const acc of item.affectedAccounts) {
          flagged.add(acc.leadCode);
        }
      }
    } else if (item.isFraudRisk) {
      for (const acc of item.affectedAccounts) {
        flagged.add(acc.leadCode);
      }
    }
  }
  return flagged;
}

export function recomputeA240Rows(
  rows: A240InherentRiskRow[],
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[],
  nilaiPm: number
): A240InherentRiskRow[] {
  const leadTotals = computeLeadBalancesMap(trialBalance, journals);
  return rows.map((row) => {
    const saldoBerjalan = leadTotals[row.leadCode] ?? 0;
    const quantitativeSig = nilaiPm > 0 && Math.abs(saldoBerjalan) >= nilaiPm;
    return {
      ...row,
      saldoBerjalan,
      isSignificantAccount: quantitativeSig ? true : row.isSignificantAccount,
    };
  });
}

export function canSignOffA240Prepared(
  a240Rows: A240InherentRiskRow[]
): { allowed: boolean; reason?: string } {
  const sigRows = a240Rows.filter((r) => r.isSignificantAccount);
  if (sigRows.length === 0) {
    return {
      allowed: false,
      reason: 'Sign-off A240 ditolak: Minimal harus terdapat 1 Akun Signifikan yang dinilai risiko bawaannya.',
    };
  }
  const incomplete = sigRows.find((r) =>
    AUDIT_ASSERTIONS.some((a) => !['Low', 'Moderate', 'High'].includes(r.irByAssertion[a]))
  );
  if (incomplete) {
    return {
      allowed: false,
      reason: `Sign-off A240 ditolak: Akun Signifikan ${incomplete.leadCode} (${incomplete.namaAkun}) belum melengkapi seluruh 5 asersi Inherent Risk.`,
    };
  }
  return { allowed: true };
}

// ============================================================================
// 5. A250 — KALKULASI CONTROL RISK (13 SIKLUS)
// ============================================================================

export function evaluateA250CycleControlRisk(items: A250ControlTestItem[]): {
  controlRiskLevel: RiskLevel;
  simpulanPengendalian:
    | 'Pengendalian Internal pada siklus ini memadai'
    | 'Pengendalian Internal pada siklus ini belum sepenuhnya memadai'
    | 'Pengendalian Internal pada siklus ini tidak memadai';
} {
  if (items.length === 0) {
    return {
      controlRiskLevel: 'Moderate',
      simpulanPengendalian: 'Pengendalian Internal pada siklus ini belum sepenuhnya memadai',
    };
  }

  const hasFailure = items.some(
    (item) => item.desainSesuai === 'Tidak sesuai' || item.hasilToc === 'Tidak Efektif'
  );
  if (hasFailure) {
    return {
      controlRiskLevel: 'High',
      simpulanPengendalian: 'Pengendalian Internal pada siklus ini tidak memadai',
    };
  }

  const allEffective = items.every(
    (item) => item.desainSesuai === 'Sesuai' && item.hasilToc === 'Efektif'
  );
  if (allEffective) {
    return {
      controlRiskLevel: 'Low',
      simpulanPengendalian: 'Pengendalian Internal pada siklus ini memadai',
    };
  }

  return {
    controlRiskLevel: 'Moderate',
    simpulanPengendalian: 'Pengendalian Internal pada siklus ini belum sepenuhnya memadai',
  };
}

// ============================================================================
// 6. A270 — MESIN MATRIKS DETERMINISTIK IR × CR = RoMM (DATAROMM)
// ============================================================================

const IR_CR_ROMM_MATRIX: Record<RiskLevel, Record<RiskLevel, RiskLevel>> = {
  High: {
    High: 'High',
    Moderate: 'High',
    Low: 'Moderate',
  },
  Moderate: {
    High: 'High',
    Moderate: 'Moderate',
    Low: 'Low',
  },
  Low: {
    High: 'Moderate',
    Moderate: 'Low',
    Low: 'Low',
  },
};

export function lookupMatrixRomm(ir: RiskLevel, cr: RiskLevel): RiskLevel {
  return IR_CR_ROMM_MATRIX[ir][cr];
}

export function getResponAuditFromRomm(
  overallRomm: RiskLevel,
  cr: RiskLevel,
  isFraudOrSigRisk: boolean
): string {
  if (isFraudOrSigRisk) {
    return 'Risiko Signifikan / Fraud SA 240: Wajib pengujian substantif rinci ekstensif pada akhir periode & sampel maksimal.';
  }
  if (overallRomm === 'High' && cr === 'High') {
    return 'Substantif rinci ekstensif tanpa ketergantungan pengendalian; sampel ISA maksimal.';
  }
  if (overallRomm === 'High' && cr === 'Moderate') {
    return 'Substantif rinci diutamakan dengan dukungan analitis substantif terbatas.';
  }
  if (overallRomm === 'High' && cr === 'Low') {
    return 'Pengujian pengendalian (TOC) diperluas dipadukan pengujian substantif rinci terarah.';
  }
  if (overallRomm === 'Moderate' && cr === 'High') {
    return 'Substantif rinci standar tanpa reliance pada pengendalian internal.';
  }
  if (overallRomm === 'Moderate' && cr === 'Moderate') {
    return 'Kombinasi berimbang antara pengujian pengendalian (TOC) dan pengujian substantif.';
  }
  if (overallRomm === 'Moderate' && cr === 'Low') {
    return 'Pengujian substantif standar/terarah dengan dukungan TOC.';
  }
  if (cr === 'Low') {
    return 'Prosedur analitis substantif & pengujian pengendalian (TOC) memadai; sampel rinci minimum.';
  }
  return 'Pengujian substantif minimal dan prosedur analitis substantif terarah.';
}

/**
 * Menghitung ulang seluruh matriks A270 berdasarkan:
 * - IR per asersi di A240
 * - CR siklus di A250
 * - Flag Risiko Signifikan (A240) & Fraud Risk (A230.7)
 * Mematuhi ATURAN ANTI-BUG #1: overallRomm menggunakan computeOverallRomm (ROMM_PRIORITY).
 */
export function recomputeWorkspaceA270(ws: EngagementWorkspaceData): A270RommRow[] {
  const a240Map = new Map(ws.a240Rows.map((r) => [r.leadCode, r]));
  const cycleMap = new Map(ws.a250Cycles.map((c) => [c.kodeSiklus, c]));
  const fraudLeads = getFraudRiskLeadCodes(ws.a230Items);

  return ws.a270Rows.map((row) => {
    const a240 = a240Map.get(row.leadCode);
    const cycle = cycleMap.get(row.cycleCode);
    const cr: RiskLevel = cycle?.controlRiskLevel ?? 'Moderate';
    const isFraudOrSigRisk = Boolean(a240?.isSignificantRisk) || fraudLeads.has(row.leadCode);

    const rommByAssertion: Record<AuditAssertion, RiskLevel> = {
      C: isFraudOrSigRisk ? 'High' : lookupMatrixRomm(a240?.irByAssertion.C ?? 'Moderate', cr),
      E: isFraudOrSigRisk ? 'High' : lookupMatrixRomm(a240?.irByAssertion.E ?? 'Moderate', cr),
      'A&C': isFraudOrSigRisk ? 'High' : lookupMatrixRomm(a240?.irByAssertion['A&C'] ?? 'Moderate', cr),
      V: isFraudOrSigRisk ? 'High' : lookupMatrixRomm(a240?.irByAssertion.V ?? 'Moderate', cr),
      'P&D': isFraudOrSigRisk ? 'High' : lookupMatrixRomm(a240?.irByAssertion['P&D'] ?? 'Moderate', cr),
    };

    const overallRomm = computeOverallRomm(Object.values(rommByAssertion));
    const requiresTestOfControls = cr !== 'High' && (cycle?.items.length ?? 0) > 0;
    const requiresSubstantiveTest = true;
    const responAuditKomprehensif = getResponAuditFromRomm(overallRomm, cr, isFraudOrSigRisk);

    return {
      ...row,
      rommByAssertion,
      overallRomm,
      responAuditKomprehensif,
      requiresSubstantiveTest,
      requiresTestOfControls,
    };
  });
}

/**
 * Cascade penuh Modul A2 saat Trial Balance / A210 / A230 / A240 / A250 berubah.
 */
export function recomputeModuleA2Cascade(ws: EngagementWorkspaceData): EngagementWorkspaceData {
  const nextA210 = recalculateA210FromState(ws.a210, ws.trialBalance, ws.journals);
  const nextA240 = recomputeA240Rows(ws.a240Rows, ws.trialBalance, ws.journals, nextA210.nilaiPm);
  const intermediate: EngagementWorkspaceData = {
    ...ws,
    a210: nextA210,
    a240Rows: nextA240,
  };
  const nextA270 = recomputeWorkspaceA270(intermediate);
  return {
    ...intermediate,
    a270Rows: nextA270,
  };
}
