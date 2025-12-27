export const STORAGE = {
  theme: "elora-theme",
  role: "elora_role",
  guest: "elora_guest",
  verified: "elora_verified",
  teacherInvite: "elora_teacher_invite" // stores the invite code (string)
};

export function getStored(key, fallback = "") {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function setStored(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

export function getSession() {
  const role = getStored(STORAGE.role, "");
  const guest = getStored(STORAGE.guest, "0") === "1";
  const verified = getStored(STORAGE.verified, "0") === "1";
  const teacherInvite = getStored(STORAGE.teacherInvite, "") || "";
  return { role, guest, verified, teacherInvite };
}

export function setRole(role) {
  setStored(STORAGE.role, role);
}

export function setGuest(isGuest) {
  setStored(STORAGE.guest, isGuest ? "1" : "0");
}

export function setVerified(isVerified) {
  setStored(STORAGE.verified, isVerified ? "1" : "0");
}

export function setTeacherInvite(code) {
  const v = (code || "").toString().trim();
  setStored(STORAGE.teacherInvite, v);
}

export function clearTeacherInvite() {
  setStored(STORAGE.teacherInvite, "");
}
