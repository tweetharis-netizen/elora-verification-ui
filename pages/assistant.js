import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const ROLES = {
  educator: {
    label: "Educator",
    greeting:
      "Hello teacher 🍎! I'm Elora. I can help you create lessons, worksheets, assessments and explain topics to your students.",
  },
  student: {
    label: "Student",
    greeting:
      "Hi! I'm Elora. I can help you understand topics, practise questions and prepare for exams.",
  },
  parent: {
    label: "Parent",
    greeting:
      "Hello! I'm Elora. I can help you understand what your child is learning and suggest ways to support them.",
  },
};

const TASKS = [
  { id: "lesson", label: "Plan a lesson" },
  { id: "worksheet", label: "Create worksheet", hint: "Practice questions" },
  { id: "assessment", label: "Generate assessment" },
  { id: "slides", label: "Design lesson slides" },
  { id: "explain", label: "Explain a topic" },
  { id: "custom", label: "Custom request" },
];

const COUNTRIES = [
  "Singapore",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "India",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Other",
];

const LEVELS_BY_ROLE = {
  educator: [
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
    "JC / Pre-University",
  ],
  student: [
    "Primary (1–6)",
    "Secondary (1–5)",
    "JC / Pre-University",
    "University / Tertiary",
  ],
  parent: [
    "Primary school child",
    "Secondary school child",
    "Junior college / pre-U",
  ],
};

const SUBJECTS = [
  "Math",
  "Science",
  "English",
  "History",
  "Geography",
  "Computer Science",
  "Other",
];

function buildDisplayProfile({ role, country, level, subject }) {
  const roleLabel = ROLES[role]?.label || "Educator";
  const parts = [];
  if (country) parts.push(country);
  if (level) parts.push(level);
  if (subject) parts.push(subject);
  const profile = parts.join(" · ") || "Set profile";
  return `${profile} • ${roleLabel}`;
}

export default function AssistantPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [role, setRole] = useState("educator");
  const [country, setCountry] = useState("Singapore");
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [task, setTask] = useState("lesson");
  const [guestMode, setGuestMode] = useState(false);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // Load role & profile from URL / localStorage
  useEffect(() => {
    if (!router.isReady) return;

    let initialRole = "educator";
    let isGuest = false;

    if (typeof router.query.role === "string") {
      const r = router.query.role.toLowerCase();
      if (ROLES[r]) {
        initialRole = r;
      }
    }
    if (router.query.guest === "1") {
      isGuest = true;
    }

    setRole(initialRole);
    setGuestMode(isGuest);

    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("eloraProfile");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.role && ROLES[parsed.role]) {
            initialRole = parsed.role;
            setRole(parsed.role);
          }
          if (parsed.country) setCountry(parsed.country);
          if (parsed.level) setLevel(parsed.level);
          if (parsed.subject) setSubject(parsed.subject);
        } catch {
          // ignore bad JSON
        }
      }
    }

    const greeting =
      ROLES[initialRole]?.greeting || ROLES.educator.greeting;

    setMessages([
      {
        id: "welcome",
        from: "elora",
        text: greeting,
      },
    ]);

    setReady(true);
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist profile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const data = { role, country, level, subject };
    window.localStorage.setItem("eloraProfile", JSON.stringify(data));
  }, [role, country, level, subject]);

  const currentLevels = LEVELS_BY_ROLE[role] || LEVELS_BY_ROLE.educator;
  const activeProfileLabel = buildDisplayProfile({
    role,
    country,
    level,
    subject,
  });

  const addMessage = (msg) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `${Date.now()}-${prev.length}` },
    ]);
  };

  const callAssistant = async (payload) => {
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("API error", await res.text());
        return (
          "Hmm, something went wrong talking to the AI. " +
          "Please try again in a moment or change your request a little."
        );
      }

      const data = await res.json();
      if (data && typeof data.message === "string") {
        return data.message;
      }

      return (
        "I couldn't understand the response from the AI, " +
        "but here are some ideas: break the topic into 3–5 parts, " +
        "add examples, and finish with a short exit ticket."
      );
    } catch (err) {
      console.error("Request failed", err);
      return (
        "I wasn't able to reach the AI service. " +
        "Check your internet connection or try again shortly."
      );
    }
  };

  const handleSend = async (explicitMessage) => {
    const trimmed = (explicitMessage ?? input).trim();
    if (!trimmed) return;
    if (!ready || isSending) return;

    const userTurn = {
      from: "user",
      text: trimmed,
    };
    addMessage(userTurn);
    setInput("");
    setIsSending(true);

    const replyText = await callAssistant({
      role,
      country,
      level,
      subject,
      topic,
      mode: task,
      message: trimmed,
      guest: guestMode,
    });

    addMessage({
      from: "elora",
      text: replyText,
    });

    setIsSending(false);
  };

  const taskDescription = (taskId) => {
    switch (taskId) {
      case "lesson":
        return "plan a full lesson";
      case "worksheet":
        return "create a student practice worksheet";
      case "assessment":
        return "design a short assessment";
      case "slides":
        return "outline a sequence of teaching slides";
      case "explain":
        return "explain this topic in a simple way";
      default:
        return "help with this request";
    }
  };

  const handleGenerateFromOptions = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic first.");
      return;
    }

    const syntheticPrompt = `Please ${taskDescription(
      task
    )} for ${level || "this level"} ${subject || ""} on the topic "${topic}".`;

    await handleSend(syntheticPrompt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: controls */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/80 p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              Teaching profile
            </p>
            <p className="mt-1 text-sm text-slate-700 font-medium">
              {activeProfileLabel}
            </p>
            {guestMode && (
              <p className="mt-1 text-[11px] text-amber-600">
                Guest mode: Elora will not save this profile.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Role
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {Object.entries(ROLES).map(([id, r]) => (
                  <option key={id} value={id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Country / region
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Level
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="">Select level…</option>
                {currentLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Subject
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">Select subject…</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                What do you want to do?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TASKS.map((t) => {
                  const active = t.id === task;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTask(t.id)}
                      className={`text-xs rounded-xl px-3 py-2 border transition-all ${
                        active
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Topic
              </label>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[60px] resize-none"
                placeholder="e.g. Introduction to fractions, solving linear equations…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateFromOptions}
              disabled={isSending}
              className="w-full rounded-full bg-indigo-600 text-white text-sm font-medium py-2.5 shadow-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSending ? "Generating…" : "Generate with Elora"}
            </button>

            <p className="text-[11px] text-slate-500">
              Elora builds the best possible prompt using your role, country,
              level, subject and topic. You just choose and click generate.
            </p>
          </div>
        </div>

        {/* Right: chat */}
        <div className="flex-1 flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Elora Assistant 💙
              </h1>
              <p className="text-xs text-slate-500">
                Role: {ROLES[role]?.label || "Educator"}
                {country ? ` • ${country}` : ""}{" "}
                {level ? ` • ${level}` : ""}{" "}
                {subject ? ` • ${subject}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-xs text-slate-500 hover:text-indigo-600 underline"
            >
              Home
            </button>
          </div>

          <div className="flex-1 min-h-[260px] max-h-[440px] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                    m.from === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-xs text-slate-500">
                Elora is ready. Choose your options on the left or start typing
                a question below.
              </div>
            )}
          </div>

          <form
            className="mt-4 flex items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Ask Elora anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="rounded-full bg-indigo-600 text-white px-5 py-2 text-sm font-medium shadow-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSending ? "Sending…" : "Send"}
            </button>
          </form>

          <p className="mt-2 text-[11px] text-slate-400">
            Elora builds structured prompts for you in the background so you
            don't have to guess what to type.
          </p>
        </div>
      </div>
    </div>
  );
}
