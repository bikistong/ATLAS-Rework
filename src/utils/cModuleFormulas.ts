import { OPINION_TEMPLATES, SAK_AU_CODES } from '../data/cModuleCatalog';
import {
  AccountingFramework,
  AuditJournalEntry,
  ClientEntity,
  EngagementWorkspaceData,
  ModuleCData,
  OpinionCode,
  TrialBalanceAccount,
} from '../types/atlas';
import {
  A220AnalyticalRow,
  A220RatioItem,
  computeA220FinancialRatios,
  computeA220HorizontalVertical,
  computeBenchmarkValueFromTrialBalance,
  computeFinancialAggregates,
} from './a2Formulas';
import { toRomanMonth } from './formatters';

// ============================================================================
// 1. C110 — FINAL MATERIALITY & SA 320.12 GATE
// ============================================================================

export interface FinalMaterialityEvaluation {
  acuanSaldo: string;
  saldoAcuanAwal: number;
  saldoAcuanAudited: number;
  omAwal: number;
  pmAwal: number;
  amptAwal: number;
  omFinal: number;
  pmFinal: number;
  amptFinal: number;
  deltaOm: number;
  deltaPm: number;
  isOmLowered: boolean;
  isPmLowered: boolean;
  isMaterialityLowered: boolean;
  requiresJustification: boolean;
}

export function computeFinalMateriality(ws: EngagementWorkspaceData): FinalMaterialityEvaluation {
  const saldoAcuanAudited = computeBenchmarkValueFromTrialBalance(
    ws.trialBalance,
    ws.a210.acuanSaldo,
    ws.journals,
    ws.a210.customBenchmarkValue
  );
  const { marginOmPersen, marginPmPersen, marginAmptPersen } = ws.moduleC.c110FinalMateriality;
  const omFinal = Math.round(saldoAcuanAudited * (marginOmPersen / 100));
  const pmFinal = Math.round(omFinal * (marginPmPersen / 100));
  const amptFinal = Math.round(pmFinal * (marginAmptPersen / 100));

  const omAwal = ws.a210.nilaiOm;
  const pmAwal = ws.a210.nilaiPm;
  const amptAwal = ws.a210.nilaiAmpt;

  const isOmLowered = omFinal < omAwal;
  const isPmLowered = pmFinal < pmAwal;
  const isMaterialityLowered = isOmLowered || isPmLowered;

  return {
    acuanSaldo: ws.a210.acuanSaldo,
    saldoAcuanAwal: ws.a210.nilaiSaldoAcuan,
    saldoAcuanAudited,
    omAwal,
    pmAwal,
    amptAwal,
    omFinal,
    pmFinal,
    amptFinal,
    deltaOm: omFinal - omAwal,
    deltaPm: pmFinal - pmAwal,
    isOmLowered,
    isPmLowered,
    isMaterialityLowered,
    requiresJustification: isMaterialityLowered,
  };
}

export function canSignOffC110Prepared(ws: EngagementWorkspaceData): {
  allowed: boolean;
  reason?: string;
} {
  const evalResult = computeFinalMateriality(ws);
  if (
    evalResult.isMaterialityLowered &&
    ws.moduleC.c110FinalMateriality.auditorJustification.trim().length < 20
  ) {
    return {
      allowed: false,
      reason:
        'SA 320.12: Materialitas Final lebih rendah dari A210. Wajib mengisi justifikasi tertulis (minimal 20 karakter) sebelum Prepared.',
    };
  }
  return { allowed: true };
}

// ============================================================================
// 2. C100 — SUMMARY OF UNADJUSTED DIFFERENCES (SAD - SA 450)
// ============================================================================

export interface ClassifiedSadItem {
  id: string;
  sourceKkp: string;
  description: string;
  type: 'Factual' | 'Projected' | 'Judgmental';
  amount: number;
  isClearlyTrivial: boolean;
}

export interface SadAggregationSummary {
  items: ClassifiedSadItem[];
  trivialItemsCount: number;
  accumulatedItemsCount: number;
  totalFactual: number;
  totalProjected: number;
  totalJudgmental: number;
  totalAccumulatedSad: number;
  totalAbsAccumulatedSad: number;
  isSadMaterialVsPm: boolean;
}

export function evaluateSadAggregation(
  items: ModuleCData['c100SadItems'],
  pmFinal: number,
  amptFinal: number
): SadAggregationSummary {
  const classified: ClassifiedSadItem[] = items.map((item) => ({
    ...item,
    isClearlyTrivial: amptFinal > 0 && Math.abs(item.amount) < amptFinal,
  }));

  const accumulated = classified.filter((i) => !i.isClearlyTrivial);
  const trivial = classified.filter((i) => i.isClearlyTrivial);

  const sumByType = (t: ClassifiedSadItem['type']) =>
    accumulated.filter((i) => i.type === t).reduce((s, i) => s + i.amount, 0);

  const totalFactual = sumByType('Factual');
  const totalProjected = sumByType('Projected');
  const totalJudgmental = sumByType('Judgmental');
  const totalAccumulatedSad = accumulated.reduce((s, i) => s + i.amount, 0);
  const totalAbsAccumulatedSad = accumulated.reduce((s, i) => s + Math.abs(i.amount), 0);

  const isSadMaterialVsPm =
    pmFinal > 0 &&
    (Math.abs(totalAccumulatedSad) >= pmFinal || totalAbsAccumulatedSad >= pmFinal);

  return {
    items: classified,
    trivialItemsCount: trivial.length,
    accumulatedItemsCount: accumulated.length,
    totalFactual,
    totalProjected,
    totalJudgmental,
    totalAccumulatedSad,
    totalAbsAccumulatedSad,
    isSadMaterialVsPm,
  };
}

// ============================================================================
// 3. C120 — FINAL ANALYTICAL PROCEDURES (C120.1, C120.2 14 RASIO, CHART1)
// ============================================================================

export interface C120HorizontalRow extends A220AnalyticalRow {
  needsExplanation: boolean;
}

export function computeC120HorizontalAnalysis(
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[],
  pmFinal: number
): C120HorizontalRow[] {
  const base = computeA220HorizontalVertical(trialBalance, journals, pmFinal);
  return base.map((row) => {
    const absDelta = Math.abs(row.perubahanNominal);
    const absPct = row.perubahanPersen !== null ? Math.abs(row.perubahanPersen) : 0;
    const needsExplanation =
      (pmFinal > 0 && absDelta >= pmFinal) || absPct > 20;
    return {
      ...row,
      isFluktuasiSignifikan: needsExplanation,
      needsExplanation,
    };
  });
}

export function computeC120FourteenRatios(
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[]
): A220RatioItem[] {
  const base13 = computeA220FinancialRatios(trialBalance, journals);
  const c = computeFinancialAggregates(trialBalance, journals, 'current');
  const p = computeFinancialAggregates(trialBalance, [], 'prior');

  const currWc = c.asetLancar - c.liabilitasJangkaPendek;
  const prevWc = p.asetLancar - p.liabilitasJangkaPendek;
  const currWct = currWc !== 0 ? c.pendapatan / currWc : null;
  const prevWct = prevWc !== 0 ? p.pendapatan / prevWc : null;

  const ratio14: A220RatioItem = {
    id: 'act-wct',
    kelompok: 'Aktivitas',
    namaRasio: 'Working Capital Turnover (C120.2)',
    rumus: 'Pendapatan / (Aset Lancar - Liabilitas Jk. Pendek)',
    satuan: 'x',
    nilaiBerjalan: currWct,
    nilaiLalu: prevWct,
    delta: currWct !== null && prevWct !== null ? currWct - prevWct : null,
    interpretasi:
      'Efisiensi perputaran modal kerja bersih dalam mendukung pencapaian penjualan final.',
  };

  return [...base13, ratio14];
}

export interface C120ChartBundle {
  positionChart: {
    pos: string;
    audited: number;
    prior: number;
  }[];
  performanceChart: {
    pos: string;
    audited: number;
    prior: number;
  }[];
  ratioComparisonChart: {
    name: string;
    audited: number;
    prior: number;
  }[];
}

export function computeChartDataForC120(
  trialBalance: TrialBalanceAccount[],
  journals: AuditJournalEntry[]
): C120ChartBundle {
  const c = computeFinancialAggregates(trialBalance, journals, 'current');
  const p = computeFinancialAggregates(trialBalance, [], 'prior');
  const ratios = computeC120FourteenRatios(trialBalance, journals);

  const toMillions = (v: number) => Math.round((v / 1_000_000) * 100) / 100;

  return {
    positionChart: [
      { pos: 'Aset Lancar', audited: toMillions(c.asetLancar), prior: toMillions(p.asetLancar) },
      { pos: 'Aset Tdk Lancar', audited: toMillions(c.asetTidakLancar), prior: toMillions(p.asetTidakLancar) },
      { pos: 'Total Liabilitas', audited: toMillions(c.totalLiabilitas), prior: toMillions(p.totalLiabilitas) },
      { pos: 'Total Ekuitas', audited: toMillions(c.totalEkuitas), prior: toMillions(p.totalEkuitas) },
    ],
    performanceChart: [
      { pos: 'Pendapatan', audited: toMillions(c.pendapatan), prior: toMillions(p.pendapatan) },
      { pos: 'HPP', audited: toMillions(c.hpp), prior: toMillions(p.hpp) },
      { pos: 'Beban Ops', audited: toMillions(c.bebanOperasional), prior: toMillions(p.bebanOperasional) },
      { pos: 'Laba Bersih', audited: toMillions(c.labaBersih), prior: toMillions(p.labaBersih) },
    ],
    ratioComparisonChart: ratios
      .filter((r) => ['liq-current', 'sol-der', 'prof-gpm', 'prof-npm', 'prof-roe', 'act-tato'].includes(r.id))
      .map((r) => ({
        name: r.namaRasio.replace(/\s*\(.*?\)/g, ''),
        audited: Number((r.nilaiBerjalan ?? 0).toFixed(2)),
        prior: Number((r.nilaiLalu ?? 0).toFixed(2)),
      })),
  };
}

// ============================================================================
// 4. C230 — 12-PILAR AUDIT FINAL MEMORANDUM AUTO-SUMMARY
// ============================================================================

export interface C230PillarDescriptor {
  key: keyof ModuleCData['c230Memorandum'];
  number: number;
  title: string;
  sourceRef: string;
  autoSummary: string;
}

export function buildC230TwelvePillars(ws: EngagementWorkspaceData): C230PillarDescriptor[] {
  const matEval = computeFinalMateriality(ws);
  const sadEval = evaluateSadAggregation(
    ws.moduleC.c100SadItems,
    matEval.pmFinal,
    matEval.amptFinal
  );

  const a230Fraud = ws.a230Items.find((i) => i.kodeSubIndeks === 'A230.7');
  const a230Legal = ws.a230Items.find((i) => i.kodeSubIndeks === 'A230.4');
  const highCrCycles = ws.a250Cycles.filter((c) => c.controlRiskLevel === 'High').length;
  const horizontalFlagged = computeC120HorizontalAnalysis(
    ws.trialBalance,
    ws.journals,
    matEval.pmFinal
  ).filter((r) => r.needsExplanation).length;
  const opinionMeta = OPINION_TEMPLATES[ws.moduleC.c400Opinion.selectedOpinion];

  return [
    {
      key: 'fraudEvaluation',
      number: 1,
      title: 'Evaluasi Risiko Kecurangan (Fraud SA 240)',
      sourceRef: 'A230.7',
      autoSummary: `Status risiko kecurangan pada A230.7: ${a230Fraud?.hasilAnalisis ?? 'Tidak'}. ${a230Fraud?.penjelasanAuditor || 'Tidak ditemukan indikasi fraud manajemen material.'}`,
    },
    {
      key: 'complianceEvaluation',
      number: 2,
      title: 'Kepatuhan Peraturan & Perundang-Undangan (SA 250)',
      sourceRef: 'A230.4',
      autoSummary: `Evaluasi kepatuhan regulasi/perpajakan pada A230.4 menunjukkan tingkat risiko ${a230Legal?.hasilAnalisis ?? 'Rendah'}.`,
    },
    {
      key: 'relatedPartiesEvaluation',
      number: 3,
      title: 'Transaksi dengan Pihak Berelasi (SA 550)',
      sourceRef: 'B220',
      autoSummary: `Tercatat ${ws.specialProcedures.b220.registers.length} entri pihak berelasi. Simpulan B220: ${ws.specialProcedures.b220.simpulan}.`,
    },
    {
      key: 'litigationEvaluation',
      number: 4,
      title: 'Peristiwa Kemudian & Perkara Hukum (SA 560)',
      sourceRef: 'B230',
      autoSummary: `Tipe peristiwa kemudian B230: ${ws.specialProcedures.b230.tipePeristiwa}. Simpulan: ${ws.specialProcedures.b230.simpulan}.`,
    },
    {
      key: 'goingConcernEvaluation',
      number: 5,
      title: 'Kelangsungan Usaha / Going Concern (SA 570)',
      sourceRef: 'B240',
      autoSummary: `Simpulan B240: ${ws.specialProcedures.b240.simpulan}. Periode asesmen proyeksi ${ws.specialProcedures.b240.periodeProyeksiBulan} bulan.`,
    },
    {
      key: 'specialistEvaluation',
      number: 6,
      title: 'Penggunaan Pekerjaan Pakar Auditor & Manajemen (SA 620 / 500)',
      sourceRef: 'B260 · B270',
      autoSummary: `Pakar Auditor (B260): ${ws.specialProcedures.b260.isUsed ? ws.specialProcedures.b260.namaPakar || 'Digunakan' : 'Tidak digunakan'}. Pakar Manajemen (B270): ${ws.specialProcedures.b270.isUsed ? ws.specialProcedures.b270.namaPakar || 'Digunakan' : 'Tidak digunakan'}.`,
    },
    {
      key: 'contingenciesEvaluation',
      number: 7,
      title: 'Komitmen, Kontinjensi & Klaim Hukum',
      sourceRef: 'B280',
      autoSummary: `Simpulan B280: ${ws.specialProcedures.b280.simpulan}.`,
    },
    {
      key: 'icDeficiencies',
      number: 8,
      title: 'Defisiensi Signifikan Pengendalian Internal (SA 265)',
      sourceRef: 'A250 · A260',
      autoSummary: `Dari 13 siklus A250, terdapat ${highCrCycles} siklus dengan Control Risk High. Simpulan TCWG (A260): ${ws.a260.simpulanTcwg}.`,
    },
    {
      key: 'finalMaterialitySummary',
      number: 9,
      title: 'Materialitas Akhir & Re-evaluasi SA 320.12',
      sourceRef: 'C110',
      autoSummary: `OM Final Rp ${Math.round(matEval.omFinal).toLocaleString('en-US')}, PM Final Rp ${Math.round(matEval.pmFinal).toLocaleString('en-US')}, AMPT Final Rp ${Math.round(matEval.amptFinal).toLocaleString('en-US')}. Status penurunan: ${matEval.isMaterialityLowered ? 'Ya (Perlu Justifikasi)' : 'Tidak turun'}.`,
    },
    {
      key: 'sadSummary',
      number: 10,
      title: 'Ikhtisar Salah Saji Belum Dikoreksi (SAD - SA 450)',
      sourceRef: 'C100',
      autoSummary: `Terdapat ${sadEval.accumulatedItemsCount} item SAD terakumulasi (net Rp ${Math.round(sadEval.totalAccumulatedSad).toLocaleString('en-US')}) dan ${sadEval.trivialItemsCount} item Clearly Trivial. Status vs PM Final: ${sadEval.isSadMaterialVsPm ? 'MATERIAL' : 'Tidak Material'}.`,
    },
    {
      key: 'finalAnalyticsSummary',
      number: 11,
      title: 'Hasil Prosedur Analitis Akhir (SA 520)',
      sourceRef: 'C120',
      autoSummary: `Teridentifikasi ${horizontalFlagged} akun dengan fluktuasi signifikan (>= PM Final atau > 20%) pada laporan keuangan final.`,
    },
    {
      key: 'opinionRecommendationSummary',
      number: 12,
      title: 'Rekomendasi Opini Auditor Independen',
      sourceRef: 'C400',
      autoSummary: `Opini dipilih: ${opinionMeta.code} — ${opinionMeta.titleId} (${opinionMeta.saRef}).`,
    },
  ];
}

// ============================================================================
// 5. C300 — GERBANG PENGAMAN PARTNER EQCR (SA 220)
// ============================================================================

export interface EqcrGateEvaluation {
  isRequired: boolean;
  c300Status: string;
  hasReviewerAssigned: boolean;
  pendingFindingsCount: number;
  checklistCompletedCount: number;
  isEqcrApproved: boolean;
  canIssueLai: boolean;
  blockedReasons: string[];
}

export function evaluateEqcrGate(
  ws: EngagementWorkspaceData,
  client?: ClientEntity | null
): EqcrGateEvaluation {
  const isRequired =
    Boolean(ws.a120.isEqcrRequired) || client?.statusKepemilikan === 'Swasta - Go Publik';
  const c300Status = ws.workingPapers['C300']?.status ?? 'Kosong';
  const hasReviewerAssigned = Boolean(ws.moduleC.c300Eqcr.eqcrReviewerId);
  const pendingFindingsCount = ws.moduleC.c300Eqcr.findings.filter(
    (f) => f.status === 'Pending'
  ).length;
  const checklistCompletedCount = ws.moduleC.c300Eqcr.checklist.filter(Boolean).length;
  const isStatusApproved = c300Status === 'Reviewed' || c300Status === 'Locked';
  const isEqcrApproved = isStatusApproved && pendingFindingsCount === 0 && hasReviewerAssigned;

  const blockedReasons: string[] = [];
  if (isRequired) {
    if (!hasReviewerAssigned) {
      blockedReasons.push('Partner EQCR independen pada C300 belum ditunjuk.');
    }
    if (pendingFindingsCount > 0) {
      blockedReasons.push(
        `Masih terdapat ${pendingFindingsCount} temuan EQCR berstatus Pending pada C300.`
      );
    }
    if (!isStatusApproved) {
      blockedReasons.push(`KKP C300 masih berstatus "${c300Status}" (wajib Reviewed/Locked).`);
    }
  }

  return {
    isRequired,
    c300Status,
    hasReviewerAssigned,
    pendingFindingsCount,
    checklistCompletedCount,
    isEqcrApproved,
    canIssueLai: !isRequired || blockedReasons.length === 0,
    blockedReasons,
  };
}

// ============================================================================
// 6. C400 — MATRIKS KEPUTUSAN 5 OPINI & PENOMORAN LAI RESMI
// ============================================================================

/**
 * PRD 5 Bagian 6.1 Matriks Keputusan 5 Opini:
 * - (T, F, F) -> OPINI1 (WTP)
 * - (T, T, F) -> OPINI2 (WDP - Salah Saji Material)
 * - (F, T, F) -> OPINI3 (WDP - Pembatasan Lingkup)
 * - (T, T, T) -> OPINI4 (Tidak Wajar / Adverse)
 * - (F, T, T) -> OPINI5 (Tidak Menyatakan Pendapat / Disclaimer)
 * - (F, F, F) -> OPINI1 (WTP)
 */
export function determineSuggestedOpinion(
  q1EvidenceSufficient: boolean,
  q2MaterialMisstatement: boolean,
  q3ImpactPervasive: boolean
): OpinionCode {
  if (!q2MaterialMisstatement) {
    if (!q1EvidenceSufficient && q3ImpactPervasive) return 'OPINI5';
    return 'OPINI1';
  }
  if (q1EvidenceSufficient && !q3ImpactPervasive) return 'OPINI2';
  if (!q1EvidenceSufficient && !q3ImpactPervasive) return 'OPINI3';
  if (q1EvidenceSufficient && q3ImpactPervasive) return 'OPINI4';
  return 'OPINI5';
}

export function formatOfficialLaiNumber(params: {
  reportSequenceNumber: string;
  sak: AccountingFramework;
  branchCode: string;
  tanggalLaporanAuditor: string;
}): string {
  const seq = (params.reportSequenceNumber || '00001').trim().padStart(5, '0');
  const auCode = SAK_AU_CODES[params.sak] ?? 'AU-06';
  const branch = (params.branchCode || '01').trim().padStart(2, '0');
  const dateObj = new Date(params.tanggalLaporanAuditor);
  const validDate = !Number.isNaN(dateObj.getTime());
  const romanMonth = validDate ? toRomanMonth(dateObj.getUTCMonth() + 1) : 'III';
  const year = validDate ? dateObj.getUTCFullYear() : new Date().getFullYear();

  return `${seq} / ${auCode} / ${branch} / ${romanMonth} / ${year}`;
}

export function validateC400BeforeIssue(
  ws: EngagementWorkspaceData,
  client?: ClientEntity | null
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const eqcr = evaluateEqcrGate(ws, client);
  if (!eqcr.canIssueLai) {
    reasons.push(...eqcr.blockedReasons);
  }

  const c400 = ws.moduleC.c400Opinion;
  if (
    c400.selectedOpinion !== c400.suggestedOpinion &&
    c400.overrideJustification.trim().length < 20
  ) {
    reasons.push(
      'Opini yang dipilih berbeda dari rekomendasi sistem — wajib mengisi Justifikasi Override (min. 20 karakter).'
    );
  }

  if (
    OPINION_TEMPLATES[c400.selectedOpinion].requiresModificationBasis &&
    c400.basisForModificationText.trim().length < 20
  ) {
    reasons.push(
      `Opini ${c400.selectedOpinion} memerlukan uraian Paragraf Basis untuk Modifikasi Opini (min. 20 karakter).`
    );
  }

  if (!c400.signingPartnerId) {
    reasons.push('Akuntan Publik (Partner) penandatangan LAI wajib dipilih.');
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}
