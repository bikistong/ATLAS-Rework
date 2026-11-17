import React, { useMemo, useState } from 'react';
import { CheckCircle2, Lock, Search } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { AuditAssertion, RiskLevel } from '../../types/atlas';
import { AUDIT_ASSERTIONS, canSignOffA240Prepared } from '../../utils/a2Formulas';
import { formatAuditNumber } from '../../utils/formatters';

const RISK_OPTIONS: RiskLevel[] = ['Low', 'Moderate', 'High'];

export const A240InherentRisk: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const [filterMode, setFilterMode] = useState<'all' | 'significant'>('all');
  const [query, setQuery] = useState('');

  const pm = activeEngagement?.a210.nilaiPm ?? 0;

  const filteredRows = useMemo(() => {
    if (!activeEngagement) return [];
    const q = query.trim().toLowerCase();
    return activeEngagement.a240Rows.filter((row) => {
      if (filterMode === 'significant' && !row.isSignificantAccount) return false;
      if (
        q &&
        !row.leadCode.toLowerCase().includes(q) &&
        !row.namaAkun.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [activeEngagement, filterMode, query]);

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A240');
  const sigCount = activeEngagement.a240Rows.filter((r) => r.isSignificantAccount).length;
  const sigRiskCount = activeEngagement.a240Rows.filter((r) => r.isSignificantRisk).length;
  const signGate = canSignOffA240Prepared(activeEngagement.a240Rows);

  const riskSelectColor = (level: RiskLevel) => {
    if (level === 'High') return 'border-rose-300 bg-rose-50 text-rose-800 font-semibold';
    if (level === 'Moderate') return 'border-amber-300 bg-amber-50 text-amber-800 font-medium';
    return 'border-emerald-300 bg-emerald-50 text-emerald-800';
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 315 · IDENTIFIKASI AKUN SIGNIFIKAN & RISIKO BAWAAN (INHERENT RISK)
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A240 — Penilaian Inherent Risk per 5 Asersi Audit (45 Pos Akun)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Akun dengan |Saldo Berjalan| ≥ PM (Rp {formatAuditNumber(pm)}) otomatis terkunci sebagai Akun Signifikan (DATASIGN).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex('A270')}
            className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            Lanjut ke Matriks A270
          </button>
        </div>

        {/* Summary & Filters */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`h-8 px-3 rounded border cursor-pointer whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Semua Akun ({activeEngagement.a240Rows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('significant')}
              className={`h-8 px-3 rounded border cursor-pointer whitespace-nowrap ${
                filterMode === 'significant'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Akun Signifikan ({sigCount})
            </button>
            <span className="text-[11px] font-mono text-slate-600 px-2">
              Risiko Signifikan: <strong className="text-rose-700">{sigRiskCount}</strong>
            </span>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Lead Code atau nama akun..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Sign-Off Readiness Banner */}
      <div
        className={`p-3 rounded border text-xs flex items-center gap-2 ${
          signGate.allowed
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>
          {signGate.allowed
            ? `Seluruh ${sigCount} Akun Signifikan memiliki kelengkapan 5 asersi — siap untuk Sign-Off Prepared.`
            : signGate.reason}
        </span>
      </div>

      {/* Matrix Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600">
                <th className="py-2 px-2 text-left font-semibold">Lead</th>
                <th className="py-2 px-2 text-left font-semibold">Pos Akun Utama</th>
                <th className="py-2 px-2 text-right font-semibold">Saldo Berjalan (Rp)</th>
                <th className="py-2 px-2 text-center font-semibold">Akun Sig.</th>
                <th className="py-2 px-2 text-center font-semibold">Risiko Sig.</th>
                {AUDIT_ASSERTIONS.map((a) => (
                  <th key={a} className="py-2 px-1.5 text-center font-semibold">
                    {a}
                  </th>
                ))}
                <th className="py-2 px-2 text-left font-semibold">Pertimbangan Kualitatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => {
                const isQuantLocked = pm > 0 && Math.abs(row.saldoBerjalan) >= pm;
                return (
                  <tr
                    key={row.leadCode}
                    data-testid={`a240-row-${row.leadCode}`}
                    className={row.isSignificantAccount ? 'bg-slate-50/70 hover:bg-slate-100/70' : 'hover:bg-slate-50'}
                  >
                    <td className="py-2 px-2 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {row.leadCode}
                    </td>
                    <td className="py-2 px-2 text-slate-900 font-medium min-w-[180px]">
                      {row.namaAkun}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {formatAuditNumber(row.saldoBerjalan)}
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          data-testid={`a240-sig-${row.leadCode}`}
                          disabled={isReadOnly || isQuantLocked}
                          checked={row.isSignificantAccount}
                          onChange={(e) =>
                            dispatchAction({
                              type: 'UPDATE_A240_ROW',
                              leadCode: row.leadCode,
                              patch: { isSignificantAccount: e.target.checked },
                            })
                          }
                          className="rounded border-slate-300"
                        />
                        {isQuantLocked && (
                          <span title="Otomatis ≥ PM (terkunci)">
                            <Lock className="w-3 h-3 text-slate-500" />
                          </span>
                        )}
                      </label>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        data-testid={`a240-sigrisk-${row.leadCode}`}
                        disabled={isReadOnly}
                        checked={row.isSignificantRisk}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_A240_ROW',
                            leadCode: row.leadCode,
                            patch: { isSignificantRisk: e.target.checked },
                          })
                        }
                        className="rounded border-slate-300"
                      />
                    </td>
                    {AUDIT_ASSERTIONS.map((assertion: AuditAssertion) => (
                      <td key={assertion} className="py-1.5 px-1">
                        <select
                          aria-label={`${row.leadCode} ${assertion}`}
                          data-testid={`a240-ir-${row.leadCode}-${assertion}`}
                          disabled={isReadOnly}
                          value={row.irByAssertion[assertion]}
                          onChange={(e) =>
                            dispatchAction({
                              type: 'UPDATE_A240_ROW',
                              leadCode: row.leadCode,
                              patch: {
                                irByAssertion: {
                                  ...row.irByAssertion,
                                  [assertion]: e.target.value as RiskLevel,
                                },
                              },
                            })
                          }
                          className={`h-7 px-1 text-[11px] border rounded cursor-pointer disabled:opacity-60 ${riskSelectColor(
                            row.irByAssertion[assertion]
                          )}`}
                        >
                          {RISK_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                    <td className="py-1.5 px-2 min-w-[160px]">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={row.alasanSignifikansi}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_A240_ROW',
                            leadCode: row.leadCode,
                            patch: { alasanSignifikansi: e.target.value },
                          })
                        }
                        placeholder={isQuantLocked ? '≥ PM (Material Kuantitatif)' : 'Alasan kualitatif...'}
                        className="w-full h-7 px-2 text-[11px] bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
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
