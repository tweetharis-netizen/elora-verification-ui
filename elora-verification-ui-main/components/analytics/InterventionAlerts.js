// components/analytics/InterventionAlerts.js
// Smart alerts for students needing intervention

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function InterventionAlerts({ interventions = [], students = [], onDismiss, onTakeAction }) {
    const [filter, setFilter] = useState('all'); // all, high, medium

    const filteredInterventions = interventions.filter(i =>
        filter === 'all' || i.severity === filter
    );

    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student?.name || 'Unknown Student';
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
            case 'medium': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
            default: return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
        }
    };

    const getSeverityIcon = (severity) => {
        if (severity === 'high') {
            return (
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        }
        return (
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'low_performance': return 'Low Performance';
            case 'declining_performance': return 'Declining Performance';
            case 'negative_trend': return 'Negative Trend';
            case 'missing_assignments': return 'Missing Work';
            default: return type;
        }
    };

    if (interventions.length === 0) {
        return (
            <div className="card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">All Students on Track!</h3>
                <p className="text-text-secondary">No intervention alerts at this time. Great work!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Intervention Alerts</h3>
                    <p className="text-sm text-text-secondary mt-1">
                        {interventions.length} student{interventions.length !== 1 ? 's' : ''} may need support
                    </p>
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                ? 'bg-primary-500 text-white'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        All ({interventions.length})
                    </button>
                    <button
                        onClick={() => setFilter('high')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'high'
                                ? 'bg-red-500 text-white'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        High ({interventions.filter(i => i.severity === 'high').length})
                    </button>
                    <button
                        onClick={() => setFilter('medium')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'medium'
                                ? 'bg-orange-500 text-white'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Medium ({interventions.filter(i => i.severity === 'medium').length})
                    </button>
                </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {filteredInterventions.map((intervention, idx) => (
                    <motion.div
                        key={`${intervention.studentId}-${intervention.type}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`card border-2 ${getSeverityColor(intervention.severity)} p-4`}
                    >
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="flex-shrink-0 mt-1">
                                {getSeverityIcon(intervention.severity)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                        <h4 className="font-bold text-text-primary text-lg">
                                            {getStudentName(intervention.studentId)}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${intervention.severity === 'high'
                                                    ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                    : 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                                                }`}>
                                                {getTypeLabel(intervention.type)}
                                            </span>
                                            <span className="text-xs text-text-tertiary">
                                                {intervention.severity} priority
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    {intervention.avgGrade !== undefined && (
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-error">
                                                {Math.round(intervention.avgGrade)}%
                                            </div>
                                            <div className="text-xs text-text-tertiary">Average</div>
                                        </div>
                                    )}
                                </div>

                                {/* Message */}
                                <p className="text-text-secondary mb-3">{intervention.message}</p>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => onTakeAction && onTakeAction(intervention)}
                                        className="btn btn-sm btn-primary"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                        Contact Parent
                                    </button>
                                    <button
                                        onClick={() => onTakeAction && onTakeAction(intervention, 'schedule')}
                                        className="btn btn-sm btn-outline"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Schedule 1-on-1
                                    </button>
                                    <button
                                        onClick={() => onDismiss && onDismiss(intervention)}
                                        className="btn btn-sm btn-ghost text-text-tertiary"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredInterventions.length === 0 && (
                <div className="card p-8 text-center">
                    <p className="text-text-secondary">No {filter} priority alerts</p>
                </div>
            )}
        </div>
    );
}
