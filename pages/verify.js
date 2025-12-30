// pages/verify.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function VerifyPage() {
  const router = useRouter();
  const token = useMemo(() => (typeof router.query.token === "string" ? router.query.token : ""), [router.query.token]);
  const error = useMemo(() => (typeof router.query.error === "string" ? router.query.error : ""), [router.query.error]);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    // If user clicked the email link -> token exists -> confirm on server -> redirect to /verified
    if (token) {
      window.location.href = `/api/verification/confirm?token=${encodeURIComponent(token)}`;
    }
  }, [token]);

  async function send() {
    setStatus("");
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setStatus("Enter a valid email address.");
      return;
    }
    setStatus("Sending…");
    try {
      const res = await fetch("/api/verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setStatus("Sent! Check inbox/spam. Click the link to complete verification.");
    } catch (e) {
      setStatus(e.message || "Failed to send.");
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="card" style={{ padding: 28, maxWidth: 760 }}>
          <h1 style={{ marginTop: 0 }}>Verify your email</h1>
          <p className="muted">
            Verification unlocks exports (DOCX / PDF / PPTX). Verified only happens after you click the link in the email.
          </p>

          {error ? (
            <div style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,120,120,0.35)",
              background: "rgba(255,80,80,0.10)",
              marginBottom: 14
            }}>
              Link {error === "expired" ? "expired" : "invalid"}. Please send a new one.
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ fontWeight: 700 }}>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                height: 48,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.20)",
                color: "white",
                padding: "0 14px",
                outline: "none"
              }}
            />

            <button className="btn primary" onClick={send}>Send verification email</button>

            {status ? <div className="muted">{status}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
