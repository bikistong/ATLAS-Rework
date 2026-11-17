import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialSeedEngagement, DEFAULT_USERS } from '../data/seedData';
import {
  computeEngagementProgress,
  computeModuleReadinessRows,
  matchesSakFilter,
  matchesStatusFilter,
} from './hubMetrics';

test('computeEngagementProgress aggregates sign-off counts, open notes, and team leads', () => {
  const ws = createInitialSeedEngagement();
  const summary = computeEngagementProgress(ws, DEFAULT_USERS, 'Swasta - Non Go Publik');

  assert.ok(summary.total >= 70);
  assert.equal(summary.openReviewNotes, 1);
  assert.equal(summary.partnerName, 'Drs. Djoemarma, Ak., CPA');
  assert.equal(summary.managerName, 'Budi Wahyudin, SE., M.Ak., CPA');
  assert.equal(summary.ketuaTimName, 'Siti Andriani, SE., Ak.');
  assert.equal(summary.completed, summary.prepared + summary.reviewed + summary.locked);
});

test('computeModuleReadinessRows covers all 6 PartGroups including HOME and L02-L47', () => {
  const ws = createInitialSeedEngagement();
  const rows = computeModuleReadinessRows(ws, 'Swasta - Non Go Publik');

  assert.equal(rows.length, 6);
  assert.equal(rows[0].shortCode, 'HOME');
  assert.equal(rows[0].total, 1);
  assert.equal(rows[0].firstIndex, 'HOME');
  assert.equal(rows[4].shortCode, 'L02-L47');
  assert.equal(rows[4].total, 45);
});

test('matchesSakFilter and matchesStatusFilter behave deterministically', () => {
  assert.equal(matchesSakFilter('SAK ETAP', 'ALL'), true);
  assert.equal(matchesSakFilter('SAK ETAP', 'SAK ETAP'), true);
  assert.equal(matchesSakFilter('SAK ETAP', 'SAK EMKM'), false);
  assert.equal(matchesSakFilter('SAK SYARIAH', 'OTHER'), true);

  assert.equal(matchesStatusFilter('Kosong', 'semua'), true);
  assert.equal(matchesStatusFilter('Draft', 'belum'), true);
  assert.equal(matchesStatusFilter('Reviewed', 'belum'), false);
  assert.equal(matchesStatusFilter('Prepared', 'selesai'), true);
  assert.equal(matchesStatusFilter('Locked', 'selesai'), true);
});
