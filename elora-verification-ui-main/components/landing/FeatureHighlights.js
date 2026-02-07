import { motion } from 'framer-motion';

export default function FeatureHighlights() {
    const features = [
        {
            icon: '🎓',
            title: 'For Students',
            description: 'Step-by-step guidance that adapts to your level, builds confidence, and helps you master concepts at your own pace.',
            color: 'indigo-500',
            delay: 0.2,
        },
        {
            icon: '👩‍🏫',
            title: 'For Teachers',
            description: 'Save hours with AI-powered grading, classroom management, and content generation tools that scale your impact.',
            color: 'purple-500',
            delay: 0.3,
        },
        {
            icon: '👨‍👩‍👧‍👦',
            title: 'For Parents',
            description: 'Stay involved with clear progress reports and simple explanations so you can support learning at home with confidence.',
            color: 'cyan-500',
            delay: 0.4,
        },
    ];

    return (
        <section className="py-20 relative">
            {/* Section header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16 px-6"
            >
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-[var(--font-outfit)]">
                    Built for Everyone in Education
                </h2>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    Whether you&apos;re learning, teaching, or supporting—Elora has the right tools for you.
                </p>
            </motion.div>

            {/* Feature cards */}
            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-colors"
                    >
                        <div className={`w-14 h-14 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 
                            flex items-center justify-center text-3xl mb-4 text-${feature.color}-600 dark:text-${feature.color}-400`}>
                            {feature.icon}
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-[var(--font-outfit)]">
                            {feature.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                            {feature.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
