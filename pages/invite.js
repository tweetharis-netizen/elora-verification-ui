// pages/invite.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getSession, saveSession, activateTeacher } from "@/lib/session";

export default function Invite() {
  const router = useRouter();
  const { code } = router.query;

  const [status, setStatus] = useState({
    title: "Checking invite…",
    detail: "Please wait.",
  });

  useEffect(() => {
    if (!router.isReady) return;

    const inviteCode = (Array.isArray(code) ? code[0] : code || "").toString().trim();

    if (!inviteCode) {
      setStatus({
        title: "Missing invite code",
        detail: "Use a link like /invite?code=GENESIS2026 or enter a code in Settings.",
      });
      return;
    }

    const run = async () => {
      const s = getSession();

      // If not verified yet, store pending invite and send to verify
      if (!s.verified) {
        s.pendingInvite = inviteCode;
        saveSession(s);
        router.replace("/verify");
        return;
      }

      // Verified: validate server-side
      const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(inviteCode)}`);
      if (!res.ok) {
        setStatus({
          title: "Invalid invite code",
          detail: "This code is not valid. Ask the admin for a correct invite link/code.",
        });
        return;
      }

      activateTeacher(inviteCode);

      // clear pending if it exists
      const s2 = getSession();
      if (s2.pendingInvite) delete s2.pendingInvite;
      saveSession(s2);

      router.replace("/assistant");
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, code]);

  return (
    <div className="mt-24 text-center">
      <h1 className="text-2xl font-bold mb-2">{status.title}</h1>
      <p className="opacity-80">{status.detail}</p>
    </div>
  );
}
