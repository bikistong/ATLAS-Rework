import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search, X } from 'lucide-react';
import { MASTER_INDICES } from '../../data/masterIndices';
import { useAtlas } from '../../store/AtlasContext';
import { isIndexVisibleForWorkspace } from '../../utils/formatters';
import { WorkpaperStatusIcon } from './StatusIcon';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const { activeEngagement, activeClient, setActiveIndex } = useAtlas();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const seen = new Set<string>();
    const combined = MASTER_INDICES.map((item) => {
      seen.add(item.kodeIndeks);
      return item;
    });

    if (activeEngagement) {
      for (const wp of Object.values(activeEngagement.workingPapers)) {
        if (seen.has(wp.kodeIndeks)) continue;
        seen.add(wp.kodeIndeks);
        combined.push({
          kodeIndeks: wp.kodeIndeks,
          namaIndeks: wp.namaIndeks,
          partGroup: wp.partGroup,
          parentIndeks: wp.parentIndeks,
          urutan: wp.urutan,
          isConditional: wp.isConditional,
          saRelevan: wp.saRelevan,
        });
      }
      for (const ls of Object.values(activeEngagement.leadSchedules)) {
        if (seen.has(ls.leadCode)) continue;
        seen.add(ls.leadCode);
        combined.push({
          kodeIndeks: ls.leadCode,
          namaIndeks: ls.title,
          partGroup: 'Part4',
          parentIndeks: null,
          urutan: 600,
          isConditional: false,
          saRelevan: 'SA 500, SA 530',
        });
      }
    }

    return combined
      .filter((item) => {
        if (
          item.isConditional &&
          !isIndexVisibleForWorkspace(
            item.kodeIndeks,
            activeEngagement,
            activeClient?.statusKepemilikan
          )
        ) {
          return false;
        }
        if (!q) return true;
        return (
          item.kodeIndeks.toLowerCase().includes(q) ||
          item.namaIndeks.toLowerCase().includes(q) ||
          (item.saRelevan?.toLowerCase().includes(q) ?? false)
        );
      })
      .slice(0, 18);
  }, [activeEngagement, activeClient?.statusKepemilikan, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  const handleSelect = (kodeIndeks: string) => {
    setActiveIndex(kodeIndeks);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length === 0 ? 0 : (prev + 1) % results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length === 0 ? 0 : (prev - 1 + results.length) % results.length
      );
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].kodeIndeks);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette Navigasi Indeks KKP"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-slate-300 rounded-sm shadow-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 bg-slate-50">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            data-testid="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik kode indeks (A110, A210, B100, L05, C400) atau nama KKP..."
            className="flex-1 text-sm bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Command Palette"
            className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-slate-500">
              Tidak ditemukan indeks yang cocok dengan "{query}".
            </li>
          ) : (
            results.map((item, idx) => {
              const wp = activeEngagement?.workingPapers[item.kodeIndeks];
              const isSelected = idx === selectedIndex;

              return (
                <li key={item.kodeIndeks}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item.kodeIndeks)}
                    className={`w-full px-3.5 py-2 flex items-center justify-between gap-2 text-left cursor-pointer ${
                      isSelected ? 'bg-indigo-50 text-indigo-950' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {wp ? (
                        <WorkpaperStatusIcon status={wp.status} />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-sm bg-slate-200 text-slate-700 font-mono text-[9px] font-bold flex items-center justify-center shrink-0">
                          D
                        </span>
                      )}
                      <span className="font-mono text-xs font-bold text-slate-800 w-16 shrink-0">
                        {item.kodeIndeks}
                      </span>
                      <span className="text-[13px] truncate">{item.namaIndeks}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-500">
                      {item.saRelevan && <span className="font-mono">{item.saRelevan}</span>}
                      {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-indigo-700" />}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Gunakan ↑ ↓ untuk memilih, Enter untuk membuka</span>
          <span className="font-mono">Esc tutup</span>
        </div>
      </div>
    </div>
  );
};
