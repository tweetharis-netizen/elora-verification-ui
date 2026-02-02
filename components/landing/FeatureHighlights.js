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
                    Whether you're learning, teaching, or supporting—Elora has the right tools for you.
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
                        transition={{ duration: 0.5, delay: feature.delay }}
                        className="group relative"
                    >
                        {/* Glassmorphism card - matching elora-card style */}
                        <div className="relative overflow-hidden rounded-2xl p-6
              border border-white/10
              bg-gradient-to-br from-white/10 to-white/5
              backdrop-blur-sm
              transition-all duration-300
              hover:border-white/20 hover:bg-white/15
              hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1">

                            {/* Icon with gradient background */}
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${feature.color} to-${feature.color}/70 
                flex items-center justify-center text-3xl mb-4
                shadow-lg shadow-${feature.color}/30`}>
                                {feature.icon}
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-white mb-3 font-[var(--font-outfit)]">
                                {feature.title}
                            </h3>
                            <p className="text-slate-300 leading-relaxed text-sm">
                                {feature.description}
                            </p>

                            {/* Glow effect on hover */}
                            <div className={`absolute -inset-1 bg-gradient-to-r from-${feature.color}/20 to-transparent 
                blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
