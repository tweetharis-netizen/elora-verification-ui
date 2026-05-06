import React from 'react';
import { motion } from 'framer-motion';

export type AssignmentLifecycleFilter = 'all' | 'active' | 'attention' | 'closed';

interface AssignmentLifecycleTabsProps {
    activeFilter: AssignmentLifecycleFilter;
    onFilterChange: (filter: AssignmentLifecycleFilter) => void;
    counts: {
        all: number;
        active: number;
        attention: number;
        closed: number;
    };
    role: 'teacher' | 'student' | 'parent';
}

export function AssignmentLifecycleTabs({
    activeFilter,
    onFilterChange,
    counts,
    role
}: AssignmentLifecycleTabsProps) {
    const roleColors = {
        teacher: {
            text: 'text-teal-700',
            pill: 'bg-white border-slate-200'
        },
        student: {
            text: 'text-[#68507B]',
            pill: 'bg-white border-slate-200'
        },
        parent: {
            text: 'text-[#DB844A]',
            pill: 'bg-white border-slate-200'
        }
    };

    const colors = roleColors[role];

    const tabs: { key: AssignmentLifecycleFilter; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: counts.all },
        { key: 'active', label: 'Active', count: counts.active },
        { key: 'attention', label: 'Attention', count: counts.attention },
        { key: 'closed', label: 'Closed', count: counts.closed }
    ];

    return (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-none">
            <div className="relative grid grid-cols-4 rounded-lg bg-slate-100/50 p-1">
                {tabs.map((segment) => {
                    const selected = activeFilter === segment.key;
                    return (
                        <button
                            key={segment.key}
                            type="button"
                            onClick={() => onFilterChange(segment.key)}
                            className="relative z-10 rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition-colors"
                        >
                            {selected && (
                                <motion.span
                                    layoutId="assignment-lifecycle-pill"
                                    className={`absolute inset-0 rounded-lg border shadow-[0_1px_2px_rgba(15,23,42,0.05)] ${colors.pill}`}
                                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                />
                            )}
                            <span className={`relative uppercase tracking-[0.12em] ${selected ? colors.text : 'text-slate-600'}`}>
                                {segment.label}
                            </span>
                            <span className={`relative ml-1 tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] ${selected ? colors.text : 'text-slate-500'}`}>
                                {segment.count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
