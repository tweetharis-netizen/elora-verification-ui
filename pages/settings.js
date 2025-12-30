import { useEffect, useState } from "react";
import {
  getSession,
  saveSession,
  setTheme,
  setFontScale,
  setTeacherCode,
  refreshVerifiedFromServer,
} from "@/lib/session";

export default function Settings() {
  const [s, setS] = useState(() => getSession());
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const sync = () => setS(getSession());
    sync();
    refreshVerifiedFromServer().finally(sync);
    window.addEventListener("elora:session", sync);
    return () => window.removeEventListener("elora:session", sync);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="elora-card p-6 sm:p-8">
        <h1 className="font-black text-[clamp(1.6rem,2.4vw,2.2rem)]">Settings</h1>
        <p className="mt-2 elora-muted">Theme, font size, and educator invite code.</p>

        <hr className="my-6 border-white/10 dark:border-white/10" />

        <div className="grid gap-6">
          <section>
            <div className="font-black">Verification</div>
            <p className="mt-2 elora-muted text-sm">
              Status is stored server-side and persists across refresh.
            </p>
            <div className="mt-3">
              {s.verified ? (
                <span className="elora-pill">Verified</span>
              ) : (
                <span className="elora-muted">Not verified</span>
              )}
            </div>
          </section>

          <section>
            <div className="font-black">Theme</div>
            <div className="mt-3 grid gap-2">
              <select
                className="elora-input"
                value={s.theme || "system"}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="system">System</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
              <div className="elora-muted text-sm">
                Light mode is intentionally soft (no harsh white).
              </div>
            </div>
          </section>

          <section>
            <div className="font-black">Font size</div>
            <div className="mt-3 grid gap-2">
              <input
                type="range"
                min="0.85"
                max="1.4"
                step="0.01"
                value={s.fontScale || 1}
                onChange={(e) => setFontScale(Number(e.target.value))}
              />
              <div className="elora-muted text-sm">
                Scale: <b>{Number(s.fontScale || 1).toFixed(2)}x</b>
              </div>
            </div>
          </section>

          <section>
            <div className="font-black">Teacher invite code (optional)</div>
            <p className="mt-2 elora-muted text-sm">
              Only needed if educator tools are invite-protected.
            </p>
            <div className="mt-3 grid gap-2">
              <input
                className="elora-input"
                value={s.teacherCode || ""}
                onChange={(e) => {
                  setTeacherCode(e.target.value);
                  setS(getSession());
                }}
                placeholder="GENESIS2026"
              />
              <button
                type="button"
                className="elora-btn"
                onClick={() => {
                  const next = getSession();
                  saveSession(next);
                  setMsg("Saved.");
                  setTimeout(() => setMsg(""), 900);
                }}
              >
                Save
              </button>
              {msg ? <div className="elora-muted text-sm">{msg}</div> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
