# Sprint 2 — Modul A2: Risk Assessment Engine (`A210`–`A280`)

**Referensi Wajib:**
- `docs_ai_studio/prd/PRD_2_Modul_A2_RiskEngine.md`
- `docs_ai_studio/blueprint/part2_a2_risk_assessment.json`
- `docs_ai_studio/02_BLUEPRINT_JSON_CONTRACT.md`
- `docs_ai_studio/03_TYPESCRIPT_DATA_MODELS.md`

---

## 1. Tujuan Sprint 2
Membangun mesin penilaian risiko (Modul A2) di `src/components/phase_a/` dan `src/utils/auditFormulas.ts`, meliputi kalkulator materialitas SA 320 dengan saldo acuan dinamis dari FS klien aktif, analitis awal & rasio (`A220`), pemahaman entitas & Fraud Risk SA 240 (`A230`), akun signifikan (`A240`), 13 siklus pengendalian + walk-through (`A250`), komunikasi TCWG/SPI (`A260`), matriks deterministik `IR × CR = RoMM` (`A270`) dengan prioritas numerik, serta generator `.docx` ASM Update (`A280`).

---

## 2. Prompt Siap Pakai untuk Google AI Studio (Build Mode)

```text
Lanjutkan pengembangan ATLAS-Web untuk Sprint 2 (Modul A2: Risk Assessment) mengacu pada:
- docs_ai_studio/prd/PRD_2_Modul_A2_RiskEngine.md
- docs_ai_studio/blueprint/part2_a2_risk_assessment.json

Bangun komponen dan logika berikut (patuhi 4 Aturan Anti-Bug & SA 230 Lock Guard):
1. A210Materiality.tsx:
   - 8 opsi benchmark saldo (A210.J29) & 6 opsi karakteristik entitas (A210.AF16:AM18).
   - ATURAN ANTI-BUG #3: nilaiSaldoAcuan WAJIB ditarik dinamis dari agregasi FS/WSTB klien aktif sesuai benchmark terpilih (bukan angka hardcode).
   - Kalkulasi OM, PM (validasi rentang 50%-80%, jika di luar wajib pertimbangan >= 100 char), AMPT (maks 5% dari PM), plus form dokumentasi pertimbangan OM.
2. A220Analytics.tsx:
   - A220.1: Tabel Analisis Horizontal (flag merah jika |delta| >= PM DAN |delta%| >= 20%) & Vertikal Common-Size.
   - A220.2: Kalkulator 13 rasio keuangan (Likuiditas, Solvabilitas, Profitabilitas, Aktivitas) + grafik Recharts.
   - PREANALITICAL: Ringkasan analitis awal.
3. A230EntityUnderstanding.tsx:
   - Sub-tab A230.1 s.d. A230.8 dengan opsi dropdown baku per sub-indeks.
   - A230.7 (Fraud Risk SA 240): jika dijawab "Ya", tandai isFraudRisk = true pada akun terdampak.
   - A230.8: Pemetaan akun terdampak menggunakan leadCode seragam (L02..L47).
4. A240InherentRisk.tsx:
   - Otomatis tandai Akun Signifikan (terkunci) jika |saldoBerjalan| >= PM.
   - Matriks penilaian Inherent Risk 5 asersi (C, E, A&C, V, P&D) bernilai Low/Moderate/High.
5. A250ControlCycles.tsx:
   - Grid 13 siklus (A250.1 s.d. A250.13) + form item walk-through (frekuensi, WCGW, tipe aktivitas, desain Sesuai/Tidak sesuai, TOC Efektif/Tidak Efektif/Tidak Berlaku, dampak asersi) dengan kalkulasi CR otomatis.
6. A260GovernanceComm.tsx: Sub-indeks A2701 (TCWG SA 260) & A2702 (SPI SA 610) dengan simpulan baku.
7. A270RommMatrix.tsx:
   - Kalkulasi deterministik IR x CR = RoMM per asersi.
   - Jika isSignificantRisk atau Fraud Risk SA 240 aktif, paksa RoMM = 'High'.
   - ATURAN ANTI-BUG #1: Hitung overallRomm menggunakan ROMM_PRIORITY ({ High: 3, Moderate: 2, Low: 1 }), DILARANG sort alfabetis.
8. A280StrategyUpdate.tsx & src/services/export/docxAuditStrategy.ts:
   - Dashboard sintesis A210-A270 + tombol Export ASM Update (.docx) via library `docx` + `file-saver`.
```

---

## 3. Kriteria Penerimaan Sprint 2
1. Mengubah Trial Balance/FS langsung memperbarui `nilaiSaldoAcuan` di `A210`.
2. Nilai `AMPT > 5%` ditolak, dan `PM` di luar `50%–80%` memicu peringatan wajib justifikasi.
3. `overallRomm` selalu memprioritaskan `High (3) > Moderate (2) > Low (1)`.
4. Perubahan `IR` di `A240` atau `CR` di `A250` langsung memperbarui matriks `A270` secara real-time.
5. Dokumen `ASM_Update_{klien}.docx` berhasil diunduh dengan identitas KAP dari `state.kapProfile`.
