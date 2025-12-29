import { useState } from "react";

export default function Verify() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const sendEmail = async () => {
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) setStatus("✅ Verification email sent! Check your inbox.");
      else setStatus(`❌ ${data.error || "Failed to send email"}`);
    } catch (err) {
      setStatus("❌ Error sending email");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-gray-900">
      <div className="bg-indigo-950/60 p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-3">Verify your email</h1>
        <p className="text-gray-300 mb-6 text-sm">
          You’ll receive a secure link via email. Click it to verify and unlock exports.
        </p>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full mb-4 px-4 py-3 rounded-lg bg-gray-800 text-white outline-none border border-indigo-600 focus:ring-2 focus:ring-indigo-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={sendEmail}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-all font-semibold text-white"
        >
          {loading ? "Sending..." : "Send verification email"}
        </button>
        {status && <p className="text-gray-200 mt-4 text-sm">{status}</p>}
      </div>
    </div>
  );
}
