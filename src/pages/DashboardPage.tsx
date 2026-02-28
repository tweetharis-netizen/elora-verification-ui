// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    FileText,
    Gamepad2,
    Trophy,
    Settings,
    Plus,
    HelpCircle,
    Play,
    TrendingUp,
    Minus,
    AlertCircle,
    Clock,
    CheckCircle2,
    Flame,
    ArrowUp,
    ArrowDown,
    LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/dataService';

// DEV_HELPER: Shown when a user hits /dashboard/teacher without being verified.
// Remove or gate this component behind an env flag before shipping to production.
const DevShortcut = () => {
    const { mockVerify } = useAuth();
    return (
        <div
            style={{
                background: '#fffbea',
                border: '2px dashed #f59e0b',
                borderRadius: '12px',
                padding: '16px 20px',
                margin: '24px auto',
                maxWidth: '480px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#92400e',
            }}
        >
            <strong>🛠 Dev shortcut</strong> — you reached this page without verifying.
            <br />
            <button
                onClick={() => mockVerify('teacher')}
                style={{
                    marginTop: '10px',
                    background: '#28193D',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    cursor: 'pointer',
                    fontWeight: 600,
                }}
            >
                Mock verify as Teacher &amp; reload dashboard
            </button>
        </div>
    );
};

export default function DashboardPage() {
    // Auth state comes from context; no prop needed.
    const { isVerified, logout } = useAuth();
    const [stats, setStats] = useState<any[]>([]);
    const [myClasses, setMyClasses] = useState<any[]>([]);
    const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [teacher, setTeacher] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            const [s, c, a, act, l, t] = await Promise.all([
                dataService.getTeacherStats(),
                dataService.getMyClasses(),
                dataService.getUpcomingAssignments(),
                dataService.getRecentActivities(),
                dataService.getLeaderboardData(),
                dataService.getTeacherProfile()
            ]);
            setStats(s);
            setMyClasses(c);
            setUpcomingAssignments(a);
            setActivities(act);
            setLeaderboard(l);
            setTeacher(t);
        };
        loadData();
    }, []);

    // DEV_HELPER: If for some reason a user bypasses ProtectedRoute and lands here
    // without being verified, show the dev shortcut instead of an auth error.
    // ProtectedRoute in App.tsx should normally prevent this.
    if (!isVerified) {
        return (
            <div className="min-h-screen w-full bg-[#28193D] flex flex-col items-center justify-center p-4">
                <DevShortcut />
            </div>
        );
    }

    return (
        <main className="elora-dashboard-layout">
            {/* Sidebar */}
            <aside className="elora-sidebar">
                <div className="elora-sidebar-header">
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <h2>Elora</h2>
                    </Link>
                </div>
                <nav className="elora-sidebar-nav">
                    <a href="#" className="active"><LayoutDashboard size={18} /> Dashboard</a>
                    <a href="#"><Users size={18} /> Classes</a>
                    <a href="#"><FileText size={18} /> Assignments</a>
                    <a href="#"><Gamepad2 size={18} /> Games</a>
                    <a href="#"><Trophy size={18} /> Leaderboard</a>
                    <a href="#"><Settings size={18} /> Settings</a>
                    {/* Logout button in sidebar footer */}
                    <button
                        onClick={logout}
                        style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit', padding: '8px 0', opacity: 0.7 }}
                    >
                        <LogOut size={18} /> Sign out
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="elora-main-content">
                {/* Top Header */}
                <header className="elora-top-header">
                    <div className="header-text">
                        <h1>Good afternoon, {teacher?.name || 'Teacher'}</h1>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                            Here is your overview for today, {teacher?.lastActive || 'Today'}.
                            <span className="status-pill success">You're all caught up on grading! 🎉</span>
                        </p>
                    </div>
                    <div className="hero-actions">
                        <button className="btn-secondary flex-btn">
                            <AlertCircle size={16} /> Review 3 due assignments
                        </button>
                    </div>
                </header>

                {/* Stat Cards Row */}
                <section className="elora-stat-cards">
                    {stats.map((stat, idx) => (
                        <div className="stat-card" key={idx}>
                            <span className="stat-title">{stat.label}</span>
                            <span className="stat-value">{stat.value}</span>
                            <div className={`status-pill ${stat.status}`}>
                                {stat.status === 'success' && <TrendingUp size={14} />}
                                {stat.status === 'info' && <Minus size={14} />}
                                {stat.status === 'warning' && <AlertCircle size={14} />}
                                <span>{stat.trend}</span>
                            </div>
                        </div>
                    ))}
                </section>

                {/* 2-Column Content Area */}
                <div className="elora-content-grid">

                    {/* Left Column: My Classes */}
                    <section className="elora-classes-section">
                        <div className="section-header">
                            <h2>My Classes</h2>
                            <button className="btn-secondary">View All</button>
                        </div>
                        <div className="classes-grid">
                            {myClasses.map((cls) => (
                                <div className="class-card" key={cls.id}>
                                    <div className="class-card-header">
                                        <h3>{cls.name}</h3>
                                        <span className="badge">{cls.studentsCount} Students</span>
                                    </div>
                                    <p>Next: {cls.nextTopic} ({cls.time})</p>
                                    <div className="class-meta">
                                        <span className={`status-pill ${cls.status}`}>
                                            {cls.status === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                            {cls.statusMsg}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Right Column: Teacher Focus */}
                    <div className="elora-teacher-focus">

                        {/* Quick Actions */}
                        <section className="elora-quick-actions">
                            <h2>Quick Actions</h2>
                            <div className="actions-grid">
                                <button className="action-btn"><Plus size={18} /> Create Assignment</button>
                                <button className="action-btn"><HelpCircle size={18} /> Create Quiz</button>
                                <button className="action-btn highlight"><Play size={18} /> Start Live Game</button>
                            </div>
                        </section>

                        {/* Upcoming Assignments */}
                        <section className="elora-upcoming-assignments">
                            <h2>Upcoming Assignments</h2>
                            <ul className="assignment-list">
                                {upcomingAssignments.map((assignment) => (
                                    <li className="assignment-item" key={assignment.id}>
                                        <div className="assignment-info">
                                            <h4>{assignment.title}</h4>
                                            <p className="text-label" style={{ marginBottom: '4px' }}>{assignment.count}</p>
                                            <p>{assignment.className}</p>
                                        </div>
                                        <div className={`status-pill ${assignment.status}`} style={{ textTransform: 'uppercase' }}>
                                            {assignment.status === 'warning' && <Clock size={12} />} {assignment.statusLabel}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Recent Activity */}
                        <section className="elora-recent-activity">
                            <h2>Recent Activity</h2>
                            <ul className="activity-list">
                                {activities.map((activity) => (
                                    <li key={activity.id}>
                                        <span className="activity-dot"></span>
                                        <p dangerouslySetInnerHTML={{ __html: activity.title.replace(/students|Sarah Lee|Algebra Quiz 1/g, (m: string) => `<strong>${m}</strong>`) }}></p>
                                        <span className="activity-time">{activity.time}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Leaderboard Preview */}
                        <section className="elora-leaderboard-preview">
                            <div className="section-header">
                                <h2>Leaderboard Preview</h2>
                                <span className="subtitle">Sec 3 Math</span>
                            </div>
                            <ul className="leaderboard-list">
                                {leaderboard.map((item) => (
                                    <li key={item.id}>
                                        <div className="lb-left">
                                            <span className="rank">{item.rank}</span>
                                            <div className="lb-name-group">
                                                <span className="name">{item.name}</span>
                                                {item.streak && (
                                                    <span className="status-pill success lb-streak"><Flame size={10} /> {item.streak}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="lb-right">
                                            <span className="score">{item.score}</span>
                                            {item.trend === 'up' && <span className="trend-up" title={`Up ${item.trendVal} positions`}><ArrowUp size={12} /> {item.trendVal}</span>}
                                            {item.trend === 'down' && <span className="trend-down" title={`Down ${item.trendVal} position`}><ArrowDown size={12} /> {item.trendVal}</span>}
                                            {item.trend === 'neutral' && <span className="trend-neutral"><Minus size={12} /></span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
