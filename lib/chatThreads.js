// lib/chatThreads.js
// Local multi-chat thread storage (Genesis-safe).
// - Stores multiple chats per "identity" (guest vs verified email)
// - Supports pin + rename
// - Keeps UI fast by pruning oldest chats/messages
// - SSR-safe: no window access unless it exists

const STORAGE_KEY = "elora_chat_threads_v1";
const VERSION = 1;

const MAX_THREADS = 20;
const MAX_MESSAGES_PER_THREAD = 80;
const MAX_TEXT_CHARS = 8000;

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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

  // prune to last N messages
  if (out.length > MAX_MESSAGES_PER_THREAD) {
    return out.slice(out.length - MAX_MESSAGES_PER_THREAD);
  }
  return out;
}

function defaultStore() {
  return { v: VERSION, users: {} };
}

function loadAll() {
  if (!hasWindow()) return defaultStore();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = safeParseJSON(raw);
  if (!parsed || typeof parsed !== "object") return defaultStore();
  if (!parsed.users || typeof parsed.users !== "object") return defaultStore();
  return { v: VERSION, users: parsed.users };
}

function saveAll(store) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

function ensureUser(store, userKey) {
  if (!store.users[userKey]) {
    store.users[userKey] = { activeId: "", threads: [] };
  }
  if (!Array.isArray(store.users[userKey].threads)) {
    store.users[userKey].threads = [];
  }
  if (typeof store.users[userKey].activeId !== "string") {
    store.users[userKey].activeId = "";
  }
  return store.users[userKey];
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

  // Prune threads
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
  // Find first real user text
  const firstUser = (messages || []).find(
    (m) => m?.from === "user" && String(m?.text || "").trim()
  );
  const raw = String(firstUser?.text || "").trim();
  if (!raw) return "New chat";

  // Make it short + clean
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
  const store = loadAll();
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
  saveAll(store);
  return { activeId: user.activeId, threads: user.threads };
}

export function listThreads(userKey) {
  const store = loadAll();
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  pruneUser(user);
  saveAll(store);

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
  const store = loadAll();
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const exists = user.threads.some((t) => t.id === id);
  if (!exists) return getActiveThreadId(userKey);

  user.activeId = id;
  pruneUser(user);
  saveAll(store);
  return user.activeId;
}

export function createThread(userKey) {
  const store = loadAll();
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
  saveAll(store);

  return { id };
}

export function getThreadMeta(userKey, threadId) {
  const store = loadAll();
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
  const store = loadAll();
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
    saveAll(store);
  }

  return msgs;
}

export function upsertThreadMessages(userKey, threadId, messages) {
  const store = loadAll();
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
  saveAll(store);

  return { activeId: user.activeId };
}

export function clearThread(userKey, threadId) {
  const store = loadAll();
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const t = user.threads.find((x) => x.id === threadId);
  if (!t) return;

  t.messages = [];
  t.title = "New chat";
  t.updatedAt = now();

  user.activeId = t.id;

  pruneUser(user);
  saveAll(store);
}

export function deleteThread(userKey, threadId) {
  const store = loadAll();
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  user.threads = user.threads.filter((t) => t.id !== threadId);

  if (!user.threads.length) {
    const id = makeId();
    user.threads = [
      { id, title: "New chat", createdAt: now(), updatedAt: now(), pinned: false, messages: [] },
    ];
    user.activeId = id;
  }

  pruneUser(user);
  saveAll(store);
}

export function renameThread(userKey, threadId, newTitle) {
  const title = String(newTitle || "").replace(/\s+/g, " ").trim();

  // Keep it clean and short
  const safe = title ? title.slice(0, 60) : "New chat";

  const store = loadAll();
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const t = user.threads.find((x) => x.id === threadId);
  if (!t) return;

  t.title = safe;
  t.updatedAt = now();

  pruneUser(user);
  saveAll(store);
}

export function togglePinThread(userKey, threadId) {
  const store = loadAll();
  const user = ensureUser(store, userKey);
  user.threads = (user.threads || []).map(normalizeThread);

  const t = user.threads.find((x) => x.id === threadId);
  if (!t) return false;

  t.pinned = !t.pinned;
  t.updatedAt = now();

  pruneUser(user);
  saveAll(store);
  return Boolean(t.pinned);
}
