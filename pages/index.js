// 📁 File: pages/index.js

import React, { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const res = await fetch(
        `https://elora-website.vercel.app/api/send-verification?email=${encodeURIComponent(
          email
        )}`
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      {/* Logo / Header */}
      <div className="text-center mb-8">
        {/* Inline SVG Logo (simple stylized Elora symbol) */}
        <svg
          width="100"
          height="100"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="256" cy="256" r="200" fill="#6c63ff" />
          <path
            d="M176 176H336V336H176z"
            fill="white"
          />
        </svg>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Elora</h1>
        <p className="text-gray-600">Your AI Teacher Assistant</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Verify Your Email
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 rounded-lg font-semibold hover:bg-indigo-600 transition"
          >
            Send Verification
          </button>
        </form>

        {status && (
          <p className="mt-4 text-center text-sm text-gray-700">{status}</p>
        )}
      </div>

      <footer className="text-xs text-gray-500 mt-8">
        &copy; {new Date().getFullYear()} Elora • All rights reserved.
      </footer>
    </div>
  );
}
