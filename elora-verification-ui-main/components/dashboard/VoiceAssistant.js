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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-lg">🎙️</div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Voice Orchestration</h3>
                    </div>

                    {!plan ? (
                        <div className="space-y-6">
                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-center relative group min-h-[160px] flex items-center justify-center">
                                {isListening ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-1 justify-center">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: [10, 24, 10] }}
                                                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                                                    className="w-1.5 bg-indigo-500 rounded-full"
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Listening...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium px-4">
                                            {transcript || "Describe your lesson idea. Elora will structure it into a full execution plan."}
                                        </p>
                                        {!transcript && (
                                            <button
                                                onClick={startListening}
                                                className="w-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-2xl shadow-lg hover:scale-105 transition-transform mx-auto"
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
                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold uppercase tracking-wide shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    {analyzing ? "Synthesizing..." : "Generate Lesson Strategy →"}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">{plan.title}</h4>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400">Structured {plan.duration} high-impact session.</p>
                            </div>

                            <div className="space-y-2">
                                {plan.segments.map((seg, i) => (
                                    <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl items-center">
                                        <span className="text-xs font-bold text-slate-400 w-16">{seg.time}</span>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{seg.activity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => setPlan(null)}
                                    className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => { onApplyPlan(plan); onClose(); }}
                                    className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wide shadow-md"
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
