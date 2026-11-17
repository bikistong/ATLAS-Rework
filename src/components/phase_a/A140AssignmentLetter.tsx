import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { generateAssignmentLetterDocx } from '../../services/export/docxEngagementLetters';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { formatAuditNumber, formatIdDate } from '../../utils/formatters';

export const A140AssignmentLetter: React.FC = () => {
  const { state, activeEngagement, activeClient, dispatchAction, showToast } = useAtlas();
  const [generating, setGenerating] = useState(false);

  if (!activeEngagement || !activeClient) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A140');
  const { header, teamMembers, a120, legalChecklists } = activeEngagement;
  const clauses = legalChecklists.filter((c) => c.kodeIndeks === 'A140');

  const handleDownloadDocx = async () => {
    setGenerating(true);
    try {
      const filename = await generateAssignmentLetterDocx({
        kapProfile: state.kapProfile,
        client: activeClient,
        workspace: activeEngagement,
        users: state.users,
      });
      showToast('success', `Dokumen "${filename}" berhasil dibuat dan diunduh.`);
    } catch (err) {
      showToast('error', `Gagal membuat Surat Tugas .docx: ${(err as Error).message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 220 · SPM 1 · PENUGASAN TIM PERIKATAN
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A140 — Reviu & Generator Surat Tugas Tim Audit
            </h2>
          </div>
          <button
            type="button"
            data-testid="btn-generate-a140-docx"
            disabled={generating}
            onClick={handleDownloadDocx}
            className="h-8 px-3 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <FileDown className="w-3.5 h-3.5" />
            {generating ? 'Menyusun .docx...' : 'Generate Surat Tugas (.docx)'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="a140-nomor"
              className="block text-[11px] font-semibold text-slate-700 mb-1"
            >
              Nomor Surat Tugas
            </label>
            <input
              id="a140-nomor"
              type="text"
              disabled={isReadOnly}
              value={header.nomorSuratTugas}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_ENGAGEMENT_HEADER',
                  patch: { nomorSuratTugas: e.target.value },
                  sourceIndeks: 'A140',
                })
              }
              className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded disabled:bg-slate-100"
            />
          </div>

          <div className="p-2 rounded bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-semibold text-slate-500">
              Periode Penugasan (A120)
            </div>
            <div className="text-xs font-mono font-semibold text-slate-800 mt-0.5">
              {formatIdDate(a120.tanggalMulai)} s.d. {formatIdDate(a120.tanggalSelesai)}
            </div>
          </div>

          <div className="p-2 rounded bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-semibold text-slate-500">
              Susunan Tim Aktif (A1103B)
            </div>
            <div className="text-xs font-mono font-semibold text-slate-800 mt-0.5">
              {teamMembers.length} Personel Ditugaskan
            </div>
          </div>
        </div>
      </div>

      {/* Preview Susunan Tim di Surat Tugas */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-700">
          Susunan Tim Tercantum pada Surat Tugas
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-semibold w-12">No</th>
              <th className="py-2 px-3 text-left font-semibold">Nama Lengkap Personel</th>
              <th className="py-2 px-3 text-center font-semibold w-24">Inisial</th>
              <th className="py-2 px-3 text-left font-semibold">Peran Penugasan</th>
              <th className="py-2 px-3 text-right font-semibold w-32">Total Jam (A120)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {teamMembers.map((tm, i) => {
              const u = state.users.find((x) => x.id === tm.userId);
              const totalJam =
                tm.rencanaJamPraperikatan + tm.rencanaJamRiskResponse + tm.rencanaJamPelaporan;
              return (
                <tr key={tm.userId}>
                  <td className="py-2 px-3 font-mono text-slate-500">{i + 1}</td>
                  <td className="py-2 px-3 font-medium text-slate-900">
                    {u?.namaLengkap ?? tm.userId}
                  </td>
                  <td className="py-2 px-3 text-center font-mono">{u?.inisial ?? '-'}</td>
                  <td className="py-2 px-3 text-slate-700">{tm.peranTim}</td>
                  <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold">
                    {formatAuditNumber(totalJam)} Jam
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Checklist 5 Klausul A140 */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-semibold w-14">Klausul</th>
              <th className="py-2 px-3 text-left font-semibold">Verifikasi Kelengkapan Surat Tugas</th>
              <th className="py-2 px-3 text-center font-semibold w-24">Sesuai</th>
              <th className="py-2 px-3 text-left font-semibold w-56">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {clauses.map((c) => (
              <tr key={c.kodeKlausul}>
                <td className="py-2 px-3 font-mono font-semibold text-slate-700">{c.kodeKlausul}</td>
                <td className="py-2 px-3 text-slate-800">{c.uraianKlausul}</td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={c.isCompliant}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_LEGAL_CLAUSE',
                        kodeIndeks: 'A140',
                        kodeKlausul: c.kodeKlausul,
                        patch: { isCompliant: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-emerald-700 cursor-pointer"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={c.catatan}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_LEGAL_CLAUSE',
                        kodeIndeks: 'A140',
                        kodeKlausul: c.kodeKlausul,
                        patch: { catatan: e.target.value },
                      })
                    }
                    className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
