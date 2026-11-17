import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  History,
  MessageSquarePlus,
  MessageSquareText,
  Send,
} from 'lucide-react';
import { useAtlas } from '../../store/AtlasContext';
import { canClearReviewNote, isWorkpaperReadOnly } from '../../store/lockGuard';
import { formatIdDateTime } from '../../utils/formatters';

export const CollapsibleBottomDrawer: React.FC = () => {
  const {
    state,
    activeUser,
    activeEngagement,
    uiPrefs,
    toggleDrawerOpen,
    notesFocusRequest,
    dispatchAction,
  } = useAtlas();
  const [activeTab, setActiveTab] = useState<'notes' | 'audit'>('notes');
  const [newNoteText, setNewNoteText] = useState('');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const noteInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!notesFocusRequest) return;
    setActiveTab('notes');
    const timer = window.setTimeout(() => {
      noteInputRef.current?.focus();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [notesFocusRequest]);

  const kodeIndeks = uiPrefs.activeIndex;
  const isContextSpecific =
    kodeIndeks !== 'HUB' &&
    kodeIndeks !== 'MASTER_KAP' &&
    kodeIndeks !== 'Singkatan' &&
    kodeIndeks !== 'Petunjuk Isi' &&
    kodeIndeks !== 'AuditCycle' &&
    kodeIndeks !== 'Daftar Lampiran';

  const isReadOnly = activeEngagement
    ? isContextSpecific
      ? isWorkpaperReadOnly(activeEngagement, kodeIndeks)
      : activeEngagement.header.isArchived
    : false;

  const visibleNotes = useMemo(() => {
    if (!activeEngagement) return [];
    const base = isContextSpecific
      ? activeEngagement.reviewNotes.filter((n) => n.kodeIndeks === kodeIndeks)
      : activeEngagement.reviewNotes;
    return base.filter((n) => n.parentNoteId === null);
  }, [activeEngagement, isContextSpecific, kodeIndeks]);

  const repliesByParent = useMemo(() => {
    const map: Record<string, typeof visibleNotes> = {};
    if (!activeEngagement) return map;
    for (const note of activeEngagement.reviewNotes) {
      if (note.parentNoteId) {
        if (!map[note.parentNoteId]) map[note.parentNoteId] = [];
        map[note.parentNoteId].push(note);
      }
    }
    return map;
  }, [activeEngagement]);

  const openCount = useMemo(() => {
    if (!activeEngagement) return 0;
    const scope = isContextSpecific
      ? activeEngagement.reviewNotes.filter((n) => n.kodeIndeks === kodeIndeks)
      : activeEngagement.reviewNotes;
    return scope.filter((n) => n.status === 'Open').length;
  }, [activeEngagement, isContextSpecific, kodeIndeks]);

  const totalOpenCount = useMemo(() => {
    if (!activeEngagement) return 0;
    return activeEngagement.reviewNotes.filter((n) => n.status === 'Open').length;
  }, [activeEngagement]);

  const auditEntries = useMemo(() => {
    if (!activeEngagement) return [];
    return [...activeEngagement.auditTrail].reverse().slice(0, 50);
  }, [activeEngagement]);

  const findUser = (userId?: string) => state.users.find((u) => u.id === userId);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activeEngagement || isReadOnly) return;
    dispatchAction({
      type: 'ADD_REVIEW_NOTE',
      kodeIndeks: isContextSpecific ? kodeIndeks : 'HUB',
      catatan: newNoteText,
      assignedToId: assignedToId || undefined,
    });
    setNewNoteText('');
  };

  const handleSendReply = (noteId: string) => {
    if (!replyText.trim() || isReadOnly) return;
    dispatchAction({
      type: 'ADDRESS_REVIEW_NOTE',
      noteId,
      replyText,
    });
    setReplyTargetId(null);
    setReplyText('');
  };

  if (!activeEngagement) return null;

  return (
    <section
      aria-label="Review Notes dan Audit Trail"
      className={`border-t border-slate-300 bg-slate-50 flex flex-col shrink-0 transition-all ${
        uiPrefs.drawerOpen ? 'h-48' : 'h-8'
      }`}
    >
      {/* Header Bar */}
      <div className="h-8 px-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('notes');
              if (!uiPrefs.drawerOpen) toggleDrawerOpen();
            }}
            data-testid="drawer-tab-notes"
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-white text-slate-900 border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>
              Review Notes{' '}
              <span className="font-mono text-[11px] text-slate-500">
                ({isContextSpecific ? `${openCount} di ${kodeIndeks} · ` : ''}
                <span className={totalOpenCount > 0 ? 'text-amber-700 font-semibold' : ''}>
                  {totalOpenCount} OPEN total
                </span>
                )
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('audit');
              if (!uiPrefs.drawerOpen) toggleDrawerOpen();
            }}
            data-testid="drawer-tab-audit"
            className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail Log</span>
            <span className="font-mono text-[10px] text-slate-500">
              ({activeEngagement.auditTrail.length})
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={toggleDrawerOpen}
          aria-label={uiPrefs.drawerOpen ? 'Perkecil Panel Bawah' : 'Perluas Panel Bawah'}
          className="px-2 py-0.5 rounded text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
        >
          <span className="hidden sm:inline">
            {uiPrefs.drawerOpen ? 'Tutup Laci' : 'Buka Laci'}
          </span>
          {uiPrefs.drawerOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Body */}
      {uiPrefs.drawerOpen && (
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {activeTab === 'notes' ? (
            <div className="space-y-2">
              {/* Form Add Review Note */}
              <form onSubmit={handleAddNote} className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <MessageSquarePlus className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    ref={noteInputRef}
                    type="text"
                    data-testid="review-note-input"
                    disabled={isReadOnly}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={
                      isReadOnly
                        ? 'KKP terkunci / diarsipkan — tidak dapat menambah Review Note'
                        : `Tulis Review Note untuk ${isContextSpecific ? kodeIndeks : 'Perikatan'}...`
                    }
                    className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                </div>
                <select
                  aria-label="Tugaskan Review Note ke"
                  disabled={isReadOnly}
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="h-8 px-2 text-xs bg-white border border-slate-300 rounded disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">Ditujukan ke: Semua Tim</option>
                  {state.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.inisial} — {u.namaLengkap}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  data-testid="review-note-submit"
                  disabled={isReadOnly || !newNoteText.trim()}
                  className="h-8 px-3 rounded bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  Tambah Note
                </button>
              </form>

              {/* Notes List */}
              {visibleNotes.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  Belum ada Review Note pada {isContextSpecific ? `indeks ${kodeIndeks}` : 'perikatan ini'}.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {visibleNotes.map((note) => {
                    const author = findUser(note.authorId);
                    const assignee = findUser(note.assignedToId);
                    const replies = repliesByParent[note.id] ?? [];
                    const canClear = canClearReviewNote(
                      activeUser.role,
                      note,
                      activeUser.id,
                      isReadOnly
                    );

                    const badgeColor =
                      note.status === 'Open'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : note.status === 'Addressed'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                    return (
                      <div
                        key={note.id}
                        className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${badgeColor}`}>
                              {note.status}
                            </span>
                            <span className="font-mono font-semibold text-slate-700">
                              {note.kodeIndeks}
                            </span>
                            <span className="font-medium text-slate-800">
                              {author?.namaLengkap ?? 'Auditor'} ({author?.role})
                            </span>
                            {assignee && (
                              <span className="text-slate-500">→ {assignee.inisial}</span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {formatIdDateTime(note.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {note.status !== 'Cleared' && !isReadOnly && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyTargetId(replyTargetId === note.id ? null : note.id)
                                }
                                className="px-2 py-0.5 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 cursor-pointer"
                              >
                                Tanggapi
                              </button>
                            )}
                            {canClear && (
                              <button
                                type="button"
                                data-testid={`btn-clear-note-${note.id}`}
                                onClick={() =>
                                  dispatchAction({ type: 'CLEAR_REVIEW_NOTE', noteId: note.id })
                                }
                                className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                Clear
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="mt-1 text-slate-800 leading-snug">{note.catatan}</p>

                        {replies.length > 0 && (
                          <div className="mt-1.5 pl-3 border-l-2 border-slate-200 space-y-1">
                            {replies.map((rep) => {
                              const repAuthor = findUser(rep.authorId);
                              return (
                                <div key={rep.id} className="text-[11px] text-slate-700">
                                  <span className="font-semibold">{repAuthor?.inisial ?? 'Tim'}:</span>{' '}
                                  {rep.catatan}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {replyTargetId === note.id && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Tulis tanggapan tindak lanjut..."
                              className="flex-1 h-7 px-2 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-indigo-600"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendReply(note.id)}
                              className="h-7 px-2.5 rounded bg-indigo-700 text-white text-[11px] font-medium cursor-pointer"
                            >
                              Kirim Tanggapan
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-2.5 py-1.5">Waktu</th>
                    <th className="px-2.5 py-1.5">Personel</th>
                    <th className="px-2.5 py-1.5">Peran</th>
                    <th className="px-2.5 py-1.5">Indeks</th>
                    <th className="px-2.5 py-1.5">Aksi</th>
                    <th className="px-2.5 py-1.5">Detail</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-200">
                  {auditEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-2.5 py-1 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatIdDateTime(entry.timestamp)}
                      </td>
                      <td className="px-2.5 py-1 font-medium text-slate-800 whitespace-nowrap">
                        {entry.userName}
                      </td>
                      <td className="px-2.5 py-1 text-slate-600 whitespace-nowrap">
                        {entry.userRole}
                      </td>
                      <td className="px-2.5 py-1 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {entry.kodeIndeks}
                      </td>
                      <td className="px-2.5 py-1 font-semibold text-indigo-800 whitespace-nowrap">
                        {entry.action}
                      </td>
                      <td className="px-2.5 py-1 text-slate-700">{entry.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
