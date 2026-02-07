// Assignment Submission Modal Component
import { useState } from 'react';
import { motion } from 'framer-motion';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative bg-white dark:bg-neutral-900 w-full max-w-2xl rounded border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[85vh]"
            >
                <div className="p-6 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Submit Assignment</h2>
                        <p className="text-xs font-normal text-neutral-500 mt-2">Upload your work for review</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded text-neutral-600 flex items-center justify-center focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
                        type="button"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Instructions */}
                    {assignment.description && (
                            <div className="bg-white dark:bg-neutral-900 p-4 rounded border border-neutral-200 dark:border-neutral-800">
                            <p className="text-xs font-normal text-neutral-500 mb-2">Instructions</p>
                            <p className="text-sm font-normal text-neutral-700 dark:text-neutral-300">{assignment.description}</p>
                        </div>
                    )}

                    {/* Text Response */}
                    <div>
                        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Your Response</label>
                        <textarea
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            placeholder="Type your answer here..."
                            className="elora-input w-full h-40 resize-none"
                        />
                        <p className="text-xs font-normal text-neutral-500 mt-2">{submissionText.length} characters</p>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Attach File (Optional)</label>
                        <div className="relative">
                            <input
                                type="file"
                                onChange={(e) => setAttachedFile(e.target.files?.[0])}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="block w-full p-6 border border-dashed border-neutral-300 dark:border-neutral-700 rounded text-center cursor-pointer"
                            >
                                {attachedFile ? (
                                    <div className="flex items-center justify-center gap-4">
                                        <span className="sr-only">Attachment</span>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{attachedFile.name}</p>
                                            <p className="text-xs font-normal text-neutral-500">{(attachedFile.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setAttachedFile(null);
                                            }}
                                            className="ml-auto px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded text-xs font-normal text-neutral-700 dark:text-neutral-300"
                                            type="button"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Click to upload file</p>
                                        <p className="text-xs font-normal text-neutral-500 mt-2">PDF, DOCX, or images up to 10MB</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Auto-save indicator */}
                    <div className="flex items-center gap-2 text-xs font-normal text-neutral-500">
                        <div className="w-2 h-2 rounded bg-neutral-500" />
                        <span>Draft auto-saved</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex gap-4">
                    <button
                        onClick={onClose}
                        className="elora-btn elora-btn-secondary"
                        type="button"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!submissionText.trim()}
                        className="flex-1 elora-btn elora-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                    >
                        Submit Assignment
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
