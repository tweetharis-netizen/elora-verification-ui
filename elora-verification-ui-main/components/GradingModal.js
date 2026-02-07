// Grading Interface for Teachers
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function GradingModal({ submission, assignment, isOpen, onClose, onSaveGrade }) {
    const [score, setScore] = useState(submission?.score || 0);
    const [feedback, setFeedback] = useState(submission?.feedback || '');
    const [aiSuggestion, setAiSuggestion] = useState('');

    if (!isOpen || !submission) return null;

    const handleGenerateAISuggestion = () => {
        // Mock AI suggestion
        setAiSuggestion(`Strong understanding of ${assignment?.title || 'the topic'}. Consider adding more specific examples in future work.`);
    };

    const handleSave = () => {
        onSaveGrade({
            submissionId: submission.id,
            score,
            feedback,
            gradedAt: new Date().toISOString()
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white dark:bg-neutral-900 w-full max-w-5xl rounded border border-neutral-200 dark:border-neutral-800 flex max-h-[90vh] overflow-hidden"
            >
                {/* Left Panel - Student Work */}
                <div className="w-2/3 bg-neutral-100 dark:bg-neutral-900/50 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                <span className="text-[14px] font-semibold text-neutral-700 dark:text-neutral-300">
                                    {submission.studentName.charAt(0)}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-[16px] font-semibold text-neutral-900 dark:text-white">{submission.studentName}</h3>
                                <p className="text-[12px] font-normal text-neutral-500">Submitted {new Date(submission.submittedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                            <button className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Response */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-normal text-neutral-500 mb-2 block">Student Response</label>
                            <div className="bg-neutral-100 dark:bg-neutral-800 rounded p-6 text-sm text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                {submission.text || 'No text response provided.'}
                            </div>
                        </div>

                        {submission.file && (
                            <div>
                                <label className="text-xs font-normal text-neutral-500 mb-2 block">Attached File</label>
                                <div className="flex items-center gap-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                                    <span className="text-[20px]">📎</span>
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{submission.file.name}</p>
                                        <p className="text-xs font-normal text-neutral-500">{submission.file.size}</p>
                                    </div>
                                    <button className="ml-auto elora-btn elora-btn-primary text-xs">
                                        View File
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Grading Panel */}
                <div className="w-96 p-6 bg-neutral-100 dark:bg-neutral-900/50 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-base font-semibold text-neutral-900 dark:text-white">Grade Submission</h4>
                        <button onClick={onClose} className="w-10 h-10 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center">
                            ✕
                        </button>
                    </div>

                    {/* Score Slider */}
                    <div className="mb-6">
                        <label className="text-xs font-normal text-neutral-500 mb-4 block">Score</label>
                        <div className="text-center mb-4">
                            <span className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-100">{score}</span>
                            <span className="text-[14px] font-semibold text-neutral-500">/100</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setScore(parseInt(e.target.value))}
                            className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded appearance-none cursor-pointer accent-neutral-900"
                        />
                        <div className="flex justify-between text-xs font-normal text-neutral-500 mt-2">
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                        </div>
                    </div>

                    {/* AI Suggestion */}
                    <div className="mb-6">
                        <button
                            onClick={handleGenerateAISuggestion}
                            className="w-full elora-btn elora-btn-primary"
                        >
                            ✨ AI Feedback Suggestion
                        </button>
                        {aiSuggestion && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
                            >
                                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">AI Suggests:</p>
                                <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">{aiSuggestion}</p>
                                <button
                                    onClick={() => setFeedback(aiSuggestion)}
                                    className="mt-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:underline"
                                >
                                    Use this →
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Feedback */}
                    <div className="mb-6">
                        <label className="text-xs font-normal text-neutral-500 mb-2 block">Your Feedback</label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Provide constructive feedback..."
                            className="elora-input w-full h-40 resize-none"
                        />
                    </div>

                    {/* Quick Comments */}
                    <div className="mb-6">
                        <p className="text-xs font-normal text-neutral-500 mb-2">Quick Comments</p>
                        <div className="flex flex-wrap gap-2">
                            {['Great work!', 'Needs improvement', 'Good effort', 'Excellent detail'].map(comment => (
                                <button
                                    key={comment}
                                    onClick={() => setFeedback(feedback ? `${feedback} ${comment}` : comment)}
                                    className="px-2 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                                >
                                    {comment}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={handleSave}
                            disabled={!feedback.trim()}
                            className="w-full elora-btn elora-btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Grade
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded text-sm font-semibold text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
