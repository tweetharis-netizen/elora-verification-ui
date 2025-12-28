// pages/invite.js
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { getSession, saveSession } from '@/lib/session';

export default function Invite() {
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (!code) return;
    const s = getSession();
    if (!s.verified) {
      s.pendingInvite = code;
      saveSession(s);
      router.push('/verify');
    } else {
      s.teacher = true;
      s.teacherCode = code;
      saveSession(s);
      router.push('/assistant');
    }
  }, [code]);

  return (
    <div className="mt-24 text-center">
      <h1 className="text-2xl font-bold mb-2">Checking invite...</h1>
    </div>
  );
}
