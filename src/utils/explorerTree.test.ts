import assert from 'node:assert/strict';
import test from 'node:test';
import { MASTER_LEAD_HEADERS } from '../data/masterLeadHeaders';
import { createInitialSeedEngagement } from '../data/seedData';
import { atlasReducerWithOutcome, createDefaultAtlasState } from '../store/AtlasContext';
import {
  buildExplorerTree,
  collectAllExpandableNodeIds,
  getLeadFsSubfolderId,
} from './explorerTree';

test('getLeadFsSubfolderId maps all 45 L02-L47 leads into the 6 standard FS sub-folders', () => {
  const counts: Record<string, number> = {};
  for (const lh of MASTER_LEAD_HEADERS) {
    const sfId = getLeadFsSubfolderId(lh.leadCode, lh.accountCategory);
    counts[sfId] = (counts[sfId] ?? 0) + 1;
  }

  assert.equal(MASTER_LEAD_HEADERS.length, 45);
  assert.equal(counts['fs:aset_lancar'], 9); // L02-L11 (excluding L04)
  assert.equal(counts['fs:aset_tidak_lancar'], 5); // L12-L16
  assert.equal(counts['fs:liabilitas_pendek'], 11); // L17-L27
  assert.equal(counts['fs:liabilitas_panjang'], 4); // L28-L31
  assert.equal(counts['fs:ekuitas'], 5); // L32-L36
  assert.equal(counts['fs:pendapatan_beban'], 11); // L37-L47
  assert.equal(counts['fs:lainnya'] ?? 0, 0);
});

test('buildExplorerTree constructs multi-level A110 -> A1102 -> A1102.1 nesting and 6 FS subfolders for L02-L47', () => {
  const ws = createInitialSeedEngagement();
  const result = buildExplorerTree({
    workspace: ws,
    ownershipStatus: 'Swasta - Non Go Publik',
  });

  assert.equal(result.categories.length, 6);
  const part1 = result.categories.find((c) => c.id === 'cat:Part1');
  assert.ok(part1);

  const a110 = part1.children.find((n) => n.kodeIndeks === 'A110');
  assert.ok(a110);
  const a1102 = a110.children.find((n) => n.kodeIndeks === 'A1102');
  assert.ok(a1102);
  assert.equal(a1102.children.length, 1);
  assert.equal(a1102.children[0].kodeIndeks, 'A1102.1');
  assert.equal(a1102.children[0].depth, 3);

  // Conditional indices A1105 and A170 hidden for Perikatan Berulang
  assert.equal(
    a110.children.some((n) => n.kodeIndeks === 'A1105'),
    false
  );
  assert.equal(
    part1.children.some((n) => n.kodeIndeks === 'A170'),
    false
  );

  // Part 4 contains the 6 FS sub-folders summing to 45 Lead Schedules
  const part4 = result.categories.find((c) => c.id === 'cat:Part4');
  assert.ok(part4);
  assert.equal(part4.children.length, 6);
  assert.equal(part4.totalCount, 45);
});

test('buildExplorerTree auto-expands ancestor branches on deep search and preserves ancestors on status filter', () => {
  const ws = createInitialSeedEngagement();

  const searchRes = buildExplorerTree({
    workspace: ws,
    ownershipStatus: 'Swasta - Non Go Publik',
    searchQuery: 'A1102.1',
  });

  assert.equal(searchRes.visibleWorkpaperCount, 1);
  assert.equal(searchRes.autoExpandedIds['cat:Part1'], true);
  assert.equal(searchRes.autoExpandedIds['wp:A110'], true);
  assert.equal(searchRes.autoExpandedIds['wp:A1102'], true);

  // A110 is Reviewed in seed, while A1102.1 is Kosong -> filtering 'belum' must keep A110 as ancestor
  const belumRes = buildExplorerTree({
    workspace: ws,
    ownershipStatus: 'Swasta - Non Go Publik',
    statusFilter: 'belum',
  });
  const part1 = belumRes.categories.find((c) => c.id === 'cat:Part1');
  const a110 = part1?.children.find((n) => n.kodeIndeks === 'A110');
  assert.ok(a110);
  assert.equal(a110.matchesDirectFilter, false);
  assert.ok(a110.children.some((n) => n.kodeIndeks === 'A1102'));
  assert.equal(belumRes.autoExpandedIds['wp:A110'], true);

  const expandableIds = collectAllExpandableNodeIds(
    buildExplorerTree({ workspace: ws }).categories
  );
  assert.ok(expandableIds.includes('cat:Part4'));
  assert.ok(expandableIds.includes('fs:aset_lancar'));
  assert.ok(expandableIds.includes('wp:A1102'));
});

test('custom category, custom workpaper, pin favorite, and SA 230 lock/archive guards work end-to-end', () => {
  let state = createDefaultAtlasState();

  // 1. Create custom category
  let out = atlasReducerWithOutcome(state, {
    type: 'CREATE_CUSTOM_CATEGORY',
    code: 'TAX',
    label: 'Ekualisasi Pajak',
  });
  state = out.state;
  const engId = state.activeEngagementId!;
  const customCats = state.workspaces[engId].customCategories ?? [];
  assert.equal(customCats.length, 1);
  const catId = customCats[0].id;

  // 2. Create custom workpaper inside custom category & a child sub-KKP under it
  out = atlasReducerWithOutcome(state, {
    type: 'CREATE_CUSTOM_WORKPAPER',
    kodeIndeks: 'TAX01',
    namaIndeks: 'Rekonsiliasi PPN Keluaran',
    partGroup: 'Part0',
    categoryId: catId,
    saRelevan: 'SA 500',
  });
  state = out.state;
  assert.ok(state.workspaces[engId].workingPapers['TAX01']);
  assert.equal(state.workspaces[engId].workingPapers['TAX01'].isCustom, true);

  out = atlasReducerWithOutcome(state, {
    type: 'CREATE_CUSTOM_WORKPAPER',
    kodeIndeks: 'TAX01.1',
    namaIndeks: 'Uji Faktur Pajak Masukan',
    partGroup: 'Part0',
    categoryId: catId,
    parentIndeks: 'TAX01',
  });
  state = out.state;

  // Verify custom category and nested workpapers appear in tree
  const tree = buildExplorerTree({ workspace: state.workspaces[engId] });
  const taxCat = tree.categories.find((c) => c.categoryId === catId);
  assert.ok(taxCat);
  assert.equal(taxCat.totalCount, 2);
  assert.equal(taxCat.children[0].kodeIndeks, 'TAX01');
  assert.equal(taxCat.children[0].children[0].kodeIndeks, 'TAX01.1');

  // 3. Cannot delete category while non-empty or delete parent while child exists
  out = atlasReducerWithOutcome(state, {
    type: 'DELETE_CUSTOM_CATEGORY',
    categoryId: catId,
  });
  assert.equal(out.notice?.type, 'warning');
  assert.equal((out.state.workspaces[engId].customCategories ?? []).length, 1);

  out = atlasReducerWithOutcome(state, {
    type: 'DELETE_CUSTOM_WORKPAPER',
    kodeIndeks: 'TAX01',
  });
  assert.equal(out.notice?.type, 'warning');
  assert.ok(out.state.workspaces[engId].workingPapers['TAX01']);

  // 4. Cannot delete standard ATLAS index A110
  out = atlasReducerWithOutcome(state, {
    type: 'DELETE_CUSTOM_WORKPAPER',
    kodeIndeks: 'A110',
  });
  assert.equal(out.notice?.type, 'warning');
  assert.ok(out.state.workspaces[engId].workingPapers['A110']);

  // 5. Pin & unpin favorite
  out = atlasReducerWithOutcome(state, {
    type: 'TOGGLE_PIN_WORKPAPER',
    kodeIndeks: 'TAX01',
  });
  state = out.state;
  assert.deepEqual(state.workspaces[engId].pinnedIndices, ['TAX01']);
  const pinnedTree = buildExplorerTree({ workspace: state.workspaces[engId] });
  assert.equal(pinnedTree.pinnedWorkpapers.length, 1);
  assert.equal(pinnedTree.pinnedWorkpapers[0].kodeIndeks, 'TAX01');

  // 6. Locked custom workpaper cannot be renamed or deleted (SA 230)
  state = {
    ...state,
    workspaces: {
      ...state.workspaces,
      [engId]: {
        ...state.workspaces[engId],
        workingPapers: {
          ...state.workspaces[engId].workingPapers,
          'TAX01.1': {
            ...state.workspaces[engId].workingPapers['TAX01.1'],
            status: 'Locked',
            partnerLockedBy: 'DJ',
          },
        },
      },
    },
  };
  out = atlasReducerWithOutcome(state, {
    type: 'RENAME_CUSTOM_WORKPAPER',
    kodeIndeks: 'TAX01.1',
    namaIndeks: 'Harus Gagal',
  });
  assert.equal(out.notice?.type, 'warning');
  assert.equal(
    out.state.workspaces[engId].workingPapers['TAX01.1'].namaIndeks,
    'Uji Faktur Pajak Masukan'
  );
  out = atlasReducerWithOutcome(state, {
    type: 'DELETE_CUSTOM_WORKPAPER',
    kodeIndeks: 'TAX01.1',
  });
  assert.equal(out.notice?.type, 'warning');
  assert.ok(out.state.workspaces[engId].workingPapers['TAX01.1']);

  // 7. Unlock then delete child, parent, and empty category cleanly
  state = {
    ...state,
    workspaces: {
      ...state.workspaces,
      [engId]: {
        ...state.workspaces[engId],
        workingPapers: {
          ...state.workspaces[engId].workingPapers,
          'TAX01.1': {
            ...state.workspaces[engId].workingPapers['TAX01.1'],
            status: 'Draft',
            partnerLockedBy: undefined,
          },
        },
      },
    },
  };
  state = atlasReducerWithOutcome(state, {
    type: 'DELETE_CUSTOM_WORKPAPER',
    kodeIndeks: 'TAX01.1',
  }).state;
  state = atlasReducerWithOutcome(state, {
    type: 'DELETE_CUSTOM_WORKPAPER',
    kodeIndeks: 'TAX01',
  }).state;
  state = atlasReducerWithOutcome(state, {
    type: 'DELETE_CUSTOM_CATEGORY',
    categoryId: catId,
  }).state;

  assert.equal((state.workspaces[engId].customCategories ?? []).length, 0);
  assert.equal(state.workspaces[engId].workingPapers['TAX01'], undefined);
  assert.deepEqual(state.workspaces[engId].pinnedIndices, []);
});
