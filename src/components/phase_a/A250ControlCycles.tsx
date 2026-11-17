import React, { useState } from 'react';
import { CheckCircle2, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import {
  A250_FREKUENSI_OPTIONS,
  A250_TIPE_AKTIVITAS_OPTIONS,
} from '../../data/a2Catalog';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { A250ControlCycle, A250ControlTestItem, RiskLevel } from '../../types/atlas';

export const A250ControlCycles: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const [selectedCycleCode, setSelectedCycleCode] =
    useState<A250ControlCycle['kodeSiklus']>('A250.2');

  const [sopDraft, setSopDraft] = useState('');
  const [frekuensi, setFrekuensi] =
    useState<A250ControlTestItem['frekuensi']>('Setiap Transaksi');
  const [wcgw, setWcgw] = useState('');
  const [tipeAktivitas, setTipeAktivitas] =
    useState<A250ControlTestItem['tipeAktivitas']>('Otorisasi');
  const [desainSesuai, setDesainSesuai] =
    useState<A250ControlTestItem['desainSesuai']>('Sesuai');
  const [hasilToc, setHasilToc] =
    useState<A250ControlTestItem['hasilToc']>('Efektif');
  const [dampakAsersi, setDampakAsersi] = useState<Record<'C' | 'E' | 'A&C' | 'V', boolean>>({
    C: true,
    E: true,
    'A&C': true,
    V: true,
  });
  const [catatan, setCatatan] = useState('');

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A250');
  const cycles = activeEngagement.a250Cycles;
  const activeCycle =
    cycles.find((c) => c.kodeSiklus === selectedCycleCode) ?? cycles[0];

  const badgeClass = (cr: RiskLevel) => {
    if (cr === 'Low') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (cr === 'High') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle || !sopDraft.trim()) return;
    const nextItem: A250ControlTestItem = {
      id: `a250-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nomorUrut: activeCycle.items.length + 1,
      uraianProsedurSop: sopDraft.trim(),
      frekuensi,
      wcgwRisiko: wcgw.trim() || 'Salah saji akibat tidak adanya kontrol memadai.',
      tipeAktivitas,
      desainSesuai,
      hasilToc,
      dampakAsersi: { ...dampakAsersi },
      catatanPengujian: catatan.trim(),
    };
    dispatchAction({
      type: 'UPSERT_A250_ITEM',
      kodeSiklus: activeCycle.kodeSiklus,
      item: nextItem,
    });
    setSopDraft('');
    setWcgw('');
    setCatatan('');
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 315 & SA 330 · EVALUASI DESAIN & EFEKTIVITAS PENGENDALIAN INTERNAL (13 SIKLUS)
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A250 — Penilaian Control Risk (CR) & Walk-Through Siklus Transaksi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hasil TOC per siklus otomatis menentukan tingkat Control Risk (Low/Moderate/High) yang mengalir langsung ke matriks RoMM A270.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex('A270')}
            className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            Lihat Dampak di A270
          </button>
        </div>

        {/* Grid 13 Siklus Pengendalian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
          {cycles.map((cycle) => {
            const selected = cycle.kodeSiklus === activeCycle?.kodeSiklus;
            return (
              <button
                key={cycle.kodeSiklus}
                type="button"
                data-testid={`a250-cycle-${cycle.kodeSiklus}`}
                onClick={() => setSelectedCycleCode(cycle.kodeSiklus)}
                className={`text-left p-2.5 rounded border transition-colors cursor-pointer ${
                  selected
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[11px] font-bold">{cycle.kodeSiklus}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                      selected
                        ? 'bg-white/15 text-white border-white/25'
                        : badgeClass(cycle.controlRiskLevel)
                    }`}
                  >
                    CR: {cycle.controlRiskLevel}
                  </span>
                </div>
                <div className="text-[11px] font-medium mt-1 line-clamp-2 leading-snug">
                  {cycle.namaSiklus}
                </div>
                <div
                  className={`text-[10px] mt-1 font-mono ${
                    selected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {cycle.items.length} SOP / Walk-Through
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workbench Siklus Aktif */}
      {activeCycle && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Ringkasan Siklus & Simpulan CR */}
            <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <div className="text-[11px] font-mono font-semibold text-slate-500">
                    {activeCycle.kodeSiklus} · Pos Lead Terkait:{' '}
                    {activeCycle.relatedLeadCodes.join(', ') || 'Tingkat Entitas / Umum'}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{activeCycle.namaSiklus}</h3>
                </div>
                <span
                  data-testid="a250-active-cr"
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold border ${badgeClass(
                    activeCycle.controlRiskLevel
                  )}`}
                >
                  {activeCycle.controlRiskLevel === 'High' ? (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Control Risk: {activeCycle.controlRiskLevel}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Simpulan Pengendalian Siklus
                  </label>
                  <select
                    disabled={isReadOnly || activeCycle.items.length > 0}
                    value={activeCycle.simpulanPengendalian}
                    onChange={(e) => {
                      const val = e.target.value as A250ControlCycle['simpulanPengendalian'];
                      const derivedCr: RiskLevel =
                        val === 'Pengendalian Internal pada siklus ini memadai'
                          ? 'Low'
                          : val === 'Pengendalian Internal pada siklus ini tidak memadai'
                            ? 'High'
                            : 'Moderate';
                      dispatchAction({
                        type: 'UPDATE_A250_CYCLE',
                        kodeSiklus: activeCycle.kodeSiklus,
                        patch: { simpulanPengendalian: val, controlRiskLevel: derivedCr },
                      });
                    }}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
                  >
                    <option value="Pengendalian Internal pada siklus ini memadai">
                      Pengendalian Internal pada siklus ini memadai (CR: Low)
                    </option>
                    <option value="Pengendalian Internal pada siklus ini belum sepenuhnya memadai">
                      Pengendalian Internal pada siklus ini belum sepenuhnya memadai (CR: Moderate)
                    </option>
                    <option value="Pengendalian Internal pada siklus ini tidak memadai">
                      Pengendalian Internal pada siklus ini tidak memadai (CR: High)
                    </option>
                  </select>
                  {activeCycle.items.length > 0 && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Dihitung otomatis dari hasil Walk-Through & Test of Controls di bawah.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Simpulan Siklus
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={activeCycle.catatanSimpulan}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_A250_CYCLE',
                        kodeSiklus: activeCycle.kodeSiklus,
                        patch: { catatanSimpulan: e.target.value },
                      })
                    }
                    placeholder="Ringkas observasi walk-through dan ketergantungan kontrol..."
                    className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Tabel Item Walk-Through & TOC */}
            <div className="bg-white border border-slate-200 rounded p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
                Daftar Prosedur Pengendalian & Hasil Walk-Through ({activeCycle.items.length})
              </h4>

              {activeCycle.items.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Belum ada item walk-through pada siklus {activeCycle.kodeSiklus}. Tambahkan SOP kontrol melalui form di kanan.
                </div>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600">
                        <th className="py-2 px-2 text-left font-semibold">#</th>
                        <th className="py-2 px-2 text-left font-semibold">Prosedur SOP & WCGW</th>
                        <th className="py-2 px-2 text-left font-semibold">Frekuensi / Tipe</th>
                        <th className="py-2 px-2 text-left font-semibold">Desain</th>
                        <th className="py-2 px-2 text-left font-semibold">Hasil TOC</th>
                        <th className="py-2 px-2 text-left font-semibold">Asersi</th>
                        <th className="py-2 px-2 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeCycle.items.map((item) => {
                        const assertions = (['C', 'E', 'A&C', 'V'] as const)
                          .filter((k) => item.dampakAsersi[k])
                          .join(', ');
                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-2 px-2 font-mono text-slate-500">{item.nomorUrut}</td>
                            <td className="py-2 px-2">
                              <div className="font-semibold text-slate-900">{item.uraianProsedurSop}</div>
                              <div className="text-[11px] text-slate-500">WCGW: {item.wcgwRisiko}</div>
                            </td>
                            <td className="py-2 px-2 text-[11px] text-slate-700 whitespace-nowrap">
                              <div>{item.frekuensi}</div>
                              <div className="text-slate-500">{item.tipeAktivitas}</div>
                            </td>
                            <td className="py-2 px-2 whitespace-nowrap">
                              <select
                                aria-label="Desain Pengendalian"
                                disabled={isReadOnly}
                                value={item.desainSesuai}
                                onChange={(e) =>
                                  dispatchAction({
                                    type: 'UPSERT_A250_ITEM',
                                    kodeSiklus: activeCycle.kodeSiklus,
                                    item: {
                                      ...item,
                                      desainSesuai: e.target.value as 'Sesuai' | 'Tidak sesuai',
                                    },
                                  })
                                }
                                className="h-7 px-1.5 text-[11px] border border-slate-300 rounded bg-white"
                              >
                                <option value="Sesuai">Sesuai</option>
                                <option value="Tidak sesuai">Tidak sesuai</option>
                              </select>
                            </td>
                            <td className="py-2 px-2 whitespace-nowrap">
                              <select
                                aria-label="Hasil TOC"
                                disabled={isReadOnly}
                                value={item.hasilToc}
                                onChange={(e) =>
                                  dispatchAction({
                                    type: 'UPSERT_A250_ITEM',
                                    kodeSiklus: activeCycle.kodeSiklus,
                                    item: {
                                      ...item,
                                      hasilToc: e.target.value as
                                        | 'Efektif'
                                        | 'Tidak Efektif'
                                        | 'Tidak Berlaku',
                                    },
                                  })
                                }
                                className="h-7 px-1.5 text-[11px] border border-slate-300 rounded bg-white"
                              >
                                <option value="Efektif">Efektif</option>
                                <option value="Tidak Efektif">Tidak Efektif</option>
                                <option value="Tidak Berlaku">Tidak Berlaku</option>
                              </select>
                            </td>
                            <td className="py-2 px-2 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                              {assertions || '-'}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() =>
                                  dispatchAction({
                                    type: 'DELETE_A250_ITEM',
                                    kodeSiklus: activeCycle.kodeSiklus,
                                    itemId: item.id,
                                  })
                                }
                                aria-label="Hapus item kontrol"
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Form Tambah Walk-Through & TOC */}
          <form
            onSubmit={handleAddItem}
            className="bg-white border border-slate-200 rounded p-4 space-y-3 h-fit"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
              Tambah Item Walk-Through ({activeCycle.kodeSiklus})
            </h4>

            <div>
              <label htmlFor="a250-sop" className="block text-xs font-semibold text-slate-700 mb-1">
                Uraian Prosedur SOP / Kontrol Kunci
              </label>
              <textarea
                id="a250-sop"
                data-testid="a250-sop-input"
                rows={2}
                required
                disabled={isReadOnly}
                value={sopDraft}
                onChange={(e) => setSopDraft(e.target.value)}
                placeholder="Misal: Otorisasi batas kredit pelanggan & penelaahan faktur penjualan terhadap surat jalan..."
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label htmlFor="a250-wcgw" className="block text-xs font-semibold text-slate-700 mb-1">
                Risiko Salah Saji (What Could Go Wrong / WCGW)
              </label>
              <input
                id="a250-wcgw"
                type="text"
                disabled={isReadOnly}
                value={wcgw}
                onChange={(e) => setWcgw(e.target.value)}
                placeholder="Misal: Penjualan fiktif atau salah pisah batas"
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Frekuensi
                </label>
                <select
                  disabled={isReadOnly}
                  value={frekuensi}
                  onChange={(e) =>
                    setFrekuensi(e.target.value as A250ControlTestItem['frekuensi'])
                  }
                  className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
                >
                  {A250_FREKUENSI_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tipe Aktivitas
                </label>
                <select
                  disabled={isReadOnly}
                  value={tipeAktivitas}
                  onChange={(e) =>
                    setTipeAktivitas(e.target.value as A250ControlTestItem['tipeAktivitas'])
                  }
                  className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
                >
                  {A250_TIPE_AKTIVITAS_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Desain & Implementasi
                </label>
                <select
                  data-testid="a250-desain-select"
                  disabled={isReadOnly}
                  value={desainSesuai}
                  onChange={(e) =>
                    setDesainSesuai(e.target.value as 'Sesuai' | 'Tidak sesuai')
                  }
                  className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
                >
                  <option value="Sesuai">Sesuai</option>
                  <option value="Tidak sesuai">Tidak sesuai</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hasil Test of Controls
                </label>
                <select
                  data-testid="a250-toc-select"
                  disabled={isReadOnly}
                  value={hasilToc}
                  onChange={(e) =>
                    setHasilToc(
                      e.target.value as 'Efektif' | 'Tidak Efektif' | 'Tidak Berlaku'
                    )
                  }
                  className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
                >
                  <option value="Efektif">Efektif</option>
                  <option value="Tidak Efektif">Tidak Efektif</option>
                  <option value="Tidak Berlaku">Tidak Berlaku</option>
                </select>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-700 mb-1">Dampak Asersi</div>
              <div className="flex flex-wrap gap-3 text-xs">
                {(['C', 'E', 'A&C', 'V'] as const).map((k) => (
                  <label key={k} className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={dampakAsersi[k]}
                      onChange={(e) =>
                        setDampakAsersi((prev) => ({ ...prev, [k]: e.target.checked }))
                      }
                      className="rounded border-slate-300"
                    />
                    <span className="font-mono">{k}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Catatan Pengujian / Sampel
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: 25 transaksi diuji tanpa deviasi"
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={isReadOnly || !sopDraft.trim()}
              data-testid="a250-add-btn"
              className="w-full h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Simpan Item Walk-Through
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
