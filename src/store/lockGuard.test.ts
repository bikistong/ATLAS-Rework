import assert from 'node:assert/strict';
import test from 'node:test';
import {
  atlasReducerWithOutcome,
  createDefaultAtlasState,
} from './AtlasContext';
import { isWorkpaperReadOnly } from './lockGuard';
import { buildPortableBundle, parseAtlasPortableBundle } from './storageAdapter';

test('RBAC sign-off chain, Open Review Note gate, and SA 230 Lock Guard rejection', () => {
  let state = createDefaultAtlasState();
  const engId = state.activeEngagementId!;

  // Switch to Anggota Tim
  state = atlasReducerWithOutcome(state, { type: 'SWITCH_USER', userId: 'user-anggota' }).state;

  // 1. Save notes on A210 -> Draft
  state = atlasReducerWithOutcome(state, {
    type: 'UPDATE_WORKPAPER_NOTES',
    kodeIndeks: 'A210',
    catatanSimpulan: 'Penentuan OM 1.5% dari Total Aset.',
  }).state;
  assert.equal(state.workspaces[engId].workingPapers['A210'].status, 'Draft');

  // 2. Anggota Tim signs Prepared
  state = atlasReducerWithOutcome(state, {
    type: 'SIGN_OFF_WORKPAPER',
    kodeIndeks: 'A210',
    operation: 'markPrepared',
  }).state;
  assert.equal(state.workspaces[engId].workingPapers['A210'].status, 'Prepared');
  assert.equal(state.workspaces[engId].workingPapers['A210'].preparedBy, 'FK');

  // 3. Anggota Tim CANNOT sign Reviewed
  const invalidReview = atlasReducerWithOutcome(state, {
    type: 'SIGN_OFF_WORKPAPER',
    kodeIndeks: 'A210',
    operation: 'markReviewed',
  });
  assert.equal(invalidReview.state.workspaces[engId].workingPapers['A210'].status, 'Prepared');

  // 4. Switch to Manager -> sign Reviewed
  state = atlasReducerWithOutcome(state, { type: 'SWITCH_USER', userId: 'user-manager' }).state;
  state = atlasReducerWithOutcome(state, {
    type: 'SIGN_OFF_WORKPAPER',
    kodeIndeks: 'A210',
    operation: 'markReviewed',
  }).state;
  assert.equal(state.workspaces[engId].workingPapers['A210'].status, 'Reviewed');
  assert.equal(state.workspaces[engId].workingPapers['A210'].reviewedBy, 'BW');

  // 5. Switch to Partner -> Partner Lock MUST be blocked while A210 has an Open review note
  state = atlasReducerWithOutcome(state, { type: 'SWITCH_USER', userId: 'user-partner' }).state;
  const blockedLock = atlasReducerWithOutcome(state, {
    type: 'SIGN_OFF_WORKPAPER',
    kodeIndeks: 'A210',
    operation: 'partnerLock',
  });
  assert.equal(blockedLock.state.workspaces[engId].workingPapers['A210'].status, 'Reviewed');
  assert.match(blockedLock.notice?.text ?? '', /Open/);

  // 6. Clear the Open review note on A210 -> Partner Lock now succeeds
  const openNoteId = state.workspaces[engId].reviewNotes.find((n) => n.kodeIndeks === 'A210')!.id;
  state = atlasReducerWithOutcome(state, { type: 'CLEAR_REVIEW_NOTE', noteId: openNoteId }).state;
  state = atlasReducerWithOutcome(state, {
    type: 'SIGN_OFF_WORKPAPER',
    kodeIndeks: 'A210',
    operation: 'partnerLock',
  }).state;
  assert.equal(state.workspaces[engId].workingPapers['A210'].status, 'Locked');
  assert.equal(isWorkpaperReadOnly(state.workspaces[engId], 'A210'), true);

  // 7. SA 230 Lock Guard rejects mutations on Locked KKP
  const rejectedSave = atlasReducerWithOutcome(state, {
    type: 'UPDATE_WORKPAPER_NOTES',
    kodeIndeks: 'A210',
    catatanSimpulan: 'Perubahan ilegal setelah Lock',
  });
  assert.equal(
    rejectedSave.state.workspaces[engId].workingPapers['A210'].catatanSimpulan,
    'Penentuan OM 1.5% dari Total Aset.'
  );
  assert.match(rejectedSave.notice?.text ?? '', /SA 230/);
});

test('SA 230 Archive locks all workpapers and rejects Partner/Manager edits until unarchived', () => {
  let state = createDefaultAtlasState();
  const engId = state.activeEngagementId!;

  // Switch to Anggota Tim -> cannot archive
  state = atlasReducerWithOutcome(state, { type: 'SWITCH_USER', userId: 'user-anggota' }).state;
  state = atlasReducerWithOutcome(state, {
    type: 'SET_ENGAGEMENT_ARCHIVE',
    engagementId: engId,
    isArchived: true,
  }).state;
  assert.equal(state.workspaces[engId].header.isArchived, false);

  // Switch to Partner -> archive succeeds
  state = atlasReducerWithOutcome(state, { type: 'SWITCH_USER', userId: 'user-partner' }).state;
  state = atlasReducerWithOutcome(state, {
    type: 'SET_ENGAGEMENT_ARCHIVE',
    engagementId: engId,
    isArchived: true,
  }).state;
  assert.equal(state.workspaces[engId].header.isArchived, true);
  assert.equal(isWorkpaperReadOnly(state.workspaces[engId], 'A120'), true);

  // Mutations on any KKP rejected
  const blocked = atlasReducerWithOutcome(state, {
    type: 'UPDATE_WORKPAPER_NOTES',
    kodeIndeks: 'A120',
    catatanSimpulan: 'Coba ubah saat arsip',
  });
  assert.equal(blocked.state.workspaces[engId].workingPapers['A120'].catatanSimpulan, '');
});

test('Portable .atlas.json bundle serialization, validation, and import as copy/overwrite', () => {
  const state = createDefaultAtlasState();
  const engId = state.activeEngagementId!;
  const bundle = buildPortableBundle({
    kapProfile: state.kapProfile,
    users: state.users,
    client: state.clients[0],
    workspace: state.workspaces[engId],
    exportedBy: 'Drs. Djoemarma, Ak., CPA (Partner)',
  });

  const parsed = parseAtlasPortableBundle(JSON.stringify(bundle));
  assert.equal(parsed.schemaVersion, 'atlas-web-2.1');
  assert.equal(parsed.kapProfile.namaKap, 'KAP Djoemarma, Wahyudin dan Rekan');

  assert.throws(() => parseAtlasPortableBundle('{"schemaVersion":"invalid"}'), /Versi skema tidak didukung/);

  const afterCopy = atlasReducerWithOutcome(state, {
    type: 'IMPORT_PORTABLE_BUNDLE',
    bundle: parsed,
    mode: 'copy',
  }).state;
  assert.equal(afterCopy.engagements.length, 2);
});
