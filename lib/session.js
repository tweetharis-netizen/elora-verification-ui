// lib/session.js
// Client-side session & UI prefs + local cache of verification status.
// Verified access is enforced server-side. LocalStorage is only UI cache.

const LS = {
  verified: "elora_verified",
  verifiedEmail: "elora_verified_email",
  role: "elora_role",
  guest: "elora_guest",
  theme: "elora_theme",
  fontScale: "elora_fontScale",
  teacherCode: "elora_teacher_code",
  teacherActive: "elora_teacher_active",
  pendingInvite: "elora_pending_invite",
  blob: "elora_session_blob",
};

function hasWindow() {
  return typeof window !== "undefined";
}

function emitSessionUpdate() {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event("elora:session"));
}

function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

/* ---------- Verification cache (UI only) ---------- */
function getVerifiedLocal() {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(LS.verified) === "true";
}
function getVerifiedEmailLocal() {
  if (!hasWindow()) return "";
  return window.localStorage.getItem(LS.verifiedEmail) || "";
}
function setVerifiedLocal(email = "") {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.verified, "true");
  window.localStorage.setItem(LS.verifiedEmail, email || "");
}
function clearVerifiedLocal() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(LS.verified);
  window.localStorage.removeItem(LS.verifiedEmail);
}

export function setVerified(v, email = "") {
  if (!hasWindow()) return;
  if (v) setVerifiedLocal(email);
  else clearVerifiedLocal();
  emitSessionUpdate();
}

export async function refreshVerifiedFromServer() {
  if (!hasWindow()) return { verified: false, email: "" };

  try {
    const r = await fetch("/api/verification/status", { method: "GET" });
    const data = await r.json().catch(() => null);
    if (data?.verified) setVerifiedLocal(data.email || "");
    else clearVerifiedLocal();
    return { verified: !!data?.verified, email: data?.email || "" };
  } catch {
    return { verified: getVerifiedLocal(), email: getVerifiedEmailLocal() };
  } finally {
    emitSessionUpdate();
  }
}

/* ---------- Role / guest ---------- */
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

/* ---------- Teacher gating ---------- */
export function getTeacherCode() {
  if (!hasWindow()) return "";
  return window.localStorage.getItem(LS.teacherCode) || "";
}
export function setTeacherCode(code) {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.teacherCode, String(code || "").trim());
  emitSessionUpdate();
}
export function isTeacher() {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(LS.teacherActive) === "true";
}
export function activateTeacher(inviteCode = "") {
  if (!hasWindow()) return;
  window.localStorage.setItem(LS.teacherActive, "true");
  if (inviteCode) window.localStorage.setItem(LS.teacherCode, String(inviteCode).trim());
  window.localStorage.setItem(LS.role, "educator");
  emitSessionUpdate();
}

/* ---------- Theme + font scale ---------- */
export function getTheme() {
  if (!hasWindow()) return "system";
  return window.localStorage.getItem(LS.theme) || "system";
}

export function getResolvedTheme() {
  if (!hasWindow()) return "dark";
  const t = getTheme();
  if (t === "dark" || t === "light") return t;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "dark";
  }
}

function applyResolvedTheme(resolvedTheme) {
  if (!hasWindow()) return;
  document.documentElement.dataset.theme = resolvedTheme;
}

export function setTheme(theme) {
  if (!hasWindow()) return;
  const next = ["system", "dark", "light"].includes(theme) ? theme : "system";
  window.localStorage.setItem(LS.theme, next);
  applyResolvedTheme(getResolvedTheme());
  emitSessionUpdate();
}

export function getFontScale() {
  if (!hasWindow()) return 1;
  const raw = window.localStorage.getItem(LS.fontScale);
  return clamp(raw ? Number(raw) : 1, 0.85, 1.35);
}
export function setFontScale(n) {
  if (!hasWindow()) return;
  const next = clamp(n, 0.85, 1.35);
  window.localStorage.setItem(LS.fontScale, String(next));
  document.documentElement.style.setProperty("--elora-font-scale", String(next));
  emitSessionUpdate();
}

/* ---------- Session blob ---------- */
export function getSession() {
  return {
    verified: getVerifiedLocal(),
    verifiedEmail: getVerifiedEmailLocal(),
    role: getRole(),
    guest: getGuest(),
    theme: getTheme(),
    fontScale: getFontScale(),
    teacherCode: getTeacherCode(),
    teacherActive: isTeacher(),
    pendingInvite: hasWindow() ? window.localStorage.getItem(LS.pendingInvite) || "" : "",
  };
}

export function saveSession(s) {
  if (!hasWindow()) return;
  const next = { ...getSession(), ...(s || {}) };

  window.localStorage.setItem(LS.role, String(next.role || "student"));
  window.localStorage.setItem(LS.guest, next.guest ? "true" : "false");
  window.localStorage.setItem(LS.theme, String(next.theme || "system"));
  window.localStorage.setItem(LS.fontScale, String(clamp(next.fontScale ?? 1, 0.85, 1.35)));
  window.localStorage.setItem(LS.teacherCode, String(next.teacherCode || "").trim());
  window.localStorage.setItem(LS.teacherActive, next.teacherActive ? "true" : "false");
  window.localStorage.setItem(LS.pendingInvite, String(next.pendingInvite || "").trim());

  if (next.verified) setVerifiedLocal(next.verifiedEmail || "");
  else clearVerifiedLocal();

  window.localStorage.setItem(LS.blob, JSON.stringify(next));

  applyResolvedTheme(getResolvedTheme());
  document.documentElement.style.setProperty("--elora-font-scale", String(getFontScale()));
  emitSessionUpdate();
}

/* ---------- Logout ---------- */
export async function logout() {
  if (!hasWindow()) return;
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch {
    // ignore
  } finally {
    clearVerifiedLocal();
    window.localStorage.removeItem(LS.teacherActive);
    window.localStorage.removeItem(LS.teacherCode);
    window.localStorage.removeItem(LS.pendingInvite);
    window.localStorage.removeItem(LS.blob);
    emitSessionUpdate();
  }
}

/* ---------- Bootstrap ---------- */
export function hydrateUI() {
  if (!hasWindow()) return;

  applyResolvedTheme(getResolvedTheme());
  document.documentElement.style.setProperty("--elora-font-scale", String(getFontScale()));
  refreshVerifiedFromServer();

  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getTheme() === "system") applyResolvedTheme(getResolvedTheme());
    };
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
  } catch {}
}
