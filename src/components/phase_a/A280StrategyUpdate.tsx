import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { generateAsmUpdateDocx } from '../../services/export/docxAuditStrategy';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { formatAuditNumber } from '../../utils/formatters';

export const A280StrategyUpdate: React.FC = () => {
  const { state, activeEngagement, activeClient, dispatchAction, showToast } = useAtlas();
  const [exporting, setExporting] = useState(false);

  if (!activeEngagement || !activeClient) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A280');
  const { a210, a230Items, a240Rows, a250Cycles, a260, a270Rows, a280 } = activeEngagement;

  const sigAccounts = a240Rows.filter((r) => r.isSignificantAccount);
  const highRommAccounts = a270Rows.filter((r) => r.overallRomm === 'High');
  const fraudActive = a230Items.some((i) => i.kodeSubIndeks === 'A230.7' && i.hasilAnalisis === 'Ya');
  const lowCrCycles = a250Cycles.filter((c) => c.controlRiskLevel === 'Low').length;

  const handleExportAsmDocx = async () => {
    setExporting(true);
    try {
      const filename = await generateAsmUpdateDocx({
        kapProfile: state.kapProfile,
        client: activeClient,
        workspace: activeEngagement,
      });
      showToast('success', `Dokumen ${filename} berhasil diunduh.`);
    } catch (err) {
      showToast('error', `Gagal mengekspor ASM Update: ${String(err)}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header + Tombol Export ASM Update */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 300 & SA 330 · SINTESIS PENILAIAN RISIKO A210–A270
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A280 — Audit Strategy Memorandum (ASM Update Pra-Pelaksanaan Fase B)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mengonsolidasikan materialitas SA 320, prosedur analitis, risiko kecurangan, akun signifikan, dan matriks RoMM sebelum pengujian substantif Fase B.
            </p>
          </div>
          <button
            type="button"
            disabled={exporting}
            data-testid="a280-export-docx"
            onClick={handleExportAsmDocx}
            className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Menyusun .docx...' : 'Export ASM Update (.docx)'}
          </button>
        </div>

        {/* 4 Kartu Ringkasan Sintesis A210-A270 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Materialitas (A210)</div>
            <div className="text-xs font-mono tabular-nums font-bold text-slate-900 mt-1">
              OM: Rp {formatAuditNumber(a210.nilaiOm)}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-slate-600 mt-0.5">
              PM: Rp {formatAuditNumber(a210.nilaiPm)} · AMPT: Rp {formatAuditNumber(a210.nilaiAmpt)}
            </div>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Akun & Fraud Risk (A230/A240)</div>
            <div className="text-xs font-mono font-bold text-slate-900 mt-1">
              {sigAccounts.length} Akun Signifikan
            </div>
            <div
              className={`text-[11px] font-medium mt-0.5 ${
                fraudActive ? 'text-rose-700 font-semibold' : 'text-emerald-700'
              }`}
            >
              Fraud SA 240: {fraudActive ? 'Teridentifikasi' : 'Tidak Teridentifikasi'}
            </div>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Pengendalian & TCWG (A250/A260)</div>
            <div className="text-xs font-mono font-bold text-slate-900 mt-1">
              {lowCrCycles}/13 Siklus CR Low
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5 truncate">
              {a260.simpulanTcwg}
            </div>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase font-semibold text-slate-500">RoMM Matriks (A270)</div>
            <div
              className={`text-xs font-mono font-bold mt-1 ${
                highRommAccounts.length > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {highRommAccounts.length} Akun High RoMM
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Dari 45 pos Lead Schedule
            </div>
          </div>
        </div>
      </div>

      {/* Form Strategi Audit Mutakhir */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
          <FileText className="w-4 h-4 text-slate-600" />
          Penetapan Pendekatan Audit & Rencana Pengujian Fase B
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="a280-pendekatan" className="block text-xs font-semibold text-slate-700 mb-1">
              Pendekatan Audit Utama (SA 330)
            </label>
            <select
              id="a280-pendekatan"
              data-testid="a280-pendekatan"
              disabled={isReadOnly}
              value={a280.pendekatanAuditUtama}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_A280',
                  patch: {
                    pendekatanAuditUtama: e.target.value as
                      | 'Substantive Approach'
                      | 'Combined Approach',
                  },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
            >
              <option value="Substantive Approach">
                Substantive Approach (Pengujian Substantif Utama)
              </option>
              <option value="Combined Approach">
                Combined Approach (Kombinasi TOC & Pengujian Substantif)
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="a280-target-fase-b" className="block text-xs font-semibold text-slate-700 mb-1">
              Target Penyelesaian Fase B (Respon Risiko)
            </label>
            <input
              id="a280-target-fase-b"
              type="date"
              disabled={isReadOnly}
              value={a280.targetPenyelesaianFaseB}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_A280',
                  patch: { targetPenyelesaianFaseB: e.target.value },
                })
              }
              className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="a280-mat-summary" className="block text-xs font-semibold text-slate-700 mb-1">
            Ringkasan Pembaruan Materialitas & Lingkup Signifikan
          </label>
          <textarea
            id="a280-mat-summary"
            rows={2}
            disabled={isReadOnly}
            value={a280.ringkasanPerubahanMaterialitas}
            onChange={(e) =>
              dispatchAction({
                type: 'UPDATE_A280',
                patch: { ringkasanPerubahanMaterialitas: e.target.value },
              })
            }
            placeholder="Jelaskan keterkaitan benchmark materialitas (OM/PM/AMPT) dengan akun signifikan pada tahap penilaian risiko..."
            className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label htmlFor="a280-risk-summary" className="block text-xs font-semibold text-slate-700 mb-1">
            Ringkasan Area Risiko Tinggi & Fraud Risk
          </label>
          <textarea
            id="a280-risk-summary"
            data-testid="a280-risk-summary"
            rows={3}
            disabled={isReadOnly}
            value={a280.ringkasanAreaRisikoTinggi}
            onChange={(e) =>
              dispatchAction({
                type: 'UPDATE_A280',
                patch: { ringkasanAreaRisikoTinggi: e.target.value },
              })
            }
            placeholder={`Misal: Fokus pengujian rinci pada ${highRommAccounts.slice(0, 5).map((r) => r.leadCode).join(', ') || 'akun signifikan'} beserta prosedur antisipasi risiko kecurangan SA 240...`}
            className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label htmlFor="a280-alokasi" className="block text-xs font-semibold text-slate-700 mb-1">
            Alokasi Tim Lapangan & Penjadwalan Pengujian Substantif
          </label>
          <textarea
            id="a280-alokasi"
            rows={2}
            disabled={isReadOnly}
            value={a280.alokasiTimLapangan}
            onChange={(e) =>
              dispatchAction({
                type: 'UPDATE_A280',
                patch: { alokasiTimLapangan: e.target.value },
              })
            }
            placeholder="Pembagian Lead Schedule per anggota tim, rencana stock opname/konfirmasi bank & piutang, dan supervisi Ketua Tim/Manager..."
            className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
          />
        </div>
      </div>
    </div>
  );
};
