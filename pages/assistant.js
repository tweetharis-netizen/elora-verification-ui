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
  "Other",
];

const LEVELS_BY_COUNTRY = {
  Singapore: [
    "Primary (1–6)",
    "Secondary (1–2)",
    "Secondary (3–4)",
    "O-Level",
    "A-Level",
    "University",
    "Other",
  ],
  "United States": [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8 (Middle School)",
    "Grade 9 (High School)",
    "Grade 10 (High School)",
    "Grade 11 (High School)",
    "Grade 12 (High School)",
    "AP / Advanced",
    "University",
    "Other",
  ],
  "United Kingdom": [
    "Year 1",
    "Year 2",
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Year 7",
    "Year 8",
    "Year 9",
    "GCSE (Year 10–11)",
    "A-Level (Year 12–13)",
    "University",
    "Other",
  ],
  Australia: [
    "Foundation",
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
    "Other",
  ],
  Canada: [
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
    "Other",
  ],
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
  Other: [
    "Primary / Elementary",
    "Middle School",
    "High School",
    "Pre-University",
    "University",
    "Other",
  ],
};

const SUBJECT_OPTIONS = [
  "Math",
  "Science",
  "English",
  "Computer Science",
  "History",
  "Geography",
  "Other",
];

// Preset topics keep the demo fast and outputs consistent.
// Custom topic is still supported (select "Custom…" and type your own).
const CUSTOM_TOPIC_VALUE = "__custom__";
const TOPIC_PRESETS_BY_SUBJECT = {
  Math: [
    "Fractions",
    "Decimals",
    "Percentages",
    "Ratios",
    "Algebra basics",
    "Geometry",
    "Word problems",
    "Statistics",
  ],
  Science: [
    "Scientific method",
    "Cells",
    "Forces",
    "Energy",
    "Matter",
    "Ecosystems",
  ],
  English: [
    "Paragraph structure",
    "Argument writing",
    "Summary writing",
    "Grammar: tenses",
    "Grammar: punctuation",
    "Vocabulary",
    "Comprehension",
  ],
  "Computer Science": [
    "Variables",
    "Conditionals",
    "Loops",
    "Functions",
    "Debugging",
    "Data structures (basic)",
  ],
  History: [
    "Source analysis",
    "Cause and effect",
    "Timelines",
    "Comparing viewpoints",
    "Essay structure",
  ],
  Geography: [
    "Maps and coordinates",
    "Climate",
    "Human geography",
    "Physical geography",
    "Case study writing",
  ],
  Other: ["Study skills", "Time management", "Exam revision"],
};

const ROLE_QUICK_ACTIONS = {
  educator: [
    {
      id: "lesson",
      label: "Plan a lesson",
      hint: "Objectives, timings, checks, differentiation",
    },
    {
      id: "worksheet",
      label: "Create worksheet",
      hint: "Student + Teacher versions, export-ready",
    },
    {
      id: "assessment",
      label: "Generate assessment",
      hint: "Marks + marking scheme (Teacher)",
    },
    { id: "slides", label: "Design slides", hint: "Engaging deck + visuals (Teacher)" },
  ],
  student: [
    { id: "explain", label: "Tutor me", hint: "You attempt first → Elora guides with hints" },
    { id: "worksheet", label: "Give me practice", hint: "Practice set (no answer-dump)" },
    { id: "custom", label: "Custom request", hint: "Ask anything and refine" },
  ],
  parent: [
    { id: "explain", label: "Explain it simply", hint: "Plain words + what to say at home" },
    { id: "worksheet", label: "Practice for my child", hint: "Practice + parent guidance" },
    { id: "custom", label: "Custom request", hint: "Ask anything and refine" },
  ],
};

const REFINEMENT_CHIPS = {
  lesson: [
    "Shorter",
    "More detailed",
    "Add differentiation",
    "Add misconceptions",
    "Add exit ticket rubric",
  ],
  worksheet: [
    "Make it shorter",
    "Add worked example",
    "More challenging",
    "Add word problems",
    "Common misconceptions",
  ],
  assessment: ["Harder", "More conceptual", "Add marks", "Improve marking scheme", "Reduce length"],
  slides: [
    "More visuals ideas",
    "More interactivity",
    "Add checks for understanding",
    "Add teacher notes",
    "Shorter deck",
  ],
  explain: ["Give me a hint", "Explain differently", "Another similar question", "Harder", "Easier"],
  custom: [
    "Shorter",
    "More detailed",
    "More examples",
    "Make it student-friendly",
    "Make it teacher-friendly",
  ],
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function stripInternalTags(text) {
  if (!text) return "";
  return text
    .replace(/<ELORA_ARTIFACT_JSON>[\s\S]*?<\/ELORA_ARTIFACT_JSON>/g, "")
    .replace(/<ELORA_ARTIFACT_JSON>[\s\S]*$/g, "")
    .replace(/<\/?[^>]+>/g, "")
    .trim();
}

export default function AssistantPage() {
  // --- Session sync (frontend storage) ---
  const [session, setSession] = useState(() => getSession());
  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("elora:session", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("elora:session", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const verified = Boolean(session.verified);
  // "Guest" = no verified server session yet. This keeps the demo usable before verification.
  const guest = !verified && !session.hasSession;
  const teacher = isTeacher();

  // --- Core controls ---
  const [role, setRole] = useState(session.role || "student");
  const [subject, setSubject] = useState("Math");

  const topicPresets = useMemo(() => {
    return TOPIC_PRESETS_BY_SUBJECT[subject] || TOPIC_PRESETS_BY_SUBJECT.Other;
  }, [subject]);

  const [topicPreset, setTopicPreset] = useState(() => TOPIC_PRESETS_BY_SUBJECT.Math?.[0] || "Fractions");
  const [topicCustom, setTopicCustom] = useState("");

  const isCustomTopic = topicPreset === CUSTOM_TOPIC_VALUE;
  const topicEffective = isCustomTopic ? (topicCustom.trim() || "Custom topic") : topicPreset;

  const [constraints, setConstraints] = useState("");
  const [action, setAction] = useState(ROLE_QUICK_ACTIONS[role]?.[0]?.id || "explain");

  // Secondary controls (collapsed by default to reduce clutter)
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [country, setCountry] = useState("Singapore");
  const levelOptions = useMemo(() => LEVELS_BY_COUNTRY[country] || LEVELS_BY_COUNTRY.Other, [country]);
  const [level, setLevel] = useState(levelOptions[0] || "Primary / Elementary");

  // Chat
  const [messages, setMessages] = useState(() => [
    {
      from: "elora",
      text:
        "Hi! I’m **Elora**.\n\nPick options on the left (that’s the hard part of prompting) and I’ll generate something clean you can actually use.\n\nUse chat for refinements.",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [chatText, setChatText] = useState("");

  // Gates
  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [teacherGateStatus, setTeacherGateStatus] = useState("");

  // Mobile UX
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

  // Student tutor attempts
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

  // Persist UI role preference
  useEffect(() => {
    storeRole(role);
  }, [role]);

  // When subject changes, reset topic to the first preset
  useEffect(() => {
    const first = (TOPIC_PRESETS_BY_SUBJECT[subject] || TOPIC_PRESETS_BY_SUBJECT.Other)?.[0] || "Custom";
    setTopicPreset(first);
    setTopicCustom("");
    setAttempt(0);
  }, [subject]);

  const guestBlocked = useMemo(() => {
    if (!guest) return false;
    return action === "assessment" || action === "slides";
  }, [guest, action]);

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

  async function callElora({ messageOverride = "" } = {}) {
    if (!verified && !guest) {
      setVerifyGateOpen(true);
      return;
    }

    if (role === "educator" && !teacher) {
      setTeacherGateOpen(true);
      return;
    }

    if (guestBlocked) {
      setMessages((m) => [
        ...m,
        { from: "elora", text: "Guest mode is limited — verify to unlock assessments and slides." },
      ]);
      return;
    }

    const nextAttempt =
      role === "student" && messageOverride.trim()
        ? Math.min(3, attemptRef.current + 1)
        : attemptRef.current;

    if (role === "student" && messageOverride.trim()) {
      setAttempt(nextAttempt);
    }

    const payload = {
      role,
      country,
      level,
      subject,
      topic: topicEffective,
      topicPreset: isCustomTopic ? "" : topicPreset,
      topicCustom: isCustomTopic ? topicCustom : "",
      action,
      guest,
      verified,
      teacherInvite: session.teacherCode || "",
      message: messageOverride,
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
      if (!r.ok) throw new Error(data?.error || "AI request failed.");

      const clean = stripInternalTags(data.reply || "");
      setMessages((m) => [...m, { from: "elora", text: clean }]);
    } catch (e) {
      setMessages((m) => [...m, { from: "elora", text: e?.message || "Sorry — something went wrong." }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendChat() {
    const msg = chatText.trim();
    if (!msg) return;

    if (!verified && !guest) {
      setVerifyGateOpen(true);
      return;
    }

    if (role === "educator" && !teacher) {
      setTeacherGateOpen(true);
      return;
    }

    setChatText("");
    setMessages((m) => [...m, { from: "user", text: msg }]);
    await callElora({ messageOverride: msg });
  }

  async function refine(text) {
    setMessages((m) => [...m, { from: "user", text }]);
    await callElora({ messageOverride: text });
  }

  async function validateAndActivateInvite(code) {
    const trimmed = String(code || "").trim();
    setTeacherGateStatus("");

    if (!trimmed) {
      setTeacherGateStatus("Enter a code.");
      return false;
    }

    if (!verified) {
      setTeacherGateStatus("Verify your email first. Educator access requires verification.");
      return false;
    }

    // Server validates the code and sets a signed httpOnly cookie.
    // Client then refreshes local session cache via activateTeacher().
    setTeacherGateStatus("Checking…");

    const result = await activateTeacher(trimmed);
    if (result?.ok) {
      setTeacherGateStatus("Educator access enabled ✅");
      return true;
    }

    if (result?.error === "invalid_invite") {
      setTeacherGateStatus("Invalid code.");
      return false;
    }

    if (result?.error === "invite_not_configured") {
      setTeacherGateStatus("Teacher invites are not configured on this deploy.");
      return false;
    }

    if (result?.error === "missing_code") {
      setTeacherGateStatus("Enter a code.");
      return false;
    }

    setTeacherGateStatus("Could not validate right now. Try again.");
    return false;
  }

  function StatusChip() {
    if (guest) {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
          Guest
        </span>
      );
    }
    if (verified) {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
          {teacher ? "Teacher ✓" : "Verified ✓"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 text-slate-800 dark:text-slate-200">
        Unverified
      </span>
    );
  }

  function ControlsContent({ compact = false } = {}) {
    // compact=true is used in mobile drawer; we hide a few decorative elements.
    return (
      <>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-950 dark:text-white">Prompt Builder</h1>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Pick options → Elora generates. Chat is for refinement.
            </p>
            {role === "student" ? (
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Tutor mode: you attempt first. Elora guides with hints (up to 3 attempts).
              </div>
            ) : null}
          </div>

          <div className="shrink-0">
            <StatusChip />
          </div>
        </div>

        {!compact ? (
          <div className="mt-5">
            <RoleIllustration role={role} />
          </div>
        ) : null}

        {/* Role */}
        <div className="mt-5">
          <div className="text-sm font-bold text-slate-900 dark:text-white">Role</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {["student", "parent", "educator"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  if (r === "educator" && !teacher) {
                    setTeacherGateOpen(true);
                    return;
                  }
                  setRole(r);
                }}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-extrabold transition",
                  role === r
                    ? "border-indigo-500/50 bg-indigo-600/10 text-indigo-700 dark:text-indigo-200"
                    : "border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/40"
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
            <label className="text-sm font-bold text-slate-900 dark:text-white">Subject</label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                resetTutorAttempts();
              }}
              className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-900 dark:text-white">Topic</label>
            <select
              value={topicPreset}
              onChange={(e) => {
                setTopicPreset(e.target.value);
                resetTutorAttempts();
              }}
              className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {(topicPresets || []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value={CUSTOM_TOPIC_VALUE}>Custom…</option>
            </select>

            {isCustomTopic ? (
              <input
                value={topicCustom}
                onChange={(e) => {
                  setTopicCustom(e.target.value);
                  resetTutorAttempts();
                }}
                className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
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
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 px-4 py-2 text-sm font-extrabold text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/40"
          >
            {showMoreOptions ? "Hide options" : "More options"}
            <span className="text-xs opacity-70">(country, level, constraints)</span>
          </button>

          {showMoreOptions ? (
            <div className="mt-4 grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Country / Region</label>
                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      resetTutorAttempts();
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Level</label>
                  <select
                    value={level}
                    onChange={(e) => {
                      setLevel(e.target.value);
                      resetTutorAttempts();
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {levelOptions.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-900 dark:text-white">Constraints (optional)</label>
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="e.g., 45 minutes, mixed ability, include SEN/EAL support"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick actions */}
        <div className="mt-6">
          <div className="text-sm font-bold text-slate-900 dark:text-white">Quick actions</div>
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
                    "rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-indigo-500/50 bg-indigo-600/10 shadow-lg shadow-indigo-500/10"
                      : "border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 hover:bg-white dark:hover:bg-slate-950/40",
                    disabled ? "opacity-50 cursor-not-allowed" : ""
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
            onClick={() => {
              resetTutorAttempts();
              callElora({ messageOverride: "" });
              setMobileControlsOpen(false);
            }}
            disabled={loading}
            className={cn(
              "mt-5 w-full rounded-full px-6 py-3 font-extrabold text-white shadow-xl shadow-indigo-500/20",
              loading ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            {loading ? "Generating…" : role === "student" ? "Start tutoring" : "Generate with Elora"}
          </button>
        </div>
      </>
    );
  }

  // Height of the assistant workspace. This prevents full-page scrolling while chatting.
  const workspaceStyle = {
    height: "calc(100vh - var(--elora-nav-height) - 24px - 64px)",
  };

  return (
    <div style={workspaceStyle} className="overflow-hidden">
      <div className="h-full grid gap-5 lg:grid-cols-[360px,1fr]">
        {/* LEFT (desktop) */}
        <div className="hidden lg:block h-full overflow-y-auto">
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/35 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 p-5">
            <ControlsContent />
          </div>
        </div>

        {/* RIGHT (chat) */}
        <div className="h-full rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/35 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 p-5 flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Elora Assistant</h2>
              <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {country} • {level} • {subject} • <span className="font-semibold">{role}</span> •{" "}
                <span className="font-semibold">{topicEffective}</span>
                {role === "student" ? (
                  <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    Attempts: {Math.min(3, attempt)}/3
                  </span>
                ) : null}
              </div>
            </div>

            {/* Mobile controls button */}
            <div className="flex items-center gap-2">
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileControlsOpen(true)}
                  className="rounded-full px-4 py-2 text-sm font-extrabold border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/40"
                >
                  Customize
                </button>
              </div>
              <div className="hidden sm:block">
                <StatusChip />
              </div>
            </div>
          </div>

          {/* Scrollable messages area (only this scrolls) */}
          <div className="mt-4 relative flex-1 min-h-0">
            <div
              ref={chatScrollRef}
              onScroll={onChatScroll}
              className="absolute inset-0 overflow-y-auto pr-1"
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
                    {m.from === "user" ? (
                      m.text
                    ) : (
                      <div className="elora-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {stripInternalTags(m.text)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}

                {loading ? (
                  <div className="mr-auto max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-700 dark:text-slate-200">
                    Elora is thinking…
                  </div>
                ) : null}
              </div>
            </div>

            {!isNearBottom ? (
              <button
                type="button"
                onClick={scrollToBottom}
                className="absolute bottom-3 right-3 rounded-full px-4 py-2 text-xs font-extrabold border border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-slate-950/60 text-slate-900 dark:text-white shadow-lg"
              >
                Jump to latest
              </button>
            ) : null}
          </div>

          {/* Refinement chips (fixed row; does not scroll with chat) */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {chips.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => refine(t)}
                disabled={loading}
                className="shrink-0 rounded-full px-3 py-2 text-xs font-bold border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/40 disabled:opacity-50"
              >
                {t}
              </button>
            ))}
          </div>

          {/* Composer */}
          <div className="mt-3 flex items-end gap-2">
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
              className="flex-1 min-h-[48px] max-h-36 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
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

      {/* Mobile controls drawer (bottom sheet) */}
      {mobileControlsOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onMouseDown={() => setMobileControlsOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div
              className="w-full rounded-2xl border border-white/10 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl shadow-2xl overflow-hidden"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-black text-slate-950 dark:text-white">Customize</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    This panel scrolls. Chat stays separate.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileControlsOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-bold border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-900 dark:text-white"
                >
                  Close
                </button>
              </div>

              <div className="px-4 pb-4 max-h-[75vh] overflow-y-auto">
                <ControlsContent compact />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Verify gate */}
      <Modal open={verifyGateOpen} title="Verify to unlock everything" onClose={() => setVerifyGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Verification unlocks educator tools and exports. Your status stays saved across refreshes.
        </div>

        <div className="mt-4 grid gap-2">
          <a
            href="/verify"
            className="w-full block text-center px-5 py-3 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            Go to verification
          </a>

          <button
            type="button"
            className="w-full px-5 py-3 rounded-xl font-bold border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/45"
            onClick={() => {
              storeGuest();
              setVerifyGateOpen(false);
              setRole("student");
              setMessages((m) => [
                ...m,
                {
                  from: "elora",
                  text: "Guest mode enabled. You can use Elora (limited). Verify anytime to unlock everything.",
                },
              ]);
            }}
          >
            Continue as Guest (limited)
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          Guest limits: no assessments, no slides, limited exports.
        </div>
      </Modal>

      {/* Teacher gate */}
      <Modal open={teacherGateOpen} title="Teacher invite required" onClose={() => setTeacherGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Educator tools are locked until you enter a valid teacher invite code.
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold text-slate-900 dark:text-white">Teacher invite code</label>
          <input
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder="e.g., GENESIS2026"
            className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        {teacherGateStatus ? (
          <div className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">{teacherGateStatus}</div>
        ) : null}

        <div className="mt-3 grid gap-2">
          <button
            type="button"
            className="w-full px-5 py-3 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            onClick={async () => {
              const ok = await validateAndActivateInvite(inviteInput);
              if (!ok) return;
              setInviteInput("");
              setTeacherGateOpen(false);
              setRole("educator");
            }}
          >
            Validate & enable Educator mode
          </button>

          <button
            type="button"
            className="w-full px-5 py-3 rounded-xl font-bold border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/45"
            onClick={() => {
              setTeacherGateOpen(false);
              setRole("student");
            }}
          >
            I’m not a teacher (switch to Student)
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          Security note: the server validates the invite and issues a signed cookie. The UI can’t “fake” teacher access.
        </div>
      </Modal>
    </div>
  );
}
