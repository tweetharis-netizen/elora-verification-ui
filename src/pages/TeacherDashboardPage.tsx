// src/pages/TeacherDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Settings,
    Plus,
    FileText,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    X,
    AlertCircle,
    MoreHorizontal,
    Sparkles,
    Check,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    CheckCircle2,
    Send,
    RefreshCw,
    UserMinus,
    Target,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/dataService';
import { NotificationsPopover, PopoverNotificationItem } from '../components/NotificationsPopover';
import { useNotifications } from '../hooks/useNotifications';
import { getNotificationDefaultDestination } from '../utils/notificationUi';
import { getClassSupportSuggestion, type ClassSuggestion } from '../services/classSuggestionService';
import { RoleQuizGame } from '../components/RoleQuizGame';
import { EloraLogo } from '../components/EloraLogo';
import { DashboardHeader } from '../components/DashboardHeader';
import { SectionSkeleton, SectionEmpty, SectionError } from '../components/ui/SectionStates';
import { useDemoMode } from '../hooks/useDemoMode';
import { useSidebarState } from '../hooks/useSidebarState';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import { AuthGate } from '../components/auth/AuthGate';
import { DashboardShell } from '../components/ui/DashboardShell';
import { DashboardCard } from '../components/ui/DashboardCard';
import { DashboardSectionHeader } from '../components/ui/DashboardSectionHeader';
import {
    demoStats,
    demoClasses,
    demoAssignments,
    demoInsights,
    demoTeacherName,
    DEMO_CLASS_LEVEL,
    demoClassroomPractices,
} from '../demo/demoTeacherScenarioA';
import { getRoleSidebarTheme, type RoleSidebarTheme } from '../lib/roleTheme';
import {
    ClassroomHeader,
    ClassroomTabs,
    StreamLayout,
    AssignmentsPracticeTab,
    PeopleTab,
    GradesTab,
} from '../components/classroom/ClassroomComponents';
import { ClassroomBreadcrumb } from '../components/layout/ClassroomBreadcrumb';
import { ClassSummaryCard } from '../components/ClassSummaryCard';
import { PracticeGeneratorDrawer, type PracticeGeneratorForm } from '../components/PracticeGeneratorDrawer';

// ── DEV HELPER ────────────────────────────────────────────────────────────────
// Shown when the user somehow reaches this page without being verified.
// ProtectedRoute in App.tsx should normally prevent this.
// Remove or gate behind an env flag before shipping to production.
const DevShortcut = () => {
    const { mockVerify } = useAuth();
    return (
        <div
            style={{
                background: '#fffbea',
                border: '2px dashed #f59e0b',
                borderRadius: '12px',
                padding: '16px 20px',
                margin: '24px auto',
                maxWidth: '480px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#92400e',
            }}
        >
            <strong>🛠 Dev shortcut</strong> — you reached this page without verifying.
            <br />
            <button
                onClick={() => mockVerify('teacher')}
                style={{
                    marginTop: '10px',
                    background: '#28193D',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    cursor: 'pointer',
                    fontWeight: 600,
                }}
            >
                Mock verify as Teacher &amp; reload dashboard
            </button>
        </div>
    );
};

// ── Shared state-display helpers ────────────────────────────────────────────────
// Now imported from src/components/ui/SectionStates.tsx

// ── Sub-components ─────────────────────────────────────────────────────────────

const NavItem = ({
    icon,
    label,
    active = false,
    onClick,
    collapsed = false,
    className = "",
    theme,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    collapsed?: boolean;
    className?: string;
    theme: RoleSidebarTheme;
}) => {
        const activeClasses = `${theme.navActiveBg} ${theme.navActiveText}`;
        const inactiveClasses = `${theme.navInactiveText} ${theme.navHoverBg} ${theme.navHoverText}`;
        return (
            <a
                href="#"
                onClick={(e) => { e.preventDefault(); onClick?.(); }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${active ? activeClasses : inactiveClasses} ${collapsed ? 'justify-center focus:outline-none' : ''} ${className}`}
                title={collapsed ? label : undefined}
            >
                <div className="shrink-0">{icon}</div>
                {!collapsed && <span className="whitespace-nowrap">{label}</span>}

                {/* Active Indicator Circle */}
                {active && !collapsed && (
                    <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-current"
                    />
                )}
        </a>
    );
};

const StatCard = ({
    icon,
    label,
    value,
    trend,
    trendValue,
    status
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    trend?: 'up' | 'down';
    trendValue?: string;
    status?: string;
}) => {
    const isUp = trend === 'up';
    const isDown = trend === 'down';
    const trendToken = (trendValue ?? '').toLowerCase();
    const inferredDown = trendToken.includes('down') || trendToken.includes('drop') || status === 'warning';
    const inferredUp = trendToken.includes('up') || trendToken.includes('stable') || status === 'neutral';
    const trendIcon = isDown || inferredDown
        ? <ArrowDownRight size={11} className="opacity-70" />
        : (isUp || inferredUp ? <ArrowUpRight size={11} className="opacity-70" /> : null);

    let statusClass = 'text-teal-600 bg-teal-50 border-teal-100';
    if (status === 'warning' || isDown) statusClass = 'text-orange-600 bg-orange-50 border-orange-200';
    if (status === 'info') statusClass = 'text-blue-600 bg-blue-50 border-blue-100';
    if (status === 'neutral') statusClass = 'text-slate-600 bg-slate-50 border-slate-200';

    return (
        <DashboardCard variant="canonical" bodyClassName="p-4">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                        {icon}
                    </div>
                    {(trend || trendValue) && (
                        <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${statusClass}`}
                        >
                            {trendIcon}
                            {trendValue || (isUp ? 'Trending up' : 'Trending down')}
                        </div>
                    )}
                </div>
                <div>
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-1.5">
                        {label}
                    </div>
                    <div className="text-[30px] leading-none font-semibold text-slate-900 tracking-tight tabular-nums">
                        {value}
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
    let icon = null;

    const lower = status.toLowerCase();

    if (
        lower.includes('active') ||
        lower.includes('completed') ||
        lower.includes('scheduled') ||
        lower.includes('success') ||
        lower.includes('improving')
    ) {
        colorClass = 'bg-teal-50 text-teal-700 border-teal-200';
    } else if (
        lower.includes('attention') ||
        lower.includes('due tomorrow') ||
        lower.includes('warning') ||
        lower.includes('at risk') ||
        lower.includes('dropping')
    ) {
        colorClass = 'bg-red-50 text-red-700 border-red-200';
        if (lower.includes('dropping')) {
            icon = <TrendingDown size={12} className="shrink-0" />;
        }
    } else if (lower.includes('draft') || lower.includes('stable')) {
        colorClass = 'bg-teal-50 text-teal-700 border-teal-200';
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${colorClass}`}
        >
            {icon}
            {status}
        </span>
    );
};

// ── NeedsAttentionCard ─────────────────────────────────────────────────────────

interface NeedsAttentionCardProps {
    insights: dataService.TeacherInsight[];
    loading: boolean;
    error: string | null;
    onInsightClick: (insight: dataService.TeacherInsight) => void;
    onAssignPractice: (insight: dataService.TeacherInsight) => void;
    onNudgeStudent: (insight: dataService.TeacherInsight) => void;
    onDrillDown?: (filters: { statusFilter?: string, classFilter?: string }) => void;
    generatePracticeLabel?: string;
    onRetry?: () => void;
}

const insightMeta: Record<
    dataService.InsightType,
    { icon: React.ReactNode; label: string; rowBg: string; iconBg: string; iconColor: string }
> = {
    overdue_assignment: {
        icon: <Clock size={14} />,
        label: 'Overdue',
        rowBg: 'bg-white border-[#EAE7DD] hover:border-orange-200 hover:shadow-sm',
        iconBg: 'bg-orange-50',
        iconColor: 'text-orange-600',
    },
    low_scores: {
        icon: <TrendingDown size={14} />,
        label: 'Low scores',
        rowBg: 'bg-white border-[#EAE7DD] hover:border-orange-200 hover:shadow-sm',
        iconBg: 'bg-orange-50',
        iconColor: 'text-orange-600',
    },
    weak_topic: {
        icon: <AlertCircle size={14} />,
        label: 'Weak topic',
        rowBg: 'bg-white border-[#EAE7DD] hover:border-orange-200 hover:shadow-sm',
        iconBg: 'bg-orange-50',
        iconColor: 'text-orange-600',
    },
    needs_attention: {
        icon: <UserMinus size={14} />,
        label: 'Needs Attention',
        rowBg: 'bg-white border-[#EAE7DD] hover:border-red-100 hover:shadow-sm',
        iconBg: 'bg-red-50',
        iconColor: 'text-red-600',
    },
};

const NeedsAttentionCard = ({
    insights,
    loading,
    error,
    onInsightClick,
    onAssignPractice,
    onNudgeStudent,
    onDrillDown,
    generatePracticeLabel = 'Generate practice →',
    onRetry,
}: NeedsAttentionCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasInsights = insights.length > 0;
    const INITIAL_COUNT = 2;
    const displayedInsights = isExpanded ? insights : insights.slice(0, INITIAL_COUNT);
    const hasMore = insights.length > INITIAL_COUNT;

    return (
        <section>
            {/* Header */}
            <DashboardSectionHeader
                variant="canonical"
                className="mt-10 mb-3"
                title="This week in your classes"
                badge={hasInsights ? (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {insights.length}
                    </span>
                ) : undefined}
            />

            {/* Body */}
            <div className="space-y-3 relative z-10">
                {loading ? (
                    // Skeleton rows
                    [1, 2].map((n) => (
                        <div
                            key={n}
                            className="bg-white p-3 rounded-xl border border-[#EAE7DD] animate-pulse"
                        >
                            <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
                            <div className="h-2.5 bg-slate-50 rounded w-full" />
                        </div>
                    ))
                ) : error ? (
                    <div className="bg-white/70 p-4 rounded-xl border border-red-100 flex flex-col gap-2">
                        <p className="text-xs text-red-600">{error}</p>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="text-xs font-semibold text-teal-700 underline self-start hover:text-teal-900 transition-colors"
                            >
                                Try again
                            </button>
                        )}
                    </div>
                ) : !hasInsights ? (
                    <SectionEmpty
                        headline="You’re all caught up 🎉"
                        detail="No students need attention right now."
                    />
                ) : (
                    <>
                        {displayedInsights.map((insight) => {
                            const meta = insightMeta[insight.type];
                            const isClickable = !!insight.assignmentId;
                            return (
                                <div
                                    key={insight.id}
                                    onClick={() => {
                                        if (onDrillDown) {
                                            const statusFilter =
                                                insight.type === 'overdue_assignment' ? 'needs_attention' :
                                                    insight.type === 'low_scores' ? 'needs_attention' :
                                                        insight.type === 'weak_topic' ? 'needs_attention' : undefined;
                                            onDrillDown({ statusFilter, classFilter: insight.className });
                                        } else if (isClickable) {
                                            onInsightClick(insight);
                                        }
                                    }}
                                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${meta.rowBg} cursor-pointer hover:brightness-[0.98] transition-all`}
                                >
                                    {/* Icon badge */}
                                    <div
                                        className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${meta.iconBg} ${meta.iconColor}`}
                                    >
                                        {meta.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                            {insight.studentName && (
                                                <span className="text-xs font-semibold text-slate-900">
                                                    {insight.studentName}
                                                </span>
                                            )}
                                            {insight.topicTag && (
                                                <>
                                                    <span className="text-slate-300">·</span>
                                                    <span className="text-xs font-semibold text-orange-700">
                                                        {insight.topicTag}
                                                    </span>
                                                </>
                                            )}
                                            {insight.assignmentTitle && !insight.topicTag && (
                                                <span className="text-xs font-semibold text-slate-900 truncate">
                                                    {insight.assignmentTitle}
                                                </span>
                                            )}
                                            <span
                                                className={`ml-auto text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 ${meta.iconBg} ${meta.iconColor}`}
                                            >
                                                {meta.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {insight.detail}
                                        </p>
                                        {insight.className && (
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {insight.className}
                                                {isClickable && (
                                                    <span className="ml-1 text-teal-600 font-medium">
                                                        — tap to view results →
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            {(insight.type === 'weak_topic' || insight.type === 'low_scores') && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onAssignPractice(insight); }}
                                                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 bg-white border border-teal-200 px-2.5 py-1 rounded-md hover:bg-teal-50 transition-colors"
                                                >
                                                    <Sparkles size={11} />
                                                    {generatePracticeLabel}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 justify-center self-stretch ml-2 pl-3 border-l border-slate-200/80">
                                        {insight.studentId && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onNudgeStudent(insight); }}
                                                className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-teal-700 bg-white border border-teal-200 px-2.5 py-1 rounded-md hover:bg-teal-50 transition-colors"
                                            >
                                                <Send size={11} />
                                                Nudge
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onInsightClick(insight); }}
                                            className="inline-flex items-center justify-center px-3 py-1 text-[11px] font-semibold rounded-full border border-teal-200 bg-white text-teal-700 hover:bg-teal-50 transition-all focus:ring-2 focus:ring-teal-500/20 active:scale-95"
                                        >
                                            {insight.type === 'overdue_assignment' ? 'Grade now' : 'View'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {hasMore && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full py-2 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors"
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp size={14} />
                                        Show less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown size={14} />
                                        Show {insights.length - INITIAL_COUNT} more
                                    </>
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

// ── Types for real data mapped to dashboard display ───────────────────────────

interface DisplayAssignment {
    id: string;
    title: string;
    class: string;
    due: string;
    status: string;
    submitted: number;
    total: number;
}

interface DisplayClass {
    id: string;
    name: string;
    score: number;
    weakTopics: string[];
}

// The canonical Notification shape now comes from the backend (via dataService).
// The local-only NotificationItem + mockNotifications have been removed.
type NotificationItem = dataService.Notification;


// ── Demo banner ────────────────────────────────────────────────────────────────

// Demo banner and switcher are now imported from src/components/


// ── Main Component ─────────────────────────────────────────────────────────────

interface TeacherDashboardProps {
    initialClassId?: string;
    initialClassroomTab?: 'stream' | 'classwork' | 'people' | 'grades';
    forcedClassroomMode?: boolean;
    activeTab?: 'dashboard' | 'classes' | 'work' | 'assignments';
    isDemo?: boolean;
    embeddedInShell?: boolean;
}

export default function TeacherDashboardPage(props: TeacherDashboardProps = {}) {
    const navigate = useNavigate();
    const { hash } = useLocation();
    const { isVerified, logout, currentUser, login } = useAuth();
    const routeIsDemo = useDemoMode();
    const { initialClassId, initialClassroomTab = 'stream', forcedClassroomMode, isDemo: isDemoProp, embeddedInShell = false } = props;
    const isDemo = isDemoProp ?? routeIsDemo;
    const canUseDashboardHashSections = !forcedClassroomMode && (props.activeTab === undefined || props.activeTab === 'dashboard' || props.activeTab === 'work');
    const displayName = isDemo ? demoTeacherName : (currentUser?.preferredName ?? currentUser?.name ?? 'Teacher');

    // Ensure demo user is "logged in" for backend headers (but don't persist to localStorage)
    React.useEffect(() => {
        if (isDemo && currentUser?.id !== 'teacher_1' && typeof login === 'function') {
            login('teacher', undefined, false);
        }
    }, [isDemo, currentUser, login]);


    // ── Real data state ──
    const [teacherName, setTeacherName] = useState<string>(isDemo ? demoTeacherName : (currentUser?.preferredName || 'Teacher'));
    const [stats, setStats] = useState<dataService.TeacherStat[]>([]);
    const [myClasses, setMyClasses] = useState<dataService.TeacherClass[]>([]);
    const [upcomingAssignments, setUpcomingAssignments] = useState<DisplayAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Insights state ──
    const [insights, setInsights] = useState<dataService.TeacherInsight[]>([]);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [insightsError, setInsightsError] = useState<string | null>(null);

    // ── Ask Elora card state ──
    type AskEloraStatus = 'idle' | 'loading' | 'success' | 'error';
    const [eloraStatus, setEloraStatus] = useState<AskEloraStatus>('idle');
    const [eloraSuggestion, setEloraSuggestion] = useState<ClassSuggestion | null>(null);
    const [eloraError, setEloraError] = useState<string | null>(null);

    // ── Copilot Handlers ──
    const getClassAttentionList = () => {
        const hasData = myClasses.length > 0;
        if (!hasData) return "I don't see any recent data for your classes right now, so I can't give an attention list yet.";

        let str = `Here are 3 students to focus on in ${myClasses[0]?.name || 'your class'}:\n`;
        str += `\nJordan Lee — 43% on Algebra Quiz 1, needs focused support on factorisation.`;
        str += `\nPriya Nair — Algebra Quiz 1 not submitted, 3 days overdue.`;
        str += `\nAlex Chen — Low engagement on Factorisation practice runs.`;
        return str;
    };

    const getClassTopicSummary = () => {
        const hasData = insights.length > 0;
        if (!hasData) return "I don't see any recent data for this topic this week, so I can't give a summary yet.";

        return `Average accuracy on Algebra – Factorisation is about 61%. 14 of 28 students are below 50%. It's worth one more practice round before moving on. You could assign a practice pack on Algebra – Factorisation next.`;
    };

    const getClassWeekSummary = () => {
        if (myClasses.length === 0) return "I don't see any recent data for your class this week, so I can't give a summary yet.";
        const c = myClasses[0];
        return `This week, ${c.name} has an average score of ${c.averageScore || 61}% (vs 68% last week). A total of 0 of 32 assignments were submitted. The main weak area is ${c.nextTopic || 'Algebra - Factorisation'}.`;
    };

    const handleTeacherAskElora = async (prompt: string): Promise<string> => {
        await new Promise(r => setTimeout(r, 600));
        const lowerPrompt = prompt.toLowerCase();

        if (lowerPrompt.includes('who needs my attention') || lowerPrompt.includes('attention')) {
            return getClassAttentionList();
        }
        if (lowerPrompt.includes('algebra') || lowerPrompt.includes('factorisation')) {
            return getClassTopicSummary();
        }
        if (lowerPrompt.includes('week') || lowerPrompt.includes('summary')) {
            return getClassWeekSummary();
        }

        return "I don't see any recent data for Sec 3 Mathematics this week, so I can't give a summary yet.";
    };


    // Ref so the "Ask again" button can call fetchEloraSuggestion defined inside useEffect.
    const fetchEloraSuggestionRef = React.useRef<((data?: dataService.TeacherInsight[]) => Promise<void>) | null>(null);

    // Use the unified notifications hook
    const {
        notifications,
        unreadCount,
        markOneRead: handleMarkBackendNotificationRead,
        markAllRead: handleMarkAllRead
    } = useNotifications({ userId: currentUser?.id || 'teacher_1', role: 'teacher' });

    const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const sidebarTheme = getRoleSidebarTheme('teacher');

    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
    const [assignmentResults, setAssignmentResults] = useState<dataService.TeacherAssignmentResults | null>(null);
    const [loadingResults, setLoadingResults] = useState(false);
    const [availablePacks, setAvailablePacks] = useState<Partial<dataService.GamePack>[]>([]);

    // ── Drill Down State ──
    const assignmentsSectionRef = React.useRef<HTMLElement>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [classFilter, setClassFilter] = useState<string>('all');
    const [highlightAssignments, setHighlightAssignments] = useState(false);

    const handleDrillDown = ({ statusFilter, classFilter }: { statusFilter?: string; classFilter?: string }) => {
        if (statusFilter) setStatusFilter(statusFilter);
        if (classFilter) setClassFilter(classFilter);

        if (assignmentsSectionRef.current) {
            assignmentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setHighlightAssignments(true);
            setTimeout(() => setHighlightAssignments(false), 1500);
        }
    };

    const handleNotificationClick = async (item: PopoverNotificationItem) => {
        if (!item.original) return;

        // Mark as read in backend
        if (!item.isRead) {
            await handleMarkBackendNotificationRead(item.original.id);
        }

        const dest = getNotificationDefaultDestination(item.original);
        // Teacher currently only has dashboard/classes tabs, but this prepares for more
        if (dest === 'classes') {
            setActiveTab('classes');
        } else {
            setActiveTab('dashboard');
        }

        // Drill down logic from context
        const context = item.original.context;
        if (context) {
            if (context.statusFilter || context.classId) {
                handleDrillDown({
                    statusFilter: context.statusFilter,
                    classFilter: context.classId // Assuming classId matches className for this demo
                });
            }
        }
    };

    // ── UI state ──
    const [filter, setFilter] = useState('This week');
    const [perfTab, setPerfTab] = useState('Classes');
    const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);
    const [generatorPrefill, setGeneratorPrefill] = useState<Partial<PracticeGeneratorForm> | undefined>(undefined);
    const [showPracticeGeneratorDrawer, setShowPracticeGeneratorDrawer] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'classroom' | 'assignments'>(() => {
        if (forcedClassroomMode) return 'classroom';
        if (props.activeTab === 'classes') return 'classes';
        if (props.activeTab === 'assignments') return 'assignments';
        if (props.activeTab === 'work') return 'dashboard'; // 'work' maps to dashboard for now
        return 'dashboard';
    });

    // Synchronize activeTab state when prop changes (e.g. from browser back/forward navigation)
    useEffect(() => {
        if (props.activeTab === 'classes') {
            setActiveTab('classes');
        } else if (props.activeTab === 'assignments') {
            setActiveTab('assignments');
        } else if (props.activeTab === 'dashboard' || props.activeTab === 'work') {
            setActiveTab('dashboard');
        }
        
        // Deep linking hash synchronization is only valid on dashboard-like routes.
        if (canUseDashboardHashSections) {
            if (hash === '#practice') {
                setActiveTab('dashboard');
                setShowPracticeGeneratorDrawer(true);
            } else if (hash === '#reports') {
                setActiveTab('dashboard');
                setTimeout(() => {
                    document.getElementById('reports-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            } else if (hash === '#resources') {
                setActiveTab('dashboard');
                setTimeout(() => {
                    document.getElementById('resources-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        }
    }, [props.activeTab, hash, canUseDashboardHashSections]);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string | undefined>(initialClassId);
    const [classroomActiveTab, setClassroomActiveTab] = useState<'stream' | 'classwork' | 'people' | 'grades'>(initialClassroomTab);
    const [classroomDraft, setClassroomDraft] = useState('');
    const [classroomComposerOpen, setClassroomComposerOpen] = useState(false);
    const [classroomComposerAIMode, setClassroomComposerAIMode] = useState(false);
    const [teacherAnnouncements, setTeacherAnnouncements] = useState<Array<{
        id: string;
        title: string;
        body: string;
        timestamp: string;
        kind: 'announcement';
    }>>([]);
    const [showCreateClass, setShowCreateClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassSubject, setNewClassSubject] = useState('');
    const [newClassSchedule, setNewClassSchedule] = useState('');
    const [createClassError, setCreateClassError] = useState<string | null>(null);
    const [creatingClass, setCreatingClass] = useState(false);

    // ── Welcome strip state (persisted via localStorage) ──
    const WELCOME_KEY = 'elora_teacher_welcome_dismissed';
    const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(
        () => localStorage.getItem(WELCOME_KEY) === 'true'
    );
    const handleDismissWelcome = () => {
        setWelcomeDismissed(true);
        localStorage.setItem(WELCOME_KEY, 'true');
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingClass(true);
        setCreateClassError(null);
        try {
            const newClass = await dataService.createTeacherClass(newClassName, newClassSubject, newClassSchedule || undefined);
            setMyClasses(prev => [...prev, newClass]);
            setShowCreateClass(false);
            setNewClassName('');
            setNewClassSubject('');
            setNewClassSchedule('');
        } catch (err: unknown) {
            setCreateClassError(err instanceof Error ? err.message : 'Failed to create class');
        } finally {
            setCreatingClass(false);
        }
    };

    // ── Review mode state ──
    const [reviewGamePack, setReviewGamePack] = useState<dataService.GamePack | null>(null);
    const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0);

    // ── Assign pack state ──
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [packToAssign, setPackToAssign] = useState<dataService.GamePack | null>(null);
    const [assignClassId, setAssignClassId] = useState('');
    const [assignPackId, setAssignPackId] = useState('');
    const [assignDueDate, setAssignDueDate] = useState('');
    const [assignDescription, setAssignDescription] = useState('');
    const [assigningError, setAssigningError] = useState<string | null>(null);
    const [assigning, setAssigning] = useState(false);

    // ── Targeted Practice flow (Milestone 2) ──
    const [insightAssignModalOpen, setInsightAssignModalOpen] = useState(false);
    const [insightToAssign, setInsightToAssign] = useState<dataService.TeacherInsight | null>(null);
    const [insightGeneratedPack, setInsightGeneratedPack] = useState<dataService.GamePack | null>(null);
    const [insightGenerating, setInsightGenerating] = useState(false);
    const [insightDueDate, setInsightDueDate] = useState('');
    const [insightAssigningError, setInsightAssigningError] = useState<string | null>(null);
    const [insightAssigning, setInsightAssigning] = useState(false);

    // ── Nudge student state ──
    const [nudgeModalOpen, setNudgeModalOpen] = useState(false);
    const [nudgeInsight, setNudgeInsight] = useState<dataService.TeacherInsight | null>(null);
    const [nudgeText, setNudgeText] = useState('');
    const [isSendingNudge, setIsSendingNudge] = useState(false);
    const [nudgeError, setNudgeError] = useState<string | null>(null);

    const handleNudgeClick = (insight: dataService.TeacherInsight) => {
        setNudgeInsight(insight);
        setNudgeModalOpen(true);
        setNudgeText('');
        setNudgeError(null);
    };

    const handleSendNudge = async () => {
        if (!nudgeInsight?.studentId || !nudgeText.trim()) return;

        setIsSendingNudge(true);
        setNudgeError(null);
        try {
            await dataService.sendTeacherNudge(nudgeInsight.studentId, nudgeText);
            setNudgeModalOpen(false);
            setNudgeInsight(null);
            setNudgeText('');
        } catch (err: unknown) {
            setNudgeError(err instanceof Error ? err.message : 'Failed to send nudge');
        } finally {
            setIsSendingNudge(false);
        }
    };

    // ── Generate practice prefill hook ──
    const handleGeneratePractice = (insight: dataService.TeacherInsight) => {
        setGeneratorPrefill({ 
            topic: insight.topicTag || insight.assignmentTitle || 'Targeted Practice', 
            level: insight.className || 'General' 
        });
        setShowPracticeGeneratorDrawer(true);
    };

    const handleTargetedPracticeClick = async (insight: dataService.TeacherInsight) => {
        setInsightToAssign(insight);
        setInsightAssignModalOpen(true);
        setInsightGenerating(true);
        setInsightAssigningError(null);
        setInsightGeneratedPack(null);

        try {
            const pack = await dataService.generateGamePack({
                topic: insight.topicTag || insight.assignmentTitle || 'Targeted Practice',
                level: insight.className || 'General',
                questionCount: 5,
                difficulty: 'mixed'
            });
            setInsightGeneratedPack(pack);
        } catch (err: unknown) {
            setInsightAssigningError(err instanceof Error ? err.message : 'Failed to generate practice pack.');
        } finally {
            setInsightGenerating(false);
        }
    };

    const handleInsightAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!insightGeneratedPack || !insightToAssign || !insightDueDate) {
            setInsightAssigningError('Please select a due date.');
            return;
        }

        setInsightAssigning(true);
        setInsightAssigningError(null);
        try {
            // Find class ID from myClasses (using insight.className)
            const matchedClass = myClasses.find(c => c.name === insightToAssign.className);
            const classroomId = matchedClass ? matchedClass.id : 'class-1'; // fallback

            await dataService.createTeacherAssignment({
                classroomId,
                gamePackId: insightGeneratedPack.id,
                title: `${insightGeneratedPack.title} (Targeted)`,
                dueDate: insightDueDate,
                description: `Targeted practice for ${insightToAssign.studentName || 'class'}`
            });
            setInsightAssignModalOpen(false);
            setInsightToAssign(null);

            // Refresh counts and dashboard
            const [a, c] = await Promise.all([
                dataService.getUpcomingAssignments(),
                dataService.getMyClasses()
            ]);

            setMyClasses(c);
            setUpcomingAssignments(
                a.map((asgn) => ({
                    id: asgn.id,
                    title: asgn.title,
                    class: asgn.className,
                    due: asgn.dueDate
                        ? new Date(asgn.dueDate).toLocaleDateString()
                        : asgn.statusLabel ?? asgn.status ?? '',
                    status: asgn.statusLabel ?? asgn.status ?? 'Scheduled',
                    submitted: 0,
                    total: 0,
                }))
            );
        } catch (err: unknown) {
            setInsightAssigningError(err instanceof Error ? err.message : 'Failed to assign practice');
        } finally {
            setInsightAssigning(false);
        }
    };

    const handleAssignClick = (pack: dataService.GamePack) => {
        setPackToAssign(pack);
        setAssignPackId(pack.id);
        setShowAssignModal(true);
        setAssignClassId('');
        setAssignDueDate('');
        setAssignDescription('');
        setAssigningError(null);
    };

    const handleAssignToClassClick = (classroomId: string) => {
        setPackToAssign(null);
        setAssignPackId('');
        setAssignClassId(classroomId);
        setShowAssignModal(true);
        setAssignDueDate('');
        setAssignDescription('');
        setAssigningError(null);
    };

    const handleViewRosterClick = (classroomId: string) => {
        setSelectedClassroomId(classroomId);
        setClassroomActiveTab('people');
        setActiveTab('classroom');
    };

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalPackId = packToAssign?.id || assignPackId;
        const finalPackTitle = packToAssign?.title || availablePacks.find(p => p.id === assignPackId)?.title || 'Assignment';

        if (!finalPackId || !assignClassId || !assignDueDate) {
            setAssigningError('Please select a game pack, a class, and a due date.');
            return;
        }

        setAssigning(true);
        setAssigningError(null);
        try {
            await dataService.createTeacherAssignment({
                classroomId: assignClassId,
                gamePackId: finalPackId,
                title: finalPackTitle,
                dueDate: assignDueDate,
                description: assignDescription
            });
            setShowAssignModal(false);
            setPackToAssign(null);

            // Refresh counts and dashboard
            const [a, c] = await Promise.all([
                dataService.getUpcomingAssignments(),
                dataService.getMyClasses()
            ]);

            setMyClasses(c);
            setUpcomingAssignments(
                a.map((asgn) => ({
                    id: asgn.id,
                    title: asgn.title,
                    class: asgn.className,
                    due: asgn.dueDate
                        ? new Date(asgn.dueDate).toLocaleDateString()
                        : asgn.statusLabel ?? asgn.status ?? '',
                    status: asgn.statusLabel ?? asgn.status ?? 'Scheduled',
                    submitted: 0,
                    total: 0,
                }))
            );
        } catch (err: unknown) {
            setAssigningError(err instanceof Error ? err.message : 'Failed to assign pack');
        } finally {
            setAssigning(false);
        }
    };

    useEffect(() => {
        const initializeDashboard = async () => {
            setLoading(true);
            setInsightsLoading(true);

            // Force demo data since we are in SPA mode with no backend
            setStats(demoStats);
            setMyClasses(demoClasses);
            setUpcomingAssignments(
                demoAssignments.map((a) => ({
                    id: a.id,
                    title: a.title,
                    class: a.className,
                    due: a.statusLabel,
                    status: a.status,
                    submitted: 0,
                    total: 32,
                }))
            );
            if (isDemo) setTeacherName(demoTeacherName);
            setInsights(demoInsights);
            
            // Available packs for game creation
            try {
                const packs = await dataService.getAvailableGamePacks();
                setAvailablePacks(packs);
            } catch (err) {
                console.warn("Failed to load available packs, falling back to empty list", err);
                setAvailablePacks([]);
            }

            // Kick off the Elora suggestion immediately after data is set
            fetchEloraSuggestion(demoInsights);

            setLoading(false);
            setInsightsLoading(false);
        };

        // Expose fetchEloraSuggestion for the "Ask again" button.
        const fetchEloraSuggestion = async (insightData?: dataService.TeacherInsight[]) => {
            setEloraStatus('loading');
            setEloraError(null);
            try {
                const firstClassId = 'class-1';
                const firstClassName = 'Sec 3 Mathematics';
                const dataToUse = insightData ?? demoInsights;
                const suggestion = await getClassSupportSuggestion(
                    firstClassId,
                    firstClassName,
                    dataToUse
                );
                setEloraSuggestion(suggestion);
                setEloraStatus('success');
            } catch (err: unknown) {
                setEloraError(err instanceof Error ? err.message : 'Unknown error');
                setEloraStatus('error');
            }
        };
        fetchEloraSuggestionRef.current = fetchEloraSuggestion;

        initializeDashboard();
    }, [isDemo]);

    // ── Map real class data → performance display shape ──
    const classPerformance = myClasses.map((cls) => ({
        id: cls.id,
        name: cls.name,
        // Use real average score from backend if available, otherwise default to 0
        score: cls.averageScore ?? 0,
        // nextTopic gives us one topic; weakTopics stays empty until backend supplies more
        weakTopics: cls.nextTopic ? (cls.nextTopic.includes(',') ? cls.nextTopic.split(',').map(s => s.trim()) : [cls.nextTopic]) : [],
    }));

    // ── Computed Filtered Assignments ──
    const availableClasses = Array.from(new Set(upcomingAssignments.map(a => a.class))).filter(Boolean);
    const filteredAssignments = upcomingAssignments.filter(assignment => {
        const sFilter = statusFilter.toLowerCase();
        let matchesStatus = true;
        if (sFilter === 'needs_attention') {
            matchesStatus = ['needs attention', 'due tomorrow', 'warning'].includes(assignment.status.toLowerCase());
        } else if (sFilter === 'completed') {
            matchesStatus = ['completed', 'success'].includes(assignment.status.toLowerCase());
        } else if (sFilter === 'on_track') {
            matchesStatus = ['active', 'scheduled'].includes(assignment.status.toLowerCase());
        } else if (sFilter !== 'all') {
            matchesStatus = assignment.status.toLowerCase() === sFilter;
        }

        const matchesClass = classFilter === 'all' || assignment.class === classFilter;
        return matchesStatus && matchesClass;
    });

    const [reviewItems, setReviewItems] = useState<dataService.TeacherReviewWorkItem[]>([]);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewStatusFilter, setReviewStatusFilter] = useState('all');
    const [reviewClassFilter, setReviewClassFilter] = useState('all');

    useEffect(() => {
        if (activeTab !== 'assignments') return;

        let cancelled = false;
        const loadReviewItems = async () => {
            setReviewLoading(true);
            try {
                const items = await dataService.getTeacherReviewWorkItemsMock();
                if (!cancelled) {
                    setReviewItems(items);
                }
            } catch (err) {
                console.error('Failed to load teacher review items', err);
                if (!cancelled) {
                    setReviewItems([]);
                }
            } finally {
                if (!cancelled) {
                    setReviewLoading(false);
                }
            }
        };

        void loadReviewItems();

        return () => {
            cancelled = true;
        };
    }, [activeTab]);

    const reviewClasses = React.useMemo(() => Array.from(new Set(reviewItems.map((item) => item.className))), [reviewItems]);
    const filteredReviewItems = React.useMemo(() => {
        return reviewItems.filter((item) => {
            const statusMatch = reviewStatusFilter === 'all' || item.status === reviewStatusFilter;
            const classMatch = reviewClassFilter === 'all' || item.className === reviewClassFilter;
            return statusMatch && classMatch;
        });
    }, [reviewItems, reviewClassFilter, reviewStatusFilter]);

    // ── Derive stat card values from real stats array ──
    const findStat = (label: string) =>
        stats.find((s) => s.label.toLowerCase().includes(label.toLowerCase()));

    const classesTodayStat = findStat('class') ?? findStat('today');
    const studentsStat = findStat('student');
    const gradingStat = findStat('grading') ?? findStat('pending');
    const avgScoreStat = findStat('score') ?? findStat('average');

    // ── Derive Class Health ──
    const classHealth = React.useMemo(() => {
        if (!myClasses.length) return null;

        // Pick the first class as the main demo class
        const mainClass = myClasses[0];

        // Filter insights for this class using string match
        const classInsights = insights.filter(i => i.className === mainClass.name);

        // Students needing support
        const supportNames: string[] = Array.from(
            new Set<string>(
                classInsights
                    .map((i) => i.studentName)
                    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
            )
        );
        const studentsNeedingSupport = supportNames.length;
        const supportInitials = supportNames
            .slice(0, 2)
            .map((name) =>
                name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
            );

        // Top struggle topic
        const topics = classInsights.filter(i => i.topicTag).map(i => i.topicTag as string);
        let topStruggleTopic: string | null = null;
        if (topics.length > 0) {
            const counts = topics.reduce((acc, topic) => {
                acc[topic] = (acc[topic] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            topStruggleTopic = Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
        }

        // Status
        let status: 'At risk' | 'Stable' | 'Improving' = 'Stable';
        const lowScoreCount = classInsights.filter(i => i.type === 'low_scores').length;

        if (lowScoreCount >= 1 || studentsNeedingSupport >= 3) {
            status = 'At risk';
        } else if (lowScoreCount === 0 && studentsNeedingSupport === 0) {
            status = 'Improving';
        } else {
            status = 'Stable';
        }

        return {
            className: mainClass.name,
            status,
            studentsNeedingSupport,
            topStruggleTopic,
            supportInitials,
        };
    }, [myClasses, insights]);

    const selectedClassroom = React.useMemo(
        () => myClasses.find((cls) => cls.id === selectedClassroomId) ?? myClasses[0] ?? null,
        [myClasses, selectedClassroomId]
    );

    const selectedClassroomInsights = React.useMemo(() => {
        if (!selectedClassroom) return [] as dataService.TeacherInsight[];
        return insights.filter((insight) => insight.className === selectedClassroom.name);
    }, [insights, selectedClassroom]);

    const selectedClassroomUpcoming = React.useMemo(() => {
        if (!selectedClassroom) return [] as typeof upcomingAssignments;
        return upcomingAssignments
            .filter((assignment) => assignment.class === selectedClassroom.name)
            .slice(0, 4);
    }, [selectedClassroom, upcomingAssignments]);

    const [classroomMockBundle, setClassroomMockBundle] = useState<dataService.ClassroomMockBundle>({
        streamItems: [],
        assignments: [],
        practices: [],
        people: [],
    });

    useEffect(() => {
        let cancelled = false;

        const loadClassroomMock = async () => {
            const bundle = await dataService.getTeacherClassroomMockData(selectedClassroom?.id);
            if (!cancelled) {
                setClassroomMockBundle(bundle);
            }
        };

        void loadClassroomMock();

        return () => {
            cancelled = true;
        };
    }, [selectedClassroom?.id]);

    const selectedClassroomWithPeople = React.useMemo(() => {
        if (!selectedClassroom) return selectedClassroom;
        return {
            ...selectedClassroom,
            students: classroomMockBundle.people.filter((person) => person.role === 'student'),
        };
    }, [selectedClassroom, classroomMockBundle.people]);

    const handlePostClassroomAnnouncement = () => {
        const trimmedDraft = classroomDraft.trim();
        if (!trimmedDraft) return;

        setTeacherAnnouncements((previous) => [
            {
                id: `announcement-${Date.now()}`,
                title: 'Announcement',
                body: trimmedDraft,
                timestamp: 'Just now',
                kind: 'announcement',
            },
            ...previous,
        ]);
        setClassroomDraft('');
        setClassroomComposerOpen(false);
    };

    const classroomFeedCards = React.useMemo(() => {
        const announcementCards = teacherAnnouncements.map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            meta: item.timestamp,
            tone: 'announcement' as const,
        }));

        const insightCards = selectedClassroomInsights.slice(0, 3).map((insight, index) => ({
            id: `${insight.id}-${index}`,
            title: insight.studentName ? `${insight.studentName} needs support` : 'Class insight',
            body: insight.detail || insight.topicTag || 'Teacher insight',
            meta: insight.topicTag || insight.type,
            tone: insight.type === 'needs_attention' ? ('alert' as const) : ('info' as const),
        }));

        const upcomingCards = selectedClassroomUpcoming.slice(0, 2).map((assignment) => ({
            id: assignment.id,
            title: assignment.title,
            body: assignment.due && assignment.due.toLowerCase().includes('overdue') ? assignment.due : `Due ${assignment.due || assignment.status}`,
            meta: assignment.status,
            tone: assignment.status === 'needs attention' || assignment.status === 'warning' ? ('alert' as const) : ('info' as const),
        }));

        return [...announcementCards, ...insightCards, ...upcomingCards].slice(0, 6);
    }, [selectedClassroomInsights, selectedClassroomUpcoming, teacherAnnouncements]);

    useEffect(() => {
        if (activeTab !== 'classroom' || myClasses.length === 0) return;

        const classroomExists = selectedClassroomId ? myClasses.some((cls) => cls.id === selectedClassroomId) : false;
        if (!classroomExists) {
            setSelectedClassroomId(myClasses[0].id);
        }
    }, [activeTab, myClasses, selectedClassroomId]);

    // ── Guard: show dev shortcut if auth was bypassed (skip in demo mode) ──
    if (!isVerified && !isDemo) {
        return (
            <div className="min-h-screen w-full bg-[#28193D] flex flex-col items-center justify-center p-4">
                <DevShortcut />
            </div>
        );
    }

    // ── Initials for avatar ──
    const initials = teacherName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'T';

    if (reviewGamePack) {
        const question = reviewGamePack.questions[reviewQuestionIndex];
        const totalQuestions = reviewGamePack.questions.length;

        return (
            <RoleQuizGame
                role="teacher"
                mode="review"
                gameTitle={reviewGamePack.title}
                topicLabel={reviewGamePack.topic}
                totalQuestions={totalQuestions}
                currentQuestionIndex={reviewQuestionIndex}
                score={0} // Not really applicable when Teacher is just reviewing
                maxScore={totalQuestions}
                livesLeft={3}
                question={{
                    text: question.prompt,
                    choices: question.options,
                    // In review mode for teacher, just select the right answer visually
                    selectedIndex: question.correctIndex,
                    correctIndex: question.correctIndex,
                    explanation: question.explanation || 'This is the explanation provided when you generated the game.'
                }}
                status="finished"
                onSelectChoice={() => { }}
                onCheckAnswer={() => { }}
                onNextQuestion={() => {
                    setReviewQuestionIndex(prev => Math.min(prev + 1, totalQuestions - 1));
                }}
                onPrevQuestion={() => {
                    setReviewQuestionIndex(prev => Math.max(prev - 1, 0));
                }}
                onQuit={() => {
                    setReviewGamePack(null);
                    setReviewQuestionIndex(0);
                }}
            />
        );
    }
    const handleViewAssignment = async (id: string) => {
        setLoadingResults(true);
        setAssignmentResults(null); // clear stale data before new fetch
        setSelectedAssignmentId(id);
        try {
            const results = await dataService.getTeacherAssignmentResults(id);
            setAssignmentResults(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingResults(false);
        }
    };

    if (selectedAssignmentId) {
        return (
            <div className={`flex bg-[#FDFBF5] font-sans text-slate-900 ${embeddedInShell ? 'min-h-0 flex-1' : 'min-h-screen'}`}>
                {/* ── Minimal Sidebar for child view ── */}
                {!embeddedInShell && (
                    <aside className="bg-teal-900 text-teal-50 flex flex-col h-screen sticky top-0 shrink-0 shadow-xl z-20 w-20">
                        <div className="h-20 flex items-center justify-center border-b border-teal-800/50 px-6">
                            <Link to="/" className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-serif italic font-semibold text-white shadow-sm shrink-0">
                                E
                            </Link>
                        </div>
                    </aside>
                )}

                <main className={`flex-1 flex flex-col overflow-hidden ${embeddedInShell ? 'min-h-0' : 'h-screen'}`}>
                    {/* Header */}
                    <header className={`h-20 bg-white border-b border-[#EAE7DD] px-8 flex items-center justify-between shrink-0 z-10 ${embeddedInShell ? '' : 'sticky top-0'}`}>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setSelectedAssignmentId(null);
                                    setAssignmentResults(null);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700 text-sm font-medium"
                            >
                                <PanelLeftClose size={18} className="rotate-180" />
                                Back to dashboard
                            </button>
                            <div className="w-px h-5 bg-slate-200" />
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                Assignment Results
                            </h1>
                        </div>
                    </header>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 relative">
                        {loadingResults ? (
                            <div className="flex items-center justify-center h-64">
                                <p className="text-slate-500 font-medium">Loading results...</p>
                            </div>
                        ) : assignmentResults ? (
                            <div className="max-w-5xl mx-auto space-y-8">
                                {/* Assignment Info */}
                                <div className="bg-white rounded-2xl border border-[#EAE7DD] p-6 shadow-sm">
                                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 mb-2">
                                        {assignmentResults.assignment.title}
                                    </h2>
                                    <div className="flex items-center gap-6 text-sm text-slate-600">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={16} className="text-slate-400" />
                                            {assignmentResults.assignment.className}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={16} className="text-slate-400" />
                                            Due {new Date(assignmentResults.assignment.dueDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Weak Topics */}
                                {assignmentResults.weakTopics.length > 0 && (
                                    <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                                            <AlertCircle size={20} />
                                            Topics Needing Attention
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {assignmentResults.weakTopics.map(topic => (
                                                <span key={topic} className="px-3 py-1 bg-white text-orange-700 rounded-full text-sm font-medium border border-orange-200">
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Student Results Table */}
                                <div className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-[#EAE7DD] flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-slate-900">Student Progress</h3>
                                        <div className="text-sm font-medium text-slate-500">
                                            {assignmentResults.students.filter(s => s.status === 'submitted').length} / {assignmentResults.students.length} Submitted
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#FDFBF5] border-b border-[#EAE7DD] text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    <th className="px-6 py-4">Student</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Score</th>
                                                    <th className="px-6 py-4">Last Active</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#EAE7DD]">
                                                {assignmentResults.students.map((student) => (
                                                    <tr key={student.studentId} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-slate-900">{student.studentName}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={student.status} />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {student.score !== null ? (
                                                                <span className="font-semibold text-slate-900">{student.score}%</span>
                                                            ) : (
                                                                <span className="text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-500">
                                                            {new Date(student.updatedAt).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-5xl mx-auto">
                                <SectionError
                                    message="We couldn't load the assignment results. Please try again."
                                    onRetry={() => selectedAssignmentId && handleViewAssignment(selectedAssignmentId)}
                                />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={`flex flex-col bg-[#FDFBF5] font-sans text-slate-900 ${embeddedInShell ? 'min-h-0 h-full' : 'min-h-screen'}`}>
            {/* Demo banner & Role Switcher – only shown in demo mode */}
            {!embeddedInShell && isDemo && (
                <>
                    <DemoBanner />
                    <DemoRoleSwitcher />
                </>
            )}
            <div className={`flex ${embeddedInShell ? 'flex-1 min-h-0' : 'flex-1'}`}>
                {/* MOBILE BACKDROP (Surface 0) */}
                {!embeddedInShell && isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-30 md:hidden transition-all duration-500 animate-in fade-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* ── Sidebar ── */}
                {!embeddedInShell && <aside
                    className={`${sidebarTheme.asideBg} ${sidebarTheme.text} flex flex-col md:min-h-screen fixed inset-y-0 left-0 z-40 md:sticky md:translate-x-0 transition-all transition-colors duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:flex shrink-0 shadow-xl`}
                >
                    {/* Logo & Close toggle */}
                    <div className={`h-24 flex items-center border-b ${sidebarTheme.headerBorder} px-8 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                        <Link to="/" className="flex items-center text-teal-50 hover:text-white transition-colors overflow-hidden shrink-0">
                            <EloraLogo className="w-10 h-10 text-current drop-shadow-sm transition-transform hover:scale-105" withWordmark={isSidebarOpen} />
                        </Link>

                        {/* Mobile close toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden p-2 text-teal-100/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="Close menu"
                        >
                            <X size={22} />
                        </button>

                        {/* Desktop collapse toggle */}
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="hidden md:flex text-teal-100/50 hover:text-white transition-colors"
                                title="Collapse sidebar"
                            >
                                <PanelLeftClose size={18} />
                            </button>
                        )}
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                        <NavItem 
                            icon={<LayoutDashboard size={20} />} 
                            label="Dashboard" 
                            active={activeTab === 'dashboard' && !hash} 
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                navigate(isDemo ? '/teacher/demo' : '/dashboard/teacher');
                                setActiveTab('dashboard');
                                setShowPracticeGeneratorDrawer(false);
                            }} 
                            collapsed={!isSidebarOpen} 
                            theme={sidebarTheme} 
                        />
                        <NavItem 
                            icon={<BookOpen size={20} />} 
                            label="My Classes" 
                            active={activeTab === 'classes'} 
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                navigate(isDemo ? '/teacher/demo/classes' : '/teacher/classes');
                                setActiveTab('classes');
                                setShowPracticeGeneratorDrawer(false);
                            }} 
                            collapsed={!isSidebarOpen} 
                            theme={sidebarTheme} 
                        />
                        <NavItem
                            icon={<FileText size={20} />}
                            label="Assignments"
                            active={activeTab === 'assignments'}
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                navigate(isDemo ? '/teacher/demo/assignments' : '/teacher/assignments');
                                setActiveTab('assignments');
                                setShowPracticeGeneratorDrawer(false);
                            }}
                            collapsed={!isSidebarOpen}
                            theme={sidebarTheme}
                        />
                        <NavItem
                                icon={<Target size={20} />}
                                label="Practice & quizzes"
                                active={activeTab === 'dashboard' && hash === '#practice'}
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                    navigate(isDemo ? '/teacher/demo/practice' : '/teacher/practice');
                            }}
                            collapsed={!isSidebarOpen}
                            theme={sidebarTheme}
                        />
                        {!isDemo && (
                            <NavItem
                                icon={<Sparkles size={20} />}
                                label="Copilot"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    navigate('/teacher/copilot');
                                    setShowPracticeGeneratorDrawer(false);
                                }}
                                theme={sidebarTheme}
                                collapsed={!isSidebarOpen}
                            />
                        )}
                        {!isDemo && (
                            <NavItem 
                                icon={<TrendingUp size={20} />} 
                                label="Reports" 
                                active={activeTab === 'dashboard' && hash === '#reports'} 
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    navigate('/dashboard/teacher#reports');
                                    setActiveTab('dashboard');
                                    setShowPracticeGeneratorDrawer(false);
                                    setTimeout(() => {
                                        document.getElementById('reports-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                                collapsed={!isSidebarOpen} 
                                theme={sidebarTheme} 
                            />
                        )}
                        {/* <NavItem icon={<Users size={20} />} label="Students" collapsed={!isSidebarOpen} theme={sidebarTheme} /> */}
                    </nav>

                    {/* Footer cluster */}
                    <div className="mt-auto px-4 pt-5 pb-4 border-t border-teal-800/50 space-y-1.5">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex items-center justify-center w-full p-2.5 text-teal-100/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
                                title="Open sidebar"
                            >
                                <PanelLeftOpen size={20} />
                            </button>
                        )}
                        <NavItem icon={<Settings size={20} />} label="Settings" collapsed={!isSidebarOpen} theme={sidebarTheme} />
                        <button
                            onClick={logout}
                            className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-teal-100 hover:bg-teal-800/50 hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
                            title={!isSidebarOpen ? "Sign out" : undefined}
                        >
                            <LogOut size={20} className="shrink-0" />
                            {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
                        </button>
                    </div>
                </aside>}

                {/* ── Main Content ── */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {!embeddedInShell && (
                        <DashboardHeader
                            role="teacher"
                            displayName={displayName}
                            roleLabel="TEACHER"
                            avatarInitials={initials}
                            onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
                            searchPlaceholder="Search classes..."
                            notificationsNode={
                                <NotificationsPopover
                                    items={
                                        notifications
                                            .slice(0, 10)
                                            .map(n => ({
                                                id: n.id,
                                                title: n.title,
                                                message: n.message,
                                                time: (() => {
                                                    const diffMs = Date.now() - new Date(n.createdAt).getTime();
                                                    const mins = Math.floor(diffMs / 60_000);
                                                    if (mins < 60) return `${mins}m ago`;
                                                    const hrs = Math.floor(mins / 60);
                                                    if (hrs < 24) return `${hrs}h ago`;
                                                    return `${Math.floor(hrs / 24)}d ago`;
                                                })(),
                                                isRead: n.isRead,
                                                type: n.type,
                                                original: n
                                            }))
                                    }
                                    unreadCount={unreadCount}
                                    onMarkAllRead={handleMarkAllRead}
                                    onNotificationClick={handleNotificationClick}
                                    badgeColor="bg-orange-500"
                                    unreadDotColor="bg-orange-500"
                                    unreadBgColor="bg-orange-50/20"
                                    headerTextColor="text-teal-600"
                                    emptyMessage="No new notifications"
                                />
                            }
                        />
                    )}
                    <DashboardShell>

                        {/* ── Active View Content ── */}
                        {activeTab === 'dashboard' ? (
                            <div className="space-y-6">
                                {/* ── [Row 0] Hero & Quick Pulse ── */}
                                <div className="bg-[#2D6A6A] rounded-3xl px-6 md:px-8 py-6 md:py-8 relative overflow-hidden shadow-lg border border-[#2D6A6A] min-h-[220px]">
                                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl opacity-40" />
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl opacity-40" />

                                    <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between h-full">
                                        <div className="min-w-0">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold bg-white/10 text-white/90 mb-2 border border-white/20 uppercase tracking-[0.2em] w-fit">
                                                <Users size={12} className="text-teal-200" />
                                                <span>{myClasses.length} Active Classes</span>
                                            </div>
                                            <h1 className="text-[28px] md:text-[30px] leading-tight font-semibold text-white mb-1 tracking-tight">
                                                Welcome back, {teacherName.replace(/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)\s+/i, '').split(' ')[0]}! <br />
                                                <span className="text-teal-100">Your classroom is ready for learning.</span>
                                            </h1>
                                            <p className="text-white/90 text-sm max-w-2xl leading-relaxed font-semibold">
                                                Jordan Lee just finished Algebra Quiz 1. He might need a nudge.
                                            </p>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-3 flex-nowrap md:self-end">
                                            <button
                                                onClick={() => setShowPracticeGeneratorDrawer(true)}
                                                className="px-4 py-2.5 bg-teal-500 text-white border border-teal-400 rounded-xl font-semibold text-sm shadow-md hover:bg-teal-600 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center gap-2"
                                            >
                                                <Sparkles size={16} />
                                                Generate Practice
                                            </button>
                                            <button
                                                onClick={() => document.getElementById('classes-section')?.scrollIntoView({ behavior: 'smooth' })}
                                                className="px-4 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl font-semibold text-sm hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md inline-flex items-center gap-2"
                                            >
                                                <Users size={16} />
                                                Manage Classes
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Relocated welcome banner (secondary weight) */}
                                {!welcomeDismissed && !isDemo && isVerified && currentUser && (
                                    <DashboardCard variant="canonical" bodyClassName="px-4 py-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-semibold text-slate-800">Welcome to Elora</h3>
                                                <p className="mt-1 text-xs text-slate-600">
                                                    To get the most out of your dashboard, start with one of these quick steps.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleDismissWelcome}
                                                aria-label="Dismiss welcome strip"
                                                className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                                                title="Dismiss welcome"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    </DashboardCard>
                                )}

                                {/* Tier 2: Compact snapshot */}
                                {classHealth && !loading && !insightsLoading && (
                                    <section className="space-y-2">
                                        <DashboardSectionHeader
                                            variant="canonical"
                                            className="mt-10 mb-3"
                                            title="Class health & reports"
                                            subtitle="Needs support and live classroom metrics"
                                        />
                                        <DashboardCard variant="canonical" bodyClassName="p-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <DashboardCard variant="canonical" className="border-l-4 border-l-teal-500" bodyClassName="p-0">
                                                        <div className="p-4 bg-teal-50/20">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Students needing support</p>
                                                                    <div className="mt-2 flex items-center gap-2">
                                                                        <span className="text-[40px] leading-none font-semibold text-teal-700 tabular-nums">
                                                                            {classHealth.studentsNeedingSupport}
                                                                        </span>
                                                                        <div className="flex -space-x-2">
                                                                            {(classHealth.supportInitials ?? []).map((initials) => (
                                                                                <span
                                                                                    key={initials}
                                                                                    className="w-6 h-6 rounded-full border border-white bg-teal-500/10 text-teal-700 text-[10px] font-medium inline-flex items-center justify-center"
                                                                                >
                                                                                    {initials}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                        <span className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
                                                                            Priority
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {classHealth.studentsNeedingSupport === 0 && (
                                                                <p className="mt-3 text-sm text-slate-600">All tracked students are currently on track.</p>
                                                            )}
                                                        </div>
                                                        {classHealth.studentsNeedingSupport > 0 && (
                                                            <button
                                                                onClick={() => handleDrillDown({ statusFilter: 'needs_attention', classFilter: classHealth.className })}
                                                                className="w-full border-t border-teal-100 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50/50 transition-colors"
                                                            >
                                                                View students needing support
                                                            </button>
                                                        )}
                                                    </DashboardCard>

                                                    <DashboardCard variant="canonical" bodyClassName="p-4">
                                                        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Class status</p>
                                                        <div className="mt-2">
                                                            <StatusBadge status={classHealth.status} />
                                                        </div>
                                                        <p className="mt-2 text-sm text-slate-600">{classHealth.className}</p>
                                                    </DashboardCard>

                                                    <DashboardCard variant="canonical" className="sm:col-span-2" bodyClassName="p-4">
                                                        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Top struggle topic</p>
                                                        <p className="mt-2 text-base font-semibold text-slate-900">
                                                            {classHealth.topStruggleTopic ?? 'No major topic risk'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">14 of 32 students scoring below 50%</p>
                                                    </DashboardCard>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <StatCard
                                                        icon={<BookOpen className="text-teal-600" size={20} />}
                                                        label={classesTodayStat?.label ?? 'Classes Today'}
                                                        value={loading ? '…' : classesTodayStat?.value ?? '—'}
                                                        trendValue={classesTodayStat?.trendValue}
                                                        status={classesTodayStat?.status}
                                                    />
                                                    <StatCard
                                                        icon={<Users className="text-teal-600" size={20} />}
                                                        label={studentsStat?.label ?? 'Active Students'}
                                                        value={loading ? '…' : studentsStat?.value ?? '—'}
                                                        trendValue={studentsStat?.trendValue}
                                                        status={studentsStat?.status}
                                                    />
                                                    <StatCard
                                                        icon={<Clock className="text-orange-500" size={20} />}
                                                        label={gradingStat?.label ?? 'Pending Grading'}
                                                        value={loading ? '…' : gradingStat?.value ?? '—'}
                                                        trendValue={gradingStat?.trendValue}
                                                        status={gradingStat?.status}
                                                    />
                                                    <StatCard
                                                        icon={<TrendingUp className="text-teal-600" size={20} />}
                                                        label={avgScoreStat?.label ?? 'Average Score'}
                                                        value={loading ? '…' : avgScoreStat?.value ?? '—'}
                                                        trendValue={avgScoreStat?.trendValue}
                                                        status={avgScoreStat?.status}
                                                    />
                                                </div>
                                            </div>
                                        </DashboardCard>
                                    </section>
                                )}

                                {/* Error banner */}
                                {error && (
                                    <div className="mb-6">
                                        <SectionError
                                            message="We couldn't load your dashboard data. Please try again."
                                            onRetry={() => window.location.reload()}
                                        />
                                    </div>
                                )}

                                {/* Two-column layout (reorganized: time-sensitive left, reference right) */}
                                <div id="reports-section" className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                                    {/* ── Left column (wider): Time-sensitive items ── */}
                                    <div className="xl:col-span-2 flex flex-col gap-6">

                                        {/* Upcoming Assignments */}
                                        <section ref={assignmentsSectionRef}>
                                        <DashboardCard
                                            variant="canonical"
                                            as="section"
                                            className={`scroll-mt-6 ${highlightAssignments ? 'border-teal-400 shadow-md ring-4 ring-teal-50' : ''} transition-all duration-700`}
                                            bodyClassName="p-4"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900 tracking-tight">
                                                    Upcoming {upcomingAssignments.length > 0 && <span className="text-slate-400 font-normal">· {upcomingAssignments.length}</span>}
                                                </h2>
                                                <button className="text-teal-600 hover:text-teal-700 p-1">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </div>

                                            {/* Slim Filter Bar */}
                                            <div className="flex flex-wrap items-center gap-2 mb-6 bg-[#FDFBF5] p-2 rounded-xl border border-[#EAE7DD] text-sm">
                                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Filters:</div>

                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                    className="bg-white border border-[#EAE7DD] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 font-medium text-slate-700"
                                                >
                                                    <option value="all">All Statuses</option>
                                                    <option value="needs_attention">Needs Attention</option>
                                                    <option value="on_track">On Track</option>
                                                    <option value="completed">Completed</option>
                                                </select>

                                                <select
                                                    value={classFilter}
                                                    onChange={(e) => setClassFilter(e.target.value)}
                                                    className="bg-white border border-[#EAE7DD] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 font-medium text-slate-700"
                                                >
                                                    <option value="all">All Classes</option>
                                                    {availableClasses.map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </select>

                                                {(statusFilter !== 'all' || classFilter !== 'all') && (
                                                    <button
                                                        onClick={() => { setStatusFilter('all'); setClassFilter('all'); }}
                                                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 ml-auto px-2 transition-colors"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>

                                            {loading ? (
                                                <SectionSkeleton rows={2} />
                                            ) : upcomingAssignments.length === 0 ? (
                                                <SectionEmpty
                                                    headline="No upcoming assignments"
                                                    detail="Assignments you create will appear here for quick access."
                                                />
                                            ) : filteredAssignments.length === 0 ? (
                                                <SectionEmpty
                                                    headline="No assignments match filters"
                                                    detail="Try clearing your filters to see more."
                                                />
                                            ) : (
                                                <div className="space-y-3">
                                                    {filteredAssignments.map((item) => {
                                                        const statusLower = item.status.toLowerCase();
                                                        const borderColor =
                                                            (['needs attention', 'warning', 'overdue'].includes(statusLower)) ? 'border-l-red-500' :
                                                                (['due tomorrow', 'due soon'].includes(statusLower)) ? 'border-l-orange-500' :
                                                                    'border-l-teal-500';

                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className={`p-3 rounded-xl bg-[#FDFBF5] border border-[#EAE7DD] ${borderColor} border-l-4 cursor-pointer hover:border-teal-300 transition-colors shadow-sm`}
                                                                onClick={() => handleViewAssignment(item.id)}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h3 className="text-sm font-semibold text-slate-900">
                                                                        {item.title}
                                                                    </h3>
                                                                    <StatusBadge status={item.status} />
                                                                </div>
                                                                <p className="text-xs text-slate-600 mb-3">{item.class}</p>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                                        <Clock size={14} /> {item.due}
                                                                    </div>
                                                                    {item.total > 0 && (
                                                                        <div className="font-semibold text-slate-700">
                                                                            {item.submitted}/{item.total}{' '}
                                                                            <span className="text-slate-400 font-normal">
                                                                                submitted
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => {
                                                    navigate(isDemo ? '/teacher/demo/assignments' : '/teacher/assignments');
                                                    setActiveTab('assignments');
                                                }}
                                                className="w-full mt-4 py-2.5 text-sm font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
                                            >
                                                View all assignments
                                            </button>
                                        </DashboardCard>
                                        </section>

                                            {/* Active Practice Widget */}
                                            <DashboardCard variant="canonical" bodyClassName="p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-semibold text-slate-900">
                                                        Active practice
                                                    </h3>
                                                    <Link
                                                        to={isDemo ? '/teacher/demo/practice' : '/teacher/practice'}
                                                        className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                                                    >
                                                        View all →
                                                    </Link>
                                                </div>

                                                {demoClassroomPractices && demoClassroomPractices.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {demoClassroomPractices.slice(0, 2).map((practice) => (
                                                            <div
                                                                key={practice.id}
                                                                className="p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-teal-200 transition-colors cursor-pointer"
                                                                onClick={() => navigate(`${isDemo ? '/teacher/demo/class' : '/teacher/classes'}/${practice.classId}?tab=classwork`)}
                                                            >
                                                                <div className="flex justify-between items-start gap-3 mb-2">
                                                                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                                                                        {practice.title}
                                                                    </h4>
                                                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                                                                        {practice.submittedCount}/{practice.totalCount}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-600 mb-2">
                                                                    {practice.topic}
                                                                </p>
                                                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-teal-500 transition-all"
                                                                        style={{
                                                                            width: `${(practice.submittedCount / practice.totalCount) * 100}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500">No active practice sets. Head to Practice & quizzes to create one.</p>
                                                )}
                                            </DashboardCard>

                                        {/* ── Needs Attention (live data) ── */}
                                        <DashboardCard variant="canonical" bodyClassName="p-4">
                                            <NeedsAttentionCard
                                            insights={insights.slice(0, 5)}
                                            loading={insightsLoading}
                                            error={insightsError}
                                            onInsightClick={(insight) => {
                                                if (insight.assignmentId) {
                                                    handleViewAssignment(insight.assignmentId);
                                                }
                                            }}
                                            onAssignPractice={handleGeneratePractice}
                                            onNudgeStudent={handleNudgeClick}
                                            onDrillDown={handleDrillDown}
                                            generatePracticeLabel="Generate practice →"
                                            onRetry={() => {
                                                setInsightsLoading(true);
                                                setInsightsError(null);
                                                // Force demo data refresh
                                                setTimeout(() => {
                                                    setInsights(demoInsights);
                                                    setInsightsLoading(false);
                                                }, 500);
                                            }}
                                            />
                                        </DashboardCard>

                                    </div>

                                    {/* ── Right column (narrower): Reference items ── */}
                                    <div className="xl:col-span-2 flex flex-col gap-6">

                                        {/* My Classes table */}
                                        <DashboardCard variant="canonical" as="section" className="overflow-hidden" bodyClassName="p-0">
                                            <div className="p-6 border-b border-[#EAEAEA]">
                                                <DashboardSectionHeader
                                                    variant="canonical"
                                                    className="mt-10 mb-3"
                                                    title="My Classes"
                                                    action={
                                                        <div className="flex items-center gap-2 bg-[#FDFBF5] p-1 rounded-lg border border-[#EAE7DD]">
                                                            {['This week', 'This month', 'All time'].map((f) => (
                                                                <button
                                                                    key={f}
                                                                    onClick={() => setFilter(f)}
                                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === f
                                                                        ? 'bg-white text-slate-900 shadow-sm border border-[#EAE7DD]'
                                                                        : 'text-slate-500 hover:text-slate-700'
                                                                        }`}
                                                                >
                                                                    {f}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    }
                                                />
                                            </div>
                                            <div className="overflow-x-auto">
                                                {loading ? (
                                                    <div className="px-6 py-4"><SectionSkeleton rows={3} /></div>
                                                ) : myClasses.length === 0 ? (
                                                    <div className="px-6 py-2">
                                                        <SectionEmpty
                                                            headline="No classes yet"
                                                            detail="Create a class to get started, then share the join code with your students."
                                                        />
                                                    </div>
                                                ) : (
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-[#FDFBF5] border-b border-[#EAEAEA]">
                                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                    Class Name
                                                                </th>
                                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                    Next Topic
                                                                </th>
                                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                    Students
                                                                </th>
                                                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                    Status
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#EAEAEA]">
                                                            {myClasses.map((cls) => (
                                                                <tr
                                                                    key={cls.id}
                                                                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                                                                    onClick={() =>
                                                                        setSelectedItem({
                                                                            name: cls.name,
                                                                            class: `${cls.studentsCount} students`,
                                                                            tag: cls.nextTopic,
                                                                            status: cls.statusMsg,
                                                                        })
                                                                    }
                                                                >
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm font-semibold text-slate-900">
                                                                            {cls.name}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                                            {cls.time}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                                        {cls.nextTopic}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                                        {cls.studentsCount}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <StatusBadge status={cls.status === 'success' ? 'Active' : cls.statusMsg} />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </DashboardCard>

                                        <DashboardCard
                                            variant="canonical"
                                            header={
                                                <div className="px-4 py-3">
                                                    <DashboardSectionHeader
                                                        title="What's new"
                                                        subtitle="Recent updates and product improvements"
                                                        variant="canonical"
                                                        className="mb-2"
                                                        badge={
                                                            <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                                                                Update
                                                            </span>
                                                        }
                                                        action={
                                                            <Link
                                                                to="/our-story"
                                                                className="text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 transition-all"
                                                            >
                                                                View Details
                                                            </Link>
                                                        }
                                                    />
                                                </div>
                                            }
                                            bodyClassName="px-4 py-3"
                                        >
                                            <p className="text-xs text-slate-600 font-medium">
                                                New: A calmer <span className="italic">Our Story</span> page and a smarter parent AI assistant experience.
                                            </p>
                                        </DashboardCard>



                                    </div>
                                </div>



                                {/* Quick Actions (below fold) - Removed per request */}

                                {/* AI Generation Panel (toggled) */}
                            </div>) : activeTab === 'classes' ? (
                                <div id="classes-section" className="flex flex-col gap-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Manage Classes</h2>
                                        <button
                                            onClick={() => setShowCreateClass(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
                                        >
                                            <Plus size={16} /> Create New Class
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {loading ? (
                                            <div className="col-span-full bg-white rounded-2xl border border-[#EAE7DD] p-6">
                                                <SectionSkeleton rows={3} />
                                            </div>
                                        ) : myClasses.length === 0 ? (
                                            <div className="col-span-full py-4 bg-white rounded-2xl border border-[#EAE7DD] border-dashed">
                                                <SectionEmpty
                                                    headline="No classes yet"
                                                    detail='Click "Create New Class" to set up your first class and share the join code with students.'
                                                />
                                            </div>
                                        ) : (
                                            myClasses.map(cls => (
                                                <ClassSummaryCard
                                                    key={cls.id}
                                                    role="teacher"
                                                    name={cls.name}
                                                    subject={cls.subject || 'Subject'}
                                                    themeColor="green" // to use emerald/teal gradient
                                                    progress={cls.progress}
                                                    onEnter={() => handleViewRosterClick(cls.id)}
                                                    metaPrimaryNode={
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2 text-[13px] text-slate-600 font-medium">
                                                                <Users size={16} className="text-teal-600" />
                                                                <span>{cls.studentsCount} Students</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[13px] text-slate-600 font-medium">
                                                                <FileText size={16} className="text-teal-600" />
                                                                <span>{cls.activeAssignments || 0} Active Assignments</span>
                                                            </div>
                                                        </div>
                                                    }
                                                    metaSecondaryNode={
                                                        <div className="flex items-center gap-1.5">
                                                            <span>Code:</span>
                                                            <span className="font-mono bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded tracking-wider">
                                                                {cls.joinCode || '...'}
                                                            </span>
                                                        </div>
                                                    }
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : activeTab === 'assignments' ? (
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div>
                                            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Review All Assignments</h2>
                                            <p className="text-sm text-slate-500 mt-1">Across all classes with submission and score signals.</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigate(`${isDemo ? '/teacher/demo' : '/dashboard/teacher'}#practice`);
                                                setActiveTab('dashboard');
                                                setShowPracticeGeneratorDrawer(true);
                                            }}
                                            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                                        >
                                            <Plus size={15} />
                                            Create Assignment
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,25%)_minmax(0,75%)] gap-6 items-start">
                                        <aside className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:sticky lg:top-6 space-y-6">
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Grading Summary</p>
                                                <div className="space-y-2 rounded-lg border border-[#EAEAEA] bg-slate-50/60 px-4 py-3.5">
                                                    <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-slate-600">
                                                        <span>Needs grading</span>
                                                        <span className="tabular-nums text-base font-bold text-teal-700">3</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-slate-600">
                                                        <span>Active</span>
                                                        <span className="tabular-nums text-base font-bold text-teal-700">5</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-slate-600">
                                                        <span>Overdue</span>
                                                        <span className="tabular-nums text-base font-bold text-teal-700">1</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Filters</p>
                                                <div className="space-y-2 rounded-lg border border-[#EAEAEA] bg-slate-50/40 px-4 py-3.5">
                                                    <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Class</label>
                                                    <select
                                                        value={reviewClassFilter}
                                                        onChange={(event) => setReviewClassFilter(event.target.value)}
                                                        className="w-full bg-white border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm"
                                                    >
                                                        <option value="all">All classes</option>
                                                        {reviewClasses.map((className) => (
                                                            <option key={className} value={className}>{className}</option>
                                                        ))}
                                                    </select>

                                                    <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Status</label>
                                                    <select
                                                        value={reviewStatusFilter}
                                                        onChange={(event) => setReviewStatusFilter(event.target.value)}
                                                        className="w-full bg-white border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm"
                                                    >
                                                        <option value="all">All statuses</option>
                                                        <option value="overdue">Overdue</option>
                                                        <option value="due_soon">Due soon</option>
                                                        <option value="upcoming">Upcoming</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </aside>

                                        <section>
                                            {reviewLoading ? (
                                                <div className="rounded-xl border border-[#EAEAEA] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
                                                    <SectionSkeleton rows={4} />
                                                </div>
                                            ) : filteredReviewItems.length === 0 ? (
                                                <div className="rounded-xl border border-[#EAEAEA] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 text-center">
                                                    <h3 className="text-lg font-semibold tracking-tight text-slate-900">No assignments match these filters</h3>
                                                    <p className="mt-2 text-sm text-slate-500">Try another filter, or create a new assignment to populate this review queue.</p>
                                                    <button
                                                        onClick={() => {
                                                            navigate(`${isDemo ? '/teacher/demo' : '/dashboard/teacher'}#practice`);
                                                            setActiveTab('dashboard');
                                                            setShowPracticeGeneratorDrawer(true);
                                                        }}
                                                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                                                    >
                                                        <Plus size={15} />
                                                        Create Assignment
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {filteredReviewItems.map((item) => {
                                                        const dueDate = new Date(item.dueDate).toLocaleDateString();
                                                        const totalCount = Math.max(item.totalCount || 0, 0);
                                                        const submittedCount = Math.min(Math.max(item.submittedCount || 0, 0), totalCount || 0);
                                                        const submissionPercent = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;
                                                        const normalizedStatus = String(item.status || '').toLowerCase();
                                                        const showOverdue = normalizedStatus === 'overdue';
                                                        const showDueSoon = normalizedStatus === 'due_soon';
                                                        const showCompleted = normalizedStatus === 'completed';
                                                        const hasAttentionSignal = showOverdue || item.needsAttention;

                                                        return (
                                                            <article
                                                                key={`${item.type}-${item.id}`}
                                                                className="rounded-xl border border-[#EAEAEA] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
                                                            >
                                                                <div className="p-4 sm:p-5">
                                                                    <div className="flex items-start justify-end gap-2 mb-3">
                                                                        {showCompleted && (
                                                                            <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                                                                                Completed
                                                                            </span>
                                                                        )}
                                                                        {showDueSoon && (
                                                                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                                                                                Due Soon
                                                                            </span>
                                                                        )}
                                                                        {showOverdue && (
                                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[#FDF2F8] border-[#F5D0E2] text-[#9F1239]">
                                                                                Overdue
                                                                            </span>
                                                                        )}
                                                                        {item.needsAttention && (
                                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[#FDF2F8] border-[#F5D0E2] text-[#9F1239]">
                                                                                Needs Attention
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(220px,1fr)_minmax(150px,0.9fr)] gap-4 md:gap-0 items-stretch">
                                                                        <div className="min-w-0 flex items-start gap-3 h-full md:pr-4 md:mr-4 md:border-r md:border-slate-200/60">
                                                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${showOverdue ? 'bg-rose-50/50' : 'bg-teal-500/10'}`}>
                                                                                <FileText size={18} className="text-teal-700" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">{item.type}</p>
                                                                                <h3 className="mt-1 text-base font-semibold tracking-tight text-slate-900 truncate">{item.title}</h3>
                                                                                <p className="mt-1 text-sm text-slate-500 truncate">{item.className} · {item.topic}</p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="h-full md:pr-4 md:mr-4 md:border-r md:border-slate-200/60">
                                                                            <div className="h-full rounded-lg border border-[#EAEAEA] bg-slate-50/60 p-3 pl-2">
                                                                            <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                                                                                <div>
                                                                                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Submissions</p>
                                                                                    <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums font-mono">{submittedCount}/{totalCount}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Avg Score</p>
                                                                                    <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">{item.averageScore ?? '--'}%</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="mt-3">
                                                                                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                                                                    <div
                                                                                        className={`h-full transition-all ${hasAttentionSignal ? 'bg-[#9F1239]' : 'bg-teal-600'}`}
                                                                                        style={{ width: `${submissionPercent}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Due Date</p>
                                                                            <p className="text-sm font-semibold text-slate-900 tabular-nums">{dueDate}</p>
                                                                            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Status</p>
                                                                            <p className={`text-sm font-semibold tabular-nums ${hasAttentionSignal ? 'text-[#9F1239]' : 'text-slate-900'}`}>
                                                                                {item.statusLabel}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    onClick={() => {
                                                                        if (item.type === 'assignment') {
                                                                            handleViewAssignment(item.id);
                                                                        } else {
                                                                            setSelectedItem({
                                                                                name: item.title,
                                                                                class: item.className,
                                                                                tag: item.topic,
                                                                                status: item.statusLabel,
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="w-full border-t border-[#EAEAEA] px-4 py-2.5 text-sm font-semibold tracking-tight text-slate-600 transition-all duration-200 hover:bg-slate-50/80 hover:text-slate-800 flex items-center justify-center"
                                                                >
                                                                    View details
                                                                </button>
                                                            </article>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </section>
                                    </div>
                                </div>
                            ) : activeTab === 'classroom' ? (
                                <div className="space-y-8">
                                    {loading ? (
                                        <SectionSkeleton rows={3} />
                                    ) : selectedClassroom ? (
                                        <>
                                            <ClassroomBreadcrumb
                                                items={[
                                                    { label: 'Classes', href: isDemo ? '/teacher/demo/classes' : '/teacher/classes' },
                                                    { label: selectedClassroom.name }
                                                ]}
                                            />

                                            <div className="flex flex-col gap-0">
                                                <ClassroomHeader
                                                    currentClass={selectedClassroom}
                                                    classroomTitle={selectedClassroom.name}
                                                    role="teacher"
                                                    subject={selectedClassroom.subject}
                                                    onPrimaryAction={() => handleViewRosterClick(selectedClassroom.id)}
                                                    primaryActionLabel="Class Settings"
                                                    primaryActionIcon={<Settings size={16} />}
                                                />
                                                <ClassroomTabs
                                                    activeTab={classroomActiveTab}
                                                    onTabChange={setClassroomActiveTab}
                                                    subject={selectedClassroom.subject}
                                                    currentClass={selectedClassroom}
                                                    className="-mt-px"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
                                                <aside className="space-y-6 xl:sticky xl:top-6">
                                                    <DashboardCard variant="canonical" className="overflow-hidden" bodyClassName="p-0">
                                                        <div className="border-b border-slate-100 px-4 py-3 flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Workspace</p>
                                                                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Upcoming</h3>
                                                            </div>
                                                            <button
                                                                onClick={() => setClassroomActiveTab('classwork')}
                                                                className="text-sm font-medium text-teal-600 transition-colors hover:text-teal-700"
                                                            >
                                                                View all
                                                            </button>
                                                        </div>
                                                        <div className="p-4 space-y-3">
                                                            {selectedClassroomUpcoming.length > 0 ? (
                                                                selectedClassroomUpcoming.map((assignment) => {
                                                                    const dueText = assignment.due || 'soon';
                                                                    const isOverdue = dueText.toLowerCase().includes('overdue');

                                                                    return (
                                                                        <div
                                                                            key={assignment.id}
                                                                            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 shadow-sm"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div className="min-w-0">
                                                                                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                                                                                        {assignment.status}
                                                                                    </p>
                                                                                    <h4 className="mt-1 truncate text-sm font-semibold tracking-tight text-slate-900">
                                                                                        {assignment.title}
                                                                                    </h4>
                                                                                    <p className={`mt-1 text-sm ${isOverdue ? 'font-semibold text-[#9F1239]' : 'text-slate-600'}`}>
                                                                                        {isOverdue ? dueText : `Due ${dueText}`}
                                                                                    </p>
                                                                                </div>
                                                                                <ChevronRight size={16} className="mt-1 shrink-0 text-slate-400" />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                                                                    <p className="text-sm font-medium text-slate-700">Nothing due yet.</p>
                                                                    <p className="mt-1 text-sm text-slate-500">Create a classwork item to populate this queue.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DashboardCard>
                                                </aside>

                                                <section className="w-full max-w-[800px] xl:justify-self-end rounded-2xl border border-[#EAE7DD] bg-white p-4 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                                    {classroomActiveTab === 'stream' && (
                                                        <StreamLayout
                                                            role="teacher"
                                                            isComposerOpen={classroomComposerOpen}
                                                            setIsComposerOpen={setClassroomComposerOpen}
                                                            isComposerAIMode={classroomComposerAIMode}
                                                            setIsComposerAIMode={setClassroomComposerAIMode}
                                                            composerText={classroomDraft}
                                                            setComposerText={setClassroomDraft}
                                                            teacherAnnouncements={teacherAnnouncements.map((item) => ({
                                                                id: item.id,
                                                                text: item.body,
                                                                timestamp: item.timestamp,
                                                                author: displayName,
                                                            }))}
                                                            setTeacherAnnouncements={(next: any[]) => {
                                                                setTeacherAnnouncements(
                                                                    next.map((item) => ({
                                                                        id: item.id,
                                                                        title: 'Announcement',
                                                                        body: item.text || item.body || '',
                                                                        timestamp: item.timestamp || 'Just now',
                                                                        kind: 'announcement' as const,
                                                                    }))
                                                                );
                                                            }}
                                                            displayName={displayName}
                                                            classroomStreamItems={classroomMockBundle.streamItems}
                                                            onNavigateToWork={() => setClassroomActiveTab('classwork')}
                                                            themeColor="teal"
                                                            subject={selectedClassroom?.subject}
                                                            currentClass={selectedClassroom}
                                                        />
                                                    )}

                                                    {classroomActiveTab === 'classwork' && (
                                                        <AssignmentsPracticeTab
                                                            role="teacher"
                                                            assignments={classroomMockBundle.assignments}
                                                            practices={classroomMockBundle.practices}
                                                        />
                                                    )}

                                                    {classroomActiveTab === 'people' && (
                                                        <PeopleTab role="teacher" currentClass={selectedClassroomWithPeople} />
                                                    )}

                                                    {classroomActiveTab === 'grades' && (
                                                        <GradesTab role="teacher" currentClass={selectedClassroomWithPeople} themeColor="teal" subject={selectedClassroom?.subject} />
                                                    )}
                                                </section>
                                            </div>
                                        </>
                                    ) : (
                                        <SectionEmpty
                                            headline="No classroom selected"
                                            detail="Please select a classroom to view."
                                        />
                                    )}
                                </div>
                            ) : null}
                    </DashboardShell>
                </main>

                {/* ── Detail Modal ── */}
                {selectedItem && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-[#EAE7DD] bg-[#FDFBF5]">
                                <h3 className="text-lg font-semibold text-slate-900">Details</h3>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="mb-4">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                        Name
                                    </div>
                                    <div className="text-base font-medium text-slate-900">
                                        {String(selectedItem.name ?? '')}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                        Class
                                    </div>
                                    <div className="text-base font-medium text-slate-900">
                                        {String(selectedItem.class ?? selectedItem.name ?? '')}
                                    </div>
                                </div>
                                {selectedItem.tag != null && (
                                    <div className="mb-4">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Next Topic
                                        </div>
                                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-medium">
                                            {String(selectedItem.tag)}
                                        </span>
                                    </div>
                                )}
                                {selectedItem.score != null && (
                                    <div className="mb-4">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Average Score
                                        </div>
                                        <div className="text-2xl font-semibold text-teal-600">
                                            {String(selectedItem.score)}%
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 border-t border-[#EAE7DD] bg-slate-50 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors"
                                >
                                    View Full Report
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assign Modal */}
                {showAssignModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-slate-900">Assign Work</h3>
                                <button onClick={() => setShowAssignModal(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Practice / Assignment</label>
                                    {availablePacks.length === 0 && !packToAssign ? (
                                        <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            <p>No practice sessions available yet. Use the <strong>AI Generation Panel</strong> to create one first!</p>
                                        </div>
                                    ) : packToAssign ? (
                                        <div className="text-slate-900 font-medium px-4 py-3 bg-slate-50 border border-[#EAE7DD] rounded-xl flex justify-between items-center">
                                            <span>{packToAssign.title}</span>
                                            <Sparkles size={14} className="text-teal-600" />
                                        </div>
                                    ) : (
                                        <select
                                            required
                                            value={assignPackId}
                                            onChange={(e) => setAssignPackId(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white"
                                        >
                                            <option value="" disabled>-- Select work to assign --</option>
                                            {availablePacks.map(p => (
                                                <option key={p.id} value={p.id}>{p.title} ({p.topic})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Class</label>
                                    <select
                                        required
                                        value={assignClassId}
                                        onChange={(e) => setAssignClassId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white"
                                    >
                                        <option value="" disabled>-- Select a class --</option>
                                        {myClasses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={assignDueDate}
                                        onChange={(e) => setAssignDueDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                                    <textarea
                                        value={assignDescription}
                                        onChange={(e) => setAssignDescription(e.target.value)}
                                        placeholder="Add instructions for your students..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 resize-none bg-white"
                                    />
                                </div>
                                {assigningError && (
                                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                                        {assigningError}
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 mt-2">
                                    <button type="button" onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={assigning} className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 rounded-xl shadow-sm transition-colors">
                                        {assigning ? 'Assigning...' : 'Assign Pack'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Targeted Practice Modal (Milestone 2) */}
                {insightAssignModalOpen && insightToAssign && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setInsightAssignModalOpen(false)} />
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                    <Sparkles className="text-teal-600 w-5 h-5" />
                                    Targeted Practice
                                </h3>
                                <button onClick={() => setInsightAssignModalOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3">
                                <AlertCircle className="shrink-0 text-orange-500 mt-0.5" size={18} />
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Addressing Insight:</h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {insightToAssign.type === 'weak_topic'
                                            ? `${insightToAssign.studentName} is struggling with ${insightToAssign.topicTag}.`
                                            : `${insightToAssign.className} needs review on ${insightToAssign.assignmentTitle || 'recent topics'}.`}
                                    </p>
                                </div>
                            </div>

                            {insightGenerating ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-teal-600 animate-spin mb-3"></div>
                                    <p className="text-slate-600 font-medium">✨ AI is crafting practice questions...</p>
                                    <p className="text-xs text-slate-400 mt-2 italic">(Mocked LLM generation)</p>
                                </div>
                            ) : insightGeneratedPack ? (
                                <form onSubmit={handleInsightAssignSubmit} className="flex flex-col gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Generated Pack</label>
                                        <div className="text-slate-900 font-medium px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl flex justify-between items-center">
                                            <span>{insightGeneratedPack.title}</span>
                                            <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 rounded">5 Qs</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 px-1">
                                            {insightGeneratedPack.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target</label>
                                            <div className="px-4 py-2.5 bg-slate-50 border border-[#EAE7DD] rounded-xl text-sm font-medium text-slate-700">
                                                {insightToAssign.studentName || insightToAssign.className}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
                                            <input
                                                required
                                                type="date"
                                                value={insightDueDate}
                                                onChange={(e) => setInsightDueDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-2.5 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                                            />
                                        </div>
                                    </div>

                                    {insightAssigningError && (
                                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                                            {insightAssigningError}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 mt-2">
                                        <button type="button" onClick={() => setInsightAssignModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={insightAssigning} className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 rounded-xl shadow-sm transition-colors flex items-center gap-2">
                                            <Send size={16} />
                                            {insightAssigning ? 'Sending...' : 'Assign Now'}
                                        </button>
                                    </div>
                                </form>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Nudge Modal */}
                {nudgeModalOpen && nudgeInsight && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setNudgeModalOpen(false)} />
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                    <Send className="text-orange-500 w-5 h-5" />
                                    Send a Nudge
                                </h3>
                                <button onClick={() => setNudgeModalOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3">
                                <AlertCircle className="shrink-0 text-orange-500 mt-0.5" size={18} />
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">To: {nudgeInsight.studentName}</h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {nudgeInsight.type === 'weak_topic'
                                            ? `Identifying that they are struggling with ${nudgeInsight.topicTag}.`
                                            : `Addressing ${nudgeInsight.assignmentTitle || 'recent performance'}.`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your Message</label>
                                    <textarea
                                        autoFocus
                                        value={nudgeText}
                                        onChange={(e) => setNudgeText(e.target.value)}
                                        placeholder={`Hi ${nudgeInsight.studentName.split(' ')[0]}, just a quick nudge to...`}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 resize-none bg-white"
                                    />
                                    <p className="text-xs text-slate-400 mt-2 px-1">
                                        This will appear as a personal message on their dashboard.
                                    </p>
                                </div>

                                {nudgeError && (
                                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                                        {nudgeError}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-2">
                                    <button type="button" onClick={() => setNudgeModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendNudge}
                                        disabled={isSendingNudge || !nudgeText.trim()}
                                        className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-xl shadow-sm transition-colors flex items-center gap-2"
                                    >
                                        {isSendingNudge ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                Send Nudge
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* ── Create Class Modal ── */}
                {showCreateClass && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowCreateClass(false); setCreateClassError(null); }} />
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                    <Plus className="text-teal-600 w-5 h-5" />
                                    Create New Class
                                </h3>
                                <button
                                    onClick={() => { setShowCreateClass(false); setCreateClassError(null); }}
                                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateClass} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Class Name <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        placeholder="e.g. Sec 3 Mathematics"
                                        className="w-full px-4 py-3 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        value={newClassSubject}
                                        onChange={(e) => setNewClassSubject(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-slate-700"
                                    >
                                        <option value="" disabled>-- Select a subject --</option>
                                        <option>Mathematics</option>
                                        <option>Science</option>
                                        <option>English</option>
                                        <option>Physics</option>
                                        <option>Chemistry</option>
                                        <option>Biology</option>
                                        <option>History</option>
                                        <option>Geography</option>
                                        <option>Literature</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Schedule <span className="text-slate-400 font-normal">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={newClassSchedule}
                                        onChange={(e) => setNewClassSchedule(e.target.value)}
                                        placeholder="e.g. Mon & Wed, 2:00 PM"
                                        className="w-full px-4 py-3 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white"
                                    />
                                    <p className="text-xs text-slate-400 mt-1.5 px-1">This will be shown on the class card for quick reference.</p>
                                </div>

                                {createClassError && (
                                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                                        {createClassError}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowCreateClass(false); setCreateClassError(null); }}
                                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingClass}
                                        className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 rounded-xl shadow-sm transition-colors flex items-center gap-2"
                                    >
                                        {creatingClass ? (
                                            <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</>
                                        ) : (
                                            <><Plus size={16} /> Create Class</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Practice Generator Drawer */}
                <PracticeGeneratorDrawer
                    isOpen={showPracticeGeneratorDrawer}
                    initialValues={generatorPrefill}
                    onClose={() => {
                        setShowPracticeGeneratorDrawer(false);
                        setGeneratorPrefill(undefined);
                    }}
                    onReview={(game) => {
                        setReviewGamePack(game);
                        setReviewQuestionIndex(0);
                        setShowPracticeGeneratorDrawer(false);
                        setGeneratorPrefill(undefined);
                    }}
                    onAssign={(game) => {
                        setPackToAssign(game);
                        setShowAssignModal(true);
                        setShowPracticeGeneratorDrawer(false);
                        setGeneratorPrefill(undefined);
                    }}
                />
            </div>
        </div>
    );
}

