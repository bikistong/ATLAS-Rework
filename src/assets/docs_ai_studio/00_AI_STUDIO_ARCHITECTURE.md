# 00 — Arsitektur Aplikasi Browser-Native (Google AI Studio Edition)

Dokumen ini menetapkan **arsitektur teknis wajib** untuk membangun **ATLAS-Web** di Google AI Studio (Build Mode) sebagai aplikasi **100% Client-Side / Browser-Native Single Page Application (SPA)** tanpa ketergantungan backend server.

---

## 1. Tech Stack Wajib

| Lapisan | Teknologi / Paket NPM | Versi Minimum | Fungsi Utama |
| :--- | :--- | :--- | :--- |
| **Core Framework** | `react`, `react-dom`, `typescript` | React 18+, TS 5+ | UI reaktif dan *strict type safety* |
| **Build Tool** | `vite`, `@vitejs/plugin-react` | Vite 5+ | Bundling cepat & dukungan impor JSON statis |
| **Styling** | `tailwindcss`, `postcss`, `autoprefixer` | Tailwind 3.4+ | Tema *Neutral Slate Enterprise* & utilitas kepadatan tinggi |
| **Ikonografi** | `lucide-react` | Terbaru | Ikon status KKP, pohon indeks, toolbar, dan dialog |
| **Visualisasi Data** | `recharts` | 2.12+ | Grafik rasio keuangan & perbandingan neraca/laba rugi (`A220`, `C120`, `Chart1`) |
| **Export Word** | `docx` | 8.5+ | Generator dokumen legal `.docx` (Surat Perikatan, Surat Tugas, ASM, LK, LAI) di browser |
| **Import/Export Excel** | `xlsx` (SheetJS) | 0.18+ | Parsing upload Trial Balance `.xlsx`/`.csv` & ekspor multi-tab KKP `.xlsx` |
| **File Download** | `file-saver` (`@types/file-saver`) | 2.0+ | Mengunduh blob `.docx`, `.xlsx`, dan `.atlas.json` ke komputer auditor |
| **Local Storage** | `localStorage` + `IndexedDB` (native / `idb`) | Browser API | Persistensi state perikatan, checklist CALK ribuan baris, dan lampiran file |

> [!CAUTION]
> **Larangan Keras Teknologi Backend:** DILARANG KERAS menulis atau menyarankan kode Python, FastAPI, SQLite, Jinja2, HTMX, `openpyxl`, `python-docx`, atau REST API server. Seluruh logika bisnis, kalkulator audit, validasi jurnal, dan generator dokumen berjalan 100% di browser menggunakan TypeScript.

---

## 2. Arsitektur Local-First Storage & Portabilitas `.atlas.json`

Karena aplikasi berjalan 100% di browser tanpa database server, penyimpanan data dibagi menjadi dua lapis agar tetap cepat dan tidak menabrak batas kuota 5 MB `localStorage`:

### 2.1 Lapisan Penyimpanan Hibrida
1. **`localStorage` (`atlas_core_store_v1`):**
   - Menyimpan metadata ringan & cepat: `kapProfile`, `users`, `activeUserId`, `clients`, `engagements` (daftar header perikatan), `activeEngagementId`, dan preferensi UI (`sidebarCollapsed`, `drawerOpen`).
2. **`IndexedDB` (`atlas_workspace_db`, store: `engagement_data`, `attachments`):**
   - Menyimpan payload besar per `engagementId`: seluruh state KKP (`A110`–`A170`, `A210`–`A280`, `trialBalance`, `journals`, `leadSchedules`, `samplingRuns`, `C100`–`C400`), ribuan baris jawaban checklist `C220A`–`C220F`, `auditTrail`, `timeLogs`, dan binary/Base64 `attachments`.
   - **Auto-Save Debounced (300ms):** Setiap perubahan state di React Context / Store otomatis disinkronkan ke IndexedDB dengan badge indikator *"Tersimpan otomatis"* di TopBar.

### 2.2 Skema Export & Import Portabel (`.atlas.json`)
Auditor dapat memindahkan seluruh arsip perikatan antar perangkat atau membuat cadangan permanen melalui file `.atlas.json`:
```typescript
export interface AtlasPortableBundle {
  schemaVersion: 'atlas-web-2.1';
  exportedAt: string;           // ISO 8601
  exportedBy: string;           // Nama & peran user
  kapProfile: KapProfile;
  users: UserProfile[];
  client: ClientEntity;
  engagementBundle: EngagementWorkspaceData; // Seluruh data perikatan + lampiran
}
```
- **Validasi Import:** Saat file `.atlas.json` diunggah, sistem memvalidasi `schemaVersion === 'atlas-web-2.1'`, memeriksa benturan `engagement.id` (opsi *Overwrite* atau *Import as New Copy*), lalu menyuntikkannya ke `localStorage` + `IndexedDB`.

---

## 3. Struktur Folder `src/` Target

```text
src/
├── types/
│   └── atlas.ts                         # Seluruh interface & enum dari 03_TYPESCRIPT_DATA_MODELS.md
├── data/
│   ├── blueprint/                       # 6 file JSON blueprint (disalin dari docs_ai_studio/blueprint/)
│   ├── blueprintLoader.ts               # Helper akses aman JSON sesuai 02_BLUEPRINT_JSON_CONTRACT.md
│   ├── masterIndices.ts                 # Katalog pohon indeks Part 0 - Part 5 & aturan kondisional
│   ├── masterLeadHeaders.ts             # Katalog baku 45 pos Lead Schedule (L02 - L47)
│   └── seedData.ts                      # Default KAP Profile, 4 demo users, & helper initializeNewEngagement
├── store/
│   ├── storageAdapter.ts                # Adapter localStorage + IndexedDB + Export/Import .atlas.json
│   ├── AtlasContext.tsx                 # React Context + useReducer dengan SA 230 Lock Guard
│   └── lockGuard.ts                     # Utilitas validasi isWorkpaperLocked & isEngagementArchived
├── utils/
│   ├── formatters.ts                    # Format angka keuangan (1,250,000), tanggal ID, bulan Romawi
│   ├── auditFormulas.ts                 # Rumus SA 320, RoMM (IRxCR), WSTB, ISA 530 Sampling, SA 450, SA 700/705
│   └── timeCalculator.ts                # Kalkulator jam kerja efektif 7 jam/hari (09:00-17:00, -1 jam istirahat)
├── services/
│   └── export/
│       ├── docxEngagementLetters.ts     # Generator .docx A130 (Surat Perikatan), A140 (Surat Tugas), A150
│       ├── docxAuditStrategy.ts         # Generator .docx A280 (ASM Update)
│       ├── docxFinancialStatements.ts   # Generator .docx 4 Laporan Keuangan Audited (B120)
│       ├── docxLaiReport.ts             # Generator .docx Laporan Auditor Independen (OPINI1-5)
│       └── xlsxWorkpapers.ts            # Generator .xlsx WSTB, Lead Schedule 3-tab, dan Completing
├── components/
│   ├── layout/
│   │   ├── CaseWareShell.tsx            # Kerangka 3-Zone Split-Pane (h-screen overflow-hidden flex flex-col)
│   │   ├── TopBar.tsx                   # Identitas KAP/Klien, Live Timer, User Switcher, Export/Import
│   │   ├── SidebarTree.tsx              # Panel kiri w-72 dengan filter instan & 5 ikon status
│   │   ├── StickyWorkpaperHeader.tsx    # Header KKP, status badge, tombol Sign-Off RBAC, banner SA 230
│   │   ├── CollapsibleBottomDrawer.tsx  # Tab Review Notes & Audit Trail (bisa minimize h-8)
│   │   └── CommandPalette.tsx           # Modal pencarian cepat Ctrl+K
│   ├── hub/                             # Master KAP, Daftar Klien & Perikatan, Form Setup, Pengaturan Tim
│   ├── phase_a/                         # Modul A1 (A110-A170) & Modul A2 (A210-A280)
│   ├── phase_b/                         # TB Importer, AJE-RJE, WSTB, FS, B210-B280, Dynamic Lead Schedule
│   └── phase_c/                         # C100, C110, C120+Charts, C210, C220A-F, C230, C300, C400+LAI
├── App.tsx
└── main.tsx
```

---

## 4. Empat (4) Aturan Anti-Bug Kritis (WAJIB DIPATUHI DI SELURUH SPRINT)

Keempat aturan ini mencegah bug struktural yang paling sering muncul saat membangun engine audit ATLAS:

### Aturan 1: Keseragaman `leadCode` & Prioritas `RoMM` Numerik
1. **Keseragaman `leadCode`:** Pemetaan akun COA ke Lead Schedule wajib menggunakan kode baku 3-karakter (`L` + 2 digit dari nomor sheet ATLAS), bukan nama bebas atau nomor sheet mentah yang berubah-ubah. Kode wajib utama meliputi:
   - `L02`: Kas & Bank
   - `L05`: Piutang Dagang / Usaha
   - `L06`: Persediaan Barang Dagang
   - `L09`: Biaya / Uang Muka Dibayar Dimuka (`L09` Biaya Dibayar Dimuka, `L10` Uang Muka Pembelian — pastikan referensi silang tetap konsisten pada `L02`..`L47`)
   - `L13`: Aktiva Tetap (Harga Perolehan)
   - `L14`: Akumulasi Penyusutan Aktiva Tetap
   - `L17`: Hutang Dagang / Usaha
   - `L20`: Hutang Bank Jangka Pendek
   - `L26`: Hutang Pajak / Biaya Yang Masih Harus Dibayar (sesuai katalog `L02`–`L47` pada `PRD_4`)
   - `L28`: Hutang Jangka Panjang - Bank
   - `L32`: Modal Saham
   - `L34`: Laba Ditahan / Saldo Laba
   - `L37`: Pendapatan Usaha / Penjualan
   - `L39`: Beban Pokok Penjualan (HPP)
   - `L41`: Beban Operasional (Gaji, Sewa, Penyusutan, Kantor `L40`–`L44`)
   - `L46`: Beban Bunga & Administrasi Bank
2. **Prioritas `RoMM` Numerik (Dilarang Sort Alfabetis!):**
   - Jika mengurutkan atau mencari nilai maksimum (*worst-case*) dari `Low`, `Moderate`, dan `High`, **DILARANG** menggunakan perbandingan string alfabetis (`'Moderate' > 'High'` bernilai `true` secara alfabetis karena `'M' > 'H'`, yang akan menghasilkan bug fatal!).
   - Wajib menggunakan peta bobot numerik konstan:
     ```typescript
     export const ROMM_PRIORITY: Record<RiskLevel, number> = {
       High: 3,
       Moderate: 2,
       Low: 1,
     };
     ```

### Aturan 2: Kelengkapan Inisialisasi `initializeNewEngagement(...)`
Saat perikatan baru dibuat, fungsi tunggal `initializeNewEngagement(params)` **wajib langsung mengisi seluruh struktur awal** dalam satu transaksi state sebelum UI me-render workspace:
1. Seluruh entri `workingPapers` (Part 0, A1, A2, B Core, C) dengan status awal `'Kosong'` / `'Incompleted'` sesuai aturan visibilitas kondisional.
2. Seluruh kuesioner default (`A110`, `A1101`, `A1102`, `A1102.1`, `A1103A`, `A1103B`, `A1105`, `A120`, `A130`–`A170`, `A230.1`–`A230.7`, `A250.1`–`A250.13`, `B210`–`B280`, `C210`, `C230`, `C300`, `C400`).
3. Susunan tim perikatan (`teamMembers`) & baris deklarasi independensi (`A150`) untuk setiap personel terpilih.
4. Record awal materialitas (`A210` & `C110`) yang terhubung ke FS klien aktif.
5. Checklist pengungkapan CALK (`C220`) yang di-seed otomatis sesuai `client.sakDigunakan` (`C220A` s.d. `C220F`) dari blueprint/catalog.
6. Katalog 45 pos Lead Schedule (`L02`–`L47`) beserta prosedur substantif `SAP`/`TOD` bawaan.

### Aturan 3: Zero-Hardcode Identitas KAP, User Switcher Dinamis & Acuan Materialitas FS
1. **Identitas KAP Dinamis:** DILARANG men-hardcode nama KAP, nomor izin KAP, alamat, atau nama AP di komponen atau generator `.docx`. Seluruh tampilan & dokumen wajib membaca dari `state.kapProfile`. Nilai default awal di `seedData.ts` adalah:
   - `namaKap`: `'KAP Djoemarma, Wahyudin dan Rekan'`
   - `kota`: `'Bandung'`
   *(Dapat diubah kapan saja oleh Partner/Manager melalui menu Pengaturan Master KAP).*
2. **User Switcher Dinamis:** Daftar user pada *User Switcher* (untuk simulasi RBAC 4 peran: `Partner`, `Manager`, `Ketua Tim`, `Anggota Tim`) wajib diambil dinamis dari `state.users` (bukan array statis di komponen TopBar).
3. **Saldo Acuan Materialitas Dinamis:** Nilai saldo acuan pada `A210` (`Total Aset`, `Aset bersih`, `Jumlah Pendapatan`, `Jumlah HPP`, `Laba sebelum pajak`, `EBITDA`, `Total Liabilitas`) wajib dihitung dinamis dari **Laporan Keuangan (FS) / WSTB klien aktif**, bukan angka dummy statis.

### Aturan 4: SA 230 Read-Only Lock Guard
1. Jika sebuah KKP berstatus `'Locked'` (Partner Lock) **ATAU** perikatan berstatus `engagement.isArchived === true` (Pengarsipan Final SA 230 / > 60 hari pasca-LAI):
   - **Lapisan UI:** Seluruh `<input>`, `<select>`, `<textarea>`, tombol *Save*, *Add*, *Delete*, dan *Upload Attachment* pada KKP tersebut wajib otomatis menerima `disabled={isReadOnly}` serta menampilkan banner peringatan SA 230 di bawah `StickyWorkpaperHeader`.
   - **Lapisan Store/Reducer:** Setiap action mutasi data KKP wajib memeriksa `guardMutation(state, engagementId, kodeIndeks)` di awal reducer; jika terkunci, mutasi **ditolak secara absolut** dan mencatat peringatan di console/toast tanpa mengubah state.
