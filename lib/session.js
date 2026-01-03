// lib/session.js
// Client-side session/preferences cache + helpers.
//
// Source of truth:
// - Verification + role live on the backend and are returned by /api/session/status
// - The session token itself is an httpOnly cookie on the UI domain
//
// This file only stores:
// - UI preferences (theme, fontScale, UX role selection)
// - A lightweight cache of the latest server status (verified/email/roleAuth)
//
// Why cache at all?
// - Makes the UI feel instant on refresh.
// - Still correct, because we refresh from server on page load / focus.

const STORAGE_KEY = "elora_session_v1";

const DEFAULTS = {
  // server-backed (cached)
  verified: false,
  email: "",
  roleAuth: "guest", // guest | regular | teacher
  hasSession: false,

  // local prefs
  theme: "system", // system | dark | light
  fontScale: 1,

  // UX role (does not grant permissions)
  role: "student", // educator | student | parent

  // invite UX
  teacherCode: "",
};

function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("elora:session"));
}

function applyTheme(theme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("elora_theme", theme);
  } catch {}

  emit();
}

function applyFontScale(fontScale) {
  if (typeof window === "undefined") return;
  const scale = clamp(fontScale, 0.85, 1.4);

  try {
    window.localStorage.setItem("elora_fontScale", String(scale));
  } catch {}

  emit();
}

export function getSession() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParseJSON(raw) : null;

  const base = { ...DEFAULTS, ...(parsed && typeof parsed === "object" ? parsed : {}) };

  // Ensure prefs stay in sync with what _app reads.
  const t = window.localStorage.getItem("elora_theme");
  if (t) base.theme = t;

  const fs = window.localStorage.getItem("elora_fontScale");
  if (fs) base.fontScale = clamp(fs, 0.85, 1.4);

  base.fontScale = clamp(base.fontScale, 0.85, 1.4);

  // Backwards compat: older builds stored `teacher` boolean.
  if (base.teacher === true) base.roleAuth = "teacher";

  // Normalize roleAuth
  const ra = String(base.roleAuth || "").toLowerCase();
  base.roleAuth = ra === "teacher" ? "teacher" : ra === "regular" ? "regular" : "guest";

  // Normalize UX role
  const ux = String(base.role || "").toLowerCase();
  base.role = ux === "educator" || ux === "parent" || ux === "student" ? ux : "student";

  base.verified = Boolean(base.verified);
  base.email = String(base.email || "");
  base.hasSession = Boolean(base.hasSession);

  base.teacherCode = String(base.teacherCode || "");

  return base;
}

function saveMerged(partial) {
  if (typeof window === "undefined") return;
  const current = getSession();
  const next = { ...current, ...(partial && typeof partial === "object" ? partial : {}) };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  // Keep _app sources updated
  applyTheme(next.theme);
  applyFontScale(next.fontScale);

  emit();
}

export function saveSession(nextFull) {
  // Deprecated: kept for backwards compatibility with old code.
  // We treat it as a merge to avoid wiping verified state.
  saveMerged(nextFull);
}

export function setTheme(theme) {
  const t = ["system", "dark", "light"].includes(theme) ? theme : "system";
  saveMerged({ theme: t });
}

export function setFontScale(fontScale) {
  saveMerged({ fontScale: clamp(fontScale, 0.85, 1.4) });
}

export function setTeacherCode(code) {
  saveMerged({ teacherCode: String(code || "") });
}

export function setRoleUX(role) {
  const r = ["educator", "student", "parent"].includes(role) ? role : "student";
  saveMerged({ role: r });
}

export function hydrateUI() {
  const s = getSession();
  // _app reads localStorage keys; emitting is enough.
  applyTheme(s.theme);
  applyFontScale(s.fontScale);
}

/**
 * Server-backed session status.
 * Returns: { verified:boolean, email:string, role:string, hasSession:boolean }
 */
export async function refreshVerifiedFromServer() {
  try {
    const r = await fetch("/api/session/status", { cache: "no-store" });
    const data = await r.json().catch(() => null);

    const verified = Boolean(data?.verified);
    const email = String(data?.email || "");
    const role = String(data?.role || (verified ? "regular" : "guest")).toLowerCase();
    const hasSession = Boolean(data?.hasSession || verified);

    saveMerged({
      verified,
      email,
      roleAuth: role === "teacher" ? "teacher" : verified ? "regular" : "guest",
      hasSession,
    });

    return { verified, email, role, hasSession };
  } catch {
    return { verified: false, email: "", role: "guest", hasSession: false };
  }
}

export function isTeacher() {
  return getSession().roleAuth === "teacher";
}

export function hasSession() {
  const s = getSession();
  return Boolean(s.hasSession || s.verified);
}

/**
 * Validate teacher invite code on the server.
 * Backend persists role; frontend just refreshes status.
 */
export async function activateTeacher(codeOrList) {
  const raw = String(codeOrList || "");
  const codes = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!codes.length) return { ok: false, error: "missing_code" };

  // Try codes in order; first match wins.
  for (const code of codes) {
    try {
      const r = await fetch("/api/teacher-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json().catch(() => null);
      if (r.ok && data?.ok) {
        setTeacherCode(code);
        await refreshVerifiedFromServer();
        return { ok: true };
      }
    } catch {
      // try next code
    }
  }

  return { ok: false, error: "invalid_code" };
}

export async function logout() {
  try {
    await fetch("/api/session/clear", { method: "POST" });
  } catch {}

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  hydrateUI();
  emit();
}
