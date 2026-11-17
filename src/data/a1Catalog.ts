import { A1102_1AmlItem, LegalChecklistItem } from '../types/atlas';

export const A1101_QUESTIONS: {
  key:
    | 'q1aKelangsunganCatatan'
    | 'q1bKelangsunganOpini'
    | 'q2Restrukturisasi'
    | 'q3RugiBerlanjut'
    | 'q4Restated'
    | 'q5OpiniModifikasi';
  nomor: string;
  pertanyaan: string;
}[] = [
  {
    key: 'q1aKelangsunganCatatan',
    nomor: '1a',
    pertanyaan: 'Apakah terdapat isu mengenai kelangsungan usaha yang tersaji pada Catatan atas Laporan Keuangan sebelumnya?',
  },
  {
    key: 'q1bKelangsunganOpini',
    nomor: '1b',
    pertanyaan: 'Apakah terdapat isu mengenai kelangsungan usaha yang tersaji pada Opini auditor sebelumnya?',
  },
  {
    key: 'q2Restrukturisasi',
    nomor: '2',
    pertanyaan: 'Apakah entitas sedang atau telah mengalami restrukturisasi keuangan / utang yang signifikan?',
  },
  {
    key: 'q3RugiBerlanjut',
    nomor: '3',
    pertanyaan: 'Apakah entitas mengalami kerugian usaha yang berlanjut dari periode-periode sebelumnya?',
  },
  {
    key: 'q4Restated',
    nomor: '4',
    pertanyaan: 'Apakah laporan keuangan periode sebelumnya pernah mengalami penyajian kembali (restated)?',
  },
  {
    key: 'q5OpiniModifikasi',
    nomor: '5',
    pertanyaan: 'Apakah opini auditor periode lalu (jika ada) menyatakan opini selain Wajar Tanpa Pengecualian?',
  },
];

export const A1102_QUESTIONS: {
  key:
    | 'q1ReputasiBuruk'
    | 'q2KetidakwajaranOperasi'
    | 'q3AgresivitasAkuntansi'
    | 'q4TekananFee'
    | 'q5PembatasanLingkup'
    | 'q6IndikasiTppu'
    | 'q7ReputasiAfiliasi'
    | 'q8DualAuditor'
    | 'q9AlasanPergantianKap';
  nomor: string;
  pertanyaan: string;
  isAutoSyncedFromAml?: boolean;
}[] = [
  {
    key: 'q1ReputasiBuruk',
    nomor: '1',
    pertanyaan: 'Apakah terdapat informasi negatif mengenai integritas, etika, dan reputasi pemilik atau manajemen kunci?',
  },
  {
    key: 'q2KetidakwajaranOperasi',
    nomor: '2',
    pertanyaan: 'Apakah terdapat ketidakwajaran sifat operasi entitas termasuk praktik bisnis atau transaksi pihak berelasi yang tidak lazim?',
  },
  {
    key: 'q3AgresivitasAkuntansi',
    nomor: '3',
    pertanyaan: 'Apakah manajemen cenderung agresif dalam menginterpretasikan standar akuntansi dan mengabaikan pengendalian internal?',
  },
  {
    key: 'q4TekananFee',
    nomor: '4',
    pertanyaan: 'Apakah klien secara agresif berusaha menekan imbalan jasa profesional KAP serendah mungkin secara tidak wajar?',
  },
  {
    key: 'q5PembatasanLingkup',
    nomor: '5',
    pertanyaan: 'Apakah terdapat indikasi pembatasan lingkup pekerjaan audit oleh manajemen yang tidak wajar?',
  },
  {
    key: 'q6IndikasiTppu',
    nomor: '6',
    pertanyaan: 'Apakah terdapat indikasi klien terlibat tindak pidana pencucian uang/pendanaan terorisme (PMK No. 55/155 Tahun 2017)? [Otomatis dari A1102.1]',
    isAutoSyncedFromAml: true,
  },
  {
    key: 'q7ReputasiAfiliasi',
    nomor: '7',
    pertanyaan: 'Apakah terdapat identitas atau reputasi buruk atas bisnis dari pihak-pihak yang mempunyai hubungan istimewa?',
  },
  {
    key: 'q8DualAuditor',
    nomor: '8',
    pertanyaan: 'Apakah terdapat penunjukan dua auditor independen pada periode yang sama tanpa alasan bisnis yang jelas?',
  },
  {
    key: 'q9AlasanPergantianKap',
    nomor: '9',
    pertanyaan: 'Apakah alasan pergantian KAP sebelumnya mengindikasikan perselisihan akuntansi atau opinion shopping?',
  },
];

export function buildFullAmlCatalog(): A1102_1AmlItem[] {
  return [
    // 1. Profil Pengguna Jasa (11 butir mencakup A-G dari A1102.1)
    { kodeKriteria: 'P-A1', kategori: 'Profil', deskripsiKriteria: 'PEP — Pejabat negara (lihat Detail Regulasi A1102.1A)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'P-A2', kategori: 'Profil', deskripsiKriteria: 'PEP — Pimpinan instansi pemerintah setingkat atau setara Eselon I', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'P-A3', kategori: 'Profil', deskripsiKriteria: 'PEP — Pejabat yang memiliki fungsi strategis (lihat Detail Regulasi A1102.1B)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'P-A4', kategori: 'Profil', deskripsiKriteria: 'PEP — Pejabat wajib LHKPN (lihat Detail Regulasi A1102.1C)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'P-A5', kategori: 'Profil', deskripsiKriteria: 'PEP — Pengurus atau anggota partai politik', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'P-B1', kategori: 'Profil', deskripsiKriteria: 'Pihak terkait PEP — Keluarga inti sampai derajat kedua, entitas dikendalikan PEP, atau rekan dekat PEP', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'P-C', kategori: 'Profil', deskripsiKriteria: 'Pejabat/petugas di bidang pelayanan publik (perizinan, pengadaan, penyaluran barang/jasa)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'P-D', kategori: 'Profil', deskripsiKriteria: 'Pejabat/pegawai yang bekerja untuk dan atas nama penyedia jasa keuangan', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'P-E', kategori: 'Profil', deskripsiKriteria: 'Orang atau entitas yang tercantum dalam Daftar Terduga Teroris dan Organisasi Teroris (DTTOT)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'P-F', kategori: 'Profil', deskripsiKriteria: 'Orang atau entitas yang tercantum dalam Sanction List PBB / organisasi internasional', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'P-G', kategori: 'Profil', deskripsiKriteria: 'Profesi tertentu berisiko (advokat, kurator, notaris, PPAT, akuntan, AP, perencana keuangan, konsultan pajak)', jawaban: 'Tidak', penjelasan: '' },

    // 2. Yurisdiksi Negara (5 butir)
    { kodeKriteria: 'N-A', kategori: 'Negara', deskripsiKriteria: 'Transaksi ke/dari negara asing non-kooperatif rekomendasi FATF', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'N-B', kategori: 'Negara', deskripsiKriteria: 'Transaksi ke/dari negara penghasil atau pusat perdagangan narkotika', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'N-C', kategori: 'Negara', deskripsiKriteria: 'Transaksi ke/dari negara dengan skor Worldwide Governance Indicators (WGI) < 50', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'N-D', kategori: 'Negara', deskripsiKriteria: 'Transaksi ke/dari negara yang diidentifikasi OECD sebagai Tax Haven', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'N-E', kategori: 'Negara', deskripsiKriteria: 'Transaksi ke/dari negara dengan Indeks Persepsi Korupsi (IPK Transparency Int.) < 40 (lihat Referensi A1102.D)', jawaban: 'Tidak', penjelasan: '' },

    // 3. Sektor Bisnis Berisiko Tinggi (13 Kategori PMK 55/155)
    { kodeKriteria: 'B-A', kategori: 'Bisnis', deskripsiKriteria: 'Usaha penukaran valuta asing (KUPVA) non-bank', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-B', kategori: 'Bisnis', deskripsiKriteria: 'Usaha penyelenggara transfer dana non-bank', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-C', kategori: 'Bisnis', deskripsiKriteria: 'Usaha agen perjalanan', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-D', kategori: 'Bisnis', deskripsiKriteria: 'Usaha berbasis tunai (minimarket, pengelola parkir, SPBU)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-E', kategori: 'Bisnis', deskripsiKriteria: 'Usaha investasi berbasis emas atau logam mulia', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-F', kategori: 'Bisnis', deskripsiKriteria: 'Usaha pengelolaan hasil hutan atau kehutanan', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-G', kategori: 'Bisnis', deskripsiKriteria: 'Usaha jasa pengangkutan atau pengapalan (freight forwarding)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-H', kategori: 'Bisnis', deskripsiKriteria: 'Usaha di bidang properti dan real estat', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-I', kategori: 'Bisnis', deskripsiKriteria: 'Perdagangan kendaraan bermotor mewah', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-J', kategori: 'Bisnis', deskripsiKriteria: 'Perdagangan permata, perhiasan, atau logam mulia', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-K', kategori: 'Bisnis', deskripsiKriteria: 'Perdagangan barang seni dan barang antik', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-L', kategori: 'Bisnis', deskripsiKriteria: 'Koperasi Simpan Pinjam (KSP) dengan total aset >= Rp1.000.000.000', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'B-M', kategori: 'Bisnis', deskripsiKriteria: 'Perdagangan ekspor/impor SDA hayati & non-hayati (minyak, mineral, batu bara)', jawaban: 'Tidak', penjelasan: '' },

    // 4. Produk/Jasa Finansial Berisiko Tinggi (13 Kategori A-M)
    { kodeKriteria: 'PR-A', kategori: 'Produk', deskripsiKriteria: 'Transfer dana (wire transfer)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-B', kategori: 'Produk', deskripsiKriteria: 'Instrumen pembayaran atas bawa (bearer negotiable instruments: bilyet giro, cek, surat sanggup)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-C', kategori: 'Produk', deskripsiKriteria: 'Layanan cross-border correspondent banking (payable through account)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-D', kategori: 'Produk', deskripsiKriteria: 'Electronic banking (internet, phone, mobile, SMS banking)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-E', kategori: 'Produk', deskripsiKriteria: 'Layanan prima (private banking) atau wealth management', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-F', kategori: 'Produk', deskripsiKriteria: 'Penitipan dengan pengelolaan (trust)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-G', kategori: 'Produk', deskripsiKriteria: 'Alat pembayaran menggunakan kartu (kartu kredit, ATM, debit)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-H', kategori: 'Produk', deskripsiKriteria: 'Kontrak pengelolaan dana (discretionary fund)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-I', kategori: 'Produk', deskripsiKriteria: 'Jasa kustodian (custodian)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-J', kategori: 'Produk', deskripsiKriteria: 'Non-deposit account services (unit link, reksadana, safe deposit box, obligasi, SUN)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-K', kategori: 'Produk', deskripsiKriteria: 'Uang elektronik (e-money)', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-L', kategori: 'Produk', deskripsiKriteria: 'Produk komoditi berjangka', jawaban: 'Tidak', penjelasan: '' },
    { kodeKriteria: 'PR-M', kategori: 'Produk', deskripsiKriteria: 'Gadai emas', jawaban: 'Tidak', penjelasan: '' },
  ];
}

export function buildFullLegalChecklists(): LegalChecklistItem[] {
  return [
    // A130: 11 klausul wajib Surat Perikatan (SA 210)
    { kodeIndeks: 'A130', kodeKlausul: 'a', uraianKlausul: 'Penanggalan surat sesuai dengan tanggal yang disepakati bersama klien', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'b', uraianKlausul: 'Penomoran surat sesuai tertib administrasi KAP yang berlaku', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'c', uraianKlausul: 'Penjelasan tujuan dan ruang lingkup audit atas laporan keuangan', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'd.1', uraianKlausul: 'Pengakuan tanggung jawab manajemen atas penyusunan LK sesuai SAK yang berlaku', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'd.2', uraianKlausul: 'Pengakuan tanggung jawab manajemen atas pengendalian internal bebas salah saji material', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'd.3', uraianKlausul: 'Kewajiban manajemen memberikan akses penuh atas informasi, dokumen, dan personel', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'e', uraianKlausul: 'Bentuk komunikasi yang diharapkan dalam penyampaian hasil audit', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'f', uraianKlausul: 'Ekspektasi penyampaian surat representasi tertulis dari manajemen (SA 580)', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'g', uraianKlausul: 'Kesepakatan jadwal penyediaan draf laporan keuangan yang tepat waktu', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'h', uraianKlausul: 'Acuan bentuk/isi LAI dan pernyataan kemungkinan modifikasi bentuk/isi opini', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'i', uraianKlausul: 'Klausul kerahasiaan data kecuali diwajibkan oleh hukum, regulator, atau asosiasi profesi', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'j', uraianKlausul: 'Penegasan auditor TIDAK menjanjikan opini Wajar Tanpa Pengecualian (WTP)', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A130', kodeKlausul: 'k', uraianKlausul: 'Perhatian khusus terhadap peraturan perundang-undangan sektoral yang berlaku bagi klien', isCompliant: true, catatan: '' },

    // A140: 5 klausul wajib Surat Tugas (SA 220 / SPM 1)
    { kodeIndeks: 'A140', kodeKlausul: 'a', uraianKlausul: 'Tujuan surat tugas telah sesuai dengan identitas entitas klien', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A140', kodeKlausul: 'b', uraianKlausul: 'Penanggalan surat tugas konsisten dengan tanggal perikatan audit', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A140', kodeKlausul: 'c', uraianKlausul: 'Penomoran surat tugas sesuai tertib administrasi KAP', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A140', kodeKlausul: 'd', uraianKlausul: 'Daftar nama tim perikatan sesuai personel KAP yang ditetapkan pada A1103B', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A140', kodeKlausul: 'e', uraianKlausul: 'Periode pelaksanaan penugasan sesuai rencana anggaran waktu (A120)', isCompliant: true, catatan: '' },

    // A150: 4 klausul wajib Form Independensi
    { kodeIndeks: 'A150', kodeKlausul: 'a', uraianKlausul: 'Nama klien pada form pernyataan independensi sesuai dengan perikatan', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A150', kodeKlausul: 'b', uraianKlausul: 'Nama seluruh personel pada form independensi sesuai dengan Surat Tugas (A140)', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A150', kodeKlausul: 'c', uraianKlausul: 'Seluruh tim perikatan telah menandatangani pernyataan independensi', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A150', kodeKlausul: 'd', uraianKlausul: 'Form independensi bertanggal sebelum atau pada saat perikatan dimulai', isCompliant: true, catatan: '' },

    // A160: 8 klausul Komunikasi Tim Perikatan (SA 240 / SA 300)
    { kodeIndeks: 'A160', kodeKlausul: 'a.1', uraianKlausul: 'Tim perikatan memahami ruang lingkup pekerjaan audit yang akan dilaksanakan', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A160', kodeKlausul: 'a.2', uraianKlausul: 'Tim perikatan memahami periode pelaksanaan audit dan tenggat pelaporan', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A160', kodeKlausul: 'a.3', uraianKlausul: 'Tim perikatan memiliki keahlian dan keterampilan teknis yang memadai', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A160', kodeKlausul: 'a.4', uraianKlausul: 'Tim perikatan memahami hal-hal khusus industri klien dan kerentanan kecurangan (SA 240)', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A160', kodeKlausul: 'b.1', uraianKlausul: 'Dokumentasi permasalahan signifikan yang diajukan selama konsultasi tim', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A160', kodeKlausul: 'b.2', uraianKlausul: 'Ketersediaan data pendukung konsultasi internal tim', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A160', kodeKlausul: 'b.3', uraianKlausul: 'Tindak lanjut saran, keputusan teknis, dan simpulan konsultasi', isCompliant: true, catatan: '' },
    { kodeIndeks: 'A160', kodeKlausul: 'b.4', uraianKlausul: 'Persetujuan/paraf anggota tim atas hasil diskusi awal perikatan', isCompliant: true, catatan: '' },
  ];
}
