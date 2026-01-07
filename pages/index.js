import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../components/Modal";
import { getSession, refreshVerifiedFromServer, setGuest, setRole, setVerified } from "../lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

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

function HomePreview({ verified, teacher }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-2xl shadow-slate-900/10 dark:shadow-black/30">
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -inset-24 bg-gradient-to-br from-indigo-500/20 via-sky-400/10 to-fuchsia-500/15 blur-3xl" />
      </div>

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-black text-slate-950 dark:text-white">Elora Preview</div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              What judges should understand in 10 seconds
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <StatusChip variant={verified ? "good" : "warn"}>{verified ? "Email verified" : "Verify email"}</StatusChip>
            <StatusChip variant={teacher ? "good" : "neutral"}>{teacher ? "Teacher mode" : "Teacher tools locked"}</StatusChip>
          </div>
        </div>

        {/* mini assistant snippet */}
        <div className="mt-5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Assistant</div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Plain language • short steps</div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="max-w-[92%] rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-slate-100">
              “What is 5 divided by 4?”
            </div>
            <div className="ml-auto max-w-[92%] rounded-2xl border border-indigo-500/20 bg-indigo-600 px-3 py-2 text-sm text-white">
              5 ÷ 4 means split 5 into 4 equal parts. That’s 1.25. (One and a quarter.)
            </div>
          </div>
        </div>

        {/* upload teaser row */}
        <div className="mt-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 grid place-items-center">
              <span aria-hidden="true">📎</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-extrabold text-slate-950 dark:text-white">Upload student work (coming next)</div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Drop a photo / PDF and Elora explains + flags what needs review.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-600 dark:text-slate-300">
          Designed for a <span className="font-extrabold">5–7 minute</span> competition demo: clear, stable, and teacher-friendly.
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [role, setRoleState] = useState("educator");
  const [session, setSession] = useState(() => getSession());

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const verified = Boolean(session?.verified);
  const teacher = Boolean(session?.teacher);

  const meta = useMemo(() => ROLE_META[role] || ROLE_META.educator, [role]);

  useEffect(() => {
    let mounted = true;
    refreshVerifiedFromServer().then(() => {
      if (!mounted) return;
      setSession(getSession());
    });
    return () => {
      mounted = false;
    };
  }, []);

  const goVerify = () => {
    setRole(role);
    setGuest(false);
    setVerifyModalOpen(false);
    router.push("/verify");
  };

  const goAssistant = async ({ asGuest } = { asGuest: false }) => {
    setRole(role);

    if (asGuest) {
      setVerified(false);
      setGuest(true);
      setVerifyModalOpen(false);
      router.push("/assistant");
      return;
    }

    // Verified users go straight in. Unverified go to verify.
    if (verified) {
      setGuest(false);
      router.push("/assistant");
      return;
    }

    setVerifyModalOpen(true);
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

      <div className="elora-page">
        <div className="elora-container">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* LEFT: Hero */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 backdrop-blur-xl px-4 py-2">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Genesis demo build</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">•</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Secure verification + sessions</span>
              </div>

              <h1 className="mt-6 text-[clamp(2.2rem,4.1vw,3.8rem)] font-black tracking-tight text-slate-950 dark:text-white">
                {meta.headline}
              </h1>

              <p className="mt-4 text-[1.05rem] leading-relaxed text-slate-700 dark:text-slate-300 max-w-xl">
                {meta.subcopy}
              </p>

              {/* Role pills (kept, but calmer + smaller) */}
              <div className="mt-6 flex flex-wrap gap-2">
                {["educator", "student", "parent"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleState(r)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-extrabold transition",
                      role === r
                        ? "border-indigo-500/50 bg-indigo-600/10 text-indigo-800 dark:text-indigo-200"
                        : "border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/20 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
                    )}
                  >
                    {ROLE_META[r].label}
                  </button>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => (verified ? goAssistant({ asGuest: false }) : goVerify())}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
                >
                  {verified ? "Open Assistant" : "Verify email"}
                </button>

                <button
                  type="button"
                  onClick={() => goAssistant({ asGuest: true })}
                  className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-5 py-3 text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
                >
                  Try assistant (guest)
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/help")}
                  className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-transparent px-5 py-3 text-sm font-extrabold text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-950/25"
                >
                  How it works
                </button>
              </div>

              {/* tiny status line */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                <StatusChip variant={verified ? "good" : "warn"}>{verified ? "Verified" : "Not verified"}</StatusChip>
                {teacher ? <StatusChip variant="good">Teacher mode active</StatusChip> : null}
              </div>

              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                Verification unlocks exports and teacher tools. Your progress persists across refreshes.
              </p>
            </div>

            {/* RIGHT: Preview */}
            <div className="relative">
              <HomePreview verified={verified} teacher={teacher} />
            </div>
          </div>

          {/* 3-card clarity strip */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
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
                className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/20"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 grid place-items-center">
                    <span aria-hidden="true">{c.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-950 dark:text-white">{c.title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{c.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verify modal (only if user tries “Open Assistant” while unverified) */}
      <Modal open={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} title="Verify to unlock Elora">
        <div className="space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            Verification unlocks exports and teacher tools. You can still preview as a guest.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
              onClick={goVerify}
              type="button"
            >
              Verify email
            </button>
            <button
              className="rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
              onClick={() => goAssistant({ asGuest: true })}
              type="button"
            >
              Continue as guest
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
