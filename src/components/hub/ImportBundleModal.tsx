import React from 'react';
import { AlertTriangle, CopyPlus, RefreshCw, X } from 'lucide-react';
import { AtlasPortableBundle } from '../../types/atlas';
import { formatIdDateTime } from '../../utils/formatters';

interface ImportBundleModalProps {
  bundle: AtlasPortableBundle | null;
  hasConflict: boolean;
  onConfirm: (mode: 'overwrite' | 'copy') => void;
  onClose: () => void;
}

export const ImportBundleModal: React.FC<ImportBundleModalProps> = ({
  bundle,
  hasConflict,
  onConfirm,
  onClose,
}) => {
  if (!bundle) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Impor Berkas Arsip .atlas.json"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-slate-300 rounded-sm shadow-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <h2 className="text-sm font-semibold">Konfirmasi Impor Berkas .atlas.json</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog impor"
            className="text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-xs text-slate-700">
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Entitas Klien:</span>
              <span className="font-semibold text-slate-900">{bundle.client.namaKlien}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tahun Buku / Tipe:</span>
              <span className="font-mono font-semibold text-slate-900">
                {bundle.engagementBundle.header.tahunBuku} ·{' '}
                {bundle.engagementBundle.header.tipePerikatan}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">KAP Asal:</span>
              <span className="font-medium text-slate-800">{bundle.kapProfile.namaKap}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Diekspor Oleh:</span>
              <span>
                {bundle.exportedBy} ({formatIdDateTime(bundle.exportedAt)})
              </span>
            </div>
          </div>

          {hasConflict && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded p-2.5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                ID perikatan ini sudah ada di penyimpanan lokal Anda. Pilih{' '}
                <strong>Timpa Data Lama</strong> untuk mengganti seluruh KKP yang ada, atau{' '}
                <strong>Impor Sebagai Salinan Baru</strong> agar data lama tetap aman.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => onConfirm('copy')}
              className="h-8 px-3 rounded border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <CopyPlus className="w-3.5 h-3.5" />
              Impor Sebagai Salinan Baru
            </button>
            {hasConflict && (
              <button
                type="button"
                onClick={() => onConfirm('overwrite')}
                className="h-8 px-3 rounded bg-indigo-700 hover:bg-indigo-800 text-white font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Timpa Data Lama
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
