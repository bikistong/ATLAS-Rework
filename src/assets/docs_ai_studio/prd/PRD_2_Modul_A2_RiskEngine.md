# PRD 2 — Modul A2: Risk Assessment Engine (Browser-Native)

**Kode Dokumen:** `PRD_2_Modul_A2_RiskEngine`  
**Cakupan Sheet ATLAS v2.1 (55 Sheet):** `A210`, `pertimbangan OM`, `PREANALITICAL`, `A220.1`, `A220.2`, `A230`–`A230.8`, `AKUNNTERDAMPAK`, `A240`, `DATASIGN`, `DataTim`, `DataALK&PB`, `CR`, `GAb`, `A250.1`–`A.250.13.1`, `DATACR`, `DATAROMM`, `A260`, `A270`, `A2701`, `A2702` (dan `A280` ASM Update).  
**Blueprint Referensi:** `docs_ai_studio/blueprint/part2_a2_risk_assessment.json`  
**Prinsip Arsitektur:** *Zero-Reduction*, Kalkulator Materialitas SA 320 Dinamis dari FS, Mesin Matriks Deterministik $IR \times CR = RoMM$, Prioritas Numerik `High(3) > Moderate(2) > Low(1)`.

---

## 1. Indeks `A210` & `pertimbangan OM` — Kalkulator Materialitas Awal (SA 320)

### 1.1 8 Pilihan Acuan Benchmark Saldo (`A210.J29`)
1. `Total Aset`
2. `Aset bersih`
3. `Jumlah Pendapatan`
4. `Jumlah HPP`
5. `Laba sebelum pajak`
6. `Laba sebelum bunga, pajak, penyusutan, dan amortisasi` (EBITDA)
7. `Total Liabilitas`
8. `Lainnya (seperti acuan dari auditor induk)`

> [!IMPORTANT]
> **Aturan Anti-Bug #3 (Saldo Acuan Dinamis):** `nilaiSaldoAcuan` wajib ditarik otomatis dari hasil agregasi **Laporan Keuangan (FS) / WSTB klien aktif** sesuai benchmark terpilih (misal `Total Aset`, `Jumlah Pendapatan`, `Laba sebelum pajak`). Dilarang menggunakan angka dummy statis!

### 1.2 6 Opsi Karakteristik Entitas (`A210.AF16:AM18`)
1. `Entitas Normal`
2. `Entitas Nirlaba`
3. `Selain Entitas nirlaba, ketika laba/rugi sebelum pajak tidak dipertimbangkan sesuai sebagai pedoman patokan`
4. `Entitas dimana EBITDA dipertimbangkan sesuai sebagai pedoman patokan`
5. `Entitas yang tidak aktif dan/atau pengguna laporan keuangan fokus pada aset`
6. `Entitas (reksadana) dimana aset bersih dipertimbangkan tepat sebagai pedoman patokan yang sesuai`

### 1.3 Formula & Validasi Rentang Wajar SA 320
- **Overall Materiality (OM):**
  $$OM = \text{nilaiSaldoAcuan} \times \frac{\text{marginOmPersen}}{100}$$
  Rentang wajar: Laba Sebelum Pajak `3%–7%` (Normal `5%`), Pendapatan `0.5%–2%` (`1%`), Total Aset `0.5%–2%` (`1%`), Aset Bersih/Ekuitas `1%–5%` (`2%`), EBITDA `2%–5%`.
- **Performance Materiality (PM):**
  $$PM = OM \times \frac{\text{marginPmPersen}}{100}$$
  Rentang wajar: **`50%–80%`** dari OM (`50%` risiko tinggi, `75%` risiko rendah). **Validasi UI:** Jika di luar `50%–80%`, tampilkan peringatan merah dan wajibkan `pertimbanganPm` minimal 100 karakter.
- **Clearly Trivial / AMPT:**
  $$AMPT = PM \times \frac{\text{marginAmptPersen}}{100}$$
  Rentang wajar: **`3%–5%`** dari PM. **Validasi Keras:** `marginAmptPersen` tidak boleh melebihi `5%`.
- **Dokumentasi Pertimbangan Profesional (`pertimbangan OM`):** Mencakup pengguna LK, harapan khusus (covenant/pihak berelasi/regulasi), elemen LK relevan, sifat entitas/industri, struktur kepemilikan/pendanaan, fluktuasi 3–5 tahun, dan keterkaitan dengan risiko Modul A1.

---

## 2. Indeks `A220.1`, `A220.2` & `PREANALITICAL` — Prosedur Analitis Awal (SA 520)

### 2.1 Analisis Horizontal & Vertikal (`A220.1`)
- **Horizontal:**
  $$\text{Perubahan Nominal} = \text{Saldo Berjalan} - \text{Saldo Periode Lalu}$$
  $$\text{Perubahan (\%)} = \frac{\text{Perubahan Nominal}}{\text{Saldo Periode Lalu}} \times 100\% \quad (\text{handle div by 0})$$
  **Flag Fluktuasi Signifikan:** Jika $|\text{Perubahan Nominal}| \ge PM$ **DAN** $|\text{Perubahan (\%)}| \ge 20\%$, tandai baris akun dengan badge merah **"Fluktuasi Signifikan"**.
- **Vertikal (*Common-Size*):** Neraca $\frac{\text{Saldo Akun}}{\text{Total Aset}} \times 100\%$; Laba Rugi $\frac{\text{Saldo Akun}}{\text{Total Pendapatan}} \times 100\%$.

### 2.2 Kalkulator Rasio Keuangan (`A220.2` — 4 Kelompok, 13 Rasio)
1. **Likuiditas:**
   - Current Ratio = $\text{Aset Lancar} / \text{Liabilitas Jk. Pendek}$
   - Quick Ratio = $(\text{Kas} + \text{Setara Kas} + \text{Piutang Usaha}) / \text{Liabilitas Jk. Pendek}$
   - Cash Ratio = $(\text{Kas} + \text{Setara Kas}) / \text{Liabilitas Jk. Pendek}$
2. **Solvabilitas:**
   - DAR = $\text{Total Liabilitas} / \text{Total Aset}$
   - DER = $\text{Total Liabilitas} / \text{Total Ekuitas}$
   - Interest Coverage = $\text{EBIT} / \text{Beban Bunga}$
3. **Profitabilitas:**
   - GPM = $(\text{Laba Bruto} / \text{Pendapatan}) \times 100\%$
   - NPM = $(\text{Laba Bersih} / \text{Pendapatan}) \times 100\%$
   - ROA = $(\text{Laba Bersih} / \text{Total Aset}) \times 100\%$
   - ROE = $(\text{Laba Bersih} / \text{Total Ekuitas}) \times 100\%$
4. **Aktivitas:**
   - TATO = $\text{Pendapatan} / \text{Total Aset}$
   - DSO = $(\text{Piutang Usaha} / \text{Pendapatan}) \times 365$
   - DSI = $(\text{Persediaan} / \text{HPP}) \times 365$
- Visualisasi tren menggunakan **Recharts** (`BarChart` komparasi & `RadarChart` / indikator rasio).

---

## 3. Indeks `A230.1`–`A230.8` — Pemahaman Entitas & Fraud Risk (SA 315 & SA 240)

| Kode | Aspek Evaluasi | Opsi Dropdown Baku |
| :--- | :--- | :--- |
| `A230.1` | Faktor Industri, Regulasi & Eksternal | `Tinggi`, `Sedang`, `Rendah`, `N/A` |
| `A230.2` | Sifat Entitas (operasi, struktur, investasi, pendanaan) | `Tinggi`, `Sedang`, `Rendah`, `N/A` |
| `A230.3` | Kebijakan Akuntansi (+ sub-referensi `A230.3.1`) | `Sesuai`, `Perlu Perhatian`, `Tidak Sesuai` |
| `A230.4` | Tujuan, Strategi & Risiko Bisnis | `Tinggi`, `Sedang`, `Rendah` |
| `A230.5` | Pengukuran Kinerja Keuangan (KPI, bonus, rating) | `Tinggi`, `Sedang`, `Rendah` |
| `A230.6` | SPI Tingkat Entitas (5 Komponen COSO) | `Memadai`, `Kurang Memadai`, `Tidak Memadai` |
| `A230.6A` | Evaluasi IT Controls (GITC: akses, change mgmt, backup, DR) | `Memadai`, `Kurang Memadai`, `Tidak Memadai` |
| `A230.7` | **Faktor Risiko Kecurangan SA 240 (Fraud Triangle):** Insentif/Tekanan, Peluang, Rasionalisasi | `Ya`, `Tidak` *(Jika `'Ya'` $\rightarrow$ Flag `isFraudRisk = true`)* |
| `A230.8` | Pemetaan Akun Terdampak (`leadCode` seragam + arah: `Overstatement`, `Understatement`, `Misclassification`) | Dropdown Header Akun / `leadCode` |

---

## 4. Indeks `A240` — Akun Signifikan & Inherent Risk (5 Asersi)

1. **Penentuan Akun Signifikan (`DATASIGN`):**
   - **Kuantitatif (Otomatis & Terkunci):** Jika `Math.abs(saldoBerjalan) >= PM`, otomatis `isSignificantAccount = true` (tidak dapat di-uncheck manual).
   - **Kualitatif:** Terpapar Fraud Risk (`A230.7`), estimasi subjektif tinggi, riwayat koreksi lalu, atau transaksi pihak berelasi.
2. **Matriks Inherent Risk 5 Asersi (`Low` | `Moderate` | `High`):**
   - `C` (*Completeness*), `E` (*Existence/Occurrence*), `A&C` (*Accuracy & Cut-off*), `V` (*Valuation & Allocation*), `P&D` (*Presentation & Disclosure*).
   - **Validasi Sign-Off:** `A240` tidak bisa di-sign off `Prepared` jika ada Akun Signifikan yang asersinya belum lengkap.

---

## 5. Indeks `A250.1`–`A250.13` — Control Risk & 13 Siklus Pengendalian

13 siklus baku (`A250.1` Entity Level COSO, `A250.2` Penjualan/Piutang, `A250.3` Pembelian/Utang, `A250.4` Kas & Bank, `A250.5` Kas Kecil, `A250.6` Aset Tetap, `A250.7` Payroll, `A250.8` Persediaan/Produksi, `A250.9` Investasi, `A250.10` Pembiayaan/Pinjaman, `A250.11` Custom 1, `A250.12` Custom 2, `A250.13` Akun Signifikan).
- **Item Walk-Through (`A250.X.1`):**
  - `uraianProsedurSop`, `frekuensi` (`Setiap Transaksi`, `Harian`, `Mingguan`, `Bulanan`, `Triwulanan`, `Tahunan`), `wcgwRisiko`, `tipeAktivitas` (`Otorisasi`, `Penelaahan kinerja`, `Pengolahan informasi`, `Pengendalian fisik`, `Pemisahan tugas`, `Tidak ada`), `desainSesuai` (`Sesuai` | `Tidak sesuai`), `hasilToc` (`Efektif` | `Tidak Efektif` | `Tidak Berlaku`), `dampakAsersi` (`C`, `E`, `A&C`, `V`).
- **Rumus Penentuan Control Risk (CR):**
  - Semua item `Sesuai` DAN `Efektif` $\rightarrow$ `CR = 'Low'` (`Pengendalian Internal pada siklus ini memadai`).
  - Semua `Sesuai` namun ada deviasi minor / `Tidak Berlaku` $\rightarrow$ `CR = 'Moderate'` (`...belum sepenuhnya memadai`).
  - Ada item `Tidak sesuai` ATAU `Tidak Efektif` $\rightarrow$ `CR = 'High'` (`...tidak memadai`).

---

## 6. Indeks `A260`, `A270` (`IR × CR = RoMM`) & `A280` (ASM Update `.docx`)

### 6.1 Komunikasi TCWG & SPI (`A260` = `A2701` + `A2702`)
- `A2701` (SA 260): 4 area wajib TCWG; Simpulan (`Komunikasi dengan pihak TCWG sudah memadai` | `...kurang memadai`).
- `A2702` (SA 610): 3 area evaluasi SPI; Simpulan (`Prosedur tahap ini tidak relevan` | `Bukti Audit yang diperoleh telah cukup memadai` | `Bukti Audit belum cukup memadai`).

### 6.2 Matriks Deterministik `IR × CR = RoMM` (`A270`)
| IR | CR | RoMM | Respon Audit |
| :---: | :---: | :---: | :--- |
| `High` | `High` | **`High`** | Substantif rinci ekstensif; sampel ISA maksimal |
| `High` | `Moderate` | **`High`** | Substantif rinci; analitis substantif terbatas |
| `High` | `Low` | **`Moderate`** | TOC diperluas + Substantif terarah |
| `Moderate` | `High` | **`High`** | Substantif rinci tanpa reliance pengendalian |
| `Moderate` | `Moderate` | **`Moderate`** | Kombinasi berimbang TOC & Substantif |
| `Moderate` | `Low` | **`Low`** | TOC memadai; substantif terbatas |
| `Low` | `High` | **`Moderate`** | Pengujian substantif standar |
| `Low` | `Moderate` | **`Low`** | Substantif minimal & analitis |
| `Low` | `Low` | **`Low`** | Prosedur analitis substantif; sampel minimum |

- **Aturan Fraud / Significant Risk:** Jika `isSignificantRisk === true` atau akun terpapar Fraud Risk (`A230.7`), maka `RoMM` **otomatis terkunci menjadi `'High'`**.
- **Aturan Anti-Bug #1 (Prioritas Numerik):** Perhitungan `overallRomm` dari 5 asersi wajib menggunakan `ROMM_PRIORITY = { High: 3, Moderate: 2, Low: 1 }` (mengambil skor maksimum), **dilarang keras sort alfabetis**. Hasil `A270` langsung tersinkronisasi ke `LeadScheduleInstance` melalui `leadCode` yang seragam (`L02`–`L47`).

### 6.3 `A280` — Audit Strategy Memorandum (ASM) Update (`.docx`)
- Mengagregasi ringkasan `A210`–`A270`, menetapkan `pendekatanAuditUtama` (`Substantive Approach` | `Combined Approach`), alokasi tim, dan target Fase B.
- Tombol **"Export ASM Update (.docx)"** menghasilkan dokumen Word resmi via library `docx` + `file-saver` dengan identitas KAP dinamis dari `kapProfile`.
