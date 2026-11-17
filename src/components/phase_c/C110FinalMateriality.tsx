import React, { useMemo } from 'react';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import { C110_CONCLUSION_OPTIONS } from '../../data/cModuleCatalog';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { computeFinalMateriality } from '../../utils/cModuleFormulas';
import { formatAuditNumber } from '../../utils/formatters';

export const C110FinalMateriality: React.FC = () => {
  const { activeEngagement, dispatchAction } = useAtlas();
  const readOnly = activeEngagement ? isWorkpaperReadOnly(activeEngagement, 'C110') : true;

  const evalData = useMemo(
    () => (activeEngagement ? computeFinalMateriality(activeEngagement) : null),
    [activeEngagement]
  );

  if (!activeEngagement || !evalData) return null;

  const c110 = activeEngagement.moduleC.c110FinalMateriality;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* SA 320.12 Critical Alert */}
      {evalData.isMaterialityLowered ? (
        <div
          data-testid="c110-sa320-alert"
          className="bg-rose-50 border border-rose-300 rounded px-4 py-3 flex items-start gap-2.5"
        >
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 space-y-1">
            <div className="font-bold">
              Peringatan Wajib SA 320.12: Materialitas Final Lebih Rendah dari Materialitas Awal (A210)!
            </div>
            <p className="leading-relaxed">
              Karena Overall Materiality atau Performance Materiality Final lebih rendah daripada ambang perencanaan di A210, auditor wajib mendokumentasikan justifikasi teknis dan pertimbangan kecukupan bukti (minimal 20 karakter) sebelum melakukan Sign-Off Prepared.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Materialitas Final (OM &amp; PM) tidak mengalami penurunan dibandingkan tingkat materialitas awal (A210).
          </span>
        </div>
      )}

      {/* Comparison Matrix A210 vs C110 */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Komparasi Materialitas Awal (A210) vs Materialitas Final Audited (C110)
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Basis Acuan: {evalData.acuanSaldo}
          </span>
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="py-2 px-3 text-left">Komponen Materialitas</th>
              <th className="py-2 px-3 text-right">Materialitas Awal (A210)</th>
              <th className="py-2 px-3 text-right w-32">Margin Final (%)</th>
              <th className="py-2 px-3 text-right">Materialitas Final (C110)</th>
              <th className="py-2 px-3 text-right">Selisih (Δ)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2.5 px-3 font-medium text-slate-800">
                Saldo Acuan ({evalData.acuanSaldo})
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                Rp {formatAuditNumber(evalData.saldoAcuanAwal)}
              </td>
              <td className="py-2.5 px-3 text-right text-slate-400">Otomatis B120</td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                Rp {formatAuditNumber(evalData.saldoAcuanAudited)}
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                {formatAuditNumber(evalData.saldoAcuanAudited - evalData.saldoAcuanAwal)}
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-3 font-semibold text-slate-900">
                Overall Materiality (OM)
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                Rp {formatAuditNumber(evalData.omAwal)}
              </td>
              <td className="py-2.5 px-3 text-right">
                <input
                  type="number"
                  step="0.1"
                  min={0.1}
                  max={50}
                  disabled={readOnly}
                  aria-label="Margin OM Final (%)"
                  data-testid="c110-margin-om"
                  value={c110.marginOmPersen}
                  onChange={(e) =>
                    dispatchAction({
                      type: 'UPDATE_C110',
                      patch: { marginOmPersen: Number(e.target.value) || 0 },
                    })
                  }
                  className="w-20 h-7 px-2 text-xs font-mono text-right bg-white border border-slate-300 rounded disabled:bg-slate-100"
                />
              </td>
              <td
                data-testid="c110-om-final"
                className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold ${
                  evalData.isOmLowered ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                Rp {formatAuditNumber(evalData.omFinal)}
              </td>
              <td
                className={`py-2.5 px-3 text-right font-mono tabular-nums ${
                  evalData.deltaOm < 0 ? 'text-rose-700 font-semibold' : 'text-emerald-700'
                }`}
              >
                {formatAuditNumber(evalData.deltaOm)}
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-3 font-semibold text-slate-900">
                Performance Materiality (PM)
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                Rp {formatAuditNumber(evalData.pmAwal)}
              </td>
              <td className="py-2.5 px-3 text-right">
                <input
                  type="number"
                  step="1"
                  min={1}
                  max={100}
                  disabled={readOnly}
                  aria-label="Margin PM Final (%)"
                  data-testid="c110-margin-pm"
                  value={c110.marginPmPersen}
                  onChange={(e) =>
                    dispatchAction({
                      type: 'UPDATE_C110',
                      patch: { marginPmPersen: Number(e.target.value) || 0 },
                    })
                  }
                  className="w-20 h-7 px-2 text-xs font-mono text-right bg-white border border-slate-300 rounded disabled:bg-slate-100"
                />
              </td>
              <td
                className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold ${
                  evalData.isPmLowered ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                Rp {formatAuditNumber(evalData.pmFinal)}
              </td>
              <td
                className={`py-2.5 px-3 text-right font-mono tabular-nums ${
                  evalData.deltaPm < 0 ? 'text-rose-700 font-semibold' : 'text-emerald-700'
                }`}
              >
                {formatAuditNumber(evalData.deltaPm)}
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-3 font-medium text-slate-800">
                Clearly Trivial Threshold (AMPT)
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                Rp {formatAuditNumber(evalData.amptAwal)}
              </td>
              <td className="py-2.5 px-3 text-right">
                <input
                  type="number"
                  step="0.5"
                  min={0.5}
                  max={20}
                  disabled={readOnly}
                  aria-label="Margin AMPT Final (%)"
                  data-testid="c110-margin-ampt"
                  value={c110.marginAmptPersen}
                  onChange={(e) =>
                    dispatchAction({
                      type: 'UPDATE_C110',
                      patch: { marginAmptPersen: Number(e.target.value) || 0 },
                    })
                  }
                  className="w-20 h-7 px-2 text-xs font-mono text-right bg-white border border-slate-300 rounded disabled:bg-slate-100"
                />
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                Rp {formatAuditNumber(evalData.amptFinal)}
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                {formatAuditNumber(evalData.amptFinal - evalData.amptAwal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Justifikasi & Simpulan Akhir */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div>
          <label
            htmlFor="c110-justification"
            className="block text-xs font-bold text-slate-700 mb-1"
          >
            Justifikasi &amp; Dokumentasi Pertimbangan Materialitas Akhir (Wajib jika turun — SA 320.12)
          </label>
          <textarea
            id="c110-justification"
            data-testid="c110-justification"
            rows={3}
            disabled={readOnly}
            value={c110.auditorJustification}
            onChange={(e) =>
              dispatchAction({
                type: 'UPDATE_C110',
                patch: { auditorJustification: e.target.value },
              })
            }
            placeholder="Jelaskan dampak penurunan/perubahan acuan audited terhadap kecukupan ukuran sampel dan prosedur audit substantif yang telah dilaksanakan..."
            className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
          />
        </div>

        <div>
          <label htmlFor="c110-conclusion" className="block text-xs font-bold text-slate-700 mb-1">
            Simpulan Materialitas Akhir
          </label>
          <select
            id="c110-conclusion"
            disabled={readOnly}
            value={c110.conclusion}
            onChange={(e) =>
              dispatchAction({
                type: 'UPDATE_C110',
                patch: {
                  conclusion: e.target.value as typeof c110.conclusion,
                },
              })
            }
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
          >
            {C110_CONCLUSION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
