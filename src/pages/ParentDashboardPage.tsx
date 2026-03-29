// src/pages/ParentDashboardPage.tsx
import React, { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    BarChart2,
    FileText,
    MessageSquare,
    Settings,
    Bell,
    TrendingUp,
    TrendingDown,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Lightbulb,
    Send,
    X,
    Search,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut,
    Award,
    BookOpen,
    Gamepad2,
    UserCircle2,
    Inbox,
    RefreshCw,
    Heart,
    Sparkles,
    Menu,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { useAuth } from '../auth/AuthContext';
import { getDemoGamePack, getGamePackById, GamePack, getParentChildren, getParentChildSummary, ParentChildSummary, sendParentNudge, getNotifications, markNotificationRead, markAllNotificationsRead, Notification } from '../services/dataService';
import { RoleQuizGame } from '../components/RoleQuizGame';
import { NotificationsPopover, PopoverNotificationItem } from '../components/NotificationsPopover';
import { useNotifications } from '../hooks/useNotifications';
import { getNotificationDefaultDestination } from '../utils/notificationUi';
import { EloraLogo } from '../components/EloraLogo';
import { DashboardHeader } from '../components/DashboardHeader';
import { Link } from 'react-router-dom';
import { SectionSkeleton, SectionEmpty, SectionError } from '../components/ui/SectionStates';
import { DashboardTour } from '../components/DashboardTour';
import { useDemoMode } from '../hooks/useDemoMode';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import { getRoleSidebarTheme, type RoleSidebarTheme } from '../lib/roleTheme';
import {
    demoChildren,
    demoChildSummary
} from '../demo/demoParentScenarioA';
import { ClassSummaryCard } from '../components/ClassSummaryCard';

// ─── BRAND CONSTANTS ──────────────────────────────────────────────────────────
const BRAND = '#DB844A';

const SIDEBAR_ITEMS = [
    { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
    { icon: Sparkles, label: 'Copilot', id: 'copilot' },
    { icon: Users, label: 'Children', id: 'children' },
    { icon: BarChart2, label: 'Progress & Reports', id: 'progress' },
    { icon: FileText, label: 'Assignments & Quizzes', id: 'assignments' },
    { icon: MessageSquare, label: 'Messages', id: 'messages' },
];

// ─── SHARED STATE HELPERS & UTILITIES ─────────────────────────────────────────

/**
 * Maps icon names (from API) to actual icon components.
 * Used when converting ParentChildSummary.stats[].iconName to JSX.
 */
const iconNameMap: Record<string, any> = {
    FileText,
    Gamepad2,
    TrendingUp,
    CheckCircle2,
};

// Shared state display components are now imported from src/components/ui/SectionStates.tsx

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function SidebarItem({
    icon: Icon,
    label,
    active,
    collapsed,
    onClick,
    className = "",
    theme,
}: {
    icon: any;
    label: string;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
    className?: string;
    key?: string | number;
    theme: RoleSidebarTheme;
}) {
    const activeClasses = `${theme.navActiveBg} ${theme.navActiveText}`;
    const inactiveClasses = `${theme.navInactiveText} ${theme.navHoverBg} ${theme.navHoverText}`;
    return (
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick?.(); }}
            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? activeClasses : inactiveClasses} ${collapsed ? 'justify-center focus:outline-none' : ''} ${className}`}
            title={collapsed ? label : undefined}
        >
            <div className="shrink-0">
                <Icon size={20} />
            </div>
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}

            {/* Active Indicator Circle */}
            {active && !collapsed && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white" />
            )}
        </a>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    trend,
}: {
    icon: any;
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    key?: string | number;
}) {
    return (
        <div className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-5 lg:p-6 flex items-start gap-4">
            <div className="p-3 rounded-lg shrink-0" style={{ backgroundColor: `${BRAND}18`, color: BRAND }}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-500">{label}</p>
                <div className="flex items-end gap-2 mt-1">
                    <p className="text-2xl font-semibold text-slate-900">{value}</p>
                    {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />}
                    {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mb-1" />}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'On track': 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        'Due soon': 'bg-orange-50 text-orange-700 border-orange-200/60',
        'In Progress': 'bg-orange-50 text-orange-700 border-orange-200/60',
        'Overdue': 'bg-red-50 text-red-700 border-red-200/60',
        'Needs Attention': 'bg-red-50 text-red-700 border-red-200/60',
    };
    return (
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap ${styles[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {status}
        </span>
    );
}


function ProgressSection({
    subjectScores,
    weakTopics,
    perfTab,
    onTabChange,
    isLoading,
    isError,
    onRetry,
    childName = "student",
    lastUpdated
}: {
    subjectScores: { name: string; score: number }[];
    weakTopics: string[];
    perfTab: string;
    onTabChange: (tab: string) => void;
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    childName?: string;
    lastUpdated?: string | null;
}) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900">Progress & Reports</h2>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Live data {lastUpdated && `• Last updated ${lastUpdated}`}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {['Subjects', 'Topics', 'Practice & quizzes'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`px-3 py-1 text-[13px] font-medium rounded-full border transition-colors ${perfTab === tab
                                ? 'text-white border-transparent'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            style={perfTab === tab ? { backgroundColor: BRAND, borderColor: BRAND } : {}}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-5 lg:p-6 min-h-[300px] flex flex-col justify-center">
                {isLoading ? (
                    <SectionSkeleton rows={5} />
                ) : isError ? (
                    <SectionError
                        message={`We couldn't load ${childName}'s latest progress data. Please try again.`}
                        onRetry={onRetry}
                    />
                ) : subjectScores.length === 0 ? (
                    <SectionEmpty
                        headline="No progress data yet"
                        detail={`${childName}'s progress will appear here once they complete their first assessment.`}
                    />
                ) : (
                    <>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectScores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 13, fill: '#64748B' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 13, fill: '#64748B' }}
                                        domain={[0, 100]}
                                        ticks={[0, 25, 50, 75, 100]}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F1F5F9' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                        {subjectScores.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.score >= 75 ? '#10B981' : entry.score >= 60 ? '#F59E0B' : '#EF4444'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <h3 className="text-[14px] font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                Topics needing more practice
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {weakTopics.length > 0 ? (
                                    weakTopics.map((topic, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200/60 rounded-md text-[13px] font-medium">
                                            {topic}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[13px] text-slate-500 italic">No weak topics identified yet – {childName} is doing great!</span>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

function ActivityList({
    activities,
    filter,
    onFilterChange,
    onActivityClick,
    isLoading,
    isError,
    onRetry,
    childName = "student"
}: {
    activities: Array<{
        id: string;
        title: string;
        subject: string;
        tag: string;
        type: string;
        score?: string;
        date: string;
        status: string;
    }>;
    filter: string;
    onFilterChange: (f: string) => void;
    onActivityClick?: (activity: any) => void;
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    childName?: string;
}) {
    const filtered = filter === 'All' ? activities : activities.filter((a) => a.type === filter);

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900">Recent activity & practice</h2>
                <div className="flex items-center bg-slate-100 p-1 rounded-lg overflow-x-auto">
                    {['All', 'Practice', 'Assignment'].map((f) => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors whitespace-nowrap ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm overflow-hidden min-h-[200px] flex flex-col justify-center">
                {isLoading ? (
                    <div className="p-6"><SectionSkeleton rows={4} /></div>
                ) : isError ? (
                    <div className="p-6">
                        <SectionError
                            message={`We couldn't load ${childName}'s activity list.`}
                            onRetry={onRetry}
                        />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-6">
                        <SectionEmpty
                            headline={filter === 'All' ? "No activity yet" : `No recent ${filter}s`}
                            detail={filter === 'All'
                                ? `Recent activity for ${childName} will appear here once they start their learning sessions.`
                                : `No ${filter.toLowerCase()}s were found for ${childName} in the recent period.`}
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onActivityClick?.(item)}>
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md">
                                                {item.type}
                                            </span>
                                            <span
                                                className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-md border"
                                                style={{ backgroundColor: `${BRAND}12`, color: BRAND, borderColor: `${BRAND}30` }}
                                            >
                                                {item.tag}
                                            </span>
                                        </div>
                                        <h3 className="text-[14px] font-semibold text-slate-900 leading-tight">{item.title}</h3>
                                        <p className="text-[13px] text-slate-500 mt-0.5">{item.subject}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {item.date}
                                            </div>
                                            {item.score && (
                                                <div className="flex items-center gap-1.5 text-[12px] font-medium"
                                                    style={{ color: parseInt(item.score) >= 75 ? '#10B981' : parseInt(item.score) >= 60 ? '#F59E0B' : '#EF4444' }}>
                                                    <Award className="w-3.5 h-3.5" />
                                                    Score: {item.score}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function UpcomingList({
    items,
    onViewAll,
    isLoading,
    isError,
    onRetry,
    childName = "student"
}: {
    items: Array<{
        id: string;
        title: string;
        subject: string;
        dueDate: string;
        status: string;
    }>;
    onViewAll?: () => void;
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    childName?: string;
}) {
    const iconMap = {
        'On track': <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        'Due soon': <Clock className="w-4 h-4 text-orange-500" />,
        'Overdue': <AlertCircle className="w-4 h-4 text-red-500" />,
    };

    return (
        <section>
            <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900 mb-4">
                Upcoming Assignments & Quizzes
            </h2>
            <div className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm overflow-hidden min-h-[200px] flex flex-col justify-center">
                {isLoading ? (
                    <div className="p-6"><SectionSkeleton rows={3} /></div>
                ) : isError ? (
                    <div className="p-6">
                        <SectionError
                            message={`We couldn't load ${childName}'s upcoming tasks.`}
                            onRetry={onRetry}
                        />
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-8">
                        <SectionEmpty
                            headline="No upcoming assignments"
                            detail={`Any assignments or tasks created for ${childName} will show up here.`}
                        />
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-100">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start gap-3">
                                        <div>
                                            <h3 className="text-[14px] font-semibold text-slate-900 leading-tight">{item.title}</h3>
                                            <p className="text-[13px] text-slate-500 mt-1">{item.subject}</p>
                                            <div className="flex items-center gap-1.5 mt-2.5">
                                                {(iconMap as any)[item.status]}
                                                <span className="text-[12px] font-medium text-slate-600">{item.dueDate}</span>
                                            </div>
                                        </div>
                                        <StatusBadge status={item.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                            <button
                                onClick={() => onViewAll?.()}
                                className="text-[13px] font-medium transition-colors hover:opacity-80"
                                style={{ color: BRAND }}
                            >
                                View all tasks
                            </button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

function MessageFeed({
    messages,
    tips,
    activeTab,
    onTabChange,
    isLoading,
    isError,
    onRetry,
    childName = "student"
}: {
    messages: Array<{
        id: string;
        from: string;
        subject: string;
        body: string;
        time: string;
        unread: boolean;
    }>;
    tips: Array<{
        id: string;
        title: string;
        body: string;
    }>;
    activeTab: string;
    onTabChange: (tab: string) => void;
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    childName?: string;
}) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900">Messages & Tips</h2>
                <div className="flex items-center gap-2">
                    {['Messages', 'Tips'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`px-3 py-1 text-[13px] font-medium rounded-full border transition-colors ${activeTab === tab ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            style={activeTab === tab ? { backgroundColor: BRAND } : {}}
                        >
                            {tab}
                            {tab === 'Messages' && messages.some((m) => m.unread) && (
                                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                    {messages.filter((m) => m.unread).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm min-h-[250px] flex flex-col justify-center overflow-hidden">
                {isLoading ? (
                    <div className="p-6"><SectionSkeleton rows={4} /></div>
                ) : isError ? (
                    <div className="p-6">
                        <SectionError
                            message={`We couldn't load ${childName}'s messages.`}
                            onRetry={onRetry}
                        />
                    </div>
                ) : (
                    <>
                        {activeTab === 'Messages' ? (
                            <>
                                <div className="divide-y divide-slate-100 flex-1">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                                            <div className="flex items-start justify-between gap-3 mb-1">
                                                <div className="flex items-center gap-2">
                                                    {msg.unread && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: BRAND }} />}
                                                    <span className="text-[13px] font-semibold text-slate-900">{msg.from}</span>
                                                </div>
                                                <span className="text-[11px] text-slate-400 whitespace-nowrap">{msg.time}</span>
                                            </div>
                                            <p className="text-[12px] font-medium text-slate-600 mb-1">{msg.subject}</p>
                                            <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-2">{msg.body}</p>
                                        </div>
                                    ))}
                                    {messages.length === 0 && (
                                        <div className="p-8">
                                            <SectionEmpty
                                                headline="No messages yet"
                                                detail={`Any messages or feedback for ${childName} from their teachers will appear here.`}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                                    <button className="text-[13px] font-medium transition-colors hover:opacity-80" style={{ color: BRAND }}>
                                        View all messages
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="p-5 lg:p-6 relative overflow-hidden">
                                {tips.length > 0 ? (
                                    <div className="relative z-10 space-y-4">
                                        {tips.map((tip) => (
                                            <div key={tip.id} className="flex items-start gap-3">
                                                <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm" style={{ color: BRAND }}>
                                                    <Lightbulb className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[14px] font-semibold text-slate-900">{tip.title}</h4>
                                                    <p className="text-[13px] text-slate-700 mt-1 leading-relaxed">{tip.body}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <SectionEmpty
                                        headline="No tips for today"
                                        detail="Check back later for personalized insights on how to support your child's learning."
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ParentDashboardPage() {
    const navigate = useNavigate();
    const isDemo = useDemoMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activePage, setActivePage] = useState('overview');
    const sidebarTheme = getRoleSidebarTheme('parent');

    // ── Welcome strip state (persisted via localStorage) ──
    const WELCOME_KEY = 'elora_parent_welcome_dismissed';
    const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(
        () => localStorage.getItem(WELCOME_KEY) === 'true'
    );
    const handleDismissWelcome = () => {
        setWelcomeDismissed(true);
        localStorage.setItem(WELCOME_KEY, 'true');
    };
    const [activeChildId, setActiveChildId] = useState<string | null>(null);
    const [perfTab, setPerfTab] = useState('Subjects');

    type AskEloraStatus = 'idle' | 'loading' | 'success' | 'error';
    const [eloraStatus, setEloraStatus] = useState<AskEloraStatus>('success');
    const [eloraSuggestion, setEloraSuggestion] = useState({
        kind: 'parent_message' as const,
        title: 'Encourage focus with a short daily check-in',
        body: "Try letting your child know they did a great job today and offer one small goal for tomorrow.",
        suggestedTargets: ['Math concept practice'],
    });
    const [eloraError, setEloraError] = useState<string | null>(null);
    const [activityFilter, setActivityFilter] = useState('All');
    const [msgTab, setMsgTab] = useState('Messages');
    const [nudgeOpen, setNudgeOpen] = useState(false);
    const [nudgeText, setNudgeText] = useState('');
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const { currentUser, login, logout } = useAuth();
    const parentId = currentUser?.role === 'parent' ? currentUser.id : 'parent_1';

    // Ensure demo user is "logged in" for backend headers (but don't persist to localStorage)
    React.useEffect(() => {
        if (isDemo && currentUser?.id !== 'parent_1' && typeof login === 'function') {
            login('parent', undefined, false);
        }
    }, [isDemo, currentUser, login]);

    const {
        notifications: parentNotifications,
        unreadCount: notificationsUnreadCount,
        markAllRead: handleMarkAllRead,
        markOneRead: handleMarkOneRead
    } = useNotifications({ userId: parentId, role: 'parent' });

    const handleNotificationClick = async (item: PopoverNotificationItem) => {
        if (!item.original) return;

        // Mark as read in backend
        await handleMarkOneRead(item.original.id);

        // Use the centralized UI helper for default destination mapping.
        const dest = getNotificationDefaultDestination(item.original);
        setActivePage(dest);
    };

    // Format for the popover
    const popoverNotifications: PopoverNotificationItem[] = parentNotifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        type: n.type,
        isRead: n.isRead,
        original: n
    }));

    const [reviewGamePack, setReviewGamePack] = useState<GamePack | null>(null);
    const [reviewActivity, setReviewActivity] = useState<any>(null);
    const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0);

    const [childrenList, setChildrenList] = useState<{ id: string; name: string; level: string }[]>([]);
    const [summaryData, setSummaryData] = useState<ParentChildSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSendingNudge, setIsSendingNudge] = useState(false);

    const loadChildren = React.useCallback(() => {
        console.log('[ParentDashboard] Calling loadChildren...');
        setIsLoading(true);
        setLoadError(null);

        if (isDemo) {
            const mapped = demoChildren.map((c: any, i: number) => ({
                id: c.id,
                name: c.name,
                level: (c as any).level || (i === 0 ? 'Sec 3 Express' : 'Sec 2NA'),
            }));
            setChildrenList(mapped);
            if (mapped.length > 0) {
                setActiveChildId(mapped[0].id);
            }
            setIsLoading(false);
            return;
        }

        getParentChildren().then(list => {
            console.log('[ParentDashboard] Children received:', list.length);
            const mapped = list.map((c, i) => ({
                id: c.id,
                name: c.name,
                level: (c as any).level || (i === 0 ? 'Sec 3 Express' : 'Sec 2NA'),
            }));
            setChildrenList(mapped);
            if (mapped.length > 0) {
                console.log('[ParentDashboard] Auto-selecting child:', mapped[0].id);
                setActiveChildId(mapped[0].id);
            } else {
                setIsLoading(false);
            }
        }).catch(err => {
            console.error('[ParentDashboard] Error loading children:', err);
            setLoadError('Could not load children. Please try again.');
            setIsLoading(false);
        });
    }, [isDemo]);

    // 1. ADD MOUNT EFFECT
    React.useEffect(() => {
        loadChildren();
    }, [loadChildren]);

    const handleRetry = () => {
        if (activeChildId) {
            setIsLoading(true);
            setLoadError(null);
            getParentChildSummary(activeChildId).then(data => {
                setSummaryData(data);
            }).catch(() => {
                setLoadError(`We couldn't load ${activeChild?.name}'s latest data. Please try again.`);
            }).finally(() => setIsLoading(false));
        } else {
            setIsLoading(true);
            loadChildren();
        }
    };

    React.useEffect(() => {
        if (!activeChildId) return;
        console.log('[ParentDashboard] Fetching summary for child:', activeChildId);
        setIsLoading(true);
        setLoadError(null);

        if (isDemo) {
            setSummaryData(demoChildSummary);
            setLastUpdated('Just now');
            setIsLoading(false);
            return;
        }

        getParentChildSummary(activeChildId).then(data => {
            console.log('[ParentDashboard] Summary received for:', activeChildId);
            setSummaryData(data);
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }).catch(err => {
            console.error('[ParentDashboard] Error loading summary:', err);
            setLoadError('Could not load data for this student. Please try again.');
        }).finally(() => setIsLoading(false));
    }, [activeChildId, isDemo]);

    // Debug logging for the "Human"
    console.log('[ParentDashboard] Render state:', {
        isLoading,
        loadError: !!loadError,
        activeChildId,
        childrenCount: childrenList.length,
        hasSummary: !!summaryData
    });

    const activeChild = childrenList.find((c) => c.id === activeChildId) || null;

    // ── Map API data to UI view model ──────────────────────────────────────
    // Convert stats with iconName strings to components
    const stats = (summaryData?.stats || []).map((s: any) => ({
        ...s,
        icon: iconNameMap[s.iconName] || FileText
    }));

    const upcoming = summaryData?.upcoming || [];
    const recentActivity = summaryData?.recentActivity || [];
    const weakTopics = summaryData?.weakTopics || [];
    const subjectScores = (summaryData?.subjectScores && summaryData.subjectScores.length > 0)
        ? summaryData.subjectScores
        : [];

    // Mock data for messages & tips that varies by child
    const messages = React.useMemo(() => {
        if (!activeChildId) return [];
        return [
            {
                id: 'msg-1',
                from: 'Ms. Sarah Lee',
                subject: 'Great progress in Science!',
                body: `I wanted to let you know that ${activeChild?.name || 'your child'} did exceptionally well in today's Science practical. Their understanding of basic circuits is very strong.`,
                time: '2h ago',
                unread: true
            },
            {
                id: 'msg-2',
                from: 'Mr. David Tan',
                subject: 'Math homework reminder',
                body: `Just a friendly reminder that the algebra assignment is due this Friday. ${activeChild?.name || 'your child'} has started but hasn't submitted yet.`,
                time: 'Yesterday',
                unread: false
            }
        ];
    }, [activeChildId, activeChild?.name]);

    const tips = React.useMemo(() => {
        if (!activeChildId) return [];
        return [
            {
                id: 'tip-1',
                title: 'Building consistency',
                body: `Try to set a fixed 20-minute slot for ${activeChild?.name || 'your child'} to review weak topics like '${weakTopics.slice(0, 1) || 'Algebra'}' after dinner.`
            },
            {
                id: 'tip-2',
                title: 'Encouragement goes a long way',
                body: "Celebrate small wins! A positive remark about their effort in tough subjects can boost their confidence significantly."
            }
        ];
    }, [activeChildId, activeChild?.name, weakTopics]);

    const parentName = isDemo ? 'Mr. Lee' : (currentUser?.preferredName ?? currentUser?.name ?? 'Parent');
    const parentInitials = parentName
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');

    const handleActivityClick = async (activity: any) => {
        if (activity.type === 'quiz' && activity.status === 'at_risk') {
            try {
                // Fetch demo pack to show in review mode
                const pack = await getGamePackById('algebra-basics');
                setReviewGamePack(pack);
                setReviewActivity(activity);
                setReviewQuestionIndex(0);
            } catch (error) {
                console.error("Failed to load game pack for review", error);
            }
        }
    };

    const [showNudgeSuccess, setShowNudgeSuccess] = useState(false);

    const handleSendNudge = async () => {
        if (!activeChildId || !nudgeText.trim()) return;
        setIsSendingNudge(true);
        try {
            await sendParentNudge(activeChildId, nudgeText.trim());
            setNudgeOpen(false);
            setNudgeText('');
            if (isDemo) {
                setShowNudgeSuccess(true);
                setTimeout(() => setShowNudgeSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Failed to send nudge", error);
            alert("Failed to send nudge. Please try again.");
        } finally {
            setIsSendingNudge(false);
        }
    };

    if (reviewGamePack && reviewActivity) {
        const question = reviewGamePack.questions[reviewQuestionIndex];
        const scoreMatch = reviewActivity.score ? parseInt(reviewActivity.score) : 0;
        const totalQuestions = reviewGamePack.questions.length;
        const score = Math.round((scoreMatch / 100) * totalQuestions);

        return (
            <RoleQuizGame
                role="parent"
                mode="review"
                gameTitle={reviewActivity.title}
                topicLabel={reviewGamePack.topic}
                totalQuestions={totalQuestions}
                currentQuestionIndex={reviewQuestionIndex}
                score={score}
                maxScore={totalQuestions}
                livesLeft={3}
                question={{
                    text: question.prompt,
                    choices: question.options,
                    // Mocking selectedIndex to be the correct one if they mostly got it right
                    selectedIndex: question.correctIndex,
                    correctIndex: question.correctIndex,
                    explanation: question.explanation || 'Good job! This is the explanation.'
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
                    setReviewActivity(null);
                }}
            />
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#FDFBF5] font-sans text-slate-900 overflow-x-hidden">
            {isDemo && (
                <>
                    <DemoBanner />
                    <DemoRoleSwitcher />
                </>
            )}

            <div className="flex flex-1">
                {/* MOBILE BACKDROP */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] md:hidden transition-all duration-500 animate-in fade-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
                <aside
                    id="parent-sidebar"
                    className={`fixed inset-y-0 left-0 z-[70] flex flex-col transition-all duration-500 ease-in-out 
                        ${isSidebarOpen ? 'w-64' : 'w-20'} 
                        ${sidebarTheme.asideBg} shadow-2xl shadow-slate-900/20
                        md:sticky md:top-0 md:min-h-screen md:translate-x-0 
                        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                        ${sidebarTheme.text}
                    `}
                >
                    {/* Logo + Header area */}
                    <div className={`h-24 flex items-center border-b ${sidebarTheme.headerBorder} px-8 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                        <Link to="/" className="flex items-center text-white/90 hover:text-white transition-colors overflow-hidden">
                            <EloraLogo className="w-10 h-10 text-current drop-shadow-sm transition-transform hover:scale-105" withWordmark={isSidebarOpen} />
                        </Link>

                        {/* Mobile close toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="Close menu"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar custom-scrollbar">
                        {SIDEBAR_ITEMS.map((item) => (
                            <SidebarItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                active={activePage === item.id}
                                collapsed={!isSidebarOpen}
                                onClick={() => {
                                    if (item.id === 'copilot') {
                                        navigate(isDemo ? '/parent/copilot/demo' : '/parent/copilot');
                                    } else {
                                        setActivePage(item.id);
                                    }
                                }}
                                theme={sidebarTheme}
                            />
                        ))}
                    </nav>

                    {/* Footer / System menu */}
                    <div className={`p-6 border-t ${sidebarTheme.footerBorder} space-y-2`}>
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex items-center justify-center w-full p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all group mb-2"
                                title="Expand sidebar"
                            >
                                <PanelLeftOpen size={22} className="group-hover:scale-110 transition-transform" />
                            </button>
                        )}

                        <SidebarItem icon={Settings} label="Settings" collapsed={!isSidebarOpen} theme={sidebarTheme} />
                        <button
                            onClick={logout}
                            className={`flex w-full items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all group ${!isSidebarOpen ? 'justify-center' : ''}`}
                            title={!isSidebarOpen ? "Sign out" : undefined}
                        >
                            <LogOut size={22} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
                            {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
                        </button>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <DashboardHeader
                        role="parent"
                        displayName={parentName}
                        roleLabel="PARENT"
                        avatarInitials={parentInitials}
                        onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
                        searchPlaceholder="Search kids' progress..."
                        notificationsNode={
                            <NotificationsPopover
                                items={popoverNotifications}
                                unreadCount={notificationsUnreadCount}
                                onMarkAllRead={handleMarkAllRead}
                                onNotificationClick={handleNotificationClick}
                                badgeColor="bg-orange-500"
                                unreadDotColor="bg-orange-500"
                                unreadBgColor="bg-orange-50/20"
                                headerTextColor="text-orange-600"
                            />
                        }
                    />
                    <div className="flex-1 overflow-y-auto p-6 lg:p-8">

                        <div className="max-w-7xl mx-auto space-y-8">

                            {activePage === 'overview' && (
                                <div className="bg-[#DB844A] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg border border-[#DB844A] flex flex-col justify-center min-h-[220px]">
                                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl opacity-40" />
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl opacity-40" />

                                    <div className="relative z-10 flex flex-col h-full text-white">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white/90 mb-4 border border-white/20 uppercase tracking-[0.2em] w-fit">
                                            <Heart size={12} className="text-orange-200" />
                                            <span>Tracking {childrenList.length} children</span>
                                        </div>
                                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 leading-tight tracking-tight">
                                            Hi, {parentName.split(' ')[0]}! <br />
                                            <span className="text-orange-100">See what {activeChild?.name} is learning today.</span>
                                        </h1>
                                        <p className="text-white/80 text-sm max-w-xl leading-relaxed font-medium">
                                            {activeChild?.name} is currently working on {activeChild?.level}. Stay engaged with real-time updates and supportive nudges.
                                        </p>

                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <button
                                                onClick={() => setNudgeOpen(true)}
                                                className="px-5 py-2 bg-white text-[#DB844A] rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Send size={16} />
                                                Send a Nudge
                                            </button>
                                            <button
                                                onClick={() => setActivePage('progress')}
                                                className="px-5 py-2 bg-white/10 text-white border border-white/20 rounded-xl font-bold text-sm hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md flex items-center gap-2"
                                            >
                                                <BookOpen size={16} />
                                                View Reports
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activePage !== 'overview' && (
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div>
                                        <h1 className="text-[24px] lg:text-[26px] font-semibold text-slate-900 tracking-tight">
                                            {activePage === 'progress' && 'Progress & Reports'}
                                            {activePage === 'assignments' && 'Assignments & Quizzes'}
                                            {activePage === 'messages' && 'Messages & Tips'}
                                            {activePage === 'children' && 'My Children'}
                                        </h1>
                                        {activeChild && (
                                            <p className="text-[15px] text-slate-500 mt-1">
                                                Viewing{' '}
                                                <span className="font-medium" style={{ color: BRAND }}>
                                                    {activeChild.name}
                                                </span>{' '}
                                                – {activeChild.level}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            onClick={() => setNudgeOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-[14px] font-medium transition-colors shadow-sm hover:opacity-90"
                                            style={{ backgroundColor: BRAND }}
                                        >
                                            <Send className="w-4 h-4" />
                                            Send a Nudge
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── DATA VIEW ── */}
                            {isLoading && !activeChild ? (
                                <div className="space-y-6">
                                    <SectionSkeleton rows={3} />
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <SectionSkeleton rows={5} />
                                        <SectionSkeleton rows={5} />
                                    </div>
                                </div>
                            ) : loadError && !activeChild ? (
                                <div className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-12 text-center">
                                    <SectionError
                                        message="We encountered an issue loading your family data. Please try again."
                                        onRetry={handleRetry}
                                    />
                                </div>
                            ) : !activeChild ? (
                                <div className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-12 text-center">
                                    <SectionEmpty
                                        headline="No children found"
                                        detail="It looks like there are no students linked to this parent account. Please contact support if this is an error."
                                    />
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Loading Overlay (Optional, but user wanted sections to handle it) */}
                                    {/* We now pass isLoading and loadError to sections individually */}
                                    <>

                                        {/* ── OVERVIEW ──────────────────────────────────────────────── */}
                                        {activePage === 'overview' && (
                                            <>
                                                <DashboardTour
                                                    role="parent"
                                                    isVisible={!welcomeDismissed}
                                                    onAction1={() => setActivePage('copilot')}
                                                    onAction2={() => setActivePage('progress')}
                                                    onDismiss={handleDismissWelcome}
                                                />
                                                {/* TODAY AT A GLANCE – SUMMARY TILES */}
                                                <div>
                                                    <h2 className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                                        Today at a glance – {activeChild?.name}
                                                    </h2>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {isLoading ? (
                                                            Array.from({ length: 4 }).map((_, i) => (
                                                                <div key={i} className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-5 flex items-center gap-4 animate-pulse">
                                                                    <div className="w-10 h-10 bg-slate-100 rounded-lg shrink-0" />
                                                                    <div className="flex-1 space-y-2">
                                                                        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                                                                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : loadError ? (
                                                            <div className="col-span-full">
                                                                <SectionError
                                                                    message={`We couldn't load ${activeChild?.name}'s stats.`}
                                                                    onRetry={handleRetry}
                                                                />
                                                            </div>
                                                        ) : (
                                                            stats.map((stat, i) => (
                                                                <SummaryCard
                                                                    key={i}
                                                                    icon={stat.icon}
                                                                    label={stat.label}
                                                                    value={stat.value}
                                                                    trend={stat.trend}
                                                                />
                                                            ))
                                                        )}
                                                    </div>
                                                </div>

                                                {/* TWO-COLUMN LAYOUT */}
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                                                    <div className="lg:col-span-2 space-y-6">
                                                        <ProgressSection
                                                            subjectScores={subjectScores}
                                                            weakTopics={weakTopics}
                                                            perfTab={perfTab}
                                                            onTabChange={setPerfTab}
                                                            isLoading={isLoading}
                                                            isError={!!loadError}
                                                            onRetry={handleRetry}
                                                            childName={activeChild?.name}
                                                            lastUpdated={lastUpdated}
                                                        />
                                                        <ActivityList
                                                            activities={recentActivity}
                                                            filter={activityFilter}
                                                            onFilterChange={setActivityFilter}
                                                            onActivityClick={handleActivityClick}
                                                            isLoading={isLoading}
                                                            isError={!!loadError}
                                                            onRetry={handleRetry}
                                                            childName={activeChild?.name}
                                                        />
                                                    </div>
                                                    <div className="space-y-6 lg:mt-8">
                                                        <UpcomingList
                                                            items={upcoming}
                                                            onViewAll={() => setActivePage('assignments')}
                                                            isLoading={isLoading}
                                                            isError={!!loadError}
                                                            onRetry={handleRetry}
                                                            childName={activeChild?.name}
                                                        />
                                                        <MessageFeed
                                                            messages={messages}
                                                            tips={tips}
                                                            activeTab={msgTab}
                                                            onTabChange={setMsgTab}
                                                            isLoading={isLoading}
                                                            isError={!!loadError}
                                                            onRetry={handleRetry}
                                                            childName={activeChild?.name}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* ── PROGRESS & REPORTS ────────────────────────────────────── */}
                                        {activePage === 'progress' && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {isLoading ? (
                                                        Array.from({ length: 3 }).map((_, i) => (
                                                            <div key={i} className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-6 flex items-center gap-4 animate-pulse">
                                                                <div className="w-10 h-10 bg-slate-100 rounded-lg shrink-0" />
                                                                <div className="flex-1 space-y-2">
                                                                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                                                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : loadError ? (
                                                        <div className="col-span-full">
                                                            <SectionError message={`We couldn't load ${activeChild?.name}'s status cards.`} onRetry={handleRetry} />
                                                        </div>
                                                    ) : (
                                                        stats.map((stat, i) => (
                                                            <SummaryCard key={i} icon={stat.icon} label={stat.label} value={stat.value} trend={stat.trend} />
                                                        ))
                                                    )}
                                                </div>
                                                <ProgressSection
                                                    subjectScores={subjectScores}
                                                    weakTopics={weakTopics}
                                                    perfTab={perfTab}
                                                    onTabChange={setPerfTab}
                                                    isLoading={isLoading}
                                                    isError={!!loadError}
                                                    onRetry={handleRetry}
                                                    childName={activeChild?.name}
                                                    lastUpdated={lastUpdated}
                                                />
                                                {!isLoading && !loadError && (
                                                    weakTopics.length > 0 ? (
                                                        <div className="flex flex-col gap-2.5 p-4 sm:px-5 sm:py-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                                            <div className="flex items-center">
                                                                <span className="px-2.5 py-1 rounded-full text-[12px] font-medium border bg-orange-50 text-orange-700 border-orange-200">
                                                                    Needs practice
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[14px] font-medium text-slate-900">
                                                                    {weakTopics.join(', ')}
                                                                </span>
                                                                <span className="text-[13px] text-slate-500 leading-relaxed">
                                                                    {activeChild?.name} could use a bit more support here.
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2.5 p-4 sm:px-5 sm:py-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                                            <div className="flex items-center">
                                                                <span className="px-2.5 py-1 rounded-full text-[12px] font-medium border bg-teal-50 text-teal-700 border-teal-200">
                                                                    On track
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[14px] font-medium text-slate-900">
                                                                    Looking great overall
                                                                </span>
                                                                <span className="text-[13px] text-slate-500 leading-relaxed">
                                                                    Everyone is on track in the current topics.
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* ── ASSIGNMENTS & QUIZZES ─────────────────────────────────── */}
                                        {activePage === 'assignments' && (
                                            <div className="space-y-6">
                                                <UpcomingList
                                                    items={upcoming}
                                                    onViewAll={() => setActivePage('assignments')}
                                                    isLoading={isLoading}
                                                    isError={!!loadError}
                                                    onRetry={handleRetry}
                                                    childName={activeChild?.name}
                                                />
                                                <ActivityList
                                                    activities={recentActivity}
                                                    filter={activityFilter}
                                                    onFilterChange={setActivityFilter}
                                                    onActivityClick={handleActivityClick}
                                                    isLoading={isLoading}
                                                    isError={!!loadError}
                                                    onRetry={handleRetry}
                                                    childName={activeChild?.name}
                                                />
                                            </div>
                                        )}

                                        {/* ── MESSAGES & TIPS ───────────────────────────────────────── */}
                                        {activePage === 'messages' && (
                                            <div className="max-w-2xl">
                                                <MessageFeed
                                                    messages={messages}
                                                    tips={tips}
                                                    activeTab={msgTab}
                                                    onTabChange={setMsgTab}
                                                    isLoading={isLoading}
                                                    isError={!!loadError}
                                                    onRetry={handleRetry}
                                                    childName={activeChild?.name}
                                                />
                                            </div>
                                        )}

                                        {/* ── CHILDREN ──────────────────────────────────────────────── */}
                                        {activePage === 'children' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {childrenList.map(child => (
                                                    <ClassSummaryCard
                                                        key={child.id}
                                                        role="parent"
                                                        name={child.name}
                                                        subject={child.level}
                                                        themeColor={activeChildId === child.id ? 'orange' : undefined}
                                                        onEnter={() => {
                                                            setActiveChildId(child.id);
                                                            setActivePage('overview');
                                                        }}
                                                        metaPrimaryNode={
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                    <span className="text-[12px] font-medium text-slate-600">Active in Math Classroom</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                                                                    <Clock size={14} />
                                                                    <span>Last active 2h ago</span>
                                                                </div>
                                                            </div>
                                                        }
                                                        metaSecondaryNode={
                                                            activeChildId === child.id ? (
                                                                <span className="text-orange-600 font-bold uppercase tracking-widest text-[9px] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                                                    Selected
                                                                </span>
                                                            ) : undefined
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Bottom padding */}
                                        <div className="h-8" />

                                    </>
                                </div>
                            )}

                        </div>
                    </div>
                </main>

                {/* ── SEND A NUDGE MODAL ──────────────────────────────────────────── */}
                {nudgeOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className="px-2 py-0.5 text-[11px] font-semibold rounded-md"
                                            style={{ backgroundColor: `${BRAND}15`, color: BRAND }}
                                        >
                                            {activeChild?.name} – {activeChild?.level}
                                        </span>
                                    </div>
                                    <h2 className="text-[20px] font-semibold text-slate-900">Send a Nudge</h2>
                                    <p className="text-[13px] text-slate-500 mt-1">Encourage {activeChild?.name || 'your child'} to get back on track.</p>
                                </div>
                                <button
                                    onClick={() => setNudgeOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        `Keep it up, ${activeChild?.name || 'buddy'}! 💪`,
                                        'Time to practice! ⏰',
                                        `Don't forget your assignment! 📝`,
                                    ].map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => setNudgeText(preset)}
                                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-[13px] font-medium text-slate-700 rounded-lg hover:border-slate-300 transition-colors"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={nudgeText}
                                    onChange={(e) => setNudgeText(e.target.value)}
                                    rows={3}
                                    placeholder={`Write a custom message to ${activeChild?.name || 'your child'}…`}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[14px] text-slate-700 focus:outline-none resize-none placeholder:text-slate-400 focus:ring-2"
                                    style={{ '--tw-ring-color': `${BRAND}40` } as any}
                                />
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setNudgeOpen(false)}
                                    className="px-4 py-2 text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                    disabled={isSendingNudge}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendNudge}
                                    disabled={!nudgeText.trim() || isSendingNudge}
                                    className="px-5 py-2 text-white rounded-lg text-[14px] font-medium transition-colors shadow-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                                    style={{ backgroundColor: BRAND }}
                                >
                                    <Send className="w-4 h-4" />
                                    {isSendingNudge ? 'Sending...' : 'Send Nudge'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
