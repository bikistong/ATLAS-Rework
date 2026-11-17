import {
  A1102_1AmlItem,
  A1103TeamEvaluation,
  A150IndependenceDeclaration,
  A230EntityRiskItem,
  A240InherentRiskRow,
  A250ControlCycle,
  A270RommRow,
  ClientEntity,
  EngagementHeader,
  EngagementTeamMember,
  EngagementType,
  EngagementWorkspaceData,
  KapProfile,
  LeadScheduleInstance,
  LegalChecklistItem,
  TrialBalanceAccount,
  UserProfile,
  UserRole,
  WorkingPaperRecord,
} from '../types/atlas';
import { buildFullAmlCatalog, buildFullLegalChecklists } from './a1Catalog';
import { getSeededProceduresForLead } from './bLeadProceduresCatalog';
import { getC210ReviewChecklist, getDisclosuresForSak } from './cModuleCatalog';
import { MASTER_INDICES } from './masterIndices';
import { MASTER_LEAD_HEADERS } from './masterLeadHeaders';
import { calculateEffectiveTimeBudget } from '../utils/timeCalculator';

export const DEFAULT_KAP_PROFILE: KapProfile = {
  id: 'kap-default',
  namaKap: 'KAP Djoemarma, Wahyudin dan Rekan',
  namaPemimpin: 'Drs. Djoemarma, Ak., CPA',
  nomorIzinKap: 'KEP-001/KM.1/2020',
  nomorIzinAp: 'AP.0543',
  alamat: 'Jl. Ir. H. Juanda No. 123',
  telepon: '022-2501234',
  email: 'office@kapdwr.co.id',
  website: 'https://kapdwr.co.id',
  kota: 'Bandung',
  updatedAt: '2024-01-15T08:00:00.000Z',
};

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user-partner',
    username: 'djoemarma',
    namaLengkap: 'Drs. Djoemarma, Ak., CPA',
    inisial: 'DJ',
    nomorRegistrasi: 'AP.0543',
    role: 'Partner',
    isActive: true,
  },
  {
    id: 'user-manager',
    username: 'wahyudin',
    namaLengkap: 'Budi Wahyudin, SE., M.Ak., CPA',
    inisial: 'BW',
    nomorRegistrasi: 'RNA.2140',
    role: 'Manager',
    isActive: true,
  },
  {
    id: 'user-ketua',
    username: 'andriani',
    namaLengkap: 'Siti Andriani, SE., Ak.',
    inisial: 'SA',
    nomorRegistrasi: 'IAPI-18042',
    role: 'Ketua Tim',
    isActive: true,
  },
  {
    id: 'user-anggota',
    username: 'fauzan',
    namaLengkap: 'Fauzan Kamil, S.Ak.',
    inisial: 'FK',
    nomorRegistrasi: 'IAPI-22019',
    role: 'Anggota Tim',
    isActive: true,
  },
];

export const DEFAULT_CLIENTS: ClientEntity[] = [
  {
    id: 'client-manggala',
    namaKlien: 'PT Manggala Indopratama',
    npwp: '01.234.567.8-423.000',
    nib: '9120102345678',
    alamat: 'Jl. Soekarno Hatta No. 452',
    kota: 'Bandung',
    provinsi: 'Jawa Barat',
    telepon: '022-7564321',
    email: 'finance@manggalaindopratama.co.id',
    sektorIndustri: 'Perdagangan_dan_Jasa',
    statusKepemilikan: 'Swasta - Non Go Publik',
    sakDigunakan: 'SAK ETAP',
    createdAt: '2024-01-15T08:00:00.000Z',
  },
];

const DEFAULT_DEMO_TRIAL_BALANCE: TrialBalanceAccount[] = [
  {
    id: 'tb-1101',
    kodeAkun: '1101',
    namaAkun: 'Kas dan Bank BCA',
    posisiNormal: 'Debit',
    groupAkun: 'ASET',
    kelompokAkun: 'Aset Lancar',
    headerAkun: 'Kas dan Setara Kas',
    leadCode: 'L02',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 1850000000,
    unauditedCredit: 0,
    pembandingDebit: 1420000000,
    pembandingCredit: 0,
  },
  {
    id: 'tb-1103',
    kodeAkun: '1103',
    namaAkun: 'Piutang Usaha',
    posisiNormal: 'Debit',
    groupAkun: 'ASET',
    kelompokAkun: 'Aset Lancar',
    headerAkun: 'Piutang Usaha',
    leadCode: 'L05',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 4250000000,
    unauditedCredit: 0,
    pembandingDebit: 3800000000,
    pembandingCredit: 0,
  },
  {
    id: 'tb-1105',
    kodeAkun: '1105',
    namaAkun: 'Persediaan Barang Dagang',
    posisiNormal: 'Debit',
    groupAkun: 'ASET',
    kelompokAkun: 'Aset Lancar',
    headerAkun: 'Persediaan',
    leadCode: 'L06',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 3150000000,
    unauditedCredit: 0,
    pembandingDebit: 2900000000,
    pembandingCredit: 0,
  },
  {
    id: 'tb-1201',
    kodeAkun: '1201',
    namaAkun: 'Aset Tetap - Nilai Perolehan',
    posisiNormal: 'Debit',
    groupAkun: 'ASET',
    kelompokAkun: 'Aset Tidak Lancar',
    headerAkun: 'Aset Tetap',
    leadCode: 'L13',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 6400000000,
    unauditedCredit: 0,
    pembandingDebit: 6100000000,
    pembandingCredit: 0,
  },
  {
    id: 'tb-1202',
    kodeAkun: '1202',
    namaAkun: 'Akumulasi Penyusutan Aset Tetap',
    posisiNormal: 'Kredit',
    groupAkun: 'ASET',
    kelompokAkun: 'Aset Tidak Lancar',
    headerAkun: 'Aset Tetap',
    leadCode: 'L14',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 0,
    unauditedCredit: 1650000000,
    pembandingDebit: 0,
    pembandingCredit: 1250000000,
  },
  {
    id: 'tb-2101',
    kodeAkun: '2101',
    namaAkun: 'Utang Usaha',
    posisiNormal: 'Kredit',
    groupAkun: 'LIABILITAS',
    kelompokAkun: 'Liabilitas Jangka Pendek',
    headerAkun: 'Utang Usaha',
    leadCode: 'L17',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 0,
    unauditedCredit: 2950000000,
    pembandingDebit: 0,
    pembandingCredit: 2640000000,
  },
  {
    id: 'tb-2201',
    kodeAkun: '2201',
    namaAkun: 'Utang Bank Jangka Panjang',
    posisiNormal: 'Kredit',
    groupAkun: 'LIABILITAS',
    kelompokAkun: 'Liabilitas Jangka Panjang',
    headerAkun: 'Utang Bank Jangka Panjang',
    leadCode: 'L28',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 0,
    unauditedCredit: 3200000000,
    pembandingDebit: 0,
    pembandingCredit: 3600000000,
  },
  {
    id: 'tb-3101',
    kodeAkun: '3101',
    namaAkun: 'Modal Saham Disetor',
    posisiNormal: 'Kredit',
    groupAkun: 'EKUITAS_ASET_BERSIH',
    kelompokAkun: 'Ekuitas',
    headerAkun: 'Modal Saham',
    leadCode: 'L32',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 0,
    unauditedCredit: 5000000000,
    pembandingDebit: 0,
    pembandingCredit: 5000000000,
  },
  {
    id: 'tb-3102',
    kodeAkun: '3102',
    namaAkun: 'Tambahan Modal Disetor',
    posisiNormal: 'Kredit',
    groupAkun: 'EKUITAS_ASET_BERSIH',
    kelompokAkun: 'Ekuitas',
    headerAkun: 'Tambahan Modal Disetor',
    leadCode: 'L33',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 0,
    unauditedCredit: 50000000,
    pembandingDebit: 0,
    pembandingCredit: 0,
  },
  {
    id: 'tb-3201',
    kodeAkun: '3201',
    namaAkun: 'Saldo Laba Ditahan',
    posisiNormal: 'Kredit',
    groupAkun: 'EKUITAS_ASET_BERSIH',
    kelompokAkun: 'Ekuitas',
    headerAkun: 'Saldo Laba',
    leadCode: 'L34',
    isClosingReAccount: true,
    isOciAccount: false,
    unauditedDebit: 0,
    unauditedCredit: 1730000000,
    pembandingDebit: 0,
    pembandingCredit: 950000000,
  },
  {
    id: 'tb-4101',
    kodeAkun: '4101',
    namaAkun: 'Penjualan Barang Dagang',
    posisiNormal: 'Kredit',
    groupAkun: 'PENDAPATAN',
    kelompokAkun: 'Pendapatan Usaha',
    headerAkun: 'Penjualan',
    leadCode: 'L37',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 0,
    unauditedCredit: 18500000000,
    pembandingDebit: 0,
    pembandingCredit: 16200000000,
  },
  {
    id: 'tb-5101',
    kodeAkun: '5101',
    namaAkun: 'Beban Pokok Penjualan',
    posisiNormal: 'Debit',
    groupAkun: 'BEBAN',
    kelompokAkun: 'Beban Pokok',
    headerAkun: 'HPP',
    leadCode: 'L39',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 13800000000,
    unauditedCredit: 0,
    pembandingDebit: 12100000000,
    pembandingCredit: 0,
  },
  {
    id: 'tb-6101',
    kodeAkun: '6101',
    namaAkun: 'Beban Gaji & Operasional Kantor',
    posisiNormal: 'Debit',
    groupAkun: 'BEBAN',
    kelompokAkun: 'Beban Operasional',
    headerAkun: 'Beban Umum & Administrasi',
    leadCode: 'L41',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 3480000000,
    unauditedCredit: 0,
    pembandingDebit: 3120000000,
    pembandingCredit: 0,
  },
  {
    id: 'tb-7101',
    kodeAkun: '7101',
    namaAkun: 'Beban Bunga Pinjaman Bank',
    posisiNormal: 'Debit',
    groupAkun: 'BEBAN',
    kelompokAkun: 'Beban Non-Operasional',
    headerAkun: 'Beban Keuangan',
    leadCode: 'L46',
    isClosingReAccount: false,
    isOciAccount: false,
    unauditedDebit: 150000000,
    unauditedCredit: 0,
    pembandingDebit: 200000000,
    pembandingCredit: 0,
  },
];

const A250_CYCLE_DEFS: {
  kodeSiklus: A250ControlCycle['kodeSiklus'];
  namaSiklus: string;
  relatedLeadCodes: string[];
}[] = [
  { kodeSiklus: 'A250.1', namaSiklus: 'Entitas & Pengendalian Tingkat Entitas (COSO & TI)', relatedLeadCodes: [] },
  { kodeSiklus: 'A250.2', namaSiklus: 'Siklus Pendapatan, Piutang & Penerimaan Kas', relatedLeadCodes: ['L05', 'L37', 'L38'] },
  { kodeSiklus: 'A250.3', namaSiklus: 'Siklus Pembelian, Utang & Pengeluaran Kas', relatedLeadCodes: ['L10', 'L17', 'L19'] },
  { kodeSiklus: 'A250.4', namaSiklus: 'Siklus Persediaan & Beban Pokok Penjualan', relatedLeadCodes: ['L06', 'L39'] },
  { kodeSiklus: 'A250.5', namaSiklus: 'Siklus Penggajian & Imbalan Kerja', relatedLeadCodes: ['L31', 'L41'] },
  { kodeSiklus: 'A250.6', namaSiklus: 'Siklus Aset Tetap & Aset Tidak Berwujud', relatedLeadCodes: ['L13', 'L14', 'L15', 'L43'] },
  { kodeSiklus: 'A250.7', namaSiklus: 'Siklus Kas, Bank & Investasi', relatedLeadCodes: ['L02', 'L03', 'L07', 'L12'] },
  { kodeSiklus: 'A250.8', namaSiklus: 'Siklus Pendanaan & Utang Jangka Panjang', relatedLeadCodes: ['L20', 'L28', 'L29', 'L30', 'L46'] },
  { kodeSiklus: 'A250.9', namaSiklus: 'Siklus Ekuitas & Saldo Laba', relatedLeadCodes: ['L32', 'L33', 'L34', 'L35', 'L36'] },
  { kodeSiklus: 'A250.10', namaSiklus: 'Siklus Perpajakan', relatedLeadCodes: ['L08', 'L22', 'L23', 'L24', 'L25', 'L47'] },
  { kodeSiklus: 'A250.11', namaSiklus: 'Siklus Beban Dibayar Dimuka & Akrual', relatedLeadCodes: ['L09', 'L26', 'L27'] },
  { kodeSiklus: 'A250.12', namaSiklus: 'Siklus Pelaporan Keuangan & Penutupan Buku', relatedLeadCodes: ['L11', 'L16', 'L18', 'L21', 'L40', 'L42', 'L44', 'L45'] },
  { kodeSiklus: 'A250.13', namaSiklus: 'Siklus TI & Pengendalian Umum Komputer (ITGC)', relatedLeadCodes: [] },
];

const A230_DEFAULT_DEFS: Pick<A230EntityRiskItem, 'kodeSubIndeks' | 'kodePertanyaan' | 'uraianPertanyaan' | 'isFraudRisk'>[] = [
  { kodeSubIndeks: 'A230.1', kodePertanyaan: 'Q1', uraianPertanyaan: 'Informasi umum, akta pendirian, domisili, dan kepatuhan legalitas entitas', isFraudRisk: false },
  { kodeSubIndeks: 'A230.2', kodePertanyaan: 'Q2', uraianPertanyaan: 'Struktur organisasi, pembagian wewenang, dan tata kelola manajemen kunci', isFraudRisk: false },
  { kodeSubIndeks: 'A230.3', kodePertanyaan: 'Q3', uraianPertanyaan: 'Proses aktivitas bisnis utama dan kebijakan akuntansi rutin yang diterapkan', isFraudRisk: false },
  { kodeSubIndeks: 'A230.4', kodePertanyaan: 'Q4', uraianPertanyaan: 'Pemahaman kerangka regulasi sektoral dan kepatuhan perpajakan yang relevan', isFraudRisk: false },
  { kodeSubIndeks: 'A230.5', kodePertanyaan: 'Q5', uraianPertanyaan: 'Pemahaman lingkungan bisnis, tren industri sejenis, dan faktor ekonomi makro', isFraudRisk: false },
  { kodeSubIndeks: 'A230.6', kodePertanyaan: 'Q6', uraianPertanyaan: 'Analisis awal risiko kelangsungan usaha dan kondisi likuiditas entitas', isFraudRisk: false },
  { kodeSubIndeks: 'A230.6A', kodePertanyaan: 'Q6A', uraianPertanyaan: 'Pemahaman proses penyiapan laporan keuangan, entri jurnal penutup, dan konsolidasi', isFraudRisk: false },
  { kodeSubIndeks: 'A230.7', kodePertanyaan: 'Q7', uraianPertanyaan: 'Analisis faktor risiko kecurangan (Fraud Triangle: Insentif/Tekanan, Peluang, Rasionalisasi)', isFraudRisk: true },
];

function buildDefaultLegalChecklists(): LegalChecklistItem[] {
  return buildFullLegalChecklists();
}

function buildDefaultAmlItems(): A1102_1AmlItem[] {
  return buildFullAmlCatalog();
}

function computeClientTotalAssets(accounts: TrialBalanceAccount[]): number {
  return accounts
    .filter((a) => a.groupAkun === 'ASET')
    .reduce((sum, a) => sum + (a.unauditedDebit - a.unauditedCredit), 0);
}

function createRoleRate(role: UserRole): number {
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

export interface InitializeEngagementParams {
  engagementId?: string;
  client: ClientEntity;
  users: UserProfile[];
  createdByUser: UserProfile;
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

/**
 * ATURAN ANTI-BUG #2: Menginisialisasi seluruh struktur workspace secara atomik
 * agar tidak pernah ada properti undefined saat auditor membuka indeks mana pun.
 */
export function initializeNewEngagement(params: InitializeEngagementParams): EngagementWorkspaceData {
  const nowIso = new Date().toISOString();
  const engagementId = params.engagementId ?? `eng-${Date.now()}`;

  const header: EngagementHeader = {
    id: engagementId,
    clientId: params.client.id,
    tipePerikatan: params.tipePerikatan,
    jenisLayanan: 'Audit atas Laporan Keuangan',
    standarAudit: 'Standar Profesional Akuntan Publik',
    tahunBuku: params.tahunBuku,
    periodeMulai: params.periodeMulai,
    periodeSelesai: params.periodeSelesai,
    tanggalLaporanAuditor: params.tanggalLaporanAuditor,
    tanggalPerikatan: params.tanggalPerikatan,
    nomorSuratPerikatan: params.nomorSuratPerikatan,
    nomorSuratTugas: params.nomorSuratTugas,
    isArchived: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const activeUsers = params.users.filter((u) => u.isActive);
  const teamSource = activeUsers.length > 0 ? activeUsers : params.users;

  const teamMembers: EngagementTeamMember[] = teamSource.map((u) => ({
    userId: u.id,
    peranTim: u.role,
    tarifPerJam: createRoleRate(u.role),
    rencanaJamPraperikatan: u.role === 'Partner' ? 4 : u.role === 'Manager' ? 8 : 16,
    rencanaJamRiskResponse: u.role === 'Partner' ? 6 : u.role === 'Manager' ? 16 : 40,
    rencanaJamPelaporan: u.role === 'Partner' ? 6 : u.role === 'Manager' ? 10 : 16,
  }));

  const a1103: A1103TeamEvaluation[] = teamSource.map((u) => ({
    userId: u.id,
    pengalamanTahun: u.role === 'Partner' ? 18 : u.role === 'Manager' ? 10 : u.role === 'Ketua Tim' ? 5 : 2,
    kompetensiEntitas: 'Memadai',
    kompetensiSpap: 'Memadai',
    kompetensiRegulasi: 'Memadai',
    kompetensiTi: 'Memadai',
    kompetensiPelaporan: 'Memadai',
    isCuti: false,
    isResign: false,
    isPhk: false,
    isAkhirKontrak: false,
    isPerikatanLain: false,
    isBatasanLain: false,
    ancamanKeuangan: false,
    ancamanPekerjaan: false,
    ancamanKeluarga: false,
    ancamanNonAudit: false,
    isSelected: true,
    peranTim: u.role,
    inisial: u.inisial,
  }));

  const a150Declarations: A150IndependenceDeclaration[] = teamSource.map((u) => ({
    userId: u.id,
    statusDeklarasi: 'Pending',
    isConflictFree: true,
    catatanKonflik: '',
  }));

  const workingPapers: Record<string, WorkingPaperRecord> = {};
  for (const idx of MASTER_INDICES) {
    if (idx.isReferenceOnly) continue;
    workingPapers[idx.kodeIndeks] = {
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

  const trialBalance: TrialBalanceAccount[] = params.seedDemoTrialBalance
    ? DEFAULT_DEMO_TRIAL_BALANCE.map((row) => ({ ...row }))
    : [];

  const totalAssets = computeClientTotalAssets(trialBalance);
  const omRate = 1.5;
  const nilaiOm = Math.round((totalAssets * omRate) / 100);
  const pmRate = 75;
  const nilaiPm = Math.round((nilaiOm * pmRate) / 100);
  const amptRate = 5;
  const nilaiAmpt = Math.round((nilaiPm * amptRate) / 100);

  const a250Cycles: A250ControlCycle[] = A250_CYCLE_DEFS.map((def) => ({
    kodeSiklus: def.kodeSiklus,
    namaSiklus: def.namaSiklus,
    relatedLeadCodes: def.relatedLeadCodes,
    items: [],
    simpulanPengendalian: 'Pengendalian Internal pada siklus ini memadai',
    controlRiskLevel: 'Moderate',
    catatanSimpulan: '',
  }));

  const leadSchedules: Record<string, LeadScheduleInstance> = {};
  const a240Rows: A240InherentRiskRow[] = [];
  const a270Rows: A270RommRow[] = [];

  for (const lh of MASTER_LEAD_HEADERS) {
    const leadBalance = trialBalance
      .filter((tb) => tb.leadCode === lh.leadCode)
      .reduce((acc, tb) => {
        const net = lh.normalBalance === 'DR'
          ? tb.unauditedDebit - tb.unauditedCredit
          : tb.unauditedCredit - tb.unauditedDebit;
        return acc + net;
      }, 0);

    leadSchedules[lh.leadCode] = {
      leadCode: lh.leadCode,
      atlasSheetNumber: lh.atlasSheetNumber,
      title: lh.title,
      accountCategory: lh.accountCategory,
      normalBalance: lh.normalBalance,
      materialityType: 'PM',
      sapAssuranceLevel: 'No',
      assertionsTested: ['C', 'E', 'A&C', 'V', 'P&D'],
      procedures: getSeededProceduresForLead(lh.leadCode, lh.title),
      samplingRun: null,
      auditConclusion: 'Akun tersebut telah disajikan secara wajar',
      conclusionNotes: '',
    };

    const matchingCycle =
      a250Cycles.find((c) => c.relatedLeadCodes.includes(lh.leadCode))?.kodeSiklus ?? 'A250.12';

    a240Rows.push({
      leadCode: lh.leadCode,
      namaAkun: lh.title,
      saldoBerjalan: leadBalance,
      isSignificantAccount: Math.abs(leadBalance) >= nilaiPm && nilaiPm > 0,
      alasanSignifikansi: '',
      isSignificantRisk: false,
      irByAssertion: { C: 'Moderate', E: 'Moderate', 'A&C': 'Moderate', V: 'Moderate', 'P&D': 'Low' },
      catatanInherentRisk: '',
    });

    a270Rows.push({
      leadCode: lh.leadCode,
      namaAkun: lh.title,
      cycleCode: matchingCycle,
      rommByAssertion: { C: 'Moderate', E: 'Moderate', 'A&C': 'Moderate', V: 'Moderate', 'P&D': 'Low' },
      overallRomm: 'Moderate',
      responAuditKomprehensif: 'Laksanakan pengujian substantif sesuai rencana pada Lead Schedule.',
      requiresSubstantiveTest: true,
      requiresTestOfControls: false,
    });
  }

  const defaultHasilForSubIndex = (sub: A230EntityRiskItem['kodeSubIndeks']): string => {
    if (sub === 'A230.3') return 'Sesuai';
    if (sub === 'A230.6' || sub === 'A230.6A') return 'Memadai';
    if (sub === 'A230.7') return 'Tidak';
    return 'Rendah';
  };

  const a230Items: A230EntityRiskItem[] = A230_DEFAULT_DEFS.map((d) => ({
    kodeSubIndeks: d.kodeSubIndeks,
    kodePertanyaan: d.kodePertanyaan,
    uraianPertanyaan: d.uraianPertanyaan,
    hasilAnalisis: defaultHasilForSubIndex(d.kodeSubIndeks),
    penjelasanAuditor: '',
    isFraudRisk: false,
    affectedAccounts: [],
  }));

  const isEqcrRequired = params.client.statusKepemilikan === 'Swasta - Go Publik';
  const partnerUser = teamSource.find((u) => u.role === 'Partner') ?? params.createdByUser;

  const defaultTimeCalc = calculateEffectiveTimeBudget(
    params.tanggalPerikatan,
    params.tanggalLaporanAuditor,
    2
  );

  return {
    header,
    teamMembers,
    workingPapers,
    customCategories: [],
    pinnedIndices: [],
    reviewNotes: [],
    timeLogs: [],
    attachments: [],
    auditTrail: [
      {
        id: `at-${Date.now()}`,
        timestamp: nowIso,
        userId: params.createdByUser.id,
        userName: params.createdByUser.namaLengkap,
        userRole: params.createdByUser.role,
        kodeIndeks: 'HUB',
        action: 'INISIALISASI PERIKATAN',
        detail: `Membuat perikatan ${params.tipePerikatan} untuk ${params.client.namaKlien} (Tahun Buku ${params.tahunBuku}).`,
      },
    ],

    // Modul A1
    a110: {
      kriteriaIsuTerdahulu:
        params.tipePerikatan === 'Perikatan Tahun Pertama'
          ? 'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia dan telah diaudit auditor independen lain atau auditor yang bersangkutan'
          : 'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia dan telah diaudit auditor independen lain atau auditor yang bersangkutan',
      risikoJenisUsaha: 'Low',
      risikoKepemilikan: params.client.statusKepemilikan === 'Swasta - Go Publik' ? 'High' : 'Low',
      risikoSak: params.client.sakDigunakan === 'SAK Umum konvergensi IFRS' ? 'High' : 'Low',
      risikoIsuTerdahulu: 'Low',
      risikoIntegritas: 'Low',
      risikoKompetensiIndependensi: 'Low',
      risikoAuditorPendahulu: params.tipePerikatan === 'Perikatan Tahun Pertama' ? 'Low' : 'N/A',
      ringkasanRisikoGabungan: 'Low',
      keputusanPenerimaan: 'YA',
      mitigasiRisiko: '',
    },
    a1101: {
      q1aKelangsunganCatatan: 'Tidak',
      q1bKelangsunganOpini: 'Tidak',
      q2Restrukturisasi: 'Tidak',
      q3RugiBerlanjut: 'Tidak',
      q4Restated: 'Tidak',
      q5OpiniModifikasi: 'Tidak',
      alasanTetapMenerima: '',
      simpulanRisiko: 'Low',
    },
    a1102: {
      q1ReputasiBuruk: 'Tidak',
      q2KetidakwajaranOperasi: 'Tidak',
      q3AgresivitasAkuntansi: 'Tidak',
      q4TekananFee: 'Tidak',
      q5PembatasanLingkup: 'Tidak',
      q6IndikasiTppu: 'Tidak',
      q7ReputasiAfiliasi: 'Tidak',
      q8DualAuditor: 'Tidak',
      q9AlasanPergantianKap: 'Tidak Berlaku',
      alasanTetapMenerima: '',
      simpulanRisiko: 'Low',
    },
    a1102_1: buildDefaultAmlItems(),
    a1103,
    governanceStructures: [],
    a1105: {
      q1KomunikasiDilakukan: 'Ya',
      q2BalasanDiterima: 'Ya',
      q3aKeberatanProfesional: 'Tidak',
      q3bSengketaFee: 'Tidak',
      penjelasanTindakLanjut: '',
      simpulanRisiko: 'Low',
    },
    a120: {
      tanggalMulai: params.tanggalPerikatan,
      tanggalSelesai: params.tanggalLaporanAuditor,
      hariKalender: defaultTimeCalc.hariKalender,
      hariWeekend: defaultTimeCalc.hariWeekend,
      hariLiburNasional: defaultTimeCalc.hariLiburNasional,
      hariEfektif: defaultTimeCalc.hariEfektif,
      jamPerHari: 7,
      isEqcrRequired,
      temaPelatihanBerkelanjutan: 'Penerapan SPAP & SAK Terbaru',
    },
    legalChecklists: buildDefaultLegalChecklists(),
    a150Declarations,
    a170: {
      q1BacaLkTerdahulu: 'Ya',
      q2aReviuKkpPendahulu: 'Ya',
      q2bEvaluasiProsedurBerjalan: 'Ya',
      q2cProsedurSpesifikSaldo: 'Ya',
      q3BuktiPemindahanSaldo: 'Ya',
      q4KonsistensiKebijakan: 'Ya',
      q5SalahSajiMaterial: 'Tidak',
      simpulanKewajaran: 'Secara umum Saldo Awal sudah wajar',
      penjelasanKetidakwajaran: '',
    },

    // Modul A2
    a210: {
      karakteristikEntitas:
        params.client.statusKepemilikan === 'Yayasan' ? 'Entitas Nirlaba' : 'Entitas Normal',
      acuanSaldo: 'Total Aset',
      nilaiSaldoAcuan: totalAssets,
      marginOmPersen: omRate,
      nilaiOm,
      pertimbanganOm: 'Entitas berorientasi laba dengan struktur aset tetap dan persediaan stabil.',
      marginPmPersen: pmRate,
      nilaiPm,
      pertimbanganPm: '75% dari Overall Materiality sesuai tingkat risiko perikatan awal.',
      marginAmptPersen: amptRate,
      nilaiAmpt,
      pertimbanganAmpt: '5% dari Performance Materiality untuk batas akumulasi salah saji (SAD).',
    },
    a220Simpulan: 'Hasil analisis awal tidak terdapat risiko salah saji material',
    a230Items,
    a240Rows,
    a250Cycles,
    a260: {
      hasTcwg: true,
      tcwgAreas: [true, true, true, false],
      simpulanTcwg: 'Komunikasi dengan pihak TCWG sudah memadai',
      catatanTcwg: '',
      hasInternalAudit: false,
      spiAreas: [false, false, false],
      simpulanInternalAudit: 'Prosedur tahap ini tidak relevan',
      catatanInternalAudit: '',
    },
    a270Rows,
    a280: {
      ringkasanPerubahanMaterialitas: '',
      ringkasanAreaRisikoTinggi: '',
      pendekatanAuditUtama: 'Substantive Approach',
      alokasiTimLapangan: '',
      targetPenyelesaianFaseB: params.tanggalLaporanAuditor,
    },

    // Modul B
    trialBalance,
    journals: [],
    specialProcedures: {
      b210: {
        posEstimasi: 'Penyisihan Piutang & Masa Manfaat Aset Tetap',
        metodeEvaluasi: 'Tinjauan ulang asumsi manajemen dan perhitungan ulang',
        isAssumptionsRealistic: true,
        isManagementBiasDetected: false,
        checklist: [true, true, true, true, true, true, true],
        simpulan: 'Penggunaan Estimasi Akuntansi telah memadai',
        catatan: '',
      },
      b220: {
        registers: [],
        simpulan: 'Bukti audit cukup dan tepat serta penilaian transaksi pihak berelasi telah memadai',
        catatan: '',
      },
      b230: {
        tanggalPencarian: params.tanggalLaporanAuditor,
        tipePeristiwa: 'None',
        uraianPeristiwa: '',
        tindakanAudit: '',
        simpulan: 'Bukti audit cukup dan tepat serta Evaluasi Peristiwa Kemudian memadai',
      },
      b240: {
        indikatorKeuanganBuruk: false,
        indikatorOperasionalBuruk: false,
        evaluasiRencanaManajemen: '',
        periodeProyeksiBulan: 12,
        simpulan: 'Tidak terdapat keraguan signifikan atas kelangsungan usaha entitas',
      },
      b250: {
        tanggalSuratRepresentasi: params.tanggalLaporanAuditor,
        namaPenandatanganCeo: '',
        namaPenandatanganCfo: '',
        simpulan: 'Representasi manajemen memadai',
        catatan: '',
      },
      b260: {
        isUsed: false,
        namaPakar: '',
        bidangKeahlian: '',
        kualifikasiKompetensi: '',
        evaluasiObjektivitas: '',
        evaluasiHasilPekerjaan: '',
        simpulan: 'TIDAK RELEVAN',
      },
      b270: {
        isUsed: false,
        namaPakar: '',
        bidangKeahlian: '',
        kualifikasiKompetensi: '',
        evaluasiAsumsiMetode: '',
        simpulan: 'TIDAK RELEVAN',
      },
      b280: {
        hasLawyerConfirmation: false,
        hasTaxContingency: false,
        hasGuaranteeCommitments: false,
        hasDerivativeContracts: false,
        simpulan: 'Bukti audit cukup dan tepat serta Penilaian komitmen dan kontijensi memadai',
        catatan: '',
      },
    },
    leadSchedules,

    // Modul C
    moduleC: {
      c100SadItems: [],
      c110FinalMateriality: {
        marginOmPersen: omRate,
        marginPmPersen: pmRate,
        marginAmptPersen: amptRate,
        auditorJustification: '',
        conclusion: 'Nilai yang tersaji pada laporan keuangan sudah material',
      },
      c120AnalyticalNotes: {},
      c210LaiReviewItems: getC210ReviewChecklist(),
      c220Disclosures: getDisclosuresForSak(params.client.sakDigunakan),
      c230Memorandum: {
        fraudEvaluation: '',
        complianceEvaluation: '',
        relatedPartiesEvaluation: '',
        litigationEvaluation: '',
        goingConcernEvaluation: '',
        specialistEvaluation: '',
        contingenciesEvaluation: '',
        icDeficiencies: '',
        finalMaterialitySummary: '',
        sadSummary: '',
        finalAnalyticsSummary: '',
        opinionRecommendationSummary: '',
        overallConclusion: '',
      },
      c300Eqcr: {
        checklist: [false, false, false, false, false, false],
        findings: [],
        conclusion: '',
      },
      c400Opinion: {
        q1EvidenceSufficient: true,
        q2MaterialMisstatement: false,
        q3ImpactPervasive: false,
        suggestedOpinion: 'OPINI1',
        selectedOpinion: 'OPINI1',
        overrideJustification: '',
        basisForModificationText: '',
        hasEmphasisOfMatter: false,
        emphasisOfMatterText: '',
        emphasisCalkRef: '',
        hasOtherMatter: false,
        otherMatterText: '',
        hasMaterialUncertaintyGoingConcern: false,
        goingConcernCalkRef: '',
        reportSequenceNumber: '00001',
        branchCode: '01',
        targetedTo: 'Pemegang Saham, Dewan Komisaris, dan Direksi',
        signingPartnerId: partnerUser.id,
      },
    },
  };
}

export function createInitialSeedEngagement(): EngagementWorkspaceData {
  const client = DEFAULT_CLIENTS[0];
  const partner = DEFAULT_USERS[0];
  const ws = initializeNewEngagement({
    engagementId: 'eng-manggala-2023',
    client,
    users: DEFAULT_USERS,
    createdByUser: partner,
    tipePerikatan: 'Perikatan Berulang',
    tahunBuku: 2023,
    periodeMulai: '2023-01-01',
    periodeSelesai: '2023-12-31',
    tanggalLaporanAuditor: '2024-03-25',
    tanggalPerikatan: '2024-01-18',
    nomorSuratPerikatan: '015/EL/DWR/I/2024',
    nomorSuratTugas: '015/ST/DWR/I/2024',
    seedDemoTrialBalance: true,
  });

  // Pre-seed realistic sign-off & review notes on HOME, A110 & A210 so CaseWare UX showcases active status icons immediately
  if (ws.workingPapers['HOME']) {
    ws.workingPapers['HOME'] = {
      ...ws.workingPapers['HOME'],
      status: 'Reviewed',
      preparedBy: 'SA',
      preparedAt: '2024-01-19T09:00:00.000Z',
      reviewedBy: 'BW',
      reviewedAt: '2024-01-20T11:00:00.000Z',
      catatanSimpulan: 'Ikhtisar perikatan dan kesiapan seluruh modul KKP telah diinisialisasi.',
    };
  }

  ws.workingPapers['A110'] = {
    ...ws.workingPapers['A110'],
    status: 'Reviewed',
    preparedBy: 'SA',
    preparedAt: '2024-01-20T10:15:00.000Z',
    reviewedBy: 'BW',
    reviewedAt: '2024-01-22T14:30:00.000Z',
    catatanSimpulan: 'Risiko penerimaan klien Low; seluruh tim dinyatakan independen dan kompeten.',
  };

  ws.workingPapers['A210'] = {
    ...ws.workingPapers['A210'],
    status: 'Draft',
    catatanSimpulan: 'Benchmark Total Aset dipilih karena struktur aset tetap dan persediaan stabil.',
  };

  ws.reviewNotes = [
    {
      id: 'rn-seed-1',
      kodeIndeks: 'A210',
      parentNoteId: null,
      authorId: 'user-ketua',
      assignedToId: 'user-anggota',
      catatan: 'Pastikan saldo acuan Total Aset pada A210 sinkron dengan angka unaudited WSTB setelah finalisasi cut-off persediaan.',
      status: 'Open',
      createdAt: '2024-01-25T09:10:00.000Z',
    },
  ];

  ws.timeLogs = [
    {
      id: 'tl-seed-1',
      kodeIndeks: 'A110',
      userId: 'user-ketua',
      tahapan: 'PraPerikatan & Penilaian Risiko',
      waktuMulai: '2024-01-20T09:00:00.000Z',
      waktuSelesai: '2024-01-20T10:15:00.000Z',
      durasiMenit: 75,
      keterangan: 'Pengisian analisis penerimaan & keberlanjutan klien',
    },
  ];

  return ws;
}
