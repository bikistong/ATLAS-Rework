import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  FileText,
  TableProperties,
} from 'lucide-react';
import { generateFinancialStatementsDocx } from '../../services/export/docxFinancialStatements';
import { useAtlas } from '../../store/AtlasContext';
import { computeFinancialStatements } from '../../utils/bCoreFormulas';
import { formatAuditNumber } from '../../utils/formatters';

type FsTab = 'NERACA' | 'LABA_RUGI' | 'EKUITAS' | 'ARUS_KAS';

export const FinancialStatementsB120: React.FC = () => {
  const { state, activeEngagement, activeClient, setActiveIndex, showToast } = useAtlas();
  const [activeTab, setActiveTab] = useState<FsTab>('NERACA');
  const [isExporting, setIsExporting] = useState(false);

  const fs = useMemo(() => {
    if (!activeEngagement) return null;
    return computeFinancialStatements(activeEngagement.trialBalance, activeEngagement.journals);
  }, [activeEngagement]);

  if (!activeEngagement || !activeClient || !fs) return null;

  const currYear = activeEngagement.header.tahunBuku;
  const priorYear = currYear - 1;

  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      const filename = await generateFinancialStatementsDocx({
        kapProfile: state.kapProfile,
        client: activeClient,
        workspace: activeEngagement,
      });
      showToast('success', `Dokumen Word 4 Laporan Keuangan "${filename}" berhasil diunduh.`);
    } catch (err) {
      showToast('error', `Gagal mengekspor LK Audited (.docx): ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const renderCompRow = (
    label: string,
    curr: number,
    prior: number,
    options: { bold?: boolean; highlight?: boolean; indent?: boolean } = {}
  ) => (
    <tr
      key={label}
      className={
        options.highlight
          ? 'bg-slate-100 font-semibold border-t border-b border-slate-300'
          : 'hover:bg-slate-50 border-b border-slate-100'
      }
    >
      <td
        className={`py-2 px-3 text-xs ${options.bold ? 'font-bold text-slate-900' : 'text-slate-800'} ${
          options.indent ? 'pl-6' : ''
        }`}
      >
        {label}
      </td>
      <td
        className={`py-2 px-3 text-right font-mono tabular-nums text-xs whitespace-nowrap ${
          options.bold ? 'font-bold text-slate-900' : 'text-slate-800'
        }`}
      >
        {formatAuditNumber(curr)}
      </td>
      <td
        className={`py-2 px-3 text-right font-mono tabular-nums text-xs whitespace-nowrap ${
          options.bold ? 'font-bold text-slate-800' : 'text-slate-600'
        }`}
      >
        {formatAuditNumber(prior)}
      </td>
    </tr>
  );

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header & NERACA BALANCED Banner */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SA 700 · LAPORAN KEUANGAN AUDITED KOMPARATIF ({activeClient.sakDigunakan})
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
              B120 — Generator 4 Laporan Keuangan Audited ({currYear} & {priorYear})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Disusun otomatis secara real-time dari WSTB 12 Kolom (B100). Sign-Off Reviewed pada B100 & B120 hanya diizinkan bila Neraca seimbang.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span
              data-testid="b120-neraca-badge"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold ${
                fs.neraca.isNeracaBalanced
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              {fs.neraca.isNeracaBalanced ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertOctagon className="w-3.5 h-3.5" />
              )}
              {fs.neraca.isNeracaBalanced
                ? 'NERACA BALANCED'
                : `TIDAK SEIMBANG (Selisih Rp ${formatAuditNumber(fs.neraca.selisihNeraca)})`}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex('B100')}
              className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <TableProperties className="w-3.5 h-3.5" />
              Kembali ke WSTB (B100)
            </button>
            <button
              type="button"
              data-testid="b120-export-docx"
              disabled={isExporting}
              onClick={handleExportDocx}
              className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              {isExporting ? 'Membuat .docx...' : 'Export LK Audited (.docx)'}
            </button>
          </div>
        </div>

        {/* 4 Financial Statement Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {(
            [
              { id: 'NERACA', label: '1. Laporan Posisi Keuangan (Neraca)' },
              { id: 'LABA_RUGI', label: '2. Laporan Laba Rugi & OCI' },
              { id: 'EKUITAS', label: '3. Perubahan Ekuitas' },
              { id: 'ARUS_KAS', label: '4. Arus Kas (Tidak Langsung)' },
            ] as { id: FsTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`h-8 px-3 rounded text-xs font-medium border cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Neraca */}
      {activeTab === 'NERACA' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
                <th className="py-2.5 px-3 text-left font-semibold">Pos Laporan Posisi Keuangan</th>
                <th className="py-2.5 px-3 text-right font-semibold w-48">Audited {currYear} (Rp)</th>
                <th className="py-2.5 px-3 text-right font-semibold w-48">Audited {priorYear} (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-50/70">
                <td colSpan={3} className="py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Aset Lancar
                </td>
              </tr>
              {fs.neraca.asetLancarLines.map((l) => renderCompRow(l.label, l.current, l.prior, { indent: true }))}
              {renderCompRow('Jumlah Aset Lancar', fs.neraca.totalAsetLancar, fs.neraca.priorTotalAsetLancar, {
                bold: true,
                highlight: true,
              })}

              <tr className="bg-slate-50/70">
                <td colSpan={3} className="py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Aset Tidak Lancar
                </td>
              </tr>
              {fs.neraca.asetTidakLancarLines.map((l) => renderCompRow(l.label, l.current, l.prior, { indent: true }))}
              {renderCompRow(
                'Jumlah Aset Tidak Lancar',
                fs.neraca.totalAsetTidakLancar,
                fs.neraca.priorTotalAsetTidakLancar,
                { bold: true, highlight: true }
              )}
              <tr className="bg-slate-900 text-white">
                <td className="py-2.5 px-3 text-xs font-bold">TOTAL ASET</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-bold">
                  {formatAuditNumber(fs.neraca.totalAset)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-bold text-slate-200">
                  {formatAuditNumber(fs.neraca.priorTotalAset)}
                </td>
              </tr>

              <tr className="bg-slate-50/70">
                <td colSpan={3} className="py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Liabilitas Jangka Pendek
                </td>
              </tr>
              {fs.neraca.liabilitasPendekLines.map((l) => renderCompRow(l.label, l.current, l.prior, { indent: true }))}
              {renderCompRow(
                'Jumlah Liabilitas Jangka Pendek',
                fs.neraca.totalLiabilitasPendek,
                fs.neraca.priorTotalLiabilitasPendek,
                { bold: true, highlight: true }
              )}

              <tr className="bg-slate-50/70">
                <td colSpan={3} className="py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Liabilitas Jangka Panjang
                </td>
              </tr>
              {fs.neraca.liabilitasPanjangLines.map((l) => renderCompRow(l.label, l.current, l.prior, { indent: true }))}
              {renderCompRow(
                'Jumlah Liabilitas Jangka Panjang',
                fs.neraca.totalLiabilitasPanjang,
                fs.neraca.priorTotalLiabilitasPanjang,
                { bold: true, highlight: true }
              )}
              {renderCompRow('Jumlah Liabilitas', fs.neraca.totalLiabilitas, fs.neraca.priorTotalLiabilitas, {
                bold: true,
              })}

              <tr className="bg-slate-50/70">
                <td colSpan={3} className="py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Ekuitas
                </td>
              </tr>
              {fs.neraca.ekuitasLines.map((l) => renderCompRow(l.label, l.current, l.prior, { indent: true }))}
              {renderCompRow('Jumlah Ekuitas', fs.neraca.totalEkuitas, fs.neraca.priorTotalEkuitas, {
                bold: true,
                highlight: true,
              })}
              <tr className="bg-slate-900 text-white">
                <td className="py-2.5 px-3 text-xs font-bold">TOTAL LIABILITAS DAN EKUITAS</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-bold">
                  {formatAuditNumber(fs.neraca.totalLiabilitasDanEkuitas)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-bold text-slate-200">
                  {formatAuditNumber(fs.neraca.priorTotalLiabilitasDanEkuitas)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Laba Rugi & OCI */}
      {activeTab === 'LABA_RUGI' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
                <th className="py-2.5 px-3 text-left font-semibold">Pos Laba Rugi & Penghasilan Komprehensif Lain</th>
                <th className="py-2.5 px-3 text-right font-semibold w-48">Audited {currYear} (Rp)</th>
                <th className="py-2.5 px-3 text-right font-semibold w-48">Audited {priorYear} (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {fs.labaRugi.pendapatanLines.map((l) => renderCompRow(l.label, l.current, l.prior))}
              {renderCompRow('Pendapatan Usaha Bersih', fs.labaRugi.pendapatanBersih, fs.labaRugi.priorPendapatanBersih, {
                bold: true,
                highlight: true,
              })}
              {fs.labaRugi.hppLines.map((l) => renderCompRow(l.label, -l.current, -l.prior, { indent: true }))}
              {renderCompRow('LABA BRUTO', fs.labaRugi.labaBruto, fs.labaRugi.priorLabaBruto, {
                bold: true,
                highlight: true,
              })}
              {fs.labaRugi.bebanOpsLines.map((l) => renderCompRow(l.label, -l.current, -l.prior, { indent: true }))}
              {renderCompRow('LABA USAHA', fs.labaRugi.labaUsaha, fs.labaRugi.priorLabaUsaha, {
                bold: true,
                highlight: true,
              })}
              {fs.labaRugi.nonOpsLines.map((l) => renderCompRow(l.label, l.current, l.prior, { indent: true }))}
              {renderCompRow(
                'Laba Sebelum Pajak Penghasilan',
                fs.labaRugi.labaSebelumPajak,
                fs.labaRugi.priorLabaSebelumPajak,
                { bold: true }
              )}
              {fs.labaRugi.pajakLines.map((l) => renderCompRow(l.label, -l.current, -l.prior, { indent: true }))}
              <tr className="bg-slate-900 text-white">
                <td className="py-2.5 px-3 text-xs font-bold">LABA BERSIH TAHUN BERJALAN</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-bold">
                  {formatAuditNumber(fs.labaRugi.labaBersih)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-bold text-slate-200">
                  {formatAuditNumber(fs.labaRugi.priorLabaBersih)}
                </td>
              </tr>
              {renderCompRow(
                'Penghasilan Komprehensif Lain (OCI)',
                fs.labaRugi.ociTahunBerjalan,
                fs.labaRugi.priorOciTahunBerjalan
              )}
              {renderCompRow(
                'TOTAL PENGHASILAN KOMPREHENSIF',
                fs.labaRugi.totalPenghasilanKomprehensif,
                fs.labaRugi.priorTotalPenghasilanKomprehensif,
                { bold: true, highlight: true }
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Perubahan Ekuitas */}
      {activeTab === 'EKUITAS' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
                <th className="py-2.5 px-3 text-left font-semibold">Komponen Perubahan Ekuitas ({currYear})</th>
                <th className="py-2.5 px-3 text-right font-semibold w-52">Nilai Audited (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="py-2 px-3">Modal Saham & Tambahan Modal Disetor Awal Periode</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.perubahanEkuitas.modalAwal)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Penambahan (Pengurangan) Modal Disetor Tahun Berjalan</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.perubahanEkuitas.penambahanModal)}</td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td className="py-2 px-3">Saldo Modal Akhir Periode</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.perubahanEkuitas.modalAkhir)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Saldo Laba Awal Periode</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.perubahanEkuitas.saldoLabaAwal)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Laba (Rugi) Bersih Tahun Berjalan</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.perubahanEkuitas.labaBersihBerjalan)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Pembagian Dividen / Penyesuaian Saldo Laba</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.perubahanEkuitas.dividenAtauPenyesuaian)}</td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td className="py-2 px-3">Saldo Laba Akhir Periode</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.perubahanEkuitas.saldoLabaAkhir)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Akumulasi Penghasilan Komprehensif Lain (OCI)</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.perubahanEkuitas.ociAkhir)}</td>
              </tr>
              <tr className="bg-slate-900 text-white font-bold">
                <td className="py-2.5 px-3">TOTAL EKUITAS AKHIR PERIODE</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.perubahanEkuitas.totalEkuitasAkhir)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Arus Kas (Metode Tidak Langsung) */}
      {activeTab === 'ARUS_KAS' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
                <th className="py-2.5 px-3 text-left font-semibold">
                  Laporan Arus Kas — Metode Tidak Langsung ({currYear})
                </th>
                <th className="py-2.5 px-3 text-right font-semibold w-52">Nilai Audited (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr className="bg-slate-50/70">
                <td colSpan={2} className="py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Arus Kas dari Aktivitas Operasi
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6">Laba Bersih Tahun Berjalan</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.labaBersih)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6">Penyesuaian Non-Kas: Penyusutan & Amortisasi</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.penyesuaianPenyusutan)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6">Kenaikan / Penurunan Piutang Usaha</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.perubahanPiutang)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6">Kenaikan / Penurunan Persediaan</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.perubahanPersediaan)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6">Perubahan Aset Lancar Lainnya</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.perubahanAsetLancarLain)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6">Perubahan Utang Usaha & Liabilitas Operasi</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.perubahanLiabilitasOperasi)}</td>
              </tr>
              <tr className="bg-slate-100 font-semibold">
                <td className="py-2 px-3">Arus Kas Bersih Diperoleh dari (Digunakan untuk) Aktivitas Operasi</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.arusKasOperasi)}</td>
              </tr>

              <tr className="bg-slate-50/70">
                <td colSpan={2} className="py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Arus Kas dari Aktivitas Investasi
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6">Perolehan / Pelepasan Aset Tetap & Investasi Jangka Panjang</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.perolehanAsetTetapDanInvestasi)}</td>
              </tr>
              <tr className="bg-slate-100 font-semibold">
                <td className="py-2 px-3">Arus Kas Bersih Digunakan untuk Aktivitas Investasi</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.arusKasInvestasi)}</td>
              </tr>

              <tr className="bg-slate-50/70">
                <td colSpan={2} className="py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Arus Kas dari Aktivitas Pendanaan
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6">Penerimaan / Pembayaran Pinjaman & Pembiayaan</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.perubahanUtangPembiayaan)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 pl-6">Setoran Modal / Dividen / Perubahan Ekuitas Lainnya</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.perubahanModalDanDividen)}</td>
              </tr>
              <tr className="bg-slate-100 font-semibold">
                <td className="py-2 px-3">Arus Kas Bersih Diperoleh dari (Digunakan untuk) Aktivitas Pendanaan</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.arusKasPendanaan)}</td>
              </tr>

              <tr className="bg-slate-50 font-semibold">
                <td className="py-2 px-3">Kenaikan (Penurunan) Bersih Kas & Setara Kas</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.kenaikanBersihKas)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Kas & Setara Kas Awal Periode</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.kasAwal)}</td>
              </tr>
              <tr className="bg-slate-900 text-white font-bold">
                <td className="py-2.5 px-3">KAS & SETARA KAS AKHIR PERIODE (NERACA)</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatAuditNumber(fs.arusKas.kasAkhirNeraca)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-[11px] text-slate-500">
                  Selisih Rekonsiliasi Arus Kas vs Neraca
                </td>
                <td
                  className={`py-2 px-3 text-right font-mono tabular-nums text-[11px] font-semibold ${
                    Math.abs(fs.arusKas.selisihKas) < 0.01 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {formatAuditNumber(fs.arusKas.selisihKas)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
