import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Target,
  Shield,
  Heart,
  Zap,
  CheckCircle2,
  Users,
  Smile,
  BookOpen,
  ArrowLeft,
  Layout,
  FileText,
  Clock
} from 'lucide-react';
import { Header, Footer } from '../App';

const OurStoryPage = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-elora-400 text-white selection:bg-elora-100 selection:text-white">
      <Header />

      <main className="pt-20">
        {/* TOP BREADCRUMB */}
        <div className="max-w-7xl mx-auto px-6 pt-12">
          <Link
            to="/"
            className="inline-flex items-center text-white/40 hover:text-white/80 transition-colors text-xs font-bold uppercase tracking-widest gap-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to homepage
          </Link>
        </div>

        {/* HERO SECTION */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-grid pointer-events-none opacity-50"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-white/90 mb-8 backdrop-blur-sm">
                <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-accent-green" />
                Verified Education Partner
              </div>
              <h1 className="text-5xl md:text-8xl font-sans font-medium mb-8 tracking-tighter leading-[1.05]">
                Where teachers, students, and parents <br />
                <span className="font-serif italic text-accent-pink">finally speak the same language.</span>
              </h1>
              <p className="text-white/80 text-lg md:text-2xl max-w-3xl leading-relaxed font-light">
                Learning shouldn't be a black box. We've built Elora to bring calm, clarity, and intelligence to the classroom experience.
              </p>
            </motion.div>
          </div>
        </section>

        {/* WHY NOW SECTION */}
        <section className="py-24 bg-elora-400 border-b border-white/10 relative">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="mb-16">
              <p className="text-accent-orange text-xs font-bold uppercase tracking-widest mb-4">The Challenge</p>
              <h2 className="text-3xl md:text-5xl font-sans font-medium tracking-tight mb-6">
                Learning dashboards weren’t built for trust.
              </h2>
              <p className="text-white/50 text-lg max-w-2xl font-light">
                Most current tools focus on data capture, not human clarity. Between overwhelming interfaces and silent portals, the connection between school and home is often lost.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Layout,
                  title: 'Overwhelming Dashboards',
                  desc: 'Endless charts and complex metrics that often hide the real human progress happening in the classroom.',
                  color: 'text-accent-pink'
                },
                {
                  icon: FileText,
                  title: 'Ignored Parent Portals',
                  desc: 'Static, outdated reports and buried information that leave families guessing about their child’s growth.',
                  color: 'text-accent-orange'
                },
                {
                  icon: Clock,
                  title: 'Administrative Overload',
                  desc: 'Teachers spending more time navigating clunky software and inputting data than actually teaching.',
                  color: 'text-accent-yellow'
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/5 space-y-4"
                >
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                  <h3 className="text-xl font-medium">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FOUR PILLARS */}
        <section className="py-24 bg-elora-300 border-b border-white/10 relative">
          <div className="absolute inset-0 bg-grid-dark pointer-events-none opacity-20"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="mb-16">
              <p className="text-accent-yellow text-xs font-bold uppercase tracking-widest mb-4">The Foundation</p>
              <h2 className="text-3xl md:text-5xl font-sans font-medium tracking-tight">Why we built Elora</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Shield,
                  title: 'Trust',
                  desc: 'Privacy-first architecture ensures student data remains fully protected and private at all times.',
                  color: 'text-accent-green',
                  bg: 'bg-accent-green/10'
                },
                {
                  icon: Sparkles,
                  title: 'Clarity',
                  desc: 'Turning complex data into clear, honest, and actionable progress reports for every single family.',
                  color: 'text-accent-yellow',
                  bg: 'bg-accent-yellow/10'
                },
                {
                  icon: Heart,
                  title: 'Human-first',
                  desc: 'Empowering teachers and families to restore core human connection, not just tools.',
                  color: 'text-accent-pink',
                  bg: 'bg-accent-pink/10'
                },
                {
                  icon: Zap,
                  title: 'Calm',
                  desc: 'Reducing cognitive load through a decluttered, reassuring, and intentional user experience.',
                  color: 'text-accent-orange',
                  bg: 'bg-accent-orange/10'
                }
              ].map((pill, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-3xl bg-elora-400 border border-white/5 space-y-4 hover:border-white/10 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-2xl ${pill.bg} flex items-center justify-center border border-white/5`}>
                    <pill.icon className={`w-6 h-6 ${pill.color}`} />
                  </div>
                  <h3 className="text-xl font-medium">{pill.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {pill.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* THE ELORA EXPERIENCE */}
        <section className="py-32 bg-elora-400 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-sans font-medium mb-6 tracking-tight">
                Built for every <span className="font-serif italic text-accent-pink">perspective.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  role: 'Teachers',
                  icon: Users,
                  text: 'Elora handles the grading and administrative drift, giving you back hours to focus on your students.',
                  tag: 'Co-Pilot'
                },
                {
                  role: 'Students',
                  icon: BookOpen,
                  text: 'An assistant that knows exactly where you are and what you need next to reach your goals.',
                  tag: 'Guide'
                },
                {
                  role: 'Parents',
                  icon: Smile,
                  text: 'No more guessing. Get a calm, clear window into your child’s day and learning milestones.',
                  tag: 'Advocate'
                }
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="relative p-10 rounded-[2.5rem] bg-elora-300 border border-white/10 overflow-hidden group hover:bg-elora-200 transition-colors"
                >
                  <div className="absolute top-8 right-8 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    {card.tag}
                  </div>
                  <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-serif italic mb-4">{card.role}</h3>
                  <p className="text-white/70 leading-relaxed font-light">
                    {card.text}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* EARLY TESTER SHOWCASE */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex justify-center mt-12 md:mt-16"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm group hover:border-white/20 transition-colors cursor-default">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-pink/20 to-accent-orange/20 border border-white/10 flex items-center justify-center text-[9px] font-bold text-white/40">
                  AK
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white/60">Adila Khan</span>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Early Tester</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* OUR PROMISE */}
        <section className="py-40 bg-elora-300 relative border-t border-white/10">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <p className="text-accent-yellow text-xs font-bold uppercase tracking-widest">Our Promise</p>
              <h2 className="text-4xl md:text-6xl font-sans font-medium tracking-tight leading-tight">
                A calmer way to understand <br />
                <span className="font-serif italic text-accent-pink">learning, together.</span>
              </h2>
              <div className="w-20 h-px bg-white/20 mx-auto"></div>
              <p className="text-white/70 text-base max-w-2xl mx-auto leading-relaxed font-serif">
                As a student in Singapore, I saw the gap between those who can afford help and those who can’t. I founded Elora to end the era of “dashboard fatigue.” Our goal is to handle the complexity of learning management so that teachers and parents can return to what they do best — mentoring and supporting. Less data-entry, more real connection.
              </p>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                — Shaik Haris, Founder & CEO of Elora
              </p>

              <div className="pt-12">
                <Link
                  to="/"
                  className="inline-flex items-center px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-sm font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  Return to homepage
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default OurStoryPage;

