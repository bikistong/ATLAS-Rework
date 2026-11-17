# Sprint 4 — Modul B: Dynamic Lead Schedules (`L02`–`L47`) & ISA Sampling

**Referensi Wajib:**
- `docs_ai_studio/prd/PRD_4_Modul_B_Leads_ISA.md`
- `docs_ai_studio/blueprint/part4_b_lead_schedules.json`
- `docs_ai_studio/blueprint/part3_b_core_wstb_fs.json` (untuk katalog `prosedur horizontal`)
- `docs_ai_studio/02_BLUEPRINT_JSON_CONTRACT.md`

---

## 1. Tujuan Sprint 4
Membangun mesin **Dynamic Lead Schedule (`L02`–`L47`)** dan **Kalkulator Sampling Audit ISA SA 530** di `src/components/phase_b/` serta engine ekspor `.xlsx` 3-tab di `src/services/export/xlsxWorkpapers.ts`.

---

## 2. Prompt Siap Pakai untuk Google AI Studio (Build Mode)

```text
Lanjutkan pengembangan ATLAS-Web untuk Sprint 4 (Modul B Dynamic Lead Schedules & ISA Sampling) mengacu pada:
- docs_ai_studio/prd/PRD_4_Modul_B_Leads_ISA.md
- docs_ai_studio/blueprint/part4_b_lead_schedules.json
- docs_ai_studio/blueprint/part3_b_core_wstb_fs.json

Bangun komponen dan logika berikut (patuhi Anti-Bug #1 Keseragaman leadCode & Prioritas Numerik RoMM, serta SA 230 Lock Guard):
1. DynamicLeadScheduleView.tsx (untuk seluruh 45 pos L02..L47 + custom lead schedule):
   - Header Konteks Risiko Real-Time: tarik RoMM langsung dari A270 (berdasarkan leadCode yang seragam: L02 Kas, L05 Piutang, L06 Persediaan, L09 Uang Muka, L13 Aset Tetap, L14 Akum. Penyusutan, L17 Utang Usaha, L20 Utang Bank Jk. Pendek, L26 Utang Pajak/Akrual, L28 Utang Bank Jk. Panjang, L32 Modal, L34 Saldo Laba, L37 Penjualan, L39 HPP, L41 Beban Operasional, L46 Beban Bunga) dan PM dari A210.
   - Tab 1 (Akun & Mutasi): filter otomatis TrialBalanceAccount yang memiliki account.leadCode === currentLeadCode, tampilkan Unaudited, AJE, RJE, Audited, Prior Audited.
   - Tab 2 (Program Prosedur Substantif SAP/TOD): seed program prosedur dari part4_b_lead_schedules.json (sheet 2.1..47.1) & prosedur horizontal (part3). Status: Belum Dilaksanakan | Dilaksanakan | Tidak Dilaksanakan | Tidak Aplikabel, plus PIC, Ref KKP, Simpulan, dan tombol "+ Tambah Prosedur Khusus".
   - Tab 3 (Kalkulator Sampling ISA SA 530):
     * Matriks 9 Confidence Factor (RoMM High/Moderate/Low x SAP Assurance High/Moderate/No -> CF 0.9 s.d. 3.0).
     * Rumus: SamplingInterval = PM / CF; TestedPopulation = TotalPopValue - SpecificItems; SampleSize = Math.ceil(TestedPopulation / SamplingInterval).
     * Tabel Vouching Sampel: input BVS, AVS, otomatis hitung factualMisstatement = BVS - AVS.
     * Proyeksi Salah Saji: Metode Rasio (BVP - BVP * (sumAVS / sumBVS)) dan Metode Difference ((sum(BVS-AVS)/n) * N_pop).
     * Alert merah jika |ProjectedMisstatement| >= PM dan tombol "Kirim ke SAD (C100)".
   - Simpulan Akhir Pos Akun (4 opsi baku ATLAS).
2. Buat src/services/export/xlsxWorkpapers.ts menggunakan SheetJS (`xlsx`) + `file-saver`:
   - Tombol Export Lead Schedule (.xlsx) menghasilkan 3 Tab: Tab 1 Lead_Schedule_{leadCode} (dengan identitas KAP dinamis dari state.kapProfile), Tab 2 Prosedur_Substantif, Tab 3 Sampling_ISA_SA530.
```

---

## 3. Kriteria Penerimaan Sprint 4
1. Seluruh 45 pos `L02`–`L47` dapat dibuka di workspace tanpa error dan menarik mutasi WSTB yang sesuai `leadCode`-nya.
2. Perubahan `RoMM` di `A270` langsung mengubah Confidence Factor rekomendasi di Tab 3 Sampling.
3. Perhitungan `SampleSize` selalu dibulatkan ke atas (`Math.ceil`) dan proyeksi Rasio/Difference akurat 100%.
4. File `.xlsx` 3 tab berhasil diunduh dan terbaca rapi di Excel.
