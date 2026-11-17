# Prompt Mockup UI/UX — MODUL A (Pra-Perikatan & Penilaian Risiko) ATLAS-Web

> **Cara pakai:** Tempel prompt ke Claude / v0.dev / Cursor / Lovable untuk hasil HTML/React statis, atau ke Midjourney/DALL·E untuk gambar. Semua screen memakai DESIGN TOKENS yang sama di bawah agar konsisten. Tidak perlu fungsi berjalan — cukup tampilan + data dummy realistis.

---

## DESIGN TOKENS MODUL A (tempelkan di AWAL setiap prompt)

```text
DESIGN SYSTEM "Neutral Slate Enterprise" ala CaseWare Working Papers (IAPI v2.1):
- Bahasa Indonesia, aplikasi desktop-web, lebar konten maks 1440px.
- Kepadatan TINGGI: padding kompak, tabel text-xs/[13px], input h-8, heading text-sm font-semibold. Sudut tajam rounded-sm/rounded (BUKAN rounded-xl), tanpa shadow besar / tanpa whitespace konsumer.
- Font: Plus Jakarta Sans (UI). Semua angka, kode indeks, tanggal, NIB/NPWP = JetBrains Mono tabular-nums rata kanan; negatif dalam kurung merah "(1.250.000)" rose-700.
- Warna dasar: canvas bg-slate-50, kartu bg-white border border-slate-200, header strip kartu bg-slate-50, header tabel bg-slate-100, baris TOTAL bg-slate-100 font-bold border-t-2.
- Status semantik (badge pill px-2 py-0.5 rounded text-[11px] font-semibold):
  Kosong=slate-200 | Draft=amber-100/800 | Prepared=blue-100/800 | Reviewed=sky-100/800 | Partner Locked=emerald-100/800 + gembok | Alert/Open/Pending=rose-100/800 | OK=emerald.
- Primary button indigo-700 (h-8 px-3 text-xs), secondary putih ber-border slate-300, destructive rose-600.
- FORM CONTROL STANDARDS (pola wajib tiap form Modul A):
  * Label field: text-[11px] font-bold uppercase tracking-wider text-slate-500 di atas input.
  * Input/select/textarea: h-8 w-full rounded border-slate-300 bg-white text-[13px] px-2 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500; placeholder text-slate-400. readonly/disabled: bg-slate-100 cursor-not-allowed text-slate-500. Error: border-rose-400 + pesan text-[11px] rose-700 di bawah.
  * Grid form: grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3, label+input vertikal per sel.
  * Checkbox kuesioner Ya/Tidak/N-A: grup segmented 3 tombol kecil (Ya=emerald saat aktif, Tidak=rose, N/A=slate) ATAU checkbox native w-4 h-4 accent-indigo-700; kolom keterangan auto-muncul hanya saat "Tidak".
  * Section dalam satu kertas kerja = kartu terpisah dengan header strip: judul uppercase 11px kiri + aksi kanan (chip jumlah, tombol tambah baris).
  * Gate warning banner di atas form: amber-50 border-amber-300 + ikon ShieldAlert (memblokir Mark Prepared); gate OK: emerald-50.
  * Footer tanda tangan 3 kolom: Prepared / Reviewed / Partner Locked — avatar inisial, nama, jabatan, tanggal mono, status chip.
```

---

## SCREEN A-1 — Engagement Hub + Sidebar Modul A (konteks semua screen di bawah)

```text
[DESIGN TOKENS DI ATAS] + tampilkan shell workspace: TopBar bg-slate-900 (ATLAS-Web · KAP Andini & Rekan · PT Semen Nusantara Tbk FY2025 · badge SAK Umum · Ctrl+K · timer 01:24:37 · "Tersimpan otomatis"). Kiri SidebarTree w-72 bg-slate-100: filter indeks, folder terbuka "Modul A1 Pra-Perikatan": A110 Penerimaan Klient ●Draft, A120 Jam Jasa ◐Prepared, A130 Surat Perikatan ✓Reviewed, A140 Surat Penugasan 🔒Locked, A150 Independensi ●, A160 Komunikasi Tim ○, A170 Saldo Awal ○; folder "Modul A2 Penilaian Risiko": A210 Materialitas ◐(selected, bg-indigo-50 border-l-2 border-indigo-700), A220 Analitis ○, A230 Pemahaman Entitas ●, A240 Risiko Intrinsik ○, A250 Siklus Pengendalian ○, A260 Komunikasi Tata Kelola ○, A270 Matriks RoMM ◐, A280 Update Strategi ○. Tiap baris: ikon status + kode mono + nama + sign-off mini "P:AS R:BD". Bawah: drawer Review Notes (2 Open rose, 1 Addressed emerald).
```

---

## SCREEN A-2 — A110 Penerimaan & Keberlanjutan Klient (form checklist multi-seksi)

```text
[DESIGN TOKENS] Isi workspace "A110 — Evaluasi Penerimaan & Keberlanjutan Klient", badge Draft amber + tombol Simpan / Mark Prepared (disabled opacity-50 karena gate). Struktur dari atas ke bawah:
1) Banner gate amber-50: "ShieldAlert · 3 pertanyaan Ya belum dijelaskan — Mark Prepared diblokir."
2) Kartu Header Identitas: grid 4 kolom — Nama Klien (mono), NPWP (mono 02.555.123.4-072.000), Sektor Industri (select), Tahun Buku (select FY2025), Tipe Klien chips "Berjalan (Recurring)" emerald vs "Baru" , Sumber Rekomendasi.
3) Kartu Checklist SA 220 §19 (pertanyaan penerimaan): tabel rapat kolom [No mono w-10, Pertanyaan, Jawaban segmented Ya/Tidak/N-A, Penjelasan/Risiko]. 6 baris dummy: reputasi manajemen, kepemilikan pengendali, tujuan dana, kompleksitas struktur, kapasitas SDM audit, independensi tim. Baris No.3 dan No.5 dijawab "Tidak" → segmen rose aktif + kolom Penjelasan terisi teks merah muda latar rose-50 + ikon flag.
4) Kartu ASM 2 (Anti Pencucian Uang): sub-checklist 4 item + hasil akhir chip "Risiko Rendah" emerald, tanggal screening mono 2025-01-12, peninjau "BD".
5) Kartu Riwayat Perselisihan: tabel kosong state "Tidak ada temuan perselisihan — 0 catatan" dengan ikon check emerald.
6) Footer 3 kolom tanda tangan + link "Lihat trail sign-off".
Gaya: seluruhnya white card border-slate-200, header strip bg-slate-50 uppercase 11px, row height ±32px.
```

---

## SCREEN A-3 — A120 Anggaran Waktu & Fee (form numerik + progress)

```text
[DESIGN TOKENS] "A120 — Perencanaan Jam Kerja & Anggaran". Layout dua zona:
KIRI (65%): Tabel anggaran per level personel — kolom [Level (Staff/Senior/Manager/Partner), Jam Dianggarkan (input mono), Realisasi (mono), % (bar mini), Fee/Hour Rp (mono rata kanan), Subtotal (mono)]. 4 baris + TOTAL bold bg-slate-100. Sel realisasi > anggaran tampil rose "(over 12 jam)". Di bawahnya kartu "Utilisasi vs Target": 3 KPI cards (Total Jam 1.240 / Anggaran 1.400, Utilisasi 88%, Est. Fee Rp 425.000.000).
KANAN (35%): Form alokasi milestone per fase: stepper vertikal A1→A2→B→C dengan progress bar tipis indigo-700 per fase + input jam per fase; chip "Deadline LAI: 28 Feb 2026" mono.
Footer: gate info emerald "Anggaran tersinkron dengan A140 Penugasan" + 3 kolom sign-off.
```

---

## SCREEN A-4 — A130 Surat Perikatan & A140 Surat Penugasan (dokumen + matriks tim)

```text
[DESIGN TOKENS] DUA artboard berdampingan:
(A130) Viewer dokumen surat: panel kiri preview halaman A4 putih border slate-300 berisi surat perikatan standar IAPI (kop KAP, alamat, perihal, paragraf, blok tanda tangan klien & partner digarisbawahi); panel kanan form metadata: Nomor Surat mono SL-2025/0034, Tanggal Efektif (date input), Versi select v2.0, Lampiran chips (CSFA, Ketentuan Pembayaran), riwayat versi tabel kecil [v, tanggal, diubah oleh, status]; tombol "Generate PDF" indigo-700 + "Tandai Ditandatangani Klien" outline. Badge Partner Locked emerald + banner read-only bg-emerald-50: "Mode Baca-Saja (SA 230): terkunci final, seluruh input dinonaktifkan" — semua input tampak disabled bg-slate-100.
(A140) Matriks Penugasan Tim: tabel [Nama Personel, Peran select (Engagement Partner/EQR/Manager/Senior/Staff), Alokasi Jam (mono), % Beban (bar), Konflik Independensi chip]. Baris EQR "Rina Wulandari" chip rose "Independensi Pending" + tooltip box. Kolom aksi ikon pencil/trash kecil. Tombol "+ Tambah Personel" dashed border-slate-300 full-width. KPI atas: Headcount 7, Total Jam 1.240, Kapasitas Terpakai 88%.
```

---

## SCREEN A-5 — A150 Pernyataan Independensi (matriks deklarasi per personel)

```text
[DESIGN TOKENS] "A150 — Reviu Pernyataan Independensi Tim". Kartu pembuka: banner gate emerald-50 "CheckCircle2 · Seluruh tim telah menandatangani deklarasi" (varian kedua: banner amber "2 personel Pending — Mark Prepared diblokir"). Tabel utama matriks deklarasi: kolom [Nama Personel, Peran, Status chip (Signed emerald / Pending amber / Declined rose), Metode TTD select (Digital Signature / Manual Scan), Tanggal TTD mono, Bebas Konflik? Ya/Tidak segmented, Catatan Konflik]. 7 baris dummy; 1 baris "Tidak" → cell Catatan terisi "Kepemilikan saham <1% via reksadana — mitigasi: rotasi" + link indeks "→ A160 nota komunikasi". Baris selected highlight ring-1 ring-indigo-500.
Di bawahnya kartu Checklist Klausul Etik (legalChecklists A150): daftar centang 2 kolom klausul ETAP/IPIECA dengan checkbox accent-indigo, progres "12/14 terpenuhi" + bar tipis.
Footer 3 kolom sign-off + timestamp mono.
```

---

## SCREEN A-6 — A210 Materialitas (KPI + tabel komparatif — form perhitungan)

```text
[DESIGN TOKENS] "A210 — Materialitas Awal & Performans". Bagian atas: 4 KPI cards grid (label uppercase 11px slate-500, nilai besar mono rata kanan): Benchmark "Laba Sebelum Pajak", Materialitas Sementara Rp 2.500.000.000, Performa Rp 1.875.000.000, PMU/Tolerable Rp 62.500.000; salah satu kartu punya ikon recalculating spinner slate-400. Tengah: form parameter 1 baris — select Benchmark, input % (10%), input faktor haircut (75%) h-8 + tombol "Hitung Ulang" indigo-700. Bawah: tabel komparatif 3 kolom angka [FY2025, FY2024, Δ%] baris Laba, Pendapatan, Total Aset, Ekuitas + TOTAL bold; sel negatif "(450.000.000)" rose-700 mono; sticky header bg-slate-100. Sidebar kanan kecil: pemilih pendekatan (Pendapatan / Laba / Aset) radio list + catatan rationale textarea rows=3 placeholder "Jelaskan pemilihan benchmark…". Badge Draft + gate "Materialitas harus Prepared sebelum modul B dibuka".
```

---

## SCREEN A-7 — A270 Matriks RoMM (heatmap risiko + register)

```text
[DESIGN TOKENS] "A270 — Matriks Risk of Material Misstatement". Grid 2 zona:
KIRI: Heatmap 3×3 sumbu Kemungkinan (vertikal Rendah/Moderat/Tinggi) × Dampak (horizontal) — sel gradasi emerald-100→amber-100→rose-200 sesuai skor, titik label assertion font-mono 10px (CI-Cash, O-A/R, E-Inv, V-AR) diposisikan; legend skala warna bawah; hover state (satu sel ditandai ring + tooltip box gelap: "R: Tinggi × D: Sedang → Skor 6 → RMM Signifikan, butuh respons khusus").
KANAN: Register risiko tabel padat [ID mono R-01.., Assertion, Deskripsi Risiko, Inherent (chip), Control Risk, RMM badge Low/Moderate/High emerald/amber/rose, Respon → link indeks mono "L05-Piutang"]. Row height 28px, zebra slate-50. Toolbar: filter chips + "+ Tambah Risiko".
Footer sign-off + note "Matriks mengunci A280 Update Strategi bila RMM High tanpa respon".
```

---

## PROMPT PENDEK (generator gambar, semua Modul A sekaligus)

```text
Enterprise audit software UI, Indonesian language, CaseWare style working
papers, Modul A screens: client acceptance checklist table with Ya/Tidak
segmented answers and amber gate banners, time-budget numeric tables with
progress bars, engagement letter document viewer with locked green banner,
independence signature matrix per staff member, materiality KPI cards with
monospace right-aligned Rupiah figures, 3x3 risk heatmap matrix green to
red. Dense 13px typography, sharp corners, slate-900 dark top bar, light
sidebar index tree with status dots, white cards, indigo buttons, rose
alerts. Figma shot, realistic screenshot --ar 16:10
```

---

## Peta implementasi nyata (branch `feature/ui-ux-redesign`)

| Screen | Komponen target |
|---|---|
| A-2 | `src/components/phase_a/A110Dashboard.tsx`, `A1101PriorIssues.tsx`, `A1102Integrity.tsx`, `A1102_1AmlAssessment.tsx` |
| A-3 | `A120TimeBudget.tsx` |
| A-4 | `A130EngagementLetter.tsx`, `A140AssignmentLetter.tsx` |
| A-5 | `A150Independence.tsx`, `A1103TeamEvaluation.tsx`, `A160TeamComm.tsx`, `Asm2View.tsx` |
| A-6 | `A210Materiality.tsx` |
| A-7 | `A270RommMatrix.tsx`, `A240InherentRisk.tsx`, `A280StrategyUpdate.tsx` |
| Shell/konteks | `src/components/layout/*` + `EngagementHubPortal.tsx` |

Urutan kerja disarankan: setujui dulu DESIGN TOKENS + pola form control → tiru 1 screen kunci (A-2 A110) sebagai mother pattern → baru replicate ke sisa Modul A.
