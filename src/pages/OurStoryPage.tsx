import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Target, 
  Shield, 
  Heart,
  Zap,
  CheckCircle2,
  Users,
  Smile,
  BookOpen
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
        {/* HERO SECTION */}
        <section className="relative py-24 md:py-32 overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-grid pointer-events-none opacity-50"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl"
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-white/90 mb-8 backdrop-blur-sm">
                <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-accent-green" />
                Verified Education Partner
              </div>
              <h1 className="text-5xl md:text-8xl font-sans font-medium mb-8 tracking-tighter leading-[1.05]">
                The future of learning is humans, <br />
                <span className="font-serif italic text-accent-pink">powered by AI.</span>
              </h1>
              <p className="text-white/80 text-lg md:text-2xl max-w-3xl leading-relaxed font-light">
                Helping teachers reclaim their time, students find their focus, and parents stay connected to every single breakthrough.
              </p>
            </motion.div>
          </div>
        </section>

        {/* WHY WE BUILT ELORA */}
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
                  desc: 'Privacy-first architecture ensures student data remains protected and private.',
                  color: 'text-accent-blue',
                  bg: 'bg-accent-blue/10'
                },
                { 
                  icon: Sparkles, 
                  title: 'Clarity', 
                  desc: 'Turning complex data into clear, honest progress reports for every family.',
                  color: 'text-accent-yellow',
                  bg: 'bg-accent-yellow/10'
                },
                { 
                  icon: Heart, 
                  title: 'Human-first', 
                  desc: 'Empowering teachers and families to core human connection, not just tools.',
                  color: 'text-accent-pink',
                  bg: 'bg-accent-pink/10'
                },
                { 
                  icon: Zap, 
                  title: 'Calm', 
                  desc: 'Reducing cognitive load through a decluttered, reassuring user experience.',
                  color: 'text-accent-orange',
                  bg: 'bg-accent-orange/10'
                }
              ].map((pill, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
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
          </div>
        </section>

        {/* OUR PROMISE */}
        <section className="py-40 bg-elora-300 relative border-t border-white/10">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
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
              <p className="text-white/50 text-base max-w-xl mx-auto leading-relaxed italic font-serif">
                We promise to keep building tools that respect your time, protect your privacy, and celebrate every human achievement in the classroom.
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default OurStoryPage;
