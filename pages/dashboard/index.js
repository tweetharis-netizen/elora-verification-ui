import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { getSession, saveSession } from "@/lib/session";
import { motion, AnimatePresence } from "framer-motion";
import { getRecommendations, getRecommendationReason, searchVideos } from "@/lib/videoLibrary";
import { SubmissionModal } from "@/components/SubmissionModal";
import { GradingModal } from "@/components/GradingModal";
import { NotificationProvider, notify } from "@/components/Notifications";
import { generateDemoData, DemoModeBanner } from "@/lib/demoData";

// SYSTEM CONSTANTS
const COUNTRIES = ["Singapore", "United States", "United Kingdom", "Australia", "Malaysia", "Other"];
const SUBJECTS = ["General", "Math", "Science", "English", "History", "Geography", "Computing", "Physics", "Chemistry", "Biology", "Economics"];
const SUBJECTS_MAP = {
    "Singapore": {
        "Primary": ["English", "Mathematics", "Science", "Chinese", "Malay", "Tamil"],
        "Secondary": ["English", "Elementary Math", "Additional Math", "Physics", "Chemistry", "Biology", "Combined Science", "Geography", "History", "Literature", "Social Studies"],
        "Junior College": ["General Paper", "H1 Math", "H2 Math", "H2 Physics", "H2 Chemistry", "H2 Biology", "H2 Economics", "H1 Economics", "History", "Geography", "Literature"]
    },
    "United Kingdom": {
        "Key Stage 1-2": ["English", "Maths", "Science", "History", "Geography", "Art", "Computing"],
        "GCSE": ["English Language", "English Literature", "Maths", "Biology", "Chemistry", "Physics", "Combined Science", "History", "Geography", "Computer Science"],
        "A-Level": ["Maths", "Further Maths", "Physics", "Chemistry", "Biology", "English Literature", "History", "Geography", "Psychology", "Sociology", "Economics"]
    },
    "United States": {
        "Elementary": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
        "Middle School": ["English", "Pre-Algebra", "Algebra 1", "Earth Science", "Life Science", "Physical Science", "World History", "US History"],
        "High School": ["English I-IV", "Algebra 1", "Geometry", "Algebra 2", "Pre-Calculus", "Calculus", "Biology", "Chemistry", "Physics", "US History", "World History", "Government", "Economics"]
    },
    "Other": ["General", "Math", "Science", "English", "History", "Geography", "Computing", "Physics", "Chemistry", "Biology", "Economics"]
};

function getCountrySubjects(country, level) {
    if (!country || !SUBJECTS_MAP[country]) return SUBJECTS_MAP["Other"];

    // Simple heuristic to match level string to category
    const map = SUBJECTS_MAP[country];
    if (country === "Singapore") {
        if (level.includes("Primary")) return map["Primary"];
        if (level.includes("Secondary")) return map["Secondary"];
        if (level.includes("Junior")) return map["Junior College"];
    } else if (country === "United Kingdom") {
        if (level.includes("Year 1") || level.includes("Year 2") || level.includes("Year 3") || level.includes("Year 4") || level.includes("Year 5") || level.includes("Year 6")) return map["Key Stage 1-2"];
        if (level.includes("Year 12") || level.includes("Year 13")) return map["A-Level"];
        return map["GCSE"]; // Years 7-11 roughly
    } else if (country === "United States") {
        if (level.includes("Grade 1") || level.includes("Grade 2") || level.includes("Grade 3") || level.includes("Grade 4") || level.includes("Grade 5")) return map["Elementary"];
        if (level.includes("Grade 6") || level.includes("Grade 7") || level.includes("Grade 8")) return map["Middle School"];
        return map["High School"];
    }

    // Default fallbacks if keys don't match exactly or for other countries
    return Object.values(map).flat();
}
const LEVELS_MAP = {
    "Singapore": ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "Secondary 1", "Secondary 2", "Secondary 3", "Secondary 4", "Junior College 1", "Junior College 2"],
    "United States": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    "United Kingdom": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13"],
    "Australia": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"],
    "Malaysia": ["Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6", "Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6"],
    "Other": ["Elementary", "Middle", "High School", "Tertiary"]
};

function getCountryLevels(country) {
    return LEVELS_MAP[country] || LEVELS_MAP["Other"];
}

function generateJoinCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ----------------------------------------------------------------------
// COMPONENTS: UI UTILITIES
// ----------------------------------------------------------------------

function cn(...inputs) {
    return inputs.filter(Boolean).join(" ");
}

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
        return `${x},${y} `;
    }).join(" ");
    return (
        <div className="relative w-full overflow-hidden" style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={`gradient - ${color} `} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.path
                    d={`M 0, 100 L 0, ${100 - ((data[0] - min) / range) * 100} ${points.split(" ").map(p => `L ${p}`).join(" ")} L 100, 100 Z`}
                    fill={`url(#gradient - ${color})`}
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
                            style={{ backgroundColor: color, height: `${h}% ` }}
                            initial={{ height: 0 }} animate={{ height: `${h}% ` }} transition={{ duration: 0.8, delay: i * 0.05 }}
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
                        <div className={`text - [10px] px - 1.5 py - 0.5 rounded - md font - bold ${item.score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : item.score >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'} `}>
                            {item.score}%
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h - full rounded - full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'} `}
                            style={{ width: `${item.score}% ` }}
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
        resources: session?.classroom?.resources || [], // Sync resources here
        quizzes: session?.classroom?.quizzes || [], // Sync quizzes here
        isPreview: false
    };
}

function computeClassMetrics(linkedStudents = [], isVerified = true) {
    // DEMO DATA for unverified users
    if (!isVerified) {
        return {
            avgEngagement: 48,
            topSubject: "Advanced Calculus",
            totalHours: "156.0",
            heatmapData: [
                { subject: "Math", score: 82, students: 15 },
                { subject: "Physics", score: 68, students: 12 },
                { subject: "Chemistry", score: 91, students: 10 },
                { subject: "English", score: 75, students: 20 },
            ],
            recommendedVideos: getRecommendations("Math", "Newton's Second Law"),
            recommendationReason: "Demo: Newton's second law is a common struggle point.",
            isPreview: true
        };
    }

    const safeStudents = Array.isArray(linkedStudents) ? linkedStudents : [];
    if (safeStudents.length === 0) return {
        avgEngagement: 0,
        topSubject: "N/A",
        totalHours: "0.0",
        heatmapData: [],
        recommendedVideos: [],
        vibe: "Focused",
        sentimentInsight: "Waiting for student activity."
    };

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

    // Detect struggle points (any subject with average < 70)
    // For now, we'll simulate the "score" per student based on their query count for the demo
    const subjectsWithMetrics = entries.map(e => {
        const subjectName = e[0];
        const studentCount = e[1];
        const avgScore = 75 + (Math.floor(Math.random() * 20) - 10); // Simulated realistic average
        return { name: subjectName, students: studentCount, avg: avgScore };
    });

    const heatmapData = subjectsWithMetrics.length > 0
        ? subjectsWithMetrics.map(s => ({ subject: s.name, score: s.avg, students: s.students }))
        : [
            { subject: "Math", score: 78, students: 12 },
            { subject: "Physics", score: 65, students: 8 },
            { subject: "English", score: 88, students: 15 },
        ];

    const mainStruggle = heatmapData.find(h => h.score < 70);

    // AI Class Insights 2.0 Logic
    const struggleTopic = mainStruggle?.subject;
    const recommendationReason = getRecommendationReason(struggleTopic, linkedStudents.length);
    const recommendedVideos = getRecommendations(subjectsWithMetrics[0]?.name || 'math', struggleTopic);

    // "The Pulse" Sentiment Logic
    const sentiments = ["Focused", "Curious", "Confused", "Excited", "Strained"];
    const avgOverallScore = heatmapData.length > 0 ? Math.round(heatmapData.reduce((sum, item) => sum + item.score, 0) / heatmapData.length) : 0;
    const vibe = struggleTopic ? "Confused" : (avgOverallScore > 85 ? "Excited" : "Focused");
    const sentimentInsight = struggleTopic
        ? `${Math.floor(safeStudents.length * 0.4) + 1} students feeling ${vibe.toLowerCase()} about ${struggleTopic}.`
        : `Class is generally ${vibe.toLowerCase()} and maintaining momentum.`;

    // AI Micro-Coaching (Teacher Strategic Intelligence)
    const recentSubmissions = safeStudents.flatMap(s => s.classroom?.submissions || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const struggleSubmissions = recentSubmissions.filter(s => s.score / s.total < 0.7);

    let coachingNote = null;
    if (struggleSubmissions.length >= 2) {
        const commonTopic = struggleSubmissions[0].quizTitle;
        coachingNote = {
            topic: commonTopic,
            count: struggleSubmissions.length,
            advice: `Elora detected a pattern: ${struggleSubmissions.length} students are stalling on "${commonTopic}".Try a 5 - minute visual analogy before the next quiz.`
        };
    }

    return {
        avgEngagement: Math.round(totalMessages / safeStudents.length),
        topSubject: top ? top[0] : "General",
        totalHours: (safeStudents.length > 0 ? totalMinutes / 60 : 0).toFixed(1),
        heatmapData,
        recommendedVideos,
        struggleTopic,
        coachingNote, // NEW
        recommendationReason,
        vibe,
        sentimentInsight,
        isPreview: !isVerified
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

function StudentModule({ data, onStartQuiz, session, onUpdateSession, isDemoMode, demoData, isSubmitting, setIsSubmitting, setActiveAssignment }) {
    if (!data) return null;
    const [selectedClassIndex, setSelectedClassIndex] = useState(0);
    const [joinCodeInput, setJoinCodeInput] = useState("");
    const [joinStatus, setJoinStatus] = useState("");

    const handleJoinClass = () => {
        if (!joinCodeInput) return;
        setJoinStatus("Syncing...");
        setTimeout(() => {
            // Mock backend verification
            if (joinCodeInput.length === 6) {
                const s = getSession();

                // Initialize joinedClasses if it doesn't exist
                if (!Array.isArray(s.joinedClasses)) s.joinedClasses = [];

                // Check if already joined
                const alreadyJoined = s.joinedClasses.some(c => c.code === joinCodeInput);
                if (alreadyJoined) {
                    setJoinStatus("Already joined ✓");
                    setTimeout(() => setJoinStatus(""), 3000);
                    return;
                }

                // Add new class to array
                const newClass = {
                    name: "Physics 101", // Mock data - would come from server
                    code: joinCodeInput,
                    subject: "Physics",
                    level: "Grade 10",
                    country: "United States",
                    vision: "Focus on conceptual understanding"
                };
                s.joinedClasses.push(newClass);
                onUpdateSession(s);
                setJoinStatus("Joined! ✅");
                setJoinCodeInput("");
            } else {
                setJoinStatus("Invalid ❌");
            }
            setTimeout(() => setJoinStatus(""), 3000);
        }, 1000);
    };

    const handleLeaveClass = (index) => {
        const s = getSession();
        s.joinedClasses.splice(index, 1);
        onUpdateSession(s);
        if (selectedClassIndex >= s.joinedClasses.length) {
            setSelectedClassIndex(Math.max(0, s.joinedClasses.length - 1));
        }
    };

    const joinedClasses = session?.joinedClasses || [];
    const currentClass = joinedClasses[selectedClassIndex];

    return (
        <div className="space-y-6">
            {/* AI Magic Insights Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-[2.5rem] p-8 mb-8 group cursor-pointer"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-600" />
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest mb-4">
                            <span className="animate-pulse">●</span> AI Strategy Insight
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
                            You're mastering <span className="text-cyan-300">{session?.classroom?.submissions?.[0]?.quizTitle || "Math Essentials"}</span> {session?.classroom?.submissions?.[0]?.score > 0 ? "with confidence." : "faster today."}
                        </h3>
                        <p className="text-indigo-100 text-sm font-medium opacity-90 max-w-md">
                            {session?.classroom?.submissions?.[0]
                                ? `Elora noticed you excelled at ${session.classroom.submissions[0].details.find(d => d.isCorrect)?.question.split(' ').slice(0, 2).join(' ') || 'recent topics'}. Ready for the next tier ? `
                                : "Elora is analyzing your latest sessions to build your personalized mastery path. Complete a quiz to see your strategy here."}
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all group-hover:shadow-indigo-500/50">
                        Level Up Now →
                    </button>
                </div>
            </motion.div>

            {/* Join Class Banner / Class Switcher */}
            {joinedClasses.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-gradient-to-r from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform text-4xl">🎓</div>
                    <div className="relative z-10 max-w-xl">
                        <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Sync with your Class</h2>
                        <p className="text-indigo-100/80 text-sm font-medium mb-6">Enter the 6-digit code from your teacher to unlock class-specific quizzes and resources.</p>
                        <div className="flex gap-3">
                            <input
                                value={joinCodeInput}
                                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                                placeholder="CLASS-CODE"
                                maxLength={6}
                                className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm font-black tracking-widest focus:bg-white/20 outline-none transition-all placeholder:text-white/40 w-32 md:w-48"
                            />
                            <button
                                onClick={handleJoinClass}
                                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                            >
                                {joinStatus || "Join →"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="mb-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">My Classes</h3>
                        <button
                            onClick={() => {
                                // Show join modal
                                setJoinCodeInput("");
                                setJoinStatus("");
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                            + Join Another
                        </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {joinedClasses.map((cls, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedClassIndex(idx)}
                                className={`group relative px - 6 py - 4 rounded - 2xl font - bold text - sm whitespace - nowrap transition - all flex - shrink - 0 ${selectedClassIndex === idx
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                    } `}
                            >
                                <div>
                                    <div className="font-black">{cls.name}</div>
                                    <div className="text-[10px] opacity-70">{cls.subject} • {cls.code}</div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLeaveClass(idx);
                                    }}
                                    className={`absolute top - 2 right - 2 w - 6 h - 6 rounded - full flex items - center justify - center opacity - 0 group - hover: opacity - 100 transition - opacity ${selectedClassIndex === idx ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                        } `}
                                    title="Leave class"
                                >
                                    ✕
                                </button>
                            </button>
                        ))}
                    </div>

                    {/* Join Code Input (collapsed) */}
                    {joinCodeInput !== "" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex gap-3 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                            <input
                                value={joinCodeInput}
                                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                                placeholder="ENTER-CODE"
                                maxLength={6}
                                className="flex-1 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-500/30 rounded-xl px-4 py-2 text-sm font-black tracking-widest focus:border-indigo-500 outline-none transition-all"
                            />
                            <button
                                onClick={handleJoinClass}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                            >
                                {joinStatus || "Join"}
                            </button>
                            <button
                                onClick={() => setJoinCodeInput("")}
                                className="text-slate-400 hover:text-slate-600 px-2"
                            >
                                ✕
                            </button>
                        </motion.div>
                    )}
                </div>
            )}

            {/* NEW: Knowledge Forest (Visual Gamification) */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm animate-reveal relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-4xl">🌳</div>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Your Knowledge Forest</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">Mastery Visualizer</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Growing: {data.recentTopics.length} Topics
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-end justify-center gap-12 py-8 min-h-[160px] bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    {data.recentTopics.length > 0 ? (
                        data.recentTopics.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ delay: i * 0.1, type: 'spring' }}
                                className="flex flex-col items-center group cursor-pointer"
                            >
                                <div className="relative mb-2">
                                    {/* Tree visual based on progress */}
                                    <div
                                        className="text-4xl transition-all duration-1000 group-hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                        style={{
                                            transform: `scale(${0.5 + (t.progress / 100)})`,
                                            filter: t.progress > 80 ? 'hue-rotate(0deg)' : 'hue-rotate(-40deg)'
                                        }}
                                    >
                                        {t.progress > 90 ? '🌳' : t.progress > 50 ? '🌿' : '🌱'}
                                    </div>
                                    {t.progress > 95 && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }} className="absolute -top-1 -right-1 text-[10px]">✨</motion.div>}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-indigo-500 transition-colors">{t.name}</span>
                                <div className="text-[10px] font-bold text-slate-900 dark:text-white">{t.progress}%</div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center opacity-30 italic text-xs font-medium">Complete a lesson to plant your first tree.</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Streak", val: `${data.streak} d`, icon: "🔥", color: "from-orange-500 to-rose-500" },
                    { label: "Today", val: `${data.todayMinutes} m`, icon: "⏱️", color: "from-indigo-500 to-violet-500" },
                    { label: "Momentum", val: "+15%", icon: "🚀", color: "from-fuchsia-500 to-indigo-500" },
                    { label: "Progress", val: `${data.overallProgress}% `, icon: "📈", color: "from-emerald-500 to-cyan-500" },
                    { label: "Queries", val: data.achievements.filter(a => a.earned).length, icon: "💬", color: "from-amber-500 to-orange-500" }
                ].map((s, i) => (
                    <motion.div key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="elora-glass dark:elora-glass-dark p-6 rounded-[2rem] border border-white/10 shadow-xl overflow-hidden group relative"
                    >
                        <div className={`absolute - top - 12 - right - 12 w - 24 h - 24 bg - gradient - to - br ${s.color} opacity - 10 group - hover: opacity - 20 blur - 2xl transition - opacity`} />
                        <div className="flex items-center gap-4 mb-3">
                            <span className="text-3xl filter drop-shadow-md">{s.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white font-[var(--font-outfit)]">{s.val}</div>
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
                                    <div className="h-full bg-indigo-500" style={{ width: `${t.progress}% ` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {data.quizzes && data.quizzes.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 animate-reveal">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black">AI Quiz Center</h3>
                            <p className="text-indigo-100 text-xs font-medium opacity-80 mt-1">Elora has generated these challenges for you.</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🎯</div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {data.quizzes.map(q => (
                            <div key={q.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-between hover:bg-white/20 transition-all cursor-pointer group">
                                <div>
                                    <h4 className="font-bold text-lg mb-2">{q.title}</h4>
                                    <p className="text-xs text-indigo-100 mb-6">{q.questions.length} Questions • Open response</p>
                                </div>
                                <button
                                    onClick={() => onStartQuiz(q)}
                                    className="w-full py-3 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg group-hover:scale-105 transition-all"
                                >
                                    Start Quiz →
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.resources && data.resources.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm animate-reveal">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
                        <span className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-lg">📚</span>
                        Classroom Materials
                    </h3>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {data.resources.map(r => (
                            <div key={r.id} className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-700/50 flex flex-col gap-4 group hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        {r.type === 'Video' ? '🎬' : '📄'}
                                    </div>
                                    <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">↗ View</a>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">{r.title}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">{r.type}</p>
                                    {r.notes && (
                                        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-500/20">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mb-1">Teacher's Note</p>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed">"{r.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Assignments Section */}
            {session?.classroom?.assignments && session.classroom.assignments.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm animate-reveal">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-lg">📝</span>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">My Assignments</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Tasks</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {session.classroom.assignments.length} Total
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {session.classroom.assignments.map(assignment => {
                            // Check if submitted
                            const hasSubmitted = session?.classroom?.submissions?.some(
                                s => s.assignmentId === assignment.id
                            );
                            const assignmentClassCode = assignment.classCode || "ALL";
                            const currentClassCode = currentClass?.code || "";

                            // Only show if assignment is for current class or for all students
                            if (assignmentClassCode !== "ALL" && assignmentClassCode !== currentClassCode && joinedClasses.length > 0) {
                                return null;
                            }

                            return (
                                <motion.div
                                    key={assignment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-900/40 dark:to-slate-800/40 p-6 rounded-2xl border-2 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h4 className="text-base font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{assignment.title}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {assignment.description || "No description provided"}
                                            </p>
                                        </div>
                                        {hasSubmitted && (
                                            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-2">
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold mb-4">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <span>📅</span>
                                            <span>Due {assignment.dueDate}</span>
                                        </div>
                                        <div className={`px - 2 py - 1 rounded - md ${hasSubmitted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'} `}>
                                            {hasSubmitted ? "Submitted" : "Pending"}
                                        </div>
                                    </div>
                                    {!hasSubmitted && (
                                        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all group-hover:scale-[1.02]">
                                            Start Assignment →
                                        </button>
                                    )}
                                    {hasSubmitted && (
                                        <button className="w-full bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-3 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-slate-200 dark:border-slate-600 transition-all">
                                            View Submission
                                        </button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function TeacherModule({ students, metrics, onAddStudent, session: activeSession, onUpdateSession, isDemoMode, demoData, isGrading, setIsGrading, setActiveSubmission, setActiveAssignment }) {
    if (!activeSession) return null;
    const [selectedTab, setSelectedTab] = useState("overview"); // overview, assignments, insights
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [newClassSubject, setNewClassSubject] = useState("");
    const [newClassLevel, setNewClassLevel] = useState("");
    const [newClassCountry, setNewClassCountry] = useState("");
    const [newClassVision, setNewClassVision] = useState("");
    const [nameInput, setNameInput] = useState("");
    const [code, setCode] = useState("");

    // UI States for Wizard/Modals
    const [editingClass, setEditingClass] = useState(null);
    const [isEditingClass, setIsEditingClass] = useState(false); // Distinction between creating new and editing existing
    const [classWizardStep, setClassWizardStep] = useState(1); // 1: Basics, 2: Localization, 3: Vision

    // Assignment Wizard States
    const [assignmentWizardStep, setAssignmentWizardStep] = useState(1); // 1: Topic/Title, 2: Content/AI, 3: Review
    const [assignmentFile, setAssignmentFile] = useState(null);

    // Mock Assignments
    const [assignments, setAssignments] = useState([
        { id: 1, title: "Algebra Basics", dueDate: "2026-02-01", status: "Active", submissions: 12 },
        { id: 2, title: "Cell Structure", dueDate: "2026-01-30", status: "Active", submissions: 5 },
    ]);

    const [resources, setResources] = useState(() => activeSession?.classroom?.resources || [
        { id: 'r1', title: "Khan Academy: Intro to Algebra", type: "Video", link: "https://www.youtube.com/watch?v=NybHckSEQBI" }
    ]);

    // Sync resources to session
    useEffect(() => {
        const nextSession = { ...activeSession };
        if (!nextSession.classroom) nextSession.classroom = {};
        nextSession.classroom.resources = resources;
        onUpdateSession(nextSession);
    }, [resources]);

    const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
    const [assignmentTopic, setAssignmentTopic] = useState("");
    const [assignmentDescription, setAssignmentDescription] = useState("");
    const [assignmentDueDate, setAssignmentDueDate] = useState("");
    const [assignmentContentSource, setAssignmentContentSource] = useState("ai"); // 'ai' or 'manual'
    const [assignmentTargetClass, setAssignmentTargetClass] = useState("");
    const [assignmentTargetStudents, setAssignmentTargetStudents] = useState([]);
    const [assignmentQuestions, setAssignmentQuestions] = useState([]);
    const [assignmentRubric, setAssignmentRubric] = useState(null);

    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
    const [quizTopic, setQuizTopic] = useState("");
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [quizzes, setQuizzes] = useState(() => activeSession?.classroom?.quizzes || []);

    const [isSearchingVideos, setIsSearchingVideos] = useState(false);
    const [videoSearchQuery, setVideoSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [noteInput, setNoteInput] = useState("");

    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [voiceStage, setVoiceStage] = useState('idle'); // idle, listening, transcribing, ready
    const [voiceTranscript, setVoiceTranscript] = useState("");

    const [isPickingContext, setIsPickingContext] = useState(false);
    const [contextAction, setContextAction] = useState(null); // 'lesson', 'assignment', 'quiz'


    // Sync quizzes to session
    useEffect(() => {
        const nextSession = { ...activeSession };
        if (!nextSession.classroom) nextSession.classroom = {};
        nextSession.classroom.quizzes = quizzes;
        onUpdateSession(nextSession);
    }, [quizzes]);

    const handleAdd = () => {
        if (!nameInput || !code) return;
        onAddStudent(code, nameInput);
        setNameInput("");
        setCode("");
    };

    const handleDeleteResource = (id) => {
        setResources(resources.filter(r => r.id !== id));
    };

    const handleCreateQuiz = () => {
        if (!quizTopic) return;
        const newQuiz = {
            id: `q_${Date.now()} `,
            title: quizTopic,
            questions: [
                { id: 1, text: `Explain the fundamental concept of ${quizTopic}.`, type: "open" },
                { id: 2, text: `What is the most significant challenge in ${quizTopic}?`, type: "open" }
            ],
            assignedAt: new Date().toISOString(),
            submissions: []
        };
        setQuizzes([newQuiz, ...quizzes]);
        setIsCreatingQuiz(false);
        setQuizTopic("");
    };


    const handleVoiceComm = () => {
        setIsVoiceActive(true);
        setVoiceStage('listening');

        // Context Awareness: Inherit from selected class
        const activeClass = classes.find(c => c.id === selectedClassId);
        const contextSubject = activeClass?.subject || "General Education";
        const contextLevel = activeClass?.level || "all grades";
        const className = activeClass?.name || "the class";

        // Mock Transcription Workflow
        setTimeout(() => {
            setVoiceStage('transcribing');
            setTimeout(() => {
                setVoiceTranscript(`Create a ${contextSubject} review session for ${className}(${contextLevel}) focused on the key concepts we discussed this week.`);
                setVoiceStage('ready');
            }, 2000);
        }, 3000);
    };

    // Ensure classes exist
    const classes = activeSession?.classroom?.classes || [];

    const handleDeleteClass = (id) => {
        const cls = classes.find(c => c.id === id);
        if (!cls) return; // Should not happen

        const confirmName = window.prompt(`To confirm deletion, type "${cls.name}": `);
        if (confirmName !== cls.name) {
            alert("Class name did not match. Deletion cancelled.");
            return;
        }

        const nextSession = { ...activeSession };
        if (nextSession.classroom?.classes) {
            nextSession.classroom.classes = nextSession.classroom.classes.filter(c => c.id !== id);
            onUpdateSession(nextSession);
            if (selectedClassId === id) setSelectedClassId(null);
        }
    };

    const handleOpenSettings = (cls) => {
        setEditingClass({ ...cls }); // Shallow copy to prevent immediate changes to session
        // Pre-fill state (optional, if we use separate inputs, but we're editing editingClass directly)
        setNewClassName(cls.name);
        setNewClassSubject(cls.subject);
        setNewClassLevel(cls.level);
        setNewClassCountry(cls.country);
        setNewClassVision(cls.vision || "");

        setIsEditingClass(true); // Indicate we are editing
        setIsCreating(false); // Do NOT trigger the wizard
    };

    const handleOpenAssignment = (cls) => {
        // Direct Assignment Creation from Detail View
        setAssignmentTopic(`${cls.subject} ${cls.level} Assignment`); // Smart pre-fill
        setIsCreatingAssignment(true);
        // We need a way to track *which* class this assignment is for if opened directly
        // Ideally we'd store a 'targetClassId' state, but for now let's rely on the user seeing the pre-filled topic
        // effectively guiding them. Or better, update handleCreateAssignment to use selectedClassId if available.
    };

    const handleUpdateClassSettings = (updatedClass) => {
        const nextSession = { ...activeSession };
        if (!nextSession.classroom?.classes) return;

        nextSession.classroom.classes = nextSession.classroom.classes.map(c =>
            c.id === updatedClass.id ? { ...c, ...updatedClass } : c
        );

        onUpdateSession(nextSession);
        setIsEditingClass(false);
        setEditingClass(null);
        notify("Class settings updated successfully!", "success");
    };

    const handleCreateClass = () => {
        if (!newClassName) return;

        const nextSession = { ...activeSession };
        if (!nextSession.classroom) nextSession.classroom = { classes: [] };
        if (!nextSession.classroom.classes) nextSession.classroom.classes = [];

        if (isEditingClass && editingClass) {
            // Update existing class
            nextSession.classroom.classes = nextSession.classroom.classes.map(c =>
                c.id === editingClass.id ? {
                    ...c,
                    name: newClassName,
                    subject: newClassSubject || "General",
                    level: newClassLevel || "Primary 1",
                    country: newClassCountry || "Singapore",
                    vision: newClassVision || ""
                } : c
            );
        } else {
            // Create new class
            const newClass = {
                id: `cls_${Date.now()} `,
                joinCode: generateJoinCode(),
                name: newClassName,
                subject: newClassSubject || "General",
                level: newClassLevel || "Primary 1",
                country: newClassCountry || "Singapore",
                vision: newClassVision || "",
                studentCount: 0,
                color: "indigo"
            };
            nextSession.classroom.classes.push(newClass);
        }

        onUpdateSession(nextSession);

        // Reset state
        setIsCreating(false);
        setIsEditingClass(false);
        setEditingClass(null);
        setNewClassName("");
        setNewClassSubject("");
        setNewClassLevel("");
        setNewClassCountry("");
        setNewClassVision("");
        setClassWizardStep(1);
    };

    const handleCreateAssignment = () => {
        if (!assignmentTopic) return;

        // Validate due date is not in the past
        if (assignmentDueDate) {
            const selectedDate = new Date(assignmentDueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                alert("Due date cannot be in the past. Please select a future date.");
                return;
            }
        }

        const nextSession = { ...activeSession };
        if (!nextSession.classroom) nextSession.classroom = {};
        if (!Array.isArray(nextSession.classroom.assignments)) nextSession.classroom.assignments = [];

        // Build questions array from assignmentQuestions state
        const questions = assignmentQuestions.map((q, idx) => ({
            id: `q_${idx + 1}`,
            question: q.text,
            type: q.type || "open",
            points: q.points || 10,
            options: q.options || []
        }));

        const newAsgn = {
            id: `assign_${Date.now()}`,
            title: assignmentTopic,
            description: assignmentDescription || `Complete this ${assignmentContentSource === 'ai' ? 'AI-generated' : 'custom'} assignment on ${assignmentTopic}`,
            dueDate: assignmentDueDate || "No due date",
            classCode: assignmentTargetClass || selectedClassId || "ALL",
            assignedTo: assignmentTargetStudents.length > 0 ? assignmentTargetStudents : "ALL",
            status: "Active",
            submissions: [],
            createdBy: nextSession.email || "teacher",
            contentSource: assignmentContentSource,
            type: assignmentFile ? "Manual Upload" : "AI Generated",
            attachment: assignmentFile || null,
            questions: questions,
            totalPoints: questions.reduce((sum, q) => sum + (q.points || 10), 0),
            createdAt: new Date().toISOString(),
            rubric: assignmentRubric || null
        };

        // Add to session
        nextSession.classroom.assignments.push(newAsgn);
        onUpdateSession(nextSession);

        // Update local state
        setAssignments([newAsgn, ...assignments]);

        // Reset all assignment form fields
        setIsCreatingAssignment(false);
        setAssignmentTopic("");
        setAssignmentDescription("");
        setAssignmentDueDate("");
        setAssignmentFile(null);
        setAssignmentContentSource("ai");
        setAssignmentTargetClass("");
        setAssignmentTargetStudents([]);
        setAssignmentQuestions([]);
        setAssignmentRubric(null);
        setAssignmentWizardStep(1);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Sidebar: Class List */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="space-y-1">
                        {[
                            { id: "overview", label: "📊 Overview" },
                            { id: "assignments", label: "📝 Assignments" },
                            { id: "submissions", label: "🎯 Submissions" },
                            { id: "insights", label: "💡 AI Insights" }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`w - full text - left px - 4 py - 3 rounded - xl text - sm font - bold transition - all ${selectedTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"} `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 mb-2 mt-6">My Classes</div>
                    <div className="space-y-1">
                        <button
                            onClick={() => setSelectedClassId(null)}
                            className={`w - full text - left px - 4 py - 3 rounded - xl text - sm font - bold transition - all ${selectedClassId === null ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"} `}
                        >
                            All Students
                        </button>
                        {classes.map(c => (
                            <div key={c.id} className="group relative">
                                <button
                                    onClick={() => setSelectedClassId(c.id)}
                                    className={`w - full text - left px - 4 py - 3 rounded - xl text - sm font - bold transition - all flex items - center justify - between ${selectedClassId === c.id ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30" : "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"} `}
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate pr-8">{c.name}</span>
                                        <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-tighter">Code: {c.joinCode}</span>
                                    </div>
                                    <span className="text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-500 group-hover:opacity-0 transition-opacity">{c.studentCount || 0}</span>
                                </button>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenSettings(c); }}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg"
                                        title="Edit Settings"
                                    >
                                        ⚙️
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }}
                                        className="w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"
                                        title="Delete Class"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button
                            onClick={() => {
                                setIsCreating(true);
                                setIsEditingClass(false);
                                setEditingClass(null);
                                setClassWizardStep(1);
                                setNewClassName("");
                                setNewClassSubject("");
                                setNewClassLevel("");
                                setNewClassCountry("");
                                setNewClassVision("");
                            }}
                            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                        >
                            + Create New Class
                        </button>
                    </div>
                </div>

                {/* CLASS WIZARD MODAL */}
                <AnimatePresence>
                    {isCreating && !isCreatingAssignment && !isCreatingQuiz && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsCreating(false)} />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                                                {isEditingClass ? '⚙️' : '✨'}
                                            </div>
                                            <h3 className="text-2xl font-black">{isEditingClass ? 'Class Settings' : 'New Classroom'}</h3>
                                        </div>
                                        <p className="text-indigo-100 text-xs font-medium opacity-80">
                                            {isEditingClass ? `Update configuration for ${editingClass?.name}` : "Create a new space for your students."}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(step => (
                                            <div key={step} className={`w - 2 h - 2 rounded - full transition - all ${classWizardStep >= step ? 'bg-white' : 'bg-white/30'} `} />
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    {classWizardStep === 1 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Class Name</label>
                                                <input
                                                    autoFocus
                                                    value={newClassName}
                                                    onChange={e => setNewClassName(e.target.value)}
                                                    placeholder="e.g. Physics 101 - Morning"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all placeholder:opacity-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Region / Country</label>
                                                <select
                                                    value={newClassCountry}
                                                    onChange={e => {
                                                        setNewClassCountry(e.target.value);
                                                        setNewClassLevel("");
                                                        setNewClassSubject("");
                                                    }}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
                                                >
                                                    <option value="">Select Region</option>
                                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </motion.div>
                                    )}

                                    {classWizardStep === 2 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Academic Level</label>
                                                    <select
                                                        value={newClassLevel}
                                                        onChange={e => setNewClassLevel(e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
                                                    >
                                                        <option value="">Select Level</option>
                                                        {getCountryLevels(newClassCountry).map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Primary Subject</label>
                                                        <select
                                                            value={newClassSubject}
                                                            onChange={e => setNewClassSubject(e.target.value)}
                                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
                                                        >
                                                            <option value="">Select Subject</option>
                                                            {(newClassCountry && newClassLevel) ? getCountrySubjects(newClassCountry, newClassLevel).map(s => <option key={s} value={s}>{s}</option>) : <option value="">Select Level First</option>}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            {!newClassLevel && <p className="text-[10px] text-amber-500 font-bold">Please select a level to see relevant subjects.</p>}
                                        </motion.div>
                                    )}

                                    {classWizardStep === 3 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Classroom Vision (Optional)</label>
                                                <textarea
                                                    value={newClassVision}
                                                    onChange={e => setNewClassVision(e.target.value)}
                                                    placeholder="e.g. A focus on inquiry-based learning and critical thinking..."
                                                    className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all resize-none placeholder:opacity-50"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-2">Elora will tailor her responses based on this vision.</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => {
                                                if (classWizardStep > 1) setClassWizardStep(classWizardStep - 1);
                                                else setIsCreating(false);
                                            }}
                                            className="px-6 py-4 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            {classWizardStep === 1 ? "Cancel" : "Back"}
                                        </button>
                                        {classWizardStep < 3 ? (
                                            <button
                                                onClick={() => setClassWizardStep(classWizardStep + 1)}
                                                disabled={classWizardStep === 1 ? (!newClassName || !newClassCountry) : (!newClassLevel || !newClassSubject)}
                                                className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl text-xs font-black hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next Step →
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleCreateClass}
                                                className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl text-xs font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                                            >
                                                {isEditingClass ? 'Save Changes' : 'Create Class'} 🚀
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Quick Tools */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-5 text-white shadow-lg">
                    <h4 className="font-bold text-sm mb-2">⚡ Teacher Tools</h4>
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                setContextAction('lesson');
                                if (classes.length > 1 && !selectedClassId) setIsPickingContext(true);
                                else {
                                    const cls = classes.find(c => c.id === selectedClassId) || classes[0] || { name: 'General', subject: 'Math', level: 'Primary', country: 'Singapore' };
                                    const topic = metrics.struggleTopic ? `Review of ${metrics.struggleTopic} ` : 'New Lesson';
                                    router.push(`/ assistant ? action = lesson_plan & topic=${topic}& class=${cls.name}& subject=${cls.subject}& level=${cls.level}& country=${cls.country} `);
                                }
                            }}
                            className="block w-full text-left bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                            📝 Plan a Lesson
                        </button>
                        <button
                            onClick={() => {
                                setContextAction('quiz');
                                if (classes.length > 1 && !selectedClassId) setIsPickingContext(true);
                                else {
                                    const cls = classes.find(c => c.id === selectedClassId) || classes[0] || { name: 'General', subject: 'Math', level: 'Primary', country: 'Singapore' };
                                    router.push(`/ assistant ? action = quiz & class=${cls.name}& subject=${cls.subject}& level=${cls.level}& country=${cls.country} `);
                                }
                            }}
                            className="block w-full text-left bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                            🎯 AI Quiz Genius
                        </button>
                        <button
                            onClick={() => setIsSearchingVideos(true)}
                            className="block w-full text-left bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                            🔍 Find Videos
                        </button>
                        <button
                            onClick={handleVoiceComm}
                            className="block w-full text-left bg-indigo-400/20 hover:bg-indigo-400/30 px-3 py-2 rounded-lg text-xs font-bold transition-all border border-indigo-400/30 animate-pulse-subtle"
                        >
                            🎙️ Voice-to-Task (BETA)
                        </button>
                    </div>
                </div>

                {/* AI Configuration */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <span>⚙️</span> AI Classroom Rules
                    </h4>
                    <textarea
                        value={activeSession?.classroom?.teacherRules || ""}
                        onChange={(e) => {
                            const s = getSession();
                            if (!s.classroom) s.classroom = {};
                            s.classroom.teacherRules = e.target.value;
                            saveSession(s);
                        }}
                        placeholder="e.g. Only ask about fractions, keep it simple..."
                        className="w-full h-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[10px] font-medium text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    />
                    <p className="text-[9px] text-slate-400 mt-2 italic px-1">Rules are applied to all student AI sessions in this class.</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 space-y-8">
                {/* Insights Summary with Quiz Stats */}
                {selectedTab === "insights" && quizzes.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm animate-reveal">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                            <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-lg">💡</span>
                            Quiz Analytics
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {quizzes.map(q => (
                                <div key={q.id} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{q.title}</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">0 <span className="text-xs font-medium opacity-50">subs</span></p>
                                    <p className="text-[10px] font-bold text-emerald-500 mt-2">No submissions yet.</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Real-time Activity Feed</h4>
                            <div className="space-y-4">
                                {students.slice(0, 3).map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-600">
                                                {s.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{i === 0 ? 'Just started' : '20m ago'} • {quizzes[0]?.title || 'General Quiz'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active Now</span>
                                        </div>
                                    </div>
                                ))}
                                {students.length === 0 && (
                                    <p className="text-xs text-slate-400 font-bold text-center py-8">No recent student activity.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}                {/* Content based on Tab */}
                {selectedTab === "overview" && !selectedClassId && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20">
                                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Total Enrollment</p>
                                <p className="text-3xl sm:text-4xl font-black">{students.length} <span className="text-xs sm:text-sm font-medium opacity-70">students</span></p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Most Active Class</p>
                                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white truncate">{classes[0]?.name || "N/A"}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Class Minutes</p>
                                <p className="text-3xl sm:text-4xl font-black text-emerald-500">{metrics.totalHours}h</p>
                            </div>
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Subject Mastery</h3>
                                    </div>
                                    <div className="h-64 sm:h-80"><ClassHeatmap data={metrics.heatmapData} height={300} /></div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Class Activity</h3>
                                    </div>

                                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
                                        <table className="w-full text-left min-w-[500px]">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-500 text-[10px] sm:text-xs font-black uppercase">
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
                                                    <tr><td colSpan="4" className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold italic bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">No student activity recorded yet.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
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
                                            onClick={() => onAddStudent(code, nameInput)}
                                            className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                            disabled={!activeSession?.verified}
                                        >
                                            Add Student +
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                        <span className="w-10 h-10 bg-slate-100 dark:bg-slate-700/50 rounded-xl flex items-center justify-center text-lg">📂</span>
                                        Managed Materials
                                    </h3>
                                    <div className="space-y-4">
                                        {resources.length === 0 ? (
                                            <p className="text-xs text-slate-400 font-bold text-center py-8">No materials posted yet.</p>
                                        ) : (
                                            resources.map(r => (
                                                <div key={r.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 group">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{r.title}</p>
                                                            <p className="text-[9px] text-indigo-500 font-bold mt-1 uppercase tracking-widest">{r.type} {r.metadata?.views ? `• ${r.metadata.views} views` : ''}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteResource(r.id)}
                                                            className="text-[10px] text-red-400 hover:text-red-500 font-black uppercase tracking-tighter transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                    {r.notes && (
                                                        <div className="mt-3 p-2 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 italic">
                                                            "{r.notes}"
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
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
                            <button
                                onClick={() => setIsCreatingAssignment(true)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                            >
                                + New Assignment
                            </button>
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

                {selectedTab === "submissions" && (
                    <div className="space-y-6 animate-reveal">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Student Submissions</h3>
                            <div className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                {activeSession?.classroom?.submissions?.length || 0} Total
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {(activeSession?.classroom?.submissions || []).map(sub => (
                                <div
                                    key={sub.id}
                                    onClick={() => setSelectedSubmission(sub)}
                                    className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex items-center justify-between hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-xl font-bold text-indigo-600 border border-indigo-500/20">
                                            {sub.studentName[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">{sub.studentName}</h4>
                                            <p className="text-xs text-slate-500">{sub.quizTitle} • {new Date(sub.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Score</p>
                                            <p className={cn("text-xl font-black", sub.score === sub.total ? "text-emerald-500" : "text-indigo-600")}>
                                                {sub.score} / {sub.total}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">→</div>
                                    </div>
                                </div>
                            ))}
                            {(!activeSession?.classroom?.submissions || activeSession?.classroom?.submissions.length === 0) && (
                                <div className="p-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                                    <div className="text-4xl mb-4 grayscale opacity-20">📥</div>
                                    <p className="text-xs font-bold text-slate-400">Waiting for live submissions...</p>
                                </div>
                            )}
                        </div>

                        {/* Submission Detail Modal */}
                        <AnimatePresence>
                            {selectedSubmission && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedSubmission(null)} />
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
                                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-500/20">
                                                    {selectedSubmission.studentName[0]}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{selectedSubmission.studentName}</h3>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-2">{selectedSubmission.quizTitle}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setSelectedSubmission(null)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                                            {selectedSubmission.details.map((d, i) => (
                                                <div key={i} className="space-y-3">
                                                    <div className="flex items-start gap-4">
                                                        <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-1", d.isCorrect ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                                                            {d.isCorrect ? "✓" : "✕"}
                                                        </span>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{d.question}</p>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-[10px]">
                                                                    <span className="text-slate-400 uppercase font-black tracking-tighter mr-2">Student:</span>
                                                                    <span className={cn("font-bold", d.isCorrect ? "text-emerald-500" : "text-rose-500")}>{d.studentAnswer}</span>
                                                                </div>
                                                                {!d.isCorrect && (
                                                                    <div className="text-[10px]">
                                                                        <span className="text-slate-400 uppercase font-black tracking-tighter mr-2">Correct:</span>
                                                                        <span className="text-indigo-500 font-bold">{d.correctAnswer}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 rounded-b-[3rem]">
                                            <div className="bg-indigo-500/5 p-6 rounded-2xl border border-indigo-500/10">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Elora's Pedagogical Analysis</h5>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                                    "The student demonstrated {selectedSubmission.score / selectedSubmission.total > 0.8 ? 'strong conceptual mastery' : 'some hesitation'} in {selectedSubmission.quizTitle}. Recommendation: Focus on {selectedSubmission.details.find(d => !d.isCorrect)?.question.split(' ').slice(0, 3).join(' ') || 'advanced application'} next."
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {selectedTab === "insights" && (
                    <div className="space-y-8 animate-reveal">
                        <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">AI Class Insights</h3>
                            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Analysis Mode: Real-Time Performance</span>
                            </div>
                        </div>

                        {/* Elora's Strategic Strategy Note (Micro-Coaching) */}
                        <AnimatePresence>
                            {metrics.coachingNote && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-amber-500/20 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-20 text-6xl group-hover:rotate-12 transition-transform duration-500">💡</div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="space-y-2 text-center md:text-left">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-[10px] font-black uppercase tracking-widest mb-2">
                                                <span className="animate-pulse">●</span> Elora's Strategy Note
                                            </div>
                                            <h4 className="text-2xl font-black">{metrics.coachingNote.topic} Mastery Alert</h4>
                                            <p className="text-amber-50 text-sm font-medium opacity-90 leading-relaxed max-w-xl">
                                                {metrics.coachingNote.advice}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/ assistant ? action = lesson_plan & topic=${metrics.coachingNote.topic}& subject=${metrics.topSubject} `)}
                                            className="px-8 py-4 bg-white text-orange-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                                        >
                                            Generate Bridge Lesson →
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📊</div>
                                <h4 className="font-bold mb-4 flex items-center gap-2 text-xl relative z-10"><span>📈</span> Performance Summary</h4>
                                <p className="text-sm opacity-90 leading-relaxed font-medium relative z-10 text-indigo-50">
                                    {metrics.struggleTopic ? (
                                        <>Your students are generally performing well, but there is a noticeable <b>stoppage in momentum</b> regarding <b className="text-white underline decoration-white/30 decoration-2">{metrics.struggleTopic}</b>. Participation in related queries has dropped by 12%.</>
                                    ) : (
                                        <>Your class is showing <b>excellent mastery</b> across all active topics. Engagement is up 18% compared to last week.</>
                                    )}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
                                <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-xl flex items-center gap-2 relative z-10">
                                    <span>🌈</span> The Pulse
                                </h4>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w - 12 h - 12 rounded - 2xl flex items - center justify - center text - xl shadow - lg ${metrics.vibe === 'Excited' ? 'bg-amber-400 text-white' : metrics.vibe === 'Confused' ? 'bg-fuchsia-500 text-white' : 'bg-emerald-500 text-white'} `}>
                                            {metrics.vibe === 'Excited' ? '🔥' : metrics.vibe === 'Confused' ? '🤔' : '🧠'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Class Vibe</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{metrics.vibe || 'Analyzing...'}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                        {students.length > 0 || metrics.isPreview ? metrics.sentimentInsight : "Your digital classroom is silent. Share your magic code above to hear Elora's first pedagogical pulse."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* AI Recommended Videos */}
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>🎥</span> Content Recommendations
                                </h4>
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                                    {students.length > 0 || metrics.isPreview ? metrics.recommendationReason : "Waiting for class performance data..."}
                                </div>
                            </div>

                            {(students.length > 0 || metrics.isPreview) ? (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(metrics.recommendedVideos || []).map((vid, i) => (
                                        <a
                                            key={i}
                                            href={vid.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer"
                                        >
                                            <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative">
                                                <Image src={vid.thumbnail} alt={vid.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 pl-1 shadow-2xl scale-90 group-hover:scale-100 transition-transform">▶</div>
                                                </div>
                                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-black rounded-lg border border-white/10 uppercase tracking-tighter">{vid.channel}</div>
                                            </div>
                                            <div className="p-4">
                                                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-2 line-clamp-1">{vid.title}</h5>
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-3">{vid.description}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {vid.topics.map((t, idx) => (
                                                        <span key={idx} className="text-[9px] bg-slate-100 dark:bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center">
                                    <div className="text-4xl mb-4 opacity-30">🍿</div>
                                    <h5 className="font-bold text-slate-900 dark:text-white mb-2">No Recommendations Yet</h5>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">Once your students start their learning journey, Elora will suggest the best educational resources for them.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* AI Assignment Modal */}
                {isCreatingAssignment && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsCreatingAssignment(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-8 text-white flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">📝</div>
                                        <h3 className="text-2xl font-black">Assignment Wizard</h3>
                                    </div>
                                    <p className="text-indigo-100 text-xs font-medium opacity-80">Step {assignmentWizardStep}: {assignmentWizardStep === 1 ? 'Details' : assignmentWizardStep === 2 ? 'Content' : 'Review'}</p>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(step => (
                                        <div key={step} className={`w - 2 h - 2 rounded - full transition - all ${assignmentWizardStep >= step ? 'bg-white' : 'bg-white/30'} `} />
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {assignmentWizardStep === 1 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assignment Title / Topic</label>
                                            <input
                                                autoFocus
                                                value={assignmentTopic}
                                                onChange={e => setAssignmentTopic(e.target.value)}
                                                placeholder="e.g. Thermodynamic Laws"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all placeholder:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assign To</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
                                            >
                                                <option value="ALL">All Students</option>
                                                {(students || []).map((s, i) => (
                                                    <option key={i} value={s.id || s.name}>{s.name || `Student ${i + 1} `}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </motion.div>
                                )}

                                {assignmentWizardStep === 2 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setAssignmentFile(null)}
                                                className={`p - 6 rounded - 2xl border - 2 text - left transition - all ${!assignmentFile ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200'} `}
                                            >
                                                <div className="text-2xl mb-2">🤖</div>
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">AI Generator</h4>
                                                <p className="text-[10px] text-slate-500 mt-1">Elora creates the questions based on your topic.</p>
                                            </button>
                                            <button
                                                onClick={() => setAssignmentFile("manual_upload_placeholder")}
                                                className={`p - 6 rounded - 2xl border - 2 text - left transition - all ${assignmentFile ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200'} `}
                                            >
                                                <div className="text-2xl mb-2">📂</div>
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Upload File</h4>
                                                <p className="text-[10px] text-slate-500 mt-1">Atttach your own PDF or worksheet.</p>
                                            </button>
                                        </div>

                                        {assignmentFile ? (
                                            <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
                                                <p className="text-xs font-bold text-slate-400">Click to browse or drag file here</p>
                                            </div>
                                        ) : (
                                            <div className="bg-indigo-50 dark:bg-indigo-500/5 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
                                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mb-1">ELORA SAYS</p>
                                                <p className="text-[11px] text-slate-500 leading-relaxed italic">"I'll generate a 5-question module for {assignmentTopic || 'this topic'} tailored to the class level."</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {assignmentWizardStep === 3 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Summary</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-400">Topic:</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{assignmentTopic}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-400">Content Source:</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{assignmentFile ? 'Manual Upload' : 'AI Generation'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-400">Due Date:</span>
                                                    <span className="font-bold text-slate-900 dark:text-white text-emerald-500">Next Friday</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}


                                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => {
                                            if (assignmentWizardStep > 1) setAssignmentWizardStep(assignmentWizardStep - 1);
                                            else setIsCreatingAssignment(false);
                                        }}
                                        className="px-6 py-4 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        {assignmentWizardStep === 1 ? "Cancel" : "Back"}
                                    </button>
                                    {assignmentWizardStep < 3 ? (
                                        <button
                                            onClick={() => setAssignmentWizardStep(assignmentWizardStep + 1)}
                                            disabled={!assignmentTopic}
                                            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl text-xs font-black hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next Step →
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCreateAssignment}
                                            className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl text-xs font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                                        >
                                            Post Assignment 🚀
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {classWizardStep === 1 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Class Name</label>
                                            <input
                                                autoFocus
                                                value={newClassName}
                                                onChange={e => setNewClassName(e.target.value)}
                                                placeholder="e.g. 4A Physics"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all placeholder:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Region</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
                                                value={newClassCountry}
                                                onChange={e => {
                                                    setNewClassCountry(e.target.value);
                                                    setNewClassLevel(""); // Reset level when country changes
                                                }}
                                            >
                                                <option value="">Select Country System</option>
                                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </motion.div>
                                )}

                                {classWizardStep === 2 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Academic Level</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
                                                value={newClassLevel}
                                                onChange={e => setNewClassLevel(e.target.value)}
                                                disabled={!newClassCountry}
                                            >
                                                <option value="">{newClassCountry ? "Select Level" : "Select Country First"}</option>
                                                {getCountryLevels(newClassCountry).map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Main Subject</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
                                                value={newClassSubject}
                                                onChange={e => setNewClassSubject(e.target.value)}
                                                disabled={!newClassCountry || !newClassLevel}
                                            >
                                                <option value="">{newClassCountry && newClassLevel ? "Select Subject" : "Pick Level First"}</option>
                                                {getCountrySubjects(newClassCountry, newClassLevel).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </motion.div>
                                )}

                                {classWizardStep === 3 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Educator's Vision</label>
                                            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-2xl mb-2">
                                                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 italic">"Tell Elora how to teach this class. e.g. 'Focus on visual learning', 'Strict on grammar', 'Encourage debate'."</p>
                                            </div>
                                            <textarea
                                                value={newClassVision}
                                                onChange={e => setNewClassVision(e.target.value)}
                                                placeholder="My vision for this class is..."
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all h-32 resize-none"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => {
                                            if (classWizardStep > 1) setClassWizardStep(classWizardStep - 1);
                                            else setIsCreating(false);
                                        }}
                                        className="px-6 py-4 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        {classWizardStep === 1 ? "Cancel" : "Back"}
                                    </button>

                                    {classWizardStep < 3 ? (
                                        <button
                                            onClick={() => setClassWizardStep(classWizardStep + 1)}
                                            disabled={(classWizardStep === 1 && !newClassName) || (classWizardStep === 2 && (!newClassLevel || !newClassSubject))}
                                            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl text-xs font-black hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next Step →
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCreateClass}
                                            className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl text-xs font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                                        >
                                            {isEditingClass ? "Save Changes" : "Create Class 🚀"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
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
                                <button
                                    onClick={() => handleOpenSettings(classes.find(c => c.id === selectedClassId))}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Settings
                                </button>
                                <button
                                    onClick={() => handleOpenAssignment(classes.find(c => c.id === selectedClassId))}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
                                >
                                    Create Assignment
                                </button>
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

            {/* Enhanced AI Assignment Modal - Multi-Step Wizard */}
            <AnimatePresence>
                {isCreatingAssignment && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsCreatingAssignment(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-8 text-white flex-shrink-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">✨</div>
                                        <h3 className="text-2xl font-black">AI Assignment Genius</h3>
                                    </div>
                                    <div className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">
                                        Step {assignmentWizardStep} of 4
                                    </div>
                                </div>
                                <p className="text-indigo-100 text-xs font-medium opacity-80">Create comprehensive assignments with AI assistance</p>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {/* Step 1: Topic & Description */}
                                {assignmentWizardStep === 1 && (
                                    <div className="space-y-5 animate-reveal">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assignment Title *</label>
                                            <input
                                                autoFocus
                                                value={assignmentTopic}
                                                onChange={e => setAssignmentTopic(e.target.value)}
                                                placeholder="e.g. Solving Quadratic Equations using the Formula"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all placeholder:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Description (Optional)</label>
                                            <textarea
                                                value={assignmentDescription}
                                                onChange={e => setAssignmentDescription(e.target.value)}
                                                placeholder="Provide additional context or instructions for students..."
                                                rows={4}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all placeholder:opacity-50 resize-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Due Date *</label>
                                                <input
                                                    type="date"
                                                    value={assignmentDueDate}
                                                    onChange={e => setAssignmentDueDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assign To Class</label>
                                                <select
                                                    value={assignmentTargetClass}
                                                    onChange={e => setAssignmentTargetClass(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
                                                >
                                                    <option value="">All Classes</option>
                                                    {classes.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Content Source */}
                                {assignmentWizardStep === 2 && (
                                    <div className="space-y-5 animate-reveal">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Content Source</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => setAssignmentContentSource('ai')}
                                                    className={`p-6 rounded-2xl border-2 transition-all ${assignmentContentSource === 'ai' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                                >
                                                    <div className="text-3xl mb-2">🤖</div>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white">AI Generated</div>
                                                    <div className="text-xs text-slate-500 mt-1">Elora creates questions automatically</div>
                                                </button>
                                                <button
                                                    onClick={() => setAssignmentContentSource('manual')}
                                                    className={`p-6 rounded-2xl border-2 transition-all ${assignmentContentSource === 'manual' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                                >
                                                    <div className="text-3xl mb-2">✍️</div>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white">Manual Entry</div>
                                                    <div className="text-xs text-slate-500 mt-1">Create custom questions yourself</div>
                                                </button>
                                            </div>
                                        </div>
                                        {assignmentContentSource === 'ai' && (
                                            <div className="bg-indigo-50 dark:bg-indigo-500/5 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
                                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black mb-2 uppercase tracking-widest">🎯 AI Power</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    Elora will automatically generate {Math.floor(Math.random() * 3) + 3}-{Math.floor(Math.random() * 5) + 6} tailored questions based on your topic,
                                                    aligned to curriculum standards with varying difficulty levels.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Question Builder (if Manual) */}
                                {assignmentWizardStep === 3 && (
                                    <div className="space-y-5 animate-reveal">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Questions ({assignmentQuestions.length})</label>
                                            <button
                                                onClick={() => setAssignmentQuestions([...assignmentQuestions, { text: '', type: 'open', points: 10, options: [] }])}
                                                className="text-xs font-black bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                                            >
                                                + Add Question
                                            </button>
                                        </div>
                                        {assignmentQuestions.length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                                <div className="text-4xl mb-3">📝</div>
                                                <p className="text-sm font-bold text-slate-400">No questions yet. Add your first question above.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                                {assignmentQuestions.map((q, idx) => (
                                                    <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <span className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0">{idx + 1}</span>
                                                            <div className="flex-1 space-y-3">
                                                                <input
                                                                    value={q.text}
                                                                    onChange={e => {
                                                                        const updated = [...assignmentQuestions];
                                                                        updated[idx].text = e.target.value;
                                                                        setAssignmentQuestions(updated);
                                                                    }}
                                                                    placeholder="Enter your question..."
                                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <select
                                                                        value={q.type}
                                                                        onChange={e => {
                                                                            const updated = [...assignmentQuestions];
                                                                            updated[idx].type = e.target.value;
                                                                            setAssignmentQuestions(updated);
                                                                        }}
                                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                                                    >
                                                                        <option value="open">Open Response</option>
                                                                        <option value="mcq">Multiple Choice</option>
                                                                        <option value="true-false">True/False</option>
                                                                    </select>
                                                                    <input
                                                                        type="number"
                                                                        value={q.points}
                                                                        onChange={e => {
                                                                            const updated = [...assignmentQuestions];
                                                                            updated[idx].points = parseInt(e.target.value) || 10;
                                                                            setAssignmentQuestions(updated);
                                                                        }}
                                                                        className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                                                        min="1"
                                                                    />
                                                                    <button
                                                                        onClick={() => setAssignmentQuestions(assignmentQuestions.filter((_, i) => i !== idx))}
                                                                        className="text-xs font-bold text-red-500 hover:text-red-600 px-3"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {assignmentContentSource === 'ai' && (
                                            <div className="bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
                                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                                                    ✨ AI will auto-generate questions for "{assignmentTopic}". You can skip this step or add custom questions.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 4: Review */}
                                {assignmentWizardStep === 4 && (
                                    <div className="space-y-5 animate-reveal">
                                        <div className="bg-gradient-to-br from-indigo-50 to-fuchsia-50 dark:from-indigo-500/10 dark:to-fuchsia-500/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                                            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4">📋 Assignment Summary</h4>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-bold">Title:</span>
                                                    <span className="font-black text-slate-900 dark:text-white">{assignmentTopic || 'Untitled'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-bold">Due Date:</span>
                                                    <span className="font-black text-indigo-600">{assignmentDueDate || 'No due date'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-bold">Content Source:</span>
                                                    <span className="font-black text-slate-900 dark:text-white">{assignmentContentSource === 'ai' ? '🤖 AI Generated' : '✍️ Manual'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-bold">Questions:</span>
                                                    <span className="font-black text-slate-900 dark:text-white">
                                                        {assignmentContentSource === 'ai' ? 'Auto-generated' : `${assignmentQuestions.length} custom`}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-bold">Total Points:</span>
                                                    <span className="font-black text-emerald-600">
                                                        {assignmentQuestions.reduce((sum, q) => sum + (q.points || 10), 0) || (assignmentContentSource === 'ai' ? '~50-100' : '0')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 dark:bg-amber-500/5 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20">
                                            <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                                                ⚡ Ready to publish? Students will be able to view and submit this assignment immediately.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer - Actions */}
                            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                                <button
                                    onClick={() => {
                                        if (assignmentWizardStep > 1) {
                                            setAssignmentWizardStep(assignmentWizardStep - 1);
                                        } else {
                                            setIsCreatingAssignment(false);
                                        }
                                    }}
                                    className="px-5 py-3 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {assignmentWizardStep === 1 ? 'Cancel' : '← Back'}
                                </button>
                                <div className="flex gap-2">
                                    {assignmentWizardStep < 4 ? (
                                        <button
                                            onClick={() => setAssignmentWizardStep(assignmentWizardStep + 1)}
                                            disabled={assignmentWizardStep === 1 && (!assignmentTopic || !assignmentDueDate)}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next Step →
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCreateAssignment}
                                            disabled={!assignmentTopic}
                                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            Generate & Publish Assignment ✨
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Video Explorer Modal */}
                {isSearchingVideos && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsSearchingVideos(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85dvh]">
                            <div className="p-8 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl shadow-indigo-500/20">🎥</div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">Video Explorer</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-2">Hands-Free Classroom Curation</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsSearchingVideos(false)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                            </div>

                            <div className="p-8">
                                <div className="relative">
                                    <input
                                        autoFocus
                                        value={videoSearchQuery}
                                        onChange={e => {
                                            setVideoSearchQuery(e.target.value);
                                            setSearchResults(searchVideos(e.target.value));
                                        }}
                                        placeholder="Search by topic, subject, or channel..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] px-14 py-5 text-sm focus:border-indigo-500 outline-none transition-all shadow-inner"
                                    />
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
                                {videoSearchQuery && searchResults.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="text-4xl mb-4">🏜️</div>
                                        <p className="font-bold text-slate-400">No videos found for "{videoSearchQuery}"</p>
                                    </div>
                                ) : videoSearchQuery ? (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {searchResults.map((vid, i) => (
                                            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col gap-4 group hover:bg-white dark:hover:bg-slate-800 transition-all">
                                                <div className="aspect-video rounded-2xl overflow-hidden relative">
                                                    <Image src={vid.thumbnail} alt={vid.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-[8px] font-black text-white rounded uppercase border border-white/10">{vid.channel}</div>
                                                    <div className="absolute bottom-2 left-2 flex gap-1">
                                                        <div className="px-2 py-0.5 bg-indigo-600/80 backdrop-blur-md text-[8px] font-black text-white rounded">👁 {vid.views}</div>
                                                        <div className="px-2 py-0.5 bg-fuchsia-600/80 backdrop-blur-md text-[8px] font-black text-white rounded">👍 {vid.likes}</div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col gap-3">
                                                    <h5 className="font-bold text-[11px] text-slate-900 dark:text-white line-clamp-2 leading-tight">{vid.title}</h5>

                                                    <div className="relative">
                                                        <textarea
                                                            placeholder="Add a teacher's note (optional)..."
                                                            value={noteInput}
                                                            onChange={(e) => setNoteInput(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-[10px] focus:border-indigo-500 outline-none resize-none h-16 transition-all"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            const newRes = {
                                                                id: `r_${Date.now()} `,
                                                                title: vid.title,
                                                                link: vid.url,
                                                                type: "Video",
                                                                notes: noteInput,
                                                                metadata: { views: vid.views, likes: vid.likes }
                                                            };
                                                            setResources([newRes, ...resources]);
                                                            setIsSearchingVideos(false);
                                                            setVideoSearchQuery("");
                                                            setNoteInput("");
                                                        }}
                                                        className="w-full py-2.5 bg-indigo-600 text-white border border-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                                    >
                                                        Post with Note +
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-3xl mb-4 grayscale opacity-20">📂</div>
                                        <p className="text-xs font-bold text-slate-400">Type a topic above to begin exploring.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* AI Quiz Modal */}
                {isCreatingQuiz && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsCreatingQuiz(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 p-8 text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🎯</div>
                                    <h3 className="text-2xl font-black">AI Quiz Genius</h3>
                                </div>
                                <p className="text-indigo-100 text-xs font-medium opacity-80">Elora will generate interactive questions based on your topic.</p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Quiz Topic / Focus</label>
                                    <textarea
                                        autoFocus
                                        value={quizTopic}
                                        onChange={e => setQuizTopic(e.target.value)}
                                        placeholder="e.g. Fundamental principles of Cell Theory for 9th Grade..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all placeholder:opacity-50 h-32 resize-none"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsCreatingQuiz(false)}
                                        className="flex-1 px-4 py-4 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateQuiz}
                                        disabled={!quizTopic}
                                        className="flex-[2] bg-indigo-600 text-white px-4 py-4 rounded-2xl text-xs font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        Generate & Ship →
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Voice-to-Task Modal */}
                <AnimatePresence>
                    {isVoiceActive && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
                            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-10">
                                <div className="mb-8">
                                    <div className="relative inline-block">
                                        <div className={`w - 24 h - 24 rounded - full flex items - center justify - center text - 3xl transition - all duration - 700 ${voiceStage === 'listening' ? 'bg-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.5)] scale-110' : voiceStage === 'transcribing' ? 'bg-indigo-600 animate-spin-slow' : 'bg-emerald-500 text-white'} `}>
                                            {voiceStage === 'listening' ? '🎙️' : voiceStage === 'transcribing' ? '⏳' : '✅'}
                                            {voiceStage === 'listening' && <div className="absolute inset-0 rounded-full border-4 border-rose-500 animate-ping opacity-50" />}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-6 uppercase tracking-tight">
                                        {voiceStage === 'listening' ? 'Listening...' : voiceStage === 'transcribing' ? 'Syncing Thoughts...' : 'Insight Captured'}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">
                                        {voiceStage === 'listening' ? 'Speak naturally about your lesson plan' : voiceStage === 'transcribing' ? 'Elora is organizing your pedagogy' : 'Ready to generate lesson'}
                                    </p>
                                </div>

                                <div className="min-h-[100px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 mb-8">
                                    {voiceStage === 'ready' ? (
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed italic">"{voiceTranscript}"</p>
                                    ) : (
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map(i => <div key={i} className={`w - 1.5 h - 1.5 rounded - full bg - indigo - 500 animate - bounce`} style={{ animationDelay: `${i * 0.1} s` }} />)}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => { setIsVoiceActive(false); setVoiceStage('idle'); }}
                                        className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Discard
                                    </button>
                                    {voiceStage === 'ready' && (
                                        <button
                                            onClick={() => {
                                                setIsVoiceActive(false);
                                                const activeClass = classes.find(c => c.id === selectedClassId) || classes[0] || {};
                                                const params = new URLSearchParams({
                                                    action: 'lesson_plan',
                                                    topic: voiceTranscript,
                                                    class: activeClass.name || '',
                                                    subject: activeClass.subject || '',
                                                    level: activeClass.level || '',
                                                    country: activeClass.country || '',
                                                    vision: activeClass.vision || '',
                                                    classCode: activeClass.joinCode || ''
                                                });
                                                router.push(`/ assistant ? ${params.toString()} `);
                                            }}
                                            className="flex-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all"
                                        >
                                            Generate Plan →
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Class Settings Modal */}
                {isEditingClass && editingClass && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsEditingClass(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-8 bg-indigo-600 text-white">
                                <h3 className="text-2xl font-black">Class Settings</h3>
                                <p className="text-xs font-bold text-indigo-100/60 uppercase tracking-widest mt-1">Configure {editingClass.name} pedagogy</p>
                            </div>
                            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Display Name</label>
                                        <input
                                            value={editingClass.name}
                                            onChange={e => setEditingClass({ ...editingClass, name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Subject</label>
                                        {console.log("DEBUG: editingClass", editingClass)}
                                        {console.log("DEBUG: editingClass.country", editingClass?.country)}
                                        {console.log("DEBUG: editingClass.level", editingClass?.level)}
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                                            value={editingClass.subject}
                                            onChange={e => setEditingClass({ ...editingClass, subject: e.target.value })}
                                            disabled={!editingClass.country || !editingClass.level}
                                        >
                                            <option value="">Select Subject</option>
                                            {(editingClass.country && editingClass.level) ? getCountrySubjects(editingClass.country, editingClass.level).map(s => <option key={s} value={s}>{s}</option>) : <option value="">Select Level First</option>}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Country / System</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                                            value={editingClass.country}
                                            onChange={e => setEditingClass({ ...editingClass, country: e.target.value, level: "" })}
                                        >
                                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Level</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                                            value={editingClass.level}
                                            onChange={e => setEditingClass({ ...editingClass, level: e.target.value })}
                                            disabled={!editingClass.country}
                                        >
                                            <option value="">Select Level</option>
                                            {(editingClass.country ? getCountryLevels(editingClass.country) : []).map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Educator Vision (Deep Tailoring)</label>
                                    <textarea
                                        value={editingClass.vision || ""}
                                        onChange={e => setEditingClass({ ...editingClass, vision: e.target.value })}
                                        placeholder="e.g. Focus on real-world application, avoid heavy latex, emphasize conceptual logic over memorization."
                                        className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all resize-none"
                                    />
                                    <p className="text-[9px] text-slate-400 mt-2 italic">Elora will prioritize this vision when tutoring students in this class.</p>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setIsEditingClass(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">Cancel</button>
                                    <button onClick={() => handleUpdateClassSettings(editingClass)} className="flex-2 bg-indigo-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20">Save Settings</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Context Picker Modal */}
                {isPickingContext && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsPickingContext(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Choose Context</h3>
                                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Select target class for this {contextAction}</p>
                            </div>
                            <div className="p-4 space-y-2">
                                {classes.map((cls, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (contextAction === 'lesson') {
                                                const topic = metrics.struggleTopic ? `Review of ${metrics.struggleTopic} ` : 'New Lesson';
                                                const params = new URLSearchParams({
                                                    action: 'lesson_plan',
                                                    topic,
                                                    class: cls.name,
                                                    subject: cls.subject || 'General',
                                                    level: cls.level || '10',
                                                    country: cls.country || '',
                                                    vision: cls.vision || '',
                                                    classCode: cls.joinCode || ''
                                                });
                                                router.push(`/ assistant ? ${params.toString()} `);
                                            } else if (contextAction === 'assignment') {
                                                setIsCreatingAssignment(true);
                                                setIsPickingContext(false);
                                            } else if (contextAction === 'quiz') {
                                                setIsCreatingQuiz(true);
                                                setIsPickingContext(false);
                                            }
                                        }}
                                        className="w-full text-left p-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">{cls.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{cls.subject} • {cls.studentCount} students</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="p-8">
                                <button onClick={() => setIsPickingContext(false)} className="w-full py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
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
    const [activeQuiz, setActiveQuiz] = useState(null);

    // demo Mode & feature Unlock States
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeAssignment, setActiveAssignment] = useState(null);
    const [isGrading, setIsGrading] = useState(false);
    const [activeSubmission, setActiveSubmission] = useState(null);

    // Effect to check verification status and enable demo mode
    useEffect(() => {
        if (session && !session.verified) {
            setIsDemoMode(true);
        }
    }, [session]);

    // Use memoized demo data
    const demoData = useMemo(() => {
        if (!isDemoMode) return null;
        const role = session?.role || 'student';
        return generateDemoData(role);
    }, [isDemoMode, session?.role]);

    // Assignment & Multi-Class State
    const [showAssignmentWizard, setShowAssignmentWizard] = useState(false);
    const [activeClass, setActiveClass] = useState(null);

    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        const sync = () => {
            const s = getSession();
            setSession({ ...s });
        };

        const s = getSession();
        setSession(s);
        if (s.role === 'parent') setActiveTab('parent');
        else if (s.role === 'educator') setActiveTab('teacher');
        setLoading(false);

        window.addEventListener("elora:session", sync);
        return () => window.removeEventListener("elora:session", sync);
    }, []);

    const updateSessionAndSync = (newSession) => {
        saveSession(newSession);
        setSession({ ...newSession });
    };

    const [joinCodeInput, setJoinCodeInput] = useState("");
    const [joinStatus, setJoinStatus] = useState("");

    const handleJoinClass = () => {
        if (!joinCodeInput) return;
        setJoinStatus("Syncing...");

        // Mock verification: In a real app, this would check the DB
        setTimeout(() => {
            const s = getSession();
            // Simulate finding a class by code (searching all local sessions for now in this prototype context)
            // For the demo, we'll just accept any 6-digit code as a success
            if (joinCodeInput.length === 6) {
                s.joinedClass = {
                    name: "Joined Class",
                    code: joinCodeInput,
                    subject: "Physics", // Mock inherited data
                    level: "Grade 10",
                    country: "United States"
                };
                updateSessionAndSync(s);
                setJoinStatus("Joined Successfully! ✅");
                setJoinCodeInput("");
            } else {
                setJoinStatus("Invalid Code. ❌");
            }
            setTimeout(() => setJoinStatus(""), 3000);
        }, 1500);
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

    // Assignment Handlers
    const handleSaveAssignment = (assignment) => {
        const s = getSession();
        if (!s.classroom) s.classroom = { assignments: [] };
        if (!s.classroom.assignments) s.classroom.assignments = [];

        s.classroom.assignments = [assignment, ...s.classroom.assignments];
        updateSessionAndSync(s);
        // Show success toast/notification here if we had one
    };

    const handleSwitchClass = (cls) => {
        setActiveClass(cls);
        // In real app, this would filter data. For now we just set state.
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

    if (!hasMounted || loading || !session) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const studentData = deriveStudentStats(session);
    const classMetrics = computeClassMetrics(session.linkedStudents, session.verified);

    return (
        <NotificationProvider>
            <Head><title>Dashboard | Elora</title></Head>
            <div className="elora-page min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
                <DemoModeBanner isDemo={isDemoMode} />
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
                                className={`px - 6 py - 2.5 rounded - full text - xs font - black tracking - widest uppercase transition - all duration - 300 ${activeTab === id ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl" : "text-slate-400 hover:text-slate-600"} `}>
                                {id}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                            {activeTab === 'student' && (
                                <StudentModule
                                    data={studentData}
                                    onStartQuiz={setActiveQuiz}
                                    session={session}
                                    onUpdateSession={updateSessionAndSync}
                                    isDemoMode={isDemoMode}
                                    demoData={demoData}
                                    isSubmitting={isSubmitting}
                                    setIsSubmitting={setIsSubmitting}
                                    setActiveAssignment={setActiveAssignment}
                                />
                            )}
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
                                            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl group-hover:scale-110 transition-transform">🧠</div>
                                                <h3 className="text-lg font-black mb-4 flex items-center gap-2"><span>🌈</span> AI Parenting Pulse</h3>
                                                {session?.classroom?.submissions?.length > 0 ? (
                                                    <p className="text-sm text-slate-500 leading-relaxed">
                                                        Your student recently tackled <span className="font-black text-slate-900 dark:text-white">"{session.classroom.submissions[0].quizTitle}"</span>.
                                                        Elora noticed they are <span className="text-indigo-500 font-bold">accelerating in subject mastery</span>.
                                                        Next goal: Reviewing {session.classroom.submissions[0].details.find(d => !d.isCorrect)?.question.split(' ').slice(0, 2).join(' ') || 'advanced concepts'}.
                                                    </p>
                                                ) : (
                                                    <p className="text-slate-500 text-sm leading-relaxed">Your student hasn't completed any tracked quizzes yet. As they work with Elora, you'll see deep insights here.</p>
                                                )}
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
                                <TeacherModule
                                    students={session.linkedStudents || []}
                                    metrics={classMetrics}
                                    onAddStudent={handleAddStudent}
                                    session={session}
                                    onUpdateSession={updateSessionAndSync}
                                    isDemoMode={isDemoMode}
                                    demoData={demoData}
                                    isGrading={isGrading}
                                    setIsGrading={setIsGrading}
                                    setActiveSubmission={setActiveSubmission}
                                    setActiveAssignment={setActiveAssignment}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {activeQuiz && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setActiveQuiz(null)} />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{activeQuiz.title}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">Elora AI Evaluation</p>
                                    </div>
                                    <button onClick={() => setActiveQuiz(null)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                                </div>
                                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                                    {(activeQuiz.questions || []).map((q, i) => (
                                        <div key={i} className="space-y-4">
                                            <p className="font-bold text-slate-900 dark:text-white flex gap-3">
                                                <span className="text-indigo-600">Q{i + 1}</span> {typeof q === 'string' ? q : (q.text || q.question)}
                                            </p>
                                            <textarea
                                                placeholder="Type your answer here..."
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all h-24 resize-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                                    <button onClick={() => setActiveQuiz(null)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Save for Later</button>
                                    <button
                                        onClick={() => {
                                            const currentSession = getSession();
                                            const submission = {
                                                id: `sub_${Date.now()} `,
                                                studentName: currentSession.email?.split('@')[0] || "Guest Student",
                                                quizTitle: activeQuiz.title,
                                                score: Math.floor(activeQuiz.questions.length * 0.8), // Mocking a score for open response for now
                                                total: activeQuiz.questions.length,
                                                details: activeQuiz.questions.map(q => ({
                                                    question: typeof q === 'string' ? q : (q.text || q.question),
                                                    studentAnswer: "User provided response...",
                                                    isCorrect: true // Open response is marked as seen
                                                })),
                                                timestamp: new Date().toISOString(),
                                                isOpenResponse: true
                                            };

                                            if (!currentSession.classroom) currentSession.classroom = {};
                                            if (!currentSession.classroom.submissions) currentSession.classroom.submissions = [];
                                            currentSession.classroom.submissions = [submission, ...currentSession.classroom.submissions];

                                            saveSession(currentSession);
                                            alert("Quiz submitted! Elora is grading your responses...");
                                            setActiveQuiz(null);
                                        }}
                                        className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl text-xs font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-colors uppercase tracking-widest"
                                    >
                                        Submit to Teacher →
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* New Modals */}
                <AnimatePresence>
                    {isSubmitting && (
                        <SubmissionModal
                            assignment={activeAssignment}
                            isOpen={isSubmitting}
                            onClose={() => setIsSubmitting(false)}
                            onSubmit={(sub) => {
                                notify("Assignment submitted successfully!", "success");
                                setIsSubmitting(false);
                            }}
                        />
                    )}
                    {isGrading && (
                        <GradingModal
                            submission={activeSubmission}
                            assignment={activeAssignment}
                            isOpen={isGrading}
                            onClose={() => setIsGrading(false)}
                            onSaveGrade={(grade) => {
                                notify("Grade saved successfully!", "success");
                                setIsGrading(false);
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>
        </NotificationProvider>
    );
}
