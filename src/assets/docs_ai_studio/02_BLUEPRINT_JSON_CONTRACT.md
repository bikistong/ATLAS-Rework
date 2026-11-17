# 02 — Kontrak Skema JSON Blueprint (`docs_ai_studio/blueprint/`)

Dokumen ini mendokumentasikan **struktur key dan tipe data aktual** dari ke-6 file JSON hasil ekstraksi forensik `Manggala 2023-atlas-v2.1.xlsx` (total **226 sheet**). Gunakan kontrak ini di TypeScript agar kode **tidak pernah mengalami `undefined` runtime error** saat membaca properti JSON.

---

## 1. Inventarisasi 6 File JSON Blueprint (226 Sheet)

| Nama File | Jumlah Sheet | Tipe Sheet | Keterangan |
| :--- | :---: | :--- | :--- |
| `part0_core_general.json` | 11 | 11 `worksheet` | `ATLAS`, `Home`, `AuditCycle`, `Content`, `ReFfLink`, `Sheet4`, `Sheet2`, `Sheet9`, `Daftar Lampiran`, `Singkatan`, `Petunjuk Isi` |
| `part1_a1_pre_engagement.json` | 22 | 22 `worksheet` | `A110`–`A170`, `A1101`, `A1102`, `A1102.1`, `A1102.1A–D`, `A1103A–B`, `A1105`, `DAYHOUR`, `PERFORM`, `JAM KERJA ORANG`, `JamKerja`, `ASM (2)` |
| `part2_a2_risk_assessment.json` | 55 | 55 `worksheet` | `A210`, `pertimbangan OM`, `PREANALITICAL`, `A220.1–2`, `A230–A230.8`, `AKUNNTERDAMPAK`, `A240`, `DATASIGN`, `DataTim`, `DataALK&PB`, `CR`, `GAb`, `A250.1`–`A.250.13.1`, `DATACR`, `DATAROMM`, `A260`, `A270`, `A2701`, `A2702` |
| `part3_b_core_wstb_fs.json` | 24 | 24 `worksheet` | `INPUTDATALK`, `B100`, `WSTB-FINAL`, `AJE-RJE`, `Data1`, `HEADERAKUNDOBEL`, `DataLK (Kosong)`, `HEADERAKUN`, `FS`, `FS_Query`, `COABARU`, `LK(kosong)`, `FS(2)`, `prosedur horizontal`, `RekapMapAKun`, `B120`, `B210`–`B280` |
| `part4_b_lead_schedules.json` | 92 | 92 `worksheet` | `pengujian sampel`, `MdanYa`, serta 45 pasang Lead Schedule (`2`, `2.1`, `3`, `3.1`, `5`, `5.1` s.d. `47`, `47.1`) |
| `part5_c_completing_opini.json` | 22 | 21 `worksheet` + **1 `chartsheet`** | `C100`, `C110`, `C120`, `C120.1–2`, `C210`, `C220`, `C220A–F`, `C230`, `C300`, `C400`, `OPINI1–5`, **`Chart1` (`chartsheet`)** |

---

## 2. Struktur Top-Level & Pembedaan `worksheet` vs `chartsheet`

Setiap file JSON memiliki struktur top-level berupa **Object / Dictionary** (`Record<string, BlueprintSheet>`) dengan **nama sheet Excel sebagai key**.

### 2.1 Tipe Union TypeScript Aktual (`BlueprintSheet`)

```typescript
export interface BlueprintValidation {
  source: 'standard_xml' | 'x14_extension_xml';
  type: 'list' | 'date' | 'time';
  sqref: string;                   // Rentang sel Excel, misal: "AE22:AM22" atau "AZ8 AZ12"
  formula1: string | null;         // Bisa null jika tidak ada formula1
  resolved_options: string[];      // Array kosong [] jika type !== 'list'
}

export interface BlueprintFormula {
  cell: string;                    // Koordinat sel, misal: "AN13", "K6"
  formula: string;                 // Selalu diawali "=", misal: "=IF(Data1!$B$3=\"\",\"\",Data1!$B$3)"
  cached_value: string | null;     // PERHATIAN: Bisa null! Selalu cek !== null sebelum dipakai
}

export interface BlueprintCell {
  cell: string;                    // Koordinat sel, misal: "A5", "D6"
  value: string;                   // Selalu bertipe string (sudah di-trim & max 300 karakter)
}

export interface BlueprintRow {
  row: number;                     // Nomor baris 1-based Excel
  cells: BlueprintCell[];          // Daftar sel non-kosong pada baris tersebut
}

export interface WorksheetBlueprint {
  dimensions: string;              // Misal: "328x157"
  validations_count: number;
  validations: BlueprintValidation[];
  unique_formulas_count: number;
  formulas: BlueprintFormula[];
  upstream_sheets: string[];
  non_empty_rows: BlueprintRow[];
}

export interface ChartsheetBlueprint {
  sheet_type: 'chartsheet';
  rows: [];
  formulas: [];
  upstream_sheets: [];
}

export type BlueprintSheet = WorksheetBlueprint | ChartsheetBlueprint;
export type BlueprintFileMap = Record<string, BlueprintSheet>;
```

> [!WARNING]
> **Aturan Anti-`undefined` pada `Chart1`:**
> Pada `part5_c_completing_opini.json`, key `"Chart1"` adalah satu-satunya `ChartsheetBlueprint`. Ia **TIDAK memiliki** properti `non_empty_rows`, `validations`, `validations_count`, `unique_formulas_count`, maupun `dimensions`.
> Wajib gunakan *type guard* `isWorksheet(sheet)` sebelum membaca `sheet.non_empty_rows` atau `sheet.validations`!

---

## 3. Contoh Aktual Data di Dalam Blueprint JSON

### 3.1 Contoh `WorksheetBlueprint` (`Home` di `part0_core_general.json`)
```json
{
  "Home": {
    "dimensions": "328x157",
    "validations_count": 6,
    "validations": [
      {
        "source": "x14_extension_xml",
        "type": "list",
        "sqref": "AE22:AM22",
        "formula1": "ReFfLink!$B$9:$B$14",
        "resolved_options": [
          "SAK Umum konvergensi IFRS",
          "SAK ETAP",
          "SAK EMKM",
          "SAK SYARIAH",
          "SAP",
          "SAK LAINNYA"
        ]
      }
    ],
    "unique_formulas_count": 32,
    "formulas": [
      {
        "cell": "AN13",
        "formula": "=IFERROR((VLOOKUP(AE13,ER14:ES15,2,FALSE)),\"\")",
        "cached_value": "2"
      }
    ],
    "upstream_sheets": ["Data1", "ReFfLink"],
    "non_empty_rows": [
      {
        "row": 5,
        "cells": [{ "cell": "A5", "value": "B E R A N D A" }]
      }
    ]
  }
}
```

### 3.2 Contoh `ChartsheetBlueprint` (`Chart1` di `part5_c_completing_opini.json`)
```json
{
  "Chart1": {
    "sheet_type": "chartsheet",
    "rows": [],
    "formulas": [],
    "upstream_sheets": []
  }
}
```

---

## 4. Cara `import` & Helper Akses Aman di TypeScript (`src/data/blueprintLoader.ts`)

Pastikan `tsconfig.json` mengaktifkan `"resolveJsonModule": true` dan `"esModuleInterop": true`.

```typescript
import part0Raw from './blueprint/part0_core_general.json';
import part1Raw from './blueprint/part1_a1_pre_engagement.json';
import part2Raw from './blueprint/part2_a2_risk_assessment.json';
import part3Raw from './blueprint/part3_b_core_wstb_fs.json';
import part4Raw from './blueprint/part4_b_lead_schedules.json';
import part5Raw from './blueprint/part5_c_completing_opini.json';

import type {
  BlueprintFileMap,
  BlueprintSheet,
  WorksheetBlueprint,
} from '../types/atlas';

export const BLUEPRINTS = {
  part0: part0Raw as BlueprintFileMap,
  part1: part1Raw as BlueprintFileMap,
  part2: part2Raw as BlueprintFileMap,
  part3: part3Raw as BlueprintFileMap,
  part4: part4Raw as BlueprintFileMap,
  part5: part5Raw as BlueprintFileMap,
};

export function isWorksheet(sheet: BlueprintSheet | undefined): sheet is WorksheetBlueprint {
  if (!sheet) return false;
  return !('sheet_type' in sheet && sheet.sheet_type === 'chartsheet');
}

export function getWorksheet(part: keyof typeof BLUEPRINTS, sheetName: string): WorksheetBlueprint | null {
  const sheet = BLUEPRINTS[part][sheetName];
  return isWorksheet(sheet) ? sheet : null;
}

/** Mengambil resolved_options untuk sel/sqref tertentu secara aman */
export function getDropdownOptions(
  part: keyof typeof BLUEPRINTS,
  sheetName: string,
  sqrefContains: string
): string[] {
  const ws = getWorksheet(part, sheetName);
  if (!ws) return [];
  const match = ws.validations.find(
    (v) => v.type === 'list' && v.sqref.includes(sqrefContains)
  );
  return match?.resolved_options ?? [];
}

/** Mengambil nilai teks sel tertentu dari non_empty_rows */
export function getCellText(ws: WorksheetBlueprint | null, cellCoord: string): string {
  if (!ws) return '';
  for (const row of ws.non_empty_rows) {
    const found = row.cells.find((c) => c.cell === cellCoord);
    if (found) return found.value;
  }
  return '';
}
```

---

## 5. Catatan Penting Saat Memakai Data Blueprint di Runtime

1. **Catatan Limitasi Ekstraksi:** Pada file JSON blueprint, nilai `cell.value` dibatasi maksimal 300 karakter dan `non_empty_rows` dibatasi hingga 600 baris pertama per sheet (cukup untuk header, struktur tabel, kuesioner, dan validasi). Untuk checklist CALK masif (`C220A` 5.344 butir, `C220B` 688 butir, dll.) dan katalog `prosedur horizontal` (50 grup), ekstrak seluruh baris yang tersedia dari `non_empty_rows` dan lengkapi master seed catalog pada `src/data/` sesuai PRD terkait agar aplikasi cepat dan lengkap 100%.
2. **Jangan Pernah Mengakses `.validations[0]` Tanpa Optional Chaining:** Beberapa sheet (seperti `ATLAS`, `AuditCycle`, `OPINI1`–`OPINI5`) memiliki `validations: []` (array kosong). Selalu gunakan `.find(...)` atau `?? []`.
3. **Tangani `cached_value === null`:** Sebanyak ribuan formula memiliki `cached_value: null`. Selalu gunakan `formula.cached_value ?? ''`.
