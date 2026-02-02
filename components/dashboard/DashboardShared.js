// components/dashboard/DashboardShared.js
// Shared UI components for the Dashboard

import Link from "next/link";
import { motion } from "framer-motion";

export function LockedFeatureOverlay({ children, isVerified }) {
    if (isVerified) return children;

    return (
        <div className="relative group cursor-not-allowed">
            <div className="blur-[2px] opacity-70 pointer-events-none transition-all group-hover:blur-[3px]">
                {children}
            </div>
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-premium-xl border-premium scale-95 group-hover:scale-100 transition-transform">
                    <Link href="/verify" className="flex items-center gap-2 no-underline">
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-50 whitespace-nowrap">Verify to Unlock →</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function PreviewBanner() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-primary-50 dark:bg-primary-500/10 border-premium border-primary-200 dark:border-primary-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-premium-sm"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-lg shadow-premium-md">✨</div>
                <div>
                    <div className="text-sm font-bold text-neutral-900 dark:text-neutral-50">Experimental Mode</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Verify your identity to unlock deep academic tracking and live class sync.</div>
                </div>
            </div>
            <Link href="/verify" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all shadow-premium-md">
                Verify Now
            </Link>
        </motion.div>
    );
}
