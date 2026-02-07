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
                <div className="card p-4 bg-neutral-100 dark:bg-neutral-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100">{submission.studentName}</h3>
                            <p className="text-[14px] font-normal text-neutral-600 dark:text-neutral-400">
                                Submitted {format(new Date(submission.submittedAt), 'MMM dd, yyyy h:mm a')}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-[12px] font-normal text-neutral-500 dark:text-neutral-400">Submission</div>
                            <div className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {currentIndex + 1} / {totalSubmissions}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assignment Info */}
                <div className="card p-4">
                    <h4 className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{assignment.title}</h4>
                    <p className="text-[14px] font-normal text-neutral-600 dark:text-neutral-400">{assignment.description}</p>
                    <div className="mt-4 flex items-center gap-4 text-[12px] font-normal text-neutral-500 dark:text-neutral-400">
                        <span>Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
                        <span>•</span>
                        <span>{assignment.points} points</span>
                    </div>
                </div>

                {/* Submission Content */}
                <div className="card p-6">
                    <h4 className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Student Response</h4>
                    <div className="prose dark:prose-invert max-w-none">
                        <div className="bg-neutral-100 dark:bg-neutral-800 rounded p-4 whitespace-pre-wrap text-[14px] font-normal text-neutral-700 dark:text-neutral-300">
                            {submission.content || <span className="text-neutral-500 dark:text-neutral-400 italic">No text submitted</span>}
                        </div>
                    </div>

                    {submission.attachments && submission.attachments.length > 0 && (
                        <div className="mt-4">
                            <h5 className="text-[14px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Attachments</h5>
                            <div className="space-y-2">
                                {submission.attachments.map((attachment, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                                        <svg className="w-4 h-4 text-neutral-700 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <span className="text-[14px] font-normal text-neutral-700 dark:text-neutral-300">{attachment.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {submission.plagiarismScore && (
                        <div className={`mt-4 p-4 rounded border ${submission.plagiarismScore.flagged
                                ? 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
                                : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                            }`}>
                            <div className="flex items-center gap-2 text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {submission.plagiarismScore.flagged ? (
                                    <>
                                        <svg className="w-4 h-4 text-neutral-700 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span className="text-neutral-900 dark:text-neutral-100">
                                            Plagiarism Alert: {submission.plagiarismScore.score}% similarity
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 text-neutral-700 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-neutral-900 dark:text-neutral-100">
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
                        <h4 className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Rubric</h4>
                        <div className="space-y-4">
                            {assignment.rubric.criteria.map((criterion) => (
                                <div key={criterion.id} className="border border-neutral-200 dark:border-neutral-700 rounded p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h5 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{criterion.name}</h5>
                                            <p className="text-[12px] font-normal text-neutral-600 dark:text-neutral-400 mt-2">{criterion.description}</p>
                                        </div>
                                        <span className="text-[12px] font-normal text-neutral-500 dark:text-neutral-400">{criterion.weight}%</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {criterion.levels.map((level, levelIdx) => {
                                            const isSelected = rubricScores[criterion.id] === level.points;
                                            return (
                                                <button
                                                    key={levelIdx}
                                                    onClick={() => handleRubricScore(criterion.id, levelIdx, level.points)}
                                                    className={`p-4 rounded border-2 text-left transition-opacity ${isSelected
                                                            ? 'border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800'
                                                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{level.name}</span>
                                                        <span className="text-[14px] font-semibold text-neutral-700 dark:text-neutral-300">{level.points}pts</span>
                                                    </div>
                                                    <p className="text-[12px] font-normal text-neutral-600 dark:text-neutral-400 line-clamp-2">{level.description}</p>
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
                        className="input text-[20px] font-semibold text-center"
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
                        className="input"
                        placeholder="Provide constructive feedback..."
                        rows={5}
                    />

                    {/* Quick Comments */}
                    <div className="mt-4">
                        <p className="text-[12px] font-normal text-neutral-500 dark:text-neutral-400 mb-2">Quick comments:</p>
                        <div className="flex flex-wrap gap-2">
                            {quickComments.map((comment, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => addQuickComment(comment)}
                                    className="text-[12px] font-semibold px-2 py-2 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    {comment}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-4 -m-4 mt-6">
                    <div className="flex gap-4">
                        <button
                            onClick={onPrevious}
                            disabled={currentIndex === 0}
                            className="btn btn-outline"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>

                        <button
                            onClick={handleSubmitGrade}
                            disabled={grade === null || grade === ''}
                            className="btn btn-primary flex-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <button className="text-[14px] font-normal text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                            Skip this submission
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
