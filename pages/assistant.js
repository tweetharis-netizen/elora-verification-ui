import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Modal from "../components/Modal";
import RoleIllustration from "../components/RoleIllustration";
import { getSession, setRole as storeRole, setGuest as storeGuest } from "../lib/session";

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
  Other: ["Primary / Elementary", "Middle School", "High School", "Pre-University", "University", "Other"],
};

const SUBJECT_OPTIONS = ["Math", "Science", "English", "Computer Science", "History", "Geography", "Other"];

const ROLE_QUICK_ACTIONS = {
  educator: [
    { id: "lesson", label: "Plan a lesson", hint: "Objectives, timings, checks, differentiation" },
    { id: "worksheet", label: "Create worksheet", hint: "Student + Teacher versions, export-ready" },
    { id: "assessment", label: "Generate assessment", hint: "Marks + marking scheme (Verified)" },
    { id: "slides", label: "Design slides", hint: "Download PPTX for Google Slides (Verified)" },
  ],
  student: [
    { id: "explain", label: "Explain it", hint: "Clear explanation + example + practice" },
    { id: "worksheet", label: "Give me practice", hint: "Practice set + answers (export locked)" },
    { id: "custom", label: "Custom request", hint: "Ask anything and refine" },
  ],
  parent: [
    { id: "explain", label: "Explain it", hint: "In plain words + home tips" },
    { id: "worksheet", label: "Practice for my child", hint: "Student practice + answers (export locked)" },
    { id: "custom", label: "Custom request", hint: "Ask anything and refine" },
  ],
};

const REFINEMENT_CHIPS = {
  lesson: ["Shorter", "More detailed", "Add differentiation", "Add misconceptions", "Add exit ticket rubric"],
  worksheet: ["Make it 1 page", "Add worked example", "More challenging", "Add word problems", "Add misconceptions"],
  assessment: ["Harder", "More conceptual", "Add marks", "Add marking scheme detail", "Reduce length"],
  slides: ["Shorter deck", "More visuals ideas", "Add teacher notes", "More interactivity", "Add recap slide"],
  explain: ["Simpler", "More examples", "Quiz me every 3 steps", "Harder practice", "Explain step-by-step"],
  custom: ["Shorter", "More detailed", "More examples", "Make it student-friendly", "Make it teacher-friendly"],
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function safeFilename(name) {
  return (name || "Elora-Export")
    .toString()
    .trim()
    .replace(/[^a-z0-9 _-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function artifactToMarkdown(artifact, mode = "student") {
  if (!artifact || typeof artifact !== "object") return "";

  const t = artifact.type;

  if (t === "slides") {
    const title = artifact.title || "Slides";
    const slides = Array.isArray(artifact.slides) ? artifact.slides : [];
    const lines = [`# ${title}`];
    slides.forEach((s, idx) => {
      lines.push(`## Slide ${idx + 1}: ${s.title || "Untitled"}`);
      (Array.isArray(s.bullets) ? s.bullets : []).forEach((b) => lines.push(`- ${b}`));
      if (s.notes) {
        lines.push(`**Notes:** ${s.notes}`);
      }
      lines.push("");
    });
    return lines.join("\n");
  }

  if (t === "worksheet") {
    const title = artifact.title || "Worksheet";
    const q = Array.isArray(artifact.studentQuestions) ? artifact.studentQuestions : [];
    const a = Array.isArray(artifact.teacherAnswerKey) ? artifact.teacherAnswerKey : [];
    const notes = artifact.notes ? String(artifact.notes) : "";

    if (mode === "teacher") {
      const lines = [`# ${title} (Teacher Copy)`, "", "**Answer Key**"];
      a.forEach((x, i) => lines.push(`${i + 1}. ${x}`));
      if (notes) lines.push("", `**Notes:** ${notes}`);
      return lines.join("\n");
    }

    const lines = [`# ${title}`, "", "**Questions**"];
    q.forEach((x, i) => lines.push(`${i + 1}. ${x}`));
    return lines.join("\n");
  }

  if (t === "lesson") {
    const lines = [`# ${artifact.title || "Lesson Plan"}`];
    if (artifact.snapshot) lines.push("", `**Lesson Snapshot:** ${artifact.snapshot}`);
    if (Array.isArray(artifact.objectives) && artifact.objectives.length) {
      lines.push("", "**Objectives:**");
      artifact.objectives.forEach((o) => lines.push(`- ${o}`));
    }
    if (Array.isArray(artifact.materials) && artifact.materials.length) {
      lines.push("", "**Materials:**");
      artifact.materials.forEach((m) => lines.push(`- ${m}`));
    }
    if (Array.isArray(artifact.flow) && artifact.flow.length) {
      lines.push("", "**Lesson Flow:**");
      artifact.flow.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    }
    if (artifact.differentiation) lines.push("", `**Differentiation:** ${artifact.differentiation}`);
    if (Array.isArray(artifact.misconceptions) && artifact.misconceptions.length) {
      lines.push("", "**Misconceptions:**");
      artifact.misconceptions.forEach((m) => lines.push(`- ${m}`));
    }
    if (Array.isArray(artifact.exitTicket) && artifact.exitTicket.length) {
      lines.push("", "**Exit Ticket:**");
      artifact.exitTicket.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    }
    return lines.join("\n");
  }

  if (t === "assessment") {
    const lines = [`# ${artifact.title || "Assessment"}`];
    if (artifact.info) lines.push("", `**Info:** ${artifact.info}`);

    if (Array.isArray(artifact.questions) && artifact.questions.length) {
      lines.push("", "**Questions:**");
      artifact.questions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    }

    if (Array.isArray(artifact.markingScheme) && artifact.markingScheme.length) {
      lines.push("", "**Marking Scheme:**");
      artifact.markingScheme.forEach((m, i) => lines.push(`${i + 1}. ${m}`));
    }

    return lines.join("\n");
  }

  // explain/custom fallback
  if (artifact.explanation) {
    const lines = [`# Explanation`, "", artifact.explanation];
    if (Array.isArray(artifact.examples) && artifact.examples.length) {
      lines.push("", "**Examples:**");
      artifact.examples.forEach((e, i) => lines.push(`${i + 1}. ${e}`));
    }
    if (Array.isArray(artifact.practice) && artifact.practice.length) {
      lines.push("", "**Practice:**");
      artifact.practice.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    }
    if (Array.isArray(artifact.answers) && artifact.answers.length) {
      lines.push("", "**Answers:**");
      artifact.answers.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
    }
    return lines.join("\n");
  }

  return "";
}

export default function AssistantPage() {
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const verified = !!session.verified;
  const guest = !!session.guest;

  const [role, setRole] = useState(session.role || "educator");
  const [country, setCountry] = useState("Singapore");
  const levelOptions = useMemo(() => LEVELS_BY_COUNTRY[country] || LEVELS_BY_COUNTRY.Other, [country]);
  const [level, setLevel] = useState(levelOptions[0] || "Primary / Elementary");
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("Introduction to fractions");
  const [constraints, setConstraints] = useState("");
  const [action, setAction] = useState(ROLE_QUICK_ACTIONS[role]?.[0]?.id || "lesson");

  const [messages, setMessages] = useState(() => [
    {
      from: "elora",
      text:
        "Hi! I’m **Elora**.\n\nPick options on the left (that’s the hard part of prompting) and I’ll generate something clean you can actually use.\n\nUse chat for refinements.",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [verifyGateOpen, setVerifyGateOpen] = useState(false);

  const [lastArtifact, setLastArtifact] = useState(null);
  const [worksheetMode, setWorksheetMode] = useState("student"); // student | teacher

  useEffect(() => {
    if (!levelOptions.includes(level)) setLevel(levelOptions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, levelOptions.join("|")]);

  useEffect(() => {
    const first = ROLE_QUICK_ACTIONS[role]?.[0]?.id || "lesson";
    setAction(first);
  }, [role]);

  useEffect(() => {
    storeRole(role);
  }, [role]);

  const guestBlocked = useMemo(() => {
    if (!guest) return false;
    return action === "assessment" || action === "slides";
  }, [guest, action]);

  const exportLocked = useMemo(() => {
    // Exports are verified-only, always
    return !verified;
  }, [verified]);

  const chips = useMemo(() => REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.custom, [action]);

  async function callElora({ messageOverride = "" } = {}) {
    // Unverified + not guest => must verify
    if (!verified && !guest) {
      setVerifyGateOpen(true);
      return;
    }

    if (guestBlocked) {
      setMessages((m) => [
        ...m,
        { from: "elora", text: "Guest mode is limited — please **Verify to unlock** assessments and slide generation." },
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
      message: messageOverride,
      options: constraints,
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

      setMessages((m) => [...m, { from: "elora", text: data.reply }]);
      setLastArtifact(data?.artifact || null);

      if (data?.artifact?.type === "worksheet") setWorksheetMode("student");
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        {
          from: "elora",
          text:
            "Sorry — something went wrong talking to the AI.\n\nIf this keeps happening, it’s usually an env var issue or model error.",
        },
      ]);
      setLastArtifact(null);
    } finally {
      setLoading(false);
    }
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

  async function refine(text) {
    if (!verified && !guest) {
      setVerifyGateOpen(true);
      return;
    }
    setMessages((m) => [...m, { from: "user", text }]);
    await callElora({ messageOverride: text });
  }

  function getExportTitle() {
    const base = `${role.toUpperCase()} — ${subject} — ${topic}`.trim();
    if (lastArtifact?.type === "worksheet") {
      return worksheetMode === "teacher" ? `${base} (Teacher)` : `${base} (Student)`;
    }
    return base;
  }

  function getExportContent() {
    // Prefer artifact → stable exports
    if (lastArtifact) {
      if (lastArtifact.type === "worksheet") return artifactToMarkdown(lastArtifact, worksheetMode);
      return artifactToMarkdown(lastArtifact, "student");
    }
    // Fallback: export last assistant reply
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.from === "elora") return messages[i].text || "";
    }
    return "";
  }

  async function downloadFromEndpoint(endpoint, filename, payload) {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const data = await r.json().catch(() => null);
      throw new Error(data?.error || "Export failed");
    }

    const blob = await r.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  async function exportDocx() {
    if (exportLocked) {
      setVerifyGateOpen(true);
      return;
    }
    const title = getExportTitle();
    const content = getExportContent();
    if (!content) return;

    await downloadFromEndpoint(
      "/api/export-docx",
      `${safeFilename(title)}.docx`,
      { title, content }
    );
  }

  async function exportPdf() {
    if (exportLocked) {
      setVerifyGateOpen(true);
      return;
    }
    const title = getExportTitle();
    const content = getExportContent();
    if (!content) return;

    await downloadFromEndpoint(
      "/api/export-pdf",
      `${safeFilename(title)}.pdf`,
      { title, content }
    );
  }

  async function exportPptx() {
    if (exportLocked) {
      setVerifyGateOpen(true);
      return;
    }

    // Slides only
    if (action !== "slides" && lastArtifact?.type !== "slides") {
      setMessages((m) => [...m, { from: "elora", text: "PPTX export is available for Slides generation." }]);
      return;
    }

    const title = getExportTitle();
    const content = getExportContent(); // artifactToMarkdown for slides -> outline
    if (!content) return;

    await downloadFromEndpoint(
      "/api/export-slides",
      `${safeFilename(title)}.pptx`,
      { title, content }
    );
  }

  async function copyLast() {
    const content = getExportContent();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setMessages((m) => [...m, { from: "elora", text: "Copied ✅" }]);
    } catch {
      setMessages((m) => [...m, { from: "elora", text: "Copy failed — your browser blocked it." }]);
    }
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
                  className={cn(
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
                Adjusts level labels + teaching style.
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

          {/* Constraints */}
          <div className="mt-5">
            <label className="text-sm font-bold text-slate-900 dark:text-white">
              Constraints (optional)
            </label>
            <textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/55 dark:bg-slate-950/35 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
              placeholder="e.g., 45 minutes, mixed ability, include SEN/EAL support, focus on word problems"
            />
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
                    className={cn(
                      "rounded-2xl border p-4 text-left transition",
                      active
                        ? "border-indigo-500/40 bg-indigo-600/10 shadow-lg shadow-indigo-500/10"
                        : "border-white/10 bg-white/40 dark:bg-slate-950/30 hover:bg-white/60 dark:hover:bg-slate-950/45",
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
              onClick={() => callElora({ messageOverride: "" })}
              disabled={loading}
              className={cn(
                "mt-5 w-full rounded-full px-6 py-3 font-extrabold text-white shadow-xl shadow-indigo-500/20",
                loading ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {loading ? "Generating…" : "Generate with Elora"}
            </button>

            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tip: Use the chips on the right to refine without prompt engineering.
            </div>
          </div>
        </div>

        {/* RIGHT: Assistant */}
        <div className="rounded-2xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl p-5 flex flex-col lg:min-h-[680px]">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Elora Assistant</h2>
              <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {country} • {level} • {subject} • <span className="font-semibold">{role}</span>
              </div>

              {lastArtifact?.type === "worksheet" ? (
                <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/45 dark:bg-slate-950/30 p-1">
                  <button
                    type="button"
                    onClick={() => setWorksheetMode("student")}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-extrabold transition",
                      worksheetMode === "student"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-800 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-950/45"
                    )}
                  >
                    Student copy
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorksheetMode("teacher")}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-extrabold transition",
                      worksheetMode === "teacher"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-800 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-950/45"
                    )}
                  >
                    Teacher copy
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {!verified ? (
                <button
                  type="button"
                  onClick={() => setVerifyGateOpen(true)}
                  className="rounded-full px-4 py-2 text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                >
                  Verify to unlock exports
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={copyLast}
                    className="rounded-full px-4 py-2 text-sm font-bold border border-white/10 bg-white/50 dark:bg-slate-950/35 text-slate-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-950/50"
                  >
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={exportDocx}
                    className="rounded-full px-4 py-2 text-sm font-extrabold text-white bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/20"
                  >
                    DOCX
                  </button>

                  <button
                    type="button"
                    onClick={exportPdf}
                    className="rounded-full px-4 py-2 text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                  >
                    PDF
                  </button>

                  <button
                    type="button"
                    onClick={exportPptx}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-lg",
                      action === "slides" || lastArtifact?.type === "slides"
                        ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                        : "bg-slate-400 cursor-not-allowed"
                    )}
                    disabled={!(action === "slides" || lastArtifact?.type === "slides")}
                    title={action === "slides" || lastArtifact?.type === "slides" ? "Download PPTX" : "Generate Slides first"}
                  >
                    PPTX
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="mt-4 flex-1 overflow-auto pr-1">
            <div className="space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
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
              {chips.map((t) => (
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
              className={cn(
                "rounded-full px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20",
                loading ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              Send
            </button>
          </div>

          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Exports (DOCX/PDF/PPTX) are <span className="font-semibold">Verified-only</span>. PDF is Kami-friendly.
          </div>
        </div>
      </div>

      {/* Verify gate modal */}
      <Modal open={verifyGateOpen} title="Verify to unlock Elora" onClose={() => setVerifyGateOpen(false)}>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Exports (DOCX/PDF/PPTX) and advanced features are locked behind verification.
          You can still continue as a limited guest preview.
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
              storeGuest(true);
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
