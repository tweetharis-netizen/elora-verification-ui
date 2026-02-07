import { motion } from 'framer-motion';

export default function FounderStory() {
    const missionCards = [
        {
            icon: '🎯',
            title: 'Our Mission',
            description: 'Make quality education accessible through AI that understands context, adapts to needs, and empowers both teachers and students.',
            bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
            textClass: 'text-indigo-600 dark:text-indigo-400',
            hoverBorder: 'hover:border-indigo-500/50'
        },
        {
            icon: '💡',
            title: 'Our Vision',
            description: 'A world where every learner has a patient, knowledgeable mentor available 24/7, and every teacher has tools to scale their impact.',
            bgClass: 'bg-purple-100 dark:bg-purple-900/30',
            textClass: 'text-purple-600 dark:text-purple-400',
            hoverBorder: 'hover:border-purple-500/50'
        },
        {
            icon: '🚀',
            title: 'Our Promise',
            description: 'Build technology that enhances human connection in education, never replaces it. AI as a tool, not a replacement.',
            bgClass: 'bg-cyan-100 dark:bg-cyan-900/30',
            textClass: 'text-cyan-600 dark:text-cyan-400',
            hoverBorder: 'hover:border-cyan-500/50'
        },
    ];

    return (
        <section className="py-20 relative">
            <div className="max-w-5xl mx-auto px-6">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4 font-[var(--font-outfit)]">
                        Meet the Founder
                    </h2>
                    <div className="w-20 h-1 bg-indigo-600 mx-auto rounded-full" />
                </motion.div>

                {/* Founder bio card - minimalist style */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="rounded-2xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 font-[var(--font-outfit)]">
                            Shaik Haris
                            <span className="block text-base font-normal text-indigo-600 dark:text-indigo-400 mt-2">
                                Founder & CEO of Elora
                            </span>
                        </h3>

                        <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                            <p>
                                <strong className="text-slate-900 dark:text-white">Elora</strong> was born from a simple belief:
                                every student deserves personalized, patient guidance that adapts to their unique learning style.
                            </p>

                            <p>
                                As an educator and technologist, I witnessed firsthand how traditional classroom constraints
                                prevented teachers from giving each student the attention they needed. Class sizes grow,
                                administrative burdens increase, yet the expectation for personalized learning remains.
                            </p>

                            <p>
                                Elora bridges this gap—an AI assistant that never gets tired, never judges, and helps students
                                build confidence through thoughtful, human-like explanations. For teachers, it&apos;s a tireless
                                co-pilot that handles verification, grading, and content generation, freeing them to focus on
                                what they do best: inspiring young minds.
                            </p>

                            <blockquote className="border-l-4 border-indigo-500 pl-6 italic text-lg my-6 text-slate-700 dark:text-slate-300">
                                &quot;Education should feel like a conversation, not a lecture. Elora makes that possible for every student,
                                regardless of their background or learning pace.&quot;
                            </blockquote>

                            <p className="text-slate-900 dark:text-white font-semibold">
                                — Shaik Haris
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Mission cards - matching the feature card style */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="grid md:grid-cols-3 gap-6"
                >
                    {missionCards.map((card, index) => (
                        <div
                            key={index}
                            className={`p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors ${card.hoverBorder}`}
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4 ${card.bgClass} ${card.textClass}`}>
                                {card.icon}
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-[var(--font-outfit)]">{card.title}</h4>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {card.description}
                            </p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
