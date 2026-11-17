import assert from 'node:assert/strict';
import test from 'node:test';
import { MASTER_LEAD_HEADERS } from '../data/masterLeadHeaders';
import { getSeededProceduresForLead } from '../data/bLeadProceduresCatalog';
import { createInitialSeedEngagement } from '../data/seedData';
import {
  buildLeadScheduleContext,
  computeSampleItemMisstatement,
  computeSamplingMetrics,
  computeSamplingProjection,
  getRecommendedConfidenceFactor,
} from './leadSamplingFormulas';

test('Matriks 9 Confidence Factor ISA SA 530 mengembalikan rentang & default CF persis PRD 4', () => {
  assert.equal(getRecommendedConfidenceFactor('High', 'High').defaultCf, 2.1);
  assert.equal(getRecommendedConfidenceFactor('High', 'Moderate').defaultCf, 2.6);
  assert.equal(getRecommendedConfidenceFactor('High', 'No').defaultCf, 3.0);
  assert.equal(getRecommendedConfidenceFactor('Moderate', 'High').defaultCf, 1.8);
  assert.equal(getRecommendedConfidenceFactor('Moderate', 'Moderate').defaultCf, 2.1);
  assert.equal(getRecommendedConfidenceFactor('Moderate', 'No').defaultCf, 2.6);
  assert.equal(getRecommendedConfidenceFactor('Low', 'High').defaultCf, 0.9);
  assert.equal(getRecommendedConfidenceFactor('Low', 'Moderate').defaultCf, 1.3);
  assert.equal(getRecommendedConfidenceFactor('Low', 'No').defaultCf, 1.8);
});

test('Formula SampleSize selalu membulatkan ke atas (Math.ceil) setelah mengurangkan Specific Items', () => {
  // PM = 100,000,000; CF = 2.6 -> SamplingInterval = 38,461,538.46
  // Populasi = 4,250,000,000; Specific = 250,000,000 -> TestedPopulation = 4,000,000,000
  // 4,000,000,000 / 38,461,538.4615... = 104.000000 -> Math.ceil = 104
  const exact = computeSamplingMetrics({
    performanceMateriality: 100_000_000,
    confidenceFactor: 2.6,
    totalPopulationValue: 4_250_000_000,
    specificItemsValue: 250_000_000,
  });
  assert.equal(exact.testedPopulationValue, 4_000_000_000);
  assert.equal(exact.calculatedSampleSize, 104);

  // Non-integer division: 100,000,000 / (50,000,000 / 2.1) = 4.2 -> Math.ceil = 5
  const ceilCheck = computeSamplingMetrics({
    performanceMateriality: 50_000_000,
    confidenceFactor: 2.1,
    totalPopulationValue: 120_000_000,
    specificItemsValue: 20_000_000,
  });
  assert.equal(ceilCheck.testedPopulationValue, 100_000_000);
  assert.equal(ceilCheck.calculatedSampleSize, 5);
});

test('Proyeksi Salah Saji Metode Rasio dan Metode Difference akurat 100% dan memicu alert >= PM', () => {
  assert.equal(computeSampleItemMisstatement(1_000_000, 920_000), 80_000);

  const samples = [
    { bookValue: 500_000_000, auditedValue: 450_000_000 }, // factual 50M
    { bookValue: 500_000_000, auditedValue: 450_000_000 }, // factual 50M
  ];

  // Ratio: sumBVS = 1,000M, sumAVS = 900M (ratio 0.9), Pop = 4,000M -> EVP = 3,600M -> Projected = 400M >= PM (150M)
  const ratioRes = computeSamplingProjection({
    totalPopulationValue: 4_000_000_000,
    totalPopulationItems: 40,
    performanceMateriality: 150_000_000,
    projectionMethod: 'Ratio',
    samples,
  });
  assert.equal(ratioRes.factualMisstatementTotal, 100_000_000);
  assert.equal(Math.round(ratioRes.estimatedPopulationValue), 3_600_000_000);
  assert.equal(Math.round(ratioRes.ratioProjectedMisstatement), 400_000_000);
  assert.equal(ratioRes.isMisstatementMaterial, true);

  // Difference: avgError = 100M / 2 = 50M, N = 40 -> Projected = 2,000M
  const diffRes = computeSamplingProjection({
    totalPopulationValue: 4_000_000_000,
    totalPopulationItems: 40,
    performanceMateriality: 2_500_000_000,
    projectionMethod: 'Difference',
    samples,
  });
  assert.equal(diffRes.differenceProjectedMisstatement, 2_000_000_000);
  assert.equal(diffRes.isMisstatementMaterial, false);
});

test('Konteks Lead Schedule menarik mutasi WSTB Accepted, RoMM dari A270, dan seed prosedur seluruh 45 pos L02-L47', () => {
  const ws = createInitialSeedEngagement();

  // Simulasikan Accepted AJE dan Proposed AJE pada L05 (Piutang Usaha)
  ws.journals.push(
    {
      id: 'j-acc',
      nomorJurnal: 'AJE-001',
      jenisJurnal: 'AJE',
      statusPersetujuan: 'Accepted',
      tanggalJurnal: '2023-12-31',
      referensiKkp: 'L05',
      keterangan: 'Koreksi piutang usaha tak tertagih berdasarkan konfirmasi.',
      totalDebit: 50_000_000,
      totalKredit: 50_000_000,
      createdBy: 'SA',
      createdAt: '2024-02-01T00:00:00.000Z',
      lines: [
        { id: 'l1', accountId: 'tb-6101', kodeAkun: '6101', namaAkun: 'Beban Gaji & Operasional Kantor', posisi: 'Debit', nilai: 50_000_000 },
        { id: 'l2', accountId: 'tb-1103', kodeAkun: '1103', namaAkun: 'Piutang Usaha', posisi: 'Kredit', nilai: 50_000_000 },
      ],
    },
    {
      id: 'j-prop',
      nomorJurnal: 'AJE-002',
      jenisJurnal: 'AJE',
      statusPersetujuan: 'Proposed',
      tanggalJurnal: '2023-12-31',
      referensiKkp: 'L05',
      keterangan: 'Usulan reklasifikasi piutang tambahan yang belum disetujui.',
      totalDebit: 100_000_000,
      totalKredit: 100_000_000,
      createdBy: 'SA',
      createdAt: '2024-02-01T00:00:00.000Z',
      lines: [
        { id: 'l3', accountId: 'tb-6101', kodeAkun: '6101', namaAkun: 'Beban Gaji & Operasional Kantor', posisi: 'Debit', nilai: 100_000_000 },
        { id: 'l4', accountId: 'tb-1103', kodeAkun: '1103', namaAkun: 'Piutang Usaha', posisi: 'Kredit', nilai: 100_000_000 },
      ],
    }
  );

  ws.a270Rows = ws.a270Rows.map((r) =>
    r.leadCode === 'L05' ? { ...r, overallRomm: 'High' } : r
  );

  const ctx = buildLeadScheduleContext(ws, 'L05');
  assert.equal(ctx.accounts.length, 1);
  assert.equal(ctx.totalUnaudited, 4_250_000_000);
  assert.equal(ctx.totalAjeNet, -50_000_000);
  assert.equal(ctx.totalAudited, 4_200_000_000);
  assert.equal(ctx.rommLevel, 'High');
  assert.equal(ctx.performanceMateriality, ws.a210.nilaiPm);

  // Verifikasi seluruh 45 pos L02-L47 memiliki prosedur substantif ter-seed
  for (const lh of MASTER_LEAD_HEADERS) {
    const procs = getSeededProceduresForLead(lh.leadCode, lh.title);
    assert.ok(procs.length >= 3, `${lh.leadCode} harus memiliki >= 3 prosedur substantif`);
  }
});
