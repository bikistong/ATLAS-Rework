import React, { useMemo, useState } from 'react';
import { RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { A250ControlCycle, RiskLevel } from '../../types/atlas';
import { AUDIT_ASSERTIONS, getFraudRiskLeadCodes } from '../../utils/a2Formulas';
import { computeOverallRomm } from '../../utils/formatters';

export const A270RommMatrix: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const [filterRomm, setFilterRomm] = useState<'ALL' | RiskLevel>('ALL');
  const [onlySignificant, setOnlySignificant] = useState(false);
  const [query, setQuery] = useState('');

  const fraudLeads = useMemo(() => {
    if (!activeEngagement) return new Set<string>();
    return getFraudRiskLeadCodes(activeEngagement.a230Items);
  }, [activeEngagement]);

  const a240Map = useMemo(() => {
    if (!activeEngagement) return new Map();
    return new Map(activeEngagement.a240Rows.map((r) => [r.leadCode, r]));
  }, [activeEngagement]);

  const cycleMap = useMemo(() => {
    if (!activeEngagement) return new Map();
    return new Map(activeEngagement.a250Cycles.map((c) => [c.kodeSiklus, c]));
  }, [activeEngagement]);

  const filteredRows = useMemo(() => {
    if (!activeEngagement) return [];
    const q = query.trim().toLowerCase();
    return activeEngagement.a270Rows.filter((row) => {
      if (filterRomm !== 'ALL' && row.overallRomm !== filterRomm) return false;
      if (onlySignificant && !a240Map.get(row.leadCode)?.isSignificantAccount) return false;
      if (
        q &&
        !row.leadCode.toLowerCase().includes(q) &&
        !row.namaAkun.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [activeEngagement, filterRomm, onlySignificant, query, a240Map]);

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A270');
  const highCount = activeEngagement.a270Rows.filter((r) => r.overallRomm === 'High').length;
  const modCount = activeEngagement.a270Rows.filter((r) => r.overallRomm === 'Moderate').length;
  const lowCount = activeEngagement.a270Rows.filter((r) => r.overallRomm === 'Low').length;

  const badgeStyle = (level: RiskLevel) => {
    if (level === 'High') return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
    if (level === 'Moderate') return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 315 & SA 330 · MATRIKS DETERMINISTIK IR × CR = ROMM
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A270 — Risk of Material Misstatement (RoMM) & Respon Audit Komprehensif
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menggabungkan Inherent Risk (A240) × Control Risk siklus (A250) dengan prioritas numerik High(3) &gt; Moderate(2) &gt; Low(1). Akun Fraud / Risiko Signifikan otomatis terkunci High.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isReadOnly}
              data-testid="a270-recalculate"
              onClick={() => dispatchAction({ type: 'RECALCULATE_A270' })}
              className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Hitung Ulang Matriks
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex('A280')}
              className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white cursor-pointer whitespace-nowrap"
            >
              ASM Update (A280)
            </button>
          </div>
        </div>

        {/* Filter Chips & Search */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {(
              [
                { id: 'ALL', label: `Semua (${activeEngagement.a270Rows.length})` },
                { id: 'High', label: `High (${highCount})` },
                { id: 'Moderate', label: `Moderate (${modCount})` },
                { id: 'Low', label: `Low (${lowCount})` },
              ] as { id: 'ALL' | RiskLevel; label: string }[]
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilterRomm(btn.id)}
                className={`h-8 px-2.5 rounded border cursor-pointer whitespace-nowrap ${
                  filterRomm === btn.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {btn.label}
              </button>
            ))}
            <label className="inline-flex items-center gap-1.5 ml-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlySignificant}
                onChange={(e) => setOnlySignificant(e.target.checked)}
                className="rounded border-slate-300"
              />
              Hanya Akun Signifikan
            </label>
          </div>

          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Lead Code / pos akun..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Tabel Matriks RoMM */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600">
                <th className="py-2 px-2 text-left font-semibold">Lead</th>
                <th className="py-2 px-2 text-left font-semibold">Pos Akun</th>
                <th className="py-2 px-2 text-left font-semibold">Siklus (CR)</th>
                <th className="py-2 px-2 text-center font-semibold">Max IR</th>
                {AUDIT_ASSERTIONS.map((a) => (
                  <th key={a} className="py-2 px-1 text-center font-semibold">
                    {a}
                  </th>
                ))}
                <th className="py-2 px-2 text-center font-semibold">Overall RoMM</th>
                <th className="py-2 px-2 text-center font-semibold">Fokus Uji</th>
                <th className="py-2 px-2 text-left font-semibold">Respon Audit Komprehensif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => {
                const a240 = a240Map.get(row.leadCode);
                const cycle = cycleMap.get(row.cycleCode);
                const maxIr: RiskLevel = a240
                  ? computeOverallRomm(Object.values(a240.irByAssertion))
                  : 'Moderate';
                const cr: RiskLevel = cycle?.controlRiskLevel ?? 'Moderate';
                const isFraud = fraudLeads.has(row.leadCode);
                const isSigRisk = Boolean(a240?.isSignificantRisk);

                return (
                  <tr
                    key={row.leadCode}
                    data-testid={`a270-row-${row.leadCode}`}
                    className={row.overallRomm === 'High' ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50'}
                  >
                    <td className="py-2 px-2 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveIndex(row.leadCode)}
                        className="hover:underline text-slate-900 cursor-pointer"
                        title={`Buka Lead Schedule ${row.leadCode}`}
                      >
                        {row.leadCode}
                      </button>
                    </td>
                    <td className="py-2 px-2 text-slate-900 font-medium min-w-[160px]">
                      <div>{row.namaAkun}</div>
                      {(isFraud || isSigRisk) && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 mt-0.5">
                          <ShieldAlert className="w-3 h-3" />
                          {isFraud ? 'Fraud Risk SA 240' : 'Risiko Signifikan'}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <select
                        aria-label={`Siklus ${row.leadCode}`}
                        disabled={isReadOnly}
                        value={row.cycleCode}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_A270_ROW',
                            leadCode: row.leadCode,
                            patch: {
                              cycleCode: e.target.value as A250ControlCycle['kodeSiklus'],
                            },
                          })
                        }
                        className="h-7 px-1.5 text-[11px] font-mono bg-white border border-slate-300 rounded text-slate-800"
                      >
                        {activeEngagement.a250Cycles.map((c) => (
                          <option key={c.kodeSiklus} value={c.kodeSiklus}>
                            {c.kodeSiklus} ({c.controlRiskLevel})
                          </option>
                        ))}
                      </select>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">CR: {cr}</div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono border ${badgeStyle(
                          maxIr
                        )}`}
                      >
                        {maxIr[0]}
                      </span>
                    </td>
                    {AUDIT_ASSERTIONS.map((a) => (
                      <td key={a} className="py-2 px-1 text-center">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono border ${badgeStyle(
                            row.rommByAssertion[a]
                          )}`}
                        >
                          {row.rommByAssertion[a][0]}
                        </span>
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <span
                        data-testid={`a270-overall-${row.leadCode}`}
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-mono border ${badgeStyle(
                          row.overallRomm
                        )}`}
                      >
                        {row.overallRomm}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-700 whitespace-nowrap">
                      {row.requiresTestOfControls ? 'TOC + Substantif' : 'Substantif'}
                    </td>
                    <td className="py-2 px-2 min-w-[260px]">
                      <textarea
                        rows={2}
                        disabled={isReadOnly}
                        aria-label={`Respon Audit ${row.leadCode}`}
                        value={row.responAuditKomprehensif}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_A270_ROW',
                            leadCode: row.leadCode,
                            patch: { responAuditKomprehensif: e.target.value },
                          })
                        }
                        className="w-full py-1 px-2 text-[11px] leading-snug bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100 resize-y"
                      />
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
