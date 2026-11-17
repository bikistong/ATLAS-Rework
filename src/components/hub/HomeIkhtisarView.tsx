import React, { useMemo } from 'react';
import { BookOpen, GitBranch, HelpCircle, Paperclip } from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { formatAuditNumber } from '../../utils/formatters';
import {
  computeEngagementProgress,
  computeModuleReadinessRows,
} from '../../utils/hubMetrics';

export const HomeIkhtisarView: React.FC = () => {
  const { state, activeEngagement, activeClient, setActiveIndex } = useAtlas();

  const progress = useMemo(
    () =>
      computeEngagementProgress(
        activeEngagement ?? undefined,
        state.users,
        activeClient?.statusKepemilikan
      ),
    [activeClient?.statusKepemilikan, activeEngagement, state.users]
  );

  const moduleRows = useMemo(() => {
    if (!activeEngagement) return [];
    return computeModuleReadinessRows(activeEngagement, activeClient?.statusKepemilikan);
  }, [activeClient?.statusKepemilikan, activeEngagement]);

  if (!activeEngagement || !activeClient) {
    return (
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-lg p-6 text-xs text-slate-600">
        Pilih perikatan dari Engagement Hub untuk menampilkan Ikhtisar Perikatan.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5" data-testid="workspace-home-ikhtisar">
      <p className="text-xs text-slate-600">
        Ringkasan data entitas, periode buku, kerangka SAK, susunan tim perikatan, serta status penyelesaian seluruh indeks KKP.
      </p>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-[11px] font-medium text-slate-500">Kantor Akuntan Publik</p>
          <p className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
            {state.kapProfile.namaKap}
          </p>
          <p className="mt-1 text-[11px] font-mono text-slate-500">
            {state.kapProfile.kota} · {state.kapProfile.nomorIzinKap}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-[11px] font-medium text-slate-500">Entitas & Tahun Buku</p>
          <p className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
            {activeClient.namaKlien}
          </p>
          <p className="mt-1 text-[11px] font-mono text-slate-500">
            {activeEngagement.header.nomorSuratPerikatan} · TB {activeEngagement.header.tahunBuku}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-[11px] font-medium text-slate-500">Progres Penyelesaian KKP</p>
          <p className="mt-1.5 text-lg font-mono font-bold text-slate-900 tabular-nums">
            {progress.percent}% ({progress.completed}/{progress.total})
          </p>
          <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-[11px] font-medium text-slate-500">
            Materialitas Keseluruhan (SA 320)
          </p>
          <p className="mt-1.5 text-lg font-mono font-bold text-slate-900 tabular-nums">
            Rp {formatAuditNumber(activeEngagement.a210.nilaiOm)}
          </p>
          <p className="mt-1 text-[11px] font-mono text-slate-500 tabular-nums">
            PM: Rp {formatAuditNumber(activeEngagement.a210.nilaiPm)}
          </p>
        </div>
      </div>

      {/* Ikhtisar Kesiapan Modul KKP */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Ikhtisar Kesiapan Modul KKP
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Modul</th>
                <th className="px-4 py-2.5 text-right">Total Indeks</th>
                <th className="px-4 py-2.5 text-right">In Progress</th>
                <th className="px-4 py-2.5 text-right">Prepared</th>
                <th className="px-4 py-2.5 text-right">Reviewed</th>
                <th className="px-4 py-2.5 text-right">Locked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {moduleRows.map((row) => (
                <tr
                  key={row.partGroup}
                  onClick={() => setActiveIndex(row.firstIndex)}
                  className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-indigo-700 mr-2.5">
                      {row.shortCode}
                    </span>
                    <span className="text-slate-700 font-medium">{row.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {row.total}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600 tabular-nums">
                    {row.inProgress}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-blue-600 tabular-nums">
                    {row.prepared}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 tabular-nums">
                    {row.reviewed}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 tabular-nums">
                    {row.locked}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Row: Susunan Tim & Referensi KKP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Susunan Tim Perikatan
            </h3>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {activeEngagement.teamMembers.map((member) => {
              const user = state.users.find((u) => u.id === member.userId);
              return (
                <div
                  key={member.userId}
                  className="px-4 py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {user?.inisial ?? '?'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {user?.namaLengkap ?? member.userId}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {user?.nomorRegistrasi ?? '-'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 shrink-0">
                    {member.peranTim}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Alat Bantu & Referensi KKP
            </h3>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setActiveIndex('Daftar Lampiran')}
              className="p-3 rounded-md border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                <span>Daftar Lampiran</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {activeEngagement.attachments.length} dokumen pendukung terlampir
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveIndex('AuditCycle')}
              className="p-3 rounded-md border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                <span>Siklus Audit</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Peta tahapan standar IAPI ATLAS v2.1
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveIndex('Singkatan')}
              className="p-3 rounded-md border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Daftar Singkatan</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Kamus istilah & asersi SPAP / SA
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveIndex('Petunjuk Isi')}
              className="p-3 rounded-md border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Petunjuk Isi</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Panduan pengisian tiap indeks KKP
              </p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
