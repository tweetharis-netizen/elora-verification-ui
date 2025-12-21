// 📁 File: pages/index.js

import React, { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const res = await fetch(`https://elora-website.vercel.app/api/send-verification?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('✅ Email sent! Please check your inbox.');
      } else {
        setStatus('❌ Failed to send email.');
      }
    } catch (err) {
      setStatus('❌ Error sending email.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <img src="https://elora-static.vercel.app/elora-logo.svg" alt="Elora Logo" width="100" style={{ marginBottom: '1rem' }} />
      <h1 style={{ color: '#1f2937' }}>Verify Your Email</h1>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '400px',
        marginTop: '1rem'
      }}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: '0.75rem',
            fontSize: '1rem',
            marginBottom: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem'
          }}
        />
        <button type="submit" style={{
          padding: '0.75rem',
          backgroundColor: '#3b82f6',
          color: '#fff',
          fontSize: '1rem',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer'
        }}>Send Verification</button>
      </form>
      {status && <p style={{ marginTop: '1rem', color: '#4b5563' }}>{status}</p>}
    </div>
  );
}
