import React from 'react';
import { Info } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { A170OpeningBalance } from '../../types/atlas';
import { isIndexVisibleForWorkspace } from '../../utils/formatters';

const A170_QUESTIONS: {
  key: keyof Pick<
    A170OpeningBalance,
    | 'q1BacaLkTerdahulu'
    | 'q2aReviuKkpPendahulu'
    | 'q2bEvaluasiProsedurBerjalan'
    | 'q2cProsedurSpesifikSaldo'
    | 'q3BuktiPemindahanSaldo'
    | 'q4KonsistensiKebijakan'
    | 'q5SalahSajiMaterial'
  >;
  no: string;
  text: string;
}[] = [
  {
    no: '1',
    key: 'q1BacaLkTerdahulu',
    text: 'Apakah auditor telah membaca laporan keuangan terkini dan laporan auditor pendahulu (jika ada) untuk informasi relevan atas saldo awal?',
  },
  {
    no: '2a',
    key: 'q2aReviuKkpPendahulu',
    text: 'Apakah auditor telah mereviu kertas kerja auditor pendahulu untuk memperoleh bukti atas saldo awal?',
  },
  {
    no: '2b',
    key: 'q2bEvaluasiProsedurBerjalan',
    text: 'Apakah auditor telah mengevaluasi apakah prosedur audit periode berjalan memberikan bukti relevan atas saldo awal (aset/liabilitas lancar)?',
  },
  {
    no: '2c',
    key: 'q2cProsedurSpesifikSaldo',
    text: 'Apakah auditor telah melaksanakan prosedur audit spesifik (vouching/konfirmasi/inspeksi fisik aset tetap & pinjaman) untuk memverifikasi saldo awal?',
  },
  {
    no: '3',
    key: 'q3BuktiPemindahanSaldo',
    text: 'Apakah auditor telah memperoleh bukti cukup dan tepat bahwa saldo penutup periode lalu telah dipindahkan secara benar ke periode berjalan?',
  },
  {
    no: '4',
    key: 'q4KonsistensiKebijakan',
    text: 'Apakah kebijakan akuntansi yang tercermin pada saldo awal telah diterapkan secara konsisten dengan periode berjalan sesuai SAK?',
  },
  {
    no: '5',
    key: 'q5SalahSajiMaterial',
    text: 'Apakah ditemukan bukti yang mengindikasikan saldo awal mengandung salah saji material yang berdampak pada laporan keuangan periode berjalan?',
  },
];

export const A170OpeningBalanceView: React.FC = () => {
  const { activeEngagement, activeClient, dispatchAction } = useAtlas();

  if (!activeEngagement || !activeClient) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A170');
  const isConditionallyVisible = isIndexVisibleForWorkspace(
    'A170',
    activeEngagement,
    activeClient.statusKepemilikan
  );
  const { a170 } = activeEngagement;

  const requiresExplanation =
    a170.simpulanKewajaran !== 'Secara umum Saldo Awal sudah wajar';

  return (
    <div className="space-y-4 max-w-5xl">
      {!isConditionallyVisible && (
        <div className="p-3 rounded bg-slate-100 border border-slate-300 text-xs text-slate-700 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-slate-600 mt-0.5" />
          <span>
            Indeks A170 saat ini tidak aktif untuk <strong>{activeEngagement.header.tipePerikatan}</strong> dengan kondisi pelaporan periode berjalan.
          </span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          SA 510 · PERIKATAN AUDIT TAHUN PERTAMA — SALDO AWAL
        </div>
        <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
          A170 — Prosedur & Evaluasi Kewajaran Saldo Awal (Opening Balances)
        </h2>
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-semibold w-12">No</th>
              <th className="py-2 px-3 text-left font-semibold">Prosedur Audit Saldo Awal (SA 510)</th>
              <th className="py-2 px-3 text-right font-semibold w-32">Jawaban</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {A170_QUESTIONS.map((q) => (
              <tr key={q.key} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">{q.no}</td>
                <td className="py-2.5 px-3 text-slate-800">{q.text}</td>
                <td className="py-2.5 px-3 text-right">
                  <select
                    aria-label={q.text}
                    data-testid={`a170-${q.key}`}
                    disabled={isReadOnly}
                    value={a170[q.key]}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_A170',
                        patch: { [q.key]: e.target.value as 'Ya' | 'Tidak' },
                      })
                    }
                    className="h-8 px-2 text-xs bg-white border border-slate-300 rounded font-medium disabled:bg-slate-100"
                  >
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
        <div>
          <label
            htmlFor="a170-simpulan"
            className="block text-xs font-semibold text-slate-800 mb-1"
          >
            Simpulan Kewajaran Saldo Awal (SA 510)
          </label>
          <select
            id="a170-simpulan"
            data-testid="a170-simpulan"
            disabled={isReadOnly}
            value={a170.simpulanKewajaran}
            onChange={(e) =>
              dispatchAction({
                type: 'UPDATE_A170',
                patch: {
                  simpulanKewajaran: e.target.value as A170OpeningBalance['simpulanKewajaran'],
                },
              })
            }
            className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded font-medium disabled:bg-slate-100"
          >
            <option value="Secara umum Saldo Awal sudah wajar">
              Secara umum Saldo Awal sudah wajar
            </option>
            <option value="Saldo Awal belum sepenuhnya wajar">
              Saldo Awal belum sepenuhnya wajar
            </option>
            <option value="Saldo Awal tidak wajar">Saldo Awal tidak wajar</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="a170-penjelasan"
            className="block text-xs font-semibold text-slate-800 mb-1"
          >
            Penjelasan & Dampak terhadap Prosedur / Opini Audit{' '}
            {requiresExplanation && (
              <span className="text-rose-700">(Wajib dijelaskan bila belum/tidak wajar)</span>
            )}
          </label>
          <textarea
            id="a170-penjelasan"
            disabled={isReadOnly}
            rows={3}
            value={a170.penjelasanKetidakwajaran}
            onChange={(e) =>
              dispatchAction({
                type: 'UPDATE_A170',
                patch: { penjelasanKetidakwajaran: e.target.value },
              })
            }
            placeholder="Uraikan temuan pada saldo awal, penyesuaian komparatif, atau pertimbangan modifikasi opini SA 510..."
            className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100"
          />
        </div>
      </div>
    </div>
  );
};
