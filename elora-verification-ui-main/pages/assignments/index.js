// pages/assignments/index.js
// Assignments list page with create wizard

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';
import AssignmentWizard from '../../components/assignments/AssignmentWizard';
import { EmptyAssignments } from '../../components/ui/EmptyStates';
import { createAssignment, getUserAssignments } from '../../lib/firestore/assignments';
import { getUserClasses } from '../../lib/firestore/classes';
import { useApp } from '../../lib/contexts/AppContext';
import { useNotifications } from '../../lib/contexts/NotificationContext';

export default function AssignmentsPage() {
    const { user } = useApp();
    const notify = useNotifications();
    const [assignments, setAssignments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [filter, setFilter] = useState('all'); // all, published, draft

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [assignmentsData, classesData] = await Promise.all([
                getUserAssignments(user.uid),
                getUserClasses(user.uid),
            ]);
            setAssignments(assignmentsData);
            setClasses(classesData);
        } catch (error) {
            console.error('Failed to load data:', error);
            notify.error('Failed to load assignments');
        }
        setLoading(false);
    };

    const handleCreateAssignment = async (data) => {
        try {
            await createAssignment({ ...data, teacherId: user.uid });
            notify.success('Assignment created successfully!');
            setShowWizard(false);
            loadData();
        } catch (error) {
            console.error('Failed to create assignment:', error);
            notify.error('Failed to create assignment');
        }
    };

    const filteredAssignments = assignments.filter(a => {
        if (filter === 'all') return true;
        if (filter === 'published') return a.status === 'published';
        if (filter === 'draft') return a.status === 'draft';
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="skeleton h-32 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-premium transition-colors duration-500 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-premium">Assignments</h1>
                        <p className="text-secondary mt-1">
                            Create and manage your assignments
                        </p>
                    </div>
                    <button
                        onClick={() => setShowWizard(true)}
                        className="btn btn-primary group"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Assignment
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-6">
                    {['all', 'published', 'draft'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                ? 'bg-primary-500 text-white shadow-premium-md scale-105'
                                : 'bg-premium-card text-secondary border-premium hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Assignments List */}
                {filteredAssignments.length === 0 ? (
                    <EmptyAssignments onCreate={() => setShowWizard(true)} />
                ) : (
                    <div className="space-y-4">
                        {filteredAssignments.map((assignment, idx) => {
                            const isPastDue = new Date() > new Date(assignment.dueDate);

                            return (
                                <motion.div
                                    key={assignment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Link href={`/assignments/${assignment.id}`}>
                                        <div className="group bg-premium-card rounded-2xl border-premium p-6 hover:shadow-premium-xl hover:scale-[1.01] transition-all cursor-pointer shadow-premium-sm">
                                            <div className="flex items-start gap-4">
                                                {/* Icon */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${assignment.status === 'published'
                                                    ? 'bg-gradient-to-br from-secondary-500 to-tertiary-500 shadow-secondary-500/25'
                                                    : 'bg-gradient-to-br from-neutral-400 to-neutral-500 shadow-neutral-500/25'
                                                    }`}>
                                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <h3 className="text-lg font-bold text-premium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                            {assignment.title}
                                                        </h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${assignment.status === 'published'
                                                            ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300'
                                                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                                            }`}>
                                                            {assignment.status}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                                                        {assignment.description}
                                                    </p>

                                                    {/* Meta Info */}
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className={isPastDue ? 'text-error font-semibold' : ''}>
                                                                Due: {format(new Date(assignment.dueDate), 'MMM dd, h:mm a')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                            </svg>
                                                            <span>{assignment.points} points</span>
                                                        </div>
                                                        {assignment.className && (
                                                            <div className="flex items-center gap-1.5">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                                </svg>
                                                                <span>{assignment.className}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
                {showWizard && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-modal-backdrop flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <AssignmentWizard
                                onSave={handleCreateAssignment}
                                onCancel={() => setShowWizard(false)}
                                classData={classes[0]} // TODO: Let user select class
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
