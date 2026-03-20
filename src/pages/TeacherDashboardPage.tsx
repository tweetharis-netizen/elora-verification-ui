// src/pages/TeacherDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    Gamepad2,
    Users,
    Settings,
    Bell,
    Search,
    Plus,
    FileText,
    MonitorPlay,
    TrendingUp,
    TrendingDown,
    Clock,
    ChevronRight,
    ChevronLeft,
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
    Inbox,
    RefreshCw,
    Heart,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/dataService';
import { NotificationsPopover, PopoverNotificationItem } from '../components/NotificationsPopover';
import { useNotifications } from '../hooks/useNotifications';
import { getNotificationDefaultDestination } from '../utils/notificationUi';
import { getClassSupportSuggestion, type ClassSuggestion } from '../services/classSuggestionService';
import { RoleQuizGame } from '../components/RoleQuizGame';
import EloraAssistantCard, { EloraAssistantSuggestion } from '../components/EloraAssistantCard';
import { SectionSkeleton, SectionEmpty, SectionError } from '../components/ui/SectionStates';

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
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    collapsed?: boolean;
    className?: string;
}) => (
    <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick?.(); }}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${active
            ? 'bg-teal-800 text-white'
            : 'text-teal-100 hover:bg-teal-800/50 hover:text-white'
            } ${collapsed ? 'justify-center focus:outline-none' : ''} ${className}`}
        title={collapsed ? label : undefined}
    >
        <div className="shrink-0">{icon}</div>
        {!collapsed && <span className="whitespace-nowrap">{label}</span>}

        {/* Active Indicator Circle */}
        {active && !collapsed && (
            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white" />
        )}
    </a>
);

const StatCard = ({
    icon,
    label,
    value,
    trend,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    trend?: 'up' | 'down';
}) => (
    <div className="bg-white p-5 rounded-2xl border border-[#EAE7DD] shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-[#FDFBF5] border border-[#EAE7DD] flex items-center justify-center shrink-0">
                {icon}
            </div>
            {trend && (
                <div
                    className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-teal-600' : 'text-orange-600'
                        }`}
                >
                    {trend === 'up' ? (
                        <TrendingUp size={14} />
                    ) : (
                        <TrendingUp size={14} className="rotate-180" />
                    )}
                    <span>2.4%</span>
                </div>
            )}
        </div>
        <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {label}
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
        </div>
    </div>
);

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
        colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
        if (lower.includes('dropping')) {
            icon = <TrendingDown size={12} className="shrink-0" />;
        }
    } else if (lower.includes('draft') || lower.includes('stable')) {
        colorClass = 'bg-slate-50 text-slate-600 border-slate-200';
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${colorClass}`}
        >
            {icon}
            {status}
        </span>
    );
};

// ── AI Game Generator Panel ────────────────────────────────────────────────────

interface AiForm {
    topic: string;
    level: string;
    questionCount: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
}

const AiGamePanel = ({ onClose, onReview, onAssign }: { onClose: () => void, onReview: (game: dataService.GamePack) => void, onAssign: (game: dataService.GamePack) => void }) => {
    const [aiForm, setAiForm] = useState<AiForm>({
        topic: '',
        level: '',
        questionCount: 5,
        difficulty: 'mixed',
    });
    const [generating, setGenerating] = useState(false);
    const [generatedGame, setGeneratedGame] = useState<dataService.GamePack | null>(null);
    const [generateError, setGenerateError] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        setGenerateError(null);
        setGeneratedGame(null);
        try {
            const pack = await dataService.generateGamePack({
                topic: aiForm.topic,
                level: aiForm.level,
                questionCount: aiForm.questionCount,
                difficulty: aiForm.difficulty,
            });
            setGeneratedGame(pack);
        } catch (err: unknown) {
            setGenerateError(
                err instanceof Error ? err.message : 'Failed to generate game'
            );
        } finally {
            setGenerating(false);
        }
    };

    return (
        <section
            className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-6 mb-8"
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-teal-600" />
                    <h2 className="text-lg font-semibold text-slate-900">AI Game Generator</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Topic
                        </label>
                        <input
                            required
                            type="text"
                            value={aiForm.topic}
                            onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                            placeholder="e.g. Solar System"
                            className="w-full px-3 py-2.5 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Level
                        </label>
                        <input
                            required
                            type="text"
                            value={aiForm.level}
                            onChange={(e) => setAiForm({ ...aiForm, level: e.target.value })}
                            placeholder="e.g. Grade 5 Science"
                            className="w-full px-3 py-2.5 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Number of Questions (1–10)
                        </label>
                        <input
                            required
                            type="number"
                            min="1"
                            max="10"
                            value={aiForm.questionCount}
                            onChange={(e) =>
                                setAiForm({ ...aiForm, questionCount: parseInt(e.target.value) })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-[#EAE7DD] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Difficulty Profile
                        </label>
                        <select
                            value={aiForm.difficulty}
                            onChange={(e) =>
                                setAiForm({
                                    ...aiForm,
                                    difficulty: e.target.value as AiForm['difficulty'],
                                })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-[#EAE7DD] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                        >
                            <option value="mixed">Mixed</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                </div>

                {generateError && (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        {generateError}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={generating}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
                >
                    {generating ? (
                        'Generating…'
                    ) : (
                        <>
                            <Sparkles size={16} /> Generate Game
                        </>
                    )}
                </button>
            </form>

            {/* Results */}
            {generatedGame && (
                <div className="mt-6 pt-6 border-t border-[#EAE7DD]">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 mb-1">
                                {generatedGame.title}
                            </h3>
                            <p className="text-xs text-slate-500">
                                Topic: {generatedGame.topic} &nbsp;·&nbsp; Level: {generatedGame.level}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onReview(generatedGame)}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl font-semibold text-sm transition-colors border border-teal-200 shadow-sm"
                            >
                                <MonitorPlay size={16} /> Review Quiz UI
                            </button>
                            <button
                                onClick={() => onAssign(generatedGame)}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                            >
                                <Plus size={16} /> Assign to Class
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        {generatedGame.questions.map((q, idx) => (
                            <div
                                key={q.id}
                                className="bg-[#FDFBF5] border border-[#EAE7DD] rounded-xl p-4"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                                        {idx + 1}. {q.prompt}
                                    </h4>
                                    <StatusBadge status={q.difficulty} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    {q.options.map((opt, optIdx) => (
                                        <div
                                            key={optIdx}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${optIdx === q.correctIndex
                                                ? 'border-teal-300 bg-teal-50 font-semibold text-teal-800'
                                                : 'border-[#EAE7DD] bg-white text-slate-700'
                                                }`}
                                        >
                                            <div className="w-5 flex justify-center shrink-0">
                                                {optIdx === q.correctIndex ? (
                                                    <Check size={15} className="text-teal-600" />
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400">
                                                        {['A', 'B', 'C', 'D'][optIdx]}
                                                    </span>
                                                )}
                                            </div>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

// ── NeedsAttentionCard ─────────────────────────────────────────────────────────

interface NeedsAttentionCardProps {
    insights: dataService.TeacherInsight[];
    loading: boolean;
    error: string | null;
    onInsightClick: (insight: dataService.TeacherInsight) => void;
    onAssignPractice: (insight: dataService.TeacherInsight) => void;
    onDrillDown?: (filters: { statusFilter?: string, classFilter?: string }) => void;
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
};

const NeedsAttentionCard = ({
    insights,
    loading,
    error,
    onInsightClick,
    onAssignPractice,
    onDrillDown,
}: NeedsAttentionCardProps) => {
    const hasInsights = insights.length > 0;

    return (
        <section className="mb-6 lg:mb-8">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)] shrink-0" />
                <h2 className="text-sm font-semibold tracking-tight text-slate-800">
                    Needs Attention {hasInsights && <span className="text-slate-400 font-normal ml-0.5">· {insights.length}</span>}
                </h2>
            </div>

            {/* Body */}
            <div className="space-y-2.5 relative z-10">
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
                    <div className="bg-white/70 p-3 rounded-xl border border-red-100 text-xs text-red-600">
                        {error}
                    </div>
                ) : !hasInsights ? (
                    // Celebratory empty state
                    <div className="flex flex-col items-center gap-2 py-6 text-center bg-teal-50/30 rounded-2xl border border-teal-100/50 shadow-inner">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-1 shadow-sm border border-teal-100">
                            <CheckCircle2 size={28} className="text-teal-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 tracking-tight">You’re all caught up 🎉</p>
                        <p className="text-xs text-slate-500 max-w-[180px] leading-relaxed">No students need attention right now.</p>
                    </div>
                ) : (
                    insights.map((insight) => {
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
                                className={`flex items-start gap-3 p-3 rounded-xl border ${meta.rowBg} cursor-pointer hover:brightness-95 transition-all`}
                            >
                                {/* Icon badge */}
                                <div
                                    className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${meta.iconBg} ${meta.iconColor}`}
                                >
                                    {meta.icon}
                                </div>

                                {/* Content */}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                        {insight.studentName && (
                                            <span className="text-xs font-bold text-slate-900">
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
                                            <span className="text-xs font-bold text-slate-900 truncate">
                                                {insight.assignmentTitle}
                                            </span>
                                        )}
                                        <span
                                            className={`ml-auto text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${meta.iconBg} ${meta.iconColor}`}
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
                                    {(insight.type === 'weak_topic' || insight.type === 'low_scores') && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAssignPractice(insight); }}
                                            className="mt-2 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md hover:bg-teal-100 transition-colors"
                                        >
                                            Assign Practice
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
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


// ── Main Component ─────────────────────────────────────────────────────────────

export default function TeacherDashboardPage() {
    const navigate = useNavigate();
    const { isVerified, logout, currentUser } = useAuth();
    const displayName = currentUser?.preferredName ?? currentUser?.name ?? 'Teacher';


    // ── Real data state ──
    const [teacherName, setTeacherName] = useState<string>('');
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


    // Ref so the "Ask again" button can call fetchEloraSuggestion defined inside useEffect.
    const fetchEloraSuggestionRef = React.useRef<((data?: dataService.TeacherInsight[]) => Promise<void>) | null>(null);

    // Use the unified notifications hook
    const {
        notifications,
        unreadCount,
        markOneRead: handleMarkBackendNotificationRead,
        markAllRead: handleMarkAllRead
    } = useNotifications({ userId: currentUser?.id || 'teacher_1', role: 'teacher' });

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'classes'>('dashboard');
    const [showCreateClass, setShowCreateClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [createClassError, setCreateClassError] = useState<string | null>(null);
    const [creatingClass, setCreatingClass] = useState(false);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingClass(true);
        setCreateClassError(null);
        try {
            const newClass = await dataService.createTeacherClass(newClassName);
            setMyClasses(prev => [...prev, newClass]);
            setShowCreateClass(false);
            setNewClassName('');
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

    const handleTargetedPracticeClick = async (insight: dataService.TeacherInsight) => {
        setInsightToAssign(insight);
        setInsightAssignModalOpen(true);
        setInsightGenerating(true);
        setInsightGeneratedPack(null);
        setInsightAssigningError(null);
        setInsightDueDate('');

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
        const loadData = async () => {
            try {
                setLoading(true);
                const [s, c, a, t] = await Promise.all([
                    dataService.getTeacherStats(),
                    dataService.getMyClasses(),
                    dataService.getUpcomingAssignments(),
                    dataService.getTeacherProfile(),
                ]);
                setStats(s);
                setMyClasses(c);
                // Map the existing assignment shape → DisplayAssignment shape.
                // The mock layer uses `statusLabel` as the display text for due date
                // (e.g. "DUE TODAY", "DRAFT"). A real backend would supply `dueDate`.
                setUpcomingAssignments(
                    a.map((asgn) => ({
                        id: asgn.id,
                        title: asgn.title,
                        class: asgn.className,
                        due: asgn.dueDate
                            ? new Date(asgn.dueDate).toLocaleDateString()
                            : asgn.statusLabel ?? asgn.status ?? '',
                        status: asgn.statusLabel ?? asgn.status ?? 'Scheduled',
                        // Mock data doesn't carry submitted / total counts yet.
                        submitted: 0,
                        total: 0,
                    }))
                );
                setTeacherName((t as { name?: string })?.name ?? 'Teacher');
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        /** Fetch (or re-fetch) the Ask Elora suggestion. */
        const fetchEloraSuggestion = async (insightData?: dataService.TeacherInsight[]) => {
            setEloraStatus('loading');
            setEloraError(null);
            try {
                // classId and className come from the first class (same demo class used for Class Health).
                // We read them from `myClasses` captured in the closure; if not yet loaded,
                // we use safe fallbacks so the mock always returns something.
                const firstClassId = 'class-1'; // fallback until myClasses resolves
                const firstClassName = 'Math 101'; // fallback
                const suggestion = await getClassSupportSuggestion(
                    firstClassId,
                    firstClassName,
                    insightData ?? insights
                );
                setEloraSuggestion(suggestion);
                setEloraStatus('success');
            } catch (err: unknown) {
                setEloraError(err instanceof Error ? err.message : 'Unknown error');
                setEloraStatus('error');
            }
        };

        // Expose fetchEloraSuggestion for the "Ask again" button.
        // We store it in a ref so the button can call it without re-registering the effect.
        fetchEloraSuggestionRef.current = fetchEloraSuggestion;

        const loadInsights = async () => {
            try {
                setInsightsLoading(true);
                setInsightsError(null);
                const data = await dataService.getTeacherInsights();
                setInsights(data);
                // Kick off the Elora suggestion immediately after insights arrive.
                fetchEloraSuggestion(data);
            } catch (err: unknown) {
                setInsightsError(err instanceof Error ? err.message : 'Failed to load insights');
            } finally {
                setInsightsLoading(false);
            }
        };

        const loadPacks = async () => {
            try {
                const packs = await dataService.getAvailableGamePacks();
                setAvailablePacks(packs);
            } catch (err) {
                console.error("Failed to load available packs", err);
            }
        };

        loadData();
        loadInsights();
        loadPacks();
    }, []);

    // ── Map real class data → performance display shape ──
    const classPerformance: DisplayClass[] = myClasses.map((cls) => ({
        id: cls.id,
        name: cls.name,
        // TeacherClass doesn't carry a score field; default to 0 until backend adds it
        score: 0,
        // nextTopic gives us one topic; weakTopics stays empty until backend supplies it
        weakTopics: cls.nextTopic ? [cls.nextTopic] : [],
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
        const studentsNeedingSupport = new Set(
            classInsights.filter(i => i.studentName).map(i => i.studentName)
        ).size;

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
            topStruggleTopic
        };
    }, [myClasses, insights]);

    // ── Guard: show dev shortcut if auth was bypassed ──
    if (!isVerified) {
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
            <div className="flex min-h-screen bg-[#FDFBF5] font-sans text-slate-900">
                {/* ── Minimal Sidebar for child view ── */}
                <aside className="bg-teal-900 text-teal-50 flex flex-col h-screen sticky top-0 shrink-0 shadow-xl z-20 w-20">
                    <div className="h-20 flex items-center justify-center border-b border-teal-800/50 px-6">
                        <Link to="/" className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-serif italic font-bold text-white shadow-sm shrink-0">
                            E
                        </Link>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col h-screen overflow-hidden">
                    {/* Header */}
                    <header className="h-20 bg-white border-b border-[#EAE7DD] px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
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
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
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
                                    <h2 className="text-xl font-bold text-slate-900 mb-2">
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
                                        <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
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
                                        <h3 className="text-lg font-bold text-slate-900">Student Progress</h3>
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
        <div className="flex min-h-screen bg-[#FDFBF5] font-sans text-slate-900">
            {/* ── Sidebar ── */}
            <aside
                className={`bg-teal-900 text-teal-50 flex flex-col h-screen sticky top-0 shrink-0 shadow-xl z-20 transition-[width] duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'
                    }`}
            >
                {/* Logo & Close toggle */}
                <div className={`h-20 flex items-center border-b border-teal-800/50 px-6 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    <Link to="/" className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-serif italic font-bold text-white shadow-sm shrink-0">
                            E
                        </div>
                        {isSidebarOpen && <span className="text-xl font-bold tracking-wide text-white whitespace-nowrap">Elora</span>}
                    </Link>
                    {isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="text-teal-100/50 hover:text-white transition-colors"
                            title="Close sidebar"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!isSidebarOpen} />
                    <NavItem icon={<BookOpen size={20} />} label="Classes" active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} collapsed={!isSidebarOpen} />
                    <NavItem
                        icon={<Gamepad2 size={20} />}
                        label="GamePacks"
                        onClick={() => setShowAiPanel(true)}
                        collapsed={!isSidebarOpen}
                    />
                    <NavItem icon={<Users size={20} />} label="Students" collapsed={!isSidebarOpen} />
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-teal-800/50 space-y-1.5">
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="flex items-center justify-center w-full p-2.5 text-teal-100/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
                            title="Open sidebar"
                        >
                            <PanelLeftOpen size={20} />
                        </button>
                    )}
                    <NavItem icon={<Settings size={20} />} label="Settings" collapsed={!isSidebarOpen} />
                    <button
                        onClick={logout}
                        className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-teal-100 hover:bg-teal-800/50 hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
                        title={!isSidebarOpen ? "Sign out" : undefined}
                    >
                        <LogOut size={20} className="shrink-0" />
                        {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 lg:p-8">

                    {/* Top Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between py-4 px-0 border-b border-[#EAE7DD] mb-6 gap-4">
                        <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                Teacher Dashboard
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                {loading ? 'Loading…' : `Good day, ${displayName}`}
                            </h1>
                            <p className="text-[13px] text-slate-500 font-medium mt-1">You are signed in as Teacher</p>
                        </div>
                        <div className="flex items-center gap-4 lg:gap-6">
                            <div className="relative hidden md:block">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={16}
                                />
                                <input
                                    type="text"
                                    placeholder="Search classes…"
                                    className="pl-9 pr-4 py-2 bg-white border border-[#EAE7DD] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 w-56 shadow-sm transition-all"
                                />
                            </div>
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
                            <div className="flex items-center gap-3 pl-4 lg:pl-6 border-l border-[#EAE7DD]">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-semibold text-slate-900">
                                        {teacherName || 'Teacher'}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">Teacher</div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold border border-teal-200 shadow-sm">
                                    {initials}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* ── Active View Content ── */}
                    {activeTab === 'dashboard' ? (
                        <>

                            {/* "What's New" Strip */}
                            <div className="mb-6 p-3.2 px-4 bg-white/5 border border-[#EAE7DD] rounded-xl flex items-center gap-3">
                                <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-wider">What's new</span>
                                <span className="text-[13px] text-slate-600 font-medium italic">
                                    AI-powered grouping for Classroom Health is now live! See at-risk clusters instantly.
                                </span>
                            </div>

                            {/* Class Health Strip */}
                            {classHealth && !loading && !insightsLoading && (
                                <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:px-5 sm:py-4 bg-white border border-[#EAE7DD] rounded-2xl shadow-sm">
                                    <div className="flex flex-col flex-1 gap-1 sm:flex-row sm:items-center">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[14px] font-medium text-slate-900">
                                                {classHealth.className} <span className="text-slate-500 font-normal px-0.5">– Overall:</span>
                                            </span>
                                            <div className={`px-2.5 py-1 rounded-full text-[12px] font-medium border ${classHealth.status === 'At risk'
                                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                    : classHealth.status === 'Improving'
                                                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                                }`}>
                                                {classHealth.status}
                                            </div>
                                        </div>

                                        <div className="text-[13px] text-slate-500 leading-relaxed sm:ml-2">
                                            <span className="hidden sm:inline mr-2">·</span>
                                            {classHealth.studentsNeedingSupport > 0 ? (
                                                <>
                                                    <button
                                                        onClick={() => handleDrillDown({ statusFilter: 'needs_attention', classFilter: classHealth.className })}
                                                        className="font-medium text-orange-600 hover:text-orange-700 hover:underline transition-all"
                                                    >
                                                        {classHealth.studentsNeedingSupport} student{classHealth.studentsNeedingSupport !== 1 ? 's' : ''} need support
                                                    </button>
                                                    {classHealth.topStruggleTopic && (
                                                        <span> in <span className="font-medium text-slate-700">{classHealth.topStruggleTopic}</span>.</span>
                                                    )}
                                                </>
                                            ) : (
                                                <span>Great job! Everyone is on track.</span>
                                            )}
                                            {classHealth.status === 'Improving' && (
                                                <span className="inline ml-2 text-teal-600 font-medium">· Trending up this week</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
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

                            {/* Stats Strip (prioritized above-the-fold) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                                <StatCard
                                    icon={<BookOpen className="text-teal-600" size={20} />}
                                    label={classesTodayStat?.label ?? 'Classes Today'}
                                    value={loading ? '…' : classesTodayStat?.value ?? '—'}
                                />
                                <StatCard
                                    icon={<Users className="text-teal-600" size={20} />}
                                    label={studentsStat?.label ?? 'Active Students'}
                                    value={loading ? '…' : studentsStat?.value ?? '—'}
                                />
                                <StatCard
                                    icon={<Clock className="text-orange-500" size={20} />}
                                    label={gradingStat?.label ?? 'Pending Grading'}
                                    value={loading ? '…' : gradingStat?.value ?? '—'}
                                />
                                <StatCard
                                    icon={<TrendingUp className="text-teal-600" size={20} />}
                                    label={avgScoreStat?.label ?? 'Average Score'}
                                    value={loading ? '…' : avgScoreStat?.value ?? '—'}
                                    trend="up"
                                />
                            </div>

                            {/* Two-column layout (reorganized: time-sensitive left, reference right) */}
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">

                                {/* ── Left column (wider): Time-sensitive items ── */}
                                <div className="xl:col-span-2 flex flex-col gap-8">

                                    {/* Upcoming Assignments */}
                                    <section
                                        ref={assignmentsSectionRef}
                                        className={`scroll-mt-6 bg-white rounded-2xl border ${highlightAssignments ? 'border-teal-400 shadow-md ring-4 ring-teal-50' : 'border-[#EAE7DD] shadow-sm'} p-5 lg:p-6 transition-all duration-700`}
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
                                            <div className="space-y-4">
                                                {filteredAssignments.map((item) => {
                                                    const statusLower = item.status.toLowerCase();
                                                    const borderColor = 
                                                        (['needs attention', 'warning', 'overdue'].includes(statusLower)) ? 'border-l-red-500' :
                                                        (['due tomorrow', 'due soon'].includes(statusLower)) ? 'border-l-orange-500' :
                                                        'border-l-teal-500';
                                                    
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className={`p-4 rounded-xl bg-[#FDFBF5] border border-[#EAE7DD] ${borderColor} border-l-4 cursor-pointer hover:border-teal-300 transition-colors shadow-sm`}
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

                                        <button className="w-full mt-4 py-2.5 text-sm font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors">
                                            View all assignments
                                        </button>
                                    </section>

                                    {/* ── Needs Attention (live data) ── */}
                                    <NeedsAttentionCard
                                        insights={insights.slice(0, 5)}
                                        loading={insightsLoading}
                                        error={insightsError}
                                        onInsightClick={(insight) => {
                                            if (insight.assignmentId) {
                                                handleViewAssignment(insight.assignmentId);
                                            }
                                        }}
                                        onAssignPractice={handleTargetedPracticeClick}
                                        onDrillDown={handleDrillDown}
                                    />

                                </div>

                                 {/* ── Right column (narrower): Reference items ── */}
                                 <div className="xl:col-span-2 flex flex-col gap-8">
 
                                     {!loading && (
                                         <EloraAssistantCard
                                             role="teacher"
                                             assistantName={currentUser?.assistantName}
                                             title="Get a classroom-ready action plan"
                                             description="Elora suggests targeted teaching moves based on your class health and insight data."
                                             suggestedPrompts={[
                                                 'How can I support students struggling with fractions?',
                                                 'Suggest a quick formative check-in activity',
                                                 'What reinforcement should I give today?'
                                             ]}
                                             accentClasses={{
                                                 chipBg: 'bg-teal-50',
                                                 buttonBg: 'bg-teal-600',
                                                 iconBg: 'bg-teal-50',
                                                 text: 'text-teal-700',
                                             }}
                                             status={eloraStatus}
                                             suggestion={eloraSuggestion ? {
                                                 kind: eloraSuggestion.kind,
                                                 title: eloraSuggestion.title,
                                                 body: eloraSuggestion.body,
                                                 suggestedTargets: eloraSuggestion.suggestedTargets,
                                             } : null}
                                             error={eloraError}
                                             onRefresh={() => fetchEloraSuggestionRef.current?.()}
                                         />
                                     )}
 
                                     {/* My Classes table */}
                                    <section className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm overflow-hidden">
                                        <div className="p-5 lg:p-6 border-b border-[#EAE7DD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900 tracking-tight">
                                                My Classes
                                            </h2>
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
                                                        <tr className="bg-[#FDFBF5] border-b border-[#EAE7DD]">
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
                                                    <tbody className="divide-y divide-[#EAE7DD]">
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
                                    </section>

                                    {/* Student Performance Overview */}
                                    <section className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-5 lg:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900 tracking-tight">
                                                Student Performance Overview
                                            </h2>
                                            <div className="flex gap-2">
                                                {['Classes', 'Students', 'GamePacks'].map((tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setPerfTab(tab)}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${perfTab === tab
                                                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                                            : 'bg-white text-slate-500 border border-[#EAE7DD] hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {loading ? (
                                            <SectionSkeleton rows={3} />
                                        ) : classPerformance.length === 0 ? (
                                            <SectionEmpty
                                                headline="No class data yet"
                                                detail="Once students complete assignments, their performance will appear here."
                                            />
                                        ) : (
                                            <div className="space-y-4">
                                                {classPerformance.map((cls) => (
                                                    <div
                                                        key={cls.id}
                                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#EAE7DD] hover:border-teal-200 transition-colors cursor-pointer"
                                                        onClick={() =>
                                                            setSelectedItem({
                                                                name: cls.name,
                                                                class: cls.name,
                                                                score: cls.score > 0 ? cls.score : undefined,
                                                            })
                                                        }
                                                    >
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-900 mb-1">
                                                                {cls.name}
                                                            </div>
                                                            {cls.weakTopics.length > 0 && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-slate-500">
                                                                        Next topic:
                                                                    </span>
                                                                    {cls.weakTopics.map((topic) => (
                                                                        <span
                                                                            key={topic}
                                                                            className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[11px] font-medium border border-orange-100"
                                                                        >
                                                                            {topic}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-3 sm:mt-0 flex items-center gap-4">
                                                            <ChevronRight size={20} className="text-slate-400" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>


                                </div>
                            </div>



                            {/* Quick Actions (below fold) */}
                            <div className="flex flex-wrap gap-3 mb-8">
                                <button
                                    onClick={() => setShowAiPanel(!showAiPanel)}
                                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
                                >
                                    <Sparkles size={16} /> Create AI GamePack
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#EAE7DD] rounded-xl font-medium text-sm transition-colors shadow-sm">
                                    <Plus size={16} /> Create Assignment
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#EAE7DD] rounded-xl font-medium text-sm transition-colors shadow-sm">
                                    <FileText size={16} /> Assign Quiz
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#EAE7DD] rounded-xl font-medium text-sm transition-colors shadow-sm">
                                    <MonitorPlay size={16} /> View Class
                                </button>
                            </div>

                            {/* AI Game Panel (toggled) */}
                            {showAiPanel && (
                                <AiGamePanel
                                    onClose={() => setShowAiPanel(false)}
                                    onReview={(pack) => {
                                        setReviewGamePack(pack);
                                        setReviewQuestionIndex(0);
                                    }}
                                    onAssign={handleAssignClick}
                                />
                            )}
                        </>) : activeTab === 'classes' ? (
                            <div className="flex flex-col gap-6">
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
                                            <div key={cls.id} className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-5 flex flex-col gap-4 hover:border-teal-200 transition-colors">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="min-w-0">
                                                        <h3 className="text-lg font-semibold text-slate-900 truncate">{cls.name}</h3>
                                                        <p className="text-sm text-slate-500 mt-1">{cls.studentsCount} Students Enrolled</p>
                                                    </div>
                                                    <div className="flex items-start gap-2 shrink-0">
                                                        {(!cls.activeAssignments || cls.activeAssignments === 0) ? (
                                                            <span className="hidden sm:inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold border border-slate-200 whitespace-nowrap mt-1">
                                                                No active assignments
                                                            </span>
                                                        ) : (
                                                            <span className="hidden sm:inline-flex px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-semibold border border-teal-200 whitespace-nowrap mt-1">
                                                                {cls.activeAssignments} active assignment{cls.activeAssignments !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                                                            <Users size={20} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mt-1">
                                                    <div className="bg-[#FDFBF5] p-3 rounded-xl border border-[#EAE7DD]">
                                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                                            Active Assign.
                                                        </div>
                                                        <div className="font-semibold text-slate-800">
                                                            {cls.activeAssignments}
                                                        </div>
                                                    </div>
                                                    <div className="bg-[#FDFBF5] p-3 rounded-xl border border-[#EAE7DD] flex flex-col justify-center">
                                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                                            Avg Score
                                                        </div>
                                                        <div className="flex items-center">
                                                            {cls.averageScore === null ? (
                                                                <span className="text-slate-500 italic text-xs leading-tight">
                                                                    Assign a Pack to begin tracking
                                                                </span>
                                                            ) : (
                                                                <span className={`px-2 py-0.5 rounded-md text-sm font-bold border ${cls.averageScore >= 80 ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                                                    cls.averageScore >= 50 ? 'bg-slate-50 text-slate-800 border-slate-200' :
                                                                        'bg-orange-50 text-orange-700 border-orange-200'
                                                                    }`}>
                                                                    {cls.averageScore}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-auto">
                                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Join Code</div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-lg font-mono font-bold text-slate-800 tracking-widest">{cls.joinCode || 'N/A'}</span>
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(cls.joinCode || '')}
                                                            className="text-teal-600 hover:text-teal-700 text-xs font-semibold"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button className="flex-1 py-2 bg-[#FDFBF5] hover:bg-teal-50 text-teal-700 border border-[#EAE7DD] hover:border-teal-200 rounded-xl text-sm font-semibold transition-colors">
                                                        View Roster
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAssignToClassClick(cls.id);
                                                        }}
                                                        className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors"
                                                    >
                                                        Assign Work
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : null}
                </div>
            </main>

            {/* ── Detail Modal ── */}
            {selectedItem && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                                    <div className="text-2xl font-bold text-teal-600">
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Assign Work</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAssignSubmit} className="flex flex-col gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">GamePack / Assignment</label>
                                {availablePacks.length === 0 && !packToAssign ? (
                                    <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <p>No GamePacks available yet. Use the <strong>AI Game Panel</strong> to generate one first!</p>
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setInsightAssignModalOpen(false)} />
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
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
                                        <span className="text-xs font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded">5 Qs</span>
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
        </div>
    );
}
