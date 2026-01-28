// Assignment Submission Modal Component
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SubmissionModal({ assignment, isOpen, onClose, onSubmit }) {
    const [submissionText, setSubmissionText] = useState('');
    const [attachedFile, setAttachedFile] = useState(null);

    if (!isOpen || !assignment) return null;

    const handleSubmit = () => {
        onSubmit({
            assignmentId: assignment.id,
            text: submissionText,
            file: attachedFile,
            submittedAt: new Date().toISOString()
        });
        setSubmissionText('');
        setAttachedFile(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-8 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                                📝
                            </div>
                            <div>
                                <h3 className="text-2xl font-black">Submit Assignment</h3>
                                <p className="text-indigo-100 text-xs font-medium opacity-80 mt-1">{assignment.title}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center">
                            ✕
                        </button>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-xs">
                        <span className="font-bold">Due:</span> {assignment.dueDate} • <span className="font-bold">Class:</span> {assignment.classCode}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Instructions */}
                    {assignment.description && (
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Instructions</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{assignment.description}</p>
                        </div>
                    )}

                    {/* Text Response */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                            Your Response
                        </label>
                        <textarea
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            placeholder="Type your answer here..."
                            className="w-full h-48 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none transition-all resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-2">{submissionText.length} characters</p>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                            Attach File (Optional)
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                onChange={(e) => setAttachedFile(e.target.files?.[0])}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="block w-full p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all"
                            >
                                {attachedFile ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-2xl">📎</span>
                                        <div className="text-left">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{attachedFile.name}</p>
                                            <p className="text-xs text-slate-400">{(attachedFile.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setAttachedFile(null);
                                            }}
                                            className="ml-auto px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="text-4xl mb-3 block">📤</span>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Click to upload file</p>
                                        <p className="text-xs text-slate-400 mt-1">PDF, DOCX, or images up to 10MB</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Auto-save indicator */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Draft auto-saved</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-4 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!submissionText.trim()}
                        className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-sm font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Submit Assignment →
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
