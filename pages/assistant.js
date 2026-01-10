import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import {
  getSession,
  isTeacher,
  refreshVerifiedFromServer,
  setGuest as storeGuest,
  setRole as storeRole,
} from "../lib/session";

const LEVELS = ["Primary", "Secondary", "JC/IB", "University", "Adult learning"];
const COUNTRIES = ["Singapore", "Malaysia", "UK", "US", "Australia", "Other"];
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
    { id: "answers", label: "Add answer key" },
    { id: "variants", label: "Add variants" },
  ],
  assessment: [
    { id: "shorter", label: "Shorter" },
    { id: "harder", label: "Harder" },
    { id: "markscheme", label: "Add marking scheme" },
    { id: "variants", label: "Add variants" },
  ],
  slides: [
    { id: "outline", label: "Tighter outline" },
    { id: "hooks", label: "Add hooks" },
    { id: "examples", label: "More examples" },
    { id: "notes", label: "Teacher notes" },
  ],
  check: [
    { id: "stricter", label: "Be stricter" },
    { id: "mistake", label: "Focus on the mistake" },
    { id: "hint", label: "Give only 1 hint" },
    { id: "explain-why", label: "Explain why it's wrong" },
  ],
  verify: [
    { id: "stricter", label: "Be stricter" },
    { id: "mistake", label: "Focus on the mistake" },
    { id: "hint", label: "Give only 1 hint" },
    { id: "explain-why", label: "Explain why it's wrong" },
  ],
  custom: [
    { id: "shorter", label: "Shorter" },
    { id: "clearer", label: "Clearer" },
    { id: "more-steps", label: "More steps" },
    { id: "example", label: "Add example" },
  ],
};

const RESPONSE_STYLE_OPTIONS = [
  { id: "standard", label: "Standard", hint: "Clear + friendly" },
  { id: "tutor", label: "Tutor", hint: "Guided steps + checks" },
  { id: "exam", label: "Exam", hint: "Concise method + verify" },
  { id: "custom", label: "Custom", hint: "Follow your style" },
];

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function persistSessionPatch(patch) {
  try {
    const s = getSession() || {};
    const next = { ...s, ...patch };
    localStorage.setItem("elora_session_v1", JSON.stringify(next));
  } catch {
    // ignore
  }
}

async function saveServerChatIfVerified(session, messages) {
  try {
    if (!session?.verified) return;
    await fetch("/api/chat/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch {
    // ignore
  }
}

function buildWorkVerificationDisplay(question, attempt, focus) {
  const q = String(question || "").trim();
  const a = String(attempt || "").trim();
  const f = String(focus || "").trim();

  const focusLine = f ? `\n\nFocus:\n${f}` : "";
  return `[Work Verification]\nQuestion:\n${q}\n\nStudent attempt:\n${a}${focusLine}`;
}

export default function Assistant() {
  const router = useRouter();

  const session = useMemo(() => getSession(), []);
  const [role, setRole] = useState(() => session?.role || "student");
  const [guest, setGuest] = useState(() => Boolean(session?.guest));
  const [verified, setVerified] = useState(() => Boolean(session?.verified));
  const [teacherUnlocked, setTeacherUnlocked] = useState(() => Boolean(session?.teacherUnlocked));
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [country, setCountry] = useState(() => session?.country || "Singapore");
  const [level, setLevel] = useState(() => session?.level || "Secondary");
  const [subject, setSubject] = useState(() => session?.subject || "General");
  const [topic, setTopic] = useState(() => session?.topic || "");
  const [workQuestion, setWorkQuestion] = useState(() => session?.workQuestion || "");
  const [workAttempt, setWorkAttempt] = useState(() => session?.workAttempt || "");
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

  const [teacherCode, setTeacherCode] = useState(() => session?.teacherCode || "");
  const [teacherCodeStatus, setTeacherCodeStatus] = useState("");

  const [exportOpen, setExportOpen] = useState(false);

  const [stickToBottom, setStickToBottom] = useState(true);

  const listRef = useRef(null);

  const ROLE_QUICK_ACTIONS = {
    educator: [
      { id: "explain", label: "Explain a concept", hint: "Clear, classroom-ready explanation + example" },
      { id: "custom", label: "Custom request", hint: "Ask anything as a teacher (tone, structure, etc.)" },
      { id: "verify", label: "Verify student work", hint: "Verdict + checks + one next-step hint" },
      { id: "lesson", label: "Plan a lesson", hint: "Objectives, timings, checks, differentiation" },
      { id: "worksheet", label: "Create worksheet", hint: "Student + Teacher versions, export-ready" },
      { id: "assessment", label: "Generate assessment", hint: "Marks + marking scheme" },
      { id: "slides", label: "Design slides", hint: "Deck outline + teacher notes" },
    ],
    student: [
      { id: "explain", label: "Explain it", hint: "Step-by-step, beginner friendly" },
      { id: "check", label: "Check my answer", hint: "Find mistakes + how to fix" },
      { id: "study", label: "Study plan", hint: "Simple plan, small steps" },
      { id: "custom", label: "Custom", hint: "Ask anything" },
    ],
    parent: [
      { id: "explain", label: "Explain to me", hint: "Plain language, no jargon" },
      { id: "coach", label: "How to help", hint: "What to say and do at home" },
      { id: "message", label: "Write a message", hint: "To teacher or school" },
      { id: "custom", label: "Custom", hint: "Ask anything" },
    ],
  };

  useEffect(() => {
    const first = ROLE_QUICK_ACTIONS[role]?.[0]?.id || "explain";
    setAction(first);
    setAttempt(0);
    storeRole(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    // Load session + status from server on first mount
    (async () => {
      const s = getSession();
      if (s) {
        if (typeof s?.role === "string") setRole(s.role);
        if (typeof s?.guest === "boolean") setGuest(Boolean(s.guest));
        if (typeof s?.teacherCode === "string") setTeacherCode(s.teacherCode);
        if (typeof s?.country === "string") setCountry(s.country);
        if (typeof s?.level === "string") setLevel(s.level);
        if (typeof s?.subject === "string") setSubject(s.subject);
        if (typeof s?.topic === "string") setTopic(s.topic);
        if (typeof s?.workQuestion === "string") setWorkQuestion(s.workQuestion);
        if (typeof s?.workAttempt === "string") setWorkAttempt(s.workAttempt);
        if (Array.isArray(s?.messages)) setMessages(s.messages);
        if (typeof s?.verified === "boolean") setVerified(Boolean(s.verified));
      }

      try {
        await refreshVerifiedFromServer();
        const s2 = getSession();
        if (s2?.role) setRole(s2.role);
        if (typeof s2?.workQuestion === "string") setWorkQuestion(s2.workQuestion);
        if (typeof s2?.workAttempt === "string") setWorkAttempt(s2.workAttempt);
        if (typeof s2?.verified === "boolean") setVerified(Boolean(s2.verified));
        if (typeof s2?.teacherUnlocked === "boolean") setTeacherUnlocked(Boolean(s2.teacherUnlocked));
      } catch {
        // ignore
      } finally {
        setLoadingStatus(false);
      }
    })();
  }, []);

  // Demo triggers (query-driven, safe, run-once)
  useEffect(() => {
    if (!router.isReady) return;

    const demoRole = String(router.query.demoRole || "").trim();
    if (demoRole && (demoRole === "educator" || demoRole === "student" || demoRole === "parent")) {
      try {
        const already = sessionStorage.getItem("elora_demo_role_set_v1");
        if (!already) {
          sessionStorage.setItem("elora_demo_role_set_v1", "1");
          setRole(demoRole);
        }
      } catch {
        // ignore
      }
    }

    const unlockTeacher = String(router.query.unlockTeacher || "") === "1";
    if (unlockTeacher) {
      try {
        const already = sessionStorage.getItem("elora_demo_unlock_teacher_v1");
        if (!already) {
          sessionStorage.setItem("elora_demo_unlock_teacher_v1", "1");
          if (!isTeacher()) setTeacherGateOpen(true);
        }
      } catch {
        // ignore
      }
    }
  }, [router.isReady, router.query]);

  // Track stick-to-bottom behavior
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 30;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setStickToBottom(atBottom);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll new messages only when user is already at bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (!stickToBottom) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, stickToBottom]);

  // Persist key settings
  useEffect(() => {
    const patch = {
      role,
      country,
      level,
      subject,
      topic,
      workQuestion,
      workAttempt,
      action,
    };
    persistSessionPatch(patch);
  }, [role, country, level, subject, topic, workQuestion, workAttempt, action]);

  function jumpToLatest() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStickToBottom(true);
  }

  function loadDemoExample() {
    // Purpose-built: 1-click demo that always produces a clear verdict.
    setSubject("Math");
    setTopic("Linear equations");

    setWorkQuestion("Solve: 2x + 3 = 11");
    setWorkAttempt("Student wrote:\n2x = 11\nx = 5.5");

    setChatText("Focus on the first mistake only, and give ONE next-step hint.");
    persistSessionPatch({
      subject: "Math",
      topic: "Linear equations",
      workQuestion: "Solve: 2x + 3 = 11",
      workAttempt: "Student wrote:\n2x = 11\nx = 5.5",
    });
  }

  async function callElora({ messageOverride, baseMessages }) {
    if (loading) return;

    const rawUser = (messageOverride || "").trim() || chatText.trim();
    const needsWorkInputs = action === "check" || action === "verify";

    if (needsWorkInputs) {
      const q = (workQuestion || "").trim();
      const a = (workAttempt || "").trim();

      if (!q || !a) {
        setMessages((m) => [
          ...m,
          {
            from: "elora",
            text: "To verify work, paste the question and the student attempt in the Work Verification box (left panel).",
            ts: Date.now(),
          },
        ]);
        return;
      }

      const focus = rawUser || "Verify this attempt and point out the first mistake (if any).";
      var lastUser = buildWorkVerificationDisplay(q, a, focus);
    } else {
      var lastUser = rawUser;
    }

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
        responseStyle,
        customStyle: customStyleText,
        guest,
        attempt: nextAttempt,
        teacherInvite: getSession()?.teacherCode || "",
      };

      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => null);

      if (!r.ok) {
        const msg = data?.error || "Assistant failed. Try again.";
        setMessages((m) => [...m, { from: "elora", text: msg, ts: Date.now() }]);
        return;
      }

      const reply = String(data?.reply || "").trim() || "I didn’t get a response. Try again.";
      const eloraMsg = { from: "elora", text: reply, ts: Date.now() };

      const nextMessages = [...(baseMessages || messages), eloraMsg];
      setMessages(nextMessages);

      if (role === "student") setAttempt(nextAttempt);

      persistSessionPatch({
        role,
        country,
        level,
        subject,
        topic,
        workQuestion,
        workAttempt,
        action,
        messages: nextMessages,
      });

      await saveServerChatIfVerified(getSession(), nextMessages);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { from: "elora", text: `Network error: ${String(e?.message || e)}`, ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function sendChat() {
    const currentSession = getSession();
    const msg = chatText.trim();

    const needsWorkInputs = action === "check" || action === "verify";
    const q = (workQuestion || "").trim();
    const a = (workAttempt || "").trim();

    if (!msg && !needsWorkInputs) return;

    if (needsWorkInputs && (!q || !a)) {
      setMessages((m) => [
        ...m,
        {
          from: "elora",
          text: "To verify work, paste the question and the student attempt in the Work Verification box (left panel).",
          ts: Date.now(),
        },
      ]);
      return;
    }

    if (!currentSession?.verified && !currentSession?.guest) {
      setVerifyGateOpen(true);
      return;
    }

    const teacherOnly = ["lesson", "worksheet", "assessment", "slides", "verify"].includes(action);
    if (teacherOnly && !isTeacher()) {
      setTeacherGateOpen(true);
      return;
    }

    const focus = msg || "Verify this attempt and point out the first mistake (if any).";
    const displayText = needsWorkInputs ? buildWorkVerificationDisplay(q, a, focus) : msg;

    const userMsg = { from: "user", text: displayText, ts: Date.now() };
    const nextMessages = [...messages, userMsg];

    setChatText("");
    setMessages(nextMessages);

    persistSessionPatch({ messages: nextMessages });
    await saveServerChatIfVerified(currentSession, nextMessages);

    await callElora({ messageOverride: msg, baseMessages: nextMessages });
  }

  async function applyRefinement(chip) {
    if (!messages?.length) return;
    if (loading) return;

    const prompt =
      chip === "example"
        ? "Add a short example."
        : chip === "simpler"
        ? "Rewrite this simpler."
        : chip === "steps"
        ? "Show short steps."
        : chip === "check"
        ? "Add one quick check question with answer."
        : chip === "diff"
        ? "Add differentiation: support + stretch."
        : chip === "timing"
        ? "Add timings."
        : chip === "resources"
        ? "Add resources."
        : chip === "easier"
        ? "Make it easier."
        : chip === "harder"
        ? "Make it harder."
        : chip === "answers"
        ? "Add answer key."
        : chip === "markscheme"
        ? "Add marking scheme."
        : chip === "variants"
        ? "Add variants."
        : chip === "outline"
        ? "Make the outline tighter."
        : chip === "hooks"
        ? "Add hooks."
        : chip === "notes"
        ? "Add teacher notes."
        : chip === "stricter"
        ? "Be stricter in your checking."
        : chip === "mistake"
        ? "Focus on the first mistake and explain it."
        : chip === "hint"
        ? "Give only ONE next-step hint."
        : chip === "explain-why"
        ? "Explain why it is wrong in plain language."
        : chip === "shorter"
        ? "Make it shorter."
        : chip === "clearer"
        ? "Make it clearer."
        : chip === "more-steps"
        ? "Add a few more steps."
        : "Refine this.";

    setChatText(prompt);
    await sendChat();
  }

  async function redeemTeacherCode() {
    const code = String(teacherCode || "").trim();
    if (!code) {
      setTeacherCodeStatus("Enter a code.");
      return;
    }
    setTeacherCodeStatus("Checking…");

    try {
      const r = await fetch("/api/teacher-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        const err = String(data?.error || "invalid_code");
        setTeacherCodeStatus(err === "missing_session" ? "Please verify first." : "Invalid code.");
        return;
      }

      persistSessionPatch({ teacherCode: code });
      setTeacherCodeStatus("Unlocked ✅");

      await refreshVerifiedFromServer();
      const s2 = getSession();
      setTeacherUnlocked(Boolean(s2?.teacherUnlocked));
    } catch {
      setTeacherCodeStatus("Could not redeem. Try again.");
    }
  }

  const chips = REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.custom;
  const quickActions = ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.student;
  const activeAction = quickActions.find((a) => a.id === action) || quickActions[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070a10] dark:text-white">
      <Head>
        <title>Elora — Assistant</title>
      </Head>

      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          {/* Left: Setup / controls */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">Assistant Setup</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Role, topic, and tools. Keep it simple for a clean demo.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-[11px] font-extrabold",
                    verified
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                  )}
                >
                  {verified ? "Verified" : guest ? "Guest" : "Unverified"}
                </span>

                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-[11px] font-extrabold",
                    teacherUnlocked || isTeacher()
                      ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-200"
                      : "bg-slate-500/10 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {teacherUnlocked || isTeacher() ? "Teacher tools" : "Standard"}
                </span>
              </div>
            </div>

            {/* Role selector */}
            <div className="mt-5">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Role</div>
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
                      "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
                      role === r
                        ? "border-indigo-500/50 bg-indigo-600/10 text-indigo-700 dark:text-indigo-200"
                        : "border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50/60 dark:hover:bg-white/5"
                    )}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-5">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Quick action</div>
              <div className="mt-2 grid gap-2">
                {quickActions.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      if (
                        a.id === "lesson" ||
                        a.id === "worksheet" ||
                        a.id === "assessment" ||
                        a.id === "slides" ||
                        a.id === "verify"
                      ) {
                        if (!isTeacher()) {
                          setTeacherGateOpen(true);
                          return;
                        }
                      }
                      setAction(a.id);
                      persistSessionPatch({ action: a.id });
                    }}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition",
                      action === a.id
                        ? "border-indigo-500/50 bg-indigo-600/10"
                        : "border-slate-200/70 dark:border-white/10 hover:bg-slate-50/60 dark:hover:bg-white/5"
                    )}
                  >
                    <div className="text-sm font-black text-slate-900 dark:text-white">{a.label}</div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{a.hint}</div>
                  </button>
                ))}
              </div>

              {activeAction?.id === "verify" && (
                <div className="mt-3 rounded-2xl border border-indigo-500/20 bg-indigo-600/5 p-3 text-xs text-slate-700 dark:text-slate-200">
                  Teacher tool: gives a verdict + checks + one next-step hint (not a full solve unless asked).
                </div>
              )}
            </div>

            {/* Context */}
            <div className="mt-5">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Context</div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                    className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                    className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                    className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="e.g., Fractions, Photosynthesis, Loops in Python"
                  />
                </div>
              </div>

              {action === "check" || action === "verify" ? (
                <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-600/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">Work Verification</div>
                      <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                        Paste the question and the student’s attempt. Elora gives a verdict, checks, and one next-step hint.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={loadDemoExample}
                      className="rounded-xl border border-indigo-500/30 bg-indigo-600/10 px-3 py-2 text-[11px] font-black text-indigo-700 hover:bg-indigo-600/15 dark:text-indigo-200"
                      title="Loads a safe demo example (1 click)"
                    >
                      Load demo example
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Question</label>
                      <textarea
                        value={workQuestion}
                        onChange={(e) => setWorkQuestion(e.target.value)}
                        rows={4}
                        placeholder="E.g. Solve: 2x + 3 = 11"
                        className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Student attempt</label>
                      <textarea
                        value={workAttempt}
                        onChange={(e) => setWorkAttempt(e.target.value)}
                        rows={6}
                        placeholder="Paste the student's working/steps here…"
                        className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Constraints */}
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Constraints (optional)</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    e.g., “no LaTeX”, “short steps”, “SG syllabus”
                  </span>
                </div>
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                  placeholder="Optional constraints..."
                  className="mt-2 w-full rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              {/* Response style */}
              <div className="mt-5">
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Response style</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {RESPONSE_STYLE_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setResponseStyle(o.id)}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition",
                        responseStyle === o.id
                          ? "border-indigo-500/50 bg-indigo-600/10"
                          : "border-slate-200/70 dark:border-white/10 hover:bg-slate-50/60 dark:hover:bg-white/5"
                      )}
                    >
                      <div className="text-sm font-black text-slate-900 dark:text-white">{o.label}</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{o.hint}</div>
                    </button>
                  ))}
                </div>

                {responseStyle === "custom" ? (
                  <textarea
                    value={customStyleText}
                    onChange={(e) => setCustomStyleText(e.target.value)}
                    rows={4}
                    placeholder='E.g. “Use very short steps, and end with a quick check question.”'
                    className="mt-3 w-full rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                  />
                ) : null}
              </div>

              {/* Teacher invite */}
              <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Teacher Invite Code</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">Unlock teacher tools (works after verification).</div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    placeholder="GENESIS2026"
                    className="flex-1 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <button
                    type="button"
                    onClick={redeemTeacherCode}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-black text-white hover:bg-indigo-500"
                  >
                    Apply
                  </button>
                </div>

                {teacherCodeStatus ? (
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">{teacherCodeStatus}</div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right: chat */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 p-4 dark:border-white/10">
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">Chat</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {loadingStatus ? "Loading status…" : "Ask. Paste attempts. Refine with chips."}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    persistSessionPatch({ messages: [] });
                  }}
                  className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-black text-slate-800 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  disabled={!verified}
                  title={!verified ? "Verify to export" : "Export as PDF (Kami-friendly)"}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-black",
                    verified
                      ? "border-indigo-500/30 bg-indigo-600/10 text-indigo-700 hover:bg-indigo-600/15 dark:text-indigo-200"
                      : "border-slate-200/70 bg-white/50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                  )}
                >
                  Export
                </button>
              </div>
            </div>

            {/* Messages list */}
            <div ref={listRef} className="relative h-[560px] overflow-y-auto p-4">
              {messages?.length ? (
                <div className="grid gap-3">
                  {messages.map((m, i) => (
                    <div
                      key={`${m.ts || i}-${i}`}
                      className={cn(
                        "rounded-2xl border p-3 text-sm leading-relaxed",
                        m.from === "user"
                          ? "ml-auto max-w-[92%] border-indigo-500/30 bg-indigo-600/10 text-slate-900 dark:text-white"
                          : "mr-auto max-w-[92%] border-slate-200/70 bg-white/70 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/50 p-6 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Start by choosing a quick action (left) and sending a message. If you paste a student attempt, Elora can
                  verify it.
                </div>
              )}

              {!stickToBottom && messages?.length ? (
                <button
                  type="button"
                  onClick={jumpToLatest}
                  className="absolute bottom-4 right-4 rounded-full border border-indigo-500/30 bg-indigo-600/10 px-3 py-2 text-xs font-black text-indigo-700 shadow-sm hover:bg-indigo-600/15 dark:text-indigo-200"
                  title="Jump to latest message"
                >
                  Jump to latest
                </button>
              ) : null}
            </div>

            {/* Chips + input */}
            <div className="border-t border-slate-200/60 p-4 dark:border-white/10">
              <div className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => applyRefinement(c.id)}
                    className="rounded-full border border-slate-200/70 bg-white/60 px-3 py-2 text-xs font-black text-slate-800 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChat();
                  }}
                  placeholder={
                    action === "check" || action === "verify"
                      ? "Optional: what should Elora focus on? (e.g., first mistake only)"
                      : "Ask Elora to refine, explain, or guide your next attempt…"
                  }
                  className="flex-1 rounded-full border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <button
                  type="button"
                  onClick={sendChat}
                  disabled={loading}
                  className={cn(
                    "rounded-full px-4 py-3 text-sm font-black text-white transition",
                    loading ? "bg-slate-400" : "bg-indigo-600 hover:bg-indigo-500"
                  )}
                >
                  {loading ? "Thinking…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verify gate */}
      <Modal open={verifyGateOpen} onClose={() => setVerifyGateOpen(false)} title="Verify to continue">
        <div className="text-sm text-slate-700 dark:text-slate-200">To use Educator tools and persist your session, verify your email.</div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/verify")}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500"
          >
            Verify now
          </button>
          <button
            type="button"
            onClick={() => {
              setGuest(true);
              storeGuest(true);
              persistSessionPatch({ guest: true });
              setVerifyGateOpen(false);
            }}
            className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-black text-slate-800 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Continue as guest
          </button>
        </div>
      </Modal>

      {/* Teacher gate */}
      <Modal open={teacherGateOpen} onClose={() => setTeacherGateOpen(false)} title="Teacher tools locked">
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Enter a Teacher Invite Code in Settings to unlock teacher-only tools.
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTeacherGateOpen(false);
              const el = document.querySelector('input[placeholder="GENESIS2026"]');
              if (el) el.focus();
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500"
          >
            Enter code
          </button>
          <button
            type="button"
            onClick={() => router.push("/help")}
            className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-black text-slate-800 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            See help
          </button>
        </div>
      </Modal>

      {/* Export modal (placeholder UI) */}
      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Export">
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Export will generate a Kami-friendly PDF in a later batch. For now, copy/paste is supported.
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setExportOpen(false)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
