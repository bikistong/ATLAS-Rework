import { MASTER_INDICES, SIDEBAR_GROUPS } from '../data/masterIndices';
import {
  AccountingFramework,
  ClientOwnershipStatus,
  EngagementWorkspaceData,
  PartGroup,
  UserProfile,
  WorkpaperStatus,
} from '../types/atlas';
import { isIndexVisibleForWorkspace } from './formatters';

export type SidebarStatusFilter = 'semua' | 'belum' | 'selesai';
export type SakFilterOption = 'ALL' | 'SAK ETAP' | 'SAK Umum konvergensi IFRS' | 'SAK EMKM' | 'OTHER';

export interface EngagementProgressSummary {
  total: number;
  completed: number;
  percent: number;
  inProgress: number;
  prepared: number;
  reviewed: number;
  locked: number;
  openReviewNotes: number;
  partnerName: string;
  managerName: string;
  ketuaTimName: string;
}

export interface ModuleReadinessRow {
  partGroup: PartGroup;
  shortCode: string;
  label: string;
  firstIndex: string;
  total: number;
  inProgress: number;
  prepared: number;
  reviewed: number;
  locked: number;
}

const MODULE_FIRST_INDEX: Record<PartGroup, string> = {
  Part0: 'HOME',
  Part1: 'A110',
  Part2: 'A210',
  Part3: 'B100',
  Part4: 'L02',
  Part5: 'C100',
};

export function matchesStatusFilter(
  status: WorkpaperStatus | undefined,
  filter: SidebarStatusFilter
): boolean {
  if (filter === 'semua') return true;
  if (filter === 'belum') return !status || status === 'Kosong' || status === 'Draft';
  return status === 'Prepared' || status === 'Reviewed' || status === 'Locked';
}

export function matchesSakFilter(
  sak: AccountingFramework | undefined,
  filter: SakFilterOption
): boolean {
  if (filter === 'ALL') return true;
  if (!sak) return false;
  if (filter === 'OTHER') {
    return sak === 'SAK SYARIAH' || sak === 'SAP' || sak === 'SAK LAINNYA';
  }
  return sak === filter;
}

export function computeEngagementProgress(
  ws: EngagementWorkspaceData | undefined,
  users: UserProfile[],
  ownershipStatus?: ClientOwnershipStatus
): EngagementProgressSummary {
  if (!ws) {
    return {
      total: 0,
      completed: 0,
      percent: 0,
      inProgress: 0,
      prepared: 0,
      reviewed: 0,
      locked: 0,
      openReviewNotes: 0,
      partnerName: '-',
      managerName: '-',
      ketuaTimName: '-',
    };
  }

  const visibleWps = Object.values(ws.workingPapers).filter((wp) =>
    isIndexVisibleForWorkspace(wp.kodeIndeks, ws, ownershipStatus)
  );

  let inProgress = 0;
  let prepared = 0;
  let reviewed = 0;
  let locked = 0;

  for (const wp of visibleWps) {
    if (wp.status === 'Draft') inProgress++;
    else if (wp.status === 'Prepared') prepared++;
    else if (wp.status === 'Reviewed') reviewed++;
    else if (wp.status === 'Locked') locked++;
  }

  const total = visibleWps.length;
  const completed = prepared + reviewed + locked;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const openReviewNotes = ws.reviewNotes.filter((n) => n.status === 'Open').length;

  const findRoleName = (role: 'Partner' | 'Manager' | 'Ketua Tim') => {
    const member = ws.teamMembers.find((m) => m.peranTim === role);
    if (member) {
      const user = users.find((u) => u.id === member.userId);
      if (user) return user.namaLengkap;
    }
    return users.find((u) => u.role === role)?.namaLengkap ?? '-';
  };

  return {
    total,
    completed,
    percent,
    inProgress,
    prepared,
    reviewed,
    locked,
    openReviewNotes,
    partnerName: findRoleName('Partner'),
    managerName: findRoleName('Manager'),
    ketuaTimName: findRoleName('Ketua Tim'),
  };
}

export function computeModuleReadinessRows(
  ws: EngagementWorkspaceData,
  ownershipStatus?: ClientOwnershipStatus
): ModuleReadinessRow[] {
  const visibleWps = Object.values(ws.workingPapers).filter((wp) =>
    isIndexVisibleForWorkspace(wp.kodeIndeks, ws, ownershipStatus)
  );

  return SIDEBAR_GROUPS.map((group) => {
    const groupWps = visibleWps.filter(
      (wp) => !wp.categoryId && wp.partGroup === group.partGroup
    );
    const firstNonRef = MASTER_INDICES.find(
      (idx) =>
        idx.partGroup === group.partGroup &&
        !idx.isReferenceOnly &&
        isIndexVisibleForWorkspace(idx.kodeIndeks, ws, ownershipStatus)
    );

    return {
      partGroup: group.partGroup,
      shortCode: group.shortCode,
      label: group.label,
      firstIndex: firstNonRef?.kodeIndeks ?? MODULE_FIRST_INDEX[group.partGroup],
      total: groupWps.length,
      inProgress: groupWps.filter((w) => w.status === 'Draft').length,
      prepared: groupWps.filter((w) => w.status === 'Prepared').length,
      reviewed: groupWps.filter((w) => w.status === 'Reviewed').length,
      locked: groupWps.filter((w) => w.status === 'Locked').length,
    };
  });
}
