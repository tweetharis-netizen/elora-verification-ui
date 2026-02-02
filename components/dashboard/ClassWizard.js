// components/dashboard/ClassWizard.js
// Multi-step wizard for creating and editing classes

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES, getCountryLevels, getCountrySubjects } from "../../lib/dashboard-utils";

export default function ClassWizard({
    isOpen,
    onClose,
    onSave,
    editingClass = null
}) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(editingClass || {
        name: "",
        country: "Singapore",
        level: "",
        subject: "",
        vision: ""
    });

    const isEditing = !!editingClass;

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const canContinue = () => {
        if (step === 1) return formData.name && formData.country;
        if (step === 2) return formData.level && formData.subject;
        return true;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-neutral-900 w-full max-w-lg rounded-[2.5rem] shadow-premium-xl border-premium overflow-hidden"
            >
                {/* Header */}
                <div className="p-8 pb-0 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-10 h-10 bg-primary-50 dark:bg-primary-500/10 rounded-2xl flex items-center justify-center text-xl">
                                {isEditing ? '⚙️' : '✨'}
                            </span>
                            <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                                {isEditing ? 'Class Settings' : 'New Classroom'}
                            </h3>
                        </div>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                            {isEditing ? `Refining ${editingClass.name}` : "Configure a new space for your students."}
                        </p>
                    </div>
                    <div className="flex gap-1.5 pt-2">
                        {[1, 2, 3].map(s => (
                            <div
                                key={s}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-primary-600 w-4' : 'bg-neutral-200 dark:bg-neutral-800'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 pt-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Class Name</label>
                                    <input
                                        autoFocus
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Theoretical Physics II"
                                        className="w-full bg-neutral-50 dark:bg-neutral-800 border-premium rounded-2xl px-5 py-4 text-sm focus:border-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Region / Academic System</label>
                                    <select
                                        value={formData.country}
                                        onChange={e => setFormData({ ...formData, country: e.target.value, level: "", subject: "" })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-800 border-premium rounded-2xl px-5 py-4 text-sm focus:border-primary-500 outline-none transition-all appearance-none"
                                    >
                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Academic Level</label>
                                    <select
                                        value={formData.level}
                                        onChange={e => setFormData({ ...formData, level: e.target.value, subject: "" })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-800 border-premium rounded-2xl px-5 py-4 text-sm focus:border-primary-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="">Select Level</option>
                                        {getCountryLevels(formData.country).map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Primary Subject</label>
                                    <select
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-800 border-premium rounded-2xl px-5 py-4 text-sm focus:border-primary-500 outline-none transition-all appearance-none"
                                        disabled={!formData.level}
                                    >
                                        <option value="">Select Subject</option>
                                        {formData.level && getCountrySubjects(formData.country, formData.level).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Classroom Vision (Optional)</label>
                                    <textarea
                                        value={formData.vision}
                                        onChange={e => setFormData({ ...formData, vision: e.target.value })}
                                        placeholder="e.g. Cultivating a curiosity-first environment for advanced logic..."
                                        className="w-full h-32 bg-neutral-50 dark:bg-neutral-800 border-premium rounded-2xl px-5 py-4 text-sm focus:border-primary-500 outline-none transition-all resize-none"
                                    />
                                    <p className="text-[10px] text-neutral-400 mt-2 italic px-1">Elora uses this to adjust her pedagogical tone for this class.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-10">
                        <button
                            onClick={step === 1 ? onClose : handleBack}
                            className="px-6 py-4 rounded-2xl text-xs font-bold text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            {step === 1 ? "Cancel" : "Back"}
                        </button>
                        <button
                            onClick={step === 3 ? () => onSave(formData) : handleNext}
                            disabled={!canContinue()}
                            className={`flex-1 px-6 py-4 rounded-2xl text-xs font-bold transition-all shadow-premium-md ${canContinue()
                                    ? "bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 hover:scale-[1.02]"
                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                                }`}
                        >
                            {step < 3 ? "Next Step" : (isEditing ? 'Save Changes' : 'Create Class')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
