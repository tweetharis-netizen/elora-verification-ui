import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";

const COUNTRY_OPTIONS = [
  "Singapore",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "India",
  "Other",
];

const LEVEL_OPTIONS = [
  "Primary (1–6)",
  "Lower Secondary",
  "Upper Secondary / O-Level",
  "JC / Pre-University",
  "Grade 1–5",
  "Grade 6–8",
  "Grade 9–12",
  "University / Tertiary",
];

const SUBJECT_OPTIONS = [
  "Math",
  "Science",
  "English",
  "History",
  "Geography",
  "Computer Science",
  "Language",
  "Other",
];

const ACTIONS = [
  { id: "lesson", label: "Plan a lesson" },
  { id: "worksheet", label: "Create worksheet" },
  { id: "assessment", label: "Generate assessment" },
  { id: "slides", label: "Design lesson slides" },
  { id: "explain", label: "Explain a topic" },
  { id: "custom", label: "Custom request" },
];

export default function AssistantPage() {
  const router = useRouter();
  const [role, setRole] = useState("educator");
  const [country, setCountry] = useState("Singapore");
  const [level, setLevel] = useState("Primary (1–6)");
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("Introduction to fractions");
  const [action, setAction] = useState("lesson");

  const [messages, setMessages] = useState([
    {
      from: "elora",
      text: "Hello! I’m Elora. I can help you create lessons, worksheets, assessments and explain topics for your students.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [lastExportText, setLastExportText] = useState("");

  // Read role from URL if available
  useEffect(() => {
    if (!router.isReady) return;
    const queryRole = router.query.role;
    if (queryRole === "student" || queryRole === "parent" || queryRole === "educator") {
      setRole(queryRole);
    }
  }, [router.isReady, router.query.role]);

  const roleLabel = useMemo(() => {
    if (role === "student") return "Student";
    if (role === "parent") return "Parent";
    return "Educator";
  }, [role]);

  const activeProfileLabel = `${country} · ${level} · ${subject}`;

  const appendMessage = (from, text) => {
    setMessages((prev) => [...prev, { from, text }]);
  };

  async function callAssistantAPI(payload) {
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      return data.reply || data.message || "Sorry, I couldn’t generate a response just now.";
    } catch (err) {
      console.error("Assistant API error:", err);
      return (
        "Sorry, something went wrong talking to the AI. " +
        "You can ask your question again, or tweak the topic / action and try once more."
      );
    }
  }

  function buildContext() {
    return {
      role,
      country,
      level,
      subject,
      topic,
      profileSummary: `Role: ${roleLabel} · Country: ${country} · Level: ${level} · Subject: ${subject} · Topic: ${topic}`,
    };
  }

  const handleGenerateStructured = async () => {
    if (!topic.trim()) {
      return;
    }
    setIsThinking(true);

    const context = buildContext();
    const userIntent = ACTIONS.find((a) => a.id === action)?.label || "Plan a lesson";

    appendMessage(
      "me",
      `${userIntent} for "${topic}" (${activeProfileLabel})`
    );

    const reply = await callAssistantAPI({
      ...context,
      mode: "structured",
      action,
      message: "",
    });

    appendMessage("elora", reply);
    setLastExportText(reply);
    setIsThinking(false);
  };

  const handleSendFreeChat = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput("");
    appendMessage("me", trimmed);
    setIsThinking(true);

    const context = buildContext();

    const reply = await callAssistantAPI({
      ...context,
      mode: "chat",
      action: action || "lesson",
      message: trimmed,
    });

    appendMessage("elora", reply);
    setLastExportText(reply);
    setIsThinking(false);
  };

  const handleDownload = (kind) => {
    if (!lastExportText) return;
    let filename = "elora-output.txt";
    if (kind === "lesson") filename = "elora-lesson-plan.txt";
    if (kind === "worksheet") filename = "elora-worksheet.txt";
    if (kind === "assessment") filename = "elora-assessment.txt";
    if (kind === "slides") filename = "elora-slides-outline.txt";

    const blob = new Blob([lastExportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="elora-assistant-shell">
      {/* LEFT: Teaching profile */}
      <aside className="elora-panel space-y-4">
        <div className="text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Teaching profile
        </div>
        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {activeProfileLabel}
        </div>

        {/* Role */}
        <div>
          <label className="elora-label">Role</label>
          <select
            className="elora-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="educator">Educator</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="elora-label">Country / region</label>
          <select
            className="elora-select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div>
          <label className="elora-label">Level</label>
          <select
            className="elora-select"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {LEVEL_OPTIONS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="elora-label">Subject</label>
          <select
            className="elora-select"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <label className="elora-label">Topic</label>
          <input
            className="elora-input"
            placeholder="e.g. Introduction to fractions"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        {/* What to create */}
        <div>
          <label className="elora-label">What do you want Elora to create?</label>
          <div className="elora-action-grid">
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`elora-action-btn ${
                  action === a.id ? "active" : ""
                }`}
                onClick={() => setAction(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateStructured}
          disabled={isThinking || !topic}
          className="w-full mt-2 elora-primary-button py-2.5 text-sm font-semibold"
        >
          {isThinking ? "Elora is thinking…" : "Generate with Elora"}
        </button>

        <p className="elora-helper-text">
          Elora builds the best possible prompt using your role, country, level,
          subject and topic. You just choose and click generate.
        </p>

        {/* Export row */}
        <div className="elora-export-row">
          <button
            type="button"
            className="elora-export-btn"
            onClick={() => handleDownload("lesson")}
          >
            Download lesson (.txt)
          </button>
          <button
            type="button"
            className="elora-export-btn"
            onClick={() => handleDownload("worksheet")}
          >
            Download worksheet (.txt)
          </button>
          <button
            type="button"
            className="elora-export-btn"
            onClick={() => handleDownload("assessment")}
          >
            Download assessment (.txt)
          </button>
          <button
            type="button"
            className="elora-export-btn"
            onClick={() => handleDownload("slides")}
          >
            Download slides outline (.txt)
          </button>
        </div>

        <p className="elora-small-muted">
          You can upload these files into Google Docs or Slides, or copy-paste
          the content directly. Later we can connect real Google APIs.
        </p>
      </aside>

      {/* RIGHT: Chat area */}
      <section className="elora-panel flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Elora Assistant 💙
            </div>
            <div className="text-[0.8rem] text-slate-500 dark:text-slate-400">
              Role: {roleLabel} · {country}
            </div>
          </div>
          <button
            type="button"
            className="text-[0.8rem] text-slate-500 dark:text-slate-400 underline-offset-2 hover:underline"
            onClick={() => router.push("/")}
          >
            Home
          </button>
        </div>

        <div className="elora-chat-window mb-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`elora-chat-row ${m.from === "me" ? "me" : ""}`}
            >
              <div
                className={`elora-bubble ${
                  m.from === "me" ? "me" : "elora"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="elora-chat-row">
              <div className="elora-bubble elora text-[0.8rem] italic">
                Elora is thinking…
              </div>
            </div>
          )}
        </div>

        <p className="elora-small-muted mb-2">
          Elora builds structured prompts in the background so you don&apos;t
          have to guess what to type.
        </p>

        <div className="elora-chat-input-row mt-auto">
          <input
            className="elora-chat-input"
            placeholder="Ask Elora anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendFreeChat();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSendFreeChat}
            disabled={isThinking || !input.trim()}
            className="elora-primary-button px-5 py-2 text-sm font-semibold"
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
