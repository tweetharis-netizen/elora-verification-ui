import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://elora-website.vercel.app";

export default function Verify() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const canSend = useMemo(() => !loading && cooldown <= 0, [loading, cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ type: "error", message: "Please enter an email." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/send-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: trimmed }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Unexpected response from server.");
      }

      if (!res.ok) {
        setStatus({
          type: "error",
          message: data?.error || "Failed to send verification email.",
        });
        return;
      }

      setStatus({
        type: "success",
        message: "Verification email sent. Check your inbox (and spam).",
      });
      setCooldown(20);
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.message || "Failed to fetch.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="relative w-full max-w-xl">
        <div className="absolute -inset-6 blur-3xl opacity-30 dark:opacity-25 bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400 rounded-[40px]" />

        <div className="relative rounded-2xl border border-white/10 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl shadow-2xl p-8 sm:p-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/elora-logo.png"
                alt="Elora"
                className="w-11 h-11 rounded-xl object-contain bg-white/50 dark:bg-slate-950/30 border border-white/10"
              />
              <div className="leading-tight">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Elora
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Verify to unlock exports + teacher tools
                </div>
              </div>
            </div>

            <Link
              href="/assistant"
              className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white"
            >
              Back to Assistant →
            </Link>
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            Verify your email
          </h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            We’ll send you a secure verification link.
          </p>

          <form className="mt-6" onSubmit={handleSubmit}>
            <label className="text-sm font-bold text-slate-900 dark:text-white">
              Email address
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/65 dark:bg-slate-950/35 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
            />

            <button
              type="submit"
              disabled={!canSend}
              className={[
                "mt-4 w-full rounded-full px-6 py-3 font-extrabold text-white shadow-lg shadow-indigo-500/20",
                canSend ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-400 cursor-not-allowed",
              ].join(" ")}
            >
              {loading ? "Sending…" : cooldown > 0 ? `Wait ${cooldown}s` : "Send verification email"}
            </button>

            {status.message ? (
              <div
                className={[
                  "mt-4 rounded-xl border px-4 py-3 text-sm",
                  status.type === "success"
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                    : "border-rose-400/30 bg-rose-500/10 text-rose-700 dark:text-rose-200",
                ].join(" ")}
              >
                {status.message}
              </div>
            ) : null}
          </form>

          <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            © 2026 Elora • Built for real classrooms
          </div>
        </div>
      </div>
    </main>
  );
}
