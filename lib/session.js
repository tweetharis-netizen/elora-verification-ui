// lib/session.js
// Client-side cache for UI preferences + a snapshot of server-backed session state.
//
// Source of truth for auth/verification/teacher is always the server via httpOnly cookies.
// The frontend should refresh from /api/session/status on load.
//
// This file is intentionally defensive:
// - It supports legacy storage keys used elsewhere in the repo.
// - It exports helpers some pages/components expect (hasSession, clearSession, setTeacher, etc.).
// - It is SSR-safe (never touches window/document unless they exist).

const STORAGE_PRIMARY = "elora_session_v1";
const STORAGE_LEGACY = "elora_session"; // used by some older pages
const PREF_THEME_KEY = "elora_theme"; // used by _app.js applyThemeAndScale()
const PREF_FONT_SCALE_KEY = "elora_fontScale";

const DEFAULTS = {
  // server-backed (synced via /api/session/status)
  verified: false,
  email: "",
  teacher: false,
  hasSession: false,
  accountRole: "guest", // guest | regular | teacher (authoritative backend role)

  // UI role (not auth)
  role: "student", // student | educator | parent

  // UI prefs
  theme: "system", // system | dark | light
  fontScale: 1,

  // optional
  teacherCode: "",
  guest: true,
};

function safeJsonParse(str) {
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

function writeLegacyPrefs(theme, fontScale) {
  if (typeof window === "undefined") return;
  // Keep these keys in sync because _app.js reads them to apply theme/scale.
  try {
    if (theme) window.localStorage.setItem(PREF_THEME_KEY, String(theme));
  } catch {}
  try {
    if (typeof fontScale === "number") window.localStorage.setItem(PREF_FONT_SCALE_KEY, String(fontScale));
  } catch {}
}

function readStored() {
  if (typeof window === "undefined") return { ...DEFAULTS };

  // Prefer primary key, fall back to legacy.
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_PRIMARY);
  } catch {}
  if (!raw) {
    try {
      raw = window.localStorage.getItem(STORAGE_LEGACY);
    } catch {}
  }

  const parsed = raw ? safeJsonParse(raw) : null;
  const s = { ...DEFAULTS, ...(parsed || {}) };

  // Normalize types.
  s.verified = Boolean(s.verified);
  s.teacher = Boolean(s.teacher);
  s.hasSession = Boolean(s.hasSession);
  s.email = String(s.email || "");
  s.accountRole = String(s.accountRole || "guest").toLowerCase();

  s.role = String(s.role || "student");
  s.theme = String(s.theme || "system");
  s.fontScale = Number.isFinite(Number(s.fontScale)) ? Number(s.fontScale) : 1;

  s.teacherCode = String(s.teacherCode || "");
  s.guest = Boolean(s.guest);

  return s;
}

let _cache = null;

export function getSession() {
  if (_cache) return _cache;
  _cache = readStored();
  return _cache;
}

export function saveSession(next) {
  const s = { ...DEFAULTS, ...(next || {}) };
  _cache = s;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_PRIMARY, JSON.stringify(s));
      window.localStorage.setItem(STORAGE_LEGACY, JSON.stringify(s));
    } catch {}
  }

  writeLegacyPrefs(s.theme, s.fontScale);
  emit();
}

export function clearSession() {
  _cache = { ...DEFAULTS };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_PRIMARY);
      window.localStorage.removeItem(STORAGE_LEGACY);
    } catch {}
  }

  writeLegacyPrefs(DEFAULTS.theme, DEFAULTS.fontScale);
  emit();
}

export function hasSession() {
  const s = getSession();
  return Boolean(s.hasSession || s.verified || s.teacher);
}

export function setVerified(value) {
  const v = Boolean(value);
  const s = getSession();
  s.verified = v;
  // If a user becomes verified, they effectively have a session.
  // If they become unverified, keep hasSession as-is (server is source of truth).
  if (v) s.hasSession = true;
  saveSession(s);
  emit();
}

export function setRole(role) {
  const s = getSession();
  s.role = String(role || "student");
  saveSession(s);
}

export function setGuest(isGuest) {
  const s = getSession();
  s.guest = Boolean(isGuest);
  saveSession(s);
}

export function setTheme(theme) {
  const s = getSession();
  s.theme = String(theme || "system");
  saveSession(s);
}

export function setFontScale(scale) {
  const next = Number(scale);
  const s = getSession();
  s.fontScale = Number.isFinite(next) ? next : 1;
  saveSession(s);
}

export function setTeacher(value) {
  const s = getSession();
  s.teacher = Boolean(value);
  saveSession(s);
}

export function setTeacherCode(code) {
  const s = getSession();
  s.teacherCode = String(code || "");
  saveSession(s);
}

export function isTeacher() {
  return Boolean(getSession().teacher);
}

export function applyFontScale(scale) {
  if (typeof document === "undefined") return;
  const v = Number(scale);
  const clamped = Number.isFinite(v) ? Math.max(0.85, Math.min(1.25, v)) : 1;
  document.documentElement.style.setProperty("--elora-font-scale", String(clamped));
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const t = String(theme || "system");
  if (t === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", t);
  }
}

export function getResolvedTheme() {
  const s = getSession();
  if (s.theme === "dark" || s.theme === "light") return s.theme;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function hydrateUI() {
  const s = getSession();
  applyFontScale(s.fontScale);
  applyTheme(s.theme);
}

export async function refreshVerifiedFromServer() {
  try {
    const r = await fetch("/api/session/status", { cache: "no-store" });
    const data = await r.json().catch(() => null);

    const verified = Boolean(data?.verified);
    const email = String(data?.email || "");
    const accountRole = String(data?.accountRole || data?.role || (verified ? "regular" : "guest")).toLowerCase();
    const teacher = accountRole === "teacher";
    const hasSessionFlag = Boolean(data?.hasSession || verified || teacher);

    const s = getSession();
    s.verified = verified;
    s.email = email;
    s.accountRole = accountRole;
    s.teacher = teacher;
    s.hasSession = hasSessionFlag;
    saveSession(s);

    return { verified, email, accountRole, teacher, hasSession: hasSessionFlag };
  } catch {
    return { verified: false, email: "", accountRole: "guest", teacher: false, hasSession: false };
  }
}

/**
 * Teacher tools unlock.
 * Accepts either one code or a comma-separated list; first match wins.
 *
 * NOTE: This uses server-side proxying to the backend (KV-persisted role),
 * so it stays reliable across refreshes and devices.
 */
export async function activateTeacher(rawCode) {
  const codes = String(rawCode || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!codes.length) return { ok: false, error: "missing_code" };

  // Server is the source of truth: this endpoint proxies to the backend and persists role in KV.
  for (const code of codes) {
    try {
      const r = await fetch("/api/teacher/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        // try next code if provided
        continue;
      }

      // Refresh from server so UI reflects authoritative role.
      await refreshVerifiedFromServer();
      const s = getSession();
      if (s.teacher) {
        setTeacherCode(code);
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
  } catch {}

  const s = getSession();
  s.teacher = false;
  s.accountRole = s.verified ? "regular" : "guest";
  s.teacherCode = "";
  saveSession(s);
}

export async function logout() {
  try {
    await fetch("/api/session/clear", { method: "POST" });
  } catch {}
  try {
    await fetch("/api/teacher/clear", { method: "POST" });
  } catch {}

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_PRIMARY);
      window.localStorage.removeItem(STORAGE_LEGACY);
    } catch {}
  }
  hydrateUI();
  emit();
}
