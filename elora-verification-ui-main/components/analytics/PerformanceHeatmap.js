// components/analytics/PerformanceHeatmap.js
// Visual heatmap showing student performance across topics

import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function PerformanceHeatmap({ heatmapData = [], students = [] }) {
    // Organize data by student and topic
    const { studentRows, topicColumns } = useMemo(() => {
        if (!heatmapData.length) return { studentRows: [], topicColumns: [] };

        // Get unique topics
        const topics = [...new Set(heatmapData.map(d => d.topic))];

        // Organize by student
        const studentMap = {};
        students.forEach(student => {
            studentMap[student.id] = {
                id: student.id,
                name: student.name,
                scores: {},
            };
        });

        // Fill in scores
        heatmapData.forEach(item => {
            if (studentMap[item.studentId]) {
                if (!studentMap[item.studentId].scores[item.topic]) {
                    studentMap[item.studentId].scores[item.topic] = [];
                }
                studentMap[item.studentId].scores[item.topic].push(item.percentage);
            }
        });

        // Calculate averages
        Object.values(studentMap).forEach(student => {
            Object.keys(student.scores).forEach(topic => {
                const scores = student.scores[topic];
                student.scores[topic] = scores.reduce((a, b) => a + b, 0) / scores.length;
            });
        });

        return {
            studentRows: Object.values(studentMap),
            topicColumns: topics,
        };
    }, [heatmapData, students]);

    // Get color for score
    const getColor = (score) => {
        if (score === undefined || score === null) return 'bg-neutral-100 dark:bg-neutral-800';
        if (score >= 90) return 'bg-secondary-500';
        if (score >= 80) return 'bg-secondary-400';
        if (score >= 70) return 'bg-primary-400';
        if (score >= 60) return 'bg-warning';
        return 'bg-error';
    };

    const getTextColor = (score) => {
        if (score === undefined || score === null) return 'text-neutral-400';
        return 'text-white';
    };

    if (!heatmapData.length || !students.length) {
        return (
            <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Data Yet</h3>
                <p className="text-text-secondary">Performance data will appear here once students complete graded assignments.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                <span className="text-sm font-medium text-text-secondary">Performance:</span>
                <div className="flex items-center gap-2">
                    {[
                        { label: '90%+', color: 'bg-secondary-500' },
                        { label: '80-89%', color: 'bg-secondary-400' },
                        { label: '70-79%', color: 'bg-primary-400' },
                        { label: '60-69%', color: 'bg-warning' },
                        { label: '<60%', color: 'bg-error' },
                    ].map(({ label, color }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className={`w-4 h-4 rounded ${color}`} />
                            <span className="text-xs text-text-tertiary">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Heatmap Table */}
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-border-primary overflow-hidden">
                        {/* Header Row */}
                        <div className="grid gap-px bg-border-primary" style={{ gridTemplateColumns: `200px repeat(${topicColumns.length}, 100px)` }}>
                            <div className="bg-neutral-100 dark:bg-neutral-700 p-3 font-semibold text-text-primary sticky left-0 z-10">
                                Student
                            </div>
                            {topicColumns.map(topic => (
                                <div key={topic} className="bg-neutral-100 dark:bg-neutral-700 p-3 text-center">
                                    <div className="text-xs font-semibold text-text-primary truncate" title={topic}>
                                        {topic}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Student Rows */}
                        {studentRows.map((student, idx) => (
                            <motion.div
                                key={student.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="grid gap-px bg-border-primary hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors"
                                style={{ gridTemplateColumns: `200px repeat(${topicColumns.length}, 100px)` }}
                            >
                                {/* Student Name */}
                                <div className="bg-white dark:bg-neutral-800 p-3 font-medium text-text-primary truncate sticky left-0 z-10">
                                    {student.name}
                                </div>

                                {/* Scores */}
                                {topicColumns.map(topic => {
                                    const score = student.scores[topic];
                                    return (
                                        <div
                                            key={topic}
                                            className={`${getColor(score)} p-3 flex items-center justify-center transition-all hover:scale-105 cursor-pointer`}
                                            title={score !== undefined ? `${Math.round(score)}%` : 'No data'}
                                        >
                                            <span className={`text-sm font-bold ${getTextColor(score)}`}>
                                                {score !== undefined ? Math.round(score) : '-'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4">
                    <div className="text-sm text-text-secondary mb-1">Class Average</div>
                    <div className="text-2xl font-bold text-text-primary">
                        {Math.round(
                            studentRows.reduce((acc, student) => {
                                const scores = Object.values(student.scores).filter(s => s !== undefined);
                                const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                                return acc + avg;
                            }, 0) / (studentRows.length || 1)
                        )}%
                    </div>
                </div>

                <div className="card p-4">
                    <div className="text-sm text-text-secondary mb-1">Topics Covered</div>
                    <div className="text-2xl font-bold text-text-primary">{topicColumns.length}</div>
                </div>

                <div className="card p-4">
                    <div className="text-sm text-text-secondary mb-1">Students Tracked</div>
                    <div className="text-2xl font-bold text-text-primary">{studentRows.length}</div>
                </div>
            </div>
        </div>
    );
}
