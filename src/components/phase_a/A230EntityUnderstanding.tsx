import React, { useState } from 'react';
import { AlertTriangle, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { A230_SUBINDEX_CONFIGS } from '../../data/a2Catalog';
import { MASTER_LEAD_HEADERS } from '../../data/masterLeadHeaders';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { A230EntityRiskItem } from '../../types/atlas';

type A230Tab = A230EntityRiskItem['kodeSubIndeks'] | 'A230.8';

export const A230EntityUnderstanding: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const [activeTab, setActiveTab] = useState<A230Tab>('A230.1');
  const [selectedSourceSub, setSelectedSourceSub] =
    useState<A230EntityRiskItem['kodeSubIndeks']>('A230.7');
  const [selectedLeadCode, setSelectedLeadCode] = useState<string>('L05');
  const [selectedDirection, setSelectedDirection] = useState<
    'Overstatement' | 'Understatement' | 'Misclassification'
  >('Overstatement');

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A230');
  const { a230Items } = activeEngagement;

  const fraudItem = a230Items.find((i) => i.kodeSubIndeks === 'A230.7');
  const isFraudActive = fraudItem?.hasilAnalisis === 'Ya';
  const totalMappedAccounts = a230Items.reduce((sum, i) => sum + i.affectedAccounts.length, 0);

  const currentConfig = A230_SUBINDEX_CONFIGS.find((c) => c.kodeSubIndeks === activeTab);
  const currentItem = a230Items.find((i) => i.kodeSubIndeks === activeTab);

  const addAffectedAccount = (targetSub: A230EntityRiskItem['kodeSubIndeks']) => {
    const sourceItem = a230Items.find((i) => i.kodeSubIndeks === targetSub);
    const leadMeta = MASTER_LEAD_HEADERS.find((l) => l.leadCode === selectedLeadCode);
    if (!sourceItem || !leadMeta) return;
    const exists = sourceItem.affectedAccounts.some((a) => a.leadCode === leadMeta.leadCode);
    if (exists) return;

    dispatchAction({
      type: 'UPDATE_A230_AFFECTED_ACCOUNTS',
      kodeSubIndeks: targetSub,
      affectedAccounts: [
        ...sourceItem.affectedAccounts,
        {
          leadCode: leadMeta.leadCode,
          namaAkun: leadMeta.title,
          arahSalahSaji: selectedDirection,
        },
      ],
    });
  };

  const removeAffectedAccount = (
    targetSub: A230EntityRiskItem['kodeSubIndeks'],
    leadCode: string
  ) => {
    const sourceItem = a230Items.find((i) => i.kodeSubIndeks === targetSub);
    if (!sourceItem) return;
    dispatchAction({
      type: 'UPDATE_A230_AFFECTED_ACCOUNTS',
      kodeSubIndeks: targetSub,
      affectedAccounts: sourceItem.affectedAccounts.filter((a) => a.leadCode !== leadCode),
    });
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header & Sub-Tabs A230.1 - A230.8 */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 315 & SA 240 · PEMAHAMAN ENTITAS, LINGKUNGAN & FRAUD RISK
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A230 — Pemahaman Entitas & Faktor Risiko Kecurangan (A230.1–A230.8)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Jika faktor risiko kecurangan SA 240 (A230.7) bernilai "Ya", seluruh akun terdampak otomatis dikunci sebagai RoMM High pada A270.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isFraudActive && (
              <span
                data-testid="a230-fraud-badge"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Fraud Risk SA 240 Aktif
              </span>
            )}
            <button
              type="button"
              onClick={() => setActiveIndex('A270')}
              className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white cursor-pointer whitespace-nowrap"
            >
              Lihat Matriks A270
            </button>
          </div>
        </div>

        {/* Navigation Pills A230.1 .. A230.8 */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {A230_SUBINDEX_CONFIGS.map((cfg) => {
            const item = a230Items.find((i) => i.kodeSubIndeks === cfg.kodeSubIndeks);
            const isFraudTab = cfg.kodeSubIndeks === 'A230.7' && item?.hasilAnalisis === 'Ya';
            return (
              <button
                key={cfg.kodeSubIndeks}
                type="button"
                data-testid={`a230-tab-${cfg.kodeSubIndeks}`}
                onClick={() => {
                  setActiveTab(cfg.kodeSubIndeks);
                  setSelectedSourceSub(cfg.kodeSubIndeks);
                }}
                className={`h-8 px-2.5 rounded text-xs font-medium border cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  activeTab === cfg.kodeSubIndeks
                    ? 'bg-slate-900 text-white border-slate-900'
                    : isFraudTab
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="font-mono">{cfg.kodeSubIndeks}</span>
                {item?.affectedAccounts.length ? (
                  <span className="text-[10px] font-mono opacity-80">
                    ({item.affectedAccounts.length})
                  </span>
                ) : null}
              </button>
            );
          })}
          <button
            type="button"
            data-testid="a230-tab-A230.8"
            onClick={() => setActiveTab('A230.8')}
            className={`h-8 px-2.5 rounded text-xs font-medium border cursor-pointer whitespace-nowrap ${
              activeTab === 'A230.8'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            A230.8 Pemetaan Akun ({totalMappedAccounts})
          </button>
        </div>
      </div>

      {/* Konten Sub-Indeks A230.1 - A230.7 */}
      {activeTab !== 'A230.8' && currentConfig && currentItem && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-4 space-y-4">
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <div className="text-[11px] font-mono font-semibold text-slate-500">
                  {currentConfig.kodeSubIndeks} · {currentConfig.saRelevan}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{currentConfig.judul}</h3>
              </div>
              {currentConfig.kodeSubIndeks === 'A230.7' && currentItem.hasilAnalisis === 'Ya' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  isFraudRisk = True
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-3">
              <div className="font-semibold text-slate-800 mb-1.5">
                {currentItem.uraianPertanyaan}
              </div>
              <ul className="space-y-1 list-disc pl-4 text-[11px]">
                {currentConfig.promptChecklist.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="a230-hasil-analisis"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Simpulan / Hasil Analisis ({currentConfig.kodeSubIndeks})
                </label>
                <select
                  id="a230-hasil-analisis"
                  data-testid="a230-hasil-analisis"
                  disabled={isReadOnly}
                  value={currentItem.hasilAnalisis}
                  onChange={(e) =>
                    dispatchAction({
                      type: 'UPDATE_A230_ITEM',
                      kodeSubIndeks: currentItem.kodeSubIndeks,
                      patch: { hasilAnalisis: e.target.value },
                    })
                  }
                  className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
                >
                  {currentConfig.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {currentConfig.kodeSubIndeks !== 'A230.7' && (
                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={currentItem.isFraudRisk}
                      onChange={(e) =>
                        dispatchAction({
                          type: 'UPDATE_A230_ITEM',
                          kodeSubIndeks: currentItem.kodeSubIndeks,
                          patch: { isFraudRisk: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    Tandai memicu indikasi Fraud Risk (SA 240)
                  </label>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="a230-penjelasan"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Dokumentasi Pemahaman Auditor & Pertimbangan Risiko Salah Saji
              </label>
              <textarea
                id="a230-penjelasan"
                data-testid="a230-penjelasan"
                rows={4}
                disabled={isReadOnly}
                value={currentItem.penjelasanAuditor}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_A230_ITEM',
                    kodeSubIndeks: currentItem.kodeSubIndeks,
                    patch: { penjelasanAuditor: e.target.value },
                  })
                }
                placeholder={`Catat hasil pemahaman ${currentConfig.kodeSubIndeks}, bukti pendukung, dan implikasinya terhadap akun laporan keuangan...`}
                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Panel Pemetaan Akun Terdampak untuk Sub-Indeks Aktif */}
          <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
              Akun Terdampak ({currentItem.kodeSubIndeks})
            </h3>
            <div className="space-y-2">
              <select
                aria-label="Pilih Akun Lead Schedule"
                data-testid="a230-lead-select"
                disabled={isReadOnly}
                value={selectedLeadCode}
                onChange={(e) => setSelectedLeadCode(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
              >
                {MASTER_LEAD_HEADERS.map((l) => (
                  <option key={l.leadCode} value={l.leadCode}>
                    {l.leadCode} — {l.title}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  aria-label="Arah Salah Saji"
                  data-testid="a230-direction-select"
                  disabled={isReadOnly}
                  value={selectedDirection}
                  onChange={(e) =>
                    setSelectedDirection(
                      e.target.value as 'Overstatement' | 'Understatement' | 'Misclassification'
                    )
                  }
                  className="flex-1 h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-100"
                >
                  <option value="Overstatement">Overstatement</option>
                  <option value="Understatement">Understatement</option>
                  <option value="Misclassification">Misclassification</option>
                </select>
                <button
                  type="button"
                  disabled={isReadOnly}
                  data-testid="a230-add-affected"
                  onClick={() => addAffectedAccount(currentItem.kodeSubIndeks)}
                  className="h-8 px-2.5 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Petakan
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 border-t border-slate-200 pt-2">
              {currentItem.affectedAccounts.length === 0 ? (
                <div className="text-[11px] text-slate-400 py-3 text-center">
                  Belum ada akun terdampak dipetakan pada {currentItem.kodeSubIndeks}.
                </div>
              ) : (
                currentItem.affectedAccounts.map((acc) => (
                  <div
                    key={acc.leadCode}
                    className="py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        <span className="font-mono text-slate-600">{acc.leadCode}</span> · {acc.namaAkun}
                      </div>
                      <div className="text-[11px] text-slate-500">{acc.arahSalahSaji}</div>
                    </div>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => removeAffectedAccount(currentItem.kodeSubIndeks, acc.leadCode)}
                      aria-label={`Hapus ${acc.leadCode}`}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB A230.8: Rekapitulasi Pemetaan Semua Akun Terdampak (leadCode Seragam) */}
      {activeTab === 'A230.8' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                A230.8 — Matriks Pemetaan Akun Terdampak (Lead Code Seragam L02–L47)
              </h3>
              <p className="text-[11px] text-slate-500">
                Akun yang terhubung ke A230.7 (saat hasil analisis = "Ya") otomatis terkunci sebagai Fraud Risk pada matriks A270.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 rounded border border-slate-200 bg-slate-50">
            <select
              aria-label="Sumber Sub Indeks"
              disabled={isReadOnly}
              value={selectedSourceSub}
              onChange={(e) =>
                setSelectedSourceSub(e.target.value as A230EntityRiskItem['kodeSubIndeks'])
              }
              className="h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
            >
              {A230_SUBINDEX_CONFIGS.map((c) => (
                <option key={c.kodeSubIndeks} value={c.kodeSubIndeks}>
                  {c.kodeSubIndeks} — {c.judul}
                </option>
              ))}
            </select>
            <select
              aria-label="Akun Terdampak"
              disabled={isReadOnly}
              value={selectedLeadCode}
              onChange={(e) => setSelectedLeadCode(e.target.value)}
              className="h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
            >
              {MASTER_LEAD_HEADERS.map((l) => (
                <option key={l.leadCode} value={l.leadCode}>
                  {l.leadCode} — {l.title}
                </option>
              ))}
            </select>
            <select
              aria-label="Arah Salah Saji"
              disabled={isReadOnly}
              value={selectedDirection}
              onChange={(e) =>
                setSelectedDirection(
                  e.target.value as 'Overstatement' | 'Understatement' | 'Misclassification'
                )
              }
              className="h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
            >
              <option value="Overstatement">Overstatement</option>
              <option value="Understatement">Understatement</option>
              <option value="Misclassification">Misclassification</option>
            </select>
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => addAffectedAccount(selectedSourceSub)}
              className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Pemetaan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600">
                  <th className="py-2 px-2 text-left font-semibold">Sub-Indeks</th>
                  <th className="py-2 px-2 text-left font-semibold">Lead Code</th>
                  <th className="py-2 px-2 text-left font-semibold">Nama Pos Akun</th>
                  <th className="py-2 px-2 text-left font-semibold">Arah Salah Saji</th>
                  <th className="py-2 px-2 text-left font-semibold">Status Fraud</th>
                  <th className="py-2 px-2 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {totalMappedAccounts === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Belum ada akun terdampak dipetakan dari A230.1–A230.7.
                    </td>
                  </tr>
                ) : (
                  a230Items.flatMap((item) =>
                    item.affectedAccounts.map((acc) => {
                      const flaggedFraud =
                        item.kodeSubIndeks === 'A230.7'
                          ? item.hasilAnalisis === 'Ya'
                          : item.isFraudRisk;
                      return (
                        <tr key={`${item.kodeSubIndeks}-${acc.leadCode}`} className="hover:bg-slate-50">
                          <td className="py-2 px-2 font-mono text-slate-700">{item.kodeSubIndeks}</td>
                          <td className="py-2 px-2 font-mono font-semibold text-slate-900">
                            {acc.leadCode}
                          </td>
                          <td className="py-2 px-2 text-slate-900">{acc.namaAkun}</td>
                          <td className="py-2 px-2 text-slate-700">{acc.arahSalahSaji}</td>
                          <td className="py-2 px-2">
                            {flaggedFraud ? (
                              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                Fraud Risk (High Lock)
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                Risiko Entitas
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => removeAffectedAccount(item.kodeSubIndeks, acc.leadCode)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
