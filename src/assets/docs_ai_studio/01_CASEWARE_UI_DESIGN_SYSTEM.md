# 01 — CaseWare-Style UI & UX Design System (React + Tailwind CSS)

Dokumen ini adalah hasil porting penuh dari spesifikasi `UI_STYLE_GUIDE.md` ke arsitektur komponen **React 18+ TypeScript + Tailwind CSS + Lucide React**. Seluruh halaman ruang kerja audit wajib mematuhi standar ergonomi *high-density* ala **CaseWare Working Papers**.

---

## 1. Prinsip Desain Utama (Enterprise Audit Ergonomics)

1. **High-Density Workspace:** Hindari padding/margin berlebihan ala aplikasi konsumer. Gunakan skala padding kompak (`p-3`, `px-2.5 py-1.5`, `h-8` untuk input) agar auditor dapat melihat banyak baris akun, kuesioner, dan skor risiko dalam satu layar.
2. **Tabular Financial Typography (`font-mono tabular-nums text-right`):**
   - Seluruh angka keuangan, persentase materialitas, jam kerja, dan kode indeks wajib rata kanan (`text-right`) dengan `font-mono tabular-nums` agar koma dan digit sejajar vertikal sempurna.
   - Angka negatif **wajib** diformat dalam tanda kurung, contoh: `(1,250,000)` dan diberi warna `text-rose-700` bila relevan.
   - Helper wajib di `src/utils/formatters.ts`:
     ```typescript
     export function formatAuditNumber(value: number, decimals = 0): string {
       const abs = Math.abs(value);
       const formatted = new Intl.NumberFormat('en-US', {
         minimumFractionDigits: decimals,
         maximumFractionDigits: decimals,
       }).format(abs);
       return value < 0 ? `(${formatted})` : formatted;
     }
     ```
3. **Visual Sign-Off & Lock Clarity:** Setiap KKP memperlihatkan statusnya (`Kosong`, `Draft`, `Prepared`, `Reviewed`, `Locked`) baik di `SidebarTree` maupun di `StickyWorkpaperHeader`. Saat `Locked` atau `isArchived`, seluruh kontrol input otomatis `disabled`.
4. **Zero-Reload Reactive Experience:** Semua aksi (simpan draf, tambah jurnal `AJE/RJE`, hitung ulang materialitas, tambah Review Note) langsung memperbarui state React + IndexedDB dengan badge indikator auto-save di pojok kanan atas.

---

## 2. Palet Warna & Semantik Status (Tailwind CSS)

Tema: **Neutral Slate Enterprise** (terang, kontras tinggi, nyaman dibaca berjam-jam):

| Peran Elemen | Kelas Tailwind CSS | Kode Hex | Penggunaan |
| :--- | :--- | :--- | :--- |
| **App Top Bar** | `bg-slate-900 text-white` | `#0f172a` | Header global: identitas KAP/klien, periode, *live timer*, user switcher |
| **Sidebar Tree (Kiri)** | `bg-slate-100 border-r border-slate-300` | `#f1f5f9` | Panel navigasi pohon indeks `Part 0`–`C400` & `Lead Schedules` |
| **Kanvas Kerja (Kanan)** | `bg-white` di atas `bg-slate-50` | `#ffffff` | Area form kertas kerja utama dengan pembatas `border-slate-200` |
| **Primary Action Button** | `bg-indigo-700 hover:bg-indigo-800 text-white` | `#4338ca` | Tombol simpan, tambah jurnal, kalkulasi, dan generate `.docx`/`.xlsx` |
| **Status: Kosong** | `bg-slate-200 text-slate-600` | `#e2e8f0` | Kertas kerja belum pernah diisi (`○`) |
| **Status: Draft** | `bg-amber-100 text-amber-800 border-amber-300` | `#fef3c7` | Sedang dikerjakan Preparer (`◐`) |
| **Status: Prepared** | `bg-blue-100 text-blue-800 border-blue-300` | `#dbeafe` | Selesai disiapkan, menunggu reviu Manager/Ketua Tim (`✓`) |
| **Status: Reviewed** | `bg-sky-100 text-sky-800 border-sky-300` | `#e0f2fe` | Telah direviu berjenjang, siap difinalisasi Partner (`✓✓`) |
| **Status: Partner Locked** | `bg-emerald-100 text-emerald-800 border-emerald-300` | `#d1fae5` | Dikunci final oleh Partner (`🔒`, seluruh input *disabled*) |
| **Alert / High Risk / Open Note** | `bg-rose-100 text-rose-800 border-rose-300` | `#ffe4e6` | Risiko tinggi (`High RoMM`), selisih jurnal $\ne 0$, atau Review Note `Open` |

---

## 3. Skala Tipografi & Kepadatan Elemen

- **Font Utama:** `Inter, system-ui, sans-serif`
- **Font Angka & Kode:** `JetBrains Mono, ui-monospace, monospace` (`font-mono tabular-nums`)
- **Ukuran Standar Komponen:**
  - Judul Halaman Indeks: `text-base font-semibold text-slate-900` (`16px`)
  - Sub-judul Bagian / Section Header: `text-xs font-bold uppercase tracking-wider text-slate-600` (`12px`)
  - Label Form & Isi Tabel KKP: `text-[13px] leading-snug text-slate-800` (`13px`)
  - Input Form (`<input>`, `<select>`): `h-8 px-2.5 text-[13px] rounded border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`
  - Sel Tabel Keuangan (`<td>`, `<th>`): `px-2.5 py-1.5 text-[13px] border-b border-slate-200`

---

## 4. Tata Letak Utama: CaseWare 3-Zone Split-Pane (`CaseWareShell.tsx`)

Kerangka layar penuh (`h-screen overflow-hidden flex flex-col bg-slate-50`):

```text
+-----------------------------------------------------------------------------------+
| [TOP BAR - h-12 bg-slate-900 text-white]                                          |
| ATLAS-Web | KAP Profile | PT Klien (2023) [SAK] | [Ctrl+K] | Timer 01:24 | User   |
+-----------------------+-----------------------------------------------------------+
| [LEFT SIDEBAR - w-72] | [STICKY WORKPAPER HEADER - h-12 bg-white border-b]        |
| Filter Indeks...      | A210 - Materialitas Awal [Draft] | Prep: - | Rev: -       |
|                       | [Simpan] [Mark Prepared] [Review Sign-Off] [Partner Lock] |
| ▼ A1 Pra-Perikatan    +-----------------------------------------------------------+
|   ● A110 Penerimaan   | [BANNER SA 230 READ-ONLY LOCK (jika Locked / isArchived)] |
|   ● A120 Jam Jasa     +-----------------------------------------------------------+
|   ● A150 Independensi | [SCROLLABLE WORKSPACE AREA - flex-1 overflow-y-auto p-4]  |
| ▼ A2 Penilaian Risiko |                                                           |
|   ◐ A210 Materialitas |   (Komponen KKP Aktif: Form / Tabel WSTB / Lead Schedule) |
|   ○ A220 Analitis     |                                                           |
| ▼ B  Respons Risiko   +-----------------------------------------------------------+
|   ○ B100 WSTB & FS    | [COLLAPSIBLE BOTTOM DRAWER - h-44 / min: h-8 border-t]    |
|   ▶ Lead Schedules    | Tab: [Review Notes (2 Open)] [Audit Trail & Sign-Off Log] |
| ▼ C  Pelaporan        | • [Open] Ketua Tim: Cek dasar benchmark laba sebelum pajak|
+-----------------------+-----------------------------------------------------------+
```

---

## 5. Spesifikasi 5 Komponen Layout Wajib

### 5.1 `TopBar.tsx` (`h-12 bg-slate-900`)
- Kiri: Logo & Nama Aplikasi (`ATLAS-Web`), Nama KAP aktif dari `state.kapProfile.namaKap` (bukan hardcode), tombol kembali ke Hub Perikatan, dan identitas klien + tahun buku + badge SAK.
- Tengah: Tombol pemicu **Command Palette (`Ctrl+K`)**.
- Kanan:
  - **Auto-Save Badge** (`Tersimpan otomatis` / `Menyimpan...`).
  - **Live Timer** (`HH:MM:SS` dengan tombol Start/Pause yang mencatat `TimeLog` ke tahapan aktif).
  - **User Switcher Dinamis** membaca dari `state.users` (menampilkan Nama, Inisial, dan Role badge).
  - Tombol **Export `.atlas.json`**.

### 5.2 `SidebarTree.tsx` (`w-72 bg-slate-100 border-r border-slate-300`)
- Kotak pencarian instan di atas (`Filter indeks atau nama KKP...`) yang memfilter seluruh node pohon secara *real-time*.
- Kelompok folder *accordion*: `Part 0 Core`, `Modul A1 Pra-Perikatan`, `Modul A2 Penilaian Risiko`, `Modul B Core (WSTB & Prosedur)`, `Lead Schedules (45+ Pos)`, dan `Modul C Pelaporan`.
- Node kondisional (`A1105`, `A170`, `C300` EQCR) otomatis tampil/sembunyi sesuai aturan bisnis perikatan.
- Setiap baris menampilkan:
  1. **Ikon Status Lucide:**
     - `Kosong`: `<Circle className="w-3.5 h-3.5 text-slate-400" />`
     - `Draft`: `<CircleDot className="w-3.5 h-3.5 text-amber-600" />`
     - `Prepared`: `<CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />`
     - `Reviewed`: `<ShieldCheck className="w-3.5 h-3.5 text-sky-600" />`
     - `Locked`: `<Lock className="w-3.5 h-3.5 text-emerald-600" />`
  2. **Kode Indeks** (`font-mono font-semibold text-xs`).
  3. **Nama Indeks** (`truncate text-[13px]`).
  4. **Inisial Sign-Off** (`P:AS | R:BD` dalam `text-[10px] font-mono text-slate-500`).

### 5.3 `StickyWorkpaperHeader.tsx` (`bg-white border-b border-slate-200`)
- Baris atas: Kode & Nama KKP, Badge Status berwarna semantik, Referensi SA relevan, metadata `Prepared by [Inisial] ([Tanggal])` & `Reviewed by [Inisial] ([Tanggal])`.
- Tombol aksi RBAC dinamis:
  - `Simpan` (selalu tersembunyi/disabled saat `Locked`/`isArchived`).
  - `Mark Prepared` (hanya `Anggota Tim` / `Ketua Tim`, saat status `Kosong`/`Draft`).
  - `Review Sign-Off` (hanya `Ketua Tim` / `Manager`, saat status `Prepared`).
  - `Partner Lock` (hanya `Partner`, saat status `Reviewed` dan tidak ada Review Note `Open`).
  - `Buka Kunci / Batalkan` sesuai matriks RBAC `PRD_0`.
- **SA 230 Read-Only Banner:** Jika KKP berstatus `Locked` atau `engagement.isArchived === true`, tampilkan banner tepat di bawah header:
  - `bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-1.5 text-xs flex items-center gap-2`
  - Teks: *"Mode Baca-Saja (SA 230): Kertas kerja ini telah dikunci final / diarsipkan. Seluruh input dinonaktifkan."*

### 5.4 `CollapsibleBottomDrawer.tsx` (`border-t border-slate-300 bg-slate-50`)
- Tinggi default `h-44`, bisa di-minimize menjadi `h-8` dengan tombol chevron.
- Dua tab utama:
  1. **Review Notes (`N Open`):** Daftar komentar ber-thread (`Open`, `Addressed`, `Cleared`), form tambah catatan baru (menunjuk `assignedTo`), tombol *Respond* dan *Clear Note*.
  2. **Audit Trail & Sign-Off Log:** Tabel kronologis (`Timestamp`, `User`, `Role`, `Aksi`, `Detail`) yang tidak dapat diedit/dihapus.

### 5.5 `CommandPalette.tsx` (`Ctrl+K` / `Cmd+K`)
- Modal overlay cepat dengan keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`) untuk melompat langsung ke indeks KKP mana pun (`A110`–`C400`), Lead Schedule (`L02`–`L47`), atau aksi cepat (*Export `.atlas.json`*, *Buka Hub Klien*).

---

## 6. Pola Komponen UI Spesifik Modul

- **KPI Summary Cards (`A210`, `WSTB`, `Sampling`):** Grid 3–4 kolom `border border-slate-200 bg-slate-50/70 rounded p-3` dengan label `text-[11px] uppercase text-slate-500` dan nilai `text-lg font-mono font-bold text-slate-900 tabular-nums`.
- **Tabel Keuangan Komparatif (`WSTB-FINAL`, `FS`, `Lead Schedule`):** Header `sticky top-0 z-10 bg-slate-100 text-slate-700 font-semibold`; baris total/subtotal `bg-slate-100 font-bold border-t border-b-2 border-slate-400`; kolom angka `font-mono tabular-nums text-right`.
- **Kuesioner Audit (`A110`, `A230`, `A250`, `B210`–`B280`, `C220`):** Tabel kompak berkolom `No.`, `Pertanyaan / Prosedur Audit`, `Pilihan / Jawaban`, `Keterangan / Referensi KKP`, dengan badge warna otomatis (`Low` = Emerald, `Moderate` = Amber, `High` = Rose).
