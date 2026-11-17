import React, { useMemo, useState } from 'react';
import { Download, Paperclip, Search, Trash2, Upload } from 'lucide-react';
import { getWorksheet } from '../../data/blueprintLoader';
import { MASTER_INDICES, SINGKATAN_CATALOG } from '../../data/masterIndices';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { PartGroup } from '../../types/atlas';
import { formatAuditNumber, formatIdDateTime, isIndexVisibleForWorkspace } from '../../utils/formatters';

interface Part0ReferenceViewProps {
  kodeIndeks: string;
}

export const Part0ReferenceView: React.FC<Part0ReferenceViewProps> = ({ kodeIndeks }) => {
  const { activeEngagement, activeClient, setActiveIndex, dispatchAction, showToast } =
    useAtlas();
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadIndex, setUploadIndex] = useState('A130');
  const [uploadDesc, setUploadDesc] = useState('');

  const petunjukRows = useMemo(() => {
    const ws = getWorksheet('part0', 'Petunjuk Isi');
    if (!ws) return [];
    const parsed: { indeks: string; judul: string; tujuan: string; petunjuk: string }[] = [];
    for (const row of ws.non_empty_rows) {
      const b = row.cells.find((c) => c.cell.startsWith('B'))?.value ?? '';
      const c = row.cells.find((c) => c.cell.startsWith('C'))?.value ?? '';
      const d = row.cells.find((c) => c.cell.startsWith('D'))?.value ?? '';
      const e = row.cells.find((c) => c.cell.startsWith('E'))?.value ?? '';
      if (b && c && (d || e)) {
        parsed.push({ indeks: b, judul: c, tujuan: d, petunjuk: e });
      }
    }
    return parsed;
  }, []);

  if (kodeIndeks === 'Singkatan') {
    const filtered = SINGKATAN_CATALOG.filter(
      (s) =>
        !searchTerm.trim() ||
        s.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.kepanjangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.kategori.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
      <div className="max-w-5xl mx-auto space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            Kamus singkatan resmi Standar Audit (SPAP - IAPI) & ATLAS v2.1.
          </p>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari singkatan..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-slate-300 rounded"
            />
          </div>
        </div>
        <div className="border border-slate-200 bg-white rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 w-32">Singkatan</th>
                <th className="px-3 py-2">Kepanjangan / Definisi</th>
                <th className="px-3 py-2 w-48">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[13px]">
              {filtered.map((item) => (
                <tr key={item.kode} className="hover:bg-slate-50">
                  <td className="px-3 py-1.5 font-mono font-bold text-slate-900">{item.kode}</td>
                  <td className="px-3 py-1.5 text-slate-800">{item.kepanjangan}</td>
                  <td className="px-3 py-1.5 text-xs text-slate-500">{item.kategori}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (kodeIndeks === 'Petunjuk Isi') {
    const filtered = petunjukRows.filter(
      (r) =>
        !searchTerm.trim() ||
        r.indeks.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tujuan.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
      <div className="max-w-5xl mx-auto space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            Panduan pengisian kertas kerja resmi diekstrak langsung dari blueprint ATLAS v2.1.
          </p>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari indeks atau petunjuk..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-slate-300 rounded"
            />
          </div>
        </div>
        <div className="border border-slate-200 bg-white rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 w-24">Indeks</th>
                <th className="px-3 py-2 w-56">Nama Kertas Kerja</th>
                <th className="px-3 py-2 w-64">Tujuan</th>
                <th className="px-3 py-2">Petunjuk Pengisian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filtered.map((row, idx) => (
                <tr key={`${row.indeks}-${idx}`} className="hover:bg-slate-50 align-top">
                  <td className="px-3 py-2 font-mono font-bold text-indigo-800">{row.indeks}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{row.judul}</td>
                  <td className="px-3 py-2 text-slate-700">{row.tujuan}</td>
                  <td className="px-3 py-2 text-slate-600 leading-relaxed">{row.petunjuk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (kodeIndeks === 'Daftar Lampiran') {
    const isTargetReadOnly = activeEngagement
      ? isWorkpaperReadOnly(activeEngagement, uploadIndex)
      : false;

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeEngagement) return;
      if (isTargetReadOnly) {
        showToast('warning', `KKP ${uploadIndex} terkunci (SA 230). Tidak dapat mengunggah lampiran.`);
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        dispatchAction({
          type: 'ADD_ATTACHMENT',
          attachment: {
            kodeIndeks: uploadIndex,
            namaDokumen: file.name,
            tipeFile: file.type || 'application/octet-stream',
            ukuranBytes: file.size,
            dataUrl: String(reader.result ?? ''),
            keterangan: uploadDesc.trim() || undefined,
          },
        });
        setUploadDesc('');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    const availableIndices = MASTER_INDICES.filter(
      (i) =>
        !i.isReferenceOnly &&
        isIndexVisibleForWorkspace(i.kodeIndeks, activeEngagement, activeClient?.statusKepemilikan)
    );

    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="border border-slate-200 bg-white rounded p-3 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Unggah Dokumen Pendukung (Disimpan Lokal di IndexedDB)
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={uploadIndex}
              onChange={(e) => setUploadIndex(e.target.value)}
              className="h-8 px-2.5 text-xs bg-white border border-slate-300 rounded font-mono"
            >
              {availableIndices.map((idx) => (
                <option key={idx.kodeIndeks} value={idx.kodeIndeks}>
                  {idx.kodeIndeks} — {idx.namaIndeks}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              disabled={isTargetReadOnly}
              placeholder="Keterangan dokumen (mis. Akta Pendirian, Rekening Koran)..."
              className="flex-1 min-w-[200px] h-8 px-2.5 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100"
            />
            <label
              className={`h-8 px-3 rounded text-xs font-medium inline-flex items-center gap-1.5 ${
                isTargetReadOnly
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-700 hover:bg-indigo-800 text-white cursor-pointer'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Pilih & Unggah File
              <input
                type="file"
                disabled={isTargetReadOnly}
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="border border-slate-200 bg-white rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 w-12">No.</th>
                <th className="px-3 py-2 w-24">Indeks</th>
                <th className="px-3 py-2">Nama Dokumen</th>
                <th className="px-3 py-2 text-right w-28">Ukuran (KB)</th>
                <th className="px-3 py-2 w-24">Uploader</th>
                <th className="px-3 py-2 w-40">Waktu</th>
                <th className="px-3 py-2 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {(activeEngagement?.attachments ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Belum ada dokumen lampiran diunggah pada perikatan ini.
                  </td>
                </tr>
              ) : (
                activeEngagement?.attachments.map((att, idx) => {
                  const locked = isWorkpaperReadOnly(activeEngagement, att.kodeIndeks);
                  return (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-indigo-800">
                        {att.kodeIndeks}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          <span>{att.namaDokumen}</span>
                        </div>
                        {att.keterangan && (
                          <p className="text-[11px] text-slate-500">{att.keterangan}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-right text-slate-700">
                        {formatAuditNumber(Math.max(1, Math.round(att.ukuranBytes / 1024)))}
                      </td>
                      <td className="px-3 py-2 font-mono">{att.uploadedBy}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                        {formatIdDateTime(att.uploadedAt)}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap space-x-1">
                        <a
                          href={att.dataUrl}
                          download={att.namaDokumen}
                          title="Unduh file"
                          className="inline-flex p-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          disabled={locked}
                          onClick={() =>
                            dispatchAction({
                              type: 'DELETE_ATTACHMENT',
                              attachmentId: att.id,
                              kodeIndeks: att.kodeIndeks,
                            })
                          }
                          title={locked ? 'Terkunci SA 230' : 'Hapus lampiran'}
                          className="inline-flex p-1 rounded border border-slate-300 text-rose-700 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // AuditCycle overview
  const phases: { title: string; partGroup: PartGroup; sa: string; startIdx: string }[] = [
    { title: '1. Pra-Perikatan (A1)', partGroup: 'Part1', sa: 'SA 210, 220, 300, 510', startIdx: 'A110' },
    { title: '2. Penilaian Risiko (A2)', partGroup: 'Part2', sa: 'SA 315, 320, 240, 260', startIdx: 'A210' },
    { title: '3. Respons Risiko & WSTB (B Core)', partGroup: 'Part3', sa: 'SA 330, 500, 540–580', startIdx: 'B100' },
    { title: '4. Lead Schedules (L02–L47)', partGroup: 'Part4', sa: 'SA 330, SA 530', startIdx: 'L02' },
    { title: '5. Penyelesaian & Opini LAI (C)', partGroup: 'Part5', sa: 'SA 450, 700, 705, 706', startIdx: 'C100' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-3">
      <p className="text-xs text-slate-600">
        Alur siklus audit berbasis risiko IAPI ATLAS v2.1 pada perikatan aktif.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {phases.map((p) => {
          const wps = activeEngagement
            ? Object.values(activeEngagement.workingPapers).filter(
                (w) =>
                  w.partGroup === p.partGroup &&
                  isIndexVisibleForWorkspace(
                    w.kodeIndeks,
                    activeEngagement,
                    activeClient?.statusKepemilikan
                  )
              )
            : [];
          const done = wps.filter(
            (w) => w.status === 'Prepared' || w.status === 'Reviewed' || w.status === 'Locked'
          ).length;

          return (
            <div
              key={p.partGroup}
              className="border border-slate-200 bg-white rounded p-3.5 flex flex-col justify-between gap-3"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{p.title}</h3>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">{p.sa}</p>
                <p className="mt-2 font-mono text-xs text-slate-700 tabular-nums">
                  Sign-off: <strong>{done}</strong> / {wps.length} KKP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveIndex(p.startIdx)}
                className="h-8 px-3 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 cursor-pointer text-left"
              >
                Buka Tahap ({p.startIdx}) →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
