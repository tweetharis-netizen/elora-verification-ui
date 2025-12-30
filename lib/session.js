// lib/session.js
// SSR-safe session + preference store with backwards-compatible exports.

export const STORAGE = {
  session: "elora_session",

  // single keys used around the app
  role: "elora_role",
  guest: "elora_guest",

  verified: "elora_verified",
  verifiedEmail: "elora_verified_email",

  teacher: "elora_teacher",
  teacherInvite: "elora_teacher_invite",
  pendingInvite: "elora_pending_invite",

  theme: "elora_theme", // 'system' | 'light' | 'dark'
  fontScale: "elora_font_scale", // numeric string e.g. "1"
  notifications: "elora_notifications", // JSON string
};

const isBrowser = () => typeof window !== "undefined";

export function getStored(key, fallback = null) {
  if (!isBrowser()) return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v === null || v === undefined || v === "" ? fallback : v;
  } catch {
    return fallback;
  }
}

export function setStored(key, value) {
  if (!isBrowser()) return;
  try {
    if (value === undefined || value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new Event("elora:session"));
  } catch {
    // ignore
  }
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// ---- Session object store (kept for backwards compatibility) ----

export function getSession() {
  if (!isBrowser()) return {};
  const raw = getStored(STORAGE.session, "");
  const obj = safeJsonParse(raw, {});
  return obj || {};
}

export function saveSession(data) {
  if (!isBrowser()) return;
  setStored(STORAGE.session, JSON.stringify(data || {}));
}

export function clearSession() {
  if (!isBrowser()) return;
  setStored(STORAGE.session, null);
}

// ---- Role / Guest ----

export function setRole(role) {
  const r = role || "Educator";
  setStored(STORAGE.role, r);
  const s = getSession();
  s.role = r;
  saveSession(s);
}

export function storeRole(role) {
  setRole(role);
}

export function setGuest(isGuest) {
  setStored(STORAGE.guest, isGuest ? "true" : "false");
  const s = getSession();
  s.guest = !!isGuest;
  saveSession(s);
}

export function storeGuest(isGuest) {
  setGuest(!!isGuest);
}

// ---- Verification ----

export function setVerified(isVerified, email = "") {
  setStored(STORAGE.verified, isVerified ? "true" : "false");
  if (email) setStored(STORAGE.verifiedEmail, email);
  if (!isVerified) setStored(STORAGE.verifiedEmail, null);

  const s = getSession();
  s.verified = !!isVerified;
  s.verifiedEmail = isVerified ? (email || s.verifiedEmail || "") : "";
  saveSession(s);
}

export function isVerified() {
  const v = getStored(STORAGE.verified, "false") === "true";
  const e = getStored(STORAGE.verifiedEmail, "");
  return v && !!e;
}

// ---- Teacher access ----

export function isTeacher() {
  return getStored(STORAGE.teacher, "false") === "true";
}

export function activateTeacher(inviteCode) {
  setStored(STORAGE.teacher, "true");
  if (inviteCode) setStored(STORAGE.teacherInvite, inviteCode);

  const s = getSession();
  s.teacher = true;
  if (inviteCode) s.teacherCode = inviteCode;
  saveSession(s);
}

export function clearTeacher() {
  setStored(STORAGE.teacher, null);
  setStored(STORAGE.teacherInvite, null);

  const s = getSession();
  s.teacher = false;
  s.teacherCode = "";
  saveSession(s);
}

export function setTeacherInvite(code) {
  if (!code) return;
  setStored(STORAGE.teacherInvite, code);
  const s = getSession();
  s.teacherCode = code;
  saveSession(s);
}

export function clearTeacherInvite() {
  setStored(STORAGE.teacherInvite, null);
  const s = getSession();
  s.teacherCode = "";
  saveSession(s);
}

export function setPendingInvite(code) {
  if (!code) return;
  setStored(STORAGE.pendingInvite, code);
  const s = getSession();
  s.pendingInvite = code;
  saveSession(s);
}

export function getPendingInvite() {
  return getStored(STORAGE.pendingInvite, "");
}

export function clearPendingInvite() {
  setStored(STORAGE.pendingInvite, null);
  const s = getSession();
  s.pendingInvite = "";
  saveSession(s);
}

// ---- Theme ----

export function getTheme() {
  // prefer single key, fallback to session, default system
  const t = getStored(STORAGE.theme, "");
  if (t) return t;
  const s = getSession();
  return s.themeMode || "system";
}

export function setTheme(mode) {
  const m = mode === "system" || mode === "light" || mode === "dark" ? mode : "system";
  setStored(STORAGE.theme, m);
  const s = getSession();
  s.themeMode = m;
  saveSession(s);
}

// ---- Font scale (numeric; UI can map to small/normal/large) ----

export function getFontScale() {
  const v = getStored(STORAGE.fontScale, "");
  if (v) return Number(v) || 1;
  const s = getSession();
  return Number(s.fontScale) || 1;
}

export function setFontScale(scale) {
  const n = typeof scale === "string" ? Number(scale) : scale;
  const clamped = Number.isFinite(n) ? Math.max(0.9, Math.min(1.15, n)) : 1;
  setStored(STORAGE.fontScale, String(clamped));
  const s = getSession();
  s.fontScale = clamped;
  saveSession(s);
}

// ---- Notifications ----

export function getNotifications() {
  const raw = getStored(STORAGE.notifications, "");
  const n = safeJsonParse(raw, null);
  if (n) return n;
  const s = getSession();
  return (
    s.notifications || {
      lessonReminders: true,
      weeklySummary: false,
      productUpdates: false,
    }
  );
}

export function setNotifications(notifications) {
  const safe = {
    lessonReminders: !!notifications?.lessonReminders,
    weeklySummary: !!notifications?.weeklySummary,
    productUpdates: !!notifications?.productUpdates,
  };
  setStored(STORAGE.notifications, JSON.stringify(safe));
  const s = getSession();
  s.notifications = safe;
  saveSession(s);
}
