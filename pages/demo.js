import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getSession, isTeacher, refreshVerifiedFromServer, setGuest, setRole } from "@/lib/session";

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

function RoleCard({ title, desc, icon, tone, primaryLabel, secondaryLabel, onPrimary, onSecondary }) {
  const toneRing =
    tone === "indigo"
      ? "border-indigo-500/25"
      : tone === "sky"
        ? "border-sky-500/25"
        : "border-emerald-500/25";

  const toneGlow =
    tone === "indigo"
      ? "from-indigo-500/15 via-sky-400/8 to-fuchsia-500/10"
      : tone === "sky"
        ? "from-sky-500/15 via-indigo-400/8 to-fuchsia-500/10"
        : "from-emerald-500/12 via-sky-400/8 to-indigo-500/10";

  const primaryBtn =
    tone === "indigo"
      ? "bg-indigo-600 hover:bg-indigo-700"
      : tone === "sky"
        ? "bg-sky-600 hover:bg-sky-700"
        : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border bg-white/70 dark:bg-slate-950/20 p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/20", toneRing, "border-slate-200/60 dark:border-white/10")}>
      <div className="pointer-events-none absolute inset-0">
        <div className={cn("absolute -inset-24 bg-gradient-to-br blur-3xl", toneGlow)} />
      </div>

      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 grid place-items-center text-xl">
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-lg font-black text-slate-950 dark:text-white">{title}</div>
            <div className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{desc}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPrimary}
            className={cn("rounded-2xl px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/10", primaryBtn)}
          >
            {primaryLabel}
          </button>

          {secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondary}
              className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-4 py-2 text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
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
    // Make role selection feel real: set role once here.
    // (We’ll lock switching inside Assistant in a later batch with your green light.)
    setRole(role);

    // Keep guest OFF here to reduce “guest confusion”.
    // Student/Parent can still use the assistant unverified; exports remain locked.
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

    // Student / Parent can proceed directly.
    router.push("/assistant");
  }

  const step1 = verified ? "done" : "next";
  const step2 = !verified ? "locked" : teacher ? "done" : "next";
  const step3 = !verified ? "locked" : "next";
  const step4 = !verified ? "locked" : "next";

  return (
    <>
      <Head>
        <title>Get started — Elora</title>
      </Head>

      <div className="elora-page">
        <div className="elora-container">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-black text-slate-950 dark:text-white">Get started</h1>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 max-w-2xl">
                Choose your role. Educator mode is verification-gated for security. Student and Parent can jump in immediately.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip variant={verified ? "good" : "warn"}>{verified ? "Verified" : "Not verified"}</Chip>
              <Chip variant={teacher ? "good" : "neutral"}>{teacher ? "Teacher mode" : "Teacher locked"}</Chip>
            </div>
          </div>

          {/* Role selection (the 3 boxes you asked for) */}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <RoleCard
              title="Educator"
              icon="👩‍🏫"
              tone="indigo"
              desc="Verify student work, generate lesson materials, export classroom-ready docs."
              primaryLabel={verified ? "Continue" : "Verify to continue"}
              secondaryLabel={verified ? "" : "I’m just previewing"}
              onPrimary={() => chooseRole("educator")}
              onSecondary={() => chooseRole("student")}
            />

            <RoleCard
              title="Student"
              icon="🎓"
              tone="sky"
              desc="Get hints first, then reveal the full answer only after 3 attempts (if you ask)."
              primaryLabel="Continue"
              secondaryLabel=""
              onPrimary={() => chooseRole("student")}
              onSecondary={() => { }}
            />

            <RoleCard
              title="Parent"
              icon="🏠"
              tone="emerald"
              desc="Clear explanations and practical guidance you can use at home without stress."
              primaryLabel="Continue"
              secondaryLabel=""
              onPrimary={() => chooseRole("parent")}
              onSecondary={() => { }}
            />
          </div>

          {/* Keep the judge-friendly checklist (optional) */}
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-extrabold text-slate-950 dark:text-white">Optional: Genesis demo checklist</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  If a judge asks for the “full flow”, use this to prove verification, teacher gating, memory, and exports.
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-4 py-2 text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
              >
                Back to Home
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
                onAction={() => router.push(`/assistant?demo=1&demoRole=educator&demoMsg=${encodeURIComponent(demoMsg)}`)}
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
          </div>
        </div>
      </div>
    </>
  );
}
