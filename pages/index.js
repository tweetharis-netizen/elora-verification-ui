import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getSession, refreshVerifiedFromServer, setGuest, setRole } from "../lib/session";
import { cn } from "@/lib/utils";

const ROLE_META = {
  educator: {
    label: "Teacher",
    headline: "Elora helps teachers verify student work in seconds.",
    subcopy:
      "A calm teaching assistant that explains concepts in human language and generates classroom-ready materials — without prompt wrestling.",
  },
  student: {
    label: "Student",
    headline: "Elora helps you learn with clarity, not confusion.",
    subcopy:
      "Step-by-step guidance that adapts to your level, helps you fix mistakes, and builds confidence.",
  },
  parent: {
    label: "Parent",
    headline: "Elora helps you support learning at home.",
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
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all duration-200",
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
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-700/50 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:shadow-3xl hover:shadow-indigo-500/10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -inset-32 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/20 blur-3xl opacity-60 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 via-transparent to-transparent dark:from-white/5" />
      </div>

      <div className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-sm font-bold text-slate-950 dark:text-white tracking-tight">Elora Preview</div>
            <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              What judges should understand in 10 seconds
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

        <div className="mt-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/30 p-5 backdrop-blur-sm shadow-lg shadow-slate-900/5 dark:shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide">Assistant</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                Plain language • short steps
              </div>
            </div>


          <div className="mt-4 space-y-3">
            <div className="max-w-[92%] rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/40 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-sm">
              "What is 5 divided by 4?"
            </div>
            <div className="ml-auto max-w-[92%] rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600 to-indigo-700 px-4 py-3 text-sm text-white shadow-lg shadow-indigo-500/25 backdrop-blur-sm">
              5 ÷ 4 means split 5 into 4 equal parts. That's 1.25. (One and a quarter.)
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-gradient-to-br from-white/80 to-slate-50/40 dark:from-slate-800/40 dark:to-slate-900/20 p-5 shadow-md shadow-slate-900/5 dark:shadow-black/10">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 grid place-items-center shadow-sm">
              <span aria-hidden="true" className="text-lg">✅</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-950 dark:text-white tracking-tight">
                Verify student work (demo)
              </div>
              <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Consistent output: verdict → checks → next step. Built for teacher trust, not flashy AI.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          Designed for a <span className="font-bold text-slate-700 dark:text-slate-300">5–7 minute</span> competition demo: clear, stable, and
          teacher-friendly.
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [role, setRoleState] = useState("educator");
  const [session, setSession] = useState(() => getSession());

  const verified = Boolean(session?.verified);
  const teacher = Boolean(session?.teacher);

  const meta = useMemo(() => ROLE_META[role] || ROLE_META.educator, [role]);

  useEffect(() => {
    let mounted = true;

    const syncSessionVerification = async () => {
      try {
        await refreshVerifiedFromServer();
        if (!mounted) return;
        setSession(getSession());
      } catch (error) {
        // Avoid unhandled promise rejections while keeping behavior the same
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Failed to refresh verification status", error);
        }
      }
    };

    syncSessionVerification();

    return () => {
      mounted = false;
    };
  }, []);

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

      <div className="elora-page min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="elora-container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center py-8 lg:py-12">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl px-4 py-2.5 shadow-sm shadow-slate-900/5 dark:shadow-black/20">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">Genesis demo build</span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">•</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Secure verification + sessions</span>
              </div>

                <div className="space-y-6 min-h-[180px] transition-all duration-500 ease-in-out" key={role}>
                  <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black tracking-tight text-slate-950 dark:text-white leading-[1.1] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent animate-in fade-in slide-in-from-left-4 duration-700">
                    {meta.headline}
                  </h1>

                  <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl font-medium animate-in fade-in slide-in-from-left-6 duration-700 delay-100">
                    {meta.subcopy}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {["educator", "student", "parent"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoleState(r)}
                      className={cn(
                        "rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
                        role === r
                          ? "border-indigo-500/60 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 scale-105"
                          : "border-slate-300/80 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md hover:scale-105"
                      )}
                    >
                      {ROLE_META[r].label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => (verified ? goAssistant() : goVerify())}
                    className="group relative rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-200 hover:scale-105 hover:from-indigo-700 hover:to-indigo-800 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                  >
                    <span className="relative z-10">{verified ? "Open Assistant" : "Verify email"}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/demo")}
                    className="rounded-2xl border-2 border-slate-300/80 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm px-6 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 hover:shadow-lg hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                  >
                    Start Genesis Demo
                  </button>
                </div>


              <div className="flex flex-wrap items-center gap-3">
                <StatusChip variant={verified ? "good" : "warn"}>{verified ? "Verified" : "Not verified"}</StatusChip>
                {teacher ? <StatusChip variant="good">Teacher mode active</StatusChip> : null}
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Verification unlocks exports and teacher tools. Your progress persists across refreshes.
              </p>
            </div>

            <div className="relative lg:pl-8">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-full" />
              <HomePreview verified={verified} teacher={teacher} />
            </div>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Verify student work",
                desc: "Fast, consistent verification states across the app — no confusion after refresh.",
                icon: "✅",
              },
              {
                title: "Explain in human language",
                desc: "Short steps, simple words, and readable math by default (no raw LaTeX).",
                icon: "🧠",
              },
              {
                title: "Teacher tools (invite-gated)",
                desc: "Lesson plans, worksheets, assessments, slides — locked behind teacher role.",
                icon: "👩‍🏫",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="group relative rounded-3xl border border-slate-200/80 dark:border-slate-700/50 bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-800/40 dark:to-slate-900/30 p-6 shadow-lg shadow-slate-900/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-300 hover:scale-[1.02] hover:border-indigo-300/50 dark:hover:border-indigo-700/50"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 grid place-items-center shadow-sm group-hover:shadow-md transition-shadow">
                    <span aria-hidden="true" className="text-xl">{c.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-950 dark:text-white tracking-tight mb-1.5">{c.title}</div>
                    <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{c.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
