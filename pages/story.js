import Head from "next/head";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function StoryPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <>
            <Head>
                <title>Our Story | Elora</title>
                <meta name="description" content="The vision behind Elora - humanizing AI for the next generation of learners." />
            </Head>

            <div className="elora-page min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
                {/* Ambient Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full bg-indigo-500/10 blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute bottom-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-fuchsia-500/10 blur-[100px]"
                    />
                </div>

                <div className="elora-container relative z-10 pt-20 pb-32">
                    {/* Hero Section */}
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={stagger}
                        className="max-w-4xl mx-auto text-center mb-24"
                    >
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-8">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            The Elora Mission
                        </motion.div>

                        <motion.h1 variants={fadeUp} className="text-[clamp(2rem,6vw,4rem)] md:text-[clamp(2.5rem,6vw,5rem)] font-black tracking-tighter leading-[1.1] md:leading-[1.05] text-slate-950 dark:text-white mb-8">
                            Humanizing Intelligence, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500">One Conversation</span> at a Time.
                        </motion.h1>

                        <motion.p variants={fadeUp} className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
                            We didn't build Elora to replace teachers or parents. We built it to give them their time back—and to give students a calm space to grow.
                        </motion.p>
                    </motion.div>

                    {/* Core Values Grid */}
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="grid md:grid-cols-3 gap-8 mb-32"
                    >
                        {[
                            {
                                icon: "🌿",
                                title: "Calm by Design",
                                desc: "Education shouldn't be stressful. Elora uses a 'hints-first' approach to reduce anxiety and build true mastery.",
                                color: "indigo"
                            },
                            {
                                icon: "🏫",
                                title: "Teacher First",
                                desc: "AI is a tool, not a replacement. We automate the 'boring stuff' so educators can focus on what matters: the students.",
                                color: "fuchsia"
                            },
                            {
                                icon: "🔒",
                                title: "Secure & Private",
                                desc: "Your data is yours. Built for schools from the ground up with verification at the core of every workflow.",
                                color: "sky"
                            }
                        ].map((value, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                className="group p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300"
                            >
                                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{value.icon}</div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 font-[var(--font-outfit)]">{value.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                    {value.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Founder Section */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl opacity-50 -z-10" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
                        >
                            <div className="relative aspect-square max-w-sm sm:max-w-md mx-auto lg:ml-auto lg:order-2">
                                <div className="absolute inset-0 rounded-[4rem] bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-sky-400 rotate-6 blur-2xl opacity-20" />
                                <div className="relative h-full w-full rounded-[3rem] border border-white/20 bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-2xl">
                                    {/* Placeholder for Founder Image - Using a stylized representation */}
                                    <div className="absolute inset-0 flex items-center justify-center text-[10rem] opacity-20 pointer-events-none">✨</div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                                    <div className="absolute bottom-8 left-8 right-8">
                                        <div className="text-white font-black text-2xl">The Visionary</div>
                                        <div className="text-slate-300 text-sm font-bold uppercase tracking-widest">Founder of Elora</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 lg:order-1">
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white font-[var(--font-outfit)]">A Note From the Founder</h2>
                                <div className="space-y-6 text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                                    <p>
                                        "I started Elora because I saw how students were getting lost in a sea of generic AI answers. Most tools are built to give you the answer, but they don't teach you how to think."
                                    </p>
                                    <p>
                                        "We believe AI should be a partner in curiosity, not a shortcut for laziness. Elora is designed to be the patient, calm mentor that every learner deserves, regardless of their background or access to resources."
                                    </p>
                                    <p>
                                        "This is just the beginning. Thank you for being part of the Elora journey."
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-600 grid place-items-center text-white font-black text-xl">E</div>
                                    <div className="font-bold text-slate-900 dark:text-white">
                                        Team Elora
                                        <span className="block text-xs text-slate-500 font-medium tracking-widest uppercase">Redefining Education</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="mt-32 p-12 rounded-[3.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-center relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 opacity-50" />
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-black mb-6">Ready to start your journey?</h2>
                            <p className="text-lg opacity-80 mb-10 max-w-xl mx-auto font-medium">
                                Join thousands of teachers, parents, and students who are discovering a calmer, smarter way to learn.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-indigo-600 text-white dark:bg-slate-900 dark:text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20"
                                >
                                    🚀 Get Started for Free
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
