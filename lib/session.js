// lib/session.js
const LS = {
  verified: "elora_verified",
  verifiedEmail: "elora_verified_email",
  role: "elora_role",
  guest: "elora_guest",
  theme: "elora_theme",        // "system" | "dark" | "dawn"
  fontScale: "elora_fontScale" // number as string
};

function hasWindow() {
  return typeof window !== "undefined";
}

function emitSessionUpdate() {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event("elora:session"));
}

export function getVerifiedLocal() {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(LS.verified) === "1";
}

export function getVerifiedEmailLocal() {
  if (!hasWindow()) return "";
  return window.localStorage.getItem(LS.verifiedEmail) || "";
}

export function setVerifiedLocal(email = "") {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.verified, "1");
  if (email) window.localStorage.setItem(LS.verifiedEmail, email);
  emitSessionUpdate();
}

export function clearVerifiedLocal() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(LS.verified);
  window.localStorage.removeItem(LS.verifiedEmail);
  emitSessionUpdate();
}

export function getRole() {
  if (!hasWindow()) return "educator";
  return window.localStorage.getItem(LS.role) || "educator";
}

export function setRole(role) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.role, role);
  emitSessionUpdate();
}

export function getGuest() {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(LS.guest) === "1";
}

export function setGuest(isGuest) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.guest, isGuest ? "1" : "0");
  emitSessionUpdate();
}

export function isTeacher() {
  return getRole() === "educator" && !getGuest();
}

export function activateTeacher() {
  setGuest(false);
  setRole("educator");
}

// Theme
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
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
    ? "dawn"
    : "dark";
}

export function applyTheme() {
  if (!hasWindow()) return;
  const resolved = getResolvedTheme();
  document.documentElement.classList.remove("theme-dark", "theme-dawn");
  document.documentElement.classList.add(resolved === "dawn" ? "theme-dawn" : "theme-dark");
}

// Font scale
export function getFontScale() {
  if (!hasWindow()) return 1.0;
  const raw = window.localStorage.getItem(LS.fontScale);
  const num = raw ? Number(raw) : 1.0;
  return Number.isFinite(num) ? num : 1.0;
}

export function setFontScale(scale) {
  if (!hasWindow()) return;
  const clamped = Math.min(1.4, Math.max(0.85, Number(scale) || 1.0));
  window.localStorage.setItem(LS.fontScale, String(clamped));
  applyFontScale();
  emitSessionUpdate();
}

export function applyFontScale() {
  if (!hasWindow()) return;
  document.documentElement.style.setProperty("--elora-font-scale", String(getFontScale()));
}

// One-shot “apply everything” on app load
export function hydrateUI() {
  if (!hasWindow()) return;
  applyTheme();
  applyFontScale();

  // Keep theme in sync with OS when theme=system
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener?.("change", () => {
      if (getTheme() === "system") applyTheme();
    });
  }
}

// Optional: server truth from API
export async function refreshVerifiedFromServer() {
  try {
    const res = await fetch("/api/session", { cache: "no-store" });
    const data = await res.json();
    if (data?.verified) setVerifiedLocal(data.email || "");
    emitSessionUpdate();
    return data;
  } catch {
    return { verified: getVerifiedLocal(), email: getVerifiedEmailLocal() };
  }
}

export function getSession() {
  return {
    verified: getVerifiedLocal(),
    verifiedEmail: getVerifiedEmailLocal(),
    role: getRole(),
    guest: getGuest(),
    theme: getTheme(),
    resolvedTheme: getResolvedTheme(),
    fontScale: getFontScale()
  };
}
