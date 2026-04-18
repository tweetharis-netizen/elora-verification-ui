import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
    Plus, Pencil, Trash2, MessageSquare, Clock,
    Search, ChevronDown, Pin, Users, X, History,
    CalendarDays, Check,
} from 'lucide-react';
import type { TeacherCopilotConversation } from '../../services/dataService';
import { ThreadSkeleton } from './CopilotShared';

// ── Constants ─────────────────────────────────────────────────────────────────

const RECENT_LIMIT = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

function useOnClickOutside(
    ref: React.RefObject<HTMLElement>,
    handler: (event: MouseEvent | TouchEvent) => void
) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) return;
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}

function relativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function fullDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString([], {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function monthKey(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString([], { month: 'long', year: 'numeric' });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CopilotThreadSidebarProps = {
    threads: TeacherCopilotConversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
    onRename: (id: string, title: string) => void;
    onPin: (id: string, pinned: boolean) => void;
    role?: 'teacher' | 'student' | 'parent';
    themeColor?: string;
    isLoading?: boolean;
    canCreateNewChat?: boolean;
    classes?: any[];
    selectedClassId?: string | null;
    onClassSelect?: (id: string | null) => void;
};

// ── Compact sidebar row (used in main list) ───────────────────────────────────

type SidebarRowProps = {
    thread: TeacherCopilotConversation;
    isActive: boolean;
    themeColor: string;
    onSelect: () => void;
    onDelete: () => void;
    onRename: (title: string) => void;
    onPin: (pinned: boolean) => void;
    isPinned?: boolean;
};

const SidebarRow: React.FC<SidebarRowProps> = ({
    thread,
    isActive,
    themeColor,
    onSelect,
    onDelete,
    onRename,
    onPin,
    isPinned = false,
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(thread.title ?? 'Untitled Session');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const commitRename = () => {
        const trimmed = renameValue.trim();
        if (trimmed && trimmed !== thread.title) onRename(trimmed);
        else setRenameValue(thread.title || 'Untitled Session');
        setIsRenaming(false);
    };

    const displayTitle = thread.title?.trim() || 'Untitled Session';
    const ts = relativeTime(thread.updatedAt ?? thread.createdAt);

    return (
        <div
            className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                isActive
                    ? 'bg-slate-100 ring-1 ring-slate-200/60'
                    : 'hover:bg-slate-50'
            }`}
            onClick={() => { if (!isRenaming) onSelect(); }}
        >
            {/* Icon */}
            <div className="shrink-0">
                {isPinned ? (
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
                        <Pin size={10} strokeWidth={3} />
                    </div>
                ) : (
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${isActive ? 'bg-slate-100' : 'bg-slate-50 group-hover:bg-slate-100'}`} style={isActive ? { backgroundColor: themeColor + '20', color: themeColor } : {}}>
                        <MessageSquare size={10} strokeWidth={3} className={isActive ? '' : 'text-slate-400'} style={isActive ? { color: themeColor } : {}} />
                    </div>
                )}
            </div>

            {/* Title & time */}
            <div className="flex-1 min-w-0 pr-24">
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                            if (e.key === 'Escape') setIsRenaming(false);
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full text-[12px] font-bold bg-white rounded-lg px-2 py-0.5 outline-none focus:ring-2"
                        style={{ borderColor: themeColor + '40', color: themeColor }}
                    />
                ) : (
                    <div className="flex items-baseline justify-between gap-2 min-w-0">
                        <span className={`text-[12px] font-bold truncate tracking-tight min-w-0 ${isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                            {displayTitle}
                        </span>
                        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest`} style={{ color: isActive ? themeColor : '#94a3b8' }}>
                            {ts}
                        </span>
                    </div>
                )}
            </div>

            {/* Hover actions — absolute so they don't disturb layout */}
            {!isRenaming && (
                <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={e => { e.stopPropagation(); onPin(!isPinned); }}
                        className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-400"
                        style={isPinned ? { color: themeColor } : { color: '#94a3b8' }}
                        onMouseEnter={(e) => !isPinned && (e.currentTarget.style.color = themeColor)}
                        onMouseLeave={(e) => !isPinned && (e.currentTarget.style.color = '#94a3b8')}
                        title={isPinned ? 'Unpin' : 'Pin'}>
                        <Pin size={11} className={isPinned ? 'fill-current' : ''} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setIsRenaming(true); }}
                        className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 transition-all"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = themeColor)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                        title="Rename">
                        <Pencil size={11} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 transition-all"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                        title="Delete">
                        <Trash2 size={11} />
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Archive row (used inside the modal — bigger, clearer) ─────────────────────

type ArchiveRowProps = {
    thread: TeacherCopilotConversation;
    isActive: boolean;
    themeColor: string;
    onSelect: () => void;
    onDelete: () => void;
    onRename: (title: string) => void;
    onPin: (pinned: boolean) => void;
};

const ArchiveRow: React.FC<ArchiveRowProps> = ({
    thread,
    isActive,
    themeColor,
    onSelect,
    onDelete,
    onRename,
    onPin,
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(thread.title ?? 'Untitled Session');
    const inputRef = useRef<HTMLInputElement>(null);
    const isPinned = !!thread.isPinned;

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const commitRename = () => {
        const trimmed = renameValue.trim();
        if (trimmed && trimmed !== thread.title) onRename(trimmed);
        else setRenameValue(thread.title || 'Untitled Session');
        setIsRenaming(false);
    };

    const displayTitle = thread.title?.trim() || 'Untitled Session';
    const ts = relativeTime(thread.updatedAt ?? thread.createdAt);
    const fd = fullDate(thread.updatedAt ?? thread.createdAt);

    return (
        <div
            className={`group relative flex items-start gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                isActive ? 'ring-1 shadow-sm' : 'hover:bg-slate-50 hover:shadow-sm'
            }`}
            style={isActive ? { backgroundColor: themeColor + '12', ringColor: themeColor + '40' } : {}}
            onClick={() => { if (!isRenaming) onSelect(); }}
        >
            {/* Icon */}
            <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors`}
                style={isActive 
                    ? { backgroundColor: themeColor + '25', color: themeColor }
                    : isPinned
                        ? { backgroundColor: '#fef3c7', color: '#f59e0b' }
                        : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                }
            >
                {isPinned
                    ? <Pin size={14} className="fill-current opacity-80" />
                    : isActive
                        ? <MessageSquare size={14} />
                        : <MessageSquare size={14} />
                }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                            if (e.key === 'Escape') setIsRenaming(false);
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full text-[13px] font-bold bg-white border rounded-xl px-3 py-1.5 outline-none focus:ring-2 shadow-sm"
                        style={{ borderColor: themeColor + '60' }}
                        placeholder="Conversation title..."
                    />
                ) : (
                    <p className={`text-[13px] font-bold leading-snug truncate min-w-0`} style={{ color: isActive ? themeColor : '#1e293b' }}>
                        {displayTitle}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[11px] font-medium`} style={{ color: isActive ? themeColor : '#cbd5e1' }}>{fd}</span>
                    {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest" style={{ color: themeColor }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
                            Active
                        </span>
                    )}
                </div>
            </div>

            {/* Right: timestamp + actions */}
            <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest`} style={{ color: isActive ? themeColor : '#cbd5e1' }}>
                    {ts}
                </span>

                {/* Action buttons — always visible on hover */}
                {!isRenaming && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                            onClick={e => { e.stopPropagation(); onPin(!isPinned); }}
                            className={`p-1.5 rounded-lg transition-all text-slate-400 hover:bg-slate-100 shadow-sm`}
                            style={isPinned ? { color: '#f59e0b', backgroundColor: '#fef3c7' } : {}}
                            onMouseEnter={(e) => !isPinned && ((e.currentTarget.style.backgroundColor = themeColor + '15'), (e.currentTarget.style.color = themeColor))}
                            onMouseLeave={(e) => !isPinned && ((e.currentTarget.style.backgroundColor = 'transparent'), (e.currentTarget.style.color = '#94a3b8'))}
                            title={isPinned ? 'Unpin' : 'Pin'}
                        >
                            <Pin size={12} className={isPinned ? 'fill-current' : ''} />
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); setIsRenaming(true); }}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-400 shadow-sm transition-all"
                            style={{}}
                            onMouseEnter={(e) => (e.currentTarget.style.color = themeColor)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                            title="Rename"
                        >
                            <Pencil size={12} />
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); onDelete(); }}
                            className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 shadow-sm transition-all"
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── All History Modal (portaled to body) ──────────────────────────────────────

type AllHistoryModalProps = {
    threads: TeacherCopilotConversation[];
    activeId: string | null;
    themeColor: string;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, title: string) => void;
    onPin: (id: string, pinned: boolean) => void;
    onClose: () => void;
};

const AllHistoryModal: React.FC<AllHistoryModalProps> = ({
    threads,
    activeId,
    themeColor,
    onSelect,
    onDelete,
    onRename,
    onPin,
    onClose,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    // Auto-focus search on open
    useEffect(() => {
        const t = setTimeout(() => searchRef.current?.focus(), 80);
        return () => clearTimeout(t);
    }, []);

    // Keyboard dismiss
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    // Prevent body scroll while open
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const sorted = useMemo(() => {
        let list = [...threads];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t => t.title?.toLowerCase().includes(q));
        }
        return list.sort(
            (a, b) =>
                new Date(b.updatedAt ?? b.createdAt).getTime() -
                new Date(a.updatedAt ?? a.createdAt).getTime()
        );
    }, [threads, searchQuery]);

    // Group by month
    const grouped = useMemo(() => {
        const map = new Map<string, TeacherCopilotConversation[]>();
        sorted.forEach(t => {
            const key = monthKey(t.updatedAt ?? t.createdAt);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(t);
        });
        return Array.from(map.entries());
    }, [sorted]);

    const pinnedThreads = useMemo(() => sorted.filter(t => t.isPinned), [sorted]);
    const unpinnedGrouped = useMemo(() => {
        const map = new Map<string, TeacherCopilotConversation[]>();
        sorted.filter(t => !t.isPinned).forEach(t => {
            const key = monthKey(t.updatedAt ?? t.createdAt);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(t);
        });
        return Array.from(map.entries());
    }, [sorted]);

    const handleSelect = useCallback((id: string) => {
        onSelect(id);
        onClose();
    }, [onSelect, onClose]);

    const modal = (
        <div
            className="fixed inset-0 z-[9999] flex"
            style={{ fontFamily: 'inherit' }}
        >
            {/* Scrim — click to close */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Drawer panel */}
            <div className="relative z-10 flex flex-col h-full bg-white animate-in slide-in-from-left-6 fade-in duration-300 ease-out"
                style={{ width: 'min(420px, 92vw)', boxShadow: '4px 0 40px rgba(0,0,0,0.18)' }}
            >
                {/* ── Header ── */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 shrink-0">
                    <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: themeColor + '18', color: themeColor }}
                    >
                        <History size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight">All Conversations</h2>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{threads.length} thread{threads.length !== 1 ? 's' : ''} saved</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0"
                        title="Close (Esc)"
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* ── Search ── */}
                <div className="px-5 py-4 shrink-0 border-b border-slate-50">
                    <div className="relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search all conversations..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white text-[13px] font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400"
                            onFocus={(e) => ((e.currentTarget.style.borderColor = themeColor), (e.currentTarget.style.boxShadow = `0 0 0 2px ${themeColor}20`))}
                            onBlur={(e) => ((e.currentTarget.style.borderColor = '#e2e8f0'), (e.currentTarget.style.boxShadow = 'none'))}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="text-[11px] font-medium text-slate-400 mt-2 px-1">
                            {sorted.length === 0 ? 'No results' : `${sorted.length} result${sorted.length !== 1 ? 's' : ''}`}
                        </p>
                    )}
                </div>

                {/* ── Scrollable list ── */}
                <div className="flex-1 overflow-y-auto min-h-0" style={{ overscrollBehavior: 'contain' }}>
                    {sorted.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
                            <MessageSquare size={32} className="text-slate-300" />
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="px-4 py-4 space-y-6">
                            {/* Pinned section (only when not searching) */}
                            {!searchQuery && pinnedThreads.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 px-1 mb-2">
                                        <Pin size={10} className="text-amber-400" />
                                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">Pinned</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {pinnedThreads.map(t => (
                                            <ArchiveRow
                                                key={t.id}
                                                thread={t}
                                                isActive={activeId === t.id}
                                                themeColor={themeColor}
                                                onSelect={() => handleSelect(t.id)}
                                                onDelete={() => onDelete(t.id)}
                                                onRename={title => onRename(t.id, title)}
                                                onPin={p => onPin(t.id, p)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Month groups */}
                            {(searchQuery ? grouped : unpinnedGrouped).map(([month, monthThreads]) => (
                                <div key={month}>
                                    <div className="flex items-center gap-2 px-1 mb-2">
                                        <CalendarDays size={10} className="text-slate-300" />
                                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em]">{month}</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {monthThreads.map(t => (
                                            <ArchiveRow
                                                key={t.id}
                                                thread={t}
                                                isActive={activeId === t.id}
                                                themeColor={themeColor}
                                                onSelect={() => handleSelect(t.id)}
                                                onDelete={() => onDelete(t.id)}
                                                onRename={title => onRename(t.id, title)}
                                                onPin={p => onPin(t.id, p)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-3 border-t border-slate-100 shrink-0 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                        Press <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono text-[9px]">Esc</kbd> to close
                    </p>
                    {activeId && threads.find(t => t.id === activeId) && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: themeColor }}>
                            <Check size={10} strokeWidth={3} />
                            <span>Active thread selected</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modal, document.body);
};


// ── Main Sidebar Component ────────────────────────────────────────────────────

const CopilotThreadSidebar: React.FC<CopilotThreadSidebarProps> = ({
    threads,
    activeId,
    onSelect,
    onNew,
    onDelete,
    onRename,
    onPin,
    role = 'teacher',
    themeColor = '#14b8a6',
    isLoading = false,
    canCreateNewChat = true,
    classes = [],
    selectedClassId,
    onClassSelect,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const classDropdownRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(classDropdownRef, () => setIsClassDropdownOpen(false));

    const selectedClass = classes.find(c => c.id === selectedClassId);
    
    // Role-specific labels
    const getContextLabel = () => {
        switch (role) {
            case 'student':
                return 'Subject';
            case 'parent':
                return 'Child';
            default:
                return 'Class';
        }
    };

    const getContextAllLabel = () => {
        switch (role) {
            case 'student':
                return 'All Subjects';
            case 'parent':
                return 'All Children';
            default:
                return 'All Classes';
        }
    };

    const contextLabel = getContextLabel();
    const contextAllLabel = getContextAllLabel();

    const sortedThreads = useMemo(() => {
        let list = [...threads];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t => t.title?.toLowerCase().includes(q));
        }
        return list.sort(
            (a, b) =>
                new Date(b.updatedAt ?? b.createdAt).getTime() -
                new Date(a.updatedAt ?? a.createdAt).getTime()
        );
    }, [threads, searchQuery]);

    const pinnedThreads = useMemo(() => sortedThreads.filter(t => t.isPinned), [sortedThreads]);
    const unpinnedThreads = useMemo(() => sortedThreads.filter(t => !t.isPinned), [sortedThreads]);
    const recentThreads = useMemo(() => unpinnedThreads.slice(0, RECENT_LIMIT), [unpinnedThreads]);
    const hasMore = unpinnedThreads.length > RECENT_LIMIT;
    const hiddenCount = unpinnedThreads.length - RECENT_LIMIT;

    return (
        <>
            <div className="flex flex-col h-full bg-slate-50 border-r border-slate-100 overflow-hidden select-none">

                {/* ── Header ── */}
                <div className="p-4 space-y-3 shrink-0 bg-white border-b border-slate-100 shadow-sm">

                    {/* Class dropdown */}
                    <div className="relative" ref={classDropdownRef}>
                        <button
                            onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                            className="w-full h-10 px-4 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 hover:bg-white transition-all"
                            style={{ borderColor: isClassDropdownOpen ? themeColor : '#e2e8f0' }}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor + '20', color: themeColor }}>
                                    <Users size={12} strokeWidth={2.5} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 truncate pr-2 uppercase tracking-widest">
                                    {selectedClass ? selectedClass.name : contextAllLabel}
                                </span>
                            </div>
                            <ChevronDown
                                size={14}
                                className={`transition-transform duration-300`}
                                style={{ color: isClassDropdownOpen ? themeColor : '#94a3b8', transform: isClassDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                        </button>

                        {isClassDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="max-h-64 overflow-y-auto">
                                    <button
                                        onClick={() => { onClassSelect?.(null); setIsClassDropdownOpen(false); }}
                                        className={`w-full px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest transition-colors text-slate-500 hover:bg-slate-50 hover:text-slate-900`}
                                        style={!selectedClassId ? { backgroundColor: themeColor + '15', color: themeColor } : {}}
                                    >
                                        {contextAllLabel}
                                    </button>
                                    {classes.map(cls => (
                                        <button
                                            key={cls.id}
                                            onClick={() => { onClassSelect?.(cls.id); setIsClassDropdownOpen(false); }}
                                            className={`w-full px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest border-t border-slate-50 transition-colors text-slate-500 hover:bg-slate-50 hover:text-slate-900`}
                                            style={selectedClassId === cls.id ? { backgroundColor: themeColor + '15', color: themeColor } : {}}
                                        >
                                            {cls.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search + New chat */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:transition-colors" style={{}} />
                            <input
                                type="text"
                                placeholder="Find chat..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white text-xs font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400"
                                onFocus={(e) => ((e.currentTarget.style.borderColor = themeColor), (e.previousElementSibling as any).style.color = themeColor)}
                                onBlur={(e) => ((e.currentTarget.style.borderColor = '#e2e8f0'), (e.previousElementSibling as any).style.color = '#94a3b8')}
                            />
                        </div>
                        <button
                            onClick={onNew}
                            disabled={!canCreateNewChat}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all shrink-0 ${
                                canCreateNewChat
                                    ? 'shadow-sm'
                                    : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                            }`}
                            style={canCreateNewChat ? { backgroundColor: themeColor + '15', borderColor: themeColor + '40', color: themeColor } : {}}
                            onMouseEnter={(e) => canCreateNewChat && ((e.currentTarget.style.backgroundColor = themeColor), (e.currentTarget.style.color = 'white'))}
                            onMouseLeave={(e) => canCreateNewChat && ((e.currentTarget.style.backgroundColor = themeColor + '15'), (e.currentTarget.style.color = themeColor))}
                            title={canCreateNewChat ? 'New Chat Session' : 'Active chat must have messages first'}
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* ── Thread list — fixed height, never grows the outer layout ── */}
                <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1">
                    {isLoading ? (
                        <ThreadSkeleton />
                    ) : sortedThreads.length === 0 ? (
                        <div className="px-4 py-12 text-center opacity-40">
                            <MessageSquare size={24} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                {searchQuery ? 'No results found' : 'No history yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Pinned */}
                            {pinnedThreads.length > 0 && (
                                <div className="space-y-0.5">
                                    <div className="px-3 py-1">
                                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pinned</h4>
                                    </div>
                                    {pinnedThreads.map(t => (
                                        <SidebarRow
                                            key={t.id}
                                            thread={t}
                                            isActive={activeId === t.id}
                                            themeColor={themeColor}
                                            onSelect={() => onSelect(t.id)}
                                            onDelete={() => onDelete(t.id)}
                                            onRename={title => onRename(t.id, title)}
                                            onPin={p => onPin(t.id, p)}
                                            isPinned
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Recent (capped) */}
                            {recentThreads.length > 0 && (
                                <div className="space-y-0.5">
                                    {!searchQuery && (
                                        <div className="px-3 py-1">
                                            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Recent</h4>
                                        </div>
                                    )}
                                    {(searchQuery ? sortedThreads : recentThreads).map(t => (
                                        <SidebarRow
                                            key={t.id}
                                            thread={t}
                                            isActive={activeId === t.id}
                                            themeColor={themeColor}
                                            onSelect={() => onSelect(t.id)}
                                            onDelete={() => onDelete(t.id)}
                                            onRename={title => onRename(t.id, title)}
                                            onPin={p => onPin(t.id, p)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* "View all chats" affordance */}
                            {!searchQuery && hasMore && (
                                <div className="pt-2 px-1">
                                    <button
                                        onClick={() => setShowAllHistory(true)}
                                        className="w-full group flex items-center justify-between px-3 py-3 rounded-xl border transition-all duration-300"
                                        style={{ backgroundColor: themeColor + '08', borderColor: themeColor + '30' }}
                                        onMouseEnter={(e) => ((e.currentTarget.style.backgroundColor = themeColor + '15'), (e.currentTarget.style.borderColor = themeColor + '50'))}
                                        onMouseLeave={(e) => ((e.currentTarget.style.backgroundColor = themeColor + '08'), (e.currentTarget.style.borderColor = themeColor + '30'))}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="transition-colors" style={{ color: themeColor }} />
                                            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] transition-colors" style={{ color: themeColor }}>
                                                View all chats
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full transition-colors" style={{ backgroundColor: themeColor }}>
                                            +{hiddenCount}
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Portal modal — escapes all overflow constraints */}
            {showAllHistory && (
                <AllHistoryModal
                    threads={threads}
                    activeId={activeId}
                    themeColor={themeColor}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onRename={onRename}
                    onPin={onPin}
                    onClose={() => setShowAllHistory(false)}
                />
            )}
        </>
    );
};

export default CopilotThreadSidebar;
