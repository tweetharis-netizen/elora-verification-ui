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

  // user prefs
  theme: "system", // system | dark | light
  fontScale: 1,

  // role UX (not auth)
  role: "teacher", // teacher | student | parent

  // teacher invite UX
  teacherCode: "",
  pendingInvite: "",
};

function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("elora:session"));
}

export function getSession() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParseJSON(raw) : null;
  return { ...DEFAULTS, ...(parsed || {}) };
}

// Used by Navbar/settings to decide if "Logout" should show without crashing SSR.
export function hasSession() {
  const s = getSession();
  return Boolean(s?.hasSession || s?.verified || s?.teacher);
}

export function saveSession(next) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  applyTheme(next.theme);
  applyFontScale(next.fontScale);
  emit();
}

export function setRole(role) {
  const s = getSession();
  s.role = String(role || "teacher");
  saveSession(s);
}

// Backward compatibility: some pages call setGuest()
export function setGuest() {
  const s = getSession();
  s.role = "student";
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
  const s = getSession();
  return Boolean(s.teacher);
}

export function setTeacherCode(code) {
  const s = getSession();
  s.teacherCode = String(code || "");
  saveSession(s);
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

export function applyFontScale(scale = 1) {
  if (typeof document === "undefined") return;
  const clamped = Math.max(0.85, Math.min(1.4, Number(scale) || 1));
  document.documentElement.style.setProperty("--elora-font-scale", String(clamped));
}

export function applyTheme(theme = "system") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

// Some pages import getResolvedTheme(). It must exist and be safe during SSR.
// - If theme is "system", we follow the OS preference on the client.
// - On the server (no window), we default to "dark" to match Elora's default look.
export function getResolvedTheme() {
  const s = getSession();
  const t = String(s?.theme || "system");
  if (t !== "system") return t;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function hydrateUI() {
  const s = getSession();
  applyTheme(s.theme);
  applyFontScale(s.fontScale);
}

/**
 * Pull fresh verification + teacher status from the server (source of truth).
 * This keeps UI honest across refresh/reopen.
 */
export async function refreshVerifiedFromServer() {
  try {
    const r = await fetch("/api/session/status", { cache: "no-store" });
    const data = await r.json().catch(() => null);

    const verified = Boolean(data?.verified);
    const email = String(data?.email || "");
    const teacher = Boolean(data?.teacher);
    const hasSessionFlag = Boolean(data?.hasSession || verified);

    const s = getSession();
    s.verified = verified;
    s.email = email;
    s.teacher = teacher;
    s.hasSession = hasSessionFlag;
    saveSession(s);

    return { verified, email, teacher, hasSession: hasSessionFlag };
  } catch {
    return { verified: false, email: "", teacher: false, hasSession: false };
  }
}

/**
 * Activate teacher tools by validating an invite code on the server.
 * Accepts either a single code or comma-separated list; first match wins.
 */
export async function activateTeacher(codeOrList) {
  const raw = String(codeOrList || "");
  const codes = raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  if (!codes.length) return { ok: false, error: "missing_code" };

  for (const code of codes) {
    try {
      const r = await fetch("/api/teacher/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json().catch(() => null);
      if (r.ok && data?.ok) {
        const s = getSession();
        s.teacher = true;
        s.teacherCode = code;
        s.hasSession = true;
        saveSession(s);
        return { ok: true };
      }
    } catch {
      // try next code
    }
  }

  return { ok: false, error: "invalid_invite" };
}

export async function clearTeacher() {
  try {
    await fetch("/api/teacher/clear", { method: "POST" });
  } catch {
    // ignore
  }
  const s = getSession();
  s.teacher = false;
  saveSession(s);
}

/**
 * Clear all local UI state AND ask server to clear httpOnly cookies.
 * This is the only reliable way to "log out" when auth is cookie-based.
 */
export async function logout() {
  try {
    await fetch("/api/session/clear", { method: "POST" });
  } catch {}
  try {
    await fetch("/api/teacher/clear", { method: "POST" });
  } catch {}
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  hydrateUI();
  emit();
}
