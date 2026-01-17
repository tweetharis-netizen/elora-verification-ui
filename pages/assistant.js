import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../components/Modal";
import {
  activateTeacher,
  getSession,
  isTeacher,
  refreshVerifiedFromServer,
  setGuest as storeGuest,
} from "../lib/session";
import {
  clearThread,
  createThread,
  deleteThread,
  ensureThreadsForUser,
  getActiveThreadId,
  getChatUserKey,
  getThreadMessages,
  getThreadMeta,
  listThreads,
  renameThread,
  setActiveThreadId,
  togglePinThread,
  upsertThreadMessages,
} from "../lib/chatThreads";

const COUNTRIES = ["Singapore", "United States", "United Kingdom", "Australia", "Malaysia", "Other"];
const SUBJECTS = ["General", "Math", "Science", "English", "History", "Geography", "Computing"];

const ROLE_LABEL = {
  student: "Student",
  parent: "Parent",
  educator: "Educator",
};

const ROLE_QUICK_ACTIONS = {
  educator: [
    { id: "explain", label: "Explain a concept", hint: "Classroom-ready explanation + one example" },
    { id: "custom", label: "Custom request", hint: "Ask anything as a teacher (tone, structure, etc.)" },
    { id: "lesson", label: "Plan a lesson", hint: "Objectives, timings, checks, differentiation" },
    { id: "worksheet", label: "Create worksheet", hint: "Student + Teacher versions" },
    { id: "assessment", label: "Generate assessment", hint: "Marks + marking scheme" },
    { id: "slides", label: "Design slides", hint: "Deck outline + teacher notes" },
  ],
  student: [
    { id: "explain", label: "Explain it", hint: "Simple steps, beginner friendly" },
    { id: "check", label: "Check my answer", hint: "Hints first. Answer unlocks on attempt 3." },
    { id: "study", label: "Study plan", hint: "Small steps, realistic plan" },
    { id: "custom", label: "Custom", hint: "Ask anything" },
  ],
  parent: [
    { id: "explain", label: "Explain to me", hint: "Plain language, no jargon" },
    { id: "coach", label: "How to help", hint: "What to say and do at home" },
    { id: "message", label: "Write a message", hint: "To teacher or school" },
    { id: "custom", label: "Custom", hint: "Ask anything" },
  ],
};

const REFINEMENT_CHIPS = {
  explain: [
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
    { id: "steps", label: "Show steps" },
    { id: "check", label: "Give a quick check question" },
  ],
  lesson: [
    { id: "diff", label: "Add differentiation" },
    { id: "timing", label: "Add timings" },
    { id: "check", label: "Add checks for understanding" },
    { id: "resources", label: "Add resources" },
  ],
  worksheet: [
    { id: "easier", label: "Make it easier" },
    { id: "harder", label: "Make it harder" },
    { id: "answers", label: "Add teacher answers" },
    { id: "variants", label: "Add A/B versions" },
  ],
  assessment: [
    { id: "markscheme", label: "Add mark scheme" },
    { id: "variants", label: "Add variants" },
    { id: "harder", label: "Make it harder" },
    { id: "easier", label: "Make it easier" },
  ],
  slides: [
    { id: "outline", label: "Tighten outline" },
    { id: "hooks", label: "Add hook" },
    { id: "examples", label: "Add examples" },
    { id: "notes", label: "Add teacher notes" },
  ],
  check: [
    { id: "more-steps", label: "Show more steps" },
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
  ],
  study: [
    { id: "shorter", label: "Make it shorter" },
    { id: "steps", label: "Show steps" },
    { id: "check", label: "Add a check question" },
  ],
  coach: [
    { id: "simpler", label: "Make it simpler" },
    { id: "steps", label: "Give steps" },
    { id: "check", label: "Add a check question" },
  ],
  message: [
    { id: "shorter", label: "Make it shorter" },
    { id: "simpler", label: "Make it simpler" },
  ],
  custom: [
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
    { id: "steps", label: "Show steps" },
  ],
};

const STARTER_PROMPTS = [
  "Explain fractions like I’m 10.",
  "Check my answer: 10 + 5 = 15",
  "Give me 1 Primary-level practice question and then check my answer.",
];

const PREVIEW_DISMISS_KEY = "elora_preview_notice_dismissed_v1";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function stripInternalTags(text) {
  return String(text || "")
    .replace(/<\s*internal\s*>[\s\S]*?<\s*\/\s*internal\s*>/gi, "")
    .replace(/<\s*internal\s*\/\s*>/gi, "")
    .replace(/<\s*internal\s*>/gi, "")
    .trim();
}

function cleanAssistantText(text) {
  let t = stripInternalTags(text || "");
  t = t.replace(/```[\s\S]*?```/g, "");
  t = t.replace(/`+/g, "");
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");
  t = t.replace(/_([^_]+)_/g, "$1");
  t = t.replace(/^\s*>\s?/gm, "");
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  t = t.replace(/^\s*([-*_])\1\1+\s*$/gm, "");
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

function inferActionFromMessage(text) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return null;

  if (
    t.includes("check my answer") ||
    t.includes("is this correct") ||
    t.includes("is it correct") ||
    t.includes("am i correct") ||
    t.includes("did i get it right") ||
    t.includes("right or wrong") ||
    t.includes("correct or not") ||
    /\bmy answer\b/.test(t) ||
    /\banswer\s*:\s*/.test(t) ||
    /\b=\s*-?\d/.test(t)
  ) {
    return "check";
  }

  if (t.includes("lesson plan")) return "lesson";
  if (t.includes("worksheet")) return "worksheet";
  if (t.includes("assessment") || t.includes("test") || t.includes("quiz")) return "assessment";
  if (t.includes("slides") || t.includes("powerpoint")) return "slides";

  return null;
}

function getCountryLevels(country) {
  const c = String(country || "").toLowerCase();

  if (c.includes("singapore")) {
    return [
      "Primary 1",
      "Primary 2",
      "Primary 3",
      "Primary 4",
      "Primary 5",
      "Primary 6",
      "Secondary 1",
      "Secondary 2",
      "Secondary 3",
      "Secondary 4",
      "Secondary 5",
      "JC 1",
      "JC 2",
    ];
  }

  if (c.includes("united states") || c === "us" || c.includes("usa")) {
    return [
      "Grade 1",
      "Grade 2",
      "Grade 3",
      "Grade 4",
      "Grade 5",
      "Grade 6",
      "Grade 7",
      "Grade 8",
      "Grade 9",
      "Grade 10",
      "Grade 11",
      "Grade 12",
    ];
  }

  if (
    c.includes("united kingdom") ||
    c.includes("uk") ||
    c.includes("britain") ||
    c.includes("england")
  ) {
    return [
      "Year 1",
      "Year 2",
      "Year 3",
      "Year 4",
      "Year 5",
      "Year 6",
      "Year 7",
      "Year 8",
      "Year 9",
      "Year 10",
      "Year 11",
      "Year 12",
      "Year 13",
    ];
  }

  if (c.includes("australia")) {
    return [
      "Year 1",
      "Year 2",
      "Year 3",
      "Year 4",
      "Year 5",
      "Year 6",
      "Year 7",
      "Year 8",
      "Year 9",
      "Year 10",
      "Year 11",
      "Year 12",
    ];
  }

  if (c.includes("malaysia")) {
    return [
      "Standard 1",
      "Standard 2",
      "Standard 3",
      "Standard 4",
      "Standard 5",
      "Standard 6",
      "Form 1",
      "Form 2",
      "Form 3",
      "Form 4",
      "Form 5",
    ];
  }

  return ["Primary", "Secondary", "Pre-U", "University", "Adult learning"];
}

async function compressImageToDataUrl(file, { maxDim = 1400, quality = 0.82 } = {}) {
  const readAsDataUrl = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read_failed"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(f);
    });

  const rawUrl = await readAsDataUrl(file);

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("image_decode_failed"));
    i.src = rawUrl;
  });

  const w = img.width || 1;
  const h = img.height || 1;

  const scale = Math.min(1, maxDim / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("canvas_failed");
  ctx.drawImage(img, 0, 0, outW, outH);

  const outMime = "image/jpeg";
  const outUrl = canvas.toDataURL(outMime, quality);

  if (outUrl.length > 6_000_000) {
    const smaller = canvas.toDataURL(outMime, 0.68);
    if (smaller.length > 6_000_000) throw new Error("image_too_large");
    return { dataUrl: smaller, mime: outMime, name: file.name || "image.jpg" };
  }

  return { dataUrl: outUrl, mime: outMime, name: file.name || "image.jpg" };
}

export default function AssistantPage() {
  const router = useRouter();

  const [session, setSession] = useState(() => getSession());
  const verified = Boolean(session?.verified);
  const teacher = Boolean(isTeacher());

  const canManageChats = verified;

  const [role, setRole] = useState(() => session?.role || "student");
  const [country, setCountry] = useState(() => session?.country || "Singapore");

  const countryLevels = useMemo(() => getCountryLevels(country), [country]);
  const [level, setLevel] = useState(() => session?.level || countryLevels[0] || "Primary 1");

  const [subject, setSubject] = useState(() => session?.subject || "General");
  const [topic, setTopic] = useState(() => session?.topic || "");
  const [constraints, setConstraints] = useState("");
  const [responseStyle, setResponseStyle] = useState("standard");
  const [customStyleText, setCustomStyleText] = useState("");

  const [action, setAction] = useState(() => session?.action || "explain");

  // Threaded chat state
  const [chatUserKey, setChatUserKey] = useState(() => getChatUserKey(getSession()));
  const [activeChatId, setActiveChatIdState] = useState(() =>
    getActiveThreadId(getChatUserKey(getSession()))
  );
  const [threads, setThreads] = useState(() => listThreads(getChatUserKey(getSession())));

  const [messages, setMessages] = useState(() =>
    getThreadMessages(getChatUserKey(getSession()), getActiveThreadId(getChatUserKey(getSession())))
  );

  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const chatMenuRef = useRef(null);

  const activeMeta = useMemo(
    () => getThreadMeta(chatUserKey, activeChatId),
    // include threads so title/pin updates re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatUserKey, activeChatId, threads]
  );

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(false);

  const [attempt, setAttempt] = useState(0);

  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);
  const [teacherGateCode, setTeacherGateCode] = useState("");
  const [teacherGateStatus, setTeacherGateStatus] = useState("");

  const listRef = useRef(null);

  const [stickToBottom, setStickToBottom] = useState(true);
  const [showJump, setShowJump] = useState(false);

  const [dismissPreviewNotice, setDismissPreviewNotice] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);

  const fileInputRef = useRef(null);
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachErr, setAttachErr] = useState("");

  const teacherOnlyBlocked = useMemo(() => {
    const teacherOnly = new Set(["lesson", "worksheet", "assessment", "slides"]);
    return teacherOnly.has(action) && !teacher;
  }, [action, teacher]);

  const refinementChips = useMemo(
    () => REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.explain,
    [action]
  );

  const hasEloraAnswer = useMemo(
    () => messages.some((m) => m?.from === "elora" && String(m?.text || "").trim()),
    [messages]
  );
  const canShowExports = verified && hasEloraAnswer;

  const pinnedThreads = useMemo(
    () => (canManageChats ? threads.filter((t) => t.pinned) : []),
    [threads, canManageChats]
  );
  const recentThreads = useMemo(
    () => (canManageChats ? threads.filter((t) => !t.pinned) : []),
    [threads, canManageChats]
  );

  // Close chat menu on outside click
  useEffect(() => {
    if (typeof window === "undefined") return;

    function onDown(e) {
      if (!chatMenuRef.current) return;
      if (!chatMenuRef.current.contains(e.target)) setChatMenuOpen(false);
    }

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  // Preview notice persistence
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const dismissed = window.localStorage.getItem(PREVIEW_DISMISS_KEY) === "true";
      setDismissPreviewNotice(dismissed);
    } catch {
      setDismissPreviewNotice(false);
    }
  }, []);

  useEffect(() => {
    if (!verified) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(PREVIEW_DISMISS_KEY);
    } catch {}
    setDismissPreviewNotice(false);
  }, [verified]);

  useEffect(() => {
    // When country changes: ensure level is valid for that country.
    const allowed = getCountryLevels(country);
    if (!allowed.includes(level)) {
      setLevel(allowed[0] || "Primary 1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  // Session events
  useEffect(() => {
    function onSessionEvent() {
      const s = getSession();
      setSession(s);
      setRole(s?.role || "student");
      setCountry(s?.country || "Singapore");

      const allowed = getCountryLevels(s?.country || "Singapore");
      const nextLevel = allowed.includes(s?.level) ? s.level : allowed[0] || "Primary 1";
      setLevel(nextLevel);

      setSubject(s?.subject || "General");
      setTopic(s?.topic || "");
      setAction(s?.action || "explain");
    }

    if (typeof window !== "undefined") {
      window.addEventListener("elora:session", onSessionEvent);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("elora:session", onSessionEvent);
      }
    };
  }, []);

  useEffect(() => {
    if (!(role === "student" && action === "check")) {
      setAttempt(0);
    }
  }, [role, action]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (stickToBottom) el.scrollTop = el.scrollHeight;
  }, [messages, loading, stickToBottom]);

  function jumpToLatest() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStickToBottom(true);
    setShowJump(false);
  }

  function dismissPreview() {
    setDismissPreviewNotice(true);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(PREVIEW_DISMISS_KEY, "true");
      } catch {}
    }
  }

  async function copyToClipboard(text, idx) {
    const value = String(text || "").trim();
    if (!value) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "true");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setCopiedIdx(idx);
      window.setTimeout(() => setCopiedIdx(-1), 900);
    } catch {
      // no-op
    }
  }

  async function persistSessionPatch(patch) {
    try {
      await fetch("/api/session/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      // ignore
    }
  }

  // Server chat endpoints store ONE chat; we keep using them only as a simple sync of active thread
  async function saveServerChatIfVerified(currentSession, nextMessages) {
    try {
      if (!currentSession?.verified) return;
      await fetch("/api/chat/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
    } catch {
      // ignore
    }
  }

  async function clearServerChatIfVerified(currentSession) {
    try {
      if (!currentSession?.verified) return;
      await fetch("/api/chat/clear", { method: "POST" });
    } catch {
      // ignore
    }
  }

  function syncThreadsState(userKey) {
    const ensured = ensureThreadsForUser(userKey);
    const nextActive = ensured?.activeId || getActiveThreadId(userKey);

    setThreads(listThreads(userKey));
    setActiveChatIdState(nextActive);

    const nextMsgs = getThreadMessages(userKey, nextActive);
    setMessages(nextMsgs);

    persistSessionPatch({ activeChatId: nextActive, messages: nextMsgs });
    return nextActive;
  }

  // Init: refresh verification, then load threads for correct identity (guest vs verified)
  useEffect(() => {
    let mounted = true;

    (async () => {
      await refreshVerifiedFromServer();
      if (!mounted) return;

      const s = getSession();
      setSession(s);
      setRole(s?.role || "student");

      const allowed = getCountryLevels(s?.country || "Singapore");
      setLevel(allowed.includes(s?.level) ? s.level : allowed[0] || "Primary 1");

      const userKey = getChatUserKey(s);
      setChatUserKey(userKey);

      syncThreadsState(userKey);
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When verification/email changes, switch identity (guest chats stay separate from verified)
  useEffect(() => {
    const s = getSession();
    const nextKey = getChatUserKey(s);
    if (nextKey === chatUserKey) return;

    setChatUserKey(nextKey);
    syncThreadsState(nextKey);
    setAttempt(0);
    setAttachedImage(null);
    setAttachErr("");
    setChatMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified, session?.email]);

  useEffect(() => {
    persistSessionPatch({
      role,
      country,
      level,
      subject,
      topic,
      action,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, country, level, subject, topic, action]);

  function setActiveThreadAndLoad(nextId) {
    const id = setActiveThreadId(chatUserKey, nextId);
    setActiveChatIdState(id);
    setThreads(listThreads(chatUserKey));
    const msgs = getThreadMessages(chatUserKey, id);
    setMessages(msgs);
    setAttempt(0);
    setAttachedImage(null);
    setAttachErr("");
    setChatMenuOpen(false);

    persistSessionPatch({ activeChatId: id, messages: msgs });
  }

  function persistActiveMessages(nextMessages, { alsoSyncServer = true } = {}) {
    upsertThreadMessages(chatUserKey, activeChatId, nextMessages);
    setThreads(listThreads(chatUserKey));
    setMessages(nextMessages);
    persistSessionPatch({ activeChatId, messages: nextMessages });

    if (alsoSyncServer) {
      const currentSession = getSession();
      saveServerChatIfVerified(currentSession, nextMessages);
    }
  }

  async function callElora({ messageOverride, baseMessages }) {
    const currentSession = getSession();

    const userText = String(messageOverride || chatText || "").trim();
    if (!userText && !attachedImage?.dataUrl) return;

    setLoading(true);

    try {
      if (role === "educator" && !currentSession?.verified) {
        setVerifyGateOpen(true);
        setLoading(false);
        return;
      }

      if (teacherOnlyBlocked) {
        setTeacherGateOpen(true);
        setLoading(false);
        return;
      }

      const attemptNext =
        role === "student" && action === "check" ? Math.min(3, attempt + 1) : 0;

      const payload = {
        role,
        action,
        country,
        level,
        subject,
        topic,
        constraints,
        responseStyle,
        customStyleText,
        attempt: attemptNext,
        message: userText,
        messages: Array.isArray(baseMessages) ? baseMessages : messages,
        imageDataUrl: attachedImage?.dataUrl || "",
        imageMime: attachedImage?.mime || "",
        imageName: attachedImage?.name || "",
      };

      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => null);

      const base = Array.isArray(baseMessages) ? baseMessages : messages;

      if (!r.ok) {
        const err = data?.error || "Request failed.";
        if (String(err).toLowerCase().includes("verify")) setVerifyGateOpen(true);

        const next = [...base, { from: "elora", text: String(err), ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: true });
        setLoading(false);
        return;
      }

      const out = cleanAssistantText(data?.reply || data?.text || data?.answer || "");
      const next = [...base, { from: "elora", text: out, ts: Date.now() }];

      persistActiveMessages(next, { alsoSyncServer: true });

      if (role === "student" && action === "check") {
        setAttempt((a) => a + 1);
      }

      setAttachedImage(null);
      setAttachErr("");
    } catch {
      const next = [
        ...messages,
        { from: "elora", text: "Something went wrong. Try again.", ts: Date.now() },
      ];
      persistActiveMessages(next, { alsoSyncServer: true });
    } finally {
      setChatText("");
      setLoading(false);
    }
  }

  async function sendChat() {
    const trimmed = String(chatText || "").trim();
    if ((!trimmed && !attachedImage?.dataUrl) || loading) return;

    const inferred = inferActionFromMessage(trimmed);
    if (inferred === "check" && action !== "check") {
      setAction("check");
      setAttempt(0);
      await persistSessionPatch({ action: "check" });
    }

    const userMsg = { from: "user", text: trimmed || "(image)", ts: Date.now() };
    const nextMessages = [...messages, userMsg];

    persistActiveMessages(nextMessages, { alsoSyncServer: true });
    await callElora({ messageOverride: trimmed, baseMessages: nextMessages });
  }

  async function exportLast(type) {
    const last = [...messages].reverse().find((m) => m?.from === "elora");
    if (!last?.text) {
      const next = [
        ...messages,
        { from: "elora", text: "Nothing to export yet — ask me something first.", ts: Date.now() },
      ];
      persistActiveMessages(next, { alsoSyncServer: false });
      return;
    }

    if (!verified) {
      setVerifyGateOpen(true);
      const next = [
        ...messages,
        { from: "elora", text: "Exports are locked until your email is verified.", ts: Date.now() },
      ];
      persistActiveMessages(next, { alsoSyncServer: false });
      return;
    }

    try {
      const endpoint =
        type === "docx" ? "/api/export-docx" : type === "pptx" ? "/api/export-slides" : "/api/export-pdf";

      const content = cleanAssistantText(last.text);
      const title = type === "pptx" ? "Elora Slides" : type === "docx" ? "Elora Notes" : "Elora Export";

      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const ct = String(r.headers.get("content-type") || "");
      if (!r.ok || ct.includes("application/json")) {
        let err = `Export failed (HTTP ${r.status}).`;
        let data = null;
        try {
          data = await r.json();
        } catch {}
        const code = String(data?.error || data?.message || "").trim();
        if (r.status === 403 || code === "not_verified") {
          setVerifyGateOpen(true);
          err = "Export blocked: verify your email to unlock exports.";
        } else if (code) {
          err = `Export failed: ${code}`;
        }
        const next = [...messages, { from: "elora", text: err, ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: false });
        return;
      }

      const blob = await r.blob();
      if (!blob || blob.size === 0) {
        const next = [...messages, { from: "elora", text: "Export failed: empty file returned.", ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: false });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "pptx" ? "elora.pptx" : type === "docx" ? "elora.docx" : "elora.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const next = [...messages, { from: "elora", text: "Export failed due to a network error. Try again.", ts: Date.now() }];
      persistActiveMessages(next, { alsoSyncServer: false });
    }
  }

  async function applyRefinement(chipId) {
    const map = {
      simpler: "Make it simpler and more beginner-friendly.",
      example: "Add one clear example that matches the topic.",
      steps: "Show the steps clearly (short).",
      check: "Give one quick check question at the end.",
      diff: "Add differentiation: easier + harder extension.",
      timing: "Add a simple timeline with approximate minutes.",
      resources: "Add a short list of materials/resources.",
      easier: "Make it easier while keeping the same topic.",
      harder: "Make it harder and add a challenge question.",
      answers: "Add a teacher answer key after the questions.",
      rubric: "Add a short marking guide/rubric.",
      shorter: "Make it shorter and more direct.",
      markscheme: "Include a clear marking scheme.",
      variants: "Add two variants (A/B) with the same skills tested.",
      outline: "Tighten the slide outline into clear sections.",
      hooks: "Add 1-2 engaging hooks or questions for the start.",
      examples: "Add more examples that students can relate to.",
      notes: "Add short teacher notes for each section.",
      "more-steps": "Add more steps and explain the reasoning clearly.",
    };

    const refinement = map[chipId] || "Improve the answer.";

    const userMsg = { from: "user", text: refinement, ts: Date.now() };
    const nextMessages = [...messages, userMsg];

    persistActiveMessages(nextMessages, { alsoSyncServer: true });
    await callElora({ messageOverride: refinement, baseMessages: nextMessages });
  }

  async function validateAndActivateInvite(code) {
    const trimmed = (code || "").trim();
    setTeacherGateStatus("");

    if (!trimmed) {
      setTeacherGateStatus("Enter a code.");
      return false;
    }
    if (!verified) {
      setTeacherGateStatus("Verify your email first.");
      return false;
    }

    try {
      const act = await activateTeacher(trimmed);
      if (!act?.ok) {
        setTeacherGateStatus("Invalid code.");
        return false;
      }

      await refreshVerifiedFromServer();
      const s = getSession();
      setSession(s);

      if (isTeacher()) {
        setTeacherGateStatus("Teacher role active ✅");
        return true;
      }

      setTeacherGateStatus("Code accepted, but teacher role not active. Refresh and try again.");
      return false;
    } catch {
      setTeacherGateStatus("Could not validate right now. Try again.");
      return false;
    }
  }

  async function onPickImage(file) {
    setAttachErr("");
    setAttachedImage(null);

    if (!file) return;

    if (!file.type || !file.type.startsWith("image/")) {
      setAttachErr("Images only (PNG/JPG/WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAttachErr("That image is too large. Try a smaller photo (max 5MB).");
      return;
    }

    try {
      const out = await compressImageToDataUrl(file);
      setAttachedImage(out);
    } catch (e) {
      const code = String(e?.message || "");
      setAttachErr(
        code === "image_too_large"
          ? "That image is too large to send. Try a closer crop."
          : "Couldn’t attach that image. Try again."
      );
    }
  }

  function onNewChat() {
    if (!canManageChats) {
      setVerifyGateOpen(true);
      return;
    }
    const { id } = createThread(chatUserKey);
    setActiveChatIdState(id);
    setThreads(listThreads(chatUserKey));
    setMessages([]);
    setAttempt(0);
    setAttachedImage(null);
    setAttachErr("");
    setChatMenuOpen(false);
    persistSessionPatch({ activeChatId: id, messages: [] });
  }

  function onTogglePin() {
    if (!canManageChats) {
      setVerifyGateOpen(true);
      return;
    }
    togglePinThread(chatUserKey, activeChatId);
    setThreads(listThreads(chatUserKey));
  }

  function onOpenRename() {
    if (!canManageChats) {
      setVerifyGateOpen(true);
      return;
    }
    setRenameValue(String(activeMeta?.title || "New chat"));
    setRenameOpen(true);
    setChatMenuOpen(false);
  }

  function onConfirmRename() {
    if (!canManageChats) {
      setVerifyGateOpen(true);
      return;
    }
    renameThread(chatUserKey, activeChatId, renameValue);
    setThreads(listThreads(chatUserKey));
    setRenameOpen(false);
  }

  function onDeleteChat(id) {
    if (!canManageChats) {
      setVerifyGateOpen(true);
      return;
    }
    const threadId = String(id || "").trim();
    if (!threadId) return;

    const meta = threads.find((t) => t.id === threadId);
    const label = meta?.title ? `"${meta.title}"` : "this chat";

    if (typeof window !== "undefined") {
      const ok = window.confirm(`Delete ${label}? This cannot be undone.`);
      if (!ok) return;
    }

    deleteThread(chatUserKey, threadId);

    const nextThreads = listThreads(chatUserKey);
    const nextActive = getActiveThreadId(chatUserKey);
    const nextMsgs = getThreadMessages(chatUserKey, nextActive);

    setThreads(nextThreads);
    setActiveChatIdState(nextActive);
    setMessages(nextMsgs);

    setAttempt(0);
    setAttachedImage(null);
    setAttachErr("");

    persistSessionPatch({ activeChatId: nextActive, messages: nextMsgs });
  }

  return (
    <>
      <Head>
        <title>Elora Assistant</title>
      </Head>

      <div className="elora-page">
        <div className="elora-container">
          <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
            {/* LEFT */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-950 dark:text-white">Preferences</h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border",
                    verified
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", verified ? "bg-emerald-400" : "bg-amber-400")} />
                  {verified ? "Verified" : "Preview"}
                </span>
              </div>

              {/* Role (display only) */}
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Role</div>
                  <Link
                    href="/settings?focus=role"
                    className="rounded-full border border-slate-200/60 dark:border-white/10 bg-transparent px-3 py-1 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-950/40"
                  >
                    Change
                  </Link>
                </div>
                <div className="mt-2 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 px-4 py-3">
                  <div className="text-sm font-extrabold text-slate-950 dark:text-white">
                    {ROLE_LABEL[role] || "Student"}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Elora adapts automatically. Change role in Settings.
                  </div>
                </div>
              </div>

              {/* Country/Level */}
              <div className="mt-5 grid gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">
                    {String(country || "").toLowerCase().includes("united states") ? "Grade" : "Level"}
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {countryLevels.map((lv) => (
                      <option key={lv} value={lv}>
                        {lv}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    This affects the syllabus naming (Primary/Secondary vs Grades/Years).
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Topic (optional)</label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Fractions, Photosynthesis, Essay writing…"
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Extra constraints (optional)</label>
                  <input
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="e.g., Keep it short, use real-life examples…"
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Response style</label>
                  <select
                    value={responseStyle}
                    onChange={(e) => setResponseStyle(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="standard">Standard (recommended)</option>
                    <option value="very-simple">Very simple</option>
                    <option value="detailed">More detailed</option>
                    <option value="custom">Custom…</option>
                  </select>

                  {responseStyle === "custom" ? (
                    <textarea
                      value={customStyleText}
                      onChange={(e) => setCustomStyleText(e.target.value)}
                      placeholder="Tell Elora how to respond (tone, structure, what to avoid)…"
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  ) : null}
                </div>

                {/* Quick actions */}
                <div className="mt-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Quick actions</div>
                  <div className="mt-2 grid gap-2">
                    {(ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.student).map((a) => {
                      const active = action === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setAction(a.id)}
                          className={cn(
                            "rounded-2xl border px-4 py-3 text-left transition",
                            active
                              ? "border-indigo-500/40 bg-indigo-600 text-white shadow-lg shadow-indigo-500/15"
                              : "border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/35"
                          )}
                        >
                          <div className="text-sm font-extrabold">{a.label}</div>
                          <div
                            className={cn(
                              "mt-1 text-xs font-bold",
                              active ? "text-white/90" : "text-slate-600 dark:text-slate-400"
                            )}
                          >
                            {a.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const currentSession = getSession();
                      clearThread(chatUserKey, activeChatId);
                      setMessages([]);
                      setAttempt(0);
                      await persistSessionPatch({ activeChatId, messages: [] });
                      await clearServerChatIfVerified(currentSession);
                      setAttachedImage(null);
                      setAttachErr("");
                      setThreads(listThreads(chatUserKey));
                    }}
                    className="mt-4 rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                  >
                    Clear current chat
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5 flex flex-col min-h-0 lg:h-[calc(100dvh-var(--elora-nav-offset)-64px)]">
              {/* Title + meta */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">Elora Assistant</h2>
                  <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {ROLE_LABEL[role] || "Student"} • {country} • {level}
                    {role === "student" && action === "check" ? (
                      <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        Attempts: {Math.min(3, attempt)}/3
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Chat header bar */}
              <div className="mt-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/75 dark:bg-slate-950/20 px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {canManageChats ? (
                    <div className="relative" ref={chatMenuRef}>
                      <button
                        type="button"
                        onClick={() => setChatMenuOpen((v) => !v)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-950/40 border border-transparent"
                        aria-haspopup="menu"
                        aria-expanded={chatMenuOpen ? "true" : "false"}
                        title="Switch chats"
                      >
                        <span className="text-base">{activeMeta?.pinned ? "★" : "☆"}</span>
                        <span className="max-w-[240px] truncate">{activeMeta?.title || "New chat"}</span>
                        <span className="text-slate-500 dark:text-slate-400">▾</span>
                      </button>

                      {chatMenuOpen ? (
                        <div
                          className="absolute z-50 mt-2 w-[340px] max-w-[90vw] rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 shadow-xl overflow-hidden"
                          role="menu"
                        >
                          {pinnedThreads.length ? (
                            <div className="px-3 pt-3 pb-2">
                              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Pinned
                              </div>
                              <div className="mt-2 grid gap-1">
                                {pinnedThreads.map((t) => (
                                  <div
                                    key={t.id}
                                    className={cn(
                                      "rounded-xl border transition",
                                      t.id === activeChatId
                                        ? "border-indigo-500/40 bg-indigo-600 text-white"
                                        : "border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20"
                                    )}
                                  >
                                    <div className="flex items-center">
                                      <button
                                        type="button"
                                        onClick={() => setActiveThreadAndLoad(t.id)}
                                        className={cn(
                                          "flex-1 text-left rounded-xl px-3 py-2 text-sm font-bold",
                                          t.id === activeChatId
                                            ? "text-white"
                                            : "text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-950/35"
                                        )}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-base">★</span>
                                          <span className="truncate">{t.title || "New chat"}</span>
                                        </div>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          onDeleteChat(t.id);
                                        }}
                                        className={cn(
                                          "mr-2 rounded-lg px-2 py-2 text-xs font-extrabold border",
                                          t.id === activeChatId
                                            ? "border-white/20 text-white/90 hover:bg-white/10"
                                            : "border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-950/40"
                                        )}
                                        title="Delete chat"
                                        aria-label="Delete chat"
                                      >
                                        🗑
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="px-3 pt-3 pb-3">
                            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Recent
                            </div>
                            <div className="mt-2 grid gap-1">
                              {recentThreads.map((t) => (
                                <div
                                  key={t.id}
                                  className={cn(
                                    "rounded-xl border transition",
                                    t.id === activeChatId
                                      ? "border-indigo-500/40 bg-indigo-600 text-white"
                                      : "border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20"
                                  )}
                                >
                                  <div className="flex items-center">
                                    <button
                                      type="button"
                                      onClick={() => setActiveThreadAndLoad(t.id)}
                                      className={cn(
                                        "flex-1 text-left rounded-xl px-3 py-2 text-sm font-bold",
                                        t.id === activeChatId
                                          ? "text-white"
                                          : "text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-950/35"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-base">{t.pinned ? "★" : "☆"}</span>
                                        <span className="truncate">{t.title || "New chat"}</span>
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDeleteChat(t.id);
                                      }}
                                      className={cn(
                                        "mr-2 rounded-lg px-2 py-2 text-xs font-extrabold border",
                                        t.id === activeChatId
                                          ? "border-white/20 text-white/90 hover:bg-white/10"
                                          : "border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-950/40"
                                      )}
                                      title="Delete chat"
                                      aria-label="Delete chat"
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-200/70 dark:border-white/10 px-3 py-3 flex gap-2">
                            <button
                              type="button"
                              onClick={onNewChat}
                              className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
                            >
                              New chat
                            </button>
                            <button
                              type="button"
                              onClick={onOpenRename}
                              className="rounded-xl border border-slate-200/70 dark:border-white/10 px-3 py-2 text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                            >
                              Rename
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/25 text-slate-900 dark:text-white font-black">
                        P
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          Preview chat
                        </div>
                        <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate">
                          Verify to save, pin, rename, and manage chats
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {canManageChats ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onTogglePin}
                      className="rounded-xl border border-slate-200/70 dark:border-white/10 px-3 py-2 text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      title={activeMeta?.pinned ? "Unpin chat" : "Pin chat"}
                      aria-label={activeMeta?.pinned ? "Unpin chat" : "Pin chat"}
                    >
                      {activeMeta?.pinned ? "★ Pinned" : "☆ Pin"}
                    </button>

                    <button
                      type="button"
                      onClick={onOpenRename}
                      className="rounded-xl border border-slate-200/70 dark:border-white/10 px-3 py-2 text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                    >
                      Rename
                    </button>

                    <button
                      type="button"
                      onClick={onNewChat}
                      className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
                      title="Start a new chat"
                    >
                      New
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/verify"
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
                    title="Verify to unlock saved chats"
                  >
                    Verify
                  </Link>
                )}
              </div>

              {/* Refinement chips */}
              {hasEloraAnswer ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {refinementChips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={loading}
                      onClick={() => applyRefinement(c.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-extrabold transition",
                        "border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40",
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Preview notice */}
              {!verified && !dismissPreviewNotice ? (
                <div className="mt-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">Preview mode</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        Verify to unlock exports + educator tools. You can still use the Assistant now.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={dismissPreview}
                      className="rounded-full border border-slate-200/60 dark:border-white/10 bg-transparent px-2.5 py-1 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-950/40"
                      aria-label="Dismiss"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => router.push("/verify")}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
                    >
                      Verify email
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/settings")}
                      className="rounded-full border border-slate-200/70 dark:border-white/10 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                    >
                      Settings
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Messages */}
              <div
                ref={listRef}
                onScroll={() => {
                  const el = listRef.current;
                  if (!el) return;
                  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
                  setStickToBottom(atBottom);
                  setShowJump(!atBottom);
                }}
                className="mt-4 flex-1 min-h-0 overflow-auto pr-1 relative"
              >
                {!messages.length && !loading ? (
                  <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/15 p-4">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">Try one of these</div>
                    <div className="mt-2 grid gap-2">
                      {STARTER_PROMPTS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setChatText(p)}
                          className="text-left rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                      Tip: attach a photo if the question is long.
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 space-y-3">
                  {messages.map((m, idx) => {
                    const isUser = m.from === "user";
                    const display = cleanAssistantText(m.text);

                    return (
                      <div
                        key={idx}
                        className={cn("flex", isUser ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl border px-4 py-3",
                            isUser
                              ? "border-indigo-500/30 bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                              : "border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-900 dark:text-slate-100"
                          )}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{display}</div>

                          {!isUser ? (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(display, idx)}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-[11px] font-extrabold transition",
                                  "border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                                )}
                              >
                                {copiedIdx === idx ? "Copied" : "Copy"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {loading ? (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        Thinking…
                      </div>
                    </div>
                  ) : null}
                </div>

                {showJump ? (
                  <div className="sticky bottom-3 mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={jumpToLatest}
                      className="rounded-full border border-slate-200/70 dark:border-white/10 bg-white/90 dark:bg-slate-950/70 px-4 py-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/90 shadow-lg"
                    >
                      Jump to latest
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Composer */}
              <div className="mt-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder={
                      role === "student" && action === "check"
                        ? "Type your answer (Elora will hint first, then unlock the answer on attempt 3)…"
                        : "Ask Elora anything…"
                    }
                    rows={2}
                    className="flex-1 resize-none rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/90 dark:bg-slate-950/30 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border border-slate-200/70 dark:border-white/10 px-3 py-2 text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      title="Attach image"
                    >
                      📎
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={sendChat}
                      className={cn(
                        "rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700",
                        loading ? "opacity-60 cursor-not-allowed" : ""
                      )}
                    >
                      Send
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPickImage(file);
                    e.target.value = "";
                  }}
                />

                {attachErr ? (
                  <div className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-200">
                    {attachErr}
                  </div>
                ) : null}

                {attachedImage?.dataUrl ? (
                  <div className="mt-3 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Attached image
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedImage(null)}
                        className="rounded-full border border-slate-200/70 dark:border-white/10 px-2.5 py-1 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                    <img
                      src={attachedImage.dataUrl}
                      alt="attachment preview"
                      className="mt-2 rounded-xl max-h-[220px] object-contain"
                    />
                  </div>
                ) : null}

                {/* Export row */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canShowExports}
                    onClick={() => exportLast("pdf")}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                      canShowExports
                        ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                        : "border-slate-200/50 dark:border-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    )}
                    title={canShowExports ? "Export last answer as PDF" : "Verify and ask a question to unlock exports"}
                  >
                    Export PDF
                  </button>
                  <button
                    type="button"
                    disabled={!canShowExports}
                    onClick={() => exportLast("docx")}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                      canShowExports
                        ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                        : "border-slate-200/50 dark:border-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    )}
                    title={canShowExports ? "Export last answer as DOCX" : "Verify and ask a question to unlock exports"}
                  >
                    Export DOCX
                  </button>
                  <button
                    type="button"
                    disabled={!canShowExports}
                    onClick={() => exportLast("pptx")}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                      canShowExports
                        ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                        : "border-slate-200/50 dark:border-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    )}
                    title={canShowExports ? "Export last answer as Slides" : "Verify and ask a question to unlock exports"}
                  >
                    Export Slides
                  </button>
                </div>
              </div>

      {/* Rename modal */}
      <Modal open={renameOpen} title="Rename chat" onClose={() => setRenameOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">Give this chat a short name.</div>
        <input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="e.g., Fractions practice"
        />
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onConfirmRename}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setRenameOpen(false)}
            className="rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Verification gate */}
      <Modal open={verifyGateOpen} title="Verify to unlock Elora" onClose={() => setVerifyGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Educator mode and exports are locked behind verification. You can still preview Student/Parent modes.
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/verify")}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
          >
            Verify email
          </button>
          <button
            type="button"
            onClick={() => {
              storeGuest(true);
              const s = getSession();
              setSession(s);
              setVerifyGateOpen(false);
            }}
            className="rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
          >
            Continue preview
          </button>
        </div>
      </Modal>

      {/* Teacher gate */}
      <Modal open={teacherGateOpen} title="Unlock Teacher Tools" onClose={() => setTeacherGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Lesson plans, worksheets, assessments, and slides are locked behind a Teacher Invite Code.
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold text-slate-900 dark:text-white">Teacher Invite Code</label>
          <input
            value={teacherGateCode}
            onChange={(e) => setTeacherGateCode(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="e.g., GENESIS2026"
          />
          {teacherGateStatus ? (
            <div className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              {teacherGateStatus}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              const ok = await validateAndActivateInvite(teacherGateCode);
              if (ok) setTeacherGateOpen(false);
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
          >
            Unlock teacher tools
          </button>
          <button
            type="button"
            onClick={() => setTeacherGateOpen(false)}
            className="rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
          >
            Not now
          </button>
        </div>
      </Modal>
    </>
  );
}
