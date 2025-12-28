// pages/verify.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  activateTeacher,
  clearPendingInvite,
  getPendingInvite,
  getSession,
  isTeacher,
  saveSession,
  setGuest,
  setVerified,
} from "@/lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function Verify() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" }); // idle | loading | ok | error
  const [session, setSession] = useState(() => getSession());

  const verified = Boolean(session.verified);
  const teacher = isTeacher();

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("elora:session", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("elora:session", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const pendingInvite = useMemo(() => getPendingInvite(), [verified]);

  const safeNav = async (path) => {
    try {
      await router.push(path);
    } catch {
      window.location.href = path;
    }
  };

  async function applyPendingInviteIfAny() {
    const code = (getPendingInvite() || "").toString().trim();
    if (!code) return { applied: false, message: "" };

    try {
      const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(code)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Invalid invite code");

      activateTeacher(code);
      clearPendingInvite();
      return { applied: true, message: "Teacher invite applied. Educator mode unlocked." };
    } catch (e) {
      return { applied: false, message: e?.message || "Invite code invalid" };
    }
  }

  async function handleVerify() {
    if (status.state === "loading") return;

    const e = email.trim();
    if (!e) {
      setStatus({ state: "error", message: "Please enter your email." });
      return;
    }

    setStatus({ state: "loading", message: "Verifying…" });

    try {
      // Prototype verification: store locally.
      const s = getSession();
      s.email = e;
      saveSession(s);

      setVerified(true);
      setGuest(false);

      const result = await applyPendingInviteIfAny();

      setStatus({
        state: "ok",
        message: result.applied
          ? result.message
          : pendingInvite
            ? `Verified. Invite not applied: ${result.message}`
            : "Verified. Exports are now unlocked.",
      });
    } catch {
      setStatus({ state: "error", message: "Verification failed. Please try again." });
    }
  }

  async function continueAsGuest() {
    // Guaranteed path out of “verify screen” even if Home button was flaky
    setVerified(false);
    setGuest(true);
    await new Promise((r) => setTimeout(r, 0));
    await safeNav("/assistant");
  }

  return (
    <div className="py-10">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-white/65 dark:bg-slate-950/55 backdrop-blur-xl p-6 md:p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/35">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Verify your email
              </h1>
              <p className="mt-2 text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                Verification unlocks exports (DOCX / PDF / PPTX). Educator mode is protected and requires a valid
                teacher invite too.
              </p>
            </div>

            <button
              type="button"
              onClick={() => safeNav("/")}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-extrabold border border-white/10 bg-white/60 dark:bg-slate-950/45 text-slate-900 dark:text-white hover:bg-white/85 dark:hover:bg-slate-950/60"
            >
              Home
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/60 dark:bg-slate-950/45 p-4 md:p-5 shadow-lg shadow-slate-900/5 dark:shadow-black/25">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">Status</div>
                {teacher ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
                    Teacher ✓
                  </span>
                ) : verified ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border border-sky-400/30 bg-sky-500/10 text-sky-800 dark:text-sky-200">
                    Verified ✓
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
                    Unverified
                  </span>
                )}
              </div>

              {!verified ? (
                <>
                  <label className="mt-4 block text-sm font-extrabold text-slate-900 dark:text-white">
                    School email
                  </label>
                  <input
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="e.g. name@school.edu"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/75 dark:bg-slate-950/45 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />

                  {pendingInvite ? (
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      Invite detected: <span className="font-semibold">{pendingInvite}</span> — we’ll apply it after you
                      verify.
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={status.state === "loading"}
                      className={cn(
                        "w-full rounded-xl px-5 py-3 font-extrabold text-white shadow-lg shadow-indigo-500/20",
                        status.state === "loading" ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
                      )}
                    >
                      {status.state === "loading" ? "Verifying…" : "Verify"}
                    </button>

                    <button
                      type="button"
                      onClick={continueAsGuest}
                      className="w-full rounded-xl px-5 py-3 font-bold border border-white/10 bg-white/70 dark:bg-slate-950/45 text-slate-900 dark:text-white hover:bg-white/90 dark:hover:bg-slate-950/60 shadow-lg shadow-slate-900/5 dark:shadow-black/25"
                    >
                      Continue as Guest (limited)
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Guest limits: no assessments, no slides, no exports.
                  </div>
                </>
              ) : (
                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="rounded-xl px-5 py-3 font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                    onClick={() => safeNav("/assistant")}
                  >
                    Continue to Assistant
                  </button>
                  <button
                    type="button"
                    className="rounded-xl px-5 py-3 font-bold border border-white/10 bg-white/70 dark:bg-slate-950/45 text-slate-900 dark:text-white hover:bg-white/90 dark:hover:bg-slate-950/60"
                    onClick={() => safeNav("/settings")}
                  >
                    Settings
                  </button>
                </div>
              )}

              {status.message ? (
                <div
                  className={cn(
                    "mt-4 rounded-xl border p-3 text-sm",
                    status.state === "ok"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                      : status.state === "error"
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                        : "border-white/10 bg-white/45 dark:bg-slate-950/35 text-slate-700 dark:text-slate-200"
                  )}
                >
                  {status.message}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/55 dark:bg-slate-950/40 p-4 shadow-lg shadow-slate-900/5 dark:shadow-black/25">
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">Teacher invite</div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                If you have a teacher invite link, open{" "}
                <span className="font-semibold">/assistant?invite=GENESIS2026</span>. If you aren’t verified yet, Elora
                will remember it and apply it after verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
