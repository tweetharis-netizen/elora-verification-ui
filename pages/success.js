import { useEffect, useState } from "react";
import { setGuest, setVerified } from "../lib/session";

export default function SuccessPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // For prototype: treat successful email verification landing as verified.
    setVerified(true);
    setGuest(false);
    setDone(true);

    const t = setTimeout(() => {
      window.location.href = "/assistant";
    }, 900);

    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl p-6 text-center shadow-2xl">
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">
          Email verified ✅
        </h1>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          You’re all set. Redirecting you to Elora…
        </p>
        <div className="mt-5">
          <button
            className="px-5 py-3 rounded-full font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            onClick={() => (window.location.href = "/assistant")}
          >
            Continue
          </button>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {done ? "Verified session stored in this browser." : "…"}
        </div>
      </div>
    </main>
  );
}
