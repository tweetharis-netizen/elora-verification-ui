import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Modal from "../components/Modal";
import RoleIllustration from "../components/RoleIllustration";
import {
  activateTeacher,
  getSession,
  isTeacher,
  setGuest as storeGuest,
  setRole as storeRole,
} from "../lib/session";

const COUNTRY_OPTIONS = [
  "Singapore",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "India",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Japan",
  "South Korea",
  "China",
  "Other",
];

const LEVEL_BY_COUNTRY = {
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
    "JC 1",
    "JC 2",
    "Poly / ITE",
    "University",
    "Other",
  ],
  "United States": [
    "Elementary (K-5)",
    "Middle School (6-8)",
    "High School (9-12)",
    "College",
    "Other",
  ],
  "United Kingdom": ["Key Stage 1", "Key Stage 2", "Key Stage 3", "GCSE", "A-Levels", "University", "Other"],
  Australia: ["Primary", "Secondary", "Senior Secondary", "University", "Other"],
  Canada: ["Elementary", "Middle School", "High School", "College/University", "Other"],
  India: [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
    "University",
    "Other",
  ],
  Other: ["Primary / Elementary", "Middle School", "High School", "Pre-University", "University", "Other"],
};

const SUBJECT_OPTIONS = ["Math", "Science", "English", "History", "Geography", "Computer Science", "Other"];

const CUSTOM_TOPIC_VALUE = "__custom__";

const TOPIC_PRESETS_BY_SUBJECT = {
  // Keep topics "fixed" (preset-only) for a fast, judge-friendly demo.
  // Users can still pick "Custom…" to type anything.
  Math: [
    "Fractions",
    "Mixed numbers",
    "Decimals",
    "Percentages",
    "Ratio & proportion",
    "Algebra basics",
    "Geometry",
    "Word problems",
    "Data & graphs",
  ],
  Science: [
    "Scientific method",
    "Cells & body systems",
    "Forces & motion",
    "Energy",
    "Electricity & circuits",
    "Matter (solids/liquids/gases)",
    "Ecosystems",
    "Earth & space",
  ],
  English: [
    "Grammar",
    "Vocabulary",
    "Reading comprehension",
    "Summary writing",
    "Argument / persuasive writing",
    "Narrative writing",
    "Editing (clarity + flow)",
  ],
  History: ["Cause & effect", "Timelines", "Source analysis", "Compare & contrast", "Essay planning"],
  Geography: ["Maps & directions", "Climate", "Landforms", "Human geography", "Case study writing"],
  "Computer Science": ["Problem solving", "Algorithms (basic)", "Loops & conditionals", "Debugging", "Project planning"],
  Other: ["Homework help", "Study plan", "Explain a concept", "Check my answer", "Improve my writing"],
};

const ROLE_QUICK_ACTIONS = {
  educator: [
    { id: "lesson", title: "Plan a lesson", subtitle: "Clear outline + questions + checks" },
    { id: "rubric", title: "Make a rubric", subtitle: "Simple criteria teachers can use" },
    { id: "assessment", title: "Generate a quiz", subtitle: "Question set + answer key" },
    { id: "slides", title: "Explain for slides", subtitle: "Short, teachable points" },
  ],
  student: [
    { id: "tutor", title: "Tutor me", subtitle: "You attempt first → I guide step-by-step" },
    { id: "check", title: "Check my answer", subtitle: "Spot mistakes + fix them kindly" },
    { id: "explain", title: "Explain a concept", subtitle: "Simple, beginner-friendly explanation" },
    { id: "practice", title: "Practice questions", subtitle: "New questions to try" },
  ],
  parent: [
    { id: "homework", title: "Help with homework", subtitle: "Teach calmly, no scary symbols" },
    { id: "plan", title: "Study plan", subtitle: "Routine + targets + motivation" },
    { id: "explain", title: "Explain a topic", subtitle: "Simple and reassuring" },
    { id: "message", title: "Write a note", subtitle: "Message to teacher / school" },
  ],
};

const REFINEMENT_CHIPS = {
  lesson: ["Simplify", "More activities", "More assessment", "Differentiation", "Shorter"],
  rubric: ["Simplify", "More detailed", "Add examples", "Student-friendly language", "Shorter"],
  assessment: ["Easier", "Harder", "More questions", "Add explanations", "Shorter"],
  slides: ["Shorter", "More examples", "More visuals described", "Add analogies", "Shorter deck"],
  tutor: ["Smaller steps", "Give me a hint", "Show an example", "Harder", "Easier"],
  check: ["Be stricter", "Explain why", "Show a correct example", "Shorter", "More detailed"],
  explain: ["Give me a hint", "Explain differently", "Another similar question", "Harder", "Easier"],
  practice: ["Easier", "Harder", "More questions", "Show answers", "No answers yet"],
  homework: ["Simplify", "More reassurance", "More examples", "Shorter", "More detailed"],
  plan: ["Simplify", "More ambitious", "More flexible", "Shorter", "Include weekends"],
  message: ["More formal", "More friendly", "Shorter", "More detailed", "Add context"],
  custom: ["Shorter", "More detailed", "More examples", "Make it student-friendly", "Make it teacher-friendly"],
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function stripInternalTags(text) {
  if (!text) return "";
  // Remove common internal tags if the model ever emits them.
  return String(text)
    .replace(/<analysis>[\s\S]*?<\/analysis>/gi, "")
    .replace(/<internal>[\s\S]*?<\/internal>/gi, "")
    .trim();
}

function formatRoleLabel(role) {
  if (role === "educator") return "Educator";
  if (role === "student") return "Student";
  if (role === "parent") return "Parent";
  return "Student";
}

export default function Assistant() {
  const session = getSession();
  const [role, setRole] = useState(session.role || "student");
  const [guest, setGuest] = useState(Boolean(session.guest));
  const teacher = isTeacher();

  // On the Assistant page, we keep the *chat* scrollable and avoid page-level scroll.
  // This makes long conversations feel like a real app (chat scrolls, layout stays stable).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Mobile browsers can lie about 100vh (address bar). We use a JS-updated --elora-vh for stability.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--elora-vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  // UI state
  const [country, setCountry] = useState(session.country || "Singapore");
  const levelOptions = useMemo(() => LEVEL_BY_COUNTRY[country] || LEVEL_BY_COUNTRY.Other, [country]);
  const [level, setLevel] = useState(session.level || levelOptions[0]);

  const [subject, setSubject] = useState(session.subject || "Math");

  const topicPresets = useMemo(() => {
    return TOPIC_PRESETS_BY_SUBJECT[subject] || TOPIC_PRESETS_BY_SUBJECT.Other;
  }, [subject]);

  const [topicPreset, setTopicPreset] = useState(() => TOPIC_PRESETS_BY_SUBJECT.Math?.[0] || "Fractions");
  const [topicCustom, setTopicCustom] = useState("");

  // If the subject changes, keep the topic selection valid.
  // (Otherwise the <select> can end up with a value that's not in the new list.)
  useEffect(() => {
    const presets = TOPIC_PRESETS_BY_SUBJECT[subject] || TOPIC_PRESETS_BY_SUBJECT.Other || [];
    // If the user is in Custom mode, keep them there.
    if (topicPreset === CUSTOM_TOPIC_VALUE) return;
    if (!presets.includes(topicPreset)) {
      setTopicPreset(presets[0] || CUSTOM_TOPIC_VALUE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  const isCustomTopic = topicPreset === CUSTOM_TOPIC_VALUE;
  const topicEffective = isCustomTopic ? (topicCustom.trim() || "Custom topic") : topicPreset;

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [constraints, setConstraints] = useState({
    avoidLatex: true,
    friendlyTone: true,
    concise: false,
    showSteps: true,
    includeChecks: true,
  });

  const [action, setAction] = useState(() => ROLE_QUICK_ACTIONS[role]?.[0]?.id || "explain");
  const [customGoal, setCustomGoal] = useState("");

  const [messages, setMessages] = useState(() => {
    const intro =
      role === "educator"
        ? "Hi — I’m Elora. Tell me what you’re teaching, and I’ll help you plan and explain clearly."
        : role === "parent"
        ? "Hi — I’m Elora. Tell me what your child is learning, and I’ll help in a calm, simple way."
        : "Hi — I’m Elora. Tell me what you’re working on, and we’ll solve it step-by-step.";
    return [{ from: "elora", text: intro }];
  });

  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(false);

  // Tutor attempt counter (student mode)
  const [attempt, setAttempt] = useState(0);
  const attemptRef = useRef(0);
  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  // Keep level valid when country changes
  useEffect(() => {
    if (!levelOptions.includes(level)) setLevel(levelOptions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, levelOptions.join("|")]);

  // When role changes, reset action + attempt
  useEffect(() => {
    const first = ROLE_QUICK_ACTIONS[role]?.[0]?.id || "explain";
    setAction(first);
    setAttempt(0);
  }, [role]);

  // Persist prefs locally (not auth)
  useEffect(() => {
    storeRole(role);
  }, [role]);

  useEffect(() => {
    storeGuest(guest);
  }, [guest]);

  const teacherGateNeeded =
    role === "educator" && !teacher && !guest; // educator needs teacher unless guest

  const guestBlocked =
    role === "educator" &&
    guest &&
    (action === "assessment" || action === "slides"); // keep guest educator restricted

  const chips = useMemo(() => REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.custom, [action]);

  function resetTutorAttempts() {
    setAttempt(0);
  }

  // --- Chat scroll: only the chat panel scrolls, not the whole page ---
  const chatScrollRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  function scrollToBottom() {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  function onChatScroll() {
    const el = chatScrollRef.current;
    if (!el) return;
    const threshold = 140;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsNearBottom(atBottom);
  }

  useEffect(() => {
    // Auto-follow only if user is already near the bottom.
    if (isNearBottom) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, loading, isNearBottom]);

  // Teacher invite modal
  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteErr, setInviteErr] = useState("");

  async function submitInvite() {
    setInviteErr("");
    const code = inviteCode.trim();
    if (!code) {
      setInviteErr("Enter a code.");
      return;
    }
    const res = await activateTeacher(code);
    if (!res.ok) {
      setInviteErr(res.message || "Code failed. Try again.");
      return;
    }
    setVerifyGateOpen(false);
    setMessages((m) => [
      ...m,
      { from: "elora", text: "Teacher access enabled. Educator tools unlocked." },
    ]);
  }

  function buildSystemText() {
    // This is a small local “guardrail” prompt. The real model prompt is in /pages/api/assistant.js
    // We keep it here to help the UI stay consistent even if the backend changes later.
    const common =
      "You are Elora, a calm education assistant. Explain like a kind teacher. " +
      "Avoid raw LaTeX unless the user explicitly asks for LaTeX. " +
      "Use plain math like '5 divided by 4 = 1.25'. " +
      "Keep steps short. Ask a quick check question when helpful.";
    const roleLine =
      role === "educator"
        ? "The user is a teacher. Provide classroom-ready answers: objectives, steps, checks for understanding."
        : role === "parent"
        ? "The user is a parent. Be reassuring, explain simply, suggest how to help at home."
        : "The user is a student. Encourage them to try first, then guide. Don't dump the full solution immediately for tutoring tasks.";
    return `${common}\n${roleLine}`;
  }

  function buildGoalText() {
    if (customGoal.trim()) return customGoal.trim();
    const map = {
      lesson: "Plan a lesson in a clear, teacher-friendly way.",
      rubric: "Create a simple rubric.",
      assessment: "Generate a short quiz and answer key.",
      slides: "Explain as bullet points suitable for slides.",
      tutor: "Tutor the student: ask them to attempt first, then guide step-by-step.",
      check: "Check the student's answer: spot mistakes kindly and show the corrected approach.",
      explain: "Explain the concept in a beginner-friendly way.",
      practice: "Generate practice questions tailored to the level.",
      homework: "Help with homework in a calm, reassuring way.",
      plan: "Create a study plan with realistic steps and motivation.",
      message: "Write a short message or note (teacher/school) with the right tone.",
    };
    return map[action] || "Help the user.";
  }

  function buildUserContext() {
    const ctx = {
      role,
      country,
      level,
      subject,
      topic: topicEffective,
      mode: action,
      constraints,
    };
    return ctx;
  }

  async function callElora({ messageOverride } = {}) {
    const msg = (messageOverride ?? chatText).trim();
    if (!msg || loading) return;

    // Gate teacher-only educator tools
    if (teacherGateNeeded) {
      setVerifyGateOpen(true);
      return;
    }

    if (guestBlocked) {
      setMessages((m) => [
        ...m,
        {
          from: "elora",
          text:
            "Guest educator mode can’t generate quizzes or slide outlines yet. " +
            "Enter a teacher invite code to unlock those.",
        },
      ]);
      return;
    }

    // Tutor attempt logic: student must attempt first for "tutor"
    let nextAttempt = attemptRef.current;
    if (role === "student" && action === "tutor") {
      nextAttempt += 1;
      setAttempt(nextAttempt);
    }

    setChatText("");
    setMessages((m) => [...m, { from: "user", text: msg }]);

    const payload = {
      system: buildSystemText(),
      goal: buildGoalText(),
      context: buildUserContext(),
      message: msg,
      options: constraints,
      attempt: role === "student" ? nextAttempt : 0,
    };

    setLoading(true);

    try {
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => null);

      if (!r.ok || !data) {
        setMessages((m) => [
          ...m,
          {
            from: "elora",
            text: "Something went wrong. Try again in a moment.",
          },
        ]);
        return;
      }

      setMessages((m) => [...m, { from: "elora", text: stripInternalTags(data.text || "") }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          from: "elora",
          text: "Network error. Check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function refine(text) {
    setMessages((m) => [...m, { from: "user", text }]);
    await callElora({ messageOverride: text });
  }

  const workspaceStyle = {
    height: "calc((var(--elora-vh, 1vh) * 100) - var(--elora-nav-height) - 24px - 64px)",
  };

  return (
    <div style={workspaceStyle} className="overflow-hidden">
      <div className="h-full grid gap-5 lg:grid-cols-[360px,1fr]">
        {/* LEFT (desktop) */}
        <div className="hidden lg:block h-full min-h-0">
          <div className="h-full rounded-2xl border border-white/10 bg-slate-950/30 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold text-white">Assistant</div>
                  <div className="text-sm text-white/70">
                    Clear, calm help for educators and learners. No scary math symbols by default.
                  </div>
                </div>

                <div className="inline-flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                      teacher ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30" : "bg-amber-500/15 text-amber-200 border border-amber-500/30"
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", teacher ? "bg-emerald-400" : "bg-amber-400")} />
                    {teacher ? "Verified" : "Account"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 overflow-y-auto elora-scroll h-full">
              {/* Role */}
              <div>
                <div className="text-sm font-bold text-white">Role</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["student", "educator", "parent"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        resetTutorAttempts();
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                        role === r
                          ? "border-indigo-400/40 bg-indigo-500/10 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.25)]"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      )}
                    >
                      {r === "educator" ? "Educator" : r === "student" ? "Student" : "Parent"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject + Topic */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-white">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => {
                      const nextSubject = e.target.value;
                      setSubject(nextSubject);
                      const presets = TOPIC_PRESETS_BY_SUBJECT[nextSubject] || TOPIC_PRESETS_BY_SUBJECT.Other || [];
                      // Move to the first preset topic when switching subjects (keeps it 'fixed').
                      if (topicPreset !== CUSTOM_TOPIC_VALUE) {
                        setTopicPreset(presets[0] || CUSTOM_TOPIC_VALUE);
                      }
                      resetTutorAttempts();
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {SUBJECT_OPTIONS.map((s) => (
                      <option key={s} value={s} className="text-slate-900">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-white">Topic</label>
                  <select
                    value={topicPreset}
                    onChange={(e) => {
                      setTopicPreset(e.target.value);
                      resetTutorAttempts();
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {(topicPresets || []).map((t) => (
                      <option key={t} value={t} className="text-slate-900">
                        {t}
                      </option>
                    ))}
                    <option value={CUSTOM_TOPIC_VALUE} className="text-slate-900">
                      Custom…
                    </option>
                  </select>

                  {isCustomTopic ? (
                    <input
                      value={topicCustom}
                      onChange={(e) => setTopicCustom(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-indigo-500/40"
                      placeholder="Type a custom topic (e.g., Mixed numbers)"
                    />
                  ) : null}
                </div>
              </div>

              {/* More options (collapsed) */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowMoreOptions((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
                >
                  {showMoreOptions ? "Hide options" : "More options"}
                  <span className="text-xs opacity-70">(country, level, constraints)</span>
                </button>

                {showMoreOptions ? (
                  <div className="mt-4 grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-bold text-white">Country / Region</label>
                        <select
                          value={country}
                          onChange={(e) => {
                            setCountry(e.target.value);
                            resetTutorAttempts();
                          }}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          {COUNTRY_OPTIONS.map((c) => (
                            <option key={c} value={c} className="text-slate-900">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-white">Level</label>
                        <select
                          value={level}
                          onChange={(e) => {
                            setLevel(e.target.value);
                            resetTutorAttempts();
                          }}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          {levelOptions.map((l) => (
                            <option key={l} value={l} className="text-slate-900">
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-white">What should Elora do?</label>
                      <input
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-indigo-500/40"
                        placeholder="Optional: override the goal (e.g., 'Help me teach this with 3 examples')"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={constraints.avoidLatex}
                          onChange={(e) => setConstraints((s) => ({ ...s, avoidLatex: e.target.checked }))}
                        />
                        Avoid LaTeX
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={constraints.friendlyTone}
                          onChange={(e) => setConstraints((s) => ({ ...s, friendlyTone: e.target.checked }))}
                        />
                        Friendly tone
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={constraints.showSteps}
                          onChange={(e) => setConstraints((s) => ({ ...s, showSteps: e.target.checked }))}
                        />
                        Show steps
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={constraints.includeChecks}
                          onChange={(e) => setConstraints((s) => ({ ...s, includeChecks: e.target.checked }))}
                        />
                        Checks
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Quick actions */}
              <div className="mt-6">
                <div className="text-sm font-bold text-white">Quick actions</div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {(ROLE_QUICK_ACTIONS[role] || []).map((a) => {
                    const disabled =
                      (guest && (a.id === "assessment" || a.id === "slides")) ||
                      (role === "educator" && !teacher);
                    const active = action === a.id;

                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setAction(a.id);
                          resetTutorAttempts();
                        }}
                        disabled={disabled}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition",
                          active
                            ? "border-indigo-400/40 bg-indigo-500/10 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.22)]"
                            : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                          disabled ? "opacity-50 cursor-not-allowed" : ""
                        )}
                      >
                        <div className="text-base font-semibold">{a.title}</div>
                        <div className="text-sm opacity-80">{a.subtitle}</div>
                      </button>
                    );
                  })}
                </div>

                {role === "educator" && !teacher ? (
                  <div className="mt-3 text-xs text-white/70">
                    Educator tools (quiz/slides) require a teacher invite code.
                  </div>
                ) : null}
              </div>

              {/* Guest / teacher gate controls */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-bold text-white">Access</div>
                <div className="mt-2 text-sm text-white/75">
                  Teacher invite unlocks educator-only features. Guest mode is limited.
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyGateOpen(true)}
                    className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500/15 transition"
                  >
                    Enter teacher code
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGuest(true);
                      setVerifyGateOpen(false);
                      setMessages((m) => [...m, { from: "elora", text: "Guest mode enabled. You can use Elora (limited)." }]);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
                  >
                    Use as guest
                  </button>

                  {guest ? (
                    <button
                      type="button"
                      onClick={() => setGuest(false)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
                    >
                      Disable guest
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div className="h-full min-h-0">
          <div className="h-full rounded-2xl border border-white/10 bg-slate-950/30 backdrop-blur-xl shadow-2xl overflow-hidden relative">
            {/* Chat header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="hidden sm:block">
                  <RoleIllustration role={role} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {formatRoleLabel(role)} • {subject} • {topicEffective}
                  </div>
                  <div className="text-xs text-white/70 truncate">
                    {country} · {level} · {guest ? "Guest" : teacher ? "Verified" : "Account"}
                  </div>
                </div>
              </div>

              {!isNearBottom ? (
                <button
                  type="button"
                  onClick={() => {
                    scrollToBottom();
                    setIsNearBottom(true);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition"
                >
                  Jump to latest
                </button>
              ) : (
                <span className="text-xs text-white/60">{loading ? "Thinking…" : "Ready"}</span>
              )}
            </div>

            {/* Chat scroll area */}
            <div className="absolute inset-x-0 top-[61px] bottom-[96px]">
              <div ref={chatScrollRef} onScroll={onChatScroll} className="absolute inset-0 overflow-y-auto pr-1 elora-scroll">
                <div className="space-y-3 p-4">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "max-w-[92%] rounded-2xl px-4 py-3 border shadow-sm",
                        m.from === "user"
                          ? "ml-auto bg-indigo-500/10 border-indigo-400/25 text-white"
                          : "mr-auto bg-white/5 border-white/10 text-white"
                      )}
                    >
                      <div className="text-xs font-semibold mb-1 opacity-70">
                        {m.from === "user" ? "You" : "Elora"}
                      </div>
                      <div className="prose prose-invert prose-p:leading-relaxed prose-a:text-indigo-300 max-w-none text-[15px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {loading ? (
                    <div className="mr-auto max-w-[92%] rounded-2xl px-4 py-3 border bg-white/5 border-white/10 text-white">
                      <div className="text-xs font-semibold mb-1 opacity-70">Elora</div>
                      <div className="text-[15px] text-white/80">Thinking…</div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Refinement chips */}
            <div className="absolute inset-x-0 bottom-[56px] border-t border-white/10 bg-slate-950/20 backdrop-blur-xl">
              <div className="flex items-center gap-2 overflow-x-auto p-3 elora-scroll">
                {chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => refine(c)}
                    className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-slate-950/30 backdrop-blur-xl">
              <div className="p-3 flex items-end gap-2">
                <textarea
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder='Try: "Explain 5 divided by 4" or "Rewrite this paragraph to sound clearer".'
                  className="h-[42px] max-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/45 outline-none focus:ring-2 focus:ring-indigo-500/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      callElora();
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={loading || !chatText.trim()}
                  onClick={() => callElora()}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-semibold transition border",
                    loading || !chatText.trim()
                      ? "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
                      : "border-indigo-400/40 bg-indigo-500/10 text-white hover:bg-indigo-500/15"
                  )}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Mobile: compact controls */}
          <div className="lg:hidden mt-4 rounded-2xl border border-white/10 bg-slate-950/30 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="text-sm font-bold text-white">Controls</div>
              <button
                type="button"
                onClick={() => setShowMoreOptions((v) => !v)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
              >
                {showMoreOptions ? "Hide" : "More"}
              </button>
            </div>

            <div className="p-4 grid gap-4">
              <div>
                <div className="text-sm font-bold text-white">Role</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["student", "educator", "parent"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        resetTutorAttempts();
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                        role === r
                          ? "border-indigo-400/40 bg-indigo-500/10 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.25)]"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      )}
                    >
                      {r === "educator" ? "Educator" : r === "student" ? "Student" : "Parent"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-white">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => {
                      const nextSubject = e.target.value;
                      setSubject(nextSubject);
                      const presets = TOPIC_PRESETS_BY_SUBJECT[nextSubject] || TOPIC_PRESETS_BY_SUBJECT.Other || [];
                      if (topicPreset !== CUSTOM_TOPIC_VALUE) {
                        setTopicPreset(presets[0] || CUSTOM_TOPIC_VALUE);
                      }
                      resetTutorAttempts();
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {SUBJECT_OPTIONS.map((s) => (
                      <option key={s} value={s} className="text-slate-900">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-white">Topic</label>
                  <select
                    value={topicPreset}
                    onChange={(e) => {
                      setTopicPreset(e.target.value);
                      resetTutorAttempts();
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {(topicPresets || []).map((t) => (
                      <option key={t} value={t} className="text-slate-900">
                        {t}
                      </option>
                    ))}
                    <option value={CUSTOM_TOPIC_VALUE} className="text-slate-900">
                      Custom…
                    </option>
                  </select>

                  {isCustomTopic ? (
                    <input
                      value={topicCustom}
                      onChange={(e) => setTopicCustom(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-indigo-500/40"
                      placeholder="Type a custom topic"
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-white">Quick actions</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(ROLE_QUICK_ACTIONS[role] || []).map((a) => {
                    const disabled =
                      (guest && (a.id === "assessment" || a.id === "slides")) ||
                      (role === "educator" && !teacher);
                    const active = action === a.id;

                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setAction(a.id);
                          resetTutorAttempts();
                        }}
                        disabled={disabled}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition",
                          active
                            ? "border-indigo-400/40 bg-indigo-500/10 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.22)]"
                            : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                          disabled ? "opacity-50 cursor-not-allowed" : ""
                        )}
                      >
                        <div className="text-base font-semibold">{a.title}</div>
                        <div className="text-sm opacity-80">{a.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showMoreOptions ? (
                <div className="grid gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-bold text-white">Country / Region</label>
                      <select
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          resetTutorAttempts();
                        }}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                      >
                        {COUNTRY_OPTIONS.map((c) => (
                          <option key={c} value={c} className="text-slate-900">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-white">Level</label>
                      <select
                        value={level}
                        onChange={(e) => {
                          setLevel(e.target.value);
                          resetTutorAttempts();
                        }}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                      >
                        {levelOptions.map((l) => (
                          <option key={l} value={l} className="text-slate-900">
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={constraints.avoidLatex}
                        onChange={(e) => setConstraints((s) => ({ ...s, avoidLatex: e.target.checked }))}
                      />
                      Avoid LaTeX
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={constraints.friendlyTone}
                        onChange={(e) => setConstraints((s) => ({ ...s, friendlyTone: e.target.checked }))}
                      />
                      Friendly tone
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={constraints.showSteps}
                        onChange={(e) => setConstraints((s) => ({ ...s, showSteps: e.target.checked }))}
                      />
                      Show steps
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/80">
                      <input
                        type="checkbox"
                        checked={constraints.includeChecks}
                        onChange={(e) => setConstraints((s) => ({ ...s, includeChecks: e.target.checked }))}
                      />
                      Checks
                    </label>
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-bold text-white">Access</div>
                <div className="mt-2 text-sm text-white/75">
                  Teacher invite unlocks educator-only features. Guest mode is limited.
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyGateOpen(true)}
                    className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500/15 transition"
                  >
                    Enter teacher code
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGuest(true);
                      setVerifyGateOpen(false);
                      setMessages((m) => [...m, { from: "elora", text: "Guest mode enabled. You can use Elora (limited)." }]);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
                  >
                    Use as guest
                  </button>

                  {guest ? (
                    <button
                      type="button"
                      onClick={() => setGuest(false)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
                    >
                      Disable guest
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Modal open={verifyGateOpen} onClose={() => setVerifyGateOpen(false)} title="Teacher invite code">
          <div className="space-y-3">
            <div className="text-sm text-slate-700 dark:text-white/75">
              Enter your teacher invite code to unlock educator tools (quizzes, rubrics, lesson planning).
            </div>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g., ELORA-TEACHER"
              className="w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-950/40 px-3 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {inviteErr ? <div className="text-sm text-rose-500">{inviteErr}</div> : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitInvite}
                className="rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-indigo-500/15 transition"
              >
                Unlock
              </button>
              <button
                type="button"
                onClick={() => setVerifyGateOpen(false)}
                className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-950/40 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-950/60 transition"
              >
                Cancel
              </button>
            </div>
            <div className="text-xs text-slate-600 dark:text-white/60">
              In the next batch we’ll move this to backend validation + persistent role, so it’s secure.
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
