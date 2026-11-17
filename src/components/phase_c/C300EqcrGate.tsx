import React, { useMemo, useState } from 'react';
import { CheckCircle2, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { C300_SA220_CHECKLIST_ITEMS } from '../../data/cModuleCatalog';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { evaluateEqcrGate } from '../../utils/cModuleFormulas';

export const C300EqcrGate: React.FC = () => {
  const { state, activeEngagement, activeClient, dispatchAction } = useAtlas();
  const [indexRef, setIndexRef] = useState('A270');
  const [significantMatter, setSignificantMatter] = useState('');
  const [reviewerSuggestion, setReviewerSuggestion] = useState('');
  const [teamResponse, setTeamResponse] = useState('');

  const readOnly = activeEngagement ? isWorkpaperReadOnly(activeEngagement, 'C300') : true;
  const partnerUsers = useMemo(
    () => state.users.filter((u) => u.role === 'Partner' && u.isActive),
    [state.users]
  );

  const eqcrGate = useMemo(
    () => (activeEngagement ? evaluateEqcrGate(activeEngagement, activeClient) : null),
    [activeEngagement, activeClient]
  );

  if (!activeEngagement || !eqcrGate) return null;

  const eqcr = activeEngagement.moduleC.c300Eqcr;

  const handleAddFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !significantMatter.trim()) return;
    dispatchAction({
      type: 'UPSERT_C300_FINDING',
      finding: {
        id: `eqcr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        indexRef: indexRef.trim() || 'Umum',
        significantMatter: significantMatter.trim(),
        reviewerSuggestion: reviewerSuggestion.trim(),
        teamResponse: teamResponse.trim(),
        status: 'Pending',
      },
    });
    setSignificantMatter('');
    setReviewerSuggestion('');
    setTeamResponse('');
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* EQCR Gate Status Banner */}
      {eqcrGate.canIssueLai ? (
        <div
          data-testid="c300-gate-passed"
          className="bg-emerald-50 border border-emerald-200 rounded px-4 py-3 flex items-start gap-2.5 text-xs text-emerald-900"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Gerbang Pengaman EQCR (C300) Terpenuhi</div>
            <p className="mt-0.5">
              Penerbitan Laporan Auditor Independen Final (.docx) dan Partner Lock pada C400 telah terbuka.
            </p>
          </div>
        </div>
      ) : (
        <div
          data-testid="c300-gate-blocked"
          className="bg-amber-50 border border-amber-300 rounded px-4 py-3 flex items-start gap-2.5 text-xs text-amber-950"
        >
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">
              Gerbang Pengaman EQCR Aktif: Penerbitan LAI Final (C400) Masih Diblokir
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {eqcrGate.blockedReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Reviewer Assignment */}
      <div className="bg-white border border-slate-200 rounded p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <label
            htmlFor="c300-reviewer"
            className="block text-xs font-bold text-slate-800 mb-1"
          >
            Partner Penelaah Pengendalian Mutu Perikatan (EQCR Independen — SA 220)
          </label>
          <select
            id="c300-reviewer"
            data-testid="c300-reviewer-select"
            disabled={readOnly}
            value={eqcr.eqcrReviewerId ?? ''}
            onChange={(e) =>
              dispatchAction({
                type: 'UPDATE_C300_EQCR',
                patch: { eqcrReviewerId: e.target.value || undefined },
              })
            }
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
          >
            <option value="">-- Pilih Partner EQCR dari Master Tim KAP --</option>
            {partnerUsers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.namaLengkap} ({p.nomorRegistrasi})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-3">
          <div className="font-semibold text-slate-800">Status Persyaratan EQCR</div>
          <div className="mt-1">
            Status KKP C300:{' '}
            <span className="font-mono font-bold text-indigo-700">{eqcrGate.c300Status}</span> ·
            Checklist Selesai:{' '}
            <span className="font-mono font-bold">{eqcrGate.checklistCompletedCount}/6</span> ·
            Temuan Pending:{' '}
            <span className="font-mono font-bold text-rose-700">{eqcrGate.pendingFindingsCount}</span>
          </div>
        </div>
      </div>

      {/* 6-Item SA 220 Checklist */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
          Daftar Periksa Penelaahan Mutu EQCR (6 Aspek Wajib SA 220)
        </div>
        <div className="divide-y divide-slate-100">
          {C300_SA220_CHECKLIST_ITEMS.map((label, idx) => {
            const checked = Boolean(eqcr.checklist[idx]);
            return (
              <label
                key={label}
                className="flex items-start gap-3 px-4 py-2.5 text-xs hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={checked}
                  onChange={(e) => {
                    const nextChecklist = [...eqcr.checklist];
                    nextChecklist[idx] = e.target.checked;
                    dispatchAction({
                      type: 'UPDATE_C300_EQCR',
                      patch: { checklist: nextChecklist },
                    });
                  }}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600"
                />
                <span className="text-slate-800 leading-relaxed">
                  <span className="font-mono font-semibold text-slate-500 mr-1.5">
                    0{idx + 1}.
                  </span>
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Findings & Follow-up Log */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
          Log Catatan &amp; Tindak Lanjut Temuan EQCR (Semua temuan wajib berstatus Resolved sebelum C400)
        </div>

        <form
          onSubmit={handleAddFinding}
          className="p-3 border-b border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end bg-slate-50/50"
        >
          <div className="md:col-span-2">
            <label htmlFor="eqcr-ref" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Indeks KKP
            </label>
            <input
              id="eqcr-ref"
              type="text"
              disabled={readOnly}
              value={indexRef}
              onChange={(e) => setIndexRef(e.target.value)}
              className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded"
            />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="eqcr-matter" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Hal Signifikan / Temuan Penelaah
            </label>
            <input
              id="eqcr-matter"
              data-testid="c300-finding-matter"
              type="text"
              disabled={readOnly}
              value={significantMatter}
              onChange={(e) => setSignificantMatter(e.target.value)}
              placeholder="Contoh: Perlu klarifikasi estimasi cadangan piutang..."
              className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded"
            />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="eqcr-sugg" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Saran Reviewer EQCR
            </label>
            <input
              id="eqcr-sugg"
              type="text"
              disabled={readOnly}
              value={reviewerSuggestion}
              onChange={(e) => setReviewerSuggestion(e.target.value)}
              placeholder="Arahan perbaikan tim..."
              className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="eqcr-resp" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tanggapan Tim
            </label>
            <input
              id="eqcr-resp"
              type="text"
              disabled={readOnly}
              value={teamResponse}
              onChange={(e) => setTeamResponse(e.target.value)}
              placeholder="Tindak lanjut..."
              className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded"
            />
          </div>
          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={readOnly || !significantMatter.trim()}
              data-testid="c300-add-finding-btn"
              className="w-full h-8 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 text-white text-xs font-semibold rounded flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat</span>
            </button>
          </div>
        </form>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="py-2 px-3 text-left w-24">KKP</th>
              <th className="py-2 px-3 text-left">Hal Signifikan</th>
              <th className="py-2 px-3 text-left">Saran Reviewer</th>
              <th className="py-2 px-3 text-left">Tanggapan Tim</th>
              <th className="py-2 px-3 text-center w-32">Status</th>
              <th className="py-2 px-3 text-center w-14">Hapus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {eqcr.findings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                  Belum ada catatan temuan EQCR.
                </td>
              </tr>
            ) : (
              eqcr.findings.map((f) => (
                <tr key={f.id}>
                  <td className="py-2 px-3 font-mono font-semibold text-indigo-700">{f.indexRef}</td>
                  <td className="py-2 px-3 text-slate-800">{f.significantMatter}</td>
                  <td className="py-2 px-3 text-slate-700">{f.reviewerSuggestion || '-'}</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      disabled={readOnly}
                      aria-label={`Tanggapan tim untuk ${f.indexRef}`}
                      value={f.teamResponse}
                      onChange={(e) =>
                        dispatchAction({
                          type: 'UPSERT_C300_FINDING',
                          finding: { ...f, teamResponse: e.target.value },
                        })
                      }
                      className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <select
                      disabled={readOnly}
                      data-testid={`c300-finding-status-${f.id}`}
                      aria-label={`Status temuan ${f.significantMatter}`}
                      value={f.status}
                      onChange={(e) =>
                        dispatchAction({
                          type: 'UPSERT_C300_FINDING',
                          finding: {
                            ...f,
                            status: e.target.value as 'Pending' | 'Resolved',
                          },
                        })
                      }
                      className={`h-7 px-2 text-xs border rounded font-semibold ${
                        f.status === 'Pending'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => dispatchAction({ type: 'DELETE_C300_FINDING', findingId: f.id })}
                      aria-label="Hapus temuan EQCR"
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Conclusion */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-1.5">
        <label htmlFor="c300-conclusion" className="block text-xs font-bold text-slate-800">
          Simpulan Penelaahan Mutu Partner EQCR (SA 220)
        </label>
        <textarea
          id="c300-conclusion"
          rows={2}
          disabled={readOnly}
          value={eqcr.conclusion}
          onChange={(e) =>
            dispatchAction({
              type: 'UPDATE_C300_EQCR',
              patch: { conclusion: e.target.value },
            })
          }
          placeholder="Berdasarkan penelaahan terhadap kertas kerja signifikan dan diskusi dengan tim perikatan, opini audit telah didukung bukti audit yang memadai..."
          className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
        />
      </div>
    </div>
  );
};
