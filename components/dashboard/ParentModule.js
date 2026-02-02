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
                className="bg-neutral-900 rounded-[2.5rem] p-12 text-white shadow-premium-xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10 text-6xl">🛡️</div>
                <div className="relative z-10 max-w-xl">
                    <h3 className="text-3xl font-bold tracking-tight mb-4">Parental Dashboard</h3>
                    <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                        Connect with your child's learning journey. Enter their ELORA code to see real-time progress, subject mastery, and AI-driven insights.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            placeholder="ELORA-XXXX"
                            className="bg-white/10 border-white/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary-500/50 text-white font-mono tracking-widest"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onLinkStudent(e.target.value);
                            }}
                        />
                        <button
                            onClick={() => onLinkStudent("DEMO")}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-premium-md"
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
                    <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        Tracking: <span className="text-primary-600 dark:text-primary-400">{linkedData?.name || "Student"}</span>
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Real-time educational tracking active</p>
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
                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border-premium shadow-premium-sm">
                    <h3 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-8">Subject Breakdown</h3>
                    <div className="h-64">
                        <BarChart
                            data={linkedData?.subjectBreakdown || [0, 0, 0, 0]}
                            labels={linkedData?.subjectLabels || ["Math", "Sci", "Eng", "Art"]}
                            color="#3b82f6"
                        />
                    </div>
                </div>

                {/* AI Insight Card */}
                <div className="bg-neutral-900 rounded-3xl p-8 text-white shadow-premium-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-4xl">🧠</div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-widest mb-6">
                            Pedagogical Pulse
                        </div>
                        <h3 className="text-xl font-bold mb-4 tracking-tight">Elora's AI Perspective</h3>

                        {session?.classroom?.submissions?.length > 0 ? (
                            <div className="space-y-4">
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    Your child recently completed <span className="text-white font-bold">"{session.classroom.submissions[0].quizTitle}"</span> with strong conceptual intuition.
                                </p>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <p className="text-xs text-primary-400 font-bold uppercase tracking-widest mb-1">Recommendation</p>
                                    <p className="text-xs text-neutral-300 italic">
                                        "Focusing on advanced problem-solving in this area will maintain their current momentum."
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                As your child interacts with Elora, I'll analyze their learning patterns and provide deep insights into their academic growth and areas for support.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border-premium shadow-premium-sm">
                <h3 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">Learning Log</h3>
                <div className="space-y-4">
                    {(linkedData?.recentActivity || []).length > 0 ? (
                        linkedData.recentActivity.map((act, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border-premium">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600">
                                        📄
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{act.action}</p>
                                        <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest mt-0.5">{act.time}</p>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-primary-600">View Detail →</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-3xl">
                            <p className="text-xs font-bold text-neutral-400">No recent activity logged</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
