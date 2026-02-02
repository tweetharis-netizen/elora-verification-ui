import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

export default function HeroSection() {
    const router = useRouter();

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Radial gradient backgrounds - matching body style */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-glow" />
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-float-delayed" />
            </div>

            <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
                {/* Animated badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
            backdrop-blur-xl border border-white/10
            bg-gradient-to-r from-white/5 to-white/10
            mb-8"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-bold text-emerald-400 tracking-wide">
                        NOW IN BETA • TRY FREE
                    </span>
                </motion.div>

                {/* Main headline with gradient */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 font-[var(--font-outfit)]"
                    style={{ letterSpacing: '-0.02em' }}
                >
                    <span className="text-white">
                        Empowering Education
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                        Through AI
                    </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed"
                >
                    Every student deserves personalized learning that adapts to their pace. Every teacher deserves tools that multiply their impact.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
                >
                    <button
                        onClick={() => router.push('/assistant')}
                        className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl 
              shadow-lg shadow-purple-500/30 
              hover:shadow-2xl hover:shadow-purple-500/50
              hover:scale-105 hover:-translate-y-0.5
              transition-all duration-300 
              flex items-center gap-2"
                    >
                        <span>Try Assistant Free</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-8 py-4 
              bg-white/5 backdrop-blur-xl border border-white/10 
              text-white font-bold rounded-xl 
              hover:bg-white/10 hover:border-white/20
              hover:scale-105 transition-all duration-300"
                    >
                        Go to Dashboard
                    </button>
                </motion.div>

                {/* Feature pills */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex flex-wrap justify-center gap-3 text-sm"
                >
                    {[
                        { icon: '✨', text: 'No login required' },
                        { icon: '🚀', text: 'Instant responses' },
                        { icon: '🎓', text: 'Curriculum-aligned' },
                        { icon: '🔒', text: 'Privacy-focused' },
                    ].map((feature, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 px-4 py-2 
                bg-white/5 backdrop-blur-xl border border-white/10 
                rounded-full text-slate-300 
                hover:bg-white/10 transition-colors duration-300"
                        >
                            <span>{feature.icon}</span>
                            <span className="font-medium">{feature.text}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
