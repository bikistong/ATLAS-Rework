import { MASTER_INDICES, SIDEBAR_GROUPS } from '../data/masterIndices';
import { MASTER_LEAD_HEADERS } from '../data/masterLeadHeaders';
import {
  ClientOwnershipStatus,
  CustomIndexCategory,
  EngagementWorkspaceData,
  PartGroup,
  WorkingPaperRecord,
  WorkpaperStatus,
} from '../types/atlas';
import { isIndexVisibleForWorkspace } from './formatters';
import { SidebarStatusFilter, matchesStatusFilter } from './hubMetrics';

export type ExplorerNodeType = 'category' | 'subfolder' | 'workpaper';

export interface ExplorerNode {
  id: string;
  nodeType: ExplorerNodeType;
  shortCode: string;
  label: string;
  kodeIndeks?: string;
  partGroup?: PartGroup;
  categoryId?: string;
  parentIndeks?: string | null;
  saRelevan?: string;
  isCustom: boolean;
  isConditional: boolean;
  status?: WorkpaperStatus;
  signOffSummary?: string;
  openNotesCount: number;
  isPinned: boolean;
  completedCount: number;
  totalCount: number;
  matchesDirectFilter: boolean;
  depth: number;
  children: ExplorerNode[];
}

export interface FsSubfolderDef {
  id: string;
  shortCode: string;
  label: string;
}

export const FS_SUBFOLDERS: FsSubfolderDef[] = [
  { id: 'fs:aset_lancar', shortCode: 'AL', label: 'Aset Lancar' },
  { id: 'fs:aset_tidak_lancar', shortCode: 'ATL', label: 'Aset Tidak Lancar' },
  { id: 'fs:liabilitas_pendek', shortCode: 'LJP', label: 'Liabilitas Jangka Pendek' },
  { id: 'fs:liabilitas_panjang', shortCode: 'LJPan', label: 'Liabilitas Jangka Panjang' },
  { id: 'fs:ekuitas', shortCode: 'EK', label: 'Ekuitas' },
  { id: 'fs:pendapatan_beban', shortCode: 'LR', label: 'Pendapatan & Beban' },
  { id: 'fs:lainnya', shortCode: 'LAIN', label: 'Lead Schedule Tambahan' },
];

export const DEFAULT_EXPLORER_EXPANDED: Record<string, boolean> = {
  'cat:Part0': true,
  'cat:Part1': true,
  'cat:Part2': true,
  'cat:Part3': true,
  'cat:Part4': false,
  'cat:Part5': true,
  'wp:A110': true,
  'wp:A1102': true,
  'wp:A160': true,
  'wp:B100': true,
};

const MASTER_LEAD_CATEGORY_MAP = new Map(
  MASTER_LEAD_HEADERS.map((lh) => [lh.leadCode, lh.accountCategory])
);

const MASTER_INDEX_META_MAP = new Map(MASTER_INDICES.map((m) => [m.kodeIndeks, m]));

const REFERENCE_INDICES_SET = new Set(
  MASTER_INDICES.filter((m) => m.isReferenceOnly).map((m) => m.kodeIndeks)
);

export function isWorkpaperCompletedStatus(status: WorkpaperStatus | undefined): boolean {
  return status === 'Prepared' || status === 'Reviewed' || status === 'Locked';
}

export function getLeadFsSubfolderId(leadCode: string, accountCategory?: string): string {
  const cat = (accountCategory ?? MASTER_LEAD_CATEGORY_MAP.get(leadCode) ?? '').trim();
  const lower = cat.toLowerCase();

  if (lower === 'aset lancar') return 'fs:aset_lancar';
  if (lower.startsWith('aset tidak lancar')) return 'fs:aset_tidak_lancar';
  if (lower === 'liabilitas jangka pendek') return 'fs:liabilitas_pendek';
  if (lower === 'liabilitas jangka panjang') return 'fs:liabilitas_panjang';
  if (lower === 'ekuitas') return 'fs:ekuitas';
  if (
    lower === 'pendapatan' ||
    lower === 'pendapatan (kontra)' ||
    lower === 'beban pokok' ||
    lower === 'beban operasional' ||
    lower === 'pendapatan non-operasional' ||
    lower === 'beban non-operasional' ||
    lower === 'beban non-operasional / pajak'
  ) {
    return 'fs:pendapatan_beban';
  }

  // Fallback by standard L02-L47 code ranges
  const numMatch = /^L(\d{2})$/i.exec(leadCode.trim());
  if (numMatch) {
    const num = Number(numMatch[1]);
    if (num >= 2 && num <= 11) return 'fs:aset_lancar';
    if (num >= 12 && num <= 16) return 'fs:aset_tidak_lancar';
    if (num >= 17 && num <= 27) return 'fs:liabilitas_pendek';
    if (num >= 28 && num <= 31) return 'fs:liabilitas_panjang';
    if (num >= 32 && num <= 36) return 'fs:ekuitas';
    if (num >= 37 && num <= 47) return 'fs:pendapatan_beban';
  }

  return 'fs:lainnya';
}

export interface ExplorerBuildResult {
  categories: ExplorerNode[];
  pinnedWorkpapers: ExplorerNode[];
  autoExpandedIds: Record<string, boolean>;
  visibleWorkpaperCount: number;
  totalWorkpaperCount: number;
  completedWorkpaperCount: number;
}

function makeWorkpaperNode(
  wp: WorkingPaperRecord,
  ws: EngagementWorkspaceData,
  pinnedSet: Set<string>,
  openNotesByIndex: Map<string, number>,
  depth: number
): ExplorerNode {
  const masterMeta = MASTER_INDEX_META_MAP.get(wp.kodeIndeks);
  const completed = isWorkpaperCompletedStatus(wp.status) ? 1 : 0;
  const signOffSummary =
    wp.preparedBy || wp.reviewedBy
      ? [wp.preparedBy, wp.reviewedBy].filter(Boolean).join('/')
      : undefined;

  return {
    id: `wp:${wp.kodeIndeks}`,
    nodeType: 'workpaper',
    shortCode: wp.kodeIndeks,
    label: wp.namaIndeks,
    kodeIndeks: wp.kodeIndeks,
    partGroup: wp.partGroup,
    categoryId: wp.categoryId,
    parentIndeks: wp.parentIndeks,
    saRelevan: wp.saRelevan ?? masterMeta?.saRelevan,
    isCustom: Boolean(wp.isCustom) || (!masterMeta && !ws.leadSchedules[wp.kodeIndeks] ? true : Boolean(wp.isCustom)),
    isConditional: wp.isConditional,
    status: wp.status,
    signOffSummary,
    openNotesCount: openNotesByIndex.get(wp.kodeIndeks) ?? 0,
    isPinned: pinnedSet.has(wp.kodeIndeks),
    completedCount: completed,
    totalCount: 1,
    matchesDirectFilter: true,
    depth,
    children: [],
  };
}

function assignSubtreeDepthsAndCounts(node: ExplorerNode, depth: number): void {
  node.depth = depth;
  let completed = node.nodeType === 'workpaper' && isWorkpaperCompletedStatus(node.status) ? 1 : 0;
  let total = node.nodeType === 'workpaper' ? 1 : 0;

  for (const child of node.children) {
    assignSubtreeDepthsAndCounts(child, depth + 1);
    completed += child.completedCount;
    total += child.totalCount;
  }

  node.completedCount = completed;
  node.totalCount = total;
}

function filterTreeNode(
  node: ExplorerNode,
  normalizedQuery: string,
  statusFilter: SidebarStatusFilter,
  hasActiveFilter: boolean,
  autoExpandedIds: Record<string, boolean>,
  forceIncludeSubtree = false
): ExplorerNode | null {
  const textMatchesSelf =
    !normalizedQuery ||
    node.shortCode.toLowerCase().includes(normalizedQuery) ||
    node.label.toLowerCase().includes(normalizedQuery) ||
    (node.saRelevan?.toLowerCase().includes(normalizedQuery) ?? false);

  const isFolderMatchesQuery =
    Boolean(normalizedQuery) &&
    (node.nodeType === 'category' || node.nodeType === 'subfolder') &&
    textMatchesSelf;

  const filteredChildren: ExplorerNode[] = [];
  for (const child of node.children) {
    const filteredChild = filterTreeNode(
      child,
      normalizedQuery,
      statusFilter,
      hasActiveFilter,
      autoExpandedIds,
      forceIncludeSubtree || isFolderMatchesQuery
    );
    if (filteredChild) {
      filteredChildren.push(filteredChild);
    }
  }

  if (node.nodeType === 'workpaper') {
    const statusOk = matchesStatusFilter(node.status, statusFilter);
    const queryOk = forceIncludeSubtree || textMatchesSelf;
    const directMatch = statusOk && queryOk;

    if (!directMatch && filteredChildren.length === 0) {
      return null;
    }

    if (hasActiveFilter && filteredChildren.length > 0) {
      autoExpandedIds[node.id] = true;
    }

    return {
      ...node,
      matchesDirectFilter: directMatch,
      children: filteredChildren,
    };
  }

  // Category or subfolder
  if (hasActiveFilter && filteredChildren.length === 0) {
    return null;
  }

  if (hasActiveFilter && filteredChildren.length > 0) {
    autoExpandedIds[node.id] = true;
  }

  return {
    ...node,
    matchesDirectFilter: true,
    children: filteredChildren,
  };
}

function countMatchingWorkpapers(nodes: ExplorerNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.nodeType === 'workpaper' && node.matchesDirectFilter) {
      count += 1;
    }
    if (node.children.length > 0) {
      count += countMatchingWorkpapers(node.children);
    }
  }
  return count;
}

function buildNestedWorkpaperForest(
  wps: WorkingPaperRecord[],
  ws: EngagementWorkspaceData,
  pinnedSet: Set<string>,
  openNotesByIndex: Map<string, number>,
  baseDepth: number
): ExplorerNode[] {
  const sorted = [...wps].sort((a, b) => {
    if (a.urutan !== b.urutan) return a.urutan - b.urutan;
    return a.kodeIndeks.localeCompare(b.kodeIndeks);
  });

  const nodeMap = new Map<string, ExplorerNode>();
  for (const wp of sorted) {
    nodeMap.set(
      wp.kodeIndeks,
      makeWorkpaperNode(wp, ws, pinnedSet, openNotesByIndex, baseDepth)
    );
  }

  const roots: ExplorerNode[] = [];
  for (const wp of sorted) {
    const node = nodeMap.get(wp.kodeIndeks)!;
    const parentCode = wp.parentIndeks;
    if (parentCode && parentCode !== wp.kodeIndeks && nodeMap.has(parentCode)) {
      // Prevent cycle by walking up ancestors from parentCode
      let cursor: string | null | undefined = parentCode;
      const visited = new Set<string>([wp.kodeIndeks]);
      let hasCycle = false;
      while (cursor) {
        if (visited.has(cursor)) {
          hasCycle = true;
          break;
        }
        visited.add(cursor);
        cursor = nodeMap.get(cursor)?.parentIndeks;
      }
      if (!hasCycle) {
        nodeMap.get(parentCode)!.children.push(node);
        continue;
      }
    }
    roots.push(node);
  }

  return roots;
}

export function buildExplorerTree(params: {
  workspace: EngagementWorkspaceData | null;
  ownershipStatus?: ClientOwnershipStatus;
  searchQuery?: string;
  statusFilter?: SidebarStatusFilter;
}): ExplorerBuildResult {
  const { workspace, ownershipStatus, searchQuery = '', statusFilter = 'semua' } = params;

  if (!workspace) {
    return {
      categories: [],
      pinnedWorkpapers: [],
      autoExpandedIds: {},
      visibleWorkpaperCount: 0,
      totalWorkpaperCount: 0,
      completedWorkpaperCount: 0,
    };
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasActiveFilter = Boolean(normalizedQuery) || statusFilter !== 'semua';
  const pinnedSet = new Set(workspace.pinnedIndices ?? []);
  const customCategories: CustomIndexCategory[] = [...(workspace.customCategories ?? [])].sort(
    (a, b) => a.urutan - b.urutan || a.code.localeCompare(b.code)
  );
  const customCategoryIds = new Set(customCategories.map((c) => c.id));

  const openNotesByIndex = new Map<string, number>();
  for (const note of workspace.reviewNotes) {
    if (note.status === 'Open') {
      openNotesByIndex.set(note.kodeIndeks, (openNotesByIndex.get(note.kodeIndeks) ?? 0) + 1);
    }
  }

  // Collect all visible non-reference working papers (including any custom lead schedules not yet in workingPapers)
  const visibleWps: WorkingPaperRecord[] = [];
  const seenCodes = new Set<string>();

  for (const wp of Object.values(workspace.workingPapers)) {
    if (REFERENCE_INDICES_SET.has(wp.kodeIndeks)) continue;
    if (!isIndexVisibleForWorkspace(wp.kodeIndeks, workspace, ownershipStatus)) continue;
    seenCodes.add(wp.kodeIndeks);
    visibleWps.push(wp);
  }

  // Defensive sync for custom Lead Schedules stored only in leadSchedules
  let syntheticOrder = 600;
  for (const ls of Object.values(workspace.leadSchedules)) {
    if (seenCodes.has(ls.leadCode) || REFERENCE_INDICES_SET.has(ls.leadCode)) continue;
    visibleWps.push({
      kodeIndeks: ls.leadCode,
      namaIndeks: ls.title,
      partGroup: 'Part4',
      parentIndeks: null,
      urutan: syntheticOrder++,
      isConditional: false,
      isCustom: true,
      saRelevan: 'SA 500 · SA 530',
      status: 'Kosong',
    });
  }

  const totalWorkpaperCount = visibleWps.length;
  const completedWorkpaperCount = visibleWps.filter((wp) =>
    isWorkpaperCompletedStatus(wp.status)
  ).length;

  // Build category buckets
  const categoryNodes: ExplorerNode[] = [];

  for (const group of SIDEBAR_GROUPS) {
    const catWps = visibleWps.filter(
      (wp) =>
        (!wp.categoryId || !customCategoryIds.has(wp.categoryId)) &&
        wp.partGroup === group.partGroup
    );

    if (group.partGroup === 'Part4') {
      // Group root leads into 6 FS Sub-Folders (+ fallback Tambahan if needed)
      const forestRoots = buildNestedWorkpaperForest(
        catWps,
        workspace,
        pinnedSet,
        openNotesByIndex,
        2
      );

      const rootsBySubfolder = new Map<string, ExplorerNode[]>();
      for (const sf of FS_SUBFOLDERS) {
        rootsBySubfolder.set(sf.id, []);
      }

      for (const rootNode of forestRoots) {
        const code = rootNode.kodeIndeks ?? rootNode.shortCode;
        const ls = workspace.leadSchedules[code];
        const sfId = getLeadFsSubfolderId(code, ls?.accountCategory);
        const bucket = rootsBySubfolder.get(sfId) ?? rootsBySubfolder.get('fs:lainnya')!;
        bucket.push(rootNode);
      }

      const subfolderNodes: ExplorerNode[] = [];
      for (const sf of FS_SUBFOLDERS) {
        const children = rootsBySubfolder.get(sf.id) ?? [];
        if (sf.id === 'fs:lainnya' && children.length === 0) continue;
        if (children.length === 0) continue;
        subfolderNodes.push({
          id: sf.id,
          nodeType: 'subfolder',
          shortCode: sf.shortCode,
          label: sf.label,
          partGroup: 'Part4',
          isCustom: false,
          isConditional: false,
          openNotesCount: children.reduce((sum, c) => sum + c.openNotesCount, 0),
          isPinned: false,
          completedCount: 0,
          totalCount: 0,
          matchesDirectFilter: true,
          depth: 1,
          children,
        });
      }

      const part4Cat: ExplorerNode = {
        id: `cat:${group.partGroup}`,
        nodeType: 'category',
        shortCode: group.shortCode,
        label: group.label,
        partGroup: group.partGroup,
        isCustom: false,
        isConditional: false,
        openNotesCount: 0,
        isPinned: false,
        completedCount: 0,
        totalCount: 0,
        matchesDirectFilter: true,
        depth: 0,
        children: subfolderNodes,
      };
      assignSubtreeDepthsAndCounts(part4Cat, 0);
      categoryNodes.push(part4Cat);
    } else {
      const forestRoots = buildNestedWorkpaperForest(
        catWps,
        workspace,
        pinnedSet,
        openNotesByIndex,
        1
      );
      const catNode: ExplorerNode = {
        id: `cat:${group.partGroup}`,
        nodeType: 'category',
        shortCode: group.shortCode,
        label: group.label,
        partGroup: group.partGroup,
        isCustom: false,
        isConditional: false,
        openNotesCount: 0,
        isPinned: false,
        completedCount: 0,
        totalCount: 0,
        matchesDirectFilter: true,
        depth: 0,
        children: forestRoots,
      };
      assignSubtreeDepthsAndCounts(catNode, 0);
      categoryNodes.push(catNode);
    }
  }

  for (const customCat of customCategories) {
    const catWps = visibleWps.filter((wp) => wp.categoryId === customCat.id);
    const forestRoots = buildNestedWorkpaperForest(
      catWps,
      workspace,
      pinnedSet,
      openNotesByIndex,
      1
    );
    const catNode: ExplorerNode = {
      id: `cat:custom:${customCat.id}`,
      nodeType: 'category',
      shortCode: customCat.code,
      label: customCat.label,
      categoryId: customCat.id,
      isCustom: true,
      isConditional: false,
      openNotesCount: 0,
      isPinned: false,
      completedCount: 0,
      totalCount: 0,
      matchesDirectFilter: true,
      depth: 0,
      children: forestRoots,
    };
    assignSubtreeDepthsAndCounts(catNode, 0);
    categoryNodes.push(catNode);
  }

  // Apply filter & compute autoExpandedIds
  const autoExpandedIds: Record<string, boolean> = {};
  const filteredCategories: ExplorerNode[] = [];
  for (const cat of categoryNodes) {
    const filtered = filterTreeNode(cat, normalizedQuery, statusFilter, hasActiveFilter, autoExpandedIds);
    if (filtered) {
      filteredCategories.push(filtered);
    }
  }

  // Pinned workpapers list (ordered by pinnedIndices array order)
  const wpByCode = new Map(visibleWps.map((w) => [w.kodeIndeks, w]));
  const pinnedWorkpapers: ExplorerNode[] = [];
  for (const pinnedCode of workspace.pinnedIndices ?? []) {
    const wp = wpByCode.get(pinnedCode);
    if (!wp) continue;
    const node = makeWorkpaperNode(wp, workspace, pinnedSet, openNotesByIndex, 0);
    const statusOk = matchesStatusFilter(node.status, statusFilter);
    const queryOk =
      !normalizedQuery ||
      node.shortCode.toLowerCase().includes(normalizedQuery) ||
      node.label.toLowerCase().includes(normalizedQuery) ||
      (node.saRelevan?.toLowerCase().includes(normalizedQuery) ?? false);
    if (statusOk && queryOk) {
      pinnedWorkpapers.push(node);
    }
  }

  const visibleWorkpaperCount = countMatchingWorkpapers(filteredCategories);

  return {
    categories: filteredCategories,
    pinnedWorkpapers,
    autoExpandedIds,
    visibleWorkpaperCount,
    totalWorkpaperCount,
    completedWorkpaperCount,
  };
}

export function collectAllExpandableNodeIds(nodes: ExplorerNode[]): string[] {
  const ids: string[] = [];
  const walk = (list: ExplorerNode[]) => {
    for (const node of list) {
      if (node.nodeType === 'category' || node.nodeType === 'subfolder' || node.children.length > 0) {
        ids.push(node.id);
      }
      if (node.children.length > 0) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return ids;
}
