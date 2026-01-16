// lib/chatThreads.js
// Local multi-chat thread storage (Genesis-safe).
// - Stores multiple chats per "identity" (guest vs verified email)
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

function pruneUser(user) {
  // Sort by updatedAt desc
  user.threads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

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
  const firstUser = (messages || []).find((m) => m?.from === "user" && String(m?.text || "").trim());
  const raw = String(firstUser?.text || "").trim();
  if (!raw) return "New chat";

  // Make it short + clean
  let t = raw.replace(/\s+/g, " ");
  if (t.length > 42) t = t.slice(0, 42).trim() + "…";
  return t;
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

  if (!user.threads.length) {
    const id = makeId();
    user.threads = [
      {
        id,
        title: "New chat",
        createdAt: now(),
        updatedAt: now(),
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
  pruneUser(user);
  saveAll(store);

  return user.threads.map((t) => ({
    id: t.id,
    title: String(t.title || "New chat"),
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

  const id = makeId();
  const thread = {
    id,
    title: "New chat",
    createdAt: now(),
    updatedAt: now(),
    messages: [],
  };

  user.threads.unshift(thread);
  user.activeId = id;

  pruneUser(user);
  saveAll(store);

  return { id };
}

export function getThreadMessages(userKey, threadId) {
  const store = loadAll();
  const user = ensureUser(store, userKey);
  const t = user.threads.find((x) => x.id === threadId) || user.threads.find((x) => x.id === user.activeId);

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

  let t = user.threads.find((x) => x.id === threadId);
  if (!t) {
    // if missing, create it
    const id = threadId || makeId();
    t = { id, title: "New chat", createdAt: now(), updatedAt: now(), messages: [] };
    user.threads.unshift(t);
    user.activeId = id;
  }

  const msgs = normalizeMessages(messages);
  t.messages = msgs;
  t.updatedAt = now();

  // Auto-title when we get first meaningful user message
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

  user.threads = user.threads.filter((t) => t.id !== threadId);
  if (!user.threads.length) {
    const id = makeId();
    user.threads = [{ id, title: "New chat", createdAt: now(), updatedAt: now(), messages: [] }];
    user.activeId = id;
  }

  pruneUser(user);
  saveAll(store);
}
