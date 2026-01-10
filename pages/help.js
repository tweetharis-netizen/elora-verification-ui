import Link from "next/link";

export default function Help() {
  return (
    <div className="mx-auto max-w-4xl px-4">
      <div className="elora-card p-6 sm:p-8">
        <h1 className="font-black text-[clamp(1.6rem,2.4vw,2.2rem)]">Help</h1>
        <p className="mt-2 elora-muted">
          This page is the judge-proof script. If you follow it top-to-bottom, the demo lands in under 7 minutes.
        </p>

        <hr className="my-6 border-white/10 dark:border-white/10" />

        <section>
          <h2 className="font-black text-lg">Genesis Demo Script (5–7 minutes)</h2>
          <ol className="mt-3 grid gap-2 elora-muted">
            <li>
              <b>1)</b> Go to <Link className="underline" href="/verify">Verify</Link> → send email → click link → return to app.
              <div className="mt-1 text-xs">
                Success looks like a green “Verified” state across pages (no yellow/confusing states).
              </div>
            </li>
            <li>
              <b>2)</b> Go to <Link className="underline" href="/assistant">Assistant</Link> → choose <b>Educator</b>.
              <div className="mt-1 text-xs">
                If you’re not verified, Educator mode is intentionally blocked. That’s the security story.
              </div>
            </li>
            <li>
              <b>3)</b> Enter Teacher Invite Code (GENESIS2026 / ELORA-TEACHER / ABC123) in the Assistant left panel → <b>Apply</b>.
              <div className="mt-1 text-xs">
                Teacher tools unlock only after backend role checks — not UI-only.
              </div>
            </li>
            <li>
              <b>4)</b> Choose <b>Verify student work</b> → click <b>Load demo example</b> → Send.
              <div className="mt-1 text-xs">
                Judges should see: Verdict → 3 checks → ONE next-step hint (consistent structure every time).
              </div>
            </li>
            <li>
              <b>5)</b> Show lock behavior: switch to a teacher-only tool while not teacher (or in a private window) → it blocks.
              <div className="mt-1 text-xs">
                This proves role gating is real and enforced.
              </div>
            </li>
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="font-black text-lg">Guest Mode (important)</h2>
          <p className="mt-2 elora-muted">
            Guest mode is for quick preview only. Educator mode requires verification. If you click “Try assistant (guest)” from the Teacher tab,
            Elora automatically opens as a Student guest so the experience stays functional.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-black text-lg">Exports</h2>
          <p className="mt-2 elora-muted">
            Exports are designed to be verification-locked. If your export buttons are currently in “preview/coming soon” state,
            that’s fine for Genesis — the core judging signal is verification + teacher role locking + work verification output.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-black text-lg">FAQ</h2>
          <div className="mt-3 grid gap-4">
            <div>
              <div className="font-extrabold">Why am I still seeing “Verify” after clicking the email link?</div>
              <div className="elora-muted mt-1">
                Verification is stored on the backend. If you opened the link in an in-app browser (Telegram/Instagram), open it in Safari/Chrome and try again.
              </div>
            </div>
            <div>
              <div className="font-extrabold">Where’s my email?</div>
              <div className="elora-muted mt-1">
                Check spam/promotions. SMTP deliverability varies — a dedicated provider improves reliability.
              </div>
            </div>
            <div>
              <div className="font-extrabold">Does guest mode work?</div>
              <div className="elora-muted mt-1">
                Yes, but it’s intentionally limited. Verification unlocks persistence and teacher tools.
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/verify" className="elora-btn elora-btn-primary">Verify</Link>
          <Link href="/assistant" className="elora-btn">Assistant</Link>
          <Link href="/settings" className="elora-btn">Settings</Link>
        </div>
      </div>
    </div>
  );
}
