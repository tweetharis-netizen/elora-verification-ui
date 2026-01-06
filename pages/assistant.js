import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../components/Modal";
import {
  activateTeacher,
  getResolvedTheme,
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
    { id: "answers", label: "Add answers" },
    { id: "rubric", label: "Add marking guide" },
  ],
  assessment: [
    { id: "shorter", label: "Shorter" },
    { id: "harder", label: "Harder" },
    { id: "markscheme", label: "Add marking scheme" },
    { id: "variants", label: "Add variants" },
  ],
  slides: [
    { id: "outline", label: "Tighter outline" },
    { id: "hooks", label: "Add hooks" },
    { id: "examples", label: "More examples" },
    { id: "notes", label: "Teacher notes" },
  ],
  custom: [
    { id: "shorter", label: "Shorter" },
    { id: "clearer", label: "Clearer" },
    { id: "more-steps", label: "More steps" },
    { id: "example", label: "Add example" },
  ],
};

const RESPONSE_STYLE_OPTIONS = [
  { id: "standard", label: "Standard" },
  { id: "quick", label: "Quick" },
  { id: "detailed", label: "Detailed" },
  { id: "custom", label: "Custom" },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function stripInternalTags(text) {
  if (!text) return "";
  return text
    .replace(/<ELORA_ARTIFACT_JSON>[\s\S]*?<\/ELORA_ARTIFACT_JSON>/g, "")
    .replace(/<ELORA_ARTIFACT_JSON>[\s\S]*$/g, "")
    .replace(/<\/?[^>]+>/g, "")
    .trim();
}

function cleanAssistantText(text) {
  // Goal: keep output readable for teachers/judges (no # headings, no **bold**, no code fences).
  let t = stripInternalTags(text || "");

  // Remove fenced code blocks
  t = t.replace(/```[\s\S]*?```/g, "");

  // Remove inline backticks
  t = t.replace(/`+/g, "");

  // Remove Markdown headings (#, ##, ### ...)
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, "");

  // Remove bold/italic markers
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");
  t = t.replace(/_([^_]+)_/g, "$1");

  // Remove blockquote marker
  t = t.replace(/^\s*>\s?/gm, "");

  // Links [text](url) => text
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

  // Remove stray markdown horizontal rules
  t = t.replace(/^\s*([-*_])\1\1+\s*$/gm, "");

  // Collapse excess blank lines
  t = t.replace(/\n{3,}/g, "\n\n").trim();

  return t;
}

export default function AssistantPage() {
  const router = useRouter();

  const [session, setSession] = useState(() => getSession());
  useEffect(() => {
    setSession(getSession());
  }, []);

  // Sync cookie truth once on load so verified/teacher state is consistent.
  useEffect(() => {
    refreshVerifiedFromServer?.().then(() => setSession(getSession())).catch(() => {});
  }, []);

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

  const theme = useMemo(() => getResolvedTheme(), []);
  const listRef = useRef(null);

  // Chat UX: show a “Jump to latest” button if user scrolls up.
  const [stickToBottom, setStickToBottom] = useState(true);
  const [showJump, setShowJump] = useState(false);

  function scrollToBottom() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  function onChatScroll() {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 120; // px threshold
    setStickToBottom(atBottom);
    setShowJump(!atBottom);
  }

  const ROLE_QUICK_ACTIONS = {
    educator: [
      { id: "explain", label: "Explain a concept", hint: "Clear, classroom-ready explanation + example" },
      { id: "custom", label: "Custom request", hint: "Ask anything as a teacher (tone, structure, etc.)" },

      // Teacher-only tools (locked until invite code is activated)
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
  }, [role]);

  useEffect(() => {
    storeRole(role);
  }, [role]);

  const guestBlocked = useMemo(() => {
    if (!guest) return false;
    return ["lesson", "worksheet", "assessment", "slides"].includes(action);
  }, [guest, action]);

  useEffect(() => {
    // Keep scroll pinned ONLY if the user is already near the bottom.
    if (!stickToBottom) return;
    scrollToBottom();
  }, [messages, loading, stickToBottom]);

  async function persistSessionPatch(patch) {
    try {
      await fetch("/api/session/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      // non-blocking
    }
  }

  async function callElora({ messageOverride = "" } = {}) {
    if (!verified && !guest) {
      setVerifyGateOpen(true);
      return;
    }

    const teacherOnly = ["lesson", "worksheet", "assessment", "slides"].includes(action);
    if (teacherOnly && !teacher) {
      setTeacherGateOpen(true);
      return;
    }

    if (guestBlocked) {
      setMessages((m) => [
        ...m,
        { from: "elora", text: "Guest mode is limited — verify to unlock teacher tools and exports." },
      ]);
      return;
    }

    const lastUser = messageOverride || chatText.trim();
    if (!lastUser) return;

    setLoading(true);

    try {
      const nextAttempt = role === "student" ? attempt + 1 : 0;

      const payload = {
        role,
        country,
        level,
        subject,
        topic: topic || "General",
        action,
        message: lastUser,
        options: constraints,
        guest,
        attempt: role === "student" ? nextAttempt : 0,
        responseStyle,
        customStyle: responseStyle === "custom" ? customStyleText : "",
        teacherInvite: session?.teacherCode || "",
      };

      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "AI request failed.");

      const clean = cleanAssistantText(data.reply || "");
      setMessages((m) => [...m, { from: "elora", text: clean }]);

      if (role === "student") setAttempt(nextAttempt);

      // Persist key state
      persistSessionPatch({
        role,
        country,
        level,
        subject,
        topic,
        action,
        messages: [...messages, { from: "user", text: lastUser }, { from: "elora", text: clean }],
      });
    } catch (e) {
      setMessages((m) => [
        ...m,
        { from: "elora", text: `Error: ${String(e?.message || e)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function exportLast(kind) {
    if (!verified) {
      setVerifyGateOpen(true);
      return;
    }

    const last = [...messages].reverse().find((m) => m.from === "elora")?.text || "";
    const content = cleanAssistantText(last);
    if (!content.trim()) return;

    const title = `${subject} - ${topic || "Elora"}`.slice(0, 80);

    const endpoint =
      kind === "docx"
        ? "/api/export-docx"
        : kind === "pptx"
        ? "/api/export-slides"
        : "/api/export-pdf";

    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => null);
        throw new Error(data?.error || "Export failed.");
      }

      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const ext = kind === "pptx" ? "pptx" : kind === "docx" ? "docx" : "pdf";
      a.download = `${
        title.replace(/[^a-z0-9 _-]/gi, "").replace(/\s+/g, "-").slice(0, 60) || "Elora-Export"
      }.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { from: "elora", text: `Export error: ${String(e?.message || e)}` },
      ]);
    }
  }

  async function sendChat() {
    const msg = chatText.trim();
    if (!msg) return;

    if (!verified && !guest) {
      setVerifyGateOpen(true);
      return;
    }

    const teacherOnly = ["lesson", "worksheet", "assessment", "slides"].includes(action);
    if (teacherOnly && !teacher) {
      setTeacherGateOpen(true);
      return;
    }

    setChatText("");
    setMessages((m) => [...m, { from: "user", text: msg }]);
    await callElora({ messageOverride: msg });
  }

  async function applyRefinement(chipId) {
    const map = {
      simpler: "Make it simpler and more beginner-friendly.",
      clearer: "Make it clearer and easier to follow.",
      example: "Add one clear example.",
      steps: "Show steps with short, numbered points.",
      check: "Add 2 quick check questions at the end.",
      diff: "Add differentiation for mixed abilities.",
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

    setMessages((m) => [...m, { from: "user", text: refinement }]);
    await callElora({ messageOverride: refinement });
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

      // Sync from server so UI always reflects cookie truth.
      await refreshVerifiedFromServer();
      setSession(getSession());

      setTeacherGateStatus("Teacher tools unlocked ✅");
      return true;
    } catch {
      setTeacherGateStatus("Could not validate right now. Try again.");
      return false;
    }
  }

  function resetTutorAttempts() {
    setAttempt(0);
  }

  const refinementChips = useMemo(() => {
    return REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.explain;
  }, [action]);

  return (
    <>
      <Head>
        <title>Elora Assistant</title>
      </Head>

      {/* IMPORTANT: Navbar is rendered globally in _app.js. Do not render it here. */}

      <div className="elora-page">
        <div className="elora-container">
          <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
            {/* LEFT */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-950 dark:text-white">
                  Setup
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border",
                    verified
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                      : "border-slate-400/30 bg-slate-500/10 text-slate-700 dark:text-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      verified ? "bg-emerald-400" : "bg-slate-400"
                    )}
                  />
                  {verified ? "Verified" : guest ? "Guest" : "Not verified"}
                </span>
              </div>

              {/* Role */}
              <div className="mt-5">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Role
                </div>
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
                        "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
                        role === r
                          ? "border-indigo-500/50 bg-indigo-600/10 text-indigo-700 dark:text-indigo-200"
                          : "border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      )}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>

                {role === "educator" && verified && !teacher ? (
                  <div className="mt-3 rounded-xl border border-slate-400/30 bg-slate-500/10 px-3 py-2 text-xs text-slate-900 dark:text-slate-200">
                    Teacher tools are locked until you enter a Teacher Invite Code in{" "}
                    <button
                      type="button"
                      onClick={() => setTeacherGateOpen(true)}
                      className="underline font-extrabold"
                    >
                      Unlock Teacher Tools
                    </button>
                    .
                  </div>
                ) : null}
              </div>

              {/* Region / Level / Subject */}
              <div className="mt-6 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold text-slate-900 dark:text-white">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="elora-input mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                      Level
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="elora-input mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="elora-input mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">
                    Topic (optional)
                  </label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="e.g., Fractions, Photosynthesis, Loops in Python"
                  />
                </div>
              </div>

              {/* Constraints */}
              <div className="mt-5">
                <label className="text-sm font-bold text-slate-900 dark:text-white">
                  Constraints (optional)
                </label>
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="e.g., Keep under 120 words; Use Singapore syllabus; Include 1 example."
                />
              </div>

              {/* Response style */}
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Response style</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Optional</div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {RESPONSE_STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setResponseStyle(opt.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-extrabold transition",
                        responseStyle === opt.id
                          ? "border-indigo-500/50 bg-indigo-600/10 text-indigo-700 dark:text-indigo-200"
                          : "border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {responseStyle === "custom" ? (
                  <textarea
                    value={customStyleText}
                    onChange={(e) => setCustomStyleText(e.target.value)}
                    rows={2}
                    placeholder="e.g., Use short paragraphs, include 1 example, and end with a 1-sentence summary."
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                ) : null}
              </div>

              {/* Quick actions */}
              <div className="mt-6">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Quick actions
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {ROLE_QUICK_ACTIONS[role].map((a) => {
                    const teacherOnly = ["lesson", "worksheet", "assessment", "slides"].includes(a.id);
                    const disabled = (teacherOnly && !teacher) || (guest && teacherOnly);
                    const active = action === a.id;

                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          if (disabled) {
                            if (!verified) {
                              setVerifyGateOpen(true);
                            } else if (!teacher) {
                              setTeacherGateOpen(true);
                            }
                            return;
                          }
                          setAction(a.id);
                          resetTutorAttempts();
                        }}
                        disabled={disabled}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition",
                          active
                            ? "border-indigo-500/50 bg-indigo-600/10 shadow-lg shadow-indigo-500/10"
                            : "border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 hover:bg-white dark:hover:bg-slate-950/40",
                          disabled ? "opacity-50 cursor-not-allowed" : ""
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-extrabold text-slate-950 dark:text-white">
                            {a.label}
                          </div>
                          {disabled ? (
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              Locked
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {a.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setAttempt(0);
                    setChatText("");
                    persistSessionPatch({ messages: [] });
                    setStickToBottom(true);
                    setShowJump(false);
                  }}
                  className="mt-4 w-full rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40 transition"
                >
                  Clear chat
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5 flex flex-col lg:min-h-[680px] relative">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                    Elora Assistant
                  </h2>
                  <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {country} • {level} • {subject} •{" "}
                    <span className="font-semibold">{role}</span>
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

              {showJump ? (
                <button
                  type="button"
                  onClick={() => {
                    setStickToBottom(true);
                    scrollToBottom();
                  }}
                  className="absolute right-6 top-[92px] z-10 rounded-full border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-3 py-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/60 transition"
                >
                  Jump to latest ↓
                </button>
              ) : null}

              <div
                ref={listRef}
                onScroll={onChatScroll}
                className="mt-4 flex-1 overflow-auto pr-1"
              >
                <div className="space-y-3">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed border",
                        m.from === "user"
                          ? "ml-auto bg-indigo-600 text-white border-indigo-500/20"
                          : "mr-auto bg-white/80 dark:bg-slate-950/25 text-slate-900 dark:text-slate-100 border-slate-200/60 dark:border-white/10"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{cleanAssistantText(m.text)}</div>
                    </div>
                  ))}

                  {loading ? (
                    <div className="mr-auto max-w-[92%] rounded-2xl px-4 py-3 text-sm border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-700 dark:text-slate-200">
                      Thinking…
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-2">
                  Export last answer:
                </div>

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

              <div className="mt-4 flex items-center gap-2">
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChat();
                  }}
                  placeholder="Ask Elora to refine, explain, or guide your next attempt…"
                  className="flex-1 rounded-full border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
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
            </div>
          </div>
        </div>
      </div>

      {/* Verify gate modal */}
      <Modal
        open={verifyGateOpen}
        title="Verify to unlock Elora"
        onClose={() => setVerifyGateOpen(false)}
      >
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
              setSession(getSession());
              setVerifyGateOpen(false);
            }}
            className="rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
          >
            Continue as guest
          </button>
        </div>
      </Modal>

      {/* Teacher gate modal */}
      <Modal
        open={teacherGateOpen}
        title="Unlock Teacher Tools"
        onClose={() => setTeacherGateOpen(false)}
      >
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Lesson plans, worksheets, assessments, and slides are locked behind a Teacher Invite Code.
          This keeps teacher-only tools from being misused.
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold text-slate-900 dark:text-white">
            Teacher Invite Code
          </label>
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
              if (ok) {
                setTeacherGateOpen(false);
              }
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
