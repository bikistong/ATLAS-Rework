import { EngagementTeamMember } from '../types/atlas';

export interface TimeBudgetCalculation {
  hariKalender: number;
  hariWeekend: number;
  hariLiburNasional: number;
  hariEfektif: number;
  jamPerHari: 7;
  kapasitasJamPerOrang: number;
}

export interface MemberAllocationSummary {
  userId: string;
  totalRencanaJam: number;
  totalHonorarium: number;
  exceedsCapacity: boolean;
}

export interface TeamBudgetTotals {
  totalPraPerikatanJam: number;
  totalRiskResponseJam: number;
  totalPelaporanJam: number;
  grandTotalJam: number;
  grandTotalHonorarium: number;
  memberSummaries: Record<string, MemberAllocationSummary>;
  hasCapacityOverflow: boolean;
}

function parseIsoDateUtc(dateStr: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Menghitung jumlah hari kalender, akhir pekan (Sabtu & Minggu), dan hari efektif (7 jam/hari).
 */
export function calculateEffectiveTimeBudget(
  tanggalMulai: string,
  tanggalSelesai: string,
  hariLiburNasional: number
): TimeBudgetCalculation {
  const start = parseIsoDateUtc(tanggalMulai);
  const end = parseIsoDateUtc(tanggalSelesai);
  const safeHolidays = Math.max(0, Math.floor(Number.isFinite(hariLiburNasional) ? hariLiburNasional : 0));

  if (!start || !end || end.getTime() < start.getTime()) {
    return {
      hariKalender: 0,
      hariWeekend: 0,
      hariLiburNasional: safeHolidays,
      hariEfektif: 0,
      jamPerHari: 7,
      kapasitasJamPerOrang: 0,
    };
  }

  let hariKalender = 0;
  let hariWeekend = 0;
  const cursor = new Date(start.getTime());

  while (cursor.getTime() <= end.getTime()) {
    hariKalender += 1;
    const dayOfWeek = cursor.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      hariWeekend += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const hariEfektif = Math.max(0, hariKalender - hariWeekend - safeHolidays);
  const kapasitasJamPerOrang = hariEfektif * 7;

  return {
    hariKalender,
    hariWeekend,
    hariLiburNasional: safeHolidays,
    hariEfektif,
    jamPerHari: 7,
    kapasitasJamPerOrang,
  };
}

export function calculateTeamBudgetTotals(
  teamMembers: EngagementTeamMember[],
  kapasitasJamPerOrang: number
): TeamBudgetTotals {
  let totalPraPerikatanJam = 0;
  let totalRiskResponseJam = 0;
  let totalPelaporanJam = 0;
  let grandTotalHonorarium = 0;
  let hasCapacityOverflow = false;
  const memberSummaries: Record<string, MemberAllocationSummary> = {};

  for (const m of teamMembers) {
    const pra = Math.max(0, Number(m.rencanaJamPraperikatan) || 0);
    const resp = Math.max(0, Number(m.rencanaJamRiskResponse) || 0);
    const pel = Math.max(0, Number(m.rencanaJamPelaporan) || 0);
    const rate = Math.max(0, Number(m.tarifPerJam) || 0);

    const totalJam = pra + resp + pel;
    const honorarium = totalJam * rate;
    const exceedsCapacity = kapasitasJamPerOrang > 0 && totalJam > kapasitasJamPerOrang;
    if (exceedsCapacity) hasCapacityOverflow = true;

    totalPraPerikatanJam += pra;
    totalRiskResponseJam += resp;
    totalPelaporanJam += pel;
    grandTotalHonorarium += honorarium;

    memberSummaries[m.userId] = {
      userId: m.userId,
      totalRencanaJam: totalJam,
      totalHonorarium: honorarium,
      exceedsCapacity,
    };
  }

  return {
    totalPraPerikatanJam,
    totalRiskResponseJam,
    totalPelaporanJam,
    grandTotalJam: totalPraPerikatanJam + totalRiskResponseJam + totalPelaporanJam,
    grandTotalHonorarium,
    memberSummaries,
    hasCapacityOverflow,
  };
}
