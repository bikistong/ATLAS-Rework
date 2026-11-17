import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FilePlus2,
  Folder,
  FolderOpen,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import {
  DEFAULT_EXPLORER_EXPANDED,
  ExplorerNode,
  buildExplorerTree,
  collectAllExpandableNodeIds,
} from '../../utils/explorerTree';
import { SidebarStatusFilter } from '../../utils/hubMetrics';
import { ExplorerManageModal, ExplorerModalState } from './ExplorerManageModal';
import { WorkpaperStatusIcon } from './StatusIcon';

interface ContextMenuState {
  x: number;
  y: number;
  node: ExplorerNode;
}

export const SidebarTree: React.FC = () => {
  const {
    activeEngagement,
    activeClient,
    uiPrefs,
    setActiveIndex,
    setExpandedNodeIds,
    openReviewNotesForIndex,
    dispatchAction,
  } = useAtlas();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SidebarStatusFilter>('semua');
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [modalState, setModalState] = useState<ExplorerModalState>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const expandedMap: Record<string, boolean> = useMemo(
    () => ({
      ...DEFAULT_EXPLORER_EXPANDED,
      ...(uiPrefs.expandedNodeIds ?? {}),
    }),
    [uiPrefs.expandedNodeIds]
  );

  const tree = useMemo(
    () =>
      buildExplorerTree({
        workspace: activeEngagement,
        ownershipStatus: activeClient?.statusKepemilikan,
        searchQuery,
        statusFilter,
      }),
    [activeEngagement, activeClient?.statusKepemilikan, searchQuery, statusFilter]
  );

  const hasActiveFilter = Boolean(searchQuery.trim()) || statusFilter !== 'semua';
  const isArchived = activeEngagement?.header.isArchived ?? false;

  const isNodeExpanded = (node: ExplorerNode): boolean => {
    if (hasActiveFilter) {
      return Boolean(tree.autoExpandedIds[node.id]);
    }
    if (expandedMap[node.id] !== undefined) {
      return expandedMap[node.id];
    }
    // Newly created custom categories open by default
    if (node.nodeType === 'category' && node.isCustom) {
      return true;
    }
    return false;
  };

  const toggleNodeExpanded = (node: ExplorerNode) => {
    const currentlyOpen = isNodeExpanded(node);
    setExpandedNodeIds((prev) => ({
      ...DEFAULT_EXPLORER_EXPANDED,
      ...prev,
      [node.id]: !currentlyOpen,
    }));
  };

  const handleExpandAll = () => {
    const allIds = collectAllExpandableNodeIds(tree.categories);
    const next: Record<string, boolean> = { ...expandedMap };
    for (const id of allIds) {
      next[id] = true;
    }
    setExpandedNodeIds(next);
  };

  const handleCollapseAll = () => {
    const allIds = collectAllExpandableNodeIds(tree.categories);
    const next: Record<string, boolean> = { ...expandedMap };
    for (const id of allIds) {
      next[id] = false;
    }
    setExpandedNodeIds(next);
  };

  const handleExpandNodes = (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    setExpandedNodeIds((prev) => {
      const next = { ...DEFAULT_EXPLORER_EXPANDED, ...prev };
      for (const id of nodeIds) {
        next[id] = true;
      }
      return next;
    });
  };

  const openContextMenuAt = (x: number, y: number, node: ExplorerNode) => {
    const clampedX = Math.min(x, window.innerWidth - 220);
    const clampedY = Math.min(y, window.innerHeight - 230);
    setContextMenu({
      x: Math.max(8, clampedX),
      y: Math.max(8, clampedY),
      node,
    });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  if (uiPrefs.sidebarCollapsed) {
    return null;
  }

  const progressPercent =
    tree.totalWorkpaperCount > 0
      ? Math.round((tree.completedWorkpaperCount / tree.totalWorkpaperCount) * 100)
      : 0;

  const renderTreeNode = (node: ExplorerNode): React.ReactNode => {
    if (node.nodeType === 'category') {
      const isOpen = isNodeExpanded(node);
      return (
        <div key={node.id} className="mb-1">
          <div
            onContextMenu={(e) => {
              e.preventDefault();
              openContextMenuAt(e.clientX, e.clientY, node);
            }}
            className="group flex items-center pr-1.5 hover:bg-slate-100/80 transition-colors"
          >
            <button
              type="button"
              data-testid={`sidebar-category-${node.id}`}
              aria-expanded={isOpen}
              onClick={() => toggleNodeExpanded(node)}
              className="flex-1 min-w-0 px-2 py-1.5 flex items-center justify-between text-left cursor-pointer"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span
                  className={`font-mono text-[11px] font-bold shrink-0 ${
                    node.isCustom ? 'text-indigo-700' : 'text-slate-700'
                  }`}
                >
                  {node.shortCode}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 truncate">
                  {node.label}
                </span>
              </span>
              <span className="font-mono text-[10px] text-slate-400 tabular-nums ml-1 shrink-0">
                {node.completedCount}/{node.totalCount}
              </span>
            </button>

            <button
              type="button"
              aria-label={`Menu kategori ${node.shortCode}`}
              data-testid={`sidebar-cat-menu-${node.id}`}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                openContextMenuAt(rect.right - 190, rect.bottom + 4, node);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer shrink-0"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {isOpen && (
            <div className="ml-2.5 pl-1.5 border-l border-slate-200 space-y-0.5 pb-1">
              {node.children.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-slate-400 italic">
                  Belum ada KKP di kategori ini
                </p>
              ) : (
                node.children.map((child) => renderTreeNode(child))
              )}
            </div>
          )}
        </div>
      );
    }

    if (node.nodeType === 'subfolder') {
      const isOpen = isNodeExpanded(node);
      return (
        <div key={node.id} className="my-0.5">
          <button
            type="button"
            data-testid={`sidebar-subfolder-${node.id}`}
            aria-expanded={isOpen}
            onClick={() => toggleNodeExpanded(node)}
            className="w-full px-1.5 py-1 flex items-center justify-between text-left rounded-sm hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 min-w-0">
              {isOpen ? (
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span className="text-[11.5px] font-medium text-slate-700 truncate">
                {node.label}
              </span>
            </span>
            <span className="font-mono text-[10px] text-slate-400 tabular-nums ml-1 shrink-0">
              {node.completedCount}/{node.totalCount}
            </span>
          </button>

          {isOpen && (
            <div className="ml-2.5 pl-1.5 border-l border-slate-200 space-y-0.5 pt-0.5">
              {node.children.map((child) => renderTreeNode(child))}
            </div>
          )}
        </div>
      );
    }

    // Workpaper node
    const kode = node.kodeIndeks ?? node.shortCode;
    const isActive = uiPrefs.activeIndex === kode;
    const hasChildren = node.children.length > 0;
    const isOpen = hasChildren ? isNodeExpanded(node) : false;

    return (
      <div key={node.id}>
        <div
          onContextMenu={(e) => {
            e.preventDefault();
            openContextMenuAt(e.clientX, e.clientY, node);
          }}
          className={`group flex items-center pr-1 rounded-sm transition-colors ${
            isActive
              ? 'bg-indigo-50 text-indigo-900 border-r-2 border-indigo-600 font-semibold'
              : 'text-slate-700 hover:bg-slate-100/80'
          } ${!node.matchesDirectFilter ? 'opacity-70' : ''}`}
        >
          {hasChildren ? (
            <button
              type="button"
              data-testid={`sidebar-toggle-${kode}`}
              aria-expanded={isOpen}
              aria-label={isOpen ? `Perkecil sub-KKP ${kode}` : `Perluas sub-KKP ${kode}`}
              onClick={() => toggleNodeExpanded(node)}
              className="w-5 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
            >
              {isOpen ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <span className="w-3 shrink-0" aria-hidden="true" />
          )}

          <button
            type="button"
            data-testid={`sidebar-node-${kode}`}
            onClick={() => setActiveIndex(kode)}
            title={`${kode} — ${node.label}`}
            className="flex-1 min-w-0 py-1.5 pr-1 flex items-center justify-between gap-1.5 text-left cursor-pointer"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {node.status && (
                <WorkpaperStatusIcon status={node.status} className="w-3.5 h-3.5 shrink-0" />
              )}
              <span
                className={`font-mono font-bold text-[10.5px] px-1 py-0.5 rounded shrink-0 ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-800'
                    : node.isCustom
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                {kode}
              </span>
              <span className="text-[12px] truncate">{node.label}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {node.isPinned && (
                <Star
                  className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0"
                  aria-label="Difavoritkan"
                />
              )}
              {node.openNotesCount > 0 && (
                <span
                  title={`${node.openNotesCount} Review Note Open`}
                  className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold text-rose-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {node.openNotesCount}
                </span>
              )}
              {node.signOffSummary && (
                <span
                  className={`text-[10px] font-mono ${
                    isActive ? 'text-indigo-700' : 'text-slate-400'
                  }`}
                >
                  {node.signOffSummary}
                </span>
              )}
            </div>
          </button>

          <button
            type="button"
            aria-label={`Menu aksi ${kode}`}
            data-testid={`sidebar-menu-btn-${kode}`}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              openContextMenuAt(rect.right - 190, rect.bottom + 4, node);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer shrink-0"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {hasChildren && isOpen && (
          <div className="ml-2.5 pl-1.5 border-l border-slate-200 space-y-0.5 pt-0.5">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      aria-label="Document Manager Indeks Kertas Kerja"
      className="w-[304px] bg-slate-50/70 border-r border-slate-200 flex flex-col shrink-0 h-full overflow-hidden select-none"
    >
      {/* Document Manager Header + Action Toolbar + Filter + Status Tabs */}
      <div className="p-2.5 bg-white border-b border-slate-200 space-y-2">
        <div className="flex items-center justify-between gap-1 px-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
              Document Manager
            </span>
            <span className="font-mono text-[10.5px] text-slate-500 tabular-nums shrink-0">
              {tree.visibleWorkpaperCount}/{tree.totalWorkpaperCount}
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              data-testid="sidebar-expand-all"
              aria-label="Perluas semua cabang"
              title="Perluas semua cabang (Expand All)"
              onClick={handleExpandAll}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="sidebar-collapse-all"
              aria-label="Perkecil semua cabang"
              title="Perkecil semua cabang (Collapse All)"
              onClick={handleCollapseAll}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              <ChevronsDownUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="sidebar-add-btn"
              aria-label="Tambah kategori atau KKP kustom"
              title={
                isArchived
                  ? 'Perikatan diarsipkan (SA 230)'
                  : 'Tambah Kategori atau KKP Kustom'
              }
              disabled={isArchived}
              onClick={() =>
                setModalState({
                  type: 'create',
                  initialTab: 'workpaper',
                  defaultPartGroup: 'Part1',
                })
              }
              className="ml-0.5 h-6 px-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Baru</span>
            </button>
          </div>
        </div>

        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <label htmlFor="sidebar-index-filter" className="sr-only">
            Filter indeks, nama KKP, atau SA
          </label>
          <input
            id="sidebar-index-filter"
            data-testid="sidebar-filter-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter indeks, nama KKP, atau SA..."
            className="w-full h-8 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus filter"
              className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3 Status Tabs: Semua | Belum | Selesai */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded">
          {(
            [
              { id: 'semua', label: 'Semua' },
              { id: 'belum', label: 'Belum' },
              { id: 'selesai', label: 'Selesai' },
            ] as { id: SidebarStatusFilter; label: string }[]
          ).map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`sidebar-status-tab-${tab.id}`}
                onClick={() => setStatusFilter(tab.id)}
                className={`py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hierarchical Tree Content */}
      <nav className="flex-1 overflow-y-auto py-1.5 bg-white">
        {/* Pinned / Favorit Section */}
        {tree.pinnedWorkpapers.length > 0 && (
          <div
            data-testid="sidebar-pinned-section"
            className="mb-1.5 pb-1.5 border-b border-slate-200"
          >
            <button
              type="button"
              aria-expanded={pinnedOpen}
              onClick={() => setPinnedOpen((p) => !p)}
              className="w-full px-2 py-1 flex items-center justify-between text-left hover:bg-slate-50 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                {pinnedOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                  Favorit
                </span>
              </span>
              <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                {tree.pinnedWorkpapers.length}
              </span>
            </button>

            {pinnedOpen && (
              <ul className="px-1.5 space-y-0.5">
                {tree.pinnedWorkpapers.map((node) => {
                  const kode = node.kodeIndeks ?? node.shortCode;
                  const isActive = uiPrefs.activeIndex === kode;
                  return (
                    <li
                      key={`pin-${kode}`}
                      className={`group flex items-center rounded-sm pr-1 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-900 border-r-2 border-indigo-600 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <button
                        type="button"
                        data-testid={`sidebar-pinned-node-${kode}`}
                        onClick={() => setActiveIndex(kode)}
                        className="flex-1 min-w-0 px-2 py-1 flex items-center gap-1.5 text-left cursor-pointer"
                      >
                        {node.status && (
                          <WorkpaperStatusIcon
                            status={node.status}
                            className="w-3.5 h-3.5 shrink-0"
                          />
                        )}
                        <span className="font-mono font-bold text-[10.5px] text-indigo-700 shrink-0">
                          {kode}
                        </span>
                        <span className="text-[11.5px] truncate">{node.label}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Lepas favorit ${kode}`}
                        title="Lepas dari Favorit"
                        onClick={() =>
                          dispatchAction({ type: 'TOGGLE_PIN_WORKPAPER', kodeIndeks: kode })
                        }
                        className="p-1 rounded text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
                      >
                        <PinOff className="w-3 h-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Main Categories Tree */}
        {tree.categories.length === 0 ? (
          <div className="px-4 py-8 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Tidak ada indeks kertas kerja yang sesuai dengan filter saat ini.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('semua');
              }}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-medium text-indigo-700 cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          tree.categories.map((catNode) => renderTreeNode(catNode))
        )}
      </nav>

      {/* Bottom Progress Summary */}
      {activeEngagement && (
        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
            <span className="font-medium">Progres Sign-Off KKP</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {tree.completedWorkpaperCount}/{tree.totalWorkpaperCount} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Contextual Action Popover Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          role="menu"
          data-testid="sidebar-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-52 bg-white border border-slate-200 rounded-md shadow-lg py-1 text-xs text-slate-800"
        >
          {contextMenu.node.nodeType === 'workpaper' && contextMenu.node.kodeIndeks && (
            <>
              <div className="px-3 py-1 border-b border-slate-100 text-[10.5px] font-mono font-semibold text-slate-500 truncate">
                {contextMenu.node.kodeIndeks} · {contextMenu.node.label}
              </div>

              <button
                type="button"
                role="menuitem"
                data-testid="ctx-action-pin"
                onClick={() => {
                  dispatchAction({
                    type: 'TOGGLE_PIN_WORKPAPER',
                    kodeIndeks: contextMenu.node.kodeIndeks!,
                  });
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-left cursor-pointer"
              >
                {contextMenu.node.isPinned ? (
                  <>
                    <PinOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lepas dari Favorit</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pin ke Favorit</span>
                  </>
                )}
              </button>

              <button
                type="button"
                role="menuitem"
                data-testid="ctx-action-notes"
                onClick={() => {
                  openReviewNotesForIndex(contextMenu.node.kodeIndeks!);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MessageSquareText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Buka Review Notes</span>
                </span>
                {contextMenu.node.openNotesCount > 0 && (
                  <span className="font-mono text-[10px] font-bold text-rose-600">
                    {contextMenu.node.openNotesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                role="menuitem"
                data-testid="ctx-action-add-sub"
                disabled={isArchived}
                onClick={() => {
                  setModalState({
                    type: 'create',
                    initialTab: 'workpaper',
                    defaultPartGroup: contextMenu.node.partGroup,
                    defaultCategoryId: contextMenu.node.categoryId,
                    defaultParentIndeks: contextMenu.node.kodeIndeks,
                  });
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer"
              >
                <FilePlus2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Tambah Sub-KKP</span>
              </button>

              {contextMenu.node.isCustom && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  {(() => {
                    const lockedOrArchived = isWorkpaperReadOnly(
                      activeEngagement,
                      contextMenu.node.kodeIndeks!
                    );
                    const hasChildren = contextMenu.node.children.length > 0;
                    return (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          data-testid="ctx-action-rename"
                          disabled={lockedOrArchived}
                          onClick={() => {
                            setModalState({
                              type: 'rename-workpaper',
                              kodeIndeks: contextMenu.node.kodeIndeks!,
                              initialName: contextMenu.node.label,
                              initialSa: contextMenu.node.saRelevan,
                            });
                            setContextMenu(null);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ubah Nama KKP</span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          data-testid="ctx-action-delete"
                          disabled={lockedOrArchived || hasChildren}
                          title={
                            hasChildren
                              ? 'Hapus sub-KKP turunan terlebih dahulu'
                              : lockedOrArchived
                                ? 'KKP terkunci (SA 230)'
                                : undefined
                          }
                          onClick={() => {
                            setModalState({
                              type: 'delete-workpaper',
                              kodeIndeks: contextMenu.node.kodeIndeks!,
                              namaIndeks: contextMenu.node.label,
                            });
                            setContextMenu(null);
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus KKP</span>
                        </button>
                      </>
                    );
                  })()}
                </>
              )}
            </>
          )}

          {contextMenu.node.nodeType === 'category' && (
            <>
              <div className="px-3 py-1 border-b border-slate-100 text-[10.5px] font-mono font-semibold text-slate-500 truncate">
                {contextMenu.node.shortCode} · {contextMenu.node.label}
              </div>

              <button
                type="button"
                role="menuitem"
                data-testid="ctx-action-add-in-cat"
                disabled={isArchived}
                onClick={() => {
                  setModalState({
                    type: 'create',
                    initialTab: 'workpaper',
                    defaultPartGroup: contextMenu.node.partGroup ?? 'Part0',
                    defaultCategoryId: contextMenu.node.categoryId,
                  });
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer"
              >
                <FilePlus2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tambah KKP di Kategori Ini</span>
              </button>

              {contextMenu.node.isCustom && contextMenu.node.categoryId && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    role="menuitem"
                    data-testid="ctx-action-rename-cat"
                    disabled={isArchived}
                    onClick={() => {
                      setModalState({
                        type: 'rename-category',
                        categoryId: contextMenu.node.categoryId!,
                        initialCode: contextMenu.node.shortCode,
                        initialLabel: contextMenu.node.label,
                      });
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-600" />
                    <span>Ubah Kategori</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    data-testid="ctx-action-delete-cat"
                    disabled={isArchived || contextMenu.node.children.length > 0}
                    title={
                      contextMenu.node.children.length > 0
                        ? 'Kategori masih berisi KKP'
                        : undefined
                    }
                    onClick={() => {
                      setModalState({
                        type: 'delete-category',
                        categoryId: contextMenu.node.categoryId!,
                        code: contextMenu.node.shortCode,
                        label: contextMenu.node.label,
                      });
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Kategori</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Creation / Rename / Delete Modal */}
      <ExplorerManageModal
        modal={modalState}
        onClose={() => setModalState(null)}
        onExpandCreatedTarget={handleExpandNodes}
      />
    </aside>
  );
};
