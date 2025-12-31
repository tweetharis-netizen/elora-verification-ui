import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getSession, refreshVerifiedFromServer, setGuest, setRole } from "@/lib/session";

const MODES = [
  { key: "educator", label: "Teacher" },
  { key: "student", label: "Student" },
  { key: "parent", label: "Parent" },
];

const COPY = {
  educator: {
    title: "Lesson-ready materials in minutes.",
    subtitle:
      "Create lesson plans, worksheets, quizzes, and slide outlines with structured options — built for real classrooms and export-ready once verified.",
    bullets: [
      "Teacher-friendly structure (no prompt wrestling)",
      "DOCX / PDF / PPTX exports after verification",
      "Invite-protected educator tools",
    ],
  },
  student: {
    title: "Learn with clarity, not guesswork.",
    subtitle:
      "Step-by-step help that builds understanding. Clean explanations, practice prompts, and feedback — designed to be readable on any device.",
    bullets: ["Guided learning", "Practice + feedback", "Calm, readable UI"],
  },
  parent: {
    title: "Support learning at home — simply.",
    subtitle:
      "Understand what’s being taught and get practical guidance to help your child improve without overwhelm.",
    bullets: ["Simple explanations", "Actionable support", "Trusted structure"],
  },
};

function Segmented({ value, onChange }) {
  return (
    <div className="elora-segmented" role="tablist" aria-label="Mode">
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          role="tab"
          aria-selected={value === m.key ? "true" : "false"}
          className={value === m.key ? "active" : ""}
          onClick={() => onChange(m.key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function PreviewPanel() {
  return (
    <div className="elora-preview elora-card">
      <div className="elora-preview-top">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold opacity-70">Teacher verification</div>
            <div className="font-black tracking-tight text-[1.05rem] mt-0.5">Review & export</div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="elora-chip ok">Verified</span>
            <span className="elora-chip warn">Needs review</span>
            <span className="elora-chip bad">Flagged</span>
          </div>
        </div>
      </div>

      <div className="elora-preview-body">
        <div className="elora-table">
          <div className="row head">
            <div>Student</div>
            <div>Assignment</div>
            <div>Status</div>
          </div>

          <div className="row">
            <div className="name">
              <span className="dot" />
              Aisha
            </div>
            <div className="muted">Algebra — Factorisation</div>
            <div>
              <span className="elora-chip ok">Verified</span>
            </div>
          </div>

          <div className="row">
            <div className="name">
              <span className="dot" />
              Ethan
            </div>
            <div className="muted">Science — Energy transfer</div>
            <div>
              <span className="elora-chip warn">Needs review</span>
            </div>
          </div>

          <div className="row">
            <div className="name">
              <span className="dot" />
              Mei
            </div>
            <div className="muted">English — Argument writing</div>
            <div>
              <span className="elora-chip ok">Verified</span>
            </div>
          </div>

          <div className="row">
            <div className="name">
              <span className="dot" />
              Ryan
            </div>
            <div className="muted">History — Source analysis</div>
            <div>
              <span className="elora-chip bad">Flagged</span>
            </div>
          </div>
        </div>

        <div className="elora-preview-footer">
          <div className="elora-muted text-sm">Verification unlocks exports across sessions.</div>
          <button type="button" className="elora-btn elora-btn-primary" disabled>
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState("educator");

  const copy = useMemo(() => COPY[mode] || COPY.educator, [mode]);

  async function onTryElora() {
    setRole(mode);

    // Gate guest mode based on server truth (cookie) first.
    const status = await refreshVerifiedFromServer().catch(() => ({ verified: false }));
    const s = getSession();

    const verified = !!status?.verified || !!s.verified;
    setGuest(!verified);

    router.push("/assistant");
  }

  return (
    <>
      <Head>
        <title>Elora — Education assistant</title>
        <meta
          name="description"
          content="Elora helps educators, students, and parents create lesson-ready learning materials with clean structure and exports."
        />
      </Head>

      <section className="mx-auto px-4" style={{ maxWidth: "var(--elora-page-max)" }}>
        <div className="elora-hero">
          <div className="elora-hero-left">
            <div className="elora-kicker">Elora • Education assistant</div>

            <h1 className="mt-5 elora-h1 text-[clamp(2.45rem,4.3vw,3.75rem)]">{copy.title}</h1>

            <p className="mt-3 elora-muted text-[1.05rem] leading-relaxed max-w-xl">{copy.subtitle}</p>

            <div className="mt-5">
              <Segmented value={mode} onChange={setMode} />
            </div>

            <ul className="mt-5 grid gap-2 max-w-xl">
              {copy.bullets.map((b) => (
                <li key={b} className="elora-bullet">
                  <span className="check" aria-hidden="true">
                    ✓
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button type="button" className="elora-btn elora-btn-primary" onClick={onTryElora}>
                Try Elora
              </button>
              <Link href="/help" className="elora-btn elora-btn-ghost">
                How it works
              </Link>
            </div>

            <div className="mt-4 elora-muted text-sm">
              Exports are locked until verified.{" "}
              <Link
                href="/verify"
                className="underline underline-offset-4 hover:opacity-100 opacity-90"
              >
                Verify email
              </Link>{" "}
              when you’re ready.
            </div>

            <div className="mt-6 elora-trust">
              <div className="elora-trust-item">DOCX / PDF / PPTX exports</div>
              <div className="elora-trust-item">Server-backed verification</div>
              <div className="elora-trust-item">Theme + font scaling</div>
            </div>
          </div>

          <div className="elora-hero-right">
            <PreviewPanel />
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="elora-card p-6">
            <div className="font-black text-lg">Structured outputs</div>
            <p className="mt-2 elora-muted leading-relaxed">
              Predictable formatting that reads like a teacher wrote it.
            </p>
          </div>
          <div className="elora-card p-6">
            <div className="font-black text-lg">Verification gate</div>
            <p className="mt-2 elora-muted leading-relaxed">
              Stops abuse. Persists across refresh. Built for Vercel.
            </p>
          </div>
          <div className="elora-card p-6">
            <div className="font-black text-lg">Designed to read</div>
            <p className="mt-2 elora-muted leading-relaxed">
              Soft light theme, strong contrast, and accessibility-safe motion.
            </p>
          </div>
        </div>

        <div className="mt-10 elora-card p-7 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-sm font-extrabold opacity-70">Start now</div>
            <div className="font-black text-[1.25rem] mt-1">Open Elora in seconds.</div>
            <div className="elora-muted mt-1">Try it first. Verify only when you want to export.</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" className="elora-btn elora-btn-primary" onClick={onTryElora}>
              Try Elora
            </button>
            <Link href="/settings" className="elora-btn elora-btn-ghost">
              Settings
            </Link>
          </div>
        </div>

        <footer className="mt-10 elora-muted text-xs">
          © {new Date().getFullYear()} Elora — calm, future-proof learning workflows.
        </footer>
      </section>
    </>
  );
}
