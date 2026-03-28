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
    MessageCircle
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
import { useNavigate, Link } from 'react-router-dom';
import { getStudentSuggestion, StudentSuggestion } from '../services/studentSuggestionService';
import EloraAssistantCard from '../components/EloraAssistantCard';
import { NotificationsPopover, PopoverNotificationItem } from '../components/NotificationsPopover';
import { useNotifications } from '../hooks/useNotifications';
import { getNotificationDefaultDestination } from '../utils/notificationUi';
import { EloraLogo } from '../components/EloraLogo';
import { SectionSkeleton, SectionEmpty, SectionError } from '../components/ui/SectionStates';
import { DashboardTour } from '../components/DashboardTour';
import { useDemoMode } from '../hooks/useDemoMode';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import { getRoleSidebarTheme, type RoleSidebarTheme } from '../lib/roleTheme';
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

export default function StudentDashboardPage() {
    const { currentUser, logout, login } = useAuth();
    const navigate = useNavigate();
    const isDemo = useDemoMode();

    // Ensure demo user is "logged in" for backend headers (but don't persist to localStorage)
    React.useEffect(() => {
        if (isDemo && currentUser?.id !== 'student_1' && typeof login === 'function') {
            login('student', undefined, false);
        }
    }, [isDemo, currentUser, login]);

    const [gamePackFilter, setGamePackFilter] = useState('All');

    const [selectedGamePack, setSelectedGamePack] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const sidebarTheme = getRoleSidebarTheme('student');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'assignments'>('dashboard');
    const [activeClassFilter, setActiveClassFilter] = useState<string | null>(null);

    // ── Welcome strip state (persisted via localStorage) ──
    const WELCOME_KEY = 'elora_student_welcome_dismissed';
    const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(
        () => localStorage.getItem(WELCOME_KEY) === 'true'
    );
    const handleDismissWelcome = () => {
        setWelcomeDismissed(true);
        localStorage.setItem(WELCOME_KEY, 'true');
    };

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
        userId: currentUser?.id || '',
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
                setAssignments(studentData.assignments);
                setRecentPerformance(studentData.recentPerformance);
                setGameSessions(sessions);
                setStreakData(streak);
                setNudges(nudgesData);
                setStudentClasses(classesData);
            } catch (err: any) {
                setError(err.message || 'Failed to load data');
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
        { id: 1, label: 'Overdue assignments', value: overdueAssignments.length.toString(), icon: AlertCircle, color: 'text-red-500' },
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

    return (
        <div className="flex flex-col min-h-screen bg-[#FDFBF5] font-sans text-slate-900 overflow-hidden">
            {isDemo && <DemoBanner />}

            <div className="flex flex-1 overflow-hidden relative">
                {isDemo && <DemoRoleSwitcher />}

            {/* SIDEBAR */}
            <aside className={`flex flex-col h-screen sticky top-0 hidden md:flex shrink-0 shadow-xl z-20 transition-[width] duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} ${sidebarTheme.asideBg} ${sidebarTheme.text}`}>
                {/* Logo & Close toggle */}
                <div className={`h-20 flex items-center border-b ${sidebarTheme.headerBorder} px-6 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    <Link to="/" className="flex items-center text-white/90 hover:text-white transition-colors overflow-hidden">
                        <EloraLogo className="w-8 h-8 text-current" withWordmark={isSidebarOpen} />
                    </Link>
                    {isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="text-white/50 hover:text-white transition-colors"
                            title="Close sidebar"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    )}
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
                    <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === 'dashboard'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('dashboard')} theme={sidebarTheme} />
                    <SidebarItem icon={BookOpen} label="My Classes" collapsed={!isSidebarOpen} theme={sidebarTheme} />
                    <SidebarItem
                        icon={Sparkles}
                        label="Copilot"
                        collapsed={!isSidebarOpen}
                        onClick={() => navigate(isDemo ? '/student/copilot/demo' : '/student/copilot')}
                        theme={sidebarTheme}
                    />
                    <SidebarItem icon={Gamepad2} label="Practice & quizzes" collapsed={!isSidebarOpen} theme={sidebarTheme} />
                    <SidebarItem icon={FileText} label="Assignments & Quizzes" active={activeTab === 'assignments'} collapsed={!isSidebarOpen} onClick={() => setActiveTab('assignments')} theme={sidebarTheme} />
                    <SidebarItem icon={BarChart2} label="Reports" collapsed={!isSidebarOpen} theme={sidebarTheme} />
                </nav>

                <div className={`p-4 border-t ${sidebarTheme.footerBorder} space-y-1.5`}>
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="flex items-center justify-center w-full p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
                            title="Open sidebar"
                        >
                            <PanelLeftOpen size={20} />
                        </button>
                    )}
                    <SidebarItem icon={Settings} label="Settings" collapsed={!isSidebarOpen} theme={sidebarTheme} />
                    <button
                        onClick={logout}
                        className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
                        title={!isSidebarOpen ? "Sign out" : undefined}
                    >
                        <LogOut size={20} className="shrink-0" />
                        {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 lg:p-8">

                    {/* HEADER */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between py-4 px-0 border-b border-[#EAE7DD] mb-6 gap-4">
                        <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                Student Dashboard
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                {loading ? 'Loading…' : `Good day, ${displayName}`}
                            </h1>
                            <p className="text-[13px] text-slate-500 font-medium mt-1">You are signed in as Student</p>
                            
                                {isDemo && (
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg w-fit">
                                            <span className="text-[#68507B] font-bold uppercase tracking-widest text-[9px]">Scenario</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>Struggling Class (Sec 3 Mathematics)</span>
                                        </div>
                                        {focusChipText && (
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg w-fit">
                                                <span className="text-orange-700 font-bold uppercase tracking-widest text-[9px]">Struggling with</span>
                                                <span className="w-1 h-1 rounded-full bg-orange-300" />
                                                <span>{focusChipText}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                    className="pl-9 pr-4 py-2 bg-white border border-[#EAE7DD] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#68507B]/50 focus:border-[#68507B] w-56 shadow-sm transition-all"
                                />
                            </div>
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
                            <div className="flex items-center gap-3 pl-4 lg:pl-6 border-l border-[#EAE7DD]">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-semibold text-slate-900">
                                        {displayName}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">Student</div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-[#68507B]/10 text-[#68507B] flex items-center justify-center font-semibold border border-[#68507B]/20 shadow-sm">
                                    {studentInitial}
                                </div>
                            </div>
                        </div>
                    </header>
                    <div className="max-w-7xl w-full mx-auto space-y-8">
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
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                {/* LEFT COLUMN (Wider) */}
                                <div className="lg:col-span-2 space-y-8">

                                    {/* MOTIVATION BANNER */}
                                    <MotivationBanner
                                        streakWeeks={streakData?.streakWeeks || 0}
                                        levelLabel={`Level ${Math.floor((streakData?.totalActiveDays || 0) / 5) + 1}`}
                                        xpEstimate={`${(streakData?.totalActiveDays || 0) * 105} XP`}
                                        motivationalMessage={
                                            (streakData?.streakWeeks || 0) > 0
                                                ? ((streakData?.streakWeeks || 0) > 2
                                                    ? "You're on fire! " + (streakData?.streakWeeks) + " weeks is an incredible achievement."
                                                    : "Your learning journey is picking up speed. Great work today!")
                                                : "You're behind, but one session can change that — let's go, Jordan."
                                        }
                                    />

                                    {/* STUDENT COPILOT (Phase 1) */}
                                    {!loading && (
                                         <EloraAssistantCard
                                             role="student"
                                             assistantName={currentUser?.assistantName}
                                             title="Elora Copilot"
                                             description="Elora suggests what to work on next based on your progress data."
                                             badgeText="Beta · Elora Copilot"
                                             helperText="Ask about your learning — suggestions are based on your live data."
                                             onAsk={handleStudentAskElora}
                                             suggestedPrompts={[
                                                 "What's overdue?",
                                                 "What should I work on next?",
                                                 "How am I doing this week?"
                                             ]}
                                             accentClasses={{
                                                 chipBg: 'bg-[#68507B]/10',
                                                 buttonBg: 'bg-[#68507B]',
                                                 iconBg: 'bg-[#68507B]/10',
                                                 text: 'text-[#68507B]',
                                             }}
                                         />
                                     )}
 
                                     {/* MY CLASSES */}
                                     {studentClasses.length > 0 && (
                                         <section className="mt-6">
                                             <div className="flex items-center gap-2 mb-3">
                                                 <BookOpen className="w-4 h-4 text-[#68507B]" />
                                                 <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">My Classes</h3>
                                             </div>
                                             <div className="flex flex-wrap gap-2">
                                                 {studentClasses.map(cls => (
                                                     <button
                                                         key={cls.id}
                                                         onClick={() => handleClassClick(cls.name)}
                                                         className="px-4 py-2 bg-white border border-[#EAE7DD] hover:border-[#68507B]/30 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-all shadow-sm flex items-center gap-2 group"
                                                     >
                                                         <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                         {cls.subject}
                                                     </button>
                                                 ))}
                                             </div>
                                         </section>
                                     )}

                                    {/* TODAY'S FOCUS CARD */}
                                    <section className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm overflow-hidden">
                                        <div className="p-5 border-b border-[#EAE7DD] flex items-center justify-between bg-slate-50/50">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-[#68507B]/10 text-[#68507B] flex items-center justify-center">
                                                    <ListTodo size={18} />
                                                </div>
                                                <h2 className="font-bold text-slate-900 tracking-tight">Today's Tasks</h2>
                                            </div>
                                            <span className="text-[11px] font-bold text-[#68507B] px-2.5 py-1 bg-white border border-[#68507B]/10 rounded-lg shadow-sm">
                                                {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>

                                        <div className="p-5">
                                            {pendingAssignments.filter(a => a.dueDate && new Date(a.dueDate).toDateString() === new Date().toDateString()).length > 0 ? (
                                                <div className="space-y-4">
                                                    {pendingAssignments.filter(a => a.dueDate && new Date(a.dueDate).toDateString() === new Date().toDateString()).map(item => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => navigate(`/play/${(item as any).gamePackId || 'practice-general'}?attemptId=${(item as any).attemptId}`)}
                                                            className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all group cursor-pointer shadow-sm hover:shadow-md"
                                                        >
                                                            <div className="w-12 h-12 rounded-xl bg-[#68507B] shadow-lg shadow-[#68507B]/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                                                <Play size={20} fill="currentColor" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="text-[10px] font-bold text-[#68507B] uppercase tracking-widest">{item.className}</span>
                                                                </div>
                                                                <h4 className="text-[15px] font-bold text-slate-900 leading-tight group-hover:text-[#68507B] transition-colors">{item.title}</h4>
                                                                <p className="text-[12px] text-slate-500 mt-1 flex items-center gap-1.5">
                                                                    <Clock size={12} /> Due today • Ready to start
                                                                </p>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-[#68507B]/10 group-hover:text-[#68507B] transition-all">
                                                                <ChevronRight size={18} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 rotate-3">
                                                        <CheckCircle2 size={32} />
                                                    </div>
                                                    <p className="text-lg font-bold text-slate-900">You're all set!</p>
                                                    <p className="text-sm text-slate-500 mt-1 max-w-[240px]">No tasks due today. Use this time to sharpen your skills with a practice session.</p>
                                                    <button
                                                        onClick={() => navigate('/play/practice-general')}
                                                        className="mt-6 px-6 py-2.5 bg-[#68507B] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#68507B]/20 hover:bg-[#5a456a] hover:-translate-y-0.5 transition-all"
                                                    >
                                                        Start Practice Session
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* PERSONALIZED NEXT STEPS */}
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 pl-1">
                                            <Zap className="w-4 h-4 text-[#68507B]" />
                                            <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-widest">Recommended Path</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {nextSteps.map(rec => {
                                                const isRetry = rec.icon === 'retry';
                                                const isImprove = rec.icon === 'improve';

                                                return (
                                                    <button
                                                        key={rec.id}
                                                        onClick={() => navigate(rec.href)}
                                                        className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden ${
                                                            isRetry ? 'bg-orange-50/50 border-orange-100 hover:bg-orange-50' :
                                                            isImprove ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' :
                                                            'bg-violet-50/50 border-violet-100 hover:bg-violet-50'
                                                        }`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                                                            isRetry ? 'bg-orange-100 text-orange-600' :
                                                            isImprove ? 'bg-emerald-100 text-emerald-600' :
                                                            'bg-violet-100 text-violet-600'
                                                        }`}>
                                                            {rec.icon === 'retry' ? <RotateCcw size={18} /> : rec.icon === 'start' ? <Play size={18} fill="currentColor" /> : <Zap size={18} fill="currentColor" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <h4 className="text-[14px] font-bold text-slate-900 leading-tight mb-1 group-hover:text-slate-900">{rec.label}</h4>
                                                            <p className="text-[12px] text-slate-600 leading-relaxed font-medium line-clamp-2">{rec.detail}</p>
                                                        </div>
                                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                                    </button>
                                                );
                                            })}
                                            {nextSteps.length === 0 && (
                                                <div className="col-span-2">
                                                    <SectionEmpty
                                                        headline="No recommendations yet"
                                                        detail="Complete more sessions to unlock personalized path cards."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* MASTERY TREND CHART */}
                                    <section className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-5 lg:p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Mastery Trend</h2>
                                                <p className="text-[13px] text-slate-500 mt-1">Your performance across recent sessions.</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#68507B]" />
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Accuracy %</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[240px] w-full">
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
                                                        tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 600}}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 600}}
                                                        domain={[0, 100]}
                                                        dx={-10}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                                                        itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                                                        labelStyle={{fontSize: '10px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em'}}
                                                    />
                                                    <Bar
                                                        dataKey="score"
                                                        fill="#68507B"
                                                        radius={[4, 4, 0, 0]}
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

                                     {/* UPCOMING ASSIGNMENTS */}
                                     <section className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm overflow-hidden">
                                        <div className="p-5 border-b border-[#EAE7DD] flex items-center justify-between bg-slate-50/50">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                                                    <Calendar size={18} />
                                                </div>
                                                <h2 className="font-bold text-slate-900 tracking-tight">Full Schedule</h2>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('assignments')}
                                                className="text-[11px] font-bold text-[#68507B] hover:text-[#5a456a] transition-colors flex items-center gap-1"
                                            >
                                                VIEW ALL <ChevronRight size={12} />
                                            </button>
                                        </div>

                                        <div className="divide-y divide-slate-50">
                                            {upcomingItems.map(item => {
                                                const isOverdue = item.status === 'Overdue';
                                                const isSoon = item.status === 'Due soon';
                                                
                                                return (
                                                    <div 
                                                        key={item.id}
                                                        onClick={() => navigate(`/play/${item.gamePackId || 'practice-general'}?attemptId=${(item as any).attemptId || ''}`)}
                                                        className="p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                    >
                                                        <div className="flex justify-between items-center gap-6">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-[15px] font-bold text-slate-900 leading-tight group-hover:text-[#68507B] transition-colors line-clamp-1">{item.title}</h3>
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.subjectClass}</span>
                                                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                                                                        <span className={`text-[12px] font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                                                                            {item.dueDate}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap shadow-sm ${
                                                                isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 
                                                                isSoon ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                                                'bg-white text-slate-500 border-slate-100'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {upcomingItems.length === 0 && (
                                                <div className="p-8">
                                                    <SectionEmpty
                                                        headline="Schedule looking clear!"
                                                        detail="No upcoming assignments or quizzes for now."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </section>



                                </div>

                                 {/* RIGHT COLUMN (Narrower) */}
                                 <div className="space-y-8">
                                     <EloraAssistantCard
                                         role="student"
                                         assistantName={currentUser?.assistantName}
                                         title="Smart study suggestions"
                                         description="Elora analyzes your recent performance to give a focused practice idea."
                                         suggestedPrompts={[
                                             'What should I practice tonight to improve accuracy?',
                                             'Show me 5 quick algebra questions',
                                             'How do I reduce careless mistakes?'
                                         ]}
                                         accentClasses={{
                                             chipBg: 'bg-[#68507B]/10',
                                             buttonBg: 'bg-[#68507B]',
                                             iconBg: 'bg-[#EAE7DD]',
                                             text: 'text-[#68507B]',
                                         }}
                                         status={eloraStatus}
                                         suggestion={eloraSuggestion ? {
                                             kind: 'lesson_idea',
                                             title: eloraSuggestion.title,
                                             body: eloraSuggestion.body,
                                             suggestedTargets: eloraSuggestion.suggestedTargets,
                                             suggestedPackId: eloraSuggestion.suggestedPackId,
                                         } : null}
                                         error={eloraError}
                                         onRefresh={() => fetchEloraSuggestionRef.current?.()}
                                         isDemo={isDemo}
                                         defaultExpanded={isDemo && activeTab === 'dashboard'}
                                     />

                                     {/* PROGRESS SNAPSHOT */}
                                    <section className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm overflow-hidden sticky top-8">
                                        <div className="p-5 border-b border-[#EAE7DD]">
                                            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Performance Snapshot</h2>
                                        </div>
                                        
                                        <div className="p-6 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                                                        <Zap size={24} fill="currentColor" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Growth Streak</p>
                                                        <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{streakData?.streakWeeks || 0} Weeks</p>
                                                    </div>
                                                </div>
                                                <div className="bg-orange-50 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border border-orange-100 animate-pulse">🔥</div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                                                        <TrendingUp size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Overall Accuracy</p>
                                                        <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{avgRecentScore !== null ? `${avgRecentScore}%` : 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-lg text-[10px] font-extrabold shadow-sm border ${streakData?.trend === 'up' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
                                                    {streakData?.trend === 'up' ? 'LEVEL UP' : 'STABLE'}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm">
                                                        <CheckCircle2 size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tasks Done</p>
                                                        <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{completedAssignments.length}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-6 border-t border-slate-50">
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Focus Areas</p>
                                                    <Target size={14} className="text-[#68507B]" />
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(recentPerformance?.weakTopics || []).slice(0, 4).map((topic, i) => (
                                                        <span key={topic} className="px-3 py-1.5 bg-[#68507B]/5 text-[#68507B] rounded-xl text-[12px] font-bold border border-[#68507B]/10 hover:bg-[#68507B]/10 transition-colors cursor-default">
                                                            {topic}
                                                        </span>
                                                    ))}
                                                    {(recentPerformance?.weakTopics || []).length === 0 && (
                                                        <div className="w-full">
                                                            <SectionEmpty
                                                                headline="No weak topics"
                                                                detail="Looking great! Keep it up to maintain your performance."
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* SUPPORT & NUDGES */}
                                            {recentPerformance?.weakTopics?.[0] && (
                                                <div className="mt-2 pt-6 border-t border-slate-50">
                                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">Messages & Tips</h3>
                                                    <div className="space-y-4">
                                                        <div className="p-4 bg-[#68507B]/5 border border-[#68507B]/10 rounded-2xl group hover:border-[#68507B]/30 transition-all">
                                                            <p className="text-[11px] font-bold text-[#68507B] uppercase tracking-widest mb-2">Coach's Focus</p>
                                                            <p className="text-[13px] text-slate-700 leading-snug">Boost your performance by reviewing <strong>{recentPerformance.weakTopics[0]}</strong>.</p>
                                                            <button 
                                                                onClick={() => navigate('/play/practice-general')}
                                                                className="mt-3 text-[12px] font-bold text-[#68507B] flex items-center gap-1 group-hover:gap-2 transition-all"
                                                            >
                                                                Start practice session <ChevronRight size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* NUDGES FROM HOME CARD */}
                                    <section className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm overflow-hidden">
                                        <div className="p-5 border-b border-[#EAE7DD] flex items-center justify-between bg-slate-50/50">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                                                    <MessageCircle size={18} />
                                                </div>
                                                <h2 className="font-bold text-slate-900 tracking-tight">Messages from home</h2>
                                            </div>
                                            {nudges.filter(n => !n.read).length > 0 && (
                                                <span className="px-2 py-0.5 bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-[11px] font-bold">
                                                    {nudges.filter(n => !n.read).length} New
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-0 divide-y divide-slate-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {nudges.length > 0 ? (
                                                [...nudges]
                                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                    .slice(0, 5).map(nudge => (
                                                    <div 
                                                        key={nudge.id} 
                                                        onClick={() => !nudge.read && handleMarkNudgeRead(nudge.id)}
                                                        className={`p-4 transition-colors group ${!nudge.read ? 'bg-pink-50/30 hover:bg-pink-50/50 cursor-pointer' : 'hover:bg-slate-50 relative'}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            {!nudge.read ? (
                                                                <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5 shrink-0" />
                                                            ) : (
                                                                <div className="w-2 h-2 shrink-0 border border-slate-300 rounded-full mt-1.5" />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <span className={`text-[12px] font-bold ${!nudge.read ? 'text-slate-900' : 'text-slate-500'}`}>
                                                                        {nudge.senderName || 'From your parent'}
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-400 whitespace-nowrap ml-2">
                                                                        {relativeTime(nudge.createdAt)}
                                                                    </span>
                                                                </div>
                                                                <p className={`text-[13px] ${!nudge.read ? 'text-slate-700 font-medium' : 'text-slate-500'} line-clamp-2`}>
                                                                    "{nudge.message}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-6">
                                                    <SectionEmpty
                                                        headline="No messages yet"
                                                        detail="Messages from your parents or teachers will appear here."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" id="assignments-section">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assignments & Quizzes</h2>
                                        <p className="text-[13px] text-slate-500 mt-0.5">Manage your active and completed coursework.</p>
                                    </div>
                                    {activeClassFilter && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-wider">Filtered By:</span>
                                            <span className="px-3 py-1.5 bg-[#68507B] text-white rounded-xl text-[12px] font-bold border border-[#68507B] flex items-center gap-2 shadow-sm">
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

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                    {/* TO-DO LIST */}
                                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                                        <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-[#68507B]/10 text-[#68507B] flex items-center justify-center">
                                                    <ListTodo size={18} />
                                                </div>
                                                <h3 className="font-bold text-slate-900">To-Do List</h3>
                                            </div>
                                            <span className="px-2 py-0.5 bg-white border border-slate-100 rounded-lg text-[11px] font-bold text-[#68507B]">
                                                {normalisedAssignments.filter(a => a.status !== 'completed' && a.status !== 'success' && (!activeClassFilter || a.className === activeClassFilter)).length} Tasks
                                            </span>
                                        </div>
                                        
                                        <div className="overflow-y-auto flex-1 p-3 space-y-3 custom-scrollbar">
                                            {normalisedAssignments.filter(a => a.status !== 'completed' && a.status !== 'success' && (!activeClassFilter || a.className === activeClassFilter)).map(item => {
                                                const isOverdue = item.status === 'danger';
                                                const isSoon = item.status === 'warning';
                                                
                                                return (
                                                    <div 
                                                        key={item.id} 
                                                        onClick={() => navigate(`/play/${item.gamePackId || 'practice-general'}?attemptId=${item.attemptId}`)}
                                                        className="p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[10px] font-bold text-[#68507B] uppercase tracking-widest">{item.className}</span>
                                                                </div>
                                                                <h4 className="text-[15px] font-bold text-slate-900 leading-tight group-hover:text-[#68507B] transition-colors">{item.title}</h4>
                                                                
                                                                <div className="flex items-center gap-3 mt-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                                                                        <span className={`text-[12px] font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                                                                            {item.statusLabel || `Due ${new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                                                                        </span>
                                                                    </div>
                                                                    {isOverdue && (
                                                                        <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100 uppercase tracking-tighter">
                                                                            Action Required
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex flex-col items-end gap-3 shrink-0">
                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${
                                                                    isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 
                                                                    isSoon ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                                                }`}>
                                                                    {isOverdue ? 'Overdue' : isSoon ? 'Due soon' : 'Active'}
                                                                </span>
                                                                <div className="w-8 h-8 rounded-full bg-[#68507B] text-white flex items-center justify-center shadow-lg shadow-[#68507B]/20 group-hover:scale-110 transition-transform">
                                                                    <Play size={14} fill="currentColor" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            
                                            {normalisedAssignments.filter(a => a.status !== 'completed' && a.status !== 'success' && (!activeClassFilter || a.className === activeClassFilter)).length === 0 && (
                                                <div className="p-8">
                                                    <SectionEmpty
                                                        headline="All caught up!"
                                                        detail="You've completed all your assignments. Great job!"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* HISTORY */}
                                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                                        <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                                <h3 className="font-bold text-slate-900">Completed</h3>
                                            </div>
                                            <span className="text-[12px] font-bold text-slate-400">
                                                Archive
                                            </span>
                                        </div>
                                        
                                        <div className="overflow-y-auto flex-1 p-3 space-y-3 custom-scrollbar">
                                            {normalisedAssignments.filter(a => (a.status === 'completed' || a.status === 'success') && (!activeClassFilter || a.className === activeClassFilter)).map(item => (
                                                <div key={item.id} className="p-4 bg-white hover:bg-slate-50 border border-slate-50 rounded-xl transition-all group">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.className}</span>
                                                            <h4 className="text-[14px] font-semibold text-slate-600 leading-tight mt-1">{item.title}</h4>
                                                            <p className="text-[11px] text-slate-400 mt-2 font-medium">Completed on {new Date(item.dueDate).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                                            <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-[12px] font-bold">
                                                                {item.bestScore !== null && item.bestScore !== undefined ? `${item.bestScore}%` : 'PASS'}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3].map(star => (
                                                                    <div key={star} className={`w-2 h-2 rounded-full ${star <= (item.bestScore || 0) / 33 ? 'bg-yellow-400' : 'bg-slate-200'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {normalisedAssignments.filter(a => (a.status === 'completed' || a.status === 'success') && (!activeClassFilter || a.className === activeClassFilter)).length === 0 && (
                                                <div className="p-12">
                                                    <SectionEmpty
                                                        headline="No history yet"
                                                        detail="Completed assignments will appear here for your review."
                                                    />
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
                </div>
            </main>

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

            </div>
        </div>
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
            
            {active && !collapsed && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white" />
            )}
        </a>
    );
}
