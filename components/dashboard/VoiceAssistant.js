// components/dashboard/VoiceAssistant.js
// Modernized Voice-to-Task & Lesson Planning Component

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "../../components/Notifications";

export default function VoiceAssistant({ isOpen, onClose, onApplyPlan }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [plan, setPlan] = useState(null);

    if (!isOpen) return null;

    const startListening = () => {
        setIsListening(true);
        setTranscript("");
        setPlan(null);
        // Simulate speech recognition
        setTimeout(() => {
            setTranscript("I want to plan a 45-minute lesson for my Physics class about Newton's Second Law. Include a hands-on activity with carts and an AI-generated quiz at the end.");
            setIsListening(false);
        }, 3000);
    };

    const handleAnalyze = () => {
        setAnalyzing(true);
        setTimeout(() => {
            setPlan({
                title: "Newton's Second Law Expedition",
                duration: "45 mins",
                segments: [
                    { time: "0-10m", activity: "Visual Recap: Force vs Acceleration" },
                    { time: "10-30m", activity: "Interactive Cart Lab: Measuring F=ma" },
                    { time: "30-45m", activity: "AI Quiz & Peer Discussion" }
                ]
            });
            setAnalyzing(false);
            notify("Lesson plan structured by Elora", "success");
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white dark:bg-neutral-950 rounded-[2.5rem] shadow-premium-xl border-premium overflow-hidden"
            >
                <div className="p-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white text-xl shadow-premium-md">🎙️</div>
                        <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight font-[var(--font-outfit)]">Voice Orchestration</h3>
                    </div>

                    {!plan ? (
                        <div className="space-y-8">
                            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 border-premium rounded-3xl text-center relative group min-h-[160px] flex items-center justify-center">
                                {isListening ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-1 justify-center">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: [10, 30, 10] }}
                                                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                                    className="w-1 bg-rose-500 rounded-full"
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Listening to your vision...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-neutral-500 text-sm font-medium px-4">
                                            {transcript || "Describe your lesson idea. Elora will structure it into a full execution plan."}
                                        </p>
                                        {!transcript && (
                                            <button
                                                onClick={startListening}
                                                className="w-16 h-16 rounded-full bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 flex items-center justify-center text-2xl shadow-premium-lg hover:scale-110 transition-all mx-auto"
                                            >
                                                🎙️
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {transcript && !isListening && (
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="w-full py-4 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-premium-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    {analyzing ? "Synthesizing..." : "Generate Lesson Strategy →"}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border-premium border-rose-200 dark:border-rose-500/30 rounded-2xl">
                                <h4 className="font-bold text-rose-900 dark:text-rose-400 mb-1">{plan.title}</h4>
                                <p className="text-xs text-rose-600 dark:text-rose-500">Structured {plan.duration} high-impact session.</p>
                            </div>

                            <div className="space-y-2">
                                {plan.segments.map((seg, i) => (
                                    <div key={i} className="flex gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 border-premium rounded-2xl items-center">
                                        <span className="text-[10px] font-bold text-neutral-400 w-16">{seg.time}</span>
                                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{seg.activity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setPlan(null)}
                                    className="flex-1 py-3 bg-white dark:bg-neutral-900 border-premium text-neutral-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-50"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => { onApplyPlan(plan); onClose(); }}
                                    className="flex-1 py-3 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-premium-md"
                                >
                                    Deploy Strategy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
