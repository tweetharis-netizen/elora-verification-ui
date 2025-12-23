import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://elora-website.vercel.app";

export default function Verify() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Theme
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("elora-theme")
        : null;
    const initial = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("elora-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

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
        // If backend ever returns non-json, show readable error
        throw new Error(text || "Unexpected response from server.");
      }

      if (!res.ok) {
        setStatus({
          type: "error",
          message: data?.error || "Failed to send verification email.",
        });
      } else {
        setStatus({
          type: "success",
          message: "Verification email sent. Please check your inbox.",
        });
        setCooldown(20);
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.message || "Failed to fetch.",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = theme === "dark" ? "Light" : "Dark";
  const toggleIcon = theme === "dark" ? "☀️" : "🌙";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-[#070A12] dark:via-[#070A12] dark:to-[#0B1020]">
      <div className="relative w-full max-w-xl">
        {/* soft glow */}
        <div className="absolute -inset-6 blur-3xl opacity-30 dark:opacity-25 bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400 rounded-[40px]" />

        <div className="relative bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-white/10 p-8 sm:p-10">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/elora-logo.png"
                alt="Elora"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Elora
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Built to empower educators.
                </div>
              </div>
            </div>

            {/* Clear toggle (pill + label) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-white/10 dark:text-indigo-200 dark:hover:bg-white/15 transition active:scale-[0.98]"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              <span className="text-base">{toggleIcon}</span>
              <span className="text-sm font-semibold">{toggleLabel}</span>
            </button>
          </div>

          {/* Title */}
          <div className="mt-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Verify your email
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              We’ll send you a secure verification link.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/90 text-slate-900 shadow-sm outline-none transition
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           dark:bg-white/5 dark:text-slate-100 dark:border-white/10"
              />
            </div>

            <button
              type="submit"
              disabled={!canSend}
              className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition active:scale-[0.99]
                ${
                  !canSend
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
            >
              {loading
                ? "Sending…"
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Send verification email"}
            </button>

            {/* Status */}
            {status.message && (
              <div
                className={`mt-2 rounded-xl px-4 py-3 text-sm border transition
                  ${
                    status.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800/30"
                      : "bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800/30"
                  }`}
              >
                {status.message}
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            © 2026 Elora · Built to empower educators
          </div>
        </div>
      </div>
    </main>
  );
}
