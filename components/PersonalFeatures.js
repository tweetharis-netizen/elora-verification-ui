import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PERSONA_DATA = {
    student: {
        label: "Students",
        icon: "📖",
        color: "indigo",
        headline: "Learn smarter, not harder",
        features: [
            {
                icon: "🎯",
                title: "Personalized Learning Paths",
                desc: "AI adapts to your pace and learning style for maximum retention",
            },
            {
                icon: "💡",
                title: "Instant Explanations",
                desc: "Get step-by-step breakdowns of complex concepts in plain language",
            },
            {
                icon: "📊",
                title: "Progress Tracking",
                desc: "Visualize your growth with detailed analytics and milestones",
            },
            {
                icon: "🏆",
                title: "Gamified Achievements",
                desc: "Stay motivated with badges, streaks, and learning rewards",
            },
        ],
    },
    parent: {
        label: "Parents",
        icon: "👨‍👩‍👧",
        color: "cyan",
        headline: "Stay connected to your child's journey",
        features: [
            {
                icon: "📱",
                title: "Real-time Updates",
                desc: "Get notified about progress, achievements, and areas needing support",
            },
            {
                icon: "📈",
                title: "Insight Reports",
                desc: "Weekly summaries of your child's learning activities and growth",
            },
            {
                icon: "🤝",
                title: "Teacher Communication",
                desc: "Direct messaging and collaboration with educators",
            },
            {
                icon: "🔒",
                title: "Safe Learning",
                desc: "Age-appropriate content with full parental controls",
            },
        ],
    },
    educator: {
        label: "Educators",
        icon: "👩‍🏫",
        color: "purple",
        headline: "Teach more, grade less",
        features: [
            {
                icon: "⚡",
                title: "AI-Powered Grading",
                desc: "Automatically assess assignments with detailed feedback suggestions",
            },
            {
                icon: "📋",
                title: "Lesson Planning",
                desc: "Generate curriculum-aligned materials in seconds",
            },
            {
                icon: "🎓",
                title: "Student Analytics",
                desc: "Deep insights into class performance and individual needs",
            },
            {
                icon: "🔄",
                title: "Workflow Automation",
                desc: "Reduce admin time with smart scheduling and reminders",
            },
        ],
    },
};

const colorMap = {
    indigo: {
        bg: "from-indigo-500/20 to-indigo-600/10",
        border: "border-indigo-500/30",
        text: "text-indigo-500",
        glow: "shadow-indigo-500/20",
        button: "bg-indigo-500 hover:bg-indigo-600",
    },
    cyan: {
        bg: "from-cyan-500/20 to-cyan-600/10",
        border: "border-cyan-500/30",
        text: "text-cyan-500",
        glow: "shadow-cyan-500/20",
        button: "bg-cyan-500 hover:bg-cyan-600",
    },
    purple: {
        bg: "from-purple-500/20 to-purple-600/10",
        border: "border-purple-500/30",
        text: "text-purple-500",
        glow: "shadow-purple-500/20",
        button: "bg-purple-500 hover:bg-purple-600",
    },
};

function FeatureCard({ icon, title, desc, color, index }) {
    const colors = colorMap[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={`
        group relative p-5 rounded-2xl
        bg-gradient-to-br ${colors.bg}
        border ${colors.border}
        backdrop-blur-sm
        transition-all duration-300
        hover:scale-[1.02] hover:shadow-xl ${colors.glow}
      `}
        >
            <div className="flex items-start gap-4">
                <div
                    className={`
            w-12 h-12 rounded-xl
            bg-white/10 dark:bg-white/5
            flex items-center justify-center
            text-2xl
            group-hover:scale-110 transition-transform duration-300
          `}
                >
                    {icon}
                </div>
                <div className="flex-1">
                    <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-1 font-[var(--font-outfit)]">
                        {title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                        {desc}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export default function PersonaFeatures() {
    const [activePersona, setActivePersona] = useState("student");
    const persona = PERSONA_DATA[activePersona];
    const colors = colorMap[persona.color];

    return (
        <section className="w-full py-12 md:py-20">
            <div className="text-center mb-8">
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-[var(--font-outfit)] mb-3"
                >
                    Built for <span className={colors.text}>everyone</span>
                </motion.h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
                    Discover features tailored to your unique role in the learning journey
                </p>
            </div>

            {/* Persona toggle tabs */}
            <div className="flex justify-center mb-10">
                <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    {Object.entries(PERSONA_DATA).map(([key, data]) => (
                        <button
                            key={key}
                            onClick={() => setActivePersona(key)}
                            className={`
                relative px-5 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-300
                ${activePersona === key
                                    ? "text-white shadow-lg"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }
              `}
                        >
                            {activePersona === key && (
                                <motion.div
                                    layoutId="activePersona"
                                    className={`absolute inset-0 rounded-xl ${colorMap[data.color].button}`}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <span>{data.icon}</span>
                                <span className="hidden sm:inline">{data.label}</span>
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Feature cards */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activePersona}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Headline */}
                    <div className="text-center mb-8">
                        <span className="text-4xl mb-2 block">{persona.icon}</span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-[var(--font-outfit)]">
                            {persona.headline}
                        </h3>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
                        {persona.features.map((feature, index) => (
                            <FeatureCard
                                key={feature.title}
                                {...feature}
                                color={persona.color}
                                index={index}
                            />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </section>
    );
}
