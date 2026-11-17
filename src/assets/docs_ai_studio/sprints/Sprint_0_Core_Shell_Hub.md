# Sprint 0 — Core Shell, Hub Perikatan, RBAC & Local-First Store

**Referensi Wajib:**
- `docs_ai_studio/00_AI_STUDIO_ARCHITECTURE.md`
- `docs_ai_studio/01_CASEWARE_UI_DESIGN_SYSTEM.md`
- `docs_ai_studio/02_BLUEPRINT_JSON_CONTRACT.md`
- `docs_ai_studio/03_TYPESCRIPT_DATA_MODELS.md`
- `docs_ai_studio/prd/PRD_0_Core_Hub_RBAC.md`
- `docs_ai_studio/blueprint/part0_core_general.json`

---

## 1. Tujuan Sprint 0
Membangun fondasi aplikasi **ATLAS-Web** 100% browser-native (React 18+ TypeScript, Vite, Tailwind CSS, Lucide React) lengkap dengan *3-Zone Split-Pane CaseWare Shell*, Hub Manajemen KAP/Klien/Perikatan, Store `localStorage` + `IndexedDB` + Export/Import `.atlas.json`, serta keempat aturan anti-bug sejak hari pertama.

---

## 2. Prompt Siap Pakai untuk Google AI Studio (Build Mode)

```text
Baca dokumen referensi di docs_ai_studio/:
1. 00_AI_STUDIO_ARCHITECTURE.md
2. 01_CASEWARE_UI_DESIGN_SYSTEM.md
3. 02_BLUEPRINT_JSON_CONTRACT.md
4. 03_TYPESCRIPT_DATA_MODELS.md
5. prd/PRD_0_Core_Hub_RBAC.md
6. blueprint/part0_core_general.json

Tugas Sprint 0 — Bangun Core Platform & CaseWare Shell:
1. Setup dependencies NPM: lucide-react, recharts, docx, xlsx, file-saver (plus @types/file-saver). Pastikan tsconfig.json mengaktifkan resolveJsonModule: true.
2. Salin seluruh TypeScript interfaces & ROMM_PRIORITY dari 03_TYPESCRIPT_DATA_MODELS.md ke src/types/atlas.ts.
3. Buat src/data/blueprintLoader.ts sesuai 02_BLUEPRINT_JSON_CONTRACT.md dengan type guard isWorksheet() (tangani Chart1 dan cached_value: null dengan aman).
4. Buat src/data/masterIndices.ts (pohon indeks Part 0 - Part 5), src/data/masterLeadHeaders.ts (45 pos L02-L47), dan src/data/seedData.ts:
   - Default kapProfile: namaKap = "KAP Djoemarma, Wahyudin dan Rekan", kota = "Bandung".
   - Minimal 4 demo users (Partner, Manager, Ketua Tim, Anggota Tim).
   - Fungsi initializeNewEngagement(...) yang WAJIB mengisi seluruh workingPapers, kuesioner, teamMembers, a150Declarations, a210, 45 leadSchedules (L02-L47), dan checklist CALK (C220) sesuai SAK klien.
5. Buat src/store/storageAdapter.ts (localStorage + IndexedDB + Export/Import .atlas.json) dan src/store/AtlasContext.tsx dengan SA 230 Read-Only Lock Guard (tolak mutasi jika KKP status === 'Locked' atau engagement.isArchived === true).
6. Bangun CaseWare 3-Zone Split-Pane UI:
   - TopBar (h-12 bg-slate-900): identitas KAP dinamis dari state.kapProfile, identitas klien aktif, Live Timer HH:MM:SS, User Switcher dinamis dari state.users, tombol Export/Import .atlas.json, tombol Command Palette (Ctrl+K).
   - SidebarTree (w-72 bg-slate-100): filter instan, accordion Part 0-5, 5 ikon status (Kosong, Draft, Prepared, Reviewed, Locked), inisial P/R, serta visibilitas kondisional A1105 & A170.
   - StickyWorkpaperHeader: tombol Sign-Off berjenjang sesuai RBAC 4 peran + Banner SA 230 Read-Only jika Locked/Archived.
   - CollapsibleBottomDrawer: tab Review Notes (thread + Open/Addressed/Cleared) & Audit Trail kronologis.
   - CommandPalette (Ctrl+K) & Hub Pages (Master KAP, Daftar Klien, Buat Perikatan Baru, Daftar Lampiran, Singkatan, Petunjuk Isi).
```

---

## 3. Kriteria Penerimaan Sprint 0
1. Tidak ada satu pun referensi Python/FastAPI/SQLite/HTMX/Jinja2.
2. Mengubah nama KAP di Master KAP langsung mengubah nama KAP di TopBar & header KKP.
3. User Switcher menampilkan daftar dinamis dari `state.users` dan langsung mengubah hak tombol Sign-Off RBAC.
4. Membuat perikatan baru langsung memanggil `initializeNewEngagement(...)` dan mengisi seluruh struktur workspace tanpa error `undefined`.
5. Mengaktifkan *Partner Lock* atau *Archive SA 230* langsung men-`disabled` seluruh input dan menolak mutasi store.
6. Export `.atlas.json` mengunduh file valid dan Import `.atlas.json` memulihkan data perikatan secara utuh.
