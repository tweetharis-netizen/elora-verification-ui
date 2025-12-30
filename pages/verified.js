import { useEffect } from "react";
import { useRouter } from "next/router";
import { refreshVerifiedFromServer } from "@/lib/session";

export default function Verified() {
  const router = useRouter();

  useEffect(() => {
    refreshVerifiedFromServer();
    const t = setTimeout(() => router.replace("/"), 700);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 120 }}>
        <div className="card" style={{ padding: 28, maxWidth: 760 }}>
          <h1 style={{ marginTop: 0 }}>Verified ✅</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            You’re verified. Redirecting…
          </p>
        </div>
      </div>
    </div>
  );
}
