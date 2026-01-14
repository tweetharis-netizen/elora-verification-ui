import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../components/Modal";
import {
  activateTeacher,
  getSession,
  isTeacher,
  refreshVerifiedFromServer,
} from "../lib/session";

const COUNTRIES = ["Singapore", "Malaysia", "UK", "US", "Australia", "Other"];

const LEVELS_BY_COUNTRY = {
  Singapore: [
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
    "University",
    "Adult learning",
  ],
  Malaysia: [
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
    "University",
    "Adult learning",
  ],
  UK: [
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
    "University",
    "Adult learning",
  ],
  US: [
    "Grade K",
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
    "University",
    "Adult learning",
  ],
  Australia: [
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
    "University",
    "Adult learning",
  ],
  Other: ["Primary", "Lower secondary", "Upper secondary", "Pre-university", "University", "Adult learning"],
};

const SUBJECTS = ["General", "Math", "Science", "English", "History", "Geography", "Computing"];

const ROLE_LABEL = {
  student: "Student",
  parent: "Parent",
  educator: "Educator",
};

const ACTION_LABEL = {
  explain: "Explain",
  check: "Check my answer",
  practice: "Practice",
  coach: "How to help",
  plan: "Study plan",
  lesson: "Lesson plan",
  worksheet: "Worksheet",
  assessment: "Assessment",
  slides: "Slides outline",
};

const ACTIONS_BY_ROLE = {
  student: ["explain", "check", "practice"],
  parent: ["explain", "coach", "plan"],
  educator: ["explain", "lesson", "worksheet", "assessment", "slides"],
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
    { id: "checks", label: "Add checks for understanding" },
    { id: "resources", label: "Add resources" },
  ],
  worksheet: [
    { id: "easier", label: "Make it easier" },
    { id: "harder", label: "Make it harder" },
    { id: "ans", label: "Add answer key" },
    { id: "format", label: "Change format" },
  ],
  assessment: [
    { id: "marks", label: "Add marks" },
    { id: "rubric", label: "Add rubric" },
    { id: "harder", label: "Make it harder" },
    { id: "easier", label: "Make it easier" },
  ],
  slides: [
    { id: "shorter", label: "Make it shorter" },
    { id: "activity", label: "Add activity" },
    { id: "checks", label: "Add check points" },
    { id: "examples", label: "Add examples" },
  ],
  check: [
    { id: "hint", label: "Give a hint" },
    { id: "mistake", label: "Explain my mistake" },
    { id: "steps", label: "Show steps (no final answer yet)" },
    { id: "try", label: "Let me try again" },
  ],
  practice: [
    { id: "easier", label: "Easier" },
    { id: "harder", label: "Harder" },
    { id: "steps", label: "Show steps" },
    { id: "check", label: "Add a check question" },
  ],
  coach: [
    { id: "script", label: "What to say" },
    { id: "steps", label: "Simple steps" },
    { id: "avoid", label: "What to avoid" },
    { id: "check", label: "Add a quick check" },
  ],
  plan: [
    { id: "shorter", label: "Make it shorter" },
    { id: "longer", label: "Make it longer" },
    { id: "daily", label: "Daily routine" },
    { id: "check", label: "Add checkpoints" },
  ],
};

function cn(...a) {
  return a.filter(Boolean).join(" ");
}

function getLevelsForCountry(country) {
  const c = String(country || "Other");
  return LEVELS_BY_COUNTRY[c] || LEVELS_BY_COUNTRY.Other;
}

function clampStr(v, max = 4000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
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
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

function inferActionFromMessage(message) {
  const s = String(message || "").toLowerCase();

  // “Check my answer” intent
  const checkSignals = [
    "check my answer",
    "is this correct",
    "is it correct",
    "am i right",
    "did i do it right",
    "is my answer correct",
    "is my answer right",
    "correct?",
    "right?",
  ];
  if (checkSignals.some((k) => s.includes(k))) return "check";

  // Common pattern: a question containing "=" (e.g. "is 10+5=15?")
  if (s.includes("=") && s.includes("?")) return "check";

  return null;
}

function lastAssistantMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.from === "elora" && messages[i]?.text) return messages[i].text;
  }
  return "";
}

export default function AssistantPage() {
  const router = useRouter();

  const [session, setSession] = useState(() => getSession());
  const verified = Boolean(session?.verified);
  const teacher = Boolean(isTeacher());
  const role = String(session?.role || "student");

  const [country, setCountry] = useState(() => String(session?.country || "Singapore"));
  const levelOptions = useMemo(() => getLevelsForCountry(country), [country]);
  const [level, setLevel] = useState(() => String(session?.level || levelOptions[0] || "Secondary 1"));

  const [showMore, setShowMore] = useState(() => {
    const s = getSession();
    return Boolean((s?.topic && String(s.topic).trim()) || (s?.subject && s.subject !== "General"));
  });

  const [subject, setSubject] = useState(() => String(session?.subject || "General"));
  const [topic, setTopic] = useState(() => String(session?.topic || ""));

  const [action, setAction] = useState(() => String(session?.action || "explain"));
  const [messages, setMessages] = useState(() => (Array.isArray(session?.messages) ? session.messages : []));
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

  useEffect(() => {
    // Keep level valid when country changes.
    if (!levelOptions.includes(level)) {
      setLevel(levelOptions[0] || "Secondary 1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      await refreshVerifiedFromServer();
      if (!mounted) return;
      const s = getSession();
      setSession(s);
      setMessages(Array.isArray(s?.messages) ? s.messages : []);
      setCountry(String(s?.country || "Singapore"));
      setLevel(String(s?.level || getLevelsForCountry(String(s?.country || "Singapore"))[0] || "Secondary 1"));
      setSubject(String(s?.subject || "General"));
      setTopic(String(s?.topic || ""));
      setAction(String(s?.action || "explain"));
    })();

    return () => {
      mounted = false;
    };
  }, []);

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

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (stickToBottom) el.scrollTop = el.scrollHeight;
  }, [messages, loading, stickToBottom]);

  function handleListScroll() {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    setStickToBottom(atBottom);
    setShowJump(!atBottom);
  }

  function jumpToLatest() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStickToBottom(true);
    setShowJump(false);
  }

  const allowedActions = useMemo(() => ACTIONS_BY_ROLE[role] || ACTIONS_BY_ROLE.student, [role]);
  const effectiveAction = allowedActions.includes(action) ? action : allowedActions[0];

  const hasAssistantAnswer = useMemo(
    () => messages.some((m) => m?.from === "elora" && String(m?.text || "").trim()),
    [messages]
  );

  const refinementChips = useMemo(
    () => REFINEMENT_CHIPS[effectiveAction] || REFINEMENT_CHIPS.explain,
    [effectiveAction]
  );

  async function callElora({ messageOverride, baseMessages, actionOverride }) {
    const currentSession = getSession();

    const userText = String(messageOverride || "").trim();
    if (!userText) return;

    setLoading(true);

    try {
      if (role === "educator" && !currentSession?.verified) {
        setVerifyGateOpen(true);
        setLoading(false);
        return;
      }

      const teacherOnly = new Set(["lesson", "worksheet", "assessment", "slides"]);
      if (teacherOnly.has(String(actionOverride || effectiveAction)) && !teacher) {
        setTeacherGateOpen(true);
        setLoading(false);
        return;
      }

      const payload = {
        role,
        action: String(actionOverride || effectiveAction),
        country,
        level,
        subject,
        topic,
        verified: Boolean(currentSession?.verified),
        teacher: Boolean(isTeacher()),
        attempt: role === "student" ? Math.min(3, attempt) : 0,
        message: userText,
        messages: Array.isArray(baseMessages) ? baseMessages : messages,
      };

      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => null);

      if (!r.ok) {
        const err = cleanAssistantText(data?.error || "Request failed.");
        if (String(err).toLowerCase().includes("verify")) setVerifyGateOpen(true);
        setMessages((prev) => [...prev, { from: "elora", text: err, ts: Date.now() }]);
        setLoading(false);
        return;
      }

      const out = cleanAssistantText(data?.reply || data?.text || "");
      setMessages((prev) => {
        const next = [...prev, { from: "elora", text: out, ts: Date.now() }];
        persistSessionPatch({ messages: next });
        saveServerChatIfVerified(currentSession, next);
        return next;
      });

      if (role === "student" && String(actionOverride || effectiveAction) === "check") {
        setAttempt((a) => Math.min(3, a + 1));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "elora", text: "Something went wrong. Try again.", ts: Date.now() },
      ]);
    } finally {
      setChatText("");
      setLoading(false);
    }
  }

  async function sendChat() {
    const trimmed = clampStr(chatText || "", 4000);
    if (!trimmed || loading) return;

    // Self-adapting: infer action from message (only when it’s very clear).
    const inferred = inferActionFromMessage(trimmed);
    const actionOverride = inferred && allowedActions.includes(inferred) ? inferred : null;

    // If we just switched into check mode, reset attempts for a cleaner experience.
    if (actionOverride === "check" && effectiveAction !== "check") {
      setAttempt(0);
      setAction("check");
      await persistSessionPatch({ action: "check" });
    }

    const currentSession = getSession();
    const userMsg = { from: "user", text: trimmed, ts: Date.now() };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    persistSessionPatch({
      messages: nextMessages,
      country,
      level,
      subject,
      topic,
      action: actionOverride || effectiveAction,
    });
    await saveServerChatIfVerified(currentSession, nextMessages);

    await callElora({ messageOverride: trimmed, baseMessages: nextMessages, actionOverride });
  }

  async function applyRefinement(chipId) {
    if (!hasAssistantAnswer || loading) return;

    const map = {
      simpler: "Make it simpler and more beginner-friendly.",
      example: "Add one clear example.",
      steps: "Show short, clear steps.",
      check: "Add one quick check question at the end.",
      diff: "Add differentiation: easier + harder extension.",
      timing: "Add timings with approximate minutes.",
      checks: "Add 2 quick checks for understanding.",
      resources: "Add a short list of materials/resources.",
      easier: "Make it easier while keeping the same topic.",
      harder: "Make it harder and add a challenge question.",
      ans: "Add an answer key at the end (only if appropriate).",
      format: "Change the format to be clearer for students.",
      marks: "Add marks per question.",
      rubric: "Add a short rubric/marking guide.",
      activity: "Add a short activity students can do.",
      examples: "Add more examples students can relate to.",
      hint: "Give a hint only (no final answer yet).",
      mistake: "Explain the most likely mistake and how to fix it.",
      try: "Ask me one guiding question and let me try again.",
      script: "Give me a short script of what to say to my child.",
      avoid: "Tell me what to avoid saying/doing.",
      longer: "Make it a bit more detailed but still simple.",
      daily: "Turn it into a simple daily routine.",
    };

    const refinement = map[chipId] || "Improve the answer.";
    const currentSession = getSession();

    const userMsg = { from: "user", text: refinement, ts: Date.now() };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    persistSessionPatch({ messages: nextMessages });
    await saveServerChatIfVerified(currentSession, nextMessages);

    await callElora({ messageOverride: refinement, baseMessages: nextMessages, actionOverride: effectiveAction });
  }

  async function exportLast(type) {
    const last = lastAssistantMessage(messages);
    if (!last) {
      setMessages((prev) => [
        ...prev,
        { from: "elora", text: "Nothing to export yet — ask me something first.", ts: Date.now() },
      ]);
      return;
    }

    if (!verified) {
      setVerifyGateOpen(true);
      setMessages((prev) => [
        ...prev,
        { from: "elora", text: "Exports are locked until your email is verified.", ts: Date.now() },
      ]);
      return;
    }

    try {
      const endpoint =
        type === "docx" ? "/api/export-docx" : type === "pptx" ? "/api/export-slides" : "/api/export-pdf";

      const title = type === "pptx" ? "Elora Slides" : type === "docx" ? "Elora Notes" : "Elora Export";

      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: cleanAssistantText(last) }),
      });

      const ct = String(r.headers.get("content-type") || "");
      if (!r.ok || ct.includes("application/json")) {
        const data = await r.json().catch(() => null);
        const msg = cleanAssistantText(data?.error || "Export failed.");
        setMessages((prev) => [...prev, { from: "elora", text: msg, ts: Date.now() }]);
        return;
      }

      const blob = await r.blob();
      if (!blob || blob.size === 0) {
        setMessages((prev) => [
          ...prev,
          { from: "elora", text: "Export failed: empty file returned.", ts: Date.now() },
        ]);
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
      setMessages((prev) => [
        ...prev,
        { from: "elora", text: "Export failed due to a network error. Try again.", ts: Date.now() },
      ]);
    }
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

  const roleLabel = ROLE_LABEL[role] || "Student";

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
                  {verified ? "Verified" : "Unverified"}
                </span>
              </div>

              {/* Role (display-only) */}
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Role</div>
                  <button
                    type="button"
                    onClick={() => router.push("/settings?focus=role")}
                    className="rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                  >
                    Change
                  </button>
                </div>

                <div className="mt-2 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 px-3 py-2">
                  <div className="text-sm font-extrabold text-slate-950 dark:text-white">{roleLabel}</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Elora adapts automatically. Change role in Settings only.
                  </div>
                </div>
              </div>

              {/* Country + level */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Country</div>
                  <select
                    value={country}
                    onChange={(e) => setCountry(String(e.target.value || "Singapore"))}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Level</div>
                  <select
                    value={level}
                    onChange={(e) => setLevel(String(e.target.value || levelOptions[0] || "Secondary 1"))}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    {levelOptions.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Minimal first, advanced later */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowMore((v) => !v)}
                  className="w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 px-3 py-2 text-left text-sm font-extrabold text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/35"
                >
                  {showMore ? "Hide advanced personalization" : "More personalization (optional)"}
                  <div className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                    Subject + topic improve accuracy when needed.
                  </div>
                </button>

                {showMore ? (
                  <div className="mt-3">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Subject</div>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(String(e.target.value || "General"))}
                      className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <div className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Topic (optional)</div>
                    <input
                      value={topic}
                      onChange={(e) => setTopic(String(e.target.value || ""))}
                      placeholder="e.g., Fractions, Photosynthesis, Essay structure…"
                      className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                ) : null}
              </div>

              {/* Action */}
              <div className="mt-5">
                <div className="text-sm font-bold text-slate-900 dark:text-white">What do you want to do?</div>
                <div className="mt-2 grid gap-2">
                  {allowedActions.map((a) => {
                    const teacherOnly = ["lesson", "worksheet", "assessment", "slides"].includes(a);
                    const locked = teacherOnly && !teacher;

                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          if (locked) {
                            setTeacherGateOpen(true);
                            return;
                          }
                          setAction(a);
                          if (a !== "check") setAttempt(0);
                          persistSessionPatch({ action: a });
                        }}
                        className={cn(
                          "rounded-xl border p-3 text-left transition",
                          effectiveAction === a
                            ? "border-indigo-500/40 bg-indigo-600/10"
                            : "border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 hover:bg-white dark:hover:bg-slate-950/35",
                          locked ? "opacity-70" : ""
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-extrabold text-slate-950 dark:text-white">
                            {ACTION_LABEL[a] || a}
                          </div>
                          {locked ? (
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-200">Locked</span>
                          ) : null}
                        </div>
                        {a === "check" && role === "student" ? (
                          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            Hints first. Final answer unlocks on attempt 3.
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            Elora will adapt if your message clearly asks for something else.
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const currentSession = getSession();
                    setMessages([]);
                    setAttempt(0);
                    await persistSessionPatch({ messages: [] });
                    await clearServerChatIfVerified(currentSession);
                  }}
                  className="mt-4 rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                >
                  Clear chat
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5 flex flex-col min-h-0 lg:h-[calc(100dvh-var(--elora-nav-offset)-64px)]">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">Elora Assistant</h2>
                  <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">{roleLabel}</span>
                    <span className="mx-2">•</span>
                    Personalized for {country} ({level})
                    {effectiveAction === "check" && role === "student" ? (
                      <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        Attempts: {Math.min(3, attempt)}/3
                      </span>
                    ) : null}
                  </div>
                  {effectiveAction === "check" && role === "student" ? (
                    <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                      Tip: If you include your working + answer, Elora can check it immediately.
                    </div>
                  ) : null}
                </div>

                {/* Refinement chips (only after at least 1 assistant answer) */}
                {hasAssistantAnswer ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                      Refine last answer
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end max-w-[520px]">
                      {refinementChips.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          disabled={loading}
                          onClick={() => applyRefinement(c.id)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-extrabold transition",
                            "border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40",
                            loading ? "opacity-60 cursor-wait" : ""
                          )}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {!verified ? (
                <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                  You’re not verified yet. You can use the Assistant, but exports and Educator mode are locked.
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

              <div ref={listRef} onScroll={handleListScroll} className="mt-4 flex-1 min-h-0 overflow-auto pr-1 relative">
                <div className="space-y-3">
                  {messages.map((m, idx) => {
                    const isUser = m.from === "user";
                    const display = cleanAssistantText(m.text);

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed border",
                          isUser
                            ? "ml-auto bg-indigo-600 text-white border-indigo-500/20"
                            : "mr-auto bg-white/80 dark:bg-slate-950/25 text-slate-900 dark:text-slate-100 border-slate-200/60 dark:border-white/10"
                        )}
                      >
                        <div className="whitespace-pre-wrap">{display}</div>
                      </div>
                    );
                  })}

                  {loading ? (
                    <div className="mr-auto max-w-[92%] rounded-2xl px-4 py-3 text-sm border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-700 dark:text-slate-200">
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

              {/* Export (locked until verified) */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-2">Export last answer:</div>

                <button
                  type="button"
                  onClick={() => exportLast("docx")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                    verified && hasAssistantAnswer
                      ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      : "border-slate-200/70 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!verified || !hasAssistantAnswer}
                  title={!verified ? "Verify to export" : !hasAssistantAnswer ? "Ask a question first" : "Export as .docx"}
                >
                  Docs (.docx)
                </button>

                <button
                  type="button"
                  onClick={() => exportLast("pptx")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                    verified && hasAssistantAnswer
                      ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      : "border-slate-200/70 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!verified || !hasAssistantAnswer}
                  title={!verified ? "Verify to export" : !hasAssistantAnswer ? "Ask a question first" : "Export as .pptx"}
                >
                  PowerPoint (.pptx)
                </button>

                <button
                  type="button"
                  onClick={() => exportLast("pdf")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                    verified && hasAssistantAnswer
                      ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      : "border-slate-200/70 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!verified || !hasAssistantAnswer}
                  title={!verified ? "Verify to export" : !hasAssistantAnswer ? "Ask a question first" : "Export as PDF"}
                >
                  Kami (PDF)
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    rows={2}
                    placeholder={
                      effectiveAction === "check" && role === "student"
                        ? "Paste your working + your final answer (e.g. “I got 15”)."
                        : "Ask Elora anything…"
                    }
                    className="flex-1 resize-none rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <button
                    type="button"
                    onClick={sendChat}
                    disabled={loading}
                    className={cn(
                      "rounded-full px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20",
                      loading ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
                    )}
                  >
                    Send
                  </button>
                </div>
                <div className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Enter to send • Shift+Enter for a new line
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verify gate modal */}
      <Modal open={verifyGateOpen} title="Verify to unlock Elora" onClose={() => setVerifyGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Educator mode and exports are locked behind verification.
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
            onClick={() => setVerifyGateOpen(false)}
            className="rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
          >
            Not now
          </button>
        </div>
      </Modal>

      {/* Teacher gate modal */}
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
            <div className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">{teacherGateStatus}</div>
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
