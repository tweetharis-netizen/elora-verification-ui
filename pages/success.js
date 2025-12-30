import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getSession,
  saveSession,
  activateTeacher,
  refreshVerifiedFromServer,
} from "@/lib/session";

export default function Success() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizing verification…");

  useEffect(() => {
    if (!router.isReady) return;

    const code = String(router.query?.code || "").trim();
    if (!code) {
      setMsg("Missing verification code. Try verifying again.");
      return;
    }

    const run = async () => {
      try {
        // Exchange code -> sets httpOnly cookie via API route
        const r = await fetch("/api/verification/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await r.json().catch(() => null);
        if (!r.ok || !data?.ok) throw new Error(data?.error || "Exchange failed.");

        // Sync local cache for UI
        await refreshVerifiedFromServer();

        const s = getSession();

        // If pending invite exists, validate server-side and unlock educator
        if (s.pendingInvite) {
          const inviteCode = String(s.pendingInvite).trim();
          try {
            const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(inviteCode)}`);
            const out = await res.json().catch(() => null);
            if (res.ok && out?.ok) {
              activateTeacher(inviteCode);
              setMsg("Verified + educator unlocked. Redirecting…");
            } else {
              setMsg("Verified, but invite invalid. Redirecting…");
            }
          } catch {
            setMsg("Verified, but invite validation failed. Redirecting…");
          }

          const s2 = getSession();
          s2.pendingInvite = "";
          saveSession(s2);
        } else {
          setMsg("Verified. Redirecting…");
        }

        setTimeout(() => router.push("/assistant"), 700);
      } catch (e) {
        setMsg(e?.message || "Failed to finalize verification.");
      }
    };

    run();
  }, [router.isReady, router.query, router]);

  return (
    <div className="mx-auto max-w-xl px-4">
      <div className="elora-card p-6 sm:p-8">
        <h1 className="text-[1.3rem] font-black">✅ Success</h1>
        <p className="mt-2 elora-muted">{msg}</p>
      </div>
    </div>
  );
}
