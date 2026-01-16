// lib/chatThreads.js
// Local (browser) multi-chat threads for the Assistant page.
// Genesis-safe: no backend dependency, no new serverless functions.
//
// Design goals:
// - Multiple chats like ChatGPT (New chat + switch)
// - Persist across refresh/browser close
// - Separate guest chats from verified chats (Option A)
// - Defensive + SSR-safe

const STORAGE_PREFIX = "elora_chat_threads_v1:";
const MAX_THREADS = 20;
const MAX_MESSAGES_PER_THREAD = 80;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Tiny FNV-1a hash to avoid storing raw email in storage keys
function fnv1a(str) {
  const s = String(str || "");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // h *= 16777619 (with 32-bit overflow)
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function storageKey(userKey) {
  return `${STORAGE_PREFIX}${fnv1a(userKey || "guest")}`;
}

function randomId() {
  // Prefer crypto, fall back to Math.random
  try {
    if (isBrowser() && window.crypto && window.crypto.getRandomValues) {
      const a = new Uint32Array(3);
      window.crypto.getRandomValues(a);
      return `c_${a[0].toString(16)}${a[1].toString(16)}${a[2].toString(16)}_${Date.now().toString(16)}`;
    }
  } catch {}
  return `c_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clampStr(v, max = 120) {
  const s = String(v || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

export function deriveThreadTitleFromText(text) {
  const t = clampStr(text, 56);
  if (!t) return "New chat";
  // Remove some common boilerplate prefixes
  const cleaned = t
    .replace(/^check\s+my\s+answer[:\-]\s*/i, "")
    .replace(/^can\s+you\s+/i, "")
    .replace(/^please\s+/i, "");
  return cleaned ? clampStr(cleaned, 56) : "New chat";
}

function normalizeStore(store) {
  const now = Date.now();
  const threads = Array.isArray(store?.threads) ? store.threads : [];
  const cleanedThreads = threads
    .map((t) => {
      const id = String(t?.id || "").trim() || randomId();
      const title = String(t?.title || "").trim() || "New chat";
      const createdAt = Number(t?.createdAt) || now;
      const updatedAt = Number(t?.updatedAt) || createdAt;
      const messages = Array.isArray(t?.messages) ? t.messages.slice(-MAX_MESSAGES_PER_THREAD) : [];
      return { id, title, createdAt, updatedAt, messages };
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, MAX_THREADS);

  let activeId = String(store?.activeId || "").trim();
  if (!activeId || !cleanedThreads.some((t) => t.id === activeId)) {
    activeId = cleanedThreads[0]?.id || "";
  }

  // Ensure at least 1 thread exists
  if (!cleanedThreads.length) {
    const id = randomId();
    return {
      activeId: id,
      threads: [
        {
          id,
          title: "New chat",
          createdAt: now,
          updatedAt: now,
          messages: [],
        },
      ],
    };
  }

  return { activeId, threads: cleanedThreads };
}

export function loadThreadsStore(userKey) {
  if (!isBrowser()) {
    // SSR-safe default
    return { activeId: "", threads: [] };
  }

  const key = storageKey(userKey);
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? safeParseJSON(raw) : null;
  const normalized = normalizeStore(parsed || {});

  // Ensure it exists on disk in normalized form
  try {
    window.localStorage.setItem(key, JSON.stringify(normalized));
  } catch {}

  return normalized;
}

export function saveThreadsStore(userKey, store) {
  if (!isBrowser()) return normalizeStore(store);
  const key = storageKey(userKey);
  const normalized = normalizeStore(store);
  try {
    window.localStorage.setItem(key, JSON.stringify(normalized));
  } catch {}
  return normalized;
}

export function getThreadById(store, id) {
  const threads = Array.isArray(store?.threads) ? store.threads : [];
  const needle = String(id || "").trim();
  if (!needle) return null;
  return threads.find((t) => t.id === needle) || null;
}

export function getThreadOptions(store) {
  const threads = Array.isArray(store?.threads) ? store.threads : [];
  // Newest first; title fallback handled in normalize
  return threads
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .map((t) => ({ id: t.id, title: String(t.title || "New chat") }));
}

export function createNewThread(userKey, title = "New chat") {
  const now = Date.now();
  const store = loadThreadsStore(userKey);

  const id = randomId();
  const thread = {
    id,
    title: String(title || "").trim() || "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  const next = {
    activeId: id,
    threads: [thread, ...(store.threads || [])],
  };

  return saveThreadsStore(userKey, next);
}

export function setActiveThreadId(userKey, id) {
  const store = loadThreadsStore(userKey);
  const needle = String(id || "").trim();
  if (!needle) return store;

  if (!store.threads?.some((t) => t.id === needle)) return store;

  const next = { ...store, activeId: needle };
  return saveThreadsStore(userKey, next);
}

export function updateThreadMessages(userKey, id, messages, { titleFromText = "" } = {}) {
  const store = loadThreadsStore(userKey);
  const needle = String(id || store.activeId || "").trim();
  if (!needle) return store;

  const now = Date.now();
  const nextThreads = (store.threads || []).map((t) => {
    if (t.id !== needle) return t;

    const nextMsgs = Array.isArray(messages) ? messages.slice(-MAX_MESSAGES_PER_THREAD) : [];
    let title = String(t.title || "New chat");
    if ((title === "New chat" || !title.trim()) && String(titleFromText || "").trim()) {
      title = deriveThreadTitleFromText(titleFromText);
    }

    return { ...t, title, messages: nextMsgs, updatedAt: now };
  });

  const next = { activeId: needle, threads: nextThreads };
  return saveThreadsStore(userKey, next);
}
