import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateEffectiveTimeBudget, calculateTeamBudgetTotals } from './timeCalculator';
import { EngagementTeamMember } from '../types/atlas';

describe('calculateEffectiveTimeBudget', () => {
  it('menghitung hari kalender, akhir pekan, hari efektif, dan kapasitas 7 jam/hari secara presisi', () => {
    // 2024-01-01 (Senin) s.d. 2024-01-14 (Minggu) = 14 hari kalender, 4 weekend (6,7,13,14 Jan)
    const calc = calculateEffectiveTimeBudget('2024-01-01', '2024-01-14', 1);
    assert.equal(calc.hariKalender, 14);
    assert.equal(calc.hariWeekend, 4);
    assert.equal(calc.hariLiburNasional, 1);
    assert.equal(calc.hariEfektif, 9);
    assert.equal(calc.jamPerHari, 7);
    assert.equal(calc.kapasitasJamPerOrang, 63);
  });

  it('mengembalikan 0 jika tanggal selesai lebih kecil dari tanggal mulai atau invalid', () => {
    const calc = calculateEffectiveTimeBudget('2024-03-10', '2024-03-01', 2);
    assert.equal(calc.hariKalender, 0);
    assert.equal(calc.hariEfektif, 0);
    assert.equal(calc.kapasitasJamPerOrang, 0);
  });
});

describe('calculateTeamBudgetTotals', () => {
  it('menjumlahkan jam per fase, honorarium, serta menandai kapasitas berlebih', () => {
    const team: EngagementTeamMember[] = [
      {
        userId: 'u1',
        peranTim: 'Partner',
        tarifPerJam: 1500000,
        rencanaJamPraperikatan: 4,
        rencanaJamRiskResponse: 6,
        rencanaJamPelaporan: 4,
      },
      {
        userId: 'u2',
        peranTim: 'Anggota Tim',
        tarifPerJam: 350000,
        rencanaJamPraperikatan: 20,
        rencanaJamRiskResponse: 40,
        rencanaJamPelaporan: 20,
      },
    ];

    const summary = calculateTeamBudgetTotals(team, 70);
    assert.equal(summary.totalPraPerikatanJam, 24);
    assert.equal(summary.totalRiskResponseJam, 46);
    assert.equal(summary.totalPelaporanJam, 24);
    assert.equal(summary.grandTotalJam, 94);
    assert.equal(summary.grandTotalHonorarium, 14 * 1500000 + 80 * 350000);
    assert.equal(summary.memberSummaries['u1'].exceedsCapacity, false);
    assert.equal(summary.memberSummaries['u2'].exceedsCapacity, true);
    assert.equal(summary.hasCapacityOverflow, true);
  });
});
