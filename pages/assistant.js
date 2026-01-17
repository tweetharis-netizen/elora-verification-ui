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
    { id: "check", label: "Add a quick check question" },
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
    { id: "easier", label: "Make it easier" },
    { id: "harder", label: "Make it harder" },
    { id: "rubric", label: "Add rubric" },
    { id: "answers", label: "Add marking scheme" },
  ],
  slides: [
    { id: "timing", label: "Add timings" },
    { id: "questions", label: "Add questions" },
    { id: "teacher", label: "Add teacher notes" },
    { id: "visual", label: "Add visuals ideas" },
  ],
  check: [
    { id: "steps", label: "Show steps" },
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
    { id: "check", label: "Add a quick check question" },
  ],
  custom: [
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
    { id: "steps", label: "Show steps" },
    { id: "check", label: "Add a quick check question" },
  ],
  study: [
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
    { id: "steps", label: "Show steps" },
    { id: "check", label: "Add a quick check question" },
  ],
  coach: [
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
    { id: "steps", label: "Show steps" },
    { id: "check", label: "Add a quick check question" },
  ],
  message: [
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
    { id: "steps", label: "Show steps" },
    { id: "check", label: "Add a quick check question" },
  ],
};

const STARTER_PROMPTS = [
  "Explain fractions simply with one example.",
  "Check my answer: 10 + 5 = 15",
  "Give me 1 Primary-level practice question and then check my answer.",
  "Help me write a short essay plan.",
  "Create a simple study plan for my test next week.",
];

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

function clampStr(v, max = 2000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function cleanAssistantText(t) {
  return String(t || "").replace(/\s+\n/g, "\n").trim();
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function copyToClipboard(text, idx) {
  try {
    navigator.clipboard.writeText(text || "");
  } catch {}
}

export default function AssistantPage() {
  const router = useRouter();

  const [booted, setBooted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [teacher, setTeacher] = useState(false);
  const [email, setEmail] = useState("");

  const [role, setRole] = useState("student");
  const [country, setCountry] = useState("Singapore");
  const [level, setLevel] = useState("Primary 6");
  const [subject, setSubject] = useState("General");
  const [topic, setTopic] = useState("");
  const [constraints, setConstraints] = useState("");
  const [style, setStyle] = useState("standard");
  const [action, setAction] = useState("explain");

  const [loading, setLoading] = useState(false);
  const [chatText, setChatText] = useState("");
  const [messages, setMessages] = useState([]);
  const [attempt, setAttempt] = useState(0);

  const [copiedIdx, setCopiedIdx] = useState(-1);

  const [attachErr, setAttachErr] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);

  const [showJump, setShowJump] = useState(false);
  const [stickToBottom, setStickToBottom] = useState(true);

  const listRef = useRef(null);

  const [dismissPreviewNotice, setDismissPreviewNotice] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [chatMenuOpen, setChatMenuOpen] = useState(false);

  const [threads, setThreads] = useState([]);
  const [activeChatId, setActiveChatIdState] = useState("");

  const chatUserKey = useMemo(() => getChatUserKey(email || "guest"), [email]);

  const activeMeta = useMemo(() => getThreadMeta(chatUserKey, activeChatId), [chatUserKey, activeChatId]);
  const refinementChips = useMemo(() => REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.explain, [action]);

  const pinnedThreads = useMemo(() => threads.filter((t) => t.pinned), [threads]);
  const recentThreads = useMemo(() => threads.filter((t) => !t.pinned), [threads]);

  const hasEloraAnswer = useMemo(() => messages.some((m) => m.from === "elora"), [messages]);

  function persistSessionPatch(patch) {
    const s = getSession();
    const next = { ...s, ...(patch || {}) };
    try {
      window.localStorage.setItem("elora_session_v1", JSON.stringify(next));
      window.localStorage.setItem("elora_session", JSON.stringify(next));
    } catch {}
  }

  function jumpToLatest() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setShowJump(false);
    setStickToBottom(true);
  }

  useEffect(() => {
    const s = getSession();
    setRole(String(s.role || "student"));
    setCountry(String(s.country || "Singapore"));
    setLevel(String(s.level || "Primary 6"));
    setSubject(String(s.subject || "General"));
    setTopic(String(s.topicCustom || s.topicFixed || s.topic || ""));
    setConstraints(String(s.constraints || s.extra || ""));
    setStyle(String(s.style || "standard"));
    setAction(String(s.task || s.action || "explain"));
    setDismissPreviewNotice(Boolean(s.dismissPreviewNotice));

    setMessages(Array.isArray(s.messages) ? s.messages : []);
    setAttempt(Number(s.attempt || 0) || 0);

    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted) return;

    refreshVerifiedFromServer().then((st) => {
      setVerified(Boolean(st.verified));
      setEmail(String(st.email || ""));
      setTeacher(Boolean(st.teacher));
    });

    setTeacher(Boolean(isTeacher()));
  }, [booted]);

  useEffect(() => {
    if (!booted) return;

    ensureThreadsForUser(chatUserKey);

    const preferred = getActiveThreadId(chatUserKey);
    const s = getSession();
    const preferredFromSession = String(s.activeChatId || "");
    const nextActive = preferredFromSession || preferred;

    setActiveChatIdState(nextActive);

    const t = listThreads(chatUserKey);
    setThreads(t);

    const m = getThreadMessages(chatUserKey, nextActive);
    setMessages(Array.isArray(m) ? m : []);

    if (stickToBottom) {
      setTimeout(() => jumpToLatest(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted, chatUserKey]);

  useEffect(() => {
    if (!booted) return;
    persistSessionPatch({
      role,
      country,
      level,
      subject,
      topicCustom: topic,
      constraints,
      style,
      task: action,
    });
  }, [booted, role, country, level, subject, topic, constraints, style, action]);

  useEffect(() => {
    if (!booted) return;

    upsertThreadMessages(chatUserKey, activeChatId, messages);
    persistSessionPatch({ activeChatId, messages, attempt });

    if (stickToBottom) {
      setTimeout(() => jumpToLatest(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, attempt, activeChatId, booted, chatUserKey]);

  useEffect(() => {
    if (copiedIdx === -1) return;
    const t = setTimeout(() => setCopiedIdx(-1), 1000);
    return () => clearTimeout(t);
  }, [copiedIdx]);

  function dismissPreview() {
    setDismissPreviewNotice(true);
    persistSessionPatch({ dismissPreviewNotice: true });
  }

  function setActiveThreadAndLoad(id) {
    const threadId = String(id || "").trim();
    if (!threadId) return;

    setActiveThreadId(chatUserKey, threadId);
    setActiveChatIdState(threadId);

    const m = getThreadMessages(chatUserKey, threadId);
    setMessages(Array.isArray(m) ? m : []);
    setAttempt(0);

    setAttachedImage(null);
    setAttachErr("");

    setChatMenuOpen(false);
    persistSessionPatch({ activeChatId: threadId, messages: m, attempt: 0 });
  }

  async function sendMessage(nextText, opts = {}) {
    const raw = String(nextText || chatText || "");
    const trimmed = raw.trim();

    if (!trimmed && !attachedImage) return;
    if (loading) return;

    const nextAttempt = opts.bumpAttempt ? Math.min(3, (attempt || 0) + 1) : attempt || 0;

    const userLine = trimmed || (attachedImage ? "[Attached an image]" : "");
    const nextMessages = [
      ...messages,
      { from: "user", text: userLine, ts: Date.now() },
    ];

    setMessages(nextMessages);
    setChatText("");
    setAttachErr("");

    setLoading(true);

    try {
      const payload = {
        role,
        country,
        level,
        subject,
        topic: clampStr(topic || "", 120),
        constraints: clampStr(constraints || "", 250),
        style,
        action,
        message: userLine,
        attempt: nextAttempt,
        messages: nextMessages.map((m) => ({ from: m.from, text: m.text })),
        imageDataUrl: attachedImage || "",
      };

      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => null);

      if (!r.ok) {
        const msg = data?.error || "Something went wrong.";
        setMessages((prev) => [...prev, { from: "elora", text: msg, ts: Date.now() }]);
        setLoading(false);
        setAttempt(nextAttempt);
        setAttachedImage(null);
        return;
      }

      const reply = String(data?.reply || "").trim() || "…";
      setMessages((prev) => [...prev, { from: "elora", text: reply, ts: Date.now() }]);
      setLoading(false);
      setAttempt(nextAttempt);
      setAttachedImage(null);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "elora", text: "Assistant failed. Try again.", ts: Date.now() },
      ]);
      setLoading(false);
      setAttempt(nextAttempt);
      setAttachedImage(null);
    }
  }

  function applyRefinement(kind) {
    if (loading) return;
    const lastUser = [...messages].reverse().find((m) => m.from === "user");
    const lastElora = [...messages].reverse().find((m) => m.from === "elora");
    const base = lastUser?.text || chatText || "";

    let prompt = base;
    if (kind === "simpler") prompt = `${base}\n\nMake it simpler.`;
    if (kind === "example") prompt = `${base}\n\nAdd one clear example.`;
    if (kind === "steps") prompt = `${base}\n\nShow short steps.`;
    if (kind === "check") prompt = `${base}\n\nAdd a quick check question at the end.`;
    if (kind === "diff") prompt = `${base}\n\nAdd differentiation (support + extension).`;
    if (kind === "timing") prompt = `${base}\n\nAdd timing estimates.`;
    if (kind === "resources") prompt = `${base}\n\nAdd resources needed.`;
    if (kind === "answers") prompt = `${base}\n\nInclude teacher answers (if appropriate).`;
    if (kind === "variants") prompt = `${base}\n\nInclude A/B variants.`;
    if (kind === "rubric") prompt = `${base}\n\nAdd a simple rubric.`;
    if (kind === "questions") prompt = `${base}\n\nAdd key questions to ask students.`;
    if (kind === "teacher") prompt = `${base}\n\nAdd teacher notes.`;
    if (kind === "visual") prompt = `${base}\n\nAdd ideas for visuals (no images needed).`;
    if (kind === "easier") prompt = `${base}\n\nMake it easier.`;
    if (kind === "harder") prompt = `${base}\n\nMake it harder.`;

    if (!base && lastElora?.text) {
      prompt = `${lastElora.text}\n\n${prompt}`;
    }

    sendMessage(prompt);
  }

  async function onExport(kind) {
    if (!verified) {
      router.push("/verify");
      return;
    }

    const lastElora = [...messages].reverse().find((m) => m.from === "elora");
    const content = String(lastElora?.text || "").trim();
    if (!content) return;

    try {
      const endpoint =
        kind === "pdf"
          ? "/api/export-pdf"
          : kind === "docx"
          ? "/api/export-docx"
          : "/api/export-pptx";

      const title = `Elora Export`;

      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!r.ok) return;

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = kind === "pdf" ? "Elora-Export.pdf" : kind === "docx" ? "Elora-Export.docx" : "Elora-Export.pptx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch {}
  }

  function onNewChat() {
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
    togglePinThread(chatUserKey, activeChatId);
    setThreads(listThreads(chatUserKey));
  }

  function onOpenRename() {
    setRenameValue(String(activeMeta?.title || "New chat"));
    setRenameOpen(true);
    setChatMenuOpen(false);
  }

  function onConfirmRename() {
    renameThread(chatUserKey, activeChatId, renameValue);
    setThreads(listThreads(chatUserKey));
    setRenameOpen(false);
  }

  function onDeleteChat(id) {
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

  async function onAttachImage(file) {
    setAttachErr("");
    setAttachedImage(null);

    try {
      if (!file) return;
      if (!file.type || !file.type.startsWith("image/")) {
        setAttachErr("Please upload an image file.");
        return;
      }

      const maxBytes = 2.4 * 1024 * 1024;
      if (file.size > maxBytes) {
        setAttachErr("That image is too large. Try a closer crop.");
        return;
      }

      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });

      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
        setAttachErr("Couldn’t attach that image. Try again.");
        return;
      }

      setAttachedImage(dataUrl);
    } catch (e) {
      const code = String(e?.code || "").toLowerCase();
      setAttachErr(
        code === "image_too_large"
          ? "That image is too large to send. Try a closer crop."
          : "Couldn’t attach that image. Try again."
      );
    }
  }

  async function onRedeemTeacher(code) {
    const raw = String(code || "").trim();
    if (!raw) return;

    const r = await activateTeacher(raw);
    if (r?.ok) {
      setTeacher(true);
      await refreshVerifiedFromServer().then((st) => {
        setVerified(Boolean(st.verified));
        setEmail(String(st.email || ""));
        setTeacher(Boolean(st.teacher));
      });
      return;
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!booted) return null;

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
                  {verified ? "Verified" : "Guest"}
                </span>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Role</div>
                  <button
                    type="button"
                    onClick={() => router.push("/settings")}
                    className="rounded-full border border-slate-200/60 dark:border-white/10 px-3 py-1 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                  >
                    Change
                  </button>
                </div>

                <div className="mt-2 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-4 py-3">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">{ROLE_LABEL[role] || "Student"}</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Elora adapts automatically. Change role in Settings.
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Country</div>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Level</div>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option>Primary 1</option>
                    <option>Primary 2</option>
                    <option>Primary 3</option>
                    <option>Primary 4</option>
                    <option>Primary 5</option>
                    <option>Primary 6</option>
                    <option>Secondary 1</option>
                    <option>Secondary 2</option>
                    <option>Secondary 3</option>
                    <option>Secondary 4</option>
                    <option>Secondary 5</option>
                    <option>Junior College 1</option>
                    <option>Junior College 2</option>
                  </select>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    This affects the syllabus naming (Primary/Secondary vs Grades/Years).
                  </div>
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Subject</div>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Topic (optional)</div>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Fractions, Photosynthesis, Essay writing..."
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Extra constraints (optional)</div>
                  <input
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="e.g., Keep it short, use real-life examples..."
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Response style</div>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="standard">Standard (recommended)</option>
                    <option value="short">Short</option>
                    <option value="detailed">More detailed</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">Quick actions</div>
                <div className="mt-2 grid gap-2">
                  {(ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.student).map((qa) => (
                    <button
                      key={qa.id}
                      type="button"
                      onClick={() => setAction(qa.id)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-left transition",
                        action === qa.id
                          ? "border-indigo-500/40 bg-indigo-600 text-white"
                          : "border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-950/35"
                      )}
                    >
                      <div className={cn("text-sm font-extrabold", action === qa.id ? "text-white" : "text-slate-900 dark:text-slate-100")}>
                        {qa.label}
                      </div>
                      <div className={cn("mt-1 text-xs", action === qa.id ? "text-white/85" : "text-slate-600 dark:text-slate-400")}>
                        {qa.hint}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {teacher ? (
                <div className="mt-6 rounded-2xl border border-indigo-500/25 bg-indigo-600/10 px-4 py-3">
                  <div className="text-sm font-extrabold text-indigo-900 dark:text-indigo-100">Teacher tools unlocked</div>
                  <div className="mt-1 text-xs text-indigo-800/80 dark:text-indigo-100/75">
                    You can use lesson plans, assessments, worksheets, and slides.
                  </div>
                </div>
              ) : null}

              {!teacher && verified ? (
                <div className="mt-6 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/15 px-4 py-3">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">Teacher invite code (optional)</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Enter a code in Settings to unlock teacher-only tools.
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/settings")}
                    className="mt-3 rounded-full border border-slate-200/70 dark:border-white/10 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                  >
                    Go to Settings
                  </button>
                </div>
              ) : null}
            </div>

            {/* RIGHT */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5 flex flex-col min-h-0 lg:h-[calc(100dvh-var(--elora-nav-offset)-32px)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-950 dark:text-white">Elora Assistant</h2>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {ROLE_LABEL[role]} • {country} • {level}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border",
                      verified
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                        : "border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", verified ? "bg-emerald-400" : "bg-amber-400")} />
                    {verified ? "Verified" : "Guest"}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setChatMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-950/35"
                    aria-haspopup="menu"
                    aria-expanded={chatMenuOpen ? "true" : "false"}
                    title={activeMeta?.title || "Chat"}
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

                  {verified ? (
                    <button
                      type="button"
                      onClick={() => onDeleteChat(activeChatId)}
                      className="rounded-xl border border-slate-200/70 dark:border-white/10 px-3 py-2 text-sm font-extrabold text-rose-700 dark:text-rose-200 hover:bg-rose-500/10 dark:hover:bg-rose-500/10"
                      title="Delete this chat"
                    >
                      Delete
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={onNewChat}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
                    title="Start a new chat"
                  >
                    New
                  </button>
                </div>
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
                        className={cn(
                          "max-w-[96%] rounded-2xl px-4 py-3 text-sm leading-relaxed border",
                          isUser
                            ? "ml-auto bg-indigo-600 text-white border-indigo-500/20"
                            : "mr-auto bg-white/80 dark:bg-slate-950/25 text-slate-900 dark:text-slate-100 border-slate-200/60 dark:border-white/10 relative group"
                        )}
                      >
                        {!isUser ? (
                          <button
                            type="button"
                            onClick={() => {
                              copyToClipboard(display, idx);
                              setCopiedIdx(idx);
                            }}
                            className="absolute top-2 right-2 rounded-full border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-2.5 py-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition hover:bg-white dark:hover:bg-slate-950/60"
                            title="Copy"
                          >
                            {copiedIdx === idx ? "Copied" : "Copy"}
                          </button>
                        ) : null}
                        <div className="whitespace-pre-wrap">{display}</div>
                      </div>
                    );
                  })}

                  {loading ? (
                    <div className="mr-auto max-w-[96%] rounded-2xl px-4 py-3 text-sm border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-700 dark:text-slate-200">
                      Thinking…
                    </div>
                  ) : null}
                </div>

                {showJump ? (
                  <div className="sticky bottom-3 flex justify-end pointer-events-none">
                    <button
                      type="button"
                      onClick={jumpToLatest}
                      className="pointer-events-auto rounded-full border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-3 py-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-950/60"
                    >
                      Jump to latest
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Composer */}
              <div className="mt-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/15 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <textarea
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Ask Elora anything..."
                      className="w-full resize-none rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-500"
                      rows={2}
                    />
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Enter to send • Shift+Enter for a new line
                      </div>

                      <label className="inline-flex items-center gap-2 cursor-pointer rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-1.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onAttachImage(e.target.files?.[0])}
                        />
                        <span>📎</span>
                        <span>Attach</span>
                      </label>
                    </div>

                    {attachErr ? (
                      <div className="mt-2 text-xs font-bold text-rose-700 dark:text-rose-200">{attachErr}</div>
                    ) : null}

                    {attachedImage ? (
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2">
                        <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                          Image attached
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachedImage(null)}
                          className="rounded-full border border-slate-200/60 dark:border-white/10 bg-transparent px-2.5 py-1 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-950/40"
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={loading}
                    className={cn(
                      "rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-indigo-700",
                      loading ? "opacity-60 cursor-not-allowed" : ""
                    )}
                  >
                    Send
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="text-xs font-extrabold text-slate-600 dark:text-slate-400 mr-2">Export:</div>
                  <button
                    type="button"
                    onClick={() => onExport("pdf")}
                    className="rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
                  >
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => onExport("docx")}
                    className="rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
                  >
                    Export DOCX
                  </button>
                  <button
                    type="button"
                    onClick={() => onExport("pptx")}
                    className="rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
                  >
                    Export Slides
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rename Modal */}
        <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename chat">
          <div className="space-y-4">
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Chat name"
              className="w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmRename}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
