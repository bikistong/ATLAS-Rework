# PRD 4 — Modul B: Dynamic Lead Schedules & ISA Sampling Engine (Browser-Native)

**Kode Dokumen:** `PRD_4_Modul_B_Leads_ISA`  
**Cakupan Sheet ATLAS v2.1 (92 Sheet):** `pengujian sampel`, `MdanYa`, serta 45 pasang Lead Schedule (`2`/`2.1`, `3`/`3.1`, `5`/`5.1` s.d. `47`/`47.1`).  
**Blueprint Referensi:** `docs_ai_studio/blueprint/part4_b_lead_schedules.json` (+ `prosedur horizontal` di `part3_b_core_wstb_fs.json`).  
**Prinsip Arsitektur:** *Zero-Reduction*, Dynamic Lead Schedule Engine (`L02`–`L47`), Keseragaman `leadCode`, Kalkulator Sampling ISA SA 530, Ekspor `.xlsx` 3-Tab via SheetJS.

---

## 1. Paradigma Dynamic Lead Schedule Engine (`L02`–`L47`)

Menggantikan 90 sheet statis Excel (`2`–`47.1`) dan sheet routing rapuh `MdanYa` dengan **satu mesin komponen dinamis** yang me-render ruang kerja per `leadCode` (`L02` s.d. `L47`).

### 1.1 Katalog 45 Pos Lead Schedule Baku ATLAS v2.1 (Aturan Anti-Bug #1)
| Sheet | `leadCode` | Nama Pos Lead Schedule | Kategori | Normal |
| :---: | :---: | :--- | :--- | :---: |
| `2` | **`L02`** | Kas & Bank | Aset Lancar | `DR` |
| `3` | `L03` | Deposito | Aset Lancar | `DR` |
| `5` | **`L05`** | Piutang Dagang | Aset Lancar | `DR` |
| `6` | **`L06`** | Persediaan Barang Dagang | Aset Lancar | `DR` |
| `7` | `L07` | Obligasi / Investasi Surat Berharga Lancar | Aset Lancar | `DR` |
| `8` | `L08` | Pajak Dibayar Dimuka | Aset Lancar | `DR` |
| `9` | **`L09`** | Biaya Dibayar Dimuka / Uang Muka | Aset Lancar | `DR` |
| `10` | `L10` | Uang Muka Pembelian | Aset Lancar | `DR` |
| `11` | `L11` | Aset Lancar Lainnya | Aset Lancar | `DR` |
| `12` | `L12` | Investasi Jangka Panjang | Aset Tidak Lancar | `DR` |
| `13` | **`L13`** | Aktiva Tetap | Aset Tidak Lancar | `DR` |
| `14` | **`L14`** | Akumulasi Penyusutan Aktiva Tetap | Aset Tidak Lancar (Kontra) | `CR` |
| `15` | `L15` | Aktiva Tidak Berwujud | Aset Tidak Lancar | `DR` |
| `16` | `L16` | Aktiva Lain-Lain | Aset Tidak Lancar | `DR` |
| `17` | **`L17`** | Hutang Dagang / Usaha | Liabilitas Jangka Pendek | `CR` |
| `18` | `L18` | Uang Muka Pelanggan | Liabilitas Jangka Pendek | `CR` |
| `19` | `L19` | Hutang Pihak Ketiga | Liabilitas Jangka Pendek | `CR` |
| `20` | **`L20`** | Hutang Bank Jangka Pendek | Liabilitas Jangka Pendek | `CR` |
| `21` | `L21` | Hutang Kartu Kredit | Liabilitas Jangka Pendek | `CR` |
| `22` | `L22` | Hutang Pajak - PPN | Liabilitas Jangka Pendek | `CR` |
| `23` | `L23` | Hutang Pajak - PPh 21 | Liabilitas Jangka Pendek | `CR` |
| `24` | `L24` | Hutang Pajak - PPh 23 | Liabilitas Jangka Pendek | `CR` |
| `25` | `L25` | Hutang Pajak - PPh 25/29 | Liabilitas Jangka Pendek | `CR` |
| `26` | **`L26`** | Biaya Yang Masih Harus Dibayar / Utang Pajak & Akrual | Liabilitas Jangka Pendek | `CR` |
| `27` | `L27` | Hutang Lain-Lain Lancar | Liabilitas Jangka Pendek | `CR` |
| `28` | **`L28`** | Hutang Jangka Panjang - Bank | Liabilitas Jangka Panjang | `CR` |
| `29` | `L29` | Hutang Sewa Pembiayaan (Leasing) | Liabilitas Jangka Panjang | `CR` |
| `30` | `L30` | Hutang Obligasi | Liabilitas Jangka Panjang | `CR` |
| `31` | `L31` | Liabilitas Imbalan Pasca Kerja | Liabilitas Jangka Panjang | `CR` |
| `32` | **`L32`** | Modal Saham | Ekuitas | `CR` |
| `33` | `L33` | Tambahan Modal Disetor (Agio Saham) | Ekuitas | `CR` |
| `34` | **`L34`** | Laba Ditahan / Saldo Laba | Ekuitas | `CR` |
| `35` | `L35` | Laba Tahun Berjalan | Ekuitas | `CR` |
| `36` | `L36` | Cadangan & Ekuitas Lainnya | Ekuitas | `CR` |
| `37` | **`L37`** | Pendapatan Usaha / Penjualan | Pendapatan | `CR` |
| `38` | `L38` | Retur & Potongan Penjualan | Pendapatan (Kontra) | `DR` |
| `39` | **`L39`** | Beban Pokok Penjualan (HPP) | Beban Pokok | `DR` |
| `40` | `L40` | Beban Penjualan & Pemasaran | Beban Operasional | `DR` |
| `41` | **`L41`** | Beban Umum & Administrasi - Gaji & Operasional | Beban Operasional | `DR` |
| `42` | `L42` | Beban Umum & Administrasi - Sewa | Beban Operasional | `DR` |
| `43` | `L43` | Beban Umum & Administrasi - Penyusutan | Beban Operasional | `DR` |
| `44` | `L44` | Beban Umum & Administrasi - Kantor & Lainnya | Beban Operasional | `DR` |
| `45` | `L45` | Pendapatan Lain-Lain / Bunga / Selisih Kurs | Pendapatan Non-Operasional | `CR` |
| `46` | **`L46`** | Beban Bunga & Administrasi Bank | Beban Non-Operasional | `DR` |
| `47` | `L47` | Beban Lain-Lain & Pajak Penghasilan Badan | Beban Non-Operasional / Pajak | `DR` |

*(Pengguna juga dapat menambahkan Custom Lead Schedule baru secara dinamis jika diperlukan).*

---

## 2. Penarikan Mutasi WSTB & RoMM Real-Time (Tab 1 & Tab 2)

1. **Tab 1 — Akun & Mutasi (Drill-Down WSTB):**
   - Menarik otomatis seluruh baris `TrialBalanceAccount` yang memiliki `account.leadCode === currentLeadCode`.
   - Menghitung mutasi `AJE` & `RJE` (`statusPersetujuan === 'Accepted'`) dan menampilkan `Unaudited`, `AJE Dr/Cr`, `RJE Dr/Cr`, `Audited`, dan `Prior Audited` dengan tipografi `font-mono tabular-nums text-right`.
   - **Konteks Risiko Real-Time:** Menarik `rommLevel` langsung dari `A270` (`a270Rows`) berdasarkan `leadCode` dan `materialityAmount` (`OM`/`PM`) dari `A210`.
2. **Tab 2 — Program Prosedur Substantif (`SAP` & `TOD`):**
   - Di-seed dari `part4_b_lead_schedules.json` (companion sheet `2.1` s.d. `47.1`) & `prosedur horizontal` (`part3`).
   - Kolom tabel: `No.`, `Tipe` (`Analitis Substantif` / `Substantif Rinci`), `Uraian Prosedur`, `Asersi` (`C, E, A&C, V, P&D`), `Status` (`Belum Dilaksanakan` | `Dilaksanakan` | `Tidak Dilaksanakan` | `Tidak Aplikabel`), `PIC`, `Ref KKP`, `Simpulan`.
   - Tombol `+ Tambah Prosedur Khusus`.
3. **Simpulan Audit Pos Akun (4 Opsi Baku ATLAS):**
   1. `Akun tersebut telah disajikan secara wajar`
   2. `Akun tersebut disajikan secara wajar dengan pengecualian jurnal yang belum disesuaikan`
   3. `Akun tersebut tidak disajikan secara wajar`
   4. `Tidak dapat memberikan kesimpulan karena pembatasan lingkup pemeriksaan`

---

## 3. Mesin Kalkulator Sampling Audit ISA SA 530 (`pengujian sampel`)

### 3.1 Matriks 9 Kombinasi Confidence Factor (CF)
| `RoMM` (dari `A270`) | `SAP Assurance` | Rentang CF | Nilai Default Sistem |
| :---: | :---: | :---: | :---: |
| **`High`** | `High` | `1.9 – 2.3` | **`2.1`** |
| **`High`** | `Moderate` | `2.3 – 3.0` | **`2.6`** |
| **`High`** | `No` | `3.0` (Fixed) | **`3.0`** |
| **`Moderate`** | `High` | `1.6 – 1.9` | **`1.8`** |
| **`Moderate`** | `Moderate` | `1.9 – 2.3` | **`2.1`** |
| **`Moderate`** | `No` | `2.3 – 3.0` | **`2.6`** |
| **`Low`** | `High` | `0.5 – 1.21` | **`0.9`** |
| **`Low`** | `Moderate` | `1.21 – 1.4` | **`1.3`** |
| **`Low`** | `No` | `1.4 – 2.3` | **`1.8`** |

### 3.2 Formula Eksak Ukuran Sampel
$$\text{Sampling Interval} = \frac{\text{Performance Materiality (PM)}}{\text{Confidence Factor (CF)}}$$
$$\text{Tested Population} = \text{Total Population Book Value} - \text{Specific Items (100\% Examined)}$$
$$\text{Sample Size } (n) = \left\lceil \frac{\text{Tested Population}}{\text{Sampling Interval}} \right\rceil \quad (\text{Math.ceil})$$

### 3.3 Pengujian Sampel & Proyeksi Salah Saji
Setiap item sampel (`AuditSampleItem`) mencatat `bookValue` (BVS), `auditedValue` (AVS), dan menghitung `factualMisstatement = BVS - AVS`.
1. **Metode Rasio (*Ratio Method*):**
   $$\text{Estimated Population Value (EVP)} = \text{Total Population Book Value} \times \frac{\sum \text{AVS}}{\sum \text{BVS}}$$
   $$\text{Projected Misstatement} = \text{Total Population Book Value} - \text{EVP}$$
2. **Metode Selisih (*Difference Method*):**
   $$\text{Average Error} = \frac{\sum (\text{BVS} - \text{AVS})}{n_{\text{tested}}}$$
   $$\text{Projected Misstatement} = \text{Average Error} \times N_{\text{population items}}$$
- **Evaluasi Otomatis:** Jika $|\text{Projected Misstatement}| \ge \text{PM}$, tandai `isMisstatementMaterial = true` dengan alert merah dan tombol *"Kirim ke SAD (C100)"* atau *"Buat Usulan AJE"*.

---

## 4. Ekspor `.xlsx` 3 Tab via SheetJS (`xlsx`)

Tombol **"Export Lead Schedule (.xlsx)"** menghasilkan workbook Excel 3 sheet menggunakan `XLSX.utils.book_new()`:
1. **Tab 1 (`Lead_Schedule_{leadCode}`):** Header KAP dinamis dari `kapProfile`, identitas klien, metadata sign-off, ringkasan `RoMM` & `PM`, tabel akun mutasi `Unaudited -> AJE -> RJE -> Audited`, dan simpulan.
2. **Tab 2 (`Prosedur_Substantif`):** Seluruh daftar prosedur `SAP` & `TOD`, status, PIC, referensi KKP, dan simpulan.
3. **Tab 3 (`Sampling_ISA_SA530`):** Parameter kalkulasi CF, interval, ukuran sampel, tabel vouching `BVS` vs `AVS`, dan hasil proyeksi Rasio/Difference.
