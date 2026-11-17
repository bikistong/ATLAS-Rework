import React from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { A150IndependenceDeclaration } from '../../types/atlas';
import { canSignOffA150Prepared } from '../../utils/a1Formulas';

export const A150Independence: React.FC = () => {
  const { state, activeEngagement, activeClient, dispatchAction } = useAtlas();

  if (!activeEngagement || !activeClient) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A150');
  const { a150Declarations, teamMembers, legalChecklists } = activeEngagement;
  const clauses = legalChecklists.filter((c) => c.kodeIndeks === 'A150');
  const gate = canSignOffA150Prepared(a150Declarations, teamMembers);

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 200 · SA 220 · KODE ETIK PROFESI AKUNTAN PUBLIK
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              A150 — Reviu Pernyataan Independensi Tim Perikatan (Tersinkronisasi dengan A140)
            </h2>
          </div>

          {!gate.allowed ? (
            <span
              data-testid="a150-gate-warning"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-700" />
              {gate.reason}
            </span>
          ) : (
            <span
              data-testid="a150-gate-ok"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Seluruh tim telah menandatangani deklarasi independensi
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 mt-2">
          Kertas kerja A150 memblokir <strong>Mark Prepared</strong> selama masih ada anggota tim yang ditugaskan berstatus{' '}
          <span className="font-mono font-semibold text-amber-700">Pending</span> atau{' '}
          <span className="font-mono font-semibold text-rose-700">Declined</span>.
        </p>
      </div>

      {/* Matriks Deklarasi & Tanda Tangan Per Personel */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Matriks Deklarasi Independensi Personel ({teamMembers.length} Anggota Tim)
          </h3>
          <span className="text-[11px] text-slate-500">
            Entitas Klien: <strong className="text-slate-700">{activeClient.namaKlien}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="py-2 px-3 text-left font-semibold">Nama Personel</th>
                <th className="py-2 px-3 text-left font-semibold w-28">Peran</th>
                <th className="py-2 px-2.5 text-left font-semibold w-32">Status</th>
                <th className="py-2 px-2.5 text-left font-semibold w-36">Metode TTD</th>
                <th className="py-2 px-2.5 text-left font-semibold w-36">Tanggal TTD</th>
                <th className="py-2 px-2.5 text-center font-semibold w-24">Bebas Konflik</th>
                <th className="py-2 px-3 text-left font-semibold">Catatan Konflik / Penjelasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {teamMembers.map((tm) => {
                const u = state.users.find((x) => x.id === tm.userId);
                const decl = a150Declarations.find((d) => d.userId === tm.userId) ?? {
                  userId: tm.userId,
                  statusDeklarasi: 'Pending' as const,
                  isConflictFree: true,
                  catatanKonflik: '',
                };

                return (
                  <tr key={tm.userId} className="hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900">
                        {u?.namaLengkap ?? tm.userId}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {u?.nomorRegistrasi ?? '-'}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-700">{tm.peranTim}</td>
                    <td className="py-2 px-2.5">
                      <select
                        aria-label={`Status deklarasi ${u?.namaLengkap ?? tm.userId}`}
                        data-testid={`a150-status-${tm.userId}`}
                        disabled={isReadOnly}
                        value={decl.statusDeklarasi}
                        onChange={(e) => {
                          const status = e.target.value as A150IndependenceDeclaration['statusDeklarasi'];
                          dispatchAction({
                            type: 'UPDATE_A150_DECLARATION',
                            userId: tm.userId,
                            patch: {
                              statusDeklarasi: status,
                              metodeTandatangan:
                                status === 'Signed'
                                  ? decl.metodeTandatangan ?? 'Digital PIN'
                                  : decl.metodeTandatangan,
                              tanggalTandatangan:
                                status === 'Signed'
                                  ? decl.tanggalTandatangan ?? todayIso
                                  : decl.tanggalTandatangan,
                            },
                          });
                        }}
                        className={`w-full h-8 px-2 text-xs rounded border font-semibold disabled:bg-slate-100 ${
                          decl.statusDeklarasi === 'Signed'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : decl.statusDeklarasi === 'Declined'
                              ? 'bg-rose-50 border-rose-300 text-rose-800'
                              : 'bg-amber-50 border-amber-300 text-amber-800'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Signed">Signed</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </td>
                    <td className="py-2 px-2.5">
                      <select
                        aria-label={`Metode TTD ${u?.namaLengkap ?? tm.userId}`}
                        disabled={isReadOnly}
                        value={decl.metodeTandatangan ?? 'Digital PIN'}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_A150_DECLARATION',
                            userId: tm.userId,
                            patch: {
                              metodeTandatangan: e.target
                                .value as A150IndependenceDeclaration['metodeTandatangan'],
                            },
                          })
                        }
                        className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
                      >
                        <option value="Digital PIN">Digital PIN</option>
                        <option value="E-Signature">E-Signature</option>
                        <option value="Upload Basah">Upload Basah</option>
                      </select>
                    </td>
                    <td className="py-2 px-2.5">
                      <input
                        type="date"
                        aria-label={`Tanggal TTD ${u?.namaLengkap ?? tm.userId}`}
                        disabled={isReadOnly}
                        value={decl.tanggalTandatangan ?? ''}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_A150_DECLARATION',
                            userId: tm.userId,
                            patch: { tanggalTandatangan: e.target.value },
                          })
                        }
                        className="w-full h-8 px-2 text-xs font-mono bg-white border border-slate-300 rounded disabled:bg-slate-100"
                      />
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Bebas konflik ${u?.namaLengkap ?? tm.userId}`}
                        disabled={isReadOnly}
                        checked={decl.isConflictFree}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_A150_DECLARATION',
                            userId: tm.userId,
                            patch: { isConflictFree: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded accent-emerald-700 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={decl.catatanKonflik}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPDATE_A150_DECLARATION',
                            userId: tm.userId,
                            patch: { catatanKonflik: e.target.value },
                          })
                        }
                        placeholder={decl.isConflictFree ? 'Nihil konflik' : 'Uraikan benturan & safeguard...'}
                        className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checklist 4 Klausul A150 */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <th className="py-2 px-3 text-left font-semibold w-14">Klausul</th>
              <th className="py-2 px-3 text-left font-semibold">Reviu Kepatuhan Form Pernyataan Independensi</th>
              <th className="py-2 px-3 text-center font-semibold w-24">Terpenuhi</th>
              <th className="py-2 px-3 text-left font-semibold w-56">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {clauses.map((c) => (
              <tr key={c.kodeKlausul}>
                <td className="py-2 px-3 font-mono font-semibold text-slate-700">{c.kodeKlausul}</td>
                <td className="py-2 px-3 text-slate-800">{c.uraianKlausul}</td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={c.isCompliant}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_LEGAL_CLAUSE',
                        kodeIndeks: 'A150',
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
                        kodeIndeks: 'A150',
                        kodeKlausul: c.kodeKlausul,
                        patch: { catatan: e.target.value },
                      })
                    }
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
