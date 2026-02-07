import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

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

  const token = useMemo(
    () => (typeof router.query.token === "string" ? router.query.token : ""),
    [router.query.token]
  );
  const isError = useMemo(() => Boolean(errorCode), [errorCode]);

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Backwards compatibility:
  // Old emails linked to /verify?token=...
  // We now confirm via /api/verification/confirm so cookies are set on the UI domain.
  useEffect(() => {
    if (!router.isReady) return;

    // 1. If we have a redirect param (sending flow), save it
    if (router.query.redirect) {
      localStorage.setItem("elora_redirect", String(router.query.redirect));
    }

    if (!token) return;

    // 2. If confirming, check for saved redirect
    const savedRedirect = localStorage.getItem("elora_redirect");
    const redirectParam = savedRedirect ? `&redirect=${encodeURIComponent(savedRedirect)}` : "";

    // Clear it after use so it doesn't stick forever
    localStorage.removeItem("elora_redirect");

    window.location.href = `/api/verification/confirm?token=${encodeURIComponent(token)}${redirectParam}`;
  }, [router.isReady, token, router.query.redirect]);

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
      const r = await fetch("/api/verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        if (data?.error === "rate_limited") {
          const retry = Number(data?.retryAfter || 30);
          setCooldown(Number.isFinite(retry) ? Math.min(120, Math.max(10, retry)) : 30);
          setStatus("Please wait a moment before trying again.");
        } else {
          setStatus("Could not send verification email. Please try again.");
        }
        return;
      }

      setCooldown(30);
      setStatus("Sent. Check your inbox (and spam) for a verification link.");
    } catch {
      setStatus("Could not reach the server. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 flex items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="elora-card p-6 w-full relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="elora-h1">Verify your email</h1>
          <p className="mt-2 text-sm elora-muted">
            Verification unlocks full teacher workflows (exports, assessments, and more). It persists across refreshes.
          </p>

          <div className="mt-6 grid gap-4">
            <label htmlFor="email" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Email</label>
            <input
              className="elora-input"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              inputMode="email"
              autoComplete="email"
              aria-describedby="verify-help"
              aria-invalid={isError}
            />

            <button
              type="button"
              className="elora-btn elora-btn-primary"
              onClick={send}
              disabled={sending || cooldown > 0}
              aria-busy={sending}
            >
              {sending ? "Sending…" : cooldown > 0 ? `Wait ${cooldown}s` : "Send verification email"}
            </button>

            {status ? (
              <div
                className="elora-toast text-sm"
                role="status"
                aria-live="polite"
              >
                {status}
              </div>
            ) : null}

            <div id="verify-help" className="elora-muted text-sm">
              Tip: If you don’t see it, check spam/junk. The link expires in under an hour.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
