import { useEffect, useState } from "react";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      setStatus("Verification email sent. Please check your inbox.");
    } catch (err) {
      setType("error");
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-[#0b0f19] dark:to-[#0b0f19] px-4">
      <div
        className={`relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111827] shadow-2xl p-8
        transition-all duration-700 ease-out
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Theme Toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full
          bg-indigo-100 dark:bg-indigo-600 text-indigo-700 dark:text-white
          hover:scale-105 transition text-sm font-medium"
        >
          {dark ? "☀️ Light" : "🌙 Dark"}
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src="/elora-logo.png" alt="Elora" className="h-14" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          Verify your email
        </h1>

        {/* ✅ UPDATED SLOGAN */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          Built to empower educators.
        </p>

        {/* Input */}
        <div className="mt-6">
          <input
            type="email"
            placeholder="teacher@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700
            bg-white dark:bg-[#0b0f19] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Button */}
        <button
          onClick={sendVerification}
          disabled={loading}
          className="mt-4 w-full py-3 rounded-lg font-medium text-white
          bg-indigo-600 hover:bg-indigo-700 transition"
        >
          {loading ? "Sending..." : "Send verification email"}
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
          © 2026 Elora · Built to empower educators
        </p>
      </div>
    </main>
  );
}
