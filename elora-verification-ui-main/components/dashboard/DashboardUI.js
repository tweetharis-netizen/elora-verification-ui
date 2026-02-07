// components/dashboard/DashboardUI.js
// Modular UI components for the Elora Dashboard - Professional & Clean

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Professional Greeting Component
 */
export function Greeting({ name, role }) {
    const [greeting, setGreeting] = useState("Hello");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    return (
        <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {greeting}, <span className="text-indigo-600 dark:text-indigo-400">{name || role || 'User'}</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-base">
                {role === 'Parent' ? "Here's how your child is doing today." : "Here's what's happening with your learning today."}
            </p>
        </div>
    );
}

/**
 * Precision Line Chart - Snappy & Clean
 */
export function LineChart({ data, height = 200, color = "var(--color-primary-600)" }) {
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
                <motion.polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </svg>
        </div>
    );
}

/**
 * Minimalist Bar Chart
 */
export function BarChart({ data, labels, height = 200, color = "var(--color-primary-600)" }) {
    if (!data || !labels || !Array.isArray(data)) return null;
    const max = data.length > 0 ? Math.max(...data) : 1;
    const safeMax = max <= 0 ? 1 : max;

    return (
        <div className="w-full h-full flex items-end justify-between gap-2" style={{ height }}>
            {data.map((val, i) => {
                const h = (Number(val) || 0) / safeMax * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                        <motion.div
                            className="w-full rounded-t-[2px] transition-all duration-200"
                            style={{ backgroundColor: color, height: `${Math.max(h, 2)}%` }}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(h, 2)}%` }}
                            transition={{ duration: 0.5, delay: i * 0.03, ease: "easeOut" }}
                        />
                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center tracking-tight">
                            {labels[i]}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Clean Stats Card
 */
export function StatsCard({ label, value, trend, trendValue, icon, className = "" }) {
    return (
        <div className={`p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-wide uppercase">{label}</span>
                <span className="text-lg text-slate-400">{icon}</span>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${trend === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                        {trend === 'up' ? '↑' : '↓'} {trendValue}
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Functional Performance Heatmap
 */
export function PerformanceHeatmap({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full overflow-y-auto pr-2 scrollbar-hide">
            {data.map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800 p-3 flex flex-col justify-between hover:border-slate-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{item.subject}</span>
                        <div className={`text-xs font-bold ${item.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                            item.score >= 50 ? 'text-amber-600 dark:text-amber-400' :
                                'text-rose-600 dark:text-rose-400'
                            }`}>
                            {item.score}%
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-500' :
                                item.score >= 50 ? 'bg-amber-500' :
                                    'bg-rose-500'
                                }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
