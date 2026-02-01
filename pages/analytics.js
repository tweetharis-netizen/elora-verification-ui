// pages/analytics.js
// Analytics dashboard page

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import PerformanceHeatmap from '../components/analytics/PerformanceHeatmap';
import InterventionAlerts from '../components/analytics/InterventionAlerts';
import { getPerformanceHeatmap, detectInterventions } from '../lib/firestore/analytics';
import { getUserClasses } from '../lib/firestore/classes';
import { useApp } from '../lib/contexts/AppContext';
import { useNotifications } from '../lib/contexts/NotificationContext';

export default function AnalyticsPage() {
    const { user } = useApp();
    const notify = useNotifications();

    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClasses();
    }, [user]);

    useEffect(() => {
        if (selectedClass) {
            loadAnalytics();
        }
    }, [selectedClass]);

    const loadClasses = async () => {
        if (!user) return;
        try {
            const classesData = await getUserClasses(user.uid);
            setClasses(classesData);
            if (classesData.length > 0) {
                setSelectedClass(classesData[0].id);
            }
        } catch (error) {
            console.error('Failed to load classes:', error);
            notify.error('Failed to load classes');
        }
        setLoading(false);
    };

    const loadAnalytics = async () => {
        try {
            const [heatmap, alerts] = await Promise.all([
                getPerformanceHeatmap(selectedClass),
                detectInterventions(selectedClass),
            ]);
            setHeatmapData(heatmap);
            setInterventions(alerts);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            notify.error('Failed to load analytics');
        }
    };

    const handleDismissIntervention = (id) => {
        setInterventions(interventions.filter(i => i.id !== id));
        notify.success('Alert dismissed');
    };

    const handleTakeAction = (intervention) => {
        notify.success(`Action logged for ${intervention.studentName}`);
    };

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="skeleton h-64 rounded-2xl mb-6" />
                        <div className="skeleton h-96 rounded-2xl" />
                    </div>
                </div>
            </>
        );
    }

    if (classes.length === 0) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                    <div className="text-center">
                        <svg className="w-24 h-24 text-neutral-300 dark:text-neutral-700 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No Classes Yet</h2>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-6">Create a class to view analytics</p>
                        <button onClick={() => window.location.href = '/classes'} className="btn btn-primary">
                            Create Class
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const currentClass = classes.find(c => c.id === selectedClass);

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">Analytics</h1>

                        {/* Class Selector */}
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="input max-w-sm"
                        >
                            {classes.map((classItem) => (
                                <option key={classItem.id} value={classItem.id}>
                                    {classItem.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Intervention Alerts */}
                    {interventions.length > 0 && (
                        <div className="mb-8">
                            <InterventionAlerts
                                interventions={interventions}
                                students={currentClass?.students || []}
                                onDismiss={handleDismissIntervention}
                                onTakeAction={handleTakeAction}
                            />
                        </div>
                    )}

                    {/* Performance Heatmap */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Performance Heatmap</h2>
                        {heatmapData.length > 0 ? (
                            <PerformanceHeatmap
                                heatmapData={heatmapData}
                                students={currentClass?.students || []}
                            />
                        ) : (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No Data Yet</h3>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Analytics will appear once students complete assignments
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
