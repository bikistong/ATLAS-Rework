import * as XLSX from 'xlsx';
import {
  AuditJournalEntry,
  ClientEntity,
  EngagementHeader,
  KapProfile,
  TrialBalanceAccount,
} from '../../types/atlas';
import { computeWstb12Columns, computeWstbTotals } from '../../utils/bCoreFormulas';

export function exportWstbToXlsx(params: {
  kapProfile: KapProfile;
  client: ClientEntity;
  header: EngagementHeader;
  trialBalance: TrialBalanceAccount[];
  journals: AuditJournalEntry[];
}): string {
  const { kapProfile, client, header, trialBalance, journals } = params;
  const rows = computeWstb12Columns(trialBalance, journals);
  const totals = computeWstbTotals(rows, trialBalance);

  const wstbAoa: (string | number)[][] = [
    [kapProfile.namaKap.toUpperCase()],
    [`WORKING SHEET TRIAL BALANCE (WSTB 12 KOLOM — INDEKS B100)`],
    [`Klien: ${client.namaKlien} | Tahun Buku: ${header.tahunBuku} | Kerangka: ${client.sakDigunakan}`],
    [],
    [
      'Kode Akun',
      'Nama Akun',
      'Group',
      'Header Akun',
      'Lead',
      'Unaudited Dr',
      'Unaudited Cr',
      'AJE Dr',
      'AJE Cr',
      'RJE Dr',
      'RJE Cr',
      'Audited Dr',
      'Audited Cr',
      'Prior Audited',
    ],
    ...rows.map((r) => [
      r.kodeAkun,
      r.namaAkun,
      r.groupAkun,
      r.headerAkun,
      r.leadCode,
      r.unauditedDebit,
      r.unauditedCredit,
      r.ajeDebit,
      r.ajeCredit,
      r.rjeDebit,
      r.rjeCredit,
      r.auditedDebit,
      r.auditedCredit,
      r.priorAudited,
    ]),
    [
      'TOTAL',
      '',
      '',
      '',
      '',
      totals.unauditedDebit,
      totals.unauditedCredit,
      totals.ajeDebit,
      totals.ajeCredit,
      totals.rjeDebit,
      totals.rjeCredit,
      totals.auditedDebit,
      totals.auditedCredit,
      0,
    ],
  ];

  const wb = XLSX.utils.book_new();
  const wsWstb = XLSX.utils.aoa_to_sheet(wstbAoa);
  wsWstb['!cols'] = [
    { wch: 12 },
    { wch: 32 },
    { wch: 18 },
    { wch: 24 },
    { wch: 8 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsWstb, 'WSTB_12_Kolom');

  const journalRows = journals.flatMap((j) =>
    j.lines.map((l) => ({
      Nomor: j.nomorJurnal,
      Jenis: j.jenisJurnal,
      Status: j.statusPersetujuan,
      Tanggal: j.tanggalJurnal,
      ReferensiKKP: j.referensiKkp,
      KodeAkun: l.kodeAkun,
      NamaAkun: l.namaAkun,
      Debit: l.posisi === 'Debit' ? l.nilai : 0,
      Kredit: l.posisi === 'Kredit' ? l.nilai : 0,
      Keterangan: j.keterangan,
    }))
  );
  const wsJournals = XLSX.utils.json_to_sheet(
    journalRows.length > 0
      ? journalRows
      : [{ Info: 'Belum ada jurnal AJE/RJE pada perikatan ini.' }]
  );
  XLSX.utils.book_append_sheet(wb, wsJournals, 'AJE_RJE_Register');

  const safeClient = client.namaKlien.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const filename = `WSTB_${safeClient}_${header.tahunBuku}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

export function downloadSampleTbTemplateXlsx(): void {
  const sampleRows = [
    { kodeAkun: '1101', namaAkun: 'Kas dan Bank', unauditedDebit: 500000000, unauditedCredit: 0, pembandingDebit: 420000000, pembandingCredit: 0 },
    { kodeAkun: '1103', namaAkun: 'Piutang Usaha', unauditedDebit: 1200000000, unauditedCredit: 0, pembandingDebit: 980000000, pembandingCredit: 0 },
    { kodeAkun: '2101', namaAkun: 'Utang Usaha', unauditedDebit: 0, unauditedCredit: 650000000, pembandingDebit: 0, pembandingCredit: 500000000 },
    { kodeAkun: '3101', namaAkun: 'Modal Saham Disetor', unauditedDebit: 0, unauditedCredit: 800000000, pembandingDebit: 0, pembandingCredit: 800000000 },
    { kodeAkun: '4101', namaAkun: 'Pendapatan Usaha', unauditedDebit: 0, unauditedCredit: 2500000000, pembandingDebit: 0, pembandingCredit: 2100000000 },
    { kodeAkun: '5101', namaAkun: 'Beban Pokok Penjualan', unauditedDebit: 1750000000, unauditedCredit: 0, pembandingDebit: 1500000000, pembandingCredit: 0 },
    { kodeAkun: '6101', namaAkun: 'Beban Operasional', unauditedDebit: 500000000, unauditedCredit: 0, pembandingDebit: 500000000, pembandingCredit: 0 },
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Template_TB');
  XLSX.writeFile(wb, 'Template_Import_TB_ATLAS.xlsx');
}
