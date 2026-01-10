import Link from "next/link";

function Step({ n, title, children, href, cta }) {
  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 grid place-items-center">
          <span className="text-sm font-black text-slate-900 dark:text-white">{n}</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-extrabold text-slate-950 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">{children}</div>
          {href ? (
            <div className="mt-3">
              <Link
                href={href}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
              >
                {cta || "Open"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Help() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="elora-card p-6 sm:p-8">
        <h1 className="font-black text-[clamp(1.7rem,2.6vw,2.4rem)]">Demo (5–7 minutes)</h1>
        <p className="mt-2 elora-muted">
          Judges have zero patience. This is the exact click-path. If you follow it, the demo lands.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Step n="1" title="Verify email (shows persistence + security)" href="/verify" cta="Open Verify">
            Enter email → click the link → return to the app.
            <div className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              Success signal: a green “Verified” badge stays after refresh.
            </div>
          </Step>

          <Step n="2" title="Open Assistant (student-safe explanations)" href="/assistant" cta="Open Assistant">
            Ask a simple question (e.g. “What is 5 divided by 4?”).
            <div className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              Success signal: plain language, short steps, no raw LaTeX.
            </div>
          </Step>

          <Step n="3" title="Unlock Teacher Tools (invite-gated, not cosmetic)" href="/assistant" cta="Back to Assistant">
            Enter a Teacher Invite Code: <b>GENESIS2026</b>, <b>ELORA-TEACHER</b>, or <b>ABC123</b> → Apply.
            <div className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              Success signal: it says “Teacher role active ✅” and teacher tools stop blocking.
            </div>
          </Step>

          <Step n="4" title="Run “Verify student work” (the hero feature)" href="/assistant" cta="Verify Work">
            Click <b>Verify student work</b> → load a demo example → Send.
            <div className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              Success signal: Verdict → 3 checks → 1 next step (consistent structure).
            </div>
          </Step>
        </div>

        <div className="mt-4">
          <Step n="5" title="Prove locks work (in a private window)">
            Open a private/incognito window → go to Assistant → try teacher tools.
            <div className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              Success signal: teacher tools are blocked until invite is redeemed (backend enforced).
            </div>
          </Step>
        </div>

        <hr className="my-8 border-white/10 dark:border-white/10" />

        <h2 className="text-lg font-black text-slate-950 dark:text-white">Quick fixes (demo day)</h2>
        <ul className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-300">
          <li>
            <b>Email delayed?</b> Use a pre-verified account for the live run, then mention verification takes 30–60 seconds normally.
          </li>
          <li>
            <b>Guest mode confusion?</b> Guest preview intentionally runs Student mode; Educator requires verification.
          </li>
          <li>
            <b>Need to paste multi-line?</b> In chat: <b>Shift+Enter</b> for a new line.
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/verify" className="elora-btn elora-btn-primary">
            Verify
          </Link>
          <Link href="/assistant" className="elora-btn">
            Assistant
          </Link>
          <Link href="/settings" className="elora-btn">
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
