import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { A1101_QUESTIONS } from '../../data/a1Catalog';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { YesNoNA } from '../../types/atlas';

export const A1101PriorIssues: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A1101');
  const { a1101 } = activeEngagement;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            SUB-KKP A110 · ISU PELAPORAN KEUANGAN TERDAHULU
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
            A1101 — Evaluasi Isu Pelaporan Keuangan & Kelangsungan Usaha Periode Lalu
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            data-testid="a1101-risk-badge"
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
              a1101.simpulanRisiko === 'High'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            Simpulan Risiko: {a1101.simpulanRisiko}
          </span>
          <button
            type="button"
            onClick={() => setActiveIndex('A110')}
            className="h-8 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke A110
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-semibold w-12">No</th>
              <th className="py-2 px-3 text-left font-semibold">Kriteria Evaluasi Isu Periode Sebelumnya</th>
              <th className="py-2 px-3 text-right font-semibold w-44">Jawaban Auditor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {A1101_QUESTIONS.map((q) => (
              <tr key={q.key} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">{q.nomor}</td>
                <td className="py-2.5 px-3 text-slate-800">{q.pertanyaan}</td>
                <td className="py-2.5 px-3 text-right">
                  <select
                    aria-label={q.pertanyaan}
                    data-testid={`a1101-${q.key}`}
                    disabled={isReadOnly}
                    value={a1101[q.key]}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_A1101',
                        patch: { [q.key]: e.target.value as YesNoNA },
                      })
                    }
                    className={`h-8 px-2 text-xs rounded border font-medium disabled:bg-slate-100 disabled:text-slate-500 ${
                      a1101[q.key] === 'Ya'
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
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded p-4">
        <label
          htmlFor="a1101-alasan"
          className="block text-xs font-semibold text-slate-800 mb-1"
        >
          Alasan Tetap Menerima / Catatan Analisis Isu Periode Lalu{' '}
          {a1101.simpulanRisiko === 'High' && (
            <span className="text-rose-700">(Wajib diisi karena simpulan High Risk)</span>
          )}
        </label>
        <textarea
          id="a1101-alasan"
          data-testid="a1101-alasan"
          disabled={isReadOnly}
          rows={3}
          value={a1101.alasanTetapMenerima}
          onChange={(e) =>
            dispatchAction({
              type: 'UPDATE_A1101',
              patch: { alasanTetapMenerima: e.target.value },
            })
          }
          placeholder="Dokumentasikan latar belakang restrukturisasi, opini sebelumnya, atau tindakan manajemen..."
          className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-500"
        />
      </div>
    </div>
  );
};
