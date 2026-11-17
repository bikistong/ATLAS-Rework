# PRD 3 — Modul B Core: WSTB, AJE/RJE, FS & Prosedur Khusus (Browser-Native)

**Kode Dokumen:** `PRD_3_Modul_B_WSTB_FS`  
**Cakupan Sheet ATLAS v2.1 (24 Sheet):** `INPUTDATALK`, `B100`, `WSTB-FINAL`, `AJE-RJE`, `Data1`, `HEADERAKUNDOBEL`, `DataLK (Kosong)`, `HEADERAKUN`, `FS`, `FS_Query`, `COABARU`, `LK(kosong)`, `FS(2)`, `prosedur horizontal`, `RekapMapAKun`, `B120`, `B210`, `B220`, `B230`, `B240`, `B250`, `B260`, `B270`, `B280`.  
**Blueprint Referensi:** `docs_ai_studio/blueprint/part3_b_core_wstb_fs.json`  
**Prinsip Arsitektur:** *Zero-Reduction*, Parser SheetJS (`xlsx`), Mesin Jurnal Double-Entry (`Debit === Kredit`), Real-time WSTB 12 Kolom, Generator 4 Laporan Keuangan + Ekspor `.docx`/`.xlsx`.

---

## 1. Import & Validasi Trial Balance (`INPUTDATALK`, `HEADERAKUN`, `COABARU`)

### 1.1 Format Import Excel / CSV via SheetJS (`xlsx`)
Auditor mengunggah file `.xlsx` atau `.csv` melalui drop-zone di browser (diparsing oleh `XLSX.read(...)` tanpa server):
- 4 Kolom Wajib: `kodeAkun`, `namaAkun`, `saldoBerjalan` (atau pair `unauditedDebit` / `unauditedCredit`), `saldoPembanding`.
- **2 Validasi Mutlak Pra-Impor:**
  1. **Deteksi Duplikat Akun (`HEADERAKUNDOBEL`):** Tolak impor jika terdapat `kodeAkun` yang muncul lebih dari 1 kali dan tampilkan daftar kode duplikat.
  2. **Cek Keseimbangan Awal TB:** $\sum \text{Unaudited Debit} - \sum \text{Unaudited Kredit} === 0$ (toleransi pembulatan `0.00`). Jika selisih $\ne 0$, tampilkan modal rekonsiliasi selisih sebelum data diizinkan masuk ke store.

### 1.2 Pemetaan 3 Tingkat & Keseragaman `leadCode` (Aturan Anti-Bug #1)
Setiap akun COA dipetakan ke:
1. **Group Akun (`FsAccountGroup`):** `ASET`, `LIABILITAS`, `EKUITAS_ASET_BERSIH`, `PENDAPATAN`, `BEBAN`.
2. **Kelompok Akun:** Aset Lancar, Aset Tidak Lancar, Liabilitas Jangka Pendek, Liabilitas Jangka Panjang, Ekuitas, Pendapatan Operasional, Beban Pokok Pendapatan, Beban Operasional, Pendapatan/Beban Non-Operasional, Beban Pajak Penghasilan.
3. **Header Akun & `leadCode` Seragam (`L02`–`L47`):** Memastikan `L02` (Kas), `L05` (Piutang), `L06` (Persediaan), `L09` (Uang Muka/Biaya Dibayar Dimuka), `L13` (Aset Tetap), `L14` (Akum. Penyusutan), `L17` (Utang Usaha), `L20` (Utang Bank Jk. Pendek), `L26` (Utang Pajak/Akrual), `L28` (Utang Bank Jk. Panjang), `L32` (Modal), `L34` (Saldo Laba), `L37` (Penjualan), `L39` (HPP), `L41` (Beban Operasional), `L46` (Beban Bunga) terpetakan presisi.
- Penandaan akun penutup laba tahun berjalan (`isClosingReAccount`) dan OCI (`isOciAccount`).

---

## 2. Mesin Jurnal Double-Entry (`AJE-RJE`)

- **Jenis Jurnal:** `AJE` (Audit Adjusting Journal Entry — mempengaruhi Neraca & Laba Rugi) dan `RJE` (Reclassification Journal Entry — reklasifikasi penyajian).
- **Status Persetujuan:** `Proposed` (PAJE/PRJE), `Accepted` (CAJE/CRJE — **hanya jurnal `Accepted` yang masuk ke saldo Audited WSTB & FS**), `Rejected`.
- **Validasi Mutlak Double-Entry:**
  - Minimal 2 baris (minimal 1 Debit dan 1 Kredit), setiap nilai baris $> 0$.
  - $\sum \text{Debit} === \sum \text{Kredit}$ (selisih absolut $< 0.01$). Jika tidak balance, tombol **Simpan Jurnal** `disabled` dengan alert merah.
  - Penjelasan audit wajib minimal 20 karakter + referensi indeks KKP (`referensiKkp`).
  - Penomoran otomatis: `AJE-001`, `AJE-002`, `RJE-001`, dst.

---

## 3. Working Trial Balance 12 Kolom (`B100` / `WSTB-FINAL`)

Kolom wajib: `kodeAkun`, `namaAkun`, `headerAkun`, `unauditedDebit`, `unauditedCredit`, `ajeDebit`, `ajeCredit`, `rjeDebit`, `rjeCredit`, `auditedDebit`, `auditedCredit`, `priorAudited`.

**Formula Saldo Audited:**
- **Saldo Normal Debit (`ASET`, `BEBAN`):**
  $$\text{Net} = (\text{Unaudited Dr} - \text{Unaudited Cr}) + (\text{AJE Dr} - \text{AJE Cr}) + (\text{RJE Dr} - \text{RJE Cr})$$
  Jika $\text{Net} \ge 0 \rightarrow \text{auditedDebit} = \text{Net}$; jika $< 0 \rightarrow \text{auditedCredit} = |\text{Net}|$.
- **Saldo Normal Kredit (`LIABILITAS`, `EKUITAS_ASET_BERSIH`, `PENDAPATAN`):**
  $$\text{Net} = (\text{Unaudited Cr} - \text{Unaudited Dr}) + (\text{AJE Cr} - \text{AJE Dr}) + (\text{RJE Cr} - \text{RJE Dr})$$
  Jika $\text{Net} \ge 0 \rightarrow \text{auditedCredit} = \text{Net}$; jika $< 0 \rightarrow \text{auditedDebit} = |\text{Net}|$.

---

## 4. Generator 4 Laporan Keuangan (`B120` / `FS`) & Ekspor `.docx`/`.xlsx`

Sistem menyusun 4 tab laporan keuangan komparatif (`Audited` Tahun Berjalan vs `Prior Audited`):
1. **Laporan Posisi Keuangan (Neraca):**
   - $\text{Total Aset} = \text{Aset Lancar} + \text{Aset Tidak Lancar}$
   - $\text{Total Liabilitas \& Ekuitas} = \text{Liabilitas Jk. Pendek} + \text{Liabilitas Jk. Panjang} + \text{Total Ekuitas}$ (termasuk laba tahun berjalan otomatis).
   - **Validasi Wajib `NERACA BALANCED`:** Badge hijau `NERACA BALANCED` jika $|\text{Total Aset} - (\text{Total Liabilitas} + \text{Total Ekuitas})| === 0$. Jika tidak seimbang, tampilkan selisih merah dan **blokir Sign-Off `Reviewed`** pada `B100` & `B120`.
2. **Laporan Laba Rugi & Penghasilan Komprehensif Lain:** Laba Bruto, Laba Usaha, Laba Sebelum Pajak, Laba Bersih Tahun Berjalan, OCI.
3. **Laporan Perubahan Ekuitas:** Modal Saham, Saldo Laba Awal $\pm$ Laba Bersih $-$ Dividen $\pm$ OCI $=$ Saldo Laba Akhir.
4. **Laporan Arus Kas (Metode Tidak Langsung):** Aktivitas Operasi, Investasi, Pendanaan, Rekonsiliasi Kas Akhir.
- **Ekspor:** Tombol **Export WSTB (`.xlsx`)** via SheetJS dan **Export LK Audited (`.docx`)** via `docx` + `file-saver`.

---

## 5. Delapan (8) Prosedur Audit Khusus (`B210`–`B280`)

Setiap KKP prosedur khusus memiliki tombol *"Propose AJE from Finding"* untuk membuat draf jurnal `AJE` langsung dari temuan prosedur:

| Indeks | Judul & Standar Audit | Field & Validasi Wajib | Opsi Dropdown Simpulan Baku |
| :---: | :--- | :--- | :--- |
| **`B210`** | Estimasi Akuntansi (SA 540) | 7 butir ceklis evaluasi, `posEstimasi`, `metodeEvaluasi`, `isAssumptionsRealistic`, `isManagementBiasDetected` | `Penggunaan Estimasi Akuntansi telah memadai` \| `...belum sepenuhnya memadai` |
| **`B220`** | Pihak Berelasi (SA 550) | Register pihak berelasi (`nama`, `sifatHubungan`, `jenisTransaksi`, `nilaiTransaksi`, `saldoAkhir`, `isArmLength`, `isDisclosedInCalk`) + 6 bidang pengujian | `Bukti audit cukup dan tepat serta penilaian transaksi pihak berelasi telah memadai` \| `Bukti audit tidak cukup dan tepat...` |
| **`B230`** | Peristiwa Kemudian (SA 560) | `tanggalPencarian`, klasifikasi `Type 1 - Adjusting` (picu AJE) \| `Type 2 - Disclosure Only` (CALK) \| `None` | `Bukti audit cukup dan tepat serta Evaluasi Peristiwa Kemudian memadai` \| `Bukti audit tidak cukup dan tepat...` |
| **`B240`** | Kelangsungan Usaha (SA 570) | `indikatorKeuanganBuruk`, `indikatorOperasionalBuruk`, `evaluasiRencanaManajemen` (min 12 bln). **Validasi:** jika ada keraguan signifikan, wajib isi rencana mitigasi. | `Tidak terdapat keraguan signifikan...` \| `Terdapat keraguan signifikan... namun telah diungkapkan memadai` \| `Terdapat keraguan signifikan... dan belum diungkapkan memadai` |
| **`B250`** | Representasi Manajemen (SA 580) | `tanggalSuratRepresentasi`, `namaPenandatanganCeo`, `namaPenandatanganCfo`. **Validasi Wajib SA 580:** `tanggalSuratRepresentasi === header.tanggalLaporanAuditor`. Jika berbeda, tampilkan alert merah dan blokir Sign-Off `Prepared`/`Completed`! | `Representasi manajemen memadai` \| `Representasi manajemen tidak memadai` |
| **`B260`** | Pakar Auditor (SA 620) | `isUsed` (`YA`/`TIDAK`), nama, bidang keahlian, kualifikasi, objektivitas, evaluasi hasil | `MEMADAI` \| `TIDAK MEMADAI` \| `TIDAK RELEVAN` |
| **`B270`** | Pakar Manajemen (SA 500) | `isUsed` (`YA`/`TIDAK`), nama, bidang keahlian, kualifikasi, asumsi/metode | `MEMADAI` \| `TIDAK MEMADAI` \| `TIDAK RELEVAN` |
| **`B280`** | Komitmen & Kontinjensi (SA 501) | `hasLawyerConfirmation`, `hasTaxContingency`, `hasGuaranteeCommitments`, `hasDerivativeContracts` | `Bukti audit cukup dan tepat serta Penilaian komitmen dan kontijensi memadai` \| `Bukti audit tidak cukup dan tepat...` |
