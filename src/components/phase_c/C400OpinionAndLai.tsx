import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Lock, ShieldAlert } from 'lucide-react';
import { OPINION_TEMPLATES, SAK_AU_CODES } from '../../data/cModuleCatalog';
import { generateLaiDocx } from '../../services/export/docxLaiReport';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { OpinionCode } from '../../types/atlas';
import {
  evaluateEqcrGate,
  formatOfficialLaiNumber,
  validateC400BeforeIssue,
} from '../../utils/cModuleFormulas';
import { formatIdDate } from '../../utils/formatters';

export const C400OpinionAndLai: React.FC = () => {
  const { state, activeEngagement, activeClient, dispatchAction, showToast, setActiveIndex } =
    useAtlas();
  const [generating, setGenerating] = useState(false);

  const readOnly = activeEngagement ? isWorkpaperReadOnly(activeEngagement, 'C400') : true;

  const partnerUsers = useMemo(
    () => state.users.filter((u) => u.role === 'Partner' && u.isActive),
    [state.users]
  );

  const eqcrGate = useMemo(
    () => (activeEngagement ? evaluateEqcrGate(activeEngagement, activeClient) : null),
    [activeEngagement, activeClient]
  );

  const validation = useMemo(
    () => (activeEngagement ? validateC400BeforeIssue(activeEngagement, activeClient) : null),
    [activeEngagement, activeClient]
  );

  if (!activeEngagement || !activeClient || !eqcrGate || !validation) return null;

  const c400 = activeEngagement.moduleC.c400Opinion;
  const suggestedMeta = OPINION_TEMPLATES[c400.suggestedOpinion];
  const selectedMeta = OPINION_TEMPLATES[c400.selectedOpinion];
  const isOverridden = c400.selectedOpinion !== c400.suggestedOpinion;

  const laiNumber = formatOfficialLaiNumber({
    reportSequenceNumber: c400.reportSequenceNumber,
    sak: activeClient.sakDigunakan,
    branchCode: c400.branchCode,
    tanggalLaporanAuditor: activeEngagement.header.tanggalLaporanAuditor,
  });

  const signingPartner =
    state.users.find((u) => u.id === c400.signingPartnerId) ??
    partnerUsers[0] ??
    state.users[0];

  const b240Status = activeEngagement.specialProcedures.b240.simpulan;

  const handleGenerateLai = async () => {
    if (!validation.allowed || !signingPartner) return;
    setGenerating(true);
    try {
      const filename = await generateLaiDocx({
        kapProfile: state.kapProfile,
        client: activeClient,
        workspace: activeEngagement,
        signingPartner,
      });
      showToast('success', `LAI Final "${filename}" berhasil di-generate (.docx).`);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Gagal membuat dokumen LAI (.docx).'
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* EQCR / Validation Gate Banner */}
      {!eqcrGate.canIssueLai && (
        <div
          data-testid="c400-eqcr-lock-banner"
          className="bg-rose-50 border border-rose-300 rounded px-4 py-3 flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-2.5 text-xs text-rose-900">
            <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">
                Gerbang Pengaman EQCR Aktif — Penerbitan LAI Final (.docx) &amp; Partner Lock Diblokir
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {eqcrGate.blockedReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex('C300')}
            className="shrink-0 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded cursor-pointer"
          >
            Buka EQCR C300
          </button>
        </div>
      )}

      {eqcrGate.canIssueLai && !validation.allowed && (
        <div
          data-testid="c400-validation-banner"
          className="bg-amber-50 border border-amber-300 rounded px-4 py-3 flex items-start gap-2.5 text-xs text-amber-950"
        >
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Lengkapi Persyaratan Sebelum Penerbitan LAI Final</div>
            <ul className="list-disc pl-4 space-y-0.5">
              {validation.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {validation.allowed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Seluruh gerbang validasi (EQCR C300, Basis Opini, dan Penandatangan AP) terpenuhi. Draft LAI siap di-generate ke format Microsoft Word (.docx).
          </span>
        </div>
      )}

      {/* 1. Matriks Keputusan 5 Opini */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Matriks Keputusan Opini Auditor (SA 700 / SA 705)
            </h2>
            <span
              data-testid="c400-suggested-opinion"
              className="shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-[11px] font-bold"
            >
              Rekomendasi: {suggestedMeta.code} ({suggestedMeta.saRef})
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-center justify-between gap-3 p-2.5 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
              <span className="font-medium text-slate-800">
                Q1. Apakah auditor memperoleh bukti audit yang cukup dan tepat?
              </span>
              <input
                type="checkbox"
                data-testid="c400-q1-checkbox"
                disabled={readOnly}
                checked={c400.q1EvidenceSufficient}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { q1EvidenceSufficient: e.target.checked },
                  })
                }
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-2.5 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
              <span className="font-medium text-slate-800">
                Q2. Apakah terdapat salah saji material (atau potensi dampak material) yang tidak dikoreksi?
              </span>
              <input
                type="checkbox"
                data-testid="c400-q2-checkbox"
                disabled={readOnly}
                checked={c400.q2MaterialMisstatement}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { q2MaterialMisstatement: e.target.checked },
                  })
                }
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-2.5 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
              <span className="font-medium text-slate-800">
                Q3. Apakah dampak salah saji / pembatasan lingkup bersifat pervasif terhadap LK?
              </span>
              <input
                type="checkbox"
                data-testid="c400-q3-checkbox"
                disabled={readOnly}
                checked={c400.q3ImpactPervasive}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { q3ImpactPervasive: e.target.checked },
                  })
                }
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div>
              <label htmlFor="c400-selected-opinion" className="block text-xs font-bold text-slate-700 mb-1">
                Opini Final yang Dipilih Partner
              </label>
              <select
                id="c400-selected-opinion"
                data-testid="c400-selected-opinion"
                disabled={readOnly}
                value={c400.selectedOpinion}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { selectedOpinion: e.target.value as OpinionCode },
                  })
                }
                className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded font-medium disabled:bg-slate-100"
              >
                {Object.values(OPINION_TEMPLATES).map((op) => (
                  <option key={op.code} value={op.code}>
                    {op.code} — {op.titleId} ({op.saRef})
                  </option>
                ))}
              </select>
            </div>

            {isOverridden && (
              <div>
                <label
                  htmlFor="c400-override-reason"
                  className="block text-xs font-bold text-amber-800 mb-1"
                >
                  Justifikasi Override Opini (Wajib min. 20 karakter karena berbeda dari rekomendasi)
                </label>
                <textarea
                  id="c400-override-reason"
                  rows={2}
                  disabled={readOnly}
                  value={c400.overrideJustification}
                  onChange={(e) =>
                    dispatchAction({
                      type: 'UPDATE_C400_OPINION',
                      patch: { overrideJustification: e.target.value },
                    })
                  }
                  placeholder="Jelaskan alasan profesional override rekomendasi matriks opini..."
                  className="w-full p-2 text-xs bg-amber-50/40 border border-amber-300 rounded disabled:bg-slate-100"
                />
              </div>
            )}

            {selectedMeta.requiresModificationBasis && (
              <div>
                <label
                  htmlFor="c400-mod-basis"
                  className="block text-xs font-bold text-rose-800 mb-1"
                >
                  Paragraf Basis untuk Modifikasi Opini (Wajib untuk {selectedMeta.code} — min. 20 karakter)
                </label>
                <textarea
                  id="c400-mod-basis"
                  data-testid="c400-mod-basis"
                  rows={3}
                  disabled={readOnly}
                  value={c400.basisForModificationText}
                  onChange={(e) =>
                    dispatchAction({
                      type: 'UPDATE_C400_OPINION',
                      patch: { basisForModificationText: e.target.value },
                    })
                  }
                  placeholder="Uraikan secara spesifik akun, nilai dampak Rp, dan standar SAK yang tidak terpenuhi atau keterbatasan bukti audit..."
                  className="w-full p-2.5 text-xs bg-white border border-rose-300 rounded disabled:bg-slate-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* 2. Penomoran PPPK/IAPI, Penandatangan, & Paragraf SA 570 / SA 706 */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Penomoran Resmi PPPK / IAPI &amp; Penandatangan AP
          </h2>

          <div className="bg-slate-900 text-white rounded p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Preview Nomor Laporan Auditor Independen
            </div>
            <div
              data-testid="c400-lai-number-preview"
              className="mt-1 font-mono text-sm font-bold tracking-wide text-emerald-300"
            >
              {laiNumber}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Kerangka: {activeClient.sakDigunakan} ({SAK_AU_CODES[activeClient.sakDigunakan]})
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="c400-seq" className="block text-[11px] font-semibold text-slate-600 mb-1">
                No. Urut LAI
              </label>
              <input
                id="c400-seq"
                type="text"
                disabled={readOnly}
                value={c400.reportSequenceNumber}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { reportSequenceNumber: e.target.value },
                  })
                }
                className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>

            <div>
              <label htmlFor="c400-branch" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Kode Cabang KAP
              </label>
              <input
                id="c400-branch"
                type="text"
                disabled={readOnly}
                value={c400.branchCode}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { branchCode: e.target.value },
                  })
                }
                className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="c400-target" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Pihak yang Dituju (SA 700.22)
            </label>
            <input
              id="c400-target"
              type="text"
              disabled={readOnly}
              value={c400.targetedTo}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_C400_OPINION',
                  patch: { targetedTo: e.target.value },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
            />
          </div>

          <div>
            <label htmlFor="c400-partner" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Akuntan Publik (Partner) Penandatangan
            </label>
            <select
              id="c400-partner"
              disabled={readOnly}
              value={c400.signingPartnerId}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_C400_OPINION',
                  patch: { signingPartnerId: e.target.value },
                })
              }
              className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
            >
              {partnerUsers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaLengkap} ({p.nomorRegistrasi})
                </option>
              ))}
            </select>
          </div>

          {/* SA 570 & SA 706 Optional Paragraphs */}
          <div className="pt-2 border-t border-slate-200 space-y-2.5 text-xs">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={readOnly}
                checked={c400.hasMaterialUncertaintyGoingConcern}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { hasMaterialUncertaintyGoingConcern: e.target.checked },
                  })
                }
                className="mt-0.5 rounded border-slate-300 text-indigo-600"
              />
              <div>
                <div className="font-semibold text-slate-800">
                  Paragraf Ketidakpastian Material Going Concern (SA 570)
                </div>
                <div className="text-[11px] text-slate-500">
                  Status B240 saat ini: {b240Status}
                </div>
              </div>
            </label>

            {c400.hasMaterialUncertaintyGoingConcern && (
              <input
                type="text"
                disabled={readOnly}
                value={c400.goingConcernCalkRef}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { goingConcernCalkRef: e.target.value },
                  })
                }
                placeholder="Referensi CaLK Going Concern (mis. Catatan 25)..."
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
              />
            )}

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={readOnly}
                checked={c400.hasEmphasisOfMatter}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { hasEmphasisOfMatter: e.target.checked },
                  })
                }
                className="mt-0.5 rounded border-slate-300 text-indigo-600"
              />
              <span className="font-semibold text-slate-800">
                Paragraf Penekanan Suatu Hal (SA 706)
              </span>
            </label>

            {c400.hasEmphasisOfMatter && (
              <div className="space-y-1.5">
                <input
                  type="text"
                  disabled={readOnly}
                  value={c400.emphasisCalkRef}
                  onChange={(e) =>
                    dispatchAction({
                      type: 'UPDATE_C400_OPINION',
                      patch: { emphasisCalkRef: e.target.value },
                    })
                  }
                  placeholder="Ref. CaLK (mis. Catatan 18)"
                  className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
                />
                <textarea
                  rows={2}
                  disabled={readOnly}
                  value={c400.emphasisOfMatterText}
                  onChange={(e) =>
                    dispatchAction({
                      type: 'UPDATE_C400_OPINION',
                      patch: { emphasisOfMatterText: e.target.value },
                    })
                  }
                  placeholder="Redaksi paragraf Penekanan Suatu Hal..."
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded"
                />
              </div>
            )}

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={readOnly}
                checked={c400.hasOtherMatter}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { hasOtherMatter: e.target.checked },
                  })
                }
                className="mt-0.5 rounded border-slate-300 text-indigo-600"
              />
              <span className="font-semibold text-slate-800">Paragraf Hal Lain (SA 706)</span>
            </label>

            {c400.hasOtherMatter && (
              <textarea
                rows={2}
                disabled={readOnly}
                value={c400.otherMatterText}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_C400_OPINION',
                    patch: { otherMatterText: e.target.value },
                  })
                }
                placeholder="Mis. Laporan keuangan periode sebelumnya diaudit oleh auditor independen lain..."
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded"
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. Live LAI Preview & Generate DOCX Button */}
      <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Pratinjau Draft Laporan Auditor Independen &amp; Ekspor Word (.docx)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kop surat dan blok tanda tangan otomatis mengambil profil aktif {state.kapProfile.namaKap}.
            </p>
          </div>

          <button
            type="button"
            data-testid="c400-generate-lai-btn"
            disabled={!validation.allowed || generating}
            onClick={handleGenerateLai}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold rounded flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{generating ? 'Menyusun .docx...' : 'Generate LAI Final (.docx)'}</span>
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded p-6 max-w-4xl mx-auto text-xs text-slate-900 space-y-3 font-serif leading-relaxed">
          <div className="text-center border-b-2 border-slate-800 pb-3">
            <div className="text-sm font-bold tracking-wide uppercase">
              {state.kapProfile.namaKap}
            </div>
            <div className="text-[11px] text-slate-600">
              Izin Usaha KAP No. {state.kapProfile.nomorIzinKap} · {state.kapProfile.alamat},{' '}
              {state.kapProfile.kota}
            </div>
          </div>

          <div className="text-center pt-2">
            <div className="text-sm font-bold">LAPORAN AUDITOR INDEPENDEN</div>
            <div className="font-mono text-[11px] font-semibold text-slate-700">
              No. Laporan: {laiNumber}
            </div>
          </div>

          <div className="font-bold pt-1">
            <div>{c400.targetedTo}</div>
            <div>{activeClient.namaKlien}</div>
          </div>

          <div>
            <div className="font-bold mb-1">{selectedMeta.opinionHeading}</div>
            <p>
              {selectedMeta.opinionLeadParagraph({
                clientName: activeClient.namaKlien,
                periodeText: `tanggal ${formatIdDate(activeEngagement.header.periodeSelesai)}`,
                sak: activeClient.sakDigunakan,
              })}
            </p>
          </div>

          {selectedMeta.requiresModificationBasis && (
            <div className="bg-amber-50/70 border border-amber-200 rounded p-2.5">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Basis untuk {selectedMeta.opinionHeading}</span>
              </div>
              <p>
                {c400.basisForModificationText.trim() ||
                  '(Uraian basis modifikasi belum diisi pada formulir di atas.)'}
              </p>
            </div>
          )}

          <div className="pt-4">
            <div className="font-bold uppercase">{state.kapProfile.namaKap}</div>
            <div className="mt-8 font-bold underline">{signingPartner?.namaLengkap}</div>
            <div>Registrasi Akuntan Publik No. {signingPartner?.nomorRegistrasi}</div>
            <div>
              {state.kapProfile.kota}, {formatIdDate(activeEngagement.header.tanggalLaporanAuditor)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
