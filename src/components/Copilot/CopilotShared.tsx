import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    ChevronUp,
    ChevronDown,
    CheckCircle2,
    ArrowRight,
    Plus,
    Send,
    LayoutDashboard,
    BookOpen,
    Gamepad2,
    Users,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Layers,
    Check,
    GraduationCap,
    BarChart2,
    FileText,
    MessageSquare,
    TrendingUp,
    History
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EloraLogo } from '../EloraLogo';
import { CopilotFeedbackRow } from './CopilotFeedbackRow';
import { sendCopilotFeedback } from '../../lib/api/eloraCopilotClient';
import { getRoleSidebarTheme, type RoleSidebarTheme, type EloraRole } from '../../lib/roleTheme';
import type { 
    CopilotFeedbackReason, 
    CopilotFeedbackRating, 
    UseCase, 
    UserRole,
    CopilotFileAttachment,
    HomeAction
} from '../../lib/llm/types';

// --- Shared Types ---
export type Step = {
    id: string;
    text: string;
};

export type ActionChip = {
    label: string;
    actionType: 'navigate';
    destination?: string;
};

export type ThreadContext = {
    classId?: string | null;
    className?: string | null;
    studentId?: string | null;
    studentName?: string | null;
    label?: string | null;
};

/** A single follow-up suggestion chip rendered beneath an assistant message. */
export type CopilotSuggestion = {
    id: string;
    label: string;
};

export type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    steps?: Step[];
    actions?: ActionChip[];
    intent?: string;
    /** Whether to show the feedback row for this message (~5% chance) */
    showFeedback?: boolean;
    conversationId?: string;
    threadContext?: ThreadContext;
    persistedAt?: string;
    source?: string;
    metadata?: Record<string, unknown> | null;
    /** Follow-up suggestion chips. Parsed from the LLM response, client-side only. */
    suggestions?: CopilotSuggestion[];
    /** Use case used for this response, used by feedback telemetry. */
    useCase?: string;
    /** Optional source tag for telemetry, such as teacher_copilot_page. */
    feedbackSource?: string;
    /** Files attached to this message. */
    fileAttachments?: CopilotFileAttachment[];
};

/** A standard privacy and retention note for Copilot file uploads. */
export const CopilotPrivacyNote: React.FC<{
    themeColor: string;
    role?: 'teacher' | 'student' | 'parent';
}> = ({ themeColor, role = 'student' }) => {
    const roleMessageByRole: Record<'teacher' | 'student' | 'parent', string> = {
        teacher: '',
        student: '',
        parent: '',
    };

    return (
    <div className="w-full flex items-start gap-2 px-4 py-2 rounded-lg bg-slate-50 dark:bg-[var(--elora-surface-alt)] border border-slate-100 dark:border-[var(--elora-border-subtle)] text-[11px] leading-relaxed text-slate-500 dark:text-[var(--elora-text-muted)] transition-colors duration-500">
        <Sparkles size={12} className="shrink-0 mt-0.5" style={{ color: themeColor }} />
        <></>
    </div>
    );
};

/** Small context chips bar that shows active sources the Copilot is using */
export const CopilotContextBar: React.FC<{
    sources?: { id: string; label: string; type?: string }[];
}> = ({ sources = [] }) => {
    if (!sources || sources.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-2 items-center mb-3">
            {sources.slice(0,6).map((s) => (
                <div key={s.id} className="text-[12px] px-3 py-1 rounded-full bg-white dark:bg-[var(--elora-surface-main)] border border-slate-100 dark:border-[var(--elora-border-subtle)] shadow-sm dark:shadow-md text-slate-600 dark:text-[var(--elora-text-muted)] transition-colors duration-500">
                    <strong className="mr-1 text-slate-700 dark:text-[var(--elora-text-strong)]">{s.type ? `${s.type}:` : ''}</strong>
                    <span className="truncate max-w-[160px]">{s.label}</span>
                </div>
            ))}
        </div>
    );
};

/** Simple Artifact Studio panel (right-hand) to show generated artifacts */
export const ArtifactStudio: React.FC<{
    artifacts: { id: string; title: string; summary: string; content: string; kind?: string }[];
    onClose?: () => void;
}> = ({ artifacts, onClose }) => {
    if (!artifacts || artifacts.length === 0) return null;
    return (
        <aside className="fixed right-6 top-24 w-[360px] max-h-[70vh] overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-lg p-4 z-50">
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold">Artifact Studio</h3>
                <div className="text-xs text-slate-400">Generated artifacts</div>
            </div>
            <div className="space-y-3">
                {artifacts.map((a) => (
                    <div key={a.id} className="border rounded-lg p-3 bg-slate-50">
                        <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium">{a.title}</div>
                            <div className="text-xs text-slate-400">{a.kind}</div>
                        </div>
                        <div className="text-[13px] text-slate-700 mb-2">{a.summary}</div>
                        <details>
                            <summary className="text-xs text-teal-600 cursor-pointer">View content</summary>
                            <div className="prose max-w-none mt-2 text-sm whitespace-pre-wrap">{a.content}</div>
                        </details>
                    </div>
                ))}
            </div>
            <div className="mt-4 text-right">
                <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700">Close</button>
            </div>
        </aside>
    );
};

export type CopilotLayoutShellProps = {
    role: 'teacher' | 'student' | 'parent';
    leftRail: React.ReactNode;
    children: React.ReactNode;
};


/**
 * Extract follow-up suggestions from an LLM response.
 * Parses a trailing block shaped like:
 * Suggestions:
 * - First suggestion
 * - Second suggestion
 * 
 * Skips suggestions if the user's last message signals completion.
 */
export const parseSuggestionsFromResponse = (
    rawText: string,
    userMessage?: string
): { cleanContent: string; suggestions: CopilotSuggestion[] } => {
    // Check if user signals they're done: "thanks", "got it", "that's all", "I'm done", "end", etc.
    const doneSignals = /\b(thanks|thank you|got it|that['']s all|all set|all good|done|finished|that['']s it|end of|no more|i['']m good|no thanks|no need|nothing else|don['']t need|don['']t want|that['']s enough)\b/i;
    if (userMessage && doneSignals.test(userMessage)) {
        // Parse content but return empty suggestions
        const normalized = rawText.replace(/\r\n/g, '\n').trimEnd();
        const sections = normalized.split('\n');
        const suggestionHeaderIndex = sections.findIndex((line) => /^\s*(suggestions?|next steps?)\s*:\s*$/i.test(line));
        let cleanContent = normalized;
        if (suggestionHeaderIndex >= 0) {
            cleanContent = sections.slice(0, suggestionHeaderIndex).join('\n').trimEnd();
        }
        return { cleanContent: cleanContent || normalized, suggestions: [] };
    }

    const normalized = rawText.replace(/\r\n/g, '\n').trimEnd();
    const sections = normalized.split('\n');
    if (sections.length === 0) {
        return { cleanContent: rawText.trimEnd(), suggestions: [] };
    }

    const suggestionHeaderIndex = sections.findIndex((line) => /^\s*(suggestions?|next steps?)\s*:\s*$/i.test(line));
    let candidateLines: string[] = [];
    let cleanContent = normalized;

    if (suggestionHeaderIndex >= 0) {
        candidateLines = sections.slice(suggestionHeaderIndex + 1);
        cleanContent = sections.slice(0, suggestionHeaderIndex).join('\n').trimEnd();
    } else {
        const trailingLines: string[] = [];
        for (let index = sections.length - 1; index >= 0; index -= 1) {
            const line = sections[index];
            if (/^\s*(?:[-*]\s+|\d+[.)]\s+).+/.test(line)) {
                trailingLines.unshift(line);
                continue;
            }
            if (trailingLines.length > 0 && line.trim().length === 0) {
                continue;
            }
            break;
        }
        if (trailingLines.length > 0) {
            candidateLines = trailingLines;
            cleanContent = sections.slice(0, sections.length - trailingLines.length).join('\n').trimEnd();
        }
    }

    const suggestions = candidateLines
        .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3)
        .map((label, idx) => ({ id: `sug-${Date.now()}-${idx}`, label }));

    if (suggestions.length === 0) {
        return { cleanContent: normalized, suggestions: [] };
    }

    return {
        cleanContent: cleanContent || normalized,
        suggestions,
    };
};

// --- Citation helpers ---
export type Citation = {
    sourceId: string;
    label?: string;
    pageNumber?: number;
    snippet?: string;
    boundingBox?: { x: number; y: number; w: number; h: number };
};

/**
 * Looks for a trailing `---CITATIONS---` JSON block and returns cleaned content and parsed citations.
 * Expected block format:
 *\n---CITATIONS---\n[{...}, {...}]
 */
export const extractTrailingCitations = (rawText: string): { cleanContent: string; citations: Citation[] } => {
    try {
        const marker = /\n---CITATIONS---\s*([\s\S]+)$/i;
        const m = rawText.match(marker);
        if (!m) return { cleanContent: rawText.trimEnd(), citations: [] };
        const jsonPart = m[1].trim();
        const parsed = JSON.parse(jsonPart);
        if (!Array.isArray(parsed)) return { cleanContent: rawText.replace(marker, '').trimEnd(), citations: [] };
        return { cleanContent: rawText.replace(marker, '').trimEnd(), citations: parsed as Citation[] };
    } catch (e) {
        return { cleanContent: rawText.trimEnd(), citations: [] };
    }
};

export const extractTrailingHomeActions = (rawText: string): { cleanContent: string; homeActions: HomeAction[] } => {
    try {
        const marker = /\n---HOME-ACTIONS---\s*([\s\S]+)$/i;
        const m = rawText.match(marker);
        if (!m) return { cleanContent: rawText.trimEnd(), homeActions: [] };
        const jsonPart = m[1].trim();
        const parsed = JSON.parse(jsonPart);
        if (!Array.isArray(parsed)) return { cleanContent: rawText.replace(marker, '').trimEnd(), homeActions: [] };
        // Validate each action has required fields
        const validated = parsed.filter(
            (action: any) => action.timeframe && action.duration && action.action
        ) as HomeAction[];
        return { cleanContent: rawText.replace(marker, '').trimEnd(), homeActions: validated };
    } catch (e) {
        return { cleanContent: rawText.trimEnd(), homeActions: [] };
    }
};

/** Replace <Jargon>...</Jargon> fragments inside string nodes with React tooltip nodes. */
export const processJargonTags = (nodes: React.ReactNode[]): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    nodes.forEach((node, i) => {
        if (typeof node !== 'string') {
            out.push(node);
            return;
        }

        const parts = node.split(/(<Jargon>.*?<\/Jargon>)/g);
        parts.forEach((p, idx) => {
            const m = p.match(/^<Jargon>([\s\S]*?)<\/Jargon>$/);
            if (m) {
                const term = m[1];
                const key = `jargon-${i}-${idx}`;
                const def = getJargonDefinition(term);
                out.push(
                    <span key={key} className="underline cursor-help text-amber-700" data-jargon-term={def} data-jargon-label={term} title={""}>
                        {term}
                    </span>
                );
            } else {
                out.push(<span key={`plain-${i}-${idx}`}>{p}</span>);
            }
        });
    });

    return out;
};

/** Small jargon dictionary. In future, fetch from server or provider metadata. */
const JARGON_DICTIONARY: Record<string, string> = {
    'IEP': 'Individualized Education Program — a plan that sets personalized learning goals and supports for a student.',
    'RTI': 'Response to Intervention — a system to provide targeted teaching to students who need extra help.',
    'Phonological Awareness': 'Understanding sounds in language — like recognizing rhymes and syllables.',
    'Standardized Score': 'A way to compare a student\'s result to a larger group; higher means above average.',
};

export const getJargonDefinition = (term: string): string => {
    if (!term) return '';
    const key = term.trim();
    return JARGON_DICTIONARY[key] ?? `${term} — (definition not available).`;
};

/** Citation popover component for hover preview */
const CitationPopover: React.FC<{ citation: Citation; index: number; children: React.ReactNode }> = ({ citation, index, children }) => {
    const [open, setOpen] = React.useState(false);
    return (
        <span className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            {children}
            {open ? (
                <div className="absolute z-50 right-0 mt-1 w-[320px] bg-white border border-slate-200 rounded shadow-lg p-3 text-sm text-slate-700">
                    <div className="text-xs text-slate-500 mb-1">Source: {citation.label ?? citation.sourceId}{citation.pageNumber ? ` — p.${citation.pageNumber}` : ''}</div>
                    <div className="whitespace-pre-wrap text-sm">{citation.snippet ?? 'No preview available.'}</div>
                    <div className="mt-2 text-right">
                        <button onClick={() => window.dispatchEvent(new CustomEvent('elora:openCitation', { detail: citation }))} className="text-xs text-teal-600">Open</button>
                    </div>
                </div>
            ) : null}
        </span>
    );
};

/** Home Action Card component for parent copilot - displays time-bound home activities */
export const HomeActionCard: React.FC<{ actions: HomeAction[] }> = ({ actions }) => {
    if (!actions || actions.length === 0) return null;
    
    return (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">Home Actions This Week</h3>
            </div>
            <div className="space-y-3">
                {actions.map((action, idx) => (
                    <div key={idx} className="bg-white rounded p-3 border-l-4 border-blue-400">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-blue-700">{action.timeframe}</span>
                                    <span className="text-xs text-slate-500">•</span>
                                    <span className="text-xs text-slate-600">{action.duration}</span>
                                </div>
                                <p className="text-sm text-slate-700">{action.action}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">💡 These activities don't require special equipment and fit into your daily routine.</p>
        </div>
    );
};

/**
 * Replace citation tokens like `[^1]` inside an array of nodes (strings or React nodes).
 * String pieces are split and citation nodes are inserted. Clicking dispatches a global event `elora:openCitation`.
 */
export const processNodesReplaceCitations = (
    nodes: React.ReactNode[],
    citations?: Citation[]
): React.ReactNode[] => {
    if (!citations || citations.length === 0) return nodes;

    const out: React.ReactNode[] = [];
    nodes.forEach((node, i) => {
        if (typeof node !== 'string') {
            out.push(node);
            return;
        }

        const parts = node.split(/(\[\^\d+\])/g);
        parts.forEach((p, idx) => {
            const tok = p.match(/^\[\^(\d+)\]$/);
            if (tok) {
                const ci = parseInt(tok[1], 10) - 1;
                const citation = citations[ci];
                const key = `cite-${i}-${idx}-${ci}`;
                if (citation) {
                    out.push(
                        <CitationPopover key={key} citation={citation} index={ci}>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('elora:openCitation', { detail: citation }))}
                                className="ml-1 mr-1 text-[12px] font-semibold text-teal-600 hover:underline"
                                aria-label={`Open citation ${ci + 1}`}
                            >
                                <sup>[{ci + 1}]</sup>
                            </button>
                        </CitationPopover>
                    );
                } else {
                    out.push(<span key={key}>{p}</span>);
                }
                return;
            }
            out.push(<span key={`txt-${i}-${idx}`}>{p}</span>);
        });
    });

    return out;
};

const DEFAULT_USE_CASE_BY_ROLE: Record<UserRole, UseCase> = {
    teacher: 'teacher_chat',
    student: 'student_chat',
    parent: 'parent_chat',
};

export const handleFeedback = (feedback: {
    messageId: string;
    role: UserRole;
    useCase: string;
    threadId?: string;
    rating: CopilotFeedbackRating;
    reason?: CopilotFeedbackReason;
    comment?: string;
    source?: string;
}) => {
    void sendCopilotFeedback({
        role: feedback.role,
        useCase: feedback.useCase,
        messageId: feedback.messageId,
        threadId: feedback.threadId,
        rating: feedback.rating,
        reason: feedback.reason,
        comment: feedback.comment,
        source: feedback.source,
    });
};

/** Skeleton placeholder rows shown while threads are loading in the sidebar. */
export const ThreadSkeleton: React.FC = () => (
    <div className="space-y-2 px-1" aria-hidden="true">
        {[80, 60, 70].map((w, i) => (
            <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-100">
                <div className={`h-3 w-[${w}%] animate-pulse bg-slate-200 rounded-full`} />
                <div className="h-2 w-1/3 animate-pulse bg-slate-100 rounded-full" />
            </div>
        ))}
    </div>
);

/** 
 * A premium divider with a label used to expand/collapse long history.
 * Used in both the sidebar (Archive) and message threads.
 */
export const HistoryDivider: React.FC<{ 
    onClick: () => void; 
    isExpanded: boolean; 
    label?: string;
    expandLabel?: string;
    collapseLabel?: string;
}> = ({ 
    onClick, 
    isExpanded, 
    expandLabel = "View Full History",
    collapseLabel = "Collapse History"
}) => {
    return (
        <button
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className="w-full group py-4 flex items-center gap-4 hover:bg-slate-50/50 rounded-2xl transition-all duration-300 active:scale-[0.99]"
        >
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 group-hover:to-teal-200 transition-colors" />
            <div className="flex items-center gap-2.5 px-2">
                <History size={10} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-teal-600 uppercase tracking-[0.2em] transition-colors whitespace-nowrap">
                    {isExpanded ? collapseLabel : expandLabel}
                </span>
                <div className={`text-slate-300 group-hover:text-teal-500 transition-all duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={11} strokeWidth={3} />
                </div>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 group-hover:to-teal-200 transition-colors" />
        </button>
    );
};

export const getParentGreeting = (childFirstName?: string) => {
    const hour = new Date().getHours();
    const nameStr = childFirstName ? ` ${childFirstName}` : '';
    const nameDisplay = childFirstName ? childFirstName : 'my child';
    const kidsStr = childFirstName ? ` ${childFirstName}'s` : ` my child's`;

    // As per specification:
    // If multiple children / no child selected (childFirstName is null/undefined if we want the generic form)
    // Actually Section 3.1 explicitly says:
    // Morning: Good morning. How’s Liam getting on?
    // Afternoon: Good afternoon. Want to check in on Liam?
    // Evening: Good evening. This is a good time to catch up on Liam’s week.
    // Late night: Hi. Anything you want to check on?
    if (!childFirstName) {
        if (hour >= 5 && hour < 12) return 'Good morning. How are the kids getting on?';
        if (hour >= 12 && hour < 17) return 'Good afternoon. Want to check in on the kids?';
        if (hour >= 17 && hour < 21) return 'Good evening. This is a good time to catch up on the kids\' week.';
        return 'Hi. Anything you want to check on?';
    }

    if (hour >= 5 && hour < 12) return `Good morning. How’s ${childFirstName} getting on?`;
    if (hour >= 12 && hour < 17) return `Good afternoon. Want to check in on ${childFirstName}?`;
    if (hour >= 17 && hour < 21) return `Good evening. This is a good time to catch up on ${childFirstName}’s week.`;
    return 'Hi. Anything you want to check on?';
};

export const getPronoun = (gender: 'male' | 'female' | 'non-binary') => {
    switch (gender) {
        case 'male':
            return { pSub: 'he', pObj: 'him', pPos: 'his', pIs: 'is' };
        case 'female':
            return { pSub: 'she', pObj: 'her', pPos: 'her', pIs: 'is' };
        default:
            return { pSub: 'they', pObj: 'them', pPos: 'their', pIs: 'are' };
    }
};

/**
 * Builds a unified greeting in the format "Good morning, FirstName" for all roles.
 * Used across Student, Teacher, and Parent Copilot empty states.
 */
export const buildUnifiedGreeting = (userName?: string): string => {
    const hour = new Date().getHours();
    let greeting = 'hi there';
    
    if (hour >= 5 && hour < 12) greeting = 'good morning';
    else if (hour >= 12 && hour < 17) greeting = 'good afternoon';
    else if (hour >= 17 && hour < 21) greeting = 'good evening';
    
    const prefix = "Oh, ";
    
    if (!userName) return `${prefix}${greeting}`;
    
    const parts = userName.trim().split(/\s+/);
    if (parts.length === 0) return `${prefix}${greeting}`;
    
    const titles = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Mdm.', 'Mr', 'Ms', 'Mrs', 'Dr'];
    
    // Extract first name (skip titles)
    if (parts.length >= 2 && titles.some(t => parts[0].toLowerCase() === t.toLowerCase())) {
        // Return full name if it has a title
        return `${prefix}${greeting}, ${userName.trim()}`;
    }
    
    // Return just the first name if no title
    return `${prefix}${greeting}, ${parts[0]}`;
};

export const CopilotLayoutShell: React.FC<CopilotLayoutShellProps> = ({ role, leftRail, children }) => {
    const roleBgClass = 'bg-[#fbfcf8]';

    return (
        <div className={`h-[calc(100vh-var(--elora-header-offset,0px))] min-h-[calc(100dvh-var(--elora-header-offset,0px))] min-w-0 flex flex-1 overflow-hidden ${roleBgClass} dark:bg-[var(--elora-surface-alt)] transition-colors duration-500`}>
            <aside className="hidden md:flex h-full w-[280px] shrink-0 overflow-hidden border-r border-slate-100 dark:border-[var(--elora-border-subtle)] bg-white dark:bg-[var(--elora-surface-main)] transition-colors duration-500">
                {leftRail}
            </aside>
            <section className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
                {children}
            </section>
        </div>
    );
};


// --- Shared Components ---

/**
 * Main Layout for both Teacher and Student Copilot
 */
export const CopilotLayout: React.FC<{
    sidebar: React.ReactNode;
    children: React.ReactNode;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    isDemo: boolean;
    role: 'Teacher' | 'Student' | 'Parent';
    themeColor?: string;
    logout: () => void;
    navigate: (path: string) => void;
    demoBanner?: React.ReactNode;
    demoRoleSwitcher?: React.ReactNode;
    hideContextSidebar?: boolean;
    hidePrimarySidebar?: boolean;
    lockToViewportHeight?: boolean;
    contentMaxWidth?: string;
    sidebarClassName?: string;
    chatAreaClassName?: string;
}> = ({
    sidebar,
    children,
    isSidebarOpen,
    setIsSidebarOpen,
    isDemo,
    role,
    themeColor = '#14b8a6', // default teal
    logout,
    navigate,
    demoBanner,
    demoRoleSwitcher,
    hideContextSidebar = false,
    hidePrimarySidebar = false,
    lockToViewportHeight = false,
    contentMaxWidth,
    sidebarClassName,
    chatAreaClassName
}) => {
        const roleKey = role.toLowerCase() as EloraRole;
        const sidebarTheme = getRoleSidebarTheme(roleKey);
        const parentDashboardPath = isDemo ? '/parent/demo' : '/dashboard/parent';
    const shouldUseViewportLock = !hidePrimarySidebar && lockToViewportHeight;
        // NavItem component inside CopilotLayout (mostly for sidebar)
        const NavItem = ({ icon, label, active = false, onClick, collapsed }: { icon: any, label: string, active?: boolean, onClick?: () => void, collapsed: boolean }) => {
            const activeClasses = `${sidebarTheme.navActiveBg} ${sidebarTheme.navActiveText}`;
            const inactiveClasses = `${sidebarTheme.navInactiveText} ${sidebarTheme.navHoverBg} ${sidebarTheme.navHoverText}`;
            return (
                <a
                    onClick={(e) => { e.preventDefault(); onClick?.(); }}
                    href="#"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${active ? activeClasses : inactiveClasses} ${collapsed ? 'justify-center focus:outline-none' : ''}`}
                    title={collapsed ? label : undefined}
                >
                    {/* Active Vertical Accent Bar */}
                    {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white/85 rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
                    )}
                    
                    <div className="shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
                        {icon}
                    </div>
                    {!collapsed && <span className="whitespace-nowrap tracking-tight">{label}</span>}
                </a>
            );
        };

        return (
            <div
                className={`flex flex-col bg-[#FDFBF5] dark:bg-[var(--elora-bg)] font-sans text-slate-900 dark:text-[var(--elora-text-strong)] overflow-hidden transition-colors duration-500 ${hidePrimarySidebar ? 'h-full min-h-0' : shouldUseViewportLock ? 'h-screen min-h-screen' : 'min-h-screen'}`}
                style={shouldUseViewportLock ? { minHeight: '100dvh' } : undefined}
            >
                {isDemo && (
                    <>
                        {demoBanner}
                        {demoRoleSwitcher}
                    </>
                )}

                <div className="flex flex-1 overflow-hidden relative min-h-0">
                    {/* --- Sidebar --- */}
                    {!hidePrimarySidebar && <aside
                        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-500 ease-in-out 
                        ${isSidebarOpen ? 'w-64' : 'w-20'} 
                        ${sidebarTheme.asideBg} shadow-2xl shadow-slate-900/20
                        md:sticky md:top-0 md:h-screen md:translate-x-0 
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                        ${sidebarTheme.text}
                    `}
                    >
                        <div className={`h-16 flex items-center border-b ${sidebarTheme.headerBorder} px-8 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                            <Link to="/" className="flex items-center text-white/90 hover:text-white transition-colors overflow-hidden shrink-0">
                                <EloraLogo className="w-10 h-10 text-current drop-shadow-sm transition-transform hover:scale-105" withWordmark={isSidebarOpen} />
                            </Link>
                            {isSidebarOpen && (
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="flex items-center justify-center p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <PanelLeftClose size={20} />
                                </button>
                            )}
                        </div>

                        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
                            <NavItem
                                icon={<LayoutDashboard size={20} />}
                                label={role === 'Teacher' ? "Dashboard" : "Overview"}
                                onClick={() => {
                                    if (isDemo) {
                                        if (role === 'Teacher') navigate('/teacher/demo');
                                        else if (role === 'Parent') navigate('/parent/demo');
                                        else navigate('/student/demo');
                                    } else {
                                        if (role === 'Teacher') navigate('/dashboard/teacher');
                                        else if (role === 'Parent') navigate('/dashboard/parent');
                                        else navigate('/dashboard/student');
                                    }
                                }}
                                collapsed={!isSidebarOpen}
                            />

                            {role === 'Teacher' && (
                                <NavItem
                                    icon={<BookOpen size={20} />}
                                    label="My Classes"
                                    onClick={() => {
                                        if (isDemo) {
                                            navigate('/teacher/demo/classes');
                                        } else {
                                            navigate('/teacher/classes');
                                        }
                                    }}
                                    collapsed={!isSidebarOpen}
                                />
                            )}

                            {role === 'Teacher' && (
                                <NavItem
                                    icon={<FileText size={20} />}
                                    label="Assignments"
                                    onClick={() => {
                                        if (isDemo) {
                                            navigate('/teacher/demo/assignments');
                                        } else {
                                            navigate('/teacher/assignments');
                                        }
                                    }}
                                    collapsed={!isSidebarOpen}
                                />
                            )}

                            {role === 'Student' && (
                                <NavItem
                                    icon={<BookOpen size={20} />}
                                    label="My Classes"
                                    onClick={() => {
                                        if (isDemo) {
                                            navigate('/student/demo/classes');
                                        } else {
                                            navigate('/student/classes');
                                        }
                                    }}
                                    collapsed={!isSidebarOpen}
                                />
                            )}

                            <NavItem
                                icon={<Sparkles size={20} />}
                                label="Copilot"
                                active={true}
                                onClick={() => { }}
                                collapsed={!isSidebarOpen}
                            />

                            {role === 'Teacher' && (
                                <NavItem
                                    icon={<Gamepad2 size={20} />}
                                    label="Practice & quizzes"
                                    onClick={() => {
                                        navigate(`${isDemo ? '/teacher/demo' : '/dashboard/teacher'}#practice`);
                                    }}
                                    collapsed={!isSidebarOpen}
                                />
                            )}

                            {role === 'Student' && (
                                <NavItem
                                    icon={<Gamepad2 size={20} />}
                                    label="Practice & Quizzes"
                                    onClick={() => {
                                        navigate(`${isDemo ? '/student/demo' : '/dashboard/student'}#practice`);
                                    }}
                                    collapsed={!isSidebarOpen}
                                />
                            )}

                            {role === 'Student' && (
                                <>
                                    <NavItem 
                                        icon={<FileText size={20} />} 
                                        label="Assignments" 
                                        collapsed={!isSidebarOpen} 
                                        onClick={() => navigate(isDemo ? '/student/demo/assignments' : '/student/assignments')}
                                    />
                                    <NavItem 
                                        icon={<TrendingUp size={20} />} 
                                        label="Reports" 
                                        collapsed={!isSidebarOpen} 
                                        onClick={() => navigate(isDemo ? '/student/demo#reports' : '/dashboard/student#reports')}
                                    />
                                </>
                            )}

                            {role === 'Teacher' && (
                                <NavItem 
                                    icon={<TrendingUp size={20} />} 
                                    label="Reports" 
                                    collapsed={!isSidebarOpen} 
                                    onClick={() => navigate(`${isDemo ? '/teacher/demo' : '/dashboard/teacher'}#reports`)}
                                />
                            )}

                            {role === 'Parent' && <NavItem icon={<Users size={20} />} label="Children" collapsed={!isSidebarOpen} onClick={() => navigate(`${parentDashboardPath}#children`)} />}
                            {role === 'Parent' && <NavItem icon={<BarChart2 size={20} />} label="Progress & Reports" collapsed={!isSidebarOpen} onClick={() => navigate(`${parentDashboardPath}#progress`)} />}
                            {role === 'Parent' && <NavItem icon={<FileText size={20} />} label="Assignments & Quizzes" collapsed={!isSidebarOpen} onClick={() => navigate(`${parentDashboardPath}#assignments`)} />}
                            {role === 'Parent' && <NavItem icon={<MessageSquare size={20} />} label="Messages" collapsed={!isSidebarOpen} onClick={() => navigate(`${parentDashboardPath}#messages`)} />}
                        </nav>

                        <div className={`p-4 border-t ${sidebarTheme.footerBorder} space-y-1.5`}>
                            {!isSidebarOpen && (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="flex items-center justify-center w-full p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
                                >
                                    <PanelLeftOpen size={20} />
                                </button>
                            )}
                            <NavItem
                                icon={<Settings size={20} />}
                                label="Settings"
                                active={window.location.pathname.includes('/settings')}
                                onClick={() => {
                                    if (isDemo) {
                                        if (role === 'Teacher') navigate('/teacher/demo/settings');
                                        else if (role === 'Parent') navigate('/parent/demo/settings');
                                        else navigate('/student/demo/settings');
                                    } else {
                                        if (role === 'Teacher') navigate('/teacher/settings');
                                        else if (role === 'Parent') navigate('/parent/settings');
                                        else navigate('/student/settings');
                                    }
                                }}
                                collapsed={!isSidebarOpen}
                            />
                            <button
                                onClick={logout}
                                className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
                                title={!isSidebarOpen ? "Sign out" : undefined}
                            >
                                <LogOut size={20} className="shrink-0" />
                                {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
                            </button>
                        </div>
                    </aside>}

                    {/* --- Main Content Area --- */}
                    <div className="flex-1 flex justify-center bg-[#F8FAFC] dark:bg-[var(--elora-chat-canvas)] min-h-0 relative overflow-hidden transition-colors duration-500">
                        <div className={`flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden w-full ${contentMaxWidth || ''}`}>
                            {/* Left Column (Context Sidebar - "Library") */}
                            {!hideContextSidebar && (
                                <div className={sidebarClassName || "hidden md:flex w-[300px] sidebar-editorial flex-col shrink-0 overflow-hidden"}>
                                    {sidebar}
                                </div>
                            )}

                            {/* Right Column (Chat Area) */}
                            <div className={chatAreaClassName || "flex-1 flex flex-col relative min-w-0 transition-all duration-500"}>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

/**
 * Mobile Header with Copilot branding
 */
export const CopilotMobileHeader: React.FC<{
    themeColor?: string
}> = ({
    themeColor = '#14b8a6'
}) => (
        <div className="md:hidden px-6 h-16 bg-white dark:bg-[var(--elora-surface-main)] border-b border-slate-100 dark:border-[var(--elora-border-subtle)] flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm dark:shadow-md transition-colors duration-500">
            <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl transition-colors duration-500" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
                    <Sparkles size={18} />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-[var(--elora-text-strong)] tracking-tight">Copilot</h2>
            </div>
            <div className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-teal-100 dark:border-teal-900/50 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 tracking-wider transition-colors duration-500">
                LIVE
            </div>
        </div>
    );

/**
 * Thinking Strip component
 */
export const ThinkingStrip: React.FC<{
    steps: Step[],
    defaultExpanded?: boolean,
    themeColor?: string,
    headerText?: string
}> = ({
    steps,
    defaultExpanded,
    themeColor = '#14b8a6',
    headerText = 'How I figured this out'
}) => {
        const [expanded, setExpanded] = useState(defaultExpanded ?? (window.innerWidth >= 768));

        return (
            <div className="mb-4 w-full animate-in fade-in slide-in-from-top-1 duration-500">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-all bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md active:scale-95 uppercase tracking-widest"
                >
                    <Sparkles size={11} style={{ color: themeColor }} />
                    <span>{headerText} &middot; {steps.length} {steps.length === 1 ? 'step' : 'steps'}</span>
                    <div className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={14} />
                    </div>
                </button>

                {expanded && (
                    <div className="mt-3 pl-4 border-l border-slate-200 space-y-3 mb-2 ml-4 animate-in fade-in slide-in-from-left-2 duration-300">
                        {steps.map((step) => (
                            <div key={step.id} className="flex items-start gap-3 text-[13px] text-slate-500 font-medium leading-relaxed">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: themeColor + '60' }} />
                                <span>{step.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

/**
 * Follow-up suggestion chips rendered beneath an assistant message.
 */
export const CopilotSuggestionsBar: React.FC<{
    suggestions: CopilotSuggestion[];
    onSuggestionClick: (label: string) => void;
    themeColor?: string;
}> = ({ suggestions, onSuggestionClick, themeColor = '#14b8a6' }) => {
    if (!suggestions || suggestions.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-bottom-1 duration-400">
            {suggestions.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onSuggestionClick(s.label)}
                    title={s.label}
                    className="max-w-[260px] truncate shrink-0 px-1 py-1 text-[11px] font-semibold transition-colors duration-200"
                    style={{
                        color: themeColor,
                    }}
                >
                    {s.label}
                </button>
            ))}
        </div>
    );
};

/**
 * A message bubble in the chat
 */
export const CopilotMessageBubble: React.FC<{
    message: Message,
    themeColor?: string,
    shouldAutoExpandSteps?: boolean,
    thinkingStripHeader?: string,
    copilotRole?: 'teacher' | 'student' | 'parent',
    /** Deprecated flag retained for backward compatibility. Feedback controls now render for every assistant answer. */
    showFeedback?: boolean;
    onSuggestionClick?: (label: string) => void;
    feedbackSource?: string;
}> = ({
    message,
    themeColor = '#14b8a6',
    shouldAutoExpandSteps = false,
    thinkingStripHeader,
    copilotRole,
    showFeedback = false,
    onSuggestionClick,
    feedbackSource,
}) => {
        void showFeedback;
        if (message.role === 'system') {
            return (
                <div className="flex justify-center my-6 animate-in fade-in duration-700">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-4 text-center uppercase tracking-[0.2em]">
                        <span className="h-[1px] w-12 bg-slate-200" />
                        {message.content}
                        <span className="h-[1px] w-12 bg-slate-200" />
                    </div>
                </div>
            );
        }

        return (
            <div className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                <div className={`max-w-[95%] md:max-w-3xl flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {message.role === 'assistant' && message.steps && message.steps.length > 0 && (
                        <ThinkingStrip steps={message.steps} defaultExpanded={shouldAutoExpandSteps} themeColor={themeColor} headerText={thinkingStripHeader} />
                    )}

                    <div
                        className={`px-6 py-4 text-[15px] md:text-[16px] leading-[1.6] transition-all ${message.role === 'user'
                            ? 'text-white rounded-[24px] rounded-br-[4px] shadow-lg shadow-teal-500/10'
                            : 'bg-white rounded-[24px] rounded-bl-[4px] border border-slate-100 shadow-sm text-slate-800'
                            }`}
                        style={message.role === 'user' ? { backgroundColor: themeColor } : {}}
                    >
                        <div className="whitespace-pre-wrap">
                            {
                                (() => {
                                    // Extract both citations and home actions from message content
                                    const { cleanContent: contentAfterCitations, citations } = extractTrailingCitations(message.content);
                                    const { cleanContent, homeActions } = extractTrailingHomeActions(contentAfterCitations);
                                    return cleanContent.split('**').map((part, i) => {
                                        const nodes = processJargonTags(processNodesReplaceCitations([part], citations));
                                        return i % 2 === 1
                                            ? <strong key={part + i} className="font-bold text-slate-900">{nodes}</strong>
                                            : <span key={`plain-${i}`}>{nodes}</span>;
                                    });
                                })()
                            }
                        </div>

                        {/* Table skeleton while generating */}
                        {message.metadata && (message.metadata as any).generating_table === true && (
                            <div className="mt-3">
                                <GeneratingTableSkeleton />
                            </div>
                        )}

                        {/* Attached Files rendering */}
                        {message.fileAttachments && message.fileAttachments.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-current/10 flex flex-wrap gap-2">
                                {message.fileAttachments.map((file) => (
                                    <div 
                                        key={file.id}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 text-[12px] font-medium"
                                        style={message.role === 'user' ? { backgroundColor: 'rgba(255,255,255,0.15)' } : {}}
                                    >
                                        <FileText size={14} className="opacity-70" />
                                        <span className="truncate max-w-[120px]">{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Home Action Card for parent copilot */}
                    {message.role === 'assistant' && (() => {
                        const { cleanContent: contentAfterCitations } = extractTrailingCitations(message.content);
                        const { homeActions } = extractTrailingHomeActions(contentAfterCitations);
                        return homeActions && homeActions.length > 0 ? (
                            <div className="mt-2 w-full md:max-w-3xl">
                                <HomeActionCard actions={homeActions} />
                            </div>
                        ) : null;
                    })()}

                    {/* Follow-up suggestion chips */}
                    {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && onSuggestionClick && (
                        <CopilotSuggestionsBar
                            suggestions={message.suggestions}
                            onSuggestionClick={onSuggestionClick}
                            themeColor={themeColor}
                        />
                    )}

                    {/* Feedback row — only shown for ~1-in-20 assistant messages */}
                    {message.role === 'assistant' && copilotRole && (
                        <div className="mt-2 animate-in fade-in duration-500 delay-300">
                            <CopilotFeedbackRow
                                messageId={message.id}
                                role={copilotRole}
                                useCase={message.useCase ?? DEFAULT_USE_CASE_BY_ROLE[copilotRole]}
                                threadId={message.conversationId}
                                source={feedbackSource ?? message.feedbackSource ?? message.source}
                                onFeedback={handleFeedback}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

/**
 * Returns true with ~5% probability (≈1-in-20).
 * Call this once when creating/rendering a message, then store the result
 * so it does not change on re-renders.
 */
export const shouldShowFeedback = (): boolean => Math.random() < 0.05;

/**
 * Empty State for a clean chat interface
 */
export const CopilotEmptyState: React.FC<{
    themeColor?: string;
    title?: string;
    description: string;
    prompts: string[];
    handleSend: (p: string) => void;
    userName?: string;
    customGreeting?: string;
}> = ({
    themeColor = '#14b8a6',
    title,
    description,
    prompts,
    handleSend,
    userName,
    customGreeting
}) => {
        const finalTitle = title || `${buildUnifiedGreeting(userName)}!`;

        return (
            <div className="flex-1 flex flex-col items-center justify-center w-full px-6 py-6 md:py-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-full max-w-[660px] flex flex-col items-center">
                    <div className="relative mb-4 md:mb-6 group shrink-0">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-[#14b8a6]/20 to-teal-500/0 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-1000 opacity-70 dark:from-[#14b8a6]/10 dark:to-teal-500/0" />
                        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-[var(--elora-surface-main)] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)] border border-slate-100/60 dark:border-[var(--elora-border-subtle)] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                            <Sparkles className="w-6 h-6 md:w-7 md:h-7" style={{ color: themeColor }} />
                        </div>
                    </div>

                    <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-[var(--elora-text-strong)] mb-2 md:mb-3 tracking-tight text-center leading-[1.2]">
                        {customGreeting ? customGreeting : finalTitle}
                    </h2>
                
                    <p className="text-slate-500 dark:text-[var(--elora-text-muted)] text-sm md:text-[17px] mb-6 md:mb-9 leading-relaxed font-medium max-w-[520px] text-center opacity-85">
                        {description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        {prompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(prompt)}
                                className="text-left px-5 py-4 rounded-2xl bg-white dark:bg-[var(--elora-surface-main)] border border-slate-100 dark:border-[var(--elora-border-subtle)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:border-teal-200 dark:hover:border-teal-600/50 hover:bg-teal-50/60 dark:hover:bg-teal-950/20 group transition-all duration-300 active:scale-[0.98]"
                            >
                                <p className="text-[13px] font-bold text-slate-700 dark:text-[var(--elora-text-strong)] group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-snug">
                                    {prompt}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                                    <span className="text-[9px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Ask this</span>
                                    <ArrowRight size={11} className="text-teal-600 dark:text-teal-400" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };
    
/**
 * Thinking Bubble shown while AI is generating
 */
// Chain-of-Thought (CoT) status labels — surface during reasoning
const THINKING_LABELS = [
    'thinking',
    'reading_files',
    'analyzing_logic',
    'verifying_sources',
];

export const CopilotThinkingBubble: React.FC<{
    themeColor?: string;
    assistantName?: string;
}> = ({
    themeColor = '#14b8a6',
    assistantName = 'Elora'
}) => {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setIdx((i) => (i + 1) % THINKING_LABELS.length), 1500);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="flex justify-start mb-6 animate-in fade-in slide-in-from-left-2 duration-500">
            <div className="flex flex-col items-start w-full max-w-xl">
                <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 bg-white">
                        <Sparkles size={12} style={{ color: themeColor }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{assistantName} IS THINKING</span>
                </div>
                <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor, animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor, animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor, animationDelay: '300ms' }} />
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest transition-all duration-300">
                            {THINKING_LABELS[idx]}
                        </p>
                    </div>
                    <div className="h-1 w-32 bg-slate-50 rounded-full overflow-hidden">
                        <div
                            className="h-full w-1/2 rounded-full animate-progress-slide"
                            style={{ background: `linear-gradient(to right, transparent, ${themeColor}4d, transparent)` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const GeneratingTableSkeleton: React.FC = () => {
    return (
        <div className="w-full border rounded-lg p-2 bg-slate-50">
            <div className="h-4 bg-slate-200 rounded w-2/5 mb-2 animate-pulse" />
            {[0,1,2,3].map((r) => (
                <div key={r} className="flex gap-2 mb-2">
                    <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
                    <div className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
                    <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
                </div>
            ))}
        </div>
    );
};




/**
 * Shared content for authentication gates (used in full-page and modal variants)
 */
export const AuthGateContent: React.FC<{
    themeColor?: string;
    role: 'Teacher' | 'Student' | 'Parent';
    title?: string;
    description?: string;
    onLoginClick?: () => void;
    onSignupClick?: () => void;
    onSecondaryClick?: () => void;
    secondaryLabel?: string;
}> = ({ 
    themeColor = '#14b8a6', 
    role,
    title = "Unlock Elora Copilot",
    description = "Elora Copilot uses real-time data to provide personalized assistance and automated planning. Sign up or log in to unlock the full experience.",
    onLoginClick,
    onSignupClick,
    onSecondaryClick,
    secondaryLabel = "Explore Dashboard"
}) => {
    const navigate = useNavigate();

    const handleSignup = () => {
        if (onSignupClick) {
            onSignupClick();
        } else {
            navigate('/signup');
        }
    };

    const handleLogin = () => {
        if (onLoginClick) {
            onLoginClick();
        } else {
            navigate('/login');
        }
    };

    const handleSecondary = () => {
        if (onSecondaryClick) {
            onSecondaryClick();
        } else {
            navigate(`/${role.toLowerCase()}/demo`);
        }
    };

    return (
        <div className="bg-white border border-[#EAE7DD] rounded-2xl p-8 md:p-12 max-w-md w-full text-center shadow-sm">
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
                <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
                {title}
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
                {description}
            </p>
            <div className="flex flex-col gap-3">
                <button
                    onClick={handleSignup}
                    className="w-full py-3 px-4 rounded-xl font-medium text-white transition-transform hover:-translate-y-0.5 shadow-sm"
                    style={{ backgroundColor: themeColor }}
                >
                    Sign up for free
                </button>
                <button
                    onClick={handleLogin}
                    className="w-full py-3 px-4 rounded-xl font-medium transition-colors border"
                    style={{ color: themeColor, backgroundColor: themeColor + '05', borderColor: themeColor + '20' }}
                >
                    Log in
                </button>
                <button
                    onClick={handleSecondary}
                    className="mt-4 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors inline-block"
                >
                    {secondaryLabel}
                </button>
            </div>
        </div>
    );
};

/**
 * Authentication Gate for Copilot in demo mode
 */
export const CopilotAuthGate: React.FC<{
    themeColor?: string;
    role: 'Teacher' | 'Student' | 'Parent';
}> = ({ themeColor = '#14b8a6', role }) => {
    return (
        <div className="flex-1 flex items-center justify-center p-6 h-full">
            <AuthGateContent role={role} themeColor={themeColor} />
        </div>
    );
};

export const HorizontalChips: React.FC<{
    prompts: string[];
    onSend: (p: string) => void;
    themeColor: string;
}> = ({ prompts, onSend, themeColor }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showOverlay, setShowOverlay] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollWidth, clientWidth } = scrollRef.current;
            setShowOverlay(scrollWidth > clientWidth);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [prompts]);

    return (
        <div className="relative flex-1 min-w-0 mb-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pr-8"
            >
                {prompts.map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSend(prompt)}
                        className="shrink-0 px-1 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap"
                        style={{
                            color: 'var(--elora-chip-text)',
                        } as any}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = themeColor;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--elora-chip-text)';
                        }}
                    >
                        {prompt}
                    </button>
                ))}
            </div>
            {showOverlay && (
                <div
                    className="absolute right-0 top-0 h-[calc(100%-4px)] w-8 pointer-events-none rounded-r-xl"
                    style={{ background: 'linear-gradient(to right, transparent, var(--elora-surface-main))' }}
                />
            )}
        </div>
    );
};
