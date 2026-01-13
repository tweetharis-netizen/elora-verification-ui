import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import {
  activateTeacher,
  getSession,
  isTeacher,
  refreshVerifiedFromServer,
  setGuest as storeGuest,
  setRole as storeRole,
} from "../lib/session";

const COUNTRIES = ["Singapore", "Malaysia", "UK", "US", "Australia", "Other"];

const LEVELS_BY_COUNTRY = {
  Singapore: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "Secondary 1", "Secondary 2", "Secondary 3", "Secondary 4", "Secondary 5", "JC 1", "JC 2", "University", "Adult learning"],
  Malaysia: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "Secondary 1", "Secondary 2", "Secondary 3", "Secondary 4", "Secondary 5", "University", "Adult learning"],
  UK: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13", "University", "Adult learning"],
  US: ["Grade K", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "University", "Adult learning"],
  Australia: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "University", "Adult learning"],
  Other: ["Primary", "Lower secondary", "Upper secondary", "Pre-university", "University", "Adult learning"],
};

function getLevelsForCountry(country) {
  const c = String(country || "Other");
  return LEVELS_BY_COUNTRY[c] || LEVELS_BY_COUNTRY.Other;
}

const SUBJECTS = ["General", "Math", "Science", "English", "History", "Geography", "Computing"];

const ROLE_LABEL = {
  student: "Student",
  parent: "Parent",
  educator: "Educator",
};

const REFINEMENT_CHIPS = {
  explain: [
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
    { id: "steps", label: "Show steps" },
    { id: "check", label: "Give a quick check question" },
  ],
  lesson: [
    { id: "diff", label: "Add differentiation" },
    { id: "timing", label: "Add timings" },
    { id: "check", label: "Add checks for understanding" },
    { id: "resources", label: "Add resources" },
  ],
  worksheet: [
    { id: "easier", label: "Make it easier" },
    { id: "harder", label: "Make it harder" },
    { id: "ans", label: "Add answer key" },
    { id: "format", label: "Change format" },
  ],
  assessment: [
    { id: "marks", label: "Add marks" },
    { id: "rubric", label: "Add rubric" },
    { id: "harder", label: "Make it harder" },
    { id: "easier", label: "Make it easier" },
  ],
  slides: [
    { id: "shorter", label: "Make it shorter" },
    { id: "activity", label: "Add activity" },
    { id: "checks", label: "Add check points" },
    { id: "examples", label: "Add examples" },
  ],
  check: [
    { id: "hint", label: "Give a hint" },
    { id: "mistake", label: "Explain my mistake" },
    { id: "steps", label: "Show the steps (no final answer yet)" },
    { id: "try", label: "Let me try again" },
  ],
};

const ROLE_QUICK_ACTIONS = {
  student: [
    { id: "explain", label: "Explain", hint: "Make it simple and clear." },
    { id: "check", label: "Check my answer", hint: "Tell me if I’m correct (limited attempts)." },
    { id: "practice", label: "Practice", hint: "Give me a question to try." },
  ],
  parent: [
    { id: "explain", label: "Explain", hint: "Help me understand so I can help my child." },
    { id: "practice", label: "Practice", hint: "Create a simple practice plan." },
    { id: "plan", label: "Study plan", hint: "A calm, realistic plan." },
  ],
  educator: [
    { id: "explain", label: "Explain", hint: "Clear explanation for class." },
    { id: "lesson", label: "Lesson plan", hint: "Structured lesson plan." },
    { id: "worksheet", label: "Worksheet", hint: "Practice worksheet." },
    { id: "assessment", label: "Assessment", hint: "Assessment items and rubric." },
    { id: "slides", label: "Slides outline", hint: "Slide-by-slide outline." },
  ],
};

function cn(...a) {
  return a.filter(Boolean).join(" ");
}

function clampStr(v, max = 120000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function cleanAssistantText(text) {
  let t = String(text || "");
  // remove accidental markdown artifacts
  t = t.replace(/```[\s\S]*?```/g, "");
  t = t.replace(/`+/g, "");
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");
  t = t.replace(/_([^_]+)_/g, "$1");
  t = t.replace(/^\s*>\s?/gm, "");
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

function lastAssistantMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.from === "elora" && messages[i]?.text) return messages[i].text;
  }
  return "";
}

async function safeFetchJson(url, opts) {
  try {
    const r = await fetch(url, opts);
    const data = await r.json().catch(() => null);
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

async function copyToClipboard(text, idx, setCopiedIdx) {
  try {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 900);
  } catch {}
}

async function persistSessionPatch(patch) {
  const current = getSession();
  const next = { ...current, ...patch };
  try {
    localStorage.setItem("elora_session_v1", JSON.stringify(next));
    localStorage.setItem("elora_session", JSON.stringify(next));
  } catch {}
}

async function clearServerChatIfVerified(session) {
  if (!session?.verified) return;
  await safeFetchJson("/api/chat/clear", { method: "POST" });
}

export default function AssistantPage() {
  const router = useRouter();

  const [session, setSession] = useState(() => getSession());
  const [verified, setVerified] = useState(Boolean(session?.verified));
  const [guest, setGuest] = useState(Boolean(session?.guest));
  const [teacher, setTeacher] = useState(Boolean(session?.teacher));

  const [role, setRoleState] = useState(() => session?.role || "student");
  const [country, setCountryState] = useState(() => session?.country || "Singapore");
  const [level, setLevel] = useState(() => session?.level || (getLevelsForCountry(session?.country || "Singapore")[0] || "Secondary"));

  const levelOptions = useMemo(() => getLevelsForCountry(country), [country]);

  const [subject, setSubjectState] = useState(() => session?.subject || "Math");
  const [topic, setTopicState] = useState(() => session?.topicCustom || session?.topic || "");
  const [action, setAction] = useState(() => session?.task || "explain");
  const [style, setStyle] = useState(() => session?.style || "clear");

  const [messages, setMessages] = useState(() => Array.isArray(session?.messages) ? session.messages : []);
  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(false);

  const [attempt, setAttempt] = useState(0);

  const [copiedIdx, setCopiedIdx] = useState(-1);

  const [verifyGateOpen, setVerifyGateOpen] = useState(false);

  const [teacherGateOpen, setTeacherGateOpen] = useState(false);
  const [teacherGateCode, setTeacherGateCode] = useState(() => session?.teacherCode || "");
  const [teacherGateStatus, setTeacherGateStatus] = useState("");

  const listRef = useRef(null);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    // Keep session state current
    (async () => {
      const status = await refreshVerifiedFromServer();
      const s = getSession();
      setSession(s);
      setVerified(Boolean(status?.verified));
      setTeacher(Boolean(status?.teacher));
      setGuest(Boolean(s?.guest));
      setRoleState(String(s?.role || "student"));
      setCountryState(String(s?.country || "Singapore"));
      setLevel(String(s?.level || level));
      setSubjectState(String(s?.subject || "Math"));
      setTopicState(String(s?.topicCustom || s?.topic || ""));
      setAction(String(s?.task || "explain"));
      setStyle(String(s?.style || "clear"));
      setMessages(Array.isArray(s?.messages) ? s.messages : []);
    })();
  }, []);

  useEffect(() => {
    // keep a live session snapshot for other pages/components
    persistSessionPatch({
      role,
      country,
      level,
      subject,
      topicCustom: topic,
      task: action,
      style,
      messages,
    });
  }, [role, country, level, subject, topic, action, style, messages]);

  useEffect(() => {
    if (role) {
      const current = getSession();
      storeRole(role);
      setSession(getSession());
      setGuest(Boolean(getSession()?.guest));
      setVerified(Boolean(getSession()?.verified));
      setTeacher(Boolean(getSession()?.teacher));
      // keep attempt UI coherent
      if (role !== "student") setAttempt(0);
    }
  }, [role]);

  useEffect(() => {
    // Keep level valid when country changes (prevents invalid select values).
    if (!levelOptions.includes(level)) {
      setLevel(levelOptions[0] || "Secondary");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  function setRole(r) {
    setRoleState(String(r || "student"));
  }
  function setCountry(v) {
    setCountryState(String(v || "Singapore"));
  }
  function setSubject(v) {
    setSubjectState(String(v || "Math"));
  }
  function setTopic(v) {
    setTopicState(String(v || ""));
  }

  function jumpToLatest() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  function handleListScroll() {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowJump(!atBottom);
  }

  async function callElora(payload) {
    const r = await safeFetchJson("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = r?.data?.error || "Request failed.";
      throw new Error(err);
    }
    return r.data;
  }

  async function sendChat(refineId) {
    const text = clampStr(chatText || "", 4000);
    if (!text || loading) return;

    const userMsg = { from: "user", text, at: new Date().toISOString() };
    const next = [...messages, userMsg];
    setMessages(next);
    setChatText("");
    setLoading(true);

    try {
      const payload = {
        role,
        country,
        level,
        subject,
        topic,
        action,
        message: text,
        options: refineId ? `Refinement chip: ${refineId}` : "",
        attempt,
        responseStyle: style,
        guest: Boolean(getSession()?.guest),
      };

      const data = await callElora(payload);

      const replyText = cleanAssistantText(data?.reply || "");
      const eloraMsg = { from: "elora", text: replyText, at: new Date().toISOString() };
      const finalMsgs = [...next, eloraMsg];
      setMessages(finalMsgs);

      if (role === "student" && typeof data?.attempt === "number") {
        setAttempt(Math.max(0, Math.min(3, Number(data.attempt) || 0)));
      } else if (role === "student") {
        setAttempt((a) => a + 1);
      }

      // Auto-scroll when near bottom
      setTimeout(() => {
        const el = listRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
        if (atBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 60);
    } catch (e) {
      const errText = cleanAssistantText(e?.message || "Something went wrong.");
      setMessages((m) => [...m, { from: "elora", text: errText, at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  async function exportLast(kind) {
    const last = lastAssistantMessage(messages);
    if (!last) return;

    const title = "Elora Export";
    const content = last;

    const map = {
      pdf: "/api/export-pdf",
      docx: "/api/export-docx",
      pptx: "/api/export-slides",
    };

    const url = map[kind] || "";
    if (!url) return;

    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => null);
        throw new Error(data?.error || "Export failed.");
      }

      const blob = await r.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = kind === "pdf" ? "elora-export.pdf" : kind === "docx" ? "elora-export.docx" : "elora-export.pptx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          from: "elora",
          text: cleanAssistantText(e?.message || "Export failed."),
          at: new Date().toISOString(),
        },
      ]);
    }
  }

  async function validateAndActivateInvite(code) {
    const trimmed = String(code || "").trim();
    if (!trimmed) {
      setTeacherGateStatus("Enter a code.");
      return false;
    }

    try {
      setTeacherGateStatus("Checking…");
      const act = await activateTeacher(trimmed);
      if (!act?.ok) {
        setTeacherGateStatus("Invalid code.");
        return false;
      }

      await refreshVerifiedFromServer();
      const s = getSession();
      setSession(s);

      if (isTeacher()) {
        setTeacherGateStatus("Teacher role active ✅");
        return true;
      }

      setTeacherGateStatus("Code accepted, but teacher role not active. Refresh and try again.");
      return false;
    } catch {
      setTeacherGateStatus("Could not validate right now. Try again.");
      return false;
    }
  }

  const refinementChips = useMemo(() => REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.explain, [action]);

  return (
    <>
      <Head>
        <title>Elora Assistant</title>
      </Head>

      <Navbar />

      <div className="elora-page">
        <div className="elora-container">
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            {/* LEFT */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-950 dark:text-white">Setup</h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border",
                    verified
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", verified ? "bg-emerald-400" : "bg-amber-400")} />
                  {verified ? "Verified" : guest ? "Guest" : "Unverified"}
                </span>
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
                        if (r === "educator" && !verified) {
                          setVerifyGateOpen(true);
                          return;
                        }
                        setRole(r);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-extrabold transition",
                        role === r
                          ? "border-indigo-500/40 bg-indigo-600/10 text-indigo-800 dark:text-indigo-200"
                          : "border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
                      )}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
                {role === "educator" && !verified ? (
                  <div className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-200">
                    Educator mode requires verification.
                  </div>
                ) : null}
              </div>

              {/* Country + level */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Country</div>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Level</div>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    {levelOptions.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject + topic */}
              <div className="mt-5">
                <div className="text-sm font-bold text-slate-900 dark:text-white">Subject</div>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <div className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Topic (optional)</div>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Fractions, Photosynthesis, Essay structure…"
                  className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Action */}
              <div className="mt-5">
                <div className="text-sm font-bold text-slate-900 dark:text-white">Action</div>
                <div className="mt-2 grid gap-2">
                  {(ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.student).map((a) => {
                    const teacherOnly = ["lesson", "worksheet", "assessment", "slides"].includes(a.id);
                    const disabled = teacherOnly && !teacher;

                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          if (disabled) {
                            setTeacherGateOpen(true);
                            return;
                          }
                          setAction(a.id);
                        }}
                        className={cn(
                          "rounded-xl border p-3 text-left transition",
                          action === a.id
                            ? "border-indigo-500/40 bg-indigo-600/10"
                            : "border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 hover:bg-white dark:hover:bg-slate-950/35",
                          disabled ? "opacity-70" : ""
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
                  onClick={async () => {
                    const currentSession = getSession();
                    setMessages([]);
                    setAttempt(0);
                    await persistSessionPatch({ messages: [] });
                    await clearServerChatIfVerified(currentSession);
                  }}
                  className="mt-4 rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                >
                  Clear chat
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5 flex flex-col min-h-0 lg:h-[calc(100dvh-var(--elora-nav-offset)-64px)]">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">Elora Assistant</h2>
                  <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {country} • {level} • {subject} • <span className="font-semibold">{role}</span>
                    {role === "student" ? (
                      <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        Attempts: {Math.min(3, attempt)}/3
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {refinementChips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => sendChat(c.id)}
                      disabled={loading}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-extrabold transition",
                        "border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35",
                        loading ? "opacity-70 cursor-wait" : ""
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {!verified && !guest ? (
                <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                  You’re not verified yet. You can preview, but exports and educator mode are locked.
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => router.push("/verify")}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
                    >
                      Verify email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        storeGuest(true);
                        const s = getSession();
                        setSession(s);
                      }}
                      className="rounded-full border border-slate-200/70 dark:border-white/10 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                    >
                      Stay in preview
                    </button>
                  </div>
                </div>
              ) : null}

              <div ref={listRef} onScroll={handleListScroll} className="mt-4 flex-1 min-h-0 overflow-auto pr-1 relative">
                <div className="space-y-3">
                  {messages.map((m, idx) => {
                    const isUser = m.from === "user";
                    const display = cleanAssistantText(m.text);

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed border",
                          isUser
                            ? "ml-auto bg-indigo-600 text-white border-indigo-500/20"
                            : "mr-auto bg-white/80 dark:bg-slate-950/25 text-slate-900 dark:text-slate-100 border-slate-200/60 dark:border-white/10 relative group"
                        )}
                      >
                        {!isUser ? (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(display, idx, setCopiedIdx)}
                            className="absolute top-2 right-2 rounded-full border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-2.5 py-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition hover:bg-white dark:hover:bg-slate-950/60"
                            title="Copy"
                          >
                            {copiedIdx === idx ? "Copied" : "Copy"}
                          </button>
                        ) : null}
                        <div className="whitespace-pre-wrap">{display}</div>
                      </div>
                    );
                  })}

                  {loading ? (
                    <div className="mr-auto max-w-[92%] rounded-2xl px-4 py-3 text-sm border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-700 dark:text-slate-200">
                      Thinking…
                    </div>
                  ) : null}
                </div>

                {showJump ? (
                  <div className="sticky bottom-3 flex justify-end pointer-events-none">
                    <button
                      type="button"
                      onClick={jumpToLatest}
                      className="pointer-events-auto rounded-full border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-3 py-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-950/60"
                    >
                      Jump to latest
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-2">Export last answer:</div>

                <button
                  type="button"
                  onClick={() => exportLast("docx")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                    verified
                      ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      : "border-slate-200/70 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!verified}
                  title={!verified ? "Verify to export" : "Export as .docx"}
                >
                  Docs (.docx)
                </button>

                <button
                  type="button"
                  onClick={() => exportLast("pptx")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                    verified
                      ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      : "border-slate-200/70 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!verified}
                  title={!verified ? "Verify to export" : "Export as .pptx"}
                >
                  PowerPoint (.pptx)
                </button>

                <button
                  type="button"
                  onClick={() => exportLast("pdf")}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                    verified
                      ? "border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                      : "border-slate-200/70 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!verified}
                  title={!verified ? "Verify to export" : "Export as PDF (Kami-friendly)"}
                >
                  Kami (PDF)
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-end gap-2">
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
                    className="flex-1 resize-none rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => sendChat()}
                    disabled={loading}
                    className={cn(
                      "rounded-full px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20",
                      loading ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
                    )}
                  >
                    Send
                  </button>
                </div>
                <div className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Enter to send • Shift+Enter for a new line
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verify gate modal */}
      <Modal open={verifyGateOpen} title="Verify to unlock Elora" onClose={() => setVerifyGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Educator mode and exports are locked behind verification. You can still preview as a limited guest.
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/verify")}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
          >
            Verify email
          </button>
          <button
            type="button"
            onClick={() => {
              storeGuest(true);
              const s = getSession();
              setSession(s);
              setVerifyGateOpen(false);
            }}
            className="rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
          >
            Continue as guest
          </button>
        </div>
      </Modal>

      {/* Teacher gate modal */}
      <Modal open={teacherGateOpen} title="Unlock Teacher Tools" onClose={() => setTeacherGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Lesson plans, worksheets, assessments, and slides are locked behind a Teacher Invite Code. This keeps teacher-only tools from being misused.
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold text-slate-900 dark:text-white">Teacher Invite Code</label>
          <input
            value={teacherGateCode}
            onChange={(e) => setTeacherGateCode(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="e.g., GENESIS2026"
          />
          {teacherGateStatus ? (
            <div className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">{teacherGateStatus}</div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              const ok = await validateAndActivateInvite(teacherGateCode);
              if (ok) setTeacherGateOpen(false);
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"
          >
            Unlock teacher tools
          </button>
          <button
            type="button"
            onClick={() => setTeacherGateOpen(false)}
            className="rounded-xl border border-slate-200/70 dark:border-white/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
          >
            Not now
          </button>
        </div>
      </Modal>
    </>
  );
}
