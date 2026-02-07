// lib/session.js
// Client-side cache for UI preferences + a snapshot of server-backed session state.

const STORAGE_PRIMARY = "elora_session_v1";
const STORAGE_LEGACY = "elora_session";
const PREF_THEME_KEY = "elora_theme";
const PREF_SCALE_KEY = "elora_fontScale";

const LEGACY_ROLE_KEY = "elora_role";
const LEGACY_GUEST_KEY = "elora_guest";
const LEGACY_VERIFIED_KEY = "elora_verified";

const SESSION_CHANNEL = typeof window !== "undefined" ? new BroadcastChannel("elora_session_sync") : null;

const DEFAULTS = {
  verified: false,
  email: "",
  teacher: false,
  hasSession: false,
  guest: false,
  role: "student",
  theme: "system",
  fontScale: 1,
  country: "Singapore",
  level: "Primary 1",
  subject: "math",
  topicMode: "fixed",
  topicFixed: "Fractions",
  topicCustom: "",
  task: "tutor",
  style: "clear",
  messages: [],
  teacherCode: "",
  usage: {
    messagesSent: 0,
    activeMinutes: 0,
    streak: 0,
    lastActive: null,
    subjects: [],
  },
  studentCode: null,
  linkedStudentId: null,
  linkedStudents: [],
  classroom: {
    name: "My Classroom",
    totalEngagement: 0,
    classes: [],
    assignments: [], // NEW: Persistent assignments
    submissions: [], // NEW: Persistent student work
    teacherRules: "", // NEW: Customizable AI logic
    resources: [], // Teacher-shared resources
    quizzes: [], // Teacher-created quizzes
  },
  joinedClasses: [], // NEW: Multi-class support for students (array of class objects)
};

if (SESSION_CHANNEL) {
  SESSION_CHANNEL.onmessage = (event) => {
    if (event.data === "sync") {
      emit(false); // don't re-broadcast
    }
  };
}

function safeParseJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function emit(broadcast = true) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("elora:session"));
  if (broadcast && SESSION_CHANNEL) {
    SESSION_CHANNEL.postMessage("sync");
  }
}

function writeLegacyPrefs(theme, fontScale) {
  if (typeof window === "undefined") return;
  try {
    if (theme) window.localStorage.setItem(PREF_THEME_KEY, theme);
    if (typeof fontScale === "number") window.localStorage.setItem(PREF_SCALE_KEY, String(fontScale));
  } catch { }
}

function writeLegacyGuestAndRole(session) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEGACY_GUEST_KEY, session.guest ? "true" : "false");
    window.localStorage.setItem(LEGACY_ROLE_KEY, String(session.role || "student"));
    window.localStorage.setItem(LEGACY_VERIFIED_KEY, session.verified ? "true" : "false");
  } catch { }
}

import { DEMO_SCENARIO } from "./demo-data";

export function seedDemoData() {
  if (typeof window === "undefined") return;
  
  // Create a unified session state that contains data for ALL roles
  const unifiedSession = {
    ...DEFAULTS,
    hasSession: true,
    verified: true,
    
    // Teacher Data
    classroom: {
      ...DEFAULTS.classroom,
      ...DEMO_SCENARIO.teacher.classroom
    },
    
    // Student Data
    joinedClasses: DEMO_SCENARIO.student.joinedClasses,
    usage: DEMO_SCENARIO.student.usage,
    
    // Parent Data
    linkedStudents: DEMO_SCENARIO.parent.linkedStudents,
    
    // Default starting state
    role: "student", 
    name: "Alex" // Default name
  };
  
  saveSession(unifiedSession);
  return unifiedSession;
}

export function getSession() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  const rawPrimary = window.localStorage.getItem(STORAGE_PRIMARY);
  const rawLegacy = window.localStorage.getItem(STORAGE_LEGACY);
  const parsed = safeParseJSON(rawPrimary) || safeParseJSON(rawLegacy) || null;

  return {
    ...DEFAULTS,
    ...(parsed || {}),
    usage: { ...DEFAULTS.usage, ...(parsed?.usage || {}) },
    classroom: { ...DEFAULTS.classroom, ...(parsed?.classroom || {}) },
    linkedStudents: Array.isArray(parsed?.linkedStudents) ? parsed.linkedStudents : DEFAULTS.linkedStudents,
    joinedClasses: Array.isArray(parsed?.joinedClasses) ? parsed.joinedClasses : DEFAULTS.joinedClasses
  };
}

export function saveSession(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PRIMARY, JSON.stringify(next));
    window.localStorage.setItem(STORAGE_LEGACY, JSON.stringify(next));
  } catch { }

  applyTheme(next.theme);
  applyFontScale(next.fontScale);
  writeLegacyPrefs(next.theme, next.fontScale);
  writeLegacyGuestAndRole(next);
  emit(true);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_PRIMARY);
    window.localStorage.removeItem(STORAGE_LEGACY);
  } catch { }
  const s = getSession();
  applyTheme(s.theme);
  applyFontScale(s.fontScale);
  emit(true);
}

export function hasSession() {
  const s = getSession();
  return Boolean(s?.hasSession || s?.verified || s?.teacher);
}

export function setRole(role) {
  const s = getSession();
  s.role = String(role || "student");
  saveSession(s);
}

export function setRoleAndResetAssistant(role) {
  const s = getSession();
  s.role = String(role || "student");
  s.messages = [];
  s.topicCustom = "";
  s.topicMode = "fixed";
  s.task = "tutor";
  s.style = "clear";
  if (s.role === "educator") s.guest = false;
  saveSession(s);
}

export function setGuest(on = true) {
  const s = getSession();
  s.guest = Boolean(on);
  if (s.guest && (!s.role || s.role === "educator")) s.role = "student";
  saveSession(s);
}

export function setTheme(theme) {
  const s = getSession();
  s.theme = String(theme || "system");
  saveSession(s);
}

export function setFontScale(scale) {
  const clamped = Math.max(0.85, Math.min(1.4, Number(scale) || 1));
  const s = getSession();
  s.fontScale = clamped;
  saveSession(s);
}

export function setTeacher(on) {
  const s = getSession();
  s.teacher = Boolean(on);
  s.hasSession = Boolean(s.hasSession || s.teacher || s.verified);
  saveSession(s);
}

export function setTeacherCode(code) {
  const s = getSession();
  s.teacherCode = String(code || "");
  saveSession(s);
}

export function isTeacher() { return Boolean(getSession().teacher); }
export function isVerified() { return Boolean(getSession().verified); }

export function applyFontScale(scale = 1) {
  if (typeof document === "undefined") return;
  const clamped = Math.max(0.85, Math.min(1.4, Number(scale) || 1));
  document.documentElement.style.setProperty("--elora-font-scale", String(clamped));
}

export function applyTheme(theme = "system") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  if (typeof window !== "undefined") {
    const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }
}

export function getResolvedTheme() {
  const s = getSession();
  const t = String(s?.theme || "system");
  if (t !== "system") return t;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function hydrateUI() {
  const s = getSession();
  applyTheme(s.theme);
  applyFontScale(s.fontScale);
}

export async function refreshVerifiedFromServer() {
  try {
    const r = await fetch("/api/session/status", { cache: "no-store" });
    const data = await r.json().catch(() => null);
    const verified = Boolean(data?.verified);
    const email = String(data?.email || "");
    const teacher = Boolean(data?.teacher);
    const hasSessionFlag = Boolean(data?.hasSession || verified || teacher);
    const s = getSession();
    s.verified = verified;
    s.email = email;
    s.teacher = teacher;
    s.hasSession = hasSessionFlag;
    saveSession(s);
    return { verified, email, teacher, hasSession: hasSessionFlag };
  } catch {
    return { verified: false, email: "", teacher: false, hasSession: false };
  }
}

export async function activateTeacher(codeOrList) {
  const codes = String(codeOrList || "").split(",").map(c => c.trim()).filter(Boolean);
  if (!codes.length) return { ok: false, error: "missing_code" };
  for (const code of codes) {
    try {
      const r = await fetch("/api/teacher/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json().catch(() => null);
      if (r.ok && data?.ok) {
        setTeacher(true);
        setTeacherCode(code);
        return { ok: true };
      }
    } catch { }
  }
  return { ok: false, error: "invalid_invite" };
}

export async function clearTeacher() {
  try { await fetch("/api/teacher/clear", { method: "POST" }); } catch { }
  setTeacher(false);
  setTeacherCode("");
}

export async function logout() {
  try { await fetch("/api/session/clear", { method: "POST" }); } catch { }
  try { await fetch("/api/teacher/clear", { method: "POST" }); } catch { }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_PRIMARY);
      window.localStorage.removeItem(STORAGE_LEGACY);
    } catch { }
  }
  hydrateUI();
  emit(true);
}
