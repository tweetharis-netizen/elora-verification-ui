import React, { useState, useEffect, useRef } from 'react';
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
import type { CopilotFeedbackReason, CopilotFeedbackRating, UseCase, UserRole } from '../../lib/llm/types';

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
    /** Follow-up suggestion chips. Parsed from the LLM response, client-side only. */
    suggestions?: CopilotSuggestion[];
    /** Use case used for this response, used by feedback telemetry. */
    useCase?: string;
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
 */
export const parseSuggestionsFromResponse = (
    rawText: string
): { cleanContent: string; suggestions: CopilotSuggestion[] } => {
    const pattern = /\n?Suggestions:\n((?:\s*[-*]\s*.+\n?)+)$/i;
    const match = rawText.match(pattern);

    if (!match) {
        return { cleanContent: rawText.trimEnd(), suggestions: [] };
    }

    const bulletBlock = match[1];
    const suggestions: CopilotSuggestion[] = bulletBlock
        .split('\n')
        .map((line) => line.replace(/^\s*[-*]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3)
        .map((label, idx) => ({ id: `sug-${Date.now()}-${idx}`, label }));

    const cleanContent = rawText.slice(0, rawText.length - match[0].length).trimEnd();
    return { cleanContent, suggestions };
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
}) => {
    void sendCopilotFeedback({
        role: feedback.role,
        useCase: feedback.useCase,
        messageId: feedback.messageId,
        threadId: feedback.threadId,
        rating: feedback.rating,
        reason: feedback.reason,
        comment: feedback.comment,
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

export const CopilotLayoutShell: React.FC<CopilotLayoutShellProps> = ({ role, leftRail, children }) => {
    const roleBgClass =
        role === 'student'
            ? 'bg-[#fcfbff]'
            : role === 'parent'
                ? 'bg-[#fffaf6]'
                : 'bg-[#fbfcf8]';

    return (
        <div className={`h-[calc(100vh-var(--elora-header-offset,0px))] min-h-0 flex flex-1 overflow-hidden ${roleBgClass}`}>
            <aside className="hidden md:flex h-full w-[280px] shrink-0 overflow-hidden border-r border-slate-100 bg-white">
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
            <div className={`flex flex-col bg-[#FDFBF5] font-sans text-slate-900 overflow-hidden ${hidePrimarySidebar ? 'h-full min-h-0' : lockToViewportHeight ? 'h-screen' : 'min-h-screen'}`}>
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
                            <NavItem icon={<Settings size={20} />} label="Settings" collapsed={!isSidebarOpen} />
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
                    <div className="flex-1 flex justify-center bg-[#F8FAFC] min-h-0 relative overflow-hidden transition-colors duration-500">
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
        <div className="md:hidden px-6 h-16 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
                    <Sparkles size={18} />
                </div>
                <h2 className="font-bold text-slate-900 tracking-tight">Copilot</h2>
            </div>
            <div className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-teal-100 bg-teal-50 text-teal-600 tracking-wider">
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
                    className="max-w-[260px] truncate shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all duration-200 hover:shadow-sm active:scale-95"
                    style={{
                        backgroundColor: themeColor + '0d',
                        borderColor: themeColor + '30',
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
}> = ({
    message,
    themeColor = '#14b8a6',
    shouldAutoExpandSteps = false,
    thinkingStripHeader,
    copilotRole,
    showFeedback = false,
    onSuggestionClick,
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
                            {message.content.split('**').map((part, i) => (
                                i % 2 === 1 ? <strong key={part + i} className="font-bold text-slate-900">{part}</strong> : part
                            ))}
                        </div>
                    </div>

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
        const getGreeting = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) return 'Good morning';
            if (hour >= 12 && hour < 17) return 'Good afternoon';
            if (hour >= 17 && hour < 21) return 'Good evening';
            return 'Hi there';
        };

        const getGreetingName = (name?: string) => {
            if (!name || name === 'Teacher' || name === 'Parent') return null;

            const parts = name.trim().split(/\s+/);
            if (parts.length === 0) return null;

            const titles = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Mdm.', 'Mr', 'Ms', 'Mrs', 'Dr'];

            if (parts.length === 1 && titles.some(t => parts[0].toLowerCase() === t.toLowerCase())) {
                return null;
            }

            if (parts.length >= 2 && titles.some(t => parts[0].toLowerCase() === t.toLowerCase())) {
                return name.trim();
            }

            return parts[0];
        };

        const greeting = getGreeting();
        const gName = getGreetingName(userName);
        const finalTitle = title || (gName ? `${greeting}, ${gName}!` : `${greeting}!`);

        return (
            <div className="flex-1 flex flex-col items-center justify-center w-full px-6 py-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-full max-w-[660px] flex flex-col items-center">
                    <div className="relative mb-6 group">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-[#14b8a6]/20 to-teal-500/0 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-1000 opacity-70" />
                        <div className="relative w-14 h-14 rounded-2xl bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] border border-slate-100/60 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                            <Sparkles className="w-7 h-7" style={{ color: themeColor }} />
                        </div>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight text-center leading-[1.2]">
                        {customGreeting ? customGreeting : finalTitle}
                    </h2>
                
                    <p className="text-slate-500 text-base md:text-[17px] mb-9 leading-relaxed font-medium max-w-[520px] text-center opacity-85">
                        {description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        {prompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(prompt)}
                                className="text-left px-5 py-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)] hover:border-teal-200 hover:bg-teal-50/60 group transition-all duration-300 active:scale-[0.98]"
                            >
                                <p className="text-[13px] font-bold text-slate-700 group-hover:text-teal-700 transition-colors leading-snug">
                                    {prompt}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                                    <span className="text-[9px] font-extrabold text-teal-600 uppercase tracking-widest">Ask this</span>
                                    <ArrowRight size={11} className="text-teal-600" />
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
const THINKING_LABELS = [
    'Checking context…',
    'Analysing class data…',
    'Drafting response…',
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




/**
 * Authentication Gate for Copilot in demo mode
 */
export const CopilotAuthGate: React.FC<{
    themeColor?: string;
    role: 'Teacher' | 'Student' | 'Parent';
}> = ({ themeColor = '#14b8a6', role }) => {
    return (
        <div className="flex-1 flex items-center justify-center p-6 h-full">
            <div className="bg-white border border-[#EAE7DD] rounded-2xl p-8 md:p-12 max-w-md w-full text-center shadow-sm">
                <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
                    <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    Sign in to use Copilot
                </h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Elora Copilot uses real-time class data to provide personalized assistance. Sign up or log in to unlock the full experience.
                </p>
                <div className="flex flex-col gap-3">
                    <Link
                        to="/signup"
                        className="w-full py-3 px-4 rounded-xl font-medium text-white transition-transform hover:-translate-y-0.5 shadow-sm"
                        style={{ backgroundColor: themeColor }}
                    >
                        Sign up for free
                    </Link>
                    <Link
                        to="/login"
                        className="w-full py-3 px-4 rounded-xl font-medium transition-colors border"
                        style={{ color: themeColor, backgroundColor: themeColor + '05', borderColor: themeColor + '20' }}
                    >
                        Log in
                    </Link>
                    <Link
                        to={`/${role.toLowerCase()}/demo`}
                        className="mt-4 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors inline-block"
                    >
                        Explore Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};
