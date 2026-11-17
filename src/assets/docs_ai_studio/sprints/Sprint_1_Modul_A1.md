# Sprint 1 — Modul A1: Pre-Engagement (`A110`–`A170`)

**Referensi Wajib:**
- `docs_ai_studio/prd/PRD_1_Modul_A1_PreEngagement.md`
- `docs_ai_studio/blueprint/part1_a1_pre_engagement.json`
- `docs_ai_studio/02_BLUEPRINT_JSON_CONTRACT.md`
- `docs_ai_studio/03_TYPESCRIPT_DATA_MODELS.md`

---

## 1. Tujuan Sprint 1
Mengimplementasikan seluruh 22 sheet Modul A1 ke dalam komponen React TypeScript interaktif di `src/components/phase_a/`, lengkap dengan evaluasi risiko otomatis 7 kriteria, modal regulasi PMK 55/155 (`A1102.1A`–`D`), kalkulator jam jasa 7 jam/hari (`A120`), matriks independensi (`A150`), dan generator dokumen `.docx` (`A130` & `A140`) menggunakan library `docx`.

---

## 2. Prompt Siap Pakai untuk Google AI Studio (Build Mode)

```text
Lanjutkan pengembangan ATLAS-Web untuk Sprint 1 (Modul A1: Pre-Engagement) mengacu pada:
- docs_ai_studio/prd/PRD_1_Modul_A1_PreEngagement.md
- docs_ai_studio/blueprint/part1_a1_pre_engagement.json
- docs_ai_studio/02_BLUEPRINT_JSON_CONTRACT.md

Bangun komponen dan utilitas berikut (patuhi SA 230 Read-Only Lock Guard & Zero-Hardcode KAP):
1. A110Dashboard.tsx: 7 kartu kriteria risiko otomatis (Jenis Usaha, Kepemilikan, SAK, A1101, A1102/A1102.1, A1103A/B, dan A1105 kondisional), dropdown 4 kondisi pelaporan lalu (A110.I25), keputusan YA/TIDAK, dan validasi wajib isi mitigasi >= 50 karakter jika Risiko Gabungan = High & Keputusan = YA.
2. A1101PriorIssues.tsx & A1102Integrity.tsx: kuesioner lengkap (6 butir A1101, 9 butir A1102) dengan opsi Ya/Tidak/Tidak Berlaku. Field q6IndikasiTppu di A1102 harus read-only dan otomatis sinkron dari A1102.1.
3. A1102_1AmlAssessment.tsx: 4 kategori regulasi APU-PPT PMK 55/2017 & PMK 155/2017 (Profil Pengguna Jasa, Yurisdiksi Negara, 13 Sektor Bisnis, 9 Produk Finansial) + Modal/Drawer Referensi Regulasi (A1102.1A, A1102.1B, A1102.1C, A1102.D) yang diekstrak dari blueprint JSON.
4. A1103TeamEvaluation.tsx: Tab berurutan A1103A (kompetensi 5 aspek & 6 batasan waktu maks 15 personel) -> A1103B (4 ancaman independensi, struktur manajemen klien, & penunjukan tim final yang sinkron ke A120, A140, A150).
5. A1105Predecessor.tsx & A170OpeningBalance.tsx: hanya tampil dan aktif sesuai aturan visibilitas kondisional Perikatan Tahun Pertama di PRD_1.
6. A120TimeBudget.tsx: kalkulator hari efektif (kalender - weekend - libur nasional) x 7 jam/hari, matriks alokasi jam per peran & 3 tahapan, serta validasi agar rencana jam tidak melebihi kapasitas.
7. A130EngagementLetter.tsx, A140AssignmentLetter.tsx, A150Independence.tsx, A160TeamComm.tsx, Asm2View.tsx:
   - A150 memuat matriks tanda tangan deklarasi per anggota tim (Pending/Signed/Declined); blokir Sign-Off Prepared jika masih ada Pending.
   - Buat src/services/export/docxEngagementLetters.ts menggunakan library `docx` + `file-saver` untuk generate Surat Perikatan (A130.docx) dan Surat Tugas (A140.docx) dengan identitas KAP dinamis dari state.kapProfile.
```

---

## 3. Kriteria Penerimaan Sprint 1
1. Mengubah `tipePerikatan` atau `A110.kriteriaIsuTerdahulu` langsung menampilkan/menyembunyikan `A1105` dan `A170` di `SidebarTree`.
2. Jika `A110` berisiko `High` dan keputusan `YA`, `Sign-Off Prepared` terblokir sebelum `mitigasiRisiko` $\ge 50$ karakter.
3. `A130.docx` dan `A140.docx` berhasil diunduh di browser dengan kop surat dari `state.kapProfile`.
4. Seluruh angka jam dan honorarium di `A120` menggunakan `font-mono tabular-nums text-right`.
