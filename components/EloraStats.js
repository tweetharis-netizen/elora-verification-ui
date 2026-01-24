import { motion } from "framer-motion";

// Authentic Elora platform stats - no fake partnerships
const stats = [
    {
        value: "AI-Powered",
        label: "Learning Assistant",
        icon: "🤖",
        description: "Smart tutoring that adapts to your learning style",
    },
    {
        value: "3 Roles",
        label: "Students • Parents • Teachers",
        icon: "👥",
        description: "Designed for every member of the education journey",
    },
    {
        value: "Instant",
        label: "Feedback",
        icon: "⚡",
        description: "Real-time explanations and step-by-step guidance",
    },
    {
        value: "Secure",
        label: "Verification",
        icon: "🔒",
        description: "Email verification for teacher access control",
    },
];

export default function EloraStats() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="w-full py-12 md:py-16"
        >
            <div className="text-center mb-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 mb-4"
                >
                    <span className="text-sm">✨</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        What makes Elora different
                    </span>
                </motion.div>

                <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white font-[var(--font-outfit)]">
                    The <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">Elora Ecosystem</span>
                </h2>
                <p className="mt-4 text-slate-500 font-medium">Core pillars of our learning philosophy</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                        className="group relative"
                    >
                        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-white/80 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/30 border border-slate-200/60 dark:border-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300/50 dark:hover:border-indigo-600/50 hover:-translate-y-1">
                            {/* Icon */}
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                {stat.icon}
                            </div>

                            {/* Value */}
                            <div className="text-lg font-black text-slate-900 dark:text-white font-[var(--font-outfit)] mb-0.5">
                                {stat.value}
                            </div>

                            {/* Label */}
                            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                                {stat.label}
                            </div>

                            {/* Description */}
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                {stat.description}
                            </p>

                            {/* Hover glow */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* CTA to try the assistant */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-center mt-10"
            >
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Ready to experience smarter learning?
                </p>
                <a
                    href="/assistant"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-slate-900/20"
                >
                    <span>Try the Assistant</span>
                    <span>→</span>
                </a>
            </motion.div>
        </motion.section>
    );
}
