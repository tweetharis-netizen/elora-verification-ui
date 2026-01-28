// Enhanced Assignment Wizard with Due Date Picker
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function EnhancedAssignmentWizard({ isOpen, onClose, onSave, classCode }) {
    const [step, setStep] = useState(1);
    const [method, setMethod] = useState('ai');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        dueTime: '23:59',
        classCode: classCode || '',
        questions: [],
        topic: '',
        points: 100,
        allowLateSubmission: true,
        attachments: []
    });

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSave = () => {
        const assignment = {
            id: `assign_${Date.now()}`,
            ...formData,
            method,
            createdAt: new Date().toISOString(),
            submissions: []
        };
        onSave(assignment);
        onClose();
        setStep(1);
        setFormData({
            title: '',
            description: '',
            dueDate: '',
            dueTime: '23:59',
            classCode: classCode || '',
            questions: [],
            topic: '',
            points: 100,
            allowLateSubmission: true,
            attachments: []
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                                ✨
                            </div>
                            <div>
                                <h2 className="text-2xl font-black">Create Assignment</h2>
                                <p className="text-indigo-100 text-xs opacity-80">Design a perfect learning experience</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center">✕</button>
                    </div>
                    {/* Progress */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i <= step ? 'bg-white shadow-lg shadow-white/30' : 'bg-white/20'}`} />
                        ))}
                    </div>
                    <p className="text-xs font-bold text-indigo-100 mt-2">Step {step} of 3 • {['Choose Method', 'Details', 'Review'][step - 1]}</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">How would you like to create this assignment?</h3>
                                <div className="space-y-3">
                                    {[
                                        { id: 'ai', label: 'AI Generated', desc: 'Elora creates personalized questions based on your topic', emoji: '✨', badge: 'RECOMMENDED' },
                                        { id: 'upload', label: 'Upload Worksheet', desc: 'Upload a PDF or DOCX file with questions', emoji: '📄' },
                                        { id: 'manual', label: 'Manual Entry', desc: 'Type questions directly into the system', emoji: '✍️' },
                                        { id: 'quiz', label: 'Quick Quiz', desc: 'Create a timed quiz with auto-grading', emoji: '⚡', badge: 'POPULAR' }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMethod(m.id)}
                                            className={`w-full p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${method === m.id
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {m.badge && (
                                                <span className="absolute top-4 right-4 px-2 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                                                    {m.badge}
                                                </span>
                                            )}
                                            <div className="flex items-start gap-4">
                                                <span className="text-4xl">{m.emoji}</span>
                                                <div className="flex-1">
                                                    <p className="font-black text-lg text-slate-900 dark:text-white mb-1">{m.label}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{m.desc}</p>
                                                </div>
                                                {method === m.id && <span className="text-indigo-600 text-2xl">✓</span>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Assignment Details</h3>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Title</label>
                                    <input
                                        autoFocus
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Quadratic Equations Practice"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="What should students know before starting? Any special instructions?"
                                        className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Due Time</label>
                                        <input
                                            type="time"
                                            value={formData.dueTime}
                                            onChange={e => setFormData({ ...formData, dueTime: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Points</label>
                                        <input
                                            type="number"
                                            value={formData.points}
                                            onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                            min="0"
                                            max="1000"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all w-full">
                                            <input
                                                type="checkbox"
                                                checked={formData.allowLateSubmission}
                                                onChange={e => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                                                className="w-5 h-5 rounded accent-indigo-600"
                                            />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Allow late submissions</span>
                                        </label>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Review & Publish</h3>
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Title</p>
                                                <p className="font-bold text-slate-900 dark:text-white">{formData.title || 'Untitled'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Method</p>
                                                <p className="font-bold text-slate-900 dark:text-white capitalize">{method}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Due</p>
                                                <p className="font-bold text-slate-900 dark:text-white">{formData.dueDate} at {formData.dueTime}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Points</p>
                                                <p className="font-bold text-slate-900 dark:text-white">{formData.points}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {formData.description && (
                                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{formData.description}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={handleBack}
                            className="px-6 py-4 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                        >
                            ← Back
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-4 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={step === 3 ? handleSave : handleNext}
                        disabled={step === 2 && !formData.title}
                        className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-sm font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {step === 3 ? '🚀 Publish Assignment' : 'Next Step →'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
