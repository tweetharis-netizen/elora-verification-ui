const LS = {
  role: "elora_role",
  guest: "elora_guest",
  theme: "elora_theme",
  fontScale: "elora_fontScale",
};

function hasWindow() {
  return typeof window !== "undefined";
}

function emitSessionUpdate() {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event("elora:session"));
}

let lastVerified = false;
let lastVerifiedEmail = null;

export async function refreshVerifiedFromServer() {
  if (!hasWindow()) return { verified: false };

  try {
    const r = await fetch("/api/verification/status", { method: "GET" });
    const data = await r.json().catch(() => null);

    lastVerified = !!data?.verified;
    lastVerifiedEmail = data?.email || null;

    emitSessionUpdate();
    return { verified: lastVerified, email: lastVerifiedEmail };
  } catch {
    lastVerified = false;
    lastVerifiedEmail = null;
    emitSessionUpdate();
    return { verified: false };
  }
}

/* Roles */
export function getRole() {
  if (!hasWindow()) return "student";
  return window.localStorage.getItem(LS.role) || "student";
}
export function setRole(role) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.role, role);
  emitSessionUpdate();
}
export function isTeacher() {
  return getRole() === "educator";
}
export function activateTeacher() {
  setGuest(false);
  setRole("educator");
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

/* Theme */
export function getTheme() {
  if (!hasWindow()) return "system";
  return window.localStorage.getItem(LS.theme) || "system";
}
export function setTheme(theme) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.theme, theme);
  emitSessionUpdate();
}

/* Font scale */
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

/* Optional compatibility: some parts of your app expect these */
export function saveSession(obj) {
  // Minimal no-op compatibility: keep signature, but don’t store secrets here.
  if (!hasWindow()) return;
  window.localStorage.setItem("elora_session_blob", JSON.stringify(obj || {}));
  emitSessionUpdate();
}

/* Hydration */
export function hydrateUI() {
  if (!hasWindow()) return;
  refreshVerifiedFromServer();
}

export function getSession() {
  return {
    verified: lastVerified,
    verifiedEmail: lastVerifiedEmail,
    role: getRole(),
    guest: getGuest(),
    theme: getTheme(),
    fontScale: getFontScale(),
  };
}
