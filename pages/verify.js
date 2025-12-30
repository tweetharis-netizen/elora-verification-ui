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

  useEffect(() => {
    // New system: token is verified by BACKEND, not frontend.
    if (token) {
      const backend = (process.env.NEXT_PUBLIC_ELORA_BACKEND_URL || "https://elora-website.vercel.app").replace(/\/$/, "");
      window.location.href = `${backend}/api/verification/confirm?token=${encodeURIComponent(token)}`;
    }
  }, [token]);

  async function send() {
    setStatus("");
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setStatus("Enter a valid email address.");
      return;
    }
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
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="elora-card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 elora-grain" />
        <div className="relative">
          <h1 className="font-black text-[clamp(1.6rem,2.6vw,2.2rem)]">
            Verify your email
          </h1>
          <p className="mt-2 elora-muted">
            Verification unlocks exports (DOCX / PDF / PPTX). Verified only completes after clicking the email link.
          </p>

          {error ? (
            <div className="mt-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10">
              Link {error === "expired" ? "expired" : "invalid"}. Send a new one.
            </div>
          ) : null}

          <div className="mt-5 grid gap-3">
            <label className="font-extrabold text-sm">Email</label>
            <input
              className="elora-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <button className="elora-btn elora-btn-primary" onClick={send} type="button">
              Send verification email
            </button>

            {status ? <div className="elora-muted text-sm">{status}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
