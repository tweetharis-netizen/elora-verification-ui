// lib/session.js
// Client-side session/preferences cache + helpers.
// Source-of-truth for verification and teacher access is the server:
//   - verification session cookie is httpOnly on UI domain
//   - teacher access is an httpOnly signed cookie on UI domain
// This file stores a lightweight cache + user prefs (theme/font scale) in localStorage.

const STORAGE_KEY = "elora_session_v1";

const DEFAULTS = {
  // server-backed
  verified: false,
  email: "",
  teacher: false,
  hasSession: false,

  // local prefs
  theme: "system", // system | dark | light
  fontScale: 1,

  // role UX (not auth)
  role: "teacher", // teacher | student | parent | educator (UI role, not auth)

  // teacher invite UX
  teacherCode: "",
};

export function getSession() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULTS, ...(parsed || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSession(next) {
  if (typeof window === "undefined") return;
  try {
    const s = { ...DEFAULTS, ...(next || {}) };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    window.dispatchEvent(new Event("elora:session"));
  } catch {
    // ignore
  }
}

export function setRole(role) {
  const s = getSession();
  s.role = String(role || "teacher");
  saveSession(s);
}

export function setGuest() {
  // Guest = not verified, but allow UI usage. We keep role sane.
  const s = getSession();
  if (!s.role) s.role = "student";
  saveSession(s);
}

export function setVerified(verified, email = "") {
  const s = getSession();
  s.verified = Boolean(verified);
  s.email = String(email || "");
  s.hasSession = Boolean(verified) || Boolean(s.hasSession);
  saveSession(s);
}

export function isTeacher() {
  return Boolean(getSession().teacher);
}

export function isVerified() {
  return Boolean(getSession().verified);
}

export function setTeacherCode(code) {
  const s = getSession();
  s.teacherCode = String(code || "").trim();
  saveSession(s);
}

export async function refreshVerifiedFromServer() {
  try {
    const r = await fetch("/api/session/status", { cache: "no-store" });
    const data = await r.json().catch(() => null);

    const verified = Boolean(data?.verified);
    const email = String(data?.email || "");
    const teacher = Boolean(data?.teacher);
    const hasSession = Boolean(data?.hasSession || verified);

    const s = getSession();
    s.verified = verified;
    s.email = email;
    s.teacher = teacher;
    s.hasSession = hasSession;
    saveSession(s);

    return { verified, email, teacher, hasSession };
  } catch {
    return { verified: false, email: "", teacher: false, hasSession: false };
  }
}

// Accepts a single code string, or comma-separated codes.
// Server decides whether invites are configured + valid.
export async function activateTeacher(codeOrList) {
  const code = String(codeOrList || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .join(",");

  if (!code) return { ok: false, error: "missing_code" };

  try {
    const r = await fetch("/api/teacher/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return { ok: false, error: data?.error || "activate_failed" };
    }

    // Update local cache from server status (teacher cookie is httpOnly).
    const st = await refreshVerifiedFromServer();
    // Store the code for UX only (not auth).
    const s = getSession();
    s.teacherCode = code;
    saveSession(s);

    return { ok: true, status: st };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

export function setTheme(theme) {
  const s = getSession();
  s.theme = String(theme || "system");
  saveSession(s);
}

export function setFontScale(scale) {
  const clamped = Math.max(0.85, Math.min(1.4, Number(scale) || 1));
  const s = getSession();
  s.fontScale = clamped;
  saveSession(s);
}

export function applyFontScale() {
  if (typeof window === "undefined") return;
  const s = getSession();
  const scale = Number(s.fontScale) || 1;
  document.documentElement.style.setProperty("--elora-font-scale", String(scale));
}

export function applyTheme() {
  if (typeof window === "undefined") return;
  const s = getSession();
  const t = String(s.theme || "system");
  const root = document.documentElement;

  root.dataset.theme = t;

  // If system, let CSS decide via media query; otherwise we set data-theme.
  // Your globals.css already reads this.
}

export function hydrateUI() {
  if (typeof window !== "undefined") {
    applyTheme();
    applyFontScale();
  }
}
