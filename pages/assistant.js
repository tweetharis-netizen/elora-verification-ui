import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Modal from "../components/Modal";
import RoleIllustration from "../components/RoleIllustration";
import { getSession, setGuest as storeGuest, setRole as storeRole } from "../lib/session";

const COUNTRY_OPTIONS = [
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Thailand",
  "Philippines",
  "Vietnam",
  "India",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "New Zealand",
  "Japan",
  "South Korea",
  "China",
  "Taiwan",
  "Hong Kong",
  "UAE",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Egypt",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Norway",
  "Finland",
  "Other",
];

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
    "JC / Pre-U",
    "University",
    "Other",
  ],
  Malaysia: [
    "Year 1",
    "Year 2",
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Form 1",
    "Form 2",
    "Form 3",
    "Form 4",
    "Form 5",
    "Pre-University",
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

const TOPICS_BY_SUBJECT = {
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
    "Grammar (tenses)",
    "Grammar (punctuation)",
    "Vocabulary",
    "Comprehension",
  ],
  "Computer Science": [
    "Variables",
    "Conditionals",
    "Loops",
    "Functions",
    "Debugging",
  ],
  History: ["Timelines and cause/effect", "Source analysis", "Essay planning"],
  Geography: ["Maps and direction", "Climate and weather", "Human geography"],
  Other: ["General"],
};

const ROLE_QUICK_ACTIONS = {
  student: [
    {
      id: "explain",
      label: "Explain + guide",
      hint: "Student-friendly explanation, steps, and practice question.",
    },
    {
      id: "worksheet",
      label: "Practice set",
      hint: "10–15 questions with answers (varied difficulty).",
    },
    {
      id: "custom",
      label: "Custom request",
      hint: "Anything else you want Elora to help with.",
    },
  ],
  parent: [
    {
      id: "explain",
      label: "Explain for parents",
      hint: "Clear explanation + how to help without giving answers.",
    },
    {
      id: "lesson",
      label: "Home plan",
      hint: "A short plan to build confidence (15–30 mins/day).",
    },
    {
      id: "custom",
      label: "Custom request",
      hint: "Anything else you want Elora to help with.",
    },
  ],
  educator: [
    {
      id: "lesson",
      label: "Lesson plan",
      hint: "Objective, steps, timing, differentiation, exit ticket.",
    },
    {
      id: "worksheet",
      label: "Worksheet",
      hint: "Questions, worked example, answers, misconceptions.",
    },
    {
      id: "assessment",
      label: "Assessment",
      hint: "A short quiz with marking scheme (locked in guest).",
    },
    {
      id: "slides",
      label: "Slides outline",
      hint: "Slide-by-slide outline + teacher notes (locked in guest).",
    },
    {
      id: "custom",
      label: "Custom request",
      hint: "Anything else you want Elora to help with.",
    },
  ],
};

const REFINEMENT_CHIPS = {
  lesson: ["Shorter", "More detailed", "Add differentiation", "Add misconceptions", "Add exit ticket rubric"],
  worksheet: ["Make it shorter", "Add worked example", "More challenging", "Add word problems", "Common misconceptions"],
  assessment: ["Harder", "More conceptual", "Add marks", "Improve marking scheme", "Reduce length"],
  slides: ["More visuals ideas", "More interactivity", "Add checks for understanding", "Add teacher notes", "Shorter deck"],
  explain: ["Give me a hint", "Explain differently", "Another similar question", "Harder", "Easier"],
  custom: ["Shorter", "More detailed", "More examples", "Make it student-friendly", "Make it teacher-friendly"],
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
  const router = useRouter();

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
  const guest = Boolean(session.guest);
  const teacherCode = String(session.teacherCode || "").trim();
  const hasTeacherCode = Boolean(teacherCode);

  // UX role (how Elora responds)
  const [role, setRole] = useState(session.role || "student");
  useEffect(() => {
    storeRole(role);
  }, [role]);

  // Curriculum context
  const [country, setCountry] = useState("Singapore");
  const levelOptions = useMemo(
    () => LEVELS_BY_COUNTRY[country] || LEVELS_BY_COUNTRY.Other,
    [country]
  );
  const [level, setLevel] = useState(levelOptions[0] || "Primary / Elementary");

  const [subject, setSubject] = useState("Math");

  // Topic = preset dropdown + Custom option (subject-aware)
  const topicsForSubject = useMemo(
    () => TOPICS_BY_SUBJECT[subject] || TOPICS_BY_SUBJECT.Other,
    [subject]
  );
  const [topicPreset, setTopicPreset] = useState(
    () => topicsForSubject[0] || "General"
  );
  const [topicMode, setTopicMode] = useState("preset"); // "preset" | "custom"
  const [topicCustom, setTopicCustom] = useState("");

  useEffect(() => {
    // When subject changes, reset to a sensible preset for fast demos.
    setTopicPreset(topicsForSubject[0] || "General");
    setTopicMode("preset");
    setTopicCustom("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  const effectiveTopic =
    topicMode === "custom"
      ? (topicCustom || "").trim() || "Custom topic"
      : topicPreset;

  const [constraints, setConstraints] = useState("");

  // Action changes with role
  const [action, setAction] = useState(
    ROLE_QUICK_ACTIONS[role]?.[0]?.id || "explain"
  );

  // Student tutor attempts (only meaningful for role=student)
  const [attempt, setAttempt] = useState(0);
  const attemptRef = useRef(0);
  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    if (!levelOptions.includes(level)) setLevel(levelOptions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, levelOptions.join("|")]);

  useEffect(() => {
    const first = ROLE_QUICK_ACTIONS[role]?.[0]?.id || "explain";
    setAction(first);
    setAttempt(0);
  }, [role]);

  const guestBlocked = useMemo(() => {
    if (!guest) return false;
    return action === "assessment" || action === "slides";
  }, [guest, action]);

  const chips = useMemo(
    () => REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.custom,
    [action]
  );

  const [messages, setMessages] = useState(() => [
    {
      from: "elora",
      text:
        "Hi — I’m **Elora**.\n\nPick your subject and topic, choose a quick action, then I’ll generate something classroom-ready. Use chat to refine it.",
    },
  ]);

  const [loading, setLoading] = useState(false);

  // Gates / drawers
  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  // Chat input + scroll behavior
  const [chatText, setChatText] = useState("");
  const chatScrollRef = useRef(null);
  const [atBottom, setAtBottom] = useState(true);

  function resetTutorAttempts() {
    setAttempt(0);
  }

  function scrollToBottom(behavior = "auto") {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  function onChatScroll() {
    const el = chatScrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
    setAtBottom(distance < 120);
  }

  useEffect(() => {
    // Only auto-scroll if the user is already near the bottom.
    if (atBottom) scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, loading]);

  function requireVerify() {
    if (!verified && !guest) {
      setVerifyGateOpen(true);
      return true;
    }
    return false;
  }

  function requireTeacherCode() {
    // Batch 1 gate: Educator mode requires “verified + invite code entered”.
    // Backend still validates the code when configured.
    if (role !== "educator") return false;

    if (!verified && !guest) {
      setVerifyGateOpen(true);
      return true;
    }
    if (!hasTeacherCode) {
      setTeacherGateOpen(true);
      return true;
    }
    return false;
  }

  async function callElora({ messageOverride = "" } = {}) {
    if (requireVerify()) return;

    if (guestBlocked) {
      setMessages((m) => [
        ...m,
        {
          from: "elora",
          text: "Guest mode is limited — verify to unlock assessments and slides.",
        },
      ]);
      return;
    }

    if (requireTeacherCode()) return;

    const msg = String(messageOverride || "").trim();
    if (!msg) return;

    const nextAttempt =
      role === "student" ? Math.min(3, attemptRef.current + 1) : 0;

    if (role === "student") setAttempt(nextAttempt);

    const payload = {
      role,
      country,
      level,
      subject,
      topic: effectiveTopic,
      action,
      guest,
      verified,
      teacherInvite: teacherCode, // validated server-side when configured
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
      if (!r.ok) throw new Error(data?.error || "AI request failed.");

      const clean = stripInternalTags(data.reply || "");
      setMessages((m) => [...m, { from: "elora", text: clean }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { from: "elora", text: e?.message || "Sorry — something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function sendChat() {
    const msg = chatText.trim();
    if (!msg) return;

    if (requireVerify()) return;

    if (role === "educator" && !hasTeacherCode) {
      setTeacherGateOpen(true);
      return;
    }

    setMessages((m) => [...m, { from: "user", text: msg }]);
    setChatText("");
    await callElora({ messageOverride: msg });
    setTimeout(() => scrollToBottom("smooth"), 0);
  }

  async function refine(text) {
    const t = String(text || "").trim();
    if (!t) return;
    setMessages((m) => [...m, { from: "user", text: t }]);
    await callElora({ messageOverride: t });
  }

  function clearChat() {
    setAttempt(0);
    setMessages([
      {
        from: "elora",
        text:
          "All cleared. Pick a topic and ask again — I’ll keep it clear and student-friendly.",
      },
    ]);
    setTimeout(() => scrollToBottom("auto"), 0);
  }

  function trySetRole(next) {
    const r = String(next || "student");
    if (r === "educator") {
      if (!verified && !guest) {
        setVerifyGateOpen(true);
        return;
      }
      if (!hasTeacherCode) {
        setTeacherGateOpen(true);
        return;
      }
    }
    setRole(r);
    resetTutorAttempts();
  }

  function StatusChip() {
    if (verified) {
      return (
        <span className="elora-pill" title={session.email || "Verified"}>
          <span className="elora-dot elora-dot-good" aria-hidden="true" />
          Verified{session.email ? ` • ${session.email}` : ""}
        </span>
      );
    }
    if (guest) {
      return (
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black"
          style={{
            borderColor: "rgba(245,158,11,0.35)",
            background: "rgba(245,158,11,0.10)",
          }}
        >
          <span className="elora-dot elora-dot-warn" aria-hidden="true" />
          Guest (limited)
        </span>
      );
    }
    return <span className="elora-muted text-sm">Not verified</span>;
  }

  const md = {
    p: ({ children }) => (
      <p className="text-sm leading-relaxed text-[color:var(--text)] my-2">
        {children}
      </p>
    ),
    li: ({ children }) => (
      <li className="text-sm leading-relaxed text-[color:var(--text)] my-1">
        {children}
      </li>
    ),
    ul: ({ children }) => <ul className="list-disc pl-5 my-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
    strong: ({ children }) => (
      <strong className="font-black text-[color:var(--text)]">{children}</strong>
    ),
    code: ({ children }) => (
      <code
        className="rounded-md px-1.5 py-0.5 text-xs"
        style={{
          background: "color-mix(in oklab, var(--surface2) 70%, transparent)",
          border: "1px solid var(--line)",
        }}
      >
        {children}
      </code>
    ),
  };

  function ControlPanel({ compact = false } = {}) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-black text-[color:var(--text)]">
              Assistant
            </div>
            <div className="mt-1 elora-muted text-sm">
              Options first → generate → chat to refine.
            </div>

            <div className="mt-3">
              <StatusChip />
            </div>

            {role === "student" ? (
              <div className="mt-2 text-xs elora-muted">
                Tutor mode: Elora guides with hints (up to 3 attempts).
              </div>
            ) : null}
          </div>

          {!compact ? (
            <div className="hidden md:block w-36 h-20">
              <RoleIllustration role={role} />
            </div>
          ) : null}
        </div>

        {/* Role selector */}
        <div>
          <div className="text-sm font-black text-[color:var(--text)]">Role</div>
          <div className="mt-2 elora-segmented" role="tablist" aria-label="Role">
            {["student", "parent", "educator"].map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r ? "true" : "false"}
                onClick={() => trySetRole(r)}
                className={role === r ? "active" : ""}
              >
                {r === "student"
                  ? "Student"
                  : r === "parent"
                  ? "Parent"
                  : "Educator"}
              </button>
            ))}
          </div>

          {role === "educator" && !hasTeacherCode ? (
            <div className="mt-2 text-xs elora-muted">
              Educator mode is locked until you enter a teacher invite code in
              Settings.
            </div>
          ) : null}
        </div>

        {/* Subject + Topic */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-sm font-black text-[color:var(--text)]">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                resetTutorAttempts();
              }}
              className="mt-2 elora-input"
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-black text-[color:var(--text)]">
              Topic
            </label>
            <select
              value={topicMode === "custom" ? "__custom__" : topicPreset}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__custom__") {
                  setTopicMode("custom");
                } else {
                  setTopicMode("preset");
                  setTopicPreset(v);
                }
                resetTutorAttempts();
              }}
              className="mt-2 elora-input"
            >
              {topicsForSubject.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="__custom__">Custom…</option>
            </select>

            {topicMode === "custom" ? (
              <input
                value={topicCustom}
                onChange={(e) => {
                  setTopicCustom(e.target.value);
                  resetTutorAttempts();
                }}
                className="mt-2 elora-input"
                placeholder="Type your custom topic (e.g., Mixed numbers)"
              />
            ) : null}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <div className="text-sm font-black text-[color:var(--text)]">
            Quick actions
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(ROLE_QUICK_ACTIONS[role] || []).map((a) => {
              const disabled =
                (guest && (a.id === "assessment" || a.id === "slides")) ||
                (role === "educator" && !hasTeacherCode);

              const active = action === a.id;

              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    if (disabled) {
                      if (!verified && !guest) setVerifyGateOpen(true);
                      else if (role === "educator" && !hasTeacherCode)
                        setTeacherGateOpen(true);
                      return;
                    }
                    setAction(a.id);
                    resetTutorAttempts();
                  }}
                  disabled={loading}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-indigo-500/40"
                      : "border-[color:var(--line)] hover:border-indigo-500/25",
                    "bg-[color:var(--surface)] hover:bg-[color:var(--surface2)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-black text-[color:var(--text)]">
                      {a.label}
                    </div>
                    {disabled ? (
                      <span className="text-xs font-black elora-muted">
                        Locked
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs elora-muted">{a.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* More options (keeps the page uncluttered) */}
        <details className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
          <summary className="cursor-pointer text-sm font-black text-[color:var(--text)]">
            More options
          </summary>

          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-black text-[color:var(--text)]">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-2 elora-input"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-black text-[color:var(--text)]">
                  Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="mt-2 elora-input"
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
              <label className="text-sm font-black text-[color:var(--text)]">
                Constraints (optional)
              </label>
              <textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                rows={3}
                className="mt-2 elora-input resize-none"
                placeholder="e.g., 45 minutes, mixed ability, include SEN/EAL support"
              />
            </div>

            {!verified ? (
              <div className="elora-muted text-xs">
                Tip: verify to unlock exports and advanced tools. Guest mode is
                limited.
              </div>
            ) : null}
          </div>
        </details>
      </div>
    );
  }

  // Height locking: main already adds top/bottom padding, so we subtract those plus nav height.
  const pageHeight = "calc(100vh - var(--elora-nav-height) - 24px - 64px)";

  return (
    <div
      className="mx-auto max-w-6xl px-4"
      style={{ height: pageHeight, overflow: "hidden" }}
    >
      <div className="grid h-full gap-5 lg:grid-cols-[360px,1fr]">
        {/* Desktop controls */}
        <aside className="hidden lg:block h-full">
          <div className="elora-card p-5 h-full flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <ControlPanel />
            </div>
          </div>
        </aside>

        {/* Chat panel */}
        <section className="elora-card p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-black text-[color:var(--text)]">
                Chat
              </div>
              <div className="text-xs elora-muted">
                Topic: <span className="font-black">{effectiveTopic}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <StatusChip />
              </div>

              <button
                type="button"
                className="elora-btn elora-btn-ghost hidden sm:inline-flex"
                onClick={clearChat}
              >
                Clear
              </button>

              <button
                type="button"
                className="elora-btn elora-btn-ghost lg:hidden"
                onClick={() => setControlsOpen(true)}
              >
                Customize
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="mt-4 flex-1 min-h-0 relative">
            <div
              ref={chatScrollRef}
              onScroll={onChatScroll}
              className="h-full overflow-y-auto pr-1"
            >
              <div className="flex flex-col gap-3">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "max-w-[92%] rounded-2xl border px-4 py-3",
                      m.from === "user"
                        ? "self-end border-indigo-500/25 bg-[color:var(--surface2)]"
                        : "self-start border-[color:var(--line)] bg-[color:var(--surface)]"
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                      {String(m.text || "")}
                    </ReactMarkdown>
                  </div>
                ))}

                {loading ? (
                  <div className="max-w-[92%] self-start rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-sm elora-muted">
                    Elora is thinking…
                  </div>
                ) : null}
              </div>
            </div>

            {!atBottom ? (
              <button
                type="button"
                onClick={() => scrollToBottom("smooth")}
                className="elora-btn elora-btn-primary"
                style={{
                  position: "absolute",
                  right: 12,
                  bottom: 12,
                  padding: "10px 12px",
                }}
              >
                Jump to latest
              </button>
            ) : null}
          </div>

          {/* Refinement chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => refine(t)}
                disabled={loading}
                className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-xs font-black text-[color:var(--text)] transition hover:bg-[color:var(--surface2)] disabled:opacity-50"
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
              placeholder="Ask Elora to refine, explain, or guide your next step…"
              className="elora-input resize-none flex-1"
            />
            <button
              type="button"
              className="elora-btn elora-btn-primary"
              onClick={sendChat}
              disabled={loading}
            >
              Send
            </button>
          </div>

          {role === "student" ? (
            <div className="mt-2 text-xs elora-muted">
              Attempt: {attempt}/3 (Elora gives hints first, then a full method if needed)
            </div>
          ) : null}
        </section>
      </div>

      {/* Mobile controls drawer */}
      {controlsOpen ? (
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setControlsOpen(false)}
          />
          <div className="absolute left-0 right-0 bottom-0 p-4">
            <div className="elora-card p-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-black text-[color:var(--text)]">
                  Customize
                </div>
                <button
                  type="button"
                  className="elora-btn elora-btn-ghost"
                  onClick={() => setControlsOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
                <ControlPanel compact />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Verification gate */}
      <Modal
        open={verifyGateOpen}
        title="Verify to unlock everything"
        onClose={() => setVerifyGateOpen(false)}
      >
        <div className="text-sm elora-muted">
          Verification unlocks exports and advanced tools. Your status stays saved
          across refreshes.
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            className="elora-btn elora-btn-primary w-full"
            onClick={() => router.push("/verify")}
          >
            Go to verification
          </button>

          <button
            type="button"
            className="elora-btn elora-btn-ghost w-full"
            onClick={() => {
              storeGuest(true);
              setVerifyGateOpen(false);
              setMessages((m) => [
                ...m,
                {
                  from: "elora",
                  text:
                    "Guest mode enabled. You can use Elora (limited). Verify anytime to unlock everything.",
                },
              ]);
            }}
          >
            Continue as Guest (limited)
          </button>
        </div>

        <div className="mt-3 text-xs elora-muted">
          Guest limits: no assessments, no slides, no exports.
        </div>
      </Modal>

      {/* Teacher gate */}
      <Modal
        open={teacherGateOpen}
        title="Teacher invite required"
        onClose={() => setTeacherGateOpen(false)}
      >
        <div className="text-sm elora-muted">
          Educator mode is locked until you enter a valid teacher invite code in
          Settings.
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            className="elora-btn elora-btn-primary w-full"
            onClick={() => {
              setTeacherGateOpen(false);
              router.push("/settings");
            }}
          >
            Go to Settings
          </button>
          <button
            type="button"
            className="elora-btn elora-btn-ghost w-full"
            onClick={() => setTeacherGateOpen(false)}
          >
            Not now
          </button>
        </div>
      </Modal>
    </div>
  );
}
