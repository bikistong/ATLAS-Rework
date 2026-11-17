import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { generateEngagementLetterDocx } from '../../services/export/docxEngagementLetters';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { formatAuditNumber, formatIdDate } from '../../utils/formatters';
import { calculateTeamBudgetTotals } from '../../utils/timeCalculator';

export const A130EngagementLetter: React.FC = () => {
  const { state, activeEngagement, activeClient, dispatchAction, showToast } = useAtlas();
  const [generating, setGenerating] = useState(false);

  if (!activeEngagement || !activeClient) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A130');
  const { header, a120, teamMembers, legalChecklists } = activeEngagement;
  const clauses = legalChecklists.filter((c) => c.kodeIndeks === 'A130');
  const budgetTotals = calculateTeamBudgetTotals(
    teamMembers,
    a120.hariEfektif * a120.jamPerHari
  );

  const handleDownloadDocx = async () => {
    setGenerating(true);
    try {
      const filename = await generateEngagementLetterDocx({
        kapProfile: state.kapProfile,
        client: activeClient,
        workspace: activeEngagement,
        totalBudgetFee: budgetTotals.grandTotalHonorarium,
      });
      showToast('success', `Dokumen "${filename}" berhasil dibuat dan diunduh.`);
    } catch (err) {
      showToast('error', `Gagal membuat dokumen .docx: ${(err as Error).message}`);
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
              SA 210 · PERSETUJUAN ATAS KETENTUAN PERIKATAN AUDIT
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A130 — Checklist & Generator Surat Perikatan (Engagement Letter)
            </h2>
          </div>
          <button
            type="button"
            data-testid="btn-generate-a130-docx"
            disabled={generating}
            onClick={handleDownloadDocx}
            className="h-8 px-3 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <FileDown className="w-3.5 h-3.5" />
            {generating ? 'Menyusun .docx...' : 'Generate Surat Perikatan (.docx)'}
          </button>
        </div>

        {/* Metadata Kop Surat & Nilai Jasa */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="a130-nomor"
              className="block text-[11px] font-semibold text-slate-700 mb-1"
            >
              Nomor Surat Perikatan
            </label>
            <input
              id="a130-nomor"
              type="text"
              disabled={isReadOnly}
              value={header.nomorSuratPerikatan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_ENGAGEMENT_HEADER',
                  patch: { nomorSuratPerikatan: e.target.value },
                  sourceIndeks: 'A130',
                })
              }
              className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="a130-tanggal"
              className="block text-[11px] font-semibold text-slate-700 mb-1"
            >
              Tanggal Surat Perikatan
            </label>
            <input
              id="a130-tanggal"
              type="date"
              disabled={isReadOnly}
              value={header.tanggalPerikatan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_ENGAGEMENT_HEADER',
                  patch: { tanggalPerikatan: e.target.value },
                  sourceIndeks: 'A130',
                })
              }
              className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded disabled:bg-slate-100"
            />
          </div>

          <div className="p-2 rounded bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-semibold text-slate-500">
              Estimasi Jasa Audit (Dari A120)
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              Rp {formatAuditNumber(budgetTotals.grandTotalHonorarium)}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex flex-wrap gap-x-6 gap-y-1">
          <span>
            Kop Surat: <strong className="text-slate-800">{state.kapProfile.namaKap}</strong> ({state.kapProfile.nomorIzinKap})
          </span>
          <span>
            Pemimpin Rekan: <strong className="text-slate-800">{state.kapProfile.namaPemimpin}</strong> ({state.kapProfile.nomorIzinAp})
          </span>
          <span>
            Periode Audit: <strong className="text-slate-800">{formatIdDate(header.periodeMulai)} – {formatIdDate(header.periodeSelesai)}</strong>
          </span>
        </div>
      </div>

      {/* Checklist 11 Klausul SA 210 */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-semibold w-14">Klausul</th>
              <th className="py-2 px-3 text-left font-semibold">Uraian Ketentuan Wajib Surat Perikatan (SA 210)</th>
              <th className="py-2 px-3 text-center font-semibold w-24">Terpenuhi</th>
              <th className="py-2 px-3 text-left font-semibold w-56">Catatan Auditor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {clauses.map((c) => (
              <tr key={c.kodeKlausul} className="hover:bg-slate-50">
                <td className="py-2 px-3 font-mono font-semibold text-slate-700">{c.kodeKlausul}</td>
                <td className="py-2 px-3 text-slate-800">{c.uraianKlausul}</td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    aria-label={`Klausul ${c.kodeKlausul}`}
                    disabled={isReadOnly}
                    checked={c.isCompliant}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_LEGAL_CLAUSE',
                        kodeIndeks: 'A130',
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
                        kodeIndeks: 'A130',
                        kodeKlausul: c.kodeKlausul,
                        patch: { catatan: e.target.value },
                      })
                    }
                    placeholder="Catatan/referensi..."
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
