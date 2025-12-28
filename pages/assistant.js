import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Modal from "../components/Modal";
import RoleIllustration from "../components/RoleIllustration";
import {
  activateTeacher,
  getResolvedTheme,
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

const ROLE_QUICK_ACTIONS = {
  educator: [
    { id: "lesson", label: "Plan a lesson", hint: "Objectives, timings, checks, differentiation" },
    { id: "worksheet", label: "Create worksheet", hint: "Student + Teacher versions, export-ready" },
    { id: "assessment", label: "Generate assessment", hint: "Marks + marking scheme (Teacher)" },
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
  const teacher = isTeacher();

  const [role, setRole] = useState(session.role || "student");
  const [country, setCountry] = useState("Singapore");
  const levelOptions = useMemo(
    () => LEVELS_BY_COUNTRY[country] || LEVELS_BY_COUNTRY.Other,
    [country]
  );
  const [level, setLevel] = useState(levelOptions[0] || "Primary / Elementary");
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("Introduction to fractions");
  const [constraints, setConstraints] = useState("");
  const [action, setAction] = useState(
    ROLE_QUICK_ACTIONS[role]?.[0]?.id || "explain"
  );

  const [messages, setMessages] = useState(() => [
    {
      from: "elora",
      text:
        "Hi! I’m **Elora**.\n\nPick options on the left (that’s the hard part of prompting) and I’ll generate something clean you can actually use.\n\nUse chat for refinements.",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [teacherGateStatus, setTeacherGateStatus] = useState("");

  // Student tutor attempts
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

  useEffect(() => {
    storeRole(role);
  }, [role]);

  const guestBlocked = useMemo(() => {
    if (!guest) return false;
    return action === "assessment" || action === "slides";
  }, [guest, action]);

  const chips = useMemo(
    () => REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.custom,
    [action]
  );

  function resetTutorAttempts() {
    setAttempt(0);
  }

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
      topic,
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
      setMessages((m) => [
        ...m,
        { from: "elora", text: e?.message || "Sorry — something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const [chatText, setChatText] = useState("");

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
    const trimmed = (code || "").trim();
    setTeacherGateStatus("");
    if (!trimmed) {
      setTeacherGateStatus("Enter a code.");
      return false;
    }
    if (!verified) {
      setTeacherGateStatus("Verify your email first. Educator access requires verification.");
      return false;
    }
    try {
      const r = await fetch(`/api/teacher-invite?code=${encodeURIComponent(trimmed)}`);
      if (!r.ok) {
        setTeacherGateStatus("Invalid code.");
        return false;
      }
      activateTeacher(trimmed);
      setTeacherGateStatus("Educator access enabled ✅");
      return true;
    } catch {
      setTeacherGateStatus("Could not validate right now. Try again.");
      return false;
    }
  }

  return (
    <div className="py-6">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* LEFT */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/35 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-950 dark:text-white">
                Prompt Builder
              </h1>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                Options first → Elora generates. Chat is for refinement.
              </p>
              {role === "student" ? (
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Tutor mode: you attempt first. Elora guides with hints (up to 3 attempts).
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {guest ? (
                <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
                  Guest
                </span>
              ) : verified ? (
                <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
                  {teacher ? "Teacher ✓" : "Verified ✓"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 text-slate-800 dark:text-slate-200">
                  Unverified
                </span>
              )}
            </div>
          </div>

          <div className="mt-5">
            <RoleIllustration role={role} />
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

          {/* Country + Level */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-white">
                Country / Region
              </label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  resetTutorAttempts();
                }}
                className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
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
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
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
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-white">Topic</label>
              <input
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  resetTutorAttempts();
                }}
                className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
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
              className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
              placeholder="e.g., 45 minutes, mixed ability, include SEN/EAL support"
            />
          </div>

          {/* Quick actions */}
          <div className="mt-6">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Quick actions
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {ROLE_QUICK_ACTIONS[role].map((a) => {
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
                      <div className="text-sm font-extrabold text-slate-950 dark:text-white">
                        {a.label}
                      </div>
                      {disabled ? (
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-200">
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
                resetTutorAttempts();
                callElora({ messageOverride: "" });
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
        </div>

        {/* RIGHT */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/35 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 p-5 flex flex-col lg:min-h-[680px]">
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
          </div>

          <div className="mt-4 flex-1 overflow-auto pr-1">
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
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => refine(t)}
                  disabled={loading}
                  className="rounded-full px-3 py-2 text-xs font-bold border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/40 disabled:opacity-50"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChat();
              }}
              placeholder="Ask Elora to refine, explain, or guide your next attempt…"
              className="flex-1 rounded-full border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
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

      {/* Verify gate modal */}
      <Modal
        open={verifyGateOpen}
        title="Verify to unlock Elora"
        onClose={() => setVerifyGateOpen(false)}
      >
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Exports and advanced tools are locked behind verification. You can still preview as a limited guest.
        </p>

        <div className="mt-4 grid gap-2">
          <a
            href="/verify"
            className="w-full text-center px-5 py-3 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            Sign in / Verify
          </a>

          {/* FIXED: guest now works because session.js emits elora:session + UI sync */}
          <button
            type="button"
            onClick={() => {
              storeGuest(true);
              setSession(getSession());
              setVerifyGateOpen(false);
              setMessages((m) => [...m, { from: "elora", text: "Guest mode enabled. You can use Elora (limited)." }]);
            }}
            className="w-full px-5 py-3 rounded-xl font-bold border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/30 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/45"
          >
            Continue as Guest (limited)
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Guest limits: no assessments, no slides, no exports.
        </div>
      </Modal>

      {/* Teacher invite gate */}
      <Modal
        open={teacherGateOpen}
        title="Teacher Invite Required"
        onClose={() => {
          setTeacherGateOpen(false);
          setTeacherGateStatus("");
        }}
      >
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Educator mode is protected to prevent students misusing teacher tools.
          Teachers need a valid invite code and verification.
        </p>

        <div className="mt-4">
          <label className="text-sm font-bold text-slate-900 dark:text-white">Invite code</label>
          <input
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder="e.g., GENESIS2026"
            className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          {teacherGateStatus ? (
            <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
              {teacherGateStatus}
            </div>
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
              className="w-full px-5 py-3 rounded-xl font-bold border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/30 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-950/45"
              onClick={() => {
                setTeacherGateOpen(false);
                setRole("student");
              }}
            >
              I’m not a teacher (switch to Student)
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
