import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import Modal from "../components/Modal";
import { getSession, setGuest, setRole, setVerified } from "../lib/session";

const ROLE_COPY = {
  educator: {
    title: "Built for real classrooms.",
    subtitle:
      "Generate lessons, worksheets, assessments, and slides with structured options — then refine with one click.",
    cta: "Open Educator Assistant",
  },
  student: {
    title: "Learn with guidance, not guesswork.",
    subtitle:
      "Get explanations and practice with step-by-step support — designed to help you think, not copy.",
    cta: "Open Student Assistant",
  },
  parent: {
    title: "Support learning at home.",
    subtitle:
      "Understand what your child is learning and get simple, practical ways to help — without stress.",
    cta: "Open Parent Assistant",
  },
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function HeroSceneIllustration() {
  // Character/scene illustration (inline SVG) to match Elora’s glass + gradient aesthetic.
  // No external assets required, so it won’t look “off” between themes.
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-3xl bg-indigo-500/10 blur-2xl" />
      <div className="relative rounded-3xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 overflow-hidden">
        <svg
          viewBox="0 0 920 620"
          className="w-full h-auto"
          role="img"
          aria-label="Elora character scene illustration"
        >
          <defs>
            <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(99,102,241,0.18)" />
              <stop offset="0.55" stopColor="rgba(56,189,248,0.12)" />
              <stop offset="1" stopColor="rgba(168,85,247,0.14)" />
            </linearGradient>

            <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,0.75)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.35)" />
            </linearGradient>

            <linearGradient id="cardGradDark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(15,23,42,0.78)" />
              <stop offset="1" stopColor="rgba(2,6,23,0.40)" />
            </linearGradient>

            <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6366f1" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>

            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="rgba(0,0,0,0.25)" />
            </filter>
          </defs>

          {/* Background */}
          <rect x="0" y="0" width="920" height="620" fill="url(#bgGrad)" />
          <circle cx="160" cy="120" r="120" fill="rgba(99,102,241,0.18)" />
          <circle cx="820" cy="110" r="140" fill="rgba(56,189,248,0.14)" />
          <circle cx="520" cy="560" r="200" fill="rgba(168,85,247,0.12)" />

          {/* Desk */}
          <g filter="url(#softShadow)">
            <rect x="140" y="420" width="640" height="90" rx="26" fill="rgba(255,255,255,0.22)" />
            <rect x="180" y="438" width="560" height="16" rx="8" fill="rgba(255,255,255,0.18)" />
          </g>

          {/* Floating cards (outputs) */}
          <g filter="url(#softShadow)">
            <g transform="translate(560 90) rotate(2)">
              <rect x="0" y="0" width="270" height="130" rx="22" fill="rgba(255,255,255,0.30)" />
              <rect x="18" y="20" width="140" height="16" rx="8" fill="rgba(99,102,241,0.45)" />
              <rect x="18" y="50" width="220" height="12" rx="6" fill="rgba(255,255,255,0.25)" />
              <rect x="18" y="72" width="200" height="12" rx="6" fill="rgba(255,255,255,0.22)" />
              <rect x="18" y="94" width="160" height="12" rx="6" fill="rgba(255,255,255,0.20)" />
            </g>

            <g transform="translate(510 240) rotate(-4)">
              <rect x="0" y="0" width="260" height="120" rx="22" fill="rgba(15,23,42,0.30)" />
              <rect x="18" y="18" width="140" height="16" rx="8" fill="rgba(56,189,248,0.55)" />
              <rect x="18" y="48" width="210" height="12" rx="6" fill="rgba(255,255,255,0.18)" />
              <rect x="18" y="70" width="190" height="12" rx="6" fill="rgba(255,255,255,0.16)" />
              <rect x="18" y="92" width="150" height="12" rx="6" fill="rgba(255,255,255,0.14)" />
            </g>
          </g>

          {/* AI “orb” */}
          <g filter="url(#softShadow)" transform="translate(410 210)">
            <circle cx="0" cy="0" r="56" fill="url(#accent)" opacity="0.9" />
            <circle cx="0" cy="0" r="40" fill="rgba(255,255,255,0.22)" />
            <circle cx="-16" cy="-10" r="6" fill="rgba(255,255,255,0.85)" />
            <circle cx="10" cy="-6" r="6" fill="rgba(255,255,255,0.85)" />
            <path d="M-18 16 C-6 26, 6 26, 18 16" stroke="rgba(255,255,255,0.85)" strokeWidth="6" strokeLinecap="round" fill="none" />
          </g>

          {/* Teacher (right) */}
          <g filter="url(#softShadow)" transform="translate(620 330)">
            {/* body */}
            <path
              d="M60 200 C70 140, 120 120, 170 120 C220 120, 270 140, 280 200 L280 260 L60 260 Z"
              fill="rgba(15,23,42,0.34)"
            />
            <path
              d="M100 140 C120 170, 220 170, 240 140 C240 210, 220 250, 170 250 C120 250, 100 210, 100 140 Z"
              fill="rgba(255,255,255,0.22)"
            />
            {/* head */}
            <circle cx="170" cy="90" r="54" fill="rgba(255,255,255,0.28)" />
            <circle cx="170" cy="92" r="44" fill="rgba(255,255,255,0.22)" />
            {/* hair */}
            <path
              d="M132 78 C138 46, 160 36, 170 36 C196 36, 212 52, 214 78 C200 68, 150 68, 132 78 Z"
              fill="rgba(15,23,42,0.55)"
            />
            {/* face */}
            <circle cx="154" cy="92" r="5" fill="rgba(15,23,42,0.55)" />
            <circle cx="186" cy="92" r="5" fill="rgba(15,23,42,0.55)" />
            <path
              d="M152 114 C160 124, 180 124, 188 114"
              stroke="rgba(15,23,42,0.40)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* clipboard */}
            <g transform="translate(250 170) rotate(6)">
              <rect x="-60" y="-50" width="110" height="140" rx="18" fill="rgba(255,255,255,0.22)" />
              <rect x="-40" y="-28" width="70" height="10" rx="5" fill="rgba(99,102,241,0.55)" />
              <rect x="-40" y="-8" width="82" height="10" rx="5" fill="rgba(255,255,255,0.18)" />
              <rect x="-40" y="12" width="72" height="10" rx="5" fill="rgba(255,255,255,0.16)" />
              <rect x="-40" y="32" width="60" height="10" rx="5" fill="rgba(255,255,255,0.14)" />
            </g>
          </g>

          {/* Student (left) */}
          <g filter="url(#softShadow)" transform="translate(220 360)">
            {/* body */}
            <path
              d="M40 200 C50 150, 90 130, 130 130 C170 130, 210 150, 220 200 L220 260 L40 260 Z"
              fill="rgba(99,102,241,0.18)"
            />
            <path
              d="M78 160 C92 185, 168 185, 182 160 C182 220, 162 252, 130 252 C98 252, 78 220, 78 160 Z"
              fill="rgba(255,255,255,0.20)"
            />
            {/* head */}
            <circle cx="130" cy="100" r="48" fill="rgba(255,255,255,0.26)" />
            {/* hair */}
            <path
              d="M96 98 C96 70, 114 56, 130 56 C150 56, 166 70, 166 96 C150 84, 112 84, 96 98 Z"
              fill="rgba(15,23,42,0.45)"
            />
            {/* face */}
            <circle cx="118" cy="104" r="5" fill="rgba(15,23,42,0.55)" />
            <circle cx="142" cy="104" r="5" fill="rgba(15,23,42,0.55)" />
            <path
              d="M118 124 C124 134, 136 134, 142 124"
              stroke="rgba(15,23,42,0.38)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* notebook */}
            <g transform="translate(40 192) rotate(-6)">
              <rect x="-30" y="-34" width="90" height="82" rx="16" fill="rgba(255,255,255,0.22)" />
              <rect x="-16" y="-18" width="62" height="10" rx="5" fill="rgba(56,189,248,0.55)" />
              <rect x="-16" y="2" width="54" height="10" rx="5" fill="rgba(255,255,255,0.16)" />
              <rect x="-16" y="22" width="46" height="10" rx="5" fill="rgba(255,255,255,0.14)" />
            </g>
          </g>

          {/* subtle ground glow */}
          <ellipse cx="460" cy="520" rx="300" ry="70" fill="rgba(0,0,0,0.10)" />
        </svg>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Options first → clean output → export-ready
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [role, setRoleState] = useState("educator");
  const [gateOpen, setGateOpen] = useState(false);

  const copy = useMemo(() => ROLE_COPY[role] || ROLE_COPY.educator, [role]);

  const openAssistant = () => {
    setRole(role);

    const s = getSession();
    if (s.verified) {
      setGuest(false);
      router.push("/assistant");
      return;
    }

    // Not verified → offer verify or guest
    setGateOpen(true);
  };

  const pickGuest = () => {
    setRole(role);
    setVerified(false);
    setGuest(true);
    setGateOpen(false);
    router.push("/assistant");
  };

  const pickVerify = () => {
    setRole(role);
    setGuest(false);
    setGateOpen(false);
    router.push("/verify");
  };

  return (
    <>
      <Head>
        <title>Elora — Plan less. Teach more.</title>
        <meta
          name="description"
          content="Elora is an AI teaching assistant that fixes the prompting problem with structured options for educators, students, and parents."
        />
      </Head>

      <div className="py-6 sm:py-10">
        {/* HERO */}
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Built for real classrooms — not generic chat.
                </span>
              </div>

              <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight text-slate-950 dark:text-white">
                Plan less. Teach more.
              </h1>

              <p className="mt-4 text-base md:text-lg text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
                Elora solves the <span className="font-semibold">prompting problem</span> with structured options —
                role, level, subject, goals — then generates classroom-ready output you can actually use.
              </p>

              {/* Role pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {["educator", "student", "parent"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleState(r)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-extrabold border backdrop-blur-xl transition",
                      role === r
                        ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200 shadow-lg shadow-indigo-500/10"
                        : "border-white/10 bg-white/50 dark:bg-slate-950/35 text-slate-800 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-950/50"
                    )}
                  >
                    {r === "educator" ? "Educator" : r === "student" ? "Student" : "Parent"}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                  {copy.title}
                </div>
                <div className="mt-1 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
                  {copy.subtitle}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={openAssistant}
                  className="w-full sm:w-auto px-6 py-3 rounded-full font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20"
                >
                  {copy.cta}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("examples");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-full font-bold border border-white/10 bg-white/55 dark:bg-slate-950/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-slate-950/55"
                >
                  Watch examples
                </button>
              </div>

              <div className="mt-4 text-xs text-slate-600 dark:text-slate-400">
                Want tips? Visit{" "}
                <Link href="/help" className="font-bold text-indigo-700 dark:text-indigo-200 hover:opacity-90">
                  Help
                </Link>{" "}
                for quick start + FAQs.
              </div>
            </div>

            <div className="lg:pl-6">
              <HeroSceneIllustration />
            </div>
          </div>

          {/* TRUST STRIP */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { title: "Kami-friendly PDFs", desc: "Clean layouts that annotate well." },
              { title: "Theme-aware slides", desc: "PPTX exports match your theme." },
              { title: "Invite-protected educator tools", desc: "Teacher-only access stays protected." },
            ].map((x) => (
              <div
                key={x.title}
                className="rounded-2xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-4"
              >
                <div className="text-sm font-extrabold text-slate-950 dark:text-white">{x.title}</div>
                <div className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{x.desc}</div>
              </div>
            ))}
          </div>

          {/* HOW IT WORKS */}
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "1) Choose context",
                desc: "Role, country, level, subject, topic — the hard part becomes easy.",
              },
              {
                title: "2) Pick an action",
                desc: "Lesson, worksheet, assessment, slides — built to be classroom-ready.",
              },
              {
                title: "3) Refine & export",
                desc: "Use chips for improvements, then export DOCX / PDF / PPTX (verified).",
              },
            ].map((x) => (
              <div
                key={x.title}
                className="rounded-2xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-5"
              >
                <div className="text-base font-black text-slate-950 dark:text-white">{x.title}</div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{x.desc}</div>
              </div>
            ))}
          </div>

          {/* EXAMPLES */}
          <div id="examples" className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  Examples (click → open Assistant)
                </h2>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
                  These are designed to show the “options-first” workflow. Judges should understand Elora in seconds.
                </p>
              </div>
              <Link
                href="/help"
                className="hidden sm:inline-flex px-4 py-2 rounded-full border border-white/10 bg-white/55 dark:bg-slate-950/40 text-sm font-extrabold text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-slate-950/55"
              >
                See more in Help →
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Lesson plan",
                  tag: "Educator",
                  desc: "Fractions intro — misconceptions, checks, differentiation.",
                },
                {
                  title: "Worksheet",
                  tag: "Educator",
                  desc: "Algebra practice — scaffolding + challenge questions.",
                },
                {
                  title: "Slides",
                  tag: "Educator",
                  desc: "Water cycle — engagement prompts + teacher notes.",
                },
              ].map((x) => (
                <button
                  key={x.title}
                  type="button"
                  onClick={() => {
                    setRole("educator");
                    router.push("/assistant");
                  }}
                  className="text-left rounded-2xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-5 hover:bg-white/75 dark:hover:bg-slate-950/55 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-base font-black text-slate-950 dark:text-white">{x.title}</div>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200">
                      {x.tag}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{x.desc}</div>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-full shadow-lg shadow-indigo-500/20">
                    Open in Assistant →
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* FINAL CTA */}
          <div className="mt-14 rounded-3xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-6 sm:p-8 text-center">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
              Ready to teach smarter with Elora?
            </h3>
            <p className="mt-2 text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Elora is built for educators first — lesson plans, worksheets, assessments, and slides that don’t look like
              AI output.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={openAssistant}
                className="px-6 py-3 rounded-full font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20"
              >
                Open Assistant
              </button>
              <Link
                href="/verify"
                className="px-6 py-3 rounded-full font-bold border border-white/10 bg-white/55 dark:bg-slate-950/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-slate-950/55"
              >
                Verify for exports
              </Link>
            </div>
          </div>
        </div>

        {/* Verify Gate Modal */}
        <Modal open={gateOpen} title="Verify to unlock Elora" onClose={() => setGateOpen(false)}>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            To unlock full features (exports + educator-only tools), please verify your email.
            You can still try a limited guest preview.
          </p>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={pickVerify}
              className="w-full px-5 py-3 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            >
              Sign in / Verify
            </button>
            <button
              type="button"
              onClick={pickGuest}
              className="w-full px-5 py-3 rounded-xl font-bold border border-white/10 bg-white/60 dark:bg-slate-950/40 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-slate-950/60"
            >
              Try as Guest (limited)
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Guest limits: exports may be locked, and teacher-only tools remain protected.
          </div>
        </Modal>
      </div>
    </>
  );
}
