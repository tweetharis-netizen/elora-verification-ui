// 📁 pages/verify.js
import React, { useState } from 'react';

export default function Verify() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const res = await fetch(
        `https://elora-website.vercel.app/api/send-verification?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('✅ Email sent! Check your inbox.');
      } else {
        setStatus('❌ ' + (data.error || 'Failed to send email.'));
      }
    } catch (err) {
      setStatus('❌ ' + (err.message || 'Error sending email.'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full text-center">
        <img
          src="/elora-logo.svg"
          alt="Elora Logo"
          className="mx-auto w-16 h-16 mb-4"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Verify Your Email
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          2026 Elora • Your AI Teaching Assistant
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            Send Verification
          </button>
        </form>

        {status && (
          <p className="mt-4 text-sm text-gray-700">{status}</p>
        )}

        <footer className="text-xs text-gray-400 mt-8">
          &copy; 2026 Elora. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
