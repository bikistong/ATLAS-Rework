import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultAtlasState, atlasReducerWithOutcome } from '../store/AtlasContext';
import {
  canSignOffA210Prepared,
  canSignOffA240Prepared,
  computeA220FinancialRatios,
  computeA220HorizontalVertical,
  computeBenchmarkValueFromTrialBalance,
  evaluateA250CycleControlRisk,
  lookupMatrixRomm,
  validateA210Materiality,
} from './a2Formulas';
import { computeOverallRomm } from './formatters';
import { ROMM_PRIORITY } from '../types/atlas';

test('Aturan Anti-Bug #3: Benchmark A210 ditarik dinamis dari Trial Balance aktif', () => {
  const state = createDefaultAtlasState();
  const ws = state.workspaces[state.activeEngagementId!]!;
  const tb = ws.trialBalance;

  const totalAset = computeBenchmarkValueFromTrialBalance(tb, 'Total Aset');
  const totalPendapatan = computeBenchmarkValueFromTrialBalance(tb, 'Jumlah Pendapatan');
  const totalHpp = computeBenchmarkValueFromTrialBalance(tb, 'Jumlah HPP');
  const totalLiab = computeBenchmarkValueFromTrialBalance(tb, 'Total Liabilitas');
  const ebt = computeBenchmarkValueFromTrialBalance(tb, 'Laba sebelum pajak');
  const asetBersih = computeBenchmarkValueFromTrialBalance(tb, 'Aset bersih');

  assert.equal(totalAset, 14000000000);
  assert.equal(totalPendapatan, 18500000000);
  assert.equal(totalHpp, 13800000000);
  assert.equal(totalLiab, 6150000000);
  assert.equal(ebt, 1070000000);
  assert.equal(asetBersih, 7850000000);

  // Mengubah nilai salah satu akun Aset langsung mengubah Total Aset A210
  const modifiedTb = tb.map((acc) =>
    acc.kodeAkun === '1101' ? { ...acc, unauditedDebit: 2850000000 } : acc
  );
  assert.equal(
    computeBenchmarkValueFromTrialBalance(modifiedTb, 'Total Aset'),
    15000000000
  );
});

test('A210 Materiality: AMPT > 5% ditolak dan PM di luar 50%-80% wajib justifikasi >= 100 char', () => {
  let state = createDefaultAtlasState();

  // Coba set AMPT > 5% -> ditolak reducer
  const amptBlocked = atlasReducerWithOutcome(state, {
    type: 'UPDATE_A210',
    patch: { marginAmptPersen: 6 },
  });
  assert.equal(amptBlocked.notice?.type, 'error');
  assert.equal(amptBlocked.state.workspaces[state.activeEngagementId!]!.a210.marginAmptPersen, 5);

  // Set PM 40% (di luar 50%-80%) tanpa pertimbangan >= 100 char
  state = atlasReducerWithOutcome(state, {
    type: 'UPDATE_A210',
    patch: { marginPmPersen: 40, pertimbanganPm: 'Terlalu singkat' },
  }).state;
  const a210 = state.workspaces[state.activeEngagementId!]!.a210;
  const check = validateA210Materiality(a210);
  assert.equal(check.pmOutOfRange, true);
  assert.equal(check.pmNeedsJustification, true);
  assert.equal(canSignOffA210Prepared(a210).allowed, false);

  // Lengkapi pertimbangan >= 100 char -> lolos
  const longReason = 'Risiko pengendalian tinggi di siklus persediaan dan piutang sehingga Performance Materiality ditetapkan konservatif sebesar 40% dari OM.';
  state = atlasReducerWithOutcome(state, {
    type: 'UPDATE_A210',
    patch: { pertimbanganPm: longReason },
  }).state;
  assert.equal(canSignOffA210Prepared(state.workspaces[state.activeEngagementId!]!.a210).allowed, true);
});

test('A220 Analitis Horizontal & 13 Rasio Keuangan menangani pembagian nol dan flag fluktuasi signifikan', () => {
  const state = createDefaultAtlasState();
  const ws = state.workspaces[state.activeEngagementId!]!;
  const rows = computeA220HorizontalVertical(ws.trialBalance, ws.journals, ws.a210.nilaiPm);
  assert.equal(rows.length, ws.trialBalance.length);

  // Kas: 1,850M vs 1,420M -> +430M (+30.28%). PM = 157.5M -> >= PM AND >= 20% => Fluktuasi Signifikan!
  const kasRow = rows.find((r) => r.kodeAkun === '1101')!;
  assert.equal(kasRow.isFluktuasiSignifikan, true);

  const ratios = computeA220FinancialRatios(ws.trialBalance, ws.journals);
  assert.equal(ratios.length, 13);
  const currentRatio = ratios.find((r) => r.id === 'liq-current')!;
  assert.ok(currentRatio.nilaiBerjalan !== null && currentRatio.nilaiBerjalan > 3);

  // Div-by-zero protection saat TB kosong
  const emptyRatios = computeA220FinancialRatios([], []);
  assert.equal(emptyRatios.length, 13);
  assert.equal(emptyRatios[0].nilaiBerjalan, null);
});

test('A250 Control Risk Evaluation menghasilkan Low/Moderate/High sesuai hasil TOC', () => {
  assert.equal(evaluateA250CycleControlRisk([]).controlRiskLevel, 'Moderate');
  assert.equal(
    evaluateA250CycleControlRisk([
      {
        id: '1',
        nomorUrut: 1,
        uraianProsedurSop: 'Otorisasi DO & Faktur',
        frekuensi: 'Setiap Transaksi',
        wcgwRisiko: 'Faktur fiktif',
        tipeAktivitas: 'Otorisasi',
        desainSesuai: 'Sesuai',
        hasilToc: 'Efektif',
        dampakAsersi: { C: true, E: true, 'A&C': true, V: false },
        catatanPengujian: '',
      },
    ]).controlRiskLevel,
    'Low'
  );
  assert.equal(
    evaluateA250CycleControlRisk([
      {
        id: '1',
        nomorUrut: 1,
        uraianProsedurSop: 'Rekonsiliasi Piutang',
        frekuensi: 'Bulanan',
        wcgwRisiko: 'Piutang tak tertagih',
        tipeAktivitas: 'Penelaahan kinerja',
        desainSesuai: 'Sesuai',
        hasilToc: 'Tidak Berlaku',
        dampakAsersi: { C: false, E: true, 'A&C': false, V: true },
        catatanPengujian: '',
      },
    ]).controlRiskLevel,
    'Moderate'
  );
  assert.equal(
    evaluateA250CycleControlRisk([
      {
        id: '1',
        nomorUrut: 1,
        uraianProsedurSop: 'Otorisasi Kredit',
        frekuensi: 'Setiap Transaksi',
        wcgwRisiko: 'Penjualan tanpa approval',
        tipeAktivitas: 'Otorisasi',
        desainSesuai: 'Tidak sesuai',
        hasilToc: 'Tidak Efektif',
        dampakAsersi: { C: false, E: true, 'A&C': true, V: true },
        catatanPengujian: '',
      },
    ]).controlRiskLevel,
    'High'
  );
});

test('Aturan Anti-Bug #1 & Cascade Real-Time A240/A250/A230.7 -> A270 RoMM Matrix', () => {
  // Verifikasi numerik ROMM_PRIORITY (High=3 > Moderate=2 > Low=1, bukan sort alfabetis)
  assert.ok(ROMM_PRIORITY.High > ROMM_PRIORITY.Moderate);
  assert.ok(ROMM_PRIORITY.Moderate > ROMM_PRIORITY.Low);
  assert.equal(computeOverallRomm(['Low', 'Moderate', 'High']), 'High');
  assert.equal(computeOverallRomm(['Low', 'Moderate']), 'Moderate');
  assert.equal(lookupMatrixRomm('High', 'Low'), 'Moderate');
  assert.equal(lookupMatrixRomm('Low', 'High'), 'Moderate');
  assert.equal(lookupMatrixRomm('High', 'Moderate'), 'High');

  let state = createDefaultAtlasState();
  const engId = state.activeEngagementId!;

  // 1. Update IR pada L05 (Piutang Dagang - Siklus A250.2) menjadi High pada asersi V
  state = atlasReducerWithOutcome(state, {
    type: 'UPDATE_A240_ROW',
    leadCode: 'L05',
    patch: {
      irByAssertion: { C: 'Moderate', E: 'Moderate', 'A&C': 'Moderate', V: 'High', 'P&D': 'Low' },
    },
  }).state;
  const l05AfterIr = state.workspaces[engId]!.a270Rows.find((r) => r.leadCode === 'L05')!;
  assert.equal(l05AfterIr.rommByAssertion.V, 'High'); // High IR * Moderate CR = High RoMM
  assert.equal(l05AfterIr.overallRomm, 'High');

  // 2. Uji Efektif di A250.2 -> CR turun menjadi Low -> RoMM V turun ke Moderate
  state = atlasReducerWithOutcome(state, {
    type: 'UPSERT_A250_ITEM',
    kodeSiklus: 'A250.2',
    item: {
      id: 'ctrl-1',
      nomorUrut: 1,
      uraianProsedurSop: 'Otorisasi Limit Kredit Pelanggan & Aging Review',
      frekuensi: 'Bulanan',
      wcgwRisiko: 'Pengakuan piutang fiktif atau kurang cadangan',
      tipeAktivitas: 'Otorisasi',
      desainSesuai: 'Sesuai',
      hasilToc: 'Efektif',
      dampakAsersi: { C: true, E: true, 'A&C': true, V: true },
      catatanPengujian: '25 sampel berjalan efektif.',
    },
  }).state;
  const cycleA2502 = state.workspaces[engId]!.a250Cycles.find((c) => c.kodeSiklus === 'A250.2')!;
  assert.equal(cycleA2502.controlRiskLevel, 'Low');
  const l05AfterCrLow = state.workspaces[engId]!.a270Rows.find((r) => r.leadCode === 'L05')!;
  assert.equal(l05AfterCrLow.rommByAssertion.V, 'Moderate'); // High IR * Low CR = Moderate
  assert.equal(l05AfterCrLow.overallRomm, 'Moderate');

  // 3. Aktifkan Fraud Risk A230.7 = 'Ya' dan petakan L05 sebagai akun terdampak -> paksa High!
  state = atlasReducerWithOutcome(state, {
    type: 'UPDATE_A230_ITEM',
    kodeSubIndeks: 'A230.7',
    patch: { hasilAnalisis: 'Ya', penjelasanAuditor: 'Tekanan target penjualan akhir tahun.' },
  }).state;
  state = atlasReducerWithOutcome(state, {
    type: 'UPDATE_A230_AFFECTED_ACCOUNTS',
    kodeSubIndeks: 'A230.7',
    affectedAccounts: [{ leadCode: 'L05', namaAkun: 'Piutang Dagang', arahSalahSaji: 'Overstatement' }],
  }).state;
  const l05AfterFraud = state.workspaces[engId]!.a270Rows.find((r) => r.leadCode === 'L05')!;
  assert.equal(l05AfterFraud.overallRomm, 'High');
  assert.equal(l05AfterFraud.rommByAssertion.C, 'High');

  // 4. Gate A240 Prepared lolos jika akun signifikan terisi lengkap
  assert.equal(canSignOffA240Prepared(state.workspaces[engId]!.a240Rows).allowed, true);
});
