import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

function mapError(code) {
  switch (code) {
    case "rate_limited":
      return "Too many attempts. Please wait a moment and try again.";
    case "smtp_auth_failed":
      return "Email service is temporarily unavailable. Try again soon.";
    case "invalid":
      return "That verification link is invalid.";
    case "expired":
      return "That verification link expired. Send a new one.";
    case "backend_unreachable":
      return "Server is unreachable. Please try again.";
    default:
      return code ? "Something went wrong. Please try again." : "";
  }
}

export default function VerifyPage() {
  const router = useRouter();

  const errorCode = useMemo(
    () => (typeof router.query.error === "string" ? router.query.error : ""),
    [router.query.error]
  );

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const msg = mapError(errorCode);
    if (msg) setStatus(msg);
  }, [errorCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function send() {
    setStatus("");

    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setStatus("Enter a valid email address.");
      return;
    }

    if (cooldown > 0) return;

    setSending(true);
    try {
      const res = await fetch("/api/verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const err = String(data?.error || "send_failed");
        if (err === "rate_limited") {
          const retryAfter = Number(data?.retryAfter || 60);
          setCooldown(Math.max(1, Math.min(600, retryAfter)));
          setStatus("Rate limited. Please wait and try again.");
          return;
        }
        setStatus(mapError(err) || "Failed to send. Try again.");
        return;
      }

      setStatus("Sent. Check your inbox (and spam) and click the link to finish verification.");
    } catch {
      setStatus("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto px-4" style={{ maxWidth: "var(--elora-page-max)" }}>
      <div className="elora-card p-7 sm:p-10">
        <div className="elora-kicker">Verification</div>

        <h1 className="mt-5 elora-h1 text-[clamp(2rem,3.5vw,2.8rem)]">Verify your email</h1>
        <p className="mt-3 elora-muted max-w-2xl leading-relaxed">
          We’ll send a secure confirmation link. Verification unlocks DOCX / PDF / PPTX exports and persists across
          refresh.
        </p>

        <div className="mt-6 grid gap-3 max-w-xl">
          <label className="text-sm font-extrabold opacity-85">Email</label>
          <input
            className="elora-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="elora-btn elora-btn-primary"
              onClick={send}
              disabled={sending || cooldown > 0}
            >
              {cooldown > 0 ? `Wait ${cooldown}s` : sending ? "Sending…" : "Send verification email"}
            </button>

            <button type="button" className="elora-btn elora-btn-ghost" onClick={() => router.push("/")}>
              Back to home
            </button>
          </div>

          {status ? <div className="elora-muted text-sm">{status}</div> : null}
        </div>
      </div>
    </div>
  );
}
