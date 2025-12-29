// lib/session.js
// Central client-side session + preference store for Elora (SSR-safe).
// IMPORTANT: "verified" should only be set after Firebase email-link confirmation succeeds.

const SESSION_KEY = "elora_session";

function canUseWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitSessionChanged() {
  if (!canUseWindow()) return;
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

// ---------- Role / guest ----------
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
  if (s.guest) {
    // Guest mode is always unverified.
    s.verified = false;
    delete s.verifiedAt;
  }
  saveSession(s);
}

// ---------- Verification (ONLY after email link confirm) ----------
export function isVerified() {
  const s = getSession();
  return !!s.verified;
}

// Keep this helper because other parts of the app expect it.
// RULE: Only call this after Firebase confirm succeeds.
export function setVerified(v) {
  const s = getSession();
  const next = !!v;

  s.verified = next;

  if (next) {
    s.guest = false;
    s.verifiedAt = new Date().toISOString();
  } else {
    delete s.verifiedAt;
  }

  saveSession(s);
}

// Store email so we can finish Firebase email-link sign-in.
export function setPendingVerifyEmail(email) {
  const e = (email || "").toString().trim();
  if (!e) return;
  const s = getSession();
  s.pendingVerifyEmail = e;
  saveSession(s);
}

export function getPendingVerifyEmail() {
  const s = getSession();
  return (s.pendingVerifyEmail || "").toString().trim();
}

export function clearPendingVerifyEmail() {
  const s = getSession();
  if ("pendingVerifyEmail" in s) delete s.pendingVerifyEmail;
  saveSession(s);
}

// ---------- Teacher access ----------
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

// ---------- Invite link helpers ----------
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
  if ("pendingInvite" in s) delete s.pendingInvite;
  saveSession(s);
}

// ---------- Notifications (Settings depends on these) ----------
// SSR-safe defaults (so /settings can prerender)
const DEFAULT_NOTIFS = {
  lessonReminders: false,
  weeklySummary: false,
  productUpdates: true,
};

export function getNotifications() {
  // Works even during SSR (returns defaults)
  const s = getSession();
  const n = s.notifications || {};
  return {
    lessonReminders: !!n.lessonReminders,
    weeklySummary: !!n.weeklySummary,
    productUpdates:
      typeof n.productUpdates === "boolean" ? n.productUpdates : DEFAULT_NOTIFS.productUpdates,
  };
}

export function setNotifications(next) {
  const s = getSession();
  s.notifications = {
    lessonReminders: !!next?.lessonReminders,
    weeklySummary: !!next?.weeklySummary,
    productUpdates:
      typeof next?.productUpdates === "boolean" ? next.productUpdates : DEFAULT_NOTIFS.productUpdates,
  };
  saveSession(s);
}
