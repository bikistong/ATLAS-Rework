import * as XLSX from 'xlsx';
import { MASTER_LEAD_HEADERS } from '../data/masterLeadHeaders';
import {
  AuditJournalEntry,
  EngagementHeader,
  FsAccountGroup,
  SpecialProceduresData,
  TrialBalanceAccount,
} from '../types/atlas';

// ============================================================================
// 1. PARSER & VALIDATOR IMPORT TRIAL BALANCE (.xlsx / .csv)
// ============================================================================

export interface TrialBalanceImportValidation {
  valid: boolean;
  duplicateCodes: string[];
  totalUnauditedDebit: number;
  totalUnauditedCredit: number;
  unbalancedDifference: number;
  totalPriorDebit: number;
  totalPriorCredit: number;
  priorUnbalancedDifference: number;
  errors: string[];
}

export function inferAccountMapping(
  kodeAkun: string,
  namaAkun: string,
  signedSampleBalance = 0
): Pick<
  TrialBalanceAccount,
  'posisiNormal' | 'groupAkun' | 'kelompokAkun' | 'headerAkun' | 'leadCode' | 'isClosingReAccount' | 'isOciAccount'
> {
  const code = kodeAkun.trim();
  const name = namaAkun.toLowerCase();
  const prefix = code.charAt(0);

  let groupAkun: FsAccountGroup = 'ASET';
  let kelompokAkun = 'Aset Lancar';
  let leadCode = 'L11';

  if (prefix === '1' || name.includes('kas') || name.includes('bank') || name.includes('piutang') || name.includes('persediaan') || name.includes('aset') || name.includes('aktiva')) {
    groupAkun = 'ASET';
    if (name.includes('akumulasi') || name.includes('akum.')) {
      kelompokAkun = 'Aset Tidak Lancar';
      leadCode = 'L14';
    } else if (name.includes('tetap') || name.includes('kendaraan') || name.includes('mesin') || name.includes('bangunan') || name.includes('tanah') || code.startsWith('12')) {
      kelompokAkun = 'Aset Tidak Lancar';
      leadCode = 'L13';
    } else if (name.includes('deposito')) {
      kelompokAkun = 'Aset Lancar';
      leadCode = 'L03';
    } else if (name.includes('kas') || name.includes('bank')) {
      kelompokAkun = 'Aset Lancar';
      leadCode = 'L02';
    } else if (name.includes('piutang')) {
      kelompokAkun = 'Aset Lancar';
      leadCode = 'L05';
    } else if (name.includes('persediaan')) {
      kelompokAkun = 'Aset Lancar';
      leadCode = 'L06';
    } else if (name.includes('pajak dibayar')) {
      kelompokAkun = 'Aset Lancar';
      leadCode = 'L08';
    } else if (name.includes('dibayar dimuka') || name.includes('uang muka')) {
      kelompokAkun = 'Aset Lancar';
      leadCode = 'L09';
    } else {
      kelompokAkun = code.startsWith('12') ? 'Aset Tidak Lancar' : 'Aset Lancar';
      leadCode = code.startsWith('12') ? 'L16' : 'L11';
    }
  } else if (prefix === '2' || name.includes('utang') || name.includes('hutang') || name.includes('liabilitas')) {
    groupAkun = 'LIABILITAS';
    if (name.includes('jangka panjang') || code.startsWith('22')) {
      kelompokAkun = 'Liabilitas Jangka Panjang';
      leadCode = name.includes('imbalan') ? 'L31' : name.includes('sewa') ? 'L29' : 'L28';
    } else {
      kelompokAkun = 'Liabilitas Jangka Pendek';
      if (name.includes('usaha') || name.includes('dagang')) leadCode = 'L17';
      else if (name.includes('bank')) leadCode = 'L20';
      else if (name.includes('pajak') || name.includes('ppn') || name.includes('pph')) leadCode = 'L26';
      else leadCode = 'L27';
    }
  } else if (prefix === '3' || name.includes('modal') || name.includes('ekuitas') || name.includes('saldo laba') || name.includes('laba ditahan') || name.includes('oci')) {
    groupAkun = 'EKUITAS_ASET_BERSIH';
    kelompokAkun = 'Ekuitas';
    if (name.includes('agio') || name.includes('tambahan modal')) leadCode = 'L33';
    else if (name.includes('saldo laba') || name.includes('laba ditahan')) leadCode = 'L34';
    else if (name.includes('modal')) leadCode = 'L32';
    else leadCode = 'L36';
  } else if (prefix === '4' || name.includes('penjualan') || name.includes('pendapatan')) {
    groupAkun = 'PENDAPATAN';
    if (name.includes('lain') || name.includes('bunga') || code.startsWith('42') || code.startsWith('70')) {
      kelompokAkun = 'Pendapatan Non-Operasional';
      leadCode = 'L45';
    } else if (name.includes('retur') || name.includes('potongan')) {
      kelompokAkun = 'Pendapatan Usaha';
      leadCode = 'L38';
    } else {
      kelompokAkun = 'Pendapatan Usaha';
      leadCode = 'L37';
    }
  } else if (prefix === '5' || prefix === '6' || prefix === '7' || prefix === '8' || name.includes('beban') || name.includes('biaya') || name.includes('hpp') || name.includes('pajak')) {
    groupAkun = 'BEBAN';
    if (prefix === '5' || name.includes('pokok') || name.includes('hpp')) {
      kelompokAkun = 'Beban Pokok';
      leadCode = 'L39';
    } else if (name.includes('bunga') || name.includes('adm bank') || prefix === '7') {
      kelompokAkun = 'Beban Non-Operasional';
      leadCode = 'L46';
    } else if (name.includes('pajak penghasilan') || name.includes('pph badan') || prefix === '8') {
      kelompokAkun = 'Beban Pajak Penghasilan';
      leadCode = 'L47';
    } else if (name.includes('penyusutan')) {
      kelompokAkun = 'Beban Operasional';
      leadCode = 'L43';
    } else if (name.includes('sewa')) {
      kelompokAkun = 'Beban Operasional';
      leadCode = 'L42';
    } else if (name.includes('pemasaran') || name.includes('penjualan')) {
      kelompokAkun = 'Beban Operasional';
      leadCode = 'L40';
    } else {
      kelompokAkun = 'Beban Operasional';
      leadCode = 'L41';
    }
  } else {
    groupAkun = signedSampleBalance >= 0 ? 'ASET' : 'LIABILITAS';
    kelompokAkun = groupAkun === 'ASET' ? 'Aset Lancar' : 'Liabilitas Jangka Pendek';
    leadCode = groupAkun === 'ASET' ? 'L11' : 'L27';
  }

  const leadMeta = MASTER_LEAD_HEADERS.find((l) => l.leadCode === leadCode);
  const posisiNormal: 'Debit' | 'Kredit' =
    groupAkun === 'ASET' || groupAkun === 'BEBAN'
      ? leadCode === 'L14'
        ? 'Kredit'
        : 'Debit'
      : leadCode === 'L38'
        ? 'Debit'
        : 'Kredit';

  return {
    posisiNormal,
    groupAkun,
    kelompokAkun,
    headerAkun: leadMeta?.title ?? namaAkun,
    leadCode,
    isClosingReAccount: leadCode === 'L34' || name.includes('saldo laba') || name.includes('laba ditahan'),
    isOciAccount: name.includes('oci') || name.includes('penghasilan komprehensif'),
  };
}

function parseNumericCell(raw: unknown): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  if (typeof raw !== 'string') return 0;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-') return 0;
  const isParenNegative = trimmed.startsWith('(') && trimmed.endsWith(')');
  const cleaned = trimmed.replace(/[Rp\s,()]/g, '');
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return 0;
  return isParenNegative ? -Math.abs(parsed) : parsed;
}

function pickField(row: Record<string, unknown>, candidates: string[]): unknown {
  const entries = Object.entries(row);
  for (const cand of candidates) {
    const lc = cand.toLowerCase();
    const hit = entries.find(([k]) => k.trim().toLowerCase() === lc);
    if (hit !== undefined) return hit[1];
  }
  for (const cand of candidates) {
    const lc = cand.toLowerCase();
    const hit = entries.find(([k]) => k.trim().toLowerCase().includes(lc));
    if (hit !== undefined) return hit[1];
  }
  return undefined;
}

export function parseTrialBalanceRows(rows: Record<string, unknown>[]): TrialBalanceAccount[] {
  const parsed: TrialBalanceAccount[] = [];
  rows.forEach((rawRow, index) => {
    const rawKode = pickField(rawRow, ['kodeAkun', 'kode_akun', 'kode akun', 'kode', 'account code', 'no akun']);
    const rawNama = pickField(rawRow, ['namaAkun', 'nama_akun', 'nama akun', 'account name', 'uraian']);
    const kodeAkun = String(rawKode ?? '').trim();
    const namaAkun = String(rawNama ?? '').trim();
    if (!kodeAkun && !namaAkun) return;

    const rawUnDr = pickField(rawRow, ['unauditedDebit', 'unaudited_debit', 'debit berjalan', 'debit']);
    const rawUnCr = pickField(rawRow, ['unauditedCredit', 'unaudited_credit', 'kredit berjalan', 'credit', 'kredit']);
    const rawSaldoBerjalan = pickField(rawRow, ['saldoBerjalan', 'saldo_berjalan', 'saldo berjalan', 'current balance', 'berjalan']);

    const rawPrevDr = pickField(rawRow, ['pembandingDebit', 'pembanding_debit', 'prior debit', 'debit lalu']);
    const rawPrevCr = pickField(rawRow, ['pembandingCredit', 'pembanding_credit', 'prior credit', 'kredit lalu']);
    const rawSaldoPembanding = pickField(rawRow, ['saldoPembanding', 'saldo_pembanding', 'saldo pembanding', 'prior balance', 'periode lalu']);

    let unauditedDebit = 0;
    let unauditedCredit = 0;
    if (rawUnDr !== undefined || rawUnCr !== undefined) {
      unauditedDebit = Math.max(0, parseNumericCell(rawUnDr));
      unauditedCredit = Math.max(0, parseNumericCell(rawUnCr));
    } else {
      const signed = parseNumericCell(rawSaldoBerjalan);
      if (signed >= 0) unauditedDebit = signed;
      else unauditedCredit = Math.abs(signed);
    }

    let pembandingDebit = 0;
    let pembandingCredit = 0;
    if (rawPrevDr !== undefined || rawPrevCr !== undefined) {
      pembandingDebit = Math.max(0, parseNumericCell(rawPrevDr));
      pembandingCredit = Math.max(0, parseNumericCell(rawPrevCr));
    } else {
      const signedPrev = parseNumericCell(rawSaldoPembanding);
      if (signedPrev >= 0) pembandingDebit = signedPrev;
      else pembandingCredit = Math.abs(signedPrev);
    }

    const mapped = inferAccountMapping(kodeAkun, namaAkun, unauditedDebit - unauditedCredit);
    const rawLead = String(pickField(rawRow, ['leadCode', 'lead_code', 'lead']) ?? '').trim().toUpperCase();
    const validLead = MASTER_LEAD_HEADERS.some((l) => l.leadCode === rawLead) ? rawLead : mapped.leadCode;
    const rawGroup = String(pickField(rawRow, ['groupAkun', 'group_akun', 'group']) ?? '').trim().toUpperCase();
    const validGroups: FsAccountGroup[] = ['ASET', 'LIABILITAS', 'EKUITAS_ASET_BERSIH', 'PENDAPATAN', 'BEBAN'];
    const validGroup = validGroups.includes(rawGroup as FsAccountGroup)
      ? (rawGroup as FsAccountGroup)
      : mapped.groupAkun;

    parsed.push({
      id: `tb-imp-${kodeAkun || index + 1}-${index}`,
      kodeAkun: kodeAkun || `AKUN-${index + 1}`,
      namaAkun: namaAkun || `Akun ${kodeAkun}`,
      posisiNormal: mapped.posisiNormal,
      groupAkun: validGroup,
      kelompokAkun: String(pickField(rawRow, ['kelompokAkun', 'kelompok_akun']) ?? '').trim() || mapped.kelompokAkun,
      headerAkun: String(pickField(rawRow, ['headerAkun', 'header_akun']) ?? '').trim() || mapped.headerAkun,
      leadCode: validLead,
      isClosingReAccount: mapped.isClosingReAccount,
      isOciAccount: mapped.isOciAccount,
      unauditedDebit,
      unauditedCredit,
      pembandingDebit,
      pembandingCredit,
    });
  });

  return parsed;
}

export function parseWorkbookBufferToTbAccounts(buffer: ArrayBuffer): TrialBalanceAccount[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = wb.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return parseTrialBalanceRows(jsonRows);
}

export function validateTrialBalanceImport(
  accounts: TrialBalanceAccount[]
): TrialBalanceImportValidation {
  const errors: string[] = [];
  if (accounts.length === 0) {
    errors.push('Tidak ada baris akun Trial Balance yang ditemukan.');
  }

  const seen = new Map<string, number>();
  for (const acc of accounts) {
    const key = acc.kodeAkun.trim();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const duplicateCodes = Array.from(seen.entries())
    .filter(([, count]) => count > 1)
    .map(([code]) => code);

  if (duplicateCodes.length > 0) {
    errors.push(`Deteksi Duplikat HEADERAKUNDOBEL: Kode akun ganda (${duplicateCodes.join(', ')}).`);
  }

  const totalUnauditedDebit = accounts.reduce((s, a) => s + a.unauditedDebit, 0);
  const totalUnauditedCredit = accounts.reduce((s, a) => s + a.unauditedCredit, 0);
  const unbalancedDifference = totalUnauditedDebit - totalUnauditedCredit;

  if (Math.abs(unbalancedDifference) >= 0.01) {
    errors.push(
      `Trial Balance tidak seimbang: Selisih Unaudited Debit - Kredit sebesar ${unbalancedDifference.toLocaleString('en-US')}.`
    );
  }

  const totalPriorDebit = accounts.reduce((s, a) => s + a.pembandingDebit, 0);
  const totalPriorCredit = accounts.reduce((s, a) => s + a.pembandingCredit, 0);
  const priorUnbalancedDifference = totalPriorDebit - totalPriorCredit;

  return {
    valid: errors.length === 0,
    duplicateCodes,
    totalUnauditedDebit,
    totalUnauditedCredit,
    unbalancedDifference,
    totalPriorDebit,
    totalPriorCredit,
    priorUnbalancedDifference,
    errors,
  };
}

// ============================================================================
// 2. MESIN JURNAL DOUBLE-ENTRY (AJE-RJE)
// ============================================================================

export function nextJournalNumber(
  journals: AuditJournalEntry[],
  jenis: 'AJE' | 'RJE'
): string {
  const prefix = `${jenis}-`;
  const maxNum = journals
    .filter((j) => j.jenisJurnal === jenis && j.nomorJurnal.startsWith(prefix))
    .reduce((max, j) => {
      const n = Number(j.nomorJurnal.slice(prefix.length));
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0);
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

export interface JournalValidationResult {
  valid: boolean;
  totalDebit: number;
  totalKredit: number;
  difference: number;
  errors: string[];
}

export function validateAuditJournalEntry(
  entry: Pick<AuditJournalEntry, 'lines' | 'keterangan' | 'referensiKkp'>
): JournalValidationResult {
  const errors: string[] = [];
  const totalDebit = entry.lines
    .filter((l) => l.posisi === 'Debit')
    .reduce((s, l) => s + (Number.isFinite(l.nilai) ? l.nilai : 0), 0);
  const totalKredit = entry.lines
    .filter((l) => l.posisi === 'Kredit')
    .reduce((s, l) => s + (Number.isFinite(l.nilai) ? l.nilai : 0), 0);
  const difference = totalDebit - totalKredit;

  if (entry.lines.length < 2) {
    errors.push('Jurnal harus memiliki minimal 2 baris (Debit & Kredit).');
  }
  const hasDebit = entry.lines.some((l) => l.posisi === 'Debit' && l.nilai > 0);
  const hasCredit = entry.lines.some((l) => l.posisi === 'Kredit' && l.nilai > 0);
  if (!hasDebit || !hasCredit) {
    errors.push('Minimal terdapat 1 akun Debit dan 1 akun Kredit dengan nilai > 0.');
  }
  if (entry.lines.some((l) => !l.accountId || !Number.isFinite(l.nilai) || l.nilai <= 0)) {
    errors.push('Setiap baris wajib memilih akun COA dan mengisi nominal > 0.');
  }
  if (Math.abs(difference) >= 0.01) {
    errors.push(`Jurnal tidak seimbang (Selisih Debit - Kredit: ${difference.toLocaleString('en-US')}).`);
  }
  if (entry.keterangan.trim().length < 20) {
    errors.push(`Penjelasan/keterangan audit minimal 20 karakter (saat ini ${entry.keterangan.trim().length} karakter).`);
  }
  if (!entry.referensiKkp.trim()) {
    errors.push('Referensi indeks KKP wajib diisi.');
  }

  return {
    valid: errors.length === 0,
    totalDebit,
    totalKredit,
    difference,
    errors,
  };
}

// ============================================================================
// 3. WORKING TRIAL BALANCE 12 KOLOM (B100 / WSTB-FINAL)
// ============================================================================

export interface Wstb12Row {
  accountId: string;
  kodeAkun: string;
  namaAkun: string;
  groupAkun: FsAccountGroup;
  kelompokAkun: string;
  headerAkun: string;
  leadCode: string;
  isClosingReAccount: boolean;
  isOciAccount: boolean;
  unauditedDebit: number;
  unauditedCredit: number;
  ajeDebit: number;
  ajeCredit: number;
  rjeDebit: number;
  rjeCredit: number;
  auditedDebit: number;
  auditedCredit: number;
  priorAudited: number;
  /** Signed balance aligned with FS sign convention (+ assets/expenses on debit, + liab/eq/rev on credit) */
  signedAudited: number;
}

export interface WstbTotals {
  unauditedDebit: number;
  unauditedCredit: number;
  ajeDebit: number;
  ajeCredit: number;
  rjeDebit: number;
  rjeCredit: number;
  auditedDebit: number;
  auditedCredit: number;
  priorAuditedDebit: number;
  priorAuditedCredit: number;
}

export function isDebitNormalGroup(group: FsAccountGroup): boolean {
  return group === 'ASET' || group === 'BEBAN';
}

export function computeWstb12Columns(
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[]
): Wstb12Row[] {
  const accepted = journals.filter((j) => j.statusPersetujuan === 'Accepted');
  const ajeMap = new Map<string, { debit: number; credit: number }>();
  const rjeMap = new Map<string, { debit: number; credit: number }>();

  for (const j of accepted) {
    const targetMap = j.jenisJurnal === 'AJE' ? ajeMap : rjeMap;
    for (const line of j.lines) {
      const prev = targetMap.get(line.accountId) ?? { debit: 0, credit: 0 };
      if (line.posisi === 'Debit') prev.debit += line.nilai;
      else prev.credit += line.nilai;
      targetMap.set(line.accountId, prev);
    }
  }

  return trialBalance.map((tb) => {
    const aje = ajeMap.get(tb.id) ?? { debit: 0, credit: 0 };
    const rje = rjeMap.get(tb.id) ?? { debit: 0, credit: 0 };
    const debitNormal = isDebitNormalGroup(tb.groupAkun);

    let net = 0;
    let auditedDebit = 0;
    let auditedCredit = 0;

    if (debitNormal) {
      net =
        tb.unauditedDebit -
        tb.unauditedCredit +
        (aje.debit - aje.credit) +
        (rje.debit - rje.credit);
      if (net >= 0) {
        auditedDebit = net;
      } else {
        auditedCredit = Math.abs(net);
      }
    } else {
      net =
        tb.unauditedCredit -
        tb.unauditedDebit +
        (aje.credit - aje.debit) +
        (rje.credit - rje.debit);
      if (net >= 0) {
        auditedCredit = net;
      } else {
        auditedDebit = Math.abs(net);
      }
    }

    const priorAudited = debitNormal
      ? tb.pembandingDebit - tb.pembandingCredit
      : tb.pembandingCredit - tb.pembandingDebit;

    return {
      accountId: tb.id,
      kodeAkun: tb.kodeAkun,
      namaAkun: tb.namaAkun,
      groupAkun: tb.groupAkun,
      kelompokAkun: tb.kelompokAkun,
      headerAkun: tb.headerAkun,
      leadCode: tb.leadCode,
      isClosingReAccount: tb.isClosingReAccount,
      isOciAccount: tb.isOciAccount,
      unauditedDebit: tb.unauditedDebit,
      unauditedCredit: tb.unauditedCredit,
      ajeDebit: aje.debit,
      ajeCredit: aje.credit,
      rjeDebit: rje.debit,
      rjeCredit: rje.credit,
      auditedDebit,
      auditedCredit,
      priorAudited,
      signedAudited: net,
    };
  });
}

export function computeWstbTotals(
  rows: Wstb12Row[],
  trialBalance: TrialBalanceAccount[]
): WstbTotals {
  return rows.reduce<WstbTotals>(
    (acc, r, idx) => {
      const tb = trialBalance[idx];
      return {
        unauditedDebit: acc.unauditedDebit + r.unauditedDebit,
        unauditedCredit: acc.unauditedCredit + r.unauditedCredit,
        ajeDebit: acc.ajeDebit + r.ajeDebit,
        ajeCredit: acc.ajeCredit + r.ajeCredit,
        rjeDebit: acc.rjeDebit + r.rjeDebit,
        rjeCredit: acc.rjeCredit + r.rjeCredit,
        auditedDebit: acc.auditedDebit + r.auditedDebit,
        auditedCredit: acc.auditedCredit + r.auditedCredit,
        priorAuditedDebit: acc.priorAuditedDebit + (tb?.pembandingDebit ?? 0),
        priorAuditedCredit: acc.priorAuditedCredit + (tb?.pembandingCredit ?? 0),
      };
    },
    {
      unauditedDebit: 0,
      unauditedCredit: 0,
      ajeDebit: 0,
      ajeCredit: 0,
      rjeDebit: 0,
      rjeCredit: 0,
      auditedDebit: 0,
      auditedCredit: 0,
      priorAuditedDebit: 0,
      priorAuditedCredit: 0,
    }
  );
}

export function getAccountJournalMovements(
  journals: AuditJournalEntry[],
  accountId: string,
  jenisFilter?: 'AJE' | 'RJE'
): AuditJournalEntry[] {
  return journals.filter(
    (j) =>
      j.statusPersetujuan === 'Accepted' &&
      (!jenisFilter || j.jenisJurnal === jenisFilter) &&
      j.lines.some((l) => l.accountId === accountId)
  );
}

// ============================================================================
// 4. GENERATOR 4 LAPORAN KEUANGAN (B120 / FS)
// ============================================================================

export interface FsStatementLine {
  key: string;
  label: string;
  leadCode?: string;
  current: number;
  prior: number;
}

export interface FinancialStatementsBundle {
  neraca: {
    asetLancarLines: FsStatementLine[];
    asetTidakLancarLines: FsStatementLine[];
    totalAsetLancar: number;
    priorTotalAsetLancar: number;
    totalAsetTidakLancar: number;
    priorTotalAsetTidakLancar: number;
    totalAset: number;
    priorTotalAset: number;
    liabilitasPendekLines: FsStatementLine[];
    liabilitasPanjangLines: FsStatementLine[];
    totalLiabilitasPendek: number;
    priorTotalLiabilitasPendek: number;
    totalLiabilitasPanjang: number;
    priorTotalLiabilitasPanjang: number;
    totalLiabilitas: number;
    priorTotalLiabilitas: number;
    ekuitasLines: FsStatementLine[];
    totalEkuitas: number;
    priorTotalEkuitas: number;
    totalLiabilitasDanEkuitas: number;
    priorTotalLiabilitasDanEkuitas: number;
    selisihNeraca: number;
    priorSelisihNeraca: number;
    isNeracaBalanced: boolean;
  };
  labaRugi: {
    pendapatanLines: FsStatementLine[];
    hppLines: FsStatementLine[];
    bebanOpsLines: FsStatementLine[];
    nonOpsLines: FsStatementLine[];
    pajakLines: FsStatementLine[];
    ociLines: FsStatementLine[];
    pendapatanBersih: number;
    priorPendapatanBersih: number;
    totalHpp: number;
    priorTotalHpp: number;
    labaBruto: number;
    priorLabaBruto: number;
    totalBebanOperasional: number;
    priorTotalBebanOperasional: number;
    labaUsaha: number;
    priorLabaUsaha: number;
    pendapatanBebanLainBersih: number;
    priorPendapatanBebanLainBersih: number;
    labaSebelumPajak: number;
    priorLabaSebelumPajak: number;
    bebanPajak: number;
    priorBebanPajak: number;
    labaBersih: number;
    priorLabaBersih: number;
    ociTahunBerjalan: number;
    priorOciTahunBerjalan: number;
    totalPenghasilanKomprehensif: number;
    priorTotalPenghasilanKomprehensif: number;
  };
  perubahanEkuitas: {
    modalAwal: number;
    penambahanModal: number;
    modalAkhir: number;
    saldoLabaAwal: number;
    labaBersihBerjalan: number;
    dividenAtauPenyesuaian: number;
    saldoLabaAkhir: number;
    ociAkhir: number;
    totalEkuitasAwal: number;
    totalEkuitasAkhir: number;
  };
  arusKas: {
    labaBersih: number;
    penyesuaianPenyusutan: number;
    perubahanPiutang: number;
    perubahanPersediaan: number;
    perubahanAsetLancarLain: number;
    perubahanLiabilitasOperasi: number;
    arusKasOperasi: number;
    perolehanAsetTetapDanInvestasi: number;
    arusKasInvestasi: number;
    perubahanUtangPembiayaan: number;
    perubahanModalDanDividen: number;
    arusKasPendanaan: number;
    kenaikanBersihKas: number;
    kasAwal: number;
    kasAkhirDihitung: number;
    kasAkhirNeraca: number;
    selisihKas: number;
  };
}

function groupByHeaderOrAccount(rows: Wstb12Row[], signFactor = 1): FsStatementLine[] {
  const map = new Map<string, FsStatementLine>();
  for (const r of rows) {
    const key = `${r.leadCode}::${r.namaAkun}`;
    const existing = map.get(key);
    if (existing) {
      existing.current += r.signedAudited * signFactor;
      existing.prior += r.priorAudited * signFactor;
    } else {
      map.set(key, {
        key,
        label: `${r.kodeAkun} — ${r.namaAkun}`,
        leadCode: r.leadCode,
        current: r.signedAudited * signFactor,
        prior: r.priorAudited * signFactor,
      });
    }
  }
  return Array.from(map.values());
}

export function computeFinancialStatements(
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[]
): FinancialStatementsBundle {
  const wstb = computeWstb12Columns(trialBalance, journals);

  const isAsetLancar = (r: Wstb12Row) =>
    r.groupAkun === 'ASET' &&
    (r.kelompokAkun.toLowerCase().includes('lancar') && !r.kelompokAkun.toLowerCase().includes('tidak'));
  const isAsetTidakLancar = (r: Wstb12Row) => r.groupAkun === 'ASET' && !isAsetLancar(r);

  const isLiabPendek = (r: Wstb12Row) =>
    r.groupAkun === 'LIABILITAS' &&
    (r.kelompokAkun.toLowerCase().includes('pendek') || r.kelompokAkun.toLowerCase().includes('lancar'));
  const isLiabPanjang = (r: Wstb12Row) => r.groupAkun === 'LIABILITAS' && !isLiabPendek(r);

  const asetLancarRows = wstb.filter(isAsetLancar);
  const asetTidakLancarRows = wstb.filter(isAsetTidakLancar);
  const liabPendekRows = wstb.filter(isLiabPendek);
  const liabPanjangRows = wstb.filter(isLiabPanjang);
  const ekuitasRows = wstb.filter((r) => r.groupAkun === 'EKUITAS_ASET_BERSIH' && !r.isOciAccount);
  const ociRows = wstb.filter((r) => r.isOciAccount);

  const sumCurr = (list: Wstb12Row[]) => list.reduce((s, r) => s + r.signedAudited, 0);
  const sumPrior = (list: Wstb12Row[]) => list.reduce((s, r) => s + r.priorAudited, 0);

  // Laba Rugi & OCI
  const pendRows = wstb.filter((r) => r.groupAkun === 'PENDAPATAN');
  const pendUsahaRows = pendRows.filter((r) => r.leadCode !== 'L45');
  const pendLainRows = pendRows.filter((r) => r.leadCode === 'L45');

  const bebanRows = wstb.filter((r) => r.groupAkun === 'BEBAN');
  const hppRows = bebanRows.filter(
    (r) => r.leadCode === 'L39' || r.kelompokAkun.toLowerCase().includes('pokok')
  );
  const pajakRows = bebanRows.filter(
    (r) =>
      r.kelompokAkun.toLowerCase().includes('pajak') ||
      r.namaAkun.toLowerCase().includes('pajak penghasilan') ||
      r.namaAkun.toLowerCase().includes('pph badan')
  );
  const nonOpsBebanRows = bebanRows.filter(
    (r) =>
      !hppRows.includes(r) &&
      !pajakRows.includes(r) &&
      (r.kelompokAkun.toLowerCase().includes('non-operasional') || r.leadCode === 'L46' || r.leadCode === 'L47')
  );
  const opsBebanRows = bebanRows.filter(
    (r) => !hppRows.includes(r) && !pajakRows.includes(r) && !nonOpsBebanRows.includes(r)
  );

  const pendapatanBersih = sumCurr(pendUsahaRows);
  const priorPendapatanBersih = sumPrior(pendUsahaRows);
  const totalHpp = sumCurr(hppRows);
  const priorTotalHpp = sumPrior(hppRows);
  const labaBruto = pendapatanBersih - totalHpp;
  const priorLabaBruto = priorPendapatanBersih - priorTotalHpp;

  const totalBebanOperasional = sumCurr(opsBebanRows);
  const priorTotalBebanOperasional = sumPrior(opsBebanRows);
  const labaUsaha = labaBruto - totalBebanOperasional;
  const priorLabaUsaha = priorLabaBruto - priorTotalBebanOperasional;

  const pendapatanBebanLainBersih = sumCurr(pendLainRows) - sumCurr(nonOpsBebanRows);
  const priorPendapatanBebanLainBersih = sumPrior(pendLainRows) - sumPrior(nonOpsBebanRows);
  const labaSebelumPajak = labaUsaha + pendapatanBebanLainBersih;
  const priorLabaSebelumPajak = priorLabaUsaha + priorPendapatanBebanLainBersih;

  const bebanPajak = sumCurr(pajakRows);
  const priorBebanPajak = sumPrior(pajakRows);
  const labaBersih = labaSebelumPajak - bebanPajak;
  const priorLabaBersih = priorLabaSebelumPajak - priorBebanPajak;

  const ociTahunBerjalan = sumCurr(ociRows);
  const priorOciTahunBerjalan = sumPrior(ociRows);
  const totalPenghasilanKomprehensif = labaBersih + ociTahunBerjalan;
  const priorTotalPenghasilanKomprehensif = priorLabaBersih + priorOciTahunBerjalan;

  // Neraca
  const totalAsetLancar = sumCurr(asetLancarRows);
  const priorTotalAsetLancar = sumPrior(asetLancarRows);
  const totalAsetTidakLancar = sumCurr(asetTidakLancarRows);
  const priorTotalAsetTidakLancar = sumPrior(asetTidakLancarRows);
  const totalAset = totalAsetLancar + totalAsetTidakLancar;
  const priorTotalAset = priorTotalAsetLancar + priorTotalAsetTidakLancar;

  const totalLiabilitasPendek = sumCurr(liabPendekRows);
  const priorTotalLiabilitasPendek = sumPrior(liabPendekRows);
  const totalLiabilitasPanjang = sumCurr(liabPanjangRows);
  const priorTotalLiabilitasPanjang = sumPrior(liabPanjangRows);
  const totalLiabilitas = totalLiabilitasPendek + totalLiabilitasPanjang;
  const priorTotalLiabilitas = priorTotalLiabilitasPendek + priorTotalLiabilitasPanjang;

  const ekuitasLines: FsStatementLine[] = [
    ...groupByHeaderOrAccount(ekuitasRows),
    {
      key: 'calc-laba-tahun-berjalan',
      label: 'Laba (Rugi) Tahun Berjalan (Otomatis dari L/R)',
      leadCode: 'L35',
      current: labaBersih,
      prior: priorLabaBersih,
    },
    ...(ociTahunBerjalan !== 0 || priorOciTahunBerjalan !== 0
      ? [
          {
            key: 'calc-oci',
            label: 'Penghasilan Komprehensif Lain (OCI)',
            leadCode: 'L36',
            current: ociTahunBerjalan,
            prior: priorOciTahunBerjalan,
          },
        ]
      : []),
  ];

  const totalEkuitas = sumCurr(ekuitasRows) + labaBersih + ociTahunBerjalan;
  const priorTotalEkuitas = sumPrior(ekuitasRows) + priorLabaBersih + priorOciTahunBerjalan;

  const totalLiabilitasDanEkuitas = totalLiabilitas + totalEkuitas;
  const priorTotalLiabilitasDanEkuitas = priorTotalLiabilitas + priorTotalEkuitas;

  const selisihNeraca = totalAset - totalLiabilitasDanEkuitas;
  const priorSelisihNeraca = priorTotalAset - priorTotalLiabilitasDanEkuitas;
  const isNeracaBalanced = Math.abs(selisihNeraca) < 0.01;

  // Perubahan Ekuitas
  const modalRows = ekuitasRows.filter((r) => r.leadCode === 'L32' || r.leadCode === 'L33');
  const reRows = ekuitasRows.filter((r) => r.leadCode !== 'L32' && r.leadCode !== 'L33');
  const modalAwal = sumPrior(modalRows);
  const modalAkhir = sumCurr(modalRows);
  const penambahanModal = modalAkhir - modalAwal;
  const saldoLabaAwal = sumPrior(reRows) + priorLabaBersih;
  const saldoLabaCurrentBeforeClosing = sumCurr(reRows);
  const dividenAtauPenyesuaian = saldoLabaCurrentBeforeClosing - saldoLabaAwal;
  const saldoLabaAkhir = saldoLabaCurrentBeforeClosing + labaBersih;
  const totalEkuitasAwal = modalAwal + saldoLabaAwal + priorOciTahunBerjalan;
  const totalEkuitasAkhir = modalAkhir + saldoLabaAkhir + ociTahunBerjalan;

  // Arus Kas (Metode Tidak Langsung)
  const kasLeads = new Set(['L02', 'L03']);
  const piutangLeads = new Set(['L05']);
  const persediaanLeads = new Set(['L06']);
  const akumPenyusutanLeads = new Set(['L14']);
  const asetTetapInvestLeads = new Set(['L12', 'L13', 'L15', 'L16']);
  const utangPembiayaanLeads = new Set(['L20', 'L28', 'L29', 'L30']);

  const sumGroupLeadCurr = (set: Set<string>) =>
    wstb.filter((r) => set.has(r.leadCode)).reduce((s, r) => s + r.signedAudited, 0);
  const sumGroupLeadPrior = (set: Set<string>) =>
    wstb.filter((r) => set.has(r.leadCode)).reduce((s, r) => s + r.priorAudited, 0);

  const kasAwal = sumGroupLeadPrior(kasLeads);
  const kasAkhirNeraca = sumGroupLeadCurr(kasLeads);

  // Kenaikan akumulasi penyusutan (signedAudited negatif karena kontra-aset)
  const penyesuaianPenyusutan =
    Math.abs(sumGroupLeadCurr(akumPenyusutanLeads)) -
    Math.abs(sumGroupLeadPrior(akumPenyusutanLeads));

  const perubahanPiutang = -(sumGroupLeadCurr(piutangLeads) - sumGroupLeadPrior(piutangLeads));
  const perubahanPersediaan = -(sumGroupLeadCurr(persediaanLeads) - sumGroupLeadPrior(persediaanLeads));

  const asetLancarLainRows = asetLancarRows.filter(
    (r) => !kasLeads.has(r.leadCode) && !piutangLeads.has(r.leadCode) && !persediaanLeads.has(r.leadCode)
  );
  const perubahanAsetLancarLain = -(sumCurr(asetLancarLainRows) - sumPrior(asetLancarLainRows));

  const liabOperasiRows = [...liabPendekRows, ...liabPanjangRows].filter(
    (r) => !utangPembiayaanLeads.has(r.leadCode)
  );
  const perubahanLiabilitasOperasi = sumCurr(liabOperasiRows) - sumPrior(liabOperasiRows);

  const arusKasOperasi =
    labaBersih +
    penyesuaianPenyusutan +
    perubahanPiutang +
    perubahanPersediaan +
    perubahanAsetLancarLain +
    perubahanLiabilitasOperasi;

  const perolehanAsetTetapDanInvestasi = -(
    sumGroupLeadCurr(asetTetapInvestLeads) - sumGroupLeadPrior(asetTetapInvestLeads)
  );
  const arusKasInvestasi = perolehanAsetTetapDanInvestasi;

  const perubahanUtangPembiayaan =
    sumGroupLeadCurr(utangPembiayaanLeads) - sumGroupLeadPrior(utangPembiayaanLeads);
  const perubahanModalDanDividen = penambahanModal + dividenAtauPenyesuaian + ociTahunBerjalan;
  const arusKasPendanaan = perubahanUtangPembiayaan + perubahanModalDanDividen;

  const kenaikanBersihKas = arusKasOperasi + arusKasInvestasi + arusKasPendanaan;
  const kasAkhirDihitung = kasAwal + kenaikanBersihKas;
  const selisihKas = kasAkhirNeraca - kasAkhirDihitung;

  return {
    neraca: {
      asetLancarLines: groupByHeaderOrAccount(asetLancarRows),
      asetTidakLancarLines: groupByHeaderOrAccount(asetTidakLancarRows),
      totalAsetLancar,
      priorTotalAsetLancar,
      totalAsetTidakLancar,
      priorTotalAsetTidakLancar,
      totalAset,
      priorTotalAset,
      liabilitasPendekLines: groupByHeaderOrAccount(liabPendekRows),
      liabilitasPanjangLines: groupByHeaderOrAccount(liabPanjangRows),
      totalLiabilitasPendek,
      priorTotalLiabilitasPendek,
      totalLiabilitasPanjang,
      priorTotalLiabilitasPanjang,
      totalLiabilitas,
      priorTotalLiabilitas,
      ekuitasLines,
      totalEkuitas,
      priorTotalEkuitas,
      totalLiabilitasDanEkuitas,
      priorTotalLiabilitasDanEkuitas,
      selisihNeraca,
      priorSelisihNeraca,
      isNeracaBalanced,
    },
    labaRugi: {
      pendapatanLines: groupByHeaderOrAccount(pendUsahaRows),
      hppLines: groupByHeaderOrAccount(hppRows),
      bebanOpsLines: groupByHeaderOrAccount(opsBebanRows),
      nonOpsLines: [
        ...groupByHeaderOrAccount(pendLainRows),
        ...groupByHeaderOrAccount(nonOpsBebanRows, -1),
      ],
      pajakLines: groupByHeaderOrAccount(pajakRows),
      ociLines: groupByHeaderOrAccount(ociRows),
      pendapatanBersih,
      priorPendapatanBersih,
      totalHpp,
      priorTotalHpp,
      labaBruto,
      priorLabaBruto,
      totalBebanOperasional,
      priorTotalBebanOperasional,
      labaUsaha,
      priorLabaUsaha,
      pendapatanBebanLainBersih,
      priorPendapatanBebanLainBersih,
      labaSebelumPajak,
      priorLabaSebelumPajak,
      bebanPajak,
      priorBebanPajak,
      labaBersih,
      priorLabaBersih,
      ociTahunBerjalan,
      priorOciTahunBerjalan,
      totalPenghasilanKomprehensif,
      priorTotalPenghasilanKomprehensif,
    },
    perubahanEkuitas: {
      modalAwal,
      penambahanModal,
      modalAkhir,
      saldoLabaAwal,
      labaBersihBerjalan: labaBersih,
      dividenAtauPenyesuaian,
      saldoLabaAkhir,
      ociAkhir: ociTahunBerjalan,
      totalEkuitasAwal,
      totalEkuitasAkhir,
    },
    arusKas: {
      labaBersih,
      penyesuaianPenyusutan,
      perubahanPiutang,
      perubahanPersediaan,
      perubahanAsetLancarLain,
      perubahanLiabilitasOperasi,
      arusKasOperasi,
      perolehanAsetTetapDanInvestasi,
      arusKasInvestasi,
      perubahanUtangPembiayaan,
      perubahanModalDanDividen,
      arusKasPendanaan,
      kenaikanBersihKas,
      kasAwal,
      kasAkhirDihitung,
      kasAkhirNeraca,
      selisihKas,
    },
  };
}

// ============================================================================
// 5. SIGN-OFF GATES MODUL B CORE (NERACA BALANCED, SA 570, SA 580)
// ============================================================================

export function canSignOffWstbOrFsReviewed(
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[]
): { allowed: boolean; reason?: string } {
  if (trialBalance.length === 0) {
    return {
      allowed: false,
      reason: 'Sign-Off Reviewed ditolak: Trial Balance (B100) belum memiliki data akun.',
    };
  }
  const fs = computeFinancialStatements(trialBalance, journals);
  if (!fs.neraca.isNeracaBalanced) {
    return {
      allowed: false,
      reason: `Sign-Off Reviewed ditolak: Neraca belum seimbang (Selisih Rp ${Math.round(fs.neraca.selisihNeraca).toLocaleString('en-US')}). Perbaiki TB atau Jurnal AJE/RJE terlebih dahulu.`,
    };
  }
  return { allowed: true };
}

export function canSignOffB240Prepared(
  b240: SpecialProceduresData['b240']
): { allowed: boolean; reason?: string } {
  const hasDoubt =
    b240.indikatorKeuanganBuruk ||
    b240.indikatorOperasionalBuruk ||
    b240.simpulan.startsWith('Terdapat keraguan signifikan');
  if (hasDoubt && b240.evaluasiRencanaManajemen.trim().length < 20) {
    return {
      allowed: false,
      reason:
        'SA 570: Terdapat indikator/keraguan kelangsungan usaha. Wajib isi Evaluasi Rencana Mitigasi Manajemen minimal 20 karakter sebelum Sign-Off Prepared.',
    };
  }
  return { allowed: true };
}

export function canSignOffB250Prepared(
  b250: SpecialProceduresData['b250'],
  header: EngagementHeader
): { allowed: boolean; reason?: string } {
  if (!b250.tanggalSuratRepresentasi) {
    return {
      allowed: false,
      reason: 'Validasi Wajib SA 580: Tanggal Surat Representasi Manajemen belum diisi.',
    };
  }
  if (b250.tanggalSuratRepresentasi !== header.tanggalLaporanAuditor) {
    return {
      allowed: false,
      reason: `Validasi Wajib SA 580: Tanggal Surat Representasi (${b250.tanggalSuratRepresentasi}) harus sama persis dengan Tanggal Laporan Auditor Independen (${header.tanggalLaporanAuditor}).`,
    };
  }
  return { allowed: true };
}
