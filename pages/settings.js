// pages/settings.js
import { useEffect, useState } from "react";
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

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/35 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 p-6">
      <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/30 p-4">
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
            : "bg-slate-200 border-slate-300 dark:bg-slate-800/60 dark:border-white/10"
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
  const [notif, setNotif] = useState(getNotifications());
  const [invite, setInvite] = useState("");
  const [status, setStatus] = useState("");
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

  function updateTheme(next) {
    const m = (next || "system").toLowerCase();
    setTheme(m);
    setThemeMode(m);
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

  async function applyInvite() {
    const code = invite.trim();
    setStatus("");
    if (!code) return setStatus("Enter a code first.");
    if (!verified) return setStatus("Please verify your email first (required for educator access).");

    try {
      const res = await fetch(`/api/teacher-invite?code=${encodeURIComponent(code)}`);
      if (!res.ok) return setStatus("Invalid invite code.");
      activateTeacher(code);
      setTeacher(true);
      setInvite("");
      setStatus("Educator access enabled ✅");
    } catch {
      setStatus("Could not validate invite right now. Try again.");
    }
  }

  return (
    <div className="mt-20 max-w-3xl mx-auto space-y-6 pb-10">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Settings</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          Keep Elora readable, personalized, and secure.
        </p>
      </div>

      <Card title="Personalization / Appearance">
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">Theme</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {["system", "light", "dark"].map((id) => {
              const label = id === "system" ? "System" : id === "light" ? "Light" : "Dark";
              const active = themeMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => updateTheme(id)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm font-extrabold transition",
                    active
                      ? "border-indigo-500/50 bg-indigo-600/10 text-indigo-700 dark:text-indigo-200"
                      : "border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/25 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-slate-950/40"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            System follows your device theme.
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Font size</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Make Elora comfortable to read.
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
      </Card>

      <Card title="Notifications">
        <div className="space-y-3">
          <ToggleRow
            label="Lesson reminders"
            description="Optional reminders for planned learning sessions."
            checked={notif.lessonReminders}
            onChange={() => updateNotif({ ...notif, lessonReminders: !notif.lessonReminders })}
          />
          <ToggleRow
            label="Weekly summary"
            description="A weekly recap of what you generated and learned."
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
      </Card>

      <Card title="Educator Access">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Educator tools require verification + a valid invite code.
        </p>

        <div className="mt-4 grid gap-3">
          <input
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
            placeholder="Invite code (e.g., GENESIS2026)"
            className="w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/40"
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
              className="w-full rounded-xl px-5 py-3 font-bold border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/40"
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
      </Card>
    </div>
  );
}
