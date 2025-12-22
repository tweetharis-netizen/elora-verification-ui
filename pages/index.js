// pages/index.js

import React, { useState } from 'react';

export default function EmailVerification() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const res = await fetch('/api/send-verification?email=' + encodeURIComponent(email));
      const data = await res.json();

      if (data.success) {
        setStatus('✅ Verification email sent! Please check your inbox.');
      } else {
        setStatus('❌ ' + (data.error || 'Failed to send email.'));
      }
    } catch (err) {
      setStatus('❌ ' + (err.message || 'Error sending email.'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl text-center border border-gray-200">
        <img src="/elora-logo.svg" alt="Elora Logo" className="w-14 h-14 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Verify Your Email</h1>
        <p className="text-sm text-gray-500 mb-6">2026 Elora • Your AI Teaching Assistant</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Send Verification
          </button>
        </form>

        {status && (
          <p className="mt-4 text-sm text-gray-600 whitespace-pre-line">{status}</p>
        )}

        <footer className="mt-8 text-xs text-gray-400">&copy; 2026 Elora. All rights reserved.</footer>
      </div>
    </div>
  );
}
