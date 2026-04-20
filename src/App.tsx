// src/App.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts';
import {
  CheckCircle2, Clock, Users, BookOpen, MessageSquare, BarChart3, Shield,
  Sparkles, Menu, X, ChevronRight, Mail, GraduationCap, Heart
} from 'lucide-react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherClassroomPage from './pages/TeacherClassroomPage';
import TeacherCopilotPage from './pages/TeacherCopilotPage';
import TeacherPracticePage from './pages/TeacherPracticePage';
import TeacherAssignmentCreatePage from './pages/TeacherAssignmentCreatePage';
import StudentCopilotPage from './pages/StudentCopilotPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentClassroomPage from './pages/StudentClassroomPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import ParentClassroomPage from './pages/ParentClassroomPage';
import ParentCopilotPage from './pages/ParentCopilotPage';
import InternalCopilotInsightsPage from './pages/InternalCopilotInsightsPage';
import StudentShellLayout from './components/layout/StudentShellLayout';
import ParentShellLayout from './components/layout/ParentShellLayout';
import TeacherShellLayout from './components/layout/TeacherShellLayout';
import OurStoryPage from './pages/OurStoryPage';
import VerifyPage from './pages/VerifyPage';
import ProtectedRoute from './components/ProtectedRoute';
import StudentGamePage from './pages/StudentGamePage';
import AuthGateDemoPage from './pages/AuthGateDemoPage';
import { EloraLogo } from './components/EloraLogo';
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
          <Sparkles className="w-3.5 h-3.5 mr-2 text-[#DDB76A] shrink-0" />
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
        <div className="flex flex-1 items-center gap-2 cursor-pointer text-white">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <EloraLogo className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight">Elora</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-8 text-sm font-medium text-white/80">
          <a href="#features" className="hover:text-white transition-colors">Platform</a>
          <a href="#roles" className="hover:text-white transition-colors">Roles</a>
          <a href="#pilot" className="hover:text-white transition-colors">Pilot</a>
          <Link to="/our-story" className="hover:text-white transition-colors">Story</Link>
        </nav>

        <div className="hidden md:flex flex-1 justify-end items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Log in</Link>
          <Link to="/signup" className="bg-white text-elora-400 px-4 py-2 rounded-md text-sm font-medium hover:bg-white/90 transition-colors shadow-sm hover:shadow block">
            Create account
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-elora-400 border-b border-white/10 px-6 py-4 space-y-4">
          <a href="#features" onClick={() => setIsOpen(false)} className="block text-white/80 hover:text-white font-medium">Platform</a>
          <a href="#roles" onClick={() => setIsOpen(false)} className="block text-white/80 hover:text-white font-medium">Roles</a>
          <a href="#pilot" onClick={() => setIsOpen(false)} className="block text-white/80 hover:text-white font-medium">Pilot</a>
          <Link to="/our-story" onClick={() => setIsOpen(false)} className="block text-white/80 hover:text-white font-medium">Story</Link>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link to="/login" onClick={() => setIsOpen(false)} className="block text-white/80 hover:text-white font-medium text-center">Log in</Link>
            <Link to="/signup" onClick={() => setIsOpen(false)} className="block w-full bg-white text-elora-400 px-4 py-2 rounded-md text-sm font-medium text-center">
              Create account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

// ─── 1) Hero ──────────────────────────────────────────────────────────────────

const Hero = () => {
  return (
    <section id="hero" className="relative bg-elora-400 text-white pt-32 pb-24 border-b border-white/10 overflow-hidden min-h-[90vh] flex items-center">
      <div className="absolute inset-0 bg-grid pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
        <div>
          <ComingSoonBar />
          <h1 className="text-5xl md:text-7xl font-sans font-medium tracking-tight leading-[1.05] mb-6">
            The intelligent <br />
            <span className="font-serif italic text-elora-100">platform</span> for education
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-xl leading-relaxed">
            Connect your classrooms and restore calm to the learning experience. Built to handle administrative drift so you can focus on what matters: mentoring and supporting.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#roles"
              className="bg-white text-elora-400 px-8 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg"
            >
              Explore role demos
            </a>
            <Link
              to="/our-story"
              className="flex items-center justify-center bg-transparent hover:bg-white/5 text-white px-8 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5 border border-white/20"
            >
              Our Story
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

// ─── 2) Tour ──────────────────────────────────────────────────────────────────

const PerspectivesSection = () => {
  const perspectives = [
    {
      title: 'Teacher',
      subtitle: 'Co-Pilot',
      icon: Users,
      color: 'text-accent-orange',
      bg: 'bg-accent-orange/20',
      border: 'border-accent-orange/20',
      bullets: [
        'Draft unit plans and lesson outlines in minutes.',
        'Triage which students are behind from messy data.',
        'Generate respectful parent email drafts you can edit.',
      ],
      link: '/teacher/demo',
      cta: 'Enter Teacher Demo'
    },
    {
      title: 'Student',
      subtitle: 'Guide',
      icon: BookOpen,
      color: 'text-accent-green',
      bg: 'bg-accent-green/20',
      border: 'border-accent-green/20',
      bullets: [
        'Ask questions and get explanations at your level.',
        'Practise with step-by-step study mode.',
        'Get quick recaps of what you have learned.',
      ],
      link: '/student/demo',
      cta: 'Enter Student Demo'
    },
    {
      title: 'Parent',
      subtitle: 'Advocate',
      icon: Shield,
      color: 'text-accent-pink',
      bg: 'bg-accent-pink/20',
      border: 'border-accent-pink/20',
      bullets: [
        'Prepare for parent-teacher meetings with a simple guide.',
        'Turn concerns into clear next steps.',
        'Understand school updates without dashboard overload.',
      ],
      link: '/parent/demo',
      cta: 'Enter Parent Demo'
    },
  ];

  return (
    <section id="roles" className="bg-elora-400 text-white py-32 border-b border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-40"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-[#DDB76A] text-xs font-bold uppercase tracking-widest mb-4">One Platform</p>
          <h2 className="text-4xl md:text-5xl font-sans font-medium mb-6 tracking-tight">
            One platform. <span className="font-serif italic text-accent-pink">Three perspectives.</span>
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Choose a profile below to experience the end-to-end flow exactly as it's used in the classroom. Jump straight into the live dashboard environment—no signup required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 perspective-1000">
          {perspectives.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, rotateX: 8 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-xl hover:-translate-y-2 duration-300 flex flex-col min-h-[430px]"
            >
              <div className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {p.subtitle}
              </div>
              <div className={`w-12 h-12 ${p.bg} ${p.color} rounded-xl flex items-center justify-center mb-6 border ${p.border} group-hover:scale-110 transition-transform`}>
                <p.icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-medium mb-3 text-white">{p.title}</h3>
              <ul className="text-white/60 text-sm leading-relaxed mb-10 flex-grow space-y-2">
                {p.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                to={p.link}
                className="inline-flex items-center gap-2 text-[#DDB76A] font-bold text-sm hover:gap-3 transition-all mt-auto"
              >
                {p.cta} <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── 4) Features ──────────────────────────────────────────────────────────────

const ProductUISection = () => {
  return (
    <section id="features" className="bg-elora-100 text-elora-400 py-32 border-b border-elora-400/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark pointer-events-none opacity-20"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-elora-300 text-xs font-bold uppercase tracking-widest mb-4 opacity-60">Platform</p>
            <h2 className="text-4xl md:text-5xl font-sans font-medium mb-6 tracking-tight">
              Copilot workflows that turn <span className="font-serif italic text-white">school data into action.</span>
            </h2>
            <p className="text-elora-400/80 text-lg mb-8">
              Elora is a multi-role Copilot for teachers, students, and parents. It helps each role move from raw information to next steps they can actually use.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                'Teacher Copilot: from raw assessment data to simple, human-readable summaries.',
                'Student Copilot: guided study sessions that adjust based on your answers.',
                'Parent Copilot: structured conversations that turn worries into action plans.',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-medium">
                  <div className="w-6 h-6 rounded-full bg-elora-200 flex items-center justify-center text-white">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-elora-400/70 text-sm mb-8">
              Every Copilot conversation feeds back into internal insights so teams can see what is working and where to improve.
            </p>
            <a
              href="#pilot"
              className="inline-block bg-elora-400 text-white px-6 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg"
            >
              See how it works
            </a>
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

const SafetyTrustSection = () => {
  return (
    <section className="bg-elora-300 text-white py-14 border-y border-white/10 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
          <p className="text-accent-yellow text-xs font-bold uppercase tracking-widest mb-4">Safety and Trust</p>
          <h3 className="text-2xl md:text-3xl font-sans font-medium tracking-tight mb-6">
            Guardrails first, improvement by feedback.
          </h3>
          <ul className="space-y-3 text-white/80 text-sm md:text-base">
            <li>Elora never predicts grades or exam scores.</li>
            <li>Teacher, student, and parent spaces are role-scoped; Elora does not share one student&apos;s data in another conversation.</li>
            <li>Your feedback helps Elora adjust how it explains and how long it responds.</li>
            <li>Adaptation uses bounded signals and does not train on sensitive content in uncontrolled ways.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

// ─── 5) Pilot ─────────────────────────────────────────────────────────────────

const PilotProgramSection = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="pilot" className="bg-elora-400 text-white py-32 border-b border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-30"></div>
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-16 border border-white/20 shadow-[0_0_50px_rgba(141,118,154,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DDB76A] to-transparent opacity-50"></div>
            <div className="w-24 h-24 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-accent-green/5">
              <CheckCircle2 className="w-12 h-12 text-accent-green" />
            </div>
            <h3 className="text-4xl font-serif italic mb-6">You're on the list!</h3>
            <p className="text-white/80 text-lg max-w-sm mx-auto leading-relaxed">
              We've received your interest. Shaik will reach out shortly to discuss bringing Elora to your classroom.
            </p>
            <div className="mt-10 pt-10 border-t border-white/10">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Singapore Pilot Program 2024</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
          {/* Verified Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-accent-green" />
              Verified Education Partner
            </div>
          </div>

          <div>
            <p className="text-[#DDB76A] text-xs font-bold uppercase tracking-widest mb-4">Singapore Pilot</p>
            <h2 className="text-4xl md:text-6xl font-sans font-medium tracking-tight leading-tight mb-6">
              The Elora <span className="font-serif italic text-accent-pink">Pilot</span> Program.
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              I'm looking for 5 innovative classrooms in Singapore to help shape the future of Elora. Join a community moving away from <span className="font-serif italic">dashboard fatigue</span> and toward human-first learning.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-left">
            {[
              { icon: GraduationCap, label: '5 Classrooms', sub: 'Singapore-based schools' },
              { icon: Heart, label: 'Human-first', sub: 'Mentor, don\'t manage' },
              { icon: Sparkles, label: 'Shape Elora', sub: 'Direct product input' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <item.icon className="w-5 h-5 text-[#DDB76A] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Waitlist Form */}
          <div className="max-w-md mx-auto pt-4">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-white/60 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@school.edu.sg"
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all text-sm shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-elora-400 px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#DDB76A] hover:text-[#28193D] transition-all hover:-translate-y-1 shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? 'Joining...' : 'Join the Waitlist'}
              </button>
            </form>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mt-4 text-center">No commitment required. We respect your privacy.</p>
          </div>
        </motion.div>
        )}
      </div>
    </section>
  );
};

// ─── 6) Story / Founder ───────────────────────────────────────────────────────

const FounderSection = () => {
  return (
    <section id="story" className="py-40 bg-elora-300 text-white relative border-t border-white/10">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <p className="text-[#DDB76A] text-xs font-bold uppercase tracking-widest">Built with a Vision</p>
          <h2 className="text-4xl md:text-6xl font-sans font-medium tracking-tight leading-tight">Why Elora exists</h2>
          <div className="w-20 h-px bg-white/20 mx-auto"></div>
          <p className="text-white/70 text-base max-w-2xl mx-auto leading-relaxed">
            Elora started from a simple frustration: teachers drowning in dashboards instead of spending time with students.
          </p>
          <p className="text-white/60 text-sm max-w-2xl mx-auto leading-relaxed">
            Read the full story to see how that frustration became a multi-role Copilot for teachers, students, and parents.
          </p>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
            — <a href="https://www.linkedin.com/in/shaik-haris-107b45391/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white transition-colors">Shaik Haris</a>, Founder & CEO of Elora
          </p>

          <div className="pt-4">
            <Link
              to="/our-story"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-sm font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              Read the full story
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ─── 7) Final CTA ─────────────────────────────────────────────────────────────

const FinalCTA = () => {
  return (
    <section id="cta" className="bg-elora-300 text-white py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-50"></div>
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-6xl font-sans font-medium mb-8 tracking-tight">
            Education as it <br className="hidden md:block" />
            <span className="font-serif italic text-accent-pink">should be.</span>
          </h2>
          <p className="text-white/70 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Start with the role that matters most to you: Teacher, Student, or Parent, and expand into the rest when you are ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/signup"
              className="flex items-center justify-center w-full sm:w-auto bg-white text-elora-400 hover:bg-white/90 px-10 py-4 rounded-xl font-bold transition-all hover:-translate-y-1 shadow-2xl"
            >
              Get Started for Free
            </Link>
            <Link
              to="/our-story"
              className="flex items-center justify-center w-full sm:w-auto bg-white/5 border border-white/20 hover:bg-white/10 text-white px-10 py-4 rounded-xl font-medium transition-all hover:-translate-y-1"
            >
              Read Our Vision
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────

export const Footer = () => {
  return (
    <footer className="bg-elora-400 text-white/60 py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
        <div>
          <h4 className="text-white font-medium mb-5">Product</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#features" className="hover:text-white transition-colors">Platform</a></li>
            <li><a href="#roles" className="hover:text-white transition-colors">Roles</a></li>
            <li><a href="#pilot" className="hover:text-white transition-colors">Pilot Program</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-5">Company</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/our-story" className="hover:text-white transition-colors">Our Story</Link></li>
            <li>
              <a
                href="https://www.linkedin.com/in/shaikharis/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-5">Demos</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/teacher/demo" className="hover:text-white transition-colors">Teacher Demo</Link></li>
            <li><Link to="/student/demo" className="hover:text-white transition-colors">Student Demo</Link></li>
            <li><Link to="/parent/demo" className="hover:text-white transition-colors">Parent Demo</Link></li>
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-2.5 text-white mb-4">
            <EloraLogo className="w-7 h-7" />
            <span className="font-bold text-lg tracking-tight">Elora</span>
          </div>
          <p className="text-xs text-white/40 leading-relaxed">
            Building human-first learning management for Singapore's classrooms.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 text-white mb-4 md:mb-0">
          <EloraLogo className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight">Elora</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <p>© 2026 Elora. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// ─── Home Page ────────────────────────────────────────────────────────────────

const Home = () => {
  return (
    <div className="min-h-screen bg-elora-400 selection:bg-elora-100 selection:text-white">
      <Header />
      <main>
        <Hero />
        <PerspectivesSection />
        <ProductUISection />
        <SafetyTrustSection />
        <PilotProgramSection />
        <FounderSection />
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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/our-story" element={<OurStoryPage />} />
      <Route path="/auth-gate-demo" element={<AuthGateDemoPage />} />

      {/* Demo routes – no auth required */}
      <Route path="/teacher/demo" element={<TeacherShellLayout />}>
        <Route index element={<TeacherDashboardPage embeddedInShell />} />
        <Route path="classes" element={<TeacherDashboardPage activeTab="classes" embeddedInShell />} />
        <Route path="assignments" element={<TeacherDashboardPage activeTab="assignments" embeddedInShell />} />
        <Route path="assignments/new" element={<TeacherAssignmentCreatePage />} />
        <Route path="practice" element={<TeacherPracticePage />} />
        <Route path="class/:classId" element={<TeacherClassroomPage embeddedInShell />} />
        <Route path="copilot" element={<TeacherCopilotPage embeddedInShell />} />
      </Route>
      <Route path="/teacher/copilot/demo" element={<Navigate to="/teacher/demo/copilot" replace />} />
      <Route path="/student/demo" element={<StudentShellLayout />}>
        <Route index element={<StudentDashboardPage embeddedInShell />} />
        <Route path="classes" element={<StudentDashboardPage activeTab="classes" embeddedInShell />} />
        <Route path="assignments" element={<StudentDashboardPage activeTab="assignments" embeddedInShell />} />
        <Route path="class/:classId" element={<StudentClassroomPage />} />
        <Route path="copilot" element={<StudentCopilotPage embeddedInShell />} />
      </Route>
      <Route path="/student/copilot/demo" element={<Navigate to="/student/demo/copilot" replace />} />
      <Route path="/parent/demo" element={<ParentShellLayout />}>
        <Route index element={<ParentDashboardPage embeddedInShell />} />
        <Route path="child/:childId/class/:classId" element={<ParentClassroomPage />} />
        <Route path="copilot" element={<ParentCopilotPage embeddedInShell />} />
      </Route>
      <Route path="/parent/copilot/demo" element={<Navigate to="/parent/demo/copilot" replace />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<TeacherShellLayout />}>
          <Route path="/dashboard/teacher" element={<TeacherDashboardPage embeddedInShell />} />
          <Route path="/teacher" element={<Navigate to="/dashboard/teacher" replace />} />
          <Route path="/teacher/overview" element={<Navigate to="/dashboard/teacher" replace />} />
          <Route path="/teacher/classes" element={<TeacherDashboardPage activeTab="classes" embeddedInShell />} />
          <Route path="/teacher/assignments" element={<TeacherDashboardPage activeTab="assignments" embeddedInShell />} />
          <Route path="/teacher/assignments/new" element={<TeacherAssignmentCreatePage />} />
          <Route path="/teacher/practice" element={<TeacherPracticePage />} />
          <Route path="/teacher/classes/:classId" element={<TeacherClassroomPage embeddedInShell />} />
          <Route path="/teacher/work" element={<Navigate to="/dashboard/teacher" replace />} />
          <Route path="/teacher/copilot" element={<TeacherCopilotPage embeddedInShell />} />
          <Route path="/teacher/reports" element={<Navigate to="/dashboard/teacher#reports" replace />} />
        </Route>

        <Route element={<StudentShellLayout />}>
          <Route path="/dashboard/student" element={<StudentDashboardPage embeddedInShell />} />
          <Route path="/student/classes" element={<StudentDashboardPage activeTab="classes" embeddedInShell />} />
          <Route path="/student/class/:classId" element={<StudentClassroomPage />} />
          <Route path="/student/assignments" element={<StudentDashboardPage activeTab="assignments" embeddedInShell />} />
          <Route path="/student/copilot" element={<StudentCopilotPage embeddedInShell />} />
        </Route>

        <Route element={<ParentShellLayout />}>
          <Route path="/dashboard/parent" element={<ParentDashboardPage embeddedInShell />} />
          <Route path="/parent/child/:childId/class/:classId" element={<ParentClassroomPage />} />
          <Route path="/parent/copilot" element={<ParentCopilotPage embeddedInShell />} />
        </Route>
        <Route path="/internal/copilot-insights" element={<InternalCopilotInsightsPage />} />
        <Route path="/play/:packId" element={<StudentGamePage />} />
      </Route>

      {/* Legacy /dashboard → teacher dashboard (backward compat) */}
      <Route path="/dashboard" element={<Navigate to="/dashboard/teacher" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
