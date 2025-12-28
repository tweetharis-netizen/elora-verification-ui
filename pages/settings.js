// pages/settings.js
import { useEffect, useMemo, useState } from "react";
import {
  activateTeacher,
  clearTeacherAccess,
  getFontScale,
  getNotifications,
  getSession,
  getTheme,
  isTeacher,
  setFontScale,
  setNotifications,
  setTheme,
} from "@/lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/55 dark:bg-slate-950/35 backdrop-blur-xl p-4">
      <div>
        <div className="font-extrabold text-slate-950 dark:text-white">{label}</div>
        {description ? (
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={cn(
          "w-12 h-7 rounded-full transition flex items-center px-1 border",
          checked
            ? "bg-emerald-600 border-emerald-500/40"
            : "bg-slate-200/70 dark:bg-slate-800/60 border-white/10"
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "w-5 h-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const [themeMode, setThemeMode] = useState(getTheme());
  const [font, setFont] = useState(getFontScale());
  const [invite, setInvite] = useState("");
  const [status, setStatus] = useState("");
  const [notif, setNotif] = useState(getNotifications());
  const [teacher, setTeacher] = useState(isTeacher());
  const [verified, setVerified] = useState(Boolean(getSession().verified));

  useEffect(() => {
    const sync = () => {
      setThemeMode(getTheme());
      setFont(getFontScale());
      setNotif(getNotifications());
      setTeacher(isTeacher());
      setVerified(Boolean(getSession().verified));
    };
    sync();
    window.addEventListener("elora:session", sync);
    return () => window.removeEventListener("elora:session", sync);
  }, []);

  const themeButtons = useMemo(
    () => [
      { id: "system", label: "System" },
      { id: "light", label: "Light" },
      { id: "dark", label: "Dark" },
    ],
    []
  );

  async function applyInvite() {
    const code = invite.trim();
    setStatus("");
    if (!code) {
      setStatus("Enter a code first.");
      return;
    }
    if (!verified) {
      setStatus("Please verify your email first. Educator access requires verification.");
      return;
    }

    try {
      const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        setStatus("Invalid invite code.");
        return;
      }
      activateTeacher(code);
      setStatus("Educator access enabled ✅");
      setInvite("");
      setTeacher(true);
    } catch {
      setStatus("Could not validate invite right now. Try again.");
    }
  }

  function updateTheme(next) {
    const m = (next || "system").toLowerCase();
    setTheme(m);
    setThemeMode(m);
    // _app.js will apply html.dark via session event
  }

  function updateFont(next) {
    const v = Number(next);
    setFont(v);
    setFontScale(v);
  }

  function updateNotif(next) {
    setNotif(next);
    setNotifications(next);
  }

  return (
    <div className="mt-20 max-w-3xl mx-auto space-y-8 pb-10">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Settings</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          Keep Elora readable, personalized, and secure.
        </p>
      </div>

      {/* Appearance */}
      <section className="rounded-2xl border border-white/10 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl p-6">
        <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
          Personalization / Appearance
        </h2>

        <div className="mt-4">
          <div className="text-sm font-bold text-slate-900 dark:text-white">Theme</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {themeButtons.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => updateTheme(b.id)}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-extrabold transition",
                  themeMode === b.id
                    ? "border-indigo-500/40 bg-indigo-600/10 text-indigo-700 dark:text-indigo-200"
                    : "border-white/10 bg-white/50 dark:bg-slate-950/35 text-slate-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-950/50"
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            System uses your device’s theme automatically.
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Font size</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Make the UI comfortable to read.
              </div>
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              {font.toFixed(1)}×
            </div>
          </div>

          <input
            className="mt-3 w-full accent-indigo-600"
            type="range"
            min="0.9"
            max="1.3"
            step="0.1"
            value={font}
            onChange={(e) => updateFont(e.target.value)}
          />
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl border border-white/10 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl p-6">
        <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Notifications</h2>
        <div className="mt-4 space-y-3">
          <ToggleRow
            label="Lesson reminders"
            description="Optional reminders for planned learning sessions."
            checked={notif.lessonReminders}
            onChange={() => updateNotif({ ...notif, lessonReminders: !notif.lessonReminders })}
          />
          <ToggleRow
            label="Weekly summary"
            description="A quick weekly recap of what you generated and learned."
            checked={notif.weeklySummary}
            onChange={() => updateNotif({ ...notif, weeklySummary: !notif.weeklySummary })}
          />
          <ToggleRow
            label="Product updates"
            description="New features and improvements."
            checked={notif.productUpdates}
            onChange={() => updateNotif({ ...notif, productUpdates: !notif.productUpdates })}
          />
        </div>
      </section>

      {/* Educator Access */}
      <section className="rounded-2xl border border-white/10 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl p-6">
        <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Educator Access</h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          Educator tools are protected. You must be verified and have a valid invite code.
        </p>

        <div className="mt-4 grid gap-3">
          <input
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
            placeholder="Invite code (e.g., GENESIS2026)"
            className="w-full rounded-xl border border-white/10 bg-white/65 dark:bg-slate-950/35 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <button
            type="button"
            onClick={applyInvite}
            className="w-full rounded-xl px-5 py-3 font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
          >
            Apply Invite
          </button>

          {teacher ? (
            <button
              type="button"
              onClick={() => {
                clearTeacherAccess();
                setTeacher(false);
                setStatus("Educator access removed.");
              }}
              className="w-full rounded-xl px-5 py-3 font-bold border border-white/10 bg-white/60 dark:bg-slate-950/35 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-slate-950/55"
            >
              Remove educator access
            </button>
          ) : null}

          {status ? (
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{status}</div>
          ) : null}

          {!verified ? (
            <div className="text-xs text-amber-700 dark:text-amber-200">
              You’re not verified yet — verification is required for educator access.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
