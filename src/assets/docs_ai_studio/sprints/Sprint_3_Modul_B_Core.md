# Sprint 3 — Modul B Core: TB Importer, AJE/RJE, WSTB, FS & `B210`–`B280`

**Referensi Wajib:**
- `docs_ai_studio/prd/PRD_3_Modul_B_WSTB_FS.md`
- `docs_ai_studio/blueprint/part3_b_core_wstb_fs.json`
- `docs_ai_studio/02_BLUEPRINT_JSON_CONTRACT.md`
- `docs_ai_studio/03_TYPESCRIPT_DATA_MODELS.md`

---

## 1. Tujuan Sprint 3
Membangun mesin pembukuan audit dan pelaporan keuangan Modul B Core di `src/components/phase_b/` dan `src/services/export/`, mencakup import & validasi TB Excel/CSV via SheetJS (`xlsx`), jurnal double-entry `AJE`/`RJE`, Working Trial Balance 12 kolom (`B100`), generator 4 Laporan Keuangan (`B120`) dengan validasi `NERACA BALANCED`, ekspor `.docx` & `.xlsx`, serta 8 prosedur khusus `B210`–`B280`.

---

## 2. Prompt Siap Pakai untuk Google AI Studio (Build Mode)

```text
Lanjutkan pengembangan ATLAS-Web untuk Sprint 3 (Modul B Core) mengacu pada:
- docs_ai_studio/prd/PRD_3_Modul_B_WSTB_FS.md
- docs_ai_studio/blueprint/part3_b_core_wstb_fs.json

Bangun komponen dan engine berikut (patuhi SA 230 Lock Guard & Anti-Bug #1/#3):
1. TrialBalanceImporter.tsx:
   - Upload file .xlsx atau .csv di browser menggunakan SheetJS (`XLSX.read`).
   - Validasi Pra-Impor: (a) Deteksi duplikat kodeAkun (tolak jika ada duplikat), (b) Cek keseimbangan awal (Total Debit - Total Kredit === 0).
   - UI pemetaan 3-tingkat (Group Akun, Kelompok Akun, Header Akun & leadCode seragam L02..L47) serta penandaan akun penutup Laba Tahun Berjalan & OCI.
2. JournalsAjeRje.tsx:
   - Form input jurnal double-entry AJE / RJE dengan status Proposed / Accepted / Rejected.
   - Penomoran otomatis AJE-001, RJE-001, dst.
   - Validasi mutlak: tombol Simpan dinonaktifkan jika Total Debit !== Total Kredit atau keterangan < 20 karakter.
3. Wstb12Col.tsx (B100 / WSTB-FINAL):
   - Tabel 12 kolom (kodeAkun, namaAkun, headerAkun, unaudited Dr/Cr, aje Dr/Cr, rje Dr/Cr, audited Dr/Cr, priorAudited) dengan format angka rata kanan `font-mono tabular-nums text-right` dan kurung negatif `(1,250,000)`.
   - Hanya jurnal berstatus 'Accepted' yang masuk ke mutasi Audited. Klik mutasi untuk drill-down daftar jurnal terkait.
   - Tombol Export WSTB (.xlsx) via SheetJS.
4. FinancialStatementsB120.tsx (B120 / FS):
   - 4 Tab: Laporan Posisi Keuangan (Neraca), Laba Rugi & OCI, Perubahan Ekuitas, dan Arus Kas (Metode Tidak Langsung).
   - Validasi NERACA BALANCED: tampilkan badge hijau "NERACA BALANCED" jika Total Aset === Total Liabilitas + Ekuitas; jika tidak seimbang, tampilkan selisih merah dan blokir Sign-Off Reviewed pada B100 & B120.
   - Buat src/services/export/docxFinancialStatements.ts (library `docx` + `file-saver`) untuk ekspor 4 LK Audited (.docx) dengan identitas KAP dari state.kapProfile.
5. SpecialProceduresB210_B280.tsx:
   - Implementasikan 8 KKP khusus: B210 (SA 540), B220 (SA 550 + Register Pihak Berelasi), B230 (SA 560 Type 1/Type 2), B240 (SA 570 Going Concern), B250 (SA 580), B260 (SA 620), B270 (SA 500), B280 (SA 501).
   - VALIDASI WAJIB B250 (SA 580): tanggalSuratRepresentasi harus sama persis dengan header.tanggalLaporanAuditor; jika berbeda, tampilkan alert merah dan blokir Sign-Off Prepared.
   - Sertakan tombol "Propose AJE from Procedure" yang membuka modal AJE dengan referensi KKP terisi otomatis.
```

---

## 3. Kriteria Penerimaan Sprint 3
1. Upload TB dengan kode akun duplikat atau selisih Debit $\ne$ Kredit ditolak sebelum masuk ke store.
2. Jurnal `AJE`/`RJE` tidak seimbang tidak bisa disimpan; jurnal `Accepted` langsung memperbarui WSTB, 4 Laporan Keuangan, dan saldo acuan materialitas `A210`.
3. Badge `NERACA BALANCED` menyala hijau ketika $\text{Aset} === \text{Liabilitas} + \text{Ekuitas}$.
4. `B250` memblokir Sign-Off jika `tanggalSuratRepresentasi !== header.tanggalLaporanAuditor`.
5. Ekspor `WSTB.xlsx` dan `LK_Audited.docx` berjalan murni di browser tanpa error.
