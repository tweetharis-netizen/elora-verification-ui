import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../components/Modal";
import {
  activateTeacher,
  getSession,
  isTeacher,
  refreshVerifiedFromServer,
  setGuest as storeGuest,
  setRole as storeRole,
} from "../lib/session";

const LEVELS = ["Primary", "Secondary", "JC/IB", "University", "Adult learning"];
const COUNTRIES = ["Singapore", "Malaysia", "UK", "US", "Australia", "Other"];
const SUBJECTS = ["General", "Math", "Science", "English", "History", "Geography", "Computing"];

const ROLE_LABEL = {
  student: "Student",
  parent: "Parent",
  educator: "Educator",
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

export default function AssistantPage() {
  const router = useRouter();

  const [session, setSession] = useState(() => getSession());
  const verified = Boolean(session?.verified);
  const teacher = Boolean(isTeacher());
  const guest = Boolean(session?.guest);

  const [role, setRole] = useState(() => session?.role || "student");
  const [country, setCountry] = useState(() => session?.country || "Singapore");
  const [level, setLevel] = useState(() => session?.level || "Secondary");
  const [subject, setSubject] = useState(() => session?.subject || "General");
  const [topic, setTopic] = useState(() => session?.topic || "");
  const [constraints, setConstraints] = useState("");
  const [responseStyle, setResponseStyle] = useState("standard");
  const [customStyleText, setCustomStyleText] = useState("");

  const [action, setAction] = useState(() => session?.action || "explain");
  const [messages, setMessages] = useState(() => session?.messages || []);
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

  const [dismissGuestBanner, setDismissGuestBanner] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);

  const ROLE_QUICK_ACTIONS = {
    educator: [
      { id: "explain", label: "Explain a concept", hint: "Clear, classroom-ready explanation + example" },
      { id: "custom", label: "Custom request", hint: "Ask anything as a teacher (tone, structure, etc.)" },
      { id: "lesson", label: "Plan a lesson", hint: "Objectives, timings, checks, differentiation" },
      { id: "worksheet", label: "Create worksheet", hint: "Student + Teacher versions, export-ready" },
      { id: "assessment", label: "Generate assessment", hint: "Marks + marking scheme" },
      { id: "slides", label: "Design slides", hint: "Deck outline + teacher notes" },
    ],
    student: [
      { id: "explain", label: "Explain it", hint: "Step-by-step, beginner friendly" },
      { id: "check", label: "Check my answer", hint: "Find mistakes + how to fix" },
      { id: "study", label: "Study plan", hint: "Simple plan, small steps" },
      { id: "custom", label: "Custom", hint: "Ask anything" },
    ],
    parent: [
      { id: "explain", label: "Explain to me", hint: "Plain language, no jargon" },
      { id: "coach", label: "How to help", hint: "What to say and do at home" },
      { id: "message", label: "Write a message", hint: "To teacher or school" },
      { id: "custom", label: "Custom", hint: "Ask anything" },
    ],
  };

  useEffect(() => {
    const first = ROLE_QUICK_ACTIONS[role]?.[0]?.id || "explain";
    setAction(first);
    setAttempt(0);
    storeRole(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const guestBlocked = useMemo(() => {
    if (!guest) return false;
    return ["lesson", "worksheet", "assessment", "slides"].includes(action);
  }, [guest, action]);

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

  async function restoreServerChatIfVerified() {
    try {
      const currentSession = getSession();
      if (!currentSession?.verified) return;
      const r = await fetch("/api/chat/get", { cache: "no-store" });
      const data = await r.json().catch(() => null);
      const serverMsgs = Array.isArray(data?.messages) ? data.messages : null;
      if (!serverMsgs) return;

      setMessages(serverMsgs);
      await persistSessionPatch({ messages: serverMsgs });
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      await refreshVerifiedFromServer();
      if (!mounted) return;

      const s = getSession();
      setSession(s);

      if (s?.verified) {
        await restoreServerChatIfVerified();
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function callElora({ messageOverride, baseMessages }) {
    const currentSession = getSession();

    const userText = String(messageOverride || chatText || "").trim();
    if (!userText) return;

    setLoading(true);

    try {
      if (role === "educator" && !currentSession?.verified) {
        setVerifyGateOpen(true);
        setLoading(false);
        return;
      }

      if (guestBlocked) {
        setTeacherGateOpen(true);
        setLoading(false);
        return;
      }

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
        const err = data?.error || "Request failed.";
        if (String(err).includes("verify")) setVerifyGateOpen(true);
        setMessages((prev) => [...prev, { from: "elora", text: String(err), ts: Date.now() }]);
        setLoading(false);
        return;
      }

      const out = cleanAssistantText(data?.reply || data?.text || data?.answer || "");
      setMessages((prev) => {
        const next = [...prev, { from: "elora", text: out, ts: Date.now() }];
        persistSessionPatch({ messages: next });
        saveServerChatIfVerified(currentSession, next);
        return next;
      });

      if (role === "student") {
        setAttempt((a) => a + 1);
      }
    } catch {
      setMessages((prev) => [...prev, { from: "elora", text: "Something went wrong. Try again.", ts: Date.now() }]);
    } finally {
      setChatText("");
      setLoading(false);
    }
  }

  async function sendChat() {
    const trimmed = String(chatText || "").trim();
    if (!trimmed || loading) return;

    const currentSession = getSession();
    const userMsg = { from: "user", text: trimmed, ts: Date.now() };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    persistSessionPatch({ messages: nextMessages });
    await saveServerChatIfVerified(currentSession, nextMessages);

    await callElora({ messageOverride: trimmed, baseMessages: nextMessages });
  }

  async function exportLast(type) {
    const last = [...messages].reverse().find((m) => m?.from === "elora");
    if (!last?.text) {
      setMessages((prev) => [...prev, { from: "elora", text: "Nothing to export yet — ask me something first.", ts: Date.now() }]);
      return;
    }

    if (!verified) {
      setVerifyGateOpen(true);
      setMessages((prev) => [...prev, { from: "elora", text: "Exports are locked until your email is verified.", ts: Date.now() }]);
      return;
    }

    try {
      const endpoint =
        type === "docx" ? "/api/export-docx" : type === "pptx" ? "/api/export-slides" : "/api/export-pdf";

      const content = cleanAssistantText(last.text);
      const title =
        type === "pptx" ? "Elora Slides" : type === "docx" ? "Elora Notes" : "Elora Export";

      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const ct = String(r.headers.get("content-type") || "");

      // If server returned JSON, it's very likely an error (e.g. { error: "not_verified" })
      if (!r.ok || ct.includes("application/json")) {
        let err = `Export failed (HTTP ${r.status}).`;
        let data = null;
        try {
          data = await r.json();
        } catch {}

        const code = String(data?.error || data?.message || "").trim();

        if (r.status === 403 || code === "not_verified") {
          setVerifyGateOpen(true);
          err = "Export blocked: your session isn’t verified on the server. Re-verify to unlock exports.";
        } else if (code) {
          err = `Export failed: ${code}`;
        }

        setMessages((prev) => [...prev, { from: "elora", text: err, ts: Date.now() }]);
        return;
      }

      const blob = await r.blob();
      if (!blob || blob.size === 0) {
        setMessages((prev) => [...prev, { from: "elora", text: "Export failed: empty file returned.", ts: Date.now() }]);
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
      setMessages((prev) => [...prev, { from: "elora", text: "Export failed due to a network error. Try again.", ts: Date.now() }]);
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
    const currentSession = getSession();

    const userMsg = { from: "user", text: refinement, ts: Date.now() };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    persistSessionPatch({ messages: nextMessages });
    await saveServerChatIfVerified(currentSession, nextMessages);

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

  const refinementChips = useMemo(() => REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.explain, [action]);

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
                <h1 className="text-2xl font-black text-slate-950 dark:text-white">Setup</h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border",
                    verified
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", verified ? "bg-emerald-400" : "bg-amber-400")} />
                  {verified ? "Verified" : guest ? "Guest" : "Unverified"}
                </span>
              </div>

              {/* Role */}
              <div className="mt-5">
                <div className="text-sm font-bold text-slate-900 dark:text-white">Role</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["student", "parent", "educator"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        if (r === "educator" && !verified) {
                          setVerifyGateOpen(true);
                          return;
                        }
                        setRole(r);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-extrabold transition",
                        role === r
                          ? "border-indigo-500/40 bg-indigo-600/10 text-indigo-800 dark:text-indigo-200"
                          : "border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
                      )}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
                {role === "educator" && !verified ? (
                  <div className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-200">
                    Educator mode requires verification.
                  </div>
                ) : null}
              </div>

              {/* Country + level */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Country</div>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
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
                    onChange={(e) => setLevel(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject + topic */}
              <div className="mt-5">
                <div className="text-sm font-bold text-slate-900 dark:text-white">Subject</div>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
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
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Fractions, Photosynthesis, Essay structure…"
                  className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Action */}
              <div className="mt-5">
                <div className="text-sm font-bold text-slate-900 dark:text-white">Action</div>
                <div className="mt-2 grid gap-2">
                  {(ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.student).map((a) => {
                    const teacherOnly = ["lesson", "worksheet", "assessment", "slides"].includes(a.id);
                    const disabled = teacherOnly && !teacher;

                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          if (disabled) {
                            setTeacherGateOpen(true);
                            return;
                          }
                          setAction(a.id);
                        }}
                        className={cn(
                          "rounded-xl border p-3 text-left transition",
                          action === a.id
                            ? "border-indigo-500/40 bg-indigo-600/10"
                            : "border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 hover:bg-white dark:hover:bg-slate-950/35",
                          disabled ? "opacity-70" : ""
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-extrabold text-slate-950 dark:text-white">{a.label}</div>
                          {disabled ? (
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-200">Locked</span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{a.hint}</div>
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
                    {country} • {level} • {subject} • <span className="font-semibold">{role}</span>
                    {role === "student" ? (
                      <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        Attempts: {Math.min(3, attempt)}/3
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {refinementChips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={loading || messages.length === 0}
                      onClick={() => applyRefinement(c.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-extrabold transition",
                        "border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40",
                        loading || messages.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {guest && !dismissGuestBanner ? (
                <div className="mt-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">Guest preview</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        Educator mode and exports require verification. You&apos;re previewing Elora in Student mode.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDismissGuestBanner(true)}
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
                      onClick={() => {
                        storeGuest(true);
                        const s = getSession();
                        setSession(s);
                      }}
                      className="rounded-full border border-slate-200/70 dark:border-white/10 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                    >
                      Stay in preview
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
                            : "mr-auto bg-white/80 dark:bg-slate-950/25 text-slate-900 dark:text-slate-100 border-slate-200/60 dark:border-white/10 relative group"
                        )}
                      >
                        {!isUser ? (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(display, idx)}
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

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-2">Export last answer:</div>

                <button
                  type="button"
                  onClick={() => exportLast("docx")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                    verified
                      ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      : "border-slate-200/70 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!verified}
                  title={!verified ? "Verify to export" : "Export as .docx"}
                >
                  Docs (.docx)
                </button>

                <button
                  type="button"
                  onClick={() => exportLast("pptx")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                    verified
                      ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      : "border-slate-200/70 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!verified}
                  title={!verified ? "Verify to export" : "Export as .pptx"}
                >
                  PowerPoint (.pptx)
                </button>

                <button
                  type="button"
                  onClick={() => exportLast("pdf")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                    verified
                      ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      : "border-slate-200/70 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!verified}
                  title={!verified ? "Verify to export" : "Export as PDF (Kami-friendly)"}
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
                    placeholder="Ask Elora to refine, explain, or guide your next attempt…"
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
          Educator mode and exports are locked behind verification. You can still preview as a limited guest.
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
            Continue as guest
          </button>
        </div>
      </Modal>

      {/* Teacher gate modal */}
      <Modal open={teacherGateOpen} title="Unlock Teacher Tools" onClose={() => setTeacherGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Lesson plans, worksheets, assessments, and slides are locked behind a Teacher Invite Code. This keeps teacher-only tools from being misused.
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
