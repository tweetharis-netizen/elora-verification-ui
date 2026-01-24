import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession, refreshVerifiedFromServer } from "../../lib/session";
import { motion, AnimatePresence } from "framer-motion";

// ----------------------------------------------------------------------
// COMPONENTS: INLINED TO FIX BUILD ERROR
// (Previously in components/SimpleCharts.js)
// ----------------------------------------------------------------------

function LineChart({ data, height = 200, color = "#6366f1" }) {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="relative w-full overflow-hidden" style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.path
                    d={`M 0,100 L 0,${100 - ((data[0] - min) / range) * 100} ${points.split(" ").map(p => `L ${p}`).join(" ")} L 100,100 Z`}
                    fill={`url(#gradient-${color})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                />
                <motion.polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </svg>
        </div>
    );
}

function BarChart({ data, labels, height = 200, color = "#10b981" }) {
    if (!data || !labels) return null;
    const max = Math.max(...data);
    return (
        <div className="w-full h-full flex items-end justify-between gap-1" style={{ height }}>
            {data.map((val, i) => {
                const h = (val / max) * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <motion.div
                            className="w-full rounded-t-md opacity-80"
                            style={{ backgroundColor: color, height: `${h}%` }}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                        />
                        <div className="text-[9px] text-slate-400 truncate w-full text-center">{labels[i]}</div>
                    </div>
                );
            })}
        </div>
    );
}

// ----------------------------------------------------------------------
// DATA: Realistic "Story-Based" Data (No random numbers)
// ----------------------------------------------------------------------

// Story: "Alex" is a conscientious student who loves Geometry but finds Algebra tricky.
// They have been studying for 2 weeks.
const STUDENT_DATA = {
    name: "Alex",
    overallProgress: 68,
    streak: 14,
    todayMinutes: 45,
    recentTopics: [
        { name: "Triangle Properties", progress: 100, emoji: "📐", score: 95 },
        { name: "Algebraic Expressions", progress: 45, emoji: "➗", score: 72 },
        { name: "Introduction to Physics", progress: 12, emoji: "⚛️", score: null },
    ],
    achievements: [
        { title: "Geometry Whiz", desc: "Ace 3 Geometry quizzes", earned: true, date: "2 days ago" },
        { title: "Early Bird", desc: "Study before 8 AM", earned: true, date: "Yesterday" },
        { title: "Marathoner", desc: "Study for 2 hours in one session", earned: false, progress: 65 },
    ],
    chartData: [20, 35, 45, 42, 55, 60, 68], // Consistent upward trend with a small dip
};

// Story: Parent sees Alex's specific struggles and wins.
const PARENT_DATA = {
    childName: "Alex",
    weeklyProgress: 72, // Matches student's general trend
    topicsCompleted: 8,
    averageScore: 84, // Good but room for improvement
    recentActivity: [
        { action: "Aced 'Triangle Properties' Quiz", time: "2 hours ago", type: "positive" },
        { action: "Struggled with 'Factorization'", time: "Yesterday", type: "alert" },
        { action: "Completed 14-day streak", time: "Today", type: "milestone" },
    ],
    subjectBreakdown: [85, 62, 78, 92, 70], // Math (avg), Science, English, History, Art
    subjectLabels: ["Math", "Sci", "Eng", "Hist", "Art"]
};

// Story: Teacher view for "Period 3 Math"
const TEACHER_DATA = {
    pendingReviews: 3,
    studentsActive: 28,
    automationsSaved: "12.5 hrs",
    recentSubmissions: [
        { student: "Alex M.", topic: "Triangle Proof", status: "reviewed", grade: "A" },
        { student: "Sarah J.", topic: "Quadratics", status: "pending", grade: null },
        { student: "Mike T.", topic: "Quadratics", status: "pending", grade: null },
    ],
};

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

function Greeting({ name, role }) {
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";

    return (
        <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white font-[var(--font-outfit)]">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500">{name || role}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Here's what's happening with your learning today.
            </p>
        </div>
    );
}

function StudentModule({ data }) {
    return (
        <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🔥</span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Streak</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{data.streak} days</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">⏱️</span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Today</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{data.todayMinutes}m</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📈</span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Progress</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{data.overallProgress}%</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🏆</span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Awards</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{data.achievements.filter(a => a.earned).length}</div>
                </motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main Progress Chart */}
                <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Learning Momentum</h3>
                    <div className="h-64 w-full">
                        <LineChart data={data.chartData} color="#6366f1" height={250} />
                    </div>
                </div>

                {/* Recent Topics List */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Current Topics</h3>
                    <div className="space-y-4">
                        {data.recentTopics.map((topic, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{topic.emoji}</span>
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{topic.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">{topic.progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${topic.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link href="/courses" className="block mt-6 text-center text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors">
                        View All Courses →
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ParentModule({ data }) {
    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Child Overview */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Weekly Overview</h3>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">{data.averageScore}%</span>
                        <span className="text-sm font-bold text-emerald-500 mb-1.5">Avg. Score</span>
                    </div>
                    <div className="h-48">
                        <BarChart data={data.subjectBreakdown} labels={data.subjectLabels} height={190} color="#06b6d4" />
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {data.recentActivity.map((activity, i) => (
                            <div key={i} className="flex gap-4">
                                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${activity.type === 'positive' ? 'bg-emerald-500' :
                                        activity.type === 'alert' ? 'bg-amber-500' : 'bg-indigo-500'
                                    }`} />
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{activity.action}</p>
                                    <p className="text-xs text-slate-500">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TeacherModule({ data }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Needs Review</p>
                    <p className="text-3xl font-black">{data.pendingReviews}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Active Students</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{data.studentsActive}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Time Saved (Auto-grading)</p>
                    <p className="text-3xl font-black text-emerald-500">{data.automationsSaved}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Submissions</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.recentSubmissions.map((sub, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                                    {sub.student.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{sub.student}</p>
                                    <p className="text-xs text-slate-500">{sub.topic}</p>
                                </div>
                            </div>
                            <div>
                                {sub.status === 'reviewed' ? (
                                    <span className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                                        Grade: {sub.grade}
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                        Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ----------------------------------------------------------------------
// MAIN PAGE
// ----------------------------------------------------------------------

export default function DashboardPage() {
    // Standard Hooks
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("student");

    useEffect(() => {
        const load = async () => {
            // Check session
            const s = getSession();
            setSession(s);

            // Allow access (in real app, would redirect if no session)
            // But for this demo, we might want to default to 'student' if no session

            // Set role specific tab
            if (s?.role === 'parent') setActiveTab('parent');
            if (s?.role === 'educator') setActiveTab('teacher');

            setLoading(false);
        };
        load();
    }, []);

    // Tabs Configuration
    const tabs = [
        { id: "student", label: "Example Student" }, // Changed label to be honest about example data
        { id: "parent", label: "Example Parent" },
        { id: "teacher", label: "Example Teacher" },
    ];

    if (loading) return null; // Or a skeleton

    return (
        <>
            <Head>
                <title>Dashboard | Elora</title>
            </Head>

            <div className="elora-page min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
                <div className="elora-container pt-12">

                    {/* Simplified Greeting Header */}
                    <Greeting name={STUDENT_DATA.name} role={session?.role || "Student"} />

                    {/* Clean Tab Navigation */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border
                                    ${activeTab === tab.id
                                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-lg shadow-indigo-500/20"
                                        : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'student' && <StudentModule data={STUDENT_DATA} />}
                            {activeTab === 'parent' && <ParentModule data={PARENT_DATA} />}
                            {activeTab === 'teacher' && <TeacherModule data={TEACHER_DATA} />}
                        </motion.div>
                    </AnimatePresence>

                </div>
            </div>
        </>
    );
}
