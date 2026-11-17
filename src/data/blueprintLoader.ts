import part0Raw from '../assets/docs_ai_studio/blueprint/part0_core_general.json';
import part1Raw from '../assets/docs_ai_studio/blueprint/part1_a1_pre_engagement.json';
import part2Raw from '../assets/docs_ai_studio/blueprint/part2_a2_risk_assessment.json';
import part3Raw from '../assets/docs_ai_studio/blueprint/part3_b_core_wstb_fs.json';
import part4Raw from '../assets/docs_ai_studio/blueprint/part4_b_lead_schedules.json';
import part5Raw from '../assets/docs_ai_studio/blueprint/part5_c_completing_opini.json';

import type {
  BlueprintFileMap,
  BlueprintSheet,
  WorksheetBlueprint,
} from '../types/atlas';

export const BLUEPRINTS = {
  part0: part0Raw as unknown as BlueprintFileMap,
  part1: part1Raw as unknown as BlueprintFileMap,
  part2: part2Raw as unknown as BlueprintFileMap,
  part3: part3Raw as unknown as BlueprintFileMap,
  part4: part4Raw as unknown as BlueprintFileMap,
  part5: part5Raw as unknown as BlueprintFileMap,
};

export function isWorksheet(sheet: BlueprintSheet | undefined): sheet is WorksheetBlueprint {
  if (!sheet) return false;
  return !('sheet_type' in sheet && sheet.sheet_type === 'chartsheet');
}

export function getWorksheet(
  part: keyof typeof BLUEPRINTS,
  sheetName: string
): WorksheetBlueprint | null {
  const sheet = BLUEPRINTS[part]?.[sheetName];
  return isWorksheet(sheet) ? sheet : null;
}

export function getDropdownOptions(
  part: keyof typeof BLUEPRINTS,
  sheetName: string,
  sqrefContains: string
): string[] {
  const ws = getWorksheet(part, sheetName);
  if (!ws || !Array.isArray(ws.validations)) return [];
  const match = ws.validations.find(
    (v) => v.type === 'list' && v.sqref.includes(sqrefContains)
  );
  return match?.resolved_options ?? [];
}

export function getCellText(ws: WorksheetBlueprint | null, cellCoord: string): string {
  if (!ws || !Array.isArray(ws.non_empty_rows)) return '';
  for (const row of ws.non_empty_rows) {
    const found = row.cells.find((c) => c.cell === cellCoord);
    if (found) return found.value;
  }
  return '';
}

export function getFormulaCachedValue(
  ws: WorksheetBlueprint | null,
  cellCoord: string
): string {
  if (!ws || !Array.isArray(ws.formulas)) return '';
  const match = ws.formulas.find((f) => f.cell === cellCoord);
  return match?.cached_value ?? '';
}
