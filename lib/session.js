// lib/session.js
// Client-side cache for UI preferences + a snapshot of server-backed session state.
//
// Source of truth for auth/verification/teacher is always the server via httpOnly cookies.
// The frontend should refresh from /api/session/status on load.
//
// This file is intentionally defensive:
// - It supports legacy storage keys used elsewhere in the repo.
// - It exports helpers some pages/components expect (hasSession, clearSession, setTeacher, etc.)
// - It is SSR-safe (never touches window/document unless they exist).

const STORAGE_PRIMARY = "elora_session_v1";
const STORAGE_LEGACY = "elora_session"; // used by some older pages
const PREF_THEME_KEY = "elora_theme"; // used by _app.js applyThemeAndScale()
const PREF_SCALE_KEY = "elora_fontScale"; // used by _app.js applyThemeAndScale()

// Older pages (onboarding.js) still read these keys:
const LEGACY_ROLE_KEY = "elora_role";
const LEGACY_GUEST_KEY = "elora_guest";
const LEGACY_VERIFIED_KEY = "elora_verified";

const DEFAULTS = {
  // server-backed (synced via /api/session/status)
  verified: false,
  email: "",
  teacher: false,
  hasSession: false,

  // guest is client-only "preview mode" (not auth)
  guest: false,

  // UI role (not auth)
  role: "student", // student | educator | parent

  // UI prefs
  theme: "system", // system | dark | light
  fontScale: 1,

  // assistant UI selections (client only)
  country: "Singapore",
  level: "Primary 1",
  subject: "math",
  topicMode: "fixed", // fixed | custom
  topicFixed: "Fractions",
  topicCustom: "",
  task: "tutor",
  style: "clear",
  messages: [],
  teacherCode: "",
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

function writeLegacyPrefs(theme, fontScale) {
  if (typeof window === "undefined") return;
  try {
    if (theme) window.localStorage.setItem(PREF_THEME_KEY, theme);
    if (typeof fontScale === "number") window.localStorage.setItem(PREF_SCALE_KEY, String(fontScale));
  } catch {}
}

function writeLegacyGuestAndRole(session) {
  if (typeof window === "undefined") return;
  try {
    // These keys are used by pages/onboarding.js (legacy).
    window.localStorage.setItem(LEGACY_GUEST_KEY, session.guest ? "true" : "false");
    window.localStorage.setItem(LEGACY_ROLE_KEY, String(session.role || "student"));
    window.localStorage.setItem(LEGACY_VERIFIED_KEY, session.verified ? "true" : "false");
  } catch {}
}

export function getSession() {
  if (typeof window === "undefined") return { ...DEFAULTS };

  const rawPrimary = window.localStorage.getItem(STORAGE_PRIMARY);
  const rawLegacy = window.localStorage.getItem(STORAGE_LEGACY);

  const parsed = safeParseJSON(rawPrimary) || safeParseJSON(rawLegacy) || null;
  const merged = { ...DEFAULTS, ...(parsed || {}) };

  // Backward-compat: if prefs were stored separately, pull them in.
  const themePref = window.localStorage.getItem(PREF_THEME_KEY);
  const scalePref = window.localStorage.getItem(PREF_SCALE_KEY);
  if (themePref && !merged.theme) merged.theme = themePref;
  if (scalePref && typeof merged.fontScale !== "number") merged.fontScale = Number(scalePref) || 1;

  // Backward-compat: legacy onboarding keys
  const legacyGuest = window.localStorage.getItem(LEGACY_GUEST_KEY);
  if (legacyGuest === "true") merged.guest = true;
  const legacyRole = window.localStorage.getItem(LEGACY_ROLE_KEY);
  if (legacyRole && !merged.role) merged.role = legacyRole;
  const legacyVerified = window.localStorage.getItem(LEGACY_VERIFIED_KEY);
  if (legacyVerified === "true") merged.verified = true;

  return merged;
}

export function saveSession(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PRIMARY, JSON.stringify(next));
    window.localStorage.setItem(STORAGE_LEGACY, JSON.stringify(next));
  } catch {}

  applyTheme(next.theme);
  applyFontScale(next.fontScale);
  writeLegacyPrefs(next.theme, next.fontScale);
  writeLegacyGuestAndRole(next);
  emit();
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_PRIMARY);
    window.localStorage.removeItem(STORAGE_LEGACY);
  } catch {}

  // keep prefs keys; user likely wants theme/font kept
  const s = getSession();
  applyTheme(s.theme);
  applyFontScale(s.fontScale);
  emit();
}

export function hasSession() {
  const s = getSession();
  // guest is NOT "logged in"
  return Boolean(s?.hasSession || s?.verified || s?.teacher);
}

export function setRole(role) {
  const s = getSession();
  s.role = String(role || "student");
  // if user explicitly sets a role, keep guest as-is
  saveSession(s);
}

// Guest mode controls: this is a UI preview toggle, not authentication.
export function setGuest(on = true) {
  const s = getSession();
  s.guest = Boolean(on);
  // guest users are typically student mode
  if (s.guest && (!s.role || s.role === "educator")) s.role = "student";
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

// Some parts of the repo expect a "setTeacher" toggle for immediate UI feedback.
export function setTeacher(on) {
  const s = getSession();
  s.teacher = Boolean(on);
  s.hasSession = Boolean(s.hasSession || s.teacher || s.verified);
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

export function applyFontScale(scale = 1) {
  if (typeof document === "undefined") return;
  const clamped = Math.max(0.85, Math.min(1.4, Number(scale) || 1));
  document.documentElement.style.setProperty("--elora-font-scale", String(clamped));
}

export function applyTheme(theme = "system") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;

  // Tailwind darkMode often relies on the "dark" class.
  // We resolve "system" only on client.
  if (typeof window !== "undefined") {
    const systemDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }
}

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
  writeLegacyPrefs(s.theme, s.fontScale);
  writeLegacyGuestAndRole(s);
}

/**
 * Pull fresh verification + teacher status from the server (cookie-backed truth).
 */
export async function refreshVerifiedFromServer() {
  try {
    const r = await fetch("/api/session/status", { cache: "no-store" });
    const data = await r.json().catch(() => null);

    const verified = Boolean(data?.verified);
    const email = String(data?.email || "");
    const teacher = Boolean(data?.teacher);
    const hasSessionFlag = Boolean(data?.hasSession || verified || teacher);

    const s = getSession();
    s.verified = verified;
    s.email = email;
    s.teacher = teacher;
    s.hasSession = hasSessionFlag;

    // keep legacy key in sync (onboarding.js reads it)
    s.guest = Boolean(s.guest);
    saveSession(s);

    return { verified, email, teacher, hasSession: hasSessionFlag };
  } catch {
    return { verified: false, email: "", teacher: false, hasSession: false };
  }
}

/**
 * Teacher tools unlock (NOT required for educator mode; educator mode requires verification only).
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
        setTeacher(true);
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
  setTeacher(false);
  setTeacherCode("");
}

/**
 * Log out = clear server cookies + clear local cache (prefs remain via separate keys).
 */
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
      window.localStorage.removeItem(LEGACY_GUEST_KEY);
      window.localStorage.removeItem(LEGACY_VERIFIED_KEY);
      window.localStorage.removeItem(LEGACY_ROLE_KEY);
    } catch {}
  }
  hydrateUI();
  emit();
}
