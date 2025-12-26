import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import RoleIllustration from "../components/RoleIllustration";
import { getSession, setGuest, setRole } from "../lib/session";

const COUNTRY_OPTIONS = ["Singapore", "United States", "United Kingdom", "Australia", "Canada", "India", "Other"];
const LEVEL_OPTIONS = ["Primary (1–6)", "Lower Secondary", "Upper Secondary", "O-Level", "A-Level", "University", "Other"];
const SUBJECT_OPTIONS = ["Math", "Science", "English", "Computer Science", "History", "Geography", "Other"];

const ROLE_QUICK_ACTIONS = {
  educator: [
    { id: "lesson", label: "Plan a lesson", hint: "Objectives, timings, checks, differentiation" },
    { id: "worksheet", label: "Create worksheet", hint: "Core → Application → Challenge + answers" },
    { id: "assessment", label: "Generate assessment", hint: "Marks + marking scheme" },
    { id: "slides", label: "Design slides", hint: "8–12 slide outline" },
    { id: "explain", label: "Explain a topic", hint: "Teach it clearly + practice" },
    { id: "custom", label: "Custom request", hint: "Anything else" },
  ],
  student: [
    { id: "explain", label: "Explain it", hint: "Step-by-step + examples" },
    { id: "worksheet", label: "Give me practice", hint: "Short practice set + answers" },
    { id: "assessment", label: "Quiz me", hint: "Timed quiz + marking", lockedInGuest: true },
    { id: "custom", label: "Revision plan", hint: "What to study + schedule" },
  ],
  parent: [
    { id: "explain", label: "Explain to a parent", hint: "Simple + what it means" },
    { id: "worksheet", label: "Practice at home", hint: "Small set + answers" },
    { id: "custom", label: "How to help", hint: "Activities + common mistakes" },
    { id: "assessment", label: "Progress check", hint: "Mini-check + rubric", lockedInGuest: true },
  ],
};

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function AssistantPage() {
  const [role, setRoleState] = useState("educator");
  const [country, setCountry] = useState("Singapore");
  const [level, setLevel] = useState("Primary (1–6)");
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("Introduction to fractions");

  const [action, setAction] = useState("lesson");

  const [options, setOptions] = useState({
    difficulty: "Mixed",
    length: "Standard",
    questionCount: "Default",
    includeAnswers: true,
  });

  const [messages, setMessages] = useState([
    { from: "elora", text: "Hi — I’m Elora. Pick options on the left, then generate. Use chat to refine." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [verifyGate, setVerifyGate] = useState(false);

  const session = useMemo(() => (typeof window !== "undefined" ? getSession() : { guest: false, verified: false }), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = getSession();

    // If no role chosen yet, default educator (but store it)
    if (!s.role) {
      setRole("educator");
      setRoleState("educator");
    } else {
      setRoleState(s.role);
    }

    // Default action per role
    if (s.role === "student") setAction("explain");
    else if (s.role === "parent") setAction("explain");
    else setAction("lesson");
  }, []);

  const quickActions = ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.educator;

  const guest = session.guest && !session.verified;

  const isLocked = (a) => {
    if (!guest) return false;
    // guest locks slides + assessment (and some role quick actions mark locked)
    if (a === "slides" || a === "assessment") return true;
    return false;
  };

  const optionsText = useMemo(() => {
    const lines = [];
    lines.push(`Difficulty: ${options.difficulty}`);
    lines.push(`Length: ${options.length}`);
    if (action === "worksheet" || action === "assessment") lines.push(`Question count: ${options.questionCount}`);
    if (action !== "slides") lines.push(`Include answers: ${options.includeAnswers ? "Yes" : "No"}`);
    return lines.join("\n");
  }, [options, action]);

  const append = (from, text) => setMessages((m) => [...m, { from, text }]);

  async function callAssistant({ message }) {
    const payload = {
      role,
      country,
      level,
      subject,
      topic,
      action,
      message: message || "",
      options: optionsText,
      guest,
    };

    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = data?.error || "Something went wrong talking to Elora.";
      throw new Error(err);
    }
    return data.reply;
  }

  const handleGenerate = async () => {
    if (isLocked(action)) {
      setVerifyGate(true);
      return;
    }
    setLoading(true);
    try {
      append("user", `Generate: ${action} — ${topic}`);
      const reply = await callAssistant({ message: "" });
      append("elora", reply);
    } catch (e) {
      append("elora", e.message || "Error generating response.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    setLoading(true);
    try {
      append("user", msg);
      const reply = await callAssistant({ message: msg });
      append("elora", reply);
    } catch (e) {
      append("elora", e.message || "Error generating response.");
    } finally {
      setLoading(false);
    }
  };

  const statusPill = session.verified
    ? { text: "Verified ✅", cls: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20" }
    : guest
    ? { text: "Guest ⚠️ limited", cls: "bg-amber-500/15 text-amber-200 border-amber-400/20" }
    : { text: "Unverified", cls: "bg-slate-500/10 text-slate-300 border-white/10" };

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* LEFT: Prompt builder */}
        <div className="rounded-2xl border border-white/10 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-black text-slate-950 dark:text-white">Prompt Builder</div>
              <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                Options first → Elora generates. Chat is for refinement.
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${statusPill.cls}`}>
              {statusPill.text}
            </span>
          </div>

          <div className="mt-4">
            <RoleIllustration role={role} />
          </div>

          <div className="mt-4 grid gap-3">
            <div>
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Role</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {["educator", "student", "parent"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRoleState(r);
                      setRole(r);
                      // role default action
                      if (r === "educator") setAction("lesson");
                      else setAction("explain");
                    }}
                    className={classNames(
                      "px-3 py-2 rounded-xl border text-sm font-extrabold transition",
                      role === r
                        ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200"
                        : "border-white/10 bg-white/45 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-950/50"
                    )}
                  >
                    {r[0].toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Country / Region</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/50 dark:bg-slate-950/30 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c} value={c} className="text-slate-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Level</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/50 dark:bg-slate-950/30 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  {LEVEL_OPTIONS.map((l) => (
                    <option key={l} value={l} className="text-slate-900">
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Subject</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/50 dark:bg-slate-950/30 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s} className="text-slate-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Topic</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/50 dark:bg-slate-950/30 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Introduction to fractions"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Quick actions</label>
              <div className="mt-2 grid sm:grid-cols-2 gap-2">
                {quickActions.map((a) => {
                  const locked = isLocked(a.id) || Boolean(a.lockedInGuest && guest);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        if (locked) {
                          setVerifyGate(true);
                          return;
                        }
                        setAction(a.id);
                      }}
                      className={classNames(
                        "p-3 rounded-xl border text-left transition",
                        action === a.id
                          ? "border-indigo-500/45 bg-indigo-500/10"
                          : "border-white/10 bg-white/45 dark:bg-slate-950/30 hover:bg-white/70 dark:hover:bg-slate-950/50",
                        locked ? "opacity-60" : ""
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {a.label}
                        </div>
                        {locked ? (
                          <span className="text-xs font-bold text-amber-300">Locked</span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">{a.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Difficulty</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/50 dark:bg-slate-950/30 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  value={options.difficulty}
                  onChange={(e) => setOptions((o) => ({ ...o, difficulty: e.target.value }))}
                >
                  {["Easy", "Standard", "Mixed", "Challenging"].map((d) => (
                    <option key={d} value={d} className="text-slate-900">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Length</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/50 dark:bg-slate-950/30 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  value={options.length}
                  onChange={(e) => setOptions((o) => ({ ...o, length: e.target.value }))}
                >
                  {["Short", "Standard", "Detailed"].map((d) => (
                    <option key={d} value={d} className="text-slate-900">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {(action === "worksheet" || action === "assessment") && (
                <div>
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Question count</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/50 dark:bg-slate-950/30 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    value={options.questionCount}
                    onChange={(e) => setOptions((o) => ({ ...o, questionCount: e.target.value }))}
                  >
                    {["Default", "Short (5–8)", "Medium (10–15)", "Long (18–25)"].map((q) => (
                      <option key={q} value={q} className="text-slate-900">
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {action !== "slides" && (
                <label className="flex items-center gap-2 mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={options.includeAnswers}
                    onChange={(e) => setOptions((o) => ({ ...o, includeAnswers: e.target.checked }))}
                  />
                  Include answers
                </label>
              )}
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="mt-2 w-full px-5 py-3 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-xl shadow-indigo-500/20"
            >
              {loading ? "Generating…" : "Generate with Elora"}
            </button>

            {guest && (
              <div className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
                Guest mode is limited: assessments & slides are locked, and outputs are shorter.
                Verify to unlock everything.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Chat + Output */}
        <div className="rounded-2xl border border-white/10 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-black text-slate-950 dark:text-white">Elora Assistant</div>
              <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {country} · {level} · {subject} · <span className="font-bold">{role}</span>
              </div>
            </div>

            {!session.verified && (
              <button
                type="button"
                onClick={() => setVerifyGate(true)}
                className="px-4 py-2 rounded-full text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
              >
                Verify to unlock
              </button>
            )}
          </div>

          <div className="mt-4 h-[460px] overflow-auto pr-1 flex flex-col gap-3">
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
                {m.text}
              </div>
            ))}
          </div>

          {/* Refinement chips (the “prompting problem” solver) */}
          <div className="mt-3 flex flex-wrap gap-2">
            {["Shorter", "More challenging", "Differentiate", "Add misconceptions", "Quiz me every 3 steps"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setInput((prev) => (prev ? `${prev}\n${t}` : t))}
                className="px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 bg-white/50 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-950/50"
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-full border border-white/10 bg-white/55 dark:bg-slate-950/30 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Elora to refine, explain, or generate a variant…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={handleSend}
              className="px-5 py-3 rounded-full font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-lg shadow-indigo-500/20"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <Modal open={verifyGate} title="Unlock full Elora features" onClose={() => setVerifyGate(false)}>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Full mode unlocks assessments, slide generation, and longer outputs. Guest mode is limited.
        </p>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => (window.location.href = "/verify")}
            className="w-full px-5 py-3 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            Sign in / Verify
          </button>

          <button
            type="button"
            onClick={() => {
              setGuest(true);
              setVerifyGate(false);
            }}
            className="w-full px-5 py-3 rounded-xl font-bold border border-white/10 bg-white/60 dark:bg-slate-950/40 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-slate-950/60"
          >
            Stay in Guest mode
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Note: AI can be wrong — verify important details with your syllabus/teacher.
        </div>
      </Modal>
    </>
  );
}
