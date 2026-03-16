import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    Gamepad2,
    FileText,
    BarChart2,
    Settings,
    Bell,
    Search,
    ChevronRight,
    Play,
    RotateCcw,
    ListTodo,
    TrendingUp,
    Clock,
    AlertCircle,
    CheckCircle2,
    X,
    Lightbulb,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut,
    Zap,
    Inbox,
    MessageCircle,
    Heart,
    Target
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/dataService';
import { useNavigate } from 'react-router-dom';
import { getStudentSuggestion, StudentSuggestion } from '../services/studentSuggestionService';



interface SidebarItemProps {
    icon: any;
    label: string;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
}

// Shared empty-state helper
const SectionEmpty = ({ headline, detail }: { headline: string; detail?: string }) => (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Inbox size={28} className="text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">{headline}</p>
        {detail && <p className="text-xs text-slate-400 max-w-xs">{detail}</p>}
    </div>
);

// --- COMPONENTS ---

export default function StudentDashboardPage() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [gamePackFilter, setGamePackFilter] = useState('All');

    const [selectedGamePack, setSelectedGamePack] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'assignments'>('dashboard');
    const [activeClassFilter, setActiveClassFilter] = useState<string | null>(null);

    const handleClassClick = (className: string) => {
        setActiveClassFilter(className);
        setActiveTab('assignments');
        setTimeout(() => {
            document.getElementById('assignments-section')?.scrollIntoView({ behavior: 'smooth' });
            // Add a temporary highlight class to Assignments section
            const el = document.getElementById('assignments-section');
            if (el) {
                el.classList.add('ring-2', 'ring-[#68507B]', 'ring-offset-2', 'rounded-xl', 'transition-all', 'duration-500');
                setTimeout(() => {
                    el.classList.remove('ring-2', 'ring-[#68507B]', 'ring-offset-2', 'rounded-xl');
                }, 1500);
            }
        }, 100);
    };

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

    // Notifications state
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // --- Real Data State ---
    const [assignments, setAssignments] = useState<dataService.StudentAssignment[]>([]);
    const [recentPerformance, setRecentPerformance] = useState<{ scores: { score: number; date: string }[]; weakTopics: string[] } | null>(null);
    const [gameSessions, setGameSessions] = useState<dataService.GameSession[]>([]);
    const [streakData, setStreakData] = useState<dataService.StudentStreak | null>(null);
    const [nudges, setNudges] = useState<dataService.ParentNudge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [studentData, sessions, streak, nudgesData] = await Promise.all([
                    dataService.getStudentAssignments(),
                    dataService.getStudentGameSessions(),
                    dataService.getStudentStreak(),
                    dataService.getStudentNudges()
                ]);
                setAssignments(studentData.assignments);
                setRecentPerformance(studentData.recentPerformance);
                setGameSessions(sessions);
                setStreakData(streak);
                setNudges(nudgesData);
            } catch (err: any) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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

    const handleJoinClass = async (e: React.FormEvent) => {
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
    };

    const handleMarkNudgeRead = async (id: string) => {
        try {
            await dataService.markNudgeAsRead(id);
            setNudges(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Failed to mark nudge as read", error);
        }
    };

    const studentName = currentUser?.name || 'Student';
    const studentInitial = studentName.charAt(0).toUpperCase();

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
        { id: 1, label: 'Overdue assignments', value: overdueAssignments.length.toString(), icon: AlertCircle, color: 'text-red-500' },
        { id: 2, label: 'Due soon', value: dueSoonAssignments.length.toString(), icon: Clock, color: 'text-orange-500' },
        { id: 3, label: 'Completed', value: completedAssignments.length.toString(), icon: CheckCircle2, color: 'text-emerald-500' },
        { id: 4, label: 'Average recent score', value: avgRecentScore !== null ? `${avgRecentScore}%` : 'N/A', icon: TrendingUp, color: 'text-[#68507B]' },
    ];

    // Notification items unification
    const notifications = [
        ...nudges.filter(n => !n.read).map(n => ({
            id: `nudge-${n.id}`,
            title: 'Message from your parent',
            message: n.message,
            time: new Date(n.createdAt).toLocaleDateString(),
            type: 'message' as const,
            action: () => { 
                handleMarkNudgeRead(n.id); 
                setIsNotificationOpen(false); 
            }
        })),
        ...overdueAssignments.map(a => ({
            id: `overdue-${a.id}`,
            title: 'Overdue Assignment',
            message: a.title,
            time: a.dueDate ? `Due ${new Date(a.dueDate).toLocaleDateString()}` : 'Now',
            type: 'alert' as const,
            action: () => { 
                navigate(`/play/${(a as any).gamePackId || 'practice-general'}?attemptId=${(a as any).attemptId}`); 
                setIsNotificationOpen(false); 
            }
        }))
    ];


    // Map assignments to "Upcoming items" for the right column
    const upcomingItems = pendingAssignments.slice(0, 4).map(asgn => ({
        id: asgn.id,
        title: asgn.title,
        subjectClass: asgn.className,
        dueDate: asgn.statusLabel || (asgn.dueDate ? `Due ${new Date(asgn.dueDate).toLocaleDateString()}` : 'No due date'),
        status: asgn.status === 'danger' ? 'Overdue' : asgn.status === 'warning' ? 'Due soon' : 'On track',
        originalClassStatus: asgn.status,
        gamePackId: (asgn as any).gamePackId,
        attemptId: (asgn as any).attemptId,
    }));

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
            title: 'E-Maths: Algebra Practice',
            subject: 'Maths',
            tag: 'Recommended',
            lastPlayed: 'Never',
            progress: 0,
            status: 'Recommended',
            score: 'N/A',
            description: 'A recommended practice set based on your curriculum.'
        }] : [])
    ];

    const filteredGamePacks = displayGamePacks.filter(gp =>
        gamePackFilter === 'All' ? true : gp.status === gamePackFilter
    );

    return (
        <div className="flex h-screen bg-[#FDFBF5] font-sans text-slate-900 overflow-hidden">

            {/* SIDEBAR */}
            <aside className={`bg-[#68507B] text-white flex flex-col hidden md:flex shrink-0 transition-[width] duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className={`p-6 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">E</div>
                        {isSidebarOpen && <span className="text-xl font-bold tracking-tight whitespace-nowrap">Elora</span>}
                    </div>
                    {isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="text-white/50 hover:text-white transition-colors"
                            title="Close sidebar"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-hidden">
                    <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === 'dashboard'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('dashboard')} />
                    <SidebarItem icon={BookOpen} label="My Classes" collapsed={!isSidebarOpen} />
                    <SidebarItem icon={Gamepad2} label="My GamePacks" collapsed={!isSidebarOpen} />
                    <SidebarItem icon={FileText} label="Assignments & Quizzes" active={activeTab === 'assignments'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('assignments')} />
                    <SidebarItem icon={BarChart2} label="Reports" collapsed={!isSidebarOpen} />
                </nav>

                <div className="p-4 flex flex-col gap-1">
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="flex items-center justify-center w-full p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
                            title="Open sidebar"
                        >
                            <PanelLeftOpen className="w-5 h-5" />
                        </button>
                    )}
                    <SidebarItem icon={Settings} label="Settings" collapsed={!isSidebarOpen} />
                    <button
                        onClick={logout}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors text-white/70 hover:bg-red-500/20 hover:text-white ${!isSidebarOpen ? 'justify-center' : ''}`}
                        title={!isSidebarOpen ? "Sign out" : undefined}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* HEADER */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-[15px] font-medium text-slate-800 hidden sm:block">
                            Sec 3 Express – E-Maths
                        </h2>
                        {focusChipText && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#68507B]/10 text-[#68507B] rounded-full text-[12px] font-semibold">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Focus: {focusChipText}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-slate-400 hover:text-slate-600" title="Search">
                            <Search className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <button 
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="text-slate-400 hover:text-slate-600 p-1 relative transition-colors" 
                                title="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                        <h3 className="text-[14px] font-semibold text-slate-900">Notifications</h3>
                                        <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                                            {notifications.length} new
                                        </span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                                        {notifications.map(notif => (
                                            <button 
                                                key={notif.id}
                                                onClick={notif.action}
                                                className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start gap-3"
                                            >
                                                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'message' ? 'bg-pink-100 text-pink-600' : 'bg-red-100 text-red-600'}`}>
                                                    {notif.type === 'message' ? <MessageCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <h4 className="text-[13px] font-semibold text-slate-900">{notif.title}</h4>
                                                    <p className="text-[13px] text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                                                    <p className="text-[11px] text-slate-400 mt-1">{notif.time}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {notifications.length === 0 && (
                                            <div className="p-6 text-center text-slate-500">
                                                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                                <p className="text-[13px]">You're all caught up!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-px h-6 bg-slate-200 mx-2"></div>
                        <div className="flex items-center gap-3 cursor-pointer">
                            <div className="text-right hidden sm:block">
                                <div className="text-[13px] font-semibold text-slate-900">{studentName}</div>
                                <div className="text-[11px] text-slate-500">Student</div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-[#68507B] text-white flex items-center justify-center text-sm font-bold">
                                {studentInitial}
                            </div>
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE CANVAS */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* WELCOME & QUICK ACTIONS */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-[24px] lg:text-[26px] font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                                    Hi, {studentName} <span className="text-2xl">👋</span>
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {(streakData?.streakWeeks ?? 0) >= 1 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200/60 rounded-full text-[13px] font-medium">
                                            <span>🔥</span>
                                            {streakData!.streakWeeks}-week streak — keep the momentum!
                                        </div>
                                    )}

                                    {(streakData?.streakWeeks === 0 && gameSessions.length === 0) && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200/60 rounded-full text-[13px] font-medium">
                                            Complete your first quiz to start seeing your progress.
                                        </div>
                                    )}

                                    {streakData && streakData.scoreThisWeek !== null && streakData.scorePriorWeek !== null && (
                                        <div className={`flex items-center gap-1.5 px-3 py-1 ${streakData.trend === 'up' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : streakData.trend === 'down' ? 'bg-orange-50 text-orange-700 border border-orange-200/60' : 'bg-slate-100 text-slate-600 border border-slate-200/60'} rounded-full text-[13px] font-medium`}>
                                            <BarChart2 className="w-3.5 h-3.5" />
                                            Avg score: {streakData.scoreThisWeek}%
                                            <span className="opacity-75 relative -top-[1px] ml-1">
                                                {streakData.trend === 'up' ? (
                                                    `↑ +${streakData.scoreThisWeek - streakData.scorePriorWeek}%`
                                                ) : streakData.trend === 'down' ? (
                                                    `↓ ${streakData.scoreThisWeek - streakData.scorePriorWeek}%`
                                                ) : (
                                                    '— Flat'
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    {gameSessions.length > 0 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200/60 rounded-full text-[13px] font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {gameSessions.length} {gameSessions.length === 1 ? 'quiz' : 'quizzes'} completed
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => navigate('/play/practice-general')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#68507B] hover:bg-[#5a456a] text-white rounded-lg text-[14px] font-medium transition-colors shadow-sm"
                                >
                                    <Play className="w-4 h-4" />
                                    Quick Practice
                                </button>
                                <button
                                    onClick={() => setShowJoinClass(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-[#68507B] hover:text-[#68507B] text-slate-700 rounded-lg text-[14px] font-medium transition-colors shadow-sm"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Join Class
                                </button>
                                <button
                                    onClick={() => setActiveTab('assignments')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-[#68507B] hover:text-[#68507B] text-slate-700 rounded-lg text-[14px] font-medium transition-colors shadow-sm"
                                >
                                    <ListTodo className="w-4 h-4" />
                                    View Assignments
                                </button>
                            </div>
                        </div>

                        {/* ── ASK ELORA CARD ─────────── */}
                        {activeTab === 'dashboard' && (
                            <div className="mb-4 p-4 sm:px-5 sm:py-4 bg-[#F7F5F0] border border-slate-200 rounded-2xl shadow-sm">
                                {(eloraStatus === 'idle' || eloraStatus === 'loading') && (
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <div className="w-4 h-4 rounded-full border-2 border-[#68507B]/20 border-t-[#68507B] animate-spin"></div>
                                        Preparing Elora's guidance...
                                    </div>
                                )}
                                {eloraStatus === 'error' && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                                Couldn't load suggestion
                                            </span>
                                            <span className="text-sm text-slate-500">Wait a moment and try asking Elora again.</span>
                                        </div>
                                        <button onClick={() => fetchEloraSuggestionRef.current?.()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                                            Try again
                                        </button>
                                    </div>
                                )}
                                {eloraStatus === 'success' && eloraSuggestion && (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-1 sm:gap-2">
                                            <div className="flex items-center gap-1.5 mb-1 sm:mb-0 mr-2 text-[11px] font-medium text-slate-400 shrink-0">
                                                <Target size={12} className="text-slate-400" />
                                                <span>Elora's suggestion</span>
                                            </div>
                                            <span className="text-[14px] font-medium text-slate-900">
                                                {eloraSuggestion.title}
                                            </span>
                                            <span className="text-[13px] text-slate-500 leading-relaxed sm:ml-auto max-w-sm sm:text-right">
                                                {eloraSuggestion.body}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-2 sm:mt-0 sm:ml-3 flex items-center gap-2 shrink-0">
                                            {eloraSuggestion.suggestedPackId && (
                                                <button
                                                    onClick={() => navigate(`/play/${eloraSuggestion.suggestedPackId}`)}
                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#68507B] hover:bg-[#5a456a] text-white text-[13px] font-medium rounded-xl transition-colors shadow-sm"
                                                >
                                                    <Play size={13} />
                                                    Start practice
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setEloraStatus('loading');
                                                    fetchEloraSuggestionRef.current?.();
                                                }}
                                                className="p-2 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                                                title="Ask again"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── NEXT STEPS STRIP ───────────────────────────── */}
                        {activeTab === 'dashboard' && (
                            <NextStepsStrip recs={nextSteps} onNavigate={navigate} />
                        )}

                        {activeTab === 'dashboard' ? (
                            <>

                                {/* SUMMARY TILES */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {summaryStats.map(stat => (
                                        <div key={stat.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                                            <div className={`p-3 bg-slate-50 ${stat.color} rounded-lg`}>
                                                <stat.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-medium text-slate-500">{stat.label}</p>
                                                <p className="text-2xl font-semibold text-slate-900 mt-1">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* TWO COLUMN LAYOUT */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                    {/* LEFT COLUMN (Wider) */}
                                    <div className="lg:col-span-2 space-y-8">

                                        {/* PARENT NUDGES STRIP */}
                                        {nudges.length > 0 && (
                                            <section>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900">Messages from your parent</h2>
                                                </div>
                                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                                                    {nudges.map(nudge => (
                                                        <div key={nudge.id} className={`p-4 ${!nudge.read ? 'bg-pink-50/30' : 'bg-white'}`}>
                                                            <div className="flex items-start gap-3">
                                                                <div className={`p-2 rounded-lg shrink-0 ${!nudge.read ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                    <MessageCircle className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className={`text-[14px] ${!nudge.read ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                                                                        {nudge.message}
                                                                    </p>
                                                                    <p className="text-[12px] text-slate-400 mt-1">
                                                                        {new Date(nudge.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                {!nudge.read && (
                                                                    <button
                                                                        onClick={() => handleMarkNudgeRead(nudge.id)}
                                                                        className="text-[12px] font-medium text-[#68507B] hover:text-[#5a456a]"
                                                                    >
                                                                        Mark as read
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* MY GAMEPACKS */}
                                        <section>
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900">My GamePacks & Practice</h2>
                                                <div className="flex items-center bg-slate-100 p-1 rounded-lg overflow-x-auto">
                                                    {['All', 'In progress', 'Completed', 'Recommended'].map(filter => (
                                                        <button
                                                            key={filter}
                                                            onClick={() => setGamePackFilter(filter)}
                                                            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors whitespace-nowrap ${gamePackFilter === filter
                                                                ? 'bg-white text-slate-900 shadow-sm'
                                                                : 'text-slate-500 hover:text-slate-700'
                                                                }`}
                                                        >
                                                            {filter}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-slate-200 bg-slate-50/50">
                                                                <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Name / Topic</th>
                                                                <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                                                                <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Last Played</th>
                                                                <th className="px-5 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {filteredGamePacks.map(gp => (
                                                                <tr
                                                                    key={gp.id}
                                                                    onClick={() => setSelectedGamePack(gp)}
                                                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                                                >
                                                                    <td className="px-5 py-4">
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[14px] font-medium text-slate-900 group-hover:text-[#68507B] transition-colors">{gp.title}</span>
                                                                            <span className="inline-block w-fit px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md">
                                                                                {gp.tag}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-4 text-[14px] text-slate-600">{gp.subject}</td>
                                                                    <td className="px-5 py-4 text-[14px] text-slate-600 flex items-center gap-1.5">
                                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                        {gp.lastPlayed}
                                                                    </td>
                                                                    <td className="px-5 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                                                                <div
                                                                                    className={`h-full rounded-full ${gp.progress === 100 ? 'bg-emerald-500' : 'bg-[#68507B]'}`}
                                                                                    style={{ width: `${gp.progress}%` }}
                                                                                ></div>
                                                                            </div>
                                                                            <span className="text-[13px] font-medium text-slate-700 w-9">{gp.progress}%</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {filteredGamePacks.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={4} className="px-5 py-8 text-center text-slate-500 text-[14px]">
                                                                        No sessions recorded yet.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </section>

                                        {/* PERFORMANCE OVERVIEW */}
                                        <section>
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900">My performance overview</h2>
                                                <span className="text-[13px] text-slate-500">
                                                    {(streakData?.weeklyScores?.length ?? 0) > 0
                                                        ? `Last ${(streakData?.weeklyScores?.length ?? 0)} week${(streakData?.weeklyScores?.length ?? 0) !== 1 ? 's' : ''}`
                                                        : 'No recent data'}
                                                </span>
                                            </div>

                                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                                                {(streakData?.weeklyScores?.length ?? 0) > 0 ? (
                                                    <div className="h-48 w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart
                                                                data={streakData!.weeklyScores.map((s, i) => {
                                                                    // Determine color based on trend compared to previous week
                                                                    let fill = '#94A3B8'; // default slate-400
                                                                    if (i > 0) {
                                                                        const diff = s.avgAccuracy - streakData!.weeklyScores[i - 1].avgAccuracy;
                                                                        if (diff > 3) fill = '#10B981'; // green if up
                                                                        else if (diff < -3) fill = '#F59E0B'; // amber if down
                                                                    }
                                                                    return {
                                                                        name: s.weekLabel.replace('W/C ', ''), // shorter label
                                                                        score: s.avgAccuracy,
                                                                        fill
                                                                    };
                                                                })}
                                                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                                <XAxis
                                                                    dataKey="name"
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tick={{ fontSize: 12, fill: '#64748B' }}
                                                                    dy={10}
                                                                />
                                                                <YAxis
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tick={{ fontSize: 12, fill: '#64748B' }}
                                                                    domain={[0, 100]}
                                                                    ticks={[0, 50, 100]}
                                                                />
                                                                <Tooltip
                                                                    cursor={{ fill: '#F1F5F9' }}
                                                                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                    formatter={(value: any) => [`${value}%`, 'Avg Score']}
                                                                />
                                                                <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                                                    {streakData!.weeklyScores.map((entry, index) => {
                                                                        // Color logic: if this week is > previous week = green. If < previous = orange. Else gray.
                                                                        let fillColor = '#CBD5E1'; // light slate for default
                                                                        if (index > 0) {
                                                                            const diff = entry.avgAccuracy - streakData!.weeklyScores[index - 1].avgAccuracy;
                                                                            if (diff >= 3) fillColor = '#34D399'; // emerald-400
                                                                            else if (diff <= -3) fillColor = '#FBBF24'; // orange-400
                                                                        } else {
                                                                            // first week is baseline, color it slate-300
                                                                            fillColor = '#CBD5E1';
                                                                        }
                                                                        return <Cell key={`cell-${index}`} fill={fillColor} />;
                                                                    })}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : (
                                                    <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                                                        <BarChart2 className="w-12 h-12 text-slate-200 mb-3" />
                                                        <p className="text-[14px] font-medium text-slate-500">No weekly data yet</p>
                                                        <p className="text-[13px] mt-1">Complete activities weekly to build a trend.</p>
                                                    </div>
                                                )}

                                                <div className="mt-6 pt-6 border-t border-slate-100">
                                                    <h3 className="text-[14px] font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4 text-orange-500" />
                                                        Weak topics to review
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(recentPerformance?.weakTopics || []).length > 0 ? (
                                                            recentPerformance!.weakTopics.map((topic, i) => (
                                                                <span key={i} className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200/60 rounded-md text-[13px] font-medium">
                                                                    {topic}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[13px] text-slate-500 italic">No weak topics identified yet. Great job!</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                    </div>

                                    {/* RIGHT COLUMN (Narrower) */}
                                    <div className="space-y-8">

                                        {/* UPCOMING ASSIGNMENTS */}
                                        <section>
                                            <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900 mb-4">Upcoming assignments & quizzes</h2>
                                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                                <div className="divide-y divide-slate-100">
                                                    {upcomingItems.map(item => {
                                                        let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
                                                        let icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;

                                                        if (item.status === 'Due soon') {
                                                            statusColor = 'bg-orange-50 text-orange-700 border-orange-200/60';
                                                            icon = <Clock className="w-4 h-4 text-orange-500" />;
                                                        } else if (item.status === 'Overdue') {
                                                            statusColor = 'bg-red-50 text-red-700 border-red-200/60';
                                                            icon = <AlertCircle className="w-4 h-4 text-red-500" />;
                                                        }

                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                                                onClick={() => navigate(`/play/${(item as any).gamePackId || 'practice-general'}${(item as any).attemptId ? `?attemptId=${(item as any).attemptId}` : ''}`)}
                                                            >
                                                                <div className="flex justify-between items-start gap-3">
                                                                    <div>
                                                                        <h3 className="text-[14px] font-semibold text-slate-900 leading-tight">{item.title}</h3>
                                                                        <p className="text-[13px] text-slate-500 mt-1">{item.subjectClass}</p>
                                                                        <div className="flex items-center gap-1.5 mt-2.5">
                                                                            {icon}
                                                                            <span className="text-[12px] font-medium text-slate-600">{item.dueDate}</span>
                                                                        </div>
                                                                    </div>
                                                                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap ${statusColor}`}>
                                                                        {item.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {upcomingItems.length === 0 && (
                                                        <SectionEmpty
                                                            headline="No upcoming assignments"
                                                            detail="Your teacher's assignments will appear here when they're due."
                                                        />
                                                    )}
                                                </div>
                                                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center flex flex-col items-center">
                                                    <button
                                                        onClick={() => setActiveTab('assignments')}
                                                        className="text-[13px] font-medium text-[#68507B] hover:text-[#5a456a] transition-colors mb-2">
                                                        View all tasks
                                                    </button>
                                                </div>
                                            </div>

                                            {/* PATTERN C: Weekly Goal Widget (Optional) */}
                                            {upcomingItems.length === 0 && (streakData?.streakWeeks ?? 0) >= 1 && (
                                                <div className="mt-4 bg-gradient-to-br from-[#68507B] to-[#5a456a] rounded-xl shadow-sm p-5 text-white relative overflow-hidden">
                                                    <div className="relative z-10 flex flex-col items-start">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xl">🔥</span>
                                                            <h3 className="text-[15px] font-bold tracking-tight">Weekly goal</h3>
                                                        </div>
                                                        <p className="text-[13px] text-white/90 leading-relaxed mb-4">
                                                            You have no assignments due, but you can still keep your <strong>{streakData!.streakWeeks}-week streak</strong> alive!
                                                        </p>
                                                        <button
                                                            onClick={() => setActiveTab('practice')}
                                                            className="px-4 py-2 bg-white text-[#68507B] rounded-lg text-[13px] font-bold shadow-sm hover:bg-slate-50 transition-colors"
                                                        >
                                                            Play a GamePack
                                                        </button>
                                                    </div>
                                                    {/* Decorative circle */}
                                                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                                </div>
                                            )}
                                        </section>

                                        {/* MY CLASSES */}
                                        <section>
                                            <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900 mb-4">My classes</h2>
                                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3">
                                                <div 
                                                    onClick={() => handleClassClick('Sec 3 Express – E-Maths')}
                                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-[#68507B]/5 hover:border-[#68507B]/20 hover:shadow-sm transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-[#68507B]/10 text-[#68507B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                        <BookOpen className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-[14px] font-semibold text-slate-900 group-hover:text-[#68507B] transition-colors">Sec 3 Express – E-Maths</h4>
                                                        <p className="text-[13px] text-slate-500">Mr. Tan • 35 students</p>
                                                    </div>
                                                    {pendingAssignments.filter(a => a.className === 'Sec 3 Express – E-Maths').length > 0 && (
                                                        <div className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200/60 rounded-md text-[11px] font-semibold shadow-sm">
                                                            {pendingAssignments.filter(a => a.className === 'Sec 3 Express – E-Maths').length} assignment{pendingAssignments.filter(a => a.className === 'Sec 3 Express – E-Maths').length !== 1 ? 's' : ''} due
                                                        </div>
                                                    )}
                                                </div>
                                                <div 
                                                    onClick={() => handleClassClick('Sec 3 Express – Biology')}
                                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-200 hover:shadow-sm transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                        <BookOpen className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-[14px] font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">Sec 3 Express – Biology</h4>
                                                        <p className="text-[13px] text-slate-500">Ms. Lee • 32 students</p>
                                                    </div>
                                                    {pendingAssignments.filter(a => a.className === 'Sec 3 Express – Biology').length > 0 && (
                                                        <div className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200/60 rounded-md text-[11px] font-semibold shadow-sm">
                                                            {pendingAssignments.filter(a => a.className === 'Sec 3 Express – Biology').length} assignment{pendingAssignments.filter(a => a.className === 'Sec 3 Express – Biology').length !== 1 ? 's' : ''} due
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </section>

                                        {/* COACH'S NOTES */}
                                        <section>
                                            <h2 className="text-[18px] lg:text-[20px] font-semibold text-slate-900 mb-4">Coach's notes</h2>
                                            <div className="bg-[#F7F5F0] border border-slate-200 rounded-xl shadow-sm p-5 relative overflow-hidden">
                                                <div className="relative z-10 space-y-3">
                                                    {(recentPerformance?.weakTopics?.length ?? 0) > 0 ? (
                                                        recentPerformance!.weakTopics.slice(0, 2).map((topic, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => navigate('/play/practice-general')}
                                                                className="flex items-start gap-3 text-left w-full group p-3 bg-[#68507B]/5 rounded-lg border border-[#68507B]/10 hover:bg-[#68507B]/10 transition-colors"
                                                            >
                                                                <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm text-[#68507B] group-hover:scale-105 transition-transform">
                                                                    <Target className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-[14px] font-semibold text-slate-900 group-hover:text-[#68507B] transition-colors">
                                                                        Review: {topic}
                                                                    </h4>
                                                                    <p className="text-[13px] text-slate-600 mt-0.5 leading-relaxed">
                                                                        You've been getting this wrong recently. Tap to practise now.
                                                                    </p>
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-slate-400 self-center" />
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                            <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm text-emerald-500">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[14px] font-semibold text-slate-900">Looking great!</h4>
                                                                <p className="text-[13px] text-slate-700 mt-0.5 leading-relaxed">
                                                                    No weak areas detected yet. Keep completing assignments to get personalised tips here.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </section>

                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6" id="assignments-section">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[20px] font-semibold text-slate-900 tracking-tight">Assignments & Quizzes</h2>
                                    {activeClassFilter && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] text-slate-500 font-medium">Filtered by:</span>
                                            <span className="px-3 py-1 bg-[#68507B]/10 text-[#68507B] rounded-full text-[13px] font-semibold border border-[#68507B]/20 flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
                                                <BookOpen className="w-4 h-4" />
                                                {activeClassFilter}
                                                <button onClick={() => setActiveClassFilter(null)} className="ml-1 p-0.5 hover:bg-[#68507B]/20 rounded-full transition-colors flex items-center justify-center">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* TO-DO LIST */}
                                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                                <ListTodo className="w-5 h-5 text-[#68507B]" />
                                                To-Do List
                                            </h3>
                                        </div>
                                        <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2">
                                            {normalisedAssignments.filter(a => a.status !== 'completed' && a.status !== 'success' && (!activeClassFilter || a.className === activeClassFilter)).map(item => {
                                                let statusColor = 'bg-slate-50 text-slate-700 border-slate-200/60';
                                                let icon = <Clock className="w-4 h-4 text-slate-500" />;

                                                if (item.status === 'warning') {
                                                    statusColor = 'bg-orange-50 text-orange-700 border-orange-200/60';
                                                    icon = <Clock className="w-4 h-4 text-orange-500" />;
                                                } else if (item.status === 'danger') {
                                                    statusColor = 'bg-red-50 text-red-700 border-red-200/60';
                                                    icon = <AlertCircle className="w-4 h-4 text-red-500" />;
                                                }

                                                return (
                                                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer rounded-xl mb-2 border border-transparent hover:border-slate-200">
                                                        <div className="flex justify-between items-start gap-3">
                                                            <div>
                                                                <h4 className="text-[14px] font-semibold text-slate-900 leading-tight">{item.title}</h4>
                                                                <p className="text-[13px] text-slate-500 mt-1">{item.className}</p>
                                                                <div className="flex items-center gap-1.5 mt-2.5">
                                                                    {icon}
                                                                    <span className="text-[12px] font-medium text-slate-600">{item.statusLabel || `Due ${new Date(item.dueDate).toLocaleDateString()}`}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap ${statusColor}`}>
                                                                    {item.status === 'danger' ? 'Overdue' : item.status === 'warning' ? 'Due soon' : 'In Progress'}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/play/${item.gamePackId || 'practice-general'}?attemptId=${item.attemptId}`);
                                                                    }}
                                                                    className="px-3 py-1.5 bg-[#68507B] text-white rounded-lg text-[12px] font-medium hover:bg-[#5a456a] transition-colors"
                                                                >
                                                                    Start
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {normalisedAssignments.filter(a => a.status !== 'completed' && a.status !== 'success' && (!activeClassFilter || a.className === activeClassFilter)).length === 0 && (
                                                <div className="p-8 text-center text-slate-500 text-[14px] flex flex-col items-center justify-center h-full">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                                    </div>
                                                    <p className="font-medium text-slate-900 text-lg">You're all caught up!</p>
                                                    <p className="mt-1">{activeClassFilter ? `No pending assignments for ${activeClassFilter}.` : 'No pending assignments.'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* HISTORY */}
                                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                Completed & History
                                            </h3>
                                        </div>
                                        <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2">
                                            {normalisedAssignments.filter(a => (a.status === 'completed' || a.status === 'success') && (!activeClassFilter || a.className === activeClassFilter)).map(item => (
                                                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors w-full rounded-xl mb-2 border border-transparent hover:border-slate-200">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div>
                                                            <h4 className="text-[14px] font-semibold text-slate-700 leading-tight">{item.title}</h4>
                                                            <p className="text-[13px] text-slate-500 mt-1">{item.className}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="px-2.5 py-1 text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-md text-[11px] font-semibold whitespace-nowrap">
                                                                    Score: {item.bestScore !== null && item.bestScore !== undefined ? `${item.bestScore}%` : 'Completed'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            {/* Review feature for past assignments requires backend changes (like returning gameSessionId or fetching a session by attemptId). For now, it's disabled. */}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {normalisedAssignments.filter(a => (a.status === 'completed' || a.status === 'success') && (!activeClassFilter || a.className === activeClassFilter)).length === 0 && (
                                                <div className="p-8 text-center text-slate-500 text-[14px] flex flex-col items-center justify-center h-full">
                                                    <Clock className="w-12 h-12 text-slate-200 mb-3" />
                                                    {activeClassFilter ? `No completed assignments for ${activeClassFilter} yet.` : 'No completed assignments yet.'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bottom padding */}
                        <div className="h-8"></div>
                    </div>
                </main>
            </div >

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
                                    className="px-5 py-2 bg-[#68507B] hover:bg-[#5a456a] text-white rounded-lg text-[14px] font-medium transition-colors shadow-sm flex items-center gap-2"
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
                                    <h2 className="text-xl font-bold text-slate-900">Join a Class</h2>
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
                                        className="flex items-center gap-2 px-6 py-2 bg-[#68507B] hover:bg-[#5a456a] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-75 shadow-sm"
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
                    <div className="fixed bottom-6 right-6 bg-white border border-[#68507B]/20 shadow-xl rounded-xl p-4 w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
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

        </div >
    );
}



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
                <h2 className="text-[15px] font-semibold text-slate-800">Next Steps</h2>
                <span className="text-[12px] text-slate-400 font-normal ml-1">— personalised for you</span>
            </div>
            {recs.length === 0 ? (
                <div className="bg-[#F7F5F0] border border-slate-200 rounded-xl px-5 py-4 text-[14px] text-slate-500 flex items-center gap-3 shadow-sm">
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

function SidebarItem({ icon: Icon, label, active, collapsed, onClick }: SidebarItemProps) {
    return (
        <a
            href="#"
            onClick={(e) => {
                if (onClick) {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${active
                ? 'bg-white/10 text-white'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? label : undefined}
        >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
        </a>
    );
}
