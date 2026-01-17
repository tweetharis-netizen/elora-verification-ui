// lib/chatThreads.js
// Local multi-chat thread storage (Genesis-safe).
// - Stores multiple chats per "identity" (guest vs verified email)
// - Supports pin + rename + delete
// - Keeps UI fast by pruning oldest chats/messages
// - SSR-safe: no window access unless it exists
//
// IMPORTANT:
// - Verified users (v:<email>) persist in localStorage.
// - Guest/preview users persist in sessionStorage (so refresh works, but closing the browser resets preview).

const STORAGE_KEY = "elora_chat_threads_v2";

const MAX_THREADS_PER_USER = 20;
const MAX_MESSAGES_PER_THREAD = 80;
const MAX_TEXT_CHARS = 8000;

function hasWindow() {
  return typeof window !== "undefined";
}

function getStorageForUserKey(userKey) {
  if (!hasWindow()) return null;
  const key = String(userKey || "");
  try {
    // Verified users should persist across browser restarts.
    if (key.startsWith("v:") && typeof window.localStorage !== "undefined") return window.localStorage;

    // Guest/preview users should NOT persist across browser restarts.
    if (typeof window.sessionStorage !== "undefined") return window.sessionStorage;

    // Fallback (rare environments)
    if (typeof window.localStorage !== "undefined") return window.localStorage;
  } catch {
    // Access can throw in some privacy modes. In that case, we just act "stateless".
  }
  return null;
}

function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function clampStr(v, max = MAX_TEXT_CHARS) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function nowISO() {
  return new Date().toISOString();
}

function defaultStore() {
  return { users: {} };
}

function loadAll(userKey) {
  const storage = getStorageForUserKey(userKey);
  if (!storage) return defaultStore();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = safeParseJSON(raw);
    if (parsed && typeof parsed === "object" && parsed.users && typeof parsed.users === "object") return parsed;
    return defaultStore();
  } catch {
    return defaultStore();
  }
}

function saveAll(userKey, store) {
  const storage = getStorageForUserKey(userKey);
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / privacy errors
  }
}

function ensureUser(store, userKey) {
  const key = String(userKey || "guest");
  if (!store.users[key]) store.users[key] = { threads: {}, order: [] };
  if (!store.users[key].threads) store.users[key].threads = {};
  if (!Array.isArray(store.users[key].order)) store.users[key].order = [];
  return store.users[key];
}

function pruneForUser(user) {
  // Keep order unique and valid
  user.order = user.order.filter((id, i, arr) => arr.indexOf(id) === i && user.threads[id]);

  // Enforce max threads
  while (user.order.length > MAX_THREADS_PER_USER) {
    const oldest = user.order[user.order.length - 1];
    delete user.threads[oldest];
    user.order.pop();
  }

  // For each thread: cap messages
  for (const id of Object.keys(user.threads)) {
    const t = user.threads[id];
    if (!Array.isArray(t.messages)) t.messages = [];
    if (t.messages.length > MAX_MESSAGES_PER_THREAD) {
      t.messages = t.messages.slice(-MAX_MESSAGES_PER_THREAD);
    }
  }
}

function bumpThreadToTop(user, threadId) {
  user.order = [threadId, ...user.order.filter((id) => id !== threadId)];
}

function createThreadInternal(user, title = "New chat") {
  const id = `t_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  const thread = {
    id,
    title: clampStr(title, 60) || "New chat",
    pinned: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    messages: [],
  };
  user.threads[id] = thread;
  bumpThreadToTop(user, id);
  return thread;
}

export function getChatUserKey(session) {
  // Verified email becomes a stable identity key.
  // Guest preview is intentionally not stable across browser restarts (sessionStorage).
  const verified = Boolean(session?.verified);
  const email = String(session?.email || "").trim().toLowerCase();
  if (verified && email) return `v:${email}`;
  return "guest";
}

export function ensureThreadsForUser(userKey) {
  if (!hasWindow()) return { id: "t_boot", title: "New chat", pinned: false, messages: [] };

  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);

  // If no threads, create a default one.
  if (!user.order.length) {
    createThreadInternal(user, "New chat");
  }

  pruneForUser(user);
  saveAll(userKey, store);

  const firstId = user.order[0];
  return user.threads[firstId];
}

export function listThreads(userKey) {
  if (!hasWindow()) return [];
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);

  pruneForUser(user);
  saveAll(userKey, store);

  return user.order
    .map((id) => user.threads[id])
    .filter(Boolean)
    .map((t) => ({
      id: t.id,
      title: t.title || "New chat",
      pinned: Boolean(t.pinned),
      updatedAt: t.updatedAt || t.createdAt,
    }));
}

export function createThread(userKey, title = "New chat") {
  if (!hasWindow()) return { id: "t_boot", title: "New chat", pinned: false, messages: [] };

  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);

  const t = createThreadInternal(user, title);

  pruneForUser(user);
  saveAll(userKey, store);
  return t;
}

export function deleteThread(userKey, threadId) {
  if (!hasWindow()) return false;
  const id = String(threadId || "");
  if (!id) return false;

  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);

  if (!user.threads[id]) return false;

  delete user.threads[id];
  user.order = user.order.filter((x) => x !== id);

  // If that was the last thread, recreate a fresh one.
  if (!user.order.length) {
    createThreadInternal(user, "New chat");
  }

  pruneForUser(user);
  saveAll(userKey, store);
  return true;
}

export function renameThread(userKey, threadId, title) {
  if (!hasWindow()) return false;
  const id = String(threadId || "");
  if (!id) return false;

  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);

  const t = user.threads[id];
  if (!t) return false;

  t.title = clampStr(title, 60) || "New chat";
  t.updatedAt = nowISO();

  pruneForUser(user);
  saveAll(userKey, store);
  return true;
}

export function togglePinThread(userKey, threadId) {
  if (!hasWindow()) return false;
  const id = String(threadId || "");
  if (!id) return false;

  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);

  const t = user.threads[id];
  if (!t) return false;

  t.pinned = !t.pinned;
  t.updatedAt = nowISO();

  // Keep pinned threads near top (still respects recency within pinned/recent)
  bumpThreadToTop(user, id);

  pruneForUser(user);
  saveAll(userKey, store);
  return true;
}

export function getThread(userKey, threadId) {
  if (!hasWindow()) return null;
  const id = String(threadId || "");
  if (!id) return null;

  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);

  const t = user.threads[id];
  if (!t) return null;

  return {
    id: t.id,
    title: t.title || "New chat",
    pinned: Boolean(t.pinned),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt || t.createdAt,
    messages: Array.isArray(t.messages) ? t.messages : [],
  };
}

export function setActiveThread(userKey, threadId) {
  if (!hasWindow()) return null;
  const id = String(threadId || "");
  if (!id) return null;

  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);

  const t = user.threads[id];
  if (!t) return null;

  bumpThreadToTop(user, id);
  t.updatedAt = nowISO();

  pruneForUser(user);
  saveAll(userKey, store);

  return getThread(userKey, id);
}

export function saveThreadMessages(userKey, threadId, messages) {
  if (!hasWindow()) return false;
  const id = String(threadId || "");
  if (!id) return false;

  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);

  const t = user.threads[id];
  if (!t) return false;

  const safeMessages = Array.isArray(messages)
    ? messages
        .map((m) => ({
          from: m?.from === "user" ? "user" : "elora",
          text: clampStr(String(m?.text || ""), MAX_TEXT_CHARS),
        }))
        .filter((m) => m.text)
    : [];

  t.messages = safeMessages.slice(-MAX_MESSAGES_PER_THREAD);
  t.updatedAt = nowISO();

  bumpThreadToTop(user, id);

  pruneForUser(user);
  saveAll(userKey, store);
  return true;
}
EOF"]}
