import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { parseAtlasPortableBundle } from '../../store/storageAdapter';
import { AtlasPortableBundle } from '../../types/atlas';
import { EngagementHubPortal } from '../hub/EngagementHubPortal';
import { HomeIkhtisarView } from '../hub/HomeIkhtisarView';
import { ImportBundleModal } from '../hub/ImportBundleModal';
import { Part0ReferenceView } from '../hub/Part0ReferenceView';
import { Sprint0WorkpaperView } from '../hub/Sprint0WorkpaperView';
import { A110Dashboard } from '../phase_a/A110Dashboard';
import { A1101PriorIssues } from '../phase_a/A1101PriorIssues';
import { A1102Integrity } from '../phase_a/A1102Integrity';
import { A1102_1AmlAssessment } from '../phase_a/A1102_1AmlAssessment';
import { A1103TeamEvaluationView } from '../phase_a/A1103TeamEvaluation';
import { A1105Predecessor } from '../phase_a/A1105Predecessor';
import { A120TimeBudget } from '../phase_a/A120TimeBudget';
import { A130EngagementLetter } from '../phase_a/A130EngagementLetter';
import { A140AssignmentLetter } from '../phase_a/A140AssignmentLetter';
import { A150Independence } from '../phase_a/A150Independence';
import { A160TeamComm } from '../phase_a/A160TeamComm';
import { A170OpeningBalanceView } from '../phase_a/A170OpeningBalance';
import { Asm2View } from '../phase_a/Asm2View';
import { A210Materiality } from '../phase_a/A210Materiality';
import { A220Analytics } from '../phase_a/A220Analytics';
import { A230EntityUnderstanding } from '../phase_a/A230EntityUnderstanding';
import { A240InherentRisk } from '../phase_a/A240InherentRisk';
import { A250ControlCycles } from '../phase_a/A250ControlCycles';
import { A260GovernanceComm } from '../phase_a/A260GovernanceComm';
import { A270RommMatrix } from '../phase_a/A270RommMatrix';
import { A280StrategyUpdate } from '../phase_a/A280StrategyUpdate';
import { DynamicLeadScheduleView } from '../phase_b/DynamicLeadScheduleView';
import { FinancialStatementsB120 } from '../phase_b/FinancialStatementsB120';
import {
  SpecialProcedureIndex,
  SpecialProceduresB210_B280,
} from '../phase_b/SpecialProceduresB210_B280';
import { Wstb12Col } from '../phase_b/Wstb12Col';
import { C100SadAggregation } from '../phase_c/C100SadAggregation';
import { C110FinalMateriality } from '../phase_c/C110FinalMateriality';
import { C120FinalAnalytics } from '../phase_c/C120FinalAnalytics';
import { C210LaiReview } from '../phase_c/C210LaiReview';
import { C220DisclosureChecklist } from '../phase_c/C220DisclosureChecklist';
import { C230FinalMemorandum } from '../phase_c/C230FinalMemorandum';
import { C300EqcrGate } from '../phase_c/C300EqcrGate';
import { C400OpinionAndLai } from '../phase_c/C400OpinionAndLai';
import { CollapsibleBottomDrawer } from './CollapsibleBottomDrawer';
import { CommandPalette } from './CommandPalette';
import { SidebarTree } from './SidebarTree';
import { StickyWorkpaperHeader } from './StickyWorkpaperHeader';
import { TopBar } from './TopBar';

const PART0_REFERENCE_INDICES = new Set([
  'AuditCycle',
  'Daftar Lampiran',
  'Singkatan',
  'Petunjuk Isi',
]);

export const CaseWareShell: React.FC = () => {
  const {
    state,
    activeEngagement,
    uiPrefs,
    toast,
    dismissToast,
    dispatchAction,
    enterWorkspace,
    setActiveIndex,
  } = useAtlas();
  const [commandOpen, setCommandOpen] = useState(false);
  const [pendingImportBundle, setPendingImportBundle] = useState<AtlasPortableBundle | null>(null);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0 });
  }, [uiPrefs.activeIndex, uiPrefs.viewMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleTriggerImportModal = (raw: string) => {
    const parsed = parseAtlasPortableBundle(raw);
    setPendingImportBundle(parsed);
  };

  const hasImportConflict = Boolean(
    pendingImportBundle &&
      state.engagements.some((e) => e.id === pendingImportBundle.engagementBundle.header.id)
  );

  const renderWorkspaceContent = () => {
    const idx = uiPrefs.activeIndex;
    if (idx === 'HOME' || idx === 'HUB' || idx === 'MASTER_KAP') {
      return <HomeIkhtisarView />;
    }

    if (PART0_REFERENCE_INDICES.has(idx)) {
      return (
        <div className="space-y-3 max-w-5xl mx-auto">
          <div>
            <button
              type="button"
              onClick={() => setActiveIndex('HOME')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← Kembali ke Ikhtisar Perikatan (HOME)
            </button>
          </div>
          <Part0ReferenceView kodeIndeks={idx} />
        </div>
      );
    }

    // Sprint 1 — Modul A1 (Pre-Engagement)
    if (idx === 'A110') return <A110Dashboard />;
    if (idx === 'A1101') return <A1101PriorIssues />;
    if (idx === 'A1102') return <A1102Integrity />;
    if (idx === 'A1102.1') return <A1102_1AmlAssessment />;
    if (idx === 'A1103') return <A1103TeamEvaluationView />;
    if (idx === 'A1105') return <A1105Predecessor />;
    if (idx === 'A120') return <A120TimeBudget />;
    if (idx === 'A130') return <A130EngagementLetter />;
    if (idx === 'A140') return <A140AssignmentLetter />;
    if (idx === 'A150') return <A150Independence />;
    if (idx === 'A160') return <A160TeamComm />;
    if (idx === 'ASM2') return <Asm2View />;
    if (idx === 'A170') return <A170OpeningBalanceView />;

    // Sprint 2 — Modul A2 (Risk Assessment)
    if (idx === 'A210') return <A210Materiality />;
    if (idx === 'A220') return <A220Analytics />;
    if (idx === 'A230') return <A230EntityUnderstanding />;
    if (idx === 'A240') return <A240InherentRisk />;
    if (idx === 'A250') return <A250ControlCycles />;
    if (idx === 'A260') return <A260GovernanceComm />;
    if (idx === 'A270') return <A270RommMatrix />;
    if (idx === 'A280') return <A280StrategyUpdate />;

    // Sprint 3 — Modul B Core (WSTB, LK Audited, & Prosedur Khusus)
    if (idx === 'B100') return <Wstb12Col />;
    if (idx === 'B120') return <FinancialStatementsB120 />;
    if (
      idx === 'B210' ||
      idx === 'B220' ||
      idx === 'B230' ||
      idx === 'B240' ||
      idx === 'B250' ||
      idx === 'B260' ||
      idx === 'B270' ||
      idx === 'B280'
    ) {
      return <SpecialProceduresB210_B280 kodeIndeks={idx as SpecialProcedureIndex} />;
    }

    // Sprint 4 — Modul B Dynamic Lead Schedules (L02–L47 & Custom Leads)
    if (activeEngagement?.leadSchedules[idx]) {
      return <DynamicLeadScheduleView kodeIndeks={idx} />;
    }

    // Sprint 5 — Modul C (Completing, CALK, EQCR & Opini LAI)
    if (idx === 'C100') return <C100SadAggregation />;
    if (idx === 'C110') return <C110FinalMateriality />;
    if (idx === 'C120') return <C120FinalAnalytics />;
    if (idx === 'C210') return <C210LaiReview />;
    if (idx === 'C220') return <C220DisclosureChecklist />;
    if (idx === 'C230') return <C230FinalMemorandum />;
    if (idx === 'C300') return <C300EqcrGate />;
    if (idx === 'C400') return <C400OpinionAndLai />;

    return <Sprint0WorkpaperView kodeIndeks={idx} />;
  };

  return (
    <>
      {uiPrefs.viewMode === 'hub' ? (
        <EngagementHubPortal onTriggerImportModal={handleTriggerImportModal} />
      ) : (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 text-slate-900">
          <TopBar
            onOpenCommandPalette={() => setCommandOpen(true)}
            onTriggerImportModal={handleTriggerImportModal}
          />

          <div className="flex-1 flex min-h-0 overflow-hidden">
            <SidebarTree />

            <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-50">
              <StickyWorkpaperHeader />

              <div ref={mainScrollRef} className="flex-1 overflow-y-auto p-4">
                {renderWorkspaceContent()}
              </div>

              <CollapsibleBottomDrawer />
            </main>
          </div>

          <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
        </div>
      )}

      <ImportBundleModal
        bundle={pendingImportBundle}
        hasConflict={hasImportConflict}
        onClose={() => setPendingImportBundle(null)}
        onConfirm={(mode) => {
          if (!pendingImportBundle) return;
          dispatchAction({
            type: 'IMPORT_PORTABLE_BUNDLE',
            bundle: pendingImportBundle,
            mode,
          });
          setPendingImportBundle(null);
          enterWorkspace(undefined, 'HOME');
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          data-testid="atlas-toast"
          className={`fixed bottom-12 right-4 z-50 max-w-sm rounded border px-3 py-2 text-xs shadow-lg flex items-start gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-900 border-emerald-700 text-white'
              : toast.type === 'warning'
                ? 'bg-amber-900 border-amber-700 text-white'
                : toast.type === 'error'
                  ? 'bg-rose-900 border-rose-700 text-white'
                  : 'bg-slate-900 border-slate-700 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
          ) : toast.type === 'warning' || toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-snug">{toast.text}</span>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Tutup notifikasi"
            className="text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
};
