// components/assignments/AssignmentWizard.js
// Multi-step wizard for creating assignments with AI assistance

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RubricBuilder from '../RubricBuilder';
import { generateRubric } from '../../lib/firestore/assignments';
import { findStandards } from '../../lib/curriculum/standards';

export default function AssignmentWizard({ onSave, onCancel, classes = [] }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        classId: classes[0]?.id || '',
        title: '',
        description: '',
        dueDate: '',
        points: 100,
        topic: '',
        type: 'assignment', // assignment, quiz, project
        rubric: null,
        attachments: [],
        curriculumStandards: [],
        settings: {
            allowLateSubmissions: true,
            latePenalty: 10,
            enablePeerReview: false,
            checkPlagiarism: true,
            allowResubmission: false,
        },
    });

    const [generating, setGenerating] = useState(false);

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const updateSetting = (setting, value) => {
        setFormData({
            ...formData,
            settings: { ...formData.settings, [setting]: value },
        });
    };

    const handleGenerateRubric = async () => {
        setGenerating(true);
        try {
            const rubric = await generateRubric(formData.title, formData.description, formData.points);
            updateField('rubric', rubric);
        } catch (error) {
            console.error('Failed to generate rubric:', error);
        }
        setGenerating(false);
    };

    const handleFindStandards = () => {
        const selectedClass = classes.find(c => c.id === formData.classId);
        if (!selectedClass) return;

        const keywords = [formData.topic, ...formData.description.split(' ').filter(w => w.length > 4)];
        const standards = findStandards({
            curriculum: 'US_CommonCore_Math',
            level: selectedClass.level || 'K',
            keywords,
        });

        updateField('curriculumStandards', standards.map(s => s.id));
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    const totalSteps = 4;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] font-semibold text-neutral-700 dark:text-neutral-300">
                        Step {step} of {totalSteps}
                    </span>
                    <span className="text-[14px] font-normal text-neutral-500 dark:text-neutral-400">
                        {Math.round((step / totalSteps) * 100)}% Complete
                    </span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded overflow-hidden">
                    <motion.div
                        className="h-full bg-neutral-900 dark:bg-neutral-100"
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / totalSteps) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Step Labels */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                    {['Basic Info', 'Details', 'Rubric', 'Settings'].map((label, idx) => (
                        <div
                            key={label}
                            className={`text-center text-[12px] font-semibold ${idx + 1 === step
                                ? 'text-neutral-900 dark:text-neutral-100'
                                : idx + 1 < step
                                    ? 'text-neutral-700 dark:text-neutral-300'
                                    : 'text-neutral-500 dark:text-neutral-400'
                                }`}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <h2 className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-100">Basic Information</h2>

                        {classes.length > 0 && (
                            <div>
                                <label className="label">Select Class *</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {classes.map((cls) => (
                                        <button
                                            key={cls.id}
                                            onClick={() => updateField('classId', cls.id)}
                                            className={`p-4 rounded border-2 text-left transition-opacity ${formData.classId === cls.id
                                                ? 'border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800'
                                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
                                                }`}
                                        >
                                            <div className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{cls.name}</div>
                                            <div className="text-[12px] font-normal text-neutral-600 dark:text-neutral-400 truncate">{cls.subject} • {cls.level}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="label">Assignment Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                className="input text-[14px]"
                                placeholder="e.g., Fractions Practice Worksheet"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Type</label>
                            <div className="grid grid-cols-3 gap-4">
                                {['assignment', 'quiz', 'project'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => updateField('type', type)}
                                        className={`p-4 rounded border-2 transition-opacity ${formData.type === type
                                            ? 'border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800'
                                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-[20px] mb-2">
                                                {type === 'assignment' && '📝'}
                                                {type === 'quiz' && '📊'}
                                                {type === 'project' && '🎨'}
                                            </div>
                                            <div className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100 capitalize">{type}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Due Date *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.dueDate}
                                    onChange={(e) => updateField('dueDate', e.target.value)}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Total Points *</label>
                                <input
                                    type="number"
                                    value={formData.points}
                                    onChange={(e) => updateField('points', Number(e.target.value))}
                                    className="input"
                                    min="1"
                                    required
                                />
                            </div>
                        </div>
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
                        <h2 className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-100">Assignment Details</h2>

                        <div>
                            <label className="label">Topic/Subject Area</label>
                            <input
                                type="text"
                                value={formData.topic}
                                onChange={(e) => updateField('topic', e.target.value)}
                                className="input"
                                placeholder="e.g., Fractions, Addition, Algebra"
                            />
                        </div>

                        <div>
                            <label className="label">Instructions *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                className="input"
                                placeholder="Provide clear instructions for students..."
                                rows={6}
                                required
                            />
                            <p className="text-[12px] font-normal text-neutral-500 dark:text-neutral-400 mt-2">
                                Be specific about what students should do and how they&apos;ll be evaluated
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="label mb-0">Curriculum Standards</label>
                                <button
                                    onClick={handleFindStandards}
                                    className="btn btn-sm btn-outline"
                                    disabled={!formData.topic}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Auto-Find
                                </button>
                            </div>
                            <div className="text-[14px] font-normal text-neutral-700 dark:text-neutral-300">
                                {formData.curriculumStandards.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.curriculumStandards.map(std => (
                                            <span key={std} className="px-2 py-2 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300">
                                                {std}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-neutral-500 dark:text-neutral-400 italic">No standards selected</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-100">Grading Rubric</h2>
                            {!formData.rubric && (
                                <button
                                    onClick={handleGenerateRubric}
                                    disabled={generating || !formData.title}
                                    className="btn btn-outline"
                                >
                                    {generating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            AI Generate
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {formData.rubric ? (
                            <RubricBuilder
                                initialRubric={formData.rubric}
                                onSave={(rubric) => updateField('rubric', rubric)}
                                onCancel={() => updateField('rubric', null)}
                            />
                        ) : (
                            <div className="card p-6 text-center">
                                <div className="w-6 h-6 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24 " stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <h3 className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100 mb-2">No Rubric Yet</h3>
                                <p className="text-[14px] font-normal text-neutral-600 dark:text-neutral-400 mb-6">
                                    Create a rubric to provide clear grading criteria, or use AI to generate one based on your assignment.
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => updateField('rubric', { criteria: [] })}
                                        className="btn btn-primary"
                                    >
                                        Create Manually
                                    </button>
                                    <button
                                        onClick={handleGenerateRubric}
                                        disabled={generating || !formData.title}
                                        className="btn btn-outline"
                                    >
                                        Generate with AI
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <h2 className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-100">Assignment Settings</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-neutral-800 rounded">
                                <div>
                                    <div className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">Allow Late Submissions</div>
                                    <p className="text-[12px] font-normal text-neutral-600 dark:text-neutral-400">Students can submit after the due date</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.allowLateSubmissions}
                                        onChange={(e) => updateSetting('allowLateSubmissions', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="flex h-4 w-6 items-center justify-start rounded bg-neutral-300 dark:bg-neutral-700 transition-colors peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-100 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-900 dark:peer-focus-visible:outline-neutral-100">
                                        <div className="h-2 w-2 rounded bg-white dark:bg-neutral-900 transition-transform peer-checked:translate-x-2"></div>
                                    </div>
                                </label>
                            </div>

                            {formData.settings.allowLateSubmissions && (
                                <div className="ml-4 pl-4 border-l-2 border-neutral-300 dark:border-neutral-700">
                                    <label className="label">Late Penalty (%)</label>
                                    <input
                                        type="number"
                                        value={formData.settings.latePenalty}
                                        onChange={(e) => updateSetting('latePenalty', Number(e.target.value))}
                                        className="input w-32"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-neutral-800 rounded">
                                <div>
                                    <div className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">Check for Plagiarism</div>
                                    <p className="text-[12px] font-normal text-neutral-600 dark:text-neutral-400">Automatically check submissions for similarity</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.checkPlagiarism}
                                        onChange={(e) => updateSetting('checkPlagiarism', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="flex h-4 w-6 items-center justify-start rounded bg-neutral-300 dark:bg-neutral-700 transition-colors peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-100 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-900 dark:peer-focus-visible:outline-neutral-100">
                                        <div className="h-2 w-2 rounded bg-white dark:bg-neutral-900 transition-transform peer-checked:translate-x-2"></div>
                                    </div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-neutral-800 rounded">
                                <div>
                                    <div className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">Enable Peer Review</div>
                                    <p className="text-[12px] font-normal text-neutral-600 dark:text-neutral-400">Students review each other&apos;s work</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.enablePeerReview}
                                        onChange={(e) => updateSetting('enablePeerReview', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="flex h-4 w-6 items-center justify-start rounded bg-neutral-300 dark:bg-neutral-700 transition-colors peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-100 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-900 dark:peer-focus-visible:outline-neutral-100">
                                        <div className="h-2 w-2 rounded bg-white dark:bg-neutral-900 transition-transform peer-checked:translate-x-2"></div>
                                    </div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-neutral-100 dark:bg-neutral-800 rounded">
                                <div>
                                    <div className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">Allow Resubmission</div>
                                    <p className="text-[12px] font-normal text-neutral-600 dark:text-neutral-400">Students can submit multiple times</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.allowResubmission}
                                        onChange={(e) => updateSetting('allowResubmission', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="flex h-4 w-6 items-center justify-start rounded bg-neutral-300 dark:bg-neutral-700 transition-colors peer-checked:bg-neutral-900 dark:peer-checked:bg-neutral-100 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-900 dark:peer-focus-visible:outline-neutral-100">
                                        <div className="h-2 w-2 rounded bg-white dark:bg-neutral-900 transition-transform peer-checked:translate-x-2"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <button
                    onClick={onCancel}
                    className="btn btn-ghost"
                >
                    Cancel
                </button>

                <div className="flex gap-4">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="btn btn-outline"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                    )}

                    {step < totalSteps ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!formData.title || !formData.description || !formData.dueDate}
                            className="btn btn-primary"
                        >
                            Next
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!formData.title || !formData.description || !formData.dueDate}
                            className="btn btn-primary"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Create Assignment
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
