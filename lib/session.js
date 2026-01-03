// lib/session.js
// Client-side cache + UI preferences.
// Server is the source-of-truth for verification + teacher role via httpOnly cookies.
// This file must be SSR-safe (Next.js prerender runs on the server).

const STORAGE_KEY = "elora_session_v1";

const DEFAULTS = {
  // server-backed flags (cached)
  verified: false,
  verifiedEmail: "",
  hasSession: false,

  // teacher flags (cached)
  teacher: false,
  teacherEnabled: false, // legacy name used around the UI

  // UI prefs
  theme: "system", // system | dark | light
  fontScale: 1,

  // UX role (NOT auth)
  role: "student",

  // invite UX (not auth)
  teacherCode: "",
};

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getSession() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw) || {};
  const merged = { ...DEFAULTS, ...parsed };

  // Keep compatibility if older values exist
  merged.teacherEnabled = Boolean(merged.teacherEnabled || merged.teacher);
  merged.teacher = Boolean(merged.teacher || merged.teacherEnabled);
  merged.verified = Boolean(merged.verified);
  merged.hasSession = Boolean(merged.hasSession || merged.verified);

  return merged;
}

export function saveSession(nextPartial) {
  if (typeof window === "undefined") return;

  const prev = getSession();
  const merged = { ...prev, ...(nextPartial || {}) };

  // Maintain compatibility flags
  merged.teacherEnabled = Boolean(merged.teacherEnabled || merged.teacher);
  merged.teacher = Boolean(merged.teacher || merged.teacherEnabled);
  merged.verified = Boolean(merged.verified);
  merged.hasSession = Boolean(merged.hasSession || merged.verified);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage failures
  }

  // Let the UI refresh wherever it listens
  window.dispatchEvent(new Event("elora:session"));
}

export function setRole(role) {
  saveSession({ role: String(role || "student") });
}

export function setGuest() {
  // Guest is just UX — not verified.
  const s = getSession();
  if (!s.role) s.role = "student";
  saveSession(s);
}

export function setVerified(verified, email = "") {
  saveSession({
    verified: Boolean(verified),
    verifiedEmail: String(email || ""),
    hasSession: Boolean(verified) || Boolean(getSession().hasSession),
  });
}

export function setTeacherCode(code) {
  saveSession({ teacherCode: String(code || "").trim() });
}

export function setTheme(theme) {
  saveSession({ theme: String(theme || "system") });
  applyTheme();
}

export function setFontScale(scale) {
  const clamped = Math.max(0.85, Math.min(1.4, Number(scale) || 1));
  saveSession({ fontScale: clamped });
  applyFontScale();
}

export function applyFontScale() {
  if (typeof window === "undefined") return;
  const s = getSession();
  document.documentElement.style.setProperty("--elora-font-scale", String(s.fontScale || 1));
}

export function applyTheme() {
  if (typeof window === "undefined") return;
  const s = getSession();
  document.documentElement.dataset.theme = String(s.theme || "system");
}

export function hydrateUI() {
  if (typeof window === "undefined") return;
  applyTheme();
  applyFontScale();
}

// ---- Required exports used across the app (SSR-safe) ----

export function isVerified() {
  return Boolean(getSession().verified);
}

export function isTeacher() {
  const s = getSession();
  return Boolean(s.teacher || s.teacherEnabled);
}

// ✅ This is the function your build log shows missing.
// Must NEVER throw during SSR.
export function hasSession() {
  if (typeof window === "undefined") return false;
  const s = getSession();
  return Boolean(s.hasSession || s.verified || s.teacherEnabled);
}

// Fetch server status (via UI's own API route). Updates local cache.
export async function refreshVerifiedFromServer() {
  try {
    const r = await fetch("/api/session/status", { cache: "no-store" });
    const data = await r.json().catch(() => null);

    const verified = Boolean(data?.verified);
    const email = String(data?.email || data?.verifiedEmail || "");
    const teacher = Boolean(data?.teacher);
    const hasSess = Boolean(data?.hasSession || verified);

    saveSession({
      verified,
      verifiedEmail: email,
      hasSession: hasSess,
      teacher,
      teacherEnabled: teacher, // keep old UI reading this field
    });

    return { verified, email, teacher, hasSession: hasSess };
  } catch {
    return { verified: false, email: "", teacher: false, hasSession: false };
  }
}

// Teacher activation helper (server validates invite + sets httpOnly cookie)
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

    if (!r.ok) return { ok: false, error: data?.error || "activate_failed" };

    // Teacher cookie is httpOnly, so we refresh status into local cache.
    await refreshVerifiedFromServer();
    saveSession({ teacherCode: code });

    return { ok: true };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

// ✅ This is the other function your build log shows missing.
// Clears local cache + clears cookies server-side.
export async function logout() {
  // SSR-safe
  if (typeof window === "undefined") return;

  // Clear server cookies first
  try {
    await fetch("/api/session/clear", { method: "POST" });
  } catch {
    // fallback to older route (clears elora_session only)
    try {
      await fetch("/api/logout");
    } catch {
      // ignore
    }
  }

  // Clear local cache
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("elora_role_fallback");
  } catch {
    // ignore
  }

  window.dispatchEvent(new Event("elora:session"));
}
