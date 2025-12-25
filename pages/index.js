import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

const ROLES = [
  {
    id: "educator",
    title: "I'm an Educator",
    description: "Plan lessons, worksheets, assessments and slides.",
    icon: "📚",
  },
  {
    id: "student",
    title: "I'm a Student",
    description: "Homework help, revision plans and practice questions.",
    icon: "🎓",
  },
  {
    id: "parent",
    title: "I'm a Parent",
    description: "Understand lessons and support learning at home.",
    icon: "👨‍👩‍👧",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("educator");
  const [busy, setBusy] = useState(false);

  const handleContinue = (guest = false) => {
    if (!selectedRole) {
      alert("Please choose who you are first.");
      return;
    }
    const params = new URLSearchParams();
    params.set("role", selectedRole);
    if (guest) params.set("guest", "1");
    setBusy(true);
    router.push(`/assistant?${params.toString()}`);
  };

  const scrollToFaq = () => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("elora-faq");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToFeedback = () => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("elora-feedback");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <Head>
        <title>Elora – AI Assistant for Education</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 text-slate-900 flex flex-col">
        {/* Top navigation */}
        <header className="w-full border-b border-slate-200/60 bg-white/60 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                E
              </div>
              <span className="font-semibold text-lg tracking-tight">
                Elora
              </span>
            </div>
            <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-700">
              <button
                onClick={() => router.push("/")}
                className="hover:text-indigo-600 transition-colors"
              >
                Home
              </button>
              <button
                onClick={scrollToFaq}
                className="hover:text-indigo-600 transition-colors"
              >
                FAQ
              </button>
              <button
                onClick={scrollToFeedback}
                className="hover:text-indigo-600 transition-colors"
              >
                Feedback
              </button>
              <button
                onClick={() => router.push("/verify")}
                className="px-3 py-1.5 rounded-full border border-indigo-500/70 text-indigo-600 text-xs font-medium hover:bg-indigo-50 transition-colors"
              >
                Sign In / Verify
              </button>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
            {/* Hero + role selection */}
            <div>
              <p className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-100">
                Built for real classrooms, not just chat.
              </p>
              <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
                Your AI teaching partner for lessons, practice, and parents.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl">
                Elora helps educators, students and parents design lessons,
                generate practice, and explain topics in a way that fits each
                syllabus and learning level.
              </p>

              <div className="mt-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">
                  Who are you?
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {ROLES.map((role) => {
                    const selected = role.id === selectedRole;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={`flex flex-col items-start text-left rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 shadow-sm transition-all ${
                          selected
                            ? "border-indigo-500 bg-white shadow-md ring-2 ring-indigo-200"
                            : "border-slate-200 bg-white/80 hover:border-indigo-300 hover:shadow-md"
                        }`}
                      >
                        <span className="text-2xl mb-2">{role.icon}</span>
                        <span className="font-semibold text-sm sm:text-base">
                          {role.title}
                        </span>
                        <span className="mt-1 text-xs sm:text-sm text-slate-600">
                          {role.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <button
                    type="button"
                    onClick={() => handleContinue(false)}
                    disabled={busy}
                    className="inline-flex justify-center items-center rounded-full bg-indigo-600 px-8 py-3 text-sm font-medium text-white shadow-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {busy ? "Opening Elora…" : "Continue"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleContinue(true)}
                    className="inline-flex justify-center items-center rounded-full border border-indigo-300 px-8 py-3 text-sm font-medium text-indigo-700 bg-white/70 hover:bg-indigo-50"
                  >
                    Try as Guest ✨
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Guest mode is free and instant. Verified accounts unlock
                  saving, exporting to Google Slides & Docs, and more.
                </p>
              </div>
            </div>

            {/* Right-hand feature preview card */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-3xl shadow-xl p-5 space-y-4 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Active teaching profile
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Singapore · Primary 5 · Math
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700">
                    Smart prompt builder
                  </span>
                </div>

                <div className="mt-2 border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/60">
                  <p className="text-xs font-semibold text-slate-700">
                    What do you want Elora to create?
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 border border-indigo-200 text-indigo-700 font-medium">
                      Plan a lesson
                    </span>
                    <span className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 border border-slate-200 text-slate-700">
                      Create worksheet
                    </span>
                    <span className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 border border-slate-200 text-slate-700">
                      Generate assessment
                    </span>
                    <span className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 border border-slate-200 text-slate-700">
                      Design slides
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Elora turns these choices into expert prompts so you don't
                    have to.
                  </p>
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                  Works for educators, students, and parents. Designed to fit
                  different countries and syllabuses over time.
                </div>
              </div>
            </div>
          </section>

          {/* FAQ + Feedback */}
          <section
            id="elora-faq"
            className="border-t border-slate-200/70 bg-white/70"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3 text-sm text-slate-700">
                  <details className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <summary className="font-medium cursor-pointer">
                      Do I need an account?
                    </summary>
                    <p className="mt-2 text-sm text-slate-600">
                      No. You can try Elora immediately. Accounts are only
                      needed later for saving work, syncing across devices, and
                      enabling advanced export tools.
                    </p>
                  </details>
                  <details className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <summary className="font-medium cursor-pointer">
                      Who is Elora for?
                    </summary>
                    <p className="mt-2 text-sm text-slate-600">
                      Elora is built for educators, students and parents. It
                      adapts its tone and suggestions depending on who is using
                      it and what they are trying to do.
                    </p>
                  </details>
                  <details className="rounded-xl border border-slate-200 bg-slate-200/40 px-4 py-3">
                    <summary className="font-medium cursor-pointer">
                      How is Elora different from normal AI chat?
                    </summary>
                    <p className="mt-2 text-sm text-slate-600">
                      Instead of making you guess the perfect prompt, Elora
                      asks structured questions (country, level, subject,
                      topic, and goal) and then builds expert prompts for you
                      behind the scenes.
                    </p>
                  </details>
                </div>
              </div>

              <div id="elora-feedback" className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Help us make Elora better
                </h2>
                <p className="text-sm text-slate-600">
                  This is an early prototype. Your feedback will directly shape
                  how Elora grows for Genesis 2026.
                </p>
                <a
                  href="mailto:your-email@example.com?subject=Elora%20feedback"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Send Feedback
                </a>
                <p className="text-xs text-slate-500">
                  You can also share ideas for new features: slides, Google
                  Docs, worksheets and more.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200/70 bg-white/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-[11px] sm:text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
            <span>© {new Date().getFullYear()} Elora. Built for schools.</span>
            <span>Made by Haris • Prototype for Genesis 2026</span>
          </div>
        </footer>
      </div>
    </>
  );
}
