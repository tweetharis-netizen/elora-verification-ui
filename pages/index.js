import { useEffect, useState } from "react";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [dark, setDark] = useState(false);

  /* ---------- Theme Toggle ---------- */
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const sendVerification = async () => {
    if (!email) {
      setType("error");
      setStatus("Please enter a valid email.");
      return;
    }

    setLoading(true);
    setStatus("");
    setType("");

    try {
      const res = await fetch(
        "https://elora-website.vercel.app/api/send-verification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification email.");
      }

      setType("success");
      setStatus("Verification email sent. Check your inbox.");

      setCooldown(30);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      setType("error");
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-[#0b0f19] dark:to-[#0b0f19] px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111827] shadow-2xl p-8">

        {/* Theme Toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-600 text-indigo-700 dark:text-white transition"
          aria-label="Toggle theme"
        >
          {dark ? "☀️" : "🌙"}
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src="/elora-logo.svg" alt="Elora Logo" className="h-12" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center">
          Verify your email
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          Elora is your AI teaching assistant.
        </p>

        {/* Input */}
        <div className="mt-6">
          <input
            type="email"
            placeholder="teacher@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0b0f19] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Button */}
        <button
          onClick={sendVerification}
          disabled={loading || cooldown > 0}
          className={`mt-4 w-full py-3 rounded-lg font-medium text-white transition ${
            loading || cooldown > 0
              ? "bg-indigo-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading
            ? "Sending..."
            : cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Send verification email"}
        </button>

        {/* Status */}
        {status && (
          <div
            className={`mt-4 text-sm px-4 py-3 rounded-lg ${
              type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {status}
          </div>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          © 2026 Elora · Built for educators
        </p>
      </div>
    </main>
  );
}
