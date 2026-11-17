import React from 'react';
import { AlertTriangle, Calendar } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { formatAuditNumber } from '../../utils/formatters';
import { calculateTeamBudgetTotals } from '../../utils/timeCalculator';

export const A120TimeBudget: React.FC = () => {
  const { state, activeEngagement, dispatchAction } = useAtlas();

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A120');
  const { a120, teamMembers } = activeEngagement;
  const capacityHours = a120.hariEfektif * a120.jamPerHari;
  const totals = calculateTeamBudgetTotals(teamMembers, capacityHours);

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 300 · SPM 1 · ANGGARAN WAKTU & IMBALAN JASA AUDIT
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A120 — Kalkulator Hari Efektif, Alokasi Jam Per Tahapan & Estimasi Fee Perikatan
            </h2>
          </div>
          {totals.hasCapacityOverflow && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
              Peringatan: Ada personel dengan jam rencana melebihi kapasitas hari efektif!
            </span>
          )}
        </div>

        {/* Parameter Periode Penugasan & EQCR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label
              htmlFor="a120-mulai"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
            >
              Tanggal Mulai Penugasan
            </label>
            <div className="relative">
              <input
                id="a120-mulai"
                data-testid="a120-tanggal-mulai"
                type="date"
                disabled={isReadOnly}
                value={a120.tanggalMulai}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_A120',
                    patch: { tanggalMulai: e.target.value },
                  })
                }
                className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="a120-selesai"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
            >
              Tanggal Selesai / Target LAI
            </label>
            <input
              id="a120-selesai"
              data-testid="a120-tanggal-selesai"
              type="date"
              disabled={isReadOnly}
              value={a120.tanggalSelesai}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_A120',
                  patch: { tanggalSelesai: e.target.value },
                })
              }
              className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="a120-libur"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
            >
              Hari Libur Nasional (dalam Periode)
            </label>
            <input
              id="a120-libur"
              data-testid="a120-hari-libur"
              type="number"
              min={0}
              max={60}
              disabled={isReadOnly}
              value={a120.hariLiburNasional}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_A120',
                  patch: { hariLiburNasional: Math.max(0, Number(e.target.value) || 0) },
                })
              }
              className="w-full h-8 px-2.5 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded disabled:bg-slate-100"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 h-8 px-2.5 rounded border border-slate-300 bg-slate-50 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                data-testid="a120-eqcr-checkbox"
                disabled={isReadOnly}
                checked={a120.isEqcrRequired}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_A120',
                    patch: { isEqcrRequired: e.target.checked },
                  })
                }
                className="w-3.5 h-3.5 rounded accent-indigo-700"
              />
              <span className="font-medium">Wajib EQCR (C300 Aktif)</span>
            </label>
          </div>
        </div>

        {/* KPI Bar Kalkulasi Hari Efektif */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Hari Kalender
            </div>
            <div
              data-testid="a120-hari-kalender"
              className="mt-0.5 text-base font-bold font-mono tabular-nums text-right text-slate-900"
            >
              {formatAuditNumber(a120.hariKalender)}
            </div>
          </div>

          <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Akhir Pekan (Sabtu–Minggu)
            </div>
            <div className="mt-0.5 text-base font-bold font-mono tabular-nums text-right text-slate-700">
              {formatAuditNumber(a120.hariWeekend)}
            </div>
          </div>

          <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Hari Kerja Efektif
            </div>
            <div
              data-testid="a120-hari-efektif"
              className="mt-0.5 text-base font-bold font-mono tabular-nums text-right text-indigo-800"
            >
              {formatAuditNumber(a120.hariEfektif)}
            </div>
          </div>

          <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Kapasitas Max (× 7 Jam/Hari)
            </div>
            <div
              data-testid="a120-kapasitas-jam"
              className="mt-0.5 text-base font-bold font-mono tabular-nums text-right text-slate-900"
            >
              {formatAuditNumber(capacityHours)} Jam
            </div>
          </div>
        </div>

        {/* Pelatihan Berkelanjutan */}
        <div>
          <label
            htmlFor="a120-tema-pelatihan"
            className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
          >
            Tema Pelatihan Profesional Berkelanjutan (PPL) Tim Perikatan
          </label>
          <input
            id="a120-tema-pelatihan"
            type="text"
            disabled={isReadOnly}
            value={a120.temaPelatihanBerkelanjutan}
            onChange={(e) =>
              dispatchAction({
                type: 'UPDATE_A120',
                patch: { temaPelatihanBerkelanjutan: e.target.value },
              })
            }
            className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
          />
        </div>
      </div>

      {/* Matriks Alokasi Jam & Tarif Jasa Tim */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Alokasi Rencana Jam & Tarif Honorarium Tim (Tersinkronisasi ke A130 & A140)
          </h3>
          <span className="text-[11px] text-slate-500">
            Total Tim: <strong className="font-mono">{teamMembers.length}</strong> Personel (Diatur pada A1103B)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="py-2 px-3 text-left font-semibold">Personel & Peran</th>
                <th className="py-2 px-2.5 text-right font-semibold w-32">Tarif / Jam (Rp)</th>
                <th className="py-2 px-2.5 text-right font-semibold w-28">Pra-Perikatan</th>
                <th className="py-2 px-2.5 text-right font-semibold w-28">Respon Risiko</th>
                <th className="py-2 px-2.5 text-right font-semibold w-28">Pelaporan</th>
                <th className="py-2 px-3 text-right font-semibold w-24">Total Jam</th>
                <th className="py-2 px-3 text-right font-semibold w-40">Estimasi Fee (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {teamMembers.map((tm) => {
                const u = state.users.find((x) => x.id === tm.userId);
                const mSum = totals.memberSummaries[tm.userId];
                return (
                  <tr
                    key={tm.userId}
                    className={mSum?.exceedsCapacity ? 'bg-amber-50/60' : 'hover:bg-slate-50'}
                  >
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900">
                        {u?.namaLengkap ?? tm.userId}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {u?.inisial ?? '-'} · {tm.peranTim}
                        {mSum?.exceedsCapacity && (
                          <span className="ml-2 text-rose-700 font-semibold">
                            (Melebihi {capacityHours} Jam!)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <input
                        type="number"
                        aria-label={`Tarif per jam ${u?.namaLengkap ?? tm.userId}`}
                        data-testid={`a120-rate-${tm.userId}`}
                        min={0}
                        step={50000}
                        disabled={isReadOnly}
                        value={tm.tarifPerJam}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_TEAM_MEMBER_BUDGET',
                            userId: tm.userId,
                            patch: { tarifPerJam: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-28 h-8 px-2 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded disabled:bg-slate-100"
                      />
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <input
                        type="number"
                        aria-label={`Jam Pra-Perikatan ${u?.namaLengkap ?? tm.userId}`}
                        data-testid={`a120-pra-${tm.userId}`}
                        min={0}
                        disabled={isReadOnly}
                        value={tm.rencanaJamPraperikatan}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_TEAM_MEMBER_BUDGET',
                            userId: tm.userId,
                            patch: { rencanaJamPraperikatan: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-20 h-8 px-2 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded disabled:bg-slate-100"
                      />
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <input
                        type="number"
                        aria-label={`Jam Respon Risiko ${u?.namaLengkap ?? tm.userId}`}
                        data-testid={`a120-resp-${tm.userId}`}
                        min={0}
                        disabled={isReadOnly}
                        value={tm.rencanaJamRiskResponse}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_TEAM_MEMBER_BUDGET',
                            userId: tm.userId,
                            patch: { rencanaJamRiskResponse: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-20 h-8 px-2 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded disabled:bg-slate-100"
                      />
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <input
                        type="number"
                        aria-label={`Jam Pelaporan ${u?.namaLengkap ?? tm.userId}`}
                        data-testid={`a120-pel-${tm.userId}`}
                        min={0}
                        disabled={isReadOnly}
                        value={tm.rencanaJamPelaporan}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_TEAM_MEMBER_BUDGET',
                            userId: tm.userId,
                            patch: { rencanaJamPelaporan: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-20 h-8 px-2 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded disabled:bg-slate-100"
                      />
                    </td>
                    <td
                      className={`py-2 px-3 font-mono tabular-nums text-right font-semibold ${
                        mSum?.exceedsCapacity ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {formatAuditNumber(mSum?.totalRencanaJam ?? 0)}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-slate-900">
                      {formatAuditNumber(mSum?.totalHonorarium ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                <td className="py-2.5 px-3">TOTAL ANGGARAN TIM PERIKATAN</td>
                <td className="py-2.5 px-2.5 font-mono tabular-nums text-right text-slate-500">
                  —
                </td>
                <td className="py-2.5 px-2.5 font-mono tabular-nums text-right">
                  {formatAuditNumber(totals.totalPraPerikatanJam)}
                </td>
                <td className="py-2.5 px-2.5 font-mono tabular-nums text-right">
                  {formatAuditNumber(totals.totalRiskResponseJam)}
                </td>
                <td className="py-2.5 px-2.5 font-mono tabular-nums text-right">
                  {formatAuditNumber(totals.totalPelaporanJam)}
                </td>
                <td
                  data-testid="a120-grand-total-jam"
                  className="py-2.5 px-3 font-mono tabular-nums text-right text-indigo-800"
                >
                  {formatAuditNumber(totals.grandTotalJam)}
                </td>
                <td
                  data-testid="a120-grand-total-fee"
                  className="py-2.5 px-3 font-mono tabular-nums text-right text-indigo-800"
                >
                  {formatAuditNumber(totals.grandTotalHonorarium)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
