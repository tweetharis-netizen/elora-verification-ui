import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession, refreshVerifiedFromServer, saveSession } from "../../lib/session";
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
                    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    points={points} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </svg>
        </div>
    );
}

function BarChart({ data, labels, height = 200, color = "#10b981" }) {
    if (!data || !labels) return null;
    const max = Math.max(...data) || 1;
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
// GREETING
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
                {role === 'Parent' ? "Here's how your child is doing today." : "Here's what's happening with your learning today."}
            </p>
        </div>
    );
}

// ----------------------------------------------------------------------
// DATA DERIVATION
// ----------------------------------------------------------------------

function deriveStudentStats(session) {
    const usage = session?.usage || {};
    return {
        name: session?.email?.split('@')[0] || "Student",
        streak: usage.streak || 0,
        todayMinutes: usage.activeMinutes || 0,
        overallProgress: Math.min(100, (usage.messagesSent || 0) * 5), // 5% per message for demo
        recentTopics: (usage.subjects || []).length > 0
            ? usage.subjects.map(s => ({ name: s, progress: 65, emoji: "📚" }))
            : [{ name: "Getting Started", progress: 0, emoji: "🚀" }],
        chartData: [10, 15, 20, 25, 30, (usage.messagesSent || 0) + 30],
        achievements: [
            { title: "First Message", earned: (usage.messagesSent > 0) },
            { title: "Focus Timer", earned: (usage.activeMinutes > 10) },
        ]
    };
}

// ----------------------------------------------------------------------
// MODULES
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

function ParentLinkingUI({ onLink }) {
    const [code, setCode] = useState("");
    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-500/20">
            <h3 className="text-2xl font-black mb-2">Link Student Account</h3>
            <p className="text-indigo-100 mb-6 max-w-md">Enter your child's sharing code (found in their Elora Settings) to track their real-time progress.</p>
            <div className="flex gap-2">
                <input
                    value={code} onChange={e => setCode(e.target.value)}
                    placeholder="e.g. ELORA-XXXX"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                    onClick={() => onLink(code)}
                    className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                >
                    Link Now
                </button>
            </div>
        </div>
    );
}

function TeacherModule() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700">
            <div className="text-5xl mb-4">🍎</div>
            <h3 className="text-xl font-bold mb-2">Classroom Analytics</h3>
            <p className="text-slate-500 mb-6">Bulk student tracking and lesson insights are coming to your region soon.</p>
            <Link href="/assistant" className="elora-btn elora-btn-primary inline-flex">Open Teacher Tools</Link>
        </div>
    );
}

// ----------------------------------------------------------------------
// MAIN PAGE
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

    const handleLink = (code) => {
        // In this local-storage demo, we'll just simulate a successful link.
        // In a real app, this would fetch from a database using the code.
        const s = getSession();
        s.linkedStudentId = code;
        saveSession(s);
        setSession({ ...s });

        // Mocking some data for the "newly linked" student
        setLinkedData({
            name: "Linked Student",
            streak: 3,
            todayMinutes: 12,
            overallProgress: 42,
            recentTopics: [{ name: "Algebra Basics", progress: 80, emoji: "➗" }],
            subjectBreakdown: [80, 45, 90, 60],
            subjectLabels: ["Math", "Sci", "Eng", "Art"],
            averageScore: 78,
            recentActivity: [{ action: "Started 'Algebra Basics'", time: "Just now", type: "milestone" }]
        });
    };

    if (loading) return null;

    const studentData = deriveStudentStats(session);

    return (
        <>
            <Head><title>Dashboard | Elora</title></Head>
            <div className="elora-page min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
                <div className="elora-container pt-12">
                    <Greeting name={session?.email?.split('@')[0]} role={session?.role === 'educator' ? 'Teacher' : session?.role === 'parent' ? 'Parent' : 'Student'} />

                    <div className="flex gap-2 mb-8">
                        {['student', 'parent', 'teacher'].map(id => (
                            <button key={id} onClick={() => setActiveTab(id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${activeTab === id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg" : "text-slate-500 border-slate-200 dark:border-slate-800"}`}>
                                {id.charAt(0).toUpperCase() + id.slice(1)} Dashboard
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            {activeTab === 'student' && <StudentModule data={studentData} />}

                            {activeTab === 'parent' && (
                                linkedData || session?.linkedStudentId ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black">Tracking: {linkedData?.name || "Your Student"}</h3>
                                            <button onClick={() => { handleLink(null); setLinkedData(null); }} className="text-xs font-bold text-red-500">Unlink Account</button>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                                                <h3 className="font-bold mb-4">Weekly Mastery</h3>
                                                <div className="h-48"><BarChart data={linkedData?.subjectBreakdown || [60, 70, 80]} labels={linkedData?.subjectLabels || ['A', 'B', 'C']} color="#06b6d4" /></div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                                                <h3 className="font-bold mb-4">Recent Activity</h3>
                                                <div className="space-y-4">
                                                    {(linkedData?.recentActivity || [{ action: "Learning in progress", time: "Today" }]).map((a, i) => (
                                                        <div key={i} className="flex gap-3">
                                                            <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                                                            <div><p className="text-sm font-bold">{a.action}</p><p className="text-xs text-slate-500">{a.time}</p></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : <ParentLinkingUI onLink={handleLink} />
                            )}

                            {activeTab === 'teacher' && <TeacherModule />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
