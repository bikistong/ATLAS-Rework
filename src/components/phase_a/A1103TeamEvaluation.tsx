import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import {
  A1103TeamEvaluation,
  ClientGovernanceItem,
  UserRole,
} from '../../types/atlas';
import { computeA1103Risk, isPersonCompetentAndAvailable } from '../../utils/a1Formulas';

const GOVERNANCE_CATEGORIES: ClientGovernanceItem['kategoriJabatan'][] = [
  'Pemegang Saham',
  'Komisaris',
  'Direksi',
  'Manajemen Kunci',
];

const ROLES: UserRole[] = ['Partner', 'Manager', 'Ketua Tim', 'Anggota Tim'];

export const A1103TeamEvaluationView: React.FC = () => {
  const { state, activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const [activeTab, setActiveTab] = useState<'A1103A' | 'A1103B'>('A1103A');
  const [govCategory, setGovCategory] =
    useState<ClientGovernanceItem['kategoriJabatan']>('Direksi');
  const [govName, setGovName] = useState('');
  const [govRoleDetail, setGovRoleDetail] = useState('');

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A1103');
  const { a1103, governanceStructures } = activeEngagement;
  const overallRisk = computeA1103Risk(a1103);

  const updateRow = (userId: string, patch: Partial<A1103TeamEvaluation>) => {
    const nextRows = a1103.map((r) => (r.userId === userId ? { ...r, ...patch } : r));
    dispatchAction({ type: 'UPDATE_A1103', rows: nextRows });
  };

  const handleAddPerson = (userId: string) => {
    if (!userId || a1103.some((r) => r.userId === userId) || a1103.length >= 15) return;
    const u = state.users.find((x) => x.id === userId);
    if (!u) return;
    const newRow: A1103TeamEvaluation = {
      userId: u.id,
      pengalamanTahun: 2,
      kompetensiEntitas: 'Memadai',
      kompetensiSpap: 'Memadai',
      kompetensiRegulasi: 'Memadai',
      kompetensiTi: 'Memadai',
      kompetensiPelaporan: 'Memadai',
      isCuti: false,
      isResign: false,
      isPhk: false,
      isAkhirKontrak: false,
      isPerikatanLain: false,
      isBatasanLain: false,
      ancamanKeuangan: false,
      ancamanPekerjaan: false,
      ancamanKeluarga: false,
      ancamanNonAudit: false,
      isSelected: true,
      peranTim: u.role,
      inisial: u.inisial,
    };
    dispatchAction({ type: 'UPDATE_A1103', rows: [...a1103, newRow] });
  };

  const availablePoolUsers = state.users.filter(
    (u) => u.isActive && !a1103.some((r) => r.userId === u.id)
  );

  const handleAddGovernance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!govName.trim()) return;
    dispatchAction({
      type: 'UPSERT_GOVERNANCE_ITEM',
      item: {
        id: `gov-${Date.now()}`,
        kategoriJabatan: govCategory,
        namaPejabat: govName.trim(),
        jabatanPersentase: govRoleDetail.trim() || '-',
      },
    });
    setGovName('');
    setGovRoleDetail('');
  };

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            SA 220 · SPM 1 · KOMPETENSI, WAKTU & INDEPENDENSI TIM
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
            A1103 — Evaluasi Kompetensi, Ketersediaan Waktu (A1103A) & Independensi Tim (A1103B)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            data-testid="a1103-risk-badge"
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
              overallRisk === 'High'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            Risiko Tim: {overallRisk} ({a1103.filter((r) => r.isSelected).length} Terpilih)
          </span>
          <button
            type="button"
            onClick={() => setActiveIndex('A110')}
            className="h-8 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            A110
          </button>
        </div>
      </div>

      {/* Sequential Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            data-testid="tab-a1103a"
            onClick={() => setActiveTab('A1103A')}
            className={`h-8 px-3 rounded text-xs font-medium border cursor-pointer ${
              activeTab === 'A1103A'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            1. A1103A — Kompetensi & Ketersediaan Waktu
          </button>
          <button
            type="button"
            data-testid="tab-a1103b"
            onClick={() => setActiveTab('A1103B')}
            className={`h-8 px-3 rounded text-xs font-medium border cursor-pointer ${
              activeTab === 'A1103B'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            2. A1103B — Independensi, Tata Kelola Klien & Penunjukan Tim
          </button>
        </div>

        {availablePoolUsers.length > 0 && a1103.length < 15 && !isReadOnly && (
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Tambah kandidat personel KAP"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleAddPerson(e.target.value);
                e.target.value = '';
              }}
              className="h-8 px-2 text-xs bg-white border border-slate-300 rounded"
            >
              <option value="">+ Tambah Personel KAP (Maks 15)...</option>
              {availablePoolUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.namaLengkap} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'A1103A' ? (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2 px-2.5 text-left font-semibold min-w-[160px]">Personel KAP</th>
                  <th className="py-2 px-2 text-right font-semibold w-20">Pengalaman (Thn)</th>
                  <th className="py-2 px-2 text-left font-semibold">Entitas</th>
                  <th className="py-2 px-2 text-left font-semibold">SPAP</th>
                  <th className="py-2 px-2 text-left font-semibold">Regulasi</th>
                  <th className="py-2 px-2 text-left font-semibold">TI</th>
                  <th className="py-2 px-2 text-left font-semibold">SAK</th>
                  <th className="py-2 px-2 text-center font-semibold">Cuti</th>
                  <th className="py-2 px-2 text-center font-semibold">Resign</th>
                  <th className="py-2 px-2 text-center font-semibold">PHK</th>
                  <th className="py-2 px-2 text-center font-semibold">Kontrak</th>
                  <th className="py-2 px-2 text-center font-semibold">Bentrok</th>
                  <th className="py-2 px-2 text-center font-semibold">Lain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {a1103.map((row) => {
                  const u = state.users.find((x) => x.id === row.userId);
                  return (
                    <tr key={row.userId} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-900">
                          {u?.namaLengkap ?? row.userId}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {row.inisial} · {row.peranTim}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={60}
                          disabled={isReadOnly}
                          value={row.pengalamanTahun}
                          onChange={(e) =>
                            updateRow(row.userId, {
                              pengalamanTahun: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-16 h-7 px-1.5 text-right font-mono tabular-nums border border-slate-300 rounded disabled:bg-slate-100"
                        />
                      </td>
                      {(
                        [
                          'kompetensiEntitas',
                          'kompetensiSpap',
                          'kompetensiRegulasi',
                          'kompetensiTi',
                          'kompetensiPelaporan',
                        ] as const
                      ).map((compKey) => (
                        <td key={compKey} className="py-2 px-1.5">
                          <select
                            disabled={isReadOnly}
                            value={row[compKey]}
                            onChange={(e) =>
                              updateRow(row.userId, {
                                [compKey]: e.target.value as 'Memadai' | 'Kurang Memadai',
                              })
                            }
                            className={`h-7 px-1.5 rounded border text-[11px] disabled:bg-slate-100 ${
                              row[compKey] === 'Kurang Memadai'
                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          >
                            <option value="Memadai">Memadai</option>
                            <option value="Kurang Memadai">Kurang</option>
                          </select>
                        </td>
                      ))}
                      {(
                        [
                          'isCuti',
                          'isResign',
                          'isPhk',
                          'isAkhirKontrak',
                          'isPerikatanLain',
                          'isBatasanLain',
                        ] as const
                      ).map((flagKey) => (
                        <td key={flagKey} className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={row[flagKey]}
                            onChange={(e) => updateRow(row.userId, { [flagKey]: e.target.checked })}
                            className="w-3.5 h-3.5 rounded border-slate-300 accent-rose-600 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Struktur Tata Kelola Klien (Governance Comparison List) */}
          <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Struktur Pengurus, Pemegang Saham & Manajemen Kunci Klien (Pembanding Benturan Kepentingan)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Digunakan sebagai referensi verifikasi independensi antara tim auditor dengan pengurus/pemilik klien.
              </p>
            </div>

            {!isReadOnly && (
              <form onSubmit={handleAddGovernance} className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Kategori Jabatan
                  </label>
                  <select
                    value={govCategory}
                    onChange={(e) =>
                      setGovCategory(e.target.value as ClientGovernanceItem['kategoriJabatan'])
                    }
                    className="h-8 px-2 text-xs bg-white border border-slate-300 rounded"
                  >
                    {GOVERNANCE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Nama Pejabat / Pemegang Saham
                  </label>
                  <input
                    type="text"
                    value={govName}
                    onChange={(e) => setGovName(e.target.value)}
                    placeholder="Contoh: Ir. Hendra Wijaya"
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded"
                  />
                </div>
                <div className="w-52">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Jabatan / % Kepemilikan
                  </label>
                  <input
                    type="text"
                    value={govRoleDetail}
                    onChange={(e) => setGovRoleDetail(e.target.value)}
                    placeholder="Direktur Utama / 40%"
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded"
                  />
                </div>
                <button
                  type="submit"
                  className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Pejabat
                </button>
              </form>
            )}

            {governanceStructures.length === 0 ? (
              <div className="text-xs text-slate-500 py-2">
                Belum ada daftar pemegang saham / pengurus klien yang diinput.
              </div>
            ) : (
              <table className="w-full text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="py-1.5 px-3 text-left font-semibold">Kategori</th>
                    <th className="py-1.5 px-3 text-left font-semibold">Nama Pejabat / Pemilik</th>
                    <th className="py-1.5 px-3 text-left font-semibold">Jabatan / % Saham</th>
                    <th className="py-1.5 px-3 text-right w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {governanceStructures.map((g) => (
                    <tr key={g.id}>
                      <td className="py-1.5 px-3 font-medium text-slate-700">{g.kategoriJabatan}</td>
                      <td className="py-1.5 px-3 text-slate-900">{g.namaPejabat}</td>
                      <td className="py-1.5 px-3 text-slate-600">{g.jabatanPersentase}</td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() =>
                            dispatchAction({ type: 'DELETE_GOVERNANCE_ITEM', itemId: g.id })
                          }
                          aria-label={`Hapus ${g.namaPejabat}`}
                          className="p-1 text-slate-400 hover:text-rose-700 disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Matriks Ancaman Independensi & Penunjukan Tim Final */}
          <div className="bg-white border border-slate-200 rounded overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Uji Ancaman Independensi & Penetapan Tim Final (Tersinkronisasi ke A120, A140 & A150)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="py-2 px-3 text-left font-semibold">Personel</th>
                    <th className="py-2 px-2 text-center font-semibold">Kep. Keuangan</th>
                    <th className="py-2 px-2 text-center font-semibold">Pekerjaan/Jabatan</th>
                    <th className="py-2 px-2 text-center font-semibold">Keluarga</th>
                    <th className="py-2 px-2 text-center font-semibold">Jasa Non-Audit</th>
                    <th className="py-2 px-3 text-center font-semibold">Tugaskan?</th>
                    <th className="py-2 px-3 text-left font-semibold">Peran di Tim</th>
                    <th className="py-2 px-3 text-left font-semibold">Kelayakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {a1103.map((row) => {
                    const u = state.users.find((x) => x.id === row.userId);
                    const layak = isPersonCompetentAndAvailable(row);
                    return (
                      <tr key={row.userId} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {u?.namaLengkap ?? row.userId}
                        </td>
                        {(
                          [
                            'ancamanKeuangan',
                            'ancamanPekerjaan',
                            'ancamanKeluarga',
                            'ancamanNonAudit',
                          ] as const
                        ).map((threatKey) => (
                          <td key={threatKey} className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              disabled={isReadOnly}
                              checked={row[threatKey]}
                              onChange={(e) =>
                                updateRow(row.userId, { [threatKey]: e.target.checked })
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 accent-rose-600 cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            data-testid={`a1103-select-${row.userId}`}
                            disabled={isReadOnly}
                            checked={row.isSelected}
                            onChange={(e) =>
                              updateRow(row.userId, { isSelected: e.target.checked })
                            }
                            className="w-4 h-4 rounded border-slate-300 accent-indigo-700 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            disabled={isReadOnly || !row.isSelected}
                            value={row.peranTim}
                            onChange={(e) =>
                              updateRow(row.userId, { peranTim: e.target.value as UserRole })
                            }
                            className="h-7 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          {layak ? (
                            <span className="text-[11px] font-medium text-emerald-700">
                              Memenuhi Syarat
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700">
                              <AlertTriangle className="w-3 h-3" />
                              Ada Batasan / Ancaman
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
