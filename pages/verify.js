import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

  function mapError(code) {
    switch (code) {
      case "rate_limited":
        return { message: "Too many attempts. Please wait a moment and try again.", type: "warning" };
      case "smtp_auth_failed":
        return { message: "Email service is temporarily unavailable. Try again soon.", type: "error" };
      case "invalid":
        return { message: "That verification link is invalid.", type: "error" };
      case "expired":
        return { message: "That verification link expired. Send a new one.", type: "warning" };
      case "backend_unreachable":
        return { message: "Server is unreachable. Please try again.", type: "error" };
      default:
        return { message: code ? "Something went wrong. Please try again." : "", type: "error" };
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

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [statusType, setStatusType] = useState("info"); // info, success, error, warning

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
    const result = mapError(errorCode);
    if (result.message) {
      setStatus(result.message);
      setStatusType(result.type);
    }
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
      setStatusType("error");
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
          setStatusType("warning");
        } else {
          setStatus("Could not send verification email. Please try again.");
          setStatusType("error");
        }
        return;
      }

      setCooldown(30);
      setStatus("✓ Sent! Check your inbox (and spam) for a verification link.");
      setStatusType("success");
    } catch {
      setStatus("Could not reach the server. Please try again.");
      setStatusType("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 flex items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="elora-card p-6 sm:p-8 w-full relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <h1 className="font-black text-[clamp(22px,3vw,30px)]">Verify your email</h1>
          <p className="mt-2 elora-muted">
            Verification unlocks full teacher workflows (exports, assessments, and more). It persists across refreshes.
          </p>

          <div className="mt-6 grid gap-3">
            <input
              className="elora-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              inputMode="email"
              autoComplete="email"
            />

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              className="elora-btn relative overflow-hidden"
              onClick={send}
              disabled={sending || cooldown > 0}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
              {sending ? "Sending…" : cooldown > 0 ? `Wait ${cooldown}s` : "Send verification email"}
            </motion.button>

            {status ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`elora-toast elora-toast-${statusType}`}
              >
                {status}
              </motion.div>
            ) : null}

            <div className="elora-muted text-sm">
              Tip: If you don’t see it, check spam/junk. The link expires in under an hour.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
