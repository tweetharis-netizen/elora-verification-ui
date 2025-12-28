// pages/success.js
import { useEffect, useState } from "react";
import { getSession, saveSession, activateTeacher } from "@/lib/session";
import { useRouter } from "next/router";

export default function Success() {
  const router = useRouter();
  const [msg, setMsg] = useState("Finalizing verification…");

  useEffect(() => {
    const run = async () => {
      const s = getSession();
      s.verified = true;
      saveSession(s);

      // If there was a pending invite, validate it server-side before unlocking
      if (s.pendingInvite) {
        const code = String(s.pendingInvite).trim();
        try {
          const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(code)}`);
          if (res.ok) {
            activateTeacher(code);
            setMsg("Verified + educator unlocked. Redirecting…");
          } else {
            setMsg("Verified, but invite code invalid. Redirecting…");
          }
        } catch {
          setMsg("Verified, but could not validate invite. Redirecting…");
        }

        const s2 = getSession();
        delete s2.pendingInvite;
        saveSession(s2);
      } else {
        setMsg("Verified. Redirecting…");
      }

      setTimeout(() => router.push("/assistant"), 900);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-24 text-center">
      <h1 className="text-2xl font-bold mb-2">✅ Success</h1>
      <p>{msg}</p>
    </div>
  );
}
