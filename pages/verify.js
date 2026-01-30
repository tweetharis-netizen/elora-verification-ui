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

// New progress steps component
function ProgressSteps({ currentStep }) {
  const steps = [
    { id: 1, name: "Enter email", icon: "📧" },
    { id: 2, name: "Check inbox", icon: "📬" },
    { id: 3, name: "Verified", icon: "✅" }
  ];

  return (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0" />
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          className="relative z-10 flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all ${
            currentStep >= step.id 
              ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-lg' 
              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}>
            {step.icon}
          </div>
          <span className={`text-xs font-medium mt-2 ${
            currentStep >= step.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {step.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
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
  const [statusType, setStatusType] = useState("info"); // info, success, error, warning
  const [cooldown, setCooldown] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [emailSent, setEmailSent] = useState(false);

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

    setCurrentStep(3); // Show as verified state
    setStatusType("success");
    setStatus("Verifying your email... Redirecting shortly.");

    window.location.href = `/api/verification/confirm?token=${encodeURIComponent(token)}${redirectParam}`;
  }, [router.isReady, token, router.query.redirect]);

  useEffect(() => {
    const msg = mapError(errorCode);
    if (msg) {
      setStatus(msg);
      setStatusType("error");
      setCurrentStep(1);
    }
  }, [errorCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function send() {
    setStatus("");
    setStatusType("info");

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
          setStatus("Please wait a moment before trying again.");
          setStatusType("warning");
        } else {
          setStatus("Could not send verification email. Please try again.");
          setStatusType("error");
        }
        return;
      }

      setCooldown(30);
      setEmailSent(true);
      setCurrentStep(2);
      setStatusType("success");
      setStatus(`Email sent to ${trimmed}! Check your inbox (and spam folder).`);
    } catch {
      setStatus("Could not reach the server. Please try again.");
      setStatusType("error");
    } finally {
      setSending(false);
    }
  }

  // Enhanced status message styling based on type
  const statusStyles = {
    info: "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    success: "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800", 
    error: "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800",
    warning: "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800"
  };

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

          <ProgressSteps currentStep={currentStep} />

          <div className="mt-6 grid gap-4">
            <div className="relative">
              <input
                className={`elora-input pr-10 ${currentStep >= 2 ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                inputMode="email"
                autoComplete="email"
                disabled={currentStep >= 2}
              />
              {emailSent && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: sending || cooldown > 0 ? 1 : 1.01 }}
              whileTap={{ scale: sending || cooldown > 0 ? 1 : 0.99 }}
              type="button"
              className={`elora-btn relative overflow-hidden transition-all ${
                emailSent 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : ''
              }`}
              onClick={send}
              disabled={sending || cooldown > 0 || emailSent}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : emailSent ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Email sent!
                </span>
              ) : cooldown > 0 ? `Wait ${cooldown}s` : "Send verification email"}
            </motion.button>

            {status && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`p-4 rounded-xl border text-sm font-medium ${statusStyles[statusType]}`}
              >
                <div className="flex items-start gap-3">
                  {statusType === 'success' && (
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {statusType === 'error' && (
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {statusType === 'warning' && (
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {statusType === 'info' && (
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{status}</span>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3"
              >
                <h3 className="font-semibold text-slate-900 dark:text-white">Next steps:</h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Check your email inbox for the verification link
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Look in spam/junk folder if you don't see it
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Click the link to complete verification
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Link expires in 1 hour for security
                  </li>
                </ul>
              </motion.div>
            )}

            <div className="elora-muted text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Your verification status persists across refreshes
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
