import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getSession, saveSession, activateTeacher, refreshVerifiedFromServer } from "@/lib/session";

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
      // Always check backend truth
      const v = await refreshVerifiedFromServer().catch(() => ({ verified: false }));
      const s = getSession();

      if (!v?.verified && !s.verified) {
        // Not verified: store pending invite and go verify
        s.pendingInvite = inviteCode;
        saveSession(s);
        router.replace("/verify");
        return;
      }

      // Verified: validate invite server-side
      try {
        const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(inviteCode)}`);
        const out = await res.json().catch(() => null);

        if (!res.ok || !out?.ok) {
          setStatus({
            title: "Invalid invite code",
            detail: "This code is not valid. Ask the admin for a correct invite link/code.",
          });
          return;
        }

        activateTeacher(inviteCode);

        const s2 = getSession();
        s2.pendingInvite = "";
        saveSession(s2);

        router.replace("/assistant");
      } catch {
        setStatus({
          title: "Couldn’t validate invite",
          detail: "Try again later.",
        });
      }
    };

    run();
  }, [router.isReady, code, router]);

  return (
    <div className="mx-auto max-w-xl px-4">
      <div className="elora-card p-6 sm:p-8">
        <h1 className="text-[1.3rem] font-black">{status.title}</h1>
        <p className="mt-2 elora-muted">{status.detail}</p>
      </div>
    </div>
  );
}
