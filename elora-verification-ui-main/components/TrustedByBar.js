import { motion } from "framer-motion";

// Partner logos as simple text for now (monochromatic)
const partners = [
    { name: "Stanford EdTech", icon: "🎓" },
    { name: "MIT OpenCourseWare", icon: "📚" },
    { name: "Khan Academy", icon: "🏫" },
    { name: "Coursera", icon: "💻" },
    { name: "EdX", icon: "🌐" },
];

export default function TrustedByBar() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="w-full py-8 md:py-12"
        >
            <div className="text-center mb-6">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Trusted by educators at
                </span>
            </div>

            {/* Partner logos container */}
            <div className="relative overflow-hidden">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />

                {/* Scrolling logos */}
                <motion.div
                    className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                >
                    {partners.map((partner, index) => (
                        <motion.div
                            key={partner.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1 + index * 0.1 }}
                            className="group flex items-center gap-2.5 transition-all duration-300"
                        >
                            <div className="w-8 h-8 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 grid place-items-center grayscale group-hover:grayscale-0 group-hover:bg-indigo-500/10 transition-all duration-300">
                                <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity">
                                    {partner.icon}
                                </span>
                            </div>
                            <span className="text-sm font-black tracking-tight text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300 whitespace-nowrap">
                                {partner.name}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Decorative line */}
            <div className="mt-8 max-w-xs mx-auto">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
            </div>
        </motion.div>
    );
}
