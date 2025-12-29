// lib/session.js
/**
 * Client-side session / preferences helpers.
 * IMPORTANT:
 * - Must be safe during SSR (no direct window/localStorage access without guards).
 * - Keep exports stable to avoid build/runtime errors.
 */

const KEYS = {
  verified: "elora_verified",
  verifiedEmail: "elora_verified_email",
  teacherAccess: "elora_teacher_access",
  teacherInviteCode: "elora_teacher_invite_code",
  pendingInvite: "elora_pending_invite",
  theme: "elora_theme", // "system" | "light" | "dark"
  fontScale: "elora_font_scale", // number as string
  notifications: "elora_notifications", // JSON string
};

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function safeGetItem(key) {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveItem(key) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getSession() {
  const verified = safeGetItem(KEYS.verified) === "true";
  const verifiedEmail = safeGetItem(KEYS.verifiedEmail) || "";
  const teacherAccess = safeGetItem(KEYS.teacherAccess) === "true";
  const teacherInviteCode = safeGetItem(KEYS.teacherInviteCode) || "";

  return {
    verified,
    verifiedEmail,
    teacherAccess,
    teacherInviteCode,
  };
}

export function isVerified() {
  return safeGetItem(KEYS.verified) === "true";
}

export function getVerifiedEmail() {
  return safeGetItem(KEYS.verifiedEmail) || "";
}

export function setVerified(email) {
  safeSetItem(KEYS.verified, "true");
  safeSetItem(KEYS.verifiedEmail, String(email || ""));
}

export function clearVerified() {
  safeRemoveItem(KEYS.verified);
  safeRemoveItem(KEYS.verifiedEmail);
}

export function hasTeacherAccess() {
  return safeGetItem(KEYS.teacherAccess) === "true";
}

export function setTeacherAccess(enabled, inviteCode) {
  safeSetItem(KEYS.teacherAccess, enabled ? "true" : "false");
  if (inviteCode) safeSetItem(KEYS.teacherInviteCode, String(inviteCode));
}

export function clearTeacherAccess() {
  safeRemoveItem(KEYS.teacherAccess);
  safeRemoveItem(KEYS.teacherInviteCode);
}

export function setPendingInvite(code) {
  if (!code) return;
  safeSetItem(KEYS.pendingInvite, String(code));
}

export function getPendingInvite() {
  return safeGetItem(KEYS.pendingInvite) || "";
}

export function clearPendingInvite() {
  safeRemoveItem(KEYS.pendingInvite);
}

/**
 * Theme handling
 */
export function getTheme() {
  const t = safeGetItem(KEYS.theme);
  if (t === "light" || t === "dark" || t === "system") return t;
  return "system";
}

export function setTheme(theme) {
  const t = theme === "light" || theme === "dark" || theme === "system" ? theme : "system";
  safeSetItem(KEYS.theme, t);
}

/**
 * IMPORTANT: Some parts of the app import this.
 * Returns the *effective* theme ("light" | "dark"), resolving "system".
 */
export function getResolvedTheme() {
  const theme = getTheme();
  if (theme === "light" || theme === "dark") return theme;

  // "system"
  if (!isBrowser() || !window.matchMedia) return "dark"; // default to dark for Elora's aesthetic
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Font scale (for global readability)
 */
export function getFontScale() {
  const raw = safeGetItem(KEYS.fontScale);
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(1.15, Math.max(0.9, n));
}

export function setFontScale(scale) {
  const n = Number(scale);
  if (!Number.isFinite(n)) return;
  const clamped = Math.min(1.15, Math.max(0.9, n));
  safeSetItem(KEYS.fontScale, String(clamped));
}

/**
 * Notifications prefs
 */
const DEFAULT_NOTIFICATIONS = {
  lessonReminders: false,
  weeklySummary: false,
  productUpdates: true,
};

export function getNotifications() {
  const raw = safeGetItem(KEYS.notifications);
  if (!raw) return { ...DEFAULT_NOTIFICATIONS };
  try {
    const parsed = JSON.parse(raw);
    return {
      lessonReminders: !!parsed.lessonReminders,
      weeklySummary: !!parsed.weeklySummary,
      productUpdates: !!parsed.productUpdates,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATIONS };
  }
}

export function setNotifications(next) {
  const safe = {
    lessonReminders: !!next?.lessonReminders,
    weeklySummary: !!next?.weeklySummary,
    productUpdates: !!next?.productUpdates,
  };
  safeSetItem(KEYS.notifications, JSON.stringify(safe));
}
