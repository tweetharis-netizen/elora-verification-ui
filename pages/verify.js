import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  activateTeacher,
  clearPendingInvite,
  getPendingInvite,
  isTeacher,
  isVerified,
  setVerified,
} from "../lib/session";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Verify() {
  const router = useRouter();
  const token = typeof router.query.token === "string" ? router.query.token : "";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | confirming | ok | error
  const [message, setMessage] = useState("");

  // Confirm link flow
  useEffect(() => {
    if (!router.isReady) return;
    if (!token) return;

    let cancelled = false;
    (async () => {
      setStatus("confirming");
      setMessage("Confirming your verification link...");

      try {
        const res = await fetch(`/api/verify/confirm?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("Verification link is invalid or expired.");

        if (cancelled) return;

        // Mark verified in this browser
        setVerified(true, data.email);

        // If they saved an invite before verifying, activate it now
        const pending = getPendingInvite();
        if (pending && !isTeacher()) {
          const inviteRes = await fetch("/api/teacher-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: pending }),
          });
          const inviteData = await inviteRes.json().catch(() => ({}));
          if (inviteRes.ok && inviteData.ok) {
            activateTeacher(pending);
            clearPendingInvite();
          }
        }

        setStatus("ok");
        setMessage("Verified! Redirecting...");
        setTimeout(() => router.replace("/assistant"), 700);
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e?.message || "Verification failed.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, token, router]);

  async function sendEmail() {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const pendingInvite = getPendingInvite();
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, pendingInvite: pendingInvite || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.missing) throw new Error(`Missing env vars: ${data.missing.join(", ")}`);
        throw new Error("Could not send verification email.");
      }

      setStatus("sent");
      setMessage("Sent! Check inbox and spam. Use the newest email — older links expire.");
    } catch (e) {
      setStatus("error");
      setMessage(e?.message || "Could not send verification email.");
    }
  }

  return (
    <>
      <Head><title>Elora — Verify</title></Head>

      <div className="min-h-[calc(100vh-88px)] px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[28px] border border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Verify your email
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Verification unlocks exports (DOCX / PDF / PPTX).
            </p>

            {!token && !isVerified() && (
              <div className="mt-6 space-y-4">
                <label className="block">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Email</div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/60 dark:bg-slate-950/40 px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/50"
                    autoComplete="email"
                    inputMode="email"
                  />
                </label>

                <button
                  onClick={sendEmail}
                  disabled={status === "sending"}
                  className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-3"
                >
                  {status === "sending" ? "Sending…" : "Send verification email"}
                </button>

                <div className="rounded-2xl border border-white/10 bg-white/40 dark:bg-slate-950/20 p-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="font-semibold text-slate-700 dark:text-slate-200">Gmail tip</div>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    <li>If it’s in spam, click <b>Not spam</b>.</li>
                    <li>Use the newest email — older links expire.</li>
                    <li>Open the link in your browser (not an in-app preview).</li>
                  </ul>
                </div>
              </div>
            )}

            {(token || status === "sent" || status === "error" || status === "confirming" || isVerified()) && (
              <div
                className={`mt-6 rounded-2xl border p-4 text-sm ${
                  status === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : isVerified()
                      ? "border-green-500/30 bg-green-500/10 text-green-200"
                      : "border-white/10 bg-white/40 dark:bg-slate-950/20 text-slate-600 dark:text-slate-300"
                }`}
              >
                {isVerified() ? "You’re verified on this device." : message}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
