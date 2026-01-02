import { useEffect, useMemo, useState } from "react";
import {
  getSession,
  logout,
  refreshVerifiedFromServer,
  saveSession,
  setFontScale,
  setTheme,
  setTeacherCode,
} from "@/lib/session";

function ThemeSegment({ value, onChange }) {
  const items = [
    { key: "system", label: "System" },
    { key: "dark", label: "Dark" },
    { key: "light", label: "Light" },
  ];

  return (
    <div className="elora-segmented" role="tablist" aria-label="Theme">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          role="tab"
          aria-selected={value === it.key ? "true" : "false"}
          className={value === it.key ? "active" : ""}
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

  const canLogout = Boolean(s.verified || s.teacherEnabled);

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
        else if (data?.error === "enter_single_code") setMsg("Enter ONE invite code only.");
        else setMsg("Invalid invite code.");
        saveSession({ teacherEnabled: false });
        return;
      }

      saveSession({ teacherCode: code });
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

  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="elora-card p-6 sm:p-8">
        <h1 className="font-black text-[clamp(1.6rem,2.4vw,2.2rem)]">Settings</h1>
        <p className="mt-2 elora-muted">Theme, font scaling, and teacher access.</p>

        <div className="elora-divider" />

        <div className="grid gap-7">
          <section>
            <div className="font-black">Verification</div>
            <p className="mt-2 elora-muted text-sm">Your status is checked from the server on each load.</p>
            <div className="mt-3">
              {s.verified ? (
                <span className="elora-pill" title={s.verifiedEmail || "Verified"}>
                  <span className="elora-dot elora-dot-good" aria-hidden="true" />
                  Verified{s.verifiedEmail ? ` • ${s.verifiedEmail}` : ""}
                </span>
              ) : (
                <span className="elora-muted">Not verified</span>
              )}
            </div>
          </section>

          <section>
            <div className="font-black">Theme</div>
            <div className="mt-3 grid gap-2">
              <ThemeSegment value={s.theme || "system"} onChange={(t) => setTheme(t)} />
              <div className="elora-muted text-sm">Light mode is intentionally soft (not harsh white).</div>
            </div>
          </section>

          <section>
            <div className="font-black">Font size</div>
            <div className="mt-3 grid gap-2">
              <input
                type="range"
                min="0.85"
                max="1.35"
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
            <div className="font-black">Teacher invite code</div>
            <p className="mt-2 elora-muted text-sm">
              Enter <b>one</b> invite code (example: <b>GENESIS2026</b>).
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
              {msg ? <div className="elora-muted text-sm">{msg}</div> : null}
            </div>
          </section>

          {canLogout ? (
            <section>
              <div className="font-black">Session</div>
              <p className="mt-2 elora-muted text-sm">Clears your local cache + server cookies on this device.</p>
              <div className="mt-3">
                <button type="button" className="elora-btn elora-btn-danger" onClick={doLogout}>
                  Log out
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
