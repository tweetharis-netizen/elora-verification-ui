// lib/chatThreads.js
// Local multi-chat thread storage (Genesis-safe).
//
// Goals:
// - Multi-chat threads per "identity" (guest vs verified email)
// - Pin + rename + delete support
// - Fast + safe (pruning, message caps)
// - SSR-safe
//
// IMPORTANT POLICY (per your requirement):
// - Verified users persist threads in localStorage (saved across browser restarts).
// - Guest preview uses sessionStorage (so it "remembers" while browsing + refresh, but NOT after closing the tab/browser).
//
// API exported is aligned to the newest pages/assistant.js imports:
// - getChatUserKey
// - ensureThreadsForUser
// - listThreads
// - getActiveThreadId
// - setActiveThreadId
// - createThread
// - deleteThread
// - renameThread
// - togglePinThread
// - getThreadMeta
// - getThreadMessages
// - upsertThreadMessages
// - clearThread

const STORAGE_KEY = "elora_chat_threads_v2";
const LEGACY_KEY = "elora_chat_threads_v1";
const VERSION = 2;

const MAX_THREADS = 20;
const MAX_MESSAGES_PER_THREAD = 80;
const MAX_TEXT_CHARS = 8000;

function hasWindow() {
  return typeof window !== "undefined";
}

function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function now() {
  return Date.now();
}

function makeId() {
  return `c_${now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampText(v) {
  const s = String(v || "");
  if (s.length <= MAX_TEXT_CHARS) return s;
  return s.slice(0, MAX_TEXT_CHARS);
}

function normalizeMessage(m) {
  const from = m?.from === "elora" ? "elora" : "user";
  const text = clampText(m?.text || "");
  const ts = typeof m?.ts === "number" ? m.ts : now();
  return { from, text, ts };
}

function normalizeMessages(list) {
  const arr = Array.isArray(list) ? list : [];
  const out = arr.map(normalizeMessage);

  if (out.length > MAX_MESSAGES_PER_THREAD) {
    return out.slice(out.length - MAX_MESSAGES_PER_THREAD);
  }
  return out;
}

function defaultStore() {
  return { v: VERSION, users: {} };
}

function isVerifiedKey(userKey) {
  return String(userKey || "").startsWith("v:");
}

function getStorage(userKey) {
  if (!hasWindow()) return null;

  // Verified -> localStorage
  // Guest -> sessionStorage
  try {
    if (isVerifiedKey(userKey)) {
      if (typeof window.localStorage !== "undefined") return window.localStorage;
      if (typeof window.sessionStorage !== "undefined") return window.sessionStorage;
      return null;
    }

    if (typeof window.sessionStorage !== "undefined") return window.sessionStorage;
    if (typeof window.localStorage !== "undefined") return window.localStorage;
    return null;
  } catch {
    return null;
  }
}

function loadAll(userKey) {
  const storage = getStorage(userKey);
  if (!storage) return defaultStore();

  // Migrate legacy localStorage store for verified users only.
  // (Guest uses sessionStorage so legacy doesn't matter.)
  if (isVerifiedKey(userKey)) {
    try {
      const rawV2 = storage.getItem(STORAGE_KEY);
      const parsedV2 = safeParseJSON(rawV2);
      if (parsedV2 && parsedV2.users && typeof parsedV2.users === "object") {
        return { v: VERSION, users: parsedV2.users };
      }

      // Try legacy key
      const legacyRaw = storage.getItem(LEGACY_KEY);
      const legacy = safeParseJSON(legacyRaw);
      if (legacy && legacy.users && typeof legacy.users === "object") {
        const migrated = { v: VERSION, users: legacy.users };
        storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch {
      return defaultStore();
    }
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = safeParseJSON(raw);
    if (!parsed || typeof parsed !== "object") return defaultStore();
    if (!parsed.users || typeof parsed.users !== "object") return defaultStore();
    return { v: VERSION, users: parsed.users };
  } catch {
    return defaultStore();
  }
}

function saveAll(userKey, store) {
  const storage = getStorage(userKey);
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / privacy mode failures
  }
}

function ensureUser(store, userKey) {
  const key = String(userKey || "guest");
  if (!store.users[key]) {
    store.users[key] = { activeId: "", threads: [] };
  }
  if (!Array.isArray(store.users[key].threads)) {
    store.users[key].threads = [];
  }
  if (typeof store.users[key].activeId !== "string") {
    store.users[key].activeId = "";
  }
  return store.users[key];
}

function sortThreads(threads) {
  // pinned first, then updatedAt desc
  threads.sort((a, b) => {
    const ap = a?.pinned ? 1 : 0;
    const bp = b?.pinned ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return (b?.updatedAt || 0) - (a?.updatedAt || 0);
  });
}

function pruneUser(user) {
  sortThreads(user.threads);

  if (user.threads.length > MAX_THREADS) {
    user.threads = user.threads.slice(0, MAX_THREADS);
  }

  // Ensure activeId exists
  const ids = new Set(user.threads.map((t) => t.id));
  if (!user.activeId || !ids.has(user.activeId)) {
    user.activeId = user.threads[0]?.id || "";
  }
}

function buildTitleFromMessages(messages) {
  const firstUser = (messages || []).find(
    (m) => m?.from === "user" && String(m?.text || "").trim()
  );
  const raw = String(firstUser?.text || "").trim();
  if (!raw) return "New chat";

  let t = raw.replace(/\s+/g, " ");
  if (t.length > 42) t = t.slice(0, 42).trim() + "…";
  return t;
}

function normalizeThread(t) {
  const id = String(t?.id || "").trim() || makeId();
  const title = String(t?.title || "").trim() || "New chat";
  const createdAt = typeof t?.createdAt === "number" ? t.createdAt : now();
  const updatedAt = typeof t?.updatedAt === "number" ? t.updatedAt : createdAt;
  const pinned = Boolean(t?.pinned);
  const messages = normalizeMessages(t?.messages || []);
  return { id, title, createdAt, updatedAt, pinned, messages };
}

/**
 * Identity key:
 * - verified: "v:<email>"
 * - guest: "guest"
 */
export function getChatUserKey(session) {
  const verified = Boolean(session?.verified);
  const email = String(session?.email || "").trim().toLowerCase();
  if (verified && email) return `v:${email}`;
  return "guest";
}

/**
 * Ensure user has at least 1 thread, and an activeId.
 * Returns { activeId, threads } store for that user.
 */
export function ensureThreadsForUser(userKey) {
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);

  user.threads = (user.threads || []).map(normalizeThread);

  if (!user.threads.length) {
    const id = makeId();
    user.threads = [
      {
        id,
        title: "New chat",
        createdAt: now(),
        updatedAt: now(),
        pinned: false,
        messages: [],
      },
    ];
    user.activeId = id;
  }

  pruneUser(user);
  saveAll(userKey, store);
  return { activeId: user.activeId, threads: user.threads };
}

export function listThreads(userKey) {
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  pruneUser(user);
  saveAll(userKey, store);

  return user.threads.map((t) => ({
    id: t.id,
    title: String(t.title || "New chat"),
    pinned: Boolean(t.pinned),
    updatedAt: typeof t.updatedAt === "number" ? t.updatedAt : 0,
  }));
}

export function getActiveThreadId(userKey) {
  const { activeId } = ensureThreadsForUser(userKey);
  return activeId;
}

export function setActiveThreadId(userKey, id) {
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const exists = user.threads.some((t) => t.id === id);
  if (!exists) return getActiveThreadId(userKey);

  user.activeId = id;
  pruneUser(user);
  saveAll(userKey, store);
  return user.activeId;
}

export function createThread(userKey) {
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const id = makeId();
  const thread = {
    id,
    title: "New chat",
    createdAt: now(),
    updatedAt: now(),
    pinned: false,
    messages: [],
  };

  user.threads.unshift(thread);
  user.activeId = id;

  pruneUser(user);
  saveAll(userKey, store);

  return { id };
}

export function getThreadMeta(userKey, threadId) {
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const t =
    user.threads.find((x) => x.id === threadId) ||
    user.threads.find((x) => x.id === user.activeId);

  if (!t) return { id: "", title: "New chat", pinned: false, updatedAt: 0 };
  return {
    id: t.id,
    title: String(t.title || "New chat"),
    pinned: Boolean(t.pinned),
    updatedAt: typeof t.updatedAt === "number" ? t.updatedAt : 0,
  };
}

export function getThreadMessages(userKey, threadId) {
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const t =
    user.threads.find((x) => x.id === threadId) ||
    user.threads.find((x) => x.id === user.activeId);

  const msgs = normalizeMessages(t?.messages || []);

  // write back normalization if needed
  if (t && JSON.stringify(t.messages || []) !== JSON.stringify(msgs)) {
    t.messages = msgs;
    t.updatedAt = now();
    if (!t.title || t.title === "New chat") t.title = buildTitleFromMessages(msgs);
    pruneUser(user);
    saveAll(userKey, store);
  }

  return msgs;
}

export function upsertThreadMessages(userKey, threadId, messages) {
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  let t = user.threads.find((x) => x.id === threadId);
  if (!t) {
    const id = String(threadId || "").trim() || makeId();
    t = {
      id,
      title: "New chat",
      createdAt: now(),
      updatedAt: now(),
      pinned: false,
      messages: [],
    };
    user.threads.unshift(t);
    user.activeId = id;
  }

  const msgs = normalizeMessages(messages);
  t.messages = msgs;
  t.updatedAt = now();

  // Auto-title when we get first meaningful user message (only if still default)
  if (!t.title || t.title === "New chat") {
    t.title = buildTitleFromMessages(msgs);
  }

  user.activeId = t.id;

  pruneUser(user);
  saveAll(userKey, store);

  return { activeId: user.activeId };
}

export function clearThread(userKey, threadId) {
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const t = user.threads.find((x) => x.id === threadId);
  if (!t) return;

  t.messages = [];
  t.title = "New chat";
  t.updatedAt = now();

  user.activeId = t.id;

  pruneUser(user);
  saveAll(userKey, store);
}

export function deleteThread(userKey, threadId) {
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const before = user.threads.length;
  user.threads = user.threads.filter((t) => t.id !== threadId);

  if (!user.threads.length) {
    const id = makeId();
    user.threads = [
      { id, title: "New chat", createdAt: now(), updatedAt: now(), pinned: false, messages: [] },
    ];
    user.activeId = id;
  }

  pruneUser(user);
  saveAll(userKey, store);
  return user.threads.length !== before;
}

export function renameThread(userKey, threadId, newTitle) {
  const title = String(newTitle || "").replace(/\s+/g, " ").trim();
  const safe = title ? title.slice(0, 60) : "New chat";

  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const t = user.threads.find((x) => x.id === threadId);
  if (!t) return;

  t.title = safe;
  t.updatedAt = now();

  pruneUser(user);
  saveAll(userKey, store);
}

export function togglePinThread(userKey, threadId) {
  const store = loadAll(userKey);
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const t = user.threads.find((x) => x.id === threadId);
  if (!t) return false;

  t.pinned = !t.pinned;
  t.updatedAt = now();

  pruneUser(user);
  saveAll(userKey, store);
  return Boolean(t.pinned);
}
