import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  ENTITY_CHARACTERISTICS_OPTIONS,
  MATERIALITY_BENCHMARKS,
  PERTIMBANGAN_OM_GUIDANCE,
} from '../../data/a2Catalog';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { MaterialityBenchmark } from '../../types/atlas';
import {
  canSignOffA210Prepared,
  computeBenchmarkValueFromTrialBalance,
  validateA210Materiality,
} from '../../utils/a2Formulas';
import { formatAuditNumber } from '../../utils/formatters';

export const A210Materiality: React.FC = () => {
  const { activeEngagement, activeClient, dispatchAction, setActiveIndex } = useAtlas();
  const [amptRejectMsg, setAmptRejectMsg] = useState<string | null>(null);

  const benchmarkSummary = useMemo(() => {
    if (!activeEngagement) return [];
    return MATERIALITY_BENCHMARKS.map((spec) => ({
      ...spec,
      computedAmount: computeBenchmarkValueFromTrialBalance(
        activeEngagement.trialBalance,
        spec.benchmark,
        activeEngagement.journals,
        activeEngagement.a210.customBenchmarkValue ?? 0
      ),
    }));
  }, [activeEngagement]);

  if (!activeEngagement || !activeClient) {
    return (
      <div className="p-6 text-xs text-slate-500 bg-white border border-slate-200 rounded">
        Belum ada perikatan aktif. Pilih atau buat perikatan melalui Engagement Hub.
      </div>
    );
  }

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A210');
  const { a210, a240Rows } = activeEngagement;
  const validation = validateA210Materiality(a210);
  const signGate = canSignOffA210Prepared(a210);
  const selectedSpec = MATERIALITY_BENCHMARKS.find((b) => b.benchmark === a210.acuanSaldo);
  const charMeta = ENTITY_CHARACTERISTICS_OPTIONS.find(
    (c) => c.value === a210.karakteristikEntitas
  );
  const sigAccountCount = a240Rows.filter((r) => r.isSignificantAccount).length;

  const handleAmptChange = (rawValue: string) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    if (parsed > 5 || parsed < 0) {
      setAmptRejectMsg(
        `Nilai ${parsed}% ditolak: SA 320 membatasi AMPT maksimal 5% dari Performance Materiality.`
      );
      dispatchAction({
        type: 'UPDATE_A210',
        patch: { marginAmptPersen: parsed },
      });
      return;
    }
    setAmptRejectMsg(null);
    dispatchAction({
      type: 'UPDATE_A210',
      patch: { marginAmptPersen: parsed },
    });
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header & Ringkasan Hasil Materialitas */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 320 · MATERIALITAS PERENCANAAN & PELAKSANAAN AUDIT
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A210 — Penentuan Materialitas Awal (OM, PM & AMPT)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Saldo acuan ditarik dinamis dari agregasi WSTB / Laporan Keuangan {activeClient.namaKlien} ({activeEngagement.trialBalance.length} akun TB).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => dispatchAction({ type: 'SYNC_A210_FROM_TB' })}
              data-testid="a210-sync-tb"
              className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sinkron Saldo WSTB
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex('A240')}
              className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white cursor-pointer whitespace-nowrap"
            >
              Akun Signifikan ({sigAccountCount})
            </button>
          </div>
        </div>

        {/* 4 KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Saldo Acuan ({a210.acuanSaldo})
            </div>
            <div
              data-testid="a210-saldo-acuan"
              className="text-base font-mono tabular-nums font-bold text-slate-900 mt-1 text-right"
            >
              Rp {formatAuditNumber(a210.nilaiSaldoAcuan)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 text-right">Dinamis dari FS/WSTB</div>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Overall Materiality (OM)
            </div>
            <div
              data-testid="a210-nilai-om"
              className="text-base font-mono tabular-nums font-bold text-slate-900 mt-1 text-right"
            >
              Rp {formatAuditNumber(a210.nilaiOm)}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5 text-right">
              {a210.marginOmPersen}% × Acuan Saldo
            </div>
          </div>

          <div
            className={`p-3 rounded border ${
              validation.pmOutOfRange ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Performance Materiality (PM)
            </div>
            <div
              data-testid="a210-nilai-pm"
              className="text-base font-mono tabular-nums font-bold text-slate-900 mt-1 text-right"
            >
              Rp {formatAuditNumber(a210.nilaiPm)}
            </div>
            <div
              className={`text-[11px] font-mono tabular-nums mt-0.5 text-right ${
                validation.pmOutOfRange ? 'text-rose-700 font-semibold' : 'text-slate-500'
              }`}
            >
              {a210.marginPmPersen}% × OM (Wajar 50%–80%)
            </div>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Clearly Trivial (AMPT)
            </div>
            <div
              data-testid="a210-nilai-ampt"
              className="text-base font-mono tabular-nums font-bold text-slate-900 mt-1 text-right"
            >
              Rp {formatAuditNumber(a210.nilaiAmpt)}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5 text-right">
              {a210.marginAmptPersen}% × PM (Maks 5%)
            </div>
          </div>
        </div>
      </div>

      {/* Validasi Peringatan & Gate Readiness */}
      {amptRejectMsg && (
        <div
          role="alert"
          data-testid="a210-ampt-error"
          className="p-3 rounded border border-rose-300 bg-rose-50 text-xs text-rose-800 flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-700" />
          <span>{amptRejectMsg}</span>
        </div>
      )}

      {validation.pmOutOfRange && (
        <div
          role="alert"
          data-testid="a210-pm-warning"
          className="p-3 rounded border border-rose-300 bg-rose-50 text-xs text-rose-800 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" />
          <div>
            <div className="font-semibold">
              Margin PM ({a210.marginPmPersen}%) di luar rentang wajar SA 320 (50%–80%).
            </div>
            <div className="text-[11px] mt-0.5">
              Wajib mendokumentasikan pertimbangan profesional PM minimal 100 karakter sebelum Sign-Off Prepared (terisi:{' '}
              <span className="font-mono font-semibold">{a210.pertimbanganPm.trim().length}/100</span>).
            </div>
          </div>
        </div>
      )}

      <div
        className={`p-3 rounded border text-xs flex items-center justify-between gap-3 ${
          signGate.allowed
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {signGate.allowed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          )}
          <span>
            {signGate.allowed
              ? 'Validasi SA 320 terpenuhi — KKP A210 siap untuk Sign-Off Prepared.'
              : signGate.reason}
          </span>
        </div>
      </div>

      {/* Parameter Karakteristik Entitas & Kalkulator OM / PM / AMPT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
            Penetapan Acuan Benchmark & Parameter Margin
          </h3>

          {/* 6 Karakteristik Entitas */}
          <div>
            <label
              htmlFor="a210-karakteristik"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Karakteristik Entitas (A210.AF16:AM18)
            </label>
            <select
              id="a210-karakteristik"
              data-testid="a210-karakteristik"
              disabled={isReadOnly}
              value={a210.karakteristikEntitas}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_A210',
                  patch: { karakteristikEntitas: e.target.value },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
            >
              {ENTITY_CHARACTERISTICS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value}
                </option>
              ))}
            </select>
            {charMeta && (
              <p className="text-[11px] text-slate-500 mt-1">
                {charMeta.ringkasan} · Rekomendasi patokan:{' '}
                <span className="font-semibold text-slate-700">{charMeta.recommendedBenchmark}</span>
              </p>
            )}
          </div>

          {/* 8 Opsi Benchmark & Persentase OM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="a210-benchmark"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Acuan Saldo Benchmark (A210.J29)
              </label>
              <select
                id="a210-benchmark"
                data-testid="a210-benchmark"
                disabled={isReadOnly}
                value={a210.acuanSaldo}
                onChange={(e) => {
                  const bm = e.target.value as MaterialityBenchmark;
                  const spec = MATERIALITY_BENCHMARKS.find((b) => b.benchmark === bm);
                  dispatchAction({
                    type: 'UPDATE_A210',
                    patch: {
                      acuanSaldo: bm,
                      marginOmPersen: spec?.defaultPct ?? a210.marginOmPersen,
                    },
                  });
                }}
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              >
                {MATERIALITY_BENCHMARKS.map((bm) => (
                  <option key={bm.benchmark} value={bm.benchmark}>
                    {bm.benchmark}
                  </option>
                ))}
              </select>
              {selectedSpec && (
                <p className="text-[11px] text-slate-500 mt-1">{selectedSpec.keterangan}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="a210-margin-om"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Margin OM (%) — Wajar: {validation.omRangeLabel}
              </label>
              <input
                id="a210-margin-om"
                data-testid="a210-margin-om"
                type="number"
                step="0.1"
                min="0.1"
                max="25"
                disabled={isReadOnly}
                value={a210.marginOmPersen}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_A210',
                    patch: { marginOmPersen: Number(e.target.value) || 0 },
                  })
                }
                className="w-full h-8 px-2.5 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              />
              {validation.omOutOfNormalRange && (
                <p className="text-[11px] text-amber-700 mt-1">
                  Di luar pedoman umum {validation.omRangeLabel}; jelaskan alasan pada Pertimbangan OM.
                </p>
              )}
            </div>
          </div>

          {a210.acuanSaldo === 'Lainnya (seperti acuan dari auditor induk)' && (
            <div>
              <label
                htmlFor="a210-custom-benchmark"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nilai Saldo Acuan Khusus / Auditor Induk (Rp)
              </label>
              <input
                id="a210-custom-benchmark"
                type="number"
                min="0"
                disabled={isReadOnly}
                value={a210.customBenchmarkValue ?? a210.nilaiSaldoAcuan}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_A210',
                    patch: { customBenchmarkValue: Math.max(0, Number(e.target.value) || 0) },
                  })
                }
                className="w-full h-8 px-2.5 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              />
            </div>
          )}

          {/* Margin PM & AMPT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label
                htmlFor="a210-margin-pm"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Margin PM dari OM (%) — Rentang Wajar 50%–80%
              </label>
              <input
                id="a210-margin-pm"
                data-testid="a210-margin-pm"
                type="number"
                step="1"
                min="1"
                max="100"
                disabled={isReadOnly}
                value={a210.marginPmPersen}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_A210',
                    patch: { marginPmPersen: Number(e.target.value) || 0 },
                  })
                }
                className={`w-full h-8 px-2.5 text-xs font-mono tabular-nums text-right bg-white border rounded text-slate-900 disabled:bg-slate-100 ${
                  validation.pmOutOfRange ? 'border-rose-400' : 'border-slate-300'
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="a210-margin-ampt"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Margin AMPT dari PM (%) — Wajar 3%–5% (Maks 5%)
              </label>
              <input
                id="a210-margin-ampt"
                data-testid="a210-margin-ampt"
                type="number"
                step="0.5"
                min="0"
                max="10"
                disabled={isReadOnly}
                value={a210.marginAmptPersen}
                onChange={(e) => handleAmptChange(e.target.value)}
                className="w-full h-8 px-2.5 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Dokumentasi Pertimbangan Profesional */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div>
              <label
                htmlFor="a210-pertimbangan-om"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Pertimbangan Profesional Penetapan OM & Acuan Benchmark
              </label>
              <textarea
                id="a210-pertimbangan-om"
                rows={3}
                disabled={isReadOnly}
                value={a210.pertimbanganOm}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_A210',
                    patch: { pertimbanganOm: e.target.value },
                  })
                }
                placeholder="Dokumentasikan pengguna laporan keuangan, harapan khusus (covenant/pihak berelasi), stabilitas 3-5 tahun, dan alasan pemilihan benchmark..."
                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="a210-pertimbangan-pm"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Pertimbangan Performance Materiality (PM)
                  {validation.pmOutOfRange && (
                    <span className="text-rose-700 ml-1">(Wajib ≥ 100 char)</span>
                  )}
                </label>
                <textarea
                  id="a210-pertimbangan-pm"
                  data-testid="a210-pertimbangan-pm"
                  rows={3}
                  disabled={isReadOnly}
                  value={a210.pertimbanganPm}
                  onChange={(e) =>
                    dispatchAction({
                      type: 'UPDATE_A210',
                      patch: { pertimbanganPm: e.target.value },
                    })
                  }
                  className={`w-full p-2 text-xs bg-white border rounded text-slate-900 disabled:bg-slate-100 ${
                    validation.pmNeedsJustification ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="a210-pertimbangan-ampt"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Pertimbangan Ambang Batas SAD (AMPT)
                </label>
                <textarea
                  id="a210-pertimbangan-ampt"
                  rows={3}
                  disabled={isReadOnly}
                  value={a210.pertimbanganAmpt}
                  onChange={(e) =>
                    dispatchAction({
                      type: 'UPDATE_A210',
                      patch: { pertimbanganAmpt: e.target.value },
                    })
                  }
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Tabel Live 8 Benchmark WSTB & Panduan Pertimbangan OM */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
              Agregasi 8 Benchmark dari WSTB Klien
            </h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1.5 text-left font-semibold">Benchmark</th>
                    <th className="py-1.5 text-right font-semibold">Saldo (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {benchmarkSummary.map((row) => {
                    const isSelected = row.benchmark === a210.acuanSaldo;
                    return (
                      <tr
                        key={row.kode}
                        className={isSelected ? 'bg-sky-50 font-semibold text-slate-900' : 'text-slate-700'}
                      >
                        <td className="py-1.5 pr-2 leading-snug">{row.benchmark}</td>
                        <td className="py-1.5 text-right font-mono tabular-nums whitespace-nowrap">
                          {formatAuditNumber(row.computedAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
              Checklist Pertimbangan OM (9 Aspek)
            </h3>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
              {PERTIMBANGAN_OM_GUIDANCE.map((g) => (
                <li key={g.no} className="leading-snug">
                  <span className="font-semibold text-slate-800">
                    {g.no}. {g.aspek}:
                  </span>{' '}
                  {g.uraian}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
