# PRD 0 — Core Platform, Hub Perikatan & RBAC (Browser-Native)

**Kode Dokumen:** `PRD_0_Core_Hub_RBAC`  
**Tech Stack:** React 18+ TypeScript, Vite, Tailwind CSS, Lucide React, `localStorage` + `IndexedDB` + `.atlas.json`  
**Cakupan Sheet ATLAS v2.1 (11 Sheet):** `ATLAS`, `Home`, `AuditCycle`, `Content`, `ReFfLink`, `Sheet4`, `Sheet2`, `Sheet9`, `Daftar Lampiran`, `Singkatan`, `Petunjuk Isi`  
**Blueprint Referensi:** `docs_ai_studio/blueprint/part0_core_general.json`  
**Prinsip Arsitektur:** *Zero-Reduction*, Local-First Storage, Split-Pane CaseWare UX, RBAC 4 Peran, SA 230 Read-Only Lock Guard.

---

## 1. Tujuan & Transformasi dari Spreadsheet ATLAS v2.1

1. **Menggantikan `Home` & `Content`:** Menyediakan Hub Manajemen KAP, Klien, Personil, dan Daftar Perikatan yang terhubung langsung ke *3-Zone Split-Pane CaseWare Workspace*.
2. **Menggantikan `DAYHOUR`, `PERFORM`, `JAM KERJA ORANG`, `Sheet9`:** Kalkulasi jam kerja dan status KKP (`Kosong`, `Draft`, `Prepared`, `Reviewed`, `Locked`) dihitung secara reaktif di TypeScript store dari `timeLogs` dan `workingPapers`, tanpa formula array Excel lintas 482 sheet.
3. **Zero-Hardcode Identitas KAP & User Switcher (Aturan Anti-Bug #3):** Seluruh identitas KAP ditarik dari `state.kapProfile` (default awal: `KAP Djoemarma, Wahyudin dan Rekan`, Kota: `Bandung`), dan *User Switcher* di TopBar membaca dinamis dari `state.users`.

---

## 2. Spesifikasi Field Input & Opsi Dropdown Baku (`Home` & `ReFfLink`)

### 2.1 Master Kantor Akuntan Publik (`KapProfile`)
| Field (`src/types/atlas.ts`) | Label UI | Tipe / Validasi | Default Seed |
| :--- | :--- | :--- | :--- |
| `namaKap` | Nama KAP | `string` (Wajib, max 150) | `'KAP Djoemarma, Wahyudin dan Rekan'` |
| `namaPemimpin` | Pemimpin Rekan / Partner | `string` (Wajib, max 150) | `'Drs. Djoemarma, Ak., CPA'` |
| `nomorIzinKap` | Nomor Izin Usaha KAP | `string` (Format KMK/Kemenkeu) | `'KEP-001/KM.1/2020'` |
| `nomorIzinAp` | Nomor Izin Akuntan Publik | `string` (Format `AP.XXXX`) | `'AP.0543'` |
| `alamat` | Alamat Kantor KAP | `string` (Wajib) | `'Jl. Ir. H. Juanda No. 123'` |
| `telepon` | No. Telepon KAP | `string` (Numeric & dash) | `'022-2501234'` |
| `email` | Email Resmi KAP | `string` (Format email) | `'office@kapdwr.co.id'` |
| `kota` | Kota Domisili KAP | `string` (Wajib) | `'Bandung'` |

### 2.2 Master Entitas Klien (`ClientEntity`)
| Field | Label UI | Tipe / Opsi Dropdown Baku (`resolved_options`) |
| :--- | :--- | :--- |
| `namaKlien` | Nama Klien / Entitas | `string` (Wajib, sesuai Akta Pendirian) |
| `npwp` | NPWP Klien | `string` (Validasi 15 atau 16 digit) |
| `nib` | Nomor Induk Berusaha (NIB) | `string` (Opsional, format OSS) |
| `alamat`, `kota`, `provinsi` | Alamat, Kota, Provinsi | `string` (Dropdown 38 Provinsi Indonesia untuk `provinsi`) |
| `sektorIndustri` | Sektor Industri / Jenis Usaha | **12 Opsi Baku:**<br>1. `Pertanian_perkebunan_kehutanan_peternakan_kelautan_perikanan`<br>2. `Pertambangan_dan_energi`<br>3. `Properti_dan_Konstruksi`<br>4. `Industri_Pengolahan/Manufaktur`<br>5. `Perdagangan_dan_Jasa`<br>6. `Informasi_komunikasi_dan_Transportasi`<br>7. `Sektor_Keuangan_Perbankan`<br>8. `Sektor_Keuangan_Asuransi_dan_Dana_Pensiun`<br>9. `Sektor_Keuangan_Lainnya`<br>10. `Industri_Lainnya`<br>11. `Pemerintahan_Badan_International_Organisasi_Non_Profit`<br>12. `Non_Industri_Perorangan` |
| `statusKepemilikan` | Status Kepemilikan Klien | **6 Opsi Baku:**<br>1. `Swasta - Go Publik`<br>2. `Swasta - Non Go Publik`<br>3. `BUMN/BUMD`<br>4. `Sektor Publik`<br>5. `Koperasi`<br>6. `Yayasan` |
| `sakDigunakan` | Standar Akuntansi Keuangan | **6 Opsi Baku:**<br>1. `SAK Umum konvergensi IFRS`<br>2. `SAK ETAP`<br>3. `SAK EMKM`<br>4. `SAK SYARIAH`<br>5. `SAP`<br>6. `SAK LAINNYA` |

### 2.3 Parameter Perikatan (`EngagementHeader`)
| Field | Label UI | Opsi / Validasi | Keterangan |
| :--- | :--- | :--- | :--- |
| `tipePerikatan` | Tipe Perikatan | `Perikatan Tahun Pertama` \| `Perikatan Berulang` | Kode Excel `Home!AN13` (`1` vs `2`). Memicu visibilitas `A170` & `A1105`. |
| `jenisLayanan` | Jenis Layanan | `'Audit atas Laporan Keuangan'` (Fixed) | Ruang lingkup perikatan |
| `standarAudit` | Standar Auditing | `'Standar Profesional Akuntan Publik'` (Fixed) | Mengacu pada SPAP / ISA |
| `tahunBuku` | Tahun Buku | `number` (YYYY) | Tahun audit |
| `periodeMulai` | Awal Periode Buku | `YYYY-MM-DD` | Misal: `2023-01-01` |
| `periodeSelesai` | Akhir Periode Buku | `YYYY-MM-DD` | Misal: `2023-12-31` |
| `tanggalLaporanAuditor` | Tanggal LAI | `YYYY-MM-DD` | Acuan validasi `B250` (SA 580) & `C400` |

---

## 3. Aturan Kondisional Visibilitas Indeks KKP (`SidebarTree`)

1. **`A170` (Prosedur Saldo Awal — SA 510):**
   - Tampil di `SidebarTree` & `CommandPalette` **HANYA JIKA**:
     `header.tipePerikatan === 'Perikatan Tahun Pertama'` **DAN** `a110.kriteriaIsuTerdahulu !== 'Entitas berdiri pada periode berjalan dan laporan keuangan tersedia pada periode berjalan'`.
2. **`A1105` (Komunikasi Auditor Pendahulu):**
   - Tampil **HANYA JIKA**:
     `header.tipePerikatan === 'Perikatan Tahun Pertama'` **DAN** `a110.kriteriaIsuTerdahulu === 'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia dan telah diaudit auditor independen lain atau auditor yang bersangkutan'`.
3. **`C300` (Penelaahan Mutu EQCR — SA 220):**
   - Wajib diselesaikan (*Partner Lock Gate*) apabila `a120.isEqcrRequired === true` (atau klien berstatus `Swasta - Go Publik`).

---

## 4. Matriks RBAC 4 Peran, Sign-Off Berjenjang & SA 230 Lock Guard

### 4.1 Matriks Hak Akses (`UserRole`)
| Fitur / Aksi | Anggota Tim | Ketua Tim | Manager | Partner |
| :--- | :---: | :---: | :---: | :---: |
| Mengisi Data Input, Kuesioner & Upload Lampiran | Ya | Ya | Ya | Ya |
| Sign-Off `Prepared` | Ya | Ya | - | - |
| Batalkan Sign-Off `Prepared` | Ya (sebelum direviu) | Ya | Ya | Ya |
| Sign-Off `Reviewed` (wajib sudah `Prepared`) | - | Ya | Ya | - |
| Batalkan Sign-Off `Reviewed` | - | - | Ya | Ya |
| Sign-Off `Partner Lock` (wajib sudah `Reviewed` & 0 Note `Open`) | - | - | - | Ya |
| Buka & Jawab Review Notes | Ya | Ya | Ya | Ya |
| Tutup (`Clear`) Review Notes | - | Ya (milik sendiri) | Ya | Ya |
| Ubah Master KAP / Profil Klien / Susunan Tim | - | - | Ya | Ya |
| Arsip Final 60 Hari SA 230 (`isArchived = true`) | - | - | - | Ya |

### 4.2 Aturan Anti-Bug #2: `initializeNewEngagement(...)`
Saat user membuat perikatan baru melalui Hub:
- Fungsi `initializeNewEngagement(payload)` wajib membuat objek `EngagementWorkspaceData` lengkap berisi seluruh `workingPapers` (Part 0 s.d. C400), seluruh kuesioner awal (`a110`–`a170`, `a230Items`, `a250Cycles`, `specialProcedures`), `teamMembers`, `a150Declarations`, `a210`, 45 `leadSchedules` (`L02`–`L47`) beserta prosedur bawaannya, dan `moduleC.c220Disclosures` sesuai `client.sakDigunakan`.
- Tidak boleh ada key yang dibiarkan `undefined` sehingga menyebabkan crash saat auditor langsung membuka indeks mana pun.

### 4.3 Aturan Anti-Bug #4: SA 230 Read-Only Lock Guard
- Helper `isWorkpaperReadOnly(workspace, kodeIndeks)`:
  Mengembalikan `true` jika `workspace.header.isArchived === true` **ATAU** `workspace.workingPapers[kodeIndeks]?.status === 'Locked'`.
- Jika `true`:
  1. Seluruh `<input>`, `<select>`, `<textarea>`, dan tombol mutasi di UI otomatis menerima `disabled={true}`.
  2. Reducer di `AtlasContext` menolak setiap action mutasi data pada KKP terkunci dan memicu notifikasi toast peringatan SA 230.

---

## 5. Live Timer, Review Notes, Daftar Lampiran & Audit Trail

1. **Live Timer (`TopBar`):** Timer `HH:MM:SS` berjalan di React state. Saat di-pause atau pindah KKP, durasi menit dicatat ke `workspace.timeLogs` untuk tahapan aktif (`PraPerikatan & Penilaian Risiko`, `Respon Risiko`, atau `Pelaporan`).
2. **Review Notes (`CollapsibleBottomDrawer`):** Mendukung *threading* (`parentNoteId`), status `Open` -> `Addressed` -> `Cleared`, dan badge jumlah `Open` di tab drawer. `Partner Lock` diblokir jika masih ada `Open` note pada KKP terkait.
3. **Daftar Lampiran:** Menyimpan file lampiran per KKP di `IndexedDB` (`attachments` store) dan menampilkan rekap master di indeks `Daftar Lampiran`.
4. **Audit Trail:** Setiap aksi simpan, sign-off, buka/tutup review note, dan arsip SA 230 otomatis menambah entri `AuditTrailEntry` yang bersifat *append-only*.
5. **Export/Import `.atlas.json`:** Tombol di TopBar/Hub mengekspor `AtlasPortableBundle` via `file-saver` (`{namaKlien}_{tahunBuku}.atlas.json`) dan mengimpornya kembali ke `localStorage` + `IndexedDB`.
