// lib/session.js
// Client-side session + UI preferences.
// Source of truth for verification is the backend (cookie -> /api/verification/status).

const LS = {
  verified: "elora_verified",
  verifiedEmail: "elora_verified_email",
  role: "elora_role", // "educator" | "student" | "parent" etc
  guest: "elora_guest", // "true" | "false"
  theme: "elora_theme", // "dark" | "light" | "system"
  fontScale: "elora_fontScale", // number as string
  blob: "elora_session_blob", // JSON blob for extra fields (teacherCode, pendingInvite, etc)
};

const SESSION_EVENT = "elora:session";

function hasWindow() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function safeJsonParse(v, fallback) {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function emitSessionUpdate() {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event(SESSION_EVENT));
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

export function saveSession(obj) {
  if (!hasWindow()) return;
  const cur = getBlob();
  const next = { ...cur, ...(obj || {}) };
  window.localStorage.setItem(LS.blob, JSON.stringify(next));
  emitSessionUpdate();
}

export function getVerifiedLocal() {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(LS.verified) === "true";
}

export function getVerifiedEmailLocal() {
  if (!hasWindow()) return "";
  return window.localStorage.getItem(LS.verifiedEmail) || "";
}

function setVerifiedLocal(email) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.verified, "true");
  window.localStorage.setItem(LS.verifiedEmail, String(email || "").toLowerCase());
}

function clearVerifiedLocal() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(LS.verified);
  window.localStorage.removeItem(LS.verifiedEmail);
}

export function setVerified(v) {
  // v can be boolean or email string
  if (!hasWindow()) return;
  if (v === false || v === "false" || v === "" || v == null) {
    clearVerifiedLocal();
  } else if (v === true) {
    window.localStorage.setItem(LS.verified, "true");
  } else {
    setVerifiedLocal(String(v));
  }
  emitSessionUpdate();
}

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

export async function activateTeacher() {
  // Educator tools are invite-protected (optional). We validate code server-side.
  const blob = getBlob();
  const code = String(blob.teacherCode || "").trim();

  if (!code) {
    setGuest(false);
    setRole("educator");
    return { ok: true, invited: false };
  }

  try {
    const r = await fetch(`/api/teacher-invite?code=${encodeURIComponent(code)}`);
    const data = await r.json().catch(() => null);
    if (!data?.ok) return { ok: false, error: "invalid_invite" };

    setGuest(false);
    setRole("educator");
    return { ok: true, invited: true };
  } catch {
    return { ok: false, error: "invite_check_failed" };
  }
}

export function getTeacherCode() {
  const b = getBlob();
  return String(b.teacherCode || "");
}

export function setTeacherCode(code) {
  saveSession({ teacherCode: String(code || "").trim() });
}

export function getTheme() {
  if (!hasWindow()) return "system";
  return window.localStorage.getItem(LS.theme) || "system";
}

export function getResolvedTheme() {
  const t = getTheme();
  if (t === "dark" || t === "light") return t;
  if (!hasWindow()) return "dark";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeToDom(theme) {
  if (!hasWindow()) return;
  const resolved = theme === "system" ? getResolvedTheme() : theme;
  const html = document.documentElement;

  html.dataset.theme = resolved; // CSS variables
  if (resolved === "dark") html.classList.add("dark");
  else html.classList.remove("dark");
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

export async function refreshVerifiedFromServer() {
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
    return { verified: getVerifiedLocal(), email: getVerifiedEmailLocal() };
  } finally {
    emitSessionUpdate();
  }
}

export function hydrateUI() {
  if (!hasWindow()) return;

  applyFontScaleToDom(getFontScale());
  applyThemeToDom(getTheme());

  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getTheme() === "system") applyThemeToDom("system");
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  } catch {}

  refreshVerifiedFromServer();
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
    teacherCode: blob.teacherCode || "",
    pendingInvite: blob.pendingInvite || "",
  };
}
