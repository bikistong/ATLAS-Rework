import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import {
  computeA220FinancialRatios,
  computeA220HorizontalVertical,
} from '../../utils/a2Formulas';
import { formatAuditNumber } from '../../utils/formatters';

type A220Tab = 'A220.1' | 'A220.2' | 'PREANALITICAL';

export const A220Analytics: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const [activeTab, setActiveTab] = useState<A220Tab>('A220.1');
  const [filterOnlySig, setFilterOnlySig] = useState(false);

  const horizontalRows = useMemo(() => {
    if (!activeEngagement) return [];
    return computeA220HorizontalVertical(
      activeEngagement.trialBalance,
      activeEngagement.journals,
      activeEngagement.a210.nilaiPm
    );
  }, [activeEngagement]);

  const ratios = useMemo(() => {
    if (!activeEngagement) return [];
    return computeA220FinancialRatios(
      activeEngagement.trialBalance,
      activeEngagement.journals
    );
  }, [activeEngagement]);

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A220');
  const wp = activeEngagement.workingPapers['A220'];
  const pm = activeEngagement.a210.nilaiPm;
  const simpulan =
    activeEngagement.a220Simpulan ??
    'Hasil analisis awal tidak terdapat risiko salah saji material';

  const sigFluctuationRows = horizontalRows.filter((r) => r.isFluktuasiSignifikan);
  const displayedRows = filterOnlySig ? sigFluctuationRows : horizontalRows;

  // Data untuk Recharts BarChart (4 Rasio Profitabilitas dalam satuan % yang seragam)
  const shortBarLabel: Record<string, string> = {
    'prof-gpm': 'GPM (%)',
    'prof-npm': 'NPM (%)',
    'prof-roa': 'ROA (%)',
    'prof-roe': 'ROE (%)',
  };
  const barChartData = ratios
    .filter((r) => r.kelompok === 'Profitabilitas')
    .map((r) => ({
      name: shortBarLabel[r.id] ?? r.namaRasio,
      Berjalan: r.nilaiBerjalan !== null ? Number(r.nilaiBerjalan.toFixed(2)) : 0,
      PeriodeLalu: r.nilaiLalu !== null ? Number(r.nilaiLalu.toFixed(2)) : 0,
    }));

  const radarIds = ['liq-current', 'liq-quick', 'liq-cash', 'prof-gpm', 'prof-npm', 'prof-roa'];
  const shortRadarLabel: Record<string, string> = {
    'liq-current': 'Current',
    'liq-quick': 'Quick',
    'liq-cash': 'Cash',
    'prof-gpm': 'GPM',
    'prof-npm': 'NPM',
    'prof-roa': 'ROA',
  };
  const radarChartData = ratios
    .filter((r) => radarIds.includes(r.id))
    .map((r) => ({
      subject: shortRadarLabel[r.id] ?? r.namaRasio.split(' ')[0],
      Berjalan:
        r.nilaiBerjalan !== null
          ? Number(Math.min(100, Math.abs(r.nilaiBerjalan) * (r.satuan === 'x' ? 20 : 1)).toFixed(1))
          : 0,
      Lalu:
        r.nilaiLalu !== null
          ? Number(Math.min(100, Math.abs(r.nilaiLalu) * (r.satuan === 'x' ? 20 : 1)).toFixed(1))
          : 0,
    }));

  const formatRatioValue = (val: number | null, satuan: 'x' | '%' | 'hari'): string => {
    if (val === null) return 'N/A';
    if (satuan === '%') return `${formatAuditNumber(val, 2)}%`;
    if (satuan === 'hari') return `${formatAuditNumber(val, 1)} hari`;
    return `${formatAuditNumber(val, 2)}x`;
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header & Sub-Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 315 & SA 520 · PROSEDUR ANALITIS TAHAP PERENCANAAN
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A220 — Prosedur Analitis Awal (A220.1, A220.2 & PREANALITICAL)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ambang batas fluktuasi signifikan otomatis: |Δ Saldo| ≥ PM (Rp {formatAuditNumber(pm)}) DAN |Δ%| ≥ 20%.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {sigFluctuationRows.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                {sigFluctuationRows.length} Fluktuasi Signifikan
              </span>
            )}
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {(
            [
              { id: 'A220.1', label: 'A220.1 Horizontal & Vertikal' },
              { id: 'A220.2', label: 'A220.2 13 Rasio Keuangan & Grafik' },
              { id: 'PREANALITICAL', label: 'PREANALITICAL Ringkasan & Simpulan' },
            ] as { id: A220Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`h-8 px-3 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB A220.1: Horizontal & Vertical Common-Size */}
      {activeTab === 'A220.1' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Tabel Analisis Perbandingan Antarperiode & Common-Size
              </h3>
              <p className="text-[11px] text-slate-500">
                Basis Vertikal: Neraca (% Total Aset) · Laba Rugi (% Total Pendapatan).
              </p>
            </div>
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOnlySig}
                onChange={(e) => setFilterOnlySig(e.target.checked)}
                className="rounded border-slate-300"
              />
              Hanya Fluktuasi Signifikan ({sigFluctuationRows.length})
            </label>
          </div>

          {horizontalRows.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-300 rounded text-xs text-slate-500 space-y-2">
              <div>Trial Balance belum tersedia pada perikatan ini.</div>
              <button
                type="button"
                onClick={() => setActiveIndex('B100')}
                className="h-8 px-3 rounded bg-slate-900 text-white text-xs font-medium cursor-pointer"
              >
                Buka WSTB (B100)
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600">
                    <th className="py-2 px-2 text-left font-semibold">Kode / Lead</th>
                    <th className="py-2 px-2 text-left font-semibold">Nama Akun</th>
                    <th className="py-2 px-2 text-right font-semibold">Saldo Berjalan (Rp)</th>
                    <th className="py-2 px-2 text-right font-semibold">Vert (%)</th>
                    <th className="py-2 px-2 text-right font-semibold">Periode Lalu (Rp)</th>
                    <th className="py-2 px-2 text-right font-semibold">Vert (%)</th>
                    <th className="py-2 px-2 text-right font-semibold">Perubahan (Rp)</th>
                    <th className="py-2 px-2 text-right font-semibold">Δ (%)</th>
                    <th className="py-2 px-2 text-left font-semibold">Status Analitis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedRows.map((row) => (
                    <tr
                      key={row.accountId}
                      className={row.isFluktuasiSignifikan ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {row.kodeAkun} · {row.leadCode}
                      </td>
                      <td className="py-2 px-2 text-slate-900 font-medium">{row.namaAkun}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                        {formatAuditNumber(row.saldoBerjalan)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {row.commonSizeBerjalanPersen !== null
                          ? `${formatAuditNumber(row.commonSizeBerjalanPersen, 1)}%`
                          : '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {formatAuditNumber(row.saldoLalu)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {row.commonSizeLaluPersen !== null
                          ? `${formatAuditNumber(row.commonSizeLaluPersen, 1)}%`
                          : '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                        {formatAuditNumber(row.perubahanNominal)}
                      </td>
                      <td
                        className={`py-2 px-2 text-right font-mono tabular-nums whitespace-nowrap ${
                          row.isFluktuasiSignifikan ? 'text-rose-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {row.perubahanPersen !== null
                          ? `${formatAuditNumber(row.perubahanPersen, 1)}%`
                          : 'N/A'}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {row.isFluktuasiSignifikan ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                            Fluktuasi Signifikan
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB A220.2: 13 Rasio Keuangan & Grafik Recharts */}
      {activeTab === 'A220.2' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                <BarChart3 className="w-4 h-4 text-slate-600" />
                Komparasi Rasio Profitabilitas (%)
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tick={{ fontSize: 10, fill: '#475569' }}
                    />
                    <YAxis unit="%" tick={{ fontSize: 10, fill: '#475569' }} />
                    <Tooltip formatter={(val) => `${val ?? 0}%`} />
                    <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    <Bar dataKey="Berjalan" name="Periode Berjalan" fill="#0F172A" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="PeriodeLalu" name="Periode Lalu" fill="#94A3B8" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                Profil Kinerja Keuangan (Radar Ternormalisasi)
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={radarChartData}
                    cx="50%"
                    cy="45%"
                    outerRadius="62%"
                    margin={{ top: 12, right: 20, bottom: 16, left: 20 }}
                  >
                    <PolarGrid stroke="#CBD5E1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#334155' }} />
                    <PolarRadiusAxis tick={{ fontSize: 9, fill: '#64748B' }} />
                    <Radar name="Berjalan" dataKey="Berjalan" stroke="#0F172A" fill="#0F172A" fillOpacity={0.22} />
                    <Radar name="Periode Lalu" dataKey="Lalu" stroke="#64748B" fill="#94A3B8" fillOpacity={0.18} />
                    <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabel Lengkap 13 Rasio Keuangan */}
          <div className="bg-white border border-slate-200 rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
              Kalkulator 13 Rasio Keuangan (4 Kelompok Baku ATLAS v2.1)
            </h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600">
                    <th className="py-2 px-2 text-left font-semibold">Kelompok</th>
                    <th className="py-2 px-2 text-left font-semibold">Rasio Keuangan</th>
                    <th className="py-2 px-2 text-left font-semibold">Formula</th>
                    <th className="py-2 px-2 text-right font-semibold">Berjalan</th>
                    <th className="py-2 px-2 text-right font-semibold">Periode Lalu</th>
                    <th className="py-2 px-2 text-right font-semibold">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ratios.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2 text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                        {r.kelompok}
                      </td>
                      <td className="py-2 px-2 font-medium text-slate-900">
                        <div>{r.namaRasio}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{r.interpretasi}</div>
                      </td>
                      <td className="py-2 px-2 text-[11px] text-slate-600">{r.rumus}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {formatRatioValue(r.nilaiBerjalan, r.satuan)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {formatRatioValue(r.nilaiLalu, r.satuan)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {r.delta === null
                          ? 'N/A'
                          : `${r.delta >= 0 ? '+' : ''}${formatAuditNumber(r.delta, r.satuan === 'hari' ? 1 : 2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB PREANALITICAL: Ringkasan & Simpulan */}
      {activeTab === 'PREANALITICAL' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded border border-slate-200 bg-slate-50">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Total Akun Dianalisis</div>
              <div className="text-base font-mono font-bold text-slate-900 mt-1 text-right">
                {horizontalRows.length} Akun
              </div>
            </div>
            <div className="p-3 rounded border border-slate-200 bg-slate-50">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Fluktuasi Signifikan (A220.1)</div>
              <div
                className={`text-base font-mono font-bold mt-1 text-right ${
                  sigFluctuationRows.length > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {sigFluctuationRows.length} Pos
              </div>
            </div>
            <div className="p-3 rounded border border-slate-200 bg-slate-50">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Ambang Fluktuasi (PM)</div>
              <div className="text-base font-mono font-bold text-slate-900 mt-1 text-right">
                Rp {formatAuditNumber(pm)}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="a220-simpulan"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Simpulan Prosedur Analitis Awal (PREANALITICAL — SA 520)
            </label>
            <select
              id="a220-simpulan"
              disabled={isReadOnly}
              value={simpulan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_A220_SIMPULAN',
                  simpulan: e.target.value as
                    | 'Hasil analisis awal tidak terdapat risiko salah saji material'
                    | 'Hasil analisis awal terdapat risiko salah saji material',
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
            >
              <option value="Hasil analisis awal tidak terdapat risiko salah saji material">
                Hasil analisis awal tidak terdapat risiko salah saji material
              </option>
              <option value="Hasil analisis awal terdapat risiko salah saji material">
                Hasil analisis awal terdapat risiko salah saji material
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="a220-catatan"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Penjelasan Fluktuasi Signifikan & Implikasi terhadap Strategi Audit Awal
            </label>
            <textarea
              id="a220-catatan"
              rows={4}
              disabled={isReadOnly}
              value={wp?.catatanSimpulan ?? ''}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_WORKPAPER_NOTES',
                  kodeIndeks: 'A220',
                  catatanSimpulan: e.target.value,
                })
              }
              placeholder="Jelaskan penyebab perubahan saldo signifikan (misal kenaikan kas/piutang/penjualan) dan fokus area yang perlu pengujian rinci pada Fase B..."
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};
