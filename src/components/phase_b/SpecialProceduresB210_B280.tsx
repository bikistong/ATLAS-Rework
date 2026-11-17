import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  FilePlus2,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  B210_CHECKLIST_ITEMS,
  B210_SIMPULAN_OPTIONS,
  B220_PROCEDURE_ITEMS,
  B220_SIMPULAN_OPTIONS,
  B230_SIMPULAN_OPTIONS,
  B240_SIMPULAN_OPTIONS,
  B250_REPRESENTATION_ITEMS,
  B250_SIMPULAN_OPTIONS,
  B260_B270_SIMPULAN_OPTIONS,
  B280_PROCEDURE_ITEMS,
  B280_SIMPULAN_OPTIONS,
} from '../../data/bCoreCatalog';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { canSignOffB240Prepared, canSignOffB250Prepared } from '../../utils/bCoreFormulas';
import { formatAuditNumber } from '../../utils/formatters';
import { ProposeJournalModal } from './JournalsAjeRje';

export type SpecialProcedureIndex =
  | 'B210'
  | 'B220'
  | 'B230'
  | 'B240'
  | 'B250'
  | 'B260'
  | 'B270'
  | 'B280';

const META: Record<SpecialProcedureIndex, { sa: string; title: string; subtitle: string }> = {
  B210: {
    sa: 'SA 540',
    title: 'B210 — Audit atas Estimasi Akuntansi & Nilai Wajar',
    subtitle: 'Evaluasi dasar asumsi, metode estimasi manajemen, dan deteksi potensi keberpihakan (management bias).',
  },
  B220: {
    sa: 'SA 550',
    title: 'B220 — Transaksi dengan Pihak Berelasi (Related Parties)',
    subtitle: 'Register pihak berelasi, uji prinsip kewajaran (arm’s length), dan kepatuhan pengungkapan CALK.',
  },
  B230: {
    sa: 'SA 560',
    title: 'B230 — Peristiwa Kemudian (Subsequent Events)',
    subtitle: 'Identifikasi peristiwa setelah tanggal neraca: Type 1 (Adjusting Entry) vs Type 2 (Disclosure Only).',
  },
  B240: {
    sa: 'SA 570',
    title: 'B240 — Kelangsungan Usaha (Going Concern)',
    subtitle: 'Penilaian indikator keuangan/operasional serta rencana mitigasi manajemen minimal 12 bulan ke depan.',
  },
  B250: {
    sa: 'SA 580',
    title: 'B250 — Surat Representasi Tertulis Manajemen',
    subtitle: 'Tanggal Surat Representasi wajib sama persis dengan Tanggal Laporan Auditor Independen (LAI).',
  },
  B260: {
    sa: 'SA 620',
    title: 'B260 — Penggunaan Pekerjaan Pakar Auditor',
    subtitle: 'Evaluasi kompetensi, kapabilitas, objektivitas, dan kecukupan hasil pekerjaan pakar eksternal auditor.',
  },
  B270: {
    sa: 'SA 500',
    title: 'B270 — Penggunaan Pekerjaan Pakar Manajemen',
    subtitle: 'Evaluasi keandalan, kualifikasi, asumsi, dan metode pakar yang ditunjuk oleh manajemen (misal aktuaris/penilai).',
  },
  B280: {
    sa: 'SA 501',
    title: 'B280 — Komitmen dan Kontinjensi',
    subtitle: 'Pengujian litigasi/klaim hukum, konfirmasi penasihat hukum, kontinjensi pajak, dan jaminan.',
  },
};

export const SpecialProceduresB210_B280: React.FC<{ kodeIndeks: SpecialProcedureIndex }> = ({
  kodeIndeks,
}) => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const [ajeModalOpen, setAjeModalOpen] = useState(false);

  // State form tambah pihak berelasi (B220)
  const [rpName, setRpName] = useState('');
  const [rpRel, setRpRel] = useState('');
  const [rpType, setRpType] = useState('Penjualan / Piutang Usaha');
  const [rpVal, setRpVal] = useState('');
  const [rpBal, setRpBal] = useState('');
  const [rpArm, setRpArm] = useState(true);
  const [rpCalk, setRpCalk] = useState(true);

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, kodeIndeks);
  const sp = activeEngagement.specialProcedures;
  const meta = META[kodeIndeks];
  const relatedJournalsCount = activeEngagement.journals.filter(
    (j) => j.referensiKkp.toUpperCase() === kodeIndeks
  ).length;

  const b250Gate = canSignOffB250Prepared(sp.b250, activeEngagement.header);
  const b240Gate = canSignOffB240Prepared(sp.b240);

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {meta.sa} · PROSEDUR AUDIT KHUSUS MODUL B
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">{meta.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{meta.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {relatedJournalsCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveIndex('B100')}
                className="h-8 px-2.5 rounded border border-sky-200 bg-sky-50 text-sky-800 text-[11px] font-semibold cursor-pointer"
              >
                {relatedJournalsCount} Jurnal Ref {kodeIndeks}
              </button>
            )}
            <button
              type="button"
              data-testid={`propose-aje-${kodeIndeks}`}
              disabled={isReadOnly}
              onClick={() => setAjeModalOpen(true)}
              className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              Propose AJE from Procedure
            </button>
          </div>
        </div>
      </div>

      {/* B210 — Estimasi Akuntansi (SA 540) */}
      {kodeIndeks === 'B210' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="b210-pos" className="block text-xs font-semibold text-slate-700 mb-1">
                Pos Estimasi Akuntansi Utama
              </label>
              <input
                id="b210-pos"
                type="text"
                disabled={isReadOnly}
                value={sp.b210.posEstimasi}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B210',
                    patch: { b210: { ...sp.b210, posEstimasi: e.target.value } },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="b210-metode" className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pengujian Auditor (SA 540)
              </label>
              <input
                id="b210-metode"
                type="text"
                disabled={isReadOnly}
                value={sp.b210.metodeEvaluasi}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B210',
                    patch: { b210: { ...sp.b210, metodeEvaluasi: e.target.value } },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={sp.b210.isAssumptionsRealistic}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B210',
                    patch: { b210: { ...sp.b210, isAssumptionsRealistic: e.target.checked } },
                  })
                }
                className="rounded border-slate-300"
              />
              <span>Asumsi signifikan manajemen realistis & konsisten</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-rose-700 font-medium">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={sp.b210.isManagementBiasDetected}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B210',
                    patch: { b210: { ...sp.b210, isManagementBiasDetected: e.target.checked } },
                  })
                }
                className="rounded border-slate-300"
              />
              <span>Terdeteksi indikasi keberpihakan manajemen (Management Bias)</span>
            </label>
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              7 Butir Ceklis Evaluasi Estimasi Akuntansi
            </div>
            {B210_CHECKLIST_ITEMS.map((label, idx) => (
              <label key={idx} className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={Boolean(sp.b210.checklist[idx])}
                  onChange={(e) => {
                    const next = [...sp.b210.checklist];
                    next[idx] = e.target.checked;
                    dispatchAction({
                      type: 'UPDATE_SPECIAL_PROCEDURE',
                      kodeIndeks: 'B210',
                      patch: { b210: { ...sp.b210, checklist: next } },
                    });
                  }}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-3">
            <div>
              <label htmlFor="b210-simpulan" className="block text-xs font-semibold text-slate-700 mb-1">
                Simpulan Audit Estimasi Akuntansi (B210)
              </label>
              <select
                id="b210-simpulan"
                disabled={isReadOnly}
                value={sp.b210.simpulan}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B210',
                    patch: {
                      b210: {
                        ...sp.b210,
                        simpulan: e.target.value as typeof sp.b210.simpulan,
                      },
                    },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
              >
                {B210_SIMPULAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="b210-catatan" className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Evaluasi & Perbandingan Point Estimate Auditor
              </label>
              <textarea
                id="b210-catatan"
                rows={3}
                disabled={isReadOnly}
                value={sp.b210.catatan}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B210',
                    patch: { b210: { ...sp.b210, catatan: e.target.value } },
                  })
                }
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* B220 — Pihak Berelasi (SA 550) */}
      {kodeIndeks === 'B220' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Register Pihak Berelasi & Pengujian Kewajaran Transaksi (SA 550)
            </h3>

            {!isReadOnly && (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 rounded border border-slate-200 bg-slate-50 items-end">
                <div className="md:col-span-2">
                  <label htmlFor="rp-name" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nama Pihak Berelasi
                  </label>
                  <input
                    id="rp-name"
                    type="text"
                    value={rpName}
                    onChange={(e) => setRpName(e.target.value)}
                    placeholder="PT Induk / Komisaris..."
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label htmlFor="rp-rel" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Sifat Hubungan
                  </label>
                  <input
                    id="rp-rel"
                    type="text"
                    value={rpRel}
                    onChange={(e) => setRpRel(e.target.value)}
                    placeholder="Pemegang Saham / Afiliasi"
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label htmlFor="rp-val" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nilai Transaksi (Rp)
                  </label>
                  <input
                    id="rp-val"
                    type="number"
                    value={rpVal}
                    onChange={(e) => setRpVal(e.target.value)}
                    placeholder="0"
                    className="w-full h-8 px-2 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label htmlFor="rp-bal" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Saldo Akhir (Rp)
                  </label>
                  <input
                    id="rp-bal"
                    type="number"
                    value={rpBal}
                    onChange={(e) => setRpBal(e.target.value)}
                    placeholder="0"
                    className="w-full h-8 px-2 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    disabled={!rpName.trim()}
                    onClick={() => {
                      const nextReg = {
                        id: `rp-${Date.now()}`,
                        namaPihakBerelasi: rpName.trim(),
                        sifatHubungan: rpRel.trim() || 'Afiliasi',
                        jenisTransaksi: rpType,
                        nilaiTransaksi: Number(rpVal) || 0,
                        saldoAkhir: Number(rpBal) || 0,
                        isArmLength: rpArm,
                        isDisclosedInCalk: rpCalk,
                      };
                      dispatchAction({
                        type: 'UPDATE_SPECIAL_PROCEDURE',
                        kodeIndeks: 'B220',
                        patch: { b220: { ...sp.b220, registers: [...sp.b220.registers, nextReg] } },
                      });
                      setRpName('');
                      setRpRel('');
                      setRpVal('');
                      setRpBal('');
                    }}
                    className="w-full h-8 px-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>
                <div className="md:col-span-3">
                  <label htmlFor="rp-type" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jenis Transaksi
                  </label>
                  <input
                    id="rp-type"
                    type="text"
                    value={rpType}
                    onChange={(e) => setRpType(e.target.value)}
                    className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
                <div className="md:col-span-3 flex items-center gap-4 text-xs">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rpArm}
                      onChange={(e) => setRpArm(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <span>Wajar (Arm's Length)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rpCalk}
                      onChange={(e) => setRpCalk(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <span>Diungkapkan di CALK</span>
                  </label>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
                    <th className="py-2 px-2 text-left font-semibold">Pihak Berelasi</th>
                    <th className="py-2 px-2 text-left font-semibold">Hubungan</th>
                    <th className="py-2 px-2 text-left font-semibold">Jenis Transaksi</th>
                    <th className="py-2 px-2 text-right font-semibold">Nilai Transaksi</th>
                    <th className="py-2 px-2 text-right font-semibold">Saldo Akhir</th>
                    <th className="py-2 px-2 text-center font-semibold">Arm's Length</th>
                    <th className="py-2 px-2 text-center font-semibold">CALK</th>
                    <th className="py-2 px-2 text-center font-semibold">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sp.b220.registers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-500">
                        Belum ada pihak berelasi tercatat. Tambahkan entri di atas bila teridentifikasi.
                      </td>
                    </tr>
                  ) : (
                    sp.b220.registers.map((r) => (
                      <tr key={r.id}>
                        <td className="py-1.5 px-2 font-medium text-slate-900">{r.namaPihakBerelasi}</td>
                        <td className="py-1.5 px-2 text-slate-700">{r.sifatHubungan}</td>
                        <td className="py-1.5 px-2 text-slate-700">{r.jenisTransaksi}</td>
                        <td className="py-1.5 px-2 text-right font-mono tabular-nums">{formatAuditNumber(r.nilaiTransaksi)}</td>
                        <td className="py-1.5 px-2 text-right font-mono tabular-nums">{formatAuditNumber(r.saldoAkhir)}</td>
                        <td className="py-1.5 px-2 text-center">{r.isArmLength ? 'Ya' : 'Tidak'}</td>
                        <td className="py-1.5 px-2 text-center">{r.isDisclosedInCalk ? 'Ya' : 'Tidak'}</td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            disabled={isReadOnly}
                            aria-label={`Hapus ${r.namaPihakBerelasi}`}
                            onClick={() =>
                              dispatchAction({
                                type: 'UPDATE_SPECIAL_PROCEDURE',
                                kodeIndeks: 'B220',
                                patch: {
                                  b220: {
                                    ...sp.b220,
                                    registers: sp.b220.registers.filter((item) => item.id !== r.id),
                                  },
                                },
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              6 Prosedur Pengujian Pihak Berelasi (SA 550)
            </div>
            {B220_PROCEDURE_ITEMS.map((txt, idx) => {
              const checks = sp.b220.prosedurChecklist ?? B220_PROCEDURE_ITEMS.map(() => true);
              return (
                <label key={idx} className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(checks[idx])}
                    onChange={(e) => {
                      const next = [...checks];
                      next[idx] = e.target.checked;
                      dispatchAction({
                        type: 'UPDATE_SPECIAL_PROCEDURE',
                        kodeIndeks: 'B220',
                        patch: { b220: { ...sp.b220, prosedurChecklist: next } },
                      });
                    }}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span>{txt}</span>
                </label>
              );
            })}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label htmlFor="b220-simpulan" className="block text-xs font-semibold text-slate-700">
                Simpulan Pihak Berelasi (B220)
              </label>
              <select
                id="b220-simpulan"
                disabled={isReadOnly}
                value={sp.b220.simpulan}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B220',
                    patch: { b220: { ...sp.b220, simpulan: e.target.value as typeof sp.b220.simpulan } },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
              >
                {B220_SIMPULAN_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <textarea
                rows={2}
                disabled={isReadOnly}
                value={sp.b220.catatan}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B220',
                    patch: { b220: { ...sp.b220, catatan: e.target.value } },
                  })
                }
                placeholder="Catatan prosedur konfirmasi dan kewajaran transaksi..."
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* B230 — Peristiwa Kemudian (SA 560) */}
      {kodeIndeks === 'B230' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="b230-tgl" className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Terakhir Pencarian Peristiwa Kemudian (Cut-off)
              </label>
              <input
                id="b230-tgl"
                type="date"
                disabled={isReadOnly}
                value={sp.b230.tanggalPencarian}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B230',
                    patch: { b230: { ...sp.b230, tanggalPencarian: e.target.value } },
                  })
                }
                className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded"
              />
            </div>
            <div>
              <label htmlFor="b230-tipe" className="block text-xs font-semibold text-slate-700 mb-1">
                Klasifikasi Peristiwa Kemudian (PSAK 8 / SA 560)
              </label>
              <select
                id="b230-tipe"
                disabled={isReadOnly}
                value={sp.b230.tipePeristiwa}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B230',
                    patch: {
                      b230: {
                        ...sp.b230,
                        tipePeristiwa: e.target.value as typeof sp.b230.tipePeristiwa,
                      },
                    },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
              >
                <option value="None">None — Tidak ada peristiwa material setelah tanggal neraca</option>
                <option value="Type 1 - Adjusting">Type 1 - Adjusting (Menyesuaikan angka LK via AJE)</option>
                <option value="Type 2 - Disclosure Only">Type 2 - Disclosure Only (Pengungkapan CALK saja)</option>
              </select>
            </div>
          </div>

          {sp.b230.tipePeristiwa === 'Type 1 - Adjusting' && (
            <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-2">
              <span>
                Peristiwa <strong>Type 1 - Adjusting</strong> memerlukan pencatatan jurnal penyesuaian (AJE).
              </span>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => setAjeModalOpen(true)}
                className="h-7 px-2.5 rounded bg-amber-700 text-white text-[11px] font-medium cursor-pointer shrink-0"
              >
                Buat AJE Penyesuai
              </button>
            </div>
          )}

          <div>
            <label htmlFor="b230-uraian" className="block text-xs font-semibold text-slate-700 mb-1">
              Uraian Peristiwa Setelah Tanggal Pelaporan
            </label>
            <textarea
              id="b230-uraian"
              rows={3}
              disabled={isReadOnly}
              value={sp.b230.uraianPeristiwa}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_SPECIAL_PROCEDURE',
                  kodeIndeks: 'B230',
                  patch: { b230: { ...sp.b230, uraianPeristiwa: e.target.value } },
                })
              }
              placeholder="Dokumentasikan hasil review rekening koran Januari-Maret, risalah rapat, dan pengiriman/pembayaran pasca tanggal neraca..."
              className="w-full p-2 text-xs bg-white border border-slate-300 rounded"
            />
          </div>

          <div>
            <label htmlFor="b230-tindakan" className="block text-xs font-semibold text-slate-700 mb-1">
              Tindakan Audit & Dampak Pengungkapan CALK
            </label>
            <textarea
              id="b230-tindakan"
              rows={2}
              disabled={isReadOnly}
              value={sp.b230.tindakanAudit}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_SPECIAL_PROCEDURE',
                  kodeIndeks: 'B230',
                  patch: { b230: { ...sp.b230, tindakanAudit: e.target.value } },
                })
              }
              className="w-full p-2 text-xs bg-white border border-slate-300 rounded"
            />
          </div>

          <div>
            <label htmlFor="b230-simpulan" className="block text-xs font-semibold text-slate-700 mb-1">
              Simpulan Evaluasi Peristiwa Kemudian (B230)
            </label>
            <select
              id="b230-simpulan"
              disabled={isReadOnly}
              value={sp.b230.simpulan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_SPECIAL_PROCEDURE',
                  kodeIndeks: 'B230',
                  patch: { b230: { ...sp.b230, simpulan: e.target.value as typeof sp.b230.simpulan } },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
            >
              {B230_SIMPULAN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* B240 — Going Concern (SA 570) */}
      {kodeIndeks === 'B240' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
          {!b240Gate.allowed && (
            <div className="p-3 rounded bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{b240Gate.reason}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={sp.b240.indikatorKeuanganBuruk}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B240',
                    patch: { b240: { ...sp.b240, indikatorKeuanganBuruk: e.target.checked } },
                  })
                }
                className="rounded border-slate-300"
              />
              <span>Terdapat Indikator Keuangan Memburuk</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={sp.b240.indikatorOperasionalBuruk}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B240',
                    patch: { b240: { ...sp.b240, indikatorOperasionalBuruk: e.target.checked } },
                  })
                }
                className="rounded border-slate-300"
              />
              <span>Terdapat Indikator Operasional / Hukum</span>
            </label>
            <div>
              <label htmlFor="b240-bulan" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Periode Penilaian Proyeksi (Min 12 Bulan)
              </label>
              <input
                id="b240-bulan"
                type="number"
                min={12}
                disabled={isReadOnly}
                value={sp.b240.periodeProyeksiBulan}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B240',
                    patch: {
                      b240: {
                        ...sp.b240,
                        periodeProyeksiBulan: Math.max(12, Number(e.target.value) || 12),
                      },
                    },
                  })
                }
                className="w-full h-8 px-2 text-xs font-mono bg-white border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label htmlFor="b240-rencana" className="block text-xs font-semibold text-slate-700 mb-1">
              Evaluasi Rencana Mitigasi Manajemen & Proyeksi Arus Kas (Wajib ≥ 20 char bila ada keraguan)
            </label>
            <textarea
              id="b240-rencana"
              rows={3}
              disabled={isReadOnly}
              value={sp.b240.evaluasiRencanaManajemen}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_SPECIAL_PROCEDURE',
                  kodeIndeks: 'B240',
                  patch: { b240: { ...sp.b240, evaluasiRencanaManajemen: e.target.value } },
                })
              }
              placeholder="Evaluasi kecukupan modal kerja, restrukturisasi pinjaman, dukungan pemegang saham, dan rencana operasional 12 bulan..."
              className="w-full p-2 text-xs bg-white border border-slate-300 rounded"
            />
          </div>

          <div>
            <label htmlFor="b240-simpulan" className="block text-xs font-semibold text-slate-700 mb-1">
              Simpulan Evaluasi Kelangsungan Usaha (B240)
            </label>
            <select
              id="b240-simpulan"
              disabled={isReadOnly}
              value={sp.b240.simpulan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_SPECIAL_PROCEDURE',
                  kodeIndeks: 'B240',
                  patch: { b240: { ...sp.b240, simpulan: e.target.value as typeof sp.b240.simpulan } },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
            >
              {B240_SIMPULAN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* B250 — Representasi Manajemen (SA 580) */}
      {kodeIndeks === 'B250' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
          <div
            data-testid="b250-sa580-banner"
            className={`p-3 rounded border text-xs flex items-start gap-2 ${
              b250Gate.allowed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800 font-medium'
            }`}
          >
            {b250Gate.allowed ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              {b250Gate.allowed
                ? `Validasi SA 580 Terpenuhi: Tanggal Surat Representasi (${sp.b250.tanggalSuratRepresentasi}) sama persis dengan Tanggal Laporan Auditor Independen (${activeEngagement.header.tanggalLaporanAuditor}).`
                : b250Gate.reason}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="b250-tgl" className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Surat Representasi Manajemen
              </label>
              <input
                id="b250-tgl"
                type="date"
                disabled={isReadOnly}
                value={sp.b250.tanggalSuratRepresentasi}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B250',
                    patch: { b250: { ...sp.b250, tanggalSuratRepresentasi: e.target.value } },
                  })
                }
                className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Target Tanggal LAI Header: <strong>{activeEngagement.header.tanggalLaporanAuditor}</strong>
              </div>
            </div>
            <div>
              <label htmlFor="b250-ceo" className="block text-xs font-semibold text-slate-700 mb-1">
                Penandatangan (Direktur Utama / CEO)
              </label>
              <input
                id="b250-ceo"
                type="text"
                disabled={isReadOnly}
                value={sp.b250.namaPenandatanganCeo}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B250',
                    patch: { b250: { ...sp.b250, namaPenandatanganCeo: e.target.value } },
                  })
                }
                placeholder="Nama lengkap Direktur Utama"
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
              />
            </div>
            <div>
              <label htmlFor="b250-cfo" className="block text-xs font-semibold text-slate-700 mb-1">
                Penandatangan (Direktur Keuangan / CFO)
              </label>
              <input
                id="b250-cfo"
                type="text"
                disabled={isReadOnly}
                value={sp.b250.namaPenandatanganCfo}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B250',
                    patch: { b250: { ...sp.b250, namaPenandatanganCfo: e.target.value } },
                  })
                }
                placeholder="Nama lengkap Direktur Keuangan"
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Pernyataan Wajib dalam Surat Representasi Tertulis (SA 580)
            </div>
            {B250_REPRESENTATION_ITEMS.map((txt, idx) => {
              const items = sp.b250.checklist ?? B250_REPRESENTATION_ITEMS.map(() => 'YA' as const);
              return (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs border-b border-slate-100 pb-1.5">
                  <span className="text-slate-800">{txt}</span>
                  <select
                    aria-label={`Butir SA 580 #${idx + 1}`}
                    disabled={isReadOnly}
                    value={items[idx] ?? 'YA'}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = e.target.value as 'YA' | 'TIDAK';
                      dispatchAction({
                        type: 'UPDATE_SPECIAL_PROCEDURE',
                        kodeIndeks: 'B250',
                        patch: { b250: { ...sp.b250, checklist: next } },
                      });
                    }}
                    className="h-7 px-2 text-xs font-mono bg-white border border-slate-300 rounded shrink-0"
                  >
                    <option value="YA">YA</option>
                    <option value="TIDAK">TIDAK</option>
                  </select>
                </div>
              );
            })}
          </div>

          <div>
            <label htmlFor="b250-simpulan" className="block text-xs font-semibold text-slate-700 mb-1">
              Simpulan Surat Representasi Manajemen (B250)
            </label>
            <select
              id="b250-simpulan"
              disabled={isReadOnly}
              value={sp.b250.simpulan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_SPECIAL_PROCEDURE',
                  kodeIndeks: 'B250',
                  patch: { b250: { ...sp.b250, simpulan: e.target.value as typeof sp.b250.simpulan } },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
            >
              {B250_SIMPULAN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* B260 — Pakar Auditor (SA 620) */}
      {kodeIndeks === 'B260' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={sp.b260.isUsed}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B260',
                    patch: {
                      b260: {
                        ...sp.b260,
                        isUsed: e.target.checked,
                        simpulan: e.target.checked ? 'MEMADAI' : 'TIDAK RELEVAN',
                      },
                    },
                  })
                }
                className="rounded border-slate-300"
              />
              <span>Auditor menggunakan Pekerjaan Pakar Auditor (SA 620) pada perikatan ini</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="b260-nama" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pakar / Kantor Penilai
              </label>
              <input
                id="b260-nama"
                type="text"
                disabled={isReadOnly || !sp.b260.isUsed}
                value={sp.b260.namaPakar}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B260',
                    patch: { b260: { ...sp.b260, namaPakar: e.target.value } },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
            <div>
              <label htmlFor="b260-bidang" className="block text-xs font-semibold text-slate-700 mb-1">
                Bidang Keahlian (Penilai Properti / Aktuaris / TI / Pajak)
              </label>
              <input
                id="b260-bidang"
                type="text"
                disabled={isReadOnly || !sp.b260.isUsed}
                value={sp.b260.bidangKeahlian}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B260',
                    patch: { b260: { ...sp.b260, bidangKeahlian: e.target.value } },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="b260-kual" className="block text-xs font-semibold text-slate-700 mb-1">
                Evaluasi Kualifikasi & Sertifikasi
              </label>
              <textarea
                id="b260-kual"
                rows={2}
                disabled={isReadOnly || !sp.b260.isUsed}
                value={sp.b260.kualifikasiKompetensi}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B260',
                    patch: { b260: { ...sp.b260, kualifikasiKompetensi: e.target.value } },
                  })
                }
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
            <div>
              <label htmlFor="b260-obj" className="block text-xs font-semibold text-slate-700 mb-1">
                Evaluasi Independensi & Objektivitas
              </label>
              <textarea
                id="b260-obj"
                rows={2}
                disabled={isReadOnly || !sp.b260.isUsed}
                value={sp.b260.evaluasiObjektivitas}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B260',
                    patch: { b260: { ...sp.b260, evaluasiObjektivitas: e.target.value } },
                  })
                }
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
            <div>
              <label htmlFor="b260-hasil" className="block text-xs font-semibold text-slate-700 mb-1">
                Kecukupan Hasil Pekerjaan Pakar
              </label>
              <textarea
                id="b260-hasil"
                rows={2}
                disabled={isReadOnly || !sp.b260.isUsed}
                value={sp.b260.evaluasiHasilPekerjaan}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B260',
                    patch: { b260: { ...sp.b260, evaluasiHasilPekerjaan: e.target.value } },
                  })
                }
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="b260-simpulan" className="block text-xs font-semibold text-slate-700 mb-1">
              Simpulan Pekerjaan Pakar Auditor (B260)
            </label>
            <select
              id="b260-simpulan"
              disabled={isReadOnly}
              value={sp.b260.simpulan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_SPECIAL_PROCEDURE',
                  kodeIndeks: 'B260',
                  patch: { b260: { ...sp.b260, simpulan: e.target.value as typeof sp.b260.simpulan } },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
            >
              {B260_B270_SIMPULAN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* B270 — Pakar Manajemen (SA 500) */}
      {kodeIndeks === 'B270' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={sp.b270.isUsed}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B270',
                    patch: {
                      b270: {
                        ...sp.b270,
                        isUsed: e.target.checked,
                        simpulan: e.target.checked ? 'MEMADAI' : 'TIDAK RELEVAN',
                      },
                    },
                  })
                }
                className="rounded border-slate-300"
              />
              <span>Manajemen menggunakan Pekerjaan Pakar Manajemen (KJPP / Aktuaris PSAK 24)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="b270-nama" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pakar Manajemen
              </label>
              <input
                id="b270-nama"
                type="text"
                disabled={isReadOnly || !sp.b270.isUsed}
                value={sp.b270.namaPakar}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B270',
                    patch: { b270: { ...sp.b270, namaPakar: e.target.value } },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
            <div>
              <label htmlFor="b270-bidang" className="block text-xs font-semibold text-slate-700 mb-1">
                Bidang Keahlian / Nomor Laporan
              </label>
              <input
                id="b270-bidang"
                type="text"
                disabled={isReadOnly || !sp.b270.isUsed}
                value={sp.b270.bidangKeahlian}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B270',
                    patch: { b270: { ...sp.b270, bidangKeahlian: e.target.value } },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="b270-kual" className="block text-xs font-semibold text-slate-700 mb-1">
                Evaluasi Kualifikasi & Objektivitas Pakar Manajemen
              </label>
              <textarea
                id="b270-kual"
                rows={2}
                disabled={isReadOnly || !sp.b270.isUsed}
                value={sp.b270.kualifikasiKompetensi}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B270',
                    patch: { b270: { ...sp.b270, kualifikasiKompetensi: e.target.value } },
                  })
                }
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
            <div>
              <label htmlFor="b270-asumsi" className="block text-xs font-semibold text-slate-700 mb-1">
                Evaluasi Asumsi, Data Sumber & Metode (SA 500.8)
              </label>
              <textarea
                id="b270-asumsi"
                rows={2}
                disabled={isReadOnly || !sp.b270.isUsed}
                value={sp.b270.evaluasiAsumsiMetode}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_SPECIAL_PROCEDURE',
                    kodeIndeks: 'B270',
                    patch: { b270: { ...sp.b270, evaluasiAsumsiMetode: e.target.value } },
                  })
                }
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="b270-simpulan" className="block text-xs font-semibold text-slate-700 mb-1">
              Simpulan Pekerjaan Pakar Manajemen (B270)
            </label>
            <select
              id="b270-simpulan"
              disabled={isReadOnly}
              value={sp.b270.simpulan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_SPECIAL_PROCEDURE',
                  kodeIndeks: 'B270',
                  patch: { b270: { ...sp.b270, simpulan: e.target.value as typeof sp.b270.simpulan } },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
            >
              {B260_B270_SIMPULAN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* B280 — Komitmen & Kontinjensi (SA 501) */}
      {kodeIndeks === 'B280' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
          <div className="space-y-2">
            {B280_PROCEDURE_ITEMS.map((item) => (
              <div key={item.key} className="p-2.5 rounded border border-slate-200 bg-slate-50/50">
                <label className="flex items-start gap-2 text-xs font-semibold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={sp.b280[item.key]}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_SPECIAL_PROCEDURE',
                        kodeIndeks: 'B280',
                        patch: {
                          b280: { ...sp.b280, [item.key]: e.target.checked },
                        },
                      })
                    }
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <div>
                    <div>{item.label}</div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">{item.saNote}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="b280-simpulan" className="block text-xs font-semibold text-slate-700 mb-1">
              Simpulan Evaluasi Komitmen & Kontinjensi (B280)
            </label>
            <select
              id="b280-simpulan"
              disabled={isReadOnly}
              value={sp.b280.simpulan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_SPECIAL_PROCEDURE',
                  kodeIndeks: 'B280',
                  patch: { b280: { ...sp.b280, simpulan: e.target.value as typeof sp.b280.simpulan } },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
            >
              {B280_SIMPULAN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="b280-catatan" className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan & Ringkasan Balasan Konfirmasi Penasihat Hukum / Komitmen Sewa
            </label>
            <textarea
              id="b280-catatan"
              rows={3}
              disabled={isReadOnly}
              value={sp.b280.catatan}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_SPECIAL_PROCEDURE',
                  kodeIndeks: 'B280',
                  patch: { b280: { ...sp.b280, catatan: e.target.value } },
                })
              }
              className="w-full p-2 text-xs bg-white border border-slate-300 rounded"
            />
          </div>
        </div>
      )}

      {/* Modal Propose AJE from Procedure */}
      <ProposeJournalModal
        open={ajeModalOpen}
        referensiKkp={kodeIndeks}
        defaultKeterangan={`Penyesuaian audit berdasarkan temuan prosedur khusus ${kodeIndeks} (${meta.sa}): `}
        onClose={() => setAjeModalOpen(false)}
      />
    </div>
  );
};
