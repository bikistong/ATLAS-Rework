import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeOverallRomm,
  formatAuditNumber,
  formatDurationHms,
  isIndexVisibleForWorkspace,
  toRomanMonth,
} from './formatters';
import { DEFAULT_CLIENTS, DEFAULT_USERS, initializeNewEngagement } from '../data/seedData';

test('formatAuditNumber formats positive, zero, decimals, and negative numbers with parentheses', () => {
  assert.equal(formatAuditNumber(1250000), '1,250,000');
  assert.equal(formatAuditNumber(0), '0');
  assert.equal(formatAuditNumber(-1250000), '(1,250,000)');
  assert.equal(formatAuditNumber(-42.5, 2), '(42.50)');
});

test('computeOverallRomm uses numeric ROMM_PRIORITY (High > Moderate > Low) instead of alphabetical sort', () => {
  assert.equal(computeOverallRomm(['Low', 'Moderate']), 'Moderate');
  assert.equal(computeOverallRomm(['Moderate', 'High', 'Low']), 'High');
  assert.equal(computeOverallRomm(['Low', 'Low']), 'Low');
  assert.equal(computeOverallRomm([]), 'Low');
});

test('toRomanMonth and formatDurationHms format Indonesian audit standards', () => {
  assert.equal(toRomanMonth(1), 'I');
  assert.equal(toRomanMonth(3), 'III');
  assert.equal(toRomanMonth(12), 'XII');
  assert.equal(formatDurationHms(3665), '01:01:05');
});

test('isIndexVisibleForWorkspace enforces A170, A1105, and C300 conditional rules', () => {
  const client = DEFAULT_CLIENTS[0];
  const partner = DEFAULT_USERS[0];

  const firstTime = initializeNewEngagement({
    client,
    users: DEFAULT_USERS,
    createdByUser: partner,
    tipePerikatan: 'Perikatan Tahun Pertama',
    tahunBuku: 2023,
    periodeMulai: '2023-01-01',
    periodeSelesai: '2023-12-31',
    tanggalLaporanAuditor: '2024-03-25',
    tanggalPerikatan: '2024-01-15',
    nomorSuratPerikatan: '001/EL',
    nomorSuratTugas: '001/ST',
  });

  assert.equal(isIndexVisibleForWorkspace('A170', firstTime, client.statusKepemilikan), true);
  assert.equal(isIndexVisibleForWorkspace('A1105', firstTime, client.statusKepemilikan), true);
  assert.equal(isIndexVisibleForWorkspace('C300', firstTime, 'Swasta - Non Go Publik'), false);
  assert.equal(isIndexVisibleForWorkspace('C300', firstTime, 'Swasta - Go Publik'), true);

  // If newly established entity in current period, both A170 & A1105 hide
  firstTime.a110.kriteriaIsuTerdahulu =
    'Entitas berdiri pada periode berjalan dan laporan keuangan tersedia pada periode berjalan';
  assert.equal(isIndexVisibleForWorkspace('A170', firstTime, client.statusKepemilikan), false);
  assert.equal(isIndexVisibleForWorkspace('A1105', firstTime, client.statusKepemilikan), false);

  // Recurring engagement hides A170 & A1105
  const recurring = initializeNewEngagement({
    client,
    users: DEFAULT_USERS,
    createdByUser: partner,
    tipePerikatan: 'Perikatan Berulang',
    tahunBuku: 2023,
    periodeMulai: '2023-01-01',
    periodeSelesai: '2023-12-31',
    tanggalLaporanAuditor: '2024-03-25',
    tanggalPerikatan: '2024-01-15',
    nomorSuratPerikatan: '002/EL',
    nomorSuratTugas: '002/ST',
  });
  assert.equal(isIndexVisibleForWorkspace('A170', recurring, client.statusKepemilikan), false);
  assert.equal(isIndexVisibleForWorkspace('A1105', recurring, client.statusKepemilikan), false);
});
