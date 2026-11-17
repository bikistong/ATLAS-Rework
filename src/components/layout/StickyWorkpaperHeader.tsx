import React from 'react';
import {
  CheckCircle2,
  Lock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import { MASTER_INDICES } from '../../data/masterIndices';
import { useAtlas } from '../../store/AtlasContext';
import {
  canPartnerLock,
  canSignPrepared,
  canSignReviewed,
  canUnlockPartnerLock,
  canUnprepare,
  canUnreview,
  isWorkpaperReadOnly,
} from '../../store/lockGuard';
import { formatIdDate } from '../../utils/formatters';
import { WorkpaperStatusBadge } from './StatusIcon';

export const StickyWorkpaperHeader: React.FC = () => {
  const { state, activeUser, activeEngagement, activeClient, uiPrefs, dispatchAction } = useAtlas();
  const kodeIndeks = uiPrefs.activeIndex;
  const meta = MASTER_INDICES.find((m) => m.kodeIndeks === kodeIndeks);
  const wp = activeEngagement?.workingPapers[kodeIndeks];
  const isArchived = activeEngagement?.header.isArchived ?? false;
  const isReadOnly = wp ? isWorkpaperReadOnly(activeEngagement, kodeIndeks) : isArchived;

  const openNotesCount =
    activeEngagement?.reviewNotes.filter(
      (n) => n.kodeIndeks === kodeIndeks && n.status === 'Open'
    ).length ?? 0;

  const showPrepareBtn = wp ? canSignPrepared(activeUser.role, wp.status, isArchived) : false;
  const showUnprepareBtn = wp ? canUnprepare(activeUser.role, wp.status, isArchived) : false;
  const showReviewBtn = wp ? canSignReviewed(activeUser.role, wp.status, isArchived) : false;
  const showUnreviewBtn = wp ? canUnreview(activeUser.role, wp.status, isArchived) : false;
  const lockCheck = wp
    ? canPartnerLock(activeUser.role, wp.status, openNotesCount, isArchived)
    : { allowed: false };
  const canShowPartnerLockBtn =
    wp && activeUser.role === 'Partner' && wp.status === 'Reviewed' && !isArchived;
  const showUnlockBtn = wp ? canUnlockPartnerLock(activeUser.role, wp.status, isArchived) : false;

  return (
    <div className="shrink-0">
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800">
              {kodeIndeks === 'MASTER_KAP' ? 'KAP' : kodeIndeks}
            </span>
            <h1 className="text-base font-semibold text-slate-900 truncate">
              {wp?.namaIndeks ?? meta?.namaIndeks ?? kodeIndeks}
            </h1>
            {wp && <WorkpaperStatusBadge status={wp.status} />}
            {(wp?.saRelevan ?? meta?.saRelevan) && (
              <span className="text-[11px] font-mono text-slate-500">
                · {wp?.saRelevan ?? meta?.saRelevan}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-slate-500">
            <span>
              KAP: <strong className="font-medium text-slate-700">{state.kapProfile.namaKap}</strong>
            </span>
            {activeClient && activeEngagement && (
              <span>
                Klien:{' '}
                <strong className="font-medium text-slate-700">
                  {activeClient.namaKlien} ({activeEngagement.header.tahunBuku})
                </strong>
              </span>
            )}
            {wp && (
              <span className="font-mono">
                Prep: {wp.preparedBy ? `${wp.preparedBy} (${formatIdDate(wp.preparedAt)})` : '-'} | Rev:{' '}
                {wp.reviewedBy ? `${wp.reviewedBy} (${formatIdDate(wp.reviewedAt)})` : '-'}
                {wp.partnerLockedBy ? ` | Lock: ${wp.partnerLockedBy}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* RBAC Sign-Off Action Controls */}
        {wp && (
          <div className="flex items-center gap-2 shrink-0">
            {showPrepareBtn && (
              <button
                type="button"
                data-testid="btn-sign-prepared"
                onClick={() =>
                  dispatchAction({
                    type: 'SIGN_OFF_WORKPAPER',
                    kodeIndeks,
                    operation: 'markPrepared',
                  })
                }
                className="h-8 px-3 rounded bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Prepared
              </button>
            )}

            {showUnprepareBtn && (
              <button
                type="button"
                onClick={() =>
                  dispatchAction({
                    type: 'SIGN_OFF_WORKPAPER',
                    kodeIndeks,
                    operation: 'unprepare',
                  })
                }
                className="h-8 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Batal Prepared
              </button>
            )}

            {showReviewBtn && (
              <button
                type="button"
                data-testid="btn-sign-reviewed"
                onClick={() =>
                  dispatchAction({
                    type: 'SIGN_OFF_WORKPAPER',
                    kodeIndeks,
                    operation: 'markReviewed',
                  })
                }
                className="h-8 px-3 rounded bg-sky-700 hover:bg-sky-800 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Review Sign-Off
              </button>
            )}

            {showUnreviewBtn && (
              <button
                type="button"
                onClick={() =>
                  dispatchAction({
                    type: 'SIGN_OFF_WORKPAPER',
                    kodeIndeks,
                    operation: 'unreview',
                  })
                }
                className="h-8 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Batal Review
              </button>
            )}

            {canShowPartnerLockBtn && (
              <button
                type="button"
                data-testid="btn-partner-lock"
                title={lockCheck.allowed ? 'Kunci final kertas kerja (SA 230)' : lockCheck.reason}
                onClick={() =>
                  dispatchAction({
                    type: 'SIGN_OFF_WORKPAPER',
                    kodeIndeks,
                    operation: 'partnerLock',
                  })
                }
                className={`h-8 px-3 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  lockCheck.allowed
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Partner Lock {openNotesCount > 0 ? `(${openNotesCount} Note Open)` : ''}
              </button>
            )}

            {showUnlockBtn && (
              <button
                type="button"
                data-testid="btn-unlock-partner"
                onClick={() =>
                  dispatchAction({
                    type: 'SIGN_OFF_WORKPAPER',
                    kodeIndeks,
                    operation: 'unlockPartnerLock',
                  })
                }
                className="h-8 px-2.5 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Unlock className="w-3.5 h-3.5" />
                Buka Kunci
              </button>
            )}
          </div>
        )}
      </div>

      {/* SA 230 Read-Only Lock Banner */}
      {isReadOnly && (
        <div
          data-testid="sa230-readonly-banner"
          className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-1.5 text-xs flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>
            <strong>Mode Baca-Saja (SA 230):</strong>{' '}
            {isArchived
              ? 'Perikatan ini telah diarsipkan final. Seluruh input dan mutasi dinonaktifkan.'
              : 'Kertas kerja ini telah dikunci final oleh Partner. Seluruh input dinonaktifkan.'}
          </span>
        </div>
      )}
    </div>
  );
};
