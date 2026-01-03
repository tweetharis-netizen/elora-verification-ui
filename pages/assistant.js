import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  getSession,
  isTeacher,
  refreshVerifiedFromServer,
  setRoleUX,
} from "@/lib/session";

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
    "Junior College / Pre-U",
    "Polytechnic",
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
    "Form 6",
    "University",
    "Other",
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
    { id: "explain", label: "Tutor me", hint: "You attempt first → I guide step-by-step" },
    { id: "check", label: "Check my answer", hint: "Spot mistakes + fix them kindly" },
    { id: "rewrite", label: "Improve my writing", hint: "Clear, confident, and human" },
  ],
  parent: [
    { id: "support", label: "Support my child", hint: "Simple steps, calm pacing, no intimidation" },
    { id: "plan", label: "Study plan", hint: "Daily schedule + revision checklist" },
  ],
};

const REFINEMENT_CHIPS = {
  quick: { label: "Quick", hint: "Short answer" },
  clear: { label: "Clear", hint: "Beginner-friendly" },
  detailed: { label: "Detailed", hint: "More depth and steps" },
  custom: { label: "Custom", hint: "Your preference" },
};

const ACTION_REQUIRE_VERIFIED = new Set(["assessment", "slides"]);

function isGuestAllowedAction(action) {
  // Preserve your existing “guest mode” constraints.
  // Verified unlocks everything.
  if (!action) return true;
  if (ACTION_REQUIRE_VERIFIED.has(action)) return false;
  return true;
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
  const [level, setLevel] = useState(levelOptions?.[0] || "Other");
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("");
  const [action, setAction] = useState("explain");
  const [refinement, setRefinement] = useState("clear");
  const [customRefinement, setCustomRefinement] = useState("");

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

  const [sending, setSending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const attemptRef = useRef(0);
  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);

  useEffect(() => {
    // Keep server truth fresh (role + verified)
    refreshVerifiedFromServer();
  }, []);

  useEffect(() => {
    // Sync role UX selection to local session cache
    setRoleUX(role);
  }, [role]);

  const refinementChip = useMemo(
    () => REFINEMENT_CHIPS[refinement] || REFINEMENT_CHIPS.custom,
    [refinement]
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

    const guestBlocked = !verified && !isGuestAllowedAction(action);

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

    const text = String(messageOverride || draft || "").trim();
    if (!text) return;

    setSending(true);
    setMessages((m) => [...m, { from: "you", text }]);
    setDraft("");

    try {
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          country,
          level,
          subject,
          topic,
          action,
          refinement,
          customRefinement,
          message: text,
          attempt: nextAttempt,
        }),
      });

      const data = await r.json().catch(() => null);
      const reply = String(data?.reply || "Sorry — something went wrong. Try again.");

      setMessages((m) => [...m, { from: "elora", text: reply }]);
    } catch {
      setMessages((m) => [...m, { from: "elora", text: "Couldn’t reach Elora. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  const actionsForRole = (ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.student);

  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="grid gap-6">
        <div className="elora-card p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="font-black text-[clamp(22px,3vw,30px)]">Assistant</h1>
              <p className="mt-2 elora-muted">
                Clear, calm help for educators and learners. No scary math symbols by default.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {teacher ? (
                <span className="elora-chip elora-chip-teacher">Teacher</span>
              ) : null}
              {verified ? (
                <span className="elora-chip elora-chip-good">Verified</span>
              ) : (
                <span className="elora-chip elora-chip-warn">Guest</span>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-xs elora-muted mb-2">Role</div>
                <select
                  className="elora-input"
                  value={role}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRole(v);
                    resetTutorAttempts();
                  }}
                >
                  <option value="student">Student</option>
                  <option value="educator">Educator</option>
                  <option value="parent">Parent</option>
                </select>
              </div>

              <div>
                <div className="text-xs elora-muted mb-2">Country</div>
                <select className="elora-input" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="Singapore">Singapore</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="US">US</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <div className="text-xs elora-muted mb-2">Level</div>
                <select className="elora-input" value={level} onChange={(e) => setLevel(e.target.value)}>
                  {levelOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs elora-muted mb-2">Subject</div>
                <select className="elora-input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="text-xs elora-muted mb-2">Topic (optional)</div>
                <input
                  className="elora-input"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Fractions, persuasive writing, revision plan"
                />
              </div>
            </div>

            <div>
              <div className="text-xs elora-muted mb-2">Quick actions</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {actionsForRole.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`elora-quick ${action === a.id ? "is-active" : ""}`}
                    onClick={() => setAction(a.id)}
                  >
                    <div className="font-black">{a.label}</div>
                    <div className="text-xs elora-muted mt-1">{a.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs elora-muted mb-2">Style</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(REFINEMENT_CHIPS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    className={`elora-chip-btn ${refinement === k ? "is-active" : ""}`}
                    onClick={() => setRefinement(k)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              {refinement === "custom" ? (
                <input
                  className="elora-input mt-3"
                  value={customRefinement}
                  onChange={(e) => setCustomRefinement(e.target.value)}
                  placeholder="e.g. Keep it very short, use simple examples"
                />
              ) : (
                <div className="mt-2 text-xs elora-muted">{refinementChip.hint}</div>
              )}
            </div>
          </div>
        </div>

        <div className="elora-card p-5 sm:p-7">
          <div className="grid gap-3">
            <div className="text-xs elora-muted">Chat</div>

            <div className="elora-chat">
              {messages.length === 0 ? (
                <div className="elora-muted text-sm">
                  Try: <b>“Explain 5 divided by 4”</b> or <b>“Rewrite this paragraph to sound clearer”</b>.
                </div>
              ) : null}

              {messages.map((m, i) => (
                <div key={i} className={`elora-msg ${m.from === "you" ? "is-you" : "is-elora"}`}>
                  <div className="text-xs elora-muted mb-1">{m.from === "you" ? "You" : "Elora"}</div>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <textarea
                className="elora-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask anything…"
                rows={4}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="elora-btn"
                  onClick={() => callElora({ messageOverride: draft })}
                  disabled={sending}
                >
                  {sending ? "Thinking…" : "Send"}
                </button>

                {role === "student" ? (
                  <button type="button" className="elora-btn elora-btn-ghost" onClick={resetTutorAttempts}>
                    Reset attempt
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {verifyGateOpen ? (
          <div className="elora-modal">
            <div className="elora-modal-card">
              <div className="font-black text-lg">Verify to unlock full access</div>
              <p className="mt-2 elora-muted text-sm">
                Verification persists across refresh and browser restarts.
              </p>
              <div className="mt-4 flex gap-2">
                <button className="elora-btn" onClick={() => router.push("/verify")}>
                  Verify email
                </button>
                <button className="elora-btn elora-btn-ghost" onClick={() => setVerifyGateOpen(false)}>
                  Not now
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {teacherGateOpen ? (
          <div className="elora-modal">
            <div className="elora-modal-card">
              <div className="font-black text-lg">Teacher tools locked</div>
              <p className="mt-2 elora-muted text-sm">
                Switch Role to Student/Parent, or redeem a teacher invite code in Settings.
              </p>
              <div className="mt-4 flex gap-2">
                <button className="elora-btn" onClick={() => router.push("/settings")}>
                  Go to Settings
                </button>
                <button className="elora-btn elora-btn-ghost" onClick={() => setTeacherGateOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
