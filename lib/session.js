// lib/session.js
// Central session + preference store (localStorage)
// Deploy-safe: guards window access + emits events for UI to react.

export const STORAGE = {
  session: "elora_session",
};

function canUseWindow() {
  return typeof window !== "undefined";
}

function emitSessionChange() {
  if (!canUseWindow()) return;
  // Same-tab listeners
  window.dispatchEvent(new Event("elora:session"));
}

export function getSession() {
  if (!canUseWindow()) return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE.session)) || {};
  } catch {
    return {};
  }
}

export function saveSession(data) {
  if (!canUseWindow()) return;
  localStorage.setItem(STORAGE.session, JSON.stringify(data || {}));
  emitSessionChange();
}

export function clearSession() {
  if (!canUseWindow()) return;
  localStorage.removeItem(STORAGE.session);
  emitSessionChange();
}

// Generic helpers for backward-compat (your assistant.js used to import these)
export function getStored(key, fallback = null) {
  if (!canUseWindow()) return fallback;
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function setStored(key, value) {
  if (!canUseWindow()) return;
  try {
    if (value === undefined || value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

// Theme
export function getTheme() {
  const s = getSession();
  const m = (s.themeMode || "system").toString().toLowerCase();
  if (m === "light" || m === "dark" || m === "system") return m;
  return "system";
}

export function setTheme(mode) {
  const m = (mode || "system").toString().toLowerCase();
  const s = getSession();
  s.themeMode = m === "light" || m === "dark" ? m : "system";
  saveSession(s);
}

export function getResolvedTheme(modeOverride) {
  const mode = (modeOverride || getTheme()).toString().toLowerCase();
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  // system
  if (!canUseWindow()) return "dark";
  try {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "dark";
  }
}

// Font scale
export function getFontScale() {
  const s = getSession();
  const raw = Number(s.fontScale);
  if (!Number.isFinite(raw)) return 1;
  return Math.min(1.3, Math.max(0.9, raw));
}

export function setFontScale(scale) {
  const v = Number(scale);
  const s = getSession();
  s.fontScale = Number.isFinite(v) ? Math.min(1.3, Math.max(0.9, v)) : 1;
  saveSession(s);
}

// Role / gating
export function setRole(role) {
  const r = (role || "student").toString().toLowerCase();
  const s = getSession();
  s.role = r === "educator" || r === "parent" ? r : "student";
  saveSession(s);
}

export function setGuest(flag) {
  const s = getSession();
  s.guest = Boolean(flag);
  saveSession(s);
}

// Teacher invite staging (NOT trusted until validated server-side)
export function setTeacherInvite(code) {
  const c = (code || "").toString().trim();
  const s = getSession();
  s.teacherInvite = c;
  saveSession(s);
}

export function clearTeacherInvite() {
  const s = getSession();
  delete s.teacherInvite;
  saveSession(s);
}

// Teacher access (trusted only after server validation)
export function isTeacher() {
  const s = getSession();
  return Boolean(s.teacher);
}

export function activateTeacher(inviteCode) {
  const s = getSession();
  s.teacher = true;
  s.teacherCode = (inviteCode || "").toString().trim();
  // also store in teacherInvite for convenience
  s.teacherInvite = s.teacherCode;
  saveSession(s);
}

export function clearTeacherAccess() {
  const s = getSession();
  delete s.teacher;
  delete s.teacherCode;
  delete s.teacherInvite;
  saveSession(s);
}

// Notifications
export function getNotifications() {
  const s = getSession();
  const n = s.notifications || {};
  return {
    lessonReminders: Boolean(n.lessonReminders),
    weeklySummary: Boolean(n.weeklySummary),
    productUpdates: Boolean(n.productUpdates),
  };
}

export function setNotifications(next) {
  const s = getSession();
  const n = next || {};
  s.notifications = {
    lessonReminders: Boolean(n.lessonReminders),
    weeklySummary: Boolean(n.weeklySummary),
    productUpdates: Boolean(n.productUpdates),
  };
  saveSession(s);
}

// (Legacy) Learning prefs - not used in Settings anymore, but kept to avoid breaking old code
export function getLearningPrefs() {
  const s = getSession();
  return (
    s.learningPrefs || {
      mode: "guided",
      hintStyle: "gentle",
      attemptsBeforeReveal: 3,
    }
  );
}

export function setLearningPrefs(prefs) {
  const s = getSession();
  s.learningPrefs = prefs || getLearningPrefs();
  saveSession(s);
}
