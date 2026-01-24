import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getSession, refreshVerifiedFromServer, setGuest, setRole } from "@/lib/session";
import { motion } from "framer-motion";
import DashboardPreview from "../components/DashboardPreview";
import PersonaFeatures from "../components/PersonaFeatures";
import EloraStats from "../components/EloraStats";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

const ROLE_META = {
  educator: {
    label: "Teacher",
    headline: "Verify student work in seconds.",
    subcopy:
      "A calm teaching assistant that explains concepts in human language and generates classroom-ready materials.",
  },
  student: {
    label: "Student",
    headline: "Learn with clarity, not confusion.",
    subcopy:
      "Step-by-step guidance that adapts to your level, helps you fix mistakes, and builds confidence.",
  },
  parent: {
    label: "Parent",
    headline: "Support learning at home.",
    subcopy:
      "Simple explanations and practical next steps — so you can help without stress or overwhelm.",
  },
};

function StatusChip({ variant, children }) {
  const styles =
    variant === "good"
      ? "border-emerald-400/40 bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-950/40 dark:to-emerald-900/20 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-500/10"
      : variant === "warn"
        ? "border-amber-400/40 bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/40 dark:to-amber-900/20 text-amber-700 dark:text-amber-300 shadow-sm shadow-amber-500/10"
        : "border-slate-300/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-900/50 dark:to-slate-950/30 text-slate-600 dark:text-slate-300";

  const dot =
    variant === "good"
      ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
      : variant === "warn"
        ? "bg-amber-500 shadow-sm shadow-amber-500/50"
        : "bg-slate-400 dark:bg-slate-500";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm",
        styles
      )}
    >
      <span className={cn("h-2 w-2 rounded-full animate-pulse", dot)} />
      {children}
    </span>
  );
}

function HomePreview({ verified, teacher }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-700/50 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 backdrop-blur-xl hover:shadow-3xl hover:shadow-indigo-500/10 transition-shadow duration-500"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -inset-32 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/20 blur-3xl opacity-60 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 via-transparent to-transparent dark:from-white/5" />
      </div>

      <div className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-sm font-bold text-slate-950 dark:text-white tracking-tight">Elora Dashboard</div>
            <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Real-time insights for your learning journey
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <StatusChip variant={verified ? "good" : "warn"}>
              {verified ? "Email verified" : "Verify email"}
            </StatusChip>
            <StatusChip variant={teacher ? "good" : "neutral"}>
              {teacher ? "Teacher mode" : "Teacher tools locked"}
            </StatusChip>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="mt-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/30 p-5 backdrop-blur-sm shadow-lg shadow-slate-900/5 dark:shadow-black/20"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
              📊
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">View Full Dashboard</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track progress, teacher tools, and more</div>
            </div>
          </div>
        </motion.div>

        <div className="mt-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="font-bold text-slate-700 dark:text-slate-300">New:</span> Visualize your data with interactive charts.
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [role, setRoleState] = useState("educator");
  const [session, setSession] = useState(() => getSession());

  const verified = Boolean(session?.verified);
  const teacher = Boolean(session?.teacher);

  const [shake, setShake] = useState(false);

  const meta = useMemo(() => ROLE_META[role] || ROLE_META.educator, [role]);

  useEffect(() => {
    let mounted = true;

    const syncSessionVerification = async () => {
      try {
        await refreshVerifiedFromServer();
        if (!mounted) return;
        setSession(getSession());
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to refresh verification status", error);
        }
      }
    };

    syncSessionVerification();

    return () => {
      mounted = false;
    };
  }, []);

  const selectRole = (r) => {
    if (r === "educator" && !verified) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setRoleState(r);
  };

  const goVerify = () => {
    setRole(role);
    setGuest(false);
    router.push("/verify");
  };

  const goAssistant = () => {
    setRole(role);
    setGuest(false);
    router.push("/assistant");
  };

  return (
    <>
      <Head>
        <title>Elora — Teacher verification + calm AI assistant</title>
        <meta
          name="description"
          content="Elora helps teachers verify student work and explain concepts in clear, human language."
        />
      </Head>

      <div className="elora-page min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        {/* Cinematic background gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-500/10 blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[40%] right-[0%] w-[60vw] h-[60vw] rounded-full bg-purple-500/10 blur-[100px]"
          />
        </div>

        <div className="elora-container relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center py-8 lg:py-16 min-h-[90vh]">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-10"
            >
              <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl px-4 py-2.5 shadow-sm shadow-slate-900/5 dark:shadow-black/20">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">Genesis demo build</span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">•</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Secure verification + sessions</span>
              </div>

              <div className="space-y-6">
                <motion.h1
                  key={meta.headline}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-[clamp(2.5rem,5vw,5rem)] font-black tracking-tighter text-slate-950 dark:text-white leading-[1.05]"
                >
                  <span className="bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                    {meta.headline}
                  </span>
                </motion.h1>

                <motion.p
                  key={meta.subcopy}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg md:text-xl leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl font-medium"
                >
                  {meta.subcopy}
                </motion.p>
              </div>

              <div className="flex flex-wrap gap-3">
                {["educator", "student", "parent"].map((r) => {
                  const isBlocked = r === "educator" && !verified;
                  return (
                    <motion.button
                      key={r}
                      layout
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={isBlocked && shake ? { x: [-5, 5, -5, 5, 0] } : {}}
                      transition={isBlocked && shake ? { duration: 0.4 } : {}}
                      type="button"
                      onClick={() => selectRole(r)}
                      className={cn(
                        "rounded-full border px-6 py-3 text-sm font-bold transition-colors duration-200 shadow-sm relative overflow-hidden",
                        role === r
                          ? "border-indigo-500/60 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                          : "border-slate-300/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
                      )}
                    >
                      {/* Tooltip for blocked educator role */}
                      {isBlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-white text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity">
                          Verify Email First
                        </div>
                      )}
                      {ROLE_META[r].label}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {/* Enhanced Primary CTA with glow effect */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="elora-cta-primary text-base"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>🚀</span>
                    Go to Dashboard
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={verified ? () => router.push("/dashboard") : goVerify}
                  className="rounded-2xl border-2 border-slate-300/60 dark:border-slate-600/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-6 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 shadow-lg shadow-slate-900/5"
                >
                  {verified ? "Open Dashboard" : "Verify Email →"}
                </motion.button>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", verified ? "bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.3)]" : "bg-amber-500")} />
                  {verified ? "Verified Session" : "Unverified"}
                </div>
                {teacher && (
                  <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_2px_rgba(99,102,241,0.3)]" />
                    Teacher Mode Active
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Dashboard Preview with 3D glassmorphism */}
            <div className="relative lg:pl-8">
              <DashboardPreview />
            </div>
          </div>

          {/* Elora Platform Stats */}
          <EloraStats />

          {/* Persona-specific Features Section */}
          <PersonaFeatures />
        </div>
      </div>
    </>
  );
}
