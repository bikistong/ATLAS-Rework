import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Paperclip, Save } from 'lucide-react';
import { getWorksheet } from '../../data/blueprintLoader';
import { MASTER_INDICES } from '../../data/masterIndices';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { formatAuditNumber } from '../../utils/formatters';

interface Sprint0WorkpaperViewProps {
  kodeIndeks: string;
}

export const Sprint0WorkpaperView: React.FC<Sprint0WorkpaperViewProps> = ({ kodeIndeks }) => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const wp = activeEngagement?.workingPapers[kodeIndeks];
  const isReadOnly = isWorkpaperReadOnly(activeEngagement, kodeIndeks);
  const meta = MASTER_INDICES.find((m) => m.kodeIndeks === kodeIndeks);

  const [notes, setNotes] = useState(wp?.catatanSimpulan ?? '');

  useEffect(() => {
    setNotes(wp?.catatanSimpulan ?? '');
  }, [kodeIndeks, wp?.catatanSimpulan]);

  const guide = useMemo(() => {
    const ws = getWorksheet('part0', 'Petunjuk Isi');
    if (!ws) return null;
    const normalized = kodeIndeks.toLowerCase();
    for (const row of ws.non_empty_rows) {
      const b = row.cells.find((c) => c.cell.startsWith('B'))?.value ?? '';
      const cleanB = b.replace(/\./g, '').toLowerCase();
      if (b.toLowerCase() === normalized || cleanB === normalized) {
        return {
          tujuan: row.cells.find((c) => c.cell.startsWith('D'))?.value ?? '',
          petunjuk: row.cells.find((c) => c.cell.startsWith('E'))?.value ?? '',
        };
      }
    }
    return null;
  }, [kodeIndeks]);

  if (!activeEngagement || !wp) {
    return (
      <div className="max-w-4xl mx-auto border border-slate-200 bg-white rounded p-4 text-xs text-slate-600">
        Pilih atau buat perikatan aktif melalui Hub Perikatan untuk membuka kertas kerja ini.
      </div>
    );
  }

  const leadSchedule = activeEngagement.leadSchedules[kodeIndeks];
  const attachmentsForIndex = activeEngagement.attachments.filter(
    (a) => a.kodeIndeks === kodeIndeks
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchAction({
      type: 'UPDATE_WORKPAPER_NOTES',
      kodeIndeks,
      catatanSimpulan: notes,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Contextual State Preview initialized by initializeNewEngagement */}
      {kodeIndeks === 'A210' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border border-slate-200 bg-white rounded p-3">
            <p className="text-[11px] uppercase text-slate-500 font-semibold">
              Acuan Saldo ({activeEngagement.a210.acuanSaldo})
            </p>
            <p className="mt-1 text-base font-mono font-bold text-slate-900 tabular-nums text-right">
              {formatAuditNumber(activeEngagement.a210.nilaiSaldoAcuan)}
            </p>
          </div>
          <div className="border border-slate-200 bg-white rounded p-3">
            <p className="text-[11px] uppercase text-slate-500 font-semibold">
              Overall Materiality ({activeEngagement.a210.marginOmPersen}%)
            </p>
            <p className="mt-1 text-base font-mono font-bold text-indigo-800 tabular-nums text-right">
              {formatAuditNumber(activeEngagement.a210.nilaiOm)}
            </p>
          </div>
          <div className="border border-slate-200 bg-white rounded p-3">
            <p className="text-[11px] uppercase text-slate-500 font-semibold">
              Performance Materiality ({activeEngagement.a210.marginPmPersen}%)
            </p>
            <p className="mt-1 text-base font-mono font-bold text-slate-900 tabular-nums text-right">
              {formatAuditNumber(activeEngagement.a210.nilaiPm)}
            </p>
          </div>
        </div>
      )}

      {leadSchedule && (
        <div className="border border-slate-200 bg-white rounded overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">
              Lead Schedule {leadSchedule.leadCode} — {leadSchedule.title} ({leadSchedule.accountCategory})
            </span>
            <span className="font-mono text-slate-600">
              Normal: {leadSchedule.normalBalance} · {leadSchedule.procedures.length} Prosedur Baku
            </span>
          </div>
          <div className="p-3 text-xs text-slate-700 space-y-1.5">
            {leadSchedule.procedures.map((proc) => (
              <div key={proc.id} className="flex items-start gap-2">
                <span className="font-mono font-semibold text-slate-500">
                  {proc.procedureNumber}.
                </span>
                <span>
                  <strong className="text-slate-800">[{proc.procedureType}]</strong>{' '}
                  {proc.procedureText}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official ATLAS Guide */}
      {guide && (
        <div className="border border-slate-200 bg-white rounded p-3.5 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
            <span>Panduan Standar Indeks {kodeIndeks} ({meta?.saRelevan ?? 'SPAP'})</span>
          </div>
          {guide.tujuan && (
            <p className="text-slate-700">
              <strong>Tujuan:</strong> {guide.tujuan}
            </p>
          )}
          {guide.petunjuk && (
            <p className="text-slate-600 leading-relaxed">
              <strong>Petunjuk:</strong> {guide.petunjuk}
            </p>
          )}
        </div>
      )}

      {/* Editable Documentation Form (Protected by SA 230 Lock Guard) */}
      <form
        onSubmit={handleSave}
        className="border border-slate-200 bg-white rounded overflow-hidden"
      >
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Catatan Simpulan & Dokumentasi Kertas Kerja ({kodeIndeks})
            </h2>
          </div>
          <button
            type="submit"
            data-testid="btn-save-workpaper"
            disabled={isReadOnly}
            className="h-8 px-3 rounded bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan KKP
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label
              htmlFor="workpaper-notes-input"
              className="block text-[11px] font-medium text-slate-700 mb-1"
            >
              Simpulan Audit & Penjelasan Tambahan
            </label>
            <textarea
              id="workpaper-notes-input"
              data-testid="workpaper-notes-input"
              rows={5}
              disabled={isReadOnly}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan hasil analisis, pertimbangan profesional auditor, atau simpulan sementara untuk kertas kerja ini..."
              className="w-full p-2.5 text-[13px] border border-slate-300 rounded focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Lampiran pada indeks {kodeIndeks}:{' '}
                <strong className="font-mono">{attachmentsForIndex.length}</strong> berkas
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveIndex('Daftar Lampiran')}
              className="text-indigo-700 hover:underline font-medium cursor-pointer"
            >
              Kelola di Daftar Lampiran →
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
