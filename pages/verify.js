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
    const msg = mapError(errorCode);
    if (msg) {
      setStatus(msg);
      setStatusType("error");
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
      setStatus("Please enter a valid email address.");
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
          setStatus(`Too many requests. Please wait ${retry || 30} seconds before trying again.`);
          setStatusType("warning");
        } else {
          setStatus("Failed to send verification email. Please check your email and try again.");
          setStatusType("error");
        }
        return;
      }

      setCooldown(30);
      setStatus("✅ Verification email sent! Check your inbox (and spam folder) for the link.");
      setStatusType("success");
    } catch {
      setStatus("Network error. Please check your connection and try again.");
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
              whileHover={{ scale: sending || cooldown > 0 ? 1 : 1.01 }}
              whileTap={{ scale: sending || cooldown > 0 ? 1 : 0.99 }}
              type="button"
              className={`elora-btn relative overflow-hidden flex items-center justify-center gap-2 min-h-[44px] ${
                sending ? "opacity-75 cursor-not-allowed" : cooldown > 0 ? "opacity-60 cursor-not-allowed" : ""
              }`}
              onClick={send}
              disabled={sending || cooldown > 0}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending verification...
                </>
              ) : cooldown > 0 ? (
                <>
                  <div className="w-4 h-4 flex items-center justify-center">⏱️</div>
                  Wait {cooldown}s
                </>
              ) : (
                <>
                  <div className="w-4 h-4 flex items-center justify-center">✉️</div>
                  Send verification email
                </>
              )}
            </motion.button>

            {status ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`
                  rounded-xl p-4 text-sm font-medium
                  ${statusType === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                    statusType === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    statusType === "warning" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20"}
                `}
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
