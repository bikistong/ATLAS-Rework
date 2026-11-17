import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { AuditJournalEntry, AuditJournalLine } from '../../types/atlas';
import {
  nextJournalNumber,
  validateAuditJournalEntry,
} from '../../utils/bCoreFormulas';
import { formatAuditNumber } from '../../utils/formatters';

interface JournalFormProps {
  initialReferensiKkp?: string;
  initialKeterangan?: string;
  initialJenis?: 'AJE' | 'RJE';
  onSaved?: () => void;
  onCancel?: () => void;
}

export const JournalEntryForm: React.FC<JournalFormProps> = ({
  initialReferensiKkp = 'B100',
  initialKeterangan = '',
  initialJenis = 'AJE',
  onSaved,
  onCancel,
}) => {
  const { activeEngagement, dispatchAction } = useAtlas();
  const [jenisJurnal, setJenisJurnal] = useState<'AJE' | 'RJE'>(initialJenis);
  const [statusPersetujuan, setStatusPersetujuan] = useState<'Proposed' | 'Accepted' | 'Rejected'>('Accepted');
  const [tanggalJurnal, setTanggalJurnal] = useState(
    activeEngagement?.header.periodeSelesai ?? '2023-12-31'
  );
  const [referensiKkp, setReferensiKkp] = useState(initialReferensiKkp);
  const [keterangan, setKeterangan] = useState(initialKeterangan);

  const tb = activeEngagement?.trialBalance ?? [];
  const defaultDebitAcc = tb[0];
  const defaultCreditAcc = tb[1] ?? tb[0];

  const [lines, setLines] = useState<AuditJournalLine[]>(() => [
    {
      id: 'ln-1',
      accountId: defaultDebitAcc?.id ?? '',
      kodeAkun: defaultDebitAcc?.kodeAkun ?? '',
      namaAkun: defaultDebitAcc?.namaAkun ?? '',
      posisi: 'Debit',
      nilai: 0,
    },
    {
      id: 'ln-2',
      accountId: defaultCreditAcc?.id ?? '',
      kodeAkun: defaultCreditAcc?.kodeAkun ?? '',
      namaAkun: defaultCreditAcc?.namaAkun ?? '',
      posisi: 'Kredit',
      nilai: 0,
    },
  ]);

  const validation = useMemo(
    () => validateAuditJournalEntry({ lines, keterangan, referensiKkp }),
    [lines, keterangan, referensiKkp]
  );

  if (!activeEngagement) return null;
  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'B100');
  const previewNumber = nextJournalNumber(activeEngagement.journals, jenisJurnal);

  const handleAccountChange = (lineId: string, accountId: string) => {
    const acc = tb.find((a) => a.id === accountId);
    if (!acc) return;
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? { ...l, accountId: acc.id, kodeAkun: acc.kodeAkun, namaAkun: acc.namaAkun }
          : l
      )
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid || isReadOnly) return;
    dispatchAction({
      type: 'UPSERT_JOURNAL',
      journal: {
        jenisJurnal,
        statusPersetujuan,
        tanggalJurnal,
        referensiKkp,
        keterangan,
        lines,
      },
    });
    setKeterangan('');
    setLines((prev) => prev.map((l) => ({ ...l, nilai: 0 })));
    onSaved?.();
  };

  return (
    <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Entri Jurnal Audit Double-Entry ({previewNumber})
          </h3>
          <p className="text-[11px] text-slate-500">
            Hanya jurnal berstatus <strong>Accepted</strong> yang masuk ke saldo Audited WSTB (B100), Laporan Keuangan (B120), dan A210.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] font-semibold text-slate-700">
          Auto ID: {previewNumber}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label htmlFor="jrn-jenis" className="block text-[11px] font-semibold text-slate-700 mb-1">
            Jenis Jurnal
          </label>
          <select
            id="jrn-jenis"
            disabled={isReadOnly}
            value={jenisJurnal}
            onChange={(e) => setJenisJurnal(e.target.value as 'AJE' | 'RJE')}
            className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
          >
            <option value="AJE">AJE (Adjusting Journal Entry)</option>
            <option value="RJE">RJE (Reclassification Journal Entry)</option>
          </select>
        </div>
        <div>
          <label htmlFor="jrn-status" className="block text-[11px] font-semibold text-slate-700 mb-1">
            Status Persetujuan
          </label>
          <select
            id="jrn-status"
            disabled={isReadOnly}
            value={statusPersetujuan}
            onChange={(e) =>
              setStatusPersetujuan(e.target.value as 'Proposed' | 'Accepted' | 'Rejected')
            }
            className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
          >
            <option value="Accepted">Accepted (CAJE / CRJE)</option>
            <option value="Proposed">Proposed (PAJE / PRJE)</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label htmlFor="jrn-tanggal" className="block text-[11px] font-semibold text-slate-700 mb-1">
            Tanggal Jurnal
          </label>
          <input
            id="jrn-tanggal"
            type="date"
            disabled={isReadOnly}
            value={tanggalJurnal}
            onChange={(e) => setTanggalJurnal(e.target.value)}
            className="w-full h-8 px-2 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="jrn-ref" className="block text-[11px] font-semibold text-slate-700 mb-1">
            Referensi Indeks KKP
          </label>
          <input
            id="jrn-ref"
            type="text"
            disabled={isReadOnly}
            value={referensiKkp}
            onChange={(e) => setReferensiKkp(e.target.value)}
            placeholder="Misal: B230 / L05 / B100"
            className="w-full h-8 px-2 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
          />
        </div>
      </div>

      {/* Lines table */}
      <div className="overflow-x-auto border border-slate-200 rounded">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
              <th className="py-1.5 px-2 text-left font-semibold">Akun COA</th>
              <th className="py-1.5 px-2 text-left font-semibold w-28">Posisi</th>
              <th className="py-1.5 px-2 text-right font-semibold w-48">Nilai (Rp)</th>
              <th className="py-1.5 px-2 text-center font-semibold w-12">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, idx) => (
              <tr key={line.id}>
                <td className="py-1.5 px-2">
                  <select
                    aria-label={`Akun Baris ${idx + 1}`}
                    disabled={isReadOnly}
                    value={line.accountId}
                    onChange={(e) => handleAccountChange(line.id, e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
                  >
                    {tb.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.kodeAkun} — {a.namaAkun}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1.5 px-2">
                  <select
                    aria-label={`Posisi Baris ${idx + 1}`}
                    disabled={isReadOnly}
                    value={line.posisi}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l) =>
                          l.id === line.id ? { ...l, posisi: e.target.value as 'Debit' | 'Kredit' } : l
                        )
                      )
                    }
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value="Debit">Debit</option>
                    <option value="Kredit">Kredit</option>
                  </select>
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    aria-label={`Nominal Baris ${idx + 1}`}
                    disabled={isReadOnly}
                    value={line.nilai || ''}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setLines((prev) =>
                        prev.map((l) => (l.id === line.id ? { ...l, nilai: val } : l))
                      );
                    }}
                    placeholder="0"
                    className="w-full h-8 px-2 text-xs font-mono tabular-nums text-right bg-white border border-slate-300 rounded text-slate-900"
                  />
                </td>
                <td className="py-1.5 px-2 text-center">
                  <button
                    type="button"
                    disabled={isReadOnly || lines.length <= 2}
                    aria-label={`Hapus baris ${idx + 1}`}
                    onClick={() => setLines((prev) => prev.filter((l) => l.id !== line.id))}
                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={isReadOnly || tb.length === 0}
          onClick={() => {
            const acc = tb[0];
            if (!acc) return;
            setLines((prev) => [
              ...prev,
              {
                id: `ln-${Date.now()}-${prev.length + 1}`,
                accountId: acc.id,
                kodeAkun: acc.kodeAkun,
                namaAkun: acc.namaAkun,
                posisi: 'Kredit',
                nilai: 0,
              },
            ]);
          }}
          className="h-7 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Tambah Baris
        </button>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
          <span>
            Total Dr: <strong>Rp {formatAuditNumber(validation.totalDebit)}</strong>
          </span>
          <span>
            Total Cr: <strong>Rp {formatAuditNumber(validation.totalKredit)}</strong>
          </span>
          <span
            className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
              Math.abs(validation.difference) < 0.01 && validation.totalDebit > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            Selisih: Rp {formatAuditNumber(validation.difference)}
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="jrn-ket" className="text-[11px] font-semibold text-slate-700">
            Penjelasan / Keterangan Audit (Minimal 20 karakter)
          </label>
          <span
            className={`text-[11px] font-mono ${
              keterangan.trim().length >= 20 ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {keterangan.trim().length}/20 karakter
          </span>
        </div>
        <textarea
          id="jrn-ket"
          rows={2}
          disabled={isReadOnly}
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Jelaskan dasar temuan, bukti pendukung, dan dampak penyesuaian audit..."
          className="w-full p-2 text-xs bg-white border border-slate-300 rounded text-slate-900"
        />
      </div>

      {!validation.valid && (
        <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{validation.errors[0]}</div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-8 px-3 rounded border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          data-testid="jrn-submit-btn"
          disabled={!validation.valid || isReadOnly}
          className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium disabled:opacity-40 cursor-pointer"
        >
          Simpan Jurnal ({previewNumber})
        </button>
      </div>
    </form>
  );
};

export const ProposeJournalModal: React.FC<{
  open: boolean;
  referensiKkp: string;
  defaultKeterangan?: string;
  onClose: () => void;
}> = ({ open, referensiKkp, defaultKeterangan, onClose }) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Propose AJE dari ${referensiKkp}`}
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
    >
      <div className="bg-slate-50 border border-slate-300 rounded shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            Propose AJE from Procedure ({referensiKkp})
          </h2>
          <button
            type="button"
            aria-label="Tutup modal AJE"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <JournalEntryForm
          initialReferensiKkp={referensiKkp}
          initialKeterangan={defaultKeterangan}
          initialJenis="AJE"
          onSaved={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export const JournalsAjeRje: React.FC = () => {
  const { activeEngagement, dispatchAction } = useAtlas();
  const [filterType, setFilterType] = useState<'ALL' | 'AJE' | 'RJE'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | AuditJournalEntry['statusPersetujuan']>('ALL');

  if (!activeEngagement) return null;
  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'B100');

  const filtered = activeEngagement.journals.filter((j) => {
    if (filterType !== 'ALL' && j.jenisJurnal !== filterType) return false;
    if (filterStatus !== 'ALL' && j.statusPersetujuan !== filterStatus) return false;
    return true;
  });

  const badgeStatus = (s: AuditJournalEntry['statusPersetujuan']) => {
    if (s === 'Accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'Rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-4">
      <JournalEntryForm />

      <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Daftar Register Jurnal AJE / RJE ({filtered.length} Entri)
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {(['ALL', 'AJE', 'RJE'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`h-7 px-2.5 rounded border cursor-pointer ${
                  filterType === t
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {t === 'ALL' ? 'Semua Jenis' : t}
              </button>
            ))}
            {(['ALL', 'Accepted', 'Proposed', 'Rejected'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`h-7 px-2.5 rounded border cursor-pointer ${
                  filterStatus === st
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded">
            Belum ada jurnal AJE / RJE pada perikatan ini. Gunakan formulir di atas untuk mencatat usulan atau koreksi final.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((j) => (
              <div
                key={j.id}
                data-testid={`journal-card-${j.nomorJurnal}`}
                className="border border-slate-200 rounded p-3 space-y-2 bg-slate-50/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-900">{j.nomorJurnal}</span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${badgeStatus(j.statusPersetujuan)}`}>
                      {j.statusPersetujuan}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Ref: {j.referensiKkp} · {j.tanggalJurnal} · oleh {j.createdBy}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {j.statusPersetujuan !== 'Accepted' && (
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() =>
                          dispatchAction({
                            type: 'SET_JOURNAL_STATUS',
                            journalId: j.id,
                            status: 'Accepted',
                          })
                        }
                        className="h-7 px-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-medium inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        Accept
                      </button>
                    )}
                    {j.statusPersetujuan !== 'Rejected' && (
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() =>
                          dispatchAction({
                            type: 'SET_JOURNAL_STATUS',
                            journalId: j.id,
                            status: 'Rejected',
                          })
                        }
                        className="h-7 px-2 rounded border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-[11px] font-medium disabled:opacity-40 cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isReadOnly}
                      aria-label={`Hapus ${j.nomorJurnal}`}
                      onClick={() =>
                        dispatchAction({ type: 'DELETE_JOURNAL', journalId: j.id })
                      }
                      className="h-7 px-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-[11px] disabled:opacity-40 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-700">{j.keterangan}</p>
                <table className="w-full text-[11px] bg-white border border-slate-200 rounded">
                  <tbody>
                    {j.lines.map((l) => (
                      <tr key={l.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="py-1 px-2 font-mono text-slate-600 w-20">{l.kodeAkun}</td>
                        <td className={`py-1 px-2 text-slate-900 ${l.posisi === 'Kredit' ? 'pl-6' : 'font-medium'}`}>
                          {l.namaAkun}
                        </td>
                        <td className="py-1 px-2 text-right font-mono tabular-nums w-36 text-slate-900">
                          {l.posisi === 'Debit' ? formatAuditNumber(l.nilai) : '-'}
                        </td>
                        <td className="py-1 px-2 text-right font-mono tabular-nums w-36 text-slate-900">
                          {l.posisi === 'Kredit' ? formatAuditNumber(l.nilai) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
