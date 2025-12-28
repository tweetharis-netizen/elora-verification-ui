// lib/session.js
// central session + preference store

export function getSession() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('elora_session')) || {};
  } catch {
    return {};
  }
}

export function saveSession(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('elora_session', JSON.stringify(data));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('elora_session');
}

// helpers
export function getTheme() {
  const s = getSession();
  return s.themeMode || 'system';
}

export function setTheme(mode) {
  const s = getSession();
  s.themeMode = mode;
  saveSession(s);
}

export function getLearningPrefs() {
  const s = getSession();
  return (
    s.learningPrefs || {
      mode: 'guided',
      hintStyle: 'gentle',
      attemptsBeforeReveal: 3,
    }
  );
}

export function setLearningPrefs(prefs) {
  const s = getSession();
  s.learningPrefs = prefs;
  saveSession(s);
}

export function isTeacher() {
  const s = getSession();
  return !!s.teacher;
}

export function activateTeacher(inviteCode) {
  const s = getSession();
  s.teacher = true;
  s.teacherCode = inviteCode;
  saveSession(s);
}

export function getFontScale() {
  const s = getSession();
  return s.fontScale || 1;
}

export function setFontScale(scale) {
  const s = getSession();
  s.fontScale = scale;
  saveSession(s);
}
