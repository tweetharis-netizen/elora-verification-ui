// src/pages/ParentDashboard.tsx
import React, { useState } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    Activity,
    MessageSquare,
    Settings,
    Plus,
    Clock,
    AlertCircle,
    Send,
    Calendar,
    LogOut,
    Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CHILDREN = [
    { id: 'c1', name: 'Alex', grade: 'P5' },
    { id: 'c2', name: 'Maya', grade: 'P3' },
];

const MOCK_ACTIVITY_STATS: Record<string, any> = {
    c1: {
        level: 12,
        totalXp: 4500,
        streakDays: 5,
        weekly: { daysActive: 4, minutesPracticed: 120, gamesPlayed: 8 },
        todayGoal: { targetMinutes: 20, completedMinutes: 15 },
    },
    c2: {
        level: 8,
        totalXp: 2100,
        streakDays: 2,
        weekly: { daysActive: 2, minutesPracticed: 45, gamesPlayed: 3 },
        todayGoal: { targetMinutes: 20, completedMinutes: 20 },
    },
};

const MOCK_ASSIGNMENTS: Record<string, any[]> = {
    c1: [
        { id: 'a1', subject: 'Math', title: 'Fractions Worksheet', dueDate: '2026-02-28', status: 'overdue' },
        { id: 'a2', subject: 'Science', title: 'Solar System Quiz', dueDate: '2026-03-02', status: 'todo' },
        { id: 'a3', subject: 'Reading', title: 'Chapter 4 Summary', dueDate: '2026-02-25', status: 'completed' },
        { id: 'a4', subject: 'History', title: 'Ancient Egypt Map', dueDate: '2026-03-05', status: 'todo' },
    ],
    c2: [
        { id: 'a5', subject: 'Math', title: 'Addition Practice', dueDate: '2026-03-01', status: 'todo' },
        { id: 'a6', subject: 'Art', title: 'Color Wheel', dueDate: '2026-02-26', status: 'completed' },
    ],
};

const MOCK_ALERTS: Record<string, any[]> = {
    c1: [
        { id: 'al1', type: 'warning', text: '1 assignment overdue this week.' },
        { id: 'al2', type: 'danger', text: 'Streak broke yesterday.' },
    ],
    c2: [{ id: 'al3', type: 'info', text: 'Completed daily goal!' }],
};

const MOCK_INSIGHTS: Record<string, any[]> = {
    c1: [
        { id: 'in1', text: 'Alex focuses best on math in the mornings.' },
        { id: 'in2', text: 'Reading tasks are often completed close to the deadline; consider earlier reminders.' },
    ],
    c2: [
        { id: 'in3', text: 'Maya is showing great progress in Art.' },
        { id: 'in4', text: 'Short daily practice sessions lead to higher streaks.' },
    ],
};

const MOCK_MESSAGES: Record<string, any[]> = {
    c1: [
        { id: 'm1', teacherName: 'Mr. Smith', subject: 'Math', message: "Alex did great in fractions today!", timestamp: '2026-02-27T10:00:00Z' },
        { id: 'm3', teacherName: 'Ms. Johnson', subject: 'Reading', message: 'Please ensure Alex brings the reading log tomorrow.', timestamp: '2026-02-25T14:00:00Z' },
    ],
    c2: [
        { id: 'm2', teacherName: 'Ms. Davis', subject: 'Art', message: "Maya's color wheel is fantastic.", timestamp: '2026-02-26T14:30:00Z' },
    ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParentDashboard() {
    const { logout } = useAuth();

    const [activeChildId, setActiveChildId] = useState('c1');
    const [assignmentFilter, setAssignmentFilter] = useState('All');

    const activeChild = MOCK_CHILDREN.find((c) => c.id === activeChildId) || MOCK_CHILDREN[0];
    const stats = MOCK_ACTIVITY_STATS[activeChildId];
    const assignments = MOCK_ASSIGNMENTS[activeChildId];
    const alerts = MOCK_ALERTS[activeChildId] || [];
    const insights = MOCK_INSIGHTS[activeChildId] || [];
    const messages = MOCK_MESSAGES[activeChildId] || [];

    const filteredAssignments = assignments.filter((a) => {
        if (assignmentFilter === 'All') return true;
        if (assignmentFilter === 'To Do') return a.status === 'todo';
        if (assignmentFilter === 'Completed') return a.status === 'completed';
        if (assignmentFilter === 'Overdue') return a.status === 'overdue';
        return true;
    });

    const SectionHeader = ({ title, showContext = false }: { title: string; showContext?: boolean }) => (
        <h2 className="text-lg font-bold text-[var(--elora-darkest)] mb-6 flex flex-wrap items-baseline gap-2">
            {title}
            {showContext && (
                <span className="text-sm font-medium text-[var(--elora-text-muted)]">· {activeChild.name}</span>
            )}
        </h2>
    );

    return (
        <div className="elora-dashboard-layout">
            {/* ── Sidebar ── */}
            <aside className="elora-sidebar">
                <div className="elora-sidebar-header">
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <h2>Elora</h2>
                    </Link>
                </div>
                <nav className="elora-sidebar-nav">
                    <a href="#" className="active">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </a>
                    <a href="#">
                        <BookOpen size={20} />
                        <span>Assignments</span>
                    </a>
                    <a href="#">
                        <Activity size={20} />
                        <span>Activity</span>
                    </a>
                    <a href="#">
                        <MessageSquare size={20} />
                        <span>Messages</span>
                    </a>
                    <a href="#">
                        <Settings size={20} />
                        <span>Settings</span>
                    </a>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        style={{
                            marginTop: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            padding: '12px 16px',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease',
                            width: '100%',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--elora-deep)';
                            (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
                        }}
                    >
                        <LogOut size={20} />
                        <span>Sign out</span>
                    </button>
                </nav>
            </aside>

            {/* ── Main Content ── */}
            <main className="elora-main-content">

                {/* Top Header & Linked Children */}
                <header className="mb-10 pt-2">
                    <div className="flex flex-col gap-4 mb-8 pb-8 border-b border-[var(--elora-border-subtle)]">
                        <div>
                            <h1 className="text-[22px] font-bold font-heading text-[var(--elora-darkest)] mb-1">
                                Parent Dashboard
                            </h1>
                            <p className="text-base text-[var(--elora-secondary)]">Welcome back, Sarah</p>
                        </div>
                        <div className="inline-flex w-fit px-3 py-1.5 bg-[var(--elora-surface-alt)] border border-[var(--elora-border-subtle)] rounded-md text-xs font-semibold text-[var(--elora-darkest)]">
                            Parent Account
                        </div>
                    </div>

                    {/* Section A: Linked Children */}
                    <div className="flex flex-col xl:flex-row xl:items-center gap-5">
                        <span className="text-xs font-semibold text-[var(--elora-text-muted)] uppercase tracking-wider whitespace-nowrap">
                            Linked children
                        </span>
                        <div className="flex flex-wrap items-center gap-4">
                            {MOCK_CHILDREN.map((child) => (
                                <button
                                    key={child.id}
                                    onClick={() => setActiveChildId(child.id)}
                                    className={`flex items-center px-4 py-2.5 rounded-xl border transition-all ${activeChildId === child.id
                                            ? 'bg-white border-[var(--elora-primary)] shadow-sm ring-1 ring-[var(--elora-primary)]'
                                            : 'bg-[var(--elora-surface-alt)] border-[var(--elora-border-subtle)] hover:border-[var(--elora-primary)]/50'
                                        }`}
                                >
                                    <span
                                        className={`font-semibold text-sm ${activeChildId === child.id ? 'text-[var(--elora-darkest)]' : 'text-[var(--elora-text-muted)]'
                                            }`}
                                    >
                                        {child.name}
                                    </span>
                                    <span className="text-[var(--elora-text-muted)] mx-2 font-normal">·</span>
                                    <span className="text-sm text-[var(--elora-text-muted)]">{child.grade}</span>
                                </button>
                            ))}
                            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[var(--elora-primary)] text-[var(--elora-primary)] hover:bg-[var(--elora-primary)] hover:text-white transition-colors">
                                <Plus size={16} />
                                <span className="font-medium text-sm">Link another child</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Section B: Household Overview */}
                <div className="mb-12">
                    <SectionHeader title="Household Overview" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {MOCK_CHILDREN.map((child) => {
                            const childStats = MOCK_ACTIVITY_STATS[child.id];
                            const childAssignments = MOCK_ASSIGNMENTS[child.id];
                            const overdueCount = childAssignments.filter((a) => a.status === 'overdue').length;

                            return (
                                <div
                                    key={child.id}
                                    className="bg-white rounded-2xl p-6 border border-[var(--elora-border-subtle)] shadow-sm flex flex-col items-start gap-2"
                                >
                                    <div className="font-bold text-base text-[var(--elora-darkest)]">{child.name}</div>
                                    <div className="text-sm font-medium text-[var(--elora-text-muted)]">
                                        Lvl {childStats.level} · {childStats.totalXp} XP
                                    </div>
                                    <div className="text-sm font-medium text-[var(--elora-text-muted)]">
                                        {childStats.streakDays}-day streak
                                    </div>
                                    <div className="mt-2">
                                        {overdueCount > 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-100">
                                                {overdueCount} overdue
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 bg-[var(--elora-surface-alt)] text-[var(--elora-text-muted)] text-xs font-bold rounded-md border border-[var(--elora-border-subtle)]">
                                                No overdue tasks
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

                    {/* ── LEFT COLUMN ── */}
                    <div className="xl:col-span-7 flex flex-col gap-10">

                        {/* Section C: Progress & Engagement */}
                        <section>
                            <SectionHeader title="Current Progress" showContext />
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--elora-border-subtle)] mb-8">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-[var(--elora-text-muted)] uppercase tracking-wider">Level</span>
                                        <span className="text-2xl font-bold text-[var(--elora-darkest)]">{stats.level}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-[var(--elora-text-muted)] uppercase tracking-wider">Total XP</span>
                                        <span className="text-2xl font-bold text-[var(--elora-darkest)]">{stats.totalXp}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-[var(--elora-text-muted)] uppercase tracking-wider">Day streak</span>
                                        <span className="text-2xl font-bold text-[var(--elora-darkest)]">{stats.streakDays} days</span>
                                    </div>
                                </div>
                            </div>

                            <SectionHeader title="Weekly Activity" showContext />
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--elora-border-subtle)]">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-[var(--elora-text-muted)] uppercase tracking-wider">Days active</span>
                                        <span className="text-2xl font-bold text-[var(--elora-darkest)]">{stats.weekly.daysActive}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-[var(--elora-text-muted)] uppercase tracking-wider">Mins practiced</span>
                                        <span className="text-2xl font-bold text-[var(--elora-darkest)]">{stats.weekly.minutesPracticed}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-[var(--elora-text-muted)] uppercase tracking-wider">Games played</span>
                                        <span className="text-2xl font-bold text-[var(--elora-darkest)]">{stats.weekly.gamesPlayed}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section H: Daily Goals & Schedule */}
                        <section>
                            <SectionHeader title="Daily Goals & Schedule" showContext />
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--elora-border-subtle)] flex flex-col gap-8">
                                <div>
                                    <div className="flex items-center gap-3 text-[var(--elora-darkest)] font-medium bg-[var(--elora-surface-alt)] px-4 py-2.5 rounded-xl w-fit border border-[var(--elora-border-subtle)]">
                                        <Clock size={18} className="text-[var(--elora-primary)]" />
                                        <span className="text-sm">Weekdays, 17:00 – 18:00</span>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-[var(--elora-border-subtle)]">
                                    <div className="flex flex-col gap-2 mb-3">
                                        <span className="text-xs font-medium text-[var(--elora-text-muted)] uppercase tracking-wider">
                                            Daily goal
                                        </span>
                                        <span className="text-base font-bold text-[var(--elora-darkest)]">
                                            {stats.todayGoal.completedMinutes} / {stats.todayGoal.targetMinutes} minutes
                                        </span>
                                    </div>
                                    <div className="w-full bg-[var(--elora-surface-alt)] rounded-full h-2.5 overflow-hidden border border-[var(--elora-border-subtle)]">
                                        <div
                                            className="bg-[var(--elora-success-text)] h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    (stats.todayGoal.completedMinutes / stats.todayGoal.targetMinutes) * 100
                                                )}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section D: Homework & Tasks */}
                        <section>
                            <SectionHeader title="Homework & Tasks" showContext />
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--elora-border-subtle)]">
                                {/* Filters */}
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    {['All', 'To Do', 'Completed', 'Overdue'].map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setAssignmentFilter(filter)}
                                            className={`px-4 py-1.5 rounded-full text-xs transition-colors ${assignmentFilter === filter
                                                    ? 'bg-[var(--elora-primary)] text-white font-bold shadow-sm'
                                                    : 'bg-transparent border border-[var(--elora-border-subtle)] text-[var(--elora-text-muted)] font-medium hover:bg-[var(--elora-surface-alt)]'
                                                }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-3">
                                    {filteredAssignments.length > 0 ? (
                                        filteredAssignments.map((assignment) => (
                                            <div
                                                key={assignment.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[var(--elora-border-subtle)] hover:bg-[var(--elora-surface-alt)] transition-colors gap-3"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-bold text-base text-[var(--elora-darkest)]">{assignment.title}</div>
                                                    <div className="text-sm font-medium text-[var(--elora-text-muted)]">{assignment.subject}</div>
                                                </div>
                                                <div className="flex flex-col sm:items-end gap-2 text-left sm:text-right">
                                                    <div className="text-sm text-[var(--elora-text-muted)] font-medium">
                                                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                                                    </div>
                                                    <div>
                                                        {assignment.status === 'overdue' && (
                                                            <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-100">
                                                                Overdue
                                                            </span>
                                                        )}
                                                        {assignment.status === 'todo' && (
                                                            <span className="inline-block px-2.5 py-1 bg-[var(--elora-surface-alt)] text-[var(--elora-text-muted)] text-xs font-bold rounded-md border border-[var(--elora-border-subtle)]">
                                                                To Do
                                                            </span>
                                                        )}
                                                        {assignment.status === 'completed' && (
                                                            <span className="inline-block px-2.5 py-1 bg-[var(--elora-success-bg)] text-[var(--elora-success-text)] text-xs font-bold rounded-md border border-[var(--elora-success-text)]/20">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-[var(--elora-text-muted)] text-sm">
                                            No assignments found for this filter.
                                        </div>
                                    )}
                                </div>
                                {filteredAssignments.length > 3 && (
                                    <div className="mt-5 text-right">
                                        <a href="#" className="text-sm font-semibold text-[var(--elora-primary)] hover:underline">
                                            View all assignments
                                        </a>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div className="xl:col-span-5 flex flex-col gap-10">

                        {/* Section I: Alerts */}
                        {alerts.length > 0 && (
                            <section>
                                <SectionHeader title="Needs Attention" showContext />
                                <div className="flex flex-col gap-3">
                                    {alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={`p-4 rounded-xl flex items-start gap-3 border ${alert.type === 'danger'
                                                    ? 'bg-red-50 border-red-200 text-red-800'
                                                    : alert.type === 'warning'
                                                        ? 'bg-[var(--elora-warning-bg)] border-[var(--elora-warning-text)]/20 text-[var(--elora-warning-text)]'
                                                        : 'bg-[var(--elora-info-bg)] border-[var(--elora-info-text)]/20 text-[var(--elora-info-text)]'
                                                }`}
                                        >
                                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                            <span className="text-base font-medium leading-relaxed">{alert.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Section G: Elora Insights */}
                        <section>
                            <SectionHeader title="Elora Insights" showContext />
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--elora-border-subtle)]">
                                <ul className="space-y-4">
                                    {insights.map((insight) => (
                                        <li key={insight.id} className="flex items-start gap-3 text-sm text-[var(--elora-text-strong)]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--elora-primary)] mt-2 shrink-0"></div>
                                            <p className="leading-relaxed">{insight.text}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* Section E: Quick Actions */}
                        <section>
                            <SectionHeader title="Quick Actions" showContext />
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[var(--elora-primary)] hover:bg-[var(--elora-secondary)] text-white rounded-xl text-sm font-semibold transition-colors">
                                    <Send size={18} />
                                    Send a Nudge
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-[var(--elora-border-subtle)] hover:bg-[var(--elora-surface-alt)] text-[var(--elora-darkest)] rounded-xl text-sm font-semibold transition-colors">
                                    <Calendar size={18} />
                                    Schedule Practice
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--elora-border-subtle)]">
                                <h4 className="text-base font-bold text-[var(--elora-darkest)] mb-4">Notes for Teacher</h4>
                                <textarea
                                    className="w-full bg-white border border-[var(--elora-border-subtle)] rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--elora-primary)] mb-4 placeholder-[var(--elora-text-muted)]/50"
                                    rows={3}
                                    placeholder="Write a note to the teacher..."
                                ></textarea>
                                <button className="w-full py-2.5 bg-[var(--elora-darkest)] hover:bg-[var(--elora-deep)] text-white rounded-xl text-sm font-semibold transition-colors mb-6">
                                    Save Note
                                </button>

                                {/* Mock saved notes */}
                                <div className="border-t border-[var(--elora-border-subtle)] pt-5">
                                    <h5 className="text-xs font-semibold text-[var(--elora-text-muted)] uppercase tracking-wider mb-3">
                                        Previous Notes
                                    </h5>
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <div className="text-[var(--elora-text-muted)] text-xs mb-1">Feb 26, 2026, 08:00 AM</div>
                                            <div className="text-[var(--elora-text-strong)] bg-[var(--elora-surface-alt)] p-3 rounded-xl border border-[var(--elora-border-subtle)] leading-relaxed text-sm">
                                                Alex was sick yesterday, might need extra time on the quiz.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section F: Teacher Updates */}
                        <section>
                            <SectionHeader title="Teacher Updates" showContext />
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--elora-border-subtle)] flex flex-col gap-4 max-h-[400px] overflow-y-auto">
                                {messages.length > 0 ? (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className="bg-[var(--elora-surface-alt)] p-4 rounded-xl border border-[var(--elora-border-subtle)] flex flex-col gap-2"
                                        >
                                            <div className="font-bold text-base text-[var(--elora-darkest)]">
                                                {msg.teacherName}{' '}
                                                <span className="font-normal text-[var(--elora-text-muted)] text-sm">· {msg.subject}</span>
                                            </div>
                                            <div className="text-xs text-[var(--elora-text-muted)] font-medium">
                                                {new Date(msg.timestamp).toLocaleDateString()}
                                            </div>
                                            <p className="text-sm text-[var(--elora-text-strong)] leading-relaxed">{msg.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-[var(--elora-text-muted)] italic text-center py-6">
                                        No recent messages from teachers.
                                    </div>
                                )}
                                {messages.length > 0 && (
                                    <div className="mt-2 text-center">
                                        <a href="#" className="text-sm font-semibold text-[var(--elora-primary)] hover:underline">
                                            View all updates
                                        </a>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section J: Privacy Note */}
                        <div className="mt-2 p-4 bg-[var(--elora-surface-alt)] border border-[var(--elora-border-subtle)] rounded-xl flex items-start gap-3">
                            <Info size={20} className="text-[var(--elora-text-muted)] shrink-0 mt-0.5" />
                            <p className="text-sm text-[var(--elora-text-muted)] leading-relaxed">
                                For their independence, you can view progress and assignments, but private reflections remain between
                                your child and their teacher.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
