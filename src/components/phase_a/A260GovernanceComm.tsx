import React, { useState } from 'react';
import { A260_SPI_AREAS, A260_TCWG_AREAS } from '../../data/a2Catalog';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';

type A260Tab = 'A2701' | 'A2702';

export const A260GovernanceComm: React.FC = () => {
  const { activeEngagement, dispatchAction } = useAtlas();
  const [activeTab, setActiveTab] = useState<A260Tab>('A2701');

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A260');
  const { a260 } = activeEngagement;
  const tcwgAreas = a260.tcwgAreas ?? [true, true, true, false];
  const spiAreas = a260.spiAreas ?? [false, false, false];

  const toggleTcwgArea = (idx: number) => {
    const next = [...tcwgAreas];
    next[idx] = !next[idx];
    dispatchAction({ type: 'UPDATE_A260', patch: { tcwgAreas: next } });
  };

  const toggleSpiArea = (idx: number) => {
    const next = [...spiAreas];
    next[idx] = !next[idx];
    dispatchAction({ type: 'UPDATE_A260', patch: { spiAreas: next } });
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="pb-3 border-b border-slate-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            SA 260 & SA 610 · TATA KELOLA & FUNGSI AUDIT INTERNAL
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
            A260 — Komunikasi TCWG (A2701) & Evaluasi Pekerjaan SPI (A2702)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi komunikasi dua arah dengan Pihak yang Bertanggung Jawab atas Tata Kelola dan evaluasi keandalan Auditor Internal (SPI).
          </p>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => setActiveTab('A2701')}
            className={`h-8 px-3 rounded text-xs font-medium border cursor-pointer whitespace-nowrap ${
              activeTab === 'A2701'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            A2701 — Komunikasi TCWG (SA 260)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('A2702')}
            className={`h-8 px-3 rounded text-xs font-medium border cursor-pointer whitespace-nowrap ${
              activeTab === 'A2702'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            A2702 — Evaluasi Pekerjaan SPI (SA 610)
          </button>
        </div>
      </div>

      {activeTab === 'A2701' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={a260.hasTcwg}
                onChange={(e) =>
                  dispatchAction({ type: 'UPDATE_A260', patch: { hasTcwg: e.target.checked } })
                }
                className="rounded border-slate-300"
              />
              Entitas memiliki Pihak yang Bertanggung Jawab atas Tata Kelola (TCWG / Dewan Komisaris / Komite Audit)
            </label>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
              4 Area Wajib Komunikasi TCWG (SA 260)
            </div>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded">
              {A260_TCWG_AREAS.map((area, idx) => (
                <label
                  key={area.kode}
                  className="p-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    disabled={isReadOnly || !a260.hasTcwg}
                    checked={Boolean(tcwgAreas[idx])}
                    onChange={() => toggleTcwgArea(idx)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {area.kode}. {area.label}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{area.detail}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="a260-simpulan-tcwg" className="block text-xs font-semibold text-slate-700 mb-1">
                Simpulan Komunikasi TCWG (A2701)
              </label>
              <select
                id="a260-simpulan-tcwg"
                disabled={isReadOnly}
                value={a260.simpulanTcwg}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_A260',
                    patch: {
                      simpulanTcwg: e.target.value as
                        | 'Komunikasi dengan pihak TCWG sudah memadai'
                        | 'Komunikasi dengan pihak TCWG kurang memadai',
                    },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              >
                <option value="Komunikasi dengan pihak TCWG sudah memadai">
                  Komunikasi dengan pihak TCWG sudah memadai
                </option>
                <option value="Komunikasi dengan pihak TCWG kurang memadai">
                  Komunikasi dengan pihak TCWG kurang memadai
                </option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="a260-catatan-tcwg" className="block text-xs font-semibold text-slate-700 mb-1">
              Ringkasan Risalah / Catatan Komunikasi TCWG
            </label>
            <textarea
              id="a260-catatan-tcwg"
              rows={3}
              disabled={isReadOnly}
              value={a260.catatanTcwg}
              onChange={(e) =>
                dispatchAction({ type: 'UPDATE_A260', patch: { catatanTcwg: e.target.value } })
              }
              placeholder="Catat tanggal pertemuan, nama pejabat TCWG yang ditemui, dan isu kunci yang dikomunikasikan..."
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
            />
          </div>
        </div>
      )}

      {activeTab === 'A2702' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="pb-2 border-b border-slate-200">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={a260.hasInternalAudit}
                onChange={(e) => {
                  const hasSpi = e.target.checked;
                  dispatchAction({
                    type: 'UPDATE_A260',
                    patch: {
                      hasInternalAudit: hasSpi,
                      simpulanInternalAudit: hasSpi
                        ? 'Bukti Audit yang diperoleh telah cukup memadai'
                        : 'Prosedur tahap ini tidak relevan',
                    },
                  });
                }}
                className="rounded border-slate-300"
              />
              Entitas memiliki Fungsi Audit Internal (SPI) dan auditor merencanakan penggunaan hasil pekerjaannya
            </label>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3 Area Evaluasi Keandalan Auditor Internal (SA 610)
            </div>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded">
              {A260_SPI_AREAS.map((area, idx) => (
                <label
                  key={area.kode}
                  className="p-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    disabled={isReadOnly || !a260.hasInternalAudit}
                    checked={Boolean(spiAreas[idx])}
                    onChange={() => toggleSpiArea(idx)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {area.kode}. {area.label}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{area.detail}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="a260-simpulan-spi" className="block text-xs font-semibold text-slate-700 mb-1">
                Simpulan Evaluasi Pekerjaan SPI (A2702)
              </label>
              <select
                id="a260-simpulan-spi"
                disabled={isReadOnly}
                value={a260.simpulanInternalAudit}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_A260',
                    patch: {
                      simpulanInternalAudit: e.target.value as
                        | 'Prosedur tahap ini tidak relevan'
                        | 'Bukti Audit yang diperoleh telah cukup memadai'
                        | 'Bukti Audit belum cukup memadai',
                    },
                  })
                }
                className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              >
                <option value="Prosedur tahap ini tidak relevan">
                  Prosedur tahap ini tidak relevan
                </option>
                <option value="Bukti Audit yang diperoleh telah cukup memadai">
                  Bukti Audit yang diperoleh telah cukup memadai
                </option>
                <option value="Bukti Audit belum cukup memadai">
                  Bukti Audit belum cukup memadai
                </option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="a260-catatan-spi" className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Evaluasi SPI / Alasan Tidak Menggunakan Pekerjaan SPI
            </label>
            <textarea
              id="a260-catatan-spi"
              rows={3}
              disabled={isReadOnly}
              value={a260.catatanInternalAudit}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_A260',
                  patch: { catatanInternalAudit: e.target.value },
                })
              }
              placeholder="Jelaskan lingkup pekerjaan SPI yang digunakan atau alasan ketiadaan fungsi SPI di entitas..."
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};
