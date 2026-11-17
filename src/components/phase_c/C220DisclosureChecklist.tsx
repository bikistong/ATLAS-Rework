import React, { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getFrameworkCodeForSak } from '../../data/cModuleCatalog';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';

const PAGE_SIZE = 25;

export const C220DisclosureChecklist: React.FC = () => {
  const { activeEngagement, activeClient, dispatchAction } = useAtlas();
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Ada' | 'Tidak Ada' | 'NA'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const readOnly = activeEngagement ? isWorkpaperReadOnly(activeEngagement, 'C220') : true;
  const items = activeEngagement?.moduleC.c220Disclosures ?? [];

  const expectedCode = activeClient ? getFrameworkCodeForSak(activeClient.sakDigunakan) : 'C220B';
  const currentCode = items[0]?.frameworkCode ?? expectedCode;

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.topicCategory) set.add(item.topicCategory);
    }
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (topicFilter !== 'ALL' && item.topicCategory !== topicFilter) return false;
      if (statusFilter !== 'ALL' && item.responseStatus !== statusFilter) return false;
      if (
        q &&
        !item.questionText.toLowerCase().includes(q) &&
        !item.standardReference.toLowerCase().includes(q) &&
        !item.topicCategory.toLowerCase().includes(q) &&
        !item.itemNumber.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [items, topicFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!activeEngagement || !activeClient) return null;

  const adaCount = items.filter((i) => i.responseStatus === 'Ada').length;
  const tidakAdaCount = items.filter((i) => i.responseStatus === 'Tidak Ada').length;
  const naCount = items.filter((i) => i.responseStatus === 'NA').length;

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Framework Header Banner */}
      <div className="bg-white border border-slate-200 rounded p-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              data-testid="c220-framework-badge"
              className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-[11px] font-bold"
            >
              {currentCode}
            </span>
            <h2 className="text-xs font-bold text-slate-800">
              Checklist Pengungkapan CaLK Aktif: {activeClient.sakDigunakan}
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total {items.length} butir pengungkapan ·{' '}
            <span className="text-emerald-700 font-semibold">{adaCount} Ada</span> ·{' '}
            <span className="text-rose-700 font-semibold">{tidakAdaCount} Tidak Ada</span> ·{' '}
            <span className="text-slate-600">{naCount} N/A</span>
          </p>
        </div>

        {currentCode !== expectedCode && (
          <button
            type="button"
            disabled={readOnly}
            onClick={() => dispatchAction({ type: 'SYNC_C220_FRAMEWORK' })}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkronkan ke {expectedCode}</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 flex flex-wrap items-center gap-2.5">
        <select
          aria-label="Filter topik pengungkapan CaLK"
          value={topicFilter}
          onChange={(e) => {
            setTopicFilter(e.target.value);
            setPage(1);
          }}
          className="h-8 px-2 text-xs bg-white border border-slate-300 rounded max-w-xs"
        >
          <option value="ALL">Semua Topik ({topics.length})</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter status kelengkapan"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'ALL' | 'Ada' | 'Tidak Ada' | 'NA');
            setPage(1);
          }}
          className="h-8 px-2 text-xs bg-white border border-slate-300 rounded"
        >
          <option value="ALL">Semua Status</option>
          <option value="Ada">Ada</option>
          <option value="Tidak Ada">Tidak Ada</option>
          <option value="NA">NA</option>
        </select>

        <input
          type="text"
          data-testid="c220-search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari butir pengungkapan atau referensi SAK..."
          aria-label="Cari pengungkapan CaLK"
          className="flex-1 min-w-[220px] h-8 px-2.5 text-xs bg-white border border-slate-300 rounded"
        />

        <span className="text-[11px] font-mono text-slate-500">
          Menampilkan {filtered.length} butir
        </span>
      </div>

      {/* Checklist Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2 px-3 text-center w-14">No</th>
                <th className="py-2 px-3 text-left w-44">Topik / Ref. SAK</th>
                <th className="py-2 px-3 text-left">Butir Pertanyaan Pengungkapan CaLK</th>
                <th className="py-2 px-3 text-center w-36">Status</th>
                <th className="py-2 px-3 text-left w-44">Ref. Catatan CaLK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-center font-mono text-slate-500">
                    {item.itemNumber}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-semibold text-slate-700 text-[11px]">
                      {item.topicCategory}
                    </div>
                    <div className="font-mono text-[10px] text-indigo-700 mt-0.5">
                      {item.standardReference}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-slate-800 leading-relaxed">{item.questionText}</td>
                  <td className="py-2 px-3 text-center">
                    <select
                      disabled={readOnly}
                      aria-label={`Status CaLK butir ${item.itemNumber}`}
                      value={item.responseStatus}
                      onChange={(e) =>
                        dispatchAction({
                          type: 'UPDATE_C220_ITEM',
                          itemId: item.id,
                          patch: {
                            responseStatus: e.target.value as 'Ada' | 'Tidak Ada' | 'NA',
                          },
                        })
                      }
                      className={`h-7 px-2 text-xs border rounded disabled:bg-slate-100 ${
                        item.responseStatus === 'Tidak Ada'
                          ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
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
                      aria-label={`Referensi CaLK butir ${item.itemNumber}`}
                      value={item.calkReferenceNote}
                      onChange={(e) =>
                        dispatchAction({
                          type: 'UPDATE_C220_ITEM',
                          itemId: item.id,
                          patch: { calkReferenceNote: e.target.value },
                        })
                      }
                      placeholder="mis. Catatan 4"
                      className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-600">
            Halaman <span className="font-mono font-semibold">{safePage}</span> dari{' '}
            <span className="font-mono font-semibold">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
