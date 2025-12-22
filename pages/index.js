// 📁 pages/index.js

import React, { useState } from "react";

export default function Verify() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const res = await fetch(
        `https://elora-website.vercel.app/api/send-verification?email=${encodeURIComponent(
          email
        )}`
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("✅ Email sent! Please check your inbox.");
      } else {
        setStatus("❌ " + (data.error || "Failed to send email."));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setStatus("❌ " + (err.message || "Error sending email."));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl text-center border border-gray-200">
        <img
          src="/elora-logo.svg"
          alt="Elora Logo"
          className="w-16 h-16 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Verify Your Email
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          2026 Elora • Your AI Teaching Assistant
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Send Verification
          </button>
        </form>

        {status && (
          <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">
            {status}
          </p>
        )}

        <footer className="mt-8 text-xs text-gray-400">
          &copy; 2026 Elora. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
