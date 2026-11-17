import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  A1101PriorIssues,
  A1102ManagementIntegrity,
  A1102_1AmlItem,
  A1103TeamEvaluation,
  A1105PredecessorComm,
  A110Evaluation,
  A120TimeBudget,
  A150IndependenceDeclaration,
  A170OpeningBalance,
  A210Materiality,
  A230EntityRiskItem,
  A240InherentRiskRow,
  A250ControlCycle,
  A250ControlTestItem,
  A260GovernanceComm,
  A270RommRow,
  A280StrategyUpdate,
  AtlasPortableBundle,
  AtlasStoreState,
  AttachmentItem,
  AuditJournalEntry,
  AuditPhase,
  AuditTrailEntry,
  ClientEntity,
  ClientGovernanceItem,
  CustomIndexCategory,
  EngagementHeader,
  EngagementTeamMember,
  EngagementType,
  EngagementWorkspaceData,
  HubTabId,
  KapProfile,
  LeadScheduleInstance,
  LegalChecklistItem,
  ModuleCData,
  DisclosureReviewItem,
  PartGroup,
  ReviewNote,
  SamplingRun,
  SpecialProceduresData,
  SubstantiveTestItem,
  TrialBalanceAccount,
  UiPreferences,
  UserProfile,
  UserRole,
  WorkingPaperRecord,
} from '../types/atlas';
import { getSeededProceduresForLead } from '../data/bLeadProceduresCatalog';
import { getC210ReviewChecklist, getDisclosuresForSak } from '../data/cModuleCatalog';
import { MASTER_INDICES } from '../data/masterIndices';
import {
  DEFAULT_CLIENTS,
  DEFAULT_KAP_PROFILE,
  DEFAULT_USERS,
  createInitialSeedEngagement,
  initializeNewEngagement,
} from '../data/seedData';
import {
  canArchiveEngagement,
  canClearReviewNote,
  canManageMaster,
  canPartnerLock,
  canSignPrepared,
  canSignReviewed,
  canUnlockPartnerLock,
  canUnprepare,
  canUnreview,
  guardWorkpaperMutation,
  isWorkpaperReadOnly,
} from './lockGuard';
import {
  loadAllWorkspacesFromIndexedDb,
  loadCoreMetadata,
  loadUiPreferences,
  saveCoreMetadata,
  saveUiPreferences,
  saveWorkspaceToIndexedDb,
} from './storageAdapter';
import {
  canSignOffA110Prepared,
  canSignOffA150Prepared,
  computeA1101Risk,
  computeA1102Risk,
  computeA1105Risk,
  computeAmlHighRiskFlag,
  recomputeWorkspaceA110,
} from '../utils/a1Formulas';
import {
  canSignOffA210Prepared,
  canSignOffA240Prepared,
  evaluateA250CycleControlRisk,
  recalculateA210FromState,
  recomputeA240Rows,
  recomputeModuleA2Cascade,
  recomputeWorkspaceA270,
} from '../utils/a2Formulas';
import {
  canSignOffB240Prepared,
  canSignOffB250Prepared,
  canSignOffWstbOrFsReviewed,
  nextJournalNumber,
  validateAuditJournalEntry,
  validateTrialBalanceImport,
} from '../utils/bCoreFormulas';
import {
  buildC230TwelvePillars,
  canSignOffC110Prepared,
  determineSuggestedOpinion,
  validateC400BeforeIssue,
} from '../utils/cModuleFormulas';
import { calculateEffectiveTimeBudget } from '../utils/timeCalculator';

export interface ToastNotice {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  text: string;
}

export interface CreateEngagementPayload {
  clientId: string;
  tipePerikatan: EngagementType;
  tahunBuku: number;
  periodeMulai: string;
  periodeSelesai: string;
  tanggalLaporanAuditor: string;
  tanggalPerikatan: string;
  nomorSuratPerikatan: string;
  nomorSuratTugas: string;
  seedDemoTrialBalance?: boolean;
}

export type AtlasAction =
  | { type: 'HYDRATE_STATE'; state: AtlasStoreState }
  | { type: 'SWITCH_USER'; userId: string }
  | { type: 'SET_ACTIVE_ENGAGEMENT'; engagementId: string | null }
  | { type: 'UPDATE_KAP_PROFILE'; patch: Partial<KapProfile> }
  | { type: 'UPSERT_USER'; user: UserProfile }
  | { type: 'UPSERT_CLIENT'; client: ClientEntity }
  | { type: 'CREATE_ENGAGEMENT'; payload: CreateEngagementPayload }
  | { type: 'SET_ENGAGEMENT_ARCHIVE'; engagementId: string; isArchived: boolean }
  | { type: 'UPDATE_WORKPAPER_NOTES'; kodeIndeks: string; catatanSimpulan: string }
  | {
      type: 'SIGN_OFF_WORKPAPER';
      kodeIndeks: string;
      operation:
        | 'markPrepared'
        | 'unprepare'
        | 'markReviewed'
        | 'unreview'
        | 'partnerLock'
        | 'unlockPartnerLock';
    }
  | {
      type: 'ADD_REVIEW_NOTE';
      kodeIndeks: string;
      catatan: string;
      parentNoteId?: string | null;
      assignedToId?: string;
    }
  | { type: 'ADDRESS_REVIEW_NOTE'; noteId: string; replyText?: string }
  | { type: 'CLEAR_REVIEW_NOTE'; noteId: string }
  | { type: 'ADD_ATTACHMENT'; attachment: Omit<AttachmentItem, 'id' | 'nomorUrut' | 'uploadedBy' | 'uploadedAt'> }
  | { type: 'DELETE_ATTACHMENT'; attachmentId: string; kodeIndeks: string }
  | { type: 'LOG_TIME'; kodeIndeks: string; tahapan: AuditPhase; durasiMenit: number; waktuMulai: string; waktuSelesai: string; keterangan?: string }
  | { type: 'IMPORT_PORTABLE_BUNDLE'; bundle: AtlasPortableBundle; mode: 'overwrite' | 'copy' }
  | {
      type: 'UPDATE_ENGAGEMENT_HEADER';
      patch: Partial<
        Pick<
          EngagementHeader,
          | 'tipePerikatan'
          | 'tanggalPerikatan'
          | 'tanggalLaporanAuditor'
          | 'nomorSuratPerikatan'
          | 'nomorSuratTugas'
          | 'periodeMulai'
          | 'periodeSelesai'
        >
      >;
      sourceIndeks?: string;
    }
  | {
      type: 'UPDATE_A110';
      patch: Partial<
        Pick<A110Evaluation, 'kriteriaIsuTerdahulu' | 'keputusanPenerimaan' | 'mitigasiRisiko'>
      >;
    }
  | { type: 'UPDATE_A1101'; patch: Partial<Omit<A1101PriorIssues, 'simpulanRisiko'>> }
  | {
      type: 'UPDATE_A1102';
      patch: Partial<Omit<A1102ManagementIntegrity, 'q6IndikasiTppu' | 'simpulanRisiko'>>;
    }
  | {
      type: 'UPDATE_A1102_1';
      kodeKriteria: string;
      patch: Partial<Pick<A1102_1AmlItem, 'jawaban' | 'penjelasan'>>;
    }
  | { type: 'UPDATE_A1103'; rows: A1103TeamEvaluation[] }
  | { type: 'UPSERT_GOVERNANCE_ITEM'; item: ClientGovernanceItem }
  | { type: 'DELETE_GOVERNANCE_ITEM'; itemId: string }
  | { type: 'UPDATE_A1105'; patch: Partial<Omit<A1105PredecessorComm, 'simpulanRisiko'>> }
  | {
      type: 'UPDATE_A120';
      patch: Partial<
        Pick<
          A120TimeBudget,
          | 'tanggalMulai'
          | 'tanggalSelesai'
          | 'hariLiburNasional'
          | 'isEqcrRequired'
          | 'temaPelatihanBerkelanjutan'
        >
      >;
    }
  | {
      type: 'UPDATE_TEAM_MEMBER_BUDGET';
      userId: string;
      patch: Partial<
        Pick<
          EngagementTeamMember,
          | 'tarifPerJam'
          | 'rencanaJamPraperikatan'
          | 'rencanaJamRiskResponse'
          | 'rencanaJamPelaporan'
        >
      >;
    }
  | {
      type: 'UPDATE_LEGAL_CLAUSE';
      kodeIndeks: 'A130' | 'A140' | 'A150' | 'A160';
      kodeKlausul: string;
      patch: Partial<Pick<LegalChecklistItem, 'isCompliant' | 'catatan'>>;
    }
  | {
      type: 'UPDATE_A150_DECLARATION';
      userId: string;
      patch: Partial<Omit<A150IndependenceDeclaration, 'userId'>>;
    }
  | { type: 'UPDATE_A170'; patch: Partial<A170OpeningBalance> }
  | {
      type: 'UPDATE_A210';
      patch: Partial<
        Pick<
          A210Materiality,
          | 'karakteristikEntitas'
          | 'acuanSaldo'
          | 'customBenchmarkValue'
          | 'marginOmPersen'
          | 'pertimbanganOm'
          | 'marginPmPersen'
          | 'pertimbanganPm'
          | 'marginAmptPersen'
          | 'pertimbanganAmpt'
        >
      >;
    }
  | { type: 'SYNC_A210_FROM_TB' }
  | {
      type: 'UPDATE_A220_SIMPULAN';
      simpulan:
        | 'Hasil analisis awal tidak terdapat risiko salah saji material'
        | 'Hasil analisis awal terdapat risiko salah saji material';
    }
  | {
      type: 'UPDATE_A230_ITEM';
      kodeSubIndeks: A230EntityRiskItem['kodeSubIndeks'];
      patch: Partial<Pick<A230EntityRiskItem, 'hasilAnalisis' | 'penjelasanAuditor' | 'isFraudRisk'>>;
    }
  | {
      type: 'UPDATE_A230_AFFECTED_ACCOUNTS';
      kodeSubIndeks: A230EntityRiskItem['kodeSubIndeks'];
      affectedAccounts: A230EntityRiskItem['affectedAccounts'];
    }
  | {
      type: 'UPDATE_A240_ROW';
      leadCode: string;
      patch: Partial<
        Pick<
          A240InherentRiskRow,
          'isSignificantAccount' | 'alasanSignifikansi' | 'isSignificantRisk' | 'irByAssertion' | 'catatanInherentRisk'
        >
      >;
    }
  | {
      type: 'UPSERT_A250_ITEM';
      kodeSiklus: A250ControlCycle['kodeSiklus'];
      item: A250ControlTestItem;
    }
  | {
      type: 'DELETE_A250_ITEM';
      kodeSiklus: A250ControlCycle['kodeSiklus'];
      itemId: string;
    }
  | {
      type: 'UPDATE_A250_CYCLE';
      kodeSiklus: A250ControlCycle['kodeSiklus'];
      patch: Partial<Pick<A250ControlCycle, 'catatanSimpulan' | 'simpulanPengendalian' | 'controlRiskLevel'>>;
    }
  | { type: 'UPDATE_A260'; patch: Partial<A260GovernanceComm> }
  | {
      type: 'UPDATE_A270_ROW';
      leadCode: string;
      patch: Partial<Pick<A270RommRow, 'cycleCode' | 'responAuditKomprehensif'>>;
    }
  | { type: 'RECALCULATE_A270' }
  | { type: 'UPDATE_A280'; patch: Partial<A280StrategyUpdate> }
  | { type: 'IMPORT_TRIAL_BALANCE'; accounts: TrialBalanceAccount[] }
  | {
      type: 'UPDATE_TRIAL_BALANCE_MAPPING';
      accountId: string;
      patch: Partial<
        Pick<
          TrialBalanceAccount,
          'posisiNormal' | 'groupAkun' | 'kelompokAkun' | 'headerAkun' | 'leadCode' | 'isClosingReAccount' | 'isOciAccount'
        >
      >;
    }
  | {
      type: 'UPSERT_JOURNAL';
      journal: Omit<AuditJournalEntry, 'id' | 'nomorJurnal' | 'totalDebit' | 'totalKredit' | 'createdBy' | 'createdAt'> & {
        id?: string;
        nomorJurnal?: string;
      };
    }
  | {
      type: 'SET_JOURNAL_STATUS';
      journalId: string;
      status: AuditJournalEntry['statusPersetujuan'];
    }
  | { type: 'DELETE_JOURNAL'; journalId: string }
  | {
      type: 'UPDATE_SPECIAL_PROCEDURE';
      kodeIndeks: 'B210' | 'B220' | 'B230' | 'B240' | 'B250' | 'B260' | 'B270' | 'B280';
      patch: Partial<SpecialProceduresData>;
    }
  | {
      type: 'UPDATE_LEAD_SCHEDULE';
      leadCode: string;
      patch: Partial<
        Pick<
          LeadScheduleInstance,
          | 'materialityType'
          | 'sapAssuranceLevel'
          | 'assertionsTested'
          | 'auditConclusion'
          | 'conclusionNotes'
        >
      >;
    }
  | {
      type: 'UPSERT_LEAD_PROCEDURE';
      leadCode: string;
      procedure: SubstantiveTestItem;
    }
  | {
      type: 'DELETE_LEAD_PROCEDURE';
      leadCode: string;
      procedureId: string;
    }
  | {
      type: 'SAVE_LEAD_SAMPLING_RUN';
      leadCode: string;
      samplingRun: SamplingRun;
    }
  | {
      type: 'SEND_SAMPLING_TO_SAD';
      leadCode: string;
      description: string;
      amount: number;
      misstatementType: 'Factual' | 'Projected' | 'Judgmental';
    }
  | {
      type: 'ADD_CUSTOM_LEAD_SCHEDULE';
      leadCode: string;
      title: string;
      accountCategory: string;
      normalBalance: 'DR' | 'CR';
    }
  | {
      type: 'UPSERT_SAD_ITEM';
      item: ModuleCData['c100SadItems'][number];
    }
  | { type: 'DELETE_SAD_ITEM'; itemId: string }
  | {
      type: 'UPDATE_C110';
      patch: Partial<ModuleCData['c110FinalMateriality']>;
    }
  | {
      type: 'UPDATE_C120_NOTE';
      accountCode: string;
      note: string;
    }
  | {
      type: 'UPDATE_C210_ITEM';
      itemNumber: number;
      patch: Partial<Pick<ModuleCData['c210LaiReviewItems'][number], 'status' | 'notes'>>;
    }
  | {
      type: 'UPDATE_C220_ITEM';
      itemId: string;
      patch: Partial<Pick<DisclosureReviewItem, 'responseStatus' | 'calkReferenceNote' | 'auditorComments'>>;
    }
  | { type: 'SYNC_C220_FRAMEWORK' }
  | {
      type: 'UPDATE_C230_MEMORANDUM';
      patch: Partial<ModuleCData['c230Memorandum']>;
    }
  | { type: 'SYNC_C230_FROM_MODULES' }
  | {
      type: 'UPDATE_C300_EQCR';
      patch: Partial<Omit<ModuleCData['c300Eqcr'], 'findings'>>;
    }
  | {
      type: 'UPSERT_C300_FINDING';
      finding: ModuleCData['c300Eqcr']['findings'][number];
    }
  | { type: 'DELETE_C300_FINDING'; findingId: string }
  | {
      type: 'UPDATE_C400_OPINION';
      patch: Partial<ModuleCData['c400Opinion']>;
    }
  | {
      type: 'CREATE_CUSTOM_CATEGORY';
      code: string;
      label: string;
    }
  | {
      type: 'RENAME_CUSTOM_CATEGORY';
      categoryId: string;
      code?: string;
      label: string;
    }
  | {
      type: 'DELETE_CUSTOM_CATEGORY';
      categoryId: string;
    }
  | {
      type: 'CREATE_CUSTOM_WORKPAPER';
      kodeIndeks: string;
      namaIndeks: string;
      partGroup: PartGroup;
      categoryId?: string;
      parentIndeks?: string | null;
      saRelevan?: string;
    }
  | {
      type: 'RENAME_CUSTOM_WORKPAPER';
      kodeIndeks: string;
      namaIndeks: string;
      saRelevan?: string;
    }
  | {
      type: 'DELETE_CUSTOM_WORKPAPER';
      kodeIndeks: string;
    }
  | {
      type: 'TOGGLE_PIN_WORKPAPER';
      kodeIndeks: string;
    };

export interface ReducerOutcome {
  state: AtlasStoreState;
  notice?: Omit<ToastNotice, 'id'>;
}

export function createDefaultAtlasState(): AtlasStoreState {
  const seedWs = createInitialSeedEngagement();
  return {
    kapProfile: { ...DEFAULT_KAP_PROFILE },
    users: DEFAULT_USERS.map((u) => ({ ...u })),
    activeUserId: DEFAULT_USERS[2].id, // Ketua Tim default aktif agar langsung bisa review/prepare & coba switcher
    clients: DEFAULT_CLIENTS.map((c) => ({ ...c })),
    engagements: [seedWs.header],
    activeEngagementId: seedWs.header.id,
    workspaces: {
      [seedWs.header.id]: seedWs,
    },
  };
}

function getActiveUser(state: AtlasStoreState): UserProfile {
  return (
    state.users.find((u) => u.id === state.activeUserId) ??
    state.users[0] ??
    DEFAULT_USERS[0]
  );
}

function makeAuditEntry(
  user: UserProfile,
  kodeIndeks: string,
  action: string,
  detail: string
): AuditTrailEntry {
  return {
    id: `at-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.namaLengkap,
    userRole: user.role,
    kodeIndeks,
    action,
    detail,
  };
}

function defaultHourlyRate(role: UserRole): number {
  switch (role) {
    case 'Partner':
      return 1500000;
    case 'Manager':
      return 950000;
    case 'Ketua Tim':
      return 600000;
    default:
      return 350000;
  }
}

function touchWorkpaperDraft(
  workingPapers: Record<string, WorkingPaperRecord>,
  kodeIndeks: string
): Record<string, WorkingPaperRecord> {
  const wp = workingPapers[kodeIndeks];
  if (!wp || wp.status !== 'Kosong') return workingPapers;
  return {
    ...workingPapers,
    [kodeIndeks]: { ...wp, status: 'Draft' },
  };
}

function resolveEngagementClient(state: AtlasStoreState, ws: EngagementWorkspaceData): ClientEntity {
  return (
    state.clients.find((c) => c.id === ws.header.clientId) ??
    state.clients[0] ??
    DEFAULT_CLIENTS[0]
  );
}

function updateWorkspace(
  state: AtlasStoreState,
  engagementId: string,
  updater: (ws: EngagementWorkspaceData) => EngagementWorkspaceData
): AtlasStoreState {
  const currentWs = state.workspaces[engagementId];
  if (!currentWs) return state;
  const updatedWs = updater(currentWs);
  const nowIso = new Date().toISOString();
  const nextHeader = { ...updatedWs.header, updatedAt: nowIso };
  const finalWs = { ...updatedWs, header: nextHeader };

  return {
    ...state,
    engagements: state.engagements.map((e) => (e.id === engagementId ? nextHeader : e)),
    workspaces: {
      ...state.workspaces,
      [engagementId]: finalWs,
    },
  };
}

export function atlasReducerWithOutcome(
  state: AtlasStoreState,
  action: AtlasAction
): ReducerOutcome {
  const activeUser = getActiveUser(state);
  const activeEngId = state.activeEngagementId;
  const activeWs = activeEngId ? state.workspaces[activeEngId] : undefined;

  switch (action.type) {
    case 'HYDRATE_STATE':
      return { state: action.state };

    case 'SWITCH_USER': {
      const target = state.users.find((u) => u.id === action.userId);
      if (!target) return { state };
      return {
        state: { ...state, activeUserId: target.id },
        notice: { type: 'info', text: `Beralih peran ke ${target.namaLengkap} (${target.role}).` },
      };
    }

    case 'SET_ACTIVE_ENGAGEMENT':
      return {
        state: { ...state, activeEngagementId: action.engagementId },
      };

    case 'UPDATE_KAP_PROFILE': {
      if (!canManageMaster(activeUser.role)) {
        return {
          state,
          notice: { type: 'warning', text: 'Akses ditolak: Hanya Partner atau Manager yang dapat mengubah Master KAP.' },
        };
      }
      const nextKap: KapProfile = {
        ...state.kapProfile,
        ...action.patch,
        updatedAt: new Date().toISOString(),
      };
      return {
        state: { ...state, kapProfile: nextKap },
        notice: { type: 'success', text: `Profil KAP "${nextKap.namaKap}" diperbarui.` },
      };
    }

    case 'UPSERT_USER': {
      if (!canManageMaster(activeUser.role)) {
        return {
          state,
          notice: { type: 'warning', text: 'Akses ditolak: Hanya Partner atau Manager yang dapat mengelola tim KAP.' },
        };
      }
      const exists = state.users.some((u) => u.id === action.user.id);
      const nextUsers = exists
        ? state.users.map((u) => (u.id === action.user.id ? action.user : u))
        : [...state.users, action.user];
      return {
        state: { ...state, users: nextUsers },
        notice: { type: 'success', text: `Data personel ${action.user.namaLengkap} disimpan.` },
      };
    }

    case 'UPSERT_CLIENT': {
      if (!canManageMaster(activeUser.role)) {
        return {
          state,
          notice: { type: 'warning', text: 'Akses ditolak: Hanya Partner atau Manager yang dapat mengelola data klien.' },
        };
      }
      const exists = state.clients.some((c) => c.id === action.client.id);
      const nextClients = exists
        ? state.clients.map((c) => (c.id === action.client.id ? action.client : c))
        : [...state.clients, action.client];
      return {
        state: { ...state, clients: nextClients },
        notice: { type: 'success', text: `Entitas klien ${action.client.namaKlien} disimpan.` },
      };
    }

    case 'CREATE_ENGAGEMENT': {
      const client = state.clients.find((c) => c.id === action.payload.clientId);
      if (!client) {
        return { state, notice: { type: 'error', text: 'Entitas klien tidak ditemukan.' } };
      }
      const newWorkspace = initializeNewEngagement({
        client,
        users: state.users,
        createdByUser: activeUser,
        tipePerikatan: action.payload.tipePerikatan,
        tahunBuku: action.payload.tahunBuku,
        periodeMulai: action.payload.periodeMulai,
        periodeSelesai: action.payload.periodeSelesai,
        tanggalLaporanAuditor: action.payload.tanggalLaporanAuditor,
        tanggalPerikatan: action.payload.tanggalPerikatan,
        nomorSuratPerikatan: action.payload.nomorSuratPerikatan,
        nomorSuratTugas: action.payload.nomorSuratTugas,
        seedDemoTrialBalance: action.payload.seedDemoTrialBalance ?? false,
      });

      return {
        state: {
          ...state,
          engagements: [newWorkspace.header, ...state.engagements],
          activeEngagementId: newWorkspace.header.id,
          workspaces: {
            ...state.workspaces,
            [newWorkspace.header.id]: newWorkspace,
          },
        },
        notice: {
          type: 'success',
          text: `Perikatan ${client.namaKlien} (${action.payload.tahunBuku}) berhasil diinisialisasi.`,
        },
      };
    }

    case 'SET_ENGAGEMENT_ARCHIVE': {
      if (!canArchiveEngagement(activeUser.role)) {
        return {
          state,
          notice: { type: 'warning', text: 'Akses ditolak: Hanya Partner yang dapat mengarsipkan/membuka arsip SA 230.' },
        };
      }
      const targetWs = state.workspaces[action.engagementId];
      if (!targetWs) return { state };
      const nowIso = new Date().toISOString();
      const nextState = updateWorkspace(state, action.engagementId, (ws) => ({
        ...ws,
        header: {
          ...ws.header,
          isArchived: action.isArchived,
          archivedAt: action.isArchived ? nowIso : undefined,
          archivedBy: action.isArchived ? activeUser.inisial : undefined,
        },
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            'HUB',
            action.isArchived ? 'ARSIP FINAL SA 230' : 'BUKA ARSIP SA 230',
            action.isArchived
              ? 'Seluruh kertas kerja dikunci baca-saja (Final Assembly SA 230).'
              : 'Status arsip final SA 230 dibuka kembali oleh Partner.'
          ),
        ],
      }));
      return {
        state: nextState,
        notice: {
          type: action.isArchived ? 'info' : 'warning',
          text: action.isArchived
            ? 'Perikatan diarsipkan final (SA 230). Seluruh KKP kini baca-saja.'
            : 'Arsip SA 230 dibuka kembali oleh Partner.',
        },
      };
    }

    case 'UPDATE_WORKPAPER_NOTES': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.kodeIndeks);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const currentWp = activeWs.workingPapers[action.kodeIndeks];
      if (!currentWp) return { state };
      const nextStatus = currentWp.status === 'Kosong' ? 'Draft' : currentWp.status;
      const nextWp: WorkingPaperRecord = {
        ...currentWp,
        status: nextStatus,
        catatanSimpulan: action.catatanSimpulan,
      };
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        workingPapers: {
          ...ws.workingPapers,
          [action.kodeIndeks]: nextWp,
        },
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            action.kodeIndeks,
            'SIMPAN KKP',
            `Memperbarui catatan simpulan pada indeks ${action.kodeIndeks}.`
          ),
        ],
      }));
      return {
        state: nextState,
        notice: { type: 'success', text: `Kertas kerja ${action.kodeIndeks} tersimpan.` },
      };
    }

    case 'SIGN_OFF_WORKPAPER': {
      if (!activeEngId || !activeWs) return { state };
      const wp = activeWs.workingPapers[action.kodeIndeks];
      if (!wp) return { state };
      const isArchived = activeWs.header.isArchived;
      if (isArchived) {
        return {
          state,
          notice: { type: 'warning', text: 'SA 230 Lock Guard: Perikatan sudah diarsipkan final.' },
        };
      }

      const nowIso = new Date().toISOString();
      let nextWp: WorkingPaperRecord = { ...wp };
      let actionLabel = '';
      let detail = '';

      if (action.operation === 'markPrepared') {
        if (!canSignPrepared(activeUser.role, wp.status, isArchived)) {
          return { state, notice: { type: 'warning', text: 'Sign-off Prepared hanya oleh Anggota Tim atau Ketua Tim saat status Kosong/Draft.' } };
        }
        if (action.kodeIndeks === 'A110') {
          const gate = canSignOffA110Prepared(activeWs.a110);
          if (!gate.allowed) {
            return { state, notice: { type: 'warning', text: gate.reason ?? 'Gate A110 belum terpenuhi.' } };
          }
        }
        if (action.kodeIndeks === 'A150') {
          const gate = canSignOffA150Prepared(activeWs.a150Declarations, activeWs.teamMembers);
          if (!gate.allowed) {
            return { state, notice: { type: 'warning', text: gate.reason ?? 'Gate A150 belum terpenuhi.' } };
          }
        }
        if (action.kodeIndeks === 'A210') {
          const gate = canSignOffA210Prepared(activeWs.a210);
          if (!gate.allowed) {
            return { state, notice: { type: 'warning', text: gate.reason ?? 'Gate A210 belum terpenuhi.' } };
          }
        }
        if (action.kodeIndeks === 'A240') {
          const gate = canSignOffA240Prepared(activeWs.a240Rows);
          if (!gate.allowed) {
            return { state, notice: { type: 'warning', text: gate.reason ?? 'Gate A240 belum terpenuhi.' } };
          }
        }
        if (action.kodeIndeks === 'B240') {
          const gate = canSignOffB240Prepared(activeWs.specialProcedures.b240);
          if (!gate.allowed) {
            return { state, notice: { type: 'warning', text: gate.reason ?? 'Gate B240 belum terpenuhi.' } };
          }
        }
        if (action.kodeIndeks === 'B250') {
          const gate = canSignOffB250Prepared(activeWs.specialProcedures.b250, activeWs.header);
          if (!gate.allowed) {
            return { state, notice: { type: 'error', text: gate.reason ?? 'Gate SA 580 B250 belum terpenuhi.' } };
          }
        }
        if (action.kodeIndeks === 'C110') {
          const gate = canSignOffC110Prepared(activeWs);
          if (!gate.allowed) {
            return { state, notice: { type: 'error', text: gate.reason ?? 'Gate SA 320.12 C110 belum terpenuhi.' } };
          }
        }
        nextWp = { ...wp, status: 'Prepared', preparedBy: activeUser.inisial, preparedAt: nowIso };
        actionLabel = 'SIGN-OFF PREPARED';
        detail = `${action.kodeIndeks} ditandai Prepared oleh ${activeUser.namaLengkap} (${activeUser.inisial}).`;
      } else if (action.operation === 'unprepare') {
        if (!canUnprepare(activeUser.role, wp.status, isArchived)) {
          return { state, notice: { type: 'warning', text: 'Pembatalan Prepared tidak diizinkan pada status ini.' } };
        }
        nextWp = { ...wp, status: 'Draft', preparedBy: undefined, preparedAt: undefined };
        actionLabel = 'BATAL PREPARED';
        detail = `Status Prepared ${action.kodeIndeks} dibatalkan oleh ${activeUser.namaLengkap}.`;
      } else if (action.operation === 'markReviewed') {
        if (!canSignReviewed(activeUser.role, wp.status, isArchived)) {
          return { state, notice: { type: 'warning', text: 'Review Sign-Off hanya oleh Ketua Tim atau Manager setelah status Prepared.' } };
        }
        if (action.kodeIndeks === 'B100' || action.kodeIndeks === 'B120') {
          const gate = canSignOffWstbOrFsReviewed(activeWs.trialBalance, activeWs.journals);
          if (!gate.allowed) {
            return { state, notice: { type: 'error', text: gate.reason ?? 'Neraca belum seimbang.' } };
          }
        }
        nextWp = { ...wp, status: 'Reviewed', reviewedBy: activeUser.inisial, reviewedAt: nowIso };
        actionLabel = 'SIGN-OFF REVIEWED';
        detail = `${action.kodeIndeks} direviu dan disetujui oleh ${activeUser.namaLengkap} (${activeUser.inisial}).`;
      } else if (action.operation === 'unreview') {
        if (!canUnreview(activeUser.role, wp.status, isArchived)) {
          return { state, notice: { type: 'warning', text: 'Pembatalan Review hanya oleh Manager atau Partner.' } };
        }
        nextWp = { ...wp, status: 'Prepared', reviewedBy: undefined, reviewedAt: undefined };
        actionLabel = 'BATAL REVIEWED';
        detail = `Status Reviewed ${action.kodeIndeks} dikembalikan ke Prepared oleh ${activeUser.namaLengkap}.`;
      } else if (action.operation === 'partnerLock') {
        const openNotesCount = activeWs.reviewNotes.filter(
          (n) => n.kodeIndeks === action.kodeIndeks && n.status === 'Open'
        ).length;
        const lockCheck = canPartnerLock(activeUser.role, wp.status, openNotesCount, isArchived);
        if (!lockCheck.allowed) {
          return { state, notice: { type: 'warning', text: lockCheck.reason ?? 'Partner Lock ditolak.' } };
        }
        if (action.kodeIndeks === 'C400') {
          const wsClient = state.clients.find((c) => c.id === activeWs.header.clientId);
          const c400Gate = validateC400BeforeIssue(activeWs, wsClient);
          if (!c400Gate.allowed) {
            return {
              state,
              notice: {
                type: 'error',
                text: c400Gate.reasons[0] ?? 'Validasi C400 / Gerbang EQCR C300 belum terpenuhi.',
              },
            };
          }
        }
        nextWp = { ...wp, status: 'Locked', partnerLockedBy: activeUser.inisial, partnerLockedAt: nowIso };
        actionLabel = 'PARTNER LOCK (SA 230)';
        detail = `${action.kodeIndeks} dikunci final oleh Partner ${activeUser.namaLengkap} (${activeUser.inisial}).`;
      } else if (action.operation === 'unlockPartnerLock') {
        if (!canUnlockPartnerLock(activeUser.role, wp.status, isArchived)) {
          return { state, notice: { type: 'warning', text: 'Hanya Partner yang dapat membuka kunci KKP (selama belum diarsipkan).' } };
        }
        nextWp = { ...wp, status: 'Reviewed', partnerLockedBy: undefined, partnerLockedAt: undefined };
        actionLabel = 'BUKA KUNCI PARTNER';
        detail = `Kunci Partner pada ${action.kodeIndeks} dibuka kembali oleh ${activeUser.namaLengkap}.`;
      }

      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        workingPapers: {
          ...ws.workingPapers,
          [action.kodeIndeks]: nextWp,
        },
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(activeUser, action.kodeIndeks, actionLabel, detail),
        ],
      }));

      return { state: nextState, notice: { type: 'success', text: detail } };
    }

    case 'ADD_REVIEW_NOTE': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.kodeIndeks);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const trimmed = action.catatan.trim();
      if (!trimmed) return { state };
      const newNote: ReviewNote = {
        id: `rn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kodeIndeks: action.kodeIndeks,
        parentNoteId: action.parentNoteId ?? null,
        authorId: activeUser.id,
        assignedToId: action.assignedToId,
        catatan: trimmed,
        status: 'Open',
        createdAt: new Date().toISOString(),
      };
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        reviewNotes: [...ws.reviewNotes, newNote],
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            action.kodeIndeks,
            'TAMBAH REVIEW NOTE',
            `Menambahkan review note pada ${action.kodeIndeks}: "${trimmed.slice(0, 80)}"`
          ),
        ],
      }));
      return { state: nextState, notice: { type: 'info', text: 'Review note ditambahkan.' } };
    }

    case 'ADDRESS_REVIEW_NOTE': {
      if (!activeEngId || !activeWs) return { state };
      const target = activeWs.reviewNotes.find((n) => n.id === action.noteId);
      if (!target) return { state };
      if (isWorkpaperReadOnly(activeWs, target.kodeIndeks)) {
        return { state, notice: { type: 'warning', text: 'SA 230 Lock Guard: KKP terkunci.' } };
      }
      const replyNote: ReviewNote | null =
        action.replyText && action.replyText.trim()
          ? {
              id: `rn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              kodeIndeks: target.kodeIndeks,
              parentNoteId: target.id,
              authorId: activeUser.id,
              catatan: action.replyText.trim(),
              status: 'Addressed',
              createdAt: new Date().toISOString(),
            }
          : null;

      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        reviewNotes: [
          ...ws.reviewNotes.map((n) =>
            n.id === target.id ? { ...n, status: 'Addressed' as const } : n
          ),
          ...(replyNote ? [replyNote] : []),
        ],
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            target.kodeIndeks,
            'JAWAB REVIEW NOTE',
            `Menandai review note sebagai Addressed oleh ${activeUser.namaLengkap}.`
          ),
        ],
      }));
      return { state: nextState, notice: { type: 'success', text: 'Review note ditandai telah ditanggapi.' } };
    }

    case 'CLEAR_REVIEW_NOTE': {
      if (!activeEngId || !activeWs) return { state };
      const target = activeWs.reviewNotes.find((n) => n.id === action.noteId);
      if (!target) return { state };
      const readOnly = isWorkpaperReadOnly(activeWs, target.kodeIndeks);
      if (!canClearReviewNote(activeUser.role, target, activeUser.id, readOnly)) {
        return {
          state,
          notice: {
            type: 'warning',
            text: 'Hanya Manager, Partner, atau pembuat catatan (Ketua Tim) yang dapat menutup Review Note.',
          },
        };
      }
      const nowIso = new Date().toISOString();
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        reviewNotes: ws.reviewNotes.map((n) =>
          n.id === target.id || n.parentNoteId === target.id
            ? { ...n, status: 'Cleared' as const, clearedBy: activeUser.inisial, clearedAt: nowIso }
            : n
        ),
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            target.kodeIndeks,
            'CLEAR REVIEW NOTE',
            `Menutup (Cleared) review note pada ${target.kodeIndeks}.`
          ),
        ],
      }));
      return { state: nextState, notice: { type: 'success', text: 'Review note ditutup (Cleared).' } };
    }

    case 'ADD_ATTACHMENT': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.attachment.kodeIndeks);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextItem: AttachmentItem = {
        ...action.attachment,
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nomorUrut: activeWs.attachments.length + 1,
        uploadedBy: activeUser.inisial,
        uploadedAt: new Date().toISOString(),
      };
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        attachments: [...ws.attachments, nextItem],
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            action.attachment.kodeIndeks,
            'UNGGAH LAMPIRAN',
            `Mengunggah file "${nextItem.namaDokumen}" pada indeks ${nextItem.kodeIndeks}.`
          ),
        ],
      }));
      return { state: nextState, notice: { type: 'success', text: `Lampiran "${nextItem.namaDokumen}" ditambahkan.` } };
    }

    case 'DELETE_ATTACHMENT': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.kodeIndeks);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const removed = activeWs.attachments.find((a) => a.id === action.attachmentId);
      if (!removed) return { state };
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        attachments: ws.attachments.filter((a) => a.id !== action.attachmentId),
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            action.kodeIndeks,
            'HAPUS LAMPIRAN',
            `Menghapus lampiran "${removed.namaDokumen}".`
          ),
        ],
      }));
      return { state: nextState, notice: { type: 'info', text: 'Lampiran dihapus.' } };
    }

    case 'LOG_TIME': {
      if (!activeEngId || !activeWs) return { state };
      if (action.durasiMenit <= 0) return { state };
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        timeLogs: [
          ...ws.timeLogs,
          {
            id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            kodeIndeks: action.kodeIndeks,
            userId: activeUser.id,
            tahapan: action.tahapan,
            waktuMulai: action.waktuMulai,
            waktuSelesai: action.waktuSelesai,
            durasiMenit: action.durasiMenit,
            keterangan: action.keterangan,
          },
        ],
      }));
      return {
        state: nextState,
        notice: {
          type: 'info',
          text: `Timer dicatat: ${action.durasiMenit} menit pada ${action.kodeIndeks}.`,
        },
      };
    }

    case 'IMPORT_PORTABLE_BUNDLE': {
      const { bundle, mode } = action;
      const incomingHeader = bundle.engagementBundle.header;
      const isCopy = mode === 'copy';
      const newEngId = isCopy ? `eng-imp-${Date.now()}` : incomingHeader.id;
      const importedHeader: EngagementHeader = {
        ...incomingHeader,
        id: newEngId,
        nomorSuratPerikatan: isCopy
          ? `${incomingHeader.nomorSuratPerikatan} (Salinan)`
          : incomingHeader.nomorSuratPerikatan,
        updatedAt: new Date().toISOString(),
      };
      const importedWorkspace: EngagementWorkspaceData = {
        ...bundle.engagementBundle,
        customCategories: bundle.engagementBundle.customCategories ?? [],
        pinnedIndices: bundle.engagementBundle.pinnedIndices ?? [],
        header: importedHeader,
        auditTrail: [
          ...bundle.engagementBundle.auditTrail,
          makeAuditEntry(
            activeUser,
            'HUB',
            'IMPORT .ATLAS.JSON',
            `Memulihkan arsip perikatan (${mode === 'copy' ? 'sebagai salinan baru' : 'timpa data lama'}).`
          ),
        ],
      };

      const clientExists = state.clients.some((c) => c.id === bundle.client.id);
      const nextClients = clientExists
        ? state.clients.map((c) => (c.id === bundle.client.id ? bundle.client : c))
        : [...state.clients, bundle.client];

      const engExists = state.engagements.some((e) => e.id === newEngId);
      const nextEngagements = engExists
        ? state.engagements.map((e) => (e.id === newEngId ? importedHeader : e))
        : [importedHeader, ...state.engagements];

      return {
        state: {
          ...state,
          clients: nextClients,
          engagements: nextEngagements,
          activeEngagementId: newEngId,
          workspaces: {
            ...state.workspaces,
            [newEngId]: importedWorkspace,
          },
        },
        notice: {
          type: 'success',
          text: `Arsip "${bundle.client.namaKlien} (${importedHeader.tahunBuku})" berhasil diimpor.`,
        },
      };
    }

    case 'UPDATE_ENGAGEMENT_HEADER': {
      if (!activeEngId || !activeWs) return { state };
      const targetIndeks = action.sourceIndeks ?? 'A110';
      const guard = guardWorkpaperMutation(activeWs, targetIndeks);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const client = resolveEngagementClient(state, activeWs);
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const drafted: EngagementWorkspaceData = {
          ...ws,
          header: { ...ws.header, ...action.patch },
          workingPapers: touchWorkpaperDraft(ws.workingPapers, targetIndeks),
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              targetIndeks,
              'UBAH HEADER PERIKATAN',
              `Memperbarui atribut header perikatan melalui indeks ${targetIndeks}.`
            ),
          ],
        };
        return {
          ...drafted,
          a110: recomputeWorkspaceA110(drafted, client),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A110': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A110');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const client = resolveEngagementClient(state, activeWs);
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const merged: EngagementWorkspaceData = {
          ...ws,
          a110: { ...ws.a110, ...action.patch },
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A110'),
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              'A110',
              'UPDATE A110',
              'Memperbarui parameter penerimaan & keberlanjutan perikatan.'
            ),
          ],
        };
        return {
          ...merged,
          a110: recomputeWorkspaceA110(merged, client),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A1101': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A1101');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const client = resolveEngagementClient(state, activeWs);
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const mergedA1101 = { ...ws.a1101, ...action.patch };
        const nextA1101: A1101PriorIssues = {
          ...mergedA1101,
          simpulanRisiko: computeA1101Risk(mergedA1101),
        };
        const merged: EngagementWorkspaceData = {
          ...ws,
          a1101: nextA1101,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A1101'),
        };
        return {
          ...merged,
          a110: recomputeWorkspaceA110(merged, client),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A1102': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A1102');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const client = resolveEngagementClient(state, activeWs);
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const syncedQ6 = computeAmlHighRiskFlag(ws.a1102_1);
        const mergedA1102: A1102ManagementIntegrity = {
          ...ws.a1102,
          ...action.patch,
          q6IndikasiTppu: syncedQ6,
        };
        const nextA1102: A1102ManagementIntegrity = {
          ...mergedA1102,
          simpulanRisiko: computeA1102Risk(mergedA1102, ws.a1102_1),
        };
        const merged: EngagementWorkspaceData = {
          ...ws,
          a1102: nextA1102,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A1102'),
        };
        return {
          ...merged,
          a110: recomputeWorkspaceA110(merged, client),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A1102_1': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A1102.1');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const client = resolveEngagementClient(state, activeWs);
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextAml = ws.a1102_1.map((item) =>
          item.kodeKriteria === action.kodeKriteria ? { ...item, ...action.patch } : item
        );
        const syncedQ6 = computeAmlHighRiskFlag(nextAml);
        const nextA1102Base: A1102ManagementIntegrity = {
          ...ws.a1102,
          q6IndikasiTppu: syncedQ6,
        };
        const nextA1102: A1102ManagementIntegrity = {
          ...nextA1102Base,
          simpulanRisiko: computeA1102Risk(nextA1102Base, nextAml),
        };
        const merged: EngagementWorkspaceData = {
          ...ws,
          a1102_1: nextAml,
          a1102: nextA1102,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A1102.1'),
        };
        return {
          ...merged,
          a110: recomputeWorkspaceA110(merged, client),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A1103': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A1103');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const client = resolveEngagementClient(state, activeWs);
      const boundedRows = action.rows.slice(0, 15);
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const selectedRows = boundedRows.filter((r) => r.isSelected);
        const existingMemberMap = new Map(ws.teamMembers.map((m) => [m.userId, m]));
        const nextTeamMembers: EngagementTeamMember[] = selectedRows.map((row) => {
          const existing = existingMemberMap.get(row.userId);
          if (existing) {
            return { ...existing, peranTim: row.peranTim };
          }
          return {
            userId: row.userId,
            peranTim: row.peranTim,
            tarifPerJam: defaultHourlyRate(row.peranTim),
            rencanaJamPraperikatan: row.peranTim === 'Partner' ? 4 : row.peranTim === 'Manager' ? 8 : 16,
            rencanaJamRiskResponse: row.peranTim === 'Partner' ? 6 : row.peranTim === 'Manager' ? 16 : 40,
            rencanaJamPelaporan: row.peranTim === 'Partner' ? 6 : row.peranTim === 'Manager' ? 10 : 16,
          };
        });

        const existingDeclMap = new Map(ws.a150Declarations.map((d) => [d.userId, d]));
        const nextDeclarations: A150IndependenceDeclaration[] = selectedRows.map((row) => {
          const existing = existingDeclMap.get(row.userId);
          if (existing) return existing;
          return {
            userId: row.userId,
            statusDeklarasi: 'Pending',
            isConflictFree: true,
            catatanKonflik: '',
          };
        });

        const merged: EngagementWorkspaceData = {
          ...ws,
          a1103: boundedRows,
          teamMembers: nextTeamMembers,
          a150Declarations: nextDeclarations,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A1103'),
        };
        return {
          ...merged,
          a110: recomputeWorkspaceA110(merged, client),
        };
      });
      return { state: nextState };
    }

    case 'UPSERT_GOVERNANCE_ITEM': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A1103');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const exists = ws.governanceStructures.some((g) => g.id === action.item.id);
        const nextList = exists
          ? ws.governanceStructures.map((g) => (g.id === action.item.id ? action.item : g))
          : [...ws.governanceStructures, action.item];
        return {
          ...ws,
          governanceStructures: nextList,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A1103'),
        };
      });
      return { state: nextState };
    }

    case 'DELETE_GOVERNANCE_ITEM': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A1103');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        governanceStructures: ws.governanceStructures.filter((g) => g.id !== action.itemId),
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A1103'),
      }));
      return { state: nextState };
    }

    case 'UPDATE_A1105': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A1105');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const client = resolveEngagementClient(state, activeWs);
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const mergedA1105 = { ...ws.a1105, ...action.patch };
        const nextA1105: A1105PredecessorComm = {
          ...mergedA1105,
          simpulanRisiko: computeA1105Risk(mergedA1105),
        };
        const merged: EngagementWorkspaceData = {
          ...ws,
          a1105: nextA1105,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A1105'),
        };
        return {
          ...merged,
          a110: recomputeWorkspaceA110(merged, client),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A120': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A120');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const merged = { ...ws.a120, ...action.patch };
        const calc = calculateEffectiveTimeBudget(
          merged.tanggalMulai,
          merged.tanggalSelesai,
          merged.hariLiburNasional
        );
        return {
          ...ws,
          a120: {
            ...merged,
            hariKalender: calc.hariKalender,
            hariWeekend: calc.hariWeekend,
            hariLiburNasional: calc.hariLiburNasional,
            hariEfektif: calc.hariEfektif,
            jamPerHari: 7,
          },
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A120'),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_TEAM_MEMBER_BUDGET': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A120');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const sanitize = (v: number | undefined, fallback: number) =>
        v === undefined ? fallback : Math.max(0, Number.isFinite(v) ? v : 0);
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        teamMembers: ws.teamMembers.map((m) =>
          m.userId === action.userId
            ? {
                ...m,
                tarifPerJam: sanitize(action.patch.tarifPerJam, m.tarifPerJam),
                rencanaJamPraperikatan: sanitize(
                  action.patch.rencanaJamPraperikatan,
                  m.rencanaJamPraperikatan
                ),
                rencanaJamRiskResponse: sanitize(
                  action.patch.rencanaJamRiskResponse,
                  m.rencanaJamRiskResponse
                ),
                rencanaJamPelaporan: sanitize(
                  action.patch.rencanaJamPelaporan,
                  m.rencanaJamPelaporan
                ),
              }
            : m
        ),
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A120'),
      }));
      return { state: nextState };
    }

    case 'UPDATE_LEGAL_CLAUSE': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.kodeIndeks);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        legalChecklists: ws.legalChecklists.map((item) =>
          item.kodeIndeks === action.kodeIndeks && item.kodeKlausul === action.kodeKlausul
            ? { ...item, ...action.patch }
            : item
        ),
        workingPapers: touchWorkpaperDraft(ws.workingPapers, action.kodeIndeks),
      }));
      return { state: nextState };
    }

    case 'UPDATE_A150_DECLARATION': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A150');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const exists = ws.a150Declarations.some((d) => d.userId === action.userId);
        const nextList = exists
          ? ws.a150Declarations.map((d) =>
              d.userId === action.userId ? { ...d, ...action.patch } : d
            )
          : [
              ...ws.a150Declarations,
              {
                userId: action.userId,
                statusDeklarasi: 'Pending' as const,
                isConflictFree: true,
                catatanKonflik: '',
                ...action.patch,
              },
            ];
        return {
          ...ws,
          a150Declarations: nextList,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A150'),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A170': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A170');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        a170: { ...ws.a170, ...action.patch },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A170'),
      }));
      return { state: nextState };
    }

    case 'UPDATE_A210': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A210');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      if (
        action.patch.marginAmptPersen !== undefined &&
        (action.patch.marginAmptPersen > 5 || action.patch.marginAmptPersen < 0)
      ) {
        return {
          state,
          notice: {
            type: 'error',
            text: 'Ditolak (SA 320): Margin AMPT tidak boleh melebihi 5% dari Performance Materiality.',
          },
        };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const mergedA210: A210Materiality = { ...ws.a210, ...action.patch };
        const recalculated = recalculateA210FromState(mergedA210, ws.trialBalance, ws.journals);
        const nextA240 = recomputeA240Rows(ws.a240Rows, ws.trialBalance, ws.journals, recalculated.nilaiPm);
        const nextWs: EngagementWorkspaceData = {
          ...ws,
          a210: recalculated,
          a240Rows: nextA240,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A210'),
        };
        return {
          ...nextWs,
          a270Rows: recomputeWorkspaceA270(nextWs),
        };
      });
      return { state: nextState };
    }

    case 'SYNC_A210_FROM_TB': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A210');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const cascaded = recomputeModuleA2Cascade({
          ...ws,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A210'),
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              'A210',
              'SINKRON SALDO ACUAN FS',
              `Menarik ulang saldo acuan ${ws.a210.acuanSaldo} secara dinamis dari WSTB/FS klien.`
            ),
          ],
        });
        return cascaded;
      });
      return {
        state: nextState,
        notice: { type: 'success', text: 'Saldo acuan A210 & Akun Signifikan A240 disinkronkan dengan FS/WSTB.' },
      };
    }

    case 'UPDATE_A220_SIMPULAN': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A220');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        a220Simpulan: action.simpulan,
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A220'),
      }));
      return { state: nextState };
    }

    case 'UPDATE_A230_ITEM': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A230');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextItems = ws.a230Items.map((item) => {
          if (item.kodeSubIndeks !== action.kodeSubIndeks) return item;
          const nextHasil = action.patch.hasilAnalisis ?? item.hasilAnalisis;
          const nextFraud =
            item.kodeSubIndeks === 'A230.7'
              ? nextHasil === 'Ya'
              : action.patch.isFraudRisk ?? item.isFraudRisk;
          return {
            ...item,
            ...action.patch,
            hasilAnalisis: nextHasil,
            isFraudRisk: nextFraud,
          };
        });
        const intermediate: EngagementWorkspaceData = {
          ...ws,
          a230Items: nextItems,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A230'),
        };
        return {
          ...intermediate,
          a270Rows: recomputeWorkspaceA270(intermediate),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A230_AFFECTED_ACCOUNTS': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A230');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextItems = ws.a230Items.map((item) =>
          item.kodeSubIndeks === action.kodeSubIndeks
            ? { ...item, affectedAccounts: action.affectedAccounts }
            : item
        );
        const intermediate: EngagementWorkspaceData = {
          ...ws,
          a230Items: nextItems,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A230'),
        };
        return {
          ...intermediate,
          a270Rows: recomputeWorkspaceA270(intermediate),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A240_ROW': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A240');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const pm = activeWs.a210.nilaiPm;
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextRows = ws.a240Rows.map((row) => {
          if (row.leadCode !== action.leadCode) return row;
          const lockedSignificant = pm > 0 && Math.abs(row.saldoBerjalan) >= pm;
          const requestedSig = action.patch.isSignificantAccount;
          return {
            ...row,
            ...action.patch,
            isSignificantAccount: lockedSignificant
              ? true
              : requestedSig !== undefined
                ? requestedSig
                : row.isSignificantAccount,
          };
        });
        const intermediate: EngagementWorkspaceData = {
          ...ws,
          a240Rows: nextRows,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A240'),
        };
        return {
          ...intermediate,
          a270Rows: recomputeWorkspaceA270(intermediate),
        };
      });
      return { state: nextState };
    }

    case 'UPSERT_A250_ITEM': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A250');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextCycles = ws.a250Cycles.map((cycle) => {
          if (cycle.kodeSiklus !== action.kodeSiklus) return cycle;
          const exists = cycle.items.some((i) => i.id === action.item.id);
          const nextItems = exists
            ? cycle.items.map((i) => (i.id === action.item.id ? action.item : i))
            : [...cycle.items, action.item];
          const evaluated = evaluateA250CycleControlRisk(nextItems);
          return {
            ...cycle,
            items: nextItems,
            controlRiskLevel: evaluated.controlRiskLevel,
            simpulanPengendalian: evaluated.simpulanPengendalian,
          };
        });
        const intermediate: EngagementWorkspaceData = {
          ...ws,
          a250Cycles: nextCycles,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A250'),
        };
        return {
          ...intermediate,
          a270Rows: recomputeWorkspaceA270(intermediate),
        };
      });
      return { state: nextState };
    }

    case 'DELETE_A250_ITEM': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A250');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextCycles = ws.a250Cycles.map((cycle) => {
          if (cycle.kodeSiklus !== action.kodeSiklus) return cycle;
          const nextItems = cycle.items
            .filter((i) => i.id !== action.itemId)
            .map((i, idx) => ({ ...i, nomorUrut: idx + 1 }));
          const evaluated = evaluateA250CycleControlRisk(nextItems);
          return {
            ...cycle,
            items: nextItems,
            controlRiskLevel: evaluated.controlRiskLevel,
            simpulanPengendalian: evaluated.simpulanPengendalian,
          };
        });
        const intermediate: EngagementWorkspaceData = {
          ...ws,
          a250Cycles: nextCycles,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A250'),
        };
        return {
          ...intermediate,
          a270Rows: recomputeWorkspaceA270(intermediate),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A250_CYCLE': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A250');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextCycles = ws.a250Cycles.map((cycle) => {
          if (cycle.kodeSiklus !== action.kodeSiklus) return cycle;
          return { ...cycle, ...action.patch };
        });
        const intermediate: EngagementWorkspaceData = {
          ...ws,
          a250Cycles: nextCycles,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A250'),
        };
        return {
          ...intermediate,
          a270Rows: recomputeWorkspaceA270(intermediate),
        };
      });
      return { state: nextState };
    }

    case 'UPDATE_A260': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A260');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        a260: { ...ws.a260, ...action.patch },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A260'),
      }));
      return { state: nextState };
    }

    case 'UPDATE_A270_ROW': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A270');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const updatedRows = ws.a270Rows.map((r) =>
          r.leadCode === action.leadCode ? { ...r, ...action.patch } : r
        );
        const intermediate: EngagementWorkspaceData = {
          ...ws,
          a270Rows: updatedRows,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A270'),
        };
        if (action.patch.cycleCode !== undefined) {
          return {
            ...intermediate,
            a270Rows: recomputeWorkspaceA270(intermediate),
          };
        }
        return intermediate;
      });
      return { state: nextState };
    }

    case 'RECALCULATE_A270': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A270');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        a270Rows: recomputeWorkspaceA270(ws),
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A270'),
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            'A270',
            'HITUNG ULANG ROMM',
            'Menjalankan kalkulasi ulang matriks IR × CR = RoMM di seluruh 45 pos akun.'
          ),
        ],
      }));
      return {
        state: nextState,
        notice: { type: 'success', text: 'Matriks IR × CR = RoMM (45 pos akun) berhasil dihitung ulang.' },
      };
    }

    case 'UPDATE_A280': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'A280');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        a280: { ...ws.a280, ...action.patch },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'A280'),
      }));
      return { state: nextState };
    }

    case 'IMPORT_TRIAL_BALANCE': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'B100');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP B100 terkunci.' } };
      }
      const validation = validateTrialBalanceImport(action.accounts);
      if (!validation.valid) {
        return {
          state,
          notice: {
            type: 'error',
            text: validation.errors[0] ?? 'Import Trial Balance ditolak karena validasi gagal.',
          },
        };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const wps = touchWorkpaperDraft(touchWorkpaperDraft(ws.workingPapers, 'B100'), 'B120');
        return recomputeModuleA2Cascade({
          ...ws,
          trialBalance: action.accounts,
          workingPapers: wps,
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              'B100',
              'IMPOR TRIAL BALANCE',
              `Mengimpor ${action.accounts.length} akun TB (Total Dr/Cr: Rp ${Math.round(validation.totalUnauditedDebit).toLocaleString('en-US')}).`
            ),
          ],
        });
      });
      return {
        state: nextState,
        notice: {
          type: 'success',
          text: `${action.accounts.length} akun Trial Balance berhasil diimpor & disinkronkan ke WSTB, FS, dan A210.`,
        },
      };
    }

    case 'UPDATE_TRIAL_BALANCE_MAPPING': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'B100');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP B100 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextTb = ws.trialBalance.map((acc) =>
          acc.id === action.accountId ? { ...acc, ...action.patch } : acc
        );
        return recomputeModuleA2Cascade({
          ...ws,
          trialBalance: nextTb,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'B100'),
        });
      });
      return { state: nextState };
    }

    case 'UPSERT_JOURNAL': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'B100');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP B100 terkunci.' } };
      }
      const val = validateAuditJournalEntry(action.journal);
      if (!val.valid) {
        return {
          state,
          notice: { type: 'error', text: val.errors[0] ?? 'Jurnal tidak memenuhi validasi double-entry.' },
        };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const existing = action.journal.id
          ? ws.journals.find((j) => j.id === action.journal.id)
          : undefined;
        const entry: AuditJournalEntry = {
          id: existing?.id ?? `jrn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          nomorJurnal:
            existing?.nomorJurnal ??
            action.journal.nomorJurnal ??
            nextJournalNumber(ws.journals, action.journal.jenisJurnal),
          jenisJurnal: action.journal.jenisJurnal,
          statusPersetujuan: action.journal.statusPersetujuan,
          tanggalJurnal: action.journal.tanggalJurnal,
          referensiKkp: action.journal.referensiKkp,
          keterangan: action.journal.keterangan.trim(),
          lines: action.journal.lines,
          totalDebit: val.totalDebit,
          totalKredit: val.totalKredit,
          createdBy: existing?.createdBy ?? activeUser.inisial,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        };
        const nextJournals = existing
          ? ws.journals.map((j) => (j.id === existing.id ? entry : j))
          : [...ws.journals, entry];

        const wps = touchWorkpaperDraft(touchWorkpaperDraft(ws.workingPapers, 'B100'), 'B120');
        return recomputeModuleA2Cascade({
          ...ws,
          journals: nextJournals,
          workingPapers: wps,
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              'B100',
              existing ? 'UBAH JURNAL AUDIT' : 'TAMBAH JURNAL AUDIT',
              `${entry.nomorJurnal} (${entry.statusPersetujuan}, Ref ${entry.referensiKkp}) senilai Rp ${Math.round(entry.totalDebit).toLocaleString('en-US')}.`
            ),
          ],
        });
      });
      return {
        state: nextState,
        notice: {
          type: 'success',
          text: `Jurnal ${action.journal.jenisJurnal} (${action.journal.statusPersetujuan}) tersimpan.`,
        },
      };
    }

    case 'SET_JOURNAL_STATUS': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'B100');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP B100 terkunci.' } };
      }
      const target = activeWs.journals.find((j) => j.id === action.journalId);
      if (!target) return { state };
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextJournals = ws.journals.map((j) =>
          j.id === action.journalId ? { ...j, statusPersetujuan: action.status } : j
        );
        return recomputeModuleA2Cascade({
          ...ws,
          journals: nextJournals,
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'B100'),
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              'B100',
              'UBAH STATUS JURNAL',
              `${target.nomorJurnal} diubah menjadi ${action.status}.`
            ),
          ],
        });
      });
      return {
        state: nextState,
        notice: {
          type: 'info',
          text: `${target.nomorJurnal} berstatus ${action.status}. Saldo WSTB, FS, dan A210 diperbarui.`,
        },
      };
    }

    case 'DELETE_JOURNAL': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'B100');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP B100 terkunci.' } };
      }
      const target = activeWs.journals.find((j) => j.id === action.journalId);
      if (!target) return { state };
      const nextState = updateWorkspace(state, activeEngId, (ws) =>
        recomputeModuleA2Cascade({
          ...ws,
          journals: ws.journals.filter((j) => j.id !== action.journalId),
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'B100'),
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(activeUser, 'B100', 'HAPUS JURNAL', `Menghapus jurnal ${target.nomorJurnal}.`),
          ],
        })
      );
      return { state: nextState, notice: { type: 'info', text: `Jurnal ${target.nomorJurnal} dihapus.` } };
    }

    case 'UPDATE_SPECIAL_PROCEDURE': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.kodeIndeks);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        specialProcedures: {
          ...ws.specialProcedures,
          ...action.patch,
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, action.kodeIndeks),
      }));
      return { state: nextState };
    }

    case 'UPDATE_LEAD_SCHEDULE': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.leadCode);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'Lead Schedule terkunci.' } };
      }
      const existingLead = activeWs.leadSchedules[action.leadCode];
      if (!existingLead) return { state };
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        leadSchedules: {
          ...ws.leadSchedules,
          [action.leadCode]: {
            ...ws.leadSchedules[action.leadCode],
            ...action.patch,
          },
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, action.leadCode),
      }));
      return { state: nextState };
    }

    case 'UPSERT_LEAD_PROCEDURE': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.leadCode);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'Lead Schedule terkunci.' } };
      }
      const existingLead = activeWs.leadSchedules[action.leadCode];
      if (!existingLead) return { state };
      const exists = existingLead.procedures.some((p) => p.id === action.procedure.id);
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const curLead = ws.leadSchedules[action.leadCode];
        const nextProcs = exists
          ? curLead.procedures.map((p) => (p.id === action.procedure.id ? action.procedure : p))
          : [...curLead.procedures, action.procedure];
        return {
          ...ws,
          leadSchedules: {
            ...ws.leadSchedules,
            [action.leadCode]: {
              ...curLead,
              procedures: nextProcs,
            },
          },
          workingPapers: touchWorkpaperDraft(ws.workingPapers, action.leadCode),
        };
      });
      return { state: nextState };
    }

    case 'DELETE_LEAD_PROCEDURE': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.leadCode);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'Lead Schedule terkunci.' } };
      }
      const existingLead = activeWs.leadSchedules[action.leadCode];
      if (!existingLead) return { state };
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const curLead = ws.leadSchedules[action.leadCode];
        return {
          ...ws,
          leadSchedules: {
            ...ws.leadSchedules,
            [action.leadCode]: {
              ...curLead,
              procedures: curLead.procedures.filter((p) => p.id !== action.procedureId),
            },
          },
          workingPapers: touchWorkpaperDraft(ws.workingPapers, action.leadCode),
        };
      });
      return { state: nextState };
    }

    case 'SAVE_LEAD_SAMPLING_RUN': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.leadCode);
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'Lead Schedule terkunci.' } };
      }
      const existingLead = activeWs.leadSchedules[action.leadCode];
      if (!existingLead) return { state };
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const curLead = ws.leadSchedules[action.leadCode];
        return {
          ...ws,
          leadSchedules: {
            ...ws.leadSchedules,
            [action.leadCode]: {
              ...curLead,
              sapAssuranceLevel: action.samplingRun.sapAssurance,
              samplingRun: action.samplingRun,
            },
          },
          workingPapers: touchWorkpaperDraft(ws.workingPapers, action.leadCode),
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              action.leadCode,
              'SIMPAN SAMPLING ISA SA 530',
              `Sampling ${action.leadCode} (${action.samplingRun.projectionMethod}) selesai: ${action.samplingRun.actualSampleSize} sampel diuji, proyeksi salah saji Rp ${Math.round(action.samplingRun.projectedPopulationMisstatement).toLocaleString('en-US')}.`
            ),
          ],
        };
      });
      return {
        state: nextState,
        notice: {
          type: 'success',
          text: `Hasil sampling ISA SA 530 untuk ${action.leadCode} berhasil disimpan.`,
        },
      };
    }

    case 'SEND_SAMPLING_TO_SAD': {
      if (!activeEngId || !activeWs) return { state };
      const guardSad = guardWorkpaperMutation(activeWs, 'C100');
      if (!guardSad.allowed) {
        return { state, notice: { type: 'warning', text: guardSad.reason ?? 'KKP C100 terkunci.' } };
      }
      const cleanAmount = Number(action.amount) || 0;
      const newSadItem = {
        id: `sad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sourceKkp: action.leadCode,
        description: action.description.trim() || `Proyeksi salah saji sampling ${action.leadCode}`,
        type: action.misstatementType,
        amount: cleanAmount,
      };
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c100SadItems: [...ws.moduleC.c100SadItems, newSadItem],
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C100'),
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            'C100',
            'KIRIM TEMUAN KE SAD',
            `Menambahkan temuan ${action.misstatementType} dari ${action.leadCode} senilai Rp ${Math.round(cleanAmount).toLocaleString('en-US')} ke Summary of Audit Differences (C100).`
          ),
        ],
      }));
      return {
        state: nextState,
        notice: {
          type: 'success',
          text: `Temuan salah saji dari ${action.leadCode} berhasil dikirim ke SAD (C100).`,
        },
      };
    }

    case 'ADD_CUSTOM_LEAD_SCHEDULE': {
      if (!activeEngId || !activeWs) return { state };
      const cleanCode = action.leadCode.trim().toUpperCase();
      const cleanTitle = action.title.trim();
      if (!/^L\d{2,3}[A-Z]?$/.test(cleanCode) || !cleanTitle) {
        return {
          state,
          notice: {
            type: 'error',
            text: 'Kode Lead harus berformat Lxx (mis. L48) dan judul pos tidak boleh kosong.',
          },
        };
      }
      if (activeWs.leadSchedules[cleanCode] || activeWs.workingPapers[cleanCode]) {
        return {
          state,
          notice: { type: 'warning', text: `Kode Lead ${cleanCode} sudah terdaftar pada perikatan ini.` },
        };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextOrder =
          Object.values(ws.workingPapers)
            .filter((w) => w.partGroup === 'Part4')
            .reduce((m, w) => Math.max(m, w.urutan), 499) + 1;
        const newLead: LeadScheduleInstance = {
          leadCode: cleanCode,
          atlasSheetNumber: `Custom ${cleanCode}`,
          title: cleanTitle,
          accountCategory: action.accountCategory.trim() || 'Akun Khusus',
          normalBalance: action.normalBalance,
          materialityType: 'PM',
          sapAssuranceLevel: 'No',
          assertionsTested: ['C', 'E', 'A&C', 'V', 'P&D'],
          procedures: getSeededProceduresForLead(cleanCode, cleanTitle),
          samplingRun: null,
          auditConclusion: 'Akun tersebut telah disajikan secara wajar',
          conclusionNotes: '',
        };
        const newWp: WorkingPaperRecord = {
          kodeIndeks: cleanCode,
          namaIndeks: cleanTitle,
          partGroup: 'Part4',
          parentIndeks: null,
          urutan: nextOrder,
          isConditional: false,
          saRelevan: 'SA 500 · SA 530',
          status: 'Draft',
          catatanSimpulan: '',
        };
        const intermediate: EngagementWorkspaceData = {
          ...ws,
          leadSchedules: {
            ...ws.leadSchedules,
            [cleanCode]: newLead,
          },
          workingPapers: {
            ...ws.workingPapers,
            [cleanCode]: newWp,
          },
          a240Rows: [
            ...ws.a240Rows,
            {
              leadCode: cleanCode,
              namaAkun: cleanTitle,
              saldoBerjalan: 0,
              isSignificantAccount: false,
              alasanSignifikansi: '',
              isSignificantRisk: false,
              irByAssertion: { C: 'Moderate', E: 'Moderate', 'A&C': 'Moderate', V: 'Moderate', 'P&D': 'Low' },
              catatanInherentRisk: '',
            },
          ],
          a270Rows: [
            ...ws.a270Rows,
            {
              leadCode: cleanCode,
              namaAkun: cleanTitle,
              cycleCode: 'A250.12',
              rommByAssertion: { C: 'Moderate', E: 'Moderate', 'A&C': 'Moderate', V: 'Moderate', 'P&D': 'Low' },
              overallRomm: 'Moderate',
              responAuditKomprehensif: 'Laksanakan pengujian substantif sesuai rencana pada Lead Schedule.',
              requiresSubstantiveTest: true,
              requiresTestOfControls: false,
            },
          ],
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              cleanCode,
              'TAMBAH LEAD SCHEDULE KUSTOM',
              `Menambahkan Lead Schedule kustom ${cleanCode} — ${cleanTitle} (${action.normalBalance}).`
            ),
          ],
        };
        return {
          ...intermediate,
          a270Rows: recomputeWorkspaceA270(intermediate),
        };
      });
      return {
        state: nextState,
        notice: { type: 'success', text: `Lead Schedule kustom ${cleanCode} — ${cleanTitle} berhasil dibuat.` },
      };
    }

    case 'UPSERT_SAD_ITEM': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C100');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C100 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const exists = ws.moduleC.c100SadItems.some((i) => i.id === action.item.id);
        const nextItems = exists
          ? ws.moduleC.c100SadItems.map((i) => (i.id === action.item.id ? action.item : i))
          : [...ws.moduleC.c100SadItems, action.item];
        return {
          ...ws,
          moduleC: {
            ...ws.moduleC,
            c100SadItems: nextItems,
          },
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C100'),
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              'C100',
              exists ? 'UBAH ITEM SAD' : 'TAMBAH ITEM SAD',
              `Item SAD (${action.item.type}, sumber ${action.item.sourceKkp}) senilai Rp ${Math.round(action.item.amount).toLocaleString('en-US')}.`
            ),
          ],
        };
      });
      return { state: nextState, notice: { type: 'success', text: 'Daftar SAD (C100) diperbarui.' } };
    }

    case 'DELETE_SAD_ITEM': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C100');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C100 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c100SadItems: ws.moduleC.c100SadItems.filter((i) => i.id !== action.itemId),
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C100'),
      }));
      return { state: nextState, notice: { type: 'info', text: 'Item SAD dihapus dari C100.' } };
    }

    case 'UPDATE_C110': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C110');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C110 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c110FinalMateriality: {
            ...ws.moduleC.c110FinalMateriality,
            ...action.patch,
          },
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C110'),
      }));
      return { state: nextState };
    }

    case 'UPDATE_C120_NOTE': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C120');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C120 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c120AnalyticalNotes: {
            ...ws.moduleC.c120AnalyticalNotes,
            [action.accountCode]: action.note,
          },
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C120'),
      }));
      return { state: nextState };
    }

    case 'UPDATE_C210_ITEM': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C210');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C210 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c210LaiReviewItems: ws.moduleC.c210LaiReviewItems.map((item) =>
            item.itemNumber === action.itemNumber ? { ...item, ...action.patch } : item
          ),
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C210'),
      }));
      return { state: nextState };
    }

    case 'UPDATE_C220_ITEM': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C220');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C220 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c220Disclosures: ws.moduleC.c220Disclosures.map((item) =>
            item.id === action.itemId ? { ...item, ...action.patch } : item
          ),
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C220'),
      }));
      return { state: nextState };
    }

    case 'SYNC_C220_FRAMEWORK': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C220');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C220 terkunci.' } };
      }
      const wsClient = state.clients.find((c) => c.id === activeWs.header.clientId);
      if (!wsClient) return { state };
      const nextItems = getDisclosuresForSak(wsClient.sakDigunakan);
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c220Disclosures: nextItems,
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C220'),
      }));
      return {
        state: nextState,
        notice: {
          type: 'success',
          text: `Checklist CaLK disinkronkan dengan kerangka ${wsClient.sakDigunakan} (${nextItems.length} item).`,
        },
      };
    }

    case 'UPDATE_C230_MEMORANDUM': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C230');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C230 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c230Memorandum: {
            ...ws.moduleC.c230Memorandum,
            ...action.patch,
          },
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C230'),
      }));
      return { state: nextState };
    }

    case 'SYNC_C230_FROM_MODULES': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C230');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C230 terkunci.' } };
      }
      const pillars = buildC230TwelvePillars(activeWs);
      const memoPatch: Partial<ModuleCData['c230Memorandum']> = {};
      for (const p of pillars) {
        memoPatch[p.key] = p.autoSummary;
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c230Memorandum: {
            ...ws.moduleC.c230Memorandum,
            ...memoPatch,
          },
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C230'),
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            'C230',
            'SINKRONISASI MEMORANDUM AKHIR',
            'Menyinkronkan otomatis 12 pilar Audit Final Memorandum dari KKP Modul A, B, dan C.'
          ),
        ],
      }));
      return {
        state: nextState,
        notice: { type: 'success', text: '12 pilar Audit Final Memorandum (C230) berhasil disinkronkan otomatis.' },
      };
    }

    case 'UPDATE_C300_EQCR': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C300');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C300 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c300Eqcr: {
            ...ws.moduleC.c300Eqcr,
            ...action.patch,
          },
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C300'),
      }));
      return { state: nextState };
    }

    case 'UPSERT_C300_FINDING': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C300');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C300 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const exists = ws.moduleC.c300Eqcr.findings.some((f) => f.id === action.finding.id);
        const nextFindings = exists
          ? ws.moduleC.c300Eqcr.findings.map((f) => (f.id === action.finding.id ? action.finding : f))
          : [...ws.moduleC.c300Eqcr.findings, action.finding];
        return {
          ...ws,
          moduleC: {
            ...ws.moduleC,
            c300Eqcr: {
              ...ws.moduleC.c300Eqcr,
              findings: nextFindings,
            },
          },
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C300'),
        };
      });
      return { state: nextState, notice: { type: 'success', text: 'Temuan EQCR (C300) disimpan.' } };
    }

    case 'DELETE_C300_FINDING': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C300');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C300 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        moduleC: {
          ...ws.moduleC,
          c300Eqcr: {
            ...ws.moduleC.c300Eqcr,
            findings: ws.moduleC.c300Eqcr.findings.filter((f) => f.id !== action.findingId),
          },
        },
        workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C300'),
      }));
      return { state: nextState };
    }

    case 'UPDATE_C400_OPINION': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, 'C400');
      if (!guard.allowed) {
        return { state, notice: { type: 'warning', text: guard.reason ?? 'KKP C400 terkunci.' } };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const prev = ws.moduleC.c400Opinion;
        const nextQ1 = action.patch.q1EvidenceSufficient ?? prev.q1EvidenceSufficient;
        const nextQ2 = action.patch.q2MaterialMisstatement ?? prev.q2MaterialMisstatement;
        const nextQ3 = action.patch.q3ImpactPervasive ?? prev.q3ImpactPervasive;
        const suggested = determineSuggestedOpinion(nextQ1, nextQ2, nextQ3);
        const questionsChanged =
          action.patch.q1EvidenceSufficient !== undefined ||
          action.patch.q2MaterialMisstatement !== undefined ||
          action.patch.q3ImpactPervasive !== undefined;
        const nextSelected =
          action.patch.selectedOpinion !== undefined
            ? action.patch.selectedOpinion
            : questionsChanged && prev.selectedOpinion === prev.suggestedOpinion
              ? suggested
              : prev.selectedOpinion;

        return {
          ...ws,
          moduleC: {
            ...ws.moduleC,
            c400Opinion: {
              ...prev,
              ...action.patch,
              suggestedOpinion: suggested,
              selectedOpinion: nextSelected,
            },
          },
          workingPapers: touchWorkpaperDraft(ws.workingPapers, 'C400'),
        };
      });
      return { state: nextState };
    }

    case 'CREATE_CUSTOM_CATEGORY': {
      if (!activeEngId || !activeWs) return { state };
      if (activeWs.header.isArchived) {
        return {
          state,
          notice: {
            type: 'warning',
            text: 'SA 230 Lock Guard: Perikatan diarsipkan final — tidak dapat menambah kategori.',
          },
        };
      }
      const cleanCode = action.code
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9._-]/g, '');
      const cleanLabel = action.label.trim();
      if (!cleanCode || cleanCode.length > 12 || !cleanLabel) {
        return {
          state,
          notice: {
            type: 'error',
            text: 'Kode pendek (1–12 karakter alfanumerik) dan nama kategori wajib diisi.',
          },
        };
      }
      const reservedCodes = new Set(['HOME', 'A1', 'A2', 'B', 'L02-L47', 'C']);
      const existingCats = activeWs.customCategories ?? [];
      if (
        reservedCodes.has(cleanCode) ||
        existingCats.some((c) => c.code.toUpperCase() === cleanCode)
      ) {
        return {
          state,
          notice: {
            type: 'warning',
            text: `Kode kategori "${cleanCode}" sudah digunakan.`,
          },
        };
      }
      const newCategory: CustomIndexCategory = {
        id: `cust-cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: cleanCode,
        label: cleanLabel,
        urutan: existingCats.length + 1,
        createdAt: new Date().toISOString(),
        createdBy: activeUser.inisial,
      };
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        customCategories: [...(ws.customCategories ?? []), newCategory],
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            cleanCode,
            'TAMBAH KATEGORI KKP',
            `Membuat kategori indeks kustom ${cleanCode} — ${cleanLabel}.`
          ),
        ],
      }));
      return {
        state: nextState,
        notice: {
          type: 'success',
          text: `Kategori kustom "${cleanCode} — ${cleanLabel}" ditambahkan.`,
        },
      };
    }

    case 'RENAME_CUSTOM_CATEGORY': {
      if (!activeEngId || !activeWs) return { state };
      if (activeWs.header.isArchived) {
        return {
          state,
          notice: {
            type: 'warning',
            text: 'SA 230 Lock Guard: Perikatan diarsipkan final — kategori tidak dapat diubah.',
          },
        };
      }
      const existingCats = activeWs.customCategories ?? [];
      const target = existingCats.find((c) => c.id === action.categoryId);
      if (!target) return { state };
      const cleanLabel = action.label.trim();
      const cleanCode = action.code
        ? action.code
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9._-]/g, '')
        : target.code;
      if (!cleanCode || cleanCode.length > 12 || !cleanLabel) {
        return {
          state,
          notice: {
            type: 'error',
            text: 'Kode pendek (1–12 karakter) dan nama kategori tidak boleh kosong.',
          },
        };
      }
      const reservedCodes = new Set(['HOME', 'A1', 'A2', 'B', 'L02-L47', 'C']);
      if (
        cleanCode !== target.code &&
        (reservedCodes.has(cleanCode) ||
          existingCats.some((c) => c.id !== target.id && c.code.toUpperCase() === cleanCode))
      ) {
        return {
          state,
          notice: {
            type: 'warning',
            text: `Kode kategori "${cleanCode}" sudah digunakan.`,
          },
        };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        customCategories: (ws.customCategories ?? []).map((c) =>
          c.id === target.id ? { ...c, code: cleanCode, label: cleanLabel } : c
        ),
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            cleanCode,
            'UBAH KATEGORI KKP',
            `Mengubah kategori "${target.code} — ${target.label}" menjadi "${cleanCode} — ${cleanLabel}".`
          ),
        ],
      }));
      return {
        state: nextState,
        notice: {
          type: 'success',
          text: `Kategori "${cleanCode} — ${cleanLabel}" diperbarui.`,
        },
      };
    }

    case 'DELETE_CUSTOM_CATEGORY': {
      if (!activeEngId || !activeWs) return { state };
      if (activeWs.header.isArchived) {
        return {
          state,
          notice: {
            type: 'warning',
            text: 'SA 230 Lock Guard: Perikatan diarsipkan final — kategori tidak dapat dihapus.',
          },
        };
      }
      const target = (activeWs.customCategories ?? []).find((c) => c.id === action.categoryId);
      if (!target) return { state };
      const hasMembers = Object.values(activeWs.workingPapers).some(
        (wp) => wp.categoryId === target.id
      );
      if (hasMembers) {
        return {
          state,
          notice: {
            type: 'warning',
            text: `Kategori ${target.code} masih berisi kertas kerja. Hapus semua KKP di dalamnya terlebih dahulu.`,
          },
        };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        customCategories: (ws.customCategories ?? []).filter((c) => c.id !== target.id),
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            target.code,
            'HAPUS KATEGORI KKP',
            `Menghapus kategori kustom "${target.code} — ${target.label}".`
          ),
        ],
      }));
      return {
        state: nextState,
        notice: {
          type: 'info',
          text: `Kategori "${target.code} — ${target.label}" dihapus.`,
        },
      };
    }

    case 'CREATE_CUSTOM_WORKPAPER': {
      if (!activeEngId || !activeWs) return { state };
      if (activeWs.header.isArchived) {
        return {
          state,
          notice: {
            type: 'warning',
            text: 'SA 230 Lock Guard: Perikatan diarsipkan final — tidak dapat menambah KKP.',
          },
        };
      }
      const cleanCode = action.kodeIndeks
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9._-]/g, '');
      const cleanName = action.namaIndeks.trim();
      if (!cleanCode || cleanCode.length > 16 || !cleanName) {
        return {
          state,
          notice: {
            type: 'error',
            text: 'Kode indeks (maks 16 karakter) dan nama KKP wajib diisi.',
          },
        };
      }
      const codeCollision =
        Object.keys(activeWs.workingPapers).some(
          (k) => k.toUpperCase() === cleanCode.toUpperCase()
        ) ||
        MASTER_INDICES.some((m) => m.kodeIndeks.toUpperCase() === cleanCode.toUpperCase());
      if (codeCollision) {
        return {
          state,
          notice: {
            type: 'warning',
            text: `Kode indeks "${cleanCode}" sudah terdaftar. Gunakan kode lain.`,
          },
        };
      }
      const parentWp = action.parentIndeks
        ? activeWs.workingPapers[action.parentIndeks]
        : undefined;
      if (action.parentIndeks && !parentWp) {
        return {
          state,
          notice: {
            type: 'warning',
            text: `Indeks induk "${action.parentIndeks}" tidak ditemukan.`,
          },
        };
      }
      const resolvedPartGroup = parentWp ? parentWp.partGroup : action.partGroup;
      const resolvedCategoryId = parentWp ? parentWp.categoryId : action.categoryId;

      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextOrder =
          Object.values(ws.workingPapers).reduce((max, wp) => Math.max(max, wp.urutan), 599) + 1;
        const newWp: WorkingPaperRecord = {
          kodeIndeks: cleanCode,
          namaIndeks: cleanName,
          partGroup: resolvedPartGroup,
          categoryId: resolvedCategoryId,
          parentIndeks: parentWp ? parentWp.kodeIndeks : null,
          urutan: nextOrder,
          isConditional: false,
          isCustom: true,
          saRelevan: action.saRelevan?.trim() || 'KKP Tambahan',
          status: 'Kosong',
          catatanSimpulan: '',
        };
        return {
          ...ws,
          workingPapers: {
            ...ws.workingPapers,
            [cleanCode]: newWp,
          },
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              cleanCode,
              'TAMBAH KKP KUSTOM',
              `Menambahkan KKP kustom "${cleanCode} — ${cleanName}"${
                parentWp ? ` di bawah ${parentWp.kodeIndeks}` : ''
              }.`
            ),
          ],
        };
      });
      return {
        state: nextState,
        notice: {
          type: 'success',
          text: `KKP kustom "${cleanCode} — ${cleanName}" berhasil dibuat.`,
        },
      };
    }

    case 'RENAME_CUSTOM_WORKPAPER': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.kodeIndeks);
      if (!guard.allowed) {
        return {
          state,
          notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' },
        };
      }
      const target = activeWs.workingPapers[action.kodeIndeks];
      if (!target || !target.isCustom) {
        return {
          state,
          notice: {
            type: 'warning',
            text: 'Hanya KKP kustom yang dapat diubah namanya.',
          },
        };
      }
      const cleanName = action.namaIndeks.trim();
      if (!cleanName) {
        return {
          state,
          notice: { type: 'error', text: 'Nama KKP tidak boleh kosong.' },
        };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => ({
        ...ws,
        workingPapers: {
          ...ws.workingPapers,
          [target.kodeIndeks]: {
            ...target,
            namaIndeks: cleanName,
            saRelevan:
              action.saRelevan !== undefined ? action.saRelevan.trim() || undefined : target.saRelevan,
          },
        },
        auditTrail: [
          ...ws.auditTrail,
          makeAuditEntry(
            activeUser,
            target.kodeIndeks,
            'UBAH NAMA KKP KUSTOM',
            `Mengubah nama KKP ${target.kodeIndeks} menjadi "${cleanName}".`
          ),
        ],
      }));
      return {
        state: nextState,
        notice: {
          type: 'success',
          text: `KKP "${target.kodeIndeks}" diperbarui.`,
        },
      };
    }

    case 'DELETE_CUSTOM_WORKPAPER': {
      if (!activeEngId || !activeWs) return { state };
      const guard = guardWorkpaperMutation(activeWs, action.kodeIndeks);
      if (!guard.allowed) {
        return {
          state,
          notice: { type: 'warning', text: guard.reason ?? 'KKP terkunci.' },
        };
      }
      const target = activeWs.workingPapers[action.kodeIndeks];
      if (!target || !target.isCustom) {
        return {
          state,
          notice: {
            type: 'warning',
            text: 'Indeks standar IAPI ATLAS tidak dapat dihapus.',
          },
        };
      }
      const hasChildren = Object.values(activeWs.workingPapers).some(
        (wp) => wp.parentIndeks === target.kodeIndeks
      );
      if (hasChildren) {
        return {
          state,
          notice: {
            type: 'warning',
            text: `KKP ${target.kodeIndeks} memiliki sub-KKP turunan. Hapus sub-KKP terlebih dahulu.`,
          },
        };
      }
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const nextWps = { ...ws.workingPapers };
        delete nextWps[target.kodeIndeks];
        return {
          ...ws,
          workingPapers: nextWps,
          pinnedIndices: (ws.pinnedIndices ?? []).filter((c) => c !== target.kodeIndeks),
          auditTrail: [
            ...ws.auditTrail,
            makeAuditEntry(
              activeUser,
              target.kodeIndeks,
              'HAPUS KKP KUSTOM',
              `Menghapus KKP kustom "${target.kodeIndeks} — ${target.namaIndeks}".`
            ),
          ],
        };
      });
      return {
        state: nextState,
        notice: {
          type: 'info',
          text: `KKP "${target.kodeIndeks} — ${target.namaIndeks}" dihapus.`,
        },
      };
    }

    case 'TOGGLE_PIN_WORKPAPER': {
      if (!activeEngId || !activeWs) return { state };
      if (!activeWs.workingPapers[action.kodeIndeks] && !activeWs.leadSchedules[action.kodeIndeks]) {
        return { state };
      }
      const currentPinned = activeWs.pinnedIndices ?? [];
      const alreadyPinned = currentPinned.includes(action.kodeIndeks);
      const nextState = updateWorkspace(state, activeEngId, (ws) => {
        const prev = ws.pinnedIndices ?? [];
        const nextPinned = prev.includes(action.kodeIndeks)
          ? prev.filter((c) => c !== action.kodeIndeks)
          : [...prev, action.kodeIndeks];
        return {
          ...ws,
          pinnedIndices: nextPinned,
        };
      });
      return {
        state: nextState,
        notice: {
          type: 'info',
          text: alreadyPinned
            ? `Indeks ${action.kodeIndeks} dilepas dari Favorit.`
            : `Indeks ${action.kodeIndeks} disematkan ke Favorit.`,
        },
      };
    }

    default:
      return { state };
  }
}

export function atlasReducer(state: AtlasStoreState, action: AtlasAction): AtlasStoreState {
  return atlasReducerWithOutcome(state, action).state;
}

interface AtlasContextValue {
  state: AtlasStoreState;
  activeUser: UserProfile;
  activeEngagement: EngagementWorkspaceData | null;
  activeClient: ClientEntity | null;
  uiPrefs: UiPreferences;
  setActiveIndex: (index: string) => void;
  setHubTab: (tab: HubTabId) => void;
  enterWorkspace: (engagementId?: string, targetIndex?: string) => void;
  exitToHub: (tab?: HubTabId) => void;
  toggleSidebarCollapsed: () => void;
  toggleDrawerOpen: () => void;
  setDrawerOpen: (open: boolean) => void;
  setExpandedNodeIds: (
    updater:
      | Record<string, boolean>
      | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  notesFocusRequest: { kodeIndeks: string; seq: number } | null;
  openReviewNotesForIndex: (kodeIndeks: string) => void;
  saveStatus: 'saved' | 'saving';
  toast: ToastNotice | null;
  dismissToast: () => void;
  showToast: (type: ToastNotice['type'], text: string) => void;
  dispatchAction: (action: AtlasAction) => void;
  isHydrated: boolean;
}

const AtlasContext = createContext<AtlasContextValue | null>(null);

export const AtlasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AtlasStoreState>(() => createDefaultAtlasState());
  const [uiPrefs, setUiPrefs] = useState<UiPreferences>(() => loadUiPreferences());
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [notesFocusRequest, setNotesFocusRequest] = useState<{
    kodeIndeks: string;
    seq: number;
  } | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((type: ToastNotice['type'], text: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ id: String(Date.now()), type, text });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Hydrate from localStorage + IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta = loadCoreMetadata();
        const idbWorkspaces = await loadAllWorkspacesFromIndexedDb();
        if (cancelled) return;

        if (meta) {
          const mergedWorkspaces: Record<string, EngagementWorkspaceData> = {
            ...idbWorkspaces,
          };
          // Ensure every engagement header has a hydrated workspace & backfilled MASTER_INDICES (e.g., ASM2)
          for (const header of meta.engagements) {
            if (!mergedWorkspaces[header.id]) {
              if (header.id === 'eng-manggala-2023') {
                mergedWorkspaces[header.id] = createInitialSeedEngagement();
              } else {
                const client =
                  meta.clients.find((c) => c.id === header.clientId) ?? DEFAULT_CLIENTS[0];
                const creator = meta.users[0] ?? DEFAULT_USERS[0];
                mergedWorkspaces[header.id] = initializeNewEngagement({
                  engagementId: header.id,
                  client,
                  users: meta.users,
                  createdByUser: creator,
                  tipePerikatan: header.tipePerikatan,
                  tahunBuku: header.tahunBuku,
                  periodeMulai: header.periodeMulai,
                  periodeSelesai: header.periodeSelesai,
                  tanggalLaporanAuditor: header.tanggalLaporanAuditor,
                  tanggalPerikatan: header.tanggalPerikatan,
                  nomorSuratPerikatan: header.nomorSuratPerikatan,
                  nomorSuratTugas: header.nomorSuratTugas,
                });
              }
            } else {
              const ws = mergedWorkspaces[header.id];
              let patchedWps = ws.workingPapers;
              let changed = false;
              for (const idx of MASTER_INDICES) {
                if (idx.isReferenceOnly) continue;
                if (!patchedWps[idx.kodeIndeks]) {
                  if (!changed) patchedWps = { ...ws.workingPapers };
                  changed = true;
                  patchedWps[idx.kodeIndeks] = {
                    kodeIndeks: idx.kodeIndeks,
                    namaIndeks: idx.namaIndeks,
                    partGroup: idx.partGroup,
                    parentIndeks: idx.parentIndeks,
                    urutan: idx.urutan,
                    isConditional: idx.isConditional,
                    saRelevan: idx.saRelevan,
                    status: 'Kosong',
                    catatanSimpulan: '',
                  };
                }
              }
              let patchedLeads = ws.leadSchedules;
              let leadsChanged = false;
              for (const [code, ls] of Object.entries(ws.leadSchedules)) {
                const isUntouchedPlaceholder =
                  ls.procedures.length === 2 &&
                  ls.procedures[0]?.id === `${code}-proc-1` &&
                  ls.procedures.every(
                    (p) =>
                      p.executionStatus === 'Belum Dilaksanakan' &&
                      !p.picUserId &&
                      !p.auditConclusion
                  );
                if (isUntouchedPlaceholder) {
                  if (!leadsChanged) patchedLeads = { ...ws.leadSchedules };
                  leadsChanged = true;
                  patchedLeads[code] = {
                    ...ls,
                    procedures: getSeededProceduresForLead(code, ls.title),
                  };
                }
              }
              const wsClient =
                meta.clients.find((c) => c.id === header.clientId) ?? DEFAULT_CLIENTS[0];
              let patchedModuleC = ws.moduleC;
              let moduleCChanged = false;
              if (!patchedModuleC.c210LaiReviewItems || patchedModuleC.c210LaiReviewItems.length <= 4) {
                patchedModuleC = {
                  ...patchedModuleC,
                  c210LaiReviewItems: getC210ReviewChecklist(),
                };
                moduleCChanged = true;
              }
              if (!patchedModuleC.c220Disclosures || patchedModuleC.c220Disclosures.length <= 5) {
                patchedModuleC = {
                  ...patchedModuleC,
                  c220Disclosures: getDisclosuresForSak(wsClient.sakDigunakan),
                };
                moduleCChanged = true;
              }
              const missingExplorerFields =
                !Array.isArray(ws.customCategories) || !Array.isArray(ws.pinnedIndices);
              if (changed || leadsChanged || moduleCChanged || missingExplorerFields) {
                mergedWorkspaces[header.id] = {
                  ...ws,
                  customCategories: ws.customCategories ?? [],
                  pinnedIndices: ws.pinnedIndices ?? [],
                  workingPapers: patchedWps,
                  leadSchedules: patchedLeads,
                  moduleC: patchedModuleC,
                };
              }
            }
          }

          setState({
            kapProfile: meta.kapProfile,
            users: meta.users,
            activeUserId: meta.activeUserId,
            clients: meta.clients,
            engagements: meta.engagements,
            activeEngagementId: meta.activeEngagementId,
            workspaces: mergedWorkspaces,
          });
        } else {
          // Persist initial seed to IDB & localStorage
          const initial = createDefaultAtlasState();
          saveCoreMetadata({
            kapProfile: initial.kapProfile,
            users: initial.users,
            activeUserId: initial.activeUserId,
            clients: initial.clients,
            engagements: initial.engagements,
            activeEngagementId: initial.activeEngagementId,
          });
          for (const [id, ws] of Object.entries(initial.workspaces)) {
            await saveWorkspaceToIndexedDb(id, ws);
          }
        }
      } catch (err) {
        console.error('Hydration warning:', err);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist core metadata to localStorage immediately on change after hydration
  useEffect(() => {
    if (!isHydrated) return;
    saveCoreMetadata({
      kapProfile: state.kapProfile,
      users: state.users,
      activeUserId: state.activeUserId,
      clients: state.clients,
      engagements: state.engagements,
      activeEngagementId: state.activeEngagementId,
    });
  }, [
    isHydrated,
    state.kapProfile,
    state.users,
    state.activeUserId,
    state.clients,
    state.engagements,
    state.activeEngagementId,
  ]);

  // Debounced 300ms auto-save of workspaces to IndexedDB
  useEffect(() => {
    if (!isHydrated) return;
    setSaveStatus('saving');
    const handle = window.setTimeout(async () => {
      try {
        for (const [id, ws] of Object.entries(state.workspaces)) {
          await saveWorkspaceToIndexedDb(id, ws);
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error('Gagal auto-save ke IndexedDB:', err);
        setSaveStatus('saved');
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [isHydrated, state.workspaces]);

  // Persist UI preferences
  useEffect(() => {
    saveUiPreferences(uiPrefs);
  }, [uiPrefs]);

  const dispatchAction = useCallback(
    (action: AtlasAction) => {
      const outcome = atlasReducerWithOutcome(stateRef.current, action);
      setState(outcome.state);
      if (outcome.notice) {
        showToast(outcome.notice.type, outcome.notice.text);
      }
    },
    [showToast]
  );

  const setActiveIndex = useCallback((activeIndex: string) => {
    if (activeIndex === 'HUB') {
      setUiPrefs((prev) => ({ ...prev, viewMode: 'hub', hubTab: 'perikatan' }));
      return;
    }
    if (activeIndex === 'MASTER_KAP') {
      setUiPrefs((prev) => ({ ...prev, viewMode: 'hub', hubTab: 'profil' }));
      return;
    }
    setUiPrefs((prev) => ({ ...prev, viewMode: 'workspace', activeIndex }));
  }, []);

  const setHubTab = useCallback((hubTab: HubTabId) => {
    setUiPrefs((prev) => ({ ...prev, viewMode: 'hub', hubTab }));
  }, []);

  const enterWorkspace = useCallback(
    (engagementId?: string, targetIndex: string = 'HOME') => {
      if (engagementId && engagementId !== stateRef.current.activeEngagementId) {
        dispatchAction({ type: 'SET_ACTIVE_ENGAGEMENT', engagementId });
      }
      setUiPrefs((prev) => ({
        ...prev,
        viewMode: 'workspace',
        activeIndex: targetIndex,
      }));
    },
    [dispatchAction]
  );

  const exitToHub = useCallback((tab: HubTabId = 'perikatan') => {
    setUiPrefs((prev) => ({
      ...prev,
      viewMode: 'hub',
      hubTab: tab,
    }));
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setUiPrefs((prev) => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const toggleDrawerOpen = useCallback(() => {
    setUiPrefs((prev) => ({ ...prev, drawerOpen: !prev.drawerOpen }));
  }, []);

  const setDrawerOpen = useCallback((drawerOpen: boolean) => {
    setUiPrefs((prev) => ({ ...prev, drawerOpen }));
  }, []);

  const setExpandedNodeIds = useCallback(
    (
      updater:
        | Record<string, boolean>
        | ((prev: Record<string, boolean>) => Record<string, boolean>)
    ) => {
      setUiPrefs((prev) => {
        const current = prev.expandedNodeIds ?? {};
        const next = typeof updater === 'function' ? updater(current) : updater;
        return { ...prev, expandedNodeIds: next };
      });
    },
    []
  );

  const openReviewNotesForIndex = useCallback((kodeIndeks: string) => {
    setUiPrefs((prev) => ({
      ...prev,
      viewMode: 'workspace',
      activeIndex: kodeIndeks,
      drawerOpen: true,
    }));
    setNotesFocusRequest((prev) => ({
      kodeIndeks,
      seq: (prev?.seq ?? 0) + 1,
    }));
  }, []);

  const activeUser = useMemo(() => getActiveUser(state), [state]);
  const activeEngagement = useMemo(
    () => (state.activeEngagementId ? state.workspaces[state.activeEngagementId] ?? null : null),
    [state.activeEngagementId, state.workspaces]
  );
  const activeClient = useMemo(() => {
    if (!activeEngagement) return null;
    return state.clients.find((c) => c.id === activeEngagement.header.clientId) ?? null;
  }, [activeEngagement, state.clients]);

  const value = useMemo<AtlasContextValue>(
    () => ({
      state,
      activeUser,
      activeEngagement,
      activeClient,
      uiPrefs,
      setActiveIndex,
      setHubTab,
      enterWorkspace,
      exitToHub,
      toggleSidebarCollapsed,
      toggleDrawerOpen,
      setDrawerOpen,
      setExpandedNodeIds,
      notesFocusRequest,
      openReviewNotesForIndex,
      saveStatus,
      toast,
      dismissToast,
      showToast,
      dispatchAction,
      isHydrated,
    }),
    [
      state,
      activeUser,
      activeEngagement,
      activeClient,
      uiPrefs,
      setActiveIndex,
      setHubTab,
      enterWorkspace,
      exitToHub,
      toggleSidebarCollapsed,
      toggleDrawerOpen,
      setDrawerOpen,
      setExpandedNodeIds,
      notesFocusRequest,
      openReviewNotesForIndex,
      saveStatus,
      toast,
      dismissToast,
      showToast,
      dispatchAction,
      isHydrated,
    ]
  );

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
};

export function useAtlas(): AtlasContextValue {
  const ctx = useContext(AtlasContext);
  if (!ctx) throw new Error('useAtlas harus dipanggil di dalam AtlasProvider.');
  return ctx;
}
