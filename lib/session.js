// lib/session.js
// Central client-side session + preference store for Elora.
// NOTE: This is intentionally localStorage-based (prototype). It is SSR-safe.

const SESSION_KEY = "elora_session";

// Back-compat: some code may still use these helpers.
export const STORAGE = {
  session: SESSION_KEY,
};

function canUseWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitSessionChanged() {
  if (!canUseWindow()) return;
  // Custom event to let pages/components react without prop-drilling.
  window.dispatchEvent(new Event("elora:session"));
}

export function getSession() {
  if (!canUseWindow()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveSession(data) {
  if (!canUseWindow()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(data || {}));
  emitSessionChanged();
}

export function clearSession() {
  if (!canUseWindow()) return;
  window.localStorage.removeItem(SESSION_KEY);
  emitSessionChanged();
}

export function getStored(key, fallback = "") {
  if (!canUseWindow()) return fallback;
  try {
    const v = window.localStorage.getItem(String(key));
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function setStored(key, value) {
  if (!canUseWindow()) return;
  try {
    window.localStorage.setItem(String(key), String(value));
  } finally {
    // stored keys are sometimes used as session-like state (e.g., theme)
    emitSessionChanged();
  }
}

// ---------- Theme ----------
export function getTheme() {
  const s = getSession();
  const mode = (s.themeMode || "system").toString().toLowerCase();
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  return "system";
}

export function setTheme(mode) {
  const m = (mode || "system").toString().toLowerCase();
  const next = m === "light" ? "light" : m === "dark" ? "dark" : "system";
  const s = getSession();
  s.themeMode = next;
  saveSession(s);
}

export function getResolvedTheme() {
  // Returns 'light' or 'dark' depending on current mode + system preference.
  const mode = getTheme();
  if (mode === "light" || mode === "dark") return mode;

  if (!canUseWindow() || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// ---------- Font scale ----------
export function getFontScale() {
  const s = getSession();
  const n = Number(s.fontScale);
  if (!Number.isFinite(n)) return 1;
  return Math.min(1.25, Math.max(0.9, n));
}

export function setFontScale(scale) {
  const n = Number(scale);
  const s = getSession();
  s.fontScale = Number.isFinite(n) ? Math.min(1.25, Math.max(0.9, n)) : 1;
  saveSession(s);
}

// ---------- Role / guest / verification ----------
export function getRole() {
  const s = getSession();
  const r = (s.role || "educator").toString().toLowerCase();
  if (r === "student" || r === "parent" || r === "educator") return r;
  return "educator";
}

export function setRole(role) {
  const r = (role || "educator").toString().toLowerCase();
  const s = getSession();
  s.role = r === "student" || r === "parent" ? r : "educator";
  saveSession(s);
}

export function isGuest() {
  const s = getSession();
  return !!s.guest;
}

export function setGuest(v) {
  const s = getSession();
  s.guest = !!v;
  // Guest mode implies unverified.
  if (s.guest) s.verified = false;
  saveSession(s);
}

export function isVerified() {
  const s = getSession();
  return !!s.verified;
}

export function setVerified(v) {
  const s = getSession();
  s.verified = !!v;
  if (s.verified) s.guest = false;
  saveSession(s);
}

// ---------- Teacher access (invite protected) ----------
export function isTeacher() {
  const s = getSession();
  return !!s.teacher;
}

export function activateTeacher(inviteCode) {
  const code = (inviteCode || "").toString().trim();
  const s = getSession();
  s.teacher = true;
  s.teacherCode = code;
  saveSession(s);
}

export function clearTeacherAccess() {
  const s = getSession();
  delete s.teacher;
  delete s.teacherCode;
  saveSession(s);
}

// ---------- Invite flow helpers ----------
export function setPendingInvite(code) {
  const c = (code || "").toString().trim();
  if (!c) return;
  const s = getSession();
  s.pendingInvite = c;
  saveSession(s);
}

export function getPendingInvite() {
  const s = getSession();
  return (s.pendingInvite || "").toString().trim();
}

export function clearPendingInvite() {
  const s = getSession();
  if (s.pendingInvite) delete s.pendingInvite;
  saveSession(s);
}

// ---------- Notifications ----------
const DEFAULT_NOTIFS = {
  lessonReminders: false,
  weeklySummary: false,
  productUpdates: true,
};

export function getNotifications() {
  const s = getSession();
  const n = s.notifications || {};
  return {
    lessonReminders: !!n.lessonReminders,
    weeklySummary: !!n.weeklySummary,
    productUpdates: n.productUpdates === undefined ? DEFAULT_NOTIFS.productUpdates : !!n.productUpdates,
  };
}

export function setNotifications(next) {
  const s = getSession();
  s.notifications = {
    lessonReminders: !!next?.lessonReminders,
    weeklySummary: !!next?.weeklySummary,
    productUpdates: next?.productUpdates === undefined ? DEFAULT_NOTIFS.productUpdates : !!next?.productUpdates,
  };
  saveSession(s);
}

// ---------- Deprecated (kept to avoid accidental imports breaking) ----------
export function getLearningPrefs() {
  // Batch 5 removed "Learning preferences" from Settings.
  // Keep a sane default for older code paths.
  return {
    mode: "guided",
    hintStyle: "gentle",
    attemptsBeforeReveal: 3,
  };
}

export function setLearningPrefs(_prefs) {
  // no-op (deprecated)
}
