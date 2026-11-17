import React, { useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDot,
  Download,
  Lock,
  Plus,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserPlus,
} from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { canArchiveEngagement, canManageMaster } from '../../store/lockGuard';
import {
  buildPortableBundle,
  exportAtlasBundleFile,
  parseAtlasPortableBundle,
} from '../../store/storageAdapter';
import {
  AccountingFramework,
  ClientEntity,
  ClientOwnershipStatus,
  ClientSector,
  EngagementType,
  HubTabId,
  UserProfile,
  UserRole,
} from '../../types/atlas';
import {
  ACCOUNTING_FRAMEWORKS,
  CLIENT_OWNERSHIP_STATUSES,
  CLIENT_SECTORS,
  INDONESIA_PROVINCES,
  getSectorDisplayLabel,
} from '../../utils/formatters';
import {
  SakFilterOption,
  computeEngagementProgress,
  matchesSakFilter,
} from '../../utils/hubMetrics';

interface EngagementHubPortalProps {
  onTriggerImportModal: (bundleRaw: string) => void;
}

const HUB_NAV_TABS: { id: HubTabId; label: string }[] = [
  { id: 'perikatan', label: 'Perikatan' },
  { id: 'klien', label: 'Master Klien' },
  { id: 'personil', label: 'Personil KAP' },
  { id: 'profil', label: 'Profil KAP' },
];

const SAK_FILTERS: { id: SakFilterOption; label: string }[] = [
  { id: 'ALL', label: 'Semua SAK' },
  { id: 'SAK ETAP', label: 'SAK ETAP' },
  { id: 'SAK Umum konvergensi IFRS', label: 'SAK Umum (PSAK)' },
  { id: 'SAK EMKM', label: 'SAK EMKM' },
  { id: 'OTHER', label: 'SAK Lainnya' },
];

export const EngagementHubPortal: React.FC<EngagementHubPortalProps> = ({
  onTriggerImportModal,
}) => {
  const {
    state,
    activeUser,
    activeEngagement,
    activeClient,
    uiPrefs,
    setHubTab,
    enterWorkspace,
    dispatchAction,
    showToast,
  } = useAtlas();

  const activeTab: HubTabId = uiPrefs.hubTab ?? 'perikatan';
  const canManage = canManageMaster(activeUser.role);
  const canArchive = canArchiveEngagement(activeUser.role);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Perikatan Tab Filters & New Engagement Form
  const [searchQuery, setSearchQuery] = useState('');
  const [sakFilter, setSakFilter] = useState<SakFilterOption>('ALL');
  const [showNewEngForm, setShowNewEngForm] = useState(false);

  const [engClientId, setEngClientId] = useState(state.clients[0]?.id ?? '');
  const [tipePerikatan, setTipePerikatan] = useState<EngagementType>('Perikatan Tahun Pertama');
  const [tahunBuku, setTahunBuku] = useState<number>(2024);
  const [periodeMulai, setPeriodeMulai] = useState('2024-01-01');
  const [periodeSelesai, setPeriodeSelesai] = useState('2024-12-31');
  const [tanggalPerikatan, setTanggalPerikatan] = useState('2025-01-15');
  const [tanggalLaporanAuditor, setTanggalLaporanAuditor] = useState('2025-03-25');
  const [nomorSuratPerikatan, setNomorSuratPerikatan] = useState('001/EL/DWR/I/2025');
  const [nomorSuratTugas, setNomorSuratTugas] = useState('001/ST/DWR/I/2025');
  const [seedDemoTb, setSeedDemoTb] = useState(true);

  // Master Klien Form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [namaKlien, setNamaKlien] = useState('');
  const [npwp, setNpwp] = useState('');
  const [nib, setNib] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kota, setKota] = useState('Bandung');
  const [provinsi, setProvinsi] = useState('Jawa Barat');
  const [sektorIndustri, setSektorIndustri] = useState<ClientSector>('Perdagangan_dan_Jasa');
  const [statusKepemilikan, setStatusKepemilikan] =
    useState<ClientOwnershipStatus>('Swasta - Non Go Publik');
  const [sakDigunakan, setSakDigunakan] = useState<AccountingFramework>('SAK ETAP');

  // Personil KAP Form
  const [newUserName, setNewUserName] = useState('');
  const [newUserInisial, setNewUserInisial] = useState('');
  const [newUserReg, setNewUserReg] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Anggota Tim');

  // Profil KAP Form
  const [formKap, setFormKap] = useState({ ...state.kapProfile });

  const activeUsersCount = useMemo(
    () => state.users.filter((u) => u.isActive).length,
    [state.users]
  );

  const filteredEngagements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.engagements.filter((eng) => {
      const client = state.clients.find((c) => c.id === eng.clientId);
      if (!matchesSakFilter(client?.sakDigunakan, sakFilter)) return false;
      if (!q) return true;
      const clientName = client?.namaKlien.toLowerCase() ?? '';
      return (
        clientName.includes(q) ||
        eng.nomorSuratPerikatan.toLowerCase().includes(q) ||
        String(eng.tahunBuku).includes(q)
      );
    });
  }, [sakFilter, searchQuery, state.clients, state.engagements]);

  const handleExportActive = () => {
    const targetEng = activeEngagement ?? Object.values(state.workspaces)[0];
    const targetClient = targetEng
      ? state.clients.find((c) => c.id === targetEng.header.clientId) ?? activeClient
      : null;

    if (!targetEng || !targetClient) {
      showToast('warning', 'Belum ada perikatan untuk diekspor.');
      return;
    }

    const bundle = buildPortableBundle({
      kapProfile: state.kapProfile,
      users: state.users,
      client: targetClient,
      workspace: targetEng,
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

  const handleCreateEngagement = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClientId = engClientId || state.clients[0]?.id;
    if (!targetClientId) {
      showToast('warning', 'Tambahkan minimal satu entitas klien terlebih dahulu.');
      return;
    }
    dispatchAction({
      type: 'CREATE_ENGAGEMENT',
      payload: {
        clientId: targetClientId,
        tipePerikatan,
        tahunBuku: Number(tahunBuku) || 2024,
        periodeMulai,
        periodeSelesai,
        tanggalLaporanAuditor,
        tanggalPerikatan,
        nomorSuratPerikatan,
        nomorSuratTugas,
        seedDemoTrialBalance: seedDemoTb,
      },
    });
    setShowNewEngForm(false);
    enterWorkspace(undefined, 'HOME');
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKlien.trim() || !npwp.trim()) {
      showToast('warning', 'Nama klien dan NPWP wajib diisi.');
      return;
    }
    const newClient: ClientEntity = {
      id: `client-${Date.now()}`,
      namaKlien: namaKlien.trim(),
      npwp: npwp.trim(),
      nib: nib.trim() || undefined,
      alamat: alamat.trim() || '-',
      kota: kota.trim() || 'Bandung',
      provinsi,
      sektorIndustri,
      statusKepemilikan,
      sakDigunakan,
      createdAt: new Date().toISOString(),
    };
    dispatchAction({ type: 'UPSERT_CLIENT', client: newClient });
    setEngClientId(newClient.id);
    setNamaKlien('');
    setNpwp('');
    setNib('');
    setAlamat('');
    setShowNewClientForm(false);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!newUserName.trim() || !newUserInisial.trim()) {
      showToast('warning', 'Nama lengkap dan Inisial personel wajib diisi.');
      return;
    }
    const user: UserProfile = {
      id: `user-${Date.now()}`,
      username: newUserInisial.trim().toLowerCase(),
      namaLengkap: newUserName.trim(),
      inisial: newUserInisial.trim().toUpperCase().slice(0, 5),
      nomorRegistrasi: newUserReg.trim() || '-',
      role: newUserRole,
      isActive: true,
    };
    dispatchAction({ type: 'UPSERT_USER', user });
    setNewUserName('');
    setNewUserInisial('');
    setNewUserReg('');
  };

  const handleSaveKap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!formKap.namaKap.trim() || !formKap.kota.trim()) {
      showToast('warning', 'Nama KAP dan Kota Domisili wajib diisi.');
      return;
    }
    dispatchAction({
      type: 'UPDATE_KAP_PROFILE',
      patch: {
        namaKap: formKap.namaKap.trim(),
        namaPemimpin: formKap.namaPemimpin.trim(),
        nomorIzinKap: formKap.nomorIzinKap.trim(),
        nomorIzinAp: formKap.nomorIzinAp.trim(),
        alamat: formKap.alamat.trim(),
        kota: formKap.kota.trim(),
        telepon: formKap.telepon.trim(),
        email: formKap.email.trim(),
        website: formKap.website?.trim(),
      },
    });
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 text-slate-900 flex flex-col" data-testid="gate-perikatan-portal">
      {/* Top Portal Navigation Header */}
      <header className="h-14 bg-slate-900 text-white border-b border-slate-800 px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setHubTab('perikatan')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
          >
            <span className="w-7 h-7 rounded bg-indigo-600 group-hover:bg-indigo-500 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs transition-colors">
              A
            </span>
            <span className="text-base font-bold tracking-tight text-white">
              ATLAS-Web
            </span>
          </button>
        </div>

        <nav aria-label="Navigasi Gate Perikatan" role="tablist" className="flex items-center gap-6 h-full">
          {HUB_NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={`hub-tab-${tab.id}`}
                onClick={() => {
                  setHubTab(tab.id);
                  if (tab.id === 'profil') {
                    setFormKap({ ...state.kapProfile });
                  }
                }}
                className={`h-full px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-400 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            data-testid="btn-toggle-new-engagement"
            onClick={() => {
              setHubTab('perikatan');
              setShowNewEngForm((prev) => !prev);
            }}
            className="h-9 px-4 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Perikatan Baru</span>
          </button>
        </div>
      </header>

      {/* KAP & Role Context Sub-Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-slate-600 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="font-semibold text-slate-800 truncate">{state.kapProfile.namaKap}</span>
          <span className="text-slate-300">·</span>
          <span>{state.kapProfile.kota}</span>
          <span className="text-slate-300">·</span>
          <span className="font-mono text-slate-500">{state.kapProfile.nomorIzinKap}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <label htmlFor="hub-user-switcher" className="text-slate-500">
              Peran Aktif:
            </label>
            <div className="inline-flex items-center gap-1.5 h-7 px-2 rounded border border-slate-300 bg-slate-50">
              <span className="w-4 h-4 rounded bg-indigo-600 text-white text-[9px] font-mono font-bold flex items-center justify-center shrink-0">
                {activeUser.inisial}
              </span>
              <select
                id="hub-user-switcher"
                data-testid="user-switcher"
                value={state.activeUserId}
                onChange={(e) => dispatchAction({ type: 'SWITCH_USER', userId: e.target.value })}
                className="bg-transparent text-xs font-medium text-slate-800 cursor-pointer focus:outline-none"
              >
                {state.users
                  .filter((u) => u.isActive)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.role}
                    </option>
                  ))}
              </select>
            </div>
            <span className="text-slate-500 hidden sm:inline">({activeUser.namaLengkap})</span>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

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
            className="h-7 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import .atlas.json</span>
          </button>

          <button
            type="button"
            data-testid="export-atlas-btn"
            onClick={handleExportActive}
            className="h-7 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export .atlas.json</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-[1240px] mx-auto space-y-5">
          {activeTab === 'perikatan' && (
            <>
              {/* Title & Summary Counters */}
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Engagement Hub — Daftar Perikatan Audit
                  </h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Pilih perikatan untuk membuka CaseWare 3-Zone Workspace Kertas Kerja Pemeriksaan (KKP).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500">
                  <span>
                    Total Perikatan:{' '}
                    <strong className="font-mono text-slate-900 font-semibold">
                      {state.engagements.length}
                    </strong>
                  </span>
                  <span>
                    Klien Terdaftar:{' '}
                    <strong className="font-mono text-slate-900 font-semibold">
                      {state.clients.length}
                    </strong>
                  </span>
                  <span>
                    Personil Aktif:{' '}
                    <strong className="font-mono text-slate-900 font-semibold">
                      {activeUsersCount}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Create New Engagement Form */}
              {showNewEngForm && (
                <form
                  onSubmit={handleCreateEngagement}
                  data-testid="new-engagement-form"
                  className="bg-white border border-slate-200 rounded-sm p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        Inisialisasi Perikatan Audit Baru
                      </h2>
                      <p className="text-xs text-slate-500">
                        Otomatis menyiapkan seluruh indeks A110–C400, 45 Lead Schedule, dan checklist CALK sesuai SAK.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Entitas Klien
                      </label>
                      <select
                        value={engClientId}
                        onChange={(e) => setEngClientId(e.target.value)}
                        className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      >
                        {state.clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.namaKlien} ({c.sakDigunakan})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Tipe Perikatan
                      </label>
                      <select
                        data-testid="new-eng-type"
                        value={tipePerikatan}
                        onChange={(e) => setTipePerikatan(e.target.value as EngagementType)}
                        className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      >
                        <option value="Perikatan Tahun Pertama">Perikatan Tahun Pertama</option>
                        <option value="Perikatan Berulang">Perikatan Berulang</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Tahun Buku
                      </label>
                      <input
                        type="number"
                        data-testid="new-eng-year"
                        value={tahunBuku}
                        onChange={(e) => setTahunBuku(Number(e.target.value))}
                        className="w-full h-9 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Awal Periode Buku
                      </label>
                      <input
                        type="date"
                        value={periodeMulai}
                        onChange={(e) => setPeriodeMulai(e.target.value)}
                        className="w-full h-9 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Akhir Periode Buku
                      </label>
                      <input
                        type="date"
                        value={periodeSelesai}
                        onChange={(e) => setPeriodeSelesai(e.target.value)}
                        className="w-full h-9 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Target Tanggal LAI
                      </label>
                      <input
                        type="date"
                        value={tanggalLaporanAuditor}
                        onChange={(e) => setTanggalLaporanAuditor(e.target.value)}
                        className="w-full h-9 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        No. Surat Perikatan (A130)
                      </label>
                      <input
                        type="text"
                        value={nomorSuratPerikatan}
                        onChange={(e) => setNomorSuratPerikatan(e.target.value)}
                        className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        No. Surat Tugas (A140)
                      </label>
                      <input
                        type="text"
                        value={nomorSuratTugas}
                        onChange={(e) => setNomorSuratTugas(e.target.value)}
                        className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Tanggal Surat Perikatan
                      </label>
                      <input
                        type="date"
                        value={tanggalPerikatan}
                        onChange={(e) => setTanggalPerikatan(e.target.value)}
                        className="w-full h-9 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={seedDemoTb}
                        onChange={(e) => setSeedDemoTb(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900"
                      />
                      Sertakan contoh akun Trial Balance standar untuk simulasi A210 & Lead Schedule
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewEngForm(false)}
                        className="h-8 px-3 rounded-sm border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        data-testid="btn-submit-new-engagement"
                        className="h-8 px-4 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Buat & Buka Workspace
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Search & SAK Filter Card */}
              <div className="bg-white border border-slate-200 rounded-sm p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    data-testid="hub-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama entitas klien, kode perikatan, atau tahun buku..."
                    className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {SAK_FILTERS.map((f) => {
                    const isSelected = sakFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSakFilter(f.id)}
                        className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border border-indigo-300 text-indigo-800 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Engagements Table Card */}
              <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="px-3.5 py-3 whitespace-nowrap">Entitas Klien & Kode Perikatan</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Tahun Buku / SAK</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Penanggung Jawab</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Progres KKP</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Review Notes</th>
                        <th className="px-3.5 py-3 text-right whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filteredEngagements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-500">
                            Tidak ada perikatan audit yang cocok dengan filter pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredEngagements.map((eng) => {
                          const client = state.clients.find((c) => c.id === eng.clientId);
                          const ws = state.workspaces[eng.id];
                          const summary = computeEngagementProgress(
                            ws,
                            state.users,
                            client?.statusKepemilikan
                          );

                          return (
                            <tr key={eng.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-3.5 py-4 align-top">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900">
                                    {client?.namaKlien ?? eng.clientId}
                                  </span>
                                  {eng.isArchived && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                                      <Lock className="w-2.5 h-2.5" />
                                      SA 230
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                                  {eng.nomorSuratPerikatan} · {eng.periodeMulai} s.d. {eng.periodeSelesai}
                                </div>
                              </td>

                              <td className="px-3.5 py-4 align-top whitespace-nowrap">
                                <div className="font-mono font-bold text-slate-900">
                                  TB {eng.tahunBuku}
                                </div>
                                <div className="mt-0.5 text-xs text-slate-500">
                                  {client?.sakDigunakan ?? '-'}
                                </div>
                              </td>

                              <td className="px-3.5 py-4 align-top text-xs space-y-0.5 whitespace-nowrap">
                                <div className="text-slate-700">
                                  <span className="text-slate-400">Partner:</span>{' '}
                                  <span className="font-medium text-slate-800">{summary.partnerName}</span>
                                </div>
                                <div className="text-slate-700">
                                  <span className="text-slate-400">Manager:</span>{' '}
                                  <span className="font-medium text-slate-800">{summary.managerName}</span>
                                </div>
                                <div className="text-slate-700">
                                  <span className="text-slate-400">Ketua Tim:</span>{' '}
                                  <span className="font-medium text-slate-800">{summary.ketuaTimName}</span>
                                </div>
                              </td>

                              <td className="px-3.5 py-4 align-top min-w-[165px]">
                                <div className="text-xs font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                                  {summary.completed}/{summary.total} indeks ({summary.percent}%)
                                </div>
                                <div className="mt-1.5 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-600 transition-all"
                                    style={{ width: `${summary.percent}%` }}
                                  />
                                </div>
                                <div className="mt-1.5 flex items-center gap-2.5 text-[11px] font-mono text-slate-500">
                                  <span className="inline-flex items-center gap-1" title="Locked">
                                    <Lock className="w-3 h-3 text-slate-500" />
                                    {summary.locked}
                                  </span>
                                  <span className="inline-flex items-center gap-1" title="Reviewed">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    {summary.reviewed}
                                  </span>
                                  <span className="inline-flex items-center gap-1" title="Prepared">
                                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                    {summary.prepared}
                                  </span>
                                  <span className="inline-flex items-center gap-1" title="In Progress / Draft">
                                    <CircleDot className="w-3 h-3 text-amber-600" />
                                    {summary.inProgress}
                                  </span>
                                </div>
                              </td>

                              <td className="px-3.5 py-4 align-top whitespace-nowrap">
                                <span
                                  className={`font-mono text-xs font-bold ${
                                    summary.openReviewNotes > 0 ? 'text-amber-600' : 'text-emerald-700'
                                  }`}
                                >
                                  {summary.openReviewNotes} OPEN
                                </span>
                              </td>

                              <td className="px-3.5 py-4 align-top text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    data-testid={`btn-open-workspace-${eng.id}`}
                                    onClick={() => enterWorkspace(eng.id, 'HOME')}
                                    className="h-9 px-3.5 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                                  >
                                    <span>Buka Workspace</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>

                                  {canArchive && (
                                    <button
                                      type="button"
                                      data-testid={`btn-archive-${eng.id}`}
                                      onClick={() =>
                                        dispatchAction({
                                          type: 'SET_ENGAGEMENT_ARCHIVE',
                                          engagementId: eng.id,
                                          isArchived: !eng.isArchived,
                                        })
                                      }
                                      title={
                                        eng.isArchived
                                          ? 'Buka Arsip SA 230'
                                          : 'Arsipkan Final (SA 230)'
                                      }
                                      aria-label={
                                        eng.isArchived
                                          ? `Buka arsip ${client?.namaKlien ?? eng.id}`
                                          : `Arsipkan ${client?.namaKlien ?? eng.id}`
                                      }
                                      className={`h-9 w-9 rounded-sm border inline-flex items-center justify-center cursor-pointer ${
                                        eng.isArchived
                                          ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700'
                                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                                      }`}
                                    >
                                      {eng.isArchived ? (
                                        <ArchiveRestore className="w-4 h-4" />
                                      ) : (
                                        <Archive className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'klien' && (
            <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Master Entitas Klien</h1>
                  <p className="text-xs text-slate-500">
                    Profil hukum, sektor usaha (12 baku ATLAS), status kepemilikan, dan kerangka SAK klien.
                  </p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setShowNewClientForm((prev) => !prev)}
                    className="h-9 px-3.5 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Tambah Entitas Klien
                  </button>
                )}
              </div>

              {showNewClientForm && canManage && (
                <form
                  onSubmit={handleCreateClient}
                  className="p-5 bg-slate-50 border-b border-slate-200 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Nama Klien / Entitas *
                      </label>
                      <input
                        type="text"
                        value={namaKlien}
                        onChange={(e) => setNamaKlien(e.target.value)}
                        placeholder="PT Nusantara Sejahtera Tbk"
                        className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        NPWP (15/16 digit) *
                      </label>
                      <input
                        type="text"
                        value={npwp}
                        onChange={(e) => setNpwp(e.target.value)}
                        placeholder="01.234.567.8-000.000"
                        className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        NIB (Opsional)
                      </label>
                      <input
                        type="text"
                        value={nib}
                        onChange={(e) => setNib(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Sektor Industri
                      </label>
                      <select
                        value={sektorIndustri}
                        onChange={(e) => setSektorIndustri(e.target.value as ClientSector)}
                        className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      >
                        {CLIENT_SECTORS.map((sec) => (
                          <option key={sec} value={sec}>
                            {getSectorDisplayLabel(sec)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Status Kepemilikan
                      </label>
                      <select
                        value={statusKepemilikan}
                        onChange={(e) =>
                          setStatusKepemilikan(e.target.value as ClientOwnershipStatus)
                        }
                        className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      >
                        {CLIENT_OWNERSHIP_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Kerangka SAK
                      </label>
                      <select
                        value={sakDigunakan}
                        onChange={(e) => setSakDigunakan(e.target.value as AccountingFramework)}
                        className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      >
                        {ACCOUNTING_FRAMEWORKS.map((sak) => (
                          <option key={sak} value={sak}>
                            {sak}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Alamat
                      </label>
                      <input
                        type="text"
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Kota
                      </label>
                      <input
                        type="text"
                        value={kota}
                        onChange={(e) => setKota(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Provinsi
                      </label>
                      <select
                        value={provinsi}
                        onChange={(e) => setProvinsi(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      >
                        {INDONESIA_PROVINCES.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewClientForm(false)}
                      className="h-8 px-3 rounded-sm border border-slate-300 bg-white text-xs text-slate-700 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="h-8 px-3.5 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Simpan Entitas Klien
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Nama Entitas</th>
                      <th className="px-4 py-2.5">NPWP</th>
                      <th className="px-4 py-2.5">Sektor Industri</th>
                      <th className="px-4 py-2.5">Kepemilikan</th>
                      <th className="px-4 py-2.5">SAK</th>
                      <th className="px-4 py-2.5">Kota / Provinsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {state.clients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{c.namaKlien}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.npwp}</td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {getSectorDisplayLabel(c.sektorIndustri)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">{c.statusKepemilikan}</td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-800">{c.sakDigunakan}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {c.kota}, {c.provinsi}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'personil' && (
            <div className="space-y-4">
              {!canManage && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-sm px-4 py-2.5 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Anda masuk sebagai <strong>{activeUser.role}</strong>. Pengubahan Personel Tim hanya tersedia untuk peran <strong>Partner</strong> atau <strong>Manager</strong>.
                  </span>
                </div>
              )}

              <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h1 className="text-lg font-bold text-slate-900">
                    Personil KAP & Peran RBAC
                  </h1>
                  <p className="text-xs text-slate-500">
                    Daftar personil audit yang tersedia pada menu Peran Aktif dan penugasan tim KKP.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Inisial</th>
                        <th className="px-4 py-2.5">Nama Lengkap</th>
                        <th className="px-4 py-2.5">No. Registrasi / IAPI</th>
                        <th className="px-4 py-2.5">Peran RBAC</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {state.users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">{u.inisial}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{u.namaLengkap}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            {u.nomorRegistrasi}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-800">{u.role}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              disabled={!canManage || u.id === activeUser.id}
                              onClick={() =>
                                dispatchAction({
                                  type: 'UPSERT_USER',
                                  user: { ...u, isActive: !u.isActive },
                                })
                              }
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer disabled:cursor-not-allowed ${
                                u.isActive
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : 'bg-slate-100 border-slate-300 text-slate-600'
                              }`}
                            >
                              {u.isActive ? 'Aktif' : 'Nonaktif'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {canManage && (
                  <form
                    onSubmit={handleAddUser}
                    className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-6 gap-2 items-end"
                  >
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Nama Lengkap Personel *
                      </label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Rina Kartika, S.Ak."
                        className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Inisial (Maks 5) *
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={newUserInisial}
                        onChange={(e) => setNewUserInisial(e.target.value)}
                        placeholder="RK"
                        className="w-full h-8 px-2.5 text-xs font-mono uppercase bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        No. IAPI / RNA
                      </label>
                      <input
                        type="text"
                        value={newUserReg}
                        onChange={(e) => setNewUserReg(e.target.value)}
                        placeholder="IAPI-24011"
                        className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-slate-300 rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Peran RBAC
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded-sm"
                      >
                        <option value="Anggota Tim">Anggota Tim</option>
                        <option value="Ketua Tim">Ketua Tim</option>
                        <option value="Manager">Manager</option>
                        <option value="Partner">Partner</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="h-8 px-3 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Tambah Personel
                    </button>
                  </form>
                )}
              </section>
            </div>
          )}

          {activeTab === 'profil' && (
            <div className="space-y-4">
              {!canManage && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-sm px-4 py-2.5 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Anda masuk sebagai <strong>{activeUser.role}</strong>. Pengubahan Profil KAP hanya tersedia untuk peran <strong>Partner</strong> atau <strong>Manager</strong>.
                  </span>
                </div>
              )}

              <form
                onSubmit={handleSaveKap}
                className="bg-white border border-slate-200 rounded-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-lg font-bold text-slate-900">
                      Identitas Kantor Akuntan Publik (KAP)
                    </h1>
                    <p className="text-xs text-slate-500">
                      Seluruh header perikatan, Surat Perikatan (A130), dan LAI (C400) membaca profil ini secara dinamis.
                    </p>
                  </div>
                  <button
                    type="submit"
                    data-testid="btn-save-kap"
                    disabled={!canManage}
                    className="h-9 px-4 rounded bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Simpan Profil KAP
                  </button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="kap-nama" className="block text-[11px] font-medium text-slate-700 mb-1">
                      Nama Kantor Akuntan Publik *
                    </label>
                    <input
                      id="kap-nama"
                      data-testid="input-kap-nama"
                      type="text"
                      maxLength={150}
                      disabled={!canManage}
                      value={formKap.namaKap}
                      onChange={(e) => setFormKap((p) => ({ ...p, namaKap: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="kap-pemimpin" className="block text-[11px] font-medium text-slate-700 mb-1">
                      Pemimpin Rekan / Managing Partner *
                    </label>
                    <input
                      id="kap-pemimpin"
                      type="text"
                      maxLength={150}
                      disabled={!canManage}
                      value={formKap.namaPemimpin}
                      onChange={(e) => setFormKap((p) => ({ ...p, namaPemimpin: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="kap-izin" className="block text-[11px] font-medium text-slate-700 mb-1">
                      Nomor Izin Usaha KAP
                    </label>
                    <input
                      id="kap-izin"
                      type="text"
                      disabled={!canManage}
                      value={formKap.nomorIzinKap}
                      onChange={(e) => setFormKap((p) => ({ ...p, nomorIzinKap: e.target.value }))}
                      className="w-full h-9 px-3 text-xs font-mono border border-slate-300 rounded-sm focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="kap-izin-ap" className="block text-[11px] font-medium text-slate-700 mb-1">
                      Nomor Izin Akuntan Publik (AP)
                    </label>
                    <input
                      id="kap-izin-ap"
                      type="text"
                      disabled={!canManage}
                      value={formKap.nomorIzinAp}
                      onChange={(e) => setFormKap((p) => ({ ...p, nomorIzinAp: e.target.value }))}
                      className="w-full h-9 px-3 text-xs font-mono border border-slate-300 rounded-sm focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="kap-alamat" className="block text-[11px] font-medium text-slate-700 mb-1">
                      Alamat Kantor KAP *
                    </label>
                    <input
                      id="kap-alamat"
                      type="text"
                      disabled={!canManage}
                      value={formKap.alamat}
                      onChange={(e) => setFormKap((p) => ({ ...p, alamat: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="kap-kota" className="block text-[11px] font-medium text-slate-700 mb-1">
                      Kota Domisili *
                    </label>
                    <input
                      id="kap-kota"
                      type="text"
                      disabled={!canManage}
                      value={formKap.kota}
                      onChange={(e) => setFormKap((p) => ({ ...p, kota: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="kap-telepon" className="block text-[11px] font-medium text-slate-700 mb-1">
                      No. Telepon KAP
                    </label>
                    <input
                      id="kap-telepon"
                      type="text"
                      disabled={!canManage}
                      value={formKap.telepon}
                      onChange={(e) => setFormKap((p) => ({ ...p, telepon: e.target.value }))}
                      className="w-full h-9 px-3 text-xs font-mono border border-slate-300 rounded-sm focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="kap-email" className="block text-[11px] font-medium text-slate-700 mb-1">
                      Email Resmi KAP
                    </label>
                    <input
                      id="kap-email"
                      type="email"
                      disabled={!canManage}
                      value={formKap.email}
                      onChange={(e) => setFormKap((p) => ({ ...p, email: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="kap-website" className="block text-[11px] font-medium text-slate-700 mb-1">
                      Website KAP (Opsional)
                    </label>
                    <input
                      id="kap-website"
                      type="text"
                      disabled={!canManage}
                      value={formKap.website ?? ''}
                      onChange={(e) => setFormKap((p) => ({ ...p, website: e.target.value }))}
                      className="w-full h-9 px-3 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
