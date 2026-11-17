import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckSquare,
  Download,
  FileSpreadsheet,
  FolderPlus,
  Layers,
  ListChecks,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { LEAD_AUDIT_CONCLUSIONS } from '../../data/bLeadProceduresCatalog';
import { exportLeadScheduleToXlsx } from '../../services/export/xlsxWorkpapers';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import {
  AuditAssertion,
  LeadScheduleInstance,
  RiskLevel,
  SubstantiveTestItem,
} from '../../types/atlas';
import { formatAuditNumber } from '../../utils/formatters';
import { buildLeadScheduleContext } from '../../utils/leadSamplingFormulas';
import { ProposeJournalModal } from './JournalsAjeRje';
import { LeadSamplingTab } from './LeadSamplingTab';

type LeadTab = 'mutasi' | 'prosedur' | 'sampling';

const ALL_ASSERTIONS: AuditAssertion[] = ['C', 'E', 'A&C', 'V', 'P&D'];

const EXEC_STATUS_OPTIONS: SubstantiveTestItem['executionStatus'][] = [
  'Belum Dilaksanakan',
  'Dilaksanakan',
  'Tidak Dilaksanakan',
  'Tidak Aplikabel',
];

function rommBadgeClass(level: RiskLevel): string {
  if (level === 'High') return 'bg-rose-100 text-rose-800 border-rose-300';
  if (level === 'Low') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  return 'bg-amber-100 text-amber-800 border-amber-300';
}

export const DynamicLeadScheduleView: React.FC<{ kodeIndeks: string }> = ({ kodeIndeks }) => {
  const { state, activeEngagement, activeClient, dispatchAction, setActiveIndex, showToast } =
    useAtlas();

  const [activeTab, setActiveTab] = useState<LeadTab>('mutasi');
  const [procTypeFilter, setProcTypeFilter] = useState<
    'ALL' | 'Analitis Substantif' | 'Substantif Rinci'
  >('ALL');
  const [showAddProcForm, setShowAddProcForm] = useState(false);
  const [newProcType, setNewProcType] = useState<'Analitis Substantif' | 'Substantif Rinci'>(
    'Substantif Rinci'
  );
  const [newProcAssertions, setNewProcAssertions] = useState('E, A&C, V');
  const [newProcText, setNewProcText] = useState('');

  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [proposeDefaultNote, setProposeDefaultNote] = useState<string | undefined>(undefined);

  const [customLeadModalOpen, setCustomLeadModalOpen] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Aset Lancar');
  const [customNormalBalance, setCustomNormalBalance] = useState<'DR' | 'CR'>('DR');

  useEffect(() => {
    setActiveTab('mutasi');
    setProcTypeFilter('ALL');
    setShowAddProcForm(false);
  }, [kodeIndeks]);

  const lead = activeEngagement?.leadSchedules[kodeIndeks];
  const ctx = useMemo(
    () => (activeEngagement && lead ? buildLeadScheduleContext(activeEngagement, kodeIndeks) : null),
    [activeEngagement, kodeIndeks, lead]
  );

  if (!activeEngagement || !activeClient || !lead || !ctx) {
    return (
      <div className="bg-white border border-slate-200 rounded p-6 text-xs text-slate-600">
        Lead Schedule <span className="font-mono font-semibold">{kodeIndeks}</span> tidak ditemukan pada perikatan aktif.
      </div>
    );
  }

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, lead.leadCode);
  const executedCount = lead.procedures.filter((p) => p.executionStatus === 'Dilaksanakan').length;
  const filteredProcedures = lead.procedures.filter(
    (p) => procTypeFilter === 'ALL' || p.procedureType === procTypeFilter
  );

  const handleToggleAssertion = (a: AuditAssertion) => {
    if (isReadOnly) return;
    const exists = lead.assertionsTested.includes(a);
    const nextAssertions = exists
      ? lead.assertionsTested.filter((x) => x !== a)
      : [...lead.assertionsTested, a];
    dispatchAction({
      type: 'UPDATE_LEAD_SCHEDULE',
      leadCode: lead.leadCode,
      patch: { assertionsTested: nextAssertions },
    });
  };

  const handleAddCustomProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const cleanText = newProcText.trim();
    if (!cleanText) {
      showToast('warning', 'Uraian prosedur tidak boleh kosong.');
      return;
    }
    const nextNo = lead.procedures.reduce((m, p) => Math.max(m, p.procedureNumber), 0) + 1;
    const newItem: SubstantiveTestItem = {
      id: `${lead.leadCode}-proc-custom-${Date.now()}`,
      procedureNumber: nextNo,
      procedureType: newProcType,
      procedureText: cleanText,
      targetAssertions: newProcAssertions.trim() || 'E, V',
      executionStatus: 'Belum Dilaksanakan',
      workpaperReference: lead.leadCode,
      auditConclusion: '',
    };
    dispatchAction({
      type: 'UPSERT_LEAD_PROCEDURE',
      leadCode: lead.leadCode,
      procedure: newItem,
    });
    setNewProcText('');
    setShowAddProcForm(false);
    showToast('success', `Prosedur khusus #${nextNo} ditambahkan ke ${lead.leadCode}.`);
  };

  const handleExportXlsx = () => {
    try {
      const filename = exportLeadScheduleToXlsx({
        kapProfile: state.kapProfile,
        client: activeClient,
        ws: activeEngagement,
        users: state.users,
        leadCode: lead.leadCode,
      });
      showToast('success', `Berhasil mengekspor 3-tab Excel Lead Schedule: ${filename}`);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Gagal mengekspor Lead Schedule ke Excel.'
      );
    }
  };

  const handleCreateCustomLead = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = customCode.trim().toUpperCase();
    const cleanTitle = customTitle.trim();
    if (!/^L\d{2,3}[A-Z]?$/.test(cleanCode) || !cleanTitle) {
      showToast('error', 'Kode Lead harus berformat Lxx (mis. L48) dan nama pos wajib diisi.');
      return;
    }
    if (activeEngagement.leadSchedules[cleanCode]) {
      showToast('warning', `Kode Lead ${cleanCode} sudah ada.`);
      return;
    }
    dispatchAction({
      type: 'ADD_CUSTOM_LEAD_SCHEDULE',
      leadCode: cleanCode,
      title: cleanTitle,
      accountCategory: customCategory,
      normalBalance: customNormalBalance,
    });
    setCustomLeadModalOpen(false);
    setCustomCode('');
    setCustomTitle('');
    setActiveIndex(cleanCode);
  };

  const nextSuggestedCustomCode = (() => {
    let n = 48;
    while (activeEngagement.leadSchedules[`L${n}`]) n += 1;
    return `L${n}`;
  })();

  return (
    <div className="space-y-4 max-w-[1600px]">
      {/* Header Lead Schedule & Actions */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
        <div className="flex flex-wrap lg:flex-nowrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                {lead.leadCode}
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {lead.title}
              </h2>
              <span className="text-xs text-slate-500">
                Sheet ATLAS {lead.atlasSheetNumber} · {lead.accountCategory} · Saldo Normal{' '}
                <strong className="font-mono text-slate-800">{lead.normalBalance}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kertas kerja Lead Schedule dinamis tersinkronisasi langsung dengan WSTB (B100), Matriks RoMM (A270), Materialitas (A210), dan Kalkulator Sampling ISA SA 530.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="lead-propose-aje-btn"
              disabled={isReadOnly}
              onClick={() => {
                setProposeDefaultNote(`Usulan penyesuaian audit dari Lead ${lead.leadCode} — ${lead.title}`);
                setProposeModalOpen(true);
              }}
              className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-700" />
              Propose AJE
            </button>
            <button
              type="button"
              data-testid="open-custom-lead-modal-btn"
              onClick={() => {
                setCustomCode(nextSuggestedCustomCode);
                setCustomLeadModalOpen(true);
              }}
              className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-slate-600" />
              + Custom Lead
            </button>
            <button
              type="button"
              data-testid="export-lead-xlsx-btn"
              onClick={handleExportXlsx}
              className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Lead Schedule (.xlsx)
            </button>
          </div>
        </div>

        {/* Real-Time Risk & Balance Context Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
          <div className="border border-slate-200 rounded p-2.5 bg-slate-50/60">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Konteks Risiko (A270)
              </span>
              <button
                type="button"
                onClick={() => setActiveIndex('A270')}
                className="text-[10px] font-medium text-indigo-700 hover:underline cursor-pointer"
              >
                Buka A270
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                data-testid="lead-romm-badge"
                className={`px-2 py-0.5 rounded border text-xs font-semibold ${rommBadgeClass(
                  ctx.rommLevel
                )}`}
              >
                RoMM: {ctx.rommLevel}
              </span>
              {ctx.rommRow?.cycleCode && (
                <span className="text-[11px] font-mono text-slate-500">
                  Siklus {ctx.rommRow.cycleCode}
                </span>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded p-2.5 bg-slate-50/60">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Materialitas (A210)</span>
              <select
                aria-label="Acuan Materialitas Lead"
                disabled={isReadOnly}
                value={lead.materialityType}
                onChange={(e) =>
                  dispatchAction({
                    type: 'UPDATE_LEAD_SCHEDULE',
                    leadCode: lead.leadCode,
                    patch: {
                      materialityType: e.target.value as LeadScheduleInstance['materialityType'],
                    },
                  })
                }
                className="text-[10px] font-medium bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-700"
              >
                <option value="PM">Acuan: PM</option>
                <option value="OM">Acuan: OM</option>
                <option value="Specific Materiality">Specific Materiality</option>
              </select>
            </div>
            <div
              data-testid="lead-pm-value"
              className="mt-1 text-sm font-mono font-bold tabular-nums text-slate-900"
            >
              PM: Rp {formatAuditNumber(ctx.performanceMateriality)}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              OM: Rp {formatAuditNumber(ctx.overallMateriality)} · AMPT: Rp{' '}
              {formatAuditNumber(ctx.ampt)}
            </div>
          </div>

          <div className="border border-slate-200 rounded p-2.5 bg-slate-50/60">
            <div className="text-[11px] text-slate-500">Total Saldo Audited ({lead.leadCode})</div>
            <div
              data-testid="lead-total-audited"
              className="mt-1 text-sm font-mono font-bold tabular-nums text-slate-900"
            >
              Rp {formatAuditNumber(ctx.totalAudited)}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Prior Audited: Rp {formatAuditNumber(ctx.totalPriorAudited)}
            </div>
          </div>

          <div className="border border-slate-200 rounded p-2.5 bg-slate-50/60">
            <div className="text-[11px] text-slate-500">Mutasi YoY & Progres Prosedur</div>
            <div className="mt-1 text-sm font-mono font-bold tabular-nums text-slate-900">
              {ctx.varianceAmount >= 0 ? '+' : ''}
              {formatAuditNumber(ctx.varianceAmount)}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({ctx.variancePercent === null ? 'N/A' : `${ctx.variancePercent.toFixed(1)}%`})
              </span>
            </div>
            <div className="text-[10px] text-slate-600">
              Prosedur selesai:{' '}
              <strong className="font-mono">
                {executedCount}/{lead.procedures.length}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Sub-Tabs Navigation */}
      <div
        role="tablist"
        aria-label={`Tab Lead Schedule ${lead.leadCode}`}
        className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'mutasi'}
          data-testid="lead-tab-mutasi"
          onClick={() => setActiveTab('mutasi')}
          className={`h-8 px-3 rounded text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'mutasi'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Akun & Mutasi ({ctx.accounts.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'prosedur'}
          data-testid="lead-tab-prosedur"
          onClick={() => setActiveTab('prosedur')}
          className={`h-8 px-3 rounded text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'prosedur'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          Program Prosedur Substantif ({lead.procedures.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sampling'}
          data-testid="lead-tab-sampling"
          onClick={() => setActiveTab('sampling')}
          className={`h-8 px-3 rounded text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'sampling'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Kalkulator Sampling ISA SA 530
        </button>
      </div>

      {/* TAB 1: AKUN & MUTASI (WSTB) */}
      {activeTab === 'mutasi' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Rincian Akun & Mutasi WSTB — Lead {lead.leadCode}
              </h3>
              <p className="text-[11px] text-slate-500">
                Disaring otomatis dari Trial Balance (B100) dengan kode Lead {lead.leadCode}. Jurnal AJE & RJE berstatus Accepted otomatis diperhitungkan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveIndex('B100')}
              className="h-7 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs text-slate-700 inline-flex items-center gap-1 cursor-pointer"
            >
              Kelola Mapping / Jurnal di B100
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {ctx.accounts.length === 0 ? (
            <div
              data-testid="lead-empty-accounts"
              className="border border-dashed border-slate-300 rounded p-6 text-center space-y-2 bg-slate-50/70"
            >
              <p className="text-xs font-semibold text-slate-800">
                Tidak ada akun Trial Balance yang dipetakan ke {lead.leadCode} ({lead.title}).
              </p>
              <p className="text-[11px] text-slate-500">
                Jika pos ini relevan bagi entitas, petakan akun Trial Balance ke kode Lead {lead.leadCode} melalui KKP B100 (WSTB 12 Kolom).
              </p>
              <button
                type="button"
                onClick={() => setActiveIndex('B100')}
                className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                Petakan Akun di B100
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-xs border-collapse" data-testid="lead-mutasi-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[11px] border-b border-slate-200">
                    <th className="py-2 px-2.5 text-left w-24">Kode Akun</th>
                    <th className="py-2 px-2.5 text-left min-w-[200px]">Nama Akun</th>
                    <th className="py-2 px-2.5 text-left w-36">Header Akun</th>
                    <th className="py-2 px-2.5 text-right w-32">Unaudited</th>
                    <th className="py-2 px-2.5 text-right w-28">AJE (Acc.)</th>
                    <th className="py-2 px-2.5 text-right w-28">RJE (Acc.)</th>
                    <th className="py-2 px-2.5 text-right w-32">Audited</th>
                    <th className="py-2 px-2.5 text-right w-32">Prior Audited</th>
                    <th className="py-2 px-2.5 text-right w-28">Selisih (Rp)</th>
                    <th className="py-2 px-2.5 text-right w-20">Selisih %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ctx.accounts.map((r) => (
                    <tr key={r.accountId} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono font-semibold text-slate-700">
                        {r.kodeAkun}
                      </td>
                      <td className="py-2 px-2.5 text-slate-900 font-medium">{r.namaAkun}</td>
                      <td className="py-2 px-2.5 text-slate-600 text-[11px]">{r.headerAkun}</td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums text-slate-800">
                        {formatAuditNumber(r.unauditedNet)}
                      </td>
                      <td
                        className={`py-2 px-2.5 text-right font-mono tabular-nums ${
                          r.ajeNet !== 0 ? 'text-indigo-700 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {formatAuditNumber(r.ajeNet)}
                      </td>
                      <td
                        className={`py-2 px-2.5 text-right font-mono tabular-nums ${
                          r.rjeNet !== 0 ? 'text-amber-700 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {formatAuditNumber(r.rjeNet)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatAuditNumber(r.auditedNet)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums text-slate-600">
                        {formatAuditNumber(r.priorAudited)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums text-slate-800">
                        {formatAuditNumber(r.varianceAmount)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums text-slate-600">
                        {r.variancePercent === null ? 'N/A' : `${r.variancePercent.toFixed(1)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                    <td colSpan={3} className="py-2 px-2.5 text-right">
                      TOTAL {lead.leadCode}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums">
                      {formatAuditNumber(ctx.totalUnaudited)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums">
                      {formatAuditNumber(ctx.totalAjeNet)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums">
                      {formatAuditNumber(ctx.totalRjeNet)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums">
                      {formatAuditNumber(ctx.totalAudited)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums">
                      {formatAuditNumber(ctx.totalPriorAudited)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums">
                      {formatAuditNumber(ctx.varianceAmount)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums">
                      {ctx.variancePercent === null ? 'N/A' : `${ctx.variancePercent.toFixed(1)}%`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Target Asersi yang Diuji */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-700" />
              Cakupan Asersi Audit:
            </span>
            {ALL_ASSERTIONS.map((a) => {
              const checked = lead.assertionsTested.includes(a);
              return (
                <label
                  key={a}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={checked}
                    onChange={() => handleToggleAssertion(a)}
                    className="w-3.5 h-3.5 accent-indigo-700"
                  />
                  <span className="font-mono font-semibold">{a}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAM PROSEDUR SUBSTANTIF (SAP & TOD) */}
      {activeTab === 'prosedur' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Program Prosedur Substantif ({lead.leadCode} — {lead.title})
              </h3>
              <p className="text-[11px] text-slate-500">
                Checklist standar Prosedur Analitis Substantif (SAP) dan Pengujian Rinci Saldo/Transaksi (TOD) sesuai ATLAS.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded border border-slate-300 overflow-hidden">
                {(['ALL', 'Analitis Substantif', 'Substantif Rinci'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setProcTypeFilter(t)}
                    className={`px-2.5 py-1 text-[11px] font-medium border-l first:border-l-0 border-slate-300 cursor-pointer ${
                      procTypeFilter === t
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t === 'ALL' ? `Semua (${lead.procedures.length})` : t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                data-testid="toggle-add-procedure-btn"
                disabled={isReadOnly}
                onClick={() => setShowAddProcForm((p) => !p)}
                className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Prosedur Khusus
              </button>
            </div>
          </div>

          {showAddProcForm && (
            <form
              onSubmit={handleAddCustomProcedure}
              data-testid="add-custom-procedure-form"
              className="border border-indigo-200 bg-indigo-50/40 rounded p-3 space-y-2.5"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div>
                  <label
                    htmlFor="new-proc-type"
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    Tipe Prosedur
                  </label>
                  <select
                    id="new-proc-type"
                    value={newProcType}
                    onChange={(e) =>
                      setNewProcType(
                        e.target.value as 'Analitis Substantif' | 'Substantif Rinci'
                      )
                    }
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded"
                  >
                    <option value="Analitis Substantif">Analitis Substantif</option>
                    <option value="Substantif Rinci">Substantif Rinci</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="new-proc-assertions"
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    Target Asersi
                  </label>
                  <input
                    id="new-proc-assertions"
                    type="text"
                    value={newProcAssertions}
                    onChange={(e) => setNewProcAssertions(e.target.value)}
                    placeholder="C, E, A&C, V"
                    className="w-full h-8 px-2 text-xs font-mono bg-white border border-slate-300 rounded"
                  />
                </div>
                <div className="flex items-end justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProcForm(false)}
                    className="h-8 px-3 rounded border border-slate-300 bg-white text-xs text-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    data-testid="submit-custom-procedure-btn"
                    className="h-8 px-3 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    Simpan Prosedur
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="new-proc-text"
                  className="block text-[11px] font-semibold text-slate-700 mb-1"
                >
                  Uraian Prosedur Substantif Khusus
                </label>
                <textarea
                  id="new-proc-text"
                  data-testid="new-proc-textarea"
                  rows={2}
                  value={newProcText}
                  onChange={(e) => setNewProcText(e.target.value)}
                  placeholder="Jelaskan prosedur audit tambahan yang dirancang untuk merespons risiko spesifik pos ini..."
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded"
                />
              </div>
            </form>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-xs border-collapse" data-testid="lead-procedures-table">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[11px] border-b border-slate-200">
                  <th className="py-2 px-2 text-center w-10">No.</th>
                  <th className="py-2 px-2 text-left w-36">Tipe</th>
                  <th className="py-2 px-2 text-left min-w-[260px]">Uraian Prosedur</th>
                  <th className="py-2 px-2 text-center w-24">Asersi</th>
                  <th className="py-2 px-2 text-left w-40">Status</th>
                  <th className="py-2 px-2 text-left w-36">PIC</th>
                  <th className="py-2 px-2 text-left w-24">Ref KKP</th>
                  <th className="py-2 px-2 text-left w-44">Simpulan / Catatan</th>
                  <th className="py-2 px-2 text-center w-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProcedures.map((proc) => (
                  <tr key={proc.id} className="hover:bg-slate-50 align-top">
                    <td className="py-2 px-2 text-center font-mono text-slate-600">
                      {proc.procedureNumber}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold ${
                          proc.procedureType === 'Analitis Substantif'
                            ? 'bg-sky-50 border-sky-200 text-sky-800'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                        }`}
                      >
                        {proc.procedureType}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-800 leading-relaxed">
                      {proc.procedureText}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                      {proc.targetAssertions}
                    </td>
                    <td className="py-2 px-2">
                      <select
                        aria-label={`Status prosedur ${proc.procedureNumber}`}
                        data-testid={`proc-status-${proc.procedureNumber}`}
                        disabled={isReadOnly}
                        value={proc.executionStatus}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPSERT_LEAD_PROCEDURE',
                            leadCode: lead.leadCode,
                            procedure: {
                              ...proc,
                              executionStatus: e.target
                                .value as SubstantiveTestItem['executionStatus'],
                            },
                          })
                        }
                        className={`w-full h-7 px-1.5 text-[11px] border rounded ${
                          proc.executionStatus === 'Dilaksanakan'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                            : proc.executionStatus === 'Tidak Dilaksanakan'
                              ? 'bg-rose-50 border-rose-300 text-rose-900'
                              : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        {EXEC_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <select
                        aria-label={`PIC prosedur ${proc.procedureNumber}`}
                        disabled={isReadOnly}
                        value={proc.picUserId ?? ''}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPSERT_LEAD_PROCEDURE',
                            leadCode: lead.leadCode,
                            procedure: { ...proc, picUserId: e.target.value || undefined },
                          })
                        }
                        className="w-full h-7 px-1.5 text-[11px] bg-white border border-slate-300 rounded text-slate-800"
                      >
                        <option value="">-- Pilih PIC --</option>
                        {state.users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.inisial} — {u.namaLengkap}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        aria-label={`Ref KKP prosedur ${proc.procedureNumber}`}
                        disabled={isReadOnly}
                        value={proc.workpaperReference}
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPSERT_LEAD_PROCEDURE',
                            leadCode: lead.leadCode,
                            procedure: { ...proc, workpaperReference: e.target.value },
                          })
                        }
                        className="w-full h-7 px-1.5 text-[11px] font-mono bg-white border border-slate-300 rounded"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        aria-label={`Simpulan prosedur ${proc.procedureNumber}`}
                        disabled={isReadOnly}
                        value={proc.auditConclusion}
                        placeholder="Catatan hasil..."
                        onChange={(e) =>
                          dispatchAction({
                            type: 'UPSERT_LEAD_PROCEDURE',
                            leadCode: lead.leadCode,
                            procedure: { ...proc, auditConclusion: e.target.value },
                          })
                        }
                        className="w-full h-7 px-2 text-[11px] bg-white border border-slate-300 rounded"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        aria-label={`Hapus prosedur ${proc.procedureNumber}`}
                        disabled={isReadOnly || lead.procedures.length <= 1}
                        onClick={() =>
                          dispatchAction({
                            type: 'DELETE_LEAD_PROCEDURE',
                            leadCode: lead.leadCode,
                            procedureId: proc.id,
                          })
                        }
                        className="p-1 text-slate-400 hover:text-rose-700 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: KALKULATOR SAMPLING ISA SA 530 */}
      {activeTab === 'sampling' && (
        <LeadSamplingTab
          lead={lead}
          ctx={ctx}
          onOpenProposeAje={(defaultDesc) => {
            setProposeDefaultNote(defaultDesc);
            setProposeModalOpen(true);
          }}
        />
      )}

      {/* Simpulan Audit Lead Schedule */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label
              htmlFor="lead-audit-conclusion"
              className="block text-[11px] font-semibold text-slate-700 mb-1"
            >
              Simpulan Audit Lead Schedule {lead.leadCode}
            </label>
            <select
              id="lead-audit-conclusion"
              data-testid="lead-conclusion-select"
              disabled={isReadOnly}
              value={lead.auditConclusion}
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_LEAD_SCHEDULE',
                  leadCode: lead.leadCode,
                  patch: {
                    auditConclusion: e.target.value as LeadScheduleInstance['auditConclusion'],
                  },
                })
              }
              className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900 font-medium"
            >
              {LEAD_AUDIT_CONCLUSIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-7">
            <label
              htmlFor="lead-conclusion-notes"
              className="block text-[11px] font-semibold text-slate-700 mb-1"
            >
              Memo & Catatan Simpulan Auditor
            </label>
            <input
              id="lead-conclusion-notes"
              data-testid="lead-conclusion-notes"
              type="text"
              disabled={isReadOnly}
              value={lead.conclusionNotes}
              placeholder="Catat hasil konfirmasi, rekonsiliasi, AJE/RJE yang masih belum disesuaikan, atau justifikasi simpulan..."
              onChange={(e) =>
                dispatchAction({
                  type: 'UPDATE_LEAD_SCHEDULE',
                  leadCode: lead.leadCode,
                  patch: { conclusionNotes: e.target.value },
                })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Modal Propose AJE langsung dari Lead Schedule */}
      <ProposeJournalModal
        open={proposeModalOpen}
        referensiKkp={lead.leadCode}
        defaultKeterangan={proposeDefaultNote}
        onClose={() => setProposeModalOpen(false)}
      />

      {/* Modal Tambah Custom Lead Schedule */}
      {customLeadModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tambah Custom Lead Schedule"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleCreateCustomLead}
            className="bg-white border border-slate-300 rounded shadow-xl w-full max-w-md p-4 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Tambah Custom Lead Schedule
              </h3>
              <button
                type="button"
                aria-label="Tutup modal Custom Lead"
                onClick={() => setCustomLeadModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="custom-lead-code"
                  className="block text-[11px] font-semibold text-slate-700 mb-1"
                >
                  Kode Lead
                </label>
                <input
                  id="custom-lead-code"
                  data-testid="custom-lead-code-input"
                  type="text"
                  required
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="L48"
                  className="w-full h-8 px-2 text-xs font-mono bg-white border border-slate-300 rounded"
                />
              </div>
              <div>
                <label
                  htmlFor="custom-lead-normal"
                  className="block text-[11px] font-semibold text-slate-700 mb-1"
                >
                  Saldo Normal
                </label>
                <select
                  id="custom-lead-normal"
                  value={customNormalBalance}
                  onChange={(e) => setCustomNormalBalance(e.target.value as 'DR' | 'CR')}
                  className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded"
                >
                  <option value="DR">Debit (DR)</option>
                  <option value="CR">Kredit (CR)</option>
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="custom-lead-title"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                Nama Pos / Lead Schedule
              </label>
              <input
                id="custom-lead-title"
                data-testid="custom-lead-title-input"
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Mis. Aset Hak Guna (PSAK 73)"
                className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded"
              />
            </div>
            <div>
              <label
                htmlFor="custom-lead-cat"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                Kategori Laporan Keuangan
              </label>
              <select
                id="custom-lead-cat"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded"
              >
                <option value="Aset Lancar">Aset Lancar</option>
                <option value="Aset Tidak Lancar">Aset Tidak Lancar</option>
                <option value="Liabilitas Jangka Pendek">Liabilitas Jangka Pendek</option>
                <option value="Liabilitas Jangka Panjang">Liabilitas Jangka Panjang</option>
                <option value="Ekuitas">Ekuitas</option>
                <option value="Pendapatan & Beban">Pendapatan & Beban</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCustomLeadModalOpen(false)}
                className="h-8 px-3 rounded border border-slate-300 bg-white text-xs text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                data-testid="submit-custom-lead-btn"
                className="h-8 px-3.5 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold cursor-pointer"
              >
                Buat Lead Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
