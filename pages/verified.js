import Link from "next/link";
import { useEffect, useState } from "react";
import { refreshVerifiedFromServer } from "@/lib/session";

export default function Verified() {
  const [status, setStatus] = useState("Checking…");

  useEffect(() => {
    refreshVerifiedFromServer()
      .then((s) => setStatus(s?.verified ? "Verified." : "Not verified."))
      .catch(() => setStatus("Not verified."));
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4">
      <div className="elora-card p-6 sm:p-8">
        <h1 className="text-[1.3rem] font-black">Verification status</h1>
        <p className="mt-2 elora-muted">{status}</p>
        <div className="mt-5 flex gap-3">
          <Link href="/assistant" className="elora-btn elora-btn-primary">
            Go to Assistant
          </Link>
          <Link href="/verify" className="elora-btn">
            Verify again
          </Link>
        </div>
      </div>
    </div>
  );
}
