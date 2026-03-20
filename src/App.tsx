// src/App.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Clock, Users, BookOpen, MessageSquare, BarChart3, Shield, Sparkles, Menu, X, ChevronRight } from 'lucide-react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import OurStoryPage from './pages/OurStoryPage';
import VerifyPage from './pages/VerifyPage';
import ProtectedRoute from './components/ProtectedRoute';
import StudentGamePage from './pages/StudentGamePage';
import { AuthProvider, useAuth } from './auth/AuthContext';

// ─── Homepage components ──────────────────────────────────────────────────────

const ComingSoonBar = () => {
  const messages = [
    "School-verified controls – coming soon",
    "Deeper analytics for teachers – coming soon",
    "AI lesson generation – coming soon"
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-xs font-medium text-white/90 mb-8 overflow-hidden relative h-8 w-80 shadow-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute left-4 right-4 flex items-center"
        >
          <Sparkles className="w-3.5 h-3.5 mr-2 text-accent-yellow shrink-0" />
          <span className="truncate">{messages[index]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 border-b border-white/10 bg-elora-400/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-elora-100 rounded flex items-center justify-center text-white font-serif italic font-bold text-lg shadow-sm">E</div>
            <span className="text-white font-medium text-lg tracking-tight">Elora</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
          <a href="#" className="hover:text-white transition-colors">Platform</a>
          <a href="#" className="hover:text-white transition-colors">Solutions</a>
          <a href="#" className="hover:text-white transition-colors">Resources</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Log in</Link>
          <button className="bg-white text-elora-400 px-4 py-2 rounded-md text-sm font-medium hover:bg-white/90 transition-colors shadow-sm hover:shadow">
            Book a demo
          </button>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-elora-400 border-b border-white/10 px-6 py-4 space-y-4">
          <a href="#" className="block text-white/80 hover:text-white font-medium">Platform</a>
          <a href="#" className="block text-white/80 hover:text-white font-medium">Solutions</a>
          <a href="#" className="block text-white/80 hover:text-white font-medium">Resources</a>
          <a href="#" className="block text-white/80 hover:text-white font-medium">Pricing</a>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link to="/login" className="block text-white/80 hover:text-white font-medium text-center">Log in</Link>
            <button className="w-full bg-white text-elora-400 px-4 py-2 rounded-md text-sm font-medium">
              Book a demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

const Hero = () => {
  return (
    <section className="relative bg-elora-400 text-white pt-32 pb-24 border-b border-white/10 overflow-hidden min-h-[90vh] flex items-center">
      <div className="absolute inset-0 bg-grid pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
        <div>
          <ComingSoonBar />
          <h1 className="text-5xl md:text-7xl font-sans font-medium tracking-tight leading-[1.05] mb-6">
            The intelligent <br />
            <span className="font-serif italic text-elora-100">platform</span> for education
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-md leading-relaxed">
            Connect your classrooms, empower teachers, and deploy intelligent tools to automate admin work, track progress, and improve learning outcomes.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button className="bg-elora-100 hover:bg-elora-200 text-white px-6 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5 border border-white/10 shadow-md">
              Book a demo
            </button>
            <Link to="/signup" className="flex items-center justify-center bg-transparent hover:bg-white/5 text-white px-6 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5 border border-white/20">
              Start for free
            </Link>
          </div>
        </div>

        {/* Hero Tiles Cluster */}
        <div className="relative h-[500px] w-full hidden lg:block perspective-1000">
          {/* Tile 1: Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="absolute top-10 right-10 w-64 bg-white rounded-xl border border-elora-400/10 shadow-2xl p-5 text-elora-400 z-20 hover:-translate-y-2 transition-transform duration-300"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-elora-400/10">
              <h3 className="font-semibold text-sm">Class 3E Leaderboard</h3>
              <span className="text-[10px] uppercase tracking-wider bg-accent-green/20 text-accent-green px-2 py-1 rounded font-bold">Live</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Alex M.', score: '2,450 XP', rank: 1 },
                { name: 'Priya K.', score: '2,310 XP', rank: 2 },
                { name: 'Sam T.', score: '2,100 XP', rank: 3 },
              ].map((student, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-elora-100 font-mono text-xs font-medium w-4">{student.rank}</span>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <span className="text-elora-200 font-mono text-xs bg-elora-100/10 px-2 py-1 rounded">{student.score}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tile 2: Assignments */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="absolute top-48 left-0 w-72 bg-white rounded-xl border border-elora-400/10 shadow-2xl p-5 text-elora-400 z-30 hover:-translate-y-2 transition-transform duration-300"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-elora-400/10">
              <h3 className="font-semibold text-sm">Active Assignments</h3>
              <BookOpen className="w-4 h-4 text-elora-100" />
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-elora-100/5 border border-elora-100/20">
                <CheckCircle2 className="w-4 h-4 text-accent-green mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Biology Quiz</p>
                  <p className="text-xs text-elora-200 mt-1">24/30 submitted</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-elora-400/10">
                <Clock className="w-4 h-4 text-accent-orange mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">History Essay</p>
                  <p className="text-xs text-elora-200 mt-1">Due in 2 days</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tile 3: Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="absolute bottom-4 right-24 w-80 bg-white rounded-xl border border-elora-400/10 shadow-2xl p-5 text-elora-400 z-10 hover:-translate-y-2 transition-transform duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-sm">Weekly Engagement</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-green bg-accent-green/10 px-2 py-1 rounded">+12% vs last week</span>
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { day: 'M', val: 40 },
                  { day: 'T', val: 65 },
                  { day: 'W', val: 85 },
                  { day: 'T', val: 55 },
                  { day: 'F', val: 90 },
                ]}>
                  <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    {[40, 65, 85, 55, 90].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? 'var(--color-accent-pink)' : 'var(--color-elora-100)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const RoleSelectionSection = () => {
  return (
    <section id="role-selection" className="bg-elora-300 text-white py-32 border-b border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-50"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-sans font-medium mb-6 tracking-tight">Explore as any role</h2>
        <p className="text-white/70 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">Select a dashboard below to test the end-to-end experience with our demo profiles.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Teacher Card */}
          <Link
            to="/login"
            state={{ role: 'teacher' }}
            className="group relative p-8 bg-elora-400/60 border border-white/10 rounded-3xl hover:bg-elora-400/80 transition-all shadow-xl hover:-translate-y-2 flex flex-col h-full text-left"
          >
            <div className="w-12 h-12 bg-accent-orange/20 text-accent-orange rounded-xl flex items-center justify-center mb-6 border border-accent-orange/20 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-medium mb-3 text-white">Teacher</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8 flex-grow">Create AI GamePacks, manage class sessions, and analyze student engagement.</p>
            <div className="text-accent-yellow font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform mt-auto">
              Try Teacher Flow <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Student Card */}
          <Link
            to="/login"
            state={{ role: 'student' }}
            className="group relative p-8 bg-elora-400/60 border border-white/10 rounded-3xl hover:bg-elora-400/80 transition-all shadow-xl hover:-translate-y-2 flex flex-col h-full text-left"
          >
            <div className="w-12 h-12 bg-accent-green/20 text-accent-green rounded-xl flex items-center justify-center mb-6 border border-accent-green/20 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-medium mb-3 text-white">Student</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8 flex-grow">View upcoming tasks, play interactive learning games, and track your streak.</p>
            <div className="text-accent-yellow font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform mt-auto">
              Try Student Flow <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Parent Card */}
          <Link
            to="/login"
            state={{ role: 'parent' }}
            className="group relative p-8 bg-elora-400/60 border border-white/10 rounded-3xl hover:bg-elora-400/80 transition-all shadow-xl hover:-translate-y-2 flex flex-col h-full text-left"
          >
            <div className="w-12 h-12 bg-accent-pink/20 text-accent-pink rounded-xl flex items-center justify-center mb-6 border border-accent-pink/20 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-medium mb-3 text-white">Parent</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8 flex-grow">Monitor student progress, review assignments, and confirm verified achievements.</p>
            <div className="text-accent-yellow font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform mt-auto">
              Try Parent Flow <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

const FeatureSection = () => {
  return (
    <section className="bg-elora-300 text-white py-32 border-b border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-sans font-medium mb-6 tracking-tight">
            The foundation for <span className="font-serif italic text-accent-yellow">modern learning</span>
          </h2>
          <p className="text-white/70 text-lg">
            Transform fragmented tools into a unified educational experience. Elora brings everything together securely.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-elora-400/60 border border-white/10 rounded-2xl p-8 hover:bg-elora-400/80 transition-colors cursor-pointer group flex flex-col h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-orange/20 flex items-center justify-center mb-6 border border-accent-orange/20">
              <Users className="w-6 h-6 text-accent-orange" />
            </div>
            <h3 className="text-2xl font-medium mb-3">Classes dashboard</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8 flex-grow">Manage all your classes from a single, organized view with real-time status updates.</p>
            <div className="bg-white rounded-xl border border-white/20 p-4 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-elora-400">Math 101</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-green/20 text-accent-green px-2 py-1 rounded">Active</span>
              </div>
              <div className="h-2 bg-elora-400/5 rounded-full w-full overflow-hidden">
                <div className="h-full bg-accent-green w-3/4 rounded-full"></div>
              </div>
            </div>
          </motion.div>

          {/* Feature Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-elora-400/60 border border-white/10 rounded-2xl p-8 hover:bg-elora-400/80 transition-colors cursor-pointer group flex flex-col h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-green/20 flex items-center justify-center mb-6 border border-accent-green/20">
              <BookOpen className="w-6 h-6 text-accent-green" />
            </div>
            <h3 className="text-2xl font-medium mb-3">Lesson storyboard</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8 flex-grow">Plan and visualize your curriculum with intuitive drag-and-drop building blocks.</p>
            <div className="bg-white rounded-xl border border-white/20 p-3 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 space-y-2">
              <div className="bg-elora-100/10 border border-elora-100/20 p-2 rounded flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-elora-100/30"></div>
                <div className="h-2 bg-elora-400/20 rounded w-24"></div>
              </div>
              <div className="bg-elora-100/10 border border-elora-100/20 p-2 rounded flex items-center gap-2 ml-4">
                <div className="w-4 h-4 rounded bg-accent-orange/30"></div>
                <div className="h-2 bg-elora-400/20 rounded w-16"></div>
              </div>
            </div>
          </motion.div>

          {/* Feature Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-elora-400/60 border border-white/10 rounded-2xl p-8 hover:bg-elora-400/80 transition-colors cursor-pointer group flex flex-col h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-pink/20 flex items-center justify-center mb-6 border border-accent-pink/20">
              <BarChart3 className="w-6 h-6 text-accent-pink" />
            </div>
            <h3 className="text-2xl font-medium mb-3">Analytics overview</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8 flex-grow">Track student performance and identify areas for improvement instantly.</p>
            <div className="bg-white rounded-xl border border-white/20 p-4 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-end gap-2 h-24">
              <div className="w-full bg-elora-100/20 rounded-t-sm h-1/3"></div>
              <div className="w-full bg-elora-100/40 rounded-t-sm h-2/3"></div>
              <div className="w-full bg-accent-pink rounded-t-sm h-full"></div>
              <div className="w-full bg-elora-100/30 rounded-t-sm h-1/2"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ProductUISection = () => {
  return (
    <section className="bg-elora-100 text-elora-400 py-32 border-b border-elora-400/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark pointer-events-none opacity-20"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-sans font-medium mb-6 tracking-tight">
              <span className="font-serif italic text-white">Automate</span> the routine, focus on teaching
            </h2>
            <p className="text-elora-400/80 text-lg mb-8">
              Elora Assistant chat and smart workflows handle grading, scheduling, and parent communications automatically.
            </p>
            <ul className="space-y-4 mb-8">
              {['Smart grading suggestions', 'Automated progress reports', 'Instant parent updates'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-medium">
                  <div className="w-6 h-6 rounded-full bg-elora-200 flex items-center justify-center text-white">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <button className="bg-elora-400 text-white px-6 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5 shadow-md">
              See how it works
            </button>
          </div>

          <div className="relative h-[450px] w-full perspective-1000">
            {/* Chat Tile */}
            <motion.div
              initial={{ opacity: 0, x: 20, rotateY: -10 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="absolute top-0 right-0 w-80 bg-white rounded-xl border border-elora-400/10 shadow-2xl p-5 z-20 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-elora-400/10">
                <div className="w-8 h-8 rounded-full bg-accent-pink/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-accent-pink" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Elora Assistant</h3>
                  <p className="text-xs text-elora-100">Online</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-[#f8f9fa] p-3 rounded-lg rounded-tl-none border border-elora-400/5 w-5/6 text-elora-400/80">
                  Can you draft a progress report for Alex M.?
                </div>
                <div className="bg-elora-100/10 p-3 rounded-lg rounded-tr-none border border-elora-100/20 w-5/6 ml-auto font-medium">
                  Drafting report... Alex has improved by 15% in Science this term.
                </div>
              </div>
            </motion.div>

            {/* Status Tile */}
            <motion.div
              initial={{ opacity: 0, x: -20, rotateY: 10 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute bottom-10 left-0 w-72 bg-white rounded-xl border border-elora-400/10 shadow-2xl p-6 z-10 hover:-translate-y-2 transition-transform duration-300"
            >
              <h3 className="font-semibold text-sm mb-5">System Status</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-medium">Syncing SIS Data</span>
                    <span className="text-accent-green font-mono">98%</span>
                  </div>
                  <div className="h-2 w-full bg-elora-400/5 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-green w-[98%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-medium">Generating Insights</span>
                    <span className="text-accent-orange font-mono">45%</span>
                  </div>
                  <div className="h-2 w-full bg-elora-400/5 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-orange w-[45%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LogoStrip = () => {
  return (
    <section className="bg-elora-200 py-20 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-white/60 text-xs font-bold uppercase tracking-widest mb-10">
          Trusted by innovative schools worldwide
        </p>
        <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-80">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-center gap-2 text-white font-serif italic text-xl md:text-2xl"
            >
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20">
                <Shield className="w-4 h-4" />
              </div>
              Academy {i}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FinalCTA = () => {
  return (
    <section className="bg-elora-300 text-white py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-50"></div>
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-6xl font-sans font-medium mb-8 tracking-tight">
            Ready to transform your <br className="hidden md:block" />
            <span className="font-serif italic text-accent-pink">school's workflow?</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link to="/signup" className="block text-center w-full sm:w-auto bg-white text-elora-400 hover:bg-white/90 px-8 py-4 rounded-lg font-medium transition-all hover:-translate-y-0.5 shadow-xl">
              Get started for free
            </Link>
            <button className="w-full sm:w-auto bg-transparent border border-white/20 hover:bg-white/5 text-white px-8 py-4 rounded-lg font-medium transition-all hover:-translate-y-0.5">
              Talk to sales
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-elora-400 text-white/60 py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
        <div>
          <h4 className="text-white font-medium mb-5">Platform</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-5">Solutions</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">For Teachers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">For Admins</a></li>
            <li><a href="#" className="hover:text-white transition-colors">For Districts</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-5">Resources</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Webinars</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-5">Company</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/our-story" className="hover:text-white transition-colors">Our Story</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <div className="w-6 h-6 bg-elora-100 rounded flex items-center justify-center text-white font-serif italic font-bold">E</div>
          <span className="text-white font-medium text-sm">Elora</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <p>© 2026 Elora Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const Home = () => {
  return (
    <div className="min-h-screen bg-elora-400 selection:bg-elora-100 selection:text-white">
      <Header />
      <main>
        <Hero />
        <RoleSelectionSection />
        <FeatureSection />
        <ProductUISection />
        <LogoStrip />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

// ─── App / Router ─────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/our-story" element={<OurStoryPage />} />

      {/* Protected dashboard routes – ProtectedRoute redirects to /verify if not verified */}
      <Route
        path="/dashboard/teacher"
        element={
          <ProtectedRoute>
            <TeacherDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student"
        element={
          <ProtectedRoute>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/parent"
        element={
          <ProtectedRoute>
            <ParentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/play/:packId"
        element={
          <ProtectedRoute>
            <StudentGamePage />
          </ProtectedRoute>
        }
      />

      {/* Legacy /dashboard → teacher dashboard (backward compat) */}
      <Route path="/dashboard" element={<Navigate to="/dashboard/teacher" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
