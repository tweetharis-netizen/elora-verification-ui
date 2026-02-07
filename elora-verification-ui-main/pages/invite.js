import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { activateTeacher, getSession, saveSession } from "@/lib/session";

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
        setStatus("Validating invite…");

        const result = await activateTeacher(trimmed);

        if (cancelled) return;

        if (result?.ok) {
          setOk(true);
          setStatus("Invite accepted. Teacher tools enabled.");
          setTimeout(() => router.replace("/assistant"), 650);
          return;
        }

        // If they aren’t verified yet, store the code and send them to verify first.
        if (result?.error === "not_verified" || result?.error === "missing_session") {
          const s = getSession();
          s.pendingInvite = trimmed;
          saveSession(s);

          setOk(false);
          setStatus("Please verify your email first. We’ll apply the invite after verification.");
          setTimeout(() => router.replace("/verify"), 850);
          return;
        }

        setOk(false);
        setStatus("Invalid invite code. Check your link or ask for a new one.");
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
