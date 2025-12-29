// lib/session.js
// Client-side session stored in localStorage.
// IMPORTANT: Never store secrets here — UI gating/state only.

const STORAGE_KEY = "elora_session_v2";

const defaultSession = Object.freeze({
  role: "educator", // educator | student | parent
  guest: false,

  // Verification (UI gating)
  verified: false,
  verifiedEmail: "",
  verifiedAt: 0, // unix ms

  // Teacher access (invite / paid / etc)
  teacherAccess: false,
  teacherInviteCode: "",

  // UI preferences
  theme: "system", // system | light | dark
  fontScale: 1, // 0.85 - 1.25
  notifications: {
    lessonReminders: true,
    productUpdates: true,
    weeklySummary: false,
  },

  // misc
  pendingInvite: "",
  lastUpdated: 0,
});

function isBrowser() {
  return typeof window !== "undefined";
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function normalizeSession(raw) {
  const s = { ...defaultSession, ...(raw || {}) };

  s.role = ["educator", "student", "parent"].includes(s.role) ? s.role : defaultSession.role;
  s.guest = Boolean(s.guest);

  s.verified = Boolean(s.verified);
  s.verifiedEmail = typeof s.verifiedEmail === "string" ? s.verifiedEmail : "";
  s.verifiedAt = typeof s.verifiedAt === "number" ? s.verifiedAt : 0;

  s.teacherAccess = Boolean(s.teacherAccess);
  s.teacherInviteCode = typeof s.teacherInviteCode === "string" ? s.teacherInviteCode : "";

  s.theme = ["system", "light", "dark"].includes(s.theme) ? s.theme : defaultSession.theme;
  s.fontScale = clamp(s.fontScale, 0.85, 1.25);

  s.notifications = {
    ...defaultSession.notifications,
    ...(typeof s.notifications === "object" && s.notifications ? s.notifications : {}),
  };

  s.pendingInvite = typeof s.pendingInvite === "string" ? s.pendingInvite : "";
  s.lastUpdated = typeof s.lastUpdated === "number" ? s.lastUpdated : 0;

  return s;
}

export function getSession() {
  // Static export / SSR safe
  if (!isBrowser()) return { ...defaultSession };
  const raw = safeParse(window.localStorage.getItem(STORAGE_KEY) || "");
  return normalizeSession(raw);
}

export function saveSession(patch) {
  if (!isBrowser()) return;
  const next = normalizeSession({ ...getSession(), ...(patch || {}), lastUpdated: Date.now() });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  // storage event doesn't fire in same tab
  window.dispatchEvent(new Event("elora:session"));
}

export function resetSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("elora:session"));
}

/** ---------- Role / guest ---------- */
export function setRole(role) {
  saveSession({ role, guest: false });
}

export function setGuest(guest) {
  const g = Boolean(guest);
  const s = getSession();
  saveSession({
    guest: g,
    // Guest should not count as verified
    verified: g ? false : s.verified,
    verifiedEmail: g ? "" : s.verifiedEmail,
    verifiedAt: g ? 0 : s.verifiedAt,
  });
}

export function isGuest() {
  return Boolean(getSession().guest);
}

/** ---------- Verification ---------- */
export function isVerified() {
  const s = getSession();
  return Boolean(s.verified && s.verifiedEmail && s.verifiedAt);
}

export function setVerified(verified, verifiedEmail = "") {
  const v = Boolean(verified);
  const email = verifiedEmail ? String(verifiedEmail).trim() : getSession().verifiedEmail;
  saveSession({
    verified: v,
    verifiedEmail: v ? email : "",
    verifiedAt: v ? Date.now() : 0,
    guest: false,
  });
}

export function clearVerification() {
  saveSession({ verified: false, verifiedEmail: "", verifiedAt: 0 });
}

/** ---------- Teacher access ---------- */
// ✅ These are the missing functions your build is complaining about.
export function isTeacher() {
  return Boolean(getSession().teacherAccess);
}

export function activateTeacher(inviteCode = "") {
  const code = String(inviteCode || "").trim();
  saveSession({
    teacherAccess: true,
    teacherInviteCode: code || getSession().teacherInviteCode,
    guest: false,
  });
}

export function hasTeacherAccess() {
  return Boolean(getSession().teacherAccess);
}

export function setTeacherAccess(enabled, inviteCode = "") {
  const e = Boolean(enabled);
  const code = String(inviteCode || "").trim();
  saveSession({
    teacherAccess: e,
    teacherInviteCode: e ? (code || getSession().teacherInviteCode) : "",
  });
}

/** ---------- UI prefs ---------- */
export function getTheme() {
  return getSession().theme;
}

export function setTheme(theme) {
  saveSession({ theme });
}

// Some pages may expect this name (you hit this error earlier)
export function getResolvedTheme() {
  const t = getSession().theme;
  if (t === "light" || t === "dark") return t;
  // system
  if (!isBrowser() || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getFontScale() {
  return getSession().fontScale;
}

export function setFontScale(fontScale) {
  saveSession({ fontScale });
}

export function getNotifications() {
  return getSession().notifications;
}

export function setNotifications(notifications) {
  saveSession({ notifications: { ...getSession().notifications, ...(notifications || {}) } });
}

/** ---------- Invite helpers ---------- */
export function setPendingInvite(code) {
  saveSession({ pendingInvite: String(code || "").trim() });
}

export function getPendingInvite() {
  return getSession().pendingInvite || "";
}

export function clearPendingInvite() {
  saveSession({ pendingInvite: "" });
}

/** ---------- Backwards-compat helpers ---------- */
export function getLearningPrefs() {
  const s = getSession();
  return { role: s.role };
}

export function setLearningPrefs(prefs) {
  if (!prefs) return;
  if (prefs.role) setRole(prefs.role);
}
