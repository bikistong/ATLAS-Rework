import {
  AccountingFramework,
  ClientOwnershipStatus,
  ClientSector,
  EngagementWorkspaceData,
  PriorReportingCondition,
  ROMM_PRIORITY,
  RiskLevel,
} from '../types/atlas';

export function formatAuditNumber(value: number, decimals = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);
  return safe < 0 ? `(${formatted})` : formatted;
}

const BULAN_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function formatIdDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatIdDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatIdDate(dateStr)}, ${hh}:${mm}`;
}

export function toRomanMonth(monthOneBased: number): string {
  const idx = Math.max(1, Math.min(12, Math.floor(monthOneBased))) - 1;
  return ROMAN_MONTHS[idx];
}

export function formatDurationHms(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}

/**
 * ATURAN ANTI-BUG #1: Hitung worst-case RoMM secara numerik menggunakan ROMM_PRIORITY.
 */
export function computeOverallRomm(levels: RiskLevel[]): RiskLevel {
  if (levels.length === 0) return 'Low';
  return levels.reduce<RiskLevel>((worst, current) => {
    return ROMM_PRIORITY[current] > ROMM_PRIORITY[worst] ? current : worst;
  }, 'Low');
}

/**
 * Menghitung visibilitas kondisional indeks A170, A1105, dan C300 (EQCR) sesuai PRD_0 & PRD_1.
 */
export function isIndexVisibleForWorkspace(
  kodeIndeks: string,
  workspace: EngagementWorkspaceData | null | undefined,
  ownershipStatus?: ClientOwnershipStatus
): boolean {
  if (!workspace) return true;

  if (kodeIndeks === 'A170') {
    return (
      workspace.header.tipePerikatan === 'Perikatan Tahun Pertama' &&
      workspace.a110.kriteriaIsuTerdahulu !==
        'Entitas berdiri pada periode berjalan dan laporan keuangan tersedia pada periode berjalan'
    );
  }

  if (kodeIndeks === 'A1105') {
    return (
      workspace.header.tipePerikatan === 'Perikatan Tahun Pertama' &&
      workspace.a110.kriteriaIsuTerdahulu ===
        'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia dan telah diaudit auditor independen lain atau auditor yang bersangkutan'
    );
  }

  if (kodeIndeks === 'C300') {
    return workspace.a120.isEqcrRequired || ownershipStatus === 'Swasta - Go Publik';
  }

  return true;
}

export function getSectorDisplayLabel(sector: ClientSector): string {
  return sector.replace(/_/g, ' ');
}

export const CLIENT_SECTORS: ClientSector[] = [
  'Pertanian_perkebunan_kehutanan_peternakan_kelautan_perikanan',
  'Pertambangan_dan_energi',
  'Properti_dan_Konstruksi',
  'Industri_Pengolahan/Manufaktur',
  'Perdagangan_dan_Jasa',
  'Informasi_komunikasi_dan_Transportasi',
  'Sektor_Keuangan_Perbankan',
  'Sektor_Keuangan_Asuransi_dan_Dana_Pensiun',
  'Sektor_Keuangan_Lainnya',
  'Industri_Lainnya',
  'Pemerintahan_Badan_International_Organisasi_Non_Profit',
  'Non_Industri_Perorangan',
];

export const CLIENT_OWNERSHIP_STATUSES: ClientOwnershipStatus[] = [
  'Swasta - Go Publik',
  'Swasta - Non Go Publik',
  'BUMN/BUMD',
  'Sektor Publik',
  'Koperasi',
  'Yayasan',
];

export const ACCOUNTING_FRAMEWORKS: AccountingFramework[] = [
  'SAK Umum konvergensi IFRS',
  'SAK ETAP',
  'SAK EMKM',
  'SAK SYARIAH',
  'SAP',
  'SAK LAINNYA',
];

export const PRIOR_REPORTING_CONDITIONS: PriorReportingCondition[] = [
  'Entitas berdiri pada periode berjalan dan laporan keuangan tersedia pada periode berjalan',
  'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tidak tersedia',
  'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia namun belum pernah diaudit',
  'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia dan telah diaudit auditor independen lain atau auditor yang bersangkutan',
];

export const INDONESIA_PROVINCES: string[] = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Sumatera Selatan',
  'Kepulauan Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'DKI Jakarta',
  'Jawa Barat',
  'Banten',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Gorontalo',
  'Sulawesi Tengah',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Barat Daya',
];
