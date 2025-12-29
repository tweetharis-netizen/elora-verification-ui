// pages/verify.js
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getSession,
  saveSession,
  setVerified,
  setGuest,
  getPendingInvite,
  clearPendingInvite,
  activateTeacher,
} from "@/lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function Verify() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ kind: "idle", msg: "" }); // idle | ok | err | loading
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("elora:session", sync);
    return () => window.removeEventListener("elora:session", sync);
  }, []);

  const pendingInvite = useMemo(() => getPendingInvite(), [session.verified, session.teacher]);

  useEffect(() => {
    // If the user just verified and there is a pending invite, apply it.
    const run = async () => {
      const s = getSession();
      if (!s.verified) return;
      const code = getPendingInvite();
      if (!code) return;

      setStatus({ kind: "loading", msg: "Applying teacher invite…" });

      try {
        const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(code)}`);
        if (res.ok) {
          activateTeacher(code);
          clearPendingInvite();
          setStatus({ kind: "ok", msg: "Teacher access unlocked ✅" });
        } else {
          clearPendingInvite();
          setStatus({ kind: "err", msg: "Invite code was invalid (ask for a new link)." });
        }
      } catch {
        setStatus({ kind: "err", msg: "Could not validate invite (network error)." });
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.verified]);

  const verifyNow = () => {
    const e = email.trim();
    if (!e || !e.includes("@")) {
      setStatus({ kind: "err", msg: "Please enter a valid email address." });
      return;
    }

    setStatus({ kind: "loading", msg: "Verifying…" });

    // Prototype verification: mark verified locally.
    const s = getSession();
    s.email = e;
    saveSession(s);
    setVerified(true);

    setTimeout(() => {
      setStatus({ kind: "ok", msg: "Verified ✅ You can now export DOCX / PDF / PPTX." });
    }, 200);
  };

  return (
    <div className="mt-20 mx-auto max-w-xl px-2 sm:px-0">
      <div className="rounded-3xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl overflow-hidden border border-white/10 bg-white/60 dark:bg-slate-950/30">
            <Image src="/elora-logo.png" width={96} height={96} alt="Elora" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">Verify</h1>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Unlock exports and advanced educator tools.
            </p>
          </div>
        </div>

        {pendingInvite ? (
          <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
            <div className="text-sm font-extrabold text-amber-800 dark:text-amber-200">
              Teacher invite detected
            </div>
            <div className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/90">
              After you verify, Elora will automatically enable Educator access for this invite link/code.
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <label className="text-sm font-extrabold text-slate-950 dark:text-white">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/70 dark:bg-slate-950/35 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Prototype flow: verification is stored locally (no email is sent).
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={verifyNow}
            className={cn(
              "w-full px-5 py-3 rounded-2xl text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20",
              status.kind === "loading" ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            Verify email
          </button>

          <button
            type="button"
            onClick={() => {
              setGuest(true);
              setStatus({ kind: "ok", msg: "Guest mode enabled (limited)." });
            }}
            className="w-full px-5 py-3 rounded-2xl text-sm font-bold border border-white/10 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white hover:bg-white/85 dark:hover:bg-slate-950/55"
          >
            Try as Guest (limited)
          </button>
        </div>

        {status.kind !== "idle" ? (
          <div
            className={cn(
              "mt-4 text-sm font-bold",
              status.kind === "ok"
                ? "text-emerald-700 dark:text-emerald-200"
                : status.kind === "loading"
                  ? "text-slate-700 dark:text-slate-300"
                  : "text-rose-700 dark:text-rose-200"
            )}
          >
            {status.msg}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Link href="/" className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:opacity-90">
            ← Back home
          </Link>
          <Link
            href="/assistant"
            className="text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20"
          >
            Continue →
          </Link>
        </div>
      </div>
    </div>
  );
}
