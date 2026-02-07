// pages/classes/[classId].js
// Individual class detail page with tabs

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import ClassRoster from '../../components/classes/ClassRoster';
import { getClassById, addStudentToClass, removeStudentFromClass, markAttendance, addBehavioralNote } from '../../lib/firestore/classes';
import { useApp } from '../../lib/contexts/AppContext';
import { useNotifications } from '../../lib/contexts/NotificationContext';

export default function ClassDetailPage() {
    const router = useRouter();
    const { classId } = router.query;
    const { user } = useApp();
    const notify = useNotifications();

    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('roster');

    useEffect(() => {
        if (classId) loadClassData();
    }, [classId]);

    const loadClassData = async () => {
        setLoading(true);
        try {
            const data = await getClassById(classId);
            setClassData(data);
        } catch (error) {
            console.error('Failed to load class:', error);
            notify.error('Failed to load class');
        }
        setLoading(false);
    };

    const handleAddStudent = async (studentData) => {
        try {
            await addStudentToClass(classId, studentData);
            notify.success('Student added successfully!');
            loadClassData();
        } catch (error) {
            notify.error('Failed to add student');
        }
    };

    const handleRemoveStudent = async (studentId) => {
        try {
            await removeStudentFromClass(classId, studentId);
            notify.success('Student removed');
            loadClassData();
        } catch (error) {
            notify.error('Failed to remove student');
        }
    };

    const handleMarkAttendance = async (date, studentId, status) => {
        try {
            await markAttendance(classId, date, studentId, status);
            loadClassData();
        } catch (error) {
            notify.error('Failed to update attendance');
        }
    };

    const handleAddBehavioralNote = async (studentId, note) => {
        try {
            await addBehavioralNote(classId, studentId, note);
            notify.success('Note added');
            loadClassData();
        } catch (error) {
            notify.error('Failed to add note');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="skeleton h-32 rounded-2xl mb-6" />
                    <div className="skeleton h-96 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Class Not Found</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">This class doesn&apos;t exist or you don&apos;t have access.</p>
                    <button onClick={() => router.push('/classes')} className="btn btn-primary">
                        Back to Classes
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'roster', name: 'Roster', icon: UsersIcon },
        { id: 'assignments', name: 'Assignments', icon: AssignmentsIcon },
        { id: 'analytics', name: 'Analytics', icon: ChartIcon },
    ];

    return (
        <div className="min-h-screen bg-premium transition-colors duration-500 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Class Header */}
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 mb-6 shadow-premium-xl border-premium backdrop-blur-md">
                    <div className="flex items-start justify-between">
                        <div className="text-white">
                            <h1 className="text-3xl font-bold mb-2">{classData.name}</h1>
                            <p className="text-white/80 mb-4">{classData.subject} • {classData.level}</p>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span>{classData.students?.length || 0} Students</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg font-mono">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    <span>{classData.joinCode}</span>
                                </div>
                            </div>
                        </div>
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-premium-card rounded-2xl border-premium overflow-hidden shadow-premium-sm">
                    <div className="flex border-b border-premium">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.name}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTabIndicator"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'roster' && (
                            <ClassRoster
                                classData={classData}
                                students={classData.students || []}
                                onAddStudent={handleAddStudent}
                                onRemoveStudent={handleRemoveStudent}
                                onMarkAttendance={handleMarkAttendance}
                                onAddBehavioralNote={handleAddBehavioralNote}
                                isTeacher={true}
                            />
                        )}

                        {activeTab === 'assignments' && (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No Assignments Yet</h3>
                                <p className="text-neutral-600 dark:text-neutral-400 mb-6">Create your first assignment for this class</p>
                                <button onClick={() => router.push('/assignments')} className="btn btn-primary">
                                    Create Assignment
                                </button>
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Analytics Coming Soon</h3>
                                <p className="text-neutral-600 dark:text-neutral-400">Class analytics will appear here after students complete assignments</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function UsersIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );
}

function AssignmentsIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function ChartIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}
