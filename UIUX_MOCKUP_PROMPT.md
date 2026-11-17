# Prompt Mockup UI/UX — ATLAS-Web (CaseWare Audit Working Papers, IAPI v2.1)

> **Cara pakai:** Salin salah satu prompt di bawah dan tempelkan ke AI generatif pilihanmu:
> - **Gambar/statik:** Midjourney / DALL·E / Ideogram / Google Stitch → hasil berupa gambar mockup.
> - **HTML hidup (disarankan untuk tim kita):** Claude / Cursor / v0.dev / Lovable → hasil berupa 1 file HTML statis berisi *semua screen* yang bisa langsung dibuka di browser. Tidak perlu fungsi berjalan, cukup tampilan + data palsu.

---

## PROMPT MASTER (paling direkomendasikan — menghasilkan SEMUA screen dalam 1 halaman HTML)

```text
Buatkan saya MOCKUP UI/UX bergaya high-fidelity dalam SATU file HTML statis
(Tailwind CDN + Lucide icons via CDN). Ini adalah aplikasi web audit
"ATLAS-Web — CaseWare Audit Working Papers (IAPI v2.1)" berbahasa Indonesia.

ATURAN PENTING:
- TIDAK PERLU ada logika/fungsi yang benar-benar berjalan. Semua tombol,
  form, dan tab cukup statis dengan data dummy yang realistis.
- Fokus 100% pada VISUAL: layout, tipografi, warna, kepadatan informasi.
- Gaya desain: "Neutral Slate Enterprise" ala CaseWare Working Papers —
  high-density, compact padding (h-8 inputs, text-[13px] tables), sudut
  tajam (rounded-sm/md), BUKAN gaya konsumer yang banyak whitespace.
- Font: Plus Jakarta Sans (UI) + JetBrains Mono untuk semua angka & kode
  indeks (tabular-nums, rata kanan; angka negatif dalam kurung merah,
  contoh "(1.250.000)").
- Palet semantik status WAJIB dipakai konsisten:
  Kosong = slate-200, Draft = amber-100/800, Prepared = blue-100/800,
  Reviewed = sky-100/800, Partner Locked = emerald-100/800,
  Alert/Risiko Tinggi/Note Open = rose-100/800. Primary button = indigo-700.
- Top bar global: bg-slate-900 text-white, tinggi h-12.

TAMPILKAN 6 SCREEN berikut, masing-masing dibungkus <section> dengan label
judul screen di atasnya, disusun vertikal dalam satu halaman scrollable
(lebar tetap 1440px agar seperti artboard Figma):

SCREEN 1 — "Engagement Hub (Home)":
Header gelap + grid kartu perikatan audit (dummy: PT Semen Nusantara Tbk
FY2025 SAK Umum, CV Maju Bersama FY2025 SAK ETAP). Tiap kartu punya badge
status fase (A1/A2/B/C), progress ring % completion, jumlah Review Notes
open, dan tombol "Buka Kertas Kerja". Tab navigasi hub: Perikatan |
Master Klien | Personil KAP | Profil KAP. Ada search bar dan filter SAK.

SCREEN 2 — "Workspace Shell (CaseWare 3-Zone Split-Pane)":
Layout penuh: TopBar gelap (logo ATLAS-Web, nama KAP "KAP Andini & Rekan",
klien "PT Semen Nusantara Tbk (FY2025)", badge SAK, tombol Ctrl+K, live
timer "01:24:37", auto-save badge "Tersimpan otomatis", user switcher
avatar "AS — Partner"). KIRI: SidebarTree w-72 bg-slate-100 dengan input
"Filter indeks..." dan folder accordion: Part 0 Core, Modul A1
Pra-Perikatan (A110 Penerimaan Klient ●, A120 Jam Jasa ◐, A150
Independensi ✓), Modul A2 Penilaian Risiko (A210 Materialitas ◐ aktif/
selected, A220 Analitis ○), Modul B Core (B100 WSTB & FS), Lead Schedules
(▶ 45+ pos), Modul C Pelaporan (C400 Opini & LAI 🔒). tiap baris: ikon
status + kode mono + nama + inisial sign-off kecil "P:AS | R:BD".
TENAN/KANAN: StickyWorkpaperHeader putih ("A210 — Materialitas Awal",
badge Draft amber, metadata Prep/Rev, tombol Simpan, Mark Prepared,
Review Sign-Off, Partner Lock disabled), lalu area kerja kosong placeholder.
BAWAH: CollapsibleBottomDrawer bg-slate-50 border-t dengan tab
"Review Notes (2 Open)" | "Audit Trail & Log Sign-Off", tampilkan 2 note
dummy ber-badge Open (rose) dan Addressed (emerald).

SCREEN 3 — "Isi KKP: A210 Materialitas":
Di dalam shell yang sama (sidebar boleh disamarkan/dipendek), workspace
berisi: 4 KPI summary cards grid (Materialitas Sementara Rp 2.500.000.000,
Performmateriality Rp 1.875.000.000, Batas Kesalahan Tertoleransi Rp
62.500.000, Benchmark: Laba Sebelum Pajak 10%) — kartu bg-slate-50/70
border rounded p-3, label uppercase 11px, nilai besar mono rata. Di
bawahnya tabel komparatif perhitungan materialitas 3 kolom angka (FY2025,
FY2024, %) sticky header bg-slate-100, baris TOTAL bg-slate-100 font-bold
border-b-2, sel angka mono tabular rata kanan. Satu sel negatif tampil
"(450.000.000)" warna rose-700.

SCREEN 4 — "WSTB 12 Kolom (B100)":
Tabel Trial Balance sangat padat 12 kolom: Kode Akun mono, Nama Akun,
Saldo Pembukuan, AJE Dr, AJE Cr, RJJE Dr, RJJE Cr, Saldo Diaudit Dr, Cr,
Reclass, Referensi Lead (link biru mono seperti L10-Kas), Diff. Minimal 8
baris akun dummy (1101 Kas & Bank, 1301 Piutang Usaha, dst) + baris TOTAL.
Kolom Ref bertaut chip kecil. Baris terakhir saldo diaudit beda 0 → centang
emerald.

SCREEN 5 — "Matriks RoMM (A270)":
Heatmap 3x3 grid risiko (Kemungkinan × Dampak) sel berwarna green→amber→
red, titik-titik labelled assertion (CI-Cash, O-A/R, E-Inv) diposisikan di
sel, plus tabel daftar risiko samping kiri dengan badge Low/Moderate/High
(emerald/amber/rose) dan kolom Respon (link indeks Lead Schedule).

SCREEN 6 — "Command Palette + Partner Lock State":
Overlay modal CommandPalette gelap translucient (bg-black/50) di atas
workspace blur: kotak search "> A2" dengan hasil (A210 Materialitas Awal,
A220 Prosedur Analitis, A270 Matriks RoMM) + section Aksi Cepat (Export
.atlas.json, Buka Hub). Lalu tunjukkan varian StickyWorkpaperHeader saat
status Locked: banner hijau emerald-50 teks "Mode Baca-Saja (SA 230):
Kertas kerja ini telah dikunci final. Seluruh input dinonaktifkan." dengan
semua input terlihat disabled (bg-slate-100 cursor-not-allowed).

Berikan seluruh HTML lengkap dalam satu blok kode, siap disimpan sebagai
mockup.html dan dibuka di browser.
```

---

## PROMPT PENDEK (untuk generator gambar: Midjourney / DALL·E / Ideogram)

```text
Enterprise audit software UI mockup, CaseWare Working Papers style, dense
professional desktop web app, Indonesian language labels. Dark slate top
bar, light slate-100 left sidebar with index tree (A1, A2, B, C folders,
small status icons and colored badges: amber draft, blue prepared, green
locked), white workpaper canvas with financial 12-column trial balance
table, monospace right-aligned tabular numbers, small KPI cards, collapsible
bottom drawer with review notes tabs. Neutral slate enterprise palette,
indigo primary buttons, rose alerts. High information density, sharp
corners, compact 13px typography, no consumer-style whitespace. Figma shot,
crisp, realistic screenshot --ar 16:10
```

---

## PROMPT PER-SCREEN (kalau ingin satu screen saja, misal untuk v0.dev)

**Hub Perikatan:**
```text
Buat React+Tailwind page "Engagement Hub" untuk aplikasi kertas kerja audit
IAPI: top bar bg-slate-900 (ATLAS-Web, KAP Andini & Rekan, user switcher
Partner), tab Perikatan|Master Klien|Personil KAP|Profil KAP, search +
filter SAK chips, grid kartu engagement dummy (PT Semen Nusantara Tbk
FY2025) dengan progress ring 62%, badge fase A1✓ A2◐ B○ C🔒, "3 Review
Notes Open" rose badge, tombol indigo-700 "Buka Kertas Kerja". Data dummy,
tanpa logika.
```

**Shell Workspace:** *(gunakan Screen 2 dari Master Prompt di atas — sudah berdiri sendiri)*

**Lead Schedule / Sampling:**
```text
Buat mockup Tailwind "L02 Lead Schedule: Kas & Bank" bergaya CaseWare:
header indeks + badge Prepared biru, tabel prosedur audit kompak (No,
Prosedur, Hasil, Ref, Tanda Tangan P/R), sub-tab Sampling dengan KPI card
(Ukuran Sampel 25, Interval 40, Confidence 95%), daftar sampel mono rata
kanan, footer total tie-out ✓ emerald. Statis, dummy data.
```

---

## Catatan implementasi untuk branch `feature/ui-ux-redesign`

Setelah mockup disetujui, perubahan nyata di repo ini akan menyentuh:
- `src/index.css` + `index.html` → palet/font baru (design tokens).
- `src/components/layout/*` → TopBar, SidebarTree, StickyWorkpaperHeader, BottomDrawer, CommandPalette (5 komponen shell wajib sesuai `01_CASEWARE_UI_DESIGN_SYSTEM.md`).
- `src/components/hub/EngagementHubPortal.tsx` → tampilan Hub (kartu perikatan, tab).
- Pola modul di `phase_a/b/c` mengikuti pola KPI Cards, Tabel Komparatif, dan Kuesioner dari master prompt.

Dokumen acuan yang sudah ada di repo dan sebaiknya dibaca AI saat eksekusi:
`src/assets/docs_ai_studio/01_CASEWARE_UI_DESIGN_SYSTEM.md`, `PRD_0_Core_Hub_RBAC.md`.
