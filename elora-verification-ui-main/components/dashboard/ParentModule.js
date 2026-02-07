// components/dashboard/ParentModule.js
// Modernized Parent Module with Minimalist Premium aesthetic

import { motion } from "framer-motion";
import { BarChart, StatsCard } from "./DashboardUI";

export default function ParentModule({
    linkedStudentId,
    linkedData,
    onLinkStudent,
    onDisconnect,
    isVerified,
    session
}) {
    if (!linkedStudentId) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-5 text-4xl grayscale">🛡️</div>
                <div className="relative z-10 max-w-xl">
                    <h3 className="text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">Parental Dashboard</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 leading-relaxed">
                        Connect with your child&apos;s learning journey. Enter their ELORA code to see real-time progress, subject mastery, and AI-driven insights.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            placeholder="ELORA-XXXX"
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white font-mono tracking-widest placeholder-slate-400"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onLinkStudent(e.target.value);
                            }}
                        />
                        <button
                            onClick={() => onLinkStudent("DEMO")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md"
                        >
                            Link Student
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Tracking: <span className="text-indigo-600 dark:text-indigo-400">{linkedData?.name || "Student"}</span>
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time educational tracking active</p>
                </div>
                <button
                    onClick={onDisconnect}
                    className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-4 py-2 rounded-xl transition-all"
                >
                    Disconnect
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard label="Streak" value={`${linkedData?.streak || 0} days`} icon="🔥" />
                <StatsCard label="Today" value={`${linkedData?.todayMinutes || 0}m`} icon="⏱️" />
                <StatsCard label="Progress" value={`${linkedData?.overallProgress || 0}%`} icon="📈" />
                <StatsCard label="Concepts" value="12" icon="🧩" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Subject Mastery */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-8">Subject Breakdown</h3>
                    <div className="h-64">
                        <BarChart
                            data={linkedData?.subjectBreakdown || [0, 0, 0, 0]}
                            labels={linkedData?.subjectLabels || ["Math", "Sci", "Eng", "Art"]}
                            color="var(--color-primary-600)"
                        />
                    </div>
                </div>

                {/* AI Insight Card */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-4xl">🧠</div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-6">
                            Pedagogical Pulse
                        </div>
                        <h3 className="text-xl font-bold mb-4 tracking-tight text-slate-900 dark:text-white">Elora&apos;s AI Perspective</h3>

                        {session?.classroom?.submissions?.length > 0 ? (
                            <div className="space-y-4">
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                    Your child recently completed <span className="text-indigo-700 dark:text-indigo-400 font-bold">&quot;{session.classroom.submissions[0].quizTitle}&quot;</span> with strong conceptual intuition.
                                </p>
                                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-indigo-100 dark:border-white/10">
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mb-1">Recommendation</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                                        &quot;Focusing on advanced problem-solving in this area will maintain their current momentum.&quot;
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                As your child interacts with Elora, I&apos;ll analyze their learning patterns and provide deep insights into their academic growth and areas for support.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-6">Learning Log</h3>
                <div className="space-y-4">
                    {(linkedData?.recentActivity || []).length > 0 ? (
                        linkedData.recentActivity.map((act, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        📄
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{act.action}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">{act.time}</p>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">View Detail →</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400">No recent activity logged</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
