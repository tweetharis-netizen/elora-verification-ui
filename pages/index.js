import React, { useState, useEffect } from 'react';

export default function EmailVerification() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const res = await fetch(`/api/send-verification?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.success) {
        setStatus('✅ Email sent! Please check your inbox.');
      } else {
        setStatus('❌ ' + (data.error || 'Failed to send email.'));
      }
    } catch (err) {
      setStatus('❌ ' + (err.message || 'Error sending email.'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 from-white to-gray-100 px-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow hover:scale-105 transition"
          title="Toggle Theme"
        >
          {darkMode ? '🌙' : '☀️'}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
        <div className="flex justify-center mb-4">
          <img src="/elora-logo.svg" alt="Elora Logo" className="w-16 h-16" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Verify Your Email</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">2026 Elora • Your AI Teaching Assistant</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Send Verification
          </button>
        </form>

        {status && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {status}
          </div>
        )}

        <footer className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          &copy; 2026 Elora. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
