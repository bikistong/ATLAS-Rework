import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { BinaryRisk, EngagementType, PriorReportingCondition, YesNoUpper } from '../../types/atlas';
import { canSignOffA110Prepared } from '../../utils/a1Formulas';
import {
  getSectorDisplayLabel,
  isIndexVisibleForWorkspace,
  PRIOR_REPORTING_CONDITIONS,
} from '../../utils/formatters';

const RiskBadge: React.FC<{ risk: BinaryRisk | 'N/A' }> = ({ risk }) => {
  if (risk === 'N/A') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-300">
        N/A
      </span>
    );
  }
  if (risk === 'High') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        High Risk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      Low Risk
    </span>
  );
};

export const A110Dashboard: React.FC = () => {
  const { activeEngagement, activeClient, dispatchAction, setActiveIndex } = useAtlas();

  if (!activeEngagement || !activeClient) {
    return (
      <div className="p-6 text-xs text-slate-500 bg-white border border-slate-200 rounded">
        Belum ada perikatan aktif. Pilih atau buat perikatan melalui Engagement Hub.
      </div>
    );
  }

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A110');
  const { a110, header } = activeEngagement;
  const gateCheck = canSignOffA110Prepared(a110);
  const showA1105Link = isIndexVisibleForWorkspace('A1105', activeEngagement, activeClient.statusKepemilikan);
  const showA170Link = isIndexVisibleForWorkspace('A170', activeEngagement, activeClient.statusKepemilikan);
  const mitigationLen = a110.mitigasiRisiko.trim().length;
  const requiresMitigation =
    a110.ringkasanRisikoGabungan === 'High' && a110.keputusanPenerimaan === 'YA';

  const criteriaRows: {
    no: number;
    label: string;
    detail: string;
    risk: BinaryRisk | 'N/A';
    targetIndex?: string;
    targetLabel?: string;
  }[] = [
    {
      no: 1,
      label: 'Jenis Usaha & Sektor Industri Klien',
      detail: getSectorDisplayLabel(activeClient.sektorIndustri),
      risk: a110.risikoJenisUsaha,
      targetIndex: 'HUB',
      targetLabel: 'Master Klien',
    },
    {
      no: 2,
      label: 'Status Kepemilikan Entitas',
      detail: activeClient.statusKepemilikan,
      risk: a110.risikoKepemilikan,
      targetIndex: 'HUB',
      targetLabel: 'Master Klien',
    },
    {
      no: 3,
      label: 'Kerangka Standar Akuntansi Keuangan (SAK)',
      detail: activeClient.sakDigunakan,
      risk: a110.risikoSak,
      targetIndex: 'HUB',
      targetLabel: 'Master Klien',
    },
    {
      no: 4,
      label: 'Isu Pelaporan Keuangan Terdahulu (SA 510 / Kelangsungan Usaha)',
      detail: `Simpulan kuesioner A1101 (${a110.risikoIsuTerdahulu})`,
      risk: a110.risikoIsuTerdahulu,
      targetIndex: 'A1101',
      targetLabel: 'Buka A1101',
    },
    {
      no: 5,
      label: 'Integritas Manajemen & Risiko TPPU / AML (PMK 55/155)',
      detail: `Simpulan A1102 + A1102.1 (TPPU: ${activeEngagement.a1102.q6IndikasiTppu})`,
      risk: a110.risikoIntegritas,
      targetIndex: 'A1102',
      targetLabel: 'Buka A1102',
    },
    {
      no: 6,
      label: 'Kompetensi, Ketersediaan Waktu & Independensi Tim',
      detail: `${activeEngagement.teamMembers.length} personel ditugaskan pada A1103A/B`,
      risk: a110.risikoKompetensiIndependensi,
      targetIndex: 'A1103',
      targetLabel: 'Buka A1103',
    },
    {
      no: 7,
      label: 'Komunikasi dengan Auditor Pendahulu (SA 300 / SA 510)',
      detail: showA1105Link
        ? `Aktif (Perikatan Tahun Pertama — Laporan Terdahulu Diaudit)`
        : 'Tidak berlaku untuk tipe perikatan/kondisi pelaporan saat ini',
      risk: a110.risikoAuditorPendahulu,
      targetIndex: showA1105Link ? 'A1105' : undefined,
      targetLabel: showA1105Link ? 'Buka A1105' : undefined,
    },
  ];

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header Parameter Perikatan & Simpulan Utama */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 210 · SA 220 · SPM 1 · PRA-PERIKATAN
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              Dasbor Analisis Penerimaan & Keberlanjutan Hubungan dengan Klien (A110)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menggabungkan seluruh evaluasi sub-indeks A1101, A1102, A1102.1, A1103, dan A1105 menjadi kesimpulan penerimaan perikatan.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Ringkasan Risiko Gabungan
              </div>
              <div className="mt-0.5" data-testid="a110-combined-risk">
                <RiskBadge risk={a110.ringkasanRisikoGabungan} />
              </div>
            </div>
          </div>
        </div>

        {/* Kontrol Tipe Perikatan & Kondisi Periode Lalu (memicu visibilitas A1105 & A170) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
          <div>
            <label
              htmlFor="a110-tipe-perikatan"
              className="block text-[11px] font-semibold text-slate-700 mb-1"
            >
              Tipe Perikatan Audit
            </label>
            <select
              id="a110-tipe-perikatan"
              data-testid="a110-tipe-perikatan"
              disabled={isReadOnly}
              value={header.tipePerikatan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_ENGAGEMENT_HEADER',
                  patch: { tipePerikatan: e.target.value as EngagementType },
                  sourceIndeks: 'A110',
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="Perikatan Tahun Pertama">Perikatan Tahun Pertama</option>
              <option value="Perikatan Berulang">Perikatan Berulang</option>
            </select>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span>Status KKP Kondisional:</span>
              <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                A1105: {showA1105Link ? 'Tampil' : 'Tersembunyi'}
              </span>
              <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                A170: {showA170Link ? 'Tampil' : 'Tersembunyi'}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="a110-kriteria-isu"
              className="block text-[11px] font-semibold text-slate-700 mb-1"
            >
              Kondisi Pelaporan Keuangan Periode Lalu (A110.I25)
            </label>
            <select
              id="a110-kriteria-isu"
              data-testid="a110-kriteria-isu"
              disabled={isReadOnly}
              value={a110.kriteriaIsuTerdahulu}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_A110',
                  patch: { kriteriaIsuTerdahulu: e.target.value as PriorReportingCondition },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {PRIOR_REPORTING_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
            {showA170Link && (
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => setActiveIndex('A170')}
                  className="text-[11px] text-indigo-700 hover:text-indigo-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  Lanjutkan ke Pemeriksaan Saldo Awal (A170) <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Matriks 7 Kriteria Risiko Penerimaan */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Matriks Evaluasi 7 Faktor Risiko Penerimaan / Keberlanjutan
          </h3>
          <span className="text-[11px] text-slate-500">
            Aturan Gabungan: Jika ≥ 1 faktor berisiko High → Gabungan High
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="py-2 px-3 text-left font-semibold w-10">No</th>
                <th className="py-2 px-3 text-left font-semibold">Faktor Evaluasi</th>
                <th className="py-2 px-3 text-left font-semibold">Ringkasan Kondisi</th>
                <th className="py-2 px-3 text-center font-semibold w-28">Tingkat Risiko</th>
                <th className="py-2 px-3 text-right font-semibold w-32">Sumber KKP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {criteriaRows.map((row) => (
                <tr key={row.no} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono text-slate-500">{row.no}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{row.label}</td>
                  <td className="py-2 px-3 text-slate-600">{row.detail}</td>
                  <td className="py-2 px-3 text-center">
                    <RiskBadge risk={row.risk} />
                  </td>
                  <td className="py-2 px-3 text-right">
                    {row.targetIndex ? (
                      <button
                        type="button"
                        onClick={() => setActiveIndex(row.targetIndex!)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-medium text-slate-700 cursor-pointer"
                      >
                        {row.targetLabel}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Keputusan Akhir & Gerbang Mitigasi Risiko */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Keputusan Penerimaan / Keberlanjutan & Safeguards
          </h3>
          {!gateCheck.allowed ? (
            <span
              data-testid="a110-gate-warning"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              Sign-Off Prepared Diblokir (Mitigasi &lt; 50 karakter)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Siap untuk Sign-Off Prepared
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div>
            <label
              htmlFor="a110-keputusan"
              className="block text-[11px] font-semibold text-slate-700 mb-1"
            >
              Keputusan Penerimaan Perikatan
            </label>
            <select
              id="a110-keputusan"
              data-testid="a110-keputusan"
              disabled={isReadOnly}
              value={a110.keputusanPenerimaan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_A110',
                  patch: { keputusanPenerimaan: e.target.value as YesNoUpper },
                })
              }
              className="w-full h-8 px-2.5 text-xs font-semibold bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="YA">YA — Terima / Lanjutkan Perikatan</option>
              <option value="TIDAK">TIDAK — Tolak / Hentikan Perikatan</option>
            </select>

            {requiresMitigation && (
              <div className="mt-2 p-2.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-700 mt-0.5" />
                <span>
                  Risiko gabungan <strong>High</strong> dengan keputusan <strong>YA</strong>. Wajib mendokumentasikan safeguard/mitigasi risiko minimal 50 karakter sebelum Mark Prepared.
                </span>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="a110-mitigasi"
                className="block text-[11px] font-semibold text-slate-700"
              >
                Pertimbangan Auditor & Rencana Mitigasi Risiko (Safeguards)
              </label>
              <span
                data-testid="a110-mitigasi-counter"
                className={`text-[11px] font-mono tabular-nums ${
                  requiresMitigation && mitigationLen < 50
                    ? 'text-rose-700 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {mitigationLen} / 50 min karakter
              </span>
            </div>
            <textarea
              id="a110-mitigasi"
              data-testid="a110-mitigasi"
              disabled={isReadOnly}
              rows={4}
              value={a110.mitigasiRisiko}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_A110',
                  patch: { mitigasiRisiko: e.target.value },
                })
              }
              placeholder="Jelaskan langkah mitigasi risiko (penunjukan EQCR, perluasan sampel substantif, penugasan manajer senior, komunikasi TCWG, dll)..."
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
