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

// Cinematic progress steps component
function ProgressSteps({ currentStep }) {
  const steps = [
    { id: 1, name: "Enter email", icon: "📧" },
    { id: 2, name: "Check inbox", icon: "📬" },
    { id: 3, name: "Verified", icon: "✅" }
  ];

  return (
    <div className="flex items-center justify-between mb-10 relative">
      <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-purple-600/30 via-cyan-600/30 to-purple-600/30 -translate-y-1/2 z-0" />
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          className="relative z-10 flex flex-col items-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all duration-500 relative overflow-hidden ${
            currentStep >= step.id 
              ? 'bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-500 text-white shadow-2xl shadow-purple-500/40 animate-pulse-glow' 
              : 'bg-gradient-to-br from-slate-700 to-slate-800 text-cyan-400/60 border border-cyan-500/20'
          }`}>
            {currentStep >= step.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 animate-gradient-x" />
            )}
            {step.icon}
          </div>
          <span className={`text-xs font-black mt-3 tracking-wider uppercase ${
            currentStep >= step.id ? 'text-white drop-shadow-lg' : 'text-cyan-400/70'
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
    <div className="mx-auto max-w-4xl px-6 flex items-center justify-center min-h-[85vh] relative">
      {/* Cinematic background elements */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-gradient-to-r from-purple-600/10 via-cyan-600/10 to-pink-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", type: "spring" }}
        className="elora-card p-8 sm:p-12 w-full relative overflow-hidden backdrop-blur-2xl border border-purple-500/20"
      >
        {/* Cinematic glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-cyan-600/5 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

        <div className="relative z-10">
          <h1 className="font-black text-[clamp(26px,4vw,36px)] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 drop-shadow-2xl tracking-tight">
            Verify Your Email
          </h1>
          <p className="mt-3 text-base font-medium text-cyan-200/90 leading-relaxed">
            Verification unlocks the full cinematic Elora experience with enhanced AI capabilities and premium features.
          </p>

          <ProgressSteps currentStep={currentStep} />

          <div className="mt-8 space-y-4">
            <div className="relative group">
              <input
                className={`w-full px-6 py-4 text-base font-medium bg-gradient-to-r from-slate-800/90 via-slate-900/80 to-slate-800/90 border ${currentStep >= 2 ? 'border-cyan-500/30 text-cyan-300/80' : 'border-purple-500/30 text-white'} rounded-2xl backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/60 transition-all duration-300 placeholder:text-cyan-400/60 shadow-xl`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                inputMode="email"
                autoComplete="email"
                disabled={currentStep >= 2}
              />
              {/* Cinematic glow effect on focus */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-cyan-600/10 to-purple-600/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />
              {emailSent && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-pulse">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: sending || cooldown > 0 ? 1 : 1.02 }}
              whileTap={{ scale: sending || cooldown > 0 ? 1 : 0.98 }}
              type="button"
              className={`relative px-8 py-4 text-base font-black rounded-2xl transition-all duration-300 overflow-hidden ${
                emailSent 
                  ? 'bg-gradient-to-br from-green-600/90 to-cyan-600/90 border-green-500/30 shadow-lg shadow-green-500/30 text-white' 
                  : 'bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-500 border-purple-500/30 shadow-2xl shadow-purple-500/40 text-white hover:shadow-3xl hover:shadow-purple-500/50'
              }`}
              onClick={send}
              disabled={sending || cooldown > 0 || emailSent}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
              {sending ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="uppercase tracking-wider">Sending...</span>
                </span>
              ) : emailSent ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="uppercase tracking-wider">Email Sent!</span>
                </span>
              ) : cooldown > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="uppercase tracking-wider">Wait {cooldown}s</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3 uppercase tracking-wider">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Send Verification Email
                </span>
              )}
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
