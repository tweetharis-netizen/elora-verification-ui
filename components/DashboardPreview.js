import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LineChart } from "./SimpleCharts";

// Module card component for dashboard preview
function ModuleCard({ icon, title, subtitle, stats, chartData, color, delay, isLive = true }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
            className="relative group"
        >
            <div
                className={`
          relative overflow-hidden rounded-2xl p-4
          bg-gradient-to-br from-white/10 to-white/5
          border border-white/10
          backdrop-blur-sm
          transition-all duration-300
          hover:border-white/20 hover:bg-white/15
          hover:shadow-lg hover:shadow-${color}/20
        `}
            >
                {/* Glow effect */}
                <div
                    className={`absolute -inset-1 bg-gradient-to-r from-${color}/20 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Content */}
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                        <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${color} to-${color}/70 flex items-center justify-center text-white text-lg shadow-lg shadow-${color}/30`}
                        >
                            {icon}
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isLive ? 'animate-pulse' : 'opacity-50'}`} />
                            {isLive ? 'LIVE' : 'IDLE'}
                        </div>
                    </div>

                    <h4 className="text-white font-bold text-sm mb-1 font-[var(--font-outfit)]">
                        {title}
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed mb-3">
                        {subtitle}
                    </p>

                    {/* Stats or Chart */}
                    {/* If we have chartData, show a mini chart. Otherwise show stats. */}
                    {/* We need to pass chartData down. Since I modified the 'modules' array to have chartData, I need to make sure ModuleCard accepts it. */}

                    {/* Note: I need to update the props of component first. See next step/chunk or do it here if possible. */}
                    {/* Wait, I cannot change props in this chunk easily because the function signature is at line 5. I will do a multi-replace or just assume 'rest' props are passed if I spread them. */}
                    {/* Actually, looking at line 148: <ModuleCard key={index} {...module} />. So chartData WILL be passed as a prop! */}

                    {/* I need to update the component definition to accept chartData. */}
                    {/* I'll use a separate tool call for the component definition update to be safe and clean. */}
                    {chartData ? (
                        <div className="h-10 w-full opacity-60">
                            <LineChart data={chartData} color={color.split('-')[0]} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            {(stats || []).map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className={`text-lg font-bold text-${color} font-[var(--font-outfit)]`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function DashboardPreview({ role = "all" }) {
    const modules = [
        {
            icon: "📊",
            title: "Student Progress",
            subtitle: "Real-time learning momentum",
            // We will render a custom component for this in the map if needed, or just pass data
            chartData: [40, 55, 48, 62, 75, 82],
            color: "indigo-500",
            delay: 0.3,
        },
        {
            icon: "👨‍👩‍👧",
            title: "Parent Insights",
            subtitle: "Weekly activity breakdown",
            stats: [
                { value: "A+", label: "Grade" },
                { value: "↑15%", label: "Growth" },
            ],
            color: "cyan-500",
            delay: 0.5,
        },
        {
            icon: "⚡",
            title: "Teacher Automations",
            subtitle: "3.5 hours saved this week",
            stats: [
                { value: "2.5h", label: "Saved" },
                { value: "48", label: "Tasks" },
            ],
            color: "purple-500",
            delay: 0.7,
        },
    ];

    // Filter modules based on role
    const filteredModules = useMemo(() => {
        if (!role || role === "all") return modules;
        if (role === "student") return modules.filter(m => m.title.includes("Student"));
        if (role === "educator") return modules.filter(m => m.title.includes("Teacher"));
        if (role === "parent") return modules.filter(m => m.title.includes("Parent"));
        return modules;
    }, [role, modules]);

    return (
        <div className="elora-perspective">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                className="elora-3d-float"
            >
                {/* Monitor frame - clickable */}
                <Link href="/dashboard" className="block group/monitor cursor-pointer">
                    <div className="elora-monitor max-w-lg mx-auto transition-transform duration-300 group-hover/monitor:scale-[1.02]">
                        {/* Camera indicator is handled by CSS ::before */}

                        {/* Screen */}
                        <div className="elora-monitor-screen p-4 min-h-[320px] relative">
                            {/* Screen header */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
                                        E
                                    </div>
                                    <div>
                                        <div className="text-white text-sm font-bold font-[var(--font-outfit)]">
                                            Elora Dashboard
                                        </div>
                                        <div className="text-slate-400 text-[10px]">
                                            AI Learning Assistant
                                        </div>
                                    </div>
                                </div>

                                {/* Window controls */}
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                            </div>

                            <div className="grid gap-3">
                                {filteredModules.map((module, index) => (
                                    <ModuleCard key={index} {...module} />
                                ))}
                            </div>

                            {/* Ambient glow effects */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 left-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                                <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
                            </div>

                            {/* Hover overlay with CTA */}
                            <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-sm opacity-0 group-hover/monitor:opacity-100 transition-all duration-500 flex items-center justify-center rounded-xl overflow-hidden">
                                <span className="px-6 py-3 bg-white/20 border border-white/40 backdrop-blur-xl text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-2xl scale-95 group-hover/monitor:scale-100 transition-transform duration-500">
                                    Open Dashboard →
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Monitor stand */}
                <div className="elora-monitor-stand" />

                {/* Floating particles effect */}
                <motion.div
                    className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/30 to-transparent blur-2xl"
                    animate={{
                        y: [-10, 10, -10],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent blur-2xl"
                    animate={{
                        y: [10, -10, 10],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                />
            </motion.div>
        </div>
    );
}
