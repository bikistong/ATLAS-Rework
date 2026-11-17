import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { buildC230TwelvePillars } from '../../utils/cModuleFormulas';

export const C230FinalMemorandum: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const readOnly = activeEngagement ? isWorkpaperReadOnly(activeEngagement, 'C230') : true;

  const pillars = useMemo(
    () => (activeEngagement ? buildC230TwelvePillars(activeEngagement) : []),
    [activeEngagement]
  );

  if (!activeEngagement) return null;

  const memo = activeEngagement.moduleC.c230Memorandum;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header Control Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800">
            Audit Final Memorandum (12 Pilar Evaluasi Akhir Perikatan — SA 220 / SA 230)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Merangkum otomatis hasil KKP Modul A, Modul B, dan Modul C sebagai dasar kesimpulan final Partner.
          </p>
        </div>

        <button
          type="button"
          disabled={readOnly}
          data-testid="c230-sync-btn"
          onClick={() => dispatchAction({ type: 'SYNC_C230_FROM_MODULES' })}
          className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 text-white text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sinkronkan Ringkasan Otomatis (12 Pilar)</span>
        </button>
      </div>

      {/* 12 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pillars.map((pillar) => {
          const currentVal = memo[pillar.key] ?? '';
          const primarySource = pillar.sourceRef.split('·')[0].trim().split('.')[0];
          return (
            <div key={pillar.key} className="bg-white border border-slate-200 rounded p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`c230-${pillar.key}`}
                  className="text-xs font-bold text-slate-800"
                >
                  {pillar.number}. {pillar.title}
                </label>
                <button
                  type="button"
                  onClick={() => setActiveIndex(primarySource)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 text-[10px] font-mono font-semibold text-indigo-700 cursor-pointer shrink-0"
                >
                  {pillar.sourceRef}
                </button>
              </div>
              <textarea
                id={`c230-${pillar.key}`}
                data-testid={`c230-field-${pillar.key}`}
                rows={3}
                disabled={readOnly}
                value={currentVal}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C230_MEMORANDUM',
                    patch: { [pillar.key]: e.target.value },
                  })
                }
                placeholder={pillar.autoSummary}
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100 leading-relaxed"
              />
            </div>
          );
        })}
      </div>

      {/* Overall Conclusion */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-1.5">
        <label htmlFor="c230-overall" className="block text-xs font-bold text-slate-800">
          Simpulan Menyeluruh Audit Final Memorandum
        </label>
        <textarea
          id="c230-overall"
          rows={3}
          disabled={readOnly}
          value={memo.overallConclusion}
          onChange={(e) =>
            dispatchAction({
              type: 'UPDATE_C230_MEMORANDUM',
              patch: { overallConclusion: e.target.value },
            })
          }
          placeholder="Nyatakan simpulan akhir apakah seluruh risiko signifikan telah direspons, bukti audit cukup dan tepat, serta opini audit pada C400 siap diterbitkan..."
          className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
        />
      </div>
    </div>
  );
};
