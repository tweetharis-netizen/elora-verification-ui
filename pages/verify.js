// 📁 File: pages/verify.js

import React from 'react';
import Link from 'next/link';

export default function VerifySuccessPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0fdf4',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: '#ecfdf5',
        border: '1px solid #10b981',
        padding: '2rem',
        borderRadius: '1rem',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', color: '#065f46' }}>✅ Email Verified!</h1>
        <p style={{ marginTop: '1rem', color: '#047857' }}>
          Thank you! Your email has been successfully verified. You may now return to the platform.
        </p>
        <Link href="/" passHref>
          <button style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}>
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}
