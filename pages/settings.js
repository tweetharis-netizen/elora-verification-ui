import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  activateTeacher,
  clearTeacher,
  getSession,
  hasSession,
  refreshVerifiedFromServer,
  setFontScale,
  setRole,
  setTeacherCode,
  setTheme,
} from "@/lib/session";

function cn(...a) {
  return a.filter(Boolean).join(" ");
}

export default function SettingsPage() {
  const router = useRouter();
  const roleSectionRef = useRef(null);

  const [theme, setThemeState] = useState("system");
  const [scale, setScaleState] = useState(1);
  const [role, setRoleState] = useState("student");

  const [verified, setVerifiedState] = useState(false);
  const [teacher, setTeacherState] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [focusRole, setFocusRole] = useState(false);

  const canLogout = useMemo(() => hasSession(), [verified, teacher]);

  async function persistSessionPatch(patch) {
    try {
      await fetch("/api/session/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch || {}),
      });
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const s = getSession();
    setThemeState(s.theme || "system");
    setScaleState(typeof s.fontScale === "number" ? s.fontScale : 1);
    setRoleState(String(s.role || "student"));

    refreshVerifiedFromServer().then((st) => {
      setVerifiedState(Boolean(st?.verified));
      setTeacherState(Boolean(st?.teacher));
    });
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const focus = String(router.query.focus || "");
    if (focus === "role") {
      setFocusRole(true);
      setTimeout(() => {
        roleSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      setTimeout(() => setFocusRole(false), 1800);
    }
  }, [router.isReady, router.query.focus]);

  async function handleSaveTheme(nextTheme) {
    setMsg("");
    setThemeState(nextTheme);
    setTheme(nextTheme);
    await persistSessionPatch({ theme: nextTheme });
  }

  async function handleSaveScale(nextScale) {
    setMsg("");
    setScaleState(nextScale);
    setFontScale(nextScale);
    await persistSessionPatch({ fontScale: nextScale });
  }

  async function handleChangeRole(nextRole) {
    setMsg("");
    const r = String(nextRole || "student");
    setRoleState(r);
    setRole(r);
    await persistSessionPatch({ role: r });

    // Clean UX: switching roles should feel intentional (clears assistant chat).
    try {
      await fetch("/api/chat/clear", { method: "POST" });
    } catch {
      // ignore
    }
  }

  async function handleInviteSubmit(e) {
    e?.preventDefault?.();
    setMsg("");
    setBusy(true);

    try {
      const code = (inviteCode || "").trim();
      if (!code) {
        setMsg("Please enter a code.");
        setBusy(false);
        return;
      }
      if (!verified) {
        setMsg("Please verify your email first.");
        setBusy(false);
        return;
      }

      const r = await activateTeacher(code);
      if (!r?.ok) {
        setMsg("Invalid code.");
        setBusy(false);
        return;
      }

      setTeacherCode(code);
      await refreshVerifiedFromServer().then((st) => {
        setVerifiedState(Boolean(st?.verified));
        setTeacherState(Boolean(st?.teacher));
      });

      setMsg("Teacher tools unlocked ✅");
    } catch {
      setMsg("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTeacherClear() {
    setMsg("");
    setBusy(true);
    try {
      await clearTeacher();
      await refreshVerifiedFromServer().then((st) => {
        setVerifiedState(Boolean(st?.verified));
        setTeacherState(Boolean(st?.teacher));
      });
      setMsg("Teacher tools cleared.");
    } catch {
      setMsg("Could not clear teacher tools.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setMsg("");
    setBusy(true);
    try {
      await fetch("/api/logout", { method: "POST" }).catch(() => null);
      await refreshVerifiedFromServer().catch(() => null);
      setVerifiedState(false);
      setTeacherState(false);
      setMsg("Logged out.");
      router.push("/").catch(() => null);
    } catch {
      setMsg("Logout failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="elora-page">
      <div className="elora-container">
        <div className="max-w-3xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-black text-slate-950 dark:text-white">Settings</h1>
              <p className="mt-2 text-slate-700 dark:text-slate-300">
                Keep it simple: pick a role, set your look, and (optionally) unlock teacher tools.
              </p>
            </div>

            <Link
              href="/assistant"
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
            >
              Back to Assistant
            </Link>
          </div>

          {msg ? (
            <div className="mt-5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-4 text-sm text-slate-800 dark:text-slate-100">
              {msg}
            </div>
          ) : null}

          {/* ROLE */}
          <div
            ref={roleSectionRef}
            className={cn(
              "mt-6 rounded-2xl border bg-white/70 dark:bg-slate-950/20 p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/20",
              focusRole ? "border-indigo-500/40 ring-2 ring-indigo-500/20" : "border-slate-200/60 dark:border-white/10"
            )}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-lg font-black text-slate-950 dark:text-white">Role</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  This changes how Elora talks. Verification and teacher tools still stay secure.
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 px-3 py-1 text-xs font-extrabold text-slate-700 dark:text-slate-200">
                {verified ? "Verified ✅" : "Unverified"}
                <span className="mx-1">•</span>
                {teacher ? "Teacher tools ON" : "Teacher tools OFF"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "student", title: "Student", desc: "Learn, practice, and check answers." },
                { id: "parent", title: "Parent", desc: "Help your child without giving away answers." },
                { id: "educator", title: "Educator", desc: "Classroom-ready outputs (requires verification)." },
              ].map((r) => {
                const active = role === r.id;
                const locked = r.id === "educator" && !verified;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      if (locked) {
                        setMsg("Verify your email to use Educator mode.");
                        return;
                      }
                      handleChangeRole(r.id);
                    }}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition",
                      active
                        ? "border-indigo-500/40 bg-indigo-600/10"
                        : "border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 hover:bg-white dark:hover:bg-slate-950/35",
                      locked ? "opacity-70" : ""
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-extrabold text-slate-950 dark:text-white">{r.title}</div>
                      {locked ? (
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-200">Verify to unlock</span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">{r.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LOOK & FEEL */}
          <div className="mt-6 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
            <div className="text-lg font-black text-slate-950 dark:text-white">Look & Feel</div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Theme</div>
                <select
                  value={theme}
                  onChange={(e) => handleSaveTheme(String(e.target.value || "system"))}
                  className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  <option value="system">System</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Dark is the “premium” default for the demo.
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Font size</div>
                <input
                  type="range"
                  min="0.85"
                  max="1.4"
                  step="0.05"
                  value={scale}
                  onChange={(e) => handleSaveScale(Number(e.target.value))}
                  className="mt-3 w-full"
                />
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Current: {Math.round(scale * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* TEACHER INVITE */}
          <div className="mt-6 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-lg font-black text-slate-950 dark:text-white">Teacher Invite Code</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  Unlock teacher-only tools (lesson plan, worksheets, assessments, slides).
                </div>
              </div>

              {teacher ? (
                <button
                  type="button"
                  onClick={handleTeacherClear}
                  disabled={busy}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-extrabold transition",
                    busy
                      ? "border-slate-200/60 dark:border-white/10 text-slate-400 cursor-wait"
                      : "border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                  )}
                >
                  Clear teacher tools
                </button>
              ) : null}
            </div>

            <form onSubmit={handleInviteSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="GENESIS2026"
                className="flex-1 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                type="submit"
                disabled={busy}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-extrabold text-white",
                  busy ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
                )}
              >
                Unlock
              </button>
            </form>

            {!verified ? (
              <div className="mt-3 text-xs font-bold text-amber-800 dark:text-amber-200">
                Verify your email first — invite codes only work after verification.
              </div>
            ) : null}
          </div>

          {/* LOGOUT */}
          <div className="mt-6 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
            <div className="text-lg font-black text-slate-950 dark:text-white">Account</div>
            <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Logout only appears when a session exists.
            </div>

            <div className="mt-4 flex gap-2 flex-wrap">
              {canLogout ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={busy}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-extrabold transition",
                    busy
                      ? "border-slate-200/60 dark:border-white/10 text-slate-400 cursor-wait"
                      : "border-rose-500/40 bg-rose-600/10 text-rose-800 dark:text-rose-200 hover:bg-rose-600/15"
                  )}
                >
                  Logout
                </button>
              ) : (
                <div className="text-sm text-slate-600 dark:text-slate-400">No active session.</div>
              )}

              <Link
                href="/help"
                className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
              >
                Help & Quickstart
              </Link>
            </div>
          </div>

          <div className="mt-8 text-xs text-slate-500 dark:text-slate-400">
            Tip: For demos, set role to Educator, verify once, then unlock teacher tools with GENESIS2026.
          </div>
        </div>
      </div>
    </div>
  );
}
