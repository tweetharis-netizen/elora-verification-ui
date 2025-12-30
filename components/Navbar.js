// Navbar.js
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";

function LogoMark() {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.10)",
      display: "grid", placeItems: "center"
    }}>
      <span style={{ fontWeight: 800, letterSpacing: 0.5 }}>E</span>
    </div>
  );
}

export default function Navbar() {
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    const onUpdate = () => setSession(getSession());
    window.addEventListener("elora:session", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("elora:session", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      height: 76,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      background: "rgba(0,0,0,0.18)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(16px)"
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LogoMark />
          <div style={{ fontWeight: 800, fontSize: 18 }}>Elora</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/"><span className="muted" style={{ fontWeight: 600 }}>Home</span></Link>
          <Link href="/assistant"><span className="muted" style={{ fontWeight: 600 }}>Assistant</span></Link>
          <Link href="/help"><span className="muted" style={{ fontWeight: 600 }}>Help</span></Link>
          <Link href="/settings"><span className="muted" style={{ fontWeight: 600 }}>Settings</span></Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {session.verified ? (
            <span className="pill">Verified</span>
          ) : (
            <Link className="btn primary" href="/verify">Verify</Link>
          )}
        </div>
      </div>
    </div>
  );
}
