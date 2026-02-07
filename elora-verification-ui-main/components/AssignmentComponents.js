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
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Create Assignment</h2>
                                <p className="text-xs font-normal text-neutral-500 dark:text-neutral-400 mt-2">Provide details and publish</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-300 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100" aria-label="Close" type="button">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {/* Progress */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex-1 h-[2px] rounded ${i <= step ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                        ))}
                    </div>
                    <p className="text-xs font-normal text-neutral-500 dark:text-neutral-400 mt-2">Step {step} of 3 • {['Choose Method', 'Details', 'Review'][step - 1]}</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Creation method</h3>
                                <div className="space-y-4">
                                    {[
                                        { id: 'ai', label: 'AI Generated', desc: 'Elora creates personalized questions based on your topic' },
                                        { id: 'upload', label: 'Upload Worksheet', desc: 'Upload a PDF or DOCX file with questions' },
                                        { id: 'manual', label: 'Manual Entry', desc: 'Type questions directly into the system' },
                                        { id: 'quiz', label: 'Quick Quiz', desc: 'Create a timed quiz with auto-grading' }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMethod(m.id)}
                                            className={`w-full p-4 rounded border text-left ${method === m.id
                                                    ? 'border-neutral-400 bg-neutral-100 dark:bg-neutral-800'
                                                    : 'border-neutral-200 dark:border-neutral-700'
                                                }`}
                                            type="button"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <p className="text-base font-semibold text-neutral-900 dark:text-white mb-2">{m.label}</p>
                                                    <p className="text-sm font-normal text-neutral-500 dark:text-neutral-400">{m.desc}</p>
                                                </div>
                                                {method === m.id && (
                                                    <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Assignment details</h3>

                                <div>
                                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Title</label>
                                    <input
                                        autoFocus
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Quadratic Equations Practice"
                                        className="elora-input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="What should students know before starting? Any special instructions?"
                                        className="elora-input w-full h-32 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="elora-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Due Time</label>
                                        <input
                                            type="time"
                                            value={formData.dueTime}
                                            onChange={e => setFormData({ ...formData, dueTime: e.target.value })}
                                            className="elora-input w-full"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Points</label>
                                        <input
                                            type="number"
                                            value={formData.points}
                                            onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                            min="0"
                                            max="1000"
                                            className="elora-input w-full"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer p-4 rounded w-full">
                                            <input
                                                type="checkbox"
                                                checked={formData.allowLateSubmission}
                                                onChange={e => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                                                className="w-4 h-4 rounded accent-neutral-900"
                                            />
                                            <span className="text-sm font-normal text-neutral-700 dark:text-neutral-300">Allow late submissions</span>
                                        </label>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Review & Publish</h3>
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-neutral-900 p-4 rounded border border-neutral-200 dark:border-neutral-800">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs font-normal text-neutral-500 mb-2">Title</p>
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{formData.title || 'Untitled'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-normal text-neutral-500 mb-2">Method</p>
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white capitalize">{method}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-normal text-neutral-500 mb-2">Due</p>
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{formData.dueDate} at {formData.dueTime}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-normal text-neutral-500 mb-2">Points</p>
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{formData.points}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {formData.description && (
                                        <div className="bg-white dark:bg-neutral-900 p-4 rounded border border-neutral-200 dark:border-neutral-800">
                                            <p className="text-xs font-normal text-neutral-500 mb-2">Description</p>
                                            <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">{formData.description}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex gap-4">
                    {step > 1 && (
                        <button
                            onClick={handleBack}
                            className="px-4 py-2 rounded text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                            type="button"
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={step === 3 ? handleSave : handleNext}
                        disabled={step === 2 && !formData.title}
                        className="flex-1 elora-btn elora-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                    >
                        {step === 3 ? 'Publish Assignment' : 'Next Step'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
