// lib/chatThreads.js
// Local multi-chat threads for Assistant.
//
// Goals:
// - Genesis-safe: no backend changes required.
// - Guest chats are separated from verified chats.
// - Defensive & SSR-safe.

const STORAGE_PREFIX = "elora_chat_threads_v1:";
const MAX_CHATS = 20;
const MAX_MESSAGES_PER_CHAT = 80;

function safeParseJSON(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function now() {
  return Date.now();
}

function newId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampStr(v, max = 200) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function normalizeMessages(list) {
  if (!Array.isArray(list)) return [];
  const cleaned = list
    .map((m) => {
      if (!m || typeof m !== "object") return null;
      const from = m.from === "user" ? "user" : "elora";
      const text = typeof m.text === "string" ? m.text : "";
      const ts = typeof m.ts === "number" ? m.ts : now();
      return { from, text, ts };
    })
    .filter(Boolean);

  // Keep only last N messages to avoid localStorage bloat.
  return cleaned.slice(-MAX_MESSAGES_PER_CHAT);
}

function defaultStore() {
  const id = newId();
  return {
    v: 1,
    activeId: id,
    threads: [
      {
        id,
        title: "New chat",
        createdAt: now(),
        updatedAt: now(),
        messages: [],
      },
    ],
  };
}

function storageKey(userKey) {
  const key = String(userKey || "guest").trim() || "guest";
  return `${STORAGE_PREFIX}${key}`;
}

export function deriveChatUserKey(session) {
  const verified = Boolean(session?.verified);
  const email = typeof session?.email === "string" ? session.email.trim().toLowerCase() : "";
  if (verified && email) return `v:${email}`;
  return "guest";
}

export function loadThreadStore(userKey) {
  if (typeof window === "undefined") return defaultStore();

  try {
    const raw = window.localStorage.getItem(storageKey(userKey));
    const parsed = safeParseJSON(raw);
    if (!parsed || typeof parsed !== "object") return defaultStore();
    return parsed;
  } catch {
    return defaultStore();
  }
}

export function persistThreadStore(userKey, store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userKey), JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function ensureThreadStore(store) {
  const s = store && typeof store === "object" ? store : null;
  if (!s) return defaultStore();

  const threads = Array.isArray(s.threads) ? s.threads : [];
  const cleanedThreads = threads
    .map((t) => {
      if (!t || typeof t !== "object") return null;
      const id = String(t.id || "").trim();
      if (!id) return null;
      const title = clampStr(String(t.title || "New chat"), 80) || "New chat";
      const createdAt = typeof t.createdAt === "number" ? t.createdAt : now();
      const updatedAt = typeof t.updatedAt === "number" ? t.updatedAt : createdAt;
      const messages = normalizeMessages(t.messages);
      return { id, title, createdAt, updatedAt, messages };
    })
    .filter(Boolean);

  let next = {
    v: 1,
    activeId: String(s.activeId || "").trim(),
    threads: cleanedThreads,
  };

  // Ensure at least one thread exists.
  if (!next.threads.length) {
    next = defaultStore();
    return next;
  }

  // Ensure activeId is valid.
  if (!next.activeId || !next.threads.some((t) => t.id === next.activeId)) {
    next.activeId = next.threads[0].id;
  }

  return pruneStore(next);
}

function pruneStore(store) {
  const threads = Array.isArray(store.threads) ? store.threads : [];
  // Sort newest first by updatedAt.
  const sorted = [...threads].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  // Keep only MAX_CHATS.
  const kept = sorted.slice(0, MAX_CHATS);

  // If active chat got pruned, keep it.
  const activeId = String(store.activeId || "");
  if (activeId && !kept.some((t) => t.id === activeId)) {
    const active = sorted.find((t) => t.id === activeId);
    if (active) {
      kept.pop();
      kept.push(active);
    }
  }

  // Re-sort for UI (oldest->newest is nicer in dropdown? We'll use newest first in listThreadOptions).
  const finalThreads = kept.map((t) => ({
    ...t,
    messages: normalizeMessages(t.messages),
  }));

  return {
    ...store,
    threads: finalThreads,
  };
}

export function getActiveThread(store) {
  const s = ensureThreadStore(store);
  const id = String(s.activeId || "");
  return s.threads.find((t) => t.id === id) || s.threads[0] || null;
}

export function listThreadOptions(store) {
  const s = ensureThreadStore(store);
  const threads = Array.isArray(s.threads) ? s.threads : [];

  // Newest first (ChatGPT-like); short titles.
  return [...threads]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .map((t) => ({
      id: t.id,
      title: clampStr(String(t.title || "New chat"), 40) || "New chat",
      updatedAt: t.updatedAt || 0,
    }));
}

function titleFromMessages(messages) {
  const firstUser = Array.isArray(messages) ? messages.find((m) => m?.from === "user" && String(m?.text || "").trim()) : null;
  const base = clampStr(String(firstUser?.text || ""), 80);
  if (!base) return "New chat";
  // Keep it tidy: remove newlines and trim length.
  const singleLine = base.replace(/\s+/g, " ").trim();
  return clampStr(singleLine, 40) || "New chat";
}

export function setActiveChat(store, chatId) {
  const s = ensureThreadStore(store);
  const id = String(chatId || "").trim();
  if (!id) return s;
  if (!s.threads.some((t) => t.id === id)) return s;
  return { ...s, activeId: id };
}

export function createNewChat(store, opts = {}) {
  const s = ensureThreadStore(store);
  const id = newId();
  const title = clampStr(String(opts.title || "New chat"), 80) || "New chat";
  const createdAt = now();
  const messages = normalizeMessages(opts.messages || []);
  const thread = {
    id,
    title,
    createdAt,
    updatedAt: createdAt,
    messages,
  };

  const next = {
    ...s,
    activeId: id,
    threads: [thread, ...s.threads],
  };

  return pruneStore(next);
}

export function clearChatMessages(store, chatId) {
  const s = ensureThreadStore(store);
  const id = String(chatId || s.activeId || "").trim();
  if (!id) return s;

  const nextThreads = s.threads.map((t) => {
    if (t.id !== id) return t;
    return {
      ...t,
      messages: [],
      updatedAt: now(),
      // keep title; clearing shouldn't rename
    };
  });

  return pruneStore({ ...s, threads: nextThreads });
}

export function updateChatMessages(store, chatId, messages, opts = {}) {
  const s = ensureThreadStore(store);
  const id = String(chatId || s.activeId || "").trim();
  if (!id) return s;

  const normalized = normalizeMessages(messages);

  const nextThreads = s.threads.map((t) => {
    if (t.id !== id) return t;

    let title = t.title || "New chat";

    if (opts.forceTitle && typeof opts.forceTitle === "string") {
      title = clampStr(opts.forceTitle, 80) || title;
    } else if (opts.autoTitle) {
      // Only auto-title if it still looks like the default.
      const looksDefault = String(title || "").trim().toLowerCase() === "new chat";
      if (looksDefault) title = titleFromMessages(normalized);
    }

    return {
      ...t,
      title,
      messages: normalized,
      updatedAt: now(),
    };
  });

  return pruneStore({ ...s, threads: nextThreads });
}
