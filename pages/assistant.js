import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Modal from "../components/Modal";
import RoleIllustration from "../components/RoleIllustration";
import { getSession } from "../lib/session";

const COUNTRY_OPTIONS = [
  "Singapore",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "India",
  "Other"
];

// Country-aware level labels (the point of country selection)
const LEVELS_BY_COUNTRY = {
  Singapore: ["Primary (1–6)", "Secondary (1–2)", "Secondary (3–4)", "O-Level", "A-Level", "University", "Other"],
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
    "Other"
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
    "Other"
  ],
  Australia: ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "University", "Other"],
  Canada: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "University", "Other"],
  India: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "University", "Other"],
  Other: ["Primary / Elementary", "Middle School", "High School", "Pre-University", "University", "Other"]
};

const SUBJECT_OPTIONS = ["Math", "Science", "English", "Computer Science", "History", "Geography", "Other"];

const ROLE_QUICK_ACTIONS = {
  educator: [
    { id: "lesson", label: "Plan a lesson", hint: "Objectives, timings, checks, differentiation" },
    { id: "worksheet", label: "Create worksheet", hint: "Core → Application → Challenge + answers" },
    { id: "assessment", label: "Generate assessment", hint: "Marks, instructions, marking scheme" },
    { id: "slides", label: "Design slides", hint: "Slide titles + bullets" }
  ],
  student: [
    { id: "explain", label: "Explain it", hint: "Step-by-step + examples" },
    { id: "worksheet", label: "Give me practice", hint: "Short practice set + answers" },
    { id: "custom", label: "Custom request", hint: "Ask anything" }
  ],
  parent: [
    { id: "explain", label: "Explain it", hint: "Simple explanation + common mistakes" },
    { id: "worksheet", label: "Practice for my child", hint: "Core practice + answers" },
    { id: "custom", label: "Custom request", hint: "Ask anything" }
  ]
};

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function safeFilename(name) {
  return (name || "Elora-Export")
    .toString()
    .trim()
    .replace(/[^a-z0-9\\- _]/gi, "")
    .replace(/\\s+/g, "-")
    .slice(0, 80);
}

export default function AssistantPage() {
  const [session, setSession] = useState(() => getSession());

  // Keep session in sync (after verify/success pages etc)
  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const verified = session.verified;
  const guest = session.guest;

  const [role, setRole] = useState(session.role || "educator");
  const [country, setCountry] = useState("Singapore");
  const levelOptions = useMemo(() => LEVELS_BY_COUNTRY[country] || LEVELS_BY_COUNTRY.Other, [country]);
  const [level, setLevel] = useState(levelOptions[0]);
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("Introduction to fractions");
  const [action, setAction] = useState(ROLE_QUICK_ACTIONS[role][0]?.id || "lesson");

  const [messages, setMessages] = useState(() => [
    {
      from: "elora",
      text:
        "Hi! I’m **Elora**. Pick options on the left (that’s the hard part of prompting) and I’ll generate something clean you can actually use.\n\nIf you want, ask a question in the chat box for refinements."
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [verifyGateOpen, setVerifyGateOpen] = useState(false);

  // When country changes, ensure level stays valid (and feels localized)
  useEffect(() => {
    if (!levelOptions.includes(level)) setLevel(levelOptions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, levelOptions.join("|")]);

  // When role changes, default action and show relevant quick actions
  useEffect(() => {
    const first = ROLE_QUICK_ACTIONS[role]?.[0]?.id || "lesson";
    setAction(first);
  }, [role]);

  const guestBlocked = useMemo(() => {
    if (!guest) return false;
    return action === "assessment" || action === "slides";
  }, [guest, action]);

  const lastEloraReply = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.from === "elora") return messages[i].text || "";
    }
    return "";
  }, [messages]);

  async function callElora({ messageOverride = "" } = {}) {
    if (!verified && !guest) {
      setVerifyGateOpen(true);
      return;
    }

    if (guestBlocked) {
      setMessages((m) => [
        ...m,
        { from: "elora", text: "Guest mode is limited — please **Verify to unlock** assessments and slide generation." }
      ]);
      return;
    }

    const payload = {
      role,
      country,
      level,
      subject,
      topic,
      action,
      guest,
      message: messageOverride
    };

    setLoading(true);

    try {
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "AI request failed.");

      setMessages((m) => [...m, { from: "elora", text: data.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          from: "elora",
          text:
            "Sorry — something went wrong talking to the AI. Try again in a moment.\n\nIf this keeps happening, it’s usually a missing env var or model error."
        }
      ]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function exportDocx() {
    if (!verified) {
      setVerifyGateOpen(true);
      return;
    }
    if (!lastEloraReply) return;

    try {
      const title = `${role.toUpperCase()} — ${subject} — ${topic}`.trim();

      const r = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: lastEloraReply })
      });

      if (!r.ok) {
        const data = await r.json().catch(() => null);
        throw new Error(data?.error || "Export failed");
      }

      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeFilename(title)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { from: "elora", text: "Export failed. Try again." }]);
    }
  }

  async function copyReply() {
    if (!lastEloraReply) return;
    try {
      await navigator.clipboard.writeText(lastEloraReply);
      setMessages((m) => [...m, { from: "elora", text: "Copied ✅" }]);
    } catch {
      setMessages((m) => [...m, { from: "elora", text: "Copy failed — your browser blocked it." }]);
    }
  }

  // Refinement chips: these are “safe prompts” for follow-ups
  async function refine(text) {
    setMessages((m) => [...m, { from: "user", text }]);
    await callElora({ messageOverride: text });
  }

  // Chat input
  const [chatText, setChatText] = useState("");

  async function sendChat() {
    const msg = chatText.trim();
    if (!msg) return;

    if (!verified && !guest) {
      setVerifyGateOpen(true);
      return;
    }

    setChatText("");
    setMessages((m) => [...m, { from: "user", text: msg }]);
    await callElora({ messageOverride: msg });
  }

  return (
    <div className="py-6">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* LEFT: Prompt Builder */}
        <div className="rounded-2xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-950 dark:text-white">Prompt Builder</h1>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                Options first → Elora generates. Chat is for refinement.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {guest ? (
                <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200">
                  Guest ⚠ limited
                </span>
              ) : verified ? (
                <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                  Verified ✓
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-white/10 bg-white/40 dark:bg-slate-950/30 text-slate-700 dark:text-slate-200">
                  Unverified
                </span>
              )}
            </div>
          </div>

          {/* Mini illustration */}
          <div className="mt-5">
            <RoleIllustration role={role} />
          </div>

          {/* Role */}
          <div className="mt-5">
            <div className="text-sm font-bold text-slate-900 dark:text-white">Role</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["educator", "student", "parent"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={classNames(
                    "rounded-xl border px-3 py-2 text-sm font-extrabold transition",
                    role === r
                      ? "border-indigo-500/40 bg-indigo-600/10 text-indigo-700 dark:text-indigo-200"
                      : "border-white/10 bg-white/40 dark:bg-slate-950/30 text-slate-900 dark:text-white hover:bg-white/60 dark:hover:bg-slate-950/45"
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
              <label className="text-sm font-bold text-slate-900 dark:text-white">Country / Region</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/55 dark:bg-slate-950/35 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Used to match syllabus/terminology (Primary vs Grade vs Year).
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-white">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/55 dark:bg-slate-950/35 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {levelOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
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
                onChange={(e) => setSubject(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/55 dark:bg-slate-950/35 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
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
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/55 dark:bg-slate-950/35 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                placeholder="e.g., Fractions, Photosynthesis, Loops in Python"
              />
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-6">
            <div className="text-sm font-bold text-slate-900 dark:text-white">Quick actions</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {ROLE_QUICK_ACTIONS[role].map((a) => {
                const disabled = guest && (a.id === "assessment" || a.id === "slides");
                const active = action === a.id;

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAction(a.id)}
                    disabled={disabled}
                    className={classNames(
                      "rounded-2xl border p-4 text-left transition",
                      active
                        ? "border-indigo-500/40 bg-indigo-600/10 shadow-lg shadow-indigo-500/10"
                        : "border-white/10 bg-white/40 dark:bg-slate-950/30 hover:bg-white/60 dark:hover:bg-slate-950/45",
                      disabled ? "opacity-50 cursor-not-allowed" : ""
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-extrabold text-slate-950 dark:text-white">{a.label}</div>
                      {disabled ? <span className="text-xs font-bold text-amber-700 dark:text-amber-200">Locked</span> : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{a.hint}</div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => callElora({ messageOverride: "" })}
              disabled={loading}
              className={classNames(
                "mt-5 w-full rounded-full px-6 py-3 font-extrabold text-white shadow-xl shadow-indigo-500/20",
                loading ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {loading ? "Generating…" : "Generate with Elora"}
            </button>

            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tip: If Elora’s output is close, use the refinement chips on the right (that’s where the “prompting problem”
              gets solved).
            </div>
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div className="rounded-2xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-5 flex flex-col min-h-[680px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Elora Assistant</h2>
              <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {country} • {level} • {subject} • <span className="font-semibold">{role}</span>
              </div>
            </div>

            {!verified ? (
              <button
                type="button"
                onClick={() => setVerifyGateOpen(true)}
                className="rounded-full px-4 py-2 text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
              >
                Verify to unlock
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyReply}
                  disabled={!lastEloraReply}
                  className="rounded-full px-4 py-2 text-sm font-bold border border-white/10 bg-white/50 dark:bg-slate-950/35 text-slate-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-950/50 disabled:opacity-50"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={exportDocx}
                  disabled={!lastEloraReply}
                  className="rounded-full px-4 py-2 text-sm font-extrabold text-white bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  Download DOCX
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="mt-4 flex-1 overflow-auto pr-1">
            <div className="space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={classNames(
                    "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed border",
                    m.from === "user"
                      ? "ml-auto bg-indigo-600 text-white border-indigo-500/20"
                      : "mr-auto bg-white/60 dark:bg-slate-950/30 text-slate-900 dark:text-slate-100 border-white/10"
                  )}
                >
                  {m.from === "user" ? (
                    m.text
                  ) : (
                    <div className="elora-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Refinement chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {["Shorter", "More challenging", "Differentiate", "Add misconceptions", "Quiz me every 3 steps"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => refine(t)}
                  disabled={loading}
                  className="rounded-full px-3 py-2 text-xs font-bold border border-white/10 bg-white/45 dark:bg-slate-950/30 text-slate-900 dark:text-white hover:bg-white/65 dark:hover:bg-slate-950/45 disabled:opacity-50"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Chat input */}
          <div className="mt-4 flex items-center gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChat();
              }}
              placeholder="Ask Elora to refine, explain, or generate a variant…"
              className="flex-1 rounded-full border border-white/10 bg-white/60 dark:bg-slate-950/35 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            <button
              type="button"
              onClick={sendChat}
              disabled={loading}
              className={classNames(
                "rounded-full px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20",
                loading ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              Send
            </button>
          </div>

          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Export note: DOCX downloads can be uploaded into <span className="font-semibold">Google Docs</span> or{" "}
            <span className="font-semibold">Kami</span>.
          </div>
        </div>
      </div>

      {/* Verify gate modal */}
      <Modal open={verifyGateOpen} title="Verify to unlock Elora" onClose={() => setVerifyGateOpen(false)}>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          To unlock full features (assessments, slides, exports), please verify your email. You can still try a limited
          guest preview.
        </p>

        <div className="mt-4 grid gap-2">
          <a
            href="/verify"
            className="w-full text-center px-5 py-3 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            Sign in / Verify
          </a>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.setItem("elora_guest", "1");
              }
              setSession(getSession());
              setVerifyGateOpen(false);
            }}
            className="w-full px-5 py-3 rounded-xl font-bold border border-white/10 bg-white/60 dark:bg-slate-950/40 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-slate-950/60"
          >
            Continue as Guest (limited)
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Guest limits: no assessments, no slides, no exports.
        </div>
      </Modal>
    </div>
  );
}
