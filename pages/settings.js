import { useEffect, useMemo, useState } from "react";
import {
  getSession,
  logout,
  refreshVerifiedFromServer,
  setFontScale,
  setTheme,
  setTeacherCode,
  isTeacher,
  hasSession,
} from "@/lib/session";

function ThemeSegment({ value, onChange }) {
  const items = [
    { key: "system", label: "System" },
    { key: "dark", label: "Dark" },
    { key: "light", label: "Light" },
  ];

  return (
    <div className="elora-seg">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          className={`elora-seg-btn ${value === it.key ? "is-active" : ""}`}
          onClick={() => onChange(it.key)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export default function Settings() {
  const [s, setS] = useState(() => getSession());
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sync = () => setS(getSession());
    sync();
    refreshVerifiedFromServer().finally(sync);
    window.addEventListener("elora:session", sync);
    return () => window.removeEventListener("elora:session", sync);
  }, []);

  const teacher = useMemo(() => isTeacher(), [s.roleAuth, s.verified]);

  async function saveInvite() {
    setMsg("");
    setSaving(true);

    const code = String(getSession().teacherCode || "").trim();

    if (code.includes(",")) {
      setMsg("Enter ONE invite code (example: GENESIS2026).");
      setSaving(false);
      return;
    }

    try {
      const r = await fetch(`/api/teacher-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        if (data?.error === "not_verified") setMsg("Verify your email first.");
        else if (data?.error === "teacher_invites_not_configured")
          setMsg("Teacher codes are not configured on the server.");
        else setMsg("Invalid invite code.");
        return;
      }

      await refreshVerifiedFromServer();
      setMsg(code ? "Teacher access enabled." : "Teacher access removed.");
    } catch {
      setMsg("Could not validate invite code. Try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 1600);
    }
  }

  async function doLogout() {
    await logout();
    window.location.href = "/";
  }

  const showLogout = hasSession();

  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="elora-card p-6 sm:p-8">
        <h1 className="font-black text-[clamp(22px,3vw,30px)]">Settings</h1>
        <p className="mt-2 elora-muted">
          Preferences and teacher access live here. Verification is checked from the server on each load.
        </p>

        <div className="mt-6 grid gap-6">
          <section>
            <div className="font-black">Theme</div>
            <p className="mt-2 elora-muted text-sm">
              Pick a theme. “System” follows your device settings.
            </p>
            <div className="mt-3">
              <ThemeSegment
                value={s.theme || "system"}
                onChange={(v) => {
                  setTheme(v);
                  setS(getSession());
                }}
              />
            </div>
          </section>

          <section>
            <div className="font-black">Font size</div>
            <p className="mt-2 elora-muted text-sm">
              Make text easier to read. This scales the entire interface.
            </p>
            <div className="mt-3 grid gap-2">
              <input
                type="range"
                min={0.85}
                max={1.4}
                step={0.05}
                value={Number(s.fontScale || 1)}
                onChange={(e) => {
                  setFontScale(Number(e.target.value));
                  setS(getSession());
                }}
              />
              <div className="elora-muted text-sm">
                Scale: <b>{Number(s.fontScale || 1).toFixed(2)}x</b>
              </div>
            </div>
          </section>

          <section>
            <div className="font-black">Teacher invite code</div>
            <p className="mt-2 elora-muted text-sm">
              Enter <b>one</b> invite code (example: <b>GENESIS2026</b>). Teacher access is stored on the server.
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
              <button type="button" className="elora-btn" onClick={saveInvite} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <div className="text-sm">
                Status:{" "}
                {teacher ? (
                  <span className="elora-chip elora-chip-teacher">Teacher</span>
                ) : (
                  <span className="elora-muted">Regular</span>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="font-black">Account</div>
            <div className="mt-2 grid gap-2 text-sm">
              <div>
                Verification:{" "}
                {s.verified ? (
                  <span className="elora-chip elora-chip-good">Verified</span>
                ) : (
                  <span className="elora-chip elora-chip-warn">Not verified</span>
                )}
              </div>
              {s.email ? <div className="elora-muted">Signed in as: {s.email}</div> : null}
            </div>

            {showLogout ? (
              <div className="mt-4">
                <button type="button" className="elora-btn elora-btn-ghost" onClick={doLogout}>
                  Logout
                </button>
              </div>
            ) : null}
          </section>

          {msg ? <div className="elora-toast">{msg}</div> : null}
        </div>
      </div>
    </div>
  );
}
