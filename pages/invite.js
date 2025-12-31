import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { activateTeacher, saveSession, getSession } from "@/lib/session";

export default function Invite() {
  const router = useRouter();
  const { code } = router.query;

  const [status, setStatus] = useState("Checking invite…");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const inviteCode = (Array.isArray(code) ? code[0] : code) || "";
    const trimmed = String(inviteCode).trim();
    if (!trimmed) {
      setStatus("Missing invite code. Ask the owner for a valid invite link.");
      setOk(false);
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(trimmed)}`);
        const data = await res.json().catch(() => null);

        if (cancelled) return;

        if (data?.ok) {
          activateTeacher(trimmed);
          saveSession(getSession());
          setOk(true);
          setStatus("Invite accepted. Teacher tools enabled.");
          setTimeout(() => router.replace("/assistant"), 650);
        } else {
          setOk(false);
          setStatus("Invalid invite code. Check your link or ask for a new one.");
        }
      } catch {
        if (!cancelled) {
          setOk(false);
          setStatus("Could not validate invite. Try again later.");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 120 }}>
        <div className="card" style={{ padding: 28, maxWidth: 760 }}>
          <h1 style={{ marginTop: 0 }}>{ok ? "Invite accepted ✅" : "Invite"}</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
