import React from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { isIndexVisibleForWorkspace } from '../../utils/formatters';

export const A1105Predecessor: React.FC = () => {
  const { activeEngagement, activeClient, dispatchAction, setActiveIndex } = useAtlas();

  if (!activeEngagement || !activeClient) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A1105');
  const isConditionallyVisible = isIndexVisibleForWorkspace(
    'A1105',
    activeEngagement,
    activeClient.statusKepemilikan
  );
  const { a1105 } = activeEngagement;

  const questions: {
    key: 'q1KomunikasiDilakukan' | 'q2BalasanDiterima' | 'q3aKeberatanProfesional' | 'q3bSengketaFee';
    no: string;
    text: string;
    riskyAnswer: 'Ya' | 'Tidak';
  }[] = [
    {
      no: '1',
      key: 'q1KomunikasiDilakukan',
      text: 'Apakah komunikasi tertulis dengan auditor pendahulu telah dilakukan dengan persetujuan klien?',
      riskyAnswer: 'Tidak',
    },
    {
      no: '2',
      key: 'q2BalasanDiterima',
      text: 'Apakah auditor pendahulu telah memberikan tanggapan / balasan resmi atas surat komunikasi tersebut?',
      riskyAnswer: 'Tidak',
    },
    {
      no: '3a',
      key: 'q3aKeberatanProfesional',
      text: 'Apakah terdapat keberatan profesional, masalah integritas manajemen, atau perbedaan pendapat akuntansi yang disampaikan auditor pendahulu?',
      riskyAnswer: 'Ya',
    },
    {
      no: '3b',
      key: 'q3bSengketaFee',
      text: 'Apakah terdapat sengketa imbalan jasa (fee dispute) atau kewajiban yang belum diselesaikan dengan auditor pendahulu?',
      riskyAnswer: 'Ya',
    },
  ];

  const needsFollowUp =
    a1105.q3aKeberatanProfesional === 'Ya' || a1105.q3bSengketaFee === 'Ya';

  return (
    <div className="space-y-4 max-w-5xl">
      {!isConditionallyVisible && (
        <div className="p-3 rounded bg-slate-100 border border-slate-300 text-xs text-slate-700 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-slate-600 mt-0.5" />
          <span>
            Indeks A1105 saat ini berstatus <strong>N/A</strong> karena perikatan berstatus{' '}
            <em>{activeEngagement.header.tipePerikatan}</em> atau laporan periode sebelumnya tidak diaudit oleh auditor pendahulu.
          </span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            SA 300 · SA 510 · PERIKATAN TAHUN PERTAMA
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
            A1105 — Komunikasi dengan Auditor Pendahulu
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            data-testid="a1105-risk-badge"
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
              a1105.simpulanRisiko === 'High'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            Simpulan Risiko: {a1105.simpulanRisiko}
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
              <th className="py-2 px-3 text-left font-semibold">Prosedur Komunikasi Auditor Pendahulu</th>
              <th className="py-2 px-3 text-right font-semibold w-36">Jawaban</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {questions.map((q) => {
              const val = a1105[q.key];
              const isRisky = val === q.riskyAnswer;
              return (
                <tr key={q.key} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">{q.no}</td>
                  <td className="py-2.5 px-3 text-slate-800">{q.text}</td>
                  <td className="py-2.5 px-3 text-right">
                    <select
                      aria-label={q.text}
                      data-testid={`a1105-${q.key}`}
                      disabled={isReadOnly}
                      value={val}
                      onChange={(e) =>
                        dispatchAction({
                          type: 'UPDATE_A1105',
                          patch: { [q.key]: e.target.value as 'Ya' | 'Tidak' },
                        })
                      }
                      className={`h-8 px-2 text-xs rounded border font-medium disabled:bg-slate-100 ${
                        isRisky
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="Ya">Ya</option>
                      <option value="Tidak">Tidak</option>
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
          htmlFor="a1105-tindak-lanjut"
          className="block text-xs font-semibold text-slate-800 mb-1"
        >
          Penjelasan Tindak Lanjut & Evaluasi Balasan Auditor Pendahulu{' '}
          {needsFollowUp && <span className="text-rose-700">(Wajib diisi — ada keberatan/sengketa)</span>}
        </label>
        <textarea
          id="a1105-tindak-lanjut"
          disabled={isReadOnly}
          rows={3}
          value={a1105.penjelasanTindakLanjut}
          onChange={(e) =>
            dispatchAction({
              type: 'UPDATE_A1105',
              patch: { penjelasanTindakLanjut: e.target.value },
            })
          }
          placeholder="Dokumentasikan tanggal pengiriman surat, isi balasan auditor pendahulu, dan tindak lanjut..."
          className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100"
        />
      </div>
    </div>
  );
};
