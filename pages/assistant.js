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
} from "@/lib/session";
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

const STARTER_SUGGESTION_POOLS = {
  educator: ({ country, level, subject, topic }) => {
    const safeCountry = country || "your country";
    const safeLevel = level || "your current level";
    const safeSubject = subject || "your subject";
    const safeTopic = topic || "a tricky topic your class is currently on";

    return [
      `Draft a ${safeLevel} ${safeSubject} lesson on “${safeTopic}” using I Do / We Do / You Do, including key questions to ask and common misconceptions to watch for.`,
      `Create a 10-minute Do Now + 25-minute main task + 5-minute exit ticket for ${safeLevel} ${safeSubject} on “${safeTopic}”, with printable prompts.`,
      `Generate a quick formative check for “${safeTopic}”: 6 questions (2 easy, 2 medium, 2 stretch) with answers and what each question diagnoses.`,
      `Write teacher feedback comments for 3 common student errors on “${safeTopic}” (one sentence each) plus a targeted next step for improvement.`,
      `Build a rubric for ${safeSubject} work on “${safeTopic}” (4 bands) with concrete descriptors and a sample “Band 3” exemplar answer.`,
      `Differentiate “${safeTopic}” for 3 groups (support / core / challenge): provide 3 tasks per group and a short teacher script for transitions.`,
      `Make a mini-quiz (8 questions) on “${safeTopic}” aligned to ${safeLevel} ${safeSubject} in ${safeCountry}, with a mark scheme and reteach plan based on results.`,
      `Turn “${safeTopic}” into a worked example set: 1 fully-worked example + 3 gradually harder practice questions + a self-check answer key.`,
    ];
  },
  parent: ({ country, level, subject, topic }) => {
    const safeCountry = country || "our country";
    const safeLevel = level || "my child’s level";
    const safeSubject = subject || "schoolwork";
    const safeTopic = topic || "what they’re learning this week";

    return [
      `Explain “${safeTopic}” in plain parent-friendly language, then give me a 2-minute “car ride explanation” I can say to my child at ${safeLevel}.`,
      `Give me 3 at-home mini-activities to support ${safeSubject} on “${safeTopic}” (10 minutes each, no printing, uses common household items).`,
      `Write 6 gentle conversation starters about “${safeTopic}” that feel supportive (not like a test) — good for dinner or bedtime chats.`,
      `Create a simple checklist I can use to help with ${safeSubject} homework on “${safeTopic}” without taking over (what to ask, what not to say).`,
      `Draft a calm “frustration reset” script for when homework gets tense, plus 3 options to step back while still keeping progress moving.`,
      `Make a 1-week routine for ${safeLevel} (${safeCountry}) to build confidence in ${safeSubject}: 3 short sessions tied to “${safeTopic}” with specific steps.`,
      `Give me 5 praise phrases that reward effort and strategy during “${safeTopic}” practice (and 3 follow-up questions that encourage thinking).`,
      `Turn “${safeTopic}” into a quick real-life example I can use at home, then give me 3 questions to check understanding in a low-pressure way.`,
    ];
  },
  student: ({ level, subject, topic }) => {
    const safeLevel = level || "my level";
    const safeSubject = subject || "my subject";
    const safeTopic = topic || "a topic I’m stuck on";

    return [
      `Teach me “${safeTopic}” for ${safeSubject} at ${safeLevel} in 4 short steps, then ask me 2 quick check questions (wait for my answers).`,
      `Make me a 20-minute study sprint for “${safeTopic}”: warm-up → 2 focused drills → 1 mixed question → quick recap.`,
      `Give me 6 practice questions on “${safeTopic}” at ${safeLevel} and mark them one-by-one after I answer each (no spoilers).`,
      `I’ll paste my working for “${safeTopic}”. First highlight what I did correctly, then show the first wrong step and how to fix it.`,
      `Help me revise “${safeTopic}” for an exam: 5-bullet summary, 3 “must know” rules, and 3 exam-style questions with a marking guide.`,
      `Create a 7-day spaced revision plan for “${safeTopic}” with tiny daily tasks (5–10 minutes) and a self-test on day 7.`,
      `Explain my mistake: I’ll paste a wrong answer about “${safeTopic}” — tell me the misconception and give 2 similar questions to practice.`,
      `Make a “teach-back” script so I can explain “${safeTopic}” to a friend in 60 seconds, then quiz me with 3 short questions.`,
    ];
  },
};

function stableHashToUint32(input) {
  // Simple non-crypto hash for deterministic UI randomness
  const s = String(input || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function LockedFeatureOverlay({ children, isVerified }) {
  if (isVerified) return children;

  return (
    <div className="relative group cursor-not-allowed inline-flex">
      <div className="blur-[1px] opacity-70 pointer-events-none transition-all group-hover:blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-2xl border border-white/10 dark:border-slate-200 scale-90">
          <Link href="/verify" className="text-[10px] font-black text-white dark:text-slate-900 whitespace-nowrap leading-none no-underline">
            Verify to Unlock →
          </Link>
        </div>
      </div>
    </div>
  );
}

function pickStarterSuggestions({ seed, role, country, level, subject, topic }) {
  const key = role === "educator" || role === "teacher" ? "educator" : role === "parent" ? "parent" : "student";
  const poolFn = STARTER_SUGGESTION_POOLS[key] || STARTER_SUGGESTION_POOLS.student;
  const pool = poolFn({ country, level, subject, topic }) || [];
  if (!pool.length) return [];

  const rnd = mulberry32(stableHashToUint32(seed));
  const shuffled = seededShuffle(pool, rnd);

  const maxCount = Math.min(5, shuffled.length);
  const minCount = Math.min(3, maxCount);
  const countRange = maxCount - minCount;
  const count = minCount + (countRange > 0 ? Math.floor(rnd() * (countRange + 1)) : 0);

  return shuffled.slice(0, count);
}

const PREVIEW_DISMISS_KEY = "elora_preview_notice_dismissed_v1";
const PREFS_OPEN_KEY = "elora_assistant_prefs_open_v1";

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
      "Primary School",
      "Secondary School",
      "Junior College / Pre-U",
      "Polytechnic / ITE",
      "University",
    ];
  }

  if (c.includes("united states") || c === "us" || c.includes("usa")) {
    return [
      "Elementary School",
      "Middle School",
      "High School",
      "College / University",
    ];
  }

  if (c.includes("united kingdom") || c.includes("uk") || c.includes("britain") || c.includes("england")) {
    return [
      "Primary School",
      "Secondary School",
      "Sixth Form / College",
      "University",
    ];
  }

  if (c.includes("australia")) {
    return [
      "Primary School",
      "Secondary School",
      "University / TAFE",
    ];
  }

  if (c.includes("malaysia")) {
    return [
      "Primary School (Standard 1-6)",
      "Secondary School (Form 1-5)",
      "Pre-University / STPM",
      "University",
    ];
  }

  return ["Primary School", "Secondary School", "Tertiary / Higher Ed", "Adult Learning"];
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

  const [prefsOpen, setPrefsOpen] = useState(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatUserKey, activeChatId, threads]
  );

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(false);

  const [attempt, setAttempt] = useState(0);
  const [topicForSuggestions, setTopicForSuggestions] = useState(() => String(session?.topic || ""));
  const starterSaltRef = useRef(
    // changes on reload, but stable through the session
    typeof window !== "undefined" ? `${Date.now()}-${Math.random()}` : "ssr"
  );

  // Debounce topic so suggestions don't "flicker" while the user is typing.
  useEffect(() => {
    const t = setTimeout(() => setTopicForSuggestions(String(topic || "")), 450);
    return () => clearTimeout(t);
  }, [topic]);

  const starterSeed = useMemo(() => {
    // Stable for small UI changes, but changes when:
    // - page reloads (salt)
    // - user switches chat thread (activeChatId)
    // - user changes key settings (role/country/level/subject)
    // - topic changes after debounce
    return [
      "starter-v2",
      starterSaltRef.current,
      chatUserKey,
      activeChatId,
      role,
      country,
      level,
      subject,
      topicForSuggestions,
    ].join("|");
  }, [chatUserKey, activeChatId, role, country, level, subject, topicForSuggestions]);

  const starterPrompts = useMemo(
    () => pickStarterSuggestions({ seed: starterSeed, role, country, level, subject, topic: topicForSuggestions }),
    [starterSeed, role, country, level, subject, topicForSuggestions]
  );

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

  // Preferences panel open/close persistence
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(PREFS_OPEN_KEY);
      if (stored === "false") setPrefsOpen(false);
    } catch { }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PREFS_OPEN_KEY, prefsOpen ? "true" : "false");
    } catch { }
  }, [prefsOpen]);

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
    } catch { }
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
      } catch { }
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
      // Note: Endpoint /api/session/set expects a token, not a patch.
      // Persisting UI state via localStorage (getSession/saveSession) instead.
      /*
      await fetch("/api/session/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      */
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

    if (verified) {
      persistSessionPatch({ activeChatId: nextActive, messages: nextMsgs });
    }
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

  // Session Heartbeat for activeMinutes tracking
  useEffect(() => {
    const timer = setInterval(() => {
      const s = getSession();
      if (!s.usage) s.usage = { activeMinutes: 0 };
      s.usage.activeMinutes = (Number(s.usage.activeMinutes) || 0) + 1;
      s.usage.lastActive = new Date().toISOString();
      saveSession(s);
    }, 60000); // Every 1 minute

    return () => clearInterval(timer);
  }, []);

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
    setMessages(nextMessages);

    // NO-MEMORY RULE for unverified users: Do not persist to storage or server.
    if (!verified) return;

    upsertThreadMessages(chatUserKey, activeChatId, nextMessages);
    setThreads(listThreads(chatUserKey));

    // Track usage on every message sent (only if Elora or User)
    const isActuallyNew = nextMessages.length > messages.length;
    if (isActuallyNew) {
      const s = getSession();
      if (!s.usage) s.usage = { messagesSent: 0, subjects: [], streak: 0 };
      s.usage.messagesSent = (Number(s.usage.messagesSent) || 0) + 1;

      // Update subjects explored
      if (subject && !Array.isArray(s.usage.subjects)) s.usage.subjects = [];
      if (subject && !s.usage.subjects.includes(subject)) {
        s.usage.subjects.push(subject);
      }

      // Update session log (limited to last 50 for storage size)
      if (!Array.isArray(s.usage.sessionLog)) s.usage.sessionLog = [];
      const logEntry = { ts: new Date().toISOString(), subject: subject || "General", action: action };
      s.usage.sessionLog = [logEntry, ...s.usage.sessionLog].slice(0, 50);

      // Update last active
      s.usage.lastActive = new Date().toISOString();

      // Update streak
      s.usage.streak = Math.max(Number(s.usage.streak) || 0, 1);

      saveSession(s);
    }

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
        } catch { }
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

      <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
        <div className="elora-container pt-8 pb-12">
          <div className={cn("grid gap-6", prefsOpen ? "lg:grid-cols-[400px,1fr]" : "lg:grid-cols-1")}>

            {/* LEFT - Preferences Panel */}
            {prefsOpen && (
              <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/30 shadow-2xl shadow-indigo-500/5 dark:shadow-black/40 p-6 flex flex-col gap-6 h-fit sticky top-[calc(var(--elora-nav-offset)+1rem)]">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-indigo-500">⚙️</span> Settings
                  </h1>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border",
                        verified
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                          : "border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", verified ? "bg-emerald-400" : "bg-amber-400")} />
                      {verified ? "Verified" : "Guest"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrefsOpen(false)}
                      className="h-8 w-8 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                      title="Close settings"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Context Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Context</div>
                      <Link href="/settings?focus=role" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">Change Role</Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                        <div className="text-[10px] font-bold text-slate-400 mb-1">Role</div>
                        <div className="text-xs font-black text-slate-900 dark:text-white capitalize">{role}</div>
                      </div>
                      <div className="p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full h-full bg-transparent border-none px-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-0 outline-none cursor-pointer"
                        >
                          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Level Section */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Education Level</div>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 px-4 text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer shadow-sm"
                    >
                      {countryLevels.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
                    </select>
                  </div>

                  {/* Subject & Topic */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Learning Area</div>
                    <div className="grid gap-3">
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer"
                      >
                        {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Current topic (e.g. Fractions)"
                        className="w-full h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Plan</div>
                    <div className="grid grid-cols-1 gap-2">
                      {(ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.student).map((a) => {
                        const active = action === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setAction(a.id)}
                            className={cn(
                              "relative group rounded-2xl border p-4 text-left transition-all duration-300",
                              active
                                ? "border-indigo-500/60 bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 scale-[1.02] z-10"
                                : "border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-white/10"
                            )}
                          >
                            <div className="text-sm font-black mb-1">{a.label}</div>
                            <div className={cn("text-[10px] font-medium leading-tight", active ? "text-indigo-100/80" : "text-slate-500")}>
                              {a.hint}
                            </div>
                            {active && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-white/40">✨</div>}
                          </button>
                        );
                      })}
                    </div>
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
                      setThreads(listThreads(chatUserKey));
                    }}
                    className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors border border-dashed border-slate-300 dark:border-white/10 hover:border-red-500/50"
                  >
                    Reset Current Conversation
                  </button>
                </div>
              </div>
            )}

            {/* RIGHT - Chat Area */}
            <div className="rounded-[3rem] border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 shadow-2xl p-4 flex flex-col min-h-[600px] lg:h-[calc(100dvh-16px)]">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 px-4 py-2 mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                    Assistant
                    {teacher && <span className="bg-indigo-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">PRO</span>}
                  </h2>
                  <div className="mt-0.5 text-xs font-bold text-indigo-500/80 uppercase tracking-wide">
                    {country} • {level}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!prefsOpen && (
                    <button
                      type="button"
                      onClick={() => setPrefsOpen(true)}
                      className="h-10 px-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all"
                    >
                      Settings
                    </button>
                  )}
                  {role === "student" && action === "check" && (
                    <div className="h-10 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                        Check: {Math.min(3, attempt)}/3
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Thread Area */}
              <div className="mt-2 rounded-[2rem] border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 p-3 flex-1 flex flex-col min-h-0 relative">

                {/* Chat History Header */}
                <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-200 dark:border-white/5 mb-4">
                  {canManageChats ? (
                    <div className="relative shrink min-w-0" ref={chatMenuRef}>
                      <button
                        type="button"
                        onClick={() => setChatMenuOpen((v) => !v)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-800 dark:text-white hover:bg-white dark:hover:bg-white/5 transition-colors border border-transparent min-w-0"
                      >
                        <span className="text-amber-500 shrink-0">{activeMeta?.pinned ? "★" : "☆"}</span>
                        <span className="truncate">{activeMeta?.title || "New chat"}</span>
                        <span className="text-slate-400 shrink-0 text-[10px]">▼</span>
                      </button>

                      {chatMenuOpen && (
                        <div className="absolute z-50 mt-2 w-[320px] max-w-[calc(100vw-4rem)] rounded-3xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 shadow-2xl overflow-hidden backdrop-blur-xl animate-reveal">
                          <div className="p-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Conversations</span>
                            <button onClick={onNewChat} className="text-[10px] font-black text-indigo-500 hover:text-indigo-600">+ NEW</button>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                            {threads.map(t => (
                              <div key={t.id} className={cn("group flex items-center rounded-2xl p-1", t.id === activeChatId ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5")}>
                                <button onClick={() => setActiveThreadAndLoad(t.id)} className="flex-1 text-left px-3 py-2 text-xs font-bold truncate">
                                  {t.title || "New chat"}
                                </button>
                                <button onClick={() => onDeleteChat(t.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500">✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Preview Mode
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button onClick={onTogglePin} className="p-2 text-slate-400 hover:text-amber-500 transition-colors">★</button>
                    <button onClick={onOpenRename} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">✎</button>
                    <button onClick={onNewChat} title="New Chat" className="w-8 h-8 rounded-full bg-indigo-500 text-white grid place-items-center shadow-lg shadow-indigo-500/20 hover:scale-110 transition-transform">+</button>
                  </div>
                </div>

                {/* Messages Container */}
                <div
                  ref={listRef}
                  className="flex-1 overflow-y-auto px-4 space-y-6 scroll-smooth pb-8"
                  onScroll={() => {
                    const el = listRef.current;
                    if (!el) return;
                    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
                    setStickToBottom(atBottom);
                    setShowJump(!atBottom);
                  }}
                >
                  {messages.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 text-3xl grid place-items-center mb-6 animate-float">👋</div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Hello! I'm Elora.</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs">
                        I'm your personalized {role} assistant. How can I help you today?
                      </p>
                      <div className="mt-8 grid grid-cols-1 gap-2 w-full max-w-sm">
                        {starterPrompts.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setChatText(p)}
                            className="text-left p-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all text-xs font-bold"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, idx) => {
                    const isUser = m.from === "user";
                    const display = cleanAssistantText(m.text);
                    return (
                      <div key={idx} className={cn("flex w-full group animate-reveal", isUser ? "justify-end pl-12" : "justify-start pr-12")}>
                        <div className={cn(
                          "relative rounded-3xl p-4 sm:p-5 text-sm leading-[1.6] shadow-sm",
                          isUser
                            ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10"
                            : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-slate-200/20"
                        )}>
                          <div className="font-bold flex items-center gap-2 mb-2">
                            <div className={cn("w-2 h-2 rounded-full", isUser ? "bg-indigo-300" : "bg-indigo-500")} />
                            <span className="text-[10px] uppercase tracking-widest opacity-60">
                              {isUser ? "You" : "Elora"}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap font-medium">{display}</div>

                          {!isUser && (
                            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 pt-3">
                              <button
                                onClick={() => copyToClipboard(display, idx)}
                                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-indigo-500 transition-colors"
                              >
                                {copiedIdx === idx ? "✓ Copied" : "Copy"}
                              </button>
                              <div className="flex-1" />
                              <div className="flex gap-1">
                                {refinementChips.slice(0, 3).map(chip => (
                                  <button
                                    key={chip.id}
                                    onClick={() => applyRefinement(chip.id)}
                                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-slate-400 hover:text-indigo-500"
                                  >
                                    {chip.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {loading && (
                    <div className="flex justify-start pr-12 animate-reveal">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 rounded-3xl rounded-tl-none p-5 shadow-sm">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-indigo-500/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 bg-indigo-500/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 bg-indigo-500/60 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {showJump && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                    <button onClick={jumpToLatest} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-2">
                      <span>New Message Below</span>
                      <span className="text-lg">↓</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  {canShowExports && (
                    <div className="flex gap-1">
                      {["pdf", "docx", "pptx"].map(fmt => (
                        <button key={fmt} onClick={() => exportLast(fmt)} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors uppercase">
                          {fmt}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex-1" />
                  {attachErr && <span className="text-[10px] font-bold text-red-500">{attachErr}</span>}
                </div>

                {attachedImage && (
                  <div className="relative w-24 h-24 rounded-2xl border border-indigo-500/30 overflow-hidden group ml-2 mb-2">
                    <img src={attachedImage.dataUrl} className="w-full h-full object-cover" alt="attachment" />
                    <button onClick={() => setAttachedImage(null)} className="absolute inset-0 bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                )}

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-[2rem] opacity-20 blur group-focus-within:opacity-40 transition-opacity" />
                  <div className="relative bg-white dark:bg-slate-900 rounded-[1.85rem] border border-slate-200 dark:border-white/5 p-2 flex items-end gap-2 shadow-sm">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-indigo-500 transition-colors" title="Attach file">📎</button>
                    <textarea
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder={role === "student" && action === "check" ? "Type your answer..." : "Ask Elora anything..."}
                      rows={1}
                      className="flex-1 bg-transparent border-none px-2 py-3 text-sm font-medium focus:ring-0 outline-none resize-none min-h-[48px] max-h-[160px] scrollbar-hide dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendChat();
                        }
                      }}
                    />
                    <button
                      disabled={loading || (!chatText.trim() && !attachedImage)}
                      onClick={sendChat}
                      className="h-10 w-10 flex items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      <span className="text-xl">➔</span>
                    </button>
                  </div>
                </div>
                <div className="px-4 text-[10px] font-medium text-slate-400 flex justify-between">
                  <span>Elora GENESIS v1.2</span>
                  <span>Protip: Ask for hints first</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onPickImage(file);
        e.target.value = "";
      }} />

      {/* Modals */}
      <Modal open={renameOpen} title="Rename chat" onClose={() => setRenameOpen(false)}>
        <div className="space-y-4 p-2">
          <p className="text-sm font-medium text-slate-500">Give this conversation a clear name.</p>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="e.g., Algebra Review"
            autoFocus
          />
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                renameThread(chatUserKey, activeChatId, renameValue);
                setThreads(listThreads(chatUserKey));
                setRenameOpen(false);
              }}
              className="flex-1 h-12 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
            >
              Save Changes
            </button>
            <button onClick={() => setRenameOpen(false)} className="h-12 px-6 rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-sm">Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal open={verifyGateOpen} title="Unlock Elora Assistant" onClose={() => setVerifyGateOpen(false)}>
        <div className="space-y-6 text-center py-4">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] grid place-items-center mx-auto text-4xl mb-2">💎</div>
          <div className="space-y-2">
            <h3 className="text-xl font-black">Full Access Required</h3>
            <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">Verified Educator accounts gain access to lesson planning, worksheet generation, and unlimited thread exports.</p>
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <button onClick={() => router.push("/verify")} className="h-12 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">Verify My Email</button>
            <button onClick={() => { storeGuest(true); setSession(getSession()); setVerifyGateOpen(false); }} className="h-10 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Continue as Guest</button>
          </div>
        </div>
      </Modal>

      <Modal open={teacherGateOpen} title="Teacher Verification" onClose={() => setTeacherGateOpen(false)}>
        <div className="space-y-6 p-2">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Advanced educator tools are currently in a closed pilot.</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Invite Code</label>
            <input
              value={teacherGateCode}
              onChange={(e) => setTeacherGateCode(e.target.value)}
              className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="PRO-XXXX-XXXX"
            />
            {teacherGateStatus && <p className="text-[10px] font-bold text-indigo-500 ml-1">{teacherGateStatus}</p>}
          </div>
          <button
            onClick={async () => {
              const ok = await validateAndActivateInvite(teacherGateCode);
              if (ok) setTeacherGateOpen(false);
            }}
            className="w-full h-12 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
          >
            Enable Pro Tools
          </button>
        </div>
      </Modal>
    </>
  );
}
