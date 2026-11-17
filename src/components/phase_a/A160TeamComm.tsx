import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';

export const A160TeamComm: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A160');
  const clauses = activeEngagement.legalChecklists.filter((c) => c.kodeIndeks === 'A160');
  const wp = activeEngagement.workingPapers['A160'];

  const understandingClauses = clauses.filter((c) => c.kodeKlausul.startsWith('a.'));
  const consultClauses = clauses.filter((c) => c.kodeKlausul.startsWith('b.'));

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            SA 220 · SA 240 · SA 300 · KOMUNIKASI & KONSULTASI TIM
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
            A160 — Pemahaman Perikatan & Diskusi Tim Perikatan (Briefing Awal)
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setActiveIndex('ASM2')}
          className="h-8 px-3 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
        >
          Buka ASM Awal (ASM2)
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Seksi A: Pemahaman Perikatan */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-700">
          A. Evaluasi Pemahaman Tim atas Lingkup Audit & Risiko Kecurangan (SA 240)
        </div>
        <table className="w-full text-xs border-collapse">
          <tbody className="divide-y divide-slate-200">
            {understandingClauses.map((c) => (
              <tr key={c.kodeKlausul} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 w-14">
                  {c.kodeKlausul}
                </td>
                <td className="py-2.5 px-3 text-slate-800">{c.uraianKlausul}</td>
                <td className="py-2.5 px-3 text-center w-24">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={c.isCompliant}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_LEGAL_CLAUSE',
                        kodeIndeks: 'A160',
                        kodeKlausul: c.kodeKlausul,
                        patch: { isCompliant: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-emerald-700 cursor-pointer"
                  />
                </td>
                <td className="py-2.5 px-3 w-64">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={c.catatan}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_LEGAL_CLAUSE',
                        kodeIndeks: 'A160',
                        kodeKlausul: c.kodeKlausul,
                        patch: { catatan: e.target.value },
                      })
                    }
                    placeholder="Notulensi / catatan diskusi..."
                    className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Seksi B: Dokumentasi Konsultasi */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-700">
          B. Dokumentasi Konsultasi Teknis & Keputusan Tim
        </div>
        <table className="w-full text-xs border-collapse">
          <tbody className="divide-y divide-slate-200">
            {consultClauses.map((c) => (
              <tr key={c.kodeKlausul} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 w-14">
                  {c.kodeKlausul}
                </td>
                <td className="py-2.5 px-3 text-slate-800">{c.uraianKlausul}</td>
                <td className="py-2.5 px-3 text-center w-24">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={c.isCompliant}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_LEGAL_CLAUSE',
                        kodeIndeks: 'A160',
                        kodeKlausul: c.kodeKlausul,
                        patch: { isCompliant: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-emerald-700 cursor-pointer"
                  />
                </td>
                <td className="py-2.5 px-3 w-64">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={c.catatan}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_LEGAL_CLAUSE',
                        kodeIndeks: 'A160',
                        kodeKlausul: c.kodeKlausul,
                        patch: { catatan: e.target.value },
                      })
                    }
                    placeholder="Catatan konsultasi..."
                    className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ringkasan Risalah Diskusi Tim */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <label
          htmlFor="a160-notes"
          className="block text-xs font-semibold text-slate-800 mb-1"
        >
          Risalah Rapat & Simpulan Komunikasi Tim Perikatan (SA 240 / SA 300)
        </label>
        <textarea
          id="a160-notes"
          disabled={isReadOnly}
          rows={4}
          value={wp?.catatanSimpulan ?? ''}
          onChange={(e) =>
            dispatchAction({
              type: 'UPDATE_WORKPAPER_NOTES',
              kodeIndeks: 'A160',
              catatanSimpulan: e.target.value,
            })
          }
          placeholder="Catat poin utama diskusi kerentanan fraud (SA 240), pembagian beban kerja, dan jadwal briefing lapangan..."
          className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100"
        />
      </div>
    </div>
  );
};
