// pages/assignments/[assignmentId].js
// Assignment detail and grading page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Navigation from '../../components/Navigation';
import GradingInterface from '../../components/assignments/GradingInterface';
import SubmissionForm from '../../components/student/SubmissionForm';
import { getAssignmentById, getSubmissions, gradeSubmission } from '../../lib/firestore/assignments';
import { useApp } from '../../lib/contexts/AppContext';
import { useNotifications } from '../../lib/contexts/NotificationContext';

export default function AssignmentDetailPage() {
    const router = useRouter();
    const { assignmentId } = router.query;
    const { user, session } = useApp();
    const notify = useNotifications();

    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('overview'); // overview, grade, submit

    const isTeacher = session?.role === 'teacher' || session?.role === 'educator';

    useEffect(() => {
        if (assignmentId) loadAssignmentData();
    }, [assignmentId]);

    const loadAssignmentData = async () => {
        setLoading(true);
        try {
            const assignmentData = await getAssignmentById(assignmentId);
            setAssignment(assignmentData);

            if (isTeacher) {
                const submissionsData = await getSubmissions(assignmentId);
                setSubmissions(submissionsData);
            }
        } catch (error) {
            console.error('Failed to load assignment:', error);
            notify.error('Failed to load assignment');
        }
        setLoading(false);
    };

    const handleGrade = async (gradeData) => {
        try {
            const submission = submissions[currentSubmissionIndex];
            await gradeSubmission(assignmentId, submission.id, gradeData);
            notify.success('Grade saved successfully!');

            // Move to next submission
            if (currentSubmissionIndex < submissions.length - 1) {
                setCurrentSubmissionIndex(currentSubmissionIndex + 1);
            }

            loadAssignmentData();
        } catch (error) {
            console.error('Failed to grade submission:', error);
            notify.error('Failed to save grade');
        }
    };

    const handleSubmitAssignment = async () => {
        notify.success('Assignment submitted successfully!');
        loadAssignmentData();
    };

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="skeleton h-96 rounded-2xl" />
                    </div>
                </div>
            </>
        );
    }

    if (!assignment) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Assignment Not Found</h2>
                        <button onClick={() => router.push('/assignments')} className="btn btn-primary mt-4">
                            Back to Assignments
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const currentSubmission = submissions[currentSubmissionIndex];
    const mySubmission = submissions.find(s => s.studentId === user?.uid);

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{assignment.title}</h1>
                                <p className="text-neutral-600 dark:text-neutral-400">{assignment.description}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${assignment.status === 'published'
                                ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                }`}>
                                {assignment.status}
                            </span>
                        </div>

                        {/* Assignment Meta */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy h:mm a')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                                <span>{assignment.points} points</span>
                            </div>
                            {isTeacher && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>{submissions.length} submissions</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* View Selector for Teachers */}
                    {isTeacher && (
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={() => setView('overview')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'overview'
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setView('grade')}
                                disabled={submissions.length === 0}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'grade'
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Grade Submissions
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    {isTeacher ? (
                        <>
                            {view === 'overview' && (
                                <div className="space-y-4">
                                    {submissions.length === 0 ? (
                                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
                                            <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No Submissions Yet</h3>
                                            <p className="text-neutral-600 dark:text-neutral-400">Students haven&apos;t submitted their work yet</p>
                                        </div>
                                    ) : (
                                        submissions.map((submission) => (
                                            <div key={submission.id} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-neutral-900 dark:text-white">{submission.studentName}</h3>
                                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                            Submitted {format(new Date(submission.submittedAt), 'MMM dd, h:mm a')}
                                                        </p>
                                                    </div>
                                                    {submission.grade !== null ? (
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
                                                                {submission.grade}
                                                            </div>
                                                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                / {assignment.points}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300">
                                                            Not Graded
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {view === 'grade' && currentSubmission && (
                                <GradingInterface
                                    submission={currentSubmission}
                                    assignment={assignment}
                                    onGrade={handleGrade}
                                    onNext={() => setCurrentSubmissionIndex(Math.min(currentSubmissionIndex + 1, submissions.length - 1))}
                                    onPrevious={() => setCurrentSubmissionIndex(Math.max(currentSubmissionIndex - 1, 0))}
                                    currentIndex={currentSubmissionIndex}
                                    totalSubmissions={submissions.length}
                                />
                            )}
                        </>
                    ) : (
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                            <SubmissionForm
                                assignment={assignment}
                                existingSubmission={mySubmission}
                                studentId={user?.uid}
                                onSubmit={handleSubmitAssignment}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
