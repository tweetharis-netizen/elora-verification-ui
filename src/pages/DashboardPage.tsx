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
    LogOut,
    Sparkles,
    Check
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
    const [stats, setStats] = useState<dataService.TeacherStat[]>([]);
    const [myClasses, setMyClasses] = useState<dataService.TeacherClass[]>([]);
    const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [teacher, setTeacher] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // AI Game Generator State
    const [showAiForm, setShowAiForm] = useState(false);
    const [aiForm, setAiForm] = useState({
        topic: '',
        level: '',
        questionCount: 5,
        difficulty: 'mixed' as 'easy' | 'medium' | 'hard' | 'mixed',
    });
    const [generatingGame, setGeneratingGame] = useState(false);
    const [generatedGame, setGeneratedGame] = useState<dataService.GamePack | null>(null);
    const [generateError, setGenerateError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
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
            } catch (err: any) {
                setError(err.message || 'An error occurred loading teacher data');
            } finally {
                setLoading(false);
            }
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

    const handleGenerateGame = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneratingGame(true);
        setGenerateError(null);
        setGeneratedGame(null);
        try {
            const pack = await dataService.generateGamePack({
                topic: aiForm.topic,
                level: aiForm.level,
                questionCount: aiForm.questionCount,
                difficulty: aiForm.difficulty,
            });
            setGeneratedGame(pack);
        } catch (err: any) {
            setGenerateError(err.message || 'Failed to generate game');
        } finally {
            setGeneratingGame(false);
        }
    };

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
                {loading ? (
                    <p style={{ margin: '20px', color: '#fff' }}>Loading stats...</p>
                ) : error ? (
                    <p style={{ margin: '20px', color: 'red' }}>Error: {error}</p>
                ) : (
                    <section className="elora-stat-cards">
                        {stats.map((stat, idx) => (
                            <div className="stat-card" key={idx}>
                                <span className="stat-title">{stat.label}</span>
                                <span className="stat-value">{stat.value}</span>
                                <div className={`status-pill ${stat.status}`}>
                                    {stat.status === 'success' && <TrendingUp size={14} />}
                                    {stat.status === 'info' && <Minus size={14} />}
                                    {stat.status === 'warning' && <AlertCircle size={14} />}
                                    <span>{stat.trendValue}</span>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* 2-Column Content Area */}
                <div className="elora-content-grid">

                    {/* Left Column: My Classes */}
                    <section className="elora-classes-section">
                        <div className="section-header">
                            <h2>My Classes</h2>
                            <button className="btn-secondary">View All</button>
                        </div>
                        {loading ? (
                            <p style={{ margin: '20px', color: '#000' }}>Loading classes...</p>
                        ) : error ? (
                            <p style={{ margin: '20px', color: 'red' }}>Error: {error}</p>
                        ) : myClasses.length === 0 ? (
                            <p style={{ margin: '20px', color: '#000' }}>No classes assigned.</p>
                        ) : (
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
                        )}
                    </section>

                    {/* Right Column: Teacher Focus */}
                    <div className="elora-teacher-focus">

                        {/* Quick Actions */}
                        <section className="elora-quick-actions">
                            <h2>Quick Actions</h2>
                            <div className="actions-grid">
                                <button className="action-btn"><Plus size={18} /> Create Assignment</button>
                                <button
                                    className="action-btn"
                                    onClick={() => setShowAiForm(!showAiForm)}
                                    style={{ background: showAiForm ? 'var(--elora-surface-alt)' : '#fff', borderColor: showAiForm ? 'var(--elora-primary)' : 'var(--elora-border-subtle)', transition: 'all 0.2s' }}
                                >
                                    <Sparkles size={18} color="var(--elora-primary)" /> Create AI Game
                                </button>
                                <button className="action-btn highlight"><Play size={18} /> Start Live Game</button>
                            </div>
                        </section>

                        {/* AI Game Generator Panel */}
                        {showAiForm && (
                            <section style={{
                                backgroundColor: '#fff',
                                borderRadius: '16px',
                                border: '1px solid var(--elora-border-subtle)',
                                padding: '24px',
                                marginBottom: '32px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                    <Sparkles size={20} color="var(--elora-primary)" />
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--elora-darkest)' }}>AI Game Generator</h2>
                                </div>
                                <form onSubmit={handleGenerateGame} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--elora-text-muted)', marginBottom: '6px' }}>Topic</label>
                                            <input required type="text" value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })} placeholder="e.g. Solar System" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--elora-border-subtle)', fontSize: '0.9rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--elora-text-muted)', marginBottom: '6px' }}>Level</label>
                                            <input required type="text" value={aiForm.level} onChange={e => setAiForm({ ...aiForm, level: e.target.value })} placeholder="e.g. Grade 5 Science" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--elora-border-subtle)', fontSize: '0.9rem' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--elora-text-muted)', marginBottom: '6px' }}>Number of Questions (1-10)</label>
                                            <input required type="number" min="1" max="10" value={aiForm.questionCount} onChange={e => setAiForm({ ...aiForm, questionCount: parseInt(e.target.value) })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--elora-border-subtle)', fontSize: '0.9rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--elora-text-muted)', marginBottom: '6px' }}>Difficulty Profile</label>
                                            <select value={aiForm.difficulty} onChange={e => setAiForm({ ...aiForm, difficulty: e.target.value as any })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--elora-border-subtle)', fontSize: '0.9rem', backgroundColor: '#fff' }}>
                                                <option value="mixed">Mixed</option>
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>

                                    {generateError && <div style={{ color: '#dc2626', fontSize: '0.875rem', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>{generateError}</div>}

                                    <button type="submit" disabled={generatingGame} style={{ background: 'var(--elora-primary)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: generatingGame ? 'not-allowed' : 'pointer', opacity: generatingGame ? 0.7 : 1, marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                                        {generatingGame ? 'Generating...' : <><Sparkles size={16} /> Generate Game</>}
                                    </button>
                                </form>

                                {/* Results display */}
                                {generatedGame && (
                                    <div style={{ marginTop: '32px', borderTop: '1px solid var(--elora-border-subtle)', paddingTop: '24px' }}>
                                        <div style={{ marginBottom: '20px' }}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--elora-darkest)' }}>{generatedGame.title}</h3>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--elora-text-muted)', margin: 0 }}>Topic: {generatedGame.topic} &nbsp;·&nbsp; Level: {generatedGame.level}</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {generatedGame.questions.map((q, idx) => (
                                                <div key={q.id} style={{ background: 'var(--elora-surface)', border: '1px solid var(--elora-border-subtle)', borderRadius: '12px', padding: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                        <h4 style={{ margin: 0, fontWeight: 600, color: 'var(--elora-darkest)', fontSize: '1rem', lineHeight: 1.4 }}>{idx + 1}. {q.prompt}</h4>
                                                        <span className="status-pill warning" style={{ textTransform: 'capitalize', padding: '2px 8px', fontSize: '0.75rem' }}>{q.difficulty}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {q.options.map((opt, optIdx) => (
                                                            <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', border: optIdx === q.correctIndex ? '2px solid var(--elora-success-text)' : '1px solid var(--elora-border-subtle)', backgroundColor: optIdx === q.correctIndex ? 'var(--elora-success-bg)' : '#fff' }}>
                                                                <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                                                                    {optIdx === q.correctIndex ? <Check size={16} color="var(--elora-success-text)" /> : <span style={{ color: 'var(--elora-text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>{['A', 'B', 'C', 'D'][optIdx]}</span>}
                                                                </div>
                                                                <span style={{ fontSize: '0.9rem', color: optIdx === q.correctIndex ? 'var(--elora-success-text)' : 'var(--elora-darkest)', fontWeight: optIdx === q.correctIndex ? 600 : 400 }}>{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

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
