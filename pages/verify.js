import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function VerifyPage() {
  const router = useRouter();
  const token = useMemo(
    () => (typeof router.query.token === "string" ? router.query.token : ""),
    [router.query.token]
  );
  const error = useMemo(
    () => (typeof router.query.error === "string" ? router.query.error : ""),
    [router.query.error]
  );

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (token) {
      // IMPORTANT: confirm via FRONTEND API so cookie is set on UI domain
      window.location.href = `/api/verification/confirm?token=${encodeURIComponent(token)}`;
    }
  }, [token]);

  async function send() {
    setStatus("");
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setStatus("Enter a valid email address.");
      return;
    }

    setSending(true);
    setStatus("Sending…");
    try {
      const res = await fetch("/api/verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to send.");

      setStatus("Sent. Check inbox/spam and click the link to finish verification.");
    } catch (e) {
      setStatus(e?.message || "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto px-4" style={{ maxWidth: "var(--elora-page-max)" }}>
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/50 dark:bg-slate-950/35 backdrop-blur-xl shadow-2xl">
        <div className="absolute inset-0 elora-grain" />
        <div className="absolute -inset-24 bg-gradient-to-br from-indigo-500/25 via-sky-400/10 to-fuchsia-500/20 blur-3xl" />

        <div className="relative p-7 sm:p-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl">
            <span className="text-sm font-extrabold opacity-90">Verification unlocks exports</span>
          </div>

          <h1 className="mt-6 font-black tracking-tight text-[clamp(2rem,3.6vw,3rem)] leading-[1.05]">
            <span className="font-serif">Verify your email</span>
          </h1>

          <p className="mt-3 elora-muted text-[1.05rem] max-w-2xl leading-relaxed">
            We send a secure link. Click it to confirm on the server and unlock DOCX/PDF/PPTX exports across sessions.
          </p>

          {error ? (
            <div className="mt-5 p-4 rounded-2xl border border-red-500/30 bg-red-500/10">
              Link {error === "expired" ? "expired" : "invalid"}. Send a new one.
            </div>
          ) : null}

          <div className="mt-7 grid gap-3 max-w-xl">
            <label className="font-extrabold text-sm">Email</label>
            <input
              className="elora-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="elora-btn elora-btn-primary"
                onClick={send}
                type="button"
                disabled={sending}
              >
                Send verification email
              </button>
              <button className="elora-btn" type="button" onClick={() => router.push("/")}>
                Back to home
              </button>
            </div>

            {status ? <div className="elora-muted text-sm">{status}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
