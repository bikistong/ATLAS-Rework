import { getWorksheet } from './blueprintLoader';
import {
  AccountingFramework,
  DisclosureReviewItem,
  ModuleCData,
  OpinionCode,
} from '../types/atlas';

export const SAK_AU_CODES: Record<AccountingFramework, string> = {
  'SAK Umum konvergensi IFRS': 'AU-01',
  'SAK ETAP': 'AU-02',
  'SAK EMKM': 'AU-03',
  'SAK SYARIAH': 'AU-04',
  SAP: 'AU-05',
  'SAK LAINNYA': 'AU-06',
};

export function getFrameworkCodeForSak(
  sak: AccountingFramework
): DisclosureReviewItem['frameworkCode'] {
  switch (sak) {
    case 'SAK Umum konvergensi IFRS':
      return 'C220A';
    case 'SAK ETAP':
      return 'C220B';
    case 'SAK EMKM':
      return 'C220C';
    case 'SAK SYARIAH':
      return 'C220D';
    case 'SAP':
      return 'C220E';
    default:
      return 'C220F';
  }
}

export const C110_CONCLUSION_OPTIONS: ModuleCData['c110FinalMateriality']['conclusion'][] = [
  'Nilai yang tersaji pada laporan keuangan sudah material',
  'Terdapat penurunan materialitas namun prosedur audit yang telah dilaksanakan tetap memadai',
  'Terdapat penurunan materialitas dan auditor telah memperluas prosedur audit tambahan',
];

export const C300_SA220_CHECKLIST_ITEMS: string[] = [
  'Penelaahan atas diskusi tim perikatan dan evaluasi independensi, kompetensi, serta kecukupan waktu tim (A110–A150).',
  'Penelaahan kesesuaian penilaian risiko signifikan (A240/A270), respons audit, dan kecukupan bukti pada pos material (Lead L02–L47).',
  'Evaluasi signifikansi salah saji yang teridentifikasi, jurnal penyesuaian AJE/RJE, dan ikhtisar salah saji yang belum dikoreksi (C100).',
  'Evaluasi pertimbangan materialitas akhir (C110 SA 320.12) dan hasil prosedur analitis akhir laporan keuangan (C120).',
  'Penelaahan kepatuhan pengungkapan Catatan atas Laporan Keuangan (C220) dan pertimbangan kelangsungan usaha (B240 SA 570).',
  'Penelaahan kelengkapan bentuk baku Laporan Auditor Independen (C210) serta ketepatan kesimpulan opini audit yang diusulkan (C400).',
];

export interface OpinionTemplateMeta {
  code: OpinionCode;
  shortLabel: string;
  titleId: string;
  saRef: string;
  requiresModificationBasis: boolean;
  opinionHeading: string;
  opinionLeadParagraph: (params: {
    clientName: string;
    periodeText: string;
    sak: string;
  }) => string;
}

export const OPINION_TEMPLATES: Record<OpinionCode, OpinionTemplateMeta> = {
  OPINI1: {
    code: 'OPINI1',
    shortLabel: 'WTP (SA 700)',
    titleId: 'Wajar Tanpa Pengecualian (Unmodified)',
    saRef: 'SA 700',
    requiresModificationBasis: false,
    opinionHeading: 'Opini',
    opinionLeadParagraph: ({ clientName, periodeText, sak }) =>
      `Menurut opini kami, laporan keuangan terlampir menyajikan secara wajar, dalam semua hal yang material, posisi keuangan ${clientName} ${periodeText}, serta kinerja keuangan dan arus kasnya untuk tahun yang berakhir pada tanggal tersebut, sesuai dengan ${sak} di Indonesia.`,
  },
  OPINI2: {
    code: 'OPINI2',
    shortLabel: 'WDP — Salah Saji (SA 705.7a)',
    titleId: 'Wajar Dengan Pengecualian (Salah Saji Material Tidak Pervasif)',
    saRef: 'SA 705.7(a)',
    requiresModificationBasis: true,
    opinionHeading: 'Opini Wajar Dengan Pengecualian',
    opinionLeadParagraph: ({ clientName, periodeText, sak }) =>
      `Menurut opini kami, kecuali untuk dampak hal yang dijelaskan dalam paragraf Basis untuk Opini Wajar Dengan Pengecualian, laporan keuangan terlampir menyajikan secara wajar, dalam semua hal yang material, posisi keuangan ${clientName} ${periodeText}, serta kinerja keuangan dan arus kasnya untuk tahun yang berakhir pada tanggal tersebut, sesuai dengan ${sak} di Indonesia.`,
  },
  OPINI3: {
    code: 'OPINI3',
    shortLabel: 'WDP — Pembatasan Lingkup (SA 705.7b)',
    titleId: 'Wajar Dengan Pengecualian (Ketidakcukupan Bukti Tidak Pervasif)',
    saRef: 'SA 705.7(b)',
    requiresModificationBasis: true,
    opinionHeading: 'Opini Wajar Dengan Pengecualian',
    opinionLeadParagraph: ({ clientName, periodeText, sak }) =>
      `Menurut opini kami, kecuali untuk kemungkinan dampak hal yang dijelaskan dalam paragraf Basis untuk Opini Wajar Dengan Pengecualian, laporan keuangan terlampir menyajikan secara wajar, dalam semua hal yang material, posisi keuangan ${clientName} ${periodeText}, serta kinerja keuangan dan arus kasnya untuk tahun yang berakhir pada tanggal tersebut, sesuai dengan ${sak} di Indonesia.`,
  },
  OPINI4: {
    code: 'OPINI4',
    shortLabel: 'Tidak Wajar (SA 705.8)',
    titleId: 'Tidak Wajar / Adverse (Salah Saji Material & Pervasif)',
    saRef: 'SA 705.8',
    requiresModificationBasis: true,
    opinionHeading: 'Opini Tidak Wajar',
    opinionLeadParagraph: ({ clientName, periodeText, sak }) =>
      `Menurut opini kami, karena signifikansi dari hal yang dijelaskan dalam paragraf Basis untuk Opini Tidak Wajar, laporan keuangan terlampir tidak menyajikan secara wajar posisi keuangan ${clientName} ${periodeText}, serta kinerja keuangan dan arus kasnya untuk tahun yang berakhir pada tanggal tersebut, sesuai dengan ${sak} di Indonesia.`,
  },
  OPINI5: {
    code: 'OPINI5',
    shortLabel: 'TMP / Disclaimer (SA 705.9)',
    titleId: 'Tidak Menyatakan Pendapat (Disclaimer — Pembatasan Lingkup Pervasif)',
    saRef: 'SA 705.9',
    requiresModificationBasis: true,
    opinionHeading: 'Tidak Menyatakan Pendapat',
    opinionLeadParagraph: ({ clientName, periodeText }) =>
      `Kami tidak menyatakan suatu opini atas laporan keuangan ${clientName} ${periodeText} terlampir. Karena signifikansi dari hal yang dijelaskan dalam paragraf Basis untuk Tidak Menyatakan Pendapat, kami tidak dapat memperoleh bukti audit yang cukup dan tepat untuk menyediakan suatu basis bagi opini audit atas laporan keuangan tersebut.`,
  },
};

export function getC210ReviewChecklist(): ModuleCData['c210LaiReviewItems'] {
  const sheet = getWorksheet('part5', 'C210');
  const items: ModuleCData['c210LaiReviewItems'] = [];
  let currentSection = 'Bentuk Baku LAI';
  let seq = 1;

  if (sheet && Array.isArray(sheet.non_empty_rows)) {
    for (const r of sheet.non_empty_rows) {
      if (r.row < 21 || r.row >= 66) continue;
      const cellMap = new Map(r.cells.map((c) => [c.cell.replace(/\d+/g, ''), c.value.trim()]));
      const colE = cellMap.get('E') ?? '';
      const colF = cellMap.get('F') ?? '';
      const colG = cellMap.get('G') ?? '';

      if (!colE && colF) {
        const cleanSec = colF.replace(/\s+/g, ' ').trim();
        if (cleanSec && cleanSec.length < 70) {
          currentSection = cleanSec;
        }
        continue;
      }

      if (/^\d+$/.test(colE) && colF) {
        items.push({
          itemNumber: seq,
          sectionName: currentSection,
          procedureText: colF.replace(/\s+/g, ' ').trim(),
          saRef: colG || 'SA 700 / 705 / 706',
          status: 'Ada',
          notes: '',
        });
        seq += 1;
      }
    }
  }

  if (items.length >= 20) return items;

  return [
    { itemNumber: 1, sectionName: 'Bentuk Baku LAI', procedureText: 'Laporan auditor telah memuat nomor registrasi LAI resmi sesuai ketentuan PPPK/IAPI.', saRef: 'Ketentuan PPPK', status: 'Ada', notes: '' },
    { itemNumber: 2, sectionName: 'Bentuk Baku LAI', procedureText: 'Laporan auditor telah memuat judul "Laporan Auditor Independen" secara jelas.', saRef: 'SA 700.21', status: 'Ada', notes: '' },
    { itemNumber: 3, sectionName: 'Pihak yang Dituju', procedureText: 'Laporan auditor ditujukan kepada pihak sesuai perikatan (Pemegang Saham, Dewan Komisaris, Direksi).', saRef: 'SA 700.22', status: 'Ada', notes: '' },
    { itemNumber: 4, sectionName: 'Paragraf Pendahuluan', procedureText: 'Alinea pembuka mengidentifikasi entitas, judul tiap laporan keuangan, dan tanggal/periode pelaporan.', saRef: 'SA 700.23', status: 'Ada', notes: '' },
    { itemNumber: 5, sectionName: 'Tanggung Jawab Manajemen', procedureText: 'Bagian Tanggung Jawab Manajemen atas Laporan Keuangan menjelaskan penyusunan wajar dan pengendalian internal.', saRef: 'SA 700.25-26', status: 'Ada', notes: '' },
    { itemNumber: 6, sectionName: 'Tanggung Jawab Auditor', procedureText: 'Bagian Tanggung Jawab Auditor menyatakan pelaksanaan audit berdasarkan Standar Audit IAPI.', saRef: 'SA 700.28', status: 'Ada', notes: '' },
    { itemNumber: 7, sectionName: 'Opini Auditor', procedureText: 'Mencantumkan bagian Opini dengan redaksi yang sesuai dengan hasil kesimpulan C400.', saRef: 'SA 700.34', status: 'Ada', notes: '' },
    { itemNumber: 8, sectionName: 'Penandatanganan & Tanggal', procedureText: 'Mencantumkan nama KAP, tanda tangan & nomor izin AP, kota domisili, serta tanggal LAI tidak lebih awal dari representasi B250.', saRef: 'SA 700.40-41', status: 'Ada', notes: '' },
  ];
}

function parseC220Sheet(
  frameworkCode: DisclosureReviewItem['frameworkCode'],
  sakLabel: AccountingFramework
): DisclosureReviewItem[] {
  const sheet = getWorksheet('part5', frameworkCode);
  if (!sheet || !Array.isArray(sheet.non_empty_rows)) return [];

  const items: DisclosureReviewItem[] = [];
  let currentTopic = 'Umum & Dasar Penyusunan';
  let currentGroupTitle = '';
  let currentRef = `${sakLabel}`;
  let seq = 1;

  for (const r of sheet.non_empty_rows) {
    if (r.row < 21) continue;
    const map = new Map(
      r.cells.map((c) => [c.cell.replace(/\d+/g, ''), c.value.replace(/\s+/g, ' ').trim()])
    );
    const e = map.get('E') ?? '';
    const f = map.get('F') ?? '';
    const g = map.get('G') ?? '';
    const h = map.get('H') ?? '';
    const i = map.get('I') ?? '';
    const j = map.get('J') ?? '';

    if (frameworkCode === 'C220A') {
      // C220A: E=section/item num, F=question text, G=PSAK ref
      if (e && !/^\d+$/.test(e) && !/^\([a-z]+\)$/i.test(e) && f && f.length < 90) {
        currentTopic = f;
        continue;
      }
      if (f && f.length >= 6 && !f.toLowerCase().startsWith('referensi')) {
        if (g) currentRef = g;
        const itemNum = e || String(seq);
        if (/^\d+$/.test(e)) currentGroupTitle = f;
        const text =
          /^\(/.test(f) && currentGroupTitle && !f.startsWith(currentGroupTitle)
            ? `${currentGroupTitle} — ${f}`
            : f;
        items.push({
          id: `${frameworkCode}-${seq}`,
          frameworkCode,
          itemNumber: `${seq} (${itemNum})`.replace(/\s+\(\d+\)$/, ''),
          topicCategory: currentTopic,
          standardReference: g || currentRef,
          questionText: text,
          responseStatus: 'Ada',
          calkReferenceNote: '',
          auditorComments: '',
        });
        seq += 1;
      }
    } else {
      // C220B-C220F: E="A." F="Umum" | F="1." G="Heading" J="Bab ..." | G="(a)" H="Text" | H="(i)" I="Text"
      if (e && /^[A-Z]\.?$/.test(e) && f) {
        currentTopic = `${e.replace('.', '')}. ${f}`;
        continue;
      }
      if (f && /^\d+\.?$/.test(f) && g) {
        currentGroupTitle = g;
        if (j) currentRef = j;
        items.push({
          id: `${frameworkCode}-${seq}`,
          frameworkCode,
          itemNumber: f.replace(/\.$/, ''),
          topicCategory: currentTopic,
          standardReference: j || currentRef,
          questionText: g,
          responseStatus: 'Ada',
          calkReferenceNote: '',
          auditorComments: '',
        });
        seq += 1;
        continue;
      }
      const subText = i || h || g;
      const subCode = i ? h : h ? g : '';
      if (subText && subText.length >= 5) {
        if (j) currentRef = j;
        const combined =
          currentGroupTitle && !subText.toLowerCase().includes(currentGroupTitle.toLowerCase().slice(0, 18))
            ? `${currentGroupTitle}: ${subCode ? `${subCode} ` : ''}${subText}`
            : `${subCode ? `${subCode} ` : ''}${subText}`;
        items.push({
          id: `${frameworkCode}-${seq}`,
          frameworkCode,
          itemNumber: `${seq}`,
          topicCategory: currentTopic,
          standardReference: j || currentRef,
          questionText: combined,
          responseStatus: 'Ada',
          calkReferenceNote: '',
          auditorComments: '',
        });
        seq += 1;
      }
    }
  }

  return items;
}

export function getDisclosuresForSak(sak: AccountingFramework): DisclosureReviewItem[] {
  const code = getFrameworkCodeForSak(sak);
  const parsed = parseC220Sheet(code, sak);
  if (parsed.length > 0) return parsed;

  return [
    {
      id: `${code}-1`,
      frameworkCode: code,
      itemNumber: '1',
      topicCategory: 'Gambaran Umum & Dasar Penyusunan',
      standardReference: `${sak}`,
      questionText: `Apakah entitas telah mengungkapkan pernyataan kepatuhan terhadap ${sak}, dasar pengukuran, dan mata uang fungsional?`,
      responseStatus: 'Ada',
      calkReferenceNote: 'Catatan 1 & 2',
      auditorComments: '',
    },
  ];
}
