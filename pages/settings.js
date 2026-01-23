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

const ROLE_CARDS = [
  {
    id: "student",
    title: "Student",
    desc: "Learn step-by-step. ‘Check my answer’ uses attempts (answer on attempt 3).",
  },
  {
    id: "parent",
    title: "Parent",
    desc: "Plain language coaching. What to say and do at home.",
  },
  {
    id: "educator",
    title: "Educator",
    desc: "Teacher workflows. Locked behind verification + invite code for teacher tools.",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const focus = String(router.query?.focus || "");

  const [theme, setThemeState] = useState("system");
  const [scale, setScaleState] = useState(1);
  const [verified, setVerifiedState] = useState(false);
  const [teacher, setTeacherState] = useState(false);

  const [role, setRoleState] = useState("student");

  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const roleRef = useRef(null);

  const canLogout = useMemo(() => hasSession(), [verified, teacher]);

  useEffect(() => {
    const s = getSession();
    setThemeState(s.theme || "system");
    setScaleState(typeof s.fontScale === "number" ? s.fontScale : 1);
    setVerifiedState(Boolean(s.verified));
    setTeacherState(Boolean(s.teacher));
    setInviteCode(s.teacherCode || "");
    setRoleState(String(s.role || "student"));

    refreshVerifiedFromServer().then(() => {
      const next = getSession();
      setVerifiedState(Boolean(next.verified));
      setTeacherState(Boolean(next.teacher));
      setInviteCode(next.teacherCode || "");
      setRoleState(String(next.role || "student"));
    });
  }, []);

  useEffect(() => {
    if (focus !== "role") return;
    if (!roleRef.current) return;

    // Small delay so layout is ready
    const t = window.setTimeout(() => {
      roleRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => window.clearTimeout(t);
  }, [focus]);

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

  function onRole(nextRole) {
    const id = String(nextRole || "student");
    if (id === "educator" && !verified) {
      setMsg("Please verify your email first to access Educator tools.");
      return;
    }
    setRoleState(id);
    setRole(id);
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
      setMsg("Teacher tools unlocked ✅");
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
    <div className="elora-page">
      <div className="elora-container">
        <div className="elora-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -inset-24 bg-gradient-to-br from-indigo-500/15 via-sky-400/10 to-fuchsia-500/15 blur-3xl" />
            <div className="absolute inset-0 elora-grain" />
          </div>

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="elora-h1 text-4xl md:text-5xl font-black">Settings</h1>
              <p className="elora-muted mt-2 max-w-[66ch]">Clean, calm preferences that apply across Elora.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="elora-chip" data-variant={verified ? "good" : "warn"}>
                {verified ? "Email verified" : "Not verified"}
              </span>
              <span className="elora-chip" data-variant={teacher ? "good" : "warn"}>
                {teacher ? "Teacher unlocked" : "Teacher locked"}
              </span>
            </div>
          </div>

          {!verified ? (
            <div className="relative mt-6 elora-card p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold">Verification required</div>
                  <div className="elora-muted text-sm mt-1">Verify once and Elora stays unlocked across refreshes.</div>
                </div>
                <Link className="elora-btn elora-btn-primary" href="/verify">
                  Verify email
                </Link>
              </div>
            </div>
          ) : null}

          <div className="relative mt-8 grid gap-6 lg:grid-cols-2">
            {/* Role */}
            <section ref={roleRef} className="elora-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">Role</h2>
                  <p className="elora-muted mt-1 text-sm">Pick the perspective Elora should use by default.</p>
                </div>
                <Link className="elora-btn" href="/assistant">
                  Open Assistant
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
                {ROLE_CARDS.map((c) => {
                  const selected = role === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onRole(c.id)}
                      className={[
                        "text-left elora-card p-4 transition",
                        selected ? "ring-2 ring-indigo-500/40" : "hover:opacity-[0.98]",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-extrabold">{c.title}</div>
                        <span className="elora-chip" data-variant={selected ? "good" : "warn"}>
                          {selected ? "Selected" : "Select"}
                        </span>
                      </div>
                      <div className="elora-muted text-sm mt-2">{c.desc}</div>
                      {c.id === "educator" && !verified ? (
                        <div className="mt-2 text-sm font-extrabold text-amber-600 dark:text-amber-500">
                          Verification required for this role.
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Preferences */}
            <section className="elora-card p-5 md:p-6">
              <h2 className="text-lg font-extrabold">Preferences</h2>
              <p className="elora-muted mt-1 text-sm">Theme and font size apply across the whole UI.</p>

              <div className="mt-6">
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

              <div className="mt-7">
                <div className="text-sm font-extrabold">Font size</div>
                <div className="elora-muted mt-1 text-sm">Use this if the UI feels too small on your device.</div>

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
            <section className="elora-card p-5 md:p-6 lg:col-span-2">
              <h2 className="text-lg font-extrabold">Access</h2>
              <p className="elora-muted mt-1 text-sm">Teacher tools are optional and locked behind an invite code.</p>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold">Teacher invite code</div>
                  <span className="elora-chip" data-variant={teacher ? "good" : "warn"}>
                    {teacher ? "Unlocked" : "Locked"}
                  </span>
                </div>

                <p className="elora-muted mt-2 text-sm">
                  Unlock teacher-only tools (lesson plans, worksheets, exports). Not required for normal Assistant use.
                </p>

                <div className="mt-4 grid gap-3">
                  <input
                    className="elora-input"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder={verified ? "Enter invite code (e.g., GENESIS2026)" : "Verify first"}
                    disabled={!verified || busy}
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button className="elora-btn elora-btn-primary" onClick={redeem} disabled={!verified || busy} type="button">
                      {busy ? "Working…" : "Redeem"}
                    </button>

                    {teacher ? (
                      <button className="elora-btn elora-btn-danger" onClick={clearTeacherTools} disabled={busy} type="button">
                        Clear teacher
                      </button>
                    ) : null}
                  </div>

                  {msg ? <div className="text-sm font-extrabold">{msg}</div> : null}
                </div>

                {canLogout ? (
                  <>
                    <div className="mt-7 elora-divider" />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold">Sign out</div>
                        <div className="elora-muted text-sm mt-1">Clears your verification session on this device.</div>
                      </div>
                      <button
                        className="elora-btn elora-btn-danger"
                        onClick={async () => {
                          setMsg("");
                          setBusy(true);
                          try {
                            await fetch("/api/logout", { method: "POST" }).catch(() => { });
                          } finally {
                            setRole("student");
                            setTeacherCode("");
                            setTeacherState(false);
                            setVerifiedState(false);
                            setBusy(false);
                            setMsg("Signed out.");
                            if (typeof window !== "undefined") window.location.href = "/";
                          }
                        }}
                        disabled={busy}
                        type="button"
                      >
                        Log out
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
