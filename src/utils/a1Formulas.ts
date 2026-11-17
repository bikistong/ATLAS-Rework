import {
  A1101PriorIssues,
  A1102ManagementIntegrity,
  A1102_1AmlItem,
  A1103TeamEvaluation,
  A1105PredecessorComm,
  A110Evaluation,
  A150IndependenceDeclaration,
  BinaryRisk,
  ClientEntity,
  EngagementHeader,
  EngagementTeamMember,
  EngagementWorkspaceData,
} from '../types/atlas';
import { isIndexVisibleForWorkspace } from './formatters';

const HIGH_RISK_SECTORS = new Set<string>([
  'Sektor_Keuangan_Perbankan',
  'Sektor_Keuangan_Asuransi_dan_Dana_Pensiun',
  'Sektor_Keuangan_Lainnya',
]);

const HIGH_RISK_OWNERSHIP = new Set<string>(['Swasta - Go Publik', 'BUMN/BUMD']);

export function computeA1101Risk(a1101: A1101PriorIssues): BinaryRisk {
  const answers = [
    a1101.q1aKelangsunganCatatan,
    a1101.q1bKelangsunganOpini,
    a1101.q2Restrukturisasi,
    a1101.q3RugiBerlanjut,
    a1101.q4Restated,
    a1101.q5OpiniModifikasi,
  ];
  return answers.includes('Ya') ? 'High' : 'Low';
}

export function computeAmlHighRiskFlag(amlItems: A1102_1AmlItem[]): 'Ya' | 'Tidak' {
  return amlItems.some((item) => item.jawaban === 'Ya') ? 'Ya' : 'Tidak';
}

export function computeA1102Risk(
  a1102: A1102ManagementIntegrity,
  amlItems: A1102_1AmlItem[]
): BinaryRisk {
  const amlFlag = computeAmlHighRiskFlag(amlItems);
  const answers = [
    a1102.q1ReputasiBuruk,
    a1102.q2KetidakwajaranOperasi,
    a1102.q3AgresivitasAkuntansi,
    a1102.q4TekananFee,
    a1102.q5PembatasanLingkup,
    amlFlag,
    a1102.q7ReputasiAfiliasi,
    a1102.q8DualAuditor,
    a1102.q9AlasanPergantianKap,
  ];
  return answers.includes('Ya') ? 'High' : 'Low';
}

export function isPersonCompetentAndAvailable(row: A1103TeamEvaluation): boolean {
  const competent =
    row.kompetensiEntitas === 'Memadai' &&
    row.kompetensiSpap === 'Memadai' &&
    row.kompetensiRegulasi === 'Memadai' &&
    row.kompetensiTi === 'Memadai' &&
    row.kompetensiPelaporan === 'Memadai';
  const hasTimeBarrier =
    row.isCuti ||
    row.isResign ||
    row.isPhk ||
    row.isAkhirKontrak ||
    row.isPerikatanLain ||
    row.isBatasanLain;
  const hasThreat =
    row.ancamanKeuangan ||
    row.ancamanPekerjaan ||
    row.ancamanKeluarga ||
    row.ancamanNonAudit;
  return competent && !hasTimeBarrier && !hasThreat;
}

export function computeA1103Risk(rows: A1103TeamEvaluation[]): BinaryRisk {
  const selected = rows.filter((r) => r.isSelected);
  if (selected.length === 0) return 'High';
  return selected.every(isPersonCompetentAndAvailable) ? 'Low' : 'High';
}

export function computeA1105Risk(a1105: A1105PredecessorComm): BinaryRisk {
  if (a1105.q1KomunikasiDilakukan === 'Tidak' || a1105.q2BalasanDiterima === 'Tidak') {
    return 'High';
  }
  return a1105.q3aKeberatanProfesional === 'Ya' || a1105.q3bSengketaFee === 'Ya'
    ? 'High'
    : 'Low';
}

export function evaluateA110Summary(params: {
  client: ClientEntity;
  header: EngagementHeader;
  a110: A110Evaluation;
  a1101: A1101PriorIssues;
  a1102: A1102ManagementIntegrity;
  a1102_1: A1102_1AmlItem[];
  a1103: A1103TeamEvaluation[];
  a1105: A1105PredecessorComm;
}): A110Evaluation {
  const risikoJenisUsaha: BinaryRisk = HIGH_RISK_SECTORS.has(params.client.sektorIndustri)
    ? 'High'
    : 'Low';
  const risikoKepemilikan: BinaryRisk = HIGH_RISK_OWNERSHIP.has(params.client.statusKepemilikan)
    ? 'High'
    : 'Low';
  const risikoSak: BinaryRisk =
    params.client.sakDigunakan === 'SAK Umum konvergensi IFRS' ? 'High' : 'Low';
  const risikoIsuTerdahulu = computeA1101Risk(params.a1101);
  const risikoIntegritas = computeA1102Risk(params.a1102, params.a1102_1);
  const risikoKompetensiIndependensi = computeA1103Risk(params.a1103);

  const isA1105Active =
    params.header.tipePerikatan === 'Perikatan Tahun Pertama' &&
    params.a110.kriteriaIsuTerdahulu ===
      'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia dan telah diaudit auditor independen lain atau auditor yang bersangkutan';

  const risikoAuditorPendahulu: BinaryRisk | 'N/A' = isA1105Active
    ? computeA1105Risk(params.a1105)
    : 'N/A';

  const ringkasanRisikoGabungan: BinaryRisk =
    [
      risikoJenisUsaha,
      risikoKepemilikan,
      risikoSak,
      risikoIsuTerdahulu,
      risikoIntegritas,
      risikoKompetensiIndependensi,
      risikoAuditorPendahulu,
    ].includes('High')
      ? 'High'
      : 'Low';

  return {
    ...params.a110,
    risikoJenisUsaha,
    risikoKepemilikan,
    risikoSak,
    risikoIsuTerdahulu,
    risikoIntegritas,
    risikoKompetensiIndependensi,
    risikoAuditorPendahulu,
    ringkasanRisikoGabungan,
  };
}

export function canSignOffA110Prepared(a110: A110Evaluation): {
  allowed: boolean;
  reason?: string;
} {
  if (
    a110.ringkasanRisikoGabungan === 'High' &&
    a110.keputusanPenerimaan === 'YA' &&
    a110.mitigasiRisiko.trim().length < 50
  ) {
    return {
      allowed: false,
      reason:
        'A110 berisiko High dengan keputusan YA: wajib mengisi uraian Mitigasi Risiko minimal 50 karakter sebelum Mark Prepared.',
    };
  }
  return { allowed: true };
}

export function canSignOffA150Prepared(
  declarations: A150IndependenceDeclaration[],
  teamMembers: EngagementTeamMember[]
): { allowed: boolean; reason?: string } {
  const activeIds = new Set(teamMembers.map((m) => m.userId));
  const pendingCount = declarations.filter(
    (d) => activeIds.has(d.userId) && d.statusDeklarasi === 'Pending'
  ).length;
  const declinedCount = declarations.filter(
    (d) => activeIds.has(d.userId) && d.statusDeklarasi === 'Declined'
  ).length;

  if (pendingCount > 0) {
    return {
      allowed: false,
      reason: `Masih ada ${pendingCount} anggota tim yang belum menandatangani pernyataan independensi (status Pending).`,
    };
  }
  if (declinedCount > 0) {
    return {
      allowed: false,
      reason: `Terdapat ${declinedCount} anggota tim berstatus Declined pada pernyataan independensi.`,
    };
  }
  return { allowed: true };
}

export function recomputeWorkspaceA110(
  ws: EngagementWorkspaceData,
  client: ClientEntity
): A110Evaluation {
  return evaluateA110Summary({
    client,
    header: ws.header,
    a110: ws.a110,
    a1101: ws.a1101,
    a1102: ws.a1102,
    a1102_1: ws.a1102_1,
    a1103: ws.a1103,
    a1105: ws.a1105,
  });
}

export function isConditionalA1IndexVisible(
  kodeIndeks: 'A1105' | 'A170',
  ws: EngagementWorkspaceData,
  ownership?: ClientEntity['statusKepemilikan']
): boolean {
  return isIndexVisibleForWorkspace(kodeIndeks, ws, ownership);
}
