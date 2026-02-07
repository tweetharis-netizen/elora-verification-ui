import { useEffect, useState } from "react";
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
        bg: "bg-white/40 dark:bg-indigo-500/10",
        border: "border-white/60 dark:border-indigo-500/30",
        text: "text-indigo-600 dark:text-indigo-400",
        glow: "shadow-indigo-500/10 dark:shadow-indigo-500/20",
        button: "bg-indigo-600 hover:bg-indigo-700",
        iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
        iconText: "text-indigo-600 dark:text-indigo-400",
        gradient: "from-indigo-500/5 to-transparent"
    },
    cyan: {
        bg: "bg-white/40 dark:bg-cyan-500/10",
        border: "border-white/60 dark:border-cyan-500/30",
        text: "text-cyan-600 dark:text-cyan-400",
        glow: "shadow-cyan-500/10 dark:shadow-cyan-500/20",
        button: "bg-cyan-600 hover:bg-cyan-700",
        iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
        iconText: "text-cyan-600 dark:text-cyan-400",
        gradient: "from-cyan-500/5 to-transparent"
    },
    purple: {
        bg: "bg-white/40 dark:bg-purple-500/10",
        border: "border-white/60 dark:border-purple-500/30",
        text: "text-purple-600 dark:text-purple-400",
        glow: "shadow-purple-500/10 dark:shadow-purple-500/20",
        button: "bg-purple-600 hover:bg-purple-700",
        iconBg: "bg-purple-100 dark:bg-purple-900/40",
        iconText: "text-purple-600 dark:text-purple-400",
        gradient: "from-purple-500/5 to-transparent"
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
        group relative p-6 rounded-[2.5rem]
        ${colors.bg}
        border ${colors.border}
        backdrop-blur-xl
        transition-all duration-500
        hover:scale-[1.03] hover:shadow-2xl ${colors.glow}
        overflow-hidden
      `}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10 flex items-start gap-5">
                <div
                    className={`
            w-14 h-14 rounded-2xl
            ${colors.iconBg}
            flex items-center justify-center
            text-3xl
            group-hover:rotate-12 transition-transform duration-300
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

export default function PersonaFeatures({ initialRole = "student" }) {
    const [activePersona, setActivePersona] = useState(initialRole);

    useEffect(() => {
        setActivePersona(initialRole);
    }, [initialRole]);

    const persona = PERSONA_DATA[activePersona];
    const colors = colorMap[persona.color];

    return (
        <section className="w-full py-12 md:py-20">
            <div className="text-center mb-8">
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white font-[var(--font-outfit)] mb-3"
                >
                    <span className={colors.text}>Personalized</span> Experience
                </motion.h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
                    Discover features tailored to your unique role in the learning journey
                </p>
            </div>

            {/* Persona toggle tabs */}
            <div className="flex justify-center mb-10 px-4">
                <div className="inline-flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-white/40 dark:bg-slate-800/50 border border-white/60 dark:border-slate-700 backdrop-blur-md max-w-full overflow-x-auto scrollbar-hide">
                    {Object.entries(PERSONA_DATA).map(([key, data]) => (
                        <button
                            key={key}
                            onClick={() => setActivePersona(key)}
                            className={`
                relative px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold
                transition-all duration-300 whitespace-nowrap
                ${activePersona === key
                                    ? "text-white shadow-xl"
                                    : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 max-w-4xl mx-auto px-4">
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
