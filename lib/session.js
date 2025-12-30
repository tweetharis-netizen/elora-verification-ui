const LS = {
  role: "elora_role",
  guest: "elora_guest",
  theme: "elora_theme",        // "system" | "dark" | "light"
  fontScale: "elora_fontScale" // number as string
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
  if (t === "dark" || t === "light") return t;
  // system
  if (!hasWindow()) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export function applyTheme() {
  if (!hasWindow()) return;
  const resolved = getResolvedTheme();
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.classList.toggle("dark", resolved === "dark");
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
  const n = getFontScale();
  document.documentElement.style.setProperty("--elora-font-scale", String(n));
}

/* Hydration */
export function hydrateUI() {
  if (!hasWindow()) return;
  applyTheme();
  applyFontScale();
  refreshVerifiedFromServer(); // async, updates navbar when done
}

/* Session */
export function getSession() {
  return {
    verified: lastVerified,
    verifiedEmail: lastVerifiedEmail,
    role: getRole(),
    guest: getGuest(),
    theme: getTheme(),
    resolvedTheme: getResolvedTheme(),
    fontScale: getFontScale(),
  };
}
