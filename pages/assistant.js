import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../components/Modal";
import {
  activateTeacher,
  getSession,
  isTeacher,
  refreshVerifiedFromServer,
  setGuest as storeGuest,
  setRole as storeRole,
} from "../lib/session";

const LEVELS = ["Primary", "Secondary", "JC/IB", "University", "Adult learning"];

const SUBJECTS = [
  "General",
  "Mathematics",
  "Additional Mathematics",
  "English Language",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "History",
  "Geography",
  "Economics",
  "Literature",
];

const ACTIONS = [
  { id: "explain", label: "Explain", desc: "Explain a concept clearly" },
  { id: "lesson", label: "Lesson Plan", desc: "Plan a lesson for teachers" },
  { id: "worksheet", label: "Worksheet", desc: "Generate practice questions" },
  { id: "assessment", label: "Assessment", desc: "Create quiz/test items" },
  { id: "slides", label: "Slides Outline", desc: "Build a slide-by-slide outline" },
];

const ROLE_OPTIONS = [
  { id: "educator", label: "Teacher", desc: "Lesson plans & classroom tools" },
  { id: "student", label: "Student", desc: "Practice and learn step-by-step" },
];

const COUNTRIES = [
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Thailand",
  "Vietnam",
  "India",
  "United States",
  "United Kingdom",
  "Australia",
  "Other",
];

const RESPONSE_STYLES = [
  { id: "standard", label: "Standard", desc: "Clear, friendly, and concise" },
  { id: "exam", label: "Exam prep", desc: "Minimal hints, check answers" },
  { id: "tutor", label: "Tutor", desc: "More step-by-step guidance" },
  { id: "custom", label: "Custom", desc: "You write the style" },
];

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
    { id: "answers", label: "Add answer key" },
    { id: "steps", label: "Add worked example" },
  ],
  assessment: [
    { id: "easier", label: "Make it easier" },
    { id: "harder", label: "Make it harder" },
    { id: "rubric", label: "Add rubric" },
    { id: "answers", label: "Add answer key" },
  ],
  slides: [
    { id: "shorter", label: "Shorter" },
    { id: "longer", label: "Longer" },
    { id: "activities", label: "Add activities" },
    { id: "resources", label: "Add resources" },
  ],
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function cleanAssistantText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[ \t]{3,}/g, "  ")
    .trim();
}

function formatRole(role) {
  if (role === "educator") return "Teacher";
  if (role === "student") return "Student";
  return "Guest";
}

export default function AssistantPage() {
  const router = useRouter();
  const [session, setSession] = useState(() => getSession());
  const [role, setRole] = useState(() => session?.role || "educator");
  const [country, setCountry] = useState(() => session?.country || "Singapore");
  const [level, setLevel] = useState(() => session?.level || "Secondary");
  const [subject, setSubject] = useState(() => session?.subject || "General");
  const [topic, setTopic] = useState(() => session?.topic || "");
  const [constraints, setConstraints] = useState("");
  const [responseStyle, setResponseStyle] = useState("standard");
  const [customStyleText, setCustomStyleText] = useState("");

  const [action, setAction] = useState(() => session?.action || "explain");
  const [messages, setMessages] = useState(() => session?.messages || []);
  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(false);

  const [attempt, setAttempt] = useState(0);

  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);
  const [teacherGateCode, setTeacherGateCode] = useState("");

  const [teacherGateStatus, setTeacherGateStatus] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("");

  const listRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const nearBottomRef = useRef(true);

  const verified = Boolean(session?.verified);
  const teacher = Boolean(session?.teacher);
  const guest = Boolean(session?.guest);

  useEffect(() => {
    // initial load from local session
    const s = getSession();
    setSession(s);
    if (s?.role) setRole(s.role);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        await refreshVerifiedFromServer();
      } finally {
        const s = getSession();
        if (!mounted) return;
        setSession(s);
        if (s?.role) setRole(s.role);
      }
    }

    refresh();

    const onStorageOrSession = () => {
      const s = getSession();
      setSession(s);
      if (s?.role) setRole(s.role);
    };

    window.addEventListener("storage", onStorageOrSession);
    window.addEventListener("elora:session", onStorageOrSession);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorageOrSession);
      window.removeEventListener("elora:session", onStorageOrSession);
    };
  }, []);

  useEffect(() => {
    // allow deep links like /assistant?role=student
    if (!router.isReady) return;
    const qRole = String(router.query?.role || "").trim();
    const qAction = String(router.query?.action || "").trim();
    const qTopic = String(router.query?.topic || "").trim();

    if (qRole && ["educator", "student"].includes(qRole)) setRole(qRole);
    if (qAction && ACTIONS.some((a) => a.id === qAction)) setAction(qAction);
    if (qTopic) setTopic(qTopic.slice(0, 80));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  useEffect(() => {
    // Persist UI settings into session store (best-effort)
    const next = getSession();
    const patch = {
      role,
      country,
      level,
      subject,
      topic,
      action,
    };

    try {
      window.localStorage.setItem("elora_session_v1", JSON.stringify({ ...next, ...patch }));
    } catch {
      // ignore
    }

    storeRole(role);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, country, level, subject, topic, action]);

  const guestBlocked = useMemo(() => {
    if (!guest) return false;
    return ["lesson", "worksheet", "assessment", "slides"].includes(action);
  }, [guest, action]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // Only auto-scroll when the user is already near the bottom,
    // or when we explicitly "stick" after sending a message.
    if (stickToBottomRef.current || nearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      stickToBottomRef.current = false;
      nearBottomRef.current = true;
    }
  }, [messages, loading]);

  function handleListScroll() {
    const el = listRef.current;
    if (!el) return;
    const threshold = 96; // px from bottom
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = distanceFromBottom < threshold;
  }

  async function persistSessionPatch(patch) {
    try {
      await fetch("/api/session/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      // best-effort
    }
  }

  async function saveServerChatIfVerified(currentSession, nextMessages) {
    if (!currentSession?.verified) return;
    try {
      await fetch("/api/chat/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
    } catch {
      // best-effort
    }
  }

  async function clearServerChatIfVerified(nextSession) {
    if (!nextSession?.verified) return;
    try {
      await fetch("/api/chat/clear", { method: "POST" });
    } catch {
      // best-effort
    }
  }

  async function maybeLoadServerChat() {
    const currentSession = getSession();
    if (!currentSession?.verified) return;
    try {
      const r = await fetch("/api/chat/get");
      const data = await r.json().catch(() => null);
      if (r.ok && Array.isArray(data?.messages)) {
        setMessages(data.messages);
        persistSessionPatch({ messages: data.messages });
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    // If verified, try to load chat from server once.
    if (!verified) return;
    maybeLoadServerChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]);

  useEffect(() => {
    // If guest, open gate once at start (optional UX)
    if (verified) return;
    if (guest) return;

    const s = getSession();
    if (s?.verified || s?.guest) return;

    const flag = window.sessionStorage.getItem("elora_assistant_gate_seen");
    if (flag) return;

    window.sessionStorage.setItem("elora_assistant_gate_seen", "1");
    setVerifyGateOpen(true);
  }, [verified, guest]);

  async function doVerifySend() {
    const email = verifyEmail.trim();
    if (!email) return;

    setVerifyStatus("Sending…");

    try {
      const r = await fetch("/api/verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "Failed to send verification email.");
      setVerifyStatus("Sent! Check your inbox.");
    } catch (e) {
      setVerifyStatus(String(e?.message || e));
    }
  }

  async function doGuestContinue() {
    storeGuest(true);
    await persistSessionPatch({ guest: true });
    const s = getSession();
    setSession(s);
  }

  async function doTeacherRedeem() {
    setTeacherGateStatus("");
    const code = teacherGateCode.trim();
    if (!code) {
      setTeacherGateStatus("Enter a code.");
      return false;
    }

    try {
      // This currently goes through the frontend API route; later we’ll harden it to backend-authoritative.
      const ok = await activateTeacher(code);
      if (!ok) {
        setTeacherGateStatus("Invalid code.");
        return false;
      }

      await refreshVerifiedFromServer();
      const s = getSession();
      setSession(s);

      setTeacherGateStatus("Teacher tools unlocked ✅");
      return true;
    } catch {
      setTeacherGateStatus("Could not validate right now. Try again.");
      return false;
    }
  }

  const refinementChips = useMemo(() => REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.explain, [action]);

  async function callElora({ messageOverride = "", baseMessages = null } = {}) {
    const currentSession = getSession();

    if (!currentSession?.verified && !currentSession?.guest) {
      setVerifyGateOpen(true);
      return;
    }

    const teacherOnly = ["lesson", "worksheet", "assessment", "slides"].includes(action);
    if (teacherOnly && !isTeacher()) {
      setTeacherGateOpen(true);
      return;
    }

    if (guestBlocked) {
      setMessages((m) => [
        ...m,
        { from: "elora", text: "Guest mode is limited — verify to unlock teacher tools and exports.", ts: Date.now() },
      ]);
      return;
    }

    const lastUser = (messageOverride || "").trim() || chatText.trim();
    if (!lastUser) return;

    setLoading(true);

    try {
      const nextAttempt = role === "student" ? attempt + 1 : 0;

      const payload = {
        role,
        country,
        level,
        subject,
        topic: topic || "General",
        action,
        message: lastUser,
        options: constraints,
        guest: Boolean(currentSession?.guest),
        attempt: role === "student" ? nextAttempt : 0,
        responseStyle,
        customStyle: responseStyle === "custom" ? customStyleText : "",
        teacherInvite: currentSession?.teacherCode || "",
      };

      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "AI request failed.");

      const clean = cleanAssistantText(data?.reply || "");
      const eloraMsg = { from: "elora", text: clean, ts: Date.now() };

      const base = Array.isArray(baseMessages) ? baseMessages : messages;
      const nextMessages = [...base, eloraMsg];

      setMessages(nextMessages);

      if (role === "student") setAttempt(nextAttempt);

      persistSessionPatch({
        role,
        country,
        level,
        subject,
        topic,
        action,
        messages: nextMessages,
      });

      await saveServerChatIfVerified(currentSession, nextMessages);
    } catch (e) {
      setMessages((m) => [...m, { from: "elora", text: `Error: ${String(e?.message || e)}`, ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  async function exportLast(kind) {
    if (!verified) {
      setVerifyGateOpen(true);
      return;
    }

    const last = [...messages].reverse().find((m) => m.from === "elora")?.text || "";
    const content = cleanAssistantText(last);
    if (!content.trim()) return;

    const title = `${subject} - ${topic || "Elora"}`.slice(0, 80);

    const endpoint =
      kind === "docx"
        ? "/api/export-docx"
        : kind === "pptx"
        ? "/api/export-slides"
        : "/api/export-pdf";

    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => null);
        throw new Error(data?.error || "Export failed.");
      }

      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const ext = kind === "pptx" ? "pptx" : kind === "docx" ? "docx" : "pdf";
      a.download = `${
        title.replace(/[^a-z0-9 _-]/gi, "").replace(/\s+/g, "-").slice(0, 60) || "Elora-Export"
      }.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setMessages((m) => [...m, { from: "elora", text: `Export error: ${String(e?.message || e)}`, ts: Date.now() }]);
    }
  }

  async function sendChat() {
    const currentSession = getSession();
    const msg = chatText.trim();

    if (!msg) return;

    if (!currentSession?.verified && !currentSession?.guest) {
      setVerifyGateOpen(true);
      return;
    }

    const teacherOnly = ["lesson", "worksheet", "assessment", "slides"].includes(action);
    if (teacherOnly && !isTeacher()) {
      setTeacherGateOpen(true);
      return;
    }

    // After the user sends, keep the chat pinned to the latest message.
    stickToBottomRef.current = true;
    const userMsg = { from: "user", text: msg, ts: Date.now() };
    const nextMessages = [...messages, userMsg];

    setChatText("");
    setMessages(nextMessages);

    persistSessionPatch({ messages: nextMessages });
    await saveServerChatIfVerified(currentSession, nextMessages);

    await callElora({ messageOverride: msg, baseMessages: nextMessages });
  }

  async function applyRefinement(chipId) {
    const map = {
      simpler: "Make it simpler and more beginner-friendly.",
      clearer: "Make it clearer and easier to follow.",
      example: "Add one clear example.",
      steps: "Show steps with short, numbered points.",
      check: "Add 2 quick check questions at the end.",
      diff: "Add differentiation for mixed abilities.",
      timing: "Add a simple timeline with approximate minutes.",
      resources: "Add a short list of resources.",
      easier: "Make it easier.",
      harder: "Make it harder.",
      answers: "Add an answer key.",
      rubric: "Add a simple rubric.",
      shorter: "Make it shorter and tighter.",
      longer: "Make it longer and more detailed.",
      activities: "Add activities for students.",
    };

    const prompt = map[chipId];
    if (!prompt) return;

    const currentSession = getSession();
    if (!currentSession?.verified && !currentSession?.guest) {
      setVerifyGateOpen(true);
      return;
    }

    const teacherOnly = ["lesson", "worksheet", "assessment", "slides"].includes(action);
    if (teacherOnly && !isTeacher()) {
      setTeacherGateOpen(true);
      return;
    }

    setLoading(true);

    try {
      const lastUser = [...messages].reverse().find((m) => m.from === "user")?.text || "";
      const lastElora = [...messages].reverse().find((m) => m.from === "elora")?.text || "";

      const payload = {
        role,
        country,
        level,
        subject,
        topic: topic || "General",
        action,
        message: `Refine the previous answer.\n\nUser asked:\n${lastUser}\n\nElora answered:\n${lastElora}\n\nRefinement:\n${prompt}\n\nRules: plain language, no raw LaTeX, short steps, friendly.`,
        options: constraints,
        guest: Boolean(currentSession?.guest),
        attempt: role === "student" ? attempt : 0,
        responseStyle,
        customStyle: responseStyle === "custom" ? customStyleText : "",
        teacherInvite: currentSession?.teacherCode || "",
      };

      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "AI request failed.");

      const clean = cleanAssistantText(data?.reply || "");
      const eloraMsg = { from: "elora", text: clean, ts: Date.now() };
      const nextMessages = [...messages, eloraMsg];

      setMessages(nextMessages);

      persistSessionPatch({ messages: nextMessages });
      await saveServerChatIfVerified(currentSession, nextMessages);
    } catch (e) {
      setMessages((m) => [...m, { from: "elora", text: `Error: ${String(e?.message || e)}`, ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  const roleLabel = formatRole(role);

  return (
    <>
      <Head>
        <title>Elora Assistant</title>
      </Head>

      <div className="elora-page">
        <div className="elora-container">
          <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
            {/* LEFT */}
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 dark:text-white">Setup</h1>
                  <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    Choose your context. Keep prompts short and clear.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-extrabold border",
                      verified
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                    )}
                    title={verified ? "Verified" : "Not verified"}
                  >
                    {verified ? "Verified" : "Not verified"}
                  </span>

                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-extrabold border",
                      teacher
                        ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200"
                        : "border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/10 text-slate-700 dark:text-slate-200"
                    )}
                    title={teacher ? "Teacher mode enabled" : "Teacher tools locked"}
                  >
                    {teacher ? "Teacher mode" : "Standard mode"}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="grid gap-3">
                  <div>
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Role</label>
                    <div className="mt-2 grid gap-2">
                      {ROLE_OPTIONS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={cn(
                            "w-full rounded-xl border px-3 py-2 text-left transition",
                            r.id === role
                              ? "border-indigo-500/40 bg-indigo-500/10"
                              : "border-slate-200/70 dark:border-white/10 bg-white/40 dark:bg-slate-950/10 hover:bg-white dark:hover:bg-slate-950/20"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-extrabold text-slate-950 dark:text-white">{r.label}</div>
                            {r.id === role ? (
                              <div className="text-xs font-black text-indigo-700 dark:text-indigo-200">Selected</div>
                            ) : null}
                          </div>
                          <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">{r.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {role === "educator" && verified && !teacher ? (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                      Teacher tools are locked until you enter a Teacher Invite Code in{" "}
                      <button type="button" onClick={() => setTeacherGateOpen(true)} className="underline font-extrabold">
                        Unlock Teacher Tools
                      </button>
                      .
                    </div>
                  ) : null}
                </div>

                {/* Region / Level / Subject */}
                <div className="mt-6 grid gap-3">
                  <div>
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="elora-input mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="elora-input mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="elora-input mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Topic (optional)</label>
                    <input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="E.g. Quadratic factorisation"
                      className="elora-input mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>

                {/* Action */}
                <div className="mt-6">
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Action</label>
                  <div className="mt-2 grid gap-2">
                    {ACTIONS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAction(a.id)}
                        className={cn(
                          "w-full rounded-xl border px-3 py-2 text-left transition",
                          a.id === action
                            ? "border-indigo-500/40 bg-indigo-500/10"
                            : "border-slate-200/70 dark:border-white/10 bg-white/40 dark:bg-slate-950/10 hover:bg-white dark:hover:bg-slate-950/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-extrabold text-slate-950 dark:text-white">{a.label}</div>
                          {a.id === action ? (
                            <div className="text-xs font-black text-indigo-700 dark:text-indigo-200">Selected</div>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">{a.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Response style */}
                <div className="mt-6">
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Response Style</label>
                  <div className="mt-2 grid gap-2">
                    {RESPONSE_STYLES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setResponseStyle(s.id)}
                        className={cn(
                          "w-full rounded-xl border px-3 py-2 text-left transition",
                          s.id === responseStyle
                            ? "border-indigo-500/40 bg-indigo-500/10"
                            : "border-slate-200/70 dark:border-white/10 bg-white/40 dark:bg-slate-950/10 hover:bg-white dark:hover:bg-slate-950/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-extrabold text-slate-950 dark:text-white">{s.label}</div>
                          {s.id === responseStyle ? (
                            <div className="text-xs font-black text-indigo-700 dark:text-indigo-200">Selected</div>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">{s.desc}</div>
                      </button>
                    ))}
                  </div>

                  {responseStyle === "custom" ? (
                    <div className="mt-3">
                      <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Custom style instructions
                      </label>
                      <textarea
                        value={customStyleText}
                        onChange={(e) => setCustomStyleText(e.target.value)}
                        rows={4}
                        placeholder="E.g. Use very short steps, use analogies, end with a quick check question."
                        className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="mt-6">
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Extra constraints (optional)</label>
                  <textarea
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    rows={3}
                    placeholder="E.g. Use Singapore syllabus terms, keep to 5 steps, no advanced notation."
                    className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const currentSession = getSession();
                    setMessages([]);
                    setAttempt(0);
                    setChatText("");
                    persistSessionPatch({ messages: [] });
                    await clearServerChatIfVerified(currentSession);
                  }}
                  className="mt-4 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/10 px-3 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/20 transition"
                >
                  Clear chat
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5 flex flex-col min-h-0 lg:h-[calc(100vh-var(--elora-nav-offset)-64px)] lg:max-h-[820px]">
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
                      disabled={loading || messages.length === 0}
                      onClick={() => applyRefinement(c.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-extrabold transition",
                        "border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40",
                        loading || messages.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                      )}
                    >
                      {c.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => exportLast("docx")}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-extrabold border transition",
                      verified
                        ? "border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
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
                        ? "border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
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
                        ? "border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/10 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
                        : "border-slate-200/70 dark:border-white/10 text-slate-400 cursor-not-allowed"
                    )}
                    disabled={!verified}
                    title={!verified ? "Verify to export" : "Export as PDF (Kami-friendly)"}
                  >
                    PDF
                  </button>
                </div>
              </div>

              <div ref={listRef} onScroll={handleListScroll} className="mt-4 flex-1 min-h-0 overflow-auto pr-1">
                <div className="space-y-3">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed border",
                        m.from === "user"
                          ? "ml-auto bg-indigo-600 text-white border-indigo-500/20"
                          : "mr-auto bg-white/80 dark:bg-slate-950/25 text-slate-700 dark:text-slate-100 border-slate-200/60 dark:border-white/10"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{cleanAssistantText(m.text)}</div>
                    </div>
                  ))}

                  {loading ? (
                    <div className="mr-auto max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 text-slate-700 dark:text-slate-200">
                      Thinking…
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendChat();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    rows={2}
                    placeholder={
                      role === "educator"
                        ? "Describe what you want: lesson plan, worksheet, explanation…"
                        : "Ask a question or paste your attempt…"
                    }
                    className="flex-1 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !chatText.trim()}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-black transition",
                      loading || !chatText.trim()
                        ? "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                    )}
                  >
                    Send
                  </button>
                </form>

                {!verified ? (
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                    Verify to unlock exports + persistent chat across devices.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verify gate modal */}
      <Modal open={verifyGateOpen} title="Verify to continue" onClose={() => setVerifyGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Verification unlocks exports and persistent sessions. For demo: use a real email you can access.
        </div>

        <div className="mt-4">
          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Email</label>
          <input
            value={verifyEmail}
            onChange={(e) => setVerifyEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={doVerifySend}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500 transition"
            >
              Send link
            </button>

            <button
              type="button"
              onClick={async () => {
                storeGuest(true);
                const currentSession = getSession();
                setSession(currentSession);
                setVerifyGateOpen(false);
                await doGuestContinue();
              }}
              className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
            >
              Continue as guest
            </button>
          </div>

          {verifyStatus ? <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">{verifyStatus}</div> : null}
        </div>
      </Modal>

      {/* Teacher gate modal */}
      <Modal open={teacherGateOpen} title="Unlock Teacher Tools" onClose={() => setTeacherGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Lesson plans, worksheets, assessments, and slides are locked behind a Teacher Invite Code.
        </div>

        <div className="mt-4">
          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Invite code</label>
          <input
            value={teacherGateCode}
            onChange={(e) => setTeacherGateCode(e.target.value)}
            placeholder="e.g. GENESIS2026"
            className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const ok = await doTeacherRedeem();
                if (ok) setTeacherGateOpen(false);
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500 transition"
            >
              Unlock
            </button>

            <button
              type="button"
              onClick={() => setTeacherGateOpen(false)}
              className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/10 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/40"
            >
              Cancel
            </button>
          </div>

          {teacherGateStatus ? (
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">{teacherGateStatus}</div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
