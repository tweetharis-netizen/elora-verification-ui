import { useState } from "react";
import { useRouter } from "next/router";

const ROLES = [
  {
    id: "educator",
    title: "I'm an Educator",
    description: "Plan lessons, worksheets, assessments and slides.",
    accent: "from-indigo-500 to-sky-500",
  },
  {
    id: "student",
    title: "I'm a Student",
    description: "Homework help, revision plans and practice questions.",
    accent: "from-sky-500 to-cyan-500",
  },
  {
    id: "parent",
    title: "I'm a Parent",
    description: "Understand lessons and support learning at home.",
    accent: "from-amber-500 to-orange-500",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState("educator");

  const handleContinue = (asGuest = false) => {
    if (!role) return;
    const query = new URLSearchParams({
      role,
      mode: asGuest ? "guest" : "account",
    }).toString();
    router.push(`/assistant?${query}`);
  };

  return (
    <div className="elora-home-wrap">
      {/* LEFT: HERO + ROLE PICKER */}
      <section className="elora-home-hero">
        <div className="elora-home-eyebrow">
          Built for real classrooms, not just chat.
        </div>
        <h1 className="elora-home-title">
          Your AI teaching partner for lessons, practice, and parents.
        </h1>
        <p className="elora-home-subtitle">
          Elora helps educators, students and parents design lessons, generate
          practice, and explain topics in a way that fits each syllabus and
          learning level.
        </p>

        <h2 className="mt-6 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-[0.16em]">
          Who are you?
        </h2>

        <div className="elora-role-grid mt-3">
          {ROLES.map((r) => {
            const isActive = r.id === role;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`elora-role-card text-left ${
                  isActive ? "elora-role-card-active" : ""
                }`}
              >
                <div
                  className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${r.accent} text-white text-xs font-semibold px-2.5 py-1`}
                >
                  {r.id === "educator" && "Educator"}
                  {r.id === "student" && "Student"}
                  {r.id === "parent" && "Parent"}
                </div>
                <div className="elora-role-title mt-2">{r.title}</div>
                <div className="elora-role-desc">{r.description}</div>
              </button>
            );
          })}
        </div>

        <div className="elora-home-cta">
          <button
            type="button"
            onClick={() => handleContinue(false)}
            className="elora-primary-button px-7 py-2.5 text-sm font-semibold"
            disabled={!role}
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => handleContinue(true)}
            className="elora-home-cta-secondary text-sm"
          >
            Try as Guest ✨
          </button>
        </div>

        <p className="mt-3 text-[0.78rem] text-slate-500 dark:text-slate-400">
          Guest mode is free and instant. Verified accounts unlock saving,
          exporting to Google Slides & Docs, and more.
        </p>
      </section>

      {/* RIGHT: ACTIVE PROFILE / FEATURE PREVIEW */}
      <aside className="elora-home-side">
        <div className="elora-mini-card">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-[0.18em]">
              Active teaching profile
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 px-2 py-[3px] text-[0.7rem] font-medium text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Smart prompt builder
            </span>
          </div>

          <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
            Singapore · Primary 5 · Math
          </p>
          <p className="mt-1 text-[0.8rem] text-slate-500 dark:text-slate-400">
            Elora turns these choices into expert prompts so you don&apos;t have
            to.
          </p>

          <div className="elora-action-grid mt-3">
            <button className="elora-action-btn active" type="button">
              Plan a lesson
            </button>
            <button className="elora-action-btn" type="button">
              Create worksheet
            </button>
            <button className="elora-action-btn" type="button">
              Generate assessment
            </button>
            <button className="elora-action-btn" type="button">
              Design slides
            </button>
          </div>

          <p className="elora-helper-text mt-3">
            Works for educators, students, and parents. Designed to fit
            different countries and syllabuses over time.
          </p>
        </div>

        <div className="elora-mini-card elora-faq-list">
          <div className="elora-mini-heading mb-1">
            Frequently Asked Questions
          </div>
          <details>
            <summary>Do I need an account?</summary>
            <p className="mt-1 text-[0.8rem] text-slate-500 dark:text-slate-400">
              You can try Elora instantly. Accounts only unlock extra features
              like saving and exporting.
            </p>
          </details>
          <details>
            <summary>How is Elora different from normal AI chat?</summary>
            <p className="mt-1 text-[0.8rem] text-slate-500 dark:text-slate-400">
              Instead of guessing the perfect prompt, Elora asks structured
              questions (country, level, subject, topic, and goal) and then
              builds expert prompts for you behind the scenes.
            </p>
          </details>
          <details>
            <summary>Can I give feedback?</summary>
            <p className="mt-1 text-[0.8rem] text-slate-500 dark:text-slate-400">
              Yes, this is an early prototype. Your feedback directly shapes how
              Elora grows for Genesis&nbsp;2026.
            </p>
          </details>
        </div>

        <div className="elora-mini-card">
          <div className="elora-mini-heading">Help us make Elora better</div>
          <p className="text-[0.8rem] text-slate-500 dark:text-slate-400 mb-2">
            Share ideas for new features like Google Slides, Docs, worksheets
            and more.
          </p>
          <button
            type="button"
            className="elora-primary-button px-4 py-2 text-sm"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "mailto:your-email@example.com";
              }
            }}
          >
            Send Feedback
          </button>
          <p className="mt-3 elora-small-muted">
            © 2025 Elora. Built for schools. Made by Haris · Prototype for
            Genesis 2026.
          </p>
        </div>
      </aside>
    </div>
  );
}
