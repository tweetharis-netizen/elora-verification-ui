import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession, refreshVerifiedFromServer } from "../../lib/session";
import { motion, AnimatePresence } from "framer-motion";

// Sample data - in production this would come from an API
const SAMPLE_STUDENT_DATA = {
    name: "Student",
    overallProgress: 78,
    streak: 5,
    todayMinutes: 45,
    recentTopics: [
        { name: "Fractions", progress: 92, emoji: "🔢" },
        { name: "Decimals", progress: 68, emoji: "📊" },
        { name: "Percentages", progress: 45, emoji: "📈" },
    ],
    achievements: [
        { title: "First Steps", desc: "Complete your first lesson", earned: true },
        { title: "Streak Master", desc: "5 day learning streak", earned: true },
        { title: "Quick Learner", desc: "Complete 10 topics", earned: false },
    ],
};

const SAMPLE_PARENT_DATA = {
    childName: "Your Child",
    weeklyProgress: 85,
    topicsCompleted: 12,
    averageScore: 88,
    recentActivity: [
        { action: "Completed lesson on Fractions", time: "2 hours ago" },
        { action: "Earned 'Streak Master' badge", time: "Yesterday" },
        { action: "Started new topic: Decimals", time: "2 days ago" },
    ],
};

const SAMPLE_TEACHER_DATA = {
    pendingReviews: 8,
    studentsActive: 24,
    automationsSaved: "3.5 hours",
    recentSubmissions: [
        { student: "Student A", topic: "Algebra", status: "pending" },
        { student: "Student B", topic: "Geometry", status: "reviewed" },
        { student: "Student C", topic: "Fractions", status: "pending" },
    ],
};

function ProgressRing({ progress, size = 80, strokeWidth = 8, color = "indigo" }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <motion.circle
                    className={`text-${color}-500`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {progress}%
                </span>
            </div>
        </div>
    );
}

// Real interactive Student Module
function StudentModule({ data, refreshData }) {
    const [updating, setUpdating] = useState(false);

    const handleCompleteLesson = async () => {
        setUpdating(true);
        try {
            await fetch('/api/dashboard/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete_lesson' })
            });
            await refreshData();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 rounded-2xl p-4 border border-indigo-500/20"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Overall Progress</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.overallProgress}%</p>
                        </div>
                        <ProgressRing progress={data.overallProgress} size={60} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl p-4 border border-amber-500/20"
                >
                    <p className="text-xs text-slate-500 dark:text-slate-400">Learning Streak</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl">🔥</span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.streak} days</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-2xl p-4 border border-cyan-500/20"
                >
                    <p className="text-xs text-slate-500 dark:text-slate-400">Today's Learning</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl">⏱️</span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.todayMinutes} min</span>
                    </div>
                </motion.div>
            </div>

            {/* Interactive Action for Testing */}
            <div className="flex justify-end">
                <button
                    onClick={handleCompleteLesson}
                    disabled={updating}
                    className="text-xs font-bold bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                    {updating ? "Updating..." : "▶ Simulate Lesson Completion"}
                </button>
            </div>

            {/* Recent Topics */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recent Topics</h3>
                <div className="space-y-3">
                    {data.recentTopics.map((topic, i) => (
                        <motion.div
                            key={topic.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="flex items-center gap-3"
                        >
                            <span className="text-xl">{topic.emoji}</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{topic.name}</span>
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{topic.progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${topic.progress}%` }}
                                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Achievements */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Achievements</h3>
                <div className="grid grid-cols-3 gap-3">
                    {data.achievements.map((achievement, i) => (
                        <motion.div
                            key={achievement.title}
                            animate={{
                                scale: achievement.earned ? 1 : 0.95,
                                opacity: achievement.earned ? 1 : 0.6
                            }}
                            className={`text-center p-3 rounded-xl border transition-colors duration-500 ${achievement.earned
                                ? "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30 shadow-sm"
                                : "bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 grayscale"
                                }`}
                        >
                            <div className="text-2xl mb-1">{achievement.earned ? "🏆" : "🔒"}</div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{achievement.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{achievement.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ParentModule({ data }) {
    return (
        <div className="space-y-6">
            {/* Overview Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl p-6 border border-cyan-500/20"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{data.childName}'s Progress</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">This week's learning summary</p>
                    </div>
                    <ProgressRing progress={data.weeklyProgress} size={80} color="cyan" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/50 dark:bg-slate-800/30 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Topics Completed</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{data.topicsCompleted}</p>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/30 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Average Score</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{data.averageScore}%</p>
                    </div>
                </div>
            </motion.div>

            {/* Recent Activity */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {data.recentActivity.map((activity, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30"
                        >
                            <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                            <div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{activity.action}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TeacherModule({ data, onNavigateToAssistant }) {
    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl p-4 border border-purple-500/20"
                >
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pending Reviews</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.pendingReviews}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl p-4 border border-emerald-500/20"
                >
                    <p className="text-xs text-slate-500 dark:text-slate-400">Active Students</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.studentsActive}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl p-4 border border-amber-500/20"
                >
                    <p className="text-xs text-slate-500 dark:text-slate-400">Time Saved</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.automationsSaved}</p>
                </motion.div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Submissions</h3>
                    <span className="text-xs text-slate-500">{data.pendingReviews} pending</span>
                </div>
                <div className="space-y-3">
                    {data.recentSubmissions.map((submission, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-bold">
                                    {submission.student.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{submission.student}</p>
                                    <p className="text-xs text-slate-400">{submission.topic}</p>
                                </div>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${submission.status === "pending"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                }`}>
                                {submission.status}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* AI Assistant CTA */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={onNavigateToAssistant}
                className="w-full elora-cta-primary flex items-center justify-center gap-2"
            >
                <span>⚡</span>
                <span>Open AI Grading Assistant</span>
            </motion.button>
        </div>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState("student");
    const [loading, setLoading] = useState(true);

    // Real Data State
    const [studentData, setStudentData] = useState(null);

    const refreshDashboardData = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            if (res.ok) {
                const json = await res.json();
                setStudentData(json.stats);
            }
        } catch (e) {
            console.error("Failed to fetch dashboard data", e);
        }
    };

    useEffect(() => {
        const loadSessionAndData = async () => {
            const status = await refreshVerifiedFromServer();
            const s = getSession();
            setSession(s);

            // 1. Enforce Verification Gating
            // If not verified, redirect to verify page
            if (!status.verified) {
                router.replace("/verify?redirect=/dashboard");
                return;
            }

            // 2. Load Real Data
            await refreshDashboardData();

            // Set default tab based on role
            if (s?.role === "educator" && s?.teacher) {
                setActiveTab("teacher");
            } else if (s?.role === "parent") {
                setActiveTab("parent");
            }

            setLoading(false);
        };
        loadSessionAndData();
    }, [router]);

    const tabs = [
        { id: "student", label: "Student Progress", icon: "📊" },
        { id: "parent", label: "Parent Insights", icon: "👨‍👩‍👧" },
        { id: "teacher", label: "Teacher Tools", icon: "⚡", requiresTeacher: true },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Dashboard — Elora AI</title>
                <meta name="description" content="Your personalized Elora learning dashboard" />
            </Head>

            <div className="elora-page min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="elora-container py-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-[var(--font-outfit)]">
                                    Dashboard
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Welcome back! Here's your learning overview.
                                </p>
                            </div>
                            <Link
                                href="/assistant"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 transition-colors"
                            >
                                <span>💬</span>
                                <span>Open Assistant</span>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Tab Navigation */}
                    <div className="mb-6">
                        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-x-auto">
                            {tabs.map((tab) => {
                                const isDisabled = tab.requiresTeacher && !session?.teacher;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => !isDisabled && setActiveTab(tab.id)}
                                        disabled={isDisabled}
                                        className={`
                      relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap
                      transition-all duration-300
                      ${activeTab === tab.id
                                                ? "text-white"
                                                : isDisabled
                                                    ? "text-slate-400 cursor-not-allowed"
                                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                            }
                    `}
                                    >
                                        {activeTab === tab.id && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10">{tab.icon}</span>
                                        <span className="relative z-10">{tab.label}</span>
                                        {isDisabled && (
                                            <span className="relative z-10 text-xs ml-1">🔒</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {tabs.find(t => t.id === activeTab)?.requiresTeacher && !session?.teacher && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                                <span>⚠️</span>
                                <span>Teacher tools require email verification. <Link href="/verify" className="underline">Verify now</Link></span>
                            </p>
                        )}
                    </div>

                    {/* Module Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Pass real data to student module */}
                            {activeTab === "student" && studentData && (
                                <StudentModule
                                    data={studentData}
                                    refreshData={refreshDashboardData}
                                />
                            )}

                            {/* Keep samples for others momentarily */}
                            {activeTab === "parent" && <ParentModule data={SAMPLE_PARENT_DATA} />}
                            {activeTab === "teacher" && (
                                session?.teacher ? (
                                    <TeacherModule
                                        data={SAMPLE_TEACHER_DATA}
                                        onNavigateToAssistant={() => router.push("/assistant")}
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-4">🔒</div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                            Teacher Access Required
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            Verify your email to unlock teacher tools and AI grading features.
                                        </p>
                                        <Link
                                            href="/verify"
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
                                        >
                                            Verify Email →
                                        </Link>
                                    </div>
                                )
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
