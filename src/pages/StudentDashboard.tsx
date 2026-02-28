// src/pages/StudentDashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, BookOpen, Gamepad2, Trophy, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

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
    const [activeTipIndex, setActiveTipIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

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
                        <ul className="assignment-list">
                            <li className="assignment-item">
                                <div className="assignment-info">
                                    <h4 className="text-h3">Fractions Worksheet</h4>
                                    <p className="text-body">Math • Due Tomorrow</p>
                                </div>
                                <span className="status-pill warning">In progress</span>
                            </li>
                            <li className="assignment-item">
                                <div className="assignment-info">
                                    <h4 className="text-h3">Read Chapter 4</h4>
                                    <p className="text-body">English • Due Friday</p>
                                </div>
                                <span className="status-pill info">To do</span>
                            </li>
                            <li className="assignment-item">
                                <div className="assignment-info">
                                    <h4 className="text-h3">Science Lab Report</h4>
                                    <p className="text-body">Science • Due Next Week</p>
                                </div>
                                <span className="status-pill success">Completed</span>
                            </li>
                        </ul>
                    </section>

                    {/* Right column: Practice & games */}
                    <section className="student-games">
                        <div className="section-header">
                            <h2 className="text-h2">Practice &amp; games</h2>
                        </div>
                        <div className="games-grid">
                            <div className="class-card game-card">
                                <div className="game-info">
                                    <h3 className="text-h3">Fractions Quest</h3>
                                    <p className="text-body">Master your fractions in this epic adventure.</p>
                                </div>
                                <button className="btn-primary">Start</button>
                            </div>
                            <div className="class-card game-card">
                                <div className="game-info">
                                    <h3 className="text-h3">Vocabulary Sprint</h3>
                                    <p className="text-body">Race against the clock to find the right words.</p>
                                </div>
                                <button className="btn-primary">Start</button>
                            </div>
                        </div>
                    </section>

                </div>

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
