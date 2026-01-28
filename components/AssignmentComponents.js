// Assignment Creation Wizard Component
// This component handles the 3-step assignment creation flow

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AssignmentWizard({ isOpen, onClose, onSave, classCode }) {
    const [step, setStep] = useState(1);
    const [method, setMethod] = useState('ai'); // 'ai', 'upload', 'manual'
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        classCode: classCode || '',
        questions: [],
        topic: ''
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
        // Reset
        setStep(1);
        setFormData({ title: '', description: '', dueDate: '', classCode: classCode || '', questions: [], topic: '' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create Assignment</h2>
                        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-400">✕</button>
                    </div>
                    {/* Progress */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex-1 h-2 rounded-full ${i <= step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-white/10'}`} />
                        ))}
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-2">Step {step} of 3</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Choose Creation Method</h3>
                                <div className="space-y-3">
                                    {[
                                        { id: 'ai', label: 'AI Generated', desc: 'Elora creates questions based on a topic', emoji: '✨' },
                                        { id: 'upload', label: 'Upload File', desc: 'Upload a PDF or DOCX worksheet', emoji: '📄' },
                                        { id: 'manual', label: 'Quick Quiz', desc: 'Type questions directly', emoji: '✍️' }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMethod(m.id)}
                                            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${method === m.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10 hover:border-indigo-300'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{m.emoji}</span>
                                                <div>
                                                    <div className="font-black text-slate-900 dark:text-white">{m.label}</div>
                                                    <div className="text-xs text-slate-500">{m.desc}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Assignment Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="e.g., Quadratic Equations Practice"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            rows={3}
                                            placeholder="What should students do?"
                                        />
                                    </div>
                                    {method === 'ai' && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Topic</label>
                                            <input
                                                type="text"
                                                value={formData.topic}
                                                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="e.g., Solving quadratic equations"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Review & Confirm</h3>
                                <div className="space-y-4 bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</div>
                                        <div className="text-slate-900 dark:text-white font-bold">{formData.title || 'Untitled Assignment'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</div>
                                        <div className="text-slate-700 dark:text-slate-300">{formData.description || 'No description'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</div>
                                        <div className="text-slate-900 dark:text-white font-bold">{formData.dueDate || 'No due date'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Method</div>
                                        <div className="text-slate-900 dark:text-white font-bold capitalize">{method}</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>
                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/30"
                        >
                            Create Assignment ✓
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// Multi-Class Support Component
export function ClassSwitcher({ classes, activeClass, onSwitch }) {
    if (!classes || classes.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {classes.map(cls => (
                <button
                    key={cls.code}
                    onClick={() => onSwitch(cls)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeClass?.code === cls.code
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-indigo-300'
                        }`}
                >
                    {cls.name || cls.subject}
                </button>
            ))}
        </div>
    );
}

// Assignment List Component
export function AssignmentList({ assignments, onSubmit }) {
    if (!assignments || assignments.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-slate-500 dark:text-slate-400">No assignments yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {assignments.map(assignment => (
                <div key={assignment.id} className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-indigo-300 transition-all">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h4 className="font-black text-slate-900 dark:text-white">{assignment.title}</h4>
                            <p className="text-sm text-slate-500 mt-1">{assignment.description}</p>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                            Due {assignment.dueDate}
                        </span>
                    </div>
                    <button
                        onClick={() => onSubmit(assignment)}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                    >
                        Submit Assignment →
                    </button>
                </div>
            ))}
        </div>
    );
}
