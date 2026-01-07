import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { getSession, isTeacher, refreshVerifiedFromServer } from "../lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Chip({ variant, children }) {
  const styles =
    variant === "good"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : variant === "warn"
      ? "border-amber-400/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
      : "border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 text-slate-700 dark:text-slate-200";

  const dot =
    variant === "good"
      ? "bg-emerald-400"
      : variant === "warn"
      ? "bg-amber-400"
      : "bg-slate-300 dark:bg-white/30";

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold", styles)}>
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {children}
    </span>
  );
}

function StepCard({ num, title, desc, status, actionLabel, onAction, disabled }) {
  const variant = status === "done" ? "good" : status === "next" ? "warn" : "neutral";
  const statusText = status === "done" ? "Done" : status === "next" ? "Next" : "Locked";

  return (
    <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 grid place-items-center font-black text-slate-900 dark:text-white">
            {num}
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-950 dark:text-white">{title}</div>
            <div className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{desc}</div>
          </div>
        </div>
        <Chip variant={variant}>{statusText}</Chip>
      </div>

      {actionLabel ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={disabled}
            onClick={onAction}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-extrabold border transition",
              disabled
                ? "border-slate-200/60 dark:border-white/10 text-slate-400 cursor-not-allowed bg-white/40 dark:bg-slate-950/10"
                : "border-indigo-500/30 bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            )}
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function DemoPage() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());

  const verified = Boolean(session?.verified);
  const teacher = Boolean(isTeacher());

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refreshVerifiedFromServer();
      if (!mounted) return;
      setSession(getSession());
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const demoMsg = useMemo(() => {
    // Short, judge-friendly, shows "human language + steps" without LaTeX.
    return "Explain photosynthesis in 4 short steps for a Secondary student, add 1 simple example, then end with 2 quick check questions.";
  }, []);

  const step1 = verified ? "done" : "next";
  const step2 = !verified ? "locked" : teacher ? "done" : "next";
  const step3 = !verified ? "locked" : "next";
  const step4 = !verified ? "locked" : "next";

  return (
    <>
      <Head>
        <title>Genesis Demo — Elora</title>
      </Head>

      <Navbar />

      <div className="elora-page">
        <div className="elora-container">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-black text-slate-950 dark:text-white">Start Genesis Demo</h1>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 max-w-2xl">
                Follow these steps in order. This is designed to take <span className="font-extrabold">3–5 minutes</span> and
                shows verification, teacher gating, memory, and exports.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip variant={verified ? "good" : "warn"}>{verified ? "Verified" : "Not verified"}</Chip>
              <Chip variant={teacher ? "good" : "neutral"}>{teacher ? "Teacher mode" : "Teacher locked"}</Chip>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <StepCard
              num={1}
              title="Verify your email"
              desc="This unlocks full access and makes state persist across refreshes."
              status={step1}
              actionLabel={verified ? "Open Assistant" : "Go to verification"}
              onAction={() => router.push(verified ? "/assistant" : "/verify")}
              disabled={false}
            />

            <StepCard
              num={2}
              title="Unlock Teacher Tools"
              desc="Enter a Teacher Invite Code (e.g., GENESIS2026) to unlock lesson plans, worksheets, slides, and assessments."
              status={step2}
              actionLabel={teacher ? "Teacher already unlocked" : "Open teacher unlock"}
              onAction={() => router.push("/assistant?demo=1&unlockTeacher=1")}
              disabled={!verified || teacher}
            />

            <StepCard
              num={3}
              title="Run a 1-click example"
              desc="This auto-fills a judge-friendly prompt and sends it once (no repeated spam on refresh)."
              status={step3}
              actionLabel="Run example in Assistant"
              onAction={() =>
                router.push(
                  `/assistant?demo=1&demoRole=educator&demoMsg=${encodeURIComponent(demoMsg)}`
                )
              }
              disabled={!verified}
            />

            <StepCard
              num={4}
              title="Export"
              desc="Export the last answer to DOCX / PPTX / PDF to prove it’s classroom-ready."
              status={step4}
              actionLabel="Open Assistant (Export)"
              onAction={() => router.push("/assistant?demo=1")}
              disabled={!verified}
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-5">
            <div className="text-sm font-extrabold text-slate-950 dark:text-white">Pro demo tip</div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              After step 3, refresh the Assistant page once to prove chat memory + verification persistence.
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-4 py-2 text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
              >
                Back to Home
              </button>
              <button
                type="button"
                onClick={() => router.push("/help")}
                className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-transparent px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-950/25"
              >
                Help / FAQ
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem("elora_demo_sent_v1");
                    sessionStorage.removeItem("elora_demo_role_set_v1");
                  } catch {}
                  router.push("/demo");
                }}
                className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-transparent px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-950/25"
              >
                Reset demo (local)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
