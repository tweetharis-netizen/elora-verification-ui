import { useEffect } from "react";
import { useRouter } from "next/router";
import { refreshVerifiedFromServer } from "@/lib/session";

function readAndClearRedirect() {
  if (typeof window === "undefined") return "";
  try {
    const key = "elora_post_verify_redirect_v1";
    const v = window.localStorage.getItem(key) || "";
    if (v) window.localStorage.removeItem(key);
    return String(v || "");
  } catch {
    return "";
  }
}

export default function Verified() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    (async () => {
      await refreshVerifiedFromServer();

      if (!alive) return;

      const redirect = readAndClearRedirect();
      if (redirect) {
        router.replace(redirect);
        return;
      }

      router.replace("/");
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-[720px] px-4">
      <div className="elora-card p-6 sm:p-8" role="status" aria-live="polite">
        <h1 className="elora-h1">Email verified</h1>
        <p className="mt-2 elora-muted">Verification complete. Redirecting…</p>
      </div>
    </div>
  );
}
