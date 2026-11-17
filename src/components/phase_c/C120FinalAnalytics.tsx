import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Calculator, TrendingUp } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import {
  computeC120FourteenRatios,
  computeC120HorizontalAnalysis,
  computeChartDataForC120,
  computeFinalMateriality,
} from '../../utils/cModuleFormulas';
import { formatAuditNumber } from '../../utils/formatters';

type C120Tab = 'horizontal' | 'ratios' | 'charts';

export const C120FinalAnalytics: React.FC = () => {
  const { activeEngagement, dispatchAction } = useAtlas();
  const [activeTab, setActiveTab] = useState<C120Tab>('horizontal');
  const readOnly = activeEngagement ? isWorkpaperReadOnly(activeEngagement, 'C120') : true;

  const matEval = useMemo(
    () => (activeEngagement ? computeFinalMateriality(activeEngagement) : null),
    [activeEngagement]
  );

  const horizontalRows = useMemo(() => {
    if (!activeEngagement || !matEval) return [];
    return computeC120HorizontalAnalysis(
      activeEngagement.trialBalance,
      activeEngagement.journals,
      matEval.pmFinal
    );
  }, [activeEngagement, matEval]);

  const fourteenRatios = useMemo(() => {
    if (!activeEngagement) return [];
    return computeC120FourteenRatios(
      activeEngagement.trialBalance,
      activeEngagement.journals
    );
  }, [activeEngagement]);

  const chartBundle = useMemo(() => {
    if (!activeEngagement) return null;
    return computeChartDataForC120(
      activeEngagement.trialBalance,
      activeEngagement.journals
    );
  }, [activeEngagement]);

  if (!activeEngagement || !matEval || !chartBundle) return null;

  const flaggedCount = horizontalRows.filter((r) => r.needsExplanation).length;
  const notesMap = activeEngagement.moduleC.c120AnalyticalNotes;

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Tab Switcher + KPI */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded p-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="c120-tab-horizontal"
            onClick={() => setActiveTab('horizontal')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'horizontal'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>C120.1 Horizontal &amp; Common-Size ({horizontalRows.length})</span>
          </button>
          <button
            type="button"
            data-testid="c120-tab-ratios"
            onClick={() => setActiveTab('ratios')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ratios'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>C120.2 14 Rasio Keuangan</span>
          </button>
          <button
            type="button"
            data-testid="c120-tab-charts"
            onClick={() => setActiveTab('charts')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Chart1 Visualisasi Interaktif</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-600">
          Ambang PM Final: <span className="font-bold text-slate-900">Rp {formatAuditNumber(matEval.pmFinal)}</span> · Akun Perlu Penjelasan:{' '}
          <span className="font-bold text-amber-700">{flaggedCount}</span>
        </div>
      </div>

      {/* Tab 1: Horizontal & Vertical Final */}
      {activeTab === 'horizontal' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 px-3 text-left w-24">Kode</th>
                  <th className="py-2 px-3 text-left">Nama Akun</th>
                  <th className="py-2 px-3 text-right">Audited Final</th>
                  <th className="py-2 px-3 text-right">Prior Audited</th>
                  <th className="py-2 px-3 text-right">Selisih (Δ)</th>
                  <th className="py-2 px-3 text-right">Δ %</th>
                  <th className="py-2 px-3 text-center w-32">Flag SA 520</th>
                  <th className="py-2 px-3 text-left w-64">Penjelasan Fluktuasi Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {horizontalRows.map((row) => (
                  <tr
                    key={row.kodeAkun}
                    className={row.needsExplanation ? 'bg-amber-50/40' : 'hover:bg-slate-50'}
                  >
                    <td className="py-2 px-3 font-mono text-slate-600">{row.kodeAkun}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{row.namaAkun}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900">
                      {formatAuditNumber(row.saldoBerjalan)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatAuditNumber(row.saldoLalu)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {formatAuditNumber(row.perubahanNominal)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {row.perubahanPersen !== null ? `${row.perubahanPersen.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {row.needsExplanation ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold">
                          Perlu Penjelasan
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          Wajar
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        disabled={readOnly}
                        aria-label={`Penjelasan fluktuasi ${row.namaAkun}`}
                        value={notesMap[row.kodeAkun] ?? ''}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_C120_NOTE',
                            accountCode: row.kodeAkun,
                            note: e.target.value,
                          })
                        }
                        placeholder="Dokumentasi penjelasan akhir..."
                        className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: 14 Rasio Keuangan */}
      {activeTab === 'ratios' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2 px-3 text-left w-28">Kelompok</th>
                <th className="py-2 px-3 text-left">Indikator Rasio</th>
                <th className="py-2 px-3 text-right">Audited Final</th>
                <th className="py-2 px-3 text-right">Prior Audited</th>
                <th className="py-2 px-3 text-right">Perubahan</th>
                <th className="py-2 px-3 text-left">Interpretasi Standar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fourteenRatios.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-600">{r.kelompok}</td>
                  <td className="py-2 px-3">
                    <div className="font-medium text-slate-900">{r.namaRasio}</div>
                    <div className="text-[11px] text-slate-400">{r.rumus}</div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                    {r.nilaiBerjalan !== null ? `${r.nilaiBerjalan.toFixed(2)}${r.satuan}` : 'N/A'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600">
                    {r.nilaiLalu !== null ? `${r.nilaiLalu.toFixed(2)}${r.satuan}` : 'N/A'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    {r.delta !== null
                      ? `${r.delta >= 0 ? '+' : ''}${r.delta.toFixed(2)}${r.satuan}`
                      : 'N/A'}
                  </td>
                  <td className="py-2 px-3 text-slate-600">{r.interpretasi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Chart1 Recharts Visualization */}
      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="c120-charts-grid">
          <div className="bg-white border border-slate-200 rounded p-4">
            <h3 className="text-xs font-bold text-slate-800 mb-3">
              Posisi Keuangan: Audited Final vs Prior (Jutaan Rp)
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartBundle.positionChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="pos" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="audited" name="Audited Final" fill="#3730A3" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="prior" name="Prior Audited" fill="#94A3B8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-4">
            <h3 className="text-xs font-bold text-slate-800 mb-3">
              Kinerja Laba Rugi: Audited Final vs Prior (Jutaan Rp)
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartBundle.performanceChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="pos" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="audited" name="Audited Final" fill="#0F766E" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="prior" name="Prior Audited" fill="#CBD5E1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-4">
            <h3 className="text-xs font-bold text-slate-800 mb-3">
              Rasio Profitabilitas Final vs Prior (%)
            </h3>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={chartBundle.ratioComparisonChart.filter((r) =>
                    /Margin|ROE/i.test(r.name)
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="audited" name="Audited Final" fill="#4338CA" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="prior" name="Prior Audited" fill="#94A3B8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-4">
            <h3 className="text-xs font-bold text-slate-800 mb-3">
              Likuiditas, Solvabilitas &amp; Perputaran Aset (x)
            </h3>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={chartBundle.ratioComparisonChart.filter(
                    (r) => !/Margin|ROE/i.test(r.name)
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="x" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="audited" name="Audited Final" fill="#0369A1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="prior" name="Prior Audited" fill="#94A3B8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
