import React, { useMemo, useState } from 'react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';

export const C210LaiReview: React.FC = () => {
  const { activeEngagement, dispatchAction } = useAtlas();
  const [search, setSearch] = useState('');
  const readOnly = activeEngagement ? isWorkpaperReadOnly(activeEngagement, 'C210') : true;

  const items = activeEngagement?.moduleC.c210LaiReviewItems ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.sectionName.toLowerCase().includes(q) ||
        i.procedureText.toLowerCase().includes(q) ||
        i.saRef.toLowerCase().includes(q)
    );
  }, [items, search]);

  if (!activeEngagement) return null;

  const adaCount = items.filter((i) => i.status === 'Ada').length;
  const tidakAdaCount = items.filter((i) => i.status === 'Tidak Ada').length;

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="bg-white border border-slate-200 rounded p-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800">
            Reviu Bentuk Baku Laporan Auditor Independen (SA 700 / SA 705 / SA 706)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Total {items.length} poin kepatuhan redaksional · {adaCount} Memenuhi · {tidakAdaCount} Tidak Ada
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari poin SA 700/705/706..."
          aria-label="Cari poin reviu LAI C210"
          className="h-8 w-64 px-2.5 text-xs bg-white border border-slate-300 rounded"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="py-2 px-3 text-center w-12">No</th>
              <th className="py-2 px-3 text-left w-44">Seksi LAI</th>
              <th className="py-2 px-3 text-left">Ketentuan Redaksi &amp; Unsur Baku</th>
              <th className="py-2 px-3 text-left w-28">Ref. SA</th>
              <th className="py-2 px-3 text-center w-36">Status</th>
              <th className="py-2 px-3 text-left w-52">Catatan Reviu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <tr key={item.itemNumber} className="hover:bg-slate-50">
                <td className="py-2 px-3 text-center font-mono text-slate-500">
                  {item.itemNumber}
                </td>
                <td className="py-2 px-3 font-medium text-slate-700">{item.sectionName}</td>
                <td className="py-2 px-3 text-slate-800 leading-relaxed">{item.procedureText}</td>
                <td className="py-2 px-3 font-mono text-[11px] text-indigo-700">{item.saRef}</td>
                <td className="py-2 px-3 text-center">
                  <select
                    disabled={readOnly}
                    aria-label={`Status C210 poin ${item.itemNumber}`}
                    value={item.status}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_C210_ITEM',
                        itemNumber: item.itemNumber,
                        patch: { status: e.target.value as 'Ada' | 'Tidak Ada' | 'NA' },
                      })
                    }
                    className="h-7 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
                  >
                    <option value="Ada">Ada</option>
                    <option value="Tidak Ada">Tidak Ada</option>
                    <option value="NA">NA</option>
                  </select>
                </td>
                <td className="py-1.5 px-3">
                  <input
                    type="text"
                    disabled={readOnly}
                    aria-label={`Catatan C210 poin ${item.itemNumber}`}
                    value={item.notes}
                    onChange={(e) =>
                      dispatchAction({
                        type: 'UPDATE_C210_ITEM',
                        itemNumber: item.itemNumber,
                        patch: { notes: e.target.value },
                      })
                    }
                    placeholder="Catatan auditor..."
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
