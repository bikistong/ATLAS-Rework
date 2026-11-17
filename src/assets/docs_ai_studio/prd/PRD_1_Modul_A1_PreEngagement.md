# PRD 1 — Modul A1: Pre-Engagement Specification (Browser-Native)

**Kode Dokumen:** `PRD_1_Modul_A1_PreEngagement`  
**Cakupan Sheet ATLAS v2.1 (22 Sheet):** `A110`, `A1101`, `A1102`, `A1102.1`, `A1102.1A`, `A1102.1B`, `A1102.1C`, `A1102.D`, `A1103A`, `A1103B`, `A1105`, `DAYHOUR`, `PERFORM`, `JAM KERJA ORANG`, `A120`, `JamKerja`, `A130`, `A140`, `A150`, `A160`, `ASM (2)`, `A170`.  
**Blueprint Referensi:** `docs_ai_studio/blueprint/part1_a1_pre_engagement.json`  
**Prinsip Arsitektur:** *Zero-Reduction*, State-Machine Reaktif TypeScript, Generator Legal `.docx` via library `docx` + `file-saver`.

---

## 1. Alur Kerja & Aturan Visibilitas Kondisional Modul A1

1. **Urutan Wajib Kompetensi -> Independensi:** Auditor mengisi `A1103A` (kompetensi & batasan waktu seluruh calon personel, maks 15 orang) **terlebih dahulu**, baru kemudian `A1103B` (ancaman independensi, struktur manajemen klien, & finalisasi penunjukan tim yang otomatis menyinkronkan `teamMembers` ke `A120`, `A140`, dan `A150`).
2. **Aturan Visibilitas `A1105` & `A170`:**
   - `A1105` aktif hanya jika `tipePerikatan === 'Perikatan Tahun Pertama'` DAN `a110.kriteriaIsuTerdahulu === 'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia dan telah diaudit auditor independen lain atau auditor yang bersangkutan'`.
   - `A170` aktif hanya jika `tipePerikatan === 'Perikatan Tahun Pertama'` DAN `a110.kriteriaIsuTerdahulu !== 'Entitas berdiri pada periode berjalan dan laporan keuangan tersedia pada periode berjalan'`.

---

## 2. Spesifikasi Field, Dropdown Baku & Rumus Otomatis

### 2.1 Indeks `A110` — Evaluasi Penerimaan & Keberlanjutan Hubungan Klien
#### A. 7 Kriteria Risiko Otomatis (`Low` / `High`)
| No | Kriteria | Sumber Data | Rumus Deterministik TypeScript |
| :---: | :--- | :--- | :--- |
| 1 | **Jenis Usaha Klien** | `client.sektorIndustri` | `['Sektor_Keuangan_Perbankan', 'Sektor_Keuangan_Asuransi_dan_Dana_Pensiun', 'Sektor_Keuangan_Lainnya'].includes(sektor) ? 'High' : 'Low'` |
| 2 | **Status Kepemilikan** | `client.statusKepemilikan` | `['Swasta - Go Publik', 'BUMN/BUMD'].includes(status) ? 'High' : 'Low'` |
| 3 | **Standar Akuntansi** | `client.sakDigunakan` | `sak === 'SAK Umum konvergensi IFRS' ? 'High' : 'Low'` |
| 4 | **Isu Pelaporan Terdahulu** | `a1101` | Minimal 1 jawaban `'Ya'` pada 6 butir `A1101` $\rightarrow$ `'High'`; selainnya `'Low'` |
| 5 | **Integritas Manajemen** | `a1102` & `a1102_1` | Minimal 1 jawaban `'Ya'` pada `A1102` atau risiko tinggi APU-PPT $\rightarrow$ `'High'`; selainnya `'Low'` |
| 6 | **Kompetensi, Waktu & Independensi** | `a1103` | Semua tim terpilih kompeten (`'Memadai'`), tidak ada batasan waktu kritis, dan bebas ancaman $\rightarrow$ `'Low'`; selainnya `'High'` |
| 7 | **Komunikasi Auditor Pendahulu** | `a1105` *(Kondisional)* | Jika aktif: `q3aKeberatanProfesional === 'Ya' || q3bSengketaFee === 'Ya'` $\rightarrow$ `'High'`, else `'Low'`. Jika non-aktif $\rightarrow$ `'N/A'` |

#### B. Input Keputusan `A110`
- **`kriteriaIsuTerdahulu` (`A110.I25`) — 4 Opsi Baku:**
  1. `Entitas berdiri pada periode berjalan dan laporan keuangan tersedia pada periode berjalan`
  2. `Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tidak tersedia`
  3. `Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia namun belum pernah diaudit`
  4. `Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia dan telah diaudit auditor independen lain atau auditor yang bersangkutan`
- **`ringkasanRisikoGabungan`:** `'High'` jika minimal 1 kriteria bernilai `'High'`; `'Low'` jika seluruhnya `'Low'`/`'N/A'`.
- **`keputusanPenerimaan` (`A110.AA33`):** Dropdown `'YA'` \| `'TIDAK'`.
- **`mitigasiRisiko` (`A110.F35`):** Textarea. **Validasi Wajib:** Jika `ringkasanRisikoGabungan === 'High'` dan `keputusanPenerimaan === 'YA'`, tombol *Sign-Off Prepared* dinonaktifkan hingga `mitigasiRisiko.trim().length >= 50`.

### 2.2 Indeks `A1101` — Isu Pelaporan Keuangan Terdahulu (6 Butir)
Opsi respon setiap butir: `'Ya' | 'Tidak' | 'Tidak Berlaku'`.
1. `q1aKelangsunganCatatan`: Isu kelangsungan usaha pada catatan atas LK sebelumnya.
2. `q1bKelangsunganOpini`: Isu kelangsungan usaha pada opini auditor sebelumnya.
3. `q2Restrukturisasi`: Isu restrukturisasi keuangan.
4. `q3RugiBerlanjut`: Isu kerugian yang berlanjut.
5. `q4Restated`: Isu penyajian kembali (*restated*) laporan keuangan.
6. `q5OpiniModifikasi`: Opini auditor periode lalu menyatakan selain WTP.
- **`alasanTetapMenerima`:** Wajib diisi jika ada minimal satu jawaban `'Ya'`.
- **Simpulan Otomatis:** Jika seluruhnya `'Tidak'` / `'Tidak Berlaku'`: *"Tidak ada masalah atau kekurangan material yang signifikan pada pelaporan keuangan sebelumnya"* (`Low`).

### 2.3 Indeks `A1102` (9 Butir) & `A1102.1` (APU-PPT PMK 55/2017 & PMK 155/2017)
- **9 Butir `A1102`** (Opsi: `'Ya' | 'Tidak' | 'Tidak Berlaku'`):
  `q1ReputasiBuruk`, `q2KetidakwajaranOperasi`, `q3AgresivitasAkuntansi`, `q4TekananFee`, `q5PembatasanLingkup`, **`q6IndikasiTppu` (Read-only, otomatis `'Ya'` jika ada risiko tinggi di `A1102.1`)**, `q7ReputasiAfiliasi`, `q8DualAuditor`, `q9AlasanPergantianKap`.
- **`A1102.1` (APU-PPT, Opsi `'Ya' | 'Tidak'`) — 4 Kategori Regulasi:**
  1. **Profil Pengguna Jasa (7 sub-item):** PEP (Pejabat Negara, Eselon I, Direksi/Komisaris BUMN, Wajib LHKPN, Pengurus Parpol), Pihak Terkait PEP (Keluarga derajat 2, Perusahaan dikendalikan PEP, Rekan dekat), Pelayanan Publik, Sektor Jasa Keuangan, DTTOT, Sanction List PBB/FATF, Profesi Berisiko (Advokat/Notaris/PPAT/AP/Konsultan Pajak).
  2. **Yurisdiksi Negara (5 sub-item):** Negara non-kooperatif FATF, Pusat/transit narkoba, WGI World Bank < 50, Tax Haven OECD, IPK Transparency International < 40.
  3. **Sektor Bisnis Berisiko Tinggi (13 Kategori):** KUPVA non-bank, Transfer dana non-bank, Agen perjalanan, Usaha berbasis tunai (minimarket/parkir/SPBU), Investasi emas, Kehutanan, Freight forwarding, Properti/real estat, Kendaraan mewah, Perhiasan/logam mulia, Barang seni/antik, KSP aset $\ge$ Rp1 M, Ekspor/impor SDA.
  4. **Produk/Jasa Finansial Berisiko Tinggi (9 Kategori):** Wire transfer, Bearer negotiable instruments, Cross-border correspondent banking, Electronic banking, Private banking/wealth management, Trust, Kartu kredit/debit, Discretionary fund, Kustodian.
- **Modal Referensi Regulasi (`A1102.1A`, `A1102.1B`, `A1102.1C`, `A1102.D`):** Tidak dibuat sebagai halaman terpisah di sidebar, melainkan **Modal/Drawer Referensi Regulasi PMK 55/155** yang dibuka langsung dari tombol *"Lihat Detail Regulasi"* di halaman `A1102.1`.

### 2.4 Indeks `A1103A` & `A1103B` — Kompetensi, Waktu & Independensi Tim
- **`A1103A`:** Evaluasi maks 15 personel: `pengalamanTahun` (number), 5 aspek kompetensi (`'Memadai' | 'Kurang Memadai'`: entitas, SPAP, regulasi, TI, pelaporan), dan 6 batasan waktu boolean (`isCuti`, `isResign`, `isPhk`, `isAkhirKontrak`, `isPerikatanLain`, `isBatasanLain`).
- **`A1103B`:** 4 ancaman independensi boolean (`ancamanKeuangan`, `ancamanPekerjaan`, `ancamanKeluarga`, `ancamanNonAudit`), master susunan manajemen klien (`Pemegang Saham`, `Komisaris`, `Direksi`, `Manajemen Kunci`), dan penunjukan final (`isSelected`, `peranTim`, `inisial`). Personel yang tidak `Memadai` pada `A1103A` diberi peringatan jika dipilih.

### 2.5 Indeks `A1105` — Komunikasi Auditor Pendahulu *(Kondisional)*
4 pertanyaan (`'Ya' | 'Tidak'`): `q1KomunikasiDilakukan`, `q2BalasanDiterima`, `q3aKeberatanProfesional`, `q3bSengketaFee`. Jika `q3a` atau `q3b === 'Ya'`, risiko = `'High'` dan `penjelasanTindakLanjut` wajib diisi.

### 2.6 Indeks `A120` — Kalkulator Alokasi Jam Jasa (7 Jam/Hari)
- **Parameter Baku (`JamKerja`):** Masuk `09:00`, Istirahat `01:00` (1 jam), Pulang `17:00`, Efektif **`7 jam/hari`**.
- **Formula Eksak:**
  $$\text{Hari Kalender} = (\text{tanggalSelesai} - \text{tanggalMulai}) + 1$$
  $$\text{Hari Efektif} = \text{Hari Kalender} - \text{Hari Weekend (Sabtu/Minggu)} - \text{Hari Libur Nasional}$$
  $$\text{Kapasitas Jam per Orang} = \text{Hari Efektif} \times 7$$
- Matriks alokasi per peran (`Partner`, `Manager`, `Ketua Tim`, `Anggota Tim`) untuk 3 tahapan: *Pra-Perikatan & Penilaian Risiko* (~25–30%), *Respon Risiko* (~55–65%), *Pelaporan* (~10–15%), dikalikan `tarifPerJam` menjadi Total Anggaran Honorarium. Validasi: total rencana jam per orang tidak boleh melebihi `Kapasitas Jam`.

### 2.7 Indeks `A130`–`A160`, `ASM (2)` & `A170`
- **`A130` (Surat Perikatan SA 210):** Ceklis 11 klausul wajib (termasuk penegasan tidak menjanjikan opini WTP) + tombol **Generate Surat Perikatan (`.docx`)** menggunakan library `docx` dengan kop surat dinamis dari `kapProfile` dan honorarium dari `A120`.
- **`A140` (Surat Tugas):** Ceklis 5 butir + tombol **Generate Surat Tugas (`.docx`)** memuat daftar tim dari `A1103B`.
- **`A150` (Pernyataan Independensi):** Ceklis 4 butir + **Matriks Status Deklarasi per Anggota Tim** (`Pending` / `Signed` / `Declined`, metode otentikasi, status kepatuhan). KKP `A150` tidak dapat di-sign off `Prepared`/`Completed` jika masih ada anggota tim berstatus `Pending`.
- **`A160` & `ASM (2)`:** Ceklis 4 materi komunikasi awal tim & ringkasan strategi perikatan.
- **`A170` (Saldo Awal SA 510 — Kondisional):** 7 sub-pertanyaan (`q1`–`q5`, `'Ya' | 'Tidak'`) + Dropdown Simpulan (`'Secara umum Saldo Awal sudah wajar'`, `'Saldo Awal belum sepenuhnya wajar'`, `'Saldo Awal tidak wajar'`). Jika bukan opsi 1, wajib isi `penjelasanKetidakwajaran`.
