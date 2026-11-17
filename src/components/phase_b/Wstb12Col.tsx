import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { exportWstbToXlsx } from '../../services/export/xlsxWstbExporter';
import { useAtlas } from '../../store/AtlasContext';
import {
  computeFinancialStatements,
  computeWstb12Columns,
  computeWstbTotals,
  getAccountJournalMovements,
} from '../../utils/bCoreFormulas';
import { formatAuditNumber } from '../../utils/formatters';
import { JournalsAjeRje } from './JournalsAjeRje';
import { TrialBalanceImporter } from './TrialBalanceImporter';

type B100Tab = 'WSTB' | 'JOURNALS' | 'IMPORT';

export const Wstb12Col: React.FC = () => {
  const { state, activeEngagement, activeClient, dispatchAction, setActiveIndex, showToast } =
    useAtlas();
  const [activeTab, setActiveTab] = useState<B100Tab>('WSTB');
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [drilldown, setDrilldown] = useState<{
    accountId: string;
    kodeAkun: string;
    namaAkun: string;
    jenis?: 'AJE' | 'RJE';
  } | null>(null);

  const wstbRows = useMemo(() => {
    if (!activeEngagement) return [];
    return computeWstb12Columns(activeEngagement.trialBalance, activeEngagement.journals);
  }, [activeEngagement]);

  const totals = useMemo(() => {
    if (!activeEngagement) return null;
    return computeWstbTotals(wstbRows, activeEngagement.trialBalance);
  }, [wstbRows, activeEngagement]);

  const fs = useMemo(() => {
    if (!activeEngagement) return null;
    return computeFinancialStatements(activeEngagement.trialBalance, activeEngagement.journals);
  }, [activeEngagement]);

  if (!activeEngagement || !activeClient || !totals || !fs) return null;

  const filteredRows = wstbRows.filter((r) => {
    if (groupFilter !== 'ALL' && r.groupAkun !== groupFilter) return false;
    const q = query.trim().toLowerCase();
    if (
      q &&
      !r.kodeAkun.toLowerCase().includes(q) &&
      !r.namaAkun.toLowerCase().includes(q) &&
      !r.leadCode.toLowerCase().includes(q) &&
      !r.headerAkun.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  const acceptedCount = activeEngagement.journals.filter(
    (j) => j.statusPersetujuan === 'Accepted'
  ).length;
  const proposedCount = activeEngagement.journals.filter(
    (j) => j.statusPersetujuan === 'Proposed'
  ).length;

  const drilldownJournals = drilldown
    ? getAccountJournalMovements(activeEngagement.journals, drilldown.accountId, drilldown.jenis)
    : [];

  const handleExportXlsx = () => {
    const filename = exportWstbToXlsx({
      kapProfile: state.kapProfile,
      client: activeClient,
      header: activeEngagement.header,
      trialBalance: activeEngagement.trialBalance,
      journals: activeEngagement.journals,
    });
    showToast('success', `File Excel WSTB "${filename}" berhasil diunduh.`);
  };

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header & Sub-Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 330 & SA 450 · WORKING SHEET TRIAL BALANCE 12 KOLOM
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              B100 — Working Trial Balance (WSTB), Impor TB & Jurnal AJE/RJE
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hanya jurnal berstatus <strong>Accepted</strong> yang masuk ke saldo Audited. Klik angka mutasi AJE/RJE untuk melihat rincian jurnal sumber.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span
              data-testid="b100-neraca-badge"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold ${
                fs.neraca.isNeracaBalanced
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              {fs.neraca.isNeracaBalanced ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertOctagon className="w-3.5 h-3.5" />
              )}
              {fs.neraca.isNeracaBalanced
                ? 'NERACA BALANCED'
                : `TIDAK SEIMBANG (Selisih Rp ${formatAuditNumber(fs.neraca.selisihNeraca)})`}
            </span>
            <button
              type="button"
              onClick={handleExportXlsx}
              className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              Export WSTB (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex('B120')}
              className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5" />
              Laporan Keuangan (B120)
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('WSTB')}
              className={`h-8 px-3 rounded text-xs font-medium border cursor-pointer whitespace-nowrap ${
                activeTab === 'WSTB'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              WSTB 12 Kolom ({wstbRows.length} Akun)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('JOURNALS')}
              className={`h-8 px-3 rounded text-xs font-medium border cursor-pointer whitespace-nowrap ${
                activeTab === 'JOURNALS'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Jurnal AJE / RJE ({acceptedCount} Accepted · {proposedCount} Proposed)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('IMPORT')}
              className={`h-8 px-3 rounded text-xs font-medium border cursor-pointer whitespace-nowrap ${
                activeTab === 'IMPORT'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Impor TB (.xlsx/.csv) & Mapping COA
            </button>
          </div>

          {activeTab === 'WSTB' && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter Group Akun"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-700"
              >
                <option value="ALL">Semua Group</option>
                <option value="ASET">ASET</option>
                <option value="LIABILITAS">LIABILITAS</option>
                <option value="EKUITAS_ASET_BERSIH">EKUITAS</option>
                <option value="PENDAPATAN">PENDAPATAN</option>
                <option value="BEBAN">BEBAN</option>
              </select>
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari kode / nama akun / Lead..."
                  className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: WSTB 12 Kolom */}
      {activeTab === 'WSTB' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10.5px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                  <th rowSpan={2} className="py-2 px-1.5 text-left font-semibold border-r border-slate-200 whitespace-nowrap">
                    Kode
                  </th>
                  <th rowSpan={2} className="py-2 px-1.5 text-left font-semibold border-r border-slate-200">
                    Nama Akun
                  </th>
                  <th rowSpan={2} className="py-2 px-1.5 text-left font-semibold border-r border-slate-200">
                    Lead / Header
                  </th>
                  <th colSpan={2} className="py-1.5 px-1.5 text-center font-semibold border-r border-slate-200">
                    Unaudited
                  </th>
                  <th colSpan={2} className="py-1.5 px-1.5 text-center font-semibold border-r border-slate-200 bg-sky-50/70">
                    AJE (Acc.)
                  </th>
                  <th colSpan={2} className="py-1.5 px-1.5 text-center font-semibold border-r border-slate-200 bg-amber-50/70">
                    RJE (Acc.)
                  </th>
                  <th colSpan={2} className="py-1.5 px-1.5 text-center font-semibold border-r border-slate-200 bg-emerald-50/70">
                    Audited
                  </th>
                  <th rowSpan={2} className="py-2 px-1.5 text-right font-semibold whitespace-nowrap">
                    Prior Audited
                  </th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-600">
                  <th className="py-1 px-1.5 text-right font-semibold">Debit</th>
                  <th className="py-1 px-1.5 text-right font-semibold border-r border-slate-200">Kredit</th>
                  <th className="py-1 px-1.5 text-right font-semibold bg-sky-50/50">Debit</th>
                  <th className="py-1 px-1.5 text-right font-semibold border-r border-slate-200 bg-sky-50/50">Kredit</th>
                  <th className="py-1 px-1.5 text-right font-semibold bg-amber-50/50">Debit</th>
                  <th className="py-1 px-1.5 text-right font-semibold border-r border-slate-200 bg-amber-50/50">Kredit</th>
                  <th className="py-1 px-1.5 text-right font-semibold bg-emerald-50/50">Debit</th>
                  <th className="py-1 px-1.5 text-right font-semibold border-r border-slate-200 bg-emerald-50/50">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.accountId} className="hover:bg-slate-50">
                    <td className="py-1.5 px-1.5 font-mono font-semibold text-slate-800 whitespace-nowrap border-r border-slate-100">
                      {row.kodeAkun}
                    </td>
                    <td className="py-1.5 px-1.5 text-slate-900 font-medium max-w-[140px] leading-tight border-r border-slate-100">
                      {row.namaAkun}
                    </td>
                    <td className="py-1.5 px-1.5 text-slate-600 max-w-[130px] leading-tight border-r border-slate-100">
                      <button
                        type="button"
                        onClick={() => setActiveIndex(row.leadCode)}
                        className="inline-flex items-start gap-1 hover:underline text-left cursor-pointer"
                        title={`Buka Lead Schedule ${row.leadCode}`}
                      >
                        <span className="font-mono font-semibold text-slate-800 shrink-0">{row.leadCode}</span>
                        <span>· {row.headerAkun}</span>
                      </button>
                    </td>
                    <td className="py-1.5 px-1.5 font-mono tabular-nums text-right text-slate-800 whitespace-nowrap">
                      {row.unauditedDebit ? formatAuditNumber(row.unauditedDebit) : '-'}
                    </td>
                    <td className="py-1.5 px-1.5 font-mono tabular-nums text-right text-slate-800 whitespace-nowrap border-r border-slate-100">
                      {row.unauditedCredit ? formatAuditNumber(row.unauditedCredit) : '-'}
                    </td>
                    <td className="py-1.5 px-1.5 font-mono tabular-nums text-right whitespace-nowrap bg-sky-50/20">
                      {row.ajeDebit ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDrilldown({
                              accountId: row.accountId,
                              kodeAkun: row.kodeAkun,
                              namaAkun: row.namaAkun,
                              jenis: 'AJE',
                            })
                          }
                          className="text-sky-700 font-semibold underline cursor-pointer"
                        >
                          {formatAuditNumber(row.ajeDebit)}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-1.5 font-mono tabular-nums text-right whitespace-nowrap border-r border-slate-100 bg-sky-50/20">
                      {row.ajeCredit ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDrilldown({
                              accountId: row.accountId,
                              kodeAkun: row.kodeAkun,
                              namaAkun: row.namaAkun,
                              jenis: 'AJE',
                            })
                          }
                          className="text-sky-700 font-semibold underline cursor-pointer"
                        >
                          {formatAuditNumber(row.ajeCredit)}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-1.5 font-mono tabular-nums text-right whitespace-nowrap bg-amber-50/20">
                      {row.rjeDebit ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDrilldown({
                              accountId: row.accountId,
                              kodeAkun: row.kodeAkun,
                              namaAkun: row.namaAkun,
                              jenis: 'RJE',
                            })
                          }
                          className="text-amber-700 font-semibold underline cursor-pointer"
                        >
                          {formatAuditNumber(row.rjeDebit)}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-1.5 font-mono tabular-nums text-right whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                      {row.rjeCredit ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDrilldown({
                              accountId: row.accountId,
                              kodeAkun: row.kodeAkun,
                              namaAkun: row.namaAkun,
                              jenis: 'RJE',
                            })
                          }
                          className="text-amber-700 font-semibold underline cursor-pointer"
                        >
                          {formatAuditNumber(row.rjeCredit)}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-1.5 font-mono tabular-nums text-right font-semibold text-slate-900 whitespace-nowrap bg-emerald-50/20">
                      {row.auditedDebit ? formatAuditNumber(row.auditedDebit) : '-'}
                    </td>
                    <td className="py-1.5 px-1.5 font-mono tabular-nums text-right font-semibold text-slate-900 whitespace-nowrap border-r border-slate-100 bg-emerald-50/20">
                      {row.auditedCredit ? formatAuditNumber(row.auditedCredit) : '-'}
                    </td>
                    <td className="py-1.5 px-1.5 font-mono tabular-nums text-right text-slate-700 whitespace-nowrap">
                      {formatAuditNumber(row.priorAudited)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-mono tabular-nums text-[10.5px] font-bold">
                  <td colSpan={3} className="py-2 px-1.5 text-left font-sans">
                    TOTAL ({wstbRows.length} Akun)
                  </td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatAuditNumber(totals.unauditedDebit)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatAuditNumber(totals.unauditedCredit)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatAuditNumber(totals.ajeDebit)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatAuditNumber(totals.ajeCredit)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatAuditNumber(totals.rjeDebit)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatAuditNumber(totals.rjeCredit)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatAuditNumber(totals.auditedDebit)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatAuditNumber(totals.auditedCredit)}</td>
                  <td
                    className="py-2 px-1.5 text-right text-slate-300 whitespace-nowrap"
                    title="Total Prior Audited (Debit = Kredit)"
                  >
                    {formatAuditNumber(totals.priorAuditedDebit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Jurnal AJE/RJE */}
      {activeTab === 'JOURNALS' && <JournalsAjeRje />}

      {/* TAB 3: Impor TB & Mapping */}
      {activeTab === 'IMPORT' && <TrialBalanceImporter />}

      {/* Catatan Simpulan WSTB */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <label htmlFor="b100-catatan" className="block text-xs font-semibold text-slate-700 mb-1">
          Catatan Simpulan Working Trial Balance (B100)
        </label>
        <textarea
          id="b100-catatan"
          rows={2}
          value={activeEngagement.workingPapers['B100']?.catatanSimpulan ?? ''}
          onChange={(e) =>
            dispatchAction({
              type: 'UPDATE_WORKPAPER_NOTES',
              kodeIndeks: 'B100',
              catatanSimpulan: e.target.value,
            })
          }
          placeholder="Ringkasan rekonsiliasi saldo unaudited ke audited dan kontrol keseimbangan AJE/RJE..."
          className="w-full p-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
        />
      </div>

      {/* Modal Drill-down Jurnal */}
      {drilldown && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Rincian mutasi ${drilldown.kodeAkun}`}
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded shadow-xl w-full max-w-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Drill-Down Jurnal {drilldown.jenis ?? ''} — {drilldown.kodeAkun} {drilldown.namaAkun}
              </h3>
              <button
                type="button"
                aria-label="Tutup drill-down"
                onClick={() => setDrilldown(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {drilldownJournals.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                Tidak ada jurnal berstatus Accepted pada akun ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {drilldownJournals.map((j) => (
                  <div key={j.id} className="p-2.5 rounded border border-slate-200 bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono font-semibold">
                      <span>{j.nomorJurnal} (Ref: {j.referensiKkp})</span>
                      <span>{j.tanggalJurnal}</span>
                    </div>
                    <p className="text-slate-700">{j.keterangan}</p>
                    <div className="font-mono text-[11px] text-slate-600">
                      {j.lines
                        .filter((l) => l.accountId === drilldown.accountId)
                        .map((l) => `${l.posisi}: Rp ${formatAuditNumber(l.nilai)}`)
                        .join(' | ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
