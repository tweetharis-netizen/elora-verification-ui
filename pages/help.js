import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function FAQItem({ q, children }) {
  return (
    <details className="rounded-2xl border border-white/10 bg-white/45 dark:bg-slate-950/30 backdrop-blur-xl p-4">
      <summary className="cursor-pointer font-extrabold text-slate-950 dark:text-white">
        {q}
      </summary>
      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {children}
      </div>
    </details>
  );
}

export default function HelpPage() {
  const router = useRouter();
  const [tab, setTab] = useState("quickstart"); // quickstart | faq

  return (
    <>
      <Head>
        <title>Elora — Help</title>
        <meta name="description" content="Elora Help: quick start, examples, and FAQs." />
      </Head>

      <div className="py-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                  Help
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
                  Elora is designed to make prompting effortless: pick structured options, generate clean output, then refine.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab("quickstart")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-extrabold border transition",
                    tab === "quickstart"
                      ? "border-indigo-500/35 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200"
                      : "border-white/10 bg-white/45 dark:bg-slate-950/30 text-slate-900 dark:text-white hover:bg-white/65 dark:hover:bg-slate-950/45"
                  )}
                >
                  Quick Start
                </button>
                <button
                  type="button"
                  onClick={() => setTab("faq")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-extrabold border transition",
                    tab === "faq"
                      ? "border-indigo-500/35 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200"
                      : "border-white/10 bg-white/45 dark:bg-slate-950/30 text-slate-900 dark:text-white hover:bg-white/65 dark:hover:bg-slate-950/45"
                  )}
                >
                  FAQs
                </button>
              </div>
            </div>

            {tab === "quickstart" ? (
              <div className="mt-8 grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      title: "1) Choose context",
                      desc: "Pick your role + country/level + subject/topic. Elora uses this to generate the right style.",
                    },
                    {
                      title: "2) Pick an action",
                      desc: "Lesson, worksheet, assessment, slides — designed for classroom-ready output.",
                    },
                    {
                      title: "3) Refine & export",
                      desc: "Use refinement chips for improvements. Export DOCX/PDF/PPTX (verification required).",
                    },
                  ].map((x) => (
                    <div
                      key={x.title}
                      className="rounded-2xl border border-white/10 bg-white/45 dark:bg-slate-950/30 backdrop-blur-xl p-5"
                    >
                      <div className="text-base font-black text-slate-950 dark:text-white">{x.title}</div>
                      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{x.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/45 dark:bg-slate-950/30 backdrop-blur-xl p-5">
                  <div className="text-lg font-black text-slate-950 dark:text-white">
                    Example starts (for demos)
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Use these to jump straight into the Assistant. For Genesis, your strongest demo is Educator mode.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { title: "Lesson plan (Fractions)", desc: "Misconceptions + checks + differentiation" },
                      { title: "Worksheet (Algebra)", desc: "Scaffolded → core → challenge" },
                      { title: "Slides (Water cycle)", desc: "Engagement prompts + teacher notes" },
                    ].map((x) => (
                      <button
                        key={x.title}
                        type="button"
                        onClick={() => router.push("/assistant")}
                        className="text-left rounded-2xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-4 hover:bg-white/75 dark:hover:bg-slate-950/55 transition"
                      >
                        <div className="text-sm font-extrabold text-slate-950 dark:text-white">{x.title}</div>
                        <div className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{x.desc}</div>
                        <div className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-full shadow-lg shadow-indigo-500/20">
                          Open Assistant →
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 text-xs text-slate-600 dark:text-slate-400">
                    Tip: educators need verification + a teacher invite for locked educator tools.
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/assistant"
                    className="inline-flex px-6 py-3 rounded-full font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20"
                  >
                    Open Assistant
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                <FAQItem q="What is Elora?">
                  Elora is an AI teaching assistant built around one idea: most AI fails in schools because prompting is hard.
                  Elora makes it easy with structured options and refinement chips.
                </FAQItem>

                <FAQItem q="Why do I need to verify?">
                  Verification unlocks exports (DOCX/PDF/PPTX) and advanced features. Guest mode exists for a limited preview.
                </FAQItem>

                <FAQItem q="Why do teachers need an invite code?">
                  Educator tooling can generate assessments and teacher materials. Invite gating prevents students from pretending
                  to be teachers and accessing restricted tools.
                </FAQItem>

                <FAQItem q="What exports are supported?">
                  DOCX for editable documents, PDF for printing/Kami annotation, and PPTX for classroom-ready slides.
                </FAQItem>

                <FAQItem q="How should I get the best results?">
                  Start with structured options (role, level, subject, topic). Generate once, then use chips like “Add misconceptions”
                  or “Add differentiation” instead of rewriting huge prompts.
                </FAQItem>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/45 dark:bg-slate-950/30 backdrop-blur-xl p-5">
                  <div className="text-base font-black text-slate-950 dark:text-white">
                    Still stuck?
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    If something feels confusing, that’s a product bug — not a user problem. Send feedback and we’ll improve the flow.
                  </p>
                  <button
                    type="button"
                    className="mt-4 px-5 py-3 rounded-full font-extrabold text-white bg-sky-600 hover:bg-sky-700 shadow-xl shadow-sky-500/20"
                    onClick={() => (window.location.href = "mailto:feedback@elora.app?subject=Elora%20Help%20Feedback")}
                  >
                    Send feedback
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
            <Link href="/" className="font-bold hover:opacity-90">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
