const LS = {
  verifiedHint: "elora_verified",
  verifiedEmailHint: "elora_verified_email",
  role: "elora_role",
  guest: "elora_guest",
  theme: "elora_theme",        // "system" | "dark" | "dawn"
  fontScale: "elora_fontScale",
  blob: "elora_session_blob"   // for misc (pendingInvite, etc)
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

function loadBlob() {
  if (!hasWindow()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(LS.blob) || "{}") || {};
  } catch {
    return {};
  }
}

export function saveSession(next) {
  if (!hasWindow()) return;
  const cur = loadBlob();
  const merged = { ...cur, ...(next || {}) };
  window.localStorage.setItem(LS.blob, JSON.stringify(merged));
  emitSessionUpdate();
}

export function setVerifiedLocal(email = "") {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.verifiedHint, "true");
  window.localStorage.setItem(LS.verifiedEmailHint, email || "");
  emitSessionUpdate();
}

export function clearVerifiedLocal() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(LS.verifiedHint);
  window.localStorage.removeItem(LS.verifiedEmailHint);
  emitSessionUpdate();
}

export async function refreshVerifiedFromServer() {
  if (!hasWindow()) return { verified: false };

  try {
    const r = await fetch("/api/verification/status", { method: "GET" });
    const data = await r.json().catch(() => null);

    lastVerified = !!data?.verified;
    lastVerifiedEmail = data?.email || null;

    // Optional hint storage to reduce UI flicker (NOT trusted)
    if (lastVerified) setVerifiedLocal(lastVerifiedEmail || "");
    else clearVerifiedLocal();

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
  if (!hasWindow()) return "dark";
  return window.localStorage.getItem(LS.theme) || "system";
}
export function setTheme(theme) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.theme, theme);
  applyTheme();
  emitSessionUpdate();
}
export function getResolvedTheme() {
  const t = getTheme();
  if (!hasWindow()) return t === "system" ? "dark" : t;
  if (t !== "system") return t;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "dawn" : "dark";
}
export function applyTheme() {
  if (!hasWindow()) return;
  const r = getResolvedTheme();
  document.documentElement.classList.remove("theme-dark", "theme-dawn");
  document.documentElement.classList.add(r === "dawn" ? "theme-dawn" : "theme-dark");
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
  applyFontScale();
  emitSessionUpdate();
}
export function applyFontScale() {
  if (!hasWindow()) return;
  document.documentElement.style.setProperty("--elora-font-scale", String(getFontScale()));
}

/* Hydration */
export function hydrateUI() {
  if (!hasWindow()) return;
  applyTheme();
  applyFontScale();
  refreshVerifiedFromServer(); // server truth
}

/* Session snapshot */
export function getSession() {
  const blob = loadBlob();
  return {
    verified: lastVerified,
    verifiedEmail: lastVerifiedEmail,
    role: getRole(),
    guest: getGuest(),
    theme: getTheme(),
    resolvedTheme: getResolvedTheme(),
    fontScale: getFontScale(),
    ...blob, // pendingInvite, etc
  };
}
