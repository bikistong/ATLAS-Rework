import React from 'react';
import { ArrowLeft, ArrowRight, Link2 } from 'lucide-react';
import { A1102_QUESTIONS } from '../../data/a1Catalog';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { YesNoNA } from '../../types/atlas';

export const A1102Integrity: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A1102');
  const { a1102, a1102_1 } = activeEngagement;
  const amlYaCount = a1102_1.filter((i) => i.jawaban === 'Ya').length;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            SUB-KKP A110 · INTEGRITAS MANAJEMEN & PMK NO. 55/155
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
            A1102 — Evaluasi Integritas Manajemen & Kepatuhan Anti Pencucian Uang
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            data-testid="a1102-risk-badge"
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
              a1102.simpulanRisiko === 'High'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            Simpulan Risiko: {a1102.simpulanRisiko}
          </span>
          <button
            type="button"
            onClick={() => setActiveIndex('A1102.1')}
            className="h-8 px-2.5 rounded border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-xs font-medium text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
          >
            Buka PMPJ A1102.1 ({amlYaCount} Ya)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex('A110')}
            className="h-8 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            A110
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-semibold w-12">No</th>
              <th className="py-2 px-3 text-left font-semibold">Kriteria Evaluasi Integritas Manajemen</th>
              <th className="py-2 px-3 text-right font-semibold w-52">Jawaban</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {A1102_QUESTIONS.map((q) => {
              const val = a1102[q.key];
              if (q.isAutoSyncedFromAml) {
                return (
                  <tr key={q.key} className="bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">{q.nomor}</td>
                    <td className="py-2.5 px-3 text-slate-900">
                      <div className="font-medium">{q.pertanyaan}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Link2 className="w-3 h-3 text-indigo-600" />
                        <span>
                          Field terkunci otomatis & disinkronkan langsung dari asesmen 42 butir pada{' '}
                          <button
                            type="button"
                            onClick={() => setActiveIndex('A1102.1')}
                            className="underline text-indigo-700 font-medium cursor-pointer"
                          >
                            A1102.1
                          </button>
                          .
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        data-testid="a1102-q6-readonly"
                        className={`inline-flex items-center justify-center h-8 px-3 rounded border font-mono font-semibold text-xs ${
                          val === 'Ya'
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        {val} (Auto A1102.1)
                      </span>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={q.key} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">{q.nomor}</td>
                  <td className="py-2.5 px-3 text-slate-800">{q.pertanyaan}</td>
                  <td className="py-2.5 px-3 text-right">
                    <select
                      aria-label={q.pertanyaan}
                      data-testid={`a1102-${q.key}`}
                      disabled={isReadOnly}
                      value={val}
                      onChange={(e) =>
                        dispatchAction({
                          type: 'UPDATE_A1102',
                          patch: { [q.key]: e.target.value as YesNoNA },
                        })
                      }
                      className={`h-8 px-2 text-xs rounded border font-medium disabled:bg-slate-100 disabled:text-slate-500 ${
                        val === 'Ya'
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="Tidak">Tidak</option>
                      <option value="Ya">Ya</option>
                      <option value="Tidak Berlaku">Tidak Berlaku</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded p-4">
        <label
          htmlFor="a1102-alasan"
          className="block text-xs font-semibold text-slate-800 mb-1"
        >
          Alasan Tetap Menerima / Catatan Analisis Integritas Manajemen{' '}
          {a1102.simpulanRisiko === 'High' && (
            <span className="text-rose-700">(Wajib diisi karena simpulan High Risk)</span>
          )}
        </label>
        <textarea
          id="a1102-alasan"
          data-testid="a1102-alasan"
          disabled={isReadOnly}
          rows={3}
          value={a1102.alasanTetapMenerima}
          onChange={(e) =>
            dispatchAction({
              type: 'UPDATE_A1102',
              patch: { alasanTetapMenerima: e.target.value },
            })
          }
          placeholder="Jelaskan hasil penelusuran latar belakang pengurus, pihak berelasi, dan alasan pergantian auditor..."
          className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-500"
        />
      </div>
    </div>
  );
};
