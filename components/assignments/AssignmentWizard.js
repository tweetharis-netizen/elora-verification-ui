// components/assignments/AssignmentWizard.js
// Multi-step wizard for creating assignments with AI assistance

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RubricBuilder from '../RubricBuilder';
import { generateRubric } from '../../lib/firestore/assignments';
import { findStandards } from '../../lib/curriculum/standards';

export default function AssignmentWizard({ onSave, onCancel, classData }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
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
        if (!classData) return;

        const keywords = [formData.topic, ...formData.description.split(' ').filter(w => w.length > 4)];
        const standards = findStandards({
            curriculum: 'US_CommonCore_Math',
            level: classData.level || 'K',
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
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-secondary">
                        Step {step} of {totalSteps}
                    </span>
                    <span className="text-sm text-text-tertiary">
                        {Math.round((step / totalSteps) * 100)}% Complete
                    </span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
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
                            className={`text-center text-xs font-medium ${idx + 1 === step
                                    ? 'text-primary-600'
                                    : idx + 1 < step
                                        ? 'text-secondary-600'
                                        : 'text-text-tertiary'
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
                        <h2 className="text-2xl font-bold text-text-primary">Basic Information</h2>

                        <div>
                            <label className="label">Assignment Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                className="input text-lg"
                                placeholder="e.g., Fractions Practice Worksheet"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Type</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['assignment', 'quiz', 'project'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => updateField('type', type)}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.type === type
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-border-primary hover:border-primary-300'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-2">
                                                {type === 'assignment' && '📝'}
                                                {type === 'quiz' && '📊'}
                                                {type === 'project' && '🎨'}
                                            </div>
                                            <div className="font-medium text-text-primary capitalize">{type}</div>
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
                        <h2 className="text-2xl font-bold text-text-primary">Assignment Details</h2>

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
                                className="input min-h-[150px]"
                                placeholder="Provide clear instructions for students..."
                                rows={6}
                                required
                            />
                            <p className="text-xs text-text-tertiary mt-1">
                                Be specific about what students should do and how they'll be evaluated
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
                            <div className="text-sm text-text-secondary">
                                {formData.curriculumStandards.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.curriculumStandards.map(std => (
                                            <span key={std} className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 rounded text-primary-700 dark:text-primary-300">
                                                {std}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-text-tertiary italic">No standards selected</p>
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
                            <h2 className="text-2xl font-bold text-text-primary">Grading Rubric</h2>
                            {!formData.rubric && (
                                <button
                                    onClick={handleGenerateRubric}
                                    disabled={generating || !formData.title}
                                    className="btn btn-outline"
                                >
                                    {generating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            <div className="card p-12 text-center">
                                <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24 " stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-text-primary mb-2">No Rubric Yet</h3>
                                <p className="text-text-secondary mb-6">
                                    Create a rubric to provide clear grading criteria, or use AI to generate one based on your assignment.
                                </p>
                                <div className="flex gap-3 justify-center">
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
                        <h2 className="text-2xl font-bold text-text-primary">Assignment Settings</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                <div>
                                    <div className="font-medium text-text-primary">Allow Late Submissions</div>
                                    <p className="text-sm text-text-secondary">Students can submit after the due date</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.allowLateSubmissions}
                                        onChange={(e) => updateSetting('allowLateSubmissions', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                </label>
                            </div>

                            {formData.settings.allowLateSubmissions && (
                                <div className="ml-4 pl-4 border-l-2 border-primary-300">
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

                            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                <div>
                                    <div className="font-medium text-text-primary">Check for Plagiarism</div>
                                    <p className="text-sm text-text-secondary">Automatically check submissions for similarity</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.checkPlagiarism}
                                        onChange={(e) => updateSetting('checkPlagiarism', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                <div>
                                    <div className="font-medium text-text-primary">Enable Peer Review</div>
                                    <p className="text-sm text-text-secondary">Students review each other's work</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.enablePeerReview}
                                        onChange={(e) => updateSetting('enablePeerReview', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                <div>
                                    <div className="font-medium text-text-primary">Allow Resubmission</div>
                                    <p className="text-sm text-text-secondary">Students can submit multiple times</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.allowResubmission}
                                        onChange={(e) => updateSetting('allowResubmission', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border-primary">
                <button
                    onClick={onCancel}
                    className="btn btn-ghost text-text-secondary"
                >
                    Cancel
                </button>

                <div className="flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="btn btn-outline"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!formData.title || !formData.description || !formData.dueDate}
                            className="btn btn-primary"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
