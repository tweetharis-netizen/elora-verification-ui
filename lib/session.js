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
  try {
    localStorage.setItem(STORAGE.session, JSON.stringify(data || {}));
  } catch {
    // ignore write failures
  }
  emitSessionChange();
}

export function clearSession() {
  if (!canUseWindow()) return;
  try {
    localStorage.removeItem(STORAGE.session);
  } catch {
    // ignore
  }
  emitSessionChange();
}

/** Verification */
export function setVerified(flag) {
  const s = getSession();
  s.verified = Boolean(flag);
  saveSession(s);
}

export function isVerified() {
  const s = getSession();
  return Boolean(s.verified);
}

/** Guest */
export function setGuest(flag) {
  const s = getSession();
  s.guest = Boolean(flag);
  saveSession(s);
}

export function isGuest() {
  const s = getSession();
  return Boolean(s.guest);
}

/** Role */
export function setRole(role) {
  const r = (role || "student").toString().toLowerCase();
  const s = getSession();
  s.role = r === "educator" || r === "parent" ? r : "student";
  saveSession(s);
}

export function getRole() {
  const s = getSession();
  const r = (s.role || "student").toString().toLowerCase();
  return r === "educator" || r === "parent" ? r : "student";
}

/** Theme */
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

/** Font scale */
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

/** Teacher access */
export function isTeacher() {
  const s = getSession();
  return Boolean(s.teacher);
}

export function activateTeacher(inviteCode) {
  const s = getSession();
  s.teacher = true;
  s.teacherCode = (inviteCode || "").toString().trim();
  saveSession(s);
}

export function clearTeacherAccess() {
  const s = getSession();
  delete s.teacher;
  delete s.teacherCode;
  saveSession(s);
}

/** Pending invite support (for /assistant?invite=CODE -> verify -> auto-apply) */
export function setPendingInvite(code) {
  const s = getSession();
  const c = (code || "").toString().trim();
  if (!c) return;
  s.pendingInvite = c;
  saveSession(s);
}

export function getPendingInvite() {
  const s = getSession();
  const c = (s.pendingInvite || "").toString().trim();
  return c;
}

export function clearPendingInvite() {
  const s = getSession();
  delete s.pendingInvite;
  saveSession(s);
}

/** Notifications */
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
