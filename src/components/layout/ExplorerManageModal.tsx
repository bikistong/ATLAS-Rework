import React, { useEffect, useState } from 'react';
import { FolderPlus, FilePlus2, Pencil, Trash2, X } from 'lucide-react';
import { MASTER_INDICES, SIDEBAR_GROUPS } from '../../data/masterIndices';
import { useAtlas } from '../../store/AtlasContext';
import { PartGroup } from '../../types/atlas';

export type ExplorerModalState =
  | {
      type: 'create';
      initialTab: 'workpaper' | 'category';
      defaultPartGroup?: PartGroup;
      defaultCategoryId?: string;
      defaultParentIndeks?: string | null;
    }
  | {
      type: 'rename-workpaper';
      kodeIndeks: string;
      initialName: string;
      initialSa?: string;
    }
  | {
      type: 'rename-category';
      categoryId: string;
      initialCode: string;
      initialLabel: string;
    }
  | {
      type: 'delete-workpaper';
      kodeIndeks: string;
      namaIndeks: string;
    }
  | {
      type: 'delete-category';
      categoryId: string;
      code: string;
      label: string;
    }
  | null;

interface ExplorerManageModalProps {
  modal: ExplorerModalState;
  onClose: () => void;
  onExpandCreatedTarget: (nodeIds: string[]) => void;
}

const RESERVED_CATEGORY_CODES = new Set(['HOME', 'A1', 'A2', 'B', 'L02-L47', 'C']);

export const ExplorerManageModal: React.FC<ExplorerManageModalProps> = ({
  modal,
  onClose,
  onExpandCreatedTarget,
}) => {
  const { activeEngagement, uiPrefs, dispatchAction, setActiveIndex } = useAtlas();

  const [createTab, setCreateTab] = useState<'workpaper' | 'category'>('workpaper');
  const [wpCode, setWpCode] = useState('');
  const [wpName, setWpName] = useState('');
  const [wpSa, setWpSa] = useState('KKP Tambahan');
  const [targetBucket, setTargetBucket] = useState<string>('part:Part1');
  const [parentIndeks, setParentIndeks] = useState<string>('');

  const [catCode, setCatCode] = useState('');
  const [catLabel, setCatLabel] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!modal) return;
    setErrorText(null);
    if (modal.type === 'create') {
      setCreateTab(modal.initialTab);
      setWpCode('');
      setWpName('');
      setWpSa('KKP Tambahan');
      setParentIndeks(modal.defaultParentIndeks ?? '');
      if (modal.defaultCategoryId) {
        setTargetBucket(`custom:${modal.defaultCategoryId}`);
      } else {
        setTargetBucket(`part:${modal.defaultPartGroup ?? 'Part1'}`);
      }
      setCatCode('');
      setCatLabel('');
    } else if (modal.type === 'rename-workpaper') {
      setWpCode(modal.kodeIndeks);
      setWpName(modal.initialName);
      setWpSa(modal.initialSa ?? '');
    } else if (modal.type === 'rename-category') {
      setCatCode(modal.initialCode);
      setCatLabel(modal.initialLabel);
    }
  }, [modal]);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal, onClose]);

  if (!modal || !activeEngagement) return null;

  const customCategories = activeEngagement.customCategories ?? [];

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    if (createTab === 'category') {
      const cleanCode = catCode
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9._-]/g, '');
      const cleanLabel = catLabel.trim();
      if (!cleanCode || cleanCode.length > 12) {
        setErrorText('Kode kategori wajib diisi (1–12 karakter huruf/angka).');
        return;
      }
      if (!cleanLabel) {
        setErrorText('Nama kategori wajib diisi.');
        return;
      }
      if (
        RESERVED_CATEGORY_CODES.has(cleanCode) ||
        customCategories.some((c) => c.code.toUpperCase() === cleanCode)
      ) {
        setErrorText(`Kode kategori "${cleanCode}" sudah digunakan.`);
        return;
      }
      dispatchAction({
        type: 'CREATE_CUSTOM_CATEGORY',
        code: cleanCode,
        label: cleanLabel,
      });
      onClose();
      return;
    }

    const cleanWpCode = wpCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9._-]/g, '');
    const cleanWpName = wpName.trim();
    if (!cleanWpCode || cleanWpCode.length > 16) {
      setErrorText('Kode indeks KKP wajib diisi (1–16 karakter huruf/angka/titik/strip).');
      return;
    }
    if (!cleanWpName) {
      setErrorText('Nama kertas kerja wajib diisi.');
      return;
    }
    const hasCollision =
      Object.keys(activeEngagement.workingPapers).some(
        (k) => k.toUpperCase() === cleanWpCode
      ) || MASTER_INDICES.some((m) => m.kodeIndeks.toUpperCase() === cleanWpCode);
    if (hasCollision) {
      setErrorText(`Kode indeks "${cleanWpCode}" sudah terdaftar pada perikatan ini.`);
      return;
    }

    const cleanParent = parentIndeks.trim() || null;
    const parentWp = cleanParent ? activeEngagement.workingPapers[cleanParent] : undefined;

    let resolvedPartGroup: PartGroup = 'Part1';
    let resolvedCategoryId: string | undefined;

    if (parentWp) {
      resolvedPartGroup = parentWp.partGroup;
      resolvedCategoryId = parentWp.categoryId;
    } else if (targetBucket.startsWith('custom:')) {
      resolvedCategoryId = targetBucket.slice('custom:'.length);
      resolvedPartGroup = 'Part0';
    } else if (targetBucket.startsWith('part:')) {
      resolvedPartGroup = targetBucket.slice('part:'.length) as PartGroup;
    }

    dispatchAction({
      type: 'CREATE_CUSTOM_WORKPAPER',
      kodeIndeks: cleanWpCode,
      namaIndeks: cleanWpName,
      partGroup: resolvedPartGroup,
      categoryId: resolvedCategoryId,
      parentIndeks: cleanParent,
      saRelevan: wpSa.trim() || 'KKP Tambahan',
    });

    const expandIds: string[] = [];
    if (resolvedCategoryId) {
      expandIds.push(`cat:custom:${resolvedCategoryId}`);
    } else {
      expandIds.push(`cat:${resolvedPartGroup}`);
    }
    if (cleanParent) {
      expandIds.push(`wp:${cleanParent}`);
    }
    onExpandCreatedTarget(expandIds);
    setActiveIndex(cleanWpCode);
    onClose();
  };

  const handleSubmitRenameWorkpaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.type !== 'rename-workpaper') return;
    if (!wpName.trim()) {
      setErrorText('Nama kertas kerja tidak boleh kosong.');
      return;
    }
    dispatchAction({
      type: 'RENAME_CUSTOM_WORKPAPER',
      kodeIndeks: modal.kodeIndeks,
      namaIndeks: wpName.trim(),
      saRelevan: wpSa.trim(),
    });
    onClose();
  };

  const handleSubmitRenameCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.type !== 'rename-category') return;
    const cleanCode = catCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9._-]/g, '');
    if (!cleanCode || cleanCode.length > 12 || !catLabel.trim()) {
      setErrorText('Kode pendek (1–12 karakter) dan nama kategori wajib diisi.');
      return;
    }
    if (
      cleanCode !== modal.initialCode &&
      (RESERVED_CATEGORY_CODES.has(cleanCode) ||
        customCategories.some(
          (c) => c.id !== modal.categoryId && c.code.toUpperCase() === cleanCode
        ))
    ) {
      setErrorText(`Kode kategori "${cleanCode}" sudah digunakan.`);
      return;
    }
    dispatchAction({
      type: 'RENAME_CUSTOM_CATEGORY',
      categoryId: modal.categoryId,
      code: cleanCode,
      label: catLabel.trim(),
    });
    onClose();
  };

  const handleConfirmDelete = () => {
    if (modal.type === 'delete-workpaper') {
      dispatchAction({
        type: 'DELETE_CUSTOM_WORKPAPER',
        kodeIndeks: modal.kodeIndeks,
      });
      if (uiPrefs.activeIndex === modal.kodeIndeks) {
        setActiveIndex('HOME');
      }
      onClose();
    } else if (modal.type === 'delete-category') {
      dispatchAction({
        type: 'DELETE_CUSTOM_CATEGORY',
        categoryId: modal.categoryId,
      });
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kelola Kategori dan Kertas Kerja"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-300 rounded-md shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {modal.type === 'create' ? (
              createTab === 'category' ? (
                <FolderPlus className="w-4 h-4 text-indigo-700" />
              ) : (
                <FilePlus2 className="w-4 h-4 text-indigo-700" />
              )
            ) : modal.type === 'rename-workpaper' || modal.type === 'rename-category' ? (
              <Pencil className="w-4 h-4 text-indigo-700" />
            ) : (
              <Trash2 className="w-4 h-4 text-rose-600" />
            )}
            <h2 className="text-sm font-semibold text-slate-900">
              {modal.type === 'create'
                ? modal.defaultParentIndeks
                  ? `Tambah Sub-KKP di Bawah ${modal.defaultParentIndeks}`
                  : 'Tambah Kategori / KKP Kustom'
                : modal.type === 'rename-workpaper'
                  ? `Ubah KKP ${modal.kodeIndeks}`
                  : modal.type === 'rename-category'
                    ? `Ubah Kategori ${modal.initialCode}`
                    : modal.type === 'delete-workpaper'
                      ? `Hapus KKP ${modal.kodeIndeks}?`
                      : `Hapus Kategori ${modal.code}?`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {modal.type === 'create' && (
          <form onSubmit={handleSubmitCreate} className="p-4 space-y-3">
            {!modal.defaultParentIndeks && (
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded">
                <button
                  type="button"
                  data-testid="modal-tab-create-workpaper"
                  onClick={() => {
                    setCreateTab('workpaper');
                    setErrorText(null);
                  }}
                  className={`py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    createTab === 'workpaper'
                      ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  KKP Kustom
                </button>
                <button
                  type="button"
                  data-testid="modal-tab-create-category"
                  onClick={() => {
                    setCreateTab('category');
                    setErrorText(null);
                  }}
                  className={`py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    createTab === 'category'
                      ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kategori Indeks
                </button>
              </div>
            )}

            {createTab === 'category' ? (
              <>
                <div>
                  <label
                    htmlFor="explorer-cat-code"
                    className="block text-[11px] font-medium text-slate-700 mb-1"
                  >
                    Kode Pendek Kategori
                  </label>
                  <input
                    id="explorer-cat-code"
                    data-testid="explorer-cat-code-input"
                    type="text"
                    maxLength={12}
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    placeholder="Contoh: KSP atau TAX"
                    className="w-full h-8 px-2.5 text-xs font-mono uppercase border border-slate-300 rounded focus:outline-none focus:border-indigo-600"
                    autoFocus
                  />
                </div>
                <div>
                  <label
                    htmlFor="explorer-cat-label"
                    className="block text-[11px] font-medium text-slate-700 mb-1"
                  >
                    Nama Kategori
                  </label>
                  <input
                    id="explorer-cat-label"
                    data-testid="explorer-cat-label-input"
                    type="text"
                    value={catLabel}
                    onChange={(e) => setCatLabel(e.target.value)}
                    placeholder="Contoh: Ekualisasi Pajak & Kertas Kerja Khusus"
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </>
            ) : (
              <>
                {!parentIndeks && (
                  <div>
                    <label
                      htmlFor="explorer-wp-bucket"
                      className="block text-[11px] font-medium text-slate-700 mb-1"
                    >
                      Kategori Tujuan
                    </label>
                    <select
                      id="explorer-wp-bucket"
                      data-testid="explorer-wp-bucket-select"
                      value={targetBucket}
                      onChange={(e) => setTargetBucket(e.target.value)}
                      className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-indigo-600"
                    >
                      {SIDEBAR_GROUPS.map((g) => (
                        <option key={g.partGroup} value={`part:${g.partGroup}`}>
                          {g.shortCode} — {g.label}
                        </option>
                      ))}
                      {customCategories.map((c) => (
                        <option key={c.id} value={`custom:${c.id}`}>
                          {c.code} — {c.label} (Kustom)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {parentIndeks && (
                  <div className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-900">
                    Induk KKP: <span className="font-mono font-bold">{parentIndeks}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label
                      htmlFor="explorer-wp-code"
                      className="block text-[11px] font-medium text-slate-700 mb-1"
                    >
                      Kode Indeks
                    </label>
                    <input
                      id="explorer-wp-code"
                      data-testid="explorer-wp-code-input"
                      type="text"
                      maxLength={16}
                      value={wpCode}
                      onChange={(e) => setWpCode(e.target.value)}
                      placeholder="Mis. KSP01"
                      className="w-full h-8 px-2.5 text-xs font-mono uppercase border border-slate-300 rounded focus:outline-none focus:border-indigo-600"
                      autoFocus
                    />
                  </div>
                  <div className="col-span-2">
                    <label
                      htmlFor="explorer-wp-sa"
                      className="block text-[11px] font-medium text-slate-700 mb-1"
                    >
                      Referensi Standar (SA)
                    </label>
                    <input
                      id="explorer-wp-sa"
                      data-testid="explorer-wp-sa-input"
                      type="text"
                      value={wpSa}
                      onChange={(e) => setWpSa(e.target.value)}
                      placeholder="SA 500 / KKP Tambahan"
                      className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="explorer-wp-name"
                    className="block text-[11px] font-medium text-slate-700 mb-1"
                  >
                    Nama Kertas Kerja
                  </label>
                  <input
                    id="explorer-wp-name"
                    data-testid="explorer-wp-name-input"
                    type="text"
                    value={wpName}
                    onChange={(e) => setWpName(e.target.value)}
                    placeholder="Contoh: Rekonsiliasi Faktur Pajak Keluaran"
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </>
            )}

            {errorText && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5">
                {errorText}
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                data-testid="explorer-modal-submit"
                className="h-8 px-3.5 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium cursor-pointer"
              >
                {createTab === 'category' ? 'Buat Kategori' : 'Buat KKP'}
              </button>
            </div>
          </form>
        )}

        {modal.type === 'rename-workpaper' && (
          <form onSubmit={handleSubmitRenameWorkpaper} className="p-4 space-y-3">
            <div>
              <label
                htmlFor="rename-wp-name"
                className="block text-[11px] font-medium text-slate-700 mb-1"
              >
                Nama Kertas Kerja ({modal.kodeIndeks})
              </label>
              <input
                id="rename-wp-name"
                data-testid="rename-wp-name-input"
                type="text"
                value={wpName}
                onChange={(e) => setWpName(e.target.value)}
                className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-600"
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="rename-wp-sa"
                className="block text-[11px] font-medium text-slate-700 mb-1"
              >
                Referensi Standar (SA)
              </label>
              <input
                id="rename-wp-sa"
                type="text"
                value={wpSa}
                onChange={(e) => setWpSa(e.target.value)}
                className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-600"
              />
            </div>
            {errorText && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5">
                {errorText}
              </p>
            )}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                data-testid="explorer-modal-submit"
                className="h-8 px-3.5 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}

        {modal.type === 'rename-category' && (
          <form onSubmit={handleSubmitRenameCategory} className="p-4 space-y-3">
            <div>
              <label
                htmlFor="rename-cat-code"
                className="block text-[11px] font-medium text-slate-700 mb-1"
              >
                Kode Pendek Kategori
              </label>
              <input
                id="rename-cat-code"
                type="text"
                maxLength={12}
                value={catCode}
                onChange={(e) => setCatCode(e.target.value)}
                className="w-full h-8 px-2.5 text-xs font-mono uppercase border border-slate-300 rounded focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label
                htmlFor="rename-cat-label"
                className="block text-[11px] font-medium text-slate-700 mb-1"
              >
                Nama Kategori
              </label>
              <input
                id="rename-cat-label"
                data-testid="rename-cat-label-input"
                type="text"
                value={catLabel}
                onChange={(e) => setCatLabel(e.target.value)}
                className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-600"
                autoFocus
              />
            </div>
            {errorText && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5">
                {errorText}
              </p>
            )}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                data-testid="explorer-modal-submit"
                className="h-8 px-3.5 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}

        {(modal.type === 'delete-workpaper' || modal.type === 'delete-category') && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-700 leading-relaxed">
              {modal.type === 'delete-workpaper'
                ? `Anda yakin ingin menghapus kertas kerja kustom "${modal.kodeIndeks} — ${modal.namaIndeks}"? Catatan simpulan pada indeks ini akan dihapus dari perikatan.`
                : `Anda yakin ingin menghapus kategori kustom "${modal.code} — ${modal.label}"?`}
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                data-testid="explorer-modal-confirm-delete"
                onClick={handleConfirmDelete}
                className="h-8 px-3.5 rounded bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
