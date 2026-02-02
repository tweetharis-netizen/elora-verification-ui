// components/dashboard/TeacherSidebar.js
// Navigation and class list for the Teacher Dashboard

import { motion } from "framer-motion";

export default function TeacherSidebar({
    selectedTab,
    setSelectedTab,
    classes,
    selectedClassId,
    setSelectedClassId,
    onOpenSettings,
    onDeleteClass,
    onStartCreateClass,
    onOpenQuizGen,
    onOpenVoice
}) {
    const navItems = [
        { id: "overview", label: "📊 Overview" },
        { id: "assignments", label: "📝 Assignments" },
        { id: "submissions", label: "🎯 Submissions" },
        { id: "insights", label: "💡 AI Insights" }
    ];

    return (
        <div className="w-full lg:w-72 flex-shrink-0 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border-premium shadow-premium-sm">
                <div className="space-y-1.5 mb-8">
                    {navItems.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedTab === tab.id
                                ? "bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 shadow-premium-md"
                                : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between px-4 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Classes</span>
                    <span className="text-xs font-bold text-primary-600">{classes.length}</span>
                </div>

                <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-1 scrollbar-hide">
                    <button
                        onClick={() => setSelectedClassId(null)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedClassId === null
                            ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 border-premium"
                            : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            }`}
                    >
                        Global Overview
                    </button>

                    {classes.map(c => (
                        <div key={c.id} className="group relative">
                            <button
                                onClick={() => setSelectedClassId(c.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between border-premium ${selectedClassId === c.id
                                    ? "bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900"
                                    : "bg-transparent text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    }`}
                            >
                                <div className="flex flex-col min-w-0 pr-12">
                                    <span className="truncate">{c.name}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${selectedClassId === c.id ? 'opacity-60' : 'text-neutral-400'
                                        }`}>
                                        {c.joinCode}
                                    </span>
                                </div>
                            </button>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onOpenSettings(c); }}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${selectedClassId === c.id
                                        ? 'hover:bg-neutral-800 dark:hover:bg-neutral-200'
                                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                        }`}
                                    title="Edit Settings"
                                >
                                    ⚙️
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteClass(c.id); }}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${selectedClassId === c.id
                                        ? 'hover:bg-neutral-800 dark:hover:bg-neutral-200 text-rose-400'
                                        : 'hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500'
                                        }`}
                                    title="Delete Class"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                        onClick={onStartCreateClass}
                        className="w-full py-3 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-400 hover:text-primary-600 hover:border-primary-500/50 hover:bg-primary-50 dark:hover:bg-primary-500/5 transition-all"
                    >
                        + Create New Class
                    </button>
                </div>
            </div>

            {/* Quick Tools Minimal Card */}
            <div className="bg-primary-600 rounded-3xl p-6 text-white shadow-premium-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform text-2xl">⚡</div>
                <h4 className="font-bold text-sm mb-4">Quick Actions</h4>
                <div className="space-y-2 relative z-10">
                    <button
                        onClick={onOpenVoice}
                        className="w-full text-left bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                        🎙️ Voice Orchestration
                    </button>
                    <button
                        onClick={onOpenQuizGen}
                        className="w-full text-left bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                        🎯 Quiz Genius
                    </button>
                </div>
            </div>
        </div>
    );
}
