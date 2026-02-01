// components/assignments/GradingInterface.js
// Streamlined interface for grading submissions with rubrics

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function GradingInterface({
    submission,
    assignment,
    onGrade,
    onNext,
    onPrevious,
    currentIndex,
    totalSubmissions
}) {
    const [grade, setGrade] = useState(submission.grade || null);
    const [feedback, setFeedback] = useState(submission.feedback || '');
    const [rubricScores, setRubricScores] = useState(submission.rubricScores || {});
    const [quickComments, setQuickComments] = useState([
        'Excellent work!',
        'Good effort, but needs improvement in...',
        'Please see me about this assignment',
        'Great attention to detail',
        'Remember to show your work',
        'Check your calculations',
    ]);

    const calculateRubricGrade = () => {
        if (!assignment.rubric?.criteria) return null;

        let totalScore = 0;
        let totalWeight = 0;

        assignment.rubric.criteria.forEach(criterion => {
            const score = rubricScores[criterion.id];
            if (score !== undefined) {
                totalScore += score * (criterion.weight / 100);
                totalWeight += criterion.weight;
            }
        });

        if (totalWeight > 0) {
            return Math.round((totalScore / totalWeight) * assignment.points);
        }
        return null;
    };

    const handleRubricScore = (criterionId, levelIndex, points) => {
        setRubricScores({ ...rubricScores, [criterionId]: points });

        // Auto-calculate grade
        const calculated = calculateRubricGrade();
        if (calculated !== null) {
            setGrade(calculated);
        }
    };

    const handleSubmitGrade = () => {
        onGrade({
            grade: Number(grade),
            feedback,
            rubricScores,
        });
    };

    const addQuickComment = (comment) => {
        setFeedback(feedback ? `${feedback}\n\n${comment}` : comment);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Panel - Submission */}
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Student Info */}
                <div className="card p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-text-primary text-lg">{submission.studentName}</h3>
                            <p className="text-sm text-text-secondary">
                                Submitted {format(new Date(submission.submittedAt), 'MMM dd, yyyy h:mm a')}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-text-tertiary">Submission</div>
                            <div className="text-xl font-bold text-text-primary">
                                {currentIndex + 1} / {totalSubmissions}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assignment Info */}
                <div className="card p-4">
                    <h4 className="font-semibold text-text-primary mb-2">{assignment.title}</h4>
                    <p className="text-sm text-text-secondary">{assignment.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary">
                        <span>Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
                        <span>•</span>
                        <span>{assignment.points} points</span>
                    </div>
                </div>

                {/* Submission Content */}
                <div className="card p-6">
                    <h4 className="font-semibold text-text-primary mb-4">Student Response</h4>
                    <div className="prose dark:prose-invert max-w-none">
                        <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 whitespace-pre-wrap">
                            {submission.content || <span className="text-text-tertiary italic">No text submitted</span>}
                        </div>
                    </div>

                    {submission.attachments && submission.attachments.length > 0 && (
                        <div className="mt-4">
                            <h5 className="font-medium text-text-secondary text-sm mb-2">Attachments</h5>
                            <div className="space-y-2">
                                {submission.attachments.map((attachment, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded">
                                        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <span className="text-sm text-text-primary">{attachment.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {submission.plagiarismScore && (
                        <div className={`mt-4 p-3 rounded-lg ${submission.plagiarismScore.flagged
                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
                                : 'bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-300 dark:border-secondary-700'
                            }`}>
                            <div className="flex items-center gap-2 font-medium text-sm">
                                {submission.plagiarismScore.flagged ? (
                                    <>
                                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span className="text-red-900 dark:text-red-100">
                                            Plagiarism Alert: {submission.plagiarismScore.score}% similarity
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-secondary-900 dark:text-secondary-100">
                                            Original work: {submission.plagiarismScore.score}% similarity
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Grading */}
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Rubric Grading */}
                {assignment.rubric && (
                    <div className="card p-6">
                        <h4 className="font-semibold text-text-primary mb-4">Rubric</h4>
                        <div className="space-y-4">
                            {assignment.rubric.criteria.map((criterion) => (
                                <div key={criterion.id} className="border border-border-primary rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h5 className="font-medium text-text-primary">{criterion.name}</h5>
                                            <p className="text-xs text-text-secondary mt-1">{criterion.description}</p>
                                        </div>
                                        <span className="text-xs font-medium text-text-tertiary">{criterion.weight}%</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {criterion.levels.map((level, levelIdx) => {
                                            const isSelected = rubricScores[criterion.id] === level.points;
                                            return (
                                                <button
                                                    key={levelIdx}
                                                    onClick={() => handleRubricScore(criterion.id, levelIdx, level.points)}
                                                    className={`p-3 rounded-lg border-2 text-left transition-all ${isSelected
                                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                            : 'border-border-primary hover:border-primary-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-sm text-text-primary">{level.name}</span>
                                                        <span className="text-sm font-bold text-primary-600">{level.points}pts</span>
                                                    </div>
                                                    <p className="text-xs text-text-secondary line-clamp-2">{level.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Manual Grade Input */}
                <div className="card p-6">
                    <label className="label">Grade (out of {assignment.points})</label>
                    <input
                        type="number"
                        value={grade ?? ''}
                        onChange={(e) => setGrade(e.target.value)}
                        min="0"
                        max={assignment.points}
                        className="input text-2xl font-bold text-center"
                        placeholder="0"
                    />
                    {assignment.rubric && (
                        <button
                            onClick={() => setGrade(calculateRubricGrade())}
                            className="btn btn-sm btn-outline mt-2 w-full"
                        >
                            Calculate from Rubric
                        </button>
                    )}
                </div>

                {/* Feedback */}
                <div className="card p-6">
                    <label className="label">Feedback</label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="input min-h-[120px]"
                        placeholder="Provide constructive feedback..."
                        rows={5}
                    />

                    {/* Quick Comments */}
                    <div className="mt-3">
                        <p className="text-xs text-text-tertiary mb-2">Quick comments:</p>
                        <div className="flex flex-wrap gap-2">
                            {quickComments.map((comment, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => addQuickComment(comment)}
                                    className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded hover:bg-primary-100 dark:hover:bg-primary-900/20 text-text-secondary hover:text-primary-600 transition-colors"
                                >
                                    {comment}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-border-primary p-4 -m-4 mt-6">
                    <div className="flex gap-3">
                        <button
                            onClick={onPrevious}
                            disabled={currentIndex === 0}
                            className="btn btn-outline"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>

                        <button
                            onClick={handleSubmitGrade}
                            disabled={grade === null || grade === ''}
                            className="btn btn-primary flex-1"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save & Next
                        </button>

                        <button
                            onClick={onNext}
                            disabled={currentIndex >= totalSubmissions - 1}
                            className="btn btn-outline"
                        >
                            Next
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-3 text-center">
                        <button className="text-sm text-text-tertiary hover:text-text-secondary transition-colors">
                            Skip this submission
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
