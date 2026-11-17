import test from 'node:test';
import assert from 'node:assert/strict';
import { getC210ReviewChecklist, getDisclosuresForSak } from '../data/cModuleCatalog';
import { DEFAULT_CLIENTS, DEFAULT_USERS, initializeNewEngagement } from '../data/seedData';
import {
  buildC230TwelvePillars,
  canSignOffC110Prepared,
  computeC120FourteenRatios,
  computeC120HorizontalAnalysis,
  computeFinalMateriality,
  determineSuggestedOpinion,
  evaluateEqcrGate,
  evaluateSadAggregation,
  formatOfficialLaiNumber,
  validateC400BeforeIssue,
} from './cModuleFormulas';

function makeWorkspace(isGoPublic = false) {
  const client = isGoPublic
    ? {
        ...DEFAULT_CLIENTS[0],
        id: 'cli-tbk',
        namaKlien: 'PT Publik Nusantara Tbk',
        statusKepemilikan: 'Swasta - Go Publik' as const,
        sakDigunakan: 'SAK Umum konvergensi IFRS' as const,
      }
    : DEFAULT_CLIENTS[0];

  return {
    client,
    ws: initializeNewEngagement({
      engagementId: 'eng-test-c',
      client,
      users: DEFAULT_USERS,
      createdByUser: DEFAULT_USERS[0],
      tipePerikatan: 'Perikatan Berulang',
      tahunBuku: 2023,
      periodeMulai: '2023-01-01',
      periodeSelesai: '2023-12-31',
      tanggalLaporanAuditor: '2024-03-25',
      tanggalPerikatan: '2024-01-15',
      nomorSuratPerikatan: '001/EL/2024',
      nomorSuratTugas: '001/ST/2024',
      seedDemoTrialBalance: true,
    }),
  };
}

test('C100 SAD SA 450 mengklasifikasikan Clearly Trivial (< AMPT Final) dan memicu material jika >= PM Final', () => {
  const result = evaluateSadAggregation(
    [
      { id: '1', sourceKkp: 'L02', description: 'Selisih pembulatan kas kecil', type: 'Factual', amount: 3_500_000 },
      { id: '2', sourceKkp: 'L05', description: 'Proyeksi salah saji piutang', type: 'Projected', amount: 120_000_000 },
      { id: '3', sourceKkp: 'L13', description: 'Estimasi penyusutan', type: 'Judgmental', amount: 60_000_000 },
    ],
    157_500_000,
    7_875_000
  );

  assert.equal(result.trivialItemsCount, 1);
  assert.equal(result.accumulatedItemsCount, 2);
  assert.equal(result.totalFactual, 0);
  assert.equal(result.totalProjected, 120_000_000);
  assert.equal(result.totalJudgmental, 60_000_000);
  assert.equal(result.totalAccumulatedSad, 180_000_000);
  assert.equal(result.isSadMaterialVsPm, true);
});

test('C110 Final Materiality mendeteksi penurunan SA 320.12 dan memblokir Prepared tanpa justifikasi >= 20 karakter', () => {
  const { ws } = makeWorkspace(false);
  ws.moduleC.c110FinalMateriality.marginOmPersen = 1.0; // Turun dari 1.5%
  const evalDown = computeFinalMateriality(ws);

  assert.equal(evalDown.isOmLowered, true);
  assert.equal(evalDown.isMaterialityLowered, true);
  assert.equal(canSignOffC110Prepared(ws).allowed, false);

  ws.moduleC.c110FinalMateriality.auditorJustification =
    'Penurunan margin OM telah dievaluasi dan ukuran sampel pada Lead Schedule tetap memadai.';
  assert.equal(canSignOffC110Prepared(ws).allowed, true);
});

test('C120 menghitung 14 rasio keuangan akhir dan menandai akun fluktuasi signifikan (>= PM Final atau > 20%)', () => {
  const { ws } = makeWorkspace(false);
  const ratios = computeC120FourteenRatios(ws.trialBalance, ws.journals);
  assert.equal(ratios.length, 14);
  assert.equal(ratios[13].id, 'act-wct');

  const mat = computeFinalMateriality(ws);
  const horiz = computeC120HorizontalAnalysis(ws.trialBalance, ws.journals, mat.pmFinal);
  assert.ok(horiz.length >= 10);
  const flagged = horiz.filter((h) => h.needsExplanation);
  assert.ok(flagged.length >= 1);
});

test('C210 & C220 Multi-SAK memuat instrumen blueprint lengkap C220A-C220F sesuai SAK tanpa crash di Chart1', () => {
  const c210 = getC210ReviewChecklist();
  assert.ok(c210.length >= 20);

  const etap = getDisclosuresForSak('SAK ETAP');
  assert.equal(etap[0].frameworkCode, 'C220B');
  assert.ok(etap.length > 200);

  const ifrs = getDisclosuresForSak('SAK Umum konvergensi IFRS');
  assert.equal(ifrs[0].frameworkCode, 'C220A');
  assert.ok(ifrs.length > 250);

  const emkm = getDisclosuresForSak('SAK EMKM');
  assert.equal(emkm[0].frameworkCode, 'C220C');
  assert.ok(emkm.length > 200);
});

test('C300 EQCR Gate memblokir penerbitan LAI pada C400 saat isEqcrRequired=true sampai C300 disetujui tanpa temuan Pending', () => {
  const { client, ws } = makeWorkspace(true);
  const blocked = evaluateEqcrGate(ws, client);
  assert.equal(blocked.isRequired, true);
  assert.equal(blocked.canIssueLai, false);
  assert.equal(validateC400BeforeIssue(ws, client).allowed, false);

  ws.moduleC.c300Eqcr.eqcrReviewerId = DEFAULT_USERS[0].id;
  ws.moduleC.c300Eqcr.findings = [
    {
      id: 'f1',
      indexRef: 'L05',
      significantMatter: 'Konfirmasi piutang',
      reviewerSuggestion: 'Lampirkan alternatif test',
      teamResponse: 'Sudah dilampirkan',
      status: 'Pending',
    },
  ];
  ws.workingPapers['C300'].status = 'Reviewed';
  assert.equal(evaluateEqcrGate(ws, client).canIssueLai, false);

  ws.moduleC.c300Eqcr.findings[0].status = 'Resolved';
  const passed = evaluateEqcrGate(ws, client);
  assert.equal(passed.canIssueLai, true);
  assert.equal(validateC400BeforeIssue(ws, client).allowed, true);
});

test('C400 memetakan seluruh 6 kombinasi Q1-Q2-Q3 ke OPINI1-OPINI5 dan memformat nomor LAI PPPK/IAPI resmi', () => {
  assert.equal(determineSuggestedOpinion(true, false, false), 'OPINI1');
  assert.equal(determineSuggestedOpinion(true, true, false), 'OPINI2');
  assert.equal(determineSuggestedOpinion(false, true, false), 'OPINI3');
  assert.equal(determineSuggestedOpinion(true, true, true), 'OPINI4');
  assert.equal(determineSuggestedOpinion(false, true, true), 'OPINI5');
  assert.equal(determineSuggestedOpinion(false, false, false), 'OPINI1');

  const noEtap = formatOfficialLaiNumber({
    reportSequenceNumber: '10',
    sak: 'SAK ETAP',
    branchCode: '5',
    tanggalLaporanAuditor: '2023-02-20',
  });
  assert.equal(noEtap, '00010 / AU-02 / 05 / II / 2023');

  const noIfrs = formatOfficialLaiNumber({
    reportSequenceNumber: '125',
    sak: 'SAK Umum konvergensi IFRS',
    branchCode: '1',
    tanggalLaporanAuditor: '2024-03-25',
  });
  assert.equal(noIfrs, '00125 / AU-01 / 01 / III / 2024');

  const { ws } = makeWorkspace(false);
  const pillars = buildC230TwelvePillars(ws);
  assert.equal(pillars.length, 12);
});
