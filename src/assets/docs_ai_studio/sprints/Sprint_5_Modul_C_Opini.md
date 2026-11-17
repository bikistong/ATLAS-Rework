# Sprint 5 — Modul C: Completing, CALK, EQCR & Opini LAI (`.docx`)

**Referensi Wajib:**
- `docs_ai_studio/prd/PRD_5_Modul_C_Opini_LAI.md`
- `docs_ai_studio/blueprint/part5_c_completing_opini.json` *(Hati-hati: `"Chart1"` bertipe `chartsheet`!)*
- `docs_ai_studio/02_BLUEPRINT_JSON_CONTRACT.md`
- `docs_ai_studio/03_TYPESCRIPT_DATA_MODELS.md`

---

## 1. Tujuan Sprint 5
Menyelesaikan fase akhir audit (Modul C) di `src/components/phase_c/` dan generator Laporan Auditor Independen `.docx` di `src/services/export/docxLaiReport.ts`, mencakup agregasi SAD (`C100`), materialitas akhir SA 320.12 (`C110`), analitis akhir + grafik Recharts (`C120`/`Chart1`), reviu LAI (`C210`), checklist CALK kondisional multi-SAK (`C220`), memorandum 12 pilar (`C230`), gerbang pengaman Partner EQCR (`C300`), dan matriks keputusan 5 opini (`C400` & `OPINI1`–`OPINI5`).

---

## 2. Prompt Siap Pakai untuk Google AI Studio (Build Mode)

```text
Lanjutkan pengembangan ATLAS-Web untuk Sprint 5 (Modul C: Completing, Disclosure, EQCR & Opini LAI) mengacu pada:
- docs_ai_studio/prd/PRD_5_Modul_C_Opini_LAI.md
- docs_ai_studio/blueprint/part5_c_completing_opini.json
- docs_ai_studio/02_BLUEPRINT_JSON_CONTRACT.md (WAJIB pakai type guard isWorksheet() karena Chart1 bertipe chartsheet!)

Bangun komponen dan engine berikut (patuhi SA 230 Lock Guard & Zero-Hardcode KAP):
1. C100SadAggregation.tsx:
   - Agregasi item salah saji faktual, proyeksi sampling, dan pertimbangan (SA 450).
   - Klasifikasikan otomatis item < AMPT Final sebagai Clearly Trivial; bandingkan total SAD >= PM Final untuk memberi peringatan dampak opini.
2. C110FinalMateriality.tsx:
   - Tarik saldoAcuanAudited otomatis dari FS Audited Final (B120).
   - Hitung OM Final, PM Final, AMPT Final dan bandingkan dengan A210.
   - PERINGATAN WAJIB SA 320.12: jika OM Final < OM Awal ATAU PM Final < PM Awal, tampilkan banner merah kritis + wajib isi justifikasi.
3. C120FinalAnalytics.tsx:
   - C120.1 (Horizontal & Common-Size Audited vs Prior), C120.2 (14 Rasio Keuangan Akhir), dan visualisasi Recharts (BarChart Neraca/Laba Rugi & RadarChart/BarChart Rasio) menggantikan Chart1.
4. C210LaiReview.tsx (68 butir reviu kepatuhan draf LAI) & C230FinalMemorandum.tsx (12 pilar risiko terintegrasi dari modul sebelumnya).
5. C220DisclosureChecklist.tsx:
   - Tampilkan HANYA checklist yang sesuai dengan client.sakDigunakan (SAK Umum -> C220A, SAK ETAP -> C220B, SAK EMKM -> C220C, SAK Syariah -> C220D, SAP -> C220E, SAK Lainnya -> C220F) dari part5_c_completing_opini.json & catalog.
   - Sediakan filter per topik, pencarian teks cepat, paginasi/virtualisasi ringan, toggle Ada/Tidak Ada/NA, serta input referensi CALK.
6. C300EqcrGate.tsx (SA 220):
   - Aktif wajib jika a120.isEqcrRequired === true (atau klien Go Publik).
   - Checklist SA 220 + tabel temuan & tindak lanjut (Pending/Resolved).
   - GERBANG PENGAMAN: Selama C300 belum disetujui (Reviewed/Locked) atau masih ada temuan Pending, tombol Generate LAI Final & Partner Lock pada C400 wajib DISABLED.
7. C400OpinionAndLai.tsx & src/services/export/docxLaiReport.ts:
   - Matriks keputusan 5 opini (Q1 Evidence Sufficient, Q2 Material Misstatement, Q3 Pervasive -> OPINI1 s.d. OPINI5). Jika selectedOpinion !== suggestedOpinion, wajib isi overrideJustification.
   - Paragraf tambahan SA 706 (Emphasis of Matter, Other Matter) & SA 570 (Material Uncertainty Going Concern dari B240).
   - Penomoran resmi LAI PPPK/IAPI: NoUrut / KodeSAK (AU-01..AU-06) / KodeCabang / BulanRomawi / Tahun.
   - Generator Word (.docx) menggunakan library `docx` + `file-saver` menghasilkan LAI resmi A4 dengan kop surat KAP dari state.kapProfile dan AP penandatangan dari state.users.
```

---

## 3. Kriteria Penerimaan Sprint 5
1. Membaca `part5_c_completing_opini.json` tidak pernah crash pada key `"Chart1"`.
2. Penurunan `OM Final` atau `PM Final` di `C110` langsung memicu banner peringatan SA 320.12.
3. Checklist `C220` otomatis menampilkan instrumen SAK yang sesuai `client.sakDigunakan`.
4. Ketika `isEqcrRequired === true` dan `C300` belum selesai, tombol penerbitan LAI di `C400` terkunci (`disabled`).
5. Semua 6 kombinasi `Q1-Q2-Q3` memetakan tepat ke `OPINI1`–`OPINI5`, dan file `LAI_{klien}_{tahun}.docx` berhasil diunduh dengan kop KAP dinamis.
