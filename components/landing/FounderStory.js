import { motion } from 'framer-motion';

export default function FounderStory() {
    const missionCards = [
        {
            icon: '🎯',
            title: 'Our Mission',
            description: 'Make quality education accessible through AI that understands context, adapts to needs, and empowers both teachers and students.',
            color: 'indigo-500',
        },
        {
            icon: '💡',
            title: 'Our Vision',
            description: 'A world where every learner has a patient, knowledgeable mentor available 24/7, and every teacher has tools to scale their impact.',
            color: 'purple-500',
        },
        {
            icon: '🚀',
            title: 'Our Promise',
            description: 'Build technology that enhances human connection in education, never replaces it. AI as a tool, not a replacement.',
            color: 'cyan-500',
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
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-[var(--font-outfit)]">
                        Meet the Founder
                    </h2>
                    <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 mx-auto rounded-full" />
                </motion.div>

                {/* Founder bio card - matching elora-card glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="elora-card p-8 sm:p-12">
                        <h3 className="text-2xl font-bold text-white mb-3 font-[var(--font-outfit)]">
                            Shaik Haris
                            <span className="block text-base font-normal text-purple-400 mt-2">
                                Founder & CEO of Elora
                            </span>
                        </h3>

                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                <strong className="text-white">Elora</strong> was born from a simple belief:
                                every student deserves personalized, patient guidance that adapts to their unique learning style.
                            </p>

                            <p>
                                As an educator and technologist, I witnessed firsthand how traditional classroom constraints
                                prevented teachers from giving each student the attention they needed. Class sizes grow,
                                administrative burdens increase, yet the expectation for personalized learning remains.
                            </p>

                            <p>
                                Elora bridges this gap—an AI assistant that never gets tired, never judges, and helps students
                                build confidence through thoughtful, human-like explanations. For teachers, it's a tireless
                                co-pilot that handles verification, grading, and content generation, freeing them to focus on
                                what they do best: inspiring young minds.
                            </p>

                            <blockquote className="border-l-4 border-purple-500 pl-6 italic text-lg my-6 text-purple-300">
                                "Education should feel like a conversation, not a lecture. Elora makes that possible for every student,
                                regardless of their background or learning pace."
                            </blockquote>

                            <p className="text-white font-semibold">
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
                            className="group relative overflow-hidden rounded-2xl p-6
                border border-white/10
                bg-gradient-to-br from-white/10 to-white/5
                backdrop-blur-sm
                transition-all duration-300
                hover:border-white/20 hover:bg-white/15
                hover:scale-[1.02] hover:-translate-y-1"
                        >
                            <div className="text-4xl mb-3">{card.icon}</div>
                            <h4 className="font-bold text-white mb-2 font-[var(--font-outfit)]">{card.title}</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {card.description}
                            </p>

                            {/* Subtle glow on hover */}
                            <div className={`absolute -inset-1 bg-gradient-to-r from-${card.color}/20 to-transparent 
                blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
