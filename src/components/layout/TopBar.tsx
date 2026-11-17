import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  Download,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  Search,
  Upload,
} from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import {
  buildPortableBundle,
  exportAtlasBundleFile,
  parseAtlasPortableBundle,
} from '../../store/storageAdapter';
import { formatDurationHms } from '../../utils/formatters';
import { AuditPhase } from '../../types/atlas';

interface TopBarProps {
  onOpenCommandPalette: () => void;
  onTriggerImportModal: (bundleRaw: string) => void;
}

function inferAuditPhase(kodeIndeks: string): AuditPhase {
  if (kodeIndeks.startsWith('C')) return 'Pelaporan';
  if (kodeIndeks.startsWith('B') || kodeIndeks.startsWith('L')) return 'Respon Risiko';
  return 'PraPerikatan & Penilaian Risiko';
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenCommandPalette,
  onTriggerImportModal,
}) => {
  const {
    state,
    activeUser,
    activeEngagement,
    activeClient,
    uiPrefs,
    exitToHub,
    toggleSidebarCollapsed,
    saveStatus,
    dispatchAction,
    showToast,
  } = useAtlas();

  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerStartRef = useRef<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const handleToggleTimer = () => {
    if (!timerRunning) {
      timerStartRef.current = new Date().toISOString();
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
      if (activeEngagement && elapsedSeconds > 0) {
        const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
        dispatchAction({
          type: 'LOG_TIME',
          kodeIndeks: uiPrefs.activeIndex,
          tahapan: inferAuditPhase(uiPrefs.activeIndex),
          durasiMenit: minutes,
          waktuMulai: timerStartRef.current ?? new Date().toISOString(),
          waktuSelesai: new Date().toISOString(),
          keterangan: `Sesi kerja (${formatDurationHms(elapsedSeconds)})`,
        });
      }
      setElapsedSeconds(0);
      timerStartRef.current = null;
    }
  };

  const handleExportBundle = () => {
    if (!activeEngagement || !activeClient) {
      showToast('warning', 'Pilih atau buat perikatan aktif terlebih dahulu sebelum ekspor.');
      return;
    }
    const bundle = buildPortableBundle({
      kapProfile: state.kapProfile,
      users: state.users,
      client: activeClient,
      workspace: activeEngagement,
      exportedBy: `${activeUser.namaLengkap} (${activeUser.role})`,
    });
    const filename = exportAtlasBundleFile(bundle);
    showToast('success', `Berkas arsip "${filename}" berhasil diunduh.`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      try {
        parseAtlasPortableBundle(content);
        onTriggerImportModal(content);
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : 'File .atlas.json tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-12 bg-slate-900 text-white border-b border-slate-800 px-3 flex items-center justify-between gap-2 shrink-0 select-none">
      {/* Left: Sidebar Toggle, Brand, Hub Back Button & Active Engagement */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          aria-label={uiPrefs.sidebarCollapsed ? 'Tampilkan Sidebar Indeks' : 'Sembunyikan Sidebar Indeks'}
          title={uiPrefs.sidebarCollapsed ? 'Tampilkan Sidebar Indeks' : 'Sembunyikan Sidebar Indeks'}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {uiPrefs.sidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => exitToHub('perikatan')}
          title="Kembali ke Engagement Hub"
          className="flex items-center gap-2 pr-1 cursor-pointer shrink-0 group"
        >
          <span className="w-7 h-7 rounded bg-indigo-600 group-hover:bg-indigo-500 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs transition-colors">
            A
          </span>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
            ATLAS-Web
          </span>
        </button>

        <span className="text-slate-700 hidden sm:inline">/</span>

        <button
          type="button"
          data-testid="btn-back-to-hub"
          onClick={() => exitToHub('perikatan')}
          title="Kembali ke Engagement Hub"
          className="h-7 px-2.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Hub</span>
        </button>

        {activeEngagement && activeClient && (
          <div className="flex items-center gap-2 min-w-0 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/80">
            <span className="font-medium text-xs text-slate-100 truncate max-w-[170px] sm:max-w-[230px]">
              {activeClient.namaKlien}
            </span>
            <span className="text-slate-600 hidden md:inline">·</span>
            <span className="font-mono text-[11px] text-slate-300 hidden md:inline shrink-0">
              {activeEngagement.header.tahunBuku}
            </span>
            <span className="hidden lg:inline-flex text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 font-semibold shrink-0 whitespace-nowrap">
              {activeClient.sakDigunakan}
            </span>
          </div>
        )}
      </div>

      {/* Center: Command Palette Trigger & Live Timer */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          data-testid="command-palette-trigger"
          className="flex items-center gap-2.5 px-2.5 h-8 rounded bg-slate-800/90 border border-slate-700 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Cari KKP...</span>
          </span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 shrink-0">
            Ctrl+K
          </kbd>
        </button>

        <div className="flex items-center bg-slate-800 border border-slate-700 rounded h-8 overflow-hidden shrink-0">
          <div className="px-2.5 flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-mono text-[11px] font-semibold text-indigo-300">
              {uiPrefs.activeIndex}
            </span>
            <span
              data-testid="live-timer-display"
              className="font-mono text-xs tabular-nums font-semibold text-white"
            >
              {formatDurationHms(elapsedSeconds)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleTimer}
            data-testid="live-timer-toggle"
            aria-label={timerRunning ? 'Jeda & Catat Timer' : 'Mulai Timer Kerja'}
            title={timerRunning ? 'Hentikan & Catat Jam Kerja ke KKP' : 'Mulai Timer Kerja Audit'}
            className={`h-full px-2.5 flex items-center gap-1 text-[11px] font-medium border-l border-slate-700 transition-colors cursor-pointer whitespace-nowrap ${
              timerRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
            }`}
          >
            {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Right: Auto-Save, Import/Export, Dynamic User Switcher */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div
          className="hidden xl:flex items-center gap-1 px-1.5 py-1 text-[11px] text-slate-300 whitespace-nowrap"
          data-testid="autosave-indicator"
          title={saveStatus === 'saving' ? 'Menyimpan ke IndexedDB...' : 'Tersimpan otomatis di IndexedDB'}
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Tersimpan</span>
            </>
          )}
        </div>

        {/* Dynamic User Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded h-8 px-2 shrink-0">
          <span className="w-5 h-5 rounded bg-indigo-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
            {activeUser.inisial}
          </span>
          <label htmlFor="atlas-user-switcher" className="sr-only">
            Ganti Pengguna Aktif
          </label>
          <select
            id="atlas-user-switcher"
            data-testid="user-switcher"
            value={state.activeUserId}
            onChange={(e) => dispatchAction({ type: 'SWITCH_USER', userId: e.target.value })}
            className="bg-transparent text-xs text-slate-100 font-medium focus:outline-none cursor-pointer pr-1 max-w-[145px]"
          >
            {state.users
              .filter((u) => u.isActive)
              .map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                  {u.role} ({u.inisial})
                </option>
              ))}
          </select>
        </div>

        <input
          ref={importInputRef}
          type="file"
          accept=".json,.atlas.json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Impor file .atlas.json"
        />
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          title="Import Arsip .atlas.json"
          className="h-8 px-2.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">Import</span>
        </button>

        <button
          type="button"
          onClick={handleExportBundle}
          data-testid="export-atlas-btn"
          title="Export Perikatan Aktif (.atlas.json)"
          className="h-8 px-2.5 rounded bg-indigo-700 hover:bg-indigo-800 text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">.atlas.json</span>
        </button>
      </div>
    </header>
  );
};
