import React, { useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { COA_GROUP_OPTIONS, COA_KELOMPOK_BY_GROUP } from '../../data/bCoreCatalog';
import { MASTER_LEAD_HEADERS } from '../../data/masterLeadHeaders';
import { downloadSampleTbTemplateXlsx } from '../../services/export/xlsxWstbExporter';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { FsAccountGroup, TrialBalanceAccount } from '../../types/atlas';
import {
  parseWorkbookBufferToTbAccounts,
  validateTrialBalanceImport,
} from '../../utils/bCoreFormulas';
import { formatAuditNumber } from '../../utils/formatters';

export const TrialBalanceImporter: React.FC = () => {
  const { activeEngagement, dispatchAction, showToast } = useAtlas();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draftAccounts, setDraftAccounts] = useState<TrialBalanceAccount[] | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const activeRows = draftAccounts ?? activeEngagement?.trialBalance ?? [];
  const validation = useMemo(() => validateTrialBalanceImport(activeRows), [activeRows]);

  if (!activeEngagement) return null;
  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'B100');

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseWorkbookBufferToTbAccounts(buf);
      setDraftAccounts(parsed);
      setUploadedFileName(file.name);
      const val = validateTrialBalanceImport(parsed);
      if (!val.valid) {
        showToast('error', val.errors[0] ?? 'Validasi Pra-Impor menemukan kesalahan.');
      } else {
        showToast('info', `${parsed.length} baris dari "${file.name}" siap ditinjau & dipetakan.`);
      }
    } catch (err) {
      showToast('error', `Gagal membaca file Excel/CSV: ${(err as Error).message}`);
    }
  };

  const updateRowMapping = (
    accId: string,
    patch: Partial<
      Pick<
        TrialBalanceAccount,
        'posisiNormal' | 'groupAkun' | 'kelompokAkun' | 'headerAkun' | 'leadCode' | 'isClosingReAccount' | 'isOciAccount'
      >
    >
  ) => {
    if (draftAccounts) {
      setDraftAccounts((prev) =>
        prev ? prev.map((a) => (a.id === accId ? { ...a, ...patch } : a)) : prev
      );
    } else {
      dispatchAction({
        type: 'UPDATE_TRIAL_BALANCE_MAPPING',
        accountId: accId,
        patch,
      });
    }
  };

  const commitDraftToStore = () => {
    if (!draftAccounts || !validation.valid || isReadOnly) return;
    dispatchAction({ type: 'IMPORT_TRIAL_BALANCE', accounts: draftAccounts });
    setDraftAccounts(null);
    setUploadedFileName('');
  };

  return (
    <div className="space-y-4">
      {/* Dropzone & Template */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Impor Trial Balance Excel / CSV (SheetJS) & Pemetaan 3-Tingkat COA
            </h3>
            <p className="text-[11px] text-slate-500">
              Kolom didukung: kodeAkun, namaAkun, unauditedDebit / unauditedCredit (atau saldoBerjalan), pembandingDebit / pembandingCredit (atau saldoPembanding).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadSampleTbTemplateXlsx}
              className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Template TB (.xlsx)
            </button>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!isReadOnly) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (isReadOnly) return;
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          className={`border-2 border-dashed rounded p-4 text-center transition-colors ${
            isDragging
              ? 'border-slate-900 bg-slate-100'
              : 'border-slate-300 bg-slate-50/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            disabled={isReadOnly}
            aria-label="Upload file Trial Balance Excel atau CSV"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = '';
            }}
            className="hidden"
          />
          <FileSpreadsheet className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
          <div className="text-xs font-medium text-slate-800">
            {uploadedFileName
              ? `Preview File Aktif: ${uploadedFileName} (${draftAccounts?.length ?? 0} akun)`
              : 'Seret file .xlsx / .csv ke area ini atau pilih file dari komputer'}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Pilih File TB (.xlsx / .csv)
            </button>
            {draftAccounts && (
              <button
                type="button"
                onClick={() => {
                  setDraftAccounts(null);
                  setUploadedFileName('');
                }}
                className="h-8 px-3 rounded border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal Preview
              </button>
            )}
          </div>
        </div>

        {/* Pre-import validation banner */}
        <div
          data-testid="tb-validation-panel"
          className={`p-3 rounded border text-xs flex flex-wrap items-center justify-between gap-3 ${
            validation.valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              {validation.valid ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertOctagon className="w-4 h-4 shrink-0" />
              )}
              <span>
                {validation.valid
                  ? `Validasi Pra-Impor Lulus (${activeRows.length} akun · Debit = Kredit)`
                  : 'Validasi Pra-Impor Gagal — Data Ditolak Sebelum Masuk Store'}
              </span>
            </div>
            {validation.errors.length > 0 && (
              <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center gap-4 font-mono tabular-nums text-[11px]">
            <div>
              <span className="text-slate-500">Total Dr: </span>
              <strong>Rp {formatAuditNumber(validation.totalUnauditedDebit)}</strong>
            </div>
            <div>
              <span className="text-slate-500">Total Cr: </span>
              <strong>Rp {formatAuditNumber(validation.totalUnauditedCredit)}</strong>
            </div>
            <div>
              <span className="text-slate-500">Selisih: </span>
              <strong className={Math.abs(validation.unbalancedDifference) >= 0.01 ? 'text-rose-700' : ''}>
                Rp {formatAuditNumber(validation.unbalancedDifference)}
              </strong>
            </div>
            {draftAccounts && (
              <button
                type="button"
                data-testid="tb-commit-import"
                disabled={!validation.valid || isReadOnly}
                onClick={commitDraftToStore}
                className="h-8 px-3 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-sans font-semibold text-xs disabled:opacity-40 cursor-pointer"
              >
                Terapkan TB ke Workspace
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-Level Mapping Table */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Pemetaan COA 3-Tingkat ({draftAccounts ? 'Preview Impor Baru' : 'TB Aktif di Workspace'})
          </h3>
          <span className="text-[11px] text-slate-500">
            Mengubah Group / LeadCode otomatis menyinkronkan WSTB, FS (B120), dan A210/A240/A270.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600">
                <th className="py-2 px-2 text-left font-semibold">Kode</th>
                <th className="py-2 px-2 text-left font-semibold">Nama Akun</th>
                <th className="py-2 px-2 text-left font-semibold">Group Akun (Tk. 1)</th>
                <th className="py-2 px-2 text-left font-semibold">Kelompok (Tk. 2)</th>
                <th className="py-2 px-2 text-left font-semibold">Lead Schedule (Tk. 3)</th>
                <th className="py-2 px-2 text-center font-semibold">Penutup RE</th>
                <th className="py-2 px-2 text-center font-semibold">OCI</th>
                <th className="py-2 px-2 text-right font-semibold">Unaudited Dr</th>
                <th className="py-2 px-2 text-right font-semibold">Unaudited Cr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeRows.map((acc) => {
                const isDup = validation.duplicateCodes.includes(acc.kodeAkun.trim());
                return (
                  <tr key={acc.id} className={isDup ? 'bg-rose-50' : 'hover:bg-slate-50'}>
                    <td className="py-1.5 px-2 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {acc.kodeAkun}
                    </td>
                    <td className="py-1.5 px-2 text-slate-900 min-w-[180px]">{acc.namaAkun}</td>
                    <td className="py-1.5 px-2">
                      <select
                        aria-label={`Group ${acc.kodeAkun}`}
                        disabled={isReadOnly}
                        value={acc.groupAkun}
                        onChange={(e) => {
                          const g = e.target.value as FsAccountGroup;
                          const defaultKelompok = COA_KELOMPOK_BY_GROUP[g][0];
                          updateRowMapping(acc.id, {
                            groupAkun: g,
                            kelompokAkun: defaultKelompok,
                            posisiNormal: g === 'ASET' || g === 'BEBAN' ? 'Debit' : 'Kredit',
                          });
                        }}
                        className="h-7 px-1.5 text-[11px] bg-white border border-slate-300 rounded text-slate-800"
                      >
                        {COA_GROUP_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        aria-label={`Kelompok ${acc.kodeAkun}`}
                        disabled={isReadOnly}
                        value={acc.kelompokAkun}
                        onChange={(e) => updateRowMapping(acc.id, { kelompokAkun: e.target.value })}
                        className="h-7 px-1.5 text-[11px] bg-white border border-slate-300 rounded text-slate-800"
                      >
                        {COA_KELOMPOK_BY_GROUP[acc.groupAkun].map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      {(() => {
                        const masterCodes = new Set(MASTER_LEAD_HEADERS.map((m) => m.leadCode));
                        const customLeads = Object.values(activeEngagement.leadSchedules)
                          .filter((ls) => !masterCodes.has(ls.leadCode))
                          .map((ls) => ({ leadCode: ls.leadCode, title: ls.title }));
                        const allLeadOptions = [
                          ...MASTER_LEAD_HEADERS.map((lh) => ({
                            leadCode: lh.leadCode,
                            title: lh.title,
                          })),
                          ...customLeads,
                        ];
                        return (
                          <select
                            aria-label={`Lead ${acc.kodeAkun}`}
                            disabled={isReadOnly}
                            value={acc.leadCode}
                            onChange={(e) => {
                              const lc = e.target.value;
                              const lh = allLeadOptions.find((l) => l.leadCode === lc);
                              updateRowMapping(acc.id, {
                                leadCode: lc,
                                headerAkun: lh?.title ?? acc.headerAkun,
                              });
                            }}
                            className="h-7 px-1.5 text-[11px] font-mono bg-white border border-slate-300 rounded text-slate-800 max-w-[180px]"
                          >
                            {allLeadOptions.map((lh) => (
                              <option key={lh.leadCode} value={lh.leadCode}>
                                {lh.leadCode} — {lh.title}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Penutup RE ${acc.kodeAkun}`}
                        disabled={isReadOnly}
                        checked={acc.isClosingReAccount}
                        onChange={(e) =>
                          updateRowMapping(acc.id, { isClosingReAccount: e.target.checked })
                        }
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`OCI ${acc.kodeAkun}`}
                        disabled={isReadOnly}
                        checked={acc.isOciAccount}
                        onChange={(e) =>
                          updateRowMapping(acc.id, { isOciAccount: e.target.checked })
                        }
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {formatAuditNumber(acc.unauditedDebit)}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {formatAuditNumber(acc.unauditedCredit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
