// lib/session.js
const LS = {
  // UI prefs (client-side)
  role: "elora_role",
  guest: "elora_guest",
  theme: "elora_theme", // "system" | "dark" | "light" (legacy "dawn" treated as "light")
  fontScale: "elora_fontScale",
  teacherCode: "elora_teacher_invite",
  pendingInvite: "elora_pending_invite",

  // Verified cache (NOT source of truth — backend cookie is)
  verified: "elora_verified_cache",
  verifiedEmail: "elora_verified_email_cache",
};

function hasWindow() {
  return typeof window !== "undefined";
}

function emitSessionUpdate() {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event("elora:session"));
}

// ----------------- Verified cache (client) -----------------
export function getVerifiedLocal() {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(LS.verified) === "1";
}

export function getVerifiedEmailLocal() {
  if (!hasWindow()) return "";
  return window.localStorage.getItem(LS.verifiedEmail) || "";
}

export function setVerifiedLocal(email = "") {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.verified, "1");
  if (email) window.localStorage.setItem(LS.verifiedEmail, email);
  emitSessionUpdate();
}

export function clearVerifiedLocal() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(LS.verified);
  window.localStorage.removeItem(LS.verifiedEmail);
  emitSessionUpdate();
}

/**
 * Back-compat function used by pages/index.js etc.
 * - If verified=false, we also clear the httpOnly backend session cookie via /api/session/clear.
 * - If verified=true, the cookie must already be set by /success exchange; we just cache for UI.
 */
export function setVerified(verified, email = "") {
  if (verified) {
    setVerifiedLocal(email);
    return;
  }
  clearVerifiedLocal();
  // Best-effort clear cookie (server authority)
  if (hasWindow()) {
    fetch("/api/session/clear", { method: "POST" }).catch(() => {});
  }
}

// ----------------- Role / guest -----------------
export function getRole() {
  if (!hasWindow()) return "educator";
  return window.localStorage.getItem(LS.role) || "educator";
}

export function setRole(role) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.role, role);
  emitSessionUpdate();
}

export function getGuest() {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(LS.guest) === "1";
}

export function setGuest(isGuest) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.guest, isGuest ? "1" : "0");
  emitSessionUpdate();
}

export function isTeacher() {
  // Teacher = educator + not guest + has valid teacherCode locally (server validates on requests)
  const s = getSession();
  return s.role === "educator" && !s.guest && Boolean(s.teacherCode);
}

export function activateTeacher(code = "") {
  setGuest(false);
  setRole("educator");
  if (!hasWindow()) return;
  if (code) window.localStorage.setItem(LS.teacherCode, String(code));
  emitSessionUpdate();
}

// ----------------- Invite codes -----------------
export function setTeacherCode(code) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.teacherCode, String(code || "").trim());
  emitSessionUpdate();
}

export function getTeacherCode() {
  if (!hasWindow()) return "";
  return window.localStorage.getItem(LS.teacherCode) || "";
}

export function setPendingInvite(code) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.pendingInvite, String(code || "").trim());
  emitSessionUpdate();
}

export function getPendingInvite() {
  if (!hasWindow()) return "";
  return window.localStorage.getItem(LS.pendingInvite) || "";
}

export function clearPendingInvite() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(LS.pendingInvite);
  emitSessionUpdate();
}

// ----------------- Theme -----------------
export function getTheme() {
  if (!hasWindow()) return "system";
  return window.localStorage.getItem(LS.theme) || "system";
}

export function setTheme(theme) {
  if (!hasWindow()) return;
  const t = String(theme || "system");
  window.localStorage.setItem(LS.theme, t);
  applyTheme();
  emitSessionUpdate();
}

export function getResolvedTheme() {
  const t = getTheme();
  const normalized = t === "dawn" ? "light" : t;
  if (!hasWindow()) return normalized === "system" ? "dark" : normalized;

  if (normalized !== "system") return normalized;
  const prefersLight =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  return prefersLight ? "light" : "dark";
}

export function applyTheme() {
  if (!hasWindow()) return;
  const resolved = getResolvedTheme();
  const html = document.documentElement;

  // Tailwind dark mode expects the `dark` class.
  if (resolved === "dark") html.classList.add("dark");
  else html.classList.remove("dark");

  // CSS tokens use data-theme
  html.setAttribute("data-theme", resolved);

  // Helpful for form controls / scrollbars
  html.style.colorScheme = resolved === "dark" ? "dark" : "light";
}

// ----------------- Font scale -----------------
export function getFontScale() {
  if (!hasWindow()) return 1.0;
  const raw = window.localStorage.getItem(LS.fontScale);
  const num = raw ? Number(raw) : 1.0;
  return Number.isFinite(num) ? num : 1.0;
}

export function setFontScale(scale) {
  if (!hasWindow()) return;
  const clamped = Math.min(1.4, Math.max(0.85, Number(scale) || 1.0));
  window.localStorage.setItem(LS.fontScale, String(clamped));
  applyFontScale();
  emitSessionUpdate();
}

export function applyFontScale() {
  if (!hasWindow()) return;
  document.documentElement.style.setProperty(
    "--elora-font-scale",
    String(getFontScale())
  );
}

// ----------------- Session object (local view) -----------------
export function getSession() {
  return {
    verified: getVerifiedLocal(),
    verifiedEmail: getVerifiedEmailLocal(),
    role: getRole(),
    guest: getGuest(),
    theme: getTheme(),
    resolvedTheme: getResolvedTheme(),
    fontScale: getFontScale(),
    teacherCode: getTeacherCode(),
    pendingInvite: getPendingInvite(),
  };
}

/**
 * Back-compat for pages that call saveSession(s).
 * We do NOT accept client-side "verified=true" as truth.
 * Only allows persisting UI fields + invite/teacher code.
 */
export function saveSession(s = {}) {
  if (!hasWindow()) return;
  if (typeof s.role === "string") window.localStorage.setItem(LS.role, s.role);
  if (typeof s.guest === "boolean") window.localStorage.setItem(LS.guest, s.guest ? "1" : "0");
  if (typeof s.teacherCode === "string") window.localStorage.setItem(LS.teacherCode, s.teacherCode.trim());
  if (typeof s.pendingInvite === "string") window.localStorage.setItem(LS.pendingInvite, s.pendingInvite.trim());
  if (typeof s.theme === "string") window.localStorage.setItem(LS.theme, s.theme);
  if (typeof s.fontScale === "number") window.localStorage.setItem(LS.fontScale, String(s.fontScale));

  // If caller explicitly sets verified=false, we clear cache + cookie.
  if (s.verified === false) setVerified(false);

  applyTheme();
  applyFontScale();
  emitSessionUpdate();
}

// ----------------- Backend truth sync -----------------
export async function refreshVerifiedFromServer() {
  try {
    const r = await fetch("/api/session/status", { cache: "no-store" });
    const data = await r.json().catch(() => null);

    if (data?.verified) {
      setVerifiedLocal(String(data.email || ""));
    } else {
      // If backend says unverified, clear cache
      clearVerifiedLocal();
    }
    emitSessionUpdate();
    return data || { verified: false, email: "" };
  } catch {
    return { verified: getVerifiedLocal(), email: getVerifiedEmailLocal() };
  }
}

// One-shot “apply everything” on app load
export function hydrateUI() {
  if (!hasWindow()) return;

  applyTheme();
  applyFontScale();

  // Pull server truth early
  refreshVerifiedFromServer().catch(() => {});

  // Keep theme in sync with OS when theme=system
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener?.("change", () => {
      if (getTheme() === "system") applyTheme();
    });
  }

  // Keep verified cache synced on focus / tab return
  const refresh = () => refreshVerifiedFromServer().catch(() => {});
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
}
