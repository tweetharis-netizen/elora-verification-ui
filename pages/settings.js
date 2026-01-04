import { useEffect, useMemo, useState } from "react";
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

export default function SettingsPage() {
  const [theme, setThemeState] = useState("system");
  const [scale, setScaleState] = useState(1);
  const [verified, setVerifiedState] = useState(false);
  const [teacher, setTeacherState] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const canLogout = useMemo(() => hasSession(), [verified, teacher]);

  useEffect(() => {
    const s = getSession();
    setThemeState(s.theme || "system");
    setScaleState(typeof s.fontScale === "number" ? s.fontScale : 1);
    setVerifiedState(Boolean(s.verified));
    setTeacherState(Boolean(s.teacher));
    setInviteCode(s.teacherCode || "");

    refreshVerifiedFromServer().then(() => {
      const next = getSession();
      setVerifiedState(Boolean(next.verified));
      setTeacherState(Boolean(next.teacher));
    });
  }, []);

  function onTheme(next) {
    setThemeState(next);
    setTheme(next);
    setMsg("");
  }

  function onScale(next) {
    const clamped = Math.min(1.4, Math.max(0.85, Number(next) || 1));
    setScaleState(clamped);
    setFontScale(clamped);
    setMsg("");
  }

  async function redeem() {
    setMsg("");

    if (!verified) {
      setMsg("Verify your email first, then redeem a teacher invite code.");
      return;
    }

    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setMsg("Enter an invite code.");
      return;
    }

    setBusy(true);
    try {
      const r = await activateTeacher(trimmed);
      if (!r.ok) {
        setMsg(r.error === "invalid_invite" ? "Invite code not accepted." : "Could not redeem code.");
        return;
      }
      setTeacherCode(trimmed);
      setTeacherState(true);
      setMsg("Teacher tools unlocked.");
    } finally {
      setBusy(false);
    }
  }

  async function clearTeacherTools() {
    setMsg("");
    setBusy(true);
    try {
      await clearTeacher();
      setTeacherState(false);
      setTeacherCode("");
      setMsg("Teacher tools cleared.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[980px] px-4">
      <div className="elora-card relative overflow-hidden p-6 md:p-8">
        <div className="elora-grain" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="elora-h1 text-4xl md:text-5xl">Settings</h1>
            <p className="elora-muted mt-2 max-w-[62ch]">
              Make Elora comfortable to use on any device. Verification is checked from the server.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="elora-chip" data-variant={verified ? "good" : "warn"}>
              {verified ? "Verified" : "Not verified"}
            </span>
            <span className="elora-chip" data-variant={teacher ? "good" : "warn"}>
              {teacher ? "Teacher tools" : "Teacher locked"}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Preferences */}
          <section className="elora-card p-5 md:p-6">
            <h2 className="text-lg font-extrabold">Preferences</h2>
            <p className="elora-muted mt-1 text-sm">Theme and font size apply across the whole UI.</p>

            <div className="mt-5">
              <div className="text-sm font-extrabold">Theme</div>
              <div className="mt-3 elora-segmented" role="tablist" aria-label="Theme">
                {[
                  { id: "system", label: "System" },
                  { id: "dark", label: "Dark" },
                  { id: "light", label: "Light" },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={t.id === theme ? "active" : ""}
                    onClick={() => onTheme(t.id)}
                    type="button"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-extrabold">Font size</div>
              <div className="elora-muted mt-1 text-sm">
                Scales the entire interface (use this on small screens).
              </div>

              <input
                className="mt-4 w-full"
                type="range"
                min={0.85}
                max={1.4}
                step={0.01}
                value={scale}
                onChange={(e) => onScale(e.target.value)}
              />
              <div className="mt-2 text-sm">
                Scale: <span className="font-extrabold">{scale.toFixed(2)}x</span>
              </div>
            </div>
          </section>

          {/* Access */}
          <section className="elora-card p-5 md:p-6">
            <h2 className="text-lg font-extrabold">Access</h2>
            <p className="elora-muted mt-1 text-sm">
              Educator mode in the Assistant requires verification. Teacher tools are optional.
            </p>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-extrabold">Educator mode</div>
                <span className="elora-chip" data-variant={verified ? "good" : "warn"}>
                  {verified ? "Enabled" : "Verify first"}
                </span>
              </div>

              <div className="elora-muted text-sm">
                Educator mode helps with lesson planning and materials. We enable it after verification to reduce abuse.
              </div>

              <div className="mt-4 elora-divider" />

              <h3 className="text-sm font-extrabold">Teacher invite code (optional)</h3>
              <p className="elora-muted mt-1 text-sm">
                Unlock teacher-only tools (exports, teacher dashboard). Not required for Educator mode.
              </p>

              <div className="mt-3 grid gap-3">
                <input
                  className="elora-input"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder={verified ? "Enter invite code (e.g., GENESIS2026)" : "Verify first"}
                  disabled={!verified || busy}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="elora-btn elora-btn-primary"
                    onClick={redeem}
                    disabled={!verified || busy}
                    type="button"
                  >
                    {busy ? "Working…" : "Redeem"}
                  </button>

                  {teacher && (
                    <button
                      className="elora-btn elora-btn-danger"
                      onClick={clearTeacherTools}
                      disabled={busy}
                      type="button"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {msg && <div className="text-sm font-extrabold">{msg}</div>}
              </div>

              {canLogout && (
                <>
                  <div className="mt-6 elora-divider" />
                  <button
                    className="elora-btn elora-btn-danger"
                    onClick={async () => {
                      setMsg("");
                      setBusy(true);
                      try {
                        // clear server cookies via existing route
                        await fetch("/api/logout", { method: "POST" }).catch(() => {});
                      } finally {
                        // reset local UI state
                        setRole("student");
                        setTeacherCode("");
                        setTeacherState(false);
                        setVerifiedState(false);
                        setBusy(false);
                        setMsg("Signed out.");
                        // hard refresh ensures all pages reflect cleared cookies
                        if (typeof window !== "undefined") window.location.href = "/";
                      }
                    }}
                    disabled={busy}
                    type="button"
                  >
                    Log out
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
