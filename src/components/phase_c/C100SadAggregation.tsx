import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { computeFinalMateriality, evaluateSadAggregation } from '../../utils/cModuleFormulas';
import { formatAuditNumber } from '../../utils/formatters';

export const C100SadAggregation: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const [sourceKkp, setSourceKkp] = useState('L04');
  const [misstatementType, setMisstatementType] = useState<'Factual' | 'Projected' | 'Judgmental'>('Factual');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');

  const readOnly = activeEngagement ? isWorkpaperReadOnly(activeEngagement, 'C100') : true;

  const matEval = useMemo(
    () => (activeEngagement ? computeFinalMateriality(activeEngagement) : null),
    [activeEngagement]
  );

  const sadSummary = useMemo(() => {
    if (!activeEngagement || !matEval) return null;
    return evaluateSadAggregation(
      activeEngagement.moduleC.c100SadItems,
      matEval.pmFinal,
      matEval.amptFinal
    );
  }, [activeEngagement, matEval]);

  if (!activeEngagement || !matEval || !sadSummary) return null;

  const handleAddSad = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const numeric = Number(amountInput.replace(/,/g, ''));
    if (!description.trim() || !Number.isFinite(numeric) || numeric === 0) return;

    dispatchAction({
      type: 'UPSERT_SAD_ITEM',
      item: {
        id: `sad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sourceKkp: sourceKkp.trim() || 'Manual',
        description: description.trim(),
        type: misstatementType,
        amount: numeric,
      },
    });
    setDescription('');
    setAmountInput('');
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* KPI Header Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            PM Final (C110)
          </div>
          <div className="mt-1 text-base font-mono font-bold tabular-nums text-slate-900">
            Rp {formatAuditNumber(matEval.pmFinal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Batas agregasi SAD SA 450</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            AMPT Final (Clearly Trivial)
          </div>
          <div className="mt-1 text-base font-mono font-bold tabular-nums text-slate-900">
            Rp {formatAuditNumber(matEval.amptFinal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {sadSummary.trivialItemsCount} item di bawah AMPT diabaikan
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Akumulasi SAD (Neto / Absolut)
          </div>
          <div
            data-testid="c100-total-sad"
            className={`mt-1 text-base font-mono font-bold tabular-nums ${
              sadSummary.isSadMaterialVsPm ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            Rp {formatAuditNumber(sadSummary.totalAccumulatedSad)}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
            Absolut: Rp {formatAuditNumber(sadSummary.totalAbsAccumulatedSad)} ({sadSummary.accumulatedItemsCount} item)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Rincian Kategori SAD
          </div>
          <div className="mt-1 space-y-0.5 text-[11px] font-mono tabular-nums text-slate-700">
            <div className="flex justify-between">
              <span>Factual:</span>
              <span>{formatAuditNumber(sadSummary.totalFactual)}</span>
            </div>
            <div className="flex justify-between">
              <span>Projected:</span>
              <span>{formatAuditNumber(sadSummary.totalProjected)}</span>
            </div>
            <div className="flex justify-between">
              <span>Judgmental:</span>
              <span>{formatAuditNumber(sadSummary.totalJudgmental)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SA 450 Alert Banner */}
      {sadSummary.isSadMaterialVsPm ? (
        <div
          data-testid="c100-material-warning"
          className="bg-rose-50 border border-rose-300 rounded px-4 py-3 flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 space-y-1">
              <div className="font-bold">
                Peringatan Materialitas SA 450: Akumulasi SAD Mencapai atau Melebihi PM Final!
              </div>
              <p className="leading-relaxed">
                Total salah saji yang belum dikoreksi lebih besar atau sama dengan Performance Materiality Final (Rp{' '}
                {formatAuditNumber(matEval.pmFinal)}). Auditor wajib meminta manajemen membukukan jurnal AJE tambahan pada B100 atau memodifikasi opini audit pada C400.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex('C400')}
            className="shrink-0 px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-semibold rounded cursor-pointer"
          >
            Tinjau Opini C400
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Akumulasi salah saji belum dikoreksi masih di bawah Performance Materiality Final (Rp{' '}
            {formatAuditNumber(matEval.pmFinal)}).
          </span>
        </div>
      )}

      {/* Form Tambah SAD */}
      <form
        onSubmit={handleAddSad}
        className="bg-white border border-slate-200 rounded p-3 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end"
      >
        <div className="md:col-span-2">
          <label htmlFor="sad-source" className="block text-[11px] font-semibold text-slate-600 mb-1">
            Sumber KKP / Lead
          </label>
          <input
            id="sad-source"
            type="text"
            value={sourceKkp}
            disabled={readOnly}
            onChange={(e) => setSourceKkp(e.target.value)}
            placeholder="mis. L04 / B100"
            className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="sad-type" className="block text-[11px] font-semibold text-slate-600 mb-1">
            Jenis Salah Saji
          </label>
          <select
            id="sad-type"
            value={misstatementType}
            disabled={readOnly}
            onChange={(e) => setMisstatementType(e.target.value as 'Factual' | 'Projected' | 'Judgmental')}
            className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
          >
            <option value="Factual">Factual</option>
            <option value="Projected">Projected</option>
            <option value="Judgmental">Judgmental</option>
          </select>
        </div>
        <div className="md:col-span-5">
          <label htmlFor="sad-desc" className="block text-[11px] font-semibold text-slate-600 mb-1">
            Uraian Temuan Salah Saji (Belum Dikoreksi Manajemen)
          </label>
          <input
            id="sad-desc"
            data-testid="c100-input-desc"
            type="text"
            value={description}
            disabled={readOnly}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Kurang catat beban akrual atau proyeksi selisih sampling"
            className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="sad-amount" className="block text-[11px] font-semibold text-slate-600 mb-1">
            Nilai Dampak (Rp)
          </label>
          <input
            id="sad-amount"
            data-testid="c100-input-amount"
            type="number"
            value={amountInput}
            disabled={readOnly}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="0"
            className="w-full h-8 px-2.5 text-xs font-mono text-right bg-white border border-slate-300 rounded disabled:bg-slate-100"
          />
        </div>
        <div className="md:col-span-1">
          <button
            type="submit"
            disabled={readOnly || !description.trim() || !amountInput}
            data-testid="c100-add-btn"
            className="w-full h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </form>

      {/* Tabel SAD */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Ikhtisar Salah Saji yang Belum Dikoreksi (Summary of Audit Differences — SA 450)
          </span>
          <span className="text-[11px] text-slate-500">
            Item dengan |Nilai| &lt; AMPT Final otomatis diklasifikasikan sebagai Clearly Trivial
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2 px-3 text-left w-24">Sumber</th>
                <th className="py-2 px-3 text-left w-28">Kategori</th>
                <th className="py-2 px-3 text-left">Uraian Salah Saji</th>
                <th className="py-2 px-3 text-right w-40">Nilai Dampak (Rp)</th>
                <th className="py-2 px-3 text-center w-36">Klasifikasi AMPT</th>
                <th className="py-2 px-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sadSummary.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    Belum ada temuan salah saji tidak dikoreksi. Anda dapat menambahkan temuan secara manual di atas atau mengirim hasil proyeksi sampling dari KKP L02–L47.
                  </td>
                </tr>
              ) : (
                sadSummary.items.map((item) => (
                  <tr
                    key={item.id}
                    className={item.isClearlyTrivial ? 'bg-slate-50/70 text-slate-500' : 'hover:bg-slate-50'}
                  >
                    <td className="py-2 px-3 font-mono font-semibold text-indigo-700">
                      {item.sourceKkp}
                    </td>
                    <td className="py-2 px-3">{item.type}</td>
                    <td className="py-2 px-3 text-slate-800">{item.description}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatAuditNumber(item.amount)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {item.isClearlyTrivial ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                          Clearly Trivial
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold">
                          Terakumulasi SAD
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => dispatchAction({ type: 'DELETE_SAD_ITEM', itemId: item.id })}
                        aria-label={`Hapus item SAD ${item.description}`}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
