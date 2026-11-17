import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_CLIENTS,
  DEFAULT_KAP_PROFILE,
  DEFAULT_USERS,
  initializeNewEngagement,
} from './seedData';
import { MASTER_LEAD_HEADERS } from './masterLeadHeaders';
import { BLUEPRINTS, getWorksheet, isWorksheet } from './blueprintLoader';

test('Default KAP Profile and Users seed match zero-hardcode spec', () => {
  assert.equal(DEFAULT_KAP_PROFILE.namaKap, 'KAP Djoemarma, Wahyudin dan Rekan');
  assert.equal(DEFAULT_KAP_PROFILE.kota, 'Bandung');
  assert.equal(DEFAULT_USERS.length, 4);
  assert.deepEqual(
    DEFAULT_USERS.map((u) => u.role),
    ['Partner', 'Manager', 'Ketua Tim', 'Anggota Tim']
  );
});

test('initializeNewEngagement populates complete atomic workspace with 45 Lead Schedules and SAK CALK checklist', () => {
  const client = {
    ...DEFAULT_CLIENTS[0],
    sakDigunakan: 'SAK Umum konvergensi IFRS' as const,
  };
  const ws = initializeNewEngagement({
    client,
    users: DEFAULT_USERS,
    createdByUser: DEFAULT_USERS[0],
    tipePerikatan: 'Perikatan Tahun Pertama',
    tahunBuku: 2024,
    periodeMulai: '2024-01-01',
    periodeSelesai: '2024-12-31',
    tanggalLaporanAuditor: '2025-03-20',
    tanggalPerikatan: '2025-01-10',
    nomorSuratPerikatan: '001/EL/2025',
    nomorSuratTugas: '001/ST/2025',
    seedDemoTrialBalance: true,
  });

  assert.equal(Object.keys(ws.leadSchedules).length, MASTER_LEAD_HEADERS.length);
  assert.equal(Object.keys(ws.leadSchedules).length, 45);
  assert.ok(ws.workingPapers['A110']);
  assert.ok(ws.workingPapers['A170']);
  assert.ok(ws.workingPapers['A210']);
  assert.ok(ws.workingPapers['B100']);
  assert.ok(ws.workingPapers['L02']);
  assert.ok(ws.workingPapers['L47']);
  assert.ok(ws.workingPapers['C400']);
  assert.equal(ws.teamMembers.length, DEFAULT_USERS.length);
  assert.equal(ws.a150Declarations.length, DEFAULT_USERS.length);
  assert.equal(ws.a250Cycles.length, 13);
  assert.equal(ws.a230Items.length, 8);
  assert.ok(ws.a210.nilaiSaldoAcuan > 0);
  assert.equal(ws.moduleC.c220Disclosures[0].frameworkCode, 'C220A');
});

test('blueprintLoader safely guards Chart1 chartsheet and extracts Home options', () => {
  assert.equal(isWorksheet(BLUEPRINTS.part5['Chart1']), false);
  assert.equal(getWorksheet('part5', 'Chart1'), null);
  assert.notEqual(getWorksheet('part0', 'Home'), null);
});
