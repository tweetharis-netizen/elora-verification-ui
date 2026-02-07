import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

export default function HeroSection() {
    const router = useRouter();

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
            {/* Minimalist background grid (subtle texture) */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] dark:opacity-[0.05]" />

            <div className="relative max-w-5xl mx-auto px-6 text-center z-10 pt-20">
                {/* Clean Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
                    bg-neutral-100 border border-neutral-200 
                    dark:bg-neutral-900 dark:border-neutral-800
                    mb-8"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 tracking-wide uppercase">
                        Public Beta Now Live
                    </span>
                </motion.div>

                {/* Main Headline - High Contrast, No Gradient */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl sm:text-7xl font-bold mb-6 tracking-tight text-neutral-900 dark:text-white font-[var(--font-outfit)]"
                >
                    Empowering Education
                    <br />
                    <span className="text-neutral-400 dark:text-neutral-500">
                        Through Intelligence
                    </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
                >
                    Personalized learning for every student. <br className="hidden sm:block" />
                    Powerful insights for every teacher.
                </motion.p>

                {/* CTA Buttons - Solid & Clean */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                >
                    <button
                        onClick={() => router.push('/assistant')}
                        className="group px-8 py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold rounded-lg 
                        hover:translate-y-[-1px] transition-all duration-200 shadow-sm
                        flex items-center gap-2"
                    >
                        <span>Start Assistant</span>
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-8 py-3.5 
                        bg-white border border-neutral-200 text-neutral-700
                        dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300
                        font-semibold rounded-lg 
                        hover:bg-neutral-50 dark:hover:bg-neutral-800
                        transition-all duration-200"
                    >
                        View Dashboard
                    </button>
                </motion.div>

                {/* Social Proof / Trust (Optional Placeholder) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="border-t border-neutral-100 dark:border-neutral-900 pt-10"
                >
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
                        Trusted by forward-thinking educators
                    </p>
                    {/* Icons would go here */}
                </motion.div>
            </div>
        </section>
    );
}
