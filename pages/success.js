// pages/success.js
import { useEffect } from 'react';
import { getSession, saveSession } from '@/lib/session';
import { useRouter } from 'next/router';

export default function Success() {
  const router = useRouter();
  useEffect(() => {
    const s = getSession();
    s.verified = true;
    // activate invite if pending
    if (s.pendingInvite) {
      s.teacher = true;
      s.teacherCode = s.pendingInvite;
      delete s.pendingInvite;
    }
    saveSession(s);
    setTimeout(() => router.push('/assistant'), 1200);
  }, []);
  return (
    <div className="mt-24 text-center">
      <h1 className="text-2xl font-bold mb-2">✅ Verification Success</h1>
      <p>Redirecting you to Elora...</p>
    </div>
  );
}
