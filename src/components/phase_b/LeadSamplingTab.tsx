import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import {
  AuditSampleItem,
  LeadScheduleInstance,
  RiskLevel,
  SamplingRun,
  SapAssuranceLevel,
} from '../../types/atlas';
import { formatAuditNumber } from '../../utils/formatters';
import {
  CONFIDENCE_FACTOR_MATRIX,
  LeadScheduleContext,
  computeSampleItemMisstatement,
  computeSamplingMetrics,
  computeSamplingProjection,
  getRecommendedConfidenceFactor,
} from '../../utils/leadSamplingFormulas';

interface LeadSamplingTabProps {
  lead: LeadScheduleInstance;
  ctx: LeadScheduleContext;
  onOpenProposeAje: (defaultDesc?: string) => void;
}

const SAP_OPTIONS: { value: SapAssuranceLevel; label: string }[] = [
  { value: 'High', label: 'High (Asurans Analitis Tinggi)' },
  { value: 'Moderate', label: 'Moderate (Asurans Analitis Moderat)' },
  { value: 'No', label: 'No (Tanpa Asurans Analitis)' },
];

const ROMM_ORDER: RiskLevel[] = ['High', 'Moderate', 'Low'];
const SAP_ORDER: SapAssuranceLevel[] = ['High', 'Moderate', 'No'];

export const LeadSamplingTab: React.FC<LeadSamplingTabProps> = ({
  lead,
  ctx,
  onOpenProposeAje,
}) => {
  const { activeEngagement, dispatchAction, showToast } = useAtlas();
  const isReadOnly = activeEngagement
    ? isWorkpaperReadOnly(activeEngagement, lead.leadCode)
    : true;

  const savedRun = lead.samplingRun;

  const [sapAssurance, setSapAssurance] = useState<SapAssuranceLevel>(
    savedRun?.sapAssurance ?? lead.sapAssuranceLevel ?? 'No'
  );
  const recommendedBand = useMemo(
    () => getRecommendedConfidenceFactor(ctx.rommLevel, sapAssurance),
    [ctx.rommLevel, sapAssurance]
  );

  const [isCustomCf, setIsCustomCf] = useState<boolean>(false);
  const [confidenceFactor, setConfidenceFactor] = useState<number>(
    savedRun?.confidenceFactor ?? recommendedBand.defaultCf
  );
  const [totalPopulationValue, setTotalPopulationValue] = useState<number>(
    savedRun?.totalPopulationValue ?? Math.max(0, Math.abs(ctx.totalAudited))
  );
  const [totalPopulationItems, setTotalPopulationItems] = useState<number>(
    savedRun?.totalPopulationItems ?? Math.max(ctx.accounts.length * 25, 40)
  );
  const [specificItemsValue, setSpecificItemsValue] = useState<number>(
    savedRun?.specificItemsValue ?? 0
  );
  const [specificItemsCount, setSpecificItemsCount] = useState<number>(
    savedRun?.specificItemsCount ?? 0
  );
  const [projectionMethod, setProjectionMethod] = useState<'Ratio' | 'Difference'>(
    savedRun?.projectionMethod ?? 'Ratio'
  );
  const [samples, setSamples] = useState<AuditSampleItem[]>(savedRun?.samples ?? []);
  const [evaluatorNotes, setEvaluatorNotes] = useState<string>(savedRun?.evaluatorNotes ?? '');

  // Re-sync local state if switching Lead Schedule code
  useEffect(() => {
    const sr = lead.samplingRun;
    const nextSap = sr?.sapAssurance ?? lead.sapAssuranceLevel ?? 'No';
    const rec = getRecommendedConfidenceFactor(ctx.rommLevel, nextSap);
    setSapAssurance(nextSap);
    setIsCustomCf(false);
    setConfidenceFactor(rec.defaultCf);
    setTotalPopulationValue(sr?.totalPopulationValue ?? Math.max(0, Math.abs(ctx.totalAudited)));
    setTotalPopulationItems(sr?.totalPopulationItems ?? Math.max(ctx.accounts.length * 25, 40));
    setSpecificItemsValue(sr?.specificItemsValue ?? 0);
    setSpecificItemsCount(sr?.specificItemsCount ?? 0);
    setProjectionMethod(sr?.projectionMethod ?? 'Ratio');
    setSamples(sr?.samples ?? []);
    setEvaluatorNotes(sr?.evaluatorNotes ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.leadCode]);

  // Keep CF synchronized with real-time RoMM (A270) & SAP Assurance unless manually overridden
  useEffect(() => {
    if (!isCustomCf) {
      setConfidenceFactor(recommendedBand.defaultCf);
    }
  }, [recommendedBand.defaultCf, isCustomCf]);

  const metrics = useMemo(
    () =>
      computeSamplingMetrics({
        performanceMateriality: ctx.performanceMateriality,
        confidenceFactor,
        totalPopulationValue,
        specificItemsValue,
      }),
    [ctx.performanceMateriality, confidenceFactor, totalPopulationValue, specificItemsValue]
  );

  const projection = useMemo(
    () =>
      computeSamplingProjection({
        totalPopulationValue,
        totalPopulationItems,
        performanceMateriality: ctx.performanceMateriality,
        projectionMethod,
        samples,
      }),
    [
      totalPopulationValue,
      totalPopulationItems,
      ctx.performanceMateriality,
      projectionMethod,
      samples,
    ]
  );

  const handleSelectSap = (nextSap: SapAssuranceLevel) => {
    setSapAssurance(nextSap);
    setIsCustomCf(false);
    setConfidenceFactor(getRecommendedConfidenceFactor(ctx.rommLevel, nextSap).defaultCf);
  };

  const handleAddSample = () => {
    if (isReadOnly) return;
    const nextNum =
      samples.reduce((max, s) => Math.max(max, s.sampleNumber), 0) + 1;
    const defaultDate = activeEngagement?.header.periodeSelesai ?? '2023-12-31';
    const newItem: AuditSampleItem = {
      id: `smp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sampleNumber: nextNum,
      transactionDate: defaultDate,
      documentReference: `DOC-${lead.leadCode}-${String(nextNum).padStart(3, '0')}`,
      description: `Sampel Vouching #${nextNum} (${lead.title})`,
      counterparty: '',
      bookValue: 0,
      auditedValue: 0,
      misstatementNature: '',
      auditNotes: '',
      isAnomaly: false,
    };
    setSamples((prev) => [...prev, newItem]);
  };

  const handleUpdateSample = (id: string, patch: Partial<AuditSampleItem>) => {
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleDeleteSample = (id: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveRun = () => {
    if (isReadOnly) return;
    const run: SamplingRun = {
      id: savedRun?.id ?? `srun-${lead.leadCode}-${Date.now()}`,
      runDate: new Date().toISOString().slice(0, 10),
      performanceMateriality: ctx.performanceMateriality,
      rommLevel: ctx.rommLevel,
      sapAssurance,
      confidenceFactor,
      samplingInterval: metrics.samplingInterval,
      totalPopulationValue,
      totalPopulationItems,
      specificItemsValue,
      specificItemsCount,
      testedPopulationValue: metrics.testedPopulationValue,
      calculatedSampleSize: metrics.calculatedSampleSize,
      actualSampleSize: samples.length,
      projectionMethod,
      projectedPopulationMisstatement: projection.selectedProjectedMisstatement,
      isMisstatementMaterial: projection.isMisstatementMaterial,
      samples,
      evaluatorNotes,
    };
    dispatchAction({
      type: 'SAVE_LEAD_SAMPLING_RUN',
      leadCode: lead.leadCode,
      samplingRun: run,
    });
  };

  const handleSendToSad = () => {
    const amount = Math.round(Math.abs(projection.selectedProjectedMisstatement));
    if (amount <= 0) {
      showToast('warning', 'Nilai proyeksi salah saji masih nol (0). Tidak ada selisih yang dikirim ke SAD.');
      return;
    }
    dispatchAction({
      type: 'SEND_SAMPLING_TO_SAD',
      leadCode: lead.leadCode,
      description: `Proyeksi salah saji sampling ISA SA 530 (${projectionMethod}) pada ${lead.leadCode} — ${lead.title} (${samples.length} sampel diuji)`,
      amount: projection.selectedProjectedMisstatement,
      misstatementType: 'Projected',
    });
  };

  return (
    <div className="space-y-4">
      {/* Parameter & Matriks Confidence Factor ISA SA 530 */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-700" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Desain & Penentuan Jumlah Sampel Audit (ISA / SA 530)
              </h3>
              <p className="text-[11px] text-slate-500">
                Confidence Factor (CF) otomatis ditarik dari RoMM A270 ({ctx.rommLevel}) × SAP Assurance, dan Interval dihitung dari Performance Materiality (A210).
              </p>
            </div>
          </div>
          {savedRun && (
            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Tersimpan ({savedRun.runDate})
            </span>
          )}
        </div>

        {/* 4 Key Calculated KPI Cards (Single-layer border, crisp tabular numerals) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="border border-slate-200 rounded p-3 bg-slate-50/70">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Confidence Factor (CF)</span>
              {isCustomCf && !isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCf(false);
                    setConfidenceFactor(recommendedBand.defaultCf);
                  }}
                  className="text-indigo-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset ({recommendedBand.defaultCf})
                </button>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                aria-label="Confidence Factor"
                data-testid="sampling-cf-input"
                disabled={isReadOnly}
                value={confidenceFactor}
                onChange={(e) => {
                  setIsCustomCf(true);
                  setConfidenceFactor(Math.max(0.1, Number(e.target.value) || 0.1));
                }}
                className="w-24 h-8 px-2 text-sm font-mono font-bold tabular-nums bg-white border border-slate-300 rounded text-slate-900"
              />
              <span className="text-[11px] text-slate-500 font-mono">
                Band [{recommendedBand.min}–{recommendedBand.max}]
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded p-3 bg-slate-50/70">
            <div className="text-[11px] text-slate-500">Sampling Interval (PM / CF)</div>
            <div
              data-testid="sampling-interval-value"
              className="mt-1.5 text-base font-mono font-bold tabular-nums text-slate-900"
            >
              Rp {formatAuditNumber(Math.round(metrics.samplingInterval))}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              PM: Rp {formatAuditNumber(ctx.performanceMateriality)}
            </div>
          </div>

          <div className="border border-slate-200 rounded p-3 bg-slate-50/70">
            <div className="text-[11px] text-slate-500">Tested Population (Pop − Specific)</div>
            <div
              data-testid="sampling-tested-pop"
              className="mt-1.5 text-base font-mono font-bold tabular-nums text-slate-900"
            >
              Rp {formatAuditNumber(metrics.testedPopulationValue)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Specific: {specificItemsCount} item
            </div>
          </div>

          <div className="border border-indigo-200 rounded p-3 bg-indigo-50/50">
            <div className="text-[11px] font-medium text-indigo-800">
              Calculated Sample Size (SA 530)
            </div>
            <div
              data-testid="sampling-sample-size"
              className="mt-1.5 text-xl font-mono font-bold tabular-nums text-indigo-900"
            >
              {metrics.calculatedSampleSize} sampel
            </div>
            <div className="text-[10px] text-indigo-700 font-mono">
              Math.ceil(Tested / Interval)
            </div>
          </div>
        </div>

        {/* Inputs + 3x3 Confidence Factor Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="sampling-sap-select"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
              >
                SAP Assurance Level (Asurans Prosedur Analitis Substantif)
              </label>
              <select
                id="sampling-sap-select"
                data-testid="sampling-sap-select"
                disabled={isReadOnly}
                value={sapAssurance}
                onChange={(e) => handleSelectSap(e.target.value as SapAssuranceLevel)}
                className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
              >
                {SAP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="sampling-total-pop"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Total Populasi Book Value (Rp)
                </label>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setTotalPopulationValue(Math.max(0, Math.abs(ctx.totalAudited)))}
                    className="text-[10px] font-medium text-indigo-700 hover:underline cursor-pointer"
                  >
                    Tarik Saldo Lead
                  </button>
                )}
              </div>
              <input
                id="sampling-total-pop"
                data-testid="sampling-total-pop-input"
                type="number"
                min="0"
                disabled={isReadOnly}
                value={totalPopulationValue}
                onChange={(e) => setTotalPopulationValue(Math.max(0, Number(e.target.value) || 0))}
                className="w-full h-8 px-2 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="sampling-total-items"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
              >
                Total Item / Transaksi Populasi (N)
              </label>
              <input
                id="sampling-total-items"
                data-testid="sampling-total-items-input"
                type="number"
                min="1"
                disabled={isReadOnly}
                value={totalPopulationItems}
                onChange={(e) => setTotalPopulationItems(Math.max(0, Number(e.target.value) || 0))}
                className="w-full h-8 px-2 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="sampling-specific-val"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
              >
                Specific Items Value (Key Items, Rp)
              </label>
              <input
                id="sampling-specific-val"
                data-testid="sampling-specific-val-input"
                type="number"
                min="0"
                disabled={isReadOnly}
                value={specificItemsValue}
                onChange={(e) => setSpecificItemsValue(Math.max(0, Number(e.target.value) || 0))}
                className="w-full h-8 px-2 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="sampling-specific-cnt"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
              >
                Jumlah Item Specific (Key Items)
              </label>
              <input
                id="sampling-specific-cnt"
                type="number"
                min="0"
                disabled={isReadOnly}
                value={specificItemsCount}
                onChange={(e) => setSpecificItemsCount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full h-8 px-2 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
          </div>

          {/* 3x3 Confidence Factor Matrix Reference */}
          <div className="lg:col-span-5">
            <div className=".5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Matriks Confidence Factor (RoMM A270: {ctx.rommLevel})
            </div>
            <table className="w-full border-collapse border border-slate-200 text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="py-1.5 px-2 text-left border border-slate-200">RoMM \ SAP</th>
                  {SAP_ORDER.map((sap) => (
                    <th key={sap} className="py-1.5 px-2 text-center border border-slate-200">
                      {sap}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROMM_ORDER.map((romm) => (
                  <tr key={romm}>
                    <td
                      className={`py-1.5 px-2 font-semibold border border-slate-200 ${
                        romm === ctx.rommLevel ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      {romm}
                    </td>
                    {SAP_ORDER.map((sap) => {
                      const band = CONFIDENCE_FACTOR_MATRIX.find(
                        (b) => b.rommLevel === romm && b.sapAssurance === sap
                      )!;
                      const isActiveCell = romm === ctx.rommLevel && sap === sapAssurance;
                      return (
                        <td
                          key={sap}
                          className={`py-1.5 px-2 text-center font-mono tabular-nums border border-slate-200 ${
                            isActiveCell
                              ? 'bg-indigo-600 text-white font-bold'
                              : romm === ctx.rommLevel
                                ? 'bg-indigo-50/50 text-slate-800'
                                : 'bg-white text-slate-500'
                          }`}
                        >
                          {band.defaultCf.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tabel Vouching Sampel */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Lembar Kerja Pengujian Sampel (Vouching & Inspeksi Bukti)
            </h3>
            <p className="text-[11px] text-slate-500">
              Input Book Value Sample (BVS) dan Audited Value Sample (AVS). Salah Saji Faktual = BVS − AVS.
            </p>
          </div>
          <button
            type="button"
            data-testid="add-vouching-sample-btn"
            disabled={isReadOnly}
            onClick={handleAddSample}
            className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Sampel Vouching
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-[11px] border-b border-slate-200">
                <th className="py-2 px-2 text-center w-10">#</th>
                <th className="py-2 px-2 text-left w-32">Tgl Transaksi</th>
                <th className="py-2 px-2 text-left w-36">No. Dokumen</th>
                <th className="py-2 px-2 text-left min-w-[180px]">Keterangan / Transaksi</th>
                <th className="py-2 px-2 text-left w-36">Pihak Lawan</th>
                <th className="py-2 px-2 text-right w-36">Book Value (BVS)</th>
                <th className="py-2 px-2 text-right w-36">Audited Value (AVS)</th>
                <th className="py-2 px-2 text-right w-36">Salah Saji Faktual</th>
                <th className="py-2 px-2 text-center w-16">Anomali</th>
                <th className="py-2 px-2 text-center w-12">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {samples.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-xs text-slate-500">
                    Belum ada baris sampel vouching. Klik &ldquo;+ Tambah Sampel Vouching&rdquo; untuk menguji sampel terhadap target {metrics.calculatedSampleSize} sampel.
                  </td>
                </tr>
              ) : (
                samples.map((s) => {
                  const factual = computeSampleItemMisstatement(s.bookValue, s.auditedValue);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600">
                        {s.sampleNumber}
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="date"
                          aria-label={`Tanggal sampel ${s.sampleNumber}`}
                          disabled={isReadOnly}
                          value={s.transactionDate}
                          onChange={(e) =>
                            handleUpdateSample(s.id, { transactionDate: e.target.value })
                          }
                          className="w-full h-7 px-1.5 text-[11px] bg-white border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          aria-label={`No dokumen sampel ${s.sampleNumber}`}
                          disabled={isReadOnly}
                          value={s.documentReference}
                          onChange={(e) =>
                            handleUpdateSample(s.id, { documentReference: e.target.value })
                          }
                          className="w-full h-7 px-2 text-[11px] font-mono bg-white border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          aria-label={`Uraian sampel ${s.sampleNumber}`}
                          disabled={isReadOnly}
                          value={s.description}
                          onChange={(e) =>
                            handleUpdateSample(s.id, { description: e.target.value })
                          }
                          className="w-full h-7 px-2 text-[11px] bg-white border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          aria-label={`Pihak lawan sampel ${s.sampleNumber}`}
                          disabled={isReadOnly}
                          value={s.counterparty}
                          placeholder="Vendor / Pelanggan"
                          onChange={(e) =>
                            handleUpdateSample(s.id, { counterparty: e.target.value })
                          }
                          className="w-full h-7 px-2 text-[11px] bg-white border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          aria-label={`BVS sampel ${s.sampleNumber}`}
                          data-testid={`sample-bvs-${s.sampleNumber}`}
                          disabled={isReadOnly}
                          value={s.bookValue}
                          onChange={(e) =>
                            handleUpdateSample(s.id, { bookValue: Number(e.target.value) || 0 })
                          }
                          className="w-full h-7 px-2 text-[11px] font-mono tabular-nums text-right bg-white border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          aria-label={`AVS sampel ${s.sampleNumber}`}
                          data-testid={`sample-avs-${s.sampleNumber}`}
                          disabled={isReadOnly}
                          value={s.auditedValue}
                          onChange={(e) =>
                            handleUpdateSample(s.id, { auditedValue: Number(e.target.value) || 0 })
                          }
                          className="w-full h-7 px-2 text-[11px] font-mono tabular-nums text-right bg-white border border-slate-300 rounded"
                        />
                      </td>
                      <td
                        className={`py-1.5 px-2 text-right font-mono tabular-nums font-semibold ${
                          factual !== 0 ? 'text-rose-700' : 'text-slate-600'
                        }`}
                      >
                        {formatAuditNumber(factual)}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Anomali sampel ${s.sampleNumber}`}
                          disabled={isReadOnly}
                          checked={s.isAnomaly}
                          onChange={(e) =>
                            handleUpdateSample(s.id, { isAnomaly: e.target.checked })
                          }
                          className="w-3.5 h-3.5 accent-indigo-700 cursor-pointer"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          aria-label={`Hapus sampel ${s.sampleNumber}`}
                          disabled={isReadOnly}
                          onClick={() => handleDeleteSample(s.id)}
                          className="p-1 text-slate-400 hover:text-rose-700 disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {samples.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-300">
                  <td colSpan={5} className="py-2 px-2 text-right text-[11px]">
                    Total {samples.length} Sampel Diuji (Target: {metrics.calculatedSampleSize})
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">
                    {formatAuditNumber(projection.sumBvs)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">
                    {formatAuditNumber(projection.sumAvs)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right font-mono tabular-nums ${
                      projection.factualMisstatementTotal !== 0 ? 'text-rose-700' : 'text-slate-900'
                    }`}
                  >
                    {formatAuditNumber(projection.factualMisstatementTotal)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Proyeksi Salah Saji Populasi & Evaluasi Materialitas */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Proyeksi Salah Saji Populasi & Evaluasi Materialitas
            </h3>
            <p className="text-[11px] text-slate-500">
              Bandingkan Proyeksi Salah Saji terhadap Performance Materiality (Rp {formatAuditNumber(ctx.performanceMateriality)}).
            </p>
          </div>
          <div className="inline-flex rounded border border-slate-300 overflow-hidden">
            <button
              type="button"
              data-testid="projection-method-ratio"
              disabled={isReadOnly}
              onClick={() => setProjectionMethod('Ratio')}
              className={`px-3 py-1 text-xs font-medium cursor-pointer ${
                projectionMethod === 'Ratio'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Metode Rasio
            </button>
            <button
              type="button"
              data-testid="projection-method-diff"
              disabled={isReadOnly}
              onClick={() => setProjectionMethod('Difference')}
              className={`px-3 py-1 text-xs font-medium border-l border-slate-300 cursor-pointer ${
                projectionMethod === 'Difference'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Metode Difference
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            className={`border rounded p-3 ${
              projectionMethod === 'Ratio'
                ? 'border-indigo-400 bg-indigo-50/40'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div className="text-[11px] text-slate-600">Proyeksi Metode Rasio</div>
            <div
              data-testid="sampling-proj-ratio"
              className="mt-1 text-sm font-mono font-bold tabular-nums text-slate-900"
            >
              Rp {formatAuditNumber(Math.round(projection.ratioProjectedMisstatement))}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              BVP − BVP × (ΣAVS / ΣBVS)
            </div>
          </div>

          <div
            className={`border rounded p-3 ${
              projectionMethod === 'Difference'
                ? 'border-indigo-400 bg-indigo-50/40'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div className="text-[11px] text-slate-600">Proyeksi Metode Difference</div>
            <div
              data-testid="sampling-proj-diff"
              className="mt-1 text-sm font-mono font-bold tabular-nums text-slate-900"
            >
              Rp {formatAuditNumber(Math.round(projection.differenceProjectedMisstatement))}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              (Σ(BVS − AVS) / n) × N ({totalPopulationItems})
            </div>
          </div>

          <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
            <div className="text-[11px] text-slate-600">Status Materialitas vs PM</div>
            <div
              className={`mt-1 text-sm font-semibold ${
                projection.isMisstatementMaterial ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {projection.isMisstatementMaterial
                ? 'MELEBIHI PM — PERLU TINDAKAN'
                : 'Di Bawah Performance Materiality'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Terpilih: Rp {formatAuditNumber(Math.round(projection.selectedProjectedMisstatement))}
            </div>
          </div>
        </div>

        {/* Red Alert if |Projected| >= PM */}
        {projection.isMisstatementMaterial && (
          <div
            role="alert"
            data-testid="sampling-material-alert"
            className="rounded border border-rose-300 bg-rose-50 px-3.5 py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-950">
                <div className="font-bold">
                  Salah Saji Populasi Material (|Rp{' '}
                  {formatAuditNumber(Math.round(projection.selectedProjectedMisstatement))}| ≥ PM Rp{' '}
                  {formatAuditNumber(ctx.performanceMateriality)})
                </div>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Sesuai ISA / SA 530, proyeksi salah saji melebihi Performance Materiality. Kirim ke Summary of Audit Differences (C100) atau usulkan jurnal penyesuaian (AJE).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="send-sampling-to-sad-btn"
                disabled={isReadOnly}
                onClick={handleSendToSad}
                className="h-8 px-3 rounded bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim ke SAD (C100)
              </button>
              <button
                type="button"
                data-testid="propose-aje-from-sampling-btn"
                disabled={isReadOnly}
                onClick={() =>
                  onOpenProposeAje(
                    `Penyesuaian atas proyeksi salah saji sampling ${lead.leadCode} (${projectionMethod}) sebesar Rp ${formatAuditNumber(Math.round(projection.selectedProjectedMisstatement))}`
                  )
                }
                className="h-8 px-3 rounded border border-rose-400 bg-white hover:bg-rose-100 text-rose-800 text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                Propose AJE from Lead
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
          <div className="md:col-span-8">
            <label
              htmlFor="sampling-evaluator-notes"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
            >
              Catatan Evaluasi & Simpulan Uji Petik SA 530
            </label>
            <input
              id="sampling-evaluator-notes"
              type="text"
              disabled={isReadOnly}
              value={evaluatorNotes}
              placeholder="Ringkaskan temuan anomali, bukti pendukung, dan kecukupan ukuran sampel..."
              onChange={(e) => setEvaluatorNotes(e.target.value)}
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
            />
          </div>
          <div className="md:col-span-4 flex items-center justify-end gap-2">
            {!projection.isMisstatementMaterial &&
              Math.abs(projection.selectedProjectedMisstatement) > 0 && (
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={handleSendToSad}
                  className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim ke SAD
                </button>
              )}
            <button
              type="button"
              data-testid="save-sampling-run-btn"
              disabled={isReadOnly}
              onClick={handleSaveRun}
              className="h-8 px-3.5 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Hasil Sampling
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
