// src/pages/TeacherPracticePage.tsx
import React, { useState } from 'react';
import {
    ArrowUpRight,
    Plus,
    TrendingUp,
    Target,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardShell } from '../components/ui/DashboardShell';
import { DashboardCard } from '../components/ui/DashboardCard';
import { DashboardSectionHeader } from '../components/ui/DashboardSectionHeader';
import { PracticeGeneratorDrawer } from '../components/PracticeGeneratorDrawer';
import * as dataService from '../services/dataService';
import { useDemoMode } from '../hooks/useDemoMode';
import { demoClassroomPractices, DEMO_CLASS_NAME } from '../demo/demoTeacherScenarioA';

interface PracticeItem {
    id: string;
    title: string;
    topic: string;
    className: string;
    submittedCount: number;
    totalCount: number;
    questionCount?: number;
    averageScore: number;
    status: string;
    statusLabel: string;
    needsAttention?: boolean;
}

export default function TeacherPracticePage() {
    const navigate = useNavigate();
    const isDemo = useDemoMode();
    const [showGeneratorDrawer, setShowGeneratorDrawer] = useState(false);

    // Demo data
    const practiceSets: PracticeItem[] = isDemo
        ? [
            {
                id: 'cls-practice-1',
                title: 'Algebra: Factorisation Mastery',
                topic: 'Algebra – Factorisation',
                className: DEMO_CLASS_NAME,
                submittedCount: 8,
                totalCount: 32,
                averageScore: 52,
                status: 'upcoming',
                statusLabel: 'Recommended this week',
                needsAttention: true,
            },
            {
                id: 'cls-practice-2',
                title: 'Quick Equations Drill',
                topic: 'Algebra – Linear Equations',
                className: DEMO_CLASS_NAME,
                submittedCount: 27,
                totalCount: 32,
                averageScore: 79,
                status: 'completed',
                statusLabel: 'Completed by most students',
                needsAttention: false,
            },
        ]
        : [];

    const totalActiveSets = practiceSets.length;
    const targetingWeakTopics = practiceSets.filter((p) => p.needsAttention).length;

    return (
        <div className="min-h-screen bg-[#FDFBF5] font-sans">
            <DashboardShell>
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                            Practice & quizzes
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Manage AI-generated and curated practice sets for your classes.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowGeneratorDrawer(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-semibold shadow-lg shadow-teal-600/20 transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
                    >
                        <Plus size={18} /> Generate practice set
                    </button>
                </div>

                {/* Main content area: 8/4 split */}
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
                    {/* Left column (8): Recent practice & quizzes */}
                    <section className="space-y-6">
                        <DashboardSectionHeader
                            variant="canonical"
                            title="Recent practice & quizzes"
                            badge={
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                    {totalActiveSets}
                                </span>
                            }
                        />

                        {practiceSets.length > 0 ? (
                            <div className="space-y-4">
                                {practiceSets.map((practice) => {
                                    const submissionPercent = (practice.submittedCount / practice.totalCount) * 100;
                                    const hasAttentionSignal = practice.needsAttention || practice.averageScore < 70;

                                    return (
                                        <React.Fragment key={practice.id}>
                                        <DashboardCard
                                            variant="canonical"
                                            className="hover:shadow-md transition-all"
                                            bodyClassName="p-5"
                                        >
                                            <div className="space-y-4">
                                                {/* Title + Status */}
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-base font-semibold text-slate-900 truncate">
                                                            {practice.title}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {practice.topic} · {practice.className}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 ${
                                                            hasAttentionSignal
                                                                ? 'bg-red-50 text-red-700 border border-red-200'
                                                                : 'bg-teal-50 text-teal-700 border border-teal-200'
                                                        }`}
                                                    >
                                                        {hasAttentionSignal && <AlertCircle size={12} />}
                                                        {practice.statusLabel}
                                                    </span>
                                                </div>

                                                {/* Metrics Grid */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="px-3 py-2 bg-slate-50/50 rounded-lg">
                                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                                                            Submissions
                                                        </p>
                                                        <p className="mt-1 text-base font-semibold text-slate-900 tabular-nums">
                                                            {practice.submittedCount}/{practice.totalCount}
                                                        </p>
                                                    </div>
                                                    <div className="px-3 py-2 bg-slate-50/50 rounded-lg">
                                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                                                            Avg. Score
                                                        </p>
                                                        <p
                                                            className={`mt-1 text-base font-semibold tabular-nums ${
                                                                hasAttentionSignal
                                                                    ? 'text-red-700'
                                                                    : 'text-teal-700'
                                                            }`}
                                                        >
                                                            {practice.averageScore}%
                                                        </p>
                                                    </div>
                                                    <div className="px-3 py-2 bg-slate-50/50 rounded-lg">
                                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                                                            Questions
                                                        </p>
                                                        <p className="mt-1 text-base font-semibold text-slate-900 tabular-nums">
                                                            {practice.questionCount || 10}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Progress bar */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-medium text-slate-600">
                                                            Completion
                                                        </span>
                                                        <span className="text-xs font-semibold text-slate-500 tabular-nums">
                                                            {Math.round(submissionPercent)}%
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${
                                                                hasAttentionSignal
                                                                    ? 'bg-red-500'
                                                                    : 'bg-teal-500'
                                                            }`}
                                                            style={{ width: `${submissionPercent}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Action button */}
                                                <button
                                                    onClick={() =>
                                                        navigate(`/teacher/classes/demo-class-1?tab=classwork`)
                                                    }
                                                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm transition-all border border-slate-100 group"
                                                >
                                                    View details
                                                    <ChevronRight
                                                        size={16}
                                                        className="text-slate-400 group-hover:text-slate-600 transition-colors"
                                                    />
                                                </button>
                                            </div>
                                        </DashboardCard>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        ) : (
                            <DashboardCard variant="canonical" bodyClassName="p-12 text-center">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mx-auto">
                                        <Target size={24} className="text-slate-400" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-700">
                                        No practice sets yet
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Create your first practice set to get started.
                                    </p>
                                </div>
                            </DashboardCard>
                        )}
                    </section>

                    {/* Right column (4): Summary sidebar */}
                    <aside className="space-y-6 xl:sticky xl:top-6">
                        {/* Summary metrics */}
                        <DashboardCard variant="canonical" bodyClassName="p-4 space-y-4">
                            <div>
                                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">
                                    Active Sets
                                </p>
                                <p className="text-3xl font-semibold text-teal-600 tabular-nums">
                                    {totalActiveSets}
                                </p>
                            </div>
                            <div className="border-t border-slate-200 pt-4">
                                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">
                                    Targeting Weak Topics
                                </p>
                                <p className="text-3xl font-semibold text-orange-600 tabular-nums">
                                    {targetingWeakTopics}
                                </p>
                            </div>
                        </DashboardCard>

                        {/* Tip card */}
                        <DashboardCard
                            variant="canonical"
                            className="border-l-4 border-l-teal-500"
                            bodyClassName="p-4"
                        >
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                <span className="font-semibold text-slate-900">Pro tip:</span> Generate targeted
                                practice sets based on recent weak topics to boost class performance.
                            </p>
                        </DashboardCard>
                    </aside>
                </div>
            </DashboardShell>

            {/* Generator Drawer */}
            <PracticeGeneratorDrawer
                isOpen={showGeneratorDrawer}
                onClose={() => setShowGeneratorDrawer(false)}
                onReview={(game) => {
                    // TODO: Implement review modal
                    setShowGeneratorDrawer(false);
                }}
                onAssign={(game) => {
                    // TODO: Implement assignment modal
                    setShowGeneratorDrawer(false);
                }}
            />
        </div>
    );
}
