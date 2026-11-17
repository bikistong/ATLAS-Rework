# PRD 5 — Modul C: Completing, Disclosure, EQCR & Opini LAI (Browser-Native)

**Kode Dokumen:** `PRD_5_Modul_C_Opini_LAI`  
**Cakupan Sheet ATLAS v2.1 (22 Sheet):** `C100`, `C110`, `C120`, `C120.1`, `C120.2`, `Chart1`, `C210`, `C220`, `C220A`–`C220F`, `C230`, `C300`, `C400`, `OPINI1`–`OPINI5`.  
**Blueprint Referensi:** `docs_ai_studio/blueprint/part5_c_completing_opini.json` *(Catatan: key `"Chart1"` bertipe `chartsheet`)*  
**Prinsip Arsitektur:** *Zero-Reduction*, Conditional CALK Rendering, Rule-Based Opinion Matrix SA 700/705/706, Partner EQCR Gate SA 220, Generator LAI `.docx` via library `docx`.

---

## 1. Indeks `C100` — Agregasi SAD (Summary of Unadjusted Differences - SA 450)

- Mengagregasikan salah saji faktual, proyeksi sampling (dari `L02`–`L47`), dan salah saji pertimbangan yang belum dikoreksi oleh klien.
- **Aturan Ambang Batas SA 450:**
  - $|\text{Item}| < \text{AMPT Final}$ $\rightarrow$ *Clearly Trivial* (diabaikan dari akumulasi SAD).
  - $|\text{Item}| \ge \text{AMPT Final}$ $\rightarrow$ Masuk akumulasi $\sum \text{SAD}$.
  - $\sum \text{SAD} < \text{PM Final}$ $\rightarrow$ **Tidak Material** (mendukung WTP).
  - $\sum \text{SAD} \ge \text{PM Final}$ $\rightarrow$ **Material** (memicu rekomendasi modifikasi opini WDP/TW).

---

## 2. Indeks `C110` — Materialitas Akhir & Peringatan Wajib SA 320.12

- Menarik ulang `saldoAcuanAudited` secara otomatis dari **FS Audited Final** (`B120`) dan membandingkannya dengan `A210` (`OM Awal`, `PM Awal`, `AMPT Awal`).
- **Formula:**
  $$\text{OM Final} = \text{saldoAcuanAudited} \times \frac{\text{marginOmPersen}}{100}, \quad \text{PM Final} = \text{OM Final} \times \frac{\text{marginPmPersen}}{100}, \quad \text{AMPT Final} = \text{PM Final} \times \frac{\text{marginAmptPersen}}{100}$$
- **Peringatan Wajib SA 320.12:** Jika `OM Final < OM Awal` **ATAU** `PM Final < PM Awal`, tampilkan **Banner Peringatan Kritis** (*"Tingkat Materialitas Akhir Mengalami Penurunan — wajib evaluasi ulang Sampling Interval & perluasan prosedur substantif"*).
- **3 Opsi Simpulan Baku:**
  1. `Nilai yang tersaji pada laporan keuangan sudah material`
  2. `Terdapat penurunan materialitas namun prosedur audit yang telah dilaksanakan tetap memadai`
  3. `Terdapat penurunan materialitas dan auditor telah memperluas prosedur audit tambahan`

---

## 3. Indeks `C120`, `C120.1`, `C120.2` & `Chart1` — Analitis Akhir & Recharts

- `C120.1`: Analisis Horizontal & Common-Size menggunakan angka **Audited Final** vs **Prior Audited**. Flag `"Perlu Penjelasan"` jika $|\Delta| \ge \text{PM Final}$ atau $|\Delta\%| > 20\%$.
- `C120.2`: Kalkulator 14 Rasio Keuangan Akhir (Likuiditas, Solvabilitas, Profitabilitas, Aktivitas).
- `Chart1`: Dashboard visual **Recharts** (`ResponsiveContainer`, `BarChart` komparasi Neraca & Laba Rugi, serta `RadarChart` / `BarChart` rasio keuangan).

---

## 4. Indeks `C210`, `C220` (`C220A`–`C220F`) & `C230`

### 4.1 `C210` — Reviu Kepatuhan Draf LAI (68 Butir SA 700/705/706)
6 Bagian: Bentuk Baku LAI, Paragraf Pendahuluan, Tanggung Jawab Manajemen, Tanggung Jawab Auditor, Paragraf Opini, Ketentuan Khusus Modifikasi & Penekanan. Respon: `Ada` | `Tidak Ada` | `NA`.

### 4.2 `C220` — Checklist Pengungkapan CALK Kondisional Multi-SAK
- **Pemetaan Otomatis dari `client.sakDigunakan`:**
  - `'SAK Umum konvergensi IFRS'` $\rightarrow$ **`C220A`**
  - `'SAK ETAP'` $\rightarrow$ **`C220B`**
  - `'SAK EMKM'` $\rightarrow$ **`C220C`**
  - `'SAK SYARIAH'` $\rightarrow$ **`C220D`**
  - `'SAP'` $\rightarrow$ **`C220E`**
  - `'SAK LAINNYA'` $\rightarrow$ **`C220F`**
- Sistem **hanya me-render checklist sesuai SAK klien aktif** (menggunakan virtualisasi/paginasi per topik agar ribuan butir `C220A`/`C220B` tetap ringan di browser). Item diekstrak dari `part5_c_completing_opini.json` dan dilengkapi master catalog.
- Respon tiap butir: `Ada`, `Tidak Ada`, `NA`, + `calkReferenceNote` + `auditorComments`.

### 4.3 `C230` — Audit Final Memorandum (12 Pilar)
Merangkum otomatis 12 pilar dari modul sebelumnya: (1) Fraud, (2) Kepatuhan Hukum, (3) Pihak Berelasi `B220`, (4) Litigasi/Subsequent `B230`, (5) Going Concern `B240`, (6) Pakar `B260`/`B270`, (7) Komitmen & Kontinjensi `B280`, (8) Defisiensi SPI `A250`, (9) Materialitas Akhir `C110`, (10) SAD `C100`, (11) Analitis Akhir `C120`, (12) Rekomendasi Opini `C400`.

---

## 5. Indeks `C300` — Gerbang Pengaman Partner EQCR (SA 220)

- Jika `a120.isEqcrRequired === true` (atau klien PIE / Go Publik), sistem mewajibkan penunjukan `eqcrReviewerId` (Partner independen di luar tim perikatan).
- Memuat checklist SA 220 + tabel temuan & tindak lanjut (`Pending` / `Resolved`).
- **Gerbang Pengaman Mutlak (*Partner Lock Gate*):** Tombol **Generate LAI Final (`.docx`)** dan **Partner Lock** pada `C400` **dikunci (`disabled`)** selama `C300` belum berstatus `Reviewed`/`Locked` oleh EQCR Reviewer dan masih ada temuan berstatus `Pending`.

---

## 6. Indeks `C400` & `OPINI1`–`OPINI5` — Matriks Keputusan 5 Opini & Generator `.docx` LAI

### 6.1 Matriks Keputusan 5 Opini (SA 700 & SA 705)
| `q1EvidenceSufficient` | `q2MaterialMisstatement` | `q3ImpactPervasive` | Template | Opini Audit | Referensi SA |
| :---: | :---: | :---: | :---: | :--- | :--- |
| `true` | `false` | `false` | **`OPINI1`** | **Wajar Tanpa Pengecualian (WTP)** | SA 700 |
| `true` | `true` | `false` | **`OPINI2`** | **Wajar Dengan Pengecualian (WDP — Salah Saji Material)** | SA 705.7(a) |
| `false` | `true` | `false` | **`OPINI3`** | **Wajar Dengan Pengecualian (WDP — Pembatasan Lingkup)** | SA 705.7(b) |
| `true` | `true` | `true` | **`OPINI4`** | **Tidak Wajar (TW)** | SA 705.8 |
| `false` | `true` | `true` | **`OPINI5`** | **Tidak Menyatakan Pendapat (TMP / Disclaimer)** | SA 705.9 |
| `false` | `false` | `false` | **`OPINI1`** | **Wajar Tanpa Pengecualian (WTP)** | SA 700 |

- **Override Justification:** Jika `selectedOpinion !== suggestedOpinion`, wajib isi `overrideJustification`.
- **Paragraf Tambahan SA 706 & SA 570:** *Emphasis of Matter*, *Other Matter*, dan *Ketidakpastian Material Terkait Kelangsungan Usaha* (otomatis terhubung ke `B240`).

### 6.2 Penomoran Resmi LAI (PPPK Kemenkeu / IAPI)
$$\text{Nomor LAI} = \text{NoUrut} \ / \ \text{KodeSAK} \ / \ \text{KodeCabang} \ / \ \text{BulanRomawi} \ / \ \text{Tahun}$$
- **Kode SAK Resmi:** `SAK Umum konvergensi IFRS` = `AU-01`, `SAK ETAP` = `AU-02`, `SAK EMKM` = `AU-03`, `SAK SYARIAH` = `AU-04`, `SAP` = `AU-05`, `SAK LAINNYA` = `AU-06`.
- Contoh: `00010 / AU-02 / 05 / II / 2023`.

### 6.3 Generator Word `.docx` Laporan Auditor Independen (`docx` + `file-saver`)
Menghasilkan file `LAI_{namaKlien}_{tahunBuku}.docx` berformat A4 (margin atas/bawah/kanan 2.5 cm, kiri 3.0 cm, font Times New Roman/Arial 11pt, justified) dengan seluruh identitas KAP dan AP penandatangan ditarik **100% dinamis dari `state.kapProfile` dan `state.users`** (tanpa hardcode!).
