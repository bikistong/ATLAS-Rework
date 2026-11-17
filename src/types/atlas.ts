// ============================================================================
// 0. CORE ENUMS, CONSTANTS & ANTI-BUG TYPES
// ============================================================================

export type UserRole = 'Partner' | 'Manager' | 'Ketua Tim' | 'Anggota Tim';

export type WorkpaperStatus = 'Kosong' | 'Draft' | 'Prepared' | 'Reviewed' | 'Locked';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

/** ATURAN ANTI-BUG #1: Prioritas numerik RoMM (DILARANG sort alfabetis!) */
export const ROMM_PRIORITY: Record<RiskLevel, number> = {
  High: 3,
  Moderate: 2,
  Low: 1,
};

export type AuditAssertion = 'C' | 'E' | 'A&C' | 'V' | 'P&D';

export type BinaryRisk = 'Low' | 'High';
export type YesNoNA = 'Ya' | 'Tidak' | 'Tidak Berlaku';
export type YesNoUpper = 'YA' | 'TIDAK';

/** 12 Sektor Usaha Baku ATLAS v2.1 */
export type ClientSector =
  | 'Pertanian_perkebunan_kehutanan_peternakan_kelautan_perikanan'
  | 'Pertambangan_dan_energi'
  | 'Properti_dan_Konstruksi'
  | 'Industri_Pengolahan/Manufaktur'
  | 'Perdagangan_dan_Jasa'
  | 'Informasi_komunikasi_dan_Transportasi'
  | 'Sektor_Keuangan_Perbankan'
  | 'Sektor_Keuangan_Asuransi_dan_Dana_Pensiun'
  | 'Sektor_Keuangan_Lainnya'
  | 'Industri_Lainnya'
  | 'Pemerintahan_Badan_International_Organisasi_Non_Profit'
  | 'Non_Industri_Perorangan';

/** 6 Status Kepemilikan Klien Baku ATLAS v2.1 */
export type ClientOwnershipStatus =
  | 'Swasta - Go Publik'
  | 'Swasta - Non Go Publik'
  | 'BUMN/BUMD'
  | 'Sektor Publik'
  | 'Koperasi'
  | 'Yayasan';

/** 6 Standar Akuntansi Keuangan Baku ATLAS v2.1 */
export type AccountingFramework =
  | 'SAK Umum konvergensi IFRS'
  | 'SAK ETAP'
  | 'SAK EMKM'
  | 'SAK SYARIAH'
  | 'SAP'
  | 'SAK LAINNYA';

/** 4 Kondisi Pelaporan Keuangan Periode Lalu (A110.I25) */
export type PriorReportingCondition =
  | 'Entitas berdiri pada periode berjalan dan laporan keuangan tersedia pada periode berjalan'
  | 'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tidak tersedia'
  | 'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia namun belum pernah diaudit'
  | 'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia dan telah diaudit auditor independen lain atau auditor yang bersangkutan';

export type EngagementType = 'Perikatan Tahun Pertama' | 'Perikatan Berulang';

export type PartGroup = 'Part0' | 'Part1' | 'Part2' | 'Part3' | 'Part4' | 'Part5';

export type AuditPhase = 'PraPerikatan & Penilaian Risiko' | 'Respon Risiko' | 'Pelaporan';

// ============================================================================
// 0.5 BLUEPRINT JSON CONTRACT TYPES (02_BLUEPRINT_JSON_CONTRACT.md)
// ============================================================================

export interface BlueprintValidation {
  source: 'standard_xml' | 'x14_extension_xml';
  type: 'list' | 'date' | 'time';
  sqref: string;
  formula1: string | null;
  resolved_options: string[];
}

export interface BlueprintFormula {
  cell: string;
  formula: string;
  cached_value: string | null;
}

export interface BlueprintCell {
  cell: string;
  value: string;
}

export interface BlueprintRow {
  row: number;
  cells: BlueprintCell[];
}

export interface WorksheetBlueprint {
  dimensions: string;
  validations_count: number;
  validations: BlueprintValidation[];
  unique_formulas_count: number;
  formulas: BlueprintFormula[];
  upstream_sheets: string[];
  non_empty_rows: BlueprintRow[];
}

export interface ChartsheetBlueprint {
  sheet_type: 'chartsheet';
  rows: [];
  formulas: [];
  upstream_sheets: [];
}

export type BlueprintSheet = WorksheetBlueprint | ChartsheetBlueprint;
export type BlueprintFileMap = Record<string, BlueprintSheet>;

// ============================================================================
// 1. MASTER KAP, USER, CLIENT & ENGAGEMENT (PRD 0)
// ============================================================================

export interface KapProfile {
  id: string;
  namaKap: string;
  namaPemimpin: string;
  nomorIzinKap: string;
  nomorIzinAp: string;
  alamat: string;
  telepon: string;
  email: string;
  website?: string;
  kota: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  namaLengkap: string;
  inisial: string;
  nomorRegistrasi: string;
  role: UserRole;
  isActive: boolean;
}

export interface ClientEntity {
  id: string;
  namaKlien: string;
  npwp: string;
  nib?: string;
  alamat: string;
  kota: string;
  provinsi: string;
  telepon?: string;
  email?: string;
  sektorIndustri: ClientSector;
  statusKepemilikan: ClientOwnershipStatus;
  sakDigunakan: AccountingFramework;
  createdAt: string;
}

export interface EngagementHeader {
  id: string;
  clientId: string;
  tipePerikatan: EngagementType;
  jenisLayanan: 'Audit atas Laporan Keuangan';
  standarAudit: 'Standar Profesional Akuntan Publik';
  tahunBuku: number;
  periodeMulai: string;
  periodeSelesai: string;
  tanggalLaporanAuditor: string;
  tanggalPerikatan: string;
  nomorSuratPerikatan: string;
  nomorSuratTugas: string;
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementTeamMember {
  userId: string;
  peranTim: UserRole;
  tarifPerJam: number;
  rencanaJamPraperikatan: number;
  rencanaJamRiskResponse: number;
  rencanaJamPelaporan: number;
}

export interface CustomIndexCategory {
  id: string;
  code: string;
  label: string;
  urutan: number;
  createdAt: string;
  createdBy: string;
}

export interface WorkingPaperRecord {
  kodeIndeks: string;
  namaIndeks: string;
  partGroup: PartGroup;
  categoryId?: string;
  parentIndeks: string | null;
  urutan: number;
  isConditional: boolean;
  isCustom?: boolean;
  saRelevan?: string;
  status: WorkpaperStatus;
  preparedBy?: string;
  preparedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  partnerLockedBy?: string;
  partnerLockedAt?: string;
  catatanSimpulan?: string;
}

export interface ReviewNote {
  id: string;
  kodeIndeks: string;
  parentNoteId: string | null;
  authorId: string;
  assignedToId?: string;
  catatan: string;
  status: 'Open' | 'Addressed' | 'Cleared';
  clearedBy?: string;
  clearedAt?: string;
  createdAt: string;
}

export interface TimeLogEntry {
  id: string;
  kodeIndeks: string;
  userId: string;
  tahapan: AuditPhase;
  waktuMulai: string;
  waktuSelesai?: string;
  durasiMenit: number;
  keterangan?: string;
}

export interface AttachmentItem {
  id: string;
  kodeIndeks: string;
  nomorUrut: number;
  namaDokumen: string;
  tipeFile: string;
  ukuranBytes: number;
  dataUrl: string;
  keterangan?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  kodeIndeks: string;
  action: string;
  detail: string;
}

// ============================================================================
// 2. MODUL A1 — PRE-ENGAGEMENT (PRD 1)
// ============================================================================

export interface A110Evaluation {
  kriteriaIsuTerdahulu: PriorReportingCondition;
  risikoJenisUsaha: BinaryRisk;
  risikoKepemilikan: BinaryRisk;
  risikoSak: BinaryRisk;
  risikoIsuTerdahulu: BinaryRisk;
  risikoIntegritas: BinaryRisk;
  risikoKompetensiIndependensi: BinaryRisk;
  risikoAuditorPendahulu: BinaryRisk | 'N/A';
  ringkasanRisikoGabungan: BinaryRisk;
  keputusanPenerimaan: YesNoUpper;
  mitigasiRisiko: string;
}

export interface A1101PriorIssues {
  q1aKelangsunganCatatan: YesNoNA;
  q1bKelangsunganOpini: YesNoNA;
  q2Restrukturisasi: YesNoNA;
  q3RugiBerlanjut: YesNoNA;
  q4Restated: YesNoNA;
  q5OpiniModifikasi: YesNoNA;
  alasanTetapMenerima: string;
  simpulanRisiko: BinaryRisk;
}

export interface A1102ManagementIntegrity {
  q1ReputasiBuruk: YesNoNA;
  q2KetidakwajaranOperasi: YesNoNA;
  q3AgresivitasAkuntansi: YesNoNA;
  q4TekananFee: YesNoNA;
  q5PembatasanLingkup: YesNoNA;
  q6IndikasiTppu: YesNoNA;
  q7ReputasiAfiliasi: YesNoNA;
  q8DualAuditor: YesNoNA;
  q9AlasanPergantianKap: YesNoNA;
  alasanTetapMenerima: string;
  simpulanRisiko: BinaryRisk;
}

export interface A1102_1AmlItem {
  kodeKriteria: string;
  kategori: 'Profil' | 'Negara' | 'Bisnis' | 'Produk';
  deskripsiKriteria: string;
  jawaban: 'Ya' | 'Tidak';
  penjelasan: string;
}

export interface A1103TeamEvaluation {
  userId: string;
  pengalamanTahun: number;
  kompetensiEntitas: 'Memadai' | 'Kurang Memadai';
  kompetensiSpap: 'Memadai' | 'Kurang Memadai';
  kompetensiRegulasi: 'Memadai' | 'Kurang Memadai';
  kompetensiTi: 'Memadai' | 'Kurang Memadai';
  kompetensiPelaporan: 'Memadai' | 'Kurang Memadai';
  isCuti: boolean;
  isResign: boolean;
  isPhk: boolean;
  isAkhirKontrak: boolean;
  isPerikatanLain: boolean;
  isBatasanLain: boolean;
  ancamanKeuangan: boolean;
  ancamanPekerjaan: boolean;
  ancamanKeluarga: boolean;
  ancamanNonAudit: boolean;
  isSelected: boolean;
  peranTim: UserRole;
  inisial: string;
}

export interface ClientGovernanceItem {
  id: string;
  kategoriJabatan: 'Pemegang Saham' | 'Komisaris' | 'Direksi' | 'Manajemen Kunci';
  namaPejabat: string;
  jabatanPersentase: string;
}

export interface A1105PredecessorComm {
  q1KomunikasiDilakukan: 'Ya' | 'Tidak';
  q2BalasanDiterima: 'Ya' | 'Tidak';
  q3aKeberatanProfesional: 'Ya' | 'Tidak';
  q3bSengketaFee: 'Ya' | 'Tidak';
  penjelasanTindakLanjut: string;
  simpulanRisiko: BinaryRisk;
}

export interface A120TimeBudget {
  tanggalMulai: string;
  tanggalSelesai: string;
  hariKalender: number;
  hariWeekend: number;
  hariLiburNasional: number;
  hariEfektif: number;
  jamPerHari: 7;
  isEqcrRequired: boolean;
  temaPelatihanBerkelanjutan: string;
}

export interface LegalChecklistItem {
  kodeIndeks: 'A130' | 'A140' | 'A150' | 'A160';
  kodeKlausul: string;
  uraianKlausul: string;
  isCompliant: boolean;
  catatan: string;
}

export interface A150IndependenceDeclaration {
  userId: string;
  statusDeklarasi: 'Pending' | 'Signed' | 'Declined';
  tanggalTandatangan?: string;
  metodeTandatangan?: 'Digital PIN' | 'E-Signature' | 'Upload Basah';
  isConflictFree: boolean;
  catatanKonflik: string;
}

export interface A170OpeningBalance {
  q1BacaLkTerdahulu: 'Ya' | 'Tidak';
  q2aReviuKkpPendahulu: 'Ya' | 'Tidak';
  q2bEvaluasiProsedurBerjalan: 'Ya' | 'Tidak';
  q2cProsedurSpesifikSaldo: 'Ya' | 'Tidak';
  q3BuktiPemindahanSaldo: 'Ya' | 'Tidak';
  q4KonsistensiKebijakan: 'Ya' | 'Tidak';
  q5SalahSajiMaterial: 'Ya' | 'Tidak';
  simpulanKewajaran:
    | 'Secara umum Saldo Awal sudah wajar'
    | 'Saldo Awal belum sepenuhnya wajar'
    | 'Saldo Awal tidak wajar';
  penjelasanKetidakwajaran: string;
}

// ============================================================================
// 3. MODUL A2 — RISK ASSESSMENT (PRD 2)
// ============================================================================

export type MaterialityBenchmark =
  | 'Total Aset'
  | 'Aset bersih'
  | 'Jumlah Pendapatan'
  | 'Jumlah HPP'
  | 'Laba sebelum pajak'
  | 'Laba sebelum bunga, pajak, penyusutan, dan amortisasi'
  | 'Total Liabilitas'
  | 'Lainnya (seperti acuan dari auditor induk)';

export interface A210Materiality {
  karakteristikEntitas: string;
  acuanSaldo: MaterialityBenchmark;
  nilaiSaldoAcuan: number;
  customBenchmarkValue?: number;
  marginOmPersen: number;
  nilaiOm: number;
  pertimbanganOm: string;
  marginPmPersen: number;
  nilaiPm: number;
  pertimbanganPm: string;
  marginAmptPersen: number;
  nilaiAmpt: number;
  pertimbanganAmpt: string;
}

export interface A230EntityRiskItem {
  kodeSubIndeks: 'A230.1' | 'A230.2' | 'A230.3' | 'A230.4' | 'A230.5' | 'A230.6' | 'A230.6A' | 'A230.7';
  kodePertanyaan: string;
  uraianPertanyaan: string;
  hasilAnalisis: string;
  penjelasanAuditor: string;
  isFraudRisk: boolean;
  affectedAccounts: {
    leadCode: string;
    namaAkun: string;
    arahSalahSaji: 'Overstatement' | 'Understatement' | 'Misclassification';
  }[];
}

export interface A240InherentRiskRow {
  leadCode: string;
  namaAkun: string;
  saldoBerjalan: number;
  isSignificantAccount: boolean;
  alasanSignifikansi: string;
  isSignificantRisk: boolean;
  irByAssertion: Record<AuditAssertion, RiskLevel>;
  catatanInherentRisk: string;
}

export interface A250ControlTestItem {
  id: string;
  nomorUrut: number;
  uraianProsedurSop: string;
  frekuensi: 'Setiap Transaksi' | 'Harian' | 'Mingguan' | 'Bulanan' | 'Triwulanan' | 'Tahunan';
  wcgwRisiko: string;
  tipeAktivitas:
    | 'Otorisasi'
    | 'Penelaahan kinerja'
    | 'Pengolahan informasi'
    | 'Pengendalian fisik'
    | 'Pemisahan tugas'
    | 'Tidak ada';
  desainSesuai: 'Sesuai' | 'Tidak sesuai';
  hasilToc: 'Efektif' | 'Tidak Efektif' | 'Tidak Berlaku';
  dampakAsersi: Record<'C' | 'E' | 'A&C' | 'V', boolean>;
  catatanPengujian: string;
}

export interface A250ControlCycle {
  kodeSiklus:
    | 'A250.1'
    | 'A250.2'
    | 'A250.3'
    | 'A250.4'
    | 'A250.5'
    | 'A250.6'
    | 'A250.7'
    | 'A250.8'
    | 'A250.9'
    | 'A250.10'
    | 'A250.11'
    | 'A250.12'
    | 'A250.13';
  namaSiklus: string;
  relatedLeadCodes: string[];
  items: A250ControlTestItem[];
  simpulanPengendalian:
    | 'Pengendalian Internal pada siklus ini memadai'
    | 'Pengendalian Internal pada siklus ini belum sepenuhnya memadai'
    | 'Pengendalian Internal pada siklus ini tidak memadai';
  controlRiskLevel: RiskLevel;
  catatanSimpulan: string;
}

export interface A260GovernanceComm {
  hasTcwg: boolean;
  tcwgAreas?: boolean[];
  simpulanTcwg: 'Komunikasi dengan pihak TCWG sudah memadai' | 'Komunikasi dengan pihak TCWG kurang memadai';
  catatanTcwg: string;
  hasInternalAudit: boolean;
  spiAreas?: boolean[];
  simpulanInternalAudit:
    | 'Prosedur tahap ini tidak relevan'
    | 'Bukti Audit yang diperoleh telah cukup memadai'
    | 'Bukti Audit belum cukup memadai';
  catatanInternalAudit: string;
}

export interface A270RommRow {
  leadCode: string;
  namaAkun: string;
  cycleCode: A250ControlCycle['kodeSiklus'];
  rommByAssertion: Record<AuditAssertion, RiskLevel>;
  overallRomm: RiskLevel;
  responAuditKomprehensif: string;
  requiresSubstantiveTest: boolean;
  requiresTestOfControls: boolean;
}

export interface A280StrategyUpdate {
  ringkasanPerubahanMaterialitas: string;
  ringkasanAreaRisikoTinggi: string;
  pendekatanAuditUtama: 'Substantive Approach' | 'Combined Approach';
  alokasiTimLapangan: string;
  targetPenyelesaianFaseB: string;
}

// ============================================================================
// 4. MODUL B CORE — WSTB, AJE/RJE, FS & B210-B280 (PRD 3)
// ============================================================================

export type FsAccountGroup = 'ASET' | 'LIABILITAS' | 'EKUITAS_ASET_BERSIH' | 'PENDAPATAN' | 'BEBAN';

export interface TrialBalanceAccount {
  id: string;
  kodeAkun: string;
  namaAkun: string;
  posisiNormal: 'Debit' | 'Kredit';
  groupAkun: FsAccountGroup;
  kelompokAkun: string;
  headerAkun: string;
  leadCode: string;
  isClosingReAccount: boolean;
  isOciAccount: boolean;
  unauditedDebit: number;
  unauditedCredit: number;
  pembandingDebit: number;
  pembandingCredit: number;
}

export interface AuditJournalLine {
  id: string;
  accountId: string;
  kodeAkun: string;
  namaAkun: string;
  posisi: 'Debit' | 'Kredit';
  nilai: number;
}

export interface AuditJournalEntry {
  id: string;
  nomorJurnal: string;
  jenisJurnal: 'AJE' | 'RJE';
  statusPersetujuan: 'Proposed' | 'Accepted' | 'Rejected';
  tanggalJurnal: string;
  referensiKkp: string;
  keterangan: string;
  lines: AuditJournalLine[];
  totalDebit: number;
  totalKredit: number;
  createdBy: string;
  createdAt: string;
}

export interface SpecialProceduresData {
  b210: {
    posEstimasi: string;
    metodeEvaluasi: string;
    isAssumptionsRealistic: boolean;
    isManagementBiasDetected: boolean;
    checklist: boolean[];
    simpulan: 'Penggunaan Estimasi Akuntansi telah memadai' | 'Penggunaan Estimasi Akuntansi belum sepenuhnya memadai';
    catatan: string;
  };
  b220: {
    prosedurChecklist?: boolean[];
    registers: {
      id: string;
      namaPihakBerelasi: string;
      sifatHubungan: string;
      jenisTransaksi: string;
      nilaiTransaksi: number;
      saldoAkhir: number;
      isArmLength: boolean;
      isDisclosedInCalk: boolean;
    }[];
    simpulan:
      | 'Bukti audit cukup dan tepat serta penilaian transaksi pihak berelasi telah memadai'
      | 'Bukti audit tidak cukup dan tepat serta penilaian transaksi pihak berelasi belum memadai';
    catatan: string;
  };
  b230: {
    tanggalPencarian: string;
    tipePeristiwa: 'Type 1 - Adjusting' | 'Type 2 - Disclosure Only' | 'None';
    uraianPeristiwa: string;
    tindakanAudit: string;
    simpulan:
      | 'Bukti audit cukup dan tepat serta Evaluasi Peristiwa Kemudian memadai'
      | 'Bukti audit tidak cukup dan tepat serta Evaluasi Peristiwa Kemudian tidak memadai';
  };
  b240: {
    indikatorKeuanganBuruk: boolean;
    indikatorOperasionalBuruk: boolean;
    evaluasiRencanaManajemen: string;
    periodeProyeksiBulan: number;
    simpulan:
      | 'Tidak terdapat keraguan signifikan atas kelangsungan usaha entitas'
      | 'Terdapat keraguan signifikan atas kelangsungan usaha entitas namun telah diungkapkan memadai'
      | 'Terdapat keraguan signifikan atas kelangsungan usaha entitas dan belum diungkapkan memadai';
  };
  b250: {
    tanggalSuratRepresentasi: string;
    namaPenandatanganCeo: string;
    namaPenandatanganCfo: string;
    checklist?: ('YA' | 'TIDAK')[];
    simpulan: 'Representasi manajemen memadai' | 'Representasi manajemen tidak memadai';
    catatan: string;
  };
  b260: {
    isUsed: boolean;
    namaPakar: string;
    bidangKeahlian: string;
    kualifikasiKompetensi: string;
    evaluasiObjektivitas: string;
    evaluasiHasilPekerjaan: string;
    simpulan: 'MEMADAI' | 'TIDAK MEMADAI' | 'TIDAK RELEVAN';
  };
  b270: {
    isUsed: boolean;
    namaPakar: string;
    bidangKeahlian: string;
    kualifikasiKompetensi: string;
    evaluasiAsumsiMetode: string;
    simpulan: 'MEMADAI' | 'TIDAK MEMADAI' | 'TIDAK RELEVAN';
  };
  b280: {
    hasLawyerConfirmation: boolean;
    hasTaxContingency: boolean;
    hasGuaranteeCommitments: boolean;
    hasDerivativeContracts: boolean;
    simpulan:
      | 'Bukti audit cukup dan tepat serta Penilaian komitmen dan kontijensi memadai'
      | 'Bukti audit tidak cukup dan tepat serta Penilaian komitmen dan kontijensi tidak memadai';
    catatan: string;
  };
}

// ============================================================================
// 5. MODUL B LEADS & ISA SAMPLING (PRD 4)
// ============================================================================

export type SapAssuranceLevel = 'High' | 'Moderate' | 'No';

export interface AuditSampleItem {
  id: string;
  sampleNumber: number;
  transactionDate: string;
  documentReference: string;
  description: string;
  counterparty: string;
  bookValue: number;
  auditedValue: number;
  misstatementNature: string;
  auditNotes: string;
  isAnomaly: boolean;
}

export interface SamplingRun {
  id: string;
  runDate: string;
  performanceMateriality: number;
  rommLevel: RiskLevel;
  sapAssurance: SapAssuranceLevel;
  confidenceFactor: number;
  samplingInterval: number;
  totalPopulationValue: number;
  totalPopulationItems: number;
  specificItemsValue: number;
  specificItemsCount: number;
  testedPopulationValue: number;
  calculatedSampleSize: number;
  actualSampleSize: number;
  projectionMethod: 'Ratio' | 'Difference';
  projectedPopulationMisstatement: number;
  isMisstatementMaterial: boolean;
  samples: AuditSampleItem[];
  evaluatorNotes: string;
}

export interface SubstantiveTestItem {
  id: string;
  procedureNumber: number;
  procedureType: 'Analitis Substantif' | 'Substantif Rinci';
  procedureText: string;
  targetAssertions: string;
  executionStatus: 'Belum Dilaksanakan' | 'Dilaksanakan' | 'Tidak Dilaksanakan' | 'Tidak Aplikabel';
  picUserId?: string;
  workpaperReference: string;
  auditConclusion: string;
}

export interface LeadScheduleInstance {
  leadCode: string;
  atlasSheetNumber: string;
  title: string;
  accountCategory: string;
  normalBalance: 'DR' | 'CR';
  materialityType: 'OM' | 'PM' | 'Specific Materiality';
  sapAssuranceLevel: SapAssuranceLevel;
  assertionsTested: AuditAssertion[];
  procedures: SubstantiveTestItem[];
  samplingRun: SamplingRun | null;
  auditConclusion:
    | 'Akun tersebut telah disajikan secara wajar'
    | 'Akun tersebut disajikan secara wajar dengan pengecualian jurnal yang belum disesuaikan'
    | 'Akun tersebut tidak disajikan secara wajar'
    | 'Tidak dapat memberikan kesimpulan karena pembatasan lingkup pemeriksaan';
  conclusionNotes: string;
}

// ============================================================================
// 6. MODUL C — COMPLETING, DISCLOSURE, EQCR & OPINI (PRD 5)
// ============================================================================

export type OpinionCode = 'OPINI1' | 'OPINI2' | 'OPINI3' | 'OPINI4' | 'OPINI5';

export interface DisclosureReviewItem {
  id: string;
  frameworkCode: 'C220A' | 'C220B' | 'C220C' | 'C220D' | 'C220E' | 'C220F';
  itemNumber: string;
  topicCategory: string;
  standardReference: string;
  questionText: string;
  responseStatus: 'Ada' | 'Tidak Ada' | 'NA';
  calkReferenceNote: string;
  auditorComments: string;
}

export interface ModuleCData {
  c100SadItems: {
    id: string;
    sourceKkp: string;
    description: string;
    type: 'Factual' | 'Projected' | 'Judgmental';
    amount: number;
  }[];
  c110FinalMateriality: {
    marginOmPersen: number;
    marginPmPersen: number;
    marginAmptPersen: number;
    auditorJustification: string;
    conclusion:
      | 'Nilai yang tersaji pada laporan keuangan sudah material'
      | 'Terdapat penurunan materialitas namun prosedur audit yang telah dilaksanakan tetap memadai'
      | 'Terdapat penurunan materialitas dan auditor telah memperluas prosedur audit tambahan';
  };
  c120AnalyticalNotes: Record<string, string>;
  c210LaiReviewItems: {
    itemNumber: number;
    sectionName: string;
    procedureText: string;
    saRef: string;
    status: 'Ada' | 'Tidak Ada' | 'NA';
    notes: string;
  }[];
  c220Disclosures: DisclosureReviewItem[];
  c230Memorandum: {
    fraudEvaluation: string;
    complianceEvaluation: string;
    relatedPartiesEvaluation: string;
    litigationEvaluation: string;
    goingConcernEvaluation: string;
    specialistEvaluation: string;
    contingenciesEvaluation: string;
    icDeficiencies: string;
    finalMaterialitySummary: string;
    sadSummary: string;
    finalAnalyticsSummary: string;
    opinionRecommendationSummary: string;
    overallConclusion: string;
  };
  c300Eqcr: {
    eqcrReviewerId?: string;
    checklist: boolean[];
    findings: {
      id: string;
      indexRef: string;
      significantMatter: string;
      reviewerSuggestion: string;
      teamResponse: string;
      status: 'Pending' | 'Resolved';
    }[];
    conclusion: string;
    signedOffAt?: string;
  };
  c400Opinion: {
    q1EvidenceSufficient: boolean;
    q2MaterialMisstatement: boolean;
    q3ImpactPervasive: boolean;
    suggestedOpinion: OpinionCode;
    selectedOpinion: OpinionCode;
    overrideJustification: string;
    basisForModificationText: string;
    hasEmphasisOfMatter: boolean;
    emphasisOfMatterText: string;
    emphasisCalkRef: string;
    hasOtherMatter: boolean;
    otherMatterText: string;
    hasMaterialUncertaintyGoingConcern: boolean;
    goingConcernCalkRef: string;
    reportSequenceNumber: string;
    branchCode: string;
    targetedTo: string;
    signingPartnerId: string;
  };
}

// ============================================================================
// 7. ROOT WORKSPACE, PORTABLE BUNDLE & STORE STATE
// ============================================================================

export interface EngagementWorkspaceData {
  header: EngagementHeader;
  teamMembers: EngagementTeamMember[];
  workingPapers: Record<string, WorkingPaperRecord>;
  customCategories?: CustomIndexCategory[];
  pinnedIndices?: string[];
  reviewNotes: ReviewNote[];
  timeLogs: TimeLogEntry[];
  attachments: AttachmentItem[];
  auditTrail: AuditTrailEntry[];

  // Modul A1
  a110: A110Evaluation;
  a1101: A1101PriorIssues;
  a1102: A1102ManagementIntegrity;
  a1102_1: A1102_1AmlItem[];
  a1103: A1103TeamEvaluation[];
  governanceStructures: ClientGovernanceItem[];
  a1105: A1105PredecessorComm;
  a120: A120TimeBudget;
  legalChecklists: LegalChecklistItem[];
  a150Declarations: A150IndependenceDeclaration[];
  a170: A170OpeningBalance;

  // Modul A2
  a210: A210Materiality;
  a220Simpulan?: 'Hasil analisis awal tidak terdapat risiko salah saji material' | 'Hasil analisis awal terdapat risiko salah saji material';
  a230Items: A230EntityRiskItem[];
  a240Rows: A240InherentRiskRow[];
  a250Cycles: A250ControlCycle[];
  a260: A260GovernanceComm;
  a270Rows: A270RommRow[];
  a280: A280StrategyUpdate;

  // Modul B
  trialBalance: TrialBalanceAccount[];
  journals: AuditJournalEntry[];
  specialProcedures: SpecialProceduresData;
  leadSchedules: Record<string, LeadScheduleInstance>;

  // Modul C
  moduleC: ModuleCData;
}

export interface AtlasPortableBundle {
  schemaVersion: 'atlas-web-2.1';
  exportedAt: string;
  exportedBy: string;
  kapProfile: KapProfile;
  users: UserProfile[];
  client: ClientEntity;
  engagementBundle: EngagementWorkspaceData;
}

export type UiViewMode = 'hub' | 'workspace';
export type HubTabId = 'perikatan' | 'klien' | 'personil' | 'profil';

export interface UiPreferences {
  sidebarCollapsed: boolean;
  drawerOpen: boolean;
  activeIndex: string;
  viewMode: UiViewMode;
  hubTab: HubTabId;
  expandedNodeIds?: Record<string, boolean>;
}

export interface AtlasStoreState {
  kapProfile: KapProfile;
  users: UserProfile[];
  activeUserId: string;
  clients: ClientEntity[];
  engagements: EngagementHeader[];
  activeEngagementId: string | null;
  workspaces: Record<string, EngagementWorkspaceData>;
}
