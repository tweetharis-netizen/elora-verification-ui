import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getSession, refreshVerifiedFromServer, setRole as saveRole } from "@/lib/session";

const ROLE_COPY = {
  student: {
    title: "Student",
    desc: "You attempt first — Elora guides you step-by-step.",
  },
  educator: {
    title: "Educator",
    desc: "Lesson ideas, materials, and clear teaching explanations.",
  },
  parent: {
    title: "Parent",
    desc: "Support learning at home with calm, simple explanations.",
  },
};

const SUBJECTS = [
  { id: "math", label: "Math" },
  { id: "english", label: "English" },
  { id: "science", label: "Science" },
  { id: "humanities", label: "Humanities" },
  { id: "planning", label: "Planning" },
];

// Fixed topics for demo clarity + optional custom.
const TOPICS_BY_SUBJECT = {
  math: ["Fractions", "Algebra", "Geometry", "Percentages", "Word problems"],
  english: ["Writing", "Grammar", "Comprehension", "Vocabulary", "Speaking"],
  science: ["Biology", "Chemistry", "Physics", "Earth science"],
  humanities: ["History", "Geography", "Civics", "Economics"],
  planning: ["Lesson planning", "Study plan", "Revision schedule", "Project plan"],
};

function clsx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function Assistant() {
  const router = useRouter();

  const [session, setSession] = useState(() => getSession());

  // Primary controls
  const [role, setRole] = useState(() => getSession().role || "student");
  const [subject, setSubject] = useState(() => getSession().subject || "math");
  const [topicMode, setTopicMode] = useState(() => getSession().topicMode || "fixed");
  const [topicFixed, setTopicFixed] = useState(() => getSession().topicFixed || "Fractions");
  const [topicCustom, setTopicCustom] = useState(() => getSession().topicCustom || "");
  const [task, setTask] = useState(() => getSession().task || "tutor");

  // Secondary controls (collapsed by default)
  const [showMore, setShowMore] = useState(false);
  const [country, setCountry] = useState(() => getSession().country || "Singapore");
  const [level, setLevel] = useState(() => getSession().level || "Primary 1");
  const [style, setStyle] = useState(() => getSession().style || "clear");

  // Chat
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => getSession().messages || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [gate, setGate] = useState({ open: false, title: "", body: "", cta: "" });

  const chatRef = useRef(null);

  const verified = Boolean(session.verified);
  const teacher = Boolean(session.teacher);

  // Lock page scroll so only chat panel scrolls.
  useEffect(() => {
    document?.body?.classList?.add("elora-no-scroll");
    return () => document?.body?.classList?.remove("elora-no-scroll");
  }, []);

  // Sync session from server cookies on load.
  useEffect(() => {
    let mounted = true;

    const onSession = () => mounted && setSession(getSession());
    window.addEventListener("elora:session", onSession);

    refreshVerifiedFromServer().then(() => {
      if (mounted) setSession(getSession());
    });

    return () => {
      mounted = false;
      window.removeEventListener("elora:session", onSession);
    };
  }, []);

  // Persist selections locally (do not treat as auth).
  useEffect(() => {
    saveRole(role);
    const next = {
      ...getSession(),
      role,
      subject,
      topicMode,
      topicFixed,
      topicCustom,
      task,
      country,
      level,
      style,
      messages,
    };
    try {
      window.localStorage.setItem("elora_session", JSON.stringify(next));
      window.localStorage.setItem("elora_session_v1", JSON.stringify(next));
      window.dispatchEvent(new Event("elora:session"));
    } catch {}
  }, [role, subject, topicMode, topicFixed, topicCustom, task, country, level, style, messages]);

  // Keep chat pinned to bottom.
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Keep fixed topic valid for subject.
  useEffect(() => {
    if (topicMode !== "fixed") return;
    const list = TOPICS_BY_SUBJECT[subject] || [];
    if (!list.length) return;
    if (!list.includes(topicFixed)) setTopicFixed(list[0]);
  }, [subject, topicMode, topicFixed]);

  const topic = useMemo(() => {
    if (topicMode === "custom") return topicCustom.trim();
    return topicFixed;
  }, [topicMode, topicCustom, topicFixed]);

  const topicList = TOPICS_BY_SUBJECT[subject] || [];

  const quickActions = useMemo(() => {
    const common = [
      { id: "tutor", title: "Tutor me", subtitle: "I guide step-by-step (no scary symbols)." },
      { id: "check", title: "Check my answer", subtitle: "Find mistakes kindly and fix them." },
      { id: "explain", title: "Explain simply", subtitle: "Beginner-friendly explanation." },
    ];

    if (role === "educator") {
      return [
        { id: "lesson", title: "Plan a lesson", subtitle: "Objectives → steps → checks." },
        { id: "worksheet", title: "Make a worksheet", subtitle: "Questions + answer key." },
        { id: "rubric", title: "Create a rubric", subtitle: "Criteria with levels." },
        ...common,
      ];
    }

    return common;
  }, [role]);

  function openGate({ title, body, cta }) {
    setGate({ open: true, title, body, cta });
  }

  function chooseRole(next) {
    // Your rule: educator mode allowed after verification only.
    if (next === "educator" && !verified) {
      openGate({
        title: "Verify to use Educator mode",
        body:
          "Educator mode is designed for teachers. To reduce abuse, we enable it after verifying your email.",
        cta: "Go to verification",
      });
      return;
    }
    setRole(next);
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setError("");
    setLoading(true);

    const userMsg = { role: "user", content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          country,
          level,
          subject,
          topic: topic || "(not specified)",
          task,
          style,
          message: trimmed,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Something went wrong.");
        return;
      }

      const assistantMsg = { role: "assistant", content: data.reply || "" };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const headerLabel = `${ROLE_COPY[role]?.title || "Student"} · ${
    SUBJECTS.find((s) => s.id === subject)?.label || "Subject"
  }${topic ? ` · ${topic}` : ""}`;

  return (
    <div className="max-w-[1120px] mx-auto px-4">
      {/* Header */}
      <div className="elora-card p-5 sm:p-7 relative overflow-hidden">
        <div className="elora-grain" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="elora-h1 text-4xl sm:text-5xl">Assistant</h1>
            <p className="elora-muted mt-2 max-w-[60ch]">
              Clear, calm help for educators and learners. No confusing math symbols by default.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="elora-chip" data-variant={verified ? "good" : "warn"}>
              {verified ? "Verified" : "Not verified"}
            </span>
            {teacher && (
              <span className="elora-chip" data-variant="good">
                Teacher tools
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Split layout: left controls / right chat */}
      <div
        className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]"
        style={{ height: "calc(100vh - var(--elora-nav-height) - 140px)" }}
      >
        {/* Left: controls (scrollable) */}
        <aside className="elora-card p-5 overflow-y-auto elora-panel-scroll">
          <div className="text-sm font-black">Role</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.keys(ROLE_COPY).map((id) => (
              <button
                key={id}
                className={clsx("elora-pill", role === id && "elora-pill-active")}
                onClick={() => chooseRole(id)}
                type="button"
              >
                {ROLE_COPY[id].title}
              </button>
            ))}
          </div>
          <div className="mt-2 text-sm elora-muted">{ROLE_COPY[role]?.desc}</div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <div className="text-sm font-black">Subject</div>
              <select className="elora-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-black">Topic</div>
              <div className="grid gap-2">
                <select
                  className="elora-select"
                  value={topicMode === "custom" ? "custom" : "fixed"}
                  onChange={(e) => setTopicMode(e.target.value)}
                >
                  <option value="fixed">Pick from list</option>
                  <option value="custom">Custom topic</option>
                </select>

                {topicMode === "custom" ? (
                  <input
                    className="elora-input"
                    value={topicCustom}
                    onChange={(e) => setTopicCustom(e.target.value)}
                    placeholder="e.g. Ratio, persuasive writing"
                  />
                ) : (
                  <select className="elora-select" value={topicFixed} onChange={(e) => setTopicFixed(e.target.value)}>
                    {topicList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="mt-2">
              <div className="text-sm font-black">Quick action</div>
              <div className="mt-3 grid gap-3">
                {quickActions.map((qa) => (
                  <button
                    key={qa.id}
                    className={clsx("elora-action", task === qa.id && "elora-action-active")}
                    onClick={() => setTask(qa.id)}
                    type="button"
                  >
                    <div className="font-black">{qa.title}</div>
                    <div className="text-sm elora-muted mt-1">{qa.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            <button className="elora-btn elora-btn-ghost" onClick={() => setShowMore((v) => !v)} type="button">
              {showMore ? "Hide options" : "More options"}
              <span className="elora-muted text-xs">(country, level, style)</span>
            </button>

            {showMore && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <div className="text-sm font-black">Country</div>
                  <select className="elora-select" value={country} onChange={(e) => setCountry(e.target.value)}>
                    {["Singapore", "Malaysia", "Indonesia", "India", "United Kingdom", "United States", "Australia", "Other"].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-black">Level</div>
                  <select className="elora-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                    {[
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
                      "JC / Pre-U",
                      "University",
                      "Adult",
                    ].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-1">
                  <div className="text-sm font-black">Style</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { id: "quick", label: "Quick" },
                      { id: "clear", label: "Clear" },
                      { id: "detailed", label: "Detailed" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        className={clsx("elora-pill", style === opt.id && "elora-pill-active")}
                        onClick={() => setStyle(opt.id)}
                        type="button"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-sm elora-muted">Beginner-friendly by default.</div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right: chat (scrollable only inside) */}
        <section className="elora-card overflow-hidden flex flex-col">
          <div className="p-5 border-b" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-black">{headerLabel}</div>
                <div className="text-sm elora-muted">
                  {country} · {level} · {verified ? "Account" : "Guest"}
                </div>
              </div>
              <div className="text-sm elora-muted">{loading ? "Thinking…" : "Ready"}</div>
            </div>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-5 elora-chat-scroll">
            {messages.length === 0 && (
              <div
                className="elora-card p-4"
                style={{ background: "color-mix(in oklab, var(--surface2) 60%, transparent)" }}
              >
                <div className="font-black">Elora</div>
                <div className="elora-muted mt-1">
                  Tell me what you’re working on, and we’ll solve it step-by-step.
                </div>
              </div>
            )}

            <div className="grid gap-3 mt-4">
              {(messages || []).map((m, idx) => (
                <div key={idx} className={clsx("elora-message", m.role === "user" && "is-user")}>
                  <div className="elora-message-role">{m.role === "user" ? "You" : "Elora"}</div>
                  <div className="elora-message-content">{m.content}</div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-4 text-sm" style={{ color: "color-mix(in oklab, #ef4444 70%, var(--text))" }}>
                {error}
              </div>
            )}
          </div>

          <div className="p-4 border-t elora-chat-input" style={{ borderColor: "var(--line)" }}>
            <div className="flex flex-wrap gap-2 mb-3">
              {["Smaller steps", "Give me a hint", "Show an example", "Harder", "Easier"].map((label) => (
                <button
                  key={label}
                  className="elora-btn elora-btn-ghost"
                  onClick={() => {
                    if (loading) return;
                    sendMessage(label);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (loading) return;
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                className="elora-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Try: "Explain 5 divided by 4" or "Rewrite this paragraph to sound clearer".'
              />
              <button className="elora-btn elora-btn-primary" disabled={loading} type="submit">
                Send
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Gate modal */}
      {gate.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setGate((g) => ({ ...g, open: false }));
          }}
        >
          <div className="elora-card max-w-[520px] w-full p-6">
            <div className="font-black text-xl">{gate.title}</div>
            <div className="elora-muted mt-2">{gate.body}</div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button className="elora-btn" onClick={() => setGate((g) => ({ ...g, open: false }))} type="button">
                Not now
              </button>
              <button className="elora-btn elora-btn-primary" onClick={() => router.push("/verify")} type="button">
                {gate.cta || "Verify"}
              </button>
            </div>

            <div className="mt-4 text-sm elora-muted">
              Teacher invite codes are optional and unlock teacher-only tools in Settings.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
