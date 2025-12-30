// pages/verified.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { setVerifiedLocal } from "@/lib/session";

export default function Verified() {
  const router = useRouter();

  useEffect(() => {
    const email = typeof router.query.email === "string" ? router.query.email : "";
    setVerifiedLocal(email);
    const t = setTimeout(() => router.replace("/"), 650);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="page">
      <div className="container">
        <div className="card" style={{ padding: 26, maxWidth: 720 }}>
          <h1 style={{ marginTop: 0 }}>You’re verified ✅</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            Elora will remember this on this device. Redirecting…
          </p>
        </div>
      </div>
    </div>
  );
}
