// lib/session.js
// Client-side preferences + a thin cache of verification state.
// Source of truth for verification is the backend via /api/verification/status.

const LS = {
  verified: "elora_verified",
  verifiedEmail: "elora_verified_email",
  role: "elora_role",
  guest: "elora_guest",
  theme: "elora_theme",
  fontScale: "elora_fontScale",
  blob: "elora_session_blob",
};

const SESSION_EVENT = "elora:session";

function hasWindow() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function emitSessionUpdate() {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function safeJsonParse(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function getBlob() {
  if (!hasWindow()) return {};
  return safeJsonParse(window.localStorage.getItem(LS.blob) || "{}", {}) || {};
}

export function saveSession(obj = {}) {
  if (!hasWindow()) return;
  const cur = getBlob();
  const next = { ...cur, ...(obj || {}) };
  window.localStorage.setItem(LS.blob, JSON.stringify(next));
  emitSessionUpdate();
}

export function getSession() {
  const blob = getBlob();
  return {
    verified: getVerifiedLocal(),
    verifiedEmail: getVerifiedEmailLocal(),
    role: getRole(),
    guest: getGuest(),
    theme: getTheme(),
    fontScale: getFontScale(),
    teacherCode: String(blob.teacherCode || ""),
    pendingInvite: String(blob.pendingInvite || ""),
  };
}

// ---- Verification local cache (UI convenience only) ----

export function getVerifiedLocal() {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(LS.verified) === "true";
}

export function getVerifiedEmailLocal() {
  if (!hasWindow()) return "";
  return window.localStorage.getItem(LS.verifiedEmail) || "";
}

function setVerifiedLocal(email = "") {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.verified, "true");
  window.localStorage.setItem(LS.verifiedEmail, String(email || "").toLowerCase());
}

function clearVerifiedLocal() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(LS.verified);
  window.localStorage.removeItem(LS.verifiedEmail);
}

export async function refreshVerifiedFromServer() {
  if (!hasWindow()) return { verified: false, email: "" };

  try {
    const r = await fetch("/api/verification/status", { method: "GET" });
    const data = await r.json().catch(() => null);

    if (data?.verified) {
      setVerifiedLocal(data.email || "");
      return { verified: true, email: String(data.email || "") };
    }

    clearVerifiedLocal();
    return { verified: false, email: "" };
  } catch {
    // Fall back to local cache if backend is temporarily unreachable.
    return { verified: getVerifiedLocal(), email: getVerifiedEmailLocal() };
  } finally {
    emitSessionUpdate();
  }
}

// ---- Role / guest / teacher invite ----

export function getRole() {
  if (!hasWindow()) return "student";
  return window.localStorage.getItem(LS.role) || "student";
}

export function setRole(role) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.role, String(role || "student"));
  emitSessionUpdate();
}

export function getGuest() {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(LS.guest) === "true";
}

export function setGuest(v) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.guest, v ? "true" : "false");
  emitSessionUpdate();
}

export function isTeacher() {
  return getRole() === "educator";
}

export function getTeacherCode() {
  const b = getBlob();
  return String(b.teacherCode || "");
}

export function setTeacherCode(code) {
  saveSession({ teacherCode: String(code || "").trim() });
}

export function activateTeacher(inviteCode = "") {
  // Keeps compatibility with calls like activateTeacher(inviteCode)
  if (inviteCode) setTeacherCode(inviteCode);
  setGuest(false);
  setRole("educator");
}

// ---- Theme + font scale (must apply to DOM) ----

export function getTheme() {
  if (!hasWindow()) return "system";
  return window.localStorage.getItem(LS.theme) || "system";
}

export function getResolvedTheme() {
  const t = getTheme();
  if (t === "dark" || t === "light") return t;
  if (!hasWindow()) return "dark";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "dark";
  }
}

function applyThemeToDom(theme) {
  if (!hasWindow()) return;
  const resolved = theme === "system" ? getResolvedTheme() : theme;
  document.documentElement.dataset.theme = resolved;
  if (resolved === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

export function setTheme(theme) {
  if (!hasWindow()) return;
  const t = theme === "dark" || theme === "light" || theme === "system" ? theme : "system";
  window.localStorage.setItem(LS.theme, t);
  applyThemeToDom(t);
  emitSessionUpdate();
}

export function getFontScale() {
  if (!hasWindow()) return 1;
  const raw = window.localStorage.getItem(LS.fontScale);
  const n = raw ? Number(raw) : 1;
  return clamp(n, 0.85, 1.4);
}

function applyFontScaleToDom(scale) {
  if (!hasWindow()) return;
  const v = clamp(scale, 0.85, 1.4);
  document.documentElement.style.setProperty("--elora-font-scale", String(v));
}

export function setFontScale(n) {
  if (!hasWindow()) return;
  const v = clamp(n, 0.85, 1.4);
  window.localStorage.setItem(LS.fontScale, String(v));
  applyFontScaleToDom(v);
  emitSessionUpdate();
}

// ---- Boot ----

export function hydrateUI() {
  if (!hasWindow()) return;

  // Apply saved UI preferences immediately (prevents “slider moves but UI doesn’t”)
  applyFontScaleToDom(getFontScale());
  applyThemeToDom(getTheme());

  // If theme is system, keep it synced
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getTheme() === "system") applyThemeToDom("system");
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  } catch {}

  // Always reconcile verification from server
  refreshVerifiedFromServer();
}
