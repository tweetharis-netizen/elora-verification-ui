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
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex max-h-[90vh]"
            >
                {/* Left: Submission Content */}
                <div className="flex-1 p-8 overflow-y-auto border-r border-slate-200 dark:border-slate-800">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center font-black text-indigo-600">
                                {submission.studentName?.[0] || 'S'}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">{submission.studentName || 'Student'}</h3>
                                <p className="text-xs text-slate-400 font-medium">Submitted {new Date(submission.submittedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">Assignment</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{assignment?.title || 'Untitled'}</p>
                        </div>
                    </div>

                    {/* Response */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Student Response</label>
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {submission.text || 'No text response provided.'}
                            </div>
                        </div>

                        {submission.file && (
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Attached File</label>
                                <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                                    <span className="text-2xl">📎</span>
                                    <div>
                                        <p className="font-bold text-sm">{submission.file.name}</p>
                                        <p className="text-xs text-slate-400">{submission.file.size}</p>
                                    </div>
                                    <button className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">
                                        View File
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Grading Panel */}
                <div className="w-96 p-8 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white">Grade Submission</h4>
                        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center">
                            ✕
                        </button>
                    </div>

                    {/* Score Slider */}
                    <div className="mb-8">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Score</label>
                        <div className="text-center mb-4">
                            <span className="text-6xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{score}</span>
                            <span className="text-2xl font-black text-slate-400">/100</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setScore(parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                        </div>
                    </div>

                    {/* AI Suggestion */}
                    <div className="mb-6">
                        <button
                            onClick={handleGenerateAISuggestion}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            ✨ AI Feedback Suggestion
                        </button>
                        {aiSuggestion && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-4 bg-purple-50 dark:bg-purple-500/10 rounded-2xl border border-purple-200 dark:border-purple-500/20"
                            >
                                <p className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">AI Suggests:</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{aiSuggestion}</p>
                                <button
                                    onClick={() => setFeedback(aiSuggestion)}
                                    className="mt-2 text-xs font-bold text-purple-600 hover:underline"
                                >
                                    Use this →
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Feedback */}
                    <div className="mb-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Your Feedback</label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Provide constructive feedback..."
                            className="w-full h-40 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Quick Comments */}
                    <div className="mb-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Quick Comments</p>
                        <div className="flex flex-wrap gap-2">
                            {['Great work!', 'Needs improvement', 'Good effort', 'Excellent detail'].map(comment => (
                                <button
                                    key={comment}
                                    onClick={() => setFeedback(feedback ? `${feedback} ${comment}` : comment)}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all"
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
                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Save Grade
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
