import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession, refreshVerifiedFromServer, saveSession } from "@/lib/session";
import { motion, AnimatePresence } from "framer-motion";

// ----------------------------------------------------------------------
// COMPONENTS: UI UTILITIES
// ----------------------------------------------------------------------

function Greeting({ name, role }) {
    const [greeting, setGreeting] = useState("Hello");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    return (
        <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white font-[var(--font-outfit)]">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500">{name || role || 'User'}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                {role === 'Parent' ? "Here's how your child is doing today." : "Here's what's happening with your learning today."}
            </p>
        </div>
    );
}

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
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                />
                <motion.polyline
                    fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    points={points} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </svg>
        </div>
    );
}

function BarChart({ data, labels, height = 200, color = "#10b981" }) {
    if (!data || !labels || !Array.isArray(data)) return null;
    const max = data.length > 0 ? Math.max(...data) : 1;
    const safeMax = max <= 0 ? 1 : max;
    return (
        <div className="w-full h-full flex items-end justify-between gap-2" style={{ height }}>
            {data.map((val, i) => {
                const h = (Number(val) || 0) / safeMax * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <motion.div
                            className="w-full rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: color, height: `${h}%` }}
                            initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                        />
                        <div className="text-[10px] font-bold text-slate-500 truncate w-full text-center mt-2">{labels[i]}</div>
                    </div>
                );
            })}
        </div>
    );
}

function ClassHeatmap({ data }) {
    if (!data || data.length === 0) return null;
    // content: { subject: string, score: number, students: number }
    return (
        <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto pr-2 scrollbar-hide">
            {data.map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 flex flex-col justify-between border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.subject}</span>
                        <div className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${item.score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : item.score >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'}`}>
                            {item.score}%
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${item.score}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ----------------------------------------------------------------------
// DATA DERIVATION HELPERS: ROBUST
// ----------------------------------------------------------------------

function deriveStudentStats(session) {
    const isVerified = Boolean(session?.verified);
    const usage = session?.usage || {};

    // DEMO DATA for unverified users
    if (!isVerified) {
        return {
            name: "Future Scholar",
            streak: 0,
            todayMinutes: 0,
            overallProgress: 12,
            recentTopics: [
                { name: "Algebra Foundations", progress: 45, emoji: "🔢" },
                { name: "Cell Biology", progress: 20, emoji: "🧬" }
            ],
            chartData: [5, 12, 8, 20, 15, 25],
            achievements: [
                { title: "First Message", earned: false },
                { title: "Focus Timer", earned: false }
            ],
            isPreview: true
        };
    }

    const safeSubjects = Array.isArray(usage.subjects) ? usage.subjects : [];
    const messagesSent = Number(usage.messagesSent) || 0;
    const activeMinutes = Number(usage.activeMinutes) || 0;
    const streak = Number(usage.streak) || 0;

    return {
        name: session?.email?.split('@')[0] || "Student",
        streak,
        todayMinutes: activeMinutes,
        overallProgress: Math.min(100, messagesSent * 5),
        recentTopics: safeSubjects.length > 0
            ? safeSubjects.map(s => ({ name: String(s), progress: 65, emoji: "📚" }))
            : [{ name: "Getting Started", progress: 0, emoji: "🚀" }],
        chartData: [10, 15, 20, 25, 30, messagesSent + 30],
        achievements: [
            { title: "First Message", earned: (messagesSent > 0) },
            { title: "Focus Timer", earned: (activeMinutes > 10) },
        ],
        isPreview: false
    };
}

function computeClassMetrics(linkedStudents = [], isVerified = true) {
    // DEMO DATA for unverified users
    if (!isVerified) {
        return {
            avgEngagement: 42,
            topSubject: "Advanced Calculus",
            totalHours: "124.5",
            subjectHeatmap: [12, 45, 28, 15, 32],
            labels: ["Math", "Physics", "Chem", "Bio", "Eng"],
            isPreview: true
        };
    }

    const safeStudents = Array.isArray(linkedStudents) ? linkedStudents : [];
    if (safeStudents.length === 0) return { avgEngagement: 0, topSubject: "N/A", totalHours: "0.0", subjectHeatmap: [0], labels: ['-'] };

    let totalMessages = 0;
    let totalMinutes = 0;
    const subjectCounts = {};

    safeStudents.forEach(s => {
        if (!s) return;
        totalMessages += (Number(s.stats?.messagesSent) || 0);
        totalMinutes += (Number(s.stats?.activeMinutes) || 0);
        const stSubjects = Array.isArray(s.stats?.subjects) ? s.stats.subjects : [];
        stSubjects.forEach(sub => {
            if (!sub) return;
            subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
        });
    });

    const entries = Object.entries(subjectCounts);
    const top = entries.sort((a, b) => b[1] - a[1])[0];

    return {
        avgEngagement: Math.round(totalMessages / safeStudents.length),
        topSubject: top ? top[0] : "General",
        totalHours: (totalMinutes / 60).toFixed(1),
        // Generate richer heatmap data
        heatmapData: entries.length > 0
            ? entries.map(e => ({ subject: e[0], score: Math.round(Math.random() * 40 + 60), students: e[1] }))
            : [
                { subject: "Math", score: 78, students: 12 },
                { subject: "Physics", score: 65, students: 8 },
                { subject: "English", score: 88, students: 15 },
                { subject: "History", score: 55, students: 5 },
            ],
        isPreview: false
    };
}

function LockedFeatureOverlay({ children, isVerified }) {
    if (isVerified) return children;

    return (
        <div className="relative group cursor-not-allowed">
            <div className="blur-[1px] opacity-70 pointer-events-none transition-all group-hover:blur-[2px]">
                {children}
            </div>
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl border border-white/10 dark:border-slate-200">
                    <Link href="/verify" className="flex items-center gap-2 no-underline">
                        <span className="text-xs font-black text-white dark:text-slate-900 whitespace-nowrap">Verify to Unlock →</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function PreviewBanner() {
    return (
        <div className="mb-8 p-3 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 grid place-items-center text-white text-xs">✨</div>
                <div>
                    <div className="text-xs font-black text-indigo-900 dark:text-indigo-100">Dashboard Preview Mode</div>
                    <div className="text-[10px] text-indigo-700/70 dark:text-indigo-300/60 font-medium">Verify your email to see your real learning statistics.</div>
                </div>
            </div>
            <Link href="/verify" className="elora-btn py-1.5 px-4 text-[10px] bg-indigo-600 text-white border-none">Verify Now</Link>
        </div>
    );
}

// ----------------------------------------------------------------------
// ROLE MODULES
// ----------------------------------------------------------------------

function StudentModule({ data }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Streak", val: `${data.streak} d`, icon: "🔥" },
                    { label: "Today", val: `${data.todayMinutes}m`, icon: "⏱️" },
                    { label: "Progress", val: `${data.overallProgress}%`, icon: "📈" },
                    { label: "Queries", val: data.achievements.filter(a => a.earned).length, icon: "💬" }
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{s.icon}</span>
                            <span className="text-sm font-bold text-slate-500">{s.label}</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{s.val}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold mb-6">Learning Momentum</h3>
                    <div className="h-64"><LineChart data={data.chartData} height={250} color="#6366f1" /></div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Current Topics</h3>
                    <div className="space-y-4">
                        {data.recentTopics.map((t, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1 font-bold"><span>{t.emoji} {t.name}</span><span>{t.progress}%</span></div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${t.progress}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TeacherModule({ students, metrics, onAddStudent, session: activeSession, onUpdateSession }) {
    if (!activeSession) return null;
    const [selectedTab, setSelectedTab] = useState("overview"); // overview, assignments, insights
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [newClassSubject, setNewClassSubject] = useState("");
    const [nameInput, setNameInput] = useState("");
    const [code, setCode] = useState("");

    // Mock Assignments
    const [assignments, setAssignments] = useState([
        { id: 1, title: "Algebra Basics", dueDate: "2026-02-01", status: "Active", submissions: 12 },
        { id: 2, title: "Cell Structure", dueDate: "2026-01-30", status: "Active", submissions: 5 },
    ]);

    const handleAdd = () => {
        if (!nameInput || !code) return;
        onAddStudent(code, nameInput);
        setNameInput("");
        setCode("");
    };

    // Ensure classes exist
    const classes = activeSession?.classroom?.classes || [];

    const handleCreateClass = () => {
        if (!newClassName) return;
        const newClass = {
            id: `cls_${Date.now()}`,
            name: newClassName,
            subject: newClassSubject || "General",
            studentCount: 0,
            color: "indigo"
        };
        const nextSession = { ...activeSession };
        if (!nextSession.classroom) nextSession.classroom = {};
        if (!Array.isArray(nextSession.classroom.classes)) nextSession.classroom.classes = [];
        nextSession.classroom.classes.push(newClass);
        onUpdateSession(nextSession);
        setIsCreating(false);
        setNewClassName("");
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar: Class List */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="space-y-1">
                        {[
                            { id: "overview", label: "📊 Overview" },
                            { id: "assignments", label: "📝 Assignments" },
                            { id: "insights", label: "💡 AI Insights" }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 mb-2 mt-6">My Classes</div>
                    <div className="space-y-1">
                        <button
                            onClick={() => setSelectedClassId(null)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedClassId === null ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}
                        >
                            All Students
                        </button>
                        {classes.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedClassId(c.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${selectedClassId === c.id ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30" : "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                            >
                                <span>{c.name}</span>
                                <span className="text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-500">{c.studentCount || 0}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        {!isCreating ? (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                            >
                                + Create Class
                            </button>
                        ) : (
                            <div className="space-y-2 animate-reveal">
                                <input
                                    autoFocus
                                    placeholder="Class Name (e.g. 10B)"
                                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                    value={newClassName}
                                    onChange={e => setNewClassName(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleCreateClass} className="flex-1 bg-indigo-600 text-white text-[10px] font-bold py-1.5 rounded-lg">Add</button>
                                    <button onClick={() => setIsCreating(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold py-1.5 rounded-lg">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Tools */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-5 text-white shadow-lg">
                    <h4 className="font-bold text-sm mb-2">⚡ Teacher Tools</h4>
                    <div className="space-y-2">
                        <Link href="/assistant?action=lesson_plan&topic=New Lesson" className="block w-full text-left bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                            📝 Plan a Lesson
                        </Link>
                        <Link href="/assistant?action=find_videos&topic=Educational Resources" className="block w-full text-left bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs font-medium transition-colors">
                            🔍 Find Videos
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 space-y-8">
                {/* Content based on Tab */}
                {selectedTab === "overview" && !selectedClassId && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20">
                                <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Total Enrollment</p>
                                <p className="text-4xl font-black">{students.length} <span className="text-sm font-medium opacity-70">students</span></p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Most Active Class</p>
                                <p className="text-4xl font-black text-slate-900 dark:text-white truncate">{classes[0]?.name || "N/A"}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Total Class Minutes</p>
                                <p className="text-4xl font-black text-emerald-500">{metrics.totalHours}h</p>
                            </div>
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Activity</h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-500 text-xs font-black uppercase">
                                                <th className="pb-4 pl-2">Student</th>
                                                <th className="pb-4">Queries</th>
                                                <th className="pb-4">Time</th>
                                                <th className="pb-4">Last Topic</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                            {students.map((s, i) => (
                                                <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">{s.name}</td>
                                                    <td className="py-4 text-sm text-slate-600 dark:text-slate-300">{s.stats?.messagesSent || 0}</td>
                                                    <td className="py-4 text-sm text-slate-600 dark:text-slate-300">{s.stats?.activeMinutes || 0}m</td>
                                                    <td className="py-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">{s.stats?.subjects?.[0] || 'Unstarted'}</td>
                                                </tr>
                                            ))}
                                            {students.length === 0 && (
                                                <tr><td colSpan="4" className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold italic bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">No students linked yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-black mb-4 text-slate-900 dark:text-white">Link New Student</h3>
                                    <div className="space-y-3">
                                        <input
                                            value={nameInput} onChange={e => setNameInput(e.target.value)}
                                            placeholder="Student Nickname"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                        <input
                                            value={code} onChange={e => setCode(e.target.value)}
                                            placeholder="ELORA-XXXX"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                        <button
                                            onClick={handleAdd}
                                            className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                            disabled={!activeSession?.verified}
                                        >
                                            Add Student +
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-black mb-6 text-slate-900 dark:text-white">Class Mastery</h3>
                                    <div className="h-44">
                                        <ClassHeatmap data={metrics.heatmapData} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {selectedTab === "assignments" && (
                    <div className="space-y-6 animate-reveal">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Assignments</h3>
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20">+ New Assignment</button>
                        </div>
                        <div className="grid gap-4">
                            {assignments.map(a => (
                                <div key={a.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">{a.title}</h4>
                                        <p className="text-xs text-slate-500">Due: {a.dueDate} • {a.submissions} submissions</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">{a.status}</span>
                                        <button className="text-slate-400 hover:text-slate-600 font-bold text-sm">View Details</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedTab === "insights" && (
                    <div className="space-y-8 animate-reveal">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">AI Class Insights</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
                                <h4 className="font-bold mb-4 flex items-center gap-2 text-xl"><span>📈</span> Performance Summary</h4>
                                <p className="text-sm opacity-90 leading-relaxed font-medium">
                                    The class is excelling in <b className="text-white">Algebra Foundations</b>, with an average mastery score of <b className="text-white">82%</b>.
                                    However, focus is needed on <b className="text-white">Word Problems</b>, where participation dropped by 15% this week.
                                </p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-xl flex items-center gap-2"><span>🎯</span> Recommendations</h4>
                                <ul className="space-y-4">
                                    {[
                                        "Introduce interactive visual aids for variable substitution.",
                                        "Group students based on similar 'stuck points' identified by AI.",
                                        "Assign a quick retrieval quiz on basic equation balancing."
                                    ].map((rec, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                                            <span className="font-medium">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* AI Recommended Videos */}
                        <div className="space-y-4">
                            <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>🎥</span> Recommended for Your Students
                            </h4>
                            <div className="grid sm:grid-cols-3 gap-4">
                                {[
                                    { title: "Algebra Basics for 10B", duration: "12:45", views: "1.2k" },
                                    { title: "Visualizing Cell Division", duration: "08:20", views: "850" },
                                    { title: "Physics: Kinetic Energy", duration: "15:10", views: "3.4k" }
                                ].map((vid, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group hover:border-indigo-500 transition-all cursor-pointer">
                                        <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative">
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 pl-1 shadow-xl">▶</div>
                                            </div>
                                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded">{vid.duration}</div>
                                        </div>
                                        <div className="p-3">
                                            <h5 className="font-bold text-xs text-slate-900 dark:text-white mb-1 line-clamp-1">{vid.title}</h5>
                                            <p className="text-[10px] text-slate-500 font-medium">Elora AI Recommendation • {vid.views} views</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Class Detail View */}
                {selectedClassId && (
                    <div className="animate-reveal">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Class Detail</div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                    {classes.find(c => c.id === selectedClassId)?.name || "Class"}
                                </h2>
                            </div>
                            <div className="flex gap-2">
                                <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Settings</button>
                                <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors">Create Assignment</button>
                            </div>
                        </div>

                        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                            <div className="text-5xl mb-6">👋</div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Classroom Empty</h3>
                            <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                                Ready to teach? Invite students using your Magic Code below, or create your first AI-generated assignment to get things moving.
                            </p>
                            <div className="inline-flex items-center gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Magic Code</div>
                                <span className="font-mono text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-wider">ELORA-{Math.floor(Math.random() * 9000) + 1000}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// MAIN DASHBOARD PAGE
// ----------------------------------------------------------------------

export default function DashboardPage() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("student");
    const [linkedData, setLinkedData] = useState(null);

    useEffect(() => {
        const s = getSession();
        setSession(s);
        if (s.role === 'parent') setActiveTab('parent');
        else if (s.role === 'educator') setActiveTab('teacher');
        setLoading(false);
    }, []);

    const updateSessionAndSync = (newSession) => {
        saveSession(newSession);
        setSession({ ...newSession });
    };

    const handleAddStudent = (code, name) => {
        const s = getSession();
        const newStudent = {
            code, name, addedAt: new Date().toISOString(),
            stats: { messagesSent: 12, activeMinutes: 45, subjects: ["Math", "Physics"] } // In real app, fetch from system
        };
        s.linkedStudents = [...(s.linkedStudents || []), newStudent];
        updateSessionAndSync(s);
    };

    const handleLinkParent = (code) => {
        const s = getSession();
        s.linkedStudentId = code;
        updateSessionAndSync(s);
        setLinkedData({
            name: "Linked Student",
            streak: 3, todayMinutes: 12, overallProgress: 42,
            subjectBreakdown: [80, 45, 90, 60],
            subjectLabels: ["Math", "Sci", "Eng", "Art"],
            recentActivity: [{ action: "Started 'Algebra Basics'", time: "Just now" }]
        });
    };

    if (loading || !session) return null;

    const studentData = deriveStudentStats(session);
    const classMetrics = computeClassMetrics(session.linkedStudents, session.verified);

    return (
        <>
            <Head><title>Dashboard | Elora</title></Head>
            <div className="elora-page min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
                <div className="elora-container pt-12">
                    {!session.verified && <PreviewBanner />}
                    <Greeting
                        name={session?.email?.split('@')[0]}
                        role={activeTab === 'teacher' ? 'Classroom Admin' : activeTab === 'parent' ? 'Parent' : 'Student'}
                    />

                    {/* Dynamic Tabs - Only show the verified role tab */}
                    <div className="flex gap-2 mb-10 bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-full w-fit border border-slate-200/50 dark:border-white/10">
                        {['student', 'parent', 'teacher'].filter(id => {
                            const userRole = session?.role?.toLowerCase();
                            if (id === 'teacher' && userRole === 'educator') return true;
                            return id === userRole;
                        }).map(id => (
                            <button key={id} onClick={() => setActiveTab(id)}
                                className={`px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300 ${activeTab === id ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl" : "text-slate-400 hover:text-slate-600"}`}>
                                {id}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                            {activeTab === 'student' && <StudentModule data={studentData} />}

                            {activeTab === 'parent' && (
                                session?.linkedStudentId ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Tracking: {linkedData?.name || "Student"}</h3>
                                            <button onClick={() => handleLinkParent(null)} className="text-xs font-bold text-red-500 hover:underline">Disconnect</button>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <h3 className="text-lg font-bold mb-6">Subject Breakdown</h3>
                                                <div className="h-56"><BarChart data={linkedData?.subjectBreakdown} labels={linkedData?.subjectLabels} color="#06b6d4" /></div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm text-center flex flex-col justify-center">
                                                <div className="text-5xl mb-4">🎯</div>
                                                <h3 className="text-xl font-bold mb-2">Steady Progress</h3>
                                                <p className="text-slate-500">Your student has completed <span className="font-black text-slate-900 dark:text-white">14 lessons</span> this week with an average score of 88%.</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-700 rounded-3xl p-10 text-white shadow-2xl">
                                        <h3 className="text-3xl font-black mb-4">Parental Link</h3>
                                        <p className="mb-8 opacity-80 max-w-lg">Enter your child's ELORA code to see their live progress charts and subject mastery reports.</p>
                                        <div className="flex gap-3 max-w-md">
                                            <input placeholder="ELORA-XXXX" className="flex-1 bg-white/10 border-white/20 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-white/50" />
                                            <LockedFeatureOverlay isVerified={session?.verified}>
                                                <button onClick={() => handleLinkParent("DEMO")} className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-xl">Link Child</button>
                                            </LockedFeatureOverlay>
                                        </div>
                                    </div>
                                )
                            )}

                            {activeTab === 'teacher' && (
                                <TeacherModule students={session.linkedStudents || []} metrics={classMetrics} onAddStudent={handleAddStudent} session={session} onUpdateSession={updateSessionAndSync} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
