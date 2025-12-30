// lib/session.js
const LS = {
  verified: "elora_verified",
  verifiedEmail: "elora_verified_email",
  role: "elora_role",
  guest: "elora_guest",
  theme: "elora_theme",
  fontScale: "elora_fontScale",
  blob: "elora_session_blob"
};

function hasWindow() {
  return typeof window !== "undefined";
}

function emitSessionUpdate() {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event("elora:session"));
}

export function saveSession(obj = {}) {
  if (!hasWindow()) return;
  const cur = (() => {
    try {
      return JSON.parse(window.localStorage.getItem(LS.blob) || "{}") || {};
    } catch {
      return {};
    }
  })();
  window.localStorage.setItem(LS.blob, JSON.stringify({ ...cur, ...obj }));
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
export function setVerifiedLocal(email = "") {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.verified, "true");
  window.localStorage.setItem(LS.verifiedEmail, email);
  emitSessionUpdate();
}
export function clearVerifiedLocal() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(LS.verified);
  window.localStorage.removeItem(LS.verifiedEmail);
  emitSessionUpdate();
}

export async function refreshVerifiedFromServer() {
  if (!hasWindow()) return { verified: false };

  try {
    const r = await fetch("/api/verification/status");
    const data = await r.json().catch(() => null);
    if (data?.verified) setVerifiedLocal(data.email || "");
    else clearVerifiedLocal();
    return { verified: !!data?.verified, email: data?.email || "" };
  } catch {
    return { verified: false, email: "" };
  } finally {
    emitSessionUpdate();
  }
}

export function getRole() {
  if (!hasWindow()) return "student";
  return window.localStorage.getItem(LS.role) || "student";
}
export function setRole(role) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.role, role);
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
export function activateTeacher() {
  setGuest(false);
  setRole("educator");
}

export function getTheme() {
  if (!hasWindow()) return "system";
  return window.localStorage.getItem(LS.theme) || "system";
}
export function setTheme(theme) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.theme, theme);
  emitSessionUpdate();
}

export function getFontScale() {
  if (!hasWindow()) return 1;
  const raw = window.localStorage.getItem(LS.fontScale);
  const n = raw ? Number(raw) : 1;
  return Number.isFinite(n) && n > 0.8 && n < 1.4 ? n : 1;
}
export function setFontScale(n) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.fontScale, String(n));
  emitSessionUpdate();
}

export function hydrateUI() {
  if (!hasWindow()) return;
  refreshVerifiedFromServer();
}

export function getSession() {
  return {
    verified: getVerifiedLocal(),
    verifiedEmail: getVerifiedEmailLocal(),
    role: getRole(),
    guest: getGuest(),
    theme: getTheme(),
    fontScale: getFontScale(),
  };
}
