import { FsAccountGroup } from '../types/atlas';

export const COA_GROUP_OPTIONS: { value: FsAccountGroup; label: string; normal: 'Debit' | 'Kredit' }[] = [
  { value: 'ASET', label: 'ASET', normal: 'Debit' },
  { value: 'LIABILITAS', label: 'LIABILITAS', normal: 'Kredit' },
  { value: 'EKUITAS_ASET_BERSIH', label: 'EKUITAS / ASET BERSIH', normal: 'Kredit' },
  { value: 'PENDAPATAN', label: 'PENDAPATAN', normal: 'Kredit' },
  { value: 'BEBAN', label: 'BEBAN & PAJAK', normal: 'Debit' },
];

export const COA_KELOMPOK_BY_GROUP: Record<FsAccountGroup, string[]> = {
  ASET: ['Aset Lancar', 'Aset Tidak Lancar'],
  LIABILITAS: ['Liabilitas Jangka Pendek', 'Liabilitas Jangka Panjang'],
  EKUITAS_ASET_BERSIH: ['Ekuitas', 'Aset Bersih'],
  PENDAPATAN: ['Pendapatan Usaha', 'Pendapatan Non-Operasional'],
  BEBAN: ['Beban Pokok', 'Beban Operasional', 'Beban Non-Operasional', 'Beban Pajak Penghasilan'],
};

export const B210_CHECKLIST_ITEMS: string[] = [
  '1. Pemahaman kebijakan akuntansi & metode penentuan estimasi manajemen sesuai SAK.',
  '2. Evaluasi relevansi, kelengkapan, dan akurasi sumber data yang mendasari estimasi.',
  '3. Pengujian keandalan dan konsistensi asumsi signifikan manajemen dibanding periode lalu.',
  '4. Pengujian perhitungan ulang (recomputation) atau pengembangan point estimate independen auditor.',
  '5. Evaluasi kejadian setelah tanggal pelaporan (subsequent events) yang mengonfirmasi estimasi.',
  '6. Penilaian kecukupan pengungkapan ketidakpastian estimasi dalam CALK.',
  '7. Evaluasi indikator kemungkinan keberpihakan manajemen (management bias) atas estimasi.',
];

export const B220_PROCEDURE_ITEMS: string[] = [
  '1. Inspeksi risalah rapat RUPS, Dewan Komisaris, dan daftar kepemilikan saham untuk mengidentifikasi pihak berelasi.',
  '2. Permintaan keterangan kepada manajemen mengenai sifat hubungan, struktur grup, dan pihak berelasi baru.',
  '3. Inspeksi kontrak perjanjian pinjaman, sewa, penjualan/pembelian, dan jaminan dengan pihak berelasi.',
  '4. Pengujian kewajaran harga dan ketentuan transaksi (arm’s length principle) dibanding pihak ketiga.',
  '5. Konfirmasi langsung saldo akhir piutang/utang pihak berelasi per tanggal neraca.',
  '6. Evaluasi kesesuaian pengungkapan hubungan, nilai transaksi, dan saldo pihak berelasi pada CALK.',
];

export const B250_REPRESENTATION_ITEMS: string[] = [
  '1. Manajemen telah memenuhi tanggung jawab menyusun laporan keuangan secara wajar sesuai SAK.',
  '2. Seluruh transaksi telah dicatat, didukung informasi yang lengkap, dan akses tidak dibatasi.',
  '3. Manajemen mengungkapkan hasil penilaian risiko kecurangan dan dugaan kecurangan yang diketahui.',
  '4. Seluruh hubungan dan transaksi pihak berelasi telah diungkapkan sesuai kerangka pelaporan.',
  '5. Seluruh peristiwa kemudian (subsequent events) telah disesuaikan atau diungkapkan.',
  '6. Dampak salah saji yang tidak dikoreksi (SAD) tidak material baik individual maupun agregat.',
];

export const B280_PROCEDURE_ITEMS: { key: 'hasLawyerConfirmation' | 'hasTaxContingency' | 'hasGuaranteeCommitments' | 'hasDerivativeContracts'; label: string; saNote: string }[] = [
  {
    key: 'hasLawyerConfirmation',
    label: 'Terdapat Konfirmasi Penasihat Hukum / Perkara Litigasi Aktif',
    saNote: 'SA 501.9 — Surat konfirmasi langsung ke konsultan hukum eksternal mengenai klaim & perkara.',
  },
  {
    key: 'hasTaxContingency',
    label: 'Terdapat Kontinjensi Perpajakan (SKP / Keberatan / Banding Pajak)',
    saNote: 'Evaluasi surat ketetapan pajak, pemeriksaan berjalan, dan kecukupan provisi pajak.',
  },
  {
    key: 'hasGuaranteeCommitments',
    label: 'Terdapat Komitmen Jaminan Aset, Sewa Jangka Panjang, atau Fasilitas Kredit',
    saNote: 'Telusuri jaminan fidusia/hak tanggungan, kontrak sewa, dan kapitalisasi komitmen.',
  },
  {
    key: 'hasDerivativeContracts',
    label: 'Terdapat Kontrak Derivatif / Lindung Nilai / Off-Balance Sheet Lainnya',
    saNote: 'Periksa nilai wajar instrumen derivatif serta kepatuhan pengungkapan komitmen di CALK.',
  },
];

export const B210_SIMPULAN_OPTIONS = [
  'Penggunaan Estimasi Akuntansi telah memadai',
  'Penggunaan Estimasi Akuntansi belum sepenuhnya memadai',
] as const;

export const B220_SIMPULAN_OPTIONS = [
  'Bukti audit cukup dan tepat serta penilaian transaksi pihak berelasi telah memadai',
  'Bukti audit tidak cukup dan tepat serta penilaian transaksi pihak berelasi belum memadai',
] as const;

export const B230_SIMPULAN_OPTIONS = [
  'Bukti audit cukup dan tepat serta Evaluasi Peristiwa Kemudian memadai',
  'Bukti audit tidak cukup dan tepat serta Evaluasi Peristiwa Kemudian tidak memadai',
] as const;

export const B240_SIMPULAN_OPTIONS = [
  'Tidak terdapat keraguan signifikan atas kelangsungan usaha entitas',
  'Terdapat keraguan signifikan atas kelangsungan usaha entitas namun telah diungkapkan memadai',
  'Terdapat keraguan signifikan atas kelangsungan usaha entitas dan belum diungkapkan memadai',
] as const;

export const B250_SIMPULAN_OPTIONS = [
  'Representasi manajemen memadai',
  'Representasi manajemen tidak memadai',
] as const;

export const B260_B270_SIMPULAN_OPTIONS = ['MEMADAI', 'TIDAK MEMADAI', 'TIDAK RELEVAN'] as const;

export const B280_SIMPULAN_OPTIONS = [
  'Bukti audit cukup dan tepat serta Penilaian komitmen dan kontijensi memadai',
  'Bukti audit tidak cukup dan tepat serta Penilaian komitmen dan kontijensi tidak memadai',
] as const;
