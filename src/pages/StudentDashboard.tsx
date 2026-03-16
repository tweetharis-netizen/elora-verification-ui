import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Gamepad2, Trophy, Settings, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getStudentAssignments, StudentAssignment, getStudentGameSessions, GameSession } from '../services/dataService';

const TIPS = [
    "Spacing out your practice over a few days helps your brain remember things much better!",
    "Try playing a quick learning game before starting your assignments to warm up your mind.",
    "Always check your upcoming assignments early in the week so you can plan your time.",
    "If you get stuck on a tricky topic, don't be afraid to ask your teacher for help right away.",
    "Reviewing the feedback your teacher leaves on past assignments is the fastest way to level up.",
    "Taking a short 5-minute break after finishing a big task keeps your mind fresh and focused.",
    "Logging in for just a few minutes every day is a great way to build your streak and earn extra XP!"
];

export default function StudentDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeTipIndex, setActiveTipIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [sessionsError, setSessionsError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setLoading(true);
                const data = await getStudentAssignments();
                setAssignments(data.assignments);
            } catch (err: any) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, []);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setSessionsLoading(true);
                const data = await getStudentGameSessions();
                setGameSessions(data.slice(0, 3)); // show last 3
            } catch (err: any) {
                setSessionsError(err.message || 'Error fetching game sessions');
            } finally {
                setSessionsLoading(false);
            }
        };
        fetchSessions();
    }, []);

    useEffect(() => {
        if (isHovered) return;

        const interval = setInterval(() => {
            setActiveTipIndex((current) => (current + 1) % TIPS.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [isHovered]);

    return (
        <div className="elora-dashboard-layout">
            {/* Sidebar */}
            <aside className="elora-sidebar">
                <div className="elora-sidebar-header">
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <h2>Elora</h2>
                    </Link>
                </div>
                <nav className="elora-sidebar-nav">
                    <a href="#" className="active">
                        <Home size={20} />
                        Home
                    </a>
                    <a href="#">
                        <BookOpen size={20} />
                        Assignments
                    </a>
                    <a href="#">
                        <Gamepad2 size={20} />
                        Practice &amp; games
                    </a>
                    <a href="#">
                        <Trophy size={20} />
                        Leaderboard
                    </a>
                    <a href="#">
                        <Settings size={20} />
                        Settings
                    </a>
                </nav>

                {/* Logout at bottom of sidebar */}
                <div style={{ marginTop: 'auto', padding: '16px' }}>
                    <button
                        onClick={logout}
                        className="elora-sidebar-logout"
                    >
                        <LogOut size={18} />
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="elora-main-content">
                {/* A) Header */}
                <header className="elora-top-header student-header">
                    <div>
                        <h1 className="text-h1">Welcome back, Alex! 👋</h1>
                        <p className="text-body">Here's what to focus on today.</p>
                    </div>
                </header>

                {/* B) XP / Level Card */}
                <section className="stat-card elora-xp-card">
                    <div className="xp-header">
                        <div className="xp-level-info">
                            <span className="text-label xp-label">Current Level</span>
                            <h2 className="text-h2">Level 3: Explorer</h2>
                        </div>
                        <div className="xp-streak">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                            </svg>
                            <span className="text-body-medium">5-day streak!</span>
                        </div>
                    </div>
                    <div className="xp-progress-container">
                        <div className="xp-progress-bar">
                            <div className="xp-progress-fill" style={{ width: '65%' }}></div>
                        </div>
                        <div className="xp-progress-text text-label">
                            <span className="xp-current">1,300 XP</span>
                            <span className="xp-target">2,000 XP to Level 4</span>
                        </div>
                    </div>
                </section>

                {/* C) Two-column main area */}
                <div className="elora-content-grid">

                    {/* Left column: Assignments to do */}
                    <section className="student-assignments">
                        <div className="section-header">
                            <h2 className="text-h2">Assignments to do</h2>
                        </div>
                        {loading ? (
                            <p className="text-body" style={{ marginTop: '16px' }}>Loading assignments...</p>
                        ) : error ? (
                            <p className="text-body" style={{ marginTop: '16px', color: 'red' }}>Error: {error}</p>
                        ) : assignments.length === 0 ? (
                            <p className="text-body" style={{ marginTop: '16px' }}>No assignments due! Great job!</p>
                        ) : (
                            <ul className="assignment-list">
                                {assignments.map(assignment => (
                                    <li key={assignment.id} className="assignment-item">
                                        <div className="assignment-info">
                                            <h4 className="text-h3">{assignment.title}</h4>
                                            <p className="text-body">
                                                {assignment.className} • Due {new Date(assignment.dueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`status-pill ${assignment.status || 'info'}`}>
                                            {assignment.statusLabel || 'ASSIGNED'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Right column: Practice & games */}
                    <section className="student-games">
                        <div className="section-header">
                            <h2 className="text-h2">Practice &amp; games</h2>
                        </div>
                        <div className="games-grid">
                            <div className="class-card game-card" style={{ borderTop: '4px solid var(--elora-primary)' }}>
                                <div className="game-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <Sparkles size={16} color="var(--elora-primary)" />
                                        <h3 className="text-h3" style={{ margin: 0 }}>Fractions Quest</h3>
                                    </div>
                                    <p className="text-body" style={{ color: 'var(--elora-text-muted)' }}>Play a demo AI-generated learning game to master fractions.</p>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate('/play/demo-game')}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                                >
                                    <Gamepad2 size={16} /> Play Demo AI Game
                                </button>
                            </div>
                            <div className="class-card game-card" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                                <div className="game-info">
                                    <h3 className="text-h3">Vocabulary Sprint</h3>
                                    <p className="text-body">Race against the clock to find the right words.</p>
                                </div>
                                <button className="btn-primary" disabled style={{ background: 'var(--elora-border-subtle)', color: 'var(--elora-text-muted)' }}>Locked</button>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Recent game sessions */}
                <section className="student-recent-sessions stat-card" style={{ marginTop: '24px' }}>
                    <div className="section-header">
                        <h2 className="text-h2">Recent game sessions</h2>
                    </div>
                    {sessionsLoading ? (
                        <p className="text-body" style={{ marginTop: '16px' }}>Loading sessions...</p>
                    ) : sessionsError ? (
                        <p className="text-body" style={{ marginTop: '16px', color: 'var(--elora-danger)' }}>{sessionsError}</p>
                    ) : gameSessions.length === 0 ? (
                        <p className="text-body" style={{ marginTop: '16px', color: 'var(--elora-text-muted)' }}>
                            No games played yet. Try playing a demo game above!
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                            {gameSessions.map(session => (
                                <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--elora-surface)', padding: '12px 16px', border: '1px solid var(--elora-border-subtle)', borderRadius: 'var(--elora-radius-md)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <h4 className="text-h3" style={{ margin: 0 }}>
                                            {session.packId === 'demo-game-1' ? 'Fractions Quest' : session.packId}
                                        </h4>
                                        <span className="text-body-medium" style={{ color: 'var(--elora-text-muted)' }}>
                                            {new Date(session.playedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <p className="text-label" style={{ marginBottom: '4px', display: 'block' }}>Score</p>
                                            <p className="text-body-medium">{session.score} / {session.totalQuestions}</p>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '60px' }}>
                                            <p className="text-label" style={{ marginBottom: '4px', display: 'block' }}>Accuracy</p>
                                            <p className="text-body-medium" style={{ color: session.accuracy >= 0.8 ? 'var(--elora-success)' : session.accuracy >= 0.5 ? 'var(--elora-warning)' : 'var(--elora-danger)' }}>
                                                {Math.round(session.accuracy * 100)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* D) Tips strip */}
                <section
                    className="elora-tip-strip"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className="tip-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5" />
                            <path d="M9 18h6" />
                            <path d="M10 22h4" />
                        </svg>
                    </div>
                    <div className="tip-content">
                        <h4 className="text-body-medium">Tip from Elora</h4>
                        <div className="tip-rotator">
                            {TIPS.map((tip, index) => (
                                <p
                                    key={index}
                                    className={`text-body tip-item ${index === activeTipIndex ? 'active' : ''}`}
                                    aria-hidden={index !== activeTipIndex}
                                >
                                    {tip}
                                </p>
                            ))}
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
