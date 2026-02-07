import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getSession, isTeacher, refreshVerifiedFromServer, setGuest, setRole } from "@/lib/session";
import { motion } from "framer-motion";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" } })
};

function Chip({ variant, children }) {
  const styles =
    variant === "good"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : variant === "warn"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-slate-800/50 text-slate-400 border-slate-700/50";

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md", styles)}>
      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", variant === "good" ? "bg-emerald-400" : variant === "warn" ? "bg-amber-400" : "bg-slate-500")} />
      {children}
    </span>
  );
}

function StepCard({ num, title, desc, status, actionLabel, onAction, disabled, index }) {
  const isDone = status === "done";
  const isLocked = status === "locked";

  return (
    <motion.div
      custom={index}
      variants={fadeIn}
      className={cn(
        "relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 group",
        isLocked
          ? "bg-slate-900/20 border-slate-800/50 opacity-60 grayscale"
          : "bg-white/5 border-white/10 hover:border-indigo-500/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-indigo-500/10"
      )}
    >
      {/* Connector Line for Timeline Effect */}
      <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-slate-800 to-transparent -z-10" />

      <div className="flex items-start gap-5 relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 border shadow-inner transition-colors",
          isDone ? "bg-emerald-500 text-white border-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"
        )}>
          {isDone ? "✓" : num}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className={cn("text-lg font-bold", isLocked ? "text-slate-500" : "text-white")}>{title}</h3>
            {isDone && <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Completed</span>}
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-sm">{desc}</p>

          {actionLabel && (
            <button
              onClick={onAction}
              disabled={disabled}
              className={cn(
                "w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                disabled
                  ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95"
              )}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RoleCard({ title, desc, icon, tone, primaryLabel, secondaryLabel, onPrimary, onSecondary, index }) {
  const gradients = {
    indigo: "from-indigo-600 via-violet-600 to-indigo-600",
    sky: "from-sky-500 via-cyan-500 to-sky-500",
    emerald: "from-emerald-500 via-teal-500 to-emerald-500"
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      variants={fadeIn}
      viewport={{ once: true }}
      className="relative group rounded-[2.5rem] p-[1px] bg-gradient-to-b from-white/10 to-transparent hover:from-white/20 transition-all overflow-hidden h-full"
    >
      <div className="absolute inset-0 bg-slate-950 rounded-[2.5rem]" />
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[tone]} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

      <div className="relative z-10 h-full bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>

        <h3 className="text-2xl font-black text-white mb-3">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-8 flex-1">{desc}</p>

        <div className="w-full space-y-3">
          <button
            onClick={onPrimary}
            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl bg-gradient-to-r ${gradients[tone]} hover:shadow-2xl hover:brightness-110 transition-all active:scale-95`}
          >
            {primaryLabel}
          </button>

          {secondaryLabel && (
            <button
              onClick={onSecondary}
              className="w-full py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function DemoPage() {
  const router = useRouter();
  const [session, setSessionState] = useState(() => getSession());
  const verified = Boolean(session?.verified);
  const teacher = Boolean(isTeacher());

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refreshVerifiedFromServer();
      if (!mounted) return;
      setSessionState(getSession());
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const demoMsg = useMemo(() => {
    return "Explain photosynthesis in 4 short steps for a Secondary student, add 1 simple example, then end with 2 quick check questions.";
  }, []);

  function setPostVerifyRedirect(path) {
    try {
      window.localStorage.setItem("elora_post_verify_redirect_v1", String(path || "/assistant"));
    } catch { }
  }

  async function chooseRole(role) {
    setRole(role);
    setGuest(false);

    if (role === "educator") {
      if (verified) {
        router.push("/assistant");
        return;
      }
      setPostVerifyRedirect("/assistant");
      router.push("/verify");
      return;
    }
    router.push("/assistant");
  }

  const step1 = verified ? "done" : "next";
  const step2 = !verified ? "locked" : teacher ? "done" : "next";
  const step3 = !verified ? "locked" : "next";
  const step4 = !verified ? "locked" : "next";

  return (
    <>
      <Head>
        <title>Experience Elora | Premium Demo</title>
      </Head>

      <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 font-sans pb-20 overflow-x-hidden">
        {/* Cinematic Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 blur-[128px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[128px] rounded-full animate-pulse" style={{ animationDuration: '7s' }} />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Header */}
          <header className="pt-12 pb-20 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500">
                Start Your<br />Journey.
              </h1>
              <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                Experience the future of education logic. Choose a persona to explore Elora&apos;s adaptive capabilities instantly.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex gap-3 bg-white/5 p-2 rounded-2xl backdrop-blur-md border border-white/10"
            >
              <Chip variant={verified ? "good" : "warn"}>{verified ? "Verified User" : "Unverified Guest"}</Chip>
              <Chip variant={teacher ? "good" : "neutral"}>{teacher ? "Educator Unlocked" : "Standard Access"}</Chip>
            </motion.div>
          </header>

          {/* Role Section */}
          <section className="mb-24">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-8 text-center md:text-left"
            >
              Select Your Interface
            </motion.h2>

            <motion.div
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-3 gap-6"
            >
              <RoleCard
                index={0}
                title="Educator"
                icon="👩‍🏫"
                tone="indigo"
                desc="Access powerful tools for lesson planning, grading, and curriculum alignment. Requires verification."
                primaryLabel={verified ? "Launch Workspace" : "Verify & Launch"}
                secondaryLabel={verified ? null : "Preview Mode"}
                onPrimary={() => chooseRole("educator")}
                onSecondary={() => chooseRole("student")}
              />
              <RoleCard
                index={1}
                title="Student"
                icon="🎓"
                tone="sky"
                desc="Adaptive tutoring that guides without giving away answers. Perfect for homework help."
                primaryLabel="Start Learning"
                onPrimary={() => chooseRole("student")}
                onSecondary={() => { }}
              />
              <RoleCard
                index={2}
                title="Parent"
                icon="🏡"
                tone="emerald"
                desc="Monitor progress and get simple, actionable insights to support your child's journey."
                primaryLabel="View Dashboard"
                onPrimary={() => chooseRole("parent")}
                onSecondary={() => { }}
              />
            </motion.div>
          </section>

          {/* Demo Checklist Section */}
          <section className="relative">
            <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">Live Demo Flow</h2>
                <p className="text-sm text-slate-400">Follow these steps to experience the full platform capabilities.</p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="hidden md:block px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Return Home
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StepCard
                index={3}
                num={1}
                title="Identity Verification"
                desc="Secure your account to enable progress tracking and persistent sessions."
                status={step1}
                actionLabel={verified ? "Verified" : "Verify Email"}
                onAction={() => router.push(verified ? "/assistant" : "/verify")}
                disabled={verified}
              />
              <StepCard
                index={4}
                num={2}
                title="Educator Access"
                desc="Unlock the Teacher Dashboard with your invite code (e.g. GENESIS2026)."
                status={step2}
                actionLabel={teacher ? "Unlocked" : "Enter Code"}
                onAction={() => router.push("/assistant?demo=1&unlockTeacher=1")}
                disabled={!verified || teacher}
              />
              <StepCard
                index={5}
                num={3}
                title="AI Lesson Gen"
                desc="Generate a complete lesson plan with examples in one click."
                status={step3}
                actionLabel="Generate"
                onAction={() => router.push(`/assistant?demo=1&demoRole=educator&demoMsg=${encodeURIComponent(demoMsg)}`)}
                disabled={!verified}
              />
              <StepCard
                index={6}
                num={4}
                title="Export & Share"
                desc="Download your generated materials as PDF or DOCX for classroom use."
                status={step4}
                actionLabel="Export"
                onAction={() => router.push("/assistant?demo=1")}
                disabled={!verified}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
