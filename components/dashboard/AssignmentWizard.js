// components/dashboard/AssignmentWizard.js
// Modernized Multi-step Assignment Creation Wizard

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AssignmentWizard({ isOpen, onClose, onSave, classes }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        dueDate: "",
        classCode: "ALL",
        points: 100,
        aiGenerated: false
    });

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(formData);
        setStep(1);
        setFormData({ title: "", description: "", dueDate: "", classCode: "ALL", points: 100, aiGenerated: false });
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
                className="relative w-full max-w-2xl bg-white dark:bg-neutral-950 rounded-[2.5rem] shadow-premium-xl border-premium overflow-hidden"
            >
                {/* Header */}
                <div className="px-10 pt-10 pb-6 border-b border-neutral-100 dark:border-neutral-800/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600">New Assignment</span>
                        <span className="text-xs font-bold text-neutral-400">Step {step} of 2</span>
                    </div>
                    <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight font-[var(--font-outfit)]">
                        {step === 1 ? "Mission Profile" : "Target & Timing"}
                    </h3>
                </div>

                <div className="p-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-4">Assignment Title</label>
                                    <input
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Gravity and Motion Lab"
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border-premium rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-4">Instructions</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the learning objectives..."
                                        rows={4}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border-premium rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                    />
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, description: "Analyze the relationship between mass, distance, and gravitational force using the simulations provided.", aiGenerated: true })}
                                    className="flex items-center gap-2 text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:opacity-80 transition-all"
                                >
                                    ✨ Let Elora Write Instructions
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-4">Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border-premium rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-4">Max Points</label>
                                        <input
                                            type="number"
                                            value={formData.points}
                                            onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border-premium rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-4">Assign to Class</label>
                                    <select
                                        value={formData.classCode}
                                        onChange={e => setFormData({ ...formData, classCode: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border-premium rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="ALL">All Classes</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.joinCode}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-10 bg-neutral-50 dark:bg-neutral-900/50 flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800/50">
                    <button
                        onClick={onClose}
                        className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-all"
                    >
                        Discard
                    </button>
                    <div className="flex gap-4">
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                className="px-8 py-3 bg-white dark:bg-neutral-950 border-premium text-neutral-600 dark:text-neutral-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={() => step === 1 ? setStep(2) : handleSave()}
                            disabled={step === 1 && !formData.title}
                            className="px-10 py-3 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-premium-md hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {step === 1 ? "Continue →" : "Deploy Assignment"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
