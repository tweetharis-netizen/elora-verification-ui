// components/dashboard/StudentModule.js
// Modernized Student Dashboard Module

import { useState } from "react";
import { motion } from "framer-motion";
import { StatsCard, LineChart } from "./DashboardUI";
import { getSession } from "../../lib/session";

export default function StudentModule({
    data,
    onStartQuiz,
    session,
    onUpdateSession,
    isDemoMode,
    demoData,
    isSubmitting,
    setIsSubmitting,
    setActiveAssignment
}) {
    if (!data) return null;
    const [selectedClassIndex, setSelectedClassIndex] = useState(0);
    const [joinCodeInput, setJoinCodeInput] = useState("");
    const [joinStatus, setJoinStatus] = useState("");

    const handleJoinClass = () => {
        if (!joinCodeInput) return;
        setJoinStatus("Syncing...");
        setTimeout(() => {
            if (joinCodeInput.length === 6) {
                const s = getSession();
                if (!Array.isArray(s.joinedClasses)) s.joinedClasses = [];
                const alreadyJoined = s.joinedClasses.some(c => c.code === joinCodeInput);
                if (alreadyJoined) {
                    setJoinStatus("Already joined ✓");
                    setTimeout(() => setJoinStatus(""), 3000);
                    return;
                }
                const newClass = {
                    name: "Physics 101",
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
        <div className="space-y-8 animate-fade-in">
            {/* AI Strategy Insight - Minimalist Premium Version */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl p-8 border-premium bg-white dark:bg-neutral-900 shadow-premium-lg"
            >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <div className="w-64 h-64 rounded-full bg-primary-500 blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 border-premium text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider mb-4">
                            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                            AI Strategy Insight
                        </div>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 mb-3 leading-tight tracking-tight font-[var(--font-outfit)]">
                            {session?.classroom?.submissions?.[0]
                                ? "Mastering your latest physics challenge."
                                : "Ready for your next learning leap?"}
                        </h3>
                        <p className="text-neutral-500 dark:text-neutral-400 text-base font-medium leading-relaxed">
                            {session?.classroom?.submissions?.[0]
                                ? `Elora noticed you excelled at ${session.classroom.submissions[0].details.find(d => d.isCorrect)?.question.split(' ').slice(0, 2).join(' ') || 'recent topics'}. Shall we dive deeper?`
                                : "Elora is analyzing your latest sessions to build your personalized mastery path. Start a quiz to see your live strategy here."}
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-sm tracking-tight shadow-premium-md hover:scale-[1.02] transition-all flex-shrink-0">
                        View Mastery Path →
                    </button>
                </div>
            </motion.div>

            {/* Class Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Classroom Sync</h3>
                        {joinedClasses.length > 0 && (
                            <button
                                onClick={() => setJoinCodeInput(joinCodeInput === "" ? " " : "")}
                                className="text-xs font-bold text-primary-600 hover:underline"
                            >
                                {joinCodeInput ? "✕ Cancel" : "+ Join Another Class"}
                            </button>
                        )}
                    </div>

                    {joinedClasses.length === 0 ? (
                        <div className="p-8 bg-neutral-50 dark:bg-neutral-800/50 border-premium border-dashed rounded-3xl text-center">
                            <div className="text-3xl mb-4">🎓</div>
                            <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-2">Join your first class</h4>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 max-w-sm mx-auto">
                                Enter the 6-digit sync code from your teacher to unlock your custom challenges and class resources.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <input
                                    value={joinCodeInput}
                                    onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                                    placeholder="XXXXXX"
                                    maxLength={6}
                                    className="bg-white dark:bg-neutral-900 border-premium rounded-xl px-4 py-3 text-sm font-bold tracking-widest text-center focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-32"
                                />
                                <button
                                    onClick={handleJoinClass}
                                    className="bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-md"
                                >
                                    {joinStatus || "Sync Now →"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                            {joinedClasses.map((cls, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedClassIndex(idx)}
                                    className={`group relative px-6 py-5 rounded-2xl text-left border-premium transition-all shrink-0 min-w-[200px] ${selectedClassIndex === idx
                                        ? 'bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 shadow-premium-md'
                                        : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                        }`}
                                >
                                    <div className="font-bold text-sm mb-1">{cls.name}</div>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest ${selectedClassIndex === idx ? 'opacity-60' : 'text-neutral-400'
                                        }`}>
                                        {cls.subject} • {cls.code}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLeaveClass(idx);
                                        }}
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20 hover:text-rose-500"
                                    >
                                        ✕
                                    </button>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 h-full">
                    <div className="p-6 bg-white dark:bg-neutral-900 border-premium shadow-premium-sm rounded-3xl h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Knowledge Forest</h3>
                            <span className="text-xs font-bold text-emerald-500">GROWING</span>
                        </div>
                        <div className="flex-1 flex flex-wrap items-end justify-center gap-6 py-4 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border-premium border-dashed min-h-[140px]">
                            {data.recentTopics.length > 0 ? (
                                data.recentTopics.map((t, i) => (
                                    <div key={i} className="flex flex-col items-center group cursor-help relative">
                                        <div className="text-3xl transition-transform group-hover:scale-125 duration-500"
                                            style={{ opacity: 0.3 + (t.progress / 100) }}>
                                            {t.progress > 80 ? '🌳' : t.progress > 40 ? '🌿' : '🌱'}
                                        </div>
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                            {t.name}: {t.progress}%
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] font-medium text-neutral-400 italic">No topics yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Bento */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard label="Streak" value={`${data.streak} days`} icon="🔥" trend="up" trendValue="2d" />
                <StatsCard label="Focus" value={`${data.todayMinutes}m`} icon="⏱️" />
                <StatsCard label="Momentum" value="+15%" icon="🚀" trend="up" trendValue="4%" />
                <StatsCard label="Total Progress" value={`${data.overallProgress}%`} icon="📈" />
            </div>

            {/* Main Content Areas */}
            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    {/* Active Assignments */}
                    <div className="p-8 bg-white dark:bg-neutral-900 border-premium rounded-[2.5rem] shadow-premium-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight font-[var(--font-outfit)]">Active Assignments</h3>
                            <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-bold text-neutral-500">
                                {session?.classroom?.assignments?.length || 0} Total
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {session?.classroom?.assignments?.map(assignment => {
                                const hasSubmitted = session?.classroom?.submissions?.some(s => s.assignmentId === assignment.id);
                                if (assignment.classCode !== "ALL" && assignment.classCode !== currentClass?.code && joinedClasses.length > 0) return null;

                                return (
                                    <div key={assignment.id} className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border-premium hover:shadow-premium-md hover:scale-[1.01] transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="max-w-[80%]">
                                                <h4 className="font-bold text-neutral-900 dark:text-neutral-50 mb-1 leading-tight">{assignment.title}</h4>
                                                <p className="text-xs text-neutral-400 line-clamp-2">{assignment.description}</p>
                                            </div>
                                            {hasSubmitted && <span className="text-emerald-500 text-lg">✓</span>}
                                        </div>
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Due {assignment.dueDate}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasSubmitted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : 'bg-primary-50 text-primary-600 dark:bg-primary-500/10'
                                                }`}>
                                                {hasSubmitted ? 'SUBMITTED' : 'PENDING'}
                                            </span>
                                        </div>
                                        {!hasSubmitted ? (
                                            <button
                                                onClick={() => setActiveAssignment(assignment)}
                                                className="w-full py-3 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                                            >
                                                Start Assignment →
                                            </button>
                                        ) : (
                                            <button className="w-full py-3 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 rounded-xl text-xs font-bold uppercase tracking-widest border-premium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-center">
                                                View Grading
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resources Grid */}
                    {data.resources && data.resources.length > 0 && (
                        <div className="p-8 bg-white dark:bg-neutral-900 border-premium rounded-[2.5rem] shadow-premium-sm">
                            <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50 mb-8 tracking-tight font-[var(--font-outfit)]">Class Resources</h3>
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {data.resources.map(r => (
                                    <div key={r.id} className="group cursor-pointer">
                                        <div className="mb-3 aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform duration-300 border-premium">
                                            {r.type === 'Video' ? '🎬' : '📄'}
                                        </div>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50 line-clamp-1 mb-1">{r.title}</p>
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{r.type}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {/* Learning Momentum Chart Card */}
                    <div className="p-8 bg-white dark:bg-neutral-900 border-premium rounded-[2.5rem] shadow-premium-sm">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-6 font-[var(--font-outfit)]">Learning Pace</h3>
                        <LineChart data={data.chartData} height={160} />
                        <div className="mt-6 flex items-center justify-between text-xs text-neutral-400 font-bold uppercase tracking-widest">
                            <span>Mon</span>
                            <span>Sun</span>
                        </div>
                    </div>

                    {/* AI Challenge Hub */}
                    {data.quizzes && data.quizzes.length > 0 && (
                        <div className="p-8 bg-primary-600 rounded-[2.5rem] text-white shadow-premium-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform text-3xl">🎯</div>
                            <h3 className="text-xl font-bold mb-2">Challenge Hub</h3>
                            <p className="text-primary-100 text-xs mb-6 font-medium leading-relaxed">
                                Elora has curated these challenges based on your mastery forest.
                            </p>
                            <div className="space-y-3">
                                {data.quizzes.map(q => (
                                    <button
                                        key={q.id}
                                        onClick={() => onStartQuiz(q)}
                                        className="w-full p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20 text-left transition-all"
                                    >
                                        <div className="font-bold text-sm mb-1">{q.title}</div>
                                        <div className="text-[10px] opacity-70 font-bold uppercase tracking-widest">{q.questions.length} Items</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
