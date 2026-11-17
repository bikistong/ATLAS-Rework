# Ringkasan Styling UI/UX — ATLAS-Web Mockup

**Aplikasi:** ATLAS-Web — CaseWare Audit Working Papers (IAPI v2.1)
**Gaya:** Neutral Slate Enterprise
**Referensi:** CaseWare Working Papers, Bloomberg Terminal, Figma artboard 1440px

---

## 1. Design Philosophy

| Aspek | Keputusan |
|---|---|
| **Kepadatan** | TINGGI — compact padding, banyak info per layar |
| **Sudut** | Tajam — `rounded-sm` / `rounded` (**bukan** `rounded-xl`) |
| **Shadow** | Minimal — hanya `shadow-md` saat hover, tanpa drop-shadow besar |
| **Whitespace** | Ketat — bukan gaya konsumer dengan padding lega |
| **Tone** | Enterprise formal, profesional, "power user" |
| **Bahasa** | Indonesia (label, status, tombol) |

---

## 2. Tipografi

### Font Stack
```css
--font-ui:   "Plus Jakarta Sans" (400/500/600/700/800)
--font-mono: "JetBrains Mono"    (400/500/600/700)
```

### Hierarki

| Elemen | Kelas | Contoh |
|---|---|---|
| **H1 workspace** | `text-[16px] font-bold tracking-tight` | "Materialitas Awal" |
| **H2 screen** | `text-[15px] font-bold` | "Engagement Hub" |
| **Label field** | `text-[11px] font-bold uppercase tracking-wider text-slate-500` | "NAMA KLIEN" |
| **Body tabel** | `text-[11px]`–`text-[12px]` | "Kas & Bank" |
| **Header tabel** | `text-[9px] uppercase tracking-wide text-slate-600` | "SALDO PEMBUKUAN" |
| **Badge** | `text-[9px]`–`text-[10px] font-bold uppercase tracking-wider` | "DRAFT", "PREPARED" |
| **Angka/kode** | `font-mono tabular-nums` rata kanan | `2.500.000.000` |
| **Sign-off mini** | `font-mono text-[8.5px] text-slate-400` | `P:AS R:BD` |

### Aturan Angka
- Semua angka, kode indeks, tanggal, NPWP, NIB → **JetBrains Mono** + `tabular-nums`
- **Rata kanan** di kolom tabel
- **Negatif** dalam kurung + `rose-700`: `(1.250.000)`
- **Δ%** dengan koma desimal: `16,3`

---

## 3. Palet Warna

### Warna Dasar (Neutral Slate)

| Peran | Token | Hex |
|---|---|---|
| Canvas | `bg-slate-50` | `#f8fafc` |
| Card | `bg-white` | `#ffffff` |
| Border card | `border-slate-200` | `#e2e8f0` |
| Border tebal (TOTAL) | `border-slate-400` | `#94a3b8` |
| Header strip card | `bg-slate-50` | `#f8fafc` |
| Header tabel | `bg-slate-100` | `#f1f5f9` |
| TopBar | `bg-slate-900` | `#0f172a` |
| Sidebar | `bg-slate-100` | `#f1f5f9` |

### Warna Semantik Status (WAJIB konsisten)

| Status | BG | Text | Ikon |
|---|---|---|---|
| **Kosong** | `slate-200` | `slate-600` | `○` |
| **Draft** | `amber-100` | `amber-800` | `●` |
| **Prepared** | `blue-100` | `blue-800` | `◐` |
| **Reviewed** | `sky-100` | `sky-800` | `✓` |
| **Partner Locked** | `emerald-100` | `emerald-800` | `🔒` |
| **Alert/Open/Pending** | `rose-100` | `rose-800` | `!` |
| **OK/Clear** | `emerald-100` | `emerald-800` | `✓` |

### Warna Aksi

| Elemen | Warna |
|---|---|
| **Primary button** | `bg-indigo-700` hover `indigo-800` text-white |
| **Secondary button** | `bg-white border-slate-300` text-slate-700 |
| **Destructive** | `bg-rose-600` |
| **Link/reference** | `text-indigo-700 underline decoration-indigo-300` |
| **Focus ring** | `ring-2 ring-indigo-500/40` |

### Warna Latar Alert

| Jenis | Style |
|---|---|
| **Gate warning** | `bg-amber-50 border-amber-300` + `ShieldAlert` |
| **Gate OK** | `bg-emerald-50 border-emerald-200` + `check-circle-2` |
| **Row error (checklist)** | `bg-rose-50` + `flag` icon |
| **Hint "belum dijelaskan"** | `bg-amber-50 border-amber-200` italic |

---

## 4. Struktur Layout

### Shell Workspace (3-Zone)

```
┌─────────────────────────────────────────────────────┐
│  TopBar h-12  bg-slate-900 text-white                │
│  Logo · KAP · Klien · SAK badge · Ctrl+K · Timer ·  │
│  Auto-save · User switcher                          │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  Sticky Workpaper Header                │
│ w-72     │  (kode · judul · badge · metadata ·     │
│ bg-      │   aksi: Simpan/Mark/Review/Lock)        │
│ slate-   ├──────────────────────────────────────────┤
│ 100      │                                          │
│          │  Workspace Content                       │
│ Tree     │  (KPI cards / tabel / form / heatmap)   │
│ accordion│                                          │
│ + filter │                                          │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│  Bottom Drawer (Review Notes / Audit Trail)         │
└─────────────────────────────────────────────────────┘
```

### Grid Umum
- **Artboard:** `w-[1440px]`
- **Zona utama:** 65/35 split → `grid-cols-20` (13/7) atau `grid-cols-12` (7/5)
- **KPI cards:** `grid-cols-2 / grid-cols-3 / grid-cols-4` sesuai konteks
- **Form:** `grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3`

### Metric Ukuran (Design Tokens)

| Elemen | Tinggi |
|---|---|
| TopBar | `h-12` |
| Sticky header | `py-2.5` (~64px) |
| Sub-toolbar tab | `h-8` |
| Sidebar baris | `h-7` (28px) |
| Tabel baris normal | `h-7`–`h-9` |
| Header tabel | `py-1.5` |
| Input / select | `h-7`–`h-8` |
| Tombol utama | `h-8 px-3` |
| Tombol kecil | `h-6 px-2`–`h-7 px-2.5` |
| Badge pill | `h-4`–`h-5 px-1.5` |
| Card padding | `p-2`–`p-3` |
| Section gap | `space-y-2`–`space-y-3` |

---

## 5. Komponen Kunci

### 5.1 Card
```html
<div class="bg-white border border-slate-200 rounded-sm overflow-hidden">
  <div class="h-8 px-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
    <i class="lucide">...</i>
    <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600">JUDUL</span>
    <span class="ml-auto">...</span>
  </div>
  <div class="p-3">...</div>
</div>
```

### 5.2 Badge Status
```html
<span class="h-5 px-1.5 rounded-sm bg-amber-100 text-amber-800
       text-[10px] font-bold uppercase tracking-wider">DRAFT</span>
```

### 5.3 Tabel Data
- Header: `bg-slate-100 text-[9px] uppercase`
- Body: `text-[11px]–[12px]`, `font-mono tabular-nums` untuk angka
- Baris TOTAL: `bg-slate-100 font-bold border-t-2 border-slate-400`
- Hover: `hover:bg-slate-50/70` atau `hover:bg-indigo-50/40`
- Border antar kolom: `border-l border-slate-100` / `border-r border-slate-200`

### 5.4 Form Field
```html
<div>
  <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500">LABEL</div>
  <input class="h-8 w-full px-2 rounded border-slate-300 bg-white
                text-[13px] focus:ring-2 focus:ring-indigo-500/40
                focus:border-indigo-500">
</div>
```

### 5.5 Segmented Yes/No/N-A
- **Ya aktif:** `bg-indigo-100 text-indigo-800` atau `bg-emerald-100 text-emerald-800`
- **Tidak aktif:** `bg-rose-100 text-rose-800`
- **N/A aktif:** `bg-slate-200 text-slate-700`
- **Tidak aktif:** `text-slate-400`

### 5.6 Banner Gate
```html
<!-- Warning: gate diblokir -->
<div class="bg-amber-50 border border-amber-200 px-3 py-2 flex gap-2.5">
  <i data-lucide="shield-alert" class="text-amber-600"></i>
  <p class="text-[11.5px] text-amber-900">...</p>
</div>

<!-- OK: gate lolos -->
<div class="bg-emerald-50 border border-emerald-200 px-3 py-2 flex gap-2.5">
  <i data-lucide="check-circle-2" class="text-emerald-600"></i>
  <p class="text-[11.5px] text-emerald-900">...</p>
</div>
```

### 5.7 Sidebar Tree
- Wrapper: `w-72 bg-slate-100 border-r border-slate-300`
- Filter: input `h-8` + tombol chip status
- Folder: `h-7 px-1.5` + chevron + label uppercase `text-[10px]`
- Indeks: `h-7 pl-3` + ikon status + kode mono + nama + sign-off
- **Selected:** `bg-indigo-50 border-l-2 border-indigo-700`
- Legend di bawah: `text-[8.5px]`

### 5.8 Stepper Vertikal (A120)
- Bullet: `h-6 w-6 rounded-full border-2`
- Completed: `bg-emerald-100 border-emerald-500` + check
- Active: `bg-indigo-100 border-indigo-600`
- Pending: `bg-white border-slate-300`
- Connector: `w-0.5 bg-slate-200` / `bg-indigo-300`
- Progress bar per fase: `h-1.5 bg-slate-200` + isi `bg-indigo-700`

### 5.9 Sign-Off Footer
- Grid 3 kolom: Prepared / Reviewed / Partner Lock
- Avatar inisial: `h-8 w-8 rounded-full bg-indigo-600 text-white text-[10px]`
- Nama + jabatan + tanggal mono
- Chip status: `Prepared` blue · `Pending` amber · `Menunggu` slate

---

## 6. Ikonografi

**Library:** [Lucide Icons](https://lucide.dev) via CDN

### Pemetaan Ikon Status

| Ikon | Penggunaan |
|---|---|
| `chevron-down/right` | Folder accordion |
| `check` | Reviewed, terselesaikan |
| `lock` | Partner Locked |
| `alert-circle` | Warning "belum dijelaskan" |
| `shield-alert` | Gate blocker |
| `check-circle-2` | Gate OK / Clear |
| `flag` | Row error (checklist) |
| `message-square` | Review Notes |
| `history` | Audit Trail |
| `timer` | Live timer |
| `cloud-check` | Auto-save |
| `hexagon` | Logo ATLAS-Web |
| `building-2` | Klien |
| `panel-left-close` | Collapse sidebar |
| `pen-line / eye / hash / lock` | Metadata header |

**Ukuran ikon:** `h-3 w-3` (badge/meta) · `h-3.5 w-3.5` (tombol/status) · `h-4 w-4` (banner) · `h-6 w-6` (placeholder)

---

## 7. Interaksi & State

| State | Styling |
|---|---|
| **Hover baris** | `hover:bg-slate-50/70` / `hover:bg-indigo-50/40` |
| **Selected baris** | `bg-indigo-50 border-l-2 border-indigo-700` |
| **Disabled** | `bg-slate-100 text-slate-400 cursor-not-allowed` |
| **Focus input** | `ring-2 ring-indigo-500/40 border-indigo-500` |
| **Error input** | `border-rose-400` + hint `text-[11px] text-rose-700` |
| **Over budget** | `bg-rose-50/40` baris · `text-rose-700` nilai · `(over 12 jam)` |
| **Empty state** | Ikon emerald + teks positif ("Tidak ada temuan") |

---

## 8. Prinsip Konsistensi

1. **Palet tunggal** — semua status memakai 6 warna semantik (slate/amber/blue/sky/emerald/rose + indigo untuk primary)
2. **Mono untuk angka** — semua nominal, kode indeks, tanggal, ID → JetBrains Mono tabular-nums
3. **Border tipis** — `border-slate-200` (default) / `border-slate-300` (penekanan) / `border-slate-400` (TOTAL)
4. **Header strip uppercase** — semua card punya header `bg-slate-50 uppercase text-[11px]` dengan aksi di kanan
5. **Gate-first** — setiap form Modul A punya banner amber/emerald di atas menandai status blokir Mark Prepared
6. **Sign-off seragam** — footer 3 kolom (Prepared/Reviewed/Locked) dengan avatar inisial + status chip
7. **Kepadatan informasi** — baris `h-7` standar, padding `p-2`–`p-3`, tidak ada whitespace konsumer
8. **Tanpa gradien/shadow besar** — flat, profesional, fokus pada data
9. **Sudut tajam** — hanya `rounded-sm` (2px) / `rounded` (4px), tidak ada `rounded-xl`
10. **Ikon Lucide** — konsisten untuk semua status & aksi

---

## 9. Daftar Kelas Tailwind Paling Sering Dipakai

```
Layout:    flex items-center gap-1.5 justify-between min-w-0 shrink-0
Warna:     bg-slate-50 bg-white bg-slate-100 bg-slate-900 text-slate-900
           text-slate-500 text-slate-400 border-slate-200 border-slate-300
Status:    bg-amber-100 text-amber-800 (Draft)
           bg-blue-100 text-blue-800 (Prepared)
           bg-sky-100 text-sky-800 (Reviewed)
           bg-emerald-100 text-emerald-800 (Locked/OK)
           bg-rose-100 text-rose-800 (Alert/Open)
Aksi:      bg-indigo-700 hover:bg-indigo-800 text-white
           border-slate-300 bg-white text-slate-700
Tipografi: text-[9px] text-[10px] text-[11px] text-[12px] text-[13px]
           font-bold font-semibold uppercase tracking-wider tracking-wide
           font-mono tabular-nums
Ukuran:    h-6 h-7 h-8 h-9 h-10 h-12 w-72 w-8 w-20 w-64
Spacing:   px-1.5 px-2 px-2.5 px-3 py-1 py-1.5 py-2 py-2.5 gap-1 gap-1.5 gap-2
Radius:    rounded-sm rounded
```

---

## 10. Ringkasan Satu Paragraf

> **ATLAS-Web** memakai design system **"Neutral Slate Enterprise"** — kepadatan tinggi khas aplikasi audit profesional (ala CaseWare Working Papers & Bloomberg Terminal). Fondasi visual: **slate netral** untuk canvas/kartu/border, **indigo-700** sebagai primary action, dan **6 warna status semantik** (slate/amber/blue/sky/emerald/rose) yang dipakai konsisten di seluruh badge, ikon, dan banner. Tipografi memisahkan **Plus Jakarta Sans** (UI/label) dari **JetBrains Mono tabular-nums** (angka, kode, tanggal). Sudut tajam `rounded-sm`, shadow minimal, tanpa gradient — semua fokus pada **informasi padat & hierarki jelas**. Setiap kertas kerja Modul A mengikuti pola seragam: **gate banner** (amber/emerald) → **card header strip uppercase 11px** → **konten tabel/form** → **footer sign-off 3 kolom**. Semua komponen dibuat dengan **Tailwind CSS + Lucide Icons** tanpa library UI tambahan.

---

*Dokumen ini merangkum mockup HTML statis ATLAS-Web (6+ screen, artboard 1440px) sebagai acuan styling untuk implementasi React/Vue/serupa.*
