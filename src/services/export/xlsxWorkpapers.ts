import * as XLSX from 'xlsx';
import {
  ClientEntity,
  EngagementWorkspaceData,
  KapProfile,
  UserProfile,
} from '../../types/atlas';
import {
  buildLeadScheduleContext,
  computeSampleItemMisstatement,
  computeSamplingProjection,
} from '../../utils/leadSamplingFormulas';

export function exportLeadScheduleToXlsx(params: {
  kapProfile: KapProfile;
  client: ClientEntity;
  ws: EngagementWorkspaceData;
  users: UserProfile[];
  leadCode: string;
}): string {
  const { kapProfile, client, ws, users, leadCode } = params;
  const lead = ws.leadSchedules[leadCode];
  if (!lead) {
    throw new Error(`Lead Schedule ${leadCode} tidak ditemukan.`);
  }

  const ctx = buildLeadScheduleContext(ws, leadCode);
  const wp = ws.workingPapers[leadCode];
  const signOffLine = wp
    ? `Status: ${wp.status} | Prepared: ${wp.preparedBy ?? '-'} | Reviewed: ${wp.reviewedBy ?? '-'} | Locked: ${wp.partnerLockedBy ?? '-'}`
    : 'Status: Draft';

  const userNameMap = new Map(users.map((u) => [u.id, `${u.inisial} - ${u.namaLengkap}`]));

  // Tab 1: Lead Schedule & Mutasi
  const leadAoa: (string | number)[][] = [
    [kapProfile.namaKap.toUpperCase()],
    [`LEAD SCHEDULE ${lead.leadCode} — ${lead.title.toUpperCase()} (Ref Sheet ${lead.atlasSheetNumber})`],
    [`Klien: ${client.namaKlien} | Tahun Buku: ${ws.header.tahunBuku} | Kategori: ${lead.accountCategory} | Saldo Normal: ${lead.normalBalance}`],
    [signOffLine],
    [
      `Konteks Risiko (A270): Overall RoMM = ${ctx.rommLevel}`,
      `OM (A210) = ${ctx.overallMateriality}`,
      `PM (A210) = ${ctx.performanceMateriality}`,
      `AMPT (A210) = ${ctx.ampt}`,
    ],
    [],
    [
      'Kode Akun',
      'Nama Akun',
      'Header Akun',
      'Unaudited',
      'AJE (Accepted)',
      'RJE (Accepted)',
      'Audited',
      'Prior Audited',
      'Selisih (Rp)',
      'Selisih (%)',
    ],
    ...(ctx.accounts.length > 0
      ? ctx.accounts.map((r) => [
          r.kodeAkun,
          r.namaAkun,
          r.headerAkun,
          r.unauditedNet,
          r.ajeNet,
          r.rjeNet,
          r.auditedNet,
          r.priorAudited,
          r.varianceAmount,
          r.variancePercent === null ? 'N/A' : Number(r.variancePercent.toFixed(2)),
        ])
      : [['-', 'Belum ada akun Trial Balance yang dipetakan ke Lead ini', '', 0, 0, 0, 0, 0, 0, '0.00']]),
    [
      'TOTAL',
      '',
      '',
      ctx.totalUnaudited,
      ctx.totalAjeNet,
      ctx.totalRjeNet,
      ctx.totalAudited,
      ctx.totalPriorAudited,
      ctx.varianceAmount,
      ctx.variancePercent === null ? 'N/A' : Number(ctx.variancePercent.toFixed(2)),
    ],
    [],
    ['Simpulan Audit Lead', lead.auditConclusion],
    ['Catatan Simpulan', lead.conclusionNotes || '-'],
  ];

  // Tab 2: Program Prosedur Substantif
  const procAoa: (string | number)[][] = [
    [kapProfile.namaKap.toUpperCase()],
    [`PROGRAM PROSEDUR SUBSTANTIF (SAP & TOD) — ${lead.leadCode} ${lead.title}`],
    [`Klien: ${client.namaKlien} | Tahun Buku: ${ws.header.tahunBuku}`],
    [],
    [
      'No.',
      'Tipe Prosedur',
      'Uraian Prosedur Substantif',
      'Asersi',
      'Status Pelaksanaan',
      'PIC',
      'Ref KKP',
      'Simpulan / Catatan',
    ],
    ...lead.procedures.map((p) => [
      p.procedureNumber,
      p.procedureType,
      p.procedureText,
      p.targetAssertions,
      p.executionStatus,
      p.picUserId ? userNameMap.get(p.picUserId) ?? p.picUserId : '-',
      p.workpaperReference || '-',
      p.auditConclusion || '-',
    ]),
  ];

  // Tab 3: Kalkulator Sampling ISA SA 530
  const sr = lead.samplingRun;
  const samplingAoa: (string | number)[][] = [
    [kapProfile.namaKap.toUpperCase()],
    [`KALKULATOR SAMPLING AUDIT ISA SA 530 — ${lead.leadCode} ${lead.title}`],
    [`Klien: ${client.namaKlien} | Tahun Buku: ${ws.header.tahunBuku}`],
    [],
  ];

  if (!sr) {
    samplingAoa.push(['Status Sampling', 'Belum ada sesi sampling ISA SA 530 yang disimpan untuk pos ini.']);
    samplingAoa.push(['RoMM A270 Terkini', ctx.rommLevel]);
    samplingAoa.push(['Performance Materiality (A210)', ctx.performanceMateriality]);
  } else {
    const proj = computeSamplingProjection({
      totalPopulationValue: sr.totalPopulationValue,
      totalPopulationItems: sr.totalPopulationItems,
      performanceMateriality: sr.performanceMateriality,
      projectionMethod: sr.projectionMethod,
      samples: sr.samples,
    });
    samplingAoa.push(
      ['Parameter Sampling', 'Nilai'],
      ['Tanggal Run', sr.runDate],
      ['RoMM (A270)', sr.rommLevel],
      ['SAP Assurance', sr.sapAssurance],
      ['Confidence Factor (CF)', sr.confidenceFactor],
      ['Performance Materiality (PM)', sr.performanceMateriality],
      ['Sampling Interval (PM / CF)', sr.samplingInterval],
      ['Total Populasi (Book Value)', sr.totalPopulationValue],
      ['Total Item Populasi (N)', sr.totalPopulationItems],
      ['Specific Items Value', sr.specificItemsValue],
      ['Specific Items Count', sr.specificItemsCount],
      ['Tested Population Value', sr.testedPopulationValue],
      ['Calculated Sample Size (Math.ceil)', sr.calculatedSampleSize],
      ['Actual Sample Tested', sr.samples.length],
      ['Metode Proyeksi Dipilih', sr.projectionMethod],
      ['Proyeksi Rasio (Rp)', proj.ratioProjectedMisstatement],
      ['Proyeksi Difference (Rp)', proj.differenceProjectedMisstatement],
      ['Proyeksi Salah Saji Terpilih (Rp)', proj.selectedProjectedMisstatement],
      ['Kesimpulan Materialitas (|Proj| >= PM)', sr.isMisstatementMaterial ? 'MATERIAL (>= PM)' : 'TIDAK MATERIAL (< PM)'],
      ['Catatan Evaluator', sr.evaluatorNotes || '-'],
      [],
      [
        'No. Sampel',
        'Tgl Transaksi',
        'No. Dokumen / Bukti',
        'Uraian',
        'Pihak Lawan',
        'Book Value Sample (BVS)',
        'Audited Value Sample (AVS)',
        'Salah Saji Faktual (BVS - AVS)',
        'Sifat Salah Saji',
        'Anomali',
        'Catatan Audit',
      ],
      ...sr.samples.map((s) => [
        s.sampleNumber,
        s.transactionDate,
        s.documentReference,
        s.description,
        s.counterparty,
        s.bookValue,
        s.auditedValue,
        computeSampleItemMisstatement(s.bookValue, s.auditedValue),
        s.misstatementNature || '-',
        s.isAnomaly ? 'Ya' : 'Tidak',
        s.auditNotes || '-',
      ]),
      [
        'TOTAL SAMPEL',
        '',
        '',
        '',
        '',
        proj.sumBvs,
        proj.sumAvs,
        proj.factualMisstatementTotal,
        '',
        '',
        '',
      ]
    );
  }

  const wb = XLSX.utils.book_new();

  const wsLead = XLSX.utils.aoa_to_sheet(leadAoa);
  wsLead['!cols'] = [
    { wch: 14 },
    { wch: 34 },
    { wch: 24 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLead, `Lead_Schedule_${lead.leadCode}`.slice(0, 31));

  const wsProcs = XLSX.utils.aoa_to_sheet(procAoa);
  wsProcs['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 56 },
    { wch: 16 },
    { wch: 20 },
    { wch: 22 },
    { wch: 14 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsProcs, 'Prosedur_Substantif');

  const wsSamp = XLSX.utils.aoa_to_sheet(samplingAoa);
  wsSamp['!cols'] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 20 },
    { wch: 30 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 10 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSamp, 'Sampling_ISA_SA530');

  const safeClient = client.namaKlien.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const filename = `Lead_${lead.leadCode}_${safeClient}_${ws.header.tahunBuku}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
