// pages/verify.js
import { useState } from 'react';
import { saveSession, getSession } from '@/lib/session';

export default function Verify() {
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(getSession().verified);

  const handleVerify = () => {
    const s = getSession();
    s.verified = true;
    saveSession(s);
    setVerified(true);
  };

  if (verified)
    return (
      <div className="mt-24 text-center">
        <h1 className="text-2xl font-bold mb-2">✅ Verified</h1>
        <p>You may now use educator features if you have an invite.</p>
      </div>
    );

  return (
    <div className="mt-24 mx-auto max-w-md text-center bg-white/10 p-6 rounded-xl backdrop-blur-md">
      <h1 className="text-xl font-bold mb-4">Verify Email</h1>
      <input
        className="w-full p-2 mb-4 rounded bg-white/20"
        placeholder="Enter school email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        onClick={handleVerify}
        className="w-full py-2 bg-blue-600 text-white rounded-md"
      >
        Verify
      </button>
    </div>
  );
}
