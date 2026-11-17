# ATLAS-Web (AI Studio Edition) — Panduan Eksekusi & Unggah ke Google AI Studio

Selamat datang di paket spesifikasi **ATLAS-Web (100% Browser-Native Edition)** berbasis **React 18+ TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, `docx`, `xlsx` (SheetJS), dan `localStorage` / IndexedDB + Export/Import `.atlas.json`**.

Paket dokumentasi di dalam folder `docs_ai_studio/` ini dirancang khusus untuk **Google AI Studio (Build Mode)** agar Anda dapat membangun aplikasi Kertas Kerja Pemeriksaan (KKP) Audit berbasis **IAPI ATLAS v2.1** secara bertahap dari Sprint 0 hingga Sprint 5 tanpa backend server (tanpa Python, FastAPI, SQLite, HTMX, atau Jinja2), sambil mempertahankan **100% detail field, opsi dropdown baku, aturan visibilitas kondisional KKP, rumus audit IAPI/SPAP/ISA, dan 4 aturan anti-bug kritis**.

---

## 1. Struktur Lengkap Folder `docs_ai_studio/`

```text
docs_ai_studio/
├── README_AI_STUDIO.md                  # Panduan ini (urutan unggah & eksekusi Sprint 0-5)
├── 00_AI_STUDIO_ARCHITECTURE.md         # Tech stack, Local-First Storage, struktur src/, 4 Aturan Anti-Bug
├── 01_CASEWARE_UI_DESIGN_SYSTEM.md      # CaseWare 3-Zone Split-Pane, Command Palette Ctrl+K, tipografi keuangan
├── 02_BLUEPRINT_JSON_CONTRACT.md        # Kontrak skema aktual 6 file JSON blueprint (226 sheet) & helper import
├── 03_TYPESCRIPT_DATA_MODELS.md         # Seluruh TypeScript Interfaces & Enum siap salin untuk src/types/atlas.ts
├── blueprint/                           # 6 file JSON hasil ekstraksi forensik ATLAS v2.1 (226 sheet)
│   ├── part0_core_general.json          # 11 sheet Core & Navigasi
│   ├── part1_a1_pre_engagement.json     # 22 sheet Modul A1
│   ├── part2_a2_risk_assessment.json    # 55 sheet Modul A2
│   ├── part3_b_core_wstb_fs.json        # 24 sheet Modul B Core (WSTB, AJE/RJE, FS, B210-B280)
│   ├── part4_b_lead_schedules.json      # 92 sheet Lead Schedules (L02-L47) & Sampling ISA
│   └── part5_c_completing_opini.json    # 22 sheet Completing, CALK C220A-F, EQCR, C400, OPINI1-5
├── prd/                                 # 6 Dokumen PRD Spesifikasi Fungsional & Rumus Eksak
│   ├── PRD_0_Core_Hub_RBAC.md
│   ├── PRD_1_Modul_A1_PreEngagement.md
│   ├── PRD_2_Modul_A2_RiskEngine.md
│   ├── PRD_3_Modul_B_WSTB_FS.md
│   ├── PRD_4_Modul_B_Leads_ISA.md
│   └── PRD_5_Modul_C_Opini_LAI.md
└── sprints/                             # 6 Panduan Prompt Eksekusi Bertahap untuk Google AI Studio
    ├── Sprint_0_Core_Shell_Hub.md
    ├── Sprint_1_Modul_A1.md
    ├── Sprint_2_Modul_A2.md
    ├── Sprint_3_Modul_B_Core.md
    ├── Sprint_4_Modul_B_Leads_ISA.md
    └── Sprint_5_Modul_C_Opini.md
```

---

## 2. Cara Mengunggah Folder `docs_ai_studio/` ke Google AI Studio (Build Mode)

1. Buka **Google AI Studio** dan pilih **Build** (mode pembuatan aplikasi web React + Vite + TypeScript).
2. Di panel **File Explorer** sebelah kiri, buat folder `docs_ai_studio/` (atau unggah langsung seluruh isi folder `docs_ai_studio/` beserta subfolder `blueprint/`, `prd/`, dan `sprints/`).
3. Pastikan file-file JSON di `docs_ai_studio/blueprint/` ikut terunggah ke dalam workspace atau di-copy ke `src/data/blueprint/` sesuai instruksi di masing-masing Sprint agar dapat di-`import` langsung oleh Vite/TypeScript (`resolveJsonModule: true`).
4. **Penting untuk Performa Konteks AI Studio:**
   - Jangan menyuruh AI Studio membaca seluruh isi 6 file JSON secara mentah (total ukuran > 8.6 MB).
   - Selalu arahkan AI Studio untuk membaca **`02_BLUEPRINT_JSON_CONTRACT.md`** terlebih dahulu agar ia mengetahui struktur key & tipe data aktual JSON, lalu hanya mengekstrak/mengimpor sheet spesifik yang dibutuhkan di Sprint yang sedang berjalan.

---

## 3. Urutan Eksekusi Wajib (Sprint 0 s.d. Sprint 5)

Eksekusi wajib dilakukan **berurutan** karena setiap modul saling terhubung secara deterministik (misal: `A110` menentukan risiko perikatan, `A210`–`A270` menentukan `RoMM` yang dipakai di Lead Schedules `L02`–`L47`, dan `WSTB`/`AJE`/`RJE` mengalir ke `FS`, `C100`, `C110`, hingga `C400` Opini & LAI `.docx`).

| Urutan | File Panduan Sprint | Referensi PRD & Blueprint Wajib | Fokus Deliverable Utama |
| :---: | :--- | :--- | :--- |
| **1** | `sprints/Sprint_0_Core_Shell_Hub.md` | `00_AI_STUDIO_ARCHITECTURE.md`, `01_CASEWARE_UI_DESIGN_SYSTEM.md`, `03_TYPESCRIPT_DATA_MODELS.md`, `prd/PRD_0_Core_Hub_RBAC.md`, `part0_core_general.json` | Setup Vite+React+TS+Tailwind, Store Local-First + IndexedDB + `.atlas.json`, `initializeNewEngagement()`, 3-Zone Split-Pane, Command Palette `Ctrl+K`, Hub KAP/Klien/Tim, RBAC 4 Peran, Sign-Off, Review Notes, Live Timer, SA 230 Lock Guard. |
| **2** | `sprints/Sprint_1_Modul_A1.md` | `prd/PRD_1_Modul_A1_PreEngagement.md`, `part1_a1_pre_engagement.json` | Evaluasi `A110` (7 kriteria), `A1101`, `A1102`, `A1102.1` (+ modal regulasi PMK 55/155 `A1102.1A–D`), `A1103A` -> `A1103B`, `A1105` & `A170` kondisional, `A120` kalkulator 7 jam/hari, `A150` matriks independensi, generator `.docx` `A130` & `A140`. |
| **3** | `sprints/Sprint_2_Modul_A2.md` | `prd/PRD_2_Modul_A2_RiskEngine.md`, `part2_a2_risk_assessment.json` | `A210` SA 320 (acuan saldo dinamis dari FS), `A220.1`–`2` & `PREANALITICAL`, `A230.1`–`8` (+ Fraud Risk SA 240), `A240` Akun Signifikan & 5 Asersi, `A250.1`–`13` + walk-through, `A260` TCWG/SPI, `A270` Matriks `IR × CR = RoMM` (prioritas numerik `3>2>1`), `.docx` `A280` ASM Update. |
| **4** | `sprints/Sprint_3_Modul_B_Core.md` | `prd/PRD_3_Modul_B_WSTB_FS.md`, `part3_b_core_wstb_fs.json` | Impor & validasi TB Excel/CSV via SheetJS (`xlsx`), deteksi duplikat & balance awal, Jurnal Double-Entry `AJE`/`RJE` (`Debit === Kredit`), WSTB 12 kolom `B100`, 4 Laporan Keuangan `B120` (`NERACA BALANCED`) + ekspor `.docx`/`.xlsx`, 8 prosedur khusus `B210`–`B280` (termasuk tanggal SA 580 di `B250`). |
| **5** | `sprints/Sprint_4_Modul_B_Leads_ISA.md` | `prd/PRD_4_Modul_B_Leads_ISA.md`, `part4_b_lead_schedules.json` | Mesin Lead Schedule dinamis 45 pos `L02`–`L47` (`leadCode` seragam), mutasi WSTB & RoMM real-time, program prosedur `SAP`/`TOD` dari blueprint JSON, Kalkulator Sampling ISA SA 530 (9 Confidence Factor), proyeksi salah saji Rasio & Difference, ekspor `.xlsx` 3 tab. |
| **6** | `sprints/Sprint_5_Modul_C_Opini.md` | `prd/PRD_5_Modul_C_Opini_LAI.md`, `part5_c_completing_opini.json` | `C100` agregasi SAD SA 450, `C110` materialitas akhir + warning SA 320.12, `C120` analitis akhir & grafik Recharts, `C210` reviu LAI 68 butir, `C220` checklist CALK kondisional multi-SAK, `C230` 12 pilar memo, `C300` Partner EQCR gate, `C400` 5 opini SA 700/705 + penomoran LAI + generator `.docx` LAI. |

---

## 4. Checklist Verifikasi Akhir Setelah Sprint 5

Sebelum menyatakan aplikasi selesai di Google AI Studio, pastikan seluruh poin berikut lolos uji:
1. **Zero-Hardcode KAP & User:** Mengubah nama KAP di Pengaturan Master KAP langsung mengubah kop surat pada seluruh halaman KKP dan dokumen `.docx` yang dihasilkan.
2. **Inisialisasi Perikatan Baru:** Membuat perikatan baru langsung mengisi seluruh KKP, kuesioner, tim, materialitas awal, dan checklist CALK sesuai SAK klien tanpa ada layar kosong/error `undefined`.
3. **Konsistensi `leadCode` & `RoMM`:** Perubahan `RoMM` di `A270` langsung tercermin di Lead Schedule `L02`–`L47`, dan pengurutan risiko selalu menempatkan `High (3) > Moderate (2) > Low (1)`.
4. **SA 230 Lock Guard:** Ketika KKP berstatus `Locked` atau perikatan diarsipkan (`isArchived = true`), tidak ada satu pun input yang bisa diubah atau mutasi store yang lolos.
5. **Portabilitas Data:** Tombol **Export `.atlas.json`** dan **Import `.atlas.json`** memulihkan seluruh perikatan secara utuh di browser berbeda.
