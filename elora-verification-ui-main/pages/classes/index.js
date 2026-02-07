// pages/classes/index.js
// Classes list page - Premium UI

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import { getUserClasses, createClass } from '../../lib/firestore/classes';
import { EmptyClasses } from '../../components/ui/EmptyStates';
import { useApp } from '../../lib/contexts/AppContext';
import { useNotifications } from '../../lib/contexts/NotificationContext';

export default function ClassesPage() {
    const { user } = useApp();
    const notify = useNotifications();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadClasses();
    }, [user]);

    const loadClasses = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userClasses = await getUserClasses(user.uid);
            setClasses(userClasses);
        } catch (error) {
            console.error('Failed to load classes:', error);
            notify.error('Failed to load classes');
        }
        setLoading(false);
    };

    const handleCreateClass = async (classData) => {
        try {
            await createClass({ ...classData, teacherId: user.uid });
            notify.success('Class created successfully!');
            setShowCreateModal(false);
            loadClasses();
        } catch (error) {
            console.error('Failed to create class:', error);
            notify.error('Failed to create class');
        }
    };

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="skeleton h-48 rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">My Classes</h1>
                            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                                Manage your classes and students
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary group"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Class
                        </button>
                    </div>

                    {/* Classes Grid */}
                    {classes.length === 0 ? (
                        <EmptyClasses onCreate={() => setShowCreateModal(true)} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classes.map((classItem, idx) => (
                                <motion.div
                                    key={classItem.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Link href={`/classes/${classItem.id}`}>
                                        <div className="group relative bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-xl hover:shadow-primary-500/10 transition-all cursor-pointer overflow-hidden">
                                            {/* Gradient Background */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="relative">
                                                {/* Class Icon */}
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </div>

                                                {/* Class Info */}
                                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {classItem.name}
                                                </h3>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                                                    {classItem.description || `${classItem.subject} • ${classItem.level}`}
                                                </p>

                                                {/* Stats */}
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                        <span>{classItem.students?.length || 0} students</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                                        <div className="w-2 h-2 rounded-full bg-secondary-500" />
                                                        <span>{classItem.joinCode}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Class Modal */}
            {showCreateModal && (
                <CreateClassModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateClass}
                />
            )}
        </>
    );
}

function CreateClassModal({ onClose, onCreate }) {
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        level: '',
        description: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(formData);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-modal-backdrop" onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center z-modal p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
                >
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Create New Class</h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Class Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input"
                                placeholder="e.g., Math 101"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Subject *</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Math"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Level *</label>
                                <input
                                    type="text"
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Grade 5"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input"
                                placeholder="Optional description..."
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn btn-outline flex-1">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary flex-1">
                                Create Class
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </>
    );
}
