import {
  A270RommRow,
  AuditSampleItem,
  EngagementWorkspaceData,
  RiskLevel,
  SapAssuranceLevel,
  TrialBalanceAccount,
} from '../types/atlas';
import { Wstb12Row, computeWstb12Columns } from './bCoreFormulas';

export interface ConfidenceFactorBand {
  rommLevel: RiskLevel;
  sapAssurance: SapAssuranceLevel;
  min: number;
  max: number;
  defaultCf: number;
}

/**
 * PRD 4 Bagian 3.1: Matriks 9 Kombinasi Confidence Factor (CF) ISA SA 530
 */
export const CONFIDENCE_FACTOR_MATRIX: ConfidenceFactorBand[] = [
  { rommLevel: 'High', sapAssurance: 'High', min: 1.9, max: 2.3, defaultCf: 2.1 },
  { rommLevel: 'High', sapAssurance: 'Moderate', min: 2.3, max: 3.0, defaultCf: 2.6 },
  { rommLevel: 'High', sapAssurance: 'No', min: 3.0, max: 3.0, defaultCf: 3.0 },
  { rommLevel: 'Moderate', sapAssurance: 'High', min: 1.6, max: 1.9, defaultCf: 1.8 },
  { rommLevel: 'Moderate', sapAssurance: 'Moderate', min: 1.9, max: 2.3, defaultCf: 2.1 },
  { rommLevel: 'Moderate', sapAssurance: 'No', min: 2.3, max: 3.0, defaultCf: 2.6 },
  { rommLevel: 'Low', sapAssurance: 'High', min: 0.5, max: 1.21, defaultCf: 0.9 },
  { rommLevel: 'Low', sapAssurance: 'Moderate', min: 1.21, max: 1.4, defaultCf: 1.3 },
  { rommLevel: 'Low', sapAssurance: 'No', min: 1.4, max: 2.3, defaultCf: 1.8 },
];

export function getRecommendedConfidenceFactor(
  rommLevel: RiskLevel,
  sapAssurance: SapAssuranceLevel
): ConfidenceFactorBand {
  return (
    CONFIDENCE_FACTOR_MATRIX.find(
      (b) => b.rommLevel === rommLevel && b.sapAssurance === sapAssurance
    ) ?? CONFIDENCE_FACTOR_MATRIX[5]
  );
}

export interface SamplingMetricsResult {
  samplingInterval: number;
  testedPopulationValue: number;
  calculatedSampleSize: number;
}

export function computeSamplingMetrics(params: {
  performanceMateriality: number;
  confidenceFactor: number;
  totalPopulationValue: number;
  specificItemsValue: number;
}): SamplingMetricsResult {
  const pm = Math.max(0, Number(params.performanceMateriality) || 0);
  const cf = Math.max(0, Number(params.confidenceFactor) || 0);
  const totalPop = Math.max(0, Number(params.totalPopulationValue) || 0);
  const specificVal = Math.max(0, Number(params.specificItemsValue) || 0);

  const samplingInterval = cf > 0 && pm > 0 ? pm / cf : 0;
  const testedPopulationValue = Math.max(0, totalPop - specificVal);
  const calculatedSampleSize =
    samplingInterval > 0 && testedPopulationValue > 0
      ? Math.ceil(testedPopulationValue / samplingInterval)
      : 0;

  return {
    samplingInterval,
    testedPopulationValue,
    calculatedSampleSize,
  };
}

export function computeSampleItemMisstatement(bookValue: number, auditedValue: number): number {
  return (Number(bookValue) || 0) - (Number(auditedValue) || 0);
}

export interface SamplingProjectionResult {
  sumBvs: number;
  sumAvs: number;
  factualMisstatementTotal: number;
  nTested: number;
  estimatedPopulationValue: number;
  ratioProjectedMisstatement: number;
  differenceProjectedMisstatement: number;
  selectedProjectedMisstatement: number;
  isMisstatementMaterial: boolean;
}

export function computeSamplingProjection(params: {
  totalPopulationValue: number;
  totalPopulationItems: number;
  performanceMateriality: number;
  projectionMethod: 'Ratio' | 'Difference';
  samples: Pick<AuditSampleItem, 'bookValue' | 'auditedValue'>[];
}): SamplingProjectionResult {
  const totalPop = Math.max(0, Number(params.totalPopulationValue) || 0);
  const totalN = Math.max(0, Number(params.totalPopulationItems) || 0);
  const pm = Math.max(0, Number(params.performanceMateriality) || 0);
  const nTested = params.samples.length;

  const sumBvs = params.samples.reduce((sum, s) => sum + (Number(s.bookValue) || 0), 0);
  const sumAvs = params.samples.reduce((sum, s) => sum + (Number(s.auditedValue) || 0), 0);
  const factualMisstatementTotal = sumBvs - sumAvs;

  const estimatedPopulationValue =
    sumBvs > 0 ? totalPop * (sumAvs / sumBvs) : totalPop;
  const ratioProjectedMisstatement =
    sumBvs > 0 ? totalPop - estimatedPopulationValue : 0;

  const avgError = nTested > 0 ? factualMisstatementTotal / nTested : 0;
  const differenceProjectedMisstatement = avgError * totalN;

  const selectedProjectedMisstatement =
    params.projectionMethod === 'Ratio'
      ? ratioProjectedMisstatement
      : differenceProjectedMisstatement;

  const isMisstatementMaterial =
    pm > 0 && Math.abs(selectedProjectedMisstatement) >= pm;

  return {
    sumBvs,
    sumAvs,
    factualMisstatementTotal,
    nTested,
    estimatedPopulationValue,
    ratioProjectedMisstatement,
    differenceProjectedMisstatement,
    selectedProjectedMisstatement,
    isMisstatementMaterial,
  };
}

export interface LeadScheduleAccountRow extends Wstb12Row {
  unauditedNet: number;
  ajeNet: number;
  rjeNet: number;
  auditedNet: number;
  varianceAmount: number;
  variancePercent: number | null;
}

export interface LeadScheduleContext {
  leadCode: string;
  accounts: LeadScheduleAccountRow[];
  totalUnaudited: number;
  totalAjeNet: number;
  totalRjeNet: number;
  totalAudited: number;
  totalPriorAudited: number;
  varianceAmount: number;
  variancePercent: number | null;
  rommRow: A270RommRow | null;
  rommLevel: RiskLevel;
  overallMateriality: number;
  performanceMateriality: number;
  ampt: number;
}

function signedAccountNet(
  acc: TrialBalanceAccount,
  debit: number,
  credit: number,
  normalBalance: 'DR' | 'CR'
): number {
  return normalBalance === 'DR' ? debit - credit : credit - debit;
}

export function buildLeadScheduleContext(
  ws: EngagementWorkspaceData,
  leadCode: string
): LeadScheduleContext {
  const leadMeta = ws.leadSchedules[leadCode];
  const normalBalance: 'DR' | 'CR' = leadMeta?.normalBalance ?? 'DR';

  const wstbAll = computeWstb12Columns(ws.trialBalance, ws.journals);
  const matchingAccounts = ws.trialBalance.filter((a) => a.leadCode === leadCode);
  const accMap = new Map(matchingAccounts.map((a) => [a.id, a]));

  const accounts: LeadScheduleAccountRow[] = wstbAll
    .filter((row) => row.leadCode === leadCode)
    .map((row) => {
      const tbAcc = accMap.get(row.accountId)!;
      const unauditedNet = signedAccountNet(
        tbAcc,
        tbAcc.unauditedDebit,
        tbAcc.unauditedCredit,
        normalBalance
      );
      const auditedNet = signedAccountNet(
        tbAcc,
        row.auditedDebit,
        row.auditedCredit,
        normalBalance
      );
      const ajeNet = signedAccountNet(tbAcc, row.ajeDebit, row.ajeCredit, normalBalance);
      const rjeNet = signedAccountNet(tbAcc, row.rjeDebit, row.rjeCredit, normalBalance);
      const priorNet = signedAccountNet(
        tbAcc,
        tbAcc.pembandingDebit,
        tbAcc.pembandingCredit,
        normalBalance
      );
      const varianceAmount = auditedNet - priorNet;
      const variancePercent =
        priorNet !== 0 ? (varianceAmount / Math.abs(priorNet)) * 100 : null;

      return {
        ...row,
        priorAudited: priorNet,
        unauditedNet,
        ajeNet,
        rjeNet,
        auditedNet,
        varianceAmount,
        variancePercent,
      };
    });

  const totalUnaudited = accounts.reduce((s, r) => s + r.unauditedNet, 0);
  const totalAjeNet = accounts.reduce((s, r) => s + r.ajeNet, 0);
  const totalRjeNet = accounts.reduce((s, r) => s + r.rjeNet, 0);
  const totalAudited = accounts.reduce((s, r) => s + r.auditedNet, 0);
  const totalPriorAudited = accounts.reduce((s, r) => s + r.priorAudited, 0);
  const varianceAmount = totalAudited - totalPriorAudited;
  const variancePercent =
    totalPriorAudited !== 0
      ? (varianceAmount / Math.abs(totalPriorAudited)) * 100
      : null;

  const rommRow = ws.a270Rows.find((r) => r.leadCode === leadCode) ?? null;

  return {
    leadCode,
    accounts,
    totalUnaudited,
    totalAjeNet,
    totalRjeNet,
    totalAudited,
    totalPriorAudited,
    varianceAmount,
    variancePercent,
    rommRow,
    rommLevel: rommRow?.overallRomm ?? 'Moderate',
    overallMateriality: ws.a210.nilaiOm,
    performanceMateriality: ws.a210.nilaiPm,
    ampt: ws.a210.nilaiAmpt,
  };
}
