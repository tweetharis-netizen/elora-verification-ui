// components/parent/ProgressDashboard.js
// Parent view of student progress and performance

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { getStudentAnalytics, generateWeeklyDigest, getLearningGaps } from '../../lib/firestore/analytics';

export default function ProgressDashboard({ studentId, studentName }) {
    const [analytics, setAnalytics] = useState(null);
    const [weeklyDigest, setWeeklyDigest] = useState(null);
    const [learningGaps, setLearningGaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState(30); // days

    useEffect(() => {
        loadData();
    }, [studentId, timeframe]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [analyticsData, digestData, gapsData] = await Promise.all([
                getStudentAnalytics(studentId, timeframe),
                generateWeeklyDigest(studentId),
                getLearningGaps(studentId),
            ]);

            setAnalytics(analyticsData);
            setWeeklyDigest(digestData);
            setLearningGaps(gapsData);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600"></div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="card p-12 text-center">
                <p className="text-text-secondary">No data available yet</p>
            </div>
        );
    }

    const getTrendIcon = (trend) => {
        if (trend === 'improving') {
            return (
                <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            );
        }
        if (trend === 'declining') {
            return (
                <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">{studentName}&apos;s Progress</h2>
                    <p className="text-text-secondary mt-1">Track learning journey and achievements</p>
                </div>

                {/* Timeframe Selector */}
                <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(Number(e.target.value))}
                    className="input"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Average Grade</span>
                        {getTrendIcon(analytics.performanceTrend)}
                    </div>
                    <div className="text-3xl font-bold text-primary-900 dark:text-primary-100">
                        {analytics.averageGrade ? `${analytics.averageGrade}%` : 'N/A'}
                    </div>
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                        {analytics.performanceTrend === 'improving' && '↗ Improving'}
                        {analytics.performanceTrend === 'declining' && '↘ Needs attention'}
                        {analytics.performanceTrend === 'stable' && '→ Consistent'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-6 bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Assignments Done</span>
                        <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
                        {analytics.assignmentsCompleted}
                    </div>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                        Past {timeframe} days
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-6 bg-gradient-to-br from-tertiary-50 to-tertiary-100 dark:from-tertiary-900/20 dark:to-tertiary-800/20"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-tertiary-700 dark:text-tertiary-300">Learning Streak</span>
                        <svg className="w-5 h-5 text-tertiary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold text-tertiary-900 dark:text-tertiary-100">
                        {analytics.streakDays} 🔥
                    </div>
                    <p className="text-xs text-tertiary-600 dark:text-tertiary-400 mt-1">
                        {analytics.streakDays === 1 ? 'day' : 'days'} in a row
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Total Activity</span>
                        <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                        {analytics.totalActivities}
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        Learning actions
                    </p>
                </motion.div>
            </div>

            {/* Weekly Digest */}
            {weeklyDigest && (
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-4">This Week&apos;s Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-text-secondary text-sm mb-3">Highlights</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-sm text-text-primary">
                                    <span className="text-secondary-600 mt-0.5">✓</span>
                                    Active {weeklyDigest.summary.activeDays} out of 7 days
                                </li>
                                <li className="flex items-start gap-2 text-sm text-text-primary">
                                    <span className="text-secondary-600 mt-0.5">✓</span>
                                    Completed {weeklyDigest.summary.assignmentsCompleted} assignments
                                </li>
                                {weeklyDigest.summary.averageGrade && (
                                    <li className="flex items-start gap-2 text-sm text-text-primary">
                                        <span className="text-secondary-600 mt-0.5">✓</span>
                                        Average grade: {weeklyDigest.summary.averageGrade}%
                                    </li>
                                )}
                            </ul>

                            {weeklyDigest.achievements.length > 0 && (
                                <div className="mt-4">
                                    <h5 className="font-medium text-text-secondary text-sm mb-2">Achievements</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {weeklyDigest.achievements.map((achievement, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 rounded-full text-xs font-medium">
                                                {achievement}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            {weeklyDigest.concerns && weeklyDigest.concerns.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-text-secondary text-sm mb-3">Areas of Focus</h4>
                                    <ul className="space-y-2">
                                        {weeklyDigest.concerns.map((concern, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-warning">
                                                <span className="mt-0.5">⚠️</span>
                                                {concern}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <h4 className="font-medium text-text-secondary text-sm mb-3">Next Steps</h4>
                            <ul className="space-y-2">
                                {weeklyDigest.nextSteps.map((step, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-text-primary">
                                        <span className="text-primary-600 mt-0.5">→</span>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Learning Gaps */}
            {learningGaps.length > 0 && (
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Areas Needing Practice</h3>
                    <div className="space-y-3">
                        {learningGaps.map((gap, idx) => (
                            <div key={idx} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-text-primary">{gap.topic}</h4>
                                    <span className="text-lg font-bold text-orange-600">
                                        {Math.round(gap.averageScore)}%
                                    </span>
                                </div>
                                <p className="text-sm text-text-secondary mb-2">{gap.attempts} attempt{gap.attempts !== 1 && 's'}</p>
                                <div className="mt-3">
                                    <p className="text-xs font-medium text-text-secondary mb-1">Recommendations:</p>
                                    <ul className="space-y-1">
                                        {gap.recommendations.slice(0, 2).map((rec, recIdx) => (
                                            <li key={recIdx} className="text-xs text-text-tertiary flex items-start gap-1">
                                                <span>•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Subjects */}
            {analytics.topSubjects && analytics.topSubjects.length > 0 && (
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Most Active Subjects</h3>
                    <div className="space-y-3">
                        {analytics.topSubjects.map((subject, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                                    #{idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-text-primary">{subject.subject}</div>
                                    <div className="text-sm text-text-tertiary">{subject.activities} activities</div>
                                </div>
                                <div className="w-32 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                    <div
                                        className="bg-primary-500 h-2 rounded-full"
                                        style={{ width: `${(subject.activities / analytics.topSubjects[0].activities) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
