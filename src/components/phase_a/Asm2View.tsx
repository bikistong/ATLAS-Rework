import React, { useMemo } from 'react';
import { getWorksheet } from '../../data/blueprintLoader';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { formatAuditNumber, formatIdDate } from '../../utils/formatters';
import { calculateTeamBudgetTotals } from '../../utils/timeCalculator';

export const Asm2View: React.FC = () => {
  const { activeEngagement, activeClient, dispatchAction } = useAtlas();

  const blueprintChecklistSections = useMemo(() => {
    const ws = getWorksheet('part1', 'ASM (2)');
    if (!ws) return [];
    const sections: { number: string; title: string; bullets: string[] }[] = [];
    let current: { number: string; title: string; bullets: string[] } | null = null;

    for (const r of ws.non_empty_rows) {
      if (r.row < 10 || r.row > 54) continue;
      const numCell = r.cells.find((c) => c.cell.startsWith('E'))?.value?.trim();
      const textCell = r.cells.find((c) => c.cell.startsWith('F'))?.value?.trim();
      if (!textCell) continue;
      if (numCell && ['1', '2', '3', '4'].includes(numCell)) {
        current = { number: numCell, title: textCell, bullets: [] };
        sections.push(current);
      } else if (current) {
        current.bullets.push(textCell);
      }
    }
    return sections;
  }, []);

  if (!activeEngagement || !activeClient) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'ASM2');
  const wp = activeEngagement.workingPapers['ASM2'];
  const { header, a110, a120, teamMembers } = activeEngagement;
  const budget = calculateTeamBudgetTotals(teamMembers, a120.hariEfektif * a120.jamPerHari);

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          SA 300 PAR. 7–10 · STRATEGI AUDIT KESELURUHAN (AWAL)
        </div>
        <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
          ASM2 — Audit Strategy Memorandum (ASM Awal Pra-Perikatan)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Merangkum ruang lingkup, pelaporan, faktor risiko awal (A110), dan sumber daya (A120) sesuai struktur ASM (2) ATLAS.
        </p>

        {/* Ringkasan Otomatis Strategi Awal */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Kerangka Pelaporan</div>
            <div className="text-xs font-semibold text-slate-900 mt-0.5">{activeClient.sakDigunakan}</div>
            <div className="text-[11px] text-slate-500">{header.tipePerikatan}</div>
          </div>
          <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Target Penyelesaian LAI</div>
            <div className="text-xs font-mono font-semibold text-slate-900 mt-0.5">
              {formatIdDate(header.tanggalLaporanAuditor)}
            </div>
            <div className="text-[11px] text-slate-500">{a120.hariEfektif} Hari Kerja Efektif</div>
          </div>
          <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Risiko Penerimaan (A110)</div>
            <div
              className={`text-xs font-mono font-bold mt-0.5 ${
                a110.ringkasanRisikoGabungan === 'High' ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {a110.ringkasanRisikoGabungan} Risk · {a110.keputusanPenerimaan}
            </div>
            <div className="text-[11px] text-slate-500">EQCR: {a120.isEqcrRequired ? 'Wajib' : 'Tidak Wajib'}</div>
          </div>
          <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Sumber Daya & Anggaran</div>
            <div className="text-xs font-mono font-semibold text-slate-900 mt-0.5">
              {teamMembers.length} Personel · {formatAuditNumber(budget.grandTotalJam)} Jam
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Rp {formatAuditNumber(budget.grandTotalHonorarium)}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Dimensi SA 300 dari Blueprint ASM (2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {blueprintChecklistSections.map((sec) => (
          <div key={sec.number} className="bg-white border border-slate-200 rounded p-3.5">
            <div className="text-xs font-semibold text-slate-900 pb-2 border-b border-slate-200">
              {sec.number}. {sec.title}
            </div>
            <ul className="mt-2 space-y-1 text-[11px] text-slate-600 list-disc pl-4">
              {sec.bullets.slice(0, 6).map((b, i) => (
                <li key={i}>{b.replace(/^•\s*/, '')}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Narasi Strategi Audit Awal Auditor */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <label
          htmlFor="asm2-catatan"
          className="block text-xs font-semibold text-slate-800 mb-1"
        >
          Catatan Strategi Audit Awal & Penekanan Sikap Skeptisisme Profesional (ASM2)
        </label>
        <textarea
          id="asm2-catatan"
          disabled={isReadOnly}
          rows={4}
          value={wp?.catatanSimpulan ?? ''}
          onChange={(e) =>
            dispatchAction({
              type: 'UPDATE_WORKPAPER_NOTES',
              kodeIndeks: 'ASM2',
              catatanSimpulan: e.target.value,
            })
          }
          placeholder="Uraikan strategi audit awal: ruang lingkup lokasi/komponen, fokus risiko tinggi awal, serta koordinasi jadwal pelaporan..."
          className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100"
        />
      </div>
    </div>
  );
};
