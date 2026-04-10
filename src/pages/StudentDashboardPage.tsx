import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    MessageSquare,
    Calendar,
    Settings,
    LogOut,
    ChevronRight,
    Bell,
    Search,
    ChevronUp,
    ChevronDown,
    Zap,
    Clock,
    CheckCircle2,
    Trophy,
    ListTodo,
    Star,
    RotateCcw,
    Activity,
    TrendingUp,
    Target,
    Shield,
    ExternalLink,
    Play,
    Book,
    Sparkles,
    Gamepad2,
    FileText,
    BarChart2,
    AlertCircle,
    X,
    Lightbulb,
    PanelLeftClose,
    PanelLeftOpen,
    Heart,
    Inbox,
    MessageCircle,
    Menu,
    Flame,
    CalendarDays,
    Users,
    Plus
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import MotivationBanner from '../components/MotivationBanner';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/dataService';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ClassSummaryCard } from '../components/ClassSummaryCard';
import { getStudentSuggestion, StudentSuggestion } from '../services/studentSuggestionService';
import { NotificationsPopover, PopoverNotificationItem } from '../components/NotificationsPopover';
import { useNotifications } from '../hooks/useNotifications';
import { getNotificationDefaultDestination } from '../utils/notificationUi';
import { EloraLogo } from '../components/EloraLogo';
import { DashboardHeader } from '../components/DashboardHeader';
import { SectionSkeleton, SectionEmpty, SectionError } from '../components/ui/SectionStates';
import { DashboardTour } from '../components/DashboardTour';
import { useDemoMode } from '../hooks/useDemoMode';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import { getRoleSidebarTheme, type RoleSidebarTheme } from '../lib/roleTheme';
import { useSidebarState } from '../hooks/useSidebarState';
import { useAuthGate } from '../hooks/useAuthGate';
import {
    demoStudentData,
    demoStudentStreak,
    demoGameSessions,
    demoStudentNudges,
    demoStudentClasses
} from '../demo/demoStudentScenarioA';



interface SidebarItemProps {
    icon: any;
    label: string;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
    className?: string;
    theme: RoleSidebarTheme;
}

// Shared empty-state helper is now imported from src/components/ui/SectionStates.tsx

// --- COMPONENTS ---

// ── NextStepsStrip ─────────────────────────────────────────────────────────────

interface Rec {
    id: string;
    icon: 'retry' | 'start' | 'improve';
    label: string;
    detail: string;
    href: string;
}

function NextStepsStrip({ recs, onNavigate }: { recs: Rec[]; onNavigate: (href: string) => void }) {
    const iconMap: Record<Rec['icon'], React.ReactNode> = {
        retry: <RotateCcw className="w-5 h-5" />,
        start: <Play className="w-5 h-5" />,
        improve: <Zap className="w-5 h-5" />,
    };
    const colourMap: Record<Rec['icon'], string> = {
        retry: 'bg-orange-50 border-orange-200 text-orange-700',
        start: 'bg-violet-50 border-violet-200 text-violet-700',
        improve: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    };
    const iconBgMap: Record<Rec['icon'], string> = {
        retry: 'bg-orange-100 text-orange-600',
        start: 'bg-violet-100 text-violet-600',
        improve: 'bg-emerald-100 text-emerald-600',
    };

    return (
        <section aria-label="Next Steps">
            <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#68507B]" />
                <h2 className="text-sm font-semibold tracking-tight text-slate-800">Today in your learning</h2>
                <span className="text-[12px] text-slate-400 font-normal ml-1">— personalised for you</span>
            </div>
            {recs.length === 0 ? (
                <div className="bg-[#F7F5F0] border border-slate-200 rounded-xl px-5 py-4 text-[14px] text-slate-500 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    Complete your first game to see smart recommendations here.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recs.map(rec => (
                        <button
                            key={rec.id}
                            onClick={() => onNavigate(rec.href)}
                            className={`group flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${colourMap[rec.icon]}`}
                        >
                            <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${iconBgMap[rec.icon]}`}>
                                {iconMap[rec.icon]}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[14px] font-semibold leading-snug line-clamp-2">{rec.label}</p>
                                <p className="text-[12px] mt-1 opacity-80 line-clamp-2 leading-relaxed">{rec.detail}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 shrink-0 self-center ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}

function SidebarItem({ icon: Icon, label, active, collapsed, onClick, className = '', theme }: SidebarItemProps) {
    const activeClasses = `${theme.navActiveBg} ${theme.navActiveText}`;
    const inactiveClasses = `${theme.navInactiveText} ${theme.navHoverBg} ${theme.navHoverText}`;
    return (
        <a
            href="#"
            onClick={(e) => {
                if (onClick) {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? activeClasses : inactiveClasses} ${collapsed ? 'justify-center focus:outline-none' : ''} ${className}`}
            title={collapsed ? label : undefined}
        >
            <div className="shrink-0 transition-transform group-hover:scale-110">
                <Icon size={20} />
            </div>
            {!collapsed && <span className="whitespace-nowrap tracking-tight">{label}</span>}

            {/* Elora Gold Vertical Accent Bar */}
            {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-accent-yellow rounded-r-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            )}
        </a>
    );
}


export default function StudentDashboardPage({
    activeTab: initialTab = 'dashboard',
    embeddedInShell = false,
    isDemo: isDemoProp,
}: {
    activeTab?: 'dashboard' | 'assignments' | 'classes';
    embeddedInShell?: boolean;
    isDemo?: boolean;
} = {}) {
    const { currentUser, logout, login } = useAuth();
    const navigate = useNavigate();
    const { hash } = useLocation();
    const { isGateOpen, closeGate, gateActionName, withGate } = useAuthGate();
    const routeIsDemo = useDemoMode();
    const isDemo = isDemoProp ?? routeIsDemo;

    // Ensure demo user is "logged in" for backend headers (but don't persist to localStorage)
    React.useEffect(() => {
        if (isDemo && currentUser?.id !== 'student_1' && typeof login === 'function') {
            login('student', undefined, false);
        }
    }, [isDemo, currentUser, login]);

    const [gamePackFilter, setGamePackFilter] = useState('All');

    const [selectedGamePack, setSelectedGamePack] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const sidebarTheme = getRoleSidebarTheme('student');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'assignments' | 'classes'>(initialTab);
    const [activeClassFilter, setActiveClassFilter] = useState<string | null>(null);
    const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<'all' | 'overdue' | 'in_progress' | 'not_started' | 'completed'>('all');

    // Synchronize activeTab state and handle hash deep-linking (e.g. from Copilot navigation)
    useEffect(() => {
        if (initialTab !== activeTab) {
            setActiveTab(initialTab);
        }

        // Handle deep-linking hashes
        if (hash === '#practice') {
            setActiveTab('dashboard');
            setTimeout(() => {
                document.getElementById('practice-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        } else if (hash === '#reports') {
            setActiveTab('dashboard');
            setTimeout(() => {
                document.getElementById('reports-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }, [initialTab, hash]);

    // ── Welcome strip state (persisted via localStorage) ──
    const WELCOME_KEY = 'elora_student_welcome_dismissed';
    const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(
        () => localStorage.getItem(WELCOME_KEY) === 'true'
    );
    const handleDismissWelcome = () => {
        setWelcomeDismissed(true);
        localStorage.setItem(WELCOME_KEY, 'true');
    };

    const handleClassClick = (classId: string, tab: string = 'stream') => {
        const route = isDemo ? `/student/demo/class/${classId}` : `/student/class/${classId}`;
        navigate(`${route}?tab=${tab}`);
    };

    const handleLaunchGame = withGate((gamePackId: string, attemptId?: string) => {
        const url = attemptId ? `/play/${gamePackId}?attemptId=${attemptId}` : `/play/${gamePackId}`;
        navigate(url);
    }, "start practice tasks");

    type AskEloraStatus = 'idle' | 'loading' | 'success' | 'error';
    const [eloraStatus, setEloraStatus] = useState<AskEloraStatus>('idle');
    const [eloraSuggestion, setEloraSuggestion] = useState<StudentSuggestion | null>(null);
    const [eloraError, setEloraError] = useState<string | null>(null);
    const fetchEloraSuggestionRef = React.useRef<(() => Promise<void>) | null>(null);

    // Join Class State
    const [showJoinClass, setShowJoinClass] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joiningClass, setJoiningClass] = useState(false);

    // ── Expansion State for Compacting ──
    const [isTasksExpanded, setIsTasksExpanded] = useState(false);
    const [isComingUpExpanded, setIsComingUpExpanded] = useState(false);
    const INITIAL_VISIBLE_COUNT = 3;

    // ── Student Copilot Handlers ──
    const getStudentAssignmentsList = () => {
        const unfinished = pendingAssignments;

        const sorted = [...unfinished].sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        if (sorted.length === 0) {
            return "I don't see any unfinished assignments — your schedule looks clear right now.";
        }

        let str = `You have ${sorted.length} thing${sorted.length > 1 ? 's' : ''} still to do:\n`;
        const top3 = sorted.slice(0, 3);
        top3.forEach((asgn, i) => {
            const isOverdue = asgn.status === 'danger';
            let dueText = '';
            if (asgn.dueDate) {
                const diffDays = Math.floor((Date.now() - new Date(asgn.dueDate).getTime()) / 86400000);
                if (isOverdue) {
                    dueText = diffDays > 0 ? `was due ${diffDays} day${diffDays > 1 ? 's' : ''} ago` : 'was due today';
                } else {
                    const inDays = Math.ceil((new Date(asgn.dueDate).getTime() - Date.now()) / 86400000);
                    dueText = inDays > 0 ? `is due in ${inDays} day${inDays > 1 ? 's' : ''}` : 'is due today';
                }
            } else {
                dueText = 'has no due date';
            }
            const startHint = i === 0 ? " Start this first." : "";
            str += `\n${asgn.title} — ${dueText}.${startHint}`;
        });

        return str;
    };

    const getStudentNextAction = () => {
        const sorted = [...pendingAssignments].sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        const urgent = sorted[0];
        const weakTopic = studentFocus.primaryWeakTopic;

        if (urgent) {
            let str = `The best use of your next 20 minutes is to finish ${urgent.title}. It should take about 15–20 minutes.`;
            if (weakTopic) {
                str += `\n\nIf you have time after that, try one short round on ${weakTopic}.`;
            }
            return str;
        } else if (weakTopic) {
            return `You don't have any urgent assignments. The best use of your next 20 minutes is to try one short round on ${weakTopic}.`;
        }

        return "You have no urgent assignments and your topics look solid. Enjoy your free time or explore new topics!";
    };

    const getStudentWeekSummary = () => {
        if (!streakData || streakData.weeklyScores.length === 0) {
            return "I don't see enough activity this week to give a summary yet.";
        }

        const thisWeekScore = streakData.scoreThisWeek ?? 0;
        const priorWeekScore = streakData.scorePriorWeek ?? 0;

        const submittedCount = completedAssignments.length;
        const totalCount = assignments.length;

        const weakTopic = studentFocus.primaryWeakTopic;
        const topicString = weakTopic ? ` The main topic to watch is ${weakTopic}.` : "";

        return `This week, your average score is ${thisWeekScore}% (last week it was ${priorWeekScore}%). You've submitted ${submittedCount} of ${totalCount} assignments.${topicString}`;
    };

    const handleStudentAskElora = async (prompt: string): Promise<string> => {
        await new Promise(r => setTimeout(r, 600));
        const lowerPrompt = prompt.toLowerCase();

        if (lowerPrompt.includes('overdue') || lowerPrompt.includes('unfinished') || lowerPrompt.includes('not finished')) {
            return getStudentAssignmentsList();
        }
        if (lowerPrompt.includes('next') || lowerPrompt.includes('20 minutes') || lowerPrompt.includes('work on') || lowerPrompt.includes('should i work on')) {
            return getStudentNextAction();
        }
        if (lowerPrompt.includes('week') || lowerPrompt.includes('how am i doing')) {
            return getStudentWeekSummary();
        }

        return "I don't see enough activity to answer that yet.";
    };

    // --- Real Data State ---
    const [assignments, setAssignments] = useState<dataService.StudentAssignment[]>([]);
    const [studentClasses, setStudentClasses] = useState<dataService.StudentClass[]>([]);
    const [recentPerformance, setRecentPerformance] = useState<{ scores: { score: number; date: string }[]; weakTopics: string[] } | null>(null);
    const [gameSessions, setGameSessions] = useState<dataService.GameSession[]>([]);
    const [streakData, setStreakData] = useState<dataService.StudentStreak | null>(null);
    const [nudges, setNudges] = useState<dataService.ParentNudge[]>([]);

    // Backend Notification records for this student (from the unified /api/notifications endpoint)
    const {
        notifications: backendNotifications,
        markOneRead: handleMarkBackendNotificationRead,
        markAllRead: handleMarkAllBackendNotificationsRead
    } = useNotifications({
        userId: isDemo ? '' : (currentUser?.id || ''),
        role: 'student'
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                if (isDemo) {
                    setAssignments(demoStudentData.assignments);
                    setRecentPerformance(demoStudentData.recentPerformance);
                    setStreakData(demoStudentStreak);
                    setGameSessions(demoGameSessions);
                    setNudges(demoStudentNudges);
                    setStudentClasses(demoStudentClasses);
                    setLoading(false);
                    return;
                }
                const [studentData, sessions, streak, nudgesData, classesData] = await Promise.all([
                    dataService.getStudentAssignments(),
                    dataService.getStudentGameSessions(),
                    dataService.getStudentStreak(),
                    dataService.getStudentNudges(),
                    dataService.getStudentClasses()
                ]);

                if (classesData.length === 0 && !isDemo) {
                    console.log("No student classes found. Seeding with demo data.");
                    setAssignments(demoStudentData.assignments);
                    setRecentPerformance(demoStudentData.recentPerformance);
                    setStreakData(demoStudentStreak);
                    setGameSessions(demoGameSessions);
                    setNudges(demoStudentNudges);
                    setStudentClasses(demoStudentClasses);
                } else {
                    setAssignments(studentData.assignments);
                    setRecentPerformance(studentData.recentPerformance);
                    setGameSessions(sessions);
                    setStreakData(streak);
                    setNudges(nudgesData);
                    setStudentClasses(classesData);
                }
            } catch (err: any) {
                // API unreachable (e.g. Vercel with no backend) — fall back to demo data for visual parity
                console.warn('Student API unavailable, falling back to demo data:', err);
                setAssignments(demoStudentData.assignments);
                setRecentPerformance(demoStudentData.recentPerformance);
                setStreakData(demoStudentStreak);
                setGameSessions(demoGameSessions);
                setNudges(demoStudentNudges);
                setStudentClasses(demoStudentClasses);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isDemo]);

    // Add polling for nudges to ensure parent sends appear immediately in UI
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                if (isDemo) {
                    setNudges([...demoStudentNudges]);
                } else {
                    const nudgesData = await dataService.getStudentNudges();
                    setNudges(nudgesData);
                }
            } catch (err) {
                // Ignore silent poll errors
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isDemo]);

    // The backend notifications fetch logic is now handled by our shared hook.

    useEffect(() => {
        const fetchEloraSuggestion = async () => {
            if (!currentUser || !recentPerformance) return;
            setEloraStatus('loading');
            setEloraError(null);
            try {
                const formattedPerformance = {
                    weakTopics: recentPerformance.weakTopics.map(topic => ({
                        topic,
                        severity: 'severe'
                    })),
                    recentScores: recentPerformance.scores.map((s, i) => ({
                        packId: i === 0 ? 'algebra-basics' : 'practice-general',
                        avgScore: s.score / 100
                    }))
                };

                const suggestion = await getStudentSuggestion(
                    currentUser.id,
                    currentUser.name || 'Student',
                    'class-1', // Mock class ID
                    'Sec 3 Express – E-Maths', // Mock class name
                    formattedPerformance
                );
                setEloraSuggestion(suggestion);
                setEloraStatus('success');
            } catch (err: any) {
                setEloraError(err.message || 'Unknown error');
                setEloraStatus('error');
            }
        };
        fetchEloraSuggestionRef.current = fetchEloraSuggestion;
    }, [currentUser, recentPerformance]);

    useEffect(() => {
        if (activeTab === 'dashboard' && !loading && !error && recentPerformance && eloraStatus === 'idle') {
            fetchEloraSuggestionRef.current?.();
        }
    }, [activeTab, loading, error, recentPerformance, eloraStatus]);

    // ── Student Focus (mini health) model ─────────────────────────────────
    // IMPORTANT: must remain above any early returns to obey Rules of Hooks.
    const studentFocus = React.useMemo(() => {
        const primaryWeakTopic = recentPerformance?.weakTopics?.[0] ?? null;

        // Inline avg score so we don't depend on a variable computed below early returns
        const scores = recentPerformance?.scores ?? [];
        const avgScore = scores.length
            ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
            : null;

        // Confidence trend: use streakData.trend if available; else fall back to avg score
        let confidenceTrend: 'improving' | 'stable' | 'at_risk' = 'stable';
        if (streakData) {
            if (streakData.trend === 'up') confidenceTrend = 'improving';
            else if (streakData.trend === 'down') confidenceTrend = 'at_risk';
            else confidenceTrend = 'stable';
        } else if (avgScore !== null) {
            if (avgScore >= 75) confidenceTrend = 'improving';
            else if (avgScore < 50) confidenceTrend = 'at_risk';
        }

        // Recommended game pack matched to the primary weak topic
        let recommendedPackId = 'practice-general';
        let recommendedPackName = 'General Practice';
        if (primaryWeakTopic) {
            const t = primaryWeakTopic.toLowerCase();
            if (t.includes('algebra') || t.includes('factori')) {
                recommendedPackId = 'algebra-basics';
                recommendedPackName = 'Algebra Basics';
            } else if (t.includes('fraction')) {
                recommendedPackId = 'demo-game-1';
                recommendedPackName = 'Fractions Quest';
            } else if (t.includes('kinematic') || t.includes('physics')) {
                recommendedPackId = 'demo-game-2';
                recommendedPackName = 'Kinematics Lab';
            }
        }

        return { primaryWeakTopic, confidenceTrend, recommendedPackId, recommendedPackName };
    }, [recentPerformance, streakData]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FDFBF5] text-[#68507B]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-4 border-[#68507B]/20 border-t-[#68507B] animate-spin"></div>
                    <p className="text-[15px] font-medium text-slate-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FDFBF5]">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                    <p className="text-[15px] font-semibold text-slate-800">Something went wrong</p>
                    <p className="text-[14px] text-slate-500">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-[#68507B] hover:bg-[#5a456a] transition-colors text-white rounded-lg text-sm font-medium">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const handleJoinClass = withGate(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        setJoiningClass(true);
        setJoinError(null);
        try {
            await dataService.joinStudentClass(joinCode.trim());
            setShowJoinClass(false);
            setJoinCode('');
            // Refresh assignments/classes if needed
            const studentData = await dataService.getStudentAssignments();
            setAssignments(studentData.assignments);
        } catch (err: any) {
            setJoinError(err.message || 'Failed to join class. Please check the code.');
        } finally {
            setJoiningClass(false);
        }
    }, "join a new class");

    const handleMarkNudgeRead = withGate(async (id: string) => {
        try {
            await dataService.markNudgeAsRead(id);
            setNudges(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Failed to mark nudge as read", error);
        }
    }, "interact with teacher nudges");

    // (handleMarkBackendNotificationRead is now handled by the useNotifications hook)

    const displayName = isDemo ? 'Jordan' : (currentUser?.preferredName ?? currentUser?.name ?? 'Student');
    const studentInitial = displayName.charAt(0).toUpperCase();

    // ── Status normalisation ───────────────────────────────────────────────────
    // The backend returns raw attempt statuses: 'not_started' | 'submitted' | 'in_progress'.
    // Legacy assignment fields use 'danger' | 'warning' | 'info' | 'completed' | 'success'.
    // We normalise here so all downstream filters work against a consistent set.
    const normalisedAssignments = assignments.map(a => {
        let status = a.status as string;
        if (status === 'not_started') {
            // Determine urgency from dueDate
            const due = a.dueDate ? new Date(a.dueDate) : null;
            const now = new Date();
            if (due && due < now) status = 'danger';           // overdue
            else if (due && (due.getTime() - now.getTime()) < 3 * 86400000) status = 'warning'; // due within 3 days
            else status = 'info';                               // on track
        } else if (status === 'submitted') {
            status = 'completed';
        } else if (status === 'in_progress') {
            status = 'warning';
        }
        return { ...a, status };
    });

    // Map assignments to categories
    const overdueAssignments = normalisedAssignments.filter(a => a.status === 'danger');
    const dueSoonAssignments = normalisedAssignments.filter(a => a.status === 'warning');
    const completedAssignments = normalisedAssignments.filter(
        a => a.status === 'completed' || a.status === 'success'
    );
    const onTrackAssignments = normalisedAssignments.filter(a => a.status === 'info');
    // Pending = anything not yet submitted
    const pendingAssignments = [...overdueAssignments, ...dueSoonAssignments, ...onTrackAssignments];

    // Stats
    const totalRecentScores = recentPerformance?.scores?.reduce((sum, s) => sum + s.score, 0) || 0;
    const avgRecentScore = recentPerformance?.scores?.length
        ? Math.round(totalRecentScores / recentPerformance.scores.length)
        : null;

    const summaryStats = [
        { id: 1, label: 'Overdue assignments', value: overdueAssignments.length.toString(), icon: AlertCircle, color: 'text-[#9F1239]' },
        { id: 2, label: 'Due soon', value: dueSoonAssignments.length.toString(), icon: Clock, color: 'text-orange-500' },
        { id: 3, label: 'Completed', value: completedAssignments.length.toString(), icon: CheckCircle2, color: 'text-emerald-500' },
        { id: 4, label: 'Average recent score', value: avgRecentScore !== null ? `${avgRecentScore}%` : 'N/A', icon: TrendingUp, color: 'text-[#68507B]' },
    ];

    // ── Relative time helper ──────────────────────────────────────────────────
    const relativeTime = (iso: string): string => {
        const diffMs = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diffMs / 60_000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    // Notification items unification
    const popoverNotifications: PopoverNotificationItem[] = [
        // 1. Unread backend Notification records for this student (unified model)
        ...backendNotifications.map(n => ({
            id: `backend-${n.id}`,
            title: n.title ?? (n.type === 'alert' ? 'Alert' : 'Notification'),
            message: n.message,
            time: relativeTime(n.createdAt),
            isRead: n.isRead,
            type: n.type,
            original: n
        })),
        // 2. Unread ParentNudge items (existing flow – unchanged)
        ...nudges.filter(n => !n.read).map(n => ({
            id: `nudge-${n.id}`,
            title: 'Message from your parent',
            message: n.message,
            time: new Date(n.createdAt).toLocaleDateString(),
            isRead: false,
            type: 'message' as const,
            original: n
        })),
        // 3. Overdue assignment alerts (no read tracking yet – unchanged)
        ...overdueAssignments.map(a => ({
            id: `overdue-${a.id}`,
            title: 'Overdue Assignment',
            message: a.title,
            time: a.dueDate ? `Due ${new Date(a.dueDate).toLocaleDateString()}` : 'Now',
            isRead: true, // No unread dot for assignments
            type: 'alert' as const,
            original: a
        }))
    ];

    const handleNotificationClick = (item: PopoverNotificationItem) => {
        if (item.id.startsWith('backend-') && item.original) {
            handleMarkBackendNotificationRead(item.original.id);
            // Optional: navigate based on destination if needed
            // const dest = getNotificationDefaultDestination(item.original);
        } else if (item.id.startsWith('nudge-') && item.original) {
            handleMarkNudgeRead(item.original.id);
        } else if (item.id.startsWith('overdue-') && item.original) {
            navigate(`/play/${item.original.gamePackId || 'practice-general'}?attemptId=${item.original.attemptId}`);
        }
    };

    const handleMarkAllNotificationsRead = () => {
        handleMarkAllBackendNotificationsRead();
        // Nudges and assignments don't have a backend "mark all read" yet that we want to trigger here
    };

    // Total unread calculation for the badge
    const notificationsUnreadCount = popoverNotifications.filter(n => !n.isRead).length;


    // Helper to compute hours until due for urgency coloring
    const getHoursUntilDue = (isoDate?: string): number => {
        if (!isoDate) return 999;
        return (new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60);
    };

    // Map assignments to "Upcoming items" for the right column
    const upcomingItems = pendingAssignments.slice(0, 4).map(asgn => {
        const hours = getHoursUntilDue(asgn.dueDate);
        const isOverdue = asgn.status === 'danger' || hours < 0;
        
        let label = '';
        if (isOverdue) label = 'Overdue';
        else if (hours < 24) label = `Due in ${Math.ceil(hours)}h`;
        else label = `Due in ${Math.ceil(hours / 24)}d`;

        return {
            id: asgn.id,
            title: asgn.title,
            subjectClass: asgn.className,
            dueDate: label,
            status: isOverdue ? 'Overdue' : (hours < 48 ? 'Due soon' : 'Later'),
            hoursUntilDue: hours,
            originalClassStatus: asgn.status,
            gamePackId: (asgn as any).gamePackId,
            attemptId: (asgn as any).attemptId,
        };
    });

    // ── Next Steps recommendation logic ────────────────────────────────────────
    // All deterministic; no randomisation; derived only from existing API data.

    interface NextStepRec {
        id: string;
        icon: 'retry' | 'start' | 'improve';
        label: string;         // short heading
        detail: string;        // context line
        href: string;          // navigation target
    }

    const nextSteps: NextStepRec[] = [];
    const seenAttemptIds = new Set<string>();

    // [A] Retry weak topic — pick the most-missed topic and find an open assignment for it.
    //     If no matching assignment exists, fall back to the demo game.
    const topWeakTopic = recentPerformance?.weakTopics?.[0];
    if (topWeakTopic) {
        // Find the most-recently played session that had this topic as a wrong answer
        const matchSession = gameSessions.find(gs =>
            gs.results?.some(r => !r.isCorrect && r.topicTag === topWeakTopic)
        );
        const lastScore = matchSession ? Math.round(matchSession.accuracy * 100) : null;
        const href = `/play/practice-general`;
        nextSteps.push({
            id: 'rec-weak-topic',
            icon: 'retry',
            label: `Practise: ${topWeakTopic}`,
            detail: lastScore !== null
                ? `You scored ${lastScore}% last time — let's improve that.`
                : `You've been getting this topic wrong. Time to nail it.`,
            href,
        });
    }

    // [B] Most urgent pending assignment — soonest due, not yet started.
    const urgentAssignment = pendingAssignments
        .filter(a => a.dueDate)
        .sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime())[0];
    if (urgentAssignment && !seenAttemptIds.has(urgentAssignment.id)) {
        seenAttemptIds.add(urgentAssignment.id);
        const packId = (urgentAssignment as any).gamePackId || 'practice-general';
        const attemptId = (urgentAssignment as any).attemptId;
        nextSteps.push({
            id: `rec-urgent-${urgentAssignment.id}`,
            icon: 'start',
            label: urgentAssignment.title,
            detail: urgentAssignment.status === 'danger'
                ? `⚠️ Overdue — start as soon as possible.`
                : `Due ${new Date(urgentAssignment.dueDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}.`,
            href: `/play/${packId}${attemptId ? `?attemptId=${attemptId}` : ''}`,
        });
    }

    // [C] Improve a low score — completed assignment with bestScore < 70%.
    const lowScoreAssignment = completedAssignments
        .filter(a => typeof (a as any).bestScore === 'number' && (a as any).bestScore < 70)
        .sort((x, y) => ((x as any).bestScore ?? 100) - ((y as any).bestScore ?? 100))[0];
    if (lowScoreAssignment && nextSteps.length < 3 && !seenAttemptIds.has(lowScoreAssignment.id)) {
        seenAttemptIds.add(lowScoreAssignment.id);
        const packId = (lowScoreAssignment as any).gamePackId || 'practice-general';
        const attemptId = (lowScoreAssignment as any).attemptId;
        const score = (lowScoreAssignment as any).bestScore;
        nextSteps.push({
            id: `rec-improve-${lowScoreAssignment.id}`,
            icon: 'improve',
            label: `Improve: ${lowScoreAssignment.title}`,
            detail: `You scored ${score}% — aim for 70%+ to master this topic.`,
            href: `/play/${packId}${attemptId ? `?attemptId=${attemptId}` : ''}`,
        });
    }

    // Dynamic focus chip: top weak topic (replaces hardcoded string)
    const focusChipText = topWeakTopic ?? null;


    // Map game sessions to "GamePacks" table for display
    const displayGamePacks = [
        ...gameSessions.map(session => ({
            id: session.id,
            title: session.packId === 'demo-game-1' ? 'Fractions Quest' : session.packId,
            subject: 'Practice',
            tag: 'Completed',
            lastPlayed: new Date(session.playedAt).toLocaleDateString(),
            progress: 100,
            status: 'Completed',
            score: `${Math.round(session.accuracy * 100)}%`,
            description: `You scored ${session.score}/${session.totalQuestions} in this session.`
        })),
        ...(gameSessions.length === 0 ? [{
            id: 'rec-1',
            title: 'Algebra Basics',
            subject: 'Mathematics',
            tag: 'Recommended',
            lastPlayed: 'Never',
            progress: 0,
            status: 'Recommended',
            score: 'N/A',
            description: 'Master the fundamentals of linear equations and basic variables.'
        }] : [])
    ];

    const filteredGamePacks = displayGamePacks.filter(gp =>
        gamePackFilter === 'All' ? true : gp.status === gamePackFilter
    );

    // Derived objects for modernized UI sections
    const performanceSummary = {
        topicsMastered: completedAssignments.length,
        xpReward: isDemo ? 12450 : 0,
        weeklyRank: isDemo ? 'Gold III' : 'N/A',
        streak: streakData?.streakWeeks ?? 0
    };

    const studentProfile = {
        firstName: displayName.split(' ')[0],
        streak: streakData?.streakWeeks ?? 0,
        xp: performanceSummary.xpReward,
        rank: performanceSummary.weeklyRank
    };

    const useLocalShell = !embeddedInShell;

    return (
        <div className="flex flex-col min-h-screen bg-[#FDFBF5] font-sans text-slate-900 overflow-x-hidden">
            {isDemo && <DemoRoleSwitcher />}

            <div className="flex flex-1">
                {/* MOBILE BACKDROP (Surface 0) */}
                {useLocalShell && isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] md:hidden transition-all duration-500 animate-in fade-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* SIDEBAR SURFACE (Surface 1) */}
                {useLocalShell && <aside
                    id="student-sidebar"
                    className={`fixed inset-y-0 left-0 z-[70] flex flex-col transition-all transition-colors duration-300 ease-in-out md:translate-x-0
                        ${isSidebarOpen ? 'w-64' : 'w-20'} 
                        ${sidebarTheme.asideBg} shadow-xl
                        md:sticky md:top-0 md:min-h-screen
                        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    `}
                >
                    {/* Logo & Close toggle */}
                    <div className={`h-16 flex items-center border-b ${sidebarTheme.headerBorder} px-8 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                        <Link to="/" className="flex items-center text-white/90 hover:text-white transition-colors overflow-hidden shrink-0">
                            <EloraLogo className="w-10 h-10 text-current drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform hover:scale-105" withWordmark={isSidebarOpen} />
                        </Link>

                        {/* Mobile close toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="Close menu"
                        >
                            <X size={22} />
                        </button>

                        {/* Desktop collapse toggle */}
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="hidden md:flex p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                title="Collapse sidebar"
                            >
                                <PanelLeftClose size={18} />
                            </button>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar custom-scrollbar">
                        <SidebarItem
                            icon={LayoutDashboard}
                            label="Overview"
                            active={activeTab === 'dashboard' && !hash} 
                            collapsed={!isSidebarOpen}
                            onClick={() => {
                                navigate(isDemo ? '/student/demo' : '/dashboard/student');
                                setActiveTab('dashboard');
                            }}
                            theme={sidebarTheme}
                        />
                        <SidebarItem
                            icon={BookOpen} 
                            label="My Classes" 
                            active={activeTab === 'classes'}
                            collapsed={!isSidebarOpen} 
                            onClick={() => {
                                navigate(isDemo ? '/student/demo/classes' : '/student/classes');
                                setActiveTab('classes');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            theme={sidebarTheme} 
                        />
                        <SidebarItem
                            icon={Sparkles}
                            label="Copilot"
                            collapsed={!isSidebarOpen}
                            onClick={() => navigate(isDemo ? '/student/demo/copilot' : '/student/copilot')}
                            theme={sidebarTheme}
                        />
                        <SidebarItem 
                            icon={Gamepad2} 
                            label="Practice & Quizzes" 
                            active={activeTab === 'dashboard' && hash === '#practice'} 
                            collapsed={!isSidebarOpen} 
                            onClick={() => {
                                navigate(`${isDemo ? '/student/demo' : '/dashboard/student'}#practice`);
                                setActiveTab('dashboard');
                                setTimeout(() => {
                                    document.getElementById('practice-section')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                            theme={sidebarTheme} 
                        />
                        <SidebarItem 
                            icon={FileText} 
                            label="Assignments" 
                            active={activeTab === 'assignments'} 
                            collapsed={!isSidebarOpen} 
                            onClick={() => {
                                navigate(isDemo ? '/student/demo/assignments' : '/student/assignments');
                                setActiveTab('assignments');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                            theme={sidebarTheme} 
                        />
                        <SidebarItem 
                            icon={TrendingUp} 
                            label="Reports" 
                            active={activeTab === 'dashboard' && hash === '#reports'} 
                            collapsed={!isSidebarOpen} 
                            onClick={() => {
                                navigate(isDemo ? '/student/demo#reports' : '/dashboard/student#reports');
                                setActiveTab('dashboard');
                                setTimeout(() => {
                                    document.getElementById('reports-section')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }} 
                            theme={sidebarTheme} 
                        />
                    </nav>

                    {/* Footer / System menu */}
                    <div className={`mt-auto p-6 border-t ${sidebarTheme.footerBorder} space-y-2`}>
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
                            className={`flex w-full items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-all group ${!isSidebarOpen ? 'justify-center' : ''}`}
                            title={!isSidebarOpen ? "Sign out" : undefined}
                        >
                            <LogOut size={22} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
                            {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
                        </button>
                    </div>
                </aside>}

                {/* MAIN CONTENT AREA - Surface 2 (Calm Content) */}
                <main id="main-content" className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#FDFBF5]/50 overflow-x-hidden">
                    <div className="flex-1 flex flex-col">

                        {/* FIXED TOP HEADER - Standard Elora Shell Pattern */}
                        {useLocalShell && <DashboardHeader
                            role="student"
                            displayName={displayName}
                            roleLabel="STUDENT"
                            avatarInitials={studentInitial}
                            onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
                            notificationsNode={
                                <NotificationsPopover
                                    items={popoverNotifications}
                                    unreadCount={notificationsUnreadCount}
                                    onMarkAllRead={handleMarkAllNotificationsRead}
                                    onNotificationClick={handleNotificationClick}
                                    badgeColor="bg-orange-500"
                                    unreadDotColor="bg-orange-500"
                                    unreadBgColor="bg-orange-50/20"
                                    headerTextColor="text-[#68507B]"
                                />
                            }
                        />}

                        {/* CONTENT SHELL AREA */}
                        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                            {activeTab === 'dashboard' && (
                                <DashboardTour
                                    role="student"
                                    isVisible={!welcomeDismissed}
                                    onAction1={() => navigate('/play/practice-general')}
                                    onAction2={() => setShowJoinClass(true)}
                                    onDismiss={handleDismissWelcome}
                                />
                            )}

                            {activeTab === 'dashboard' ? (
                                <div className="space-y-6">
                                    {/* ── [Row 1] Hero & Performance ── */}
                                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.1fr] gap-6">
                                        {/* Left: Hero (Welcome) */}
                                        <div className="bg-[#68507B] rounded-3xl px-6 md:px-8 py-4 md:py-5 relative overflow-hidden shadow-xl border border-[#68507B] flex flex-col min-h-[140px]">
                                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl opacity-50" />
                                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl opacity-50" />

                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold bg-white/10 text-white/90 mb-4 border border-white/20 uppercase tracking-[0.2em] w-fit">
                                                    <Flame size={12} className="text-orange-400" />
                                                    <span>{studentProfile.streak} Day Streak</span>
                                                </div>
                                                <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2 leading-tight tracking-tight">
                                                    Hi, {studentProfile.firstName}! <br />
                                                    <span className="text-purple-200">Ready to shine today?</span>
                                                </h1>
                                                <p className="text-white/80 text-sm md:text-base max-w-xl leading-relaxed font-medium">
                                                    You've mastered <span className="text-white font-extrabold">{performanceSummary.topicsMastered} topics</span> this week. Let's keep growing!
                                                </p>
                                                <div className="mt-auto pt-4 border-t border-purple-300/30">
                                                    <button
                                                        onClick={() => {
                                                            navigate(isDemo ? '/student/demo/classes' : '/student/classes');
                                                            setActiveTab('classes');
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="w-full py-3 text-sm font-semibold text-white hover:bg-purple-50/20 transition-colors inline-flex items-center justify-center gap-2"
                                                    >
                                                        <BookOpen size={16} />
                                                        Enter Classes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Performance Snapshot (Teacher Style Stats) */}
                                        <div className="bg-white border border-[#EAE7DD] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                            <Activity size={18} className="text-[#68507B]" />
                                                        </div>
                                                        <h3 className="text-sm font-semibold tracking-tight text-slate-800">Performance Snapshot</h3>
                                                    </div>
                                                    <div className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-tight">On Track</div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                    <div>
                                                        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-widest block mb-1.5 opacity-80">Topics Mastered</label>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums">{performanceSummary.topicsMastered}</span>
                                                            <span className="text-[11px] font-semibold text-emerald-500">+2</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-widest block mb-1.5 opacity-80">XP Reward</label>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums">{studentProfile.xp.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-widest block mb-1.5 opacity-80">Weekly Rank</label>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums">{studentProfile.rank}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-widest block mb-1.5 opacity-80">Active Streak</label>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums">{studentProfile.streak}d</span>
                                                            <Flame size={16} className="text-orange-500 animate-pulse" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex -space-x-2.5">
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100" />
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#68507B]/10 flex items-center justify-center text-[11px] font-semibold text-[#68507B]">
                                                        +12
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-semibold text-slate-400">Top 5% this week</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ROW 3: MAIN DASHBOARD CONTENT GRID */}
                                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] gap-6">
                                        <div className="space-y-6 xl:order-2">
                                            {/* TODAY'S TASKS - Moved Higher as First Priority Card */}
                                            <section id="tasks-section" className="bg-white border border-[#EAE7DD] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col hover:shadow-md transition-all mt-10">
                                                <div className="px-4 py-4 border-b border-[#EAE7DD] flex items-center justify-between bg-slate-50/30">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-[#68507B] flex items-center justify-center">
                                                            <ListTodo size={18} />
                                                        </div>
                                                        <h3 className="text-sm font-semibold tracking-tight text-slate-800">Next Steps</h3>
                                                    </div>
                                                    <span className="text-[11px] font-medium text-[#68507B] px-2 py-0.5 bg-purple-100/50 rounded-md border border-purple-200/50 uppercase tracking-widest">
                                                        Merged Focus
                                                    </span>
                                                </div>

                                                <div className="p-4">
                                                    {nextSteps.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {(() => {
                                                                const displayedTasks = isTasksExpanded ? nextSteps : nextSteps.slice(0, INITIAL_VISIBLE_COUNT);
                                                                const hasMoreTasks = nextSteps.length > INITIAL_VISIBLE_COUNT;

                                                                return (
                                                                    <>
                                                                        {displayedTasks.map(item => (
                                                                            <div
                                                                                key={item.id}
                                                                                onClick={() => navigate(item.href)}
                                                                                className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-all group cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-[#68507B]/20"
                                                                            >
                                                                                <div className="w-10 h-10 rounded-lg bg-[#68507B] flex items-center justify-center text-white shadow-lg shadow-purple-900/10 transition-transform group-hover:scale-110">
                                                                                    {item.icon === 'retry' ? <RotateCcw size={16} /> : item.icon === 'improve' ? <Zap size={16} /> : <Play size={16} fill="currentColor" />}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[10px] font-semibold text-[#68507B] uppercase tracking-widest mb-0.5">Smart recommendation</p>
                                                                                    <h4 className="text-[14px] font-semibold text-slate-900 leading-tight truncate">{item.label}</h4>
                                                                                    <p className="text-[12px] text-slate-500 mt-1 truncate">{item.detail}</p>
                                                                                </div>
                                                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#68507B] group-hover:translate-x-0.5 transition-transform" />
                                                                            </div>
                                                                        ))}

                                                                        {hasMoreTasks && (
                                                                            <button
                                                                                onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                                                                                className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-[#68507B] bg-slate-50/50 border border-slate-100 rounded-xl transition-all"
                                                                            >
                                                                                {isTasksExpanded ? (
                                                                                    <> <ChevronUp size={14} /> Show less </>
                                                                                ) : (
                                                                                    <> <ChevronDown size={14} /> Show {nextSteps.length - INITIAL_VISIBLE_COUNT} more </>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                                <CheckCircle2 size={28} />
                                                            </div>
                                                            <p className="text-[15px] font-semibold text-slate-900">All caught up!</p>
                                                            <p className="text-[12px] text-slate-500 mt-1.5 px-4 font-medium">No urgent tasks for today. You're ahead of schedule!</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>

                                            {/* MY CLASSES - Now Higher and More Central */}
                                            {studentClasses.length > 0 && (
                                                <section id="student-my-classes" className="bg-white border border-[#EAE7DD] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-md transition-all mt-10">
                                                    <div className="px-6 py-5 border-b border-[#EAE7DD] flex items-center justify-between bg-slate-50/30">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                                <BookOpen size={18} />
                                                            </div>
                                                            <h3 className="text-sm font-semibold tracking-tight text-slate-800">My Classes</h3>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                navigate(isDemo ? '/student/demo/classes' : '/student/classes');
                                                                setActiveTab('classes');
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            className="text-[10px] font-semibold text-[#68507B] hover:text-[#5a456a] uppercase tracking-[0.1em] transition-colors"
                                                        >
                                                            VIEW ALL →
                                                        </button>
                                                    </div>
                                                    <div className="p-5">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {studentClasses.map(cls => {
                                                                const classAssignments = normalisedAssignments.filter(a => a.classroomId === cls.id || a.className === cls.name);
                                                                const pendingCount = classAssignments.filter(a => a.status === 'danger' || a.status === 'warning' || a.status === 'info').length;
                                                                
                                                                return (
                                                                    <ClassSummaryCard
                                                                        key={cls.id}
                                                                        role="student"
                                                                        name={cls.name}
                                                                        subject={cls.subject || 'Mathematics'}
                                                                        themeColor={cls.themeColor || 'purple'}
                                                                        playfulBackground={cls.playfulBackground ?? true}
                                                                        onEnter={() => handleClassClick(cls.id)}
                                                                        metaPrimaryNode={
                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                                                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 leading-none">
                                                                                        To Do
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <span className={`text-[15px] font-semibold ${pendingCount > 0 ? 'text-orange-600' : 'text-slate-700'}`}>
                                                                                            {pendingCount}
                                                                                        </span>
                                                                                        <span className="text-[12px] text-slate-400 font-medium">{pendingCount === 1 ? 'Task' : 'Tasks'}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                                                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 leading-none">
                                                                                        Avg Score
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <span className="text-[15px] font-semibold text-[#68507B]">
                                                                                            {/* Demo score fallback if none exists */}
                                                                                            {isDemo ? (cls.id === 'demo-class-1' ? '42%' : '85%') : '--'}
                                                                                        </span>
                                                                                        <TrendingUp size={12} className={cls.id === 'demo-class-1' ? 'text-orange-400' : 'text-emerald-400'} />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        }
                                                                        metaSecondaryNode={
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <p className="text-[11px] text-slate-500 font-medium truncate">with {cls.teacherName}</p>
                                                                            </div>
                                                                        }
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </section>
                                            )}

                                            {/* MASTERY TREND */}
                                            <section id="mastery-section" className="bg-white rounded-2xl border border-[#EAE7DD] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 hover:shadow-md transition-all mt-10">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                            <TrendingUp size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-semibold tracking-tight text-slate-800">Mastery Trend</h3>
                                                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Recent Performance</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                                                        <div className="w-2 h-2 rounded-full bg-[#68507B]" />
                                                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tighter">Avg Accuracy</span>
                                                    </div>
                                                </div>

                                                <div className="h-[200px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={(recentPerformance?.scores || []).map(s => ({
                                                            date: new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                                                            score: s.score
                                                        })).slice(-7)}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                            <XAxis
                                                                dataKey="date"
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                                                                dy={10}
                                                            />
                                                            <YAxis
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                                                                domain={[0, 100]}
                                                                dx={-10}
                                                            />
                                                            <Tooltip
                                                                cursor={{ fill: '#f8fafc' }}
                                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                                                labelStyle={{ fontSize: '10px', color: '#94A3B8', marginBottom: '4px', fontWeight: 800, textTransform: 'uppercase' }}
                                                            />
                                                            <Bar
                                                                dataKey="score"
                                                                fill="#68507B"
                                                                radius={[6, 6, 0, 0]}
                                                                barSize={32}
                                                            >
                                                                {(recentPerformance?.scores || []).slice(-7).map((entry, index) => (
                                                                    <Cell
                                                                        key={`cell-${index}`}
                                                                        fill={entry.score >= 80 ? '#10B981' : entry.score >= 60 ? '#68507B' : '#F59E0B'}
                                                                        fillOpacity={0.9}
                                                                    />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </section>


                                        </div>

                                        {/* RIGHT SIDEBAR COLUMN */}
                                        <div className="space-y-6 xl:order-1">
                                            {/* FULL SCHEDULE (Upcoming Assignments) - Moved to Sidebar for balance */}
                                            <section className="bg-white border border-[#EAE7DD] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-md transition-all mt-10">
                                                <div className="px-6 py-5 border-b border-[#EAE7DD] flex items-center justify-between bg-slate-50/10">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#68507B] flex items-center justify-center">
                                                            <CalendarDays size={18} />
                                                        </div>
                                                        <h3 className="text-sm font-semibold tracking-tight text-slate-800">Upcoming</h3>
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveTab('assignments')}
                                                        className="text-[10px] font-semibold text-[#68507B] hover:opacity-70 transition-all uppercase tracking-widest flex items-center gap-1.5"
                                                    >
                                                        VIEW ALL <ChevronRight size={12} strokeWidth={3} />
                                                    </button>
                                                </div>

                                                <div className="divide-y divide-slate-50">
                                                    {(() => {
                                                        const displayedUpcoming = isComingUpExpanded ? upcomingItems : upcomingItems.slice(0, INITIAL_VISIBLE_COUNT);
                                                        const hasMoreUpcoming = upcomingItems.length > INITIAL_VISIBLE_COUNT;

                                                        return (
                                                            <>
                                                                {displayedUpcoming.map(item => {
                                                                    const hours = (item as any).hoursUntilDue;
                                                                    const isOverdue = item.status === 'Overdue';
                                                                    const isUrgent = !isOverdue && hours < 24;
                                                                    const isSoon = !isOverdue && hours >= 24 && hours < 48;

                                                                    let statusClasses = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                                                                    if (isOverdue) statusClasses = 'bg-rose-50 text-[#9F1239] border-rose-200';
                                                                    else if (isUrgent) statusClasses = 'bg-rose-50 text-[#9F1239] border-rose-200';
                                                                    else if (isSoon) statusClasses = 'bg-amber-50 text-amber-800 border-amber-200';

                                                                    return (
                                                                        <div
                                                                            key={item.id}
                                                                            onClick={() => handleLaunchGame(item.gamePackId || 'practice-general', (item as any).attemptId)}
                                                                            className="p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                                        >
                                                                            <div className="flex justify-between items-start gap-4">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <h4 className="text-[14px] font-semibold text-slate-900 group-hover:text-[#68507B] transition-colors leading-snug">{item.title}</h4>
                                                                                    <div className="flex items-center gap-2 mt-1.5">
                                                                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{item.subjectClass}</span>
                                                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                                                        <span className={`text-[11px] font-semibold ${isOverdue || isUrgent ? 'text-[#9F1239]' : 'text-slate-500'}`}>
                                                                                            {item.dueDate}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${statusClasses}`}>
                                                                                    {item.status}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}

                                                                {hasMoreUpcoming && (
                                                                    <div className="p-3 bg-slate-50/20">
                                                                        <button
                                                                            onClick={() => setIsComingUpExpanded(!isComingUpExpanded)}
                                                                            className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-[#68507B] bg-white border border-slate-100 rounded-xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                                                                        >
                                                                            {isComingUpExpanded ? (
                                                                                <> <ChevronUp size={14} /> Show less </>
                                                                            ) : (
                                                                                <> <ChevronDown size={14} /> Show {upcomingItems.length - INITIAL_VISIBLE_COUNT} more </>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                    {upcomingItems.length === 0 && (
                                                        <div className="p-10 text-center">
                                                            <SectionEmpty
                                                                headline="No upcoming assignments"
                                                                detail="Your schedule is looking clear for now."
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </section>

                                            {/* MESSAGES FROM HOME */}
                                            <section className="bg-white border border-[#EAE7DD] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-md transition-all">
                                                <div className="px-6 py-5 border-b border-[#EAE7DD] flex items-center justify-between bg-pink-50/10">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                                                            <Heart size={18} />
                                                        </div>
                                                        <h3 className="text-sm font-semibold tracking-tight text-slate-800">Messages from Home</h3>
                                                    </div>
                                                    {nudges.filter(n => !n.read).length > 0 && (
                                                        <span className="flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-pink-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {nudges.length > 0 ? (
                                                        [...nudges]
                                                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                            .slice(0, 3).map(nudge => (
                                                                <div
                                                                    key={nudge.id}
                                                                    onClick={() => !nudge.read && handleMarkNudgeRead(nudge.id)}
                                                                    className={`p-5 transition-colors ${!nudge.read ? 'bg-pink-50/20 cursor-pointer' : ''}`}
                                                                >
                                                                    <div className="flex gap-4">
                                                                        <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${!nudge.read ? 'bg-pink-500' : 'bg-slate-200'}`} />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <span className="text-[12px] font-semibold text-slate-900">{nudge.senderName || 'Parent'}</span>
                                                                                <span className="text-[10px] font-semibold text-slate-400 uppercase">{relativeTime(nudge.createdAt)}</span>
                                                                            </div>
                                                                            <div className="relative">
                                                                                <p className="text-[13px] text-slate-700 font-medium italic leading-relaxed pl-3 border-l-2 border-pink-100">
                                                                                    "{nudge.message}"
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div className="p-8 text-center">
                                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                                                                <Inbox size={24} />
                                                            </div>
                                                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">No recent messages</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'assignments' ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700" id="assignments-section">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Assignments & Quizzes</h2>
                                            <p className="text-[13px] text-slate-500 mt-0.5">A focused command center for your active and completed work.</p>
                                        </div>
                                        {activeClassFilter && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-wider">Filtered by:</span>
                                                <span className="px-3 py-1.5 bg-[#7C3AED] text-white rounded-xl text-[12px] font-semibold border border-[#7C3AED] flex items-center gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    {activeClassFilter}
                                                    <button
                                                        onClick={() => setActiveClassFilter(null)}
                                                        className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center"
                                                        title="Clear filter"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,25%)_minmax(0,75%)] gap-6 items-start">
                                        <aside className="rounded-xl border border-[#EAEAEA] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 lg:sticky lg:top-6">
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Active Tasks Summary</p>
                                                <div className="space-y-2 rounded-lg border border-[#EAEAEA] bg-slate-50/60 px-4 py-3.5">
                                                    <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-slate-600">
                                                        <span>To-do</span>
                                                        <span className="tabular-nums text-base font-bold text-[#7C3AED]">
                                                            {normalisedAssignments.filter(a => a.status !== 'completed' && a.status !== 'success' && (!activeClassFilter || a.className === activeClassFilter)).length}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-slate-600">
                                                        <span>Due this week</span>
                                                        <span className="tabular-nums text-base font-bold text-[#7C3AED]">
                                                            {normalisedAssignments.filter(a => {
                                                                if (a.status === 'completed' || a.status === 'success') return false;
                                                                if (activeClassFilter && a.className !== activeClassFilter) return false;
                                                                const dueDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
                                                                const now = Date.now();
                                                                return dueDate >= now && dueDate <= now + (7 * 24 * 60 * 60 * 1000);
                                                            }).length}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-slate-600">
                                                        <span>Overdue</span>
                                                        <span className="tabular-nums text-base font-bold text-[#7C3AED]">
                                                            {normalisedAssignments.filter(a => a.status === 'danger' && (!activeClassFilter || a.className === activeClassFilter)).length}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Filters</p>
                                                <div className="space-y-2 rounded-lg border border-[#EAEAEA] bg-slate-50/40 px-4 py-3.5">
                                                    <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Subject</label>
                                                    <select
                                                        value={activeClassFilter ?? 'all'}
                                                        onChange={(event) => setActiveClassFilter(event.target.value === 'all' ? null : event.target.value)}
                                                        className="w-full bg-white border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm"
                                                    >
                                                        <option value="all">All subjects</option>
                                                        {Array.from(new Set(normalisedAssignments.map((assignment) => assignment.className))).map((className) => (
                                                            <option key={className} value={className}>{className}</option>
                                                        ))}
                                                    </select>

                                                    <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Status</label>
                                                    <select
                                                        value={assignmentStatusFilter}
                                                        onChange={(event) => setAssignmentStatusFilter(event.target.value as 'all' | 'overdue' | 'in_progress' | 'not_started' | 'completed')}
                                                        className="w-full bg-white border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm"
                                                    >
                                                        <option value="all">All statuses</option>
                                                        <option value="overdue">Overdue</option>
                                                        <option value="in_progress">In progress</option>
                                                        <option value="not_started">Not started</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </aside>

                                        <section>
                                            {normalisedAssignments.filter((a) => {
                                                if (activeClassFilter && a.className !== activeClassFilter) return false;

                                                if (assignmentStatusFilter === 'overdue') return a.status === 'danger';
                                                if (assignmentStatusFilter === 'in_progress') return a.status === 'warning';
                                                if (assignmentStatusFilter === 'not_started') return a.status === 'info';
                                                if (assignmentStatusFilter === 'completed') return a.status === 'completed' || a.status === 'success';

                                                return true;
                                            }).length === 0 ? (
                                                <div className="rounded-xl border border-[#EAEAEA] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10">
                                                    <SectionEmpty
                                                        headline="No assignments found"
                                                        detail="Try another class filter, or head back to your classes to pick up new work."
                                                    />
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {normalisedAssignments
                                                        .filter((a) => {
                                                            if (activeClassFilter && a.className !== activeClassFilter) return false;

                                                            if (assignmentStatusFilter === 'overdue') return a.status === 'danger';
                                                            if (assignmentStatusFilter === 'in_progress') return a.status === 'warning';
                                                            if (assignmentStatusFilter === 'not_started') return a.status === 'info';
                                                            if (assignmentStatusFilter === 'completed') return a.status === 'completed' || a.status === 'success';

                                                            return true;
                                                        })
                                                        .map((item) => {
                                                            const isOverdue = item.status === 'danger';
                                                            const isCompleted = item.status === 'completed' || item.status === 'success';
                                                            const isInProgress = item.status === 'warning';
                                                            const isAtRisk = isOverdue;
                                                            const statusText = isCompleted ? 'Completed' : isOverdue ? 'Overdue' : isInProgress ? 'In Progress' : 'Not Started';
                                                            const completionValue = isCompleted ? '100%' : isOverdue ? '20%' : isInProgress ? '55%' : '0%';
                                                            const progressValue = isCompleted ? 100 : isOverdue ? 30 : isInProgress ? 60 : 15;
                                                            const dueText = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date';

                                                            return (
                                                                <article
                                                                    key={item.id}
                                                                    className="rounded-xl border border-[#EAEAEA] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
                                                                >
                                                                    <div className="p-4 sm:p-5">
                                                                        <div className="flex items-start justify-end gap-2 mb-3">
                                                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${isOverdue ? 'bg-rose-50 border-rose-200 text-[#9F1239]' : isCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : isInProgress ? 'bg-purple-50 border-purple-200 text-[#7C3AED]' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                                                                {statusText}
                                                                            </span>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(220px,1fr)_minmax(150px,0.9fr)] gap-4 md:gap-0 items-stretch">
                                                                            <div className="min-w-0 flex items-start gap-3 h-full md:pr-4 md:mr-4 md:border-r md:border-slate-200/60">
                                                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isAtRisk ? 'bg-rose-50/50' : 'bg-purple-500/10'}`}>
                                                                                    <FileText size={16} className={`${isAtRisk ? 'text-[#9F1239]' : 'text-[#7C3AED]'}`} />
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Assignment</p>
                                                                                    <h3 className="mt-1 text-base font-semibold tracking-tight text-slate-900 truncate">{item.title}</h3>
                                                                                    <p className="mt-1 text-sm text-slate-500 truncate">{item.className}</p>
                                                                                </div>
                                                                            </div>

                                                                            <div className="h-full md:pr-4 md:mr-4 md:border-r md:border-slate-200/60">
                                                                                <div className="h-full rounded-lg border border-[#EAEAEA] bg-slate-50/60 p-3 pl-2">
                                                                                    <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                                                                                        <div>
                                                                                            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Completion</p>
                                                                                            <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">{completionValue}</p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Score Goal</p>
                                                                                            <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">70%</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="mt-3">
                                                                                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                                                                            <div
                                                                                                className={`h-full transition-all ${isAtRisk ? 'bg-[#9F1239]' : 'bg-[#7C3AED]'}`}
                                                                                                style={{ width: `${progressValue}%` }}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Due Date</p>
                                                                                <p className="text-sm font-semibold text-slate-900 tabular-nums">{dueText}</p>
                                                                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Class</p>
                                                                                <p className={`text-sm font-semibold ${isAtRisk ? 'text-[#9F1239]' : 'text-slate-900'}`}>{item.className}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => navigate(`/play/${item.gamePackId || 'practice-general'}?attemptId=${item.attemptId}`)}
                                                                        className="w-full border-t border-[#EAEAEA] px-4 py-2.5 text-sm font-semibold tracking-tight text-slate-600 transition-all duration-200 hover:bg-slate-50/80 hover:text-slate-800 flex items-center justify-center"
                                                                    >
                                                                        {isCompleted ? 'View Assignment' : 'Submit Assignment'}
                                                                    </button>
                                                                </article>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </section>
                                    </div>
                                </div>
                            ) : activeTab === 'classes' ? (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h2 className="text-[22px] lg:text-[24px] font-semibold text-slate-900 tracking-tight">Manage Classes</h2>
                                                <p className="text-[14px] text-slate-500 mt-1">Join and manage your learning environments</p>
                                            </div>
                                            <button
                                                onClick={() => setShowJoinClass(true)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-[#68507B] hover:bg-[#523F62] text-white rounded-xl font-semibold text-[14px] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 flex-shrink-0"
                                            >
                                                <Plus size={18} /> Join New Class
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {loading ? (
                                                <div className="col-span-full">
                                                    <SectionSkeleton rows={3} />
                                                </div>
                                            ) : studentClasses.length === 0 ? (
                                                <div className="col-span-full py-12 bg-white rounded-2xl border border-[#EAE7DD] border-dashed">
                                                    <SectionEmpty
                                                        headline="No classes yet"
                                                        detail='You haven&apos;t joined any classes yet. Click "Join New Class" and enter your class code to get started.'
                                                    />
                                                </div>
                                            ) : (
                                                studentClasses.map(cls => (
                                                        <ClassSummaryCard
                                                            key={cls.id}
                                                            role="student"
                                                            name={cls.name}
                                                            subject={cls.subject || 'Mathematics'}
                                                            themeColor={cls.themeColor || 'purple'}
                                                            playfulBackground={cls.playfulBackground ?? true}
                                                            onEnter={() => navigate(isDemo ? `/student/demo/class/${cls.id}` : `/student/class/${cls.id}`)}
                                                        metaPrimaryNode={
                                                            <div className="flex flex-col gap-2.5">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-full bg-[#FDFBF5] flex items-center justify-center text-[12px] font-semibold text-[#68507B] border border-[#EAE7DD] shrink-0">
                                                                        {cls.teacherName.charAt(0)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Teacher</p>
                                                                        <p className="text-[13px] font-semibold text-slate-700 truncate leading-none">{cls.teacherName}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                                                                    <div className="flex items-center gap-2 text-slate-500">
                                                                        <Calendar size={14} />
                                                                        <span className="text-[11px] font-semibold uppercase tracking-wider">Joined</span>
                                                                    </div>
                                                                    <span className="text-[12px] font-semibold text-[#68507B]">
                                                                        {new Date(cls.enrolledAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        }
                                                        metaSecondaryNode={
                                                            <div className="flex items-center gap-2 text-[#68507B] font-semibold text-[12px]">
                                                                <Trophy size={14} className="text-yellow-500" />
                                                                <span>On track</span>
                                                            </div>
                                                        }
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="h-8"></div>
                        </div>
                    </div>
                </main>
            </div>

            {/* DETAIL MODAL */}
            {
                selectedGamePack && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md">
                                            {selectedGamePack.subject}
                                        </span>
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md">
                                            {selectedGamePack.tag}
                                        </span>
                                    </div>
                                    <h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
                                        {selectedGamePack.title}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedGamePack(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                                    <p className="text-[14px] text-slate-700 leading-relaxed">
                                        {selectedGamePack.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[12px] font-medium text-slate-500 mb-1">Progress</p>
                                        <p className="text-[18px] font-semibold text-slate-900">{selectedGamePack.progress}%</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[12px] font-medium text-slate-500 mb-1">Last Score</p>
                                        <p className="text-[18px] font-semibold text-slate-900">{selectedGamePack.score}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedGamePack(null)}
                                    className="px-4 py-2 text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedGamePack(null);
                                        if (selectedGamePack.id === 'rec-1') {
                                            navigate('/play/algebra-basics');
                                        } else if (selectedGamePack.title === 'Fractions Quest') {
                                            navigate('/play/demo-game-1');
                                        } else if (selectedGamePack.packId) {
                                            navigate(`/play/${selectedGamePack.packId}`);
                                        }
                                    }}
                                    className="px-5 py-2 bg-[#68507B] hover:bg-[#5a456a] text-white rounded-lg text-[14px] font-medium transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    {selectedGamePack.progress === 100 ? 'Review' : selectedGamePack.progress > 0 ? 'Resume' : 'Start'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* JOIN CLASS MODAL */}
            {
                showJoinClass && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Join a Class</h2>
                                    <p className="text-[13px] text-slate-500 mt-1">Ask your teacher for the class join code.</p>
                                </div>
                                <button
                                    onClick={() => setShowJoinClass(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleJoinClass}>
                                <div className="p-6 space-y-4">
                                    {joinError && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-sm">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <p>{joinError}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label htmlFor="joinCode" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Join Code
                                        </label>
                                        <input
                                            id="joinCode"
                                            type="text"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#68507B] focus:ring-2 focus:ring-[#68507B]/20 outline-none transition-all font-mono text-center text-lg tracking-widest uppercase"
                                            placeholder="e.g. X7B9Q2M"
                                            maxLength={8}
                                            autoFocus
                                            required
                                            disabled={joiningClass}
                                        />
                                    </div>
                                </div>
                                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowJoinClass(false)}
                                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                                        disabled={joiningClass}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-6 py-2 bg-[#68507B] hover:bg-[#5a456a] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-75 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                                        disabled={joiningClass || !joinCode.trim()}
                                    >
                                        {joiningClass ? 'Joining...' : 'Join Class'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* UNREAD NUDGE TOAST */}
            {nudges.some(n => !n.read) && (() => {
                const unreadNudge = nudges.find(n => !n.read)!;
                return (
                    <div className="fixed bottom-6 right-6 bg-white border border-[#68507B]/20 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl p-4 w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                                <Heart className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[14px] font-semibold text-slate-900">Message from your parent</h4>
                                <p className="text-[13px] text-slate-600 mt-1">{unreadNudge.message}</p>
                            </div>
                            <button onClick={() => handleMarkNudgeRead(unreadNudge.id)} className="text-slate-400 hover:text-slate-600 p-1 -mt-1 -mr-1 rounded-full bg-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
}


