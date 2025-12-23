import { useState } from "react";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState(""); // success | error
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const sendVerification = async () => {
    if (!email) {
      setType("error");
      setStatus("Please enter a valid email address.");
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

      // Start resend cooldown (45s)
      setCooldown(45);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Logo */}
        <div className="mb-4">
          <img
            src="/elora-logo.svg"
            alt="Elora Logo"
            className="mx-auto h-12"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900">
          Verify your email
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Elora is your AI teaching assistant.  
          Let’s get you set up.
        </p>

        {/* Input */}
        <div className="mt-6">
          <input
            type="email"
            placeholder="teacher@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Button */}
        <button
          onClick={sendVerification}
          disabled={loading || cooldown > 0}
          className={`mt-4 w-full py-3 rounded-lg text-white font-medium transition ${
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
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {status}
          </div>
        )}

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-400">
          © 2026 Elora · Built for educators
        </p>
      </div>
    </main>
  );
}
