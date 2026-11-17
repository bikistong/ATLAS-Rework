import {
  EngagementWorkspaceData,
  ReviewNote,
  UserRole,
  WorkpaperStatus,
} from '../types/atlas';

/**
 * ATURAN ANTI-BUG #4: SA 230 Read-Only Lock Guard
 * Mengembalikan true jika perikatan telah diarsipkan (SA 230) ATAU KKP terkunci oleh Partner.
 */
export function isWorkpaperReadOnly(
  workspace: EngagementWorkspaceData | null | undefined,
  kodeIndeks: string
): boolean {
  if (!workspace) return false;
  if (workspace.header.isArchived) return true;
  const wp = workspace.workingPapers[kodeIndeks];
  return wp?.status === 'Locked';
}

export function guardWorkpaperMutation(
  workspace: EngagementWorkspaceData | null | undefined,
  kodeIndeks: string
): { allowed: boolean; reason?: string } {
  if (!workspace) {
    return { allowed: false, reason: 'Perikatan aktif tidak ditemukan.' };
  }
  if (workspace.header.isArchived) {
    return {
      allowed: false,
      reason: 'SA 230 Lock Guard: Perikatan telah diarsipkan final dan bersifat baca-saja.',
    };
  }
  if (workspace.workingPapers[kodeIndeks]?.status === 'Locked') {
    return {
      allowed: false,
      reason: `SA 230 Lock Guard: KKP ${kodeIndeks} telah dikunci final oleh Partner.`,
    };
  }
  return { allowed: true };
}

export function canSignPrepared(
  role: UserRole,
  status: WorkpaperStatus,
  isArchived: boolean
): boolean {
  if (isArchived) return false;
  if (role !== 'Anggota Tim' && role !== 'Ketua Tim') return false;
  return status === 'Kosong' || status === 'Draft';
}

export function canUnprepare(
  role: UserRole,
  status: WorkpaperStatus,
  isArchived: boolean
): boolean {
  if (isArchived) return false;
  if (status === 'Prepared') {
    return true; // Anggota Tim (sebelum direviu), Ketua Tim, Manager, Partner
  }
  return false;
}

export function canSignReviewed(
  role: UserRole,
  status: WorkpaperStatus,
  isArchived: boolean
): boolean {
  if (isArchived) return false;
  if (role !== 'Ketua Tim' && role !== 'Manager') return false;
  return status === 'Prepared';
}

export function canUnreview(
  role: UserRole,
  status: WorkpaperStatus,
  isArchived: boolean
): boolean {
  if (isArchived) return false;
  if (role !== 'Manager' && role !== 'Partner') return false;
  return status === 'Reviewed';
}

export function canPartnerLock(
  role: UserRole,
  status: WorkpaperStatus,
  openNotesCount: number,
  isArchived: boolean
): { allowed: boolean; reason?: string } {
  if (isArchived) return { allowed: false, reason: 'Perikatan sudah diarsipkan.' };
  if (role !== 'Partner') return { allowed: false, reason: 'Hanya Partner yang dapat mengunci KKP.' };
  if (status !== 'Reviewed') return { allowed: false, reason: 'KKP harus berstatus Reviewed terlebih dahulu.' };
  if (openNotesCount > 0) {
    return {
      allowed: false,
      reason: `Masih terdapat ${openNotesCount} Review Note berstatus Open pada KKP ini.`,
    };
  }
  return { allowed: true };
}

export function canUnlockPartnerLock(
  role: UserRole,
  status: WorkpaperStatus,
  isArchived: boolean
): boolean {
  if (isArchived) return false;
  return role === 'Partner' && status === 'Locked';
}

export function canClearReviewNote(
  role: UserRole,
  note: ReviewNote,
  activeUserId: string,
  isReadOnly: boolean
): boolean {
  if (isReadOnly) return false;
  if (note.status === 'Cleared') return false;
  if (role === 'Manager' || role === 'Partner') return true;
  if (role === 'Ketua Tim' && note.authorId === activeUserId) return true;
  return false;
}

export function canManageMaster(role: UserRole): boolean {
  return role === 'Partner' || role === 'Manager';
}

export function canArchiveEngagement(role: UserRole): boolean {
  return role === 'Partner';
}
