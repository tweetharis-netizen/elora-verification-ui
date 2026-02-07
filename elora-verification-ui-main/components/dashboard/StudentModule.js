// components/dashboard/StudentModule.js
// Modernized Student Dashboard Module

import { useState } from "react";
import { motion } from "framer-motion";
import { StatsCard, LineChart } from "./DashboardUI";
import { getSession } from "../../lib/session";
import { SUBJECTS, LEVELS_MAP } from "../../lib/dashboard-utils";

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
    const [selectedClassIndex, setSelectedClassIndex] = useState(0);
    const [joinCodeInput, setJoinCodeInput] = useState("");
    const [joinStatus, setJoinStatus] = useState("");
    if (!data) return null;

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

                // 1. Try to find in Teacher's created classes (Unified Demo State)
                const teacherClass = s.classroom?.classes?.find(c => c.joinCode === joinCodeInput);
                
                let newClass;
                if (teacherClass) {
                     newClass = {
                        name: teacherClass.name,
                        code: teacherClass.joinCode,
                        subject: teacherClass.subject,
                        level: teacherClass.level,
                        country: "United States", // Default if not in teacher class
                        vision: teacherClass.vision || "Teacher-led instruction"
                    };
                } else {
                    // 2. Fallback: Deterministically generate class details from code (Mock DB lookup)
                    const codeSum = joinCodeInput.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
                    const subject = SUBJECTS[codeSum % SUBJECTS.length];
                    const levels = LEVELS_MAP["United States"];
                    const level = levels[codeSum % levels.length];
                    
                    newClass = {
                        name: `${subject} ${level.replace(/[^0-9]/g, '')}01`,
                        code: joinCodeInput,
                        subject: subject,
                        level: level,
                        country: "United States",
                        vision: "Focus on conceptual understanding"
                    };
                }

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

    // Filter assignments for the current class
    const classAssignments = session?.classroom?.assignments?.filter(a => 
        a.classCode === currentClass?.code || a.classCode === "ALL"
    ) || [];

    // Fallback if no real assignments (for demo feel)
    const displayAssignments = classAssignments.length > 0 
        ? classAssignments 
        : [1, 2, 3].map(i => ({
            id: `mock_${i}`,
            title: `Unit ${i}: Concept Review`,
            dueDate: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
            isMock: true
        }));

    return (
        <div className="space-y-8 animate-fade-in">
            {/* AI Strategy Insight - Minimalist Premium Version */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl p-8 border-premium bg-white dark:bg-neutral-900 shadow-premium-lg"
            >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    {/* Minimalist background element instead of blur blob */}
                    <div className="text-9xl grayscale opacity-10">🧠</div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 border-premium text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider mb-4">
                            <span className="w-2 h-2 rounded-full bg-primary-500" />
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

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Classes & Join */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 bg-white dark:bg-neutral-900 border-premium shadow-premium-sm rounded-2xl">
                        <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-4 font-[var(--font-outfit)]">Your Classes</h4>
                        
                        {joinedClasses.length > 0 ? (
                            <div className="space-y-3 mb-6">
                                {joinedClasses.map((cls, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setSelectedClassIndex(idx)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all border ${
                                            idx === selectedClassIndex 
                                            ? "bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800" 
                                            : "bg-neutral-50 dark:bg-neutral-800 border-transparent hover:border-neutral-200"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-neutral-900 dark:text-neutral-100">{cls.name}</div>
                                                <div className="text-xs text-neutral-500">{cls.subject} • {cls.level}</div>
                                            </div>
                                            {idx === selectedClassIndex && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleLeaveClass(idx); }}
                                                    className="text-xs text-rose-500 hover:underline"
                                                >
                                                    Leave
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-neutral-400 text-sm bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border-dashed border-2 border-neutral-200 dark:border-neutral-800 mb-6">
                                No classes joined yet.
                            </div>
                        )}

                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Join a Class</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="6-digit code" 
                                    maxLength={6}
                                    value={joinCodeInput}
                                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                                    className="flex-1 bg-neutral-50 dark:bg-neutral-800 border-premium rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:ring-2 focus:ring-primary-500 outline-none uppercase"
                                />
                                <button 
                                    onClick={handleJoinClass}
                                    disabled={joinCodeInput.length !== 6}
                                    className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Join
                                </button>
                            </div>
                            {joinStatus && (
                                <div className="mt-2 text-xs font-medium text-center animate-fade-in text-primary-600">
                                    {joinStatus}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Class Details */}
                <div className="lg:col-span-8 space-y-6">
                     {currentClass ? (
                        <div className="p-6 bg-white dark:bg-neutral-900 border-premium shadow-premium-sm rounded-2xl h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-[var(--font-outfit)]">{currentClass.name}</h2>
                                    <p className="text-neutral-500">{currentClass.vision}</p>
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                                    Active
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <StatsCard label="Assignments" value="3" trend="up" trendValue="1 new" icon="📝" />
                                <StatsCard label="Avg Score" value="88%" trend="up" trendValue="+2%" icon="🎯" />
                            </div>

                            <div className="space-y-4">
                                <h5 className="font-bold text-neutral-900 dark:text-neutral-100">Recent Assignments</h5>
                                {displayAssignments.map((assignment, i) => (
                                    <div key={assignment.id} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-white hover:shadow-premium-md transition-all border border-transparent hover:border-neutral-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center text-lg shadow-sm">
                                                📚
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-200">{assignment.title}</div>
                                                <div className="text-xs text-neutral-500">Due: {assignment.dueDate}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                // If it's a quiz (mock check or type check), go to assistant
                                                if (assignment.isMock && assignment.id === "mock_1") onStartQuiz({ id: "quiz_unit_1", title: "Unit 1 Review" });
                                                else {
                                                    // Else open submission modal
                                                    setActiveAssignment(assignment);
                                                    setIsSubmitting(true);
                                                }
                                            }}
                                            className="px-4 py-2 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                        >
                                            Start
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                     ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-neutral-400 p-8 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50">
                            <div className="text-4xl mb-4">👈</div>
                            <p className="font-medium">Select or join a class to view details</p>
                        </div>
                     )}
                </div>
            </div>

            {/* Performance Overview (Global) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 p-6 bg-white dark:bg-neutral-900 border-premium shadow-premium-sm rounded-2xl">
                    <h4 className="text-lg font-bold mb-6 font-[var(--font-outfit)]">Learning Activity</h4>
                    <LineChart data={data.chartData || [10, 25, 15, 30, 45, 40, 55]} height={200} />
                </div>
                <div className="p-6 bg-white dark:bg-neutral-900 border-premium shadow-premium-sm rounded-2xl">
                    <h4 className="text-lg font-bold mb-6 font-[var(--font-outfit)]">Topic Mastery</h4>
                    <div className="space-y-4">
                        {(data.recentTopics || []).map((topic, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span>{topic.emoji} {topic.name}</span>
                                    <span>{topic.progress}%</span>
                                </div>
                                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-500" style={{ width: `${topic.progress}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
