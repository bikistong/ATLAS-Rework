import assert from 'node:assert/strict';
import test from 'node:test';
import * as XLSX from 'xlsx';
import { atlasReducerWithOutcome, createDefaultAtlasState } from '../store/AtlasContext';
import {
  canSignOffB240Prepared,
  canSignOffB250Prepared,
  canSignOffWstbOrFsReviewed,
  computeFinancialStatements,
  computeWstb12Columns,
  nextJournalNumber,
  parseWorkbookBufferToTbAccounts,
  validateAuditJournalEntry,
  validateTrialBalanceImport,
} from './bCoreFormulas';

test('SheetJS TB Importer & Validator: menolak kodeAkun duplikat dan ketidakseimbangan Debit vs Kredit', () => {
  const wbDup = XLSX.utils.book_new();
  const wsDup = XLSX.utils.json_to_sheet([
    { kodeAkun: '1101', namaAkun: 'Kas', unauditedDebit: 1000000, unauditedCredit: 0 },
    { kodeAkun: '1101', namaAkun: 'Bank', unauditedDebit: 0, unauditedCredit: 1000000 },
  ]);
  XLSX.utils.book_append_sheet(wbDup, wsDup, 'TB');
  const bufDup = XLSX.write(wbDup, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const parsedDup = parseWorkbookBufferToTbAccounts(bufDup);
  const valDup = validateTrialBalanceImport(parsedDup);
  assert.equal(valDup.valid, false);
  assert.deepEqual(valDup.duplicateCodes, ['1101']);

  const wbUnbal = XLSX.utils.book_new();
  const wsUnbal = XLSX.utils.json_to_sheet([
    { kodeAkun: '1101', namaAkun: 'Kas', unauditedDebit: 1500000, unauditedCredit: 0 },
    { kodeAkun: '3101', namaAkun: 'Modal Saham', unauditedDebit: 0, unauditedCredit: 1000000 },
  ]);
  XLSX.utils.book_append_sheet(wbUnbal, wsUnbal, 'TB');
  const bufUnbal = XLSX.write(wbUnbal, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const parsedUnbal = parseWorkbookBufferToTbAccounts(bufUnbal);
  const valUnbal = validateTrialBalanceImport(parsedUnbal);
  assert.equal(valUnbal.valid, false);
  assert.equal(valUnbal.unbalancedDifference, 500000);

  // Reducer menolak import gagal
  const state = createDefaultAtlasState();
  const blocked = atlasReducerWithOutcome(state, {
    type: 'IMPORT_TRIAL_BALANCE',
    accounts: parsedUnbal,
  });
  assert.equal(blocked.notice?.type, 'error');
});

test('Mesin Jurnal Double-Entry: menolak jurnal tidak balance / <20 char dan memicu cascade Accepted -> WSTB, FS, A210', () => {
  const state = createDefaultAtlasState();
  const engId = state.activeEngagementId!;
  const ws = state.workspaces[engId]!;
  const kasAcc = ws.trialBalance.find((a) => a.kodeAkun === '1101')!;
  const piutangAcc = ws.trialBalance.find((a) => a.kodeAkun === '1103')!;

  // Validasi jurnal tidak seimbang ditolak
  const badVal = validateAuditJournalEntry({
    referensiKkp: 'B100',
    keterangan: 'Koreksi selisih kas dan piutang yang cukup panjang',
    lines: [
      { id: '1', accountId: kasAcc.id, kodeAkun: kasAcc.kodeAkun, namaAkun: kasAcc.namaAkun, posisi: 'Debit', nilai: 250000000 },
      { id: '2', accountId: piutangAcc.id, kodeAkun: piutangAcc.kodeAkun, namaAkun: piutangAcc.namaAkun, posisi: 'Kredit', nilai: 200000000 },
    ],
  });
  assert.equal(badVal.valid, false);

  // Keterangan < 20 char ditolak
  const shortVal = validateAuditJournalEntry({
    referensiKkp: 'B100',
    keterangan: 'Terlalu singkat',
    lines: [
      { id: '1', accountId: kasAcc.id, kodeAkun: kasAcc.kodeAkun, namaAkun: kasAcc.namaAkun, posisi: 'Debit', nilai: 100000000 },
      { id: '2', accountId: piutangAcc.id, kodeAkun: piutangAcc.kodeAkun, namaAkun: piutangAcc.namaAkun, posisi: 'Kredit', nilai: 100000000 },
    ],
  });
  assert.equal(shortVal.valid, false);

  // Jurnal Proposed tidak mengubah saldo Audited
  let nextState = atlasReducerWithOutcome(state, {
    type: 'UPSERT_JOURNAL',
    journal: {
      jenisJurnal: 'AJE',
      statusPersetujuan: 'Proposed',
      tanggalJurnal: '2023-12-31',
      referensiKkp: 'L02',
      keterangan: 'Koreksi reklasifikasi penerimaan pelunasan piutang yang sudah diterima di rekening bank',
      lines: [
        { id: '1', accountId: kasAcc.id, kodeAkun: kasAcc.kodeAkun, namaAkun: kasAcc.namaAkun, posisi: 'Debit', nilai: 300000000 },
        { id: '2', accountId: piutangAcc.id, kodeAkun: piutangAcc.kodeAkun, namaAkun: piutangAcc.namaAkun, posisi: 'Kredit', nilai: 300000000 },
      ],
    },
  }).state;
  const wstbProposed = computeWstb12Columns(nextState.workspaces[engId]!.trialBalance, nextState.workspaces[engId]!.journals);
  assert.equal(wstbProposed.find((r) => r.kodeAkun === '1101')!.auditedDebit, 1850000000);
  assert.equal(nextJournalNumber(nextState.workspaces[engId]!.journals, 'AJE'), 'AJE-002');

  // Ubah ke Accepted -> memperbarui WSTB, FS, dan benchmark Total Aset A210 jika beban vs aset
  const journalId = nextState.workspaces[engId]!.journals[0]!.id;
  nextState = atlasReducerWithOutcome(nextState, {
    type: 'SET_JOURNAL_STATUS',
    journalId,
    status: 'Accepted',
  }).state;
  const wstbAccepted = computeWstb12Columns(nextState.workspaces[engId]!.trialBalance, nextState.workspaces[engId]!.journals);
  assert.equal(wstbAccepted.find((r) => r.kodeAkun === '1101')!.auditedDebit, 2150000000);
  assert.equal(wstbAccepted.find((r) => r.kodeAkun === '1103')!.auditedDebit, 3950000000);
});

test('B120 Laporan Keuangan 4 Tab & Validasi NERACA BALANCED serta Arus Kas Tidak Langsung', () => {
  const state = createDefaultAtlasState();
  const ws = state.workspaces[state.activeEngagementId!]!;
  const fs = computeFinancialStatements(ws.trialBalance, ws.journals);

  assert.equal(fs.neraca.totalAset, 14000000000);
  assert.equal(fs.neraca.totalLiabilitasDanEkuitas, 14000000000);
  assert.equal(fs.neraca.selisihNeraca, 0);
  assert.equal(fs.neraca.isNeracaBalanced, true);
  assert.equal(fs.labaRugi.labaBersih, 1070000000);
  assert.equal(fs.arusKas.selisihKas, 0);
  assert.equal(canSignOffWstbOrFsReviewed(ws.trialBalance, ws.journals).allowed, true);

  // Jika TB tidak seimbang, NERACA BALANCED false dan Reviewed diblokir
  const brokenTb = ws.trialBalance.map((a) =>
    a.kodeAkun === '1101' ? { ...a, unauditedDebit: a.unauditedDebit + 100000000 } : a
  );
  const brokenFs = computeFinancialStatements(brokenTb, []);
  assert.equal(brokenFs.neraca.isNeracaBalanced, false);
  assert.equal(brokenFs.neraca.selisihNeraca, 100000000);
  assert.equal(canSignOffWstbOrFsReviewed(brokenTb, []).allowed, false);
});

test('B240 (SA 570) & B250 (SA 580): Gate Sign-Off Prepared memvalidasi tanggal Surat Representasi dan mitigasi Going Concern', () => {
  const state = createDefaultAtlasState();
  const ws = state.workspaces[state.activeEngagementId!]!;

  // B250: tanggal sama dengan tanggalLaporanAuditor -> lolos
  assert.equal(canSignOffB250Prepared(ws.specialProcedures.b250, ws.header).allowed, true);

  // B250: tanggal berbeda -> blokir Sign-Off Prepared
  const mismatchedB250 = {
    ...ws.specialProcedures.b250,
    tanggalSuratRepresentasi: '2024-03-24',
  };
  assert.equal(canSignOffB250Prepared(mismatchedB250, ws.header).allowed, false);

  const blockedState = atlasReducerWithOutcome(state, {
    type: 'UPDATE_SPECIAL_PROCEDURE',
    kodeIndeks: 'B250',
    patch: { b250: mismatchedB250 },
  }).state;
  const signAttempt = atlasReducerWithOutcome(blockedState, {
    type: 'SIGN_OFF_WORKPAPER',
    kodeIndeks: 'B250',
    operation: 'markPrepared',
  });
  assert.equal(signAttempt.notice?.type, 'error');
  assert.equal(signAttempt.state.workspaces[ws.header.id]!.workingPapers['B250']!.status, 'Draft');

  // B240: indikator buruk tanpa rencana mitigasi >= 20 char ditolak
  assert.equal(
    canSignOffB240Prepared({
      ...ws.specialProcedures.b240,
      indikatorKeuanganBuruk: true,
      evaluasiRencanaManajemen: 'Belum diisi',
    }).allowed,
    false
  );
});
