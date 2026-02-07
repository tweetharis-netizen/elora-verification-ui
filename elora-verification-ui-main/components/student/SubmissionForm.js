// components/student/SubmissionForm.js
// Student assignment submission interface with draft auto-save

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { saveSubmissionDraft, submitAssignment } from '../../lib/firestore/submissions';
import { useNotifications } from '../../lib/contexts/NotificationContext';

export default function SubmissionForm({ assignment, existingSubmission, studentId, onSubmit }) {
    const [content, setContent] = useState(existingSubmission?.content || '');
    const [attachments, setAttachments] = useState(existingSubmission?.attachments || []);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState(existingSubmission?.lastSaved || null);
    const notify = useNotifications();

    // Auto-save draft every 30 seconds
    useEffect(() => {
        if (!content && attachments.length === 0) return;

        const timer = setTimeout(async () => {
            await handleSaveDraft(true); // Silent save
        }, 30000);

        return () => clearTimeout(timer);
    }, [content, attachments]);

    const handleSaveDraft = async (silent = false) => {
        if (!content && attachments.length === 0) return;

        setSaving(true);
        try {
            await saveSubmissionDraft({
                assignmentId: assignment.id,
                studentId,
                content,
                attachments,
            });
            setLastSaved(new Date());
            if (!silent) {
                notify.success('Draft saved');
            }
        } catch (error) {
            console.error('Failed to save draft:', error);
            if (!silent) {
                notify.error('Failed to save draft');
            }
        }
        setSaving(false);
    };

    const handleSubmit = async () => {
        if (!content && attachments.length === 0) {
            notify.error('Please add content or attachments before submitting');
            return;
        }

        setSubmitting(true);
        try {
            await submitAssignment({
                assignmentId: assignment.id,
                studentId,
                content,
                attachments,
            });
            notify.success('Assignment submitted successfully! 🎉');
            if (onSubmit) onSubmit();
        } catch (error) {
            console.error('Failed to submit:', error);
            notify.error('Failed to submit assignment');
        }
        setSubmitting(false);
    };

    const isPastDue = new Date() > new Date(assignment.dueDate);
    const canSubmit = !existingSubmission?.submittedAt;

    return (
        <div className="space-y-6">
            {/* Assignment Header */}
            <div className="card p-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
                <h2 className="text-2xl font-bold text-text-primary mb-2">{assignment.title}</h2>
                <p className="text-text-secondary mb-4">{assignment.description}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className={isPastDue ? 'text-error font-semibold' : 'text-text-secondary'}>
                            Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy h:mm a')}
                            {isPastDue && ' (Past Due)'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <span className="text-text-secondary">{assignment.points} points</span>
                    </div>
                </div>
            </div>

            {/* Status */}
            {existingSubmission?.submittedAt ? (
                <div className="card p-6 bg-secondary-50 dark:bg-secondary-900/20 border-2 border-secondary-300 dark:border-secondary-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-secondary-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-secondary-900 dark:text-secondary-100">Submitted!</h3>
                            <p className="text-sm text-secondary-700 dark:text-secondary-300">
                                {format(new Date(existingSubmission.submittedAt), 'MMM dd, yyyy h:mm a')}
                            </p>
                        </div>
                        {existingSubmission.grade !== null && (
                            <div className="text-right">
                                <div className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
                                    {existingSubmission.grade}
                                </div>
                                <div className="text-sm text-secondary-700 dark:text-secondary-300">
                                    / {assignment.points}
                                </div>
                            </div>
                        )}
                    </div>

                    {existingSubmission.feedback && (
                        <div className="mt-4 p-4 bg-white dark:bg-neutral-800 rounded-lg">
                            <h4 className="font-semibold text-text-primary text-sm mb-2">Teacher Feedback</h4>
                            <p className="text-text-secondary whitespace-pre-wrap">{existingSubmission.feedback}</p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Submission Form */}
                    <div className="card p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <label className="label">Your Response</label>
                            {lastSaved && (
                                <span className="text-xs text-text-tertiary">
                                    {saving ? 'Saving...' : `Last saved ${format(lastSaved, 'h:mm a')}`}
                                </span>
                            )}
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="input min-h-[300px] font-mono text-sm"
                            placeholder="Type your response here..."
                            rows={12}
                            disabled={!canSubmit}
                        />
                        <p className="text-xs text-text-tertiary mt-2">
                            Your work is automatically saved every 30 seconds
                        </p>
                    </div>

                    {/* Attachments */}
                    <div className="card p-6">
                        <label className="label mb-3">Attachments (Optional)</label>
                        <div className="border-2 border-dashed border-border-primary rounded-xl p-8 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer">
                            <svg className="w-12 h-12 text-neutral-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-text-secondary mb-1">Click to upload or drag and drop</p>
                            <p className="text-xs text-text-tertiary">PDF, DOC, Images (Max 10MB)</p>
                        </div>

                        {attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="flex-1 text-sm text-text-primary">{file.name}</span>
                                        <button className="text-error hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-border-primary p-4 -mx-6 -mb-6">
                        <button
                            onClick={() => handleSaveDraft()}
                            disabled={saving || !canSubmit}
                            className="btn btn-outline flex-1"
                        >
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !canSubmit || (!content && attachments.length === 0)}
                            className="btn btn-primary flex-1"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Submit Assignment
                                </>
                            )}
                        </button>
                    </div>

                    {isPastDue && assignment.settings?.allowLateSubmissions && (
                        <div className="text-center text-sm text-warning">
                            ⚠️ This assignment is past due. A {assignment.settings.latePenalty}% penalty may apply.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
