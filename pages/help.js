import Link from "next/link";

export default function Help() {
  return (
    <div className="mx-auto max-w-4xl px-4">
      <div className="elora-card p-6 sm:p-8">
        <h1 className="font-black text-[clamp(1.6rem,2.4vw,2.2rem)]">Help</h1>
        <p className="mt-2 elora-muted">
          Quickstart, exports, verification, and educator invite flow — no fluff.
        </p>

        <hr className="my-6 border-white/10 dark:border-white/10" />

        <section>
          <h2 className="font-black text-lg">Quickstart</h2>
          <ol className="mt-3 grid gap-2 elora-muted">
            <li><b>1)</b> Go to <Link className="underline" href="/assistant">Assistant</Link>.</li>
            <li><b>2)</b> Pick role + options on the left (country/level/subject/topic).</li>
            <li><b>3)</b> Generate → refine using chat.</li>
            <li><b>4)</b> Verify email to unlock exports (DOCX / PDF / PPTX).</li>
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="font-black text-lg">Exports</h2>
          <p className="mt-2 elora-muted">
            Exports are locked until verified. After verification, export endpoints are enforced server-side (not UI-only).
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-black text-lg">Educator invite flow</h2>
          <p className="mt-2 elora-muted">
            If teacher tools are invite-protected, you must be verified first. Invite links look like:
          </p>
          <code className="mt-3 block p-3 rounded-xl border border-white/10 bg-white/10 dark:bg-white/5">
            /invite?code=YOURCODE
          </code>
        </section>

        <section className="mt-8">
          <h2 className="font-black text-lg">FAQ</h2>
          <div className="mt-3 grid gap-4">
            <div>
              <div className="font-extrabold">Why am I still seeing “Verify” after clicking the email link?</div>
              <div className="elora-muted mt-1">
                Verification is stored on the backend. If your browser blocked the redirect or you opened the link in an in-app browser, open it in Safari/Chrome and try again.
              </div>
            </div>
            <div>
              <div className="font-extrabold">Where’s my email?</div>
              <div className="elora-muted mt-1">
                Check spam/promotions. Gmail SMTP can land in promotions; a dedicated provider improves deliverability.
              </div>
            </div>
            <div>
              <div className="font-extrabold">Does guest mode work?</div>
              <div className="elora-muted mt-1">
                Yes, but it’s limited. Verification unlocks exports and higher-capacity workflows.
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/verify" className="elora-btn elora-btn-primary">Verify</Link>
          <Link href="/settings" className="elora-btn">Settings</Link>
        </div>
      </div>
    </div>
  );
}
