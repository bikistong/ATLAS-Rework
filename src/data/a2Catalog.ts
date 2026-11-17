import {
  A230EntityRiskItem,
  A250ControlTestItem,
  MaterialityBenchmark,
} from '../types/atlas';

export interface BenchmarkSpec {
  benchmark: MaterialityBenchmark;
  kode: string;
  normalMinPct: number;
  normalMaxPct: number;
  defaultPct: number;
  keterangan: string;
}

/** 8 Pilihan Acuan Benchmark Saldo Baku ATLAS v2.1 (A210.J29) */
export const MATERIALITY_BENCHMARKS: BenchmarkSpec[] = [
  {
    benchmark: 'Total Aset',
    kode: 'BM-01',
    normalMinPct: 0.5,
    normalMaxPct: 2.0,
    defaultPct: 1.5,
    keterangan: 'Tepat untuk entitas padat modal, real estat, investasi, atau saat fokus pengguna pada aset.',
  },
  {
    benchmark: 'Aset bersih',
    kode: 'BM-02',
    normalMinPct: 1.0,
    normalMaxPct: 5.0,
    defaultPct: 2.0,
    keterangan: 'Tepat untuk reksadana, entitas nirlaba, atau entitas dengan fokus struktur ekuitas bersih.',
  },
  {
    benchmark: 'Jumlah Pendapatan',
    kode: 'BM-03',
    normalMinPct: 0.5,
    normalMaxPct: 2.0,
    defaultPct: 1.0,
    keterangan: 'Tepat untuk entitas dagang/jasa saat laba sebelum pajak fluktuatif atau mendekati impas.',
  },
  {
    benchmark: 'Jumlah HPP',
    kode: 'BM-04',
    normalMinPct: 0.5,
    normalMaxPct: 2.0,
    defaultPct: 1.0,
    keterangan: 'Alternatif untuk entitas manufaktur/dagang bervolume transaksi pokok tinggi.',
  },
  {
    benchmark: 'Laba sebelum pajak',
    kode: 'BM-05',
    normalMinPct: 3.0,
    normalMaxPct: 7.0,
    defaultPct: 5.0,
    keterangan: 'Pedoman utama standar untuk entitas komersial berorientasi laba yang stabil (SA 320.A4).',
  },
  {
    benchmark: 'Laba sebelum bunga, pajak, penyusutan, dan amortisasi',
    kode: 'BM-06',
    normalMinPct: 2.0,
    normalMaxPct: 5.0,
    defaultPct: 3.5,
    keterangan: 'Tepat untuk entitas dengan beban bunga/depresiasi tinggi di mana pengguna fokus pada EBITDA.',
  },
  {
    benchmark: 'Total Liabilitas',
    kode: 'BM-07',
    normalMinPct: 0.5,
    normalMaxPct: 2.0,
    defaultPct: 1.0,
    keterangan: 'Digunakan apabila kreditur memfokuskan penilaian pada pemenuhan kewajiban dan likuiditas.',
  },
  {
    benchmark: 'Lainnya (seperti acuan dari auditor induk)',
    kode: 'BM-08',
    normalMinPct: 0.5,
    normalMaxPct: 5.0,
    defaultPct: 1.0,
    keterangan: 'Acuan komponen/group audit instruksi dari auditor induk atau basis khusus lainnya.',
  },
];

/** 6 Opsi Karakteristik Entitas Baku ATLAS v2.1 (A210.AF16:AM18) */
export const ENTITY_CHARACTERISTICS_OPTIONS: {
  value: string;
  recommendedBenchmark: MaterialityBenchmark;
  ringkasan: string;
}[] = [
  {
    value: 'Entitas Normal',
    recommendedBenchmark: 'Laba sebelum pajak',
    ringkasan: 'Entitas berorientasi laba dengan operasi reguler dan laba sebelum pajak positif stabil.',
  },
  {
    value: 'Entitas Nirlaba',
    recommendedBenchmark: 'Aset bersih',
    ringkasan: 'Entitas nirlaba di mana pengguna laporan keuangan berfokus pada pendapatan, beban, atau aset bersih.',
  },
  {
    value: 'Selain Entitas nirlaba, ketika laba/rugi sebelum pajak tidak dipertimbangkan sesuai sebagai pedoman patokan',
    recommendedBenchmark: 'Jumlah Pendapatan',
    ringkasan: 'Entitas komersial yang mengalami laba/rugi fluktuatif atau mendekati titik impas.',
  },
  {
    value: 'Entitas dimana EBITDA dipertimbangkan sesuai sebagai pedoman patokan',
    recommendedBenchmark: 'Laba sebelum bunga, pajak, penyusutan, dan amortisasi',
    ringkasan: 'Pengguna laporan keuangan menekankan arus kas operasional sebelum struktur pendanaan & depresiasi.',
  },
  {
    value: 'Entitas yang tidak aktif dan/atau pengguna laporan keuangan fokus pada aset',
    recommendedBenchmark: 'Total Aset',
    ringkasan: 'Entitas memegang aset produktif/investasi signifikan dengan aktivitas pendapatan terbatas.',
  },
  {
    value: 'Entitas (reksadana) dimana aset bersih dipertimbangkan tepat sebagai pedoman patokan yang sesuai',
    recommendedBenchmark: 'Aset bersih',
    ringkasan: 'Entitas investasi kolektif / dana kelolaan yang diukur berdasarkan Nilai Aset Bersih (NAB).',
  },
];

/** 9 Panduan Dokumentasi Pertimbangan OM (Blueprint sheet "pertimbangan OM") */
export const PERTIMBANGAN_OM_GUIDANCE: { no: number; aspek: string; uraian: string }[] = [
  { no: 1, aspek: 'Pengguna Laporan Keuangan', uraian: 'Identifikasi pemilik, kreditur/bank, otoritas pajak, regulator sektoral, atau lembaga pemerintah.' },
  { no: 2, aspek: 'Harapan Khusus Pengguna', uraian: 'Covenant perjanjian kredit, pengungkapan pihak berelasi, kontinjensi, dan kepatuhan regulasi.' },
  { no: 3, aspek: 'Elemen LK yang Relevan', uraian: 'Aset, liabilitas, ekuitas, pendapatan, atau beban yang menjadi perhatian utama pengguna.' },
  { no: 4, aspek: 'Sifat & Siklus Hidup Entitas', uraian: 'Fase growing, mature, atau declining serta dinamika industri dan ekonomi operasional.' },
  { no: 5, aspek: 'Penyesuaian Normalisasi', uraian: 'Evaluasi pos non-rutin / tidak berulang untuk menormalisasi basis acuan.' },
  { no: 6, aspek: 'Fokus Utama Pengguna', uraian: 'Profitabilitas berkelanjutan, solvabilitas, atau pencapaian program.' },
  { no: 7, aspek: 'Struktur Kepemilikan & Pembiayaan', uraian: 'Proporsi pendanaan utang vs ekuitas dan keterlibatan pemegang saham pengendali.' },
  { no: 8, aspek: 'Volatilitas 3–5 Tahun', uraian: 'Stabilitas laba/pendapatan selama beberapa tahun buku terakhir.' },
  { no: 9, aspek: 'Keterkaitan Risiko Modul A1', uraian: 'Konsistensi tingkat risiko perikatan A110 terhadap penentuan margin PM & AMPT.' },
];

export interface A230SubIndexConfig {
  kodeSubIndeks: A230EntityRiskItem['kodeSubIndeks'];
  judul: string;
  saRelevan: string;
  options: string[];
  promptChecklist: string[];
}

/** Opsi Dropdown Baku A230.1 s.d. A230.7 sesuai PRD 2 Bagian 3 */
export const A230_SUBINDEX_CONFIGS: A230SubIndexConfig[] = [
  {
    kodeSubIndeks: 'A230.1',
    judul: 'Faktor Industri, Regulasi & Eksternal',
    saRelevan: 'SA 315 Par. 11(a)',
    options: ['Rendah', 'Sedang', 'Tinggi', 'N/A'],
    promptChecklist: [
      'Kondisi pasar, persaingan, dan sifat siklus/musiman industri klien',
      'Akta pendirian, domisili, susunan pemegang saham, dan perizinan usaha aktif',
      'Faktor ekonomi makro (inflasi, suku bunga, nilai tukar) yang memengaruhi entitas',
    ],
  },
  {
    kodeSubIndeks: 'A230.2',
    judul: 'Sifat Entitas (Operasi, Struktur, Investasi & Pendanaan)',
    saRelevan: 'SA 315 Par. 11(b)',
    options: ['Rendah', 'Sedang', 'Tinggi', 'N/A'],
    promptChecklist: [
      'Struktur organisasi, pembagian tugas Dewan Komisaris, Direksi, dan Komite Audit',
      'Sumber pendapatan utama, pelanggan/pemasok utama, serta lokasi fasilitas operasional',
      'Struktur permodalan, utang bank jangka panjang, dan transaksi investasi/afiliasi',
    ],
  },
  {
    kodeSubIndeks: 'A230.3',
    judul: 'Kebijakan Akuntansi & Sub-Referensi A230.3.1',
    saRelevan: 'SA 315 Par. 11(c)',
    options: ['Sesuai', 'Perlu Perhatian', 'Tidak Sesuai'],
    promptChecklist: [
      'Konsistensi metode pengakuan pendapatan, persediaan, dan penyusutan aset tetap sesuai SAK',
      'Perubahan kebijakan akuntansi tahun berjalan dan kecukupan pengungkapan pada CALK (A230.3.1)',
      'Kebijakan estimasi signifikan (cadangan piutang, imbalan kerja, pajak tangguhan)',
    ],
  },
  {
    kodeSubIndeks: 'A230.4',
    judul: 'Tujuan, Strategi & Risiko Bisnis',
    saRelevan: 'SA 315 Par. 11(d)',
    options: ['Rendah', 'Sedang', 'Tinggi'],
    promptChecklist: [
      'Strategi ekspansi produk/pasar baru serta implikasinya terhadap risiko salah saji material',
      'Kepatuhan regulasi sektoral dan perpajakan (PPN, PPh 21/23/25/29) yang berdampak pada LK',
      'Risiko bisnis terkait perjanjian kredit atau ketergantungan pada lisensi utama',
    ],
  },
  {
    kodeSubIndeks: 'A230.5',
    judul: 'Pengukuran & Penelaahan Kinerja Keuangan (KPI)',
    saRelevan: 'SA 315 Par. 11(e)',
    options: ['Rendah', 'Sedang', 'Tinggi'],
    promptChecklist: [
      'Indikator kinerja utama (KPI) yang dipantau manajemen dan Dewan Komisaris',
      'Skema bonus/insentif berbasis target penjualan atau laba yang berpotensi menimbulkan tekanan',
      'Perbandingan tren kinerja keuangan entitas terhadap rata-rata industri sejenis',
    ],
  },
  {
    kodeSubIndeks: 'A230.6',
    judul: 'SPI Tingkat Entitas (5 Komponen COSO) & Kelangsungan Usaha',
    saRelevan: 'SA 315 Par. 12–24, SA 570',
    options: ['Memadai', 'Kurang Memadai', 'Tidak Memadai'],
    promptChecklist: [
      'Lingkungan pengendalian, integritas nilai etika, dan komitmen kompetensi manajemen',
      'Proses penilaian risiko entitas, aktivitas pengendalian, sistem informasi, dan pemantauan',
      'Evaluasi awal kelangsungan usaha (posisi modal kerja, arus kas operasi, kepatuhan utang)',
    ],
  },
  {
    kodeSubIndeks: 'A230.6A',
    judul: 'Evaluasi IT Controls (GITC) & Penyiapan Laporan Keuangan',
    saRelevan: 'SA 315 Par. 21, SA 240',
    options: ['Memadai', 'Kurang Memadai', 'Tidak Memadai'],
    promptChecklist: [
      'Pengendalian umum TI (GITC): manajemen akses pengguna, perubahan program, backup & DR',
      'Proses penutupan buku, penyusunan jurnal penyesuaian/eliminasi, dan penyajian LK',
      'Risiko pengabaian pengendalian oleh manajemen (management override of controls)',
    ],
  },
  {
    kodeSubIndeks: 'A230.7',
    judul: 'Faktor Risiko Kecurangan SA 240 (Fraud Triangle)',
    saRelevan: 'SA 240 Par. 10–27',
    options: ['Tidak', 'Ya'],
    promptChecklist: [
      'TEKANAN / INSENTIF: Kerugian berulang, covenant pinjaman ketat, target laba agresif, kompensasi berbasis laba',
      'PELUANG / KESEMPATAN: Dominasi satu orang, transaksi pihak berelasi kompleks, estimasi subjektif tinggi, lemahnya pemantauan',
      'RASIONALISASI / SIKAP: Komunikasi etika tidak efektif, ketegangan hubungan dengan auditor, atau keterlibatan manajemen non-akuntansi dalam pemilihan kebijakan',
    ],
  },
];

export const A250_FREKUENSI_OPTIONS: A250ControlTestItem['frekuensi'][] = [
  'Setiap Transaksi',
  'Harian',
  'Mingguan',
  'Bulanan',
  'Triwulanan',
  'Tahunan',
];

export const A250_TIPE_AKTIVITAS_OPTIONS: A250ControlTestItem['tipeAktivitas'][] = [
  'Otorisasi',
  'Penelaahan kinerja',
  'Pengolahan informasi',
  'Pengendalian fisik',
  'Pemisahan tugas',
  'Tidak ada',
];

export const A260_TCWG_AREAS: { kode: string; label: string; detail: string }[] = [
  {
    kode: 'a',
    label: 'Kesepahaman Hubungan Kerja Dua Arah',
    detail: 'Kesepahaman hubungan kerja yang saling mendukung antara auditor independen dengan TCWG.',
  },
  {
    kode: 'b',
    label: 'Rencana Ruang Lingkup & Jadwal Audit (Dari Auditor)',
    detail: 'Ruang lingkup audit, penerapan konsep materialitas, risiko signifikan, serta pendekatan terhadap pengendalian internal.',
  },
  {
    kode: 'c',
    label: 'Informasi Bisnis & Risiko dari TCWG',
    detail: 'Struktur tata kelola, tujuan & strategi entitas, kesadaran pengendalian internal, deteksi/dugaan kecurangan, dan tindak lanjut tahun lalu.',
  },
  {
    kode: 'd',
    label: 'Temuan Signifikan & Defisiensi SPI (SA 265)',
    detail: 'Kebijakan/estimasi akuntansi signifikan, kesulitan signifikan selama audit, indikasi kecurangan, serta defisiensi pengendalian internal.',
  },
];

export const A260_SPI_AREAS: { kode: string; label: string; detail: string }[] = [
  {
    kode: 'a',
    label: 'Objektivitas Fungsi Audit Internal (SA 610.15)',
    detail: 'Status organisasi, pelaporan langsung ke TCWG, akses tanpa hambatan, serta kebebasan dari benturan kepentingan operasional.',
  },
  {
    kode: 'b',
    label: 'Kompetensi Teknis Personel SPI',
    detail: 'Keanggotaan profesi relevan, pelatihan teknis memadai, serta kebijakan rekrutmen dan pembinaan auditor internal.',
  },
  {
    kode: 'c',
    label: 'Kecermatan Profesional & Koordinasi Komunikasi',
    detail: 'Keberadaan Manual Audit, supervisi dan dokumentasi kertas kerja SPI, serta akses laporan dan pertemuan berkala dengan auditor eksternal.',
  },
];
