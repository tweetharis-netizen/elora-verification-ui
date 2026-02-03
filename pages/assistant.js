import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../components/Modal";
import {
  activateTeacher,
  getSession,
  isTeacher,
  refreshVerifiedFromServer,
  saveSession,
  setGuest as storeGuest,
} from "@/lib/session";
import {
  clearThread,
  createThread,
  deleteThread,
  ensureThreadsForUser,
  getActiveThreadId,
  getChatUserKey,
  getThreadMessages,
  getThreadMeta,
  listThreads,
  renameThread,
  setActiveThreadId,
  togglePinThread,
  upsertThreadMessages,
} from "../lib/chatThreads";
import { getRecommendations } from "../lib/videoLibrary";
import { motion, AnimatePresence } from "../components/MotionPolyfill";

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}

const COUNTRIES = ["Singapore", "United States", "United Kingdom", "Australia", "Malaysia", "Canada", "New Zealand", "India", "Nigeria", "Other"];
const SUBJECTS = ["General", "Math", "Science", "Physics", "Chemistry", "Biology", "English", "History", "Geography", "Computing", "Literature", "Economics"];

const ROLE_LABEL = {
  student: "Student",
  parent: "Parent",
  educator: "Educator",
};

const ROLE_QUICK_ACTIONS = {
  educator: [
    { id: "explain", label: "Explain a concept", hint: "Classroom-ready explanation + one example" },
    { id: "lesson", label: "Plan a lesson", hint: "Objectives, timings, checks, differentiation" },
    { id: "assignment", label: "New Assignment", hint: "AI-generated student tasks ✨" },
    { id: "worksheet", label: "Create worksheet", hint: "Student + Teacher versions" },
    { id: "assessment", label: "Generate assessment", hint: "Marks + marking scheme" },
    { id: "slides", label: "Design slides", hint: "Deck outline + teacher notes" },
    { id: "resources", label: "Find Resources", hint: "Videos, PDFs, articles for class" },
  ],
  student: [
    { id: "explain", label: "Explain it", hint: "Simple steps, beginner friendly" },
    { id: "quiz", label: "Generate Quiz", hint: "Test my knowledge right now ✨" },
    { id: "flashcards", label: "Make Flashcards", hint: "AI-powered study set ✨" },
    { id: "check", label: "Check my answer", hint: "Hints first. Answer unlocks on attempt 3." },
    { id: "study", label: "Study plan", hint: "Small steps, realistic plan" },
  ],
  parent: [
    { id: "explain", label: "Explain to me", hint: "Plain language, no jargon" },
    { id: "tutor", label: "Tutor Mode", hint: "Help me coach my child ✨" },
    { id: "curriculum", label: "Topic Roadmap", hint: "See the journey ahead ✨" },
    { id: "message", label: "Write a message", hint: "To teacher or school" },
  ],
};

const REFINEMENT_CHIPS = {
  explain: [
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
    { id: "steps", label: "Show steps" },
    { id: "check", label: "Add a quick check question" },
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
    { id: "answers", label: "Add teacher answers" },
    { id: "variants", label: "Add A/B versions" },
  ],
  assessment: [
    { id: "markscheme", label: "Add mark scheme" },
    { id: "variants", label: "Add variants" },
    { id: "harder", label: "Make it harder" },
    { id: "easier", label: "Make it easier" },
  ],
  slides: [
    { id: "outline", label: "Tighten outline" },
    { id: "hooks", label: "Add hook" },
    { id: "examples", label: "Add examples" },
    { id: "notes", label: "Add teacher notes" },
  ],
  check: [
    { id: "more-steps", label: "Show more steps" },
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
  ],
  study: [
    { id: "shorter", label: "Make it shorter" },
    { id: "steps", label: "Show steps" },
    { id: "check", label: "Add a check question" },
  ],
  coach: [
    { id: "simpler", label: "Make it simpler" },
    { id: "steps", label: "Give steps" },
    { id: "check", label: "Add a check question" },
  ],
  message: [
    { id: "shorter", label: "Make it shorter" },
    { id: "simpler", label: "Make it simpler" },
  ],
  custom: [
    { id: "simpler", label: "Make it simpler" },
    { id: "example", label: "Add an example" },
    { id: "steps", label: "Show steps" },
  ],
};

const STARTER_SUGGESTION_POOLS = {
  educator: ({ country, level, subject, topic }) => {
    const safeCountry = country || "your country";
    const safeLevel = level || "your current level";
    const safeSubject = subject || "your subject";
    const safeTopic = topic || "a tricky topic your class is currently on";

    return [
      `Draft a ${safeLevel} ${safeSubject} lesson on “${safeTopic}” using I Do / We Do / You Do, including key questions to ask and common misconceptions to watch for.`,
      `Create a 10-minute Do Now + 25-minute main task + 5-minute exit ticket for ${safeLevel} ${safeSubject} on “${safeTopic}”, with printable prompts.`,
      `Generate a quick formative check for “${safeTopic}”: 6 questions (2 easy, 2 medium, 2 stretch) with answers and what each question diagnoses.`,
      `Write teacher feedback comments for 3 common student errors on “${safeTopic}” (one sentence each) plus a targeted next step for improvement.`,
      `Build a rubric for ${safeSubject} work on “${safeTopic}” (4 bands) with concrete descriptors and a sample “Band 3” exemplar answer.`,
      `Differentiate “${safeTopic}” for 3 groups (support / core / challenge): provide 3 tasks per group and a short teacher script for transitions.`,
      `Make a mini-quiz (8 questions) on “${safeTopic}” aligned to ${safeLevel} ${safeSubject} in ${safeCountry}, with a mark scheme and reteach plan based on results.`,
      `Turn “${safeTopic}” into a worked example set: 1 fully-worked example + 3 gradually harder practice questions + a self-check answer key.`,
    ];
  },
  parent: ({ country, level, subject, topic }) => {
    const safeCountry = country || "our country";
    const safeLevel = level || "my child’s level";
    const safeSubject = subject || "schoolwork";
    const safeTopic = topic || "what they’re learning this week";

    return [
      `Explain “${safeTopic}” in plain parent-friendly language, then give me a 2-minute “car ride explanation” I can say to my child at ${safeLevel}.`,
      `Give me 3 at-home mini-activities to support ${safeSubject} on “${safeTopic}” (10 minutes each, no printing, uses common household items).`,
      `Write 6 gentle conversation starters about “${safeTopic}” that feel supportive (not like a test) — good for dinner or bedtime chats.`,
      `Create a simple checklist I can use to help with ${safeSubject} homework on “${safeTopic}” without taking over (what to ask, what not to say).`,
      `Draft a calm “frustration reset” script for when homework gets tense, plus 3 options to step back while still keeping progress moving.`,
      `Make a 1-week routine for ${safeLevel} (${safeCountry}) to build confidence in ${safeSubject}: 3 short sessions tied to “${safeTopic}” with specific steps.`,
      `Give me 5 praise phrases that reward effort and strategy during “${safeTopic}” practice (and 3 follow-up questions that encourage thinking).`,
      `Turn “${safeTopic}” into a quick real-life example I can use at home, then give me 3 questions to check understanding in a low-pressure way.`,
    ];
  },
  student: ({ level, subject, topic }) => {
    const safeLevel = level || "my level";
    const safeSubject = subject || "my subject";
    const safeTopic = topic || "a topic I’m stuck on";

    return [
      `Teach me “${safeTopic}” for ${safeSubject} at ${safeLevel} in 4 short steps, then ask me 2 quick check questions (wait for my answers).`,
      `Make me a 20-minute study sprint for “${safeTopic}”: warm-up → 2 focused drills → 1 mixed question → quick recap.`,
      `Give me 6 practice questions on “${safeTopic}” at ${safeLevel} and mark them one-by-one after I answer each (no spoilers).`,
      `I’ll paste my working for “${safeTopic}”. First highlight what I did correctly, then show the first wrong step and how to fix it.`,
      `Help me revise “${safeTopic}” for an exam: 5-bullet summary, 3 “must know” rules, and 3 exam-style questions with a marking guide.`,
      `Create a 7-day spaced revision plan for “${safeTopic}” with tiny daily tasks (5–10 minutes) and a self-test on day 7.`,
      `Explain my mistake: I’ll paste a wrong answer about “${safeTopic}” — tell me the misconception and give 2 similar questions to practice.`,
      `Make a “teach-back” script so I can explain “${safeTopic}” to a friend in 60 seconds, then quiz me with 3 short questions.`,
    ];
  },
};

function stableHashToUint32(input) {
  // Simple non-crypto hash for deterministic UI randomness
  const s = String(input || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function LockedFeatureOverlay({ children, isVerified }) {
  if (isVerified) return children;

  return (
    <div className="relative group cursor-not-allowed inline-flex">
      <div className="blur-[1px] opacity-70 pointer-events-none transition-all group-hover:blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-2xl border border-white/10 dark:border-slate-200 scale-90">
          <Link href="/verify" className="text-[10px] font-black text-white dark:text-slate-900 whitespace-nowrap leading-none no-underline">
            Verify to Unlock →
          </Link>
        </div>
      </div>
    </div>
  );
}

function pickStarterSuggestions({ seed, role, country, level, subject, topic }) {
  const key = role === "educator" || role === "teacher" ? "educator" : role === "parent" ? "parent" : "student";
  const poolFn = STARTER_SUGGESTION_POOLS[key] || STARTER_SUGGESTION_POOLS.student;
  const pool = poolFn({ country, level, subject, topic }) || [];
  if (!pool.length) return [];

  const rnd = mulberry32(stableHashToUint32(seed));
  const shuffled = seededShuffle(pool, rnd);

  const maxCount = Math.min(5, shuffled.length);
  const minCount = Math.min(3, maxCount);
  const countRange = maxCount - minCount;
  const count = minCount + (countRange > 0 ? Math.floor(rnd() * (countRange + 1)) : 0);

  return shuffled.slice(0, count);
}

const PREVIEW_DISMISS_KEY = "elora_preview_notice_dismissed_v1";
const PREFS_OPEN_KEY = "elora_assistant_prefs_open_v1";

function stripInternalTags(text) {
  return String(text || "")
    .replace(/<\s*internal\s*>[\s\S]*?<\s*\/\s*internal\s*>/gi, "")
    .replace(/<\s*internal\s*\/\s*>/gi, "")
    .replace(/<\s*internal\s*>/gi, "")
    .trim();
}

function cleanAssistantText(text) {
  let t = stripInternalTags(text || "");
  t = t.replace(/```[\s\S]*?```/g, "");
  t = t.replace(/`+/g, "");
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");
  t = t.replace(/_([^_]+)_/g, "$1");
  t = t.replace(/^\s*>\s?/gm, "");
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  t = t.replace(/^\s*([-*_])\1\1+\s*$/gm, "");
  t = t.replace(/<quiz_data>[\s\S]*?<\/quiz_data>/gi, "");
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

function inferActionFromMessage(text) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return null;

  if (
    t.includes("check my answer") ||
    t.includes("is this correct") ||
    t.includes("is it correct") ||
    t.includes("am i correct") ||
    t.includes("did i get it right") ||
    t.includes("right or wrong") ||
    t.includes("correct or not") ||
    /\bmy answer\b/.test(t) ||
    /\banswer\s*:\s*/.test(t) ||
    /\b=\s*-?\d/.test(t)
  ) {
    return "check";
  }

  if (t.includes("lesson plan")) return "lesson";
  if (t.includes("worksheet")) return "worksheet";
  if (t.includes("assessment") || t.includes("test") || t.includes("quiz")) return "assessment";
  if (t.includes("slides") || t.includes("powerpoint")) return "slides";

  return null;
}

function getCountryLevels(country) {
  const c = String(country || "").toLowerCase();

  if (c.includes("singapore")) {
    return [
      "Primary School",
      "Secondary School",
      "Junior College / Pre-U",
      "Polytechnic / ITE",
      "University",
    ];
  }

  if (c.includes("united states") || c === "us" || c.includes("usa")) {
    return [
      "Elementary School",
      "Middle School",
      "High School",
      "College / University",
    ];
  }

  if (c.includes("united kingdom") || c.includes("uk") || c.includes("britain") || c.includes("england")) {
    return [
      "Primary School",
      "Secondary School",
      "Sixth Form / College",
      "University",
    ];
  }

  if (c.includes("australia")) {
    return [
      "Primary School",
      "Secondary School",
      "University / TAFE",
    ];
  }

  if (c.includes("malaysia")) {
    return [
      "Primary School (Standard 1-6)",
      "Secondary School (Form 1-5)",
      "Pre-University / STPM",
      "University",
    ];
  }

  return ["Primary School", "Secondary School", "Tertiary / Higher Ed", "Adult Learning"];
}

async function compressImageToDataUrl(file, { maxDim = 1400, quality = 0.82 } = {}) {
  const readAsDataUrl = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read_failed"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(f);
    });

  const rawUrl = await readAsDataUrl(file);

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("image_decode_failed"));
    i.src = rawUrl;
  });

  const w = img.width || 1;
  const h = img.height || 1;

  const scale = Math.min(1, maxDim / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("canvas_failed");
  ctx.drawImage(img, 0, 0, outW, outH);

  const outMime = "image/jpeg";
  const outUrl = canvas.toDataURL(outMime, quality);

  if (outUrl.length > 6_000_000) {
    const smaller = canvas.toDataURL(outMime, 0.68);
    if (smaller.length > 6_000_000) throw new Error("image_too_large");
    return { dataUrl: smaller, mime: outMime, name: file.name || "image.jpg" };
  }

  return { dataUrl: outUrl, mime: outMime, name: file.name || "image.jpg" };
}

const InteractiveQuiz = ({ data, onComplete }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  if (!data?.questions) return null;

  const totalQuestions = data.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / totalQuestions) * 100;

  const handleFinish = () => {
    let s = 0;
    const submissionDetails = data.questions.map(q => ({
      question: q.question,
      studentAnswer: answers[q.id],
      correctAnswer: q.answer,
      isCorrect: answers[q.id] === q.answer
    }));

    data.questions.forEach(q => {
      if (answers[q.id] === q.answer) s++;
    });

    setScore(s);
    setSubmitted(true);

    // Sync to Session (Global Classroom)
    const currentSession = getSession();
    const submission = {
      id: `sub_${Date.now()}`,
      studentName: currentSession.email?.split('@')[0] || "Guest Student",
      quizTitle: data.title || "Quick Knowledge Check",
      score: s,
      total: totalQuestions,
      details: submissionDetails,
      timestamp: new Date().toISOString()
    };

    if (!currentSession.classroom) currentSession.classroom = {};
    if (!currentSession.classroom.submissions) currentSession.classroom.submissions = [];
    currentSession.classroom.submissions = [submission, ...currentSession.classroom.submissions];
    saveSession(currentSession);

    if (onComplete) onComplete(s, totalQuestions);
  };

  return (
    <div className="mt-8 mb-4 space-y-6 animate-reveal">
      <div className="p-8 rounded-[3rem] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 h-1.5 bg-indigo-500/20 w-full">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{data.title || "AI Knowledge Check"}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">Question {answeredCount} of {totalQuestions}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">🎯</div>
        </div>

        <div className="space-y-10">
          {data.questions.map((q, idx) => (
            <div key={q.id} className="space-y-4 group">
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center text-xs font-bold shrink-0 border border-neutral-200 dark:border-neutral-700">{idx + 1}</span>
                <p className="text-[15px] font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed pt-1">{q.question}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-12">
                {q.options?.map(opt => {
                  const isSelected = answers[q.id] === opt;
                  const isCorrect = submitted && opt === q.answer;
                  const isWrong = submitted && isSelected && opt !== q.answer;

                  return (
                    <button
                      key={opt}
                      disabled={submitted}
                      onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                      className={cn(
                        "group/opt p-4 rounded-lg border text-sm font-medium transition-all text-left relative overflow-hidden",
                        isSelected
                          ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800",
                        isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200",
                        isWrong && "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:text-rose-200"
                      )}
                    >
                      <div className="relative z-10 flex items-center justify-between">
                        <span>{opt}</span>
                        {isCorrect && <span className="text-lg">✓</span>}
                        {isWrong && <span className="text-lg">✕</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!submitted ? (
          <button
            onClick={handleFinish}
            disabled={answeredCount < totalQuestions}
            className="mt-8 w-full py-4 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 rounded-lg font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Grade My Progress
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 p-8 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center shadow-sm">
            <div className="text-5xl mb-4">{score === totalQuestions ? "🔥" : score > totalQuestions / 2 ? "⭐️" : "💪"}</div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Live Synced to Teacher</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 uppercase tracking-tight">
              Session Result: {score} / {totalQuestions}
            </div>
            <div className="mt-2 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full max-w-[200px] mx-auto overflow-hidden">
              <div className="h-full bg-neutral-900 dark:bg-neutral-50" style={{ width: `${(score / totalQuestions) * 100}%` }} />
            </div>
            <p className="text-xs font-medium text-neutral-500 mt-6 max-w-sm mx-auto leading-relaxed">
              Analysis: {score === totalQuestions ? "Perfect mastery! You've unlocked a momentum boost." : "Solid effort. Elora has prepared specific review videos in the Resource Lab to help you bridge the gap."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const AIResourceDrawer = ({ open, onClose, topic, subject }) => {
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    if (open) {
      setRecs(getRecommendations(subject, topic));
    }
  }, [open, topic, subject]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-neutral-900 shadow-2xl z-[101] flex flex-col border-l border-neutral-200 dark:border-neutral-800"
          >
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Resource Lab</h3>
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 mt-1">AI Curated for "{topic || subject}"</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-neutral-900 dark:hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {recs.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="text-4xl">🔎</div>
                  <p className="text-sm font-medium text-neutral-500">Expanding the library... check back in a few seconds.</p>
                </div>
              ) : (
                recs.map((rec, idx) => (
                  <motion.a
                    key={idx}
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="block group p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden mb-3 relative">
                      <Image
                        src={rec.thumbnail || `https://images.unsplash.com/photo-1546410531-bb4caa1b4247?auto=format&fit=crop&q=80&w=400`}
                        alt={rec.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/10 transition-colors" />
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-neutral-900/90 backdrop-blur-sm text-[9px] font-bold text-white rounded">LIVE</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{rec.type || "VIDEO"}</div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">{rec.title}</h4>
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-1 leading-relaxed">{rec.description}</p>
                    </div>
                  </motion.a>
                ))
              )}
            </div>

            <div className="p-6 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Mastery Tip</p>
              <p className="text-xs font-medium leading-relaxed">Watching visual breakdowns often improves retention by 40%. Try summarizing these in your own words.</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function AssistantPage() {
  const router = useRouter();

  const [session, setSession] = useState(() => getSession());
  const [role, setRole] = useState(() => session?.role || "student");
  const [country, setCountry] = useState(() => session?.country || "Singapore");
  const [level, setLevel] = useState(() => session?.level || "Primary School");
  const [subject, setSubject] = useState(() => session?.subject || "General");
  const [topic, setTopic] = useState(() => session?.topic || "");
  const [action, setAction] = useState(() => session?.action || "explain");

  // Advanced Prefs
  const [constraints, setConstraints] = useState("None");
  const [contextMode, setContextMode] = useState("Focused");
  const [responseStyle, setResponseStyle] = useState("Normal");
  const [searchMode, setSearchMode] = useState(false);
  const [customStyleText, setCustomStyleText] = useState("");

  // Chat State
  const [chatUserKey, setChatUserKeyState] = useState(() => getChatUserKey(getSession()));
  const [threads, setThreads] = useState([]);
  const [activeChatId, setActiveChatIdState] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // UI State
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [showJump, setShowJump] = useState(false);
  const [dismissPreviewNotice, setDismissPreviewNotice] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(Date.now());

  // Modals
  const [renameThreadId, setRenameThreadId] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);
  const [teacherGateStatus, setTeacherGateStatus] = useState("");

  // Resource Drawer
  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false);

  // Attachments
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachErr, setAttachErr] = useState("");

  const listRef = useRef(null);

  const verified = Boolean(session?.verified);
  const classCode = session?.classroom?.code || "";
  const canManageChats = verified;
  const teacherOnlyBlocked = !session?.verified && role === "educator";

  const assistantName = role === "educator" ? "Assistant" : "Elora";
  const vision = true;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const open = window.localStorage.getItem(PREFS_OPEN_KEY) !== "false";
      setSidebarOpen(open);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const dismissed = window.localStorage.getItem(PREVIEW_DISMISS_KEY) === "true";
      setDismissPreviewNotice(dismissed);
    } catch {
      setDismissPreviewNotice(false);
    }
  }, []);

  useEffect(() => {
    if (!verified) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(PREVIEW_DISMISS_KEY);
    } catch { }
    setDismissPreviewNotice(false);
  }, [verified]);

  useEffect(() => {
    // When country changes: ensure level is valid for that country.
    const allowed = getCountryLevels(country);
    if (!allowed.includes(level)) {
      setLevel(allowed[0] || "Primary 1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  // Session events
  useEffect(() => {
    function onSessionEvent() {
      const s = getSession();
      setSession(s);
      setRole(s?.role || "student");
      setCountry(s?.country || "Singapore");

      const allowed = getCountryLevels(s?.country || "Singapore");
      const nextLevel = allowed.includes(s?.level) ? s.level : allowed[0] || "Primary 1";
      setLevel(nextLevel);

      setSubject(s?.subject || "General");
      setTopic(s?.topic || "");
      setAction(s?.action || "explain");
    }

    if (typeof window !== "undefined") {
      window.addEventListener("elora:session", onSessionEvent);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("elora:session", onSessionEvent);
      }
    };
  }, []);

  useEffect(() => {
    if (!(role === "student" && action === "check")) {
      setAttempt(0);
    }
  }, [role, action]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (stickToBottom) el.scrollTop = el.scrollHeight;
  }, [messages, loading, stickToBottom]);

  function jumpToLatest() {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStickToBottom(true);
    setShowJump(false);
  }

  function dismissPreview() {
    setDismissPreviewNotice(true);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(PREVIEW_DISMISS_KEY, "true");
      } catch { }
    }
  }

  async function copyToClipboard(text, idx) {
    const value = String(text || "").trim();
    if (!value) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "true");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setCopiedIdx(idx);
      window.setTimeout(() => setCopiedIdx(-1), 900);
    } catch {
      // no-op
    }
  }

  async function persistSessionPatch(patch) {
    try {
      // Note: Endpoint /api/session/set expects a token, not a patch.
      // Persisting UI state via localStorage (getSession/saveSession) instead.
    } catch {
      // ignore
    }
  }

  // Server chat endpoints store ONE chat; we keep using them only as a simple sync of active thread
  async function saveServerChatIfVerified(currentSession, nextMessages) {
    try {
      if (!currentSession?.verified) return;
      await fetch("/api/chat/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
    } catch {
      // ignore
    }
  }

  async function clearServerChatIfVerified(currentSession) {
    try {
      if (!currentSession?.verified) return;
      await fetch("/api/chat/clear", { method: "POST" });
    } catch {
      // ignore
    }
  }

  function syncThreadsState(userKey) {
    const ensured = ensureThreadsForUser(userKey);
    const nextActive = ensured?.activeId || getActiveThreadId(userKey);

    setThreads(listThreads(userKey));
    setActiveChatIdState(nextActive);

    const msgs = getThreadMessages(userKey, nextActive) || [];
    setMessages(msgs);

    if (verified) {
      persistSessionPatch({ activeChatId: nextActive, messages: msgs });
    }
    return nextActive;
  }

  // Init: refresh verification, then load threads for correct identity (guest vs verified)
  useEffect(() => {
    let mounted = true;

    (async () => {
      await refreshVerifiedFromServer();
      if (!mounted) return;

      const s = getSession();
      setSession(s);
      setRole(s?.role || "student");

      const allowed = getCountryLevels(s?.country || "Singapore");
      setLevel(allowed.includes(s?.level) ? s.level : allowed[0] || "Primary 1");

      const userKey = getChatUserKey(s);
      setChatUserKeyState(userKey);

      syncThreadsState(userKey);
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When verification/email changes, switch identity (guest chats stay separate from verified)
  useEffect(() => {
    const s = getSession();
    const nextKey = getChatUserKey(s);
    if (nextKey === chatUserKey) return;

    setChatUserKeyState(nextKey);
    syncThreadsState(nextKey);
    setAttempt(0);
    setAttachedImage(null);
    setAttachErr("");
    setChatMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified, session?.email]);

  useEffect(() => {
    persistSessionPatch({
      role,
      country,
      level,
      subject,
      topic,
      action,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, country, level, subject, topic, action]);

  // Session Heartbeat for activeMinutes tracking
  useEffect(() => {
    const timer = setInterval(() => {
      const s = getSession();
      if (!s.usage) s.usage = { activeMinutes: 0 };
      s.usage.activeMinutes = (Number(s.usage.activeMinutes) || 0) + 1;
      s.usage.lastActive = new Date().toISOString();
      saveSession(s);
    }, 60000); // Every 1 minute

    return () => clearInterval(timer);
  }, []);

  function setActiveThreadAndLoad(nextId) {
    const id = setActiveThreadId(chatUserKey, nextId);
    setActiveChatIdState(id);
    setThreads(listThreads(chatUserKey));
    const msgs = getThreadMessages(chatUserKey, id);
    setMessages(msgs);
    setAttempt(0);
    setAttachedImage(null);
    setAttachErr("");
    setChatMenuOpen(false);

    persistSessionPatch({ activeChatId: id, messages: msgs });
  }

  function persistActiveMessages(nextMessages, { alsoSyncServer = true } = {}) {
    setMessages(nextMessages);

    // NO-MEMORY RULE for unverified users: Do not persist to storage or server.
    if (!verified) return;

    upsertThreadMessages(chatUserKey, activeChatId, nextMessages);
    setThreads(listThreads(chatUserKey));

    // Track usage on every message sent (only if Elora or User)
    const isActuallyNew = nextMessages.length > messages.length;
    if (isActuallyNew) {
      const s = getSession();
      if (!s.usage) s.usage = { messagesSent: 0, subjects: [], streak: 0 };
      s.usage.messagesSent = (Number(s.usage.messagesSent) || 0) + 1;

      // Update subjects explored
      if (subject && !Array.isArray(s.usage.subjects)) s.usage.subjects = [];
      if (subject && !s.usage.subjects.includes(subject)) {
        s.usage.subjects.push(subject);
      }

      // Update session log (limited to last 50 for storage size)
      if (!Array.isArray(s.usage.sessionLog)) s.usage.sessionLog = [];
      const logEntry = { ts: new Date().toISOString(), subject: subject || "General", action: action };
      s.usage.sessionLog = [logEntry, ...s.usage.sessionLog].slice(0, 50);

      // Update last active
      s.usage.lastActive = new Date().toISOString();

      // Update streak
      s.usage.streak = Math.max(Number(s.usage.streak) || 0, 1);

      saveSession(s);
    }

    persistSessionPatch({ activeChatId, messages: nextMessages });

    if (alsoSyncServer) {
      const currentSession = getSession();
      saveServerChatIfVerified(currentSession, nextMessages);
    }
  }

  async function callElora({ messageOverride, baseMessages }) {
    const currentSession = getSession();

    const userText = String(messageOverride || chatText || "").trim();
    if (!userText && !attachedImage?.dataUrl) return;

    setLoading(true);

    try {
      if (role === "educator" && !currentSession?.verified) {
        setVerifyGateOpen(true);
        setLoading(false);
        return;
      }

      if (teacherOnlyBlocked) {
        setTeacherGateOpen(true);
        setLoading(false);
        return;
      }

      const attemptNext =
        role === "student" && action === "check" ? Math.min(3, attempt + 1) : 0;

      const timeSpent = (Date.now() - lastActionTime) / 1000;
      const sentiment = (attemptNext > 1 || timeSpent > 60) ? "supportive" : "standard";

      const payload = {
        role,
        action,
        country,
        level,
        subject,
        topic,
        constraints,
        contextMode,
        responseStyle,
        searchMode,
        customStyleText,
        attempt: attemptNext,
        sentiment,
        vision,
        classCode,
        message: userText,
        messages: Array.isArray(baseMessages) ? baseMessages : messages,
        teacherRules: currentSession.classroom?.teacherRules || ""
      };

      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => null);

      const base = Array.isArray(baseMessages) ? baseMessages : messages;

      if (!r.ok) {
        const err = data?.error || data?.message || "Request failed.";
        if (String(err).toLowerCase().includes("verify")) setVerifyGateOpen(true);

        const next = [...base, { from: "elora", text: `Error: ${String(err)}`, ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: true });
        setLoading(false);
        return;
      }

      const outRaw = data?.reply || data?.text || data?.answer || "";
      if (!outRaw) {
        // Fallback if the engine returns empty but OK
        const next = [...base, { from: "elora", text: "I'm sorry, I couldn't generate a response. Please try rephrasing.", ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: true });
        setLoading(false);
        return;
      }
      const out = cleanAssistantText(outRaw);
      const next = [...base, { from: "elora", text: out, ts: Date.now() }];

      persistActiveMessages(next, { alsoSyncServer: true });

      if (role === "student" && action === "check") {
        setAttempt((a) => a + 1);
      }

      setAttachedImage(null);
      setAttachErr("");
    } catch (err) {
      console.error("AI Assistant Error:", err);
      const next = [
        ...base,
        {
          from: "elora",
          error: true,
          type: "recovery",
          text: `⚠️ System Error: ${err.message || "Connection unstable"}. Please try again.`,
          message: err.message || "Connection unstable",
          ts: Date.now()
        },
      ];
      persistActiveMessages(next, { alsoSyncServer: false });
    } finally {
      setChatText("");
      setLoading(false);
      setLastActionTime(Date.now());
    }
  }

  async function sendChat() {
    const trimmed = String(chatText || "").trim();
    if ((!trimmed && !attachedImage?.dataUrl) || loading) return;

    setLoading(true); // Pre-emptive lock
    setAttachErr("");

    const inferred = inferActionFromMessage(trimmed);
    if (inferred === "check" && action !== "check") {
      setAction("check");
      setAttempt(0);
      await persistSessionPatch({ action: "check" });
    }

    const userMsg = { from: "user", text: trimmed || "(image)", ts: Date.now() };

    // Use functional update to ensure we have the absolute latest messages
    setMessages(prev => {
      const next = [...prev, userMsg];
      persistActiveMessages(next, { alsoSyncServer: true });

      // Delay the actual call slightly to ensure state has settled
      setTimeout(() => {
        callElora({ messageOverride: trimmed, baseMessages: next });
      }, 0);

      return next;
    });
  }

  async function exportLast(type) {
    const last = [...messages].reverse().find((m) => m?.from === "elora");
    if (!last?.text) {
      const next = [
        ...messages,
        { from: "elora", text: "Nothing to export yet — ask me something first.", ts: Date.now() },
      ];
      persistActiveMessages(next, { alsoSyncServer: false });
      return;
    }

    if (!verified) {
      setVerifyGateOpen(true);
      const next = [
        ...messages,
        { from: "elora", text: "Exports are locked until your email is verified.", ts: Date.now() },
      ];
      persistActiveMessages(next, { alsoSyncServer: false });
      return;
    }

    try {
      const endpoint =
        type === "docx" ? "/api/export-docx" : type === "pptx" ? "/api/export-slides" : "/api/export-pdf";

      const content = cleanAssistantText(last.text);
      const title = type === "pptx" ? "Elora Slides" : type === "docx" ? "Elora Notes" : "Elora Export";

      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const ct = String(r.headers.get("content-type") || "");
      if (!r.ok || ct.includes("application/json")) {
        let err = `Export failed (HTTP ${r.status}).`;
        let data = null;
        try {
          data = await r.json();
        } catch { }
        const code = String(data?.error || data?.message || "").trim();
        if (r.status === 403 || code === "not_verified") {
          setVerifyGateOpen(true);
          err = "Export blocked: verify your email to unlock exports.";
        } else if (code) {
          err = `Export failed: ${code}`;
        }
        const next = [...messages, { from: "elora", text: err, ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: false });
        return;
      }

      const blob = await r.blob();
      if (!blob || blob.size === 0) {
        const next = [...messages, { from: "elora", text: "Export failed: empty file returned.", ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: false });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "pptx" ? "elora.pptx" : type === "docx" ? "elora.docx" : "elora.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const next = [...messages, { from: "elora", text: "Export failed due to a network error. Try again.", ts: Date.now() }];
      persistActiveMessages(next, { alsoSyncServer: false });
    }
  }

  async function applyRefinement(chipId) {
    const map = {
      simpler: "Make it simpler and more beginner-friendly.",
      example: "Add one clear example that matches the topic.",
      steps: "Show the steps clearly (short).",
      check: "Give one quick check question at the end.",
      diff: "Add differentiation: easier + harder extension.",
      timing: "Add a simple timeline with approximate minutes.",
      resources: "Add a short list of materials/resources.",
      easier: "Make it easier while keeping the same topic.",
      harder: "Make it harder and add a challenge question.",
      answers: "Add a teacher answer key after the questions.",
      rubric: "Add a short marking guide/rubric.",
      shorter: "Make it shorter and more direct.",
      markscheme: "Include a clear marking scheme.",
      variants: "Add two variants (A/B) with the same skills tested.",
      outline: "Tighten the slide outline into clear sections.",
      hooks: "Add 1-2 engaging hooks or questions for the start.",
      examples: "Add more examples that students can relate to.",
      notes: "Add short teacher notes for each section.",
      "more-steps": "Add more steps and explain the reasoning clearly.",
    };

    const refinement = map[chipId] || "Improve the answer.";

    const userMsg = { from: "user", text: refinement, ts: Date.now() };
    const nextMessages = [...messages, userMsg];

    persistActiveMessages(nextMessages, { alsoSyncServer: true });
    await callElora({ messageOverride: refinement, baseMessages: nextMessages });
  }

  async function validateAndActivateInvite(code) {
    const trimmed = (code || "").trim();
    setTeacherGateStatus("");

    if (!trimmed) {
      setTeacherGateStatus("Enter a code.");
      return false;
    }
    if (!verified) {
      setTeacherGateStatus("Verify your email first.");
      return false;
    }

    try {
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

  async function onPickImage(file) {
    setAttachErr("");
    setAttachedImage(null);

    if (!file) return;

    if (!file.type || !file.type.startsWith("image/")) {
      setAttachErr("Images only (PNG/JPG/WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAttachErr("That image is too large. Try a smaller photo (max 5MB).");
      return;
    }

    try {
      const out = await compressImageToDataUrl(file);
      setAttachedImage(out);
    } catch (e) {
      const code = String(e?.message || "");
      setAttachErr(
        code === "image_too_large"
          ? "That image is too large to send. Try a closer crop."
          : "Couldn’t attach that image. Try again."
      );
    }
  }

  function onNewChat() {
    if (!canManageChats) {
      setVerifyGateOpen(true);
      return;
    }
    const name = `New Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const id = createThread(chatUserKey, name);
    setActiveThreadAndLoad(id);
  }

  function onDeleteChat(id) {
    deleteThread(chatUserKey, id);
    const activeId = syncThreadsState(chatUserKey);
    setActiveChatIdState(activeId);
  }

  function onRenameChatStart(thread) {
    setRenameThreadId(thread.id);
    setRenameValue(thread.name);
  }

  function onTogglePin(id) {
    togglePinThread(chatUserKey, id);
    setThreads(listThreads(chatUserKey));
  }

  function onRenameConfirm() {
    if (renameValue.trim()) {
      renameThread(chatUserKey, renameThreadId, renameValue.trim());
      setThreads(listThreads(chatUserKey));
      setRenameThreadId("");
    }
  }

  function onClearAll() {
    clearThread(chatUserKey, activeChatId);
    setMessages([]);
    persistActiveMessages([], { alsoSyncServer: true });
  }

  useEffect(() => {
    const handleScroll = () => {
      const el = listRef.current;
      if (!el) return;

      const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 1; // +1 for tolerance
      setStickToBottom(isAtBottom);
      setShowJump(!isAtBottom);
    };

    const el = listRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      // Initial check
      handleScroll();
    }

    return () => {
      if (el) {
        el.removeEventListener("scroll", handleScroll);
      }
    };
  }, [messages, loading]); // Re-run when messages or loading state changes to update scroll position

  // Auto-scroll to bottom when new messages arrive and stickToBottom is true
  useEffect(() => {
    if (stickToBottom) {
      jumpToLatest();
    }
  }, [messages, stickToBottom]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [chatText, loading, attachedImage, messages, action, role, lastActionTime]); // Dependencies for sendChat

  // Update chatUserKey when session changes (e.g., login/logout)
  useEffect(() => {
    const s = getSession();
    const nextKey = getChatUserKey(s);
    if (nextKey !== chatUserKey) {
      setChatUserKeyState(nextKey);
      syncThreadsState(nextKey);
      setAttempt(0);
      setAttachedImage(null);
      setAttachErr("");
      setChatMenuOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email, session?.verified]);

  // Update session state when relevant props change
  useEffect(() => {
    const s = getSession();
    const updatedSession = {
      ...s,
      role,
      country,
      level,
      subject,
      topic,
      action,
    };
    saveSession(updatedSession);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, country, level, subject, topic, action]);

  // Clear chat text when active chat changes
  useEffect(() => {
    setChatText("");
  }, [activeChatId]);

  // Close resource drawer when topic/subject changes
  useEffect(() => {
    setResourceDrawerOpen(false);
  }, [topic, subject]);

  // Reset attempt count when action or role changes
  useEffect(() => {
    if (!(role === "student" && action === "check")) {
      setAttempt(0);
    }
  }, [role, action]);

  // Handle image attachment errors
  useEffect(() => {
    if (attachErr) {
      const timer = setTimeout(() => setAttachErr(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [attachErr]);

  // Handle teacher gate status messages
  useEffect(() => {
    if (teacherGateStatus) {
      const timer = setTimeout(() => setTeacherGateStatus(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [teacherGateStatus]);

  // Handle rename thread modal state
  useEffect(() => {
    if (renameThreadId && renameValue) {
      // Focus input when modal opens
      const input = document.getElementById("rename-input");
      if (input) input.focus();
    }
  }, [renameThreadId, renameValue]);

  // Handle verification gate opening
  useEffect(() => {
    if (verifyGateOpen) {
      // Optionally, log or track when the verification gate is shown
    }
  }, [verifyGateOpen]);

  // Handle teacher gate opening
  useEffect(() => {
    if (teacherGateOpen) {
      // Optionally, log or track when the teacher gate is shown
    }
  }, [teacherGateOpen]);

  // Handle chat menu opening/closing
  useEffect(() => {
    if (chatMenuOpen) {
      // Optionally, focus on the search input in the chat menu
    }
  }, [chatMenuOpen]);

  // Handle dismiss preview notice
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(PREVIEW_DISMISS_KEY, dismissPreviewNotice ? "true" : "false");
      } catch { }
    }
  }, [dismissPreviewNotice]);

  // Reset loading state if component unmounts while loading
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  if (!mounted) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="flex flex-col h-screen bg-premium text-premium selection:bg-primary-500/30 overflow-hidden font-sans transition-colors duration-500">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar / Configuration */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="w-full lg:w-80 h-full bg-premium-card border-r border-premium z-[40] fixed lg:relative flex flex-col shadow-premium-lg"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-8 group/header">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-xl shadow-indigo-500/20 group-hover/header:rotate-12 transition-transform duration-500">🛸</div>
                    <div>
                      <h1 className="text-xl font-black italic tracking-tighter">ELORA</h1>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[7px] font-black uppercase tracking-widest text-indigo-500/60">Advanced Neural Link</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      try { window.localStorage.setItem(PREFS_OPEN_KEY, "false"); } catch { }
                    }}
                    className="lg:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Personalization</label>

                    <div className="space-y-4 p-4 rounded-3xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 shadow-sm">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 ml-1">Syllabus Environment</span>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-[11px] font-bold focus:ring-2 ring-indigo-500/20 outline-none"
                        >
                          {COUNTRIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 ml-1">Academic Grade</span>
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-[11px] font-bold focus:ring-2 ring-indigo-500/20 outline-none"
                        >
                          {getCountryLevels(country).map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 ml-1">Target Subject</span>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-[11px] font-bold focus:ring-2 ring-indigo-500/20 outline-none"
                        >
                          {SUBJECTS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 ml-1">Current Topic</span>
                        <input
                          type="text"
                          placeholder="e.g. Algebra I"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-[11px] font-bold focus:ring-2 ring-indigo-500/20 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(ROLE_QUICK_ACTIONS).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={cn(
                        "p-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        role === r
                          ? "bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/20"
                          : "bg-white dark:bg-slate-800/50 border-slate-100 dark:border-white/5 text-slate-400 hover:border-indigo-500/30"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 relative overflow-hidden group shadow-sm">
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Learning Mastery</span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">Tier 8</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative z-10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "68%" }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-indigo-600 dark:bg-indigo-500"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest relative z-10">
                    <span>1,240 XP</span>
                    <span>2,000 XP</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 relative">
          {/* Header */}
          <div className="h-20 flex items-center justify-between px-6 lg:px-8 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-20 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const next = !sidebarOpen;
                  setSidebarOpen(next);
                  try { window.localStorage.setItem(PREFS_OPEN_KEY, String(next)); } catch { }
                }}
                className="lg:hidden p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all"
              >
                <div className="w-5 h-0.5 bg-slate-900 dark:bg-white mb-1" />
                <div className="w-5 h-0.5 bg-slate-900 dark:bg-white mb-1" />
                <div className="w-3 h-0.5 bg-slate-900 dark:bg-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="lg:hidden w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-sm shadow-xl">🛸</div>
                <div>
                  <h2 className="text-sm font-black tracking-tight">{activeChatId ? threads.find(t => t.id === activeChatId)?.name || "Current Session" : "New Link"}</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {loading ? "Neural Analysis..." : `Adapting to ${level} ${subject}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setResourceDrawerOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest"
              >
                <span>Resource Lab</span>
                <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px]">✨</span>
              </button>

              <div className="h-6 w-px bg-slate-100 dark:border-white/5 mx-2 hidden sm:block" />

              <button
                onClick={() => setChatMenuOpen(!chatMenuOpen)}
                className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all text-slate-400"
              >
                🕒
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 space-y-10 custom-scrollbar scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="max-w-3xl mx-auto pt-10 sm:pt-20">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-8"
                >
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                    <div className="relative w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/40 mx-auto">🛸</div>
                  </div>

                  <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                      Ready to learn, <span className="text-indigo-600">{session?.email?.split('@')[0] || "Explorer"}</span>?
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      I'm Elora, your cinematic AI tutor. Your subject is set to <span className="text-indigo-500 font-bold">{subject}</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
                    {pickStarterSuggestions({ seed: lastActionTime, role, country, level, subject, topic }).map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setChatText(s);
                          // Auto send if they click? For now just fill input
                        }}
                        className="p-5 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-transparent hover:border-indigo-500/20 hover:bg-white dark:hover:bg-slate-900 text-left transition-all hover:shadow-xl group"
                      >
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Suggestion {idx + 1}</div>
                        <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed group-hover:text-indigo-600 transition-colors">{s}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-12 pb-32">
                {messages.map((m, idx) => {
                  const isElora = m.from === "elora";
                  // const isUser = m.from === "user"; // Removed
                  // Extract quiz data if present
                  const quizMatch = m.text?.match(/<quiz_data>([\s\S]*?)<\/quiz_data>/i);
                  const quizJson = quizMatch ? JSON.parse(quizMatch[1]) : null;
                  const cleanText = m.text?.replace(/<quiz_data>[\s\S]*?<\/quiz_data>/gi, "").trim();

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex group", isElora ? "justify-start" : "justify-end")}
                    >
                      <div className={cn("max-w-[85%] sm:max-w-2xl flex gap-4 sm:gap-6", isElora ? "flex-row" : "flex-row-reverse")}>
                        {isElora && (
                          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-xl shadow-indigo-500/20 shrink-0 mt-1">🛸</div>
                        )}

                        <div className="space-y-4 min-w-0">
                          {cleanText && (
                            <div className={cn(
                              "p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden",
                              isElora
                                ? "bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-100"
                                : "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20"
                            )}>
                              {isElora && (
                                <div className="absolute top-0 right-0 p-4 opacity-0 transition-opacity">
                                  <button onClick={() => copyToClipboard(cleanText, idx)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all">
                                    {copiedIdx === idx ? "✅" : "📋"}
                                  </button>
                                </div>
                              )}
                              <div className="prose prose-slate dark:prose-invert max-w-none text-[15px] font-medium leading-[1.8] tracking-tight whitespace-pre-wrap">
                                {cleanText}
                              </div>
                            </div>
                          )}

                          {isElora && m.error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-red-500 backdrop-blur-md shadow-premium-lg">
                              <div className="flex items-center gap-3 mb-2 font-black text-[10px] uppercase tracking-widest">
                                <span>⚠️ System Recovery</span>
                                <div className="h-px flex-1 bg-red-500/20" />
                              </div>
                              <p className="text-sm font-bold mb-4">{m.message || "Something went wrong. Let's try that again."}</p>
                              <button
                                onClick={() => sendChat()}
                                className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
                              >
                                Retry Connection
                              </button>
                            </div>
                          )}

                          {isElora && quizJson && (
                            <InteractiveQuiz data={quizJson} onComplete={() => { }} />
                          )}

                          {isElora && idx === messages.length - 1 && action && REFINEMENT_CHIPS[action] && !loading && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {REFINEMENT_CHIPS[action].map(chip => (
                                <button
                                  key={chip.id}
                                  onClick={() => applyRefinement(chip.id)}
                                  className="px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all"
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start animate-reveal">
                    <div className="flex gap-4 sm:gap-6 max-w-2xl">
                      <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-xl shadow-indigo-500/20 shrink-0">🛸</div>
                      <div className="flex items-center gap-1.5 p-6 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="p-6 lg:p-10 bg-white dark:bg-slate-950 pt-20 shrink-0 relative z-20">
            {/* Jump to latest */}
            <AnimatePresence>
              {showJump && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={jumpToLatest}
                  className="absolute top-0 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
                >
                  <span>New Message ↓</span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto space-y-6">
              {/* Attachment Preview */}
              <AnimatePresence>
                {attachedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-indigo-500/20 w-fit"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-indigo-500/10 border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={attachedImage.dataUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Attachment</div>
                      <div className="text-[11px] font-bold text-slate-500 truncate max-w-[120px]">{attachedImage.name}</div>
                    </div>
                    <button onClick={() => setAttachedImage(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all font-black">✕</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {attachErr && (
                <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 ml-4 animate-reveal">
                  ⚠️ {attachErr}
                </div>
              )}

              <div className="relative group">
                <div className="absolute -inset-1 rounded-[2.5rem] bg-slate-200 dark:bg-slate-800 blur opacity-10 group-focus-within:opacity-30 transition duration-1000" />

                <div className="relative flex items-end gap-3 p-3 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl">
                  <div className="flex flex-col gap-2 pb-1 pl-1">
                    <label className="cursor-pointer p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all text-xl" title="Attach Image">
                      📷
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPickImage(e.target.files?.[0])}
                        disabled={loading}
                      />
                    </label>
                  </div>

                  <textarea
                    placeholder={loading ? `${assistantName} is thinking...` : `Ask ${assistantName} anything about ${topic || subject}...`}
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 p-4 min-h-[56px] max-h-48 text-[15px] font-medium placeholder:text-slate-400 custom-scrollbar resize-none"
                    disabled={loading}
                  />

                  <div className="flex flex-col gap-2 pb-1 pr-1">
                    <button
                      onClick={sendChat}
                      disabled={loading || (!chatText.trim() && !attachedImage)}
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all shadow-xl",
                        chatText.trim() || attachedImage
                          ? "bg-indigo-600 text-white hover:scale-105 active:scale-95 shadow-indigo-500/40"
                          : "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {loading ? "⏳" : "🚀"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status / Export */}
              <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", verified ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {verified ? "Neural Link Secured" : "Guest Mode Active"}
                    </span>
                  </div>
                  {!verified && (
                    <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 transition-colors">
                      Sync Account →
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onClearAll()}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Clear Path
                  </button>
                  <div className="h-3 w-px bg-slate-100 dark:border-white/5" />
                  <div className="flex gap-2">
                    {["docx", "pptx", "pdf"].map(type => (
                      <button
                        key={type}
                        onClick={() => exportLast(type)}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat History Menu */}
              <AnimatePresence>
                {chatMenuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setChatMenuOpen(false)}
                      className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-white/5 z-[61] shadow-2xl flex flex-col"
                    >
                      <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <h3 className="text-xl font-black italic tracking-tighter">THREAD HISTORY</h3>
                        <button onClick={() => setChatMenuOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">✕</button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        <button
                          onClick={() => { onNewChat(); setChatMenuOpen(false); }}
                          className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all mb-4"
                        >
                          <span>Initiate New Session</span>
                          <span>✨</span>
                        </button>

                        {threads.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest opacity-40 italic">No stored threads</div>
                        ) : (
                          threads.map((t) => {
                            const isActive = activeChatId === t.id;
                            return (
                              <div
                                key={t.id}
                                className={cn(
                                  "group p-4 rounded-2xl border transition-all cursor-pointer relative",
                                  isActive
                                    ? "bg-indigo-500/10 border-indigo-500/40"
                                    : "bg-white dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                )}
                                onClick={() => { setActiveThreadAndLoad(t.id); setChatMenuOpen(false); }}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">{t.pinned ? "📌" : "📄"}</span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={cn("text-xs font-black truncate", isActive ? "text-indigo-600" : "text-slate-600 dark:text-slate-200")}>{t.name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                      {new Date(t.ts).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onTogglePin(t.id); }}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-[10px]"
                                  >
                                    {t.pinned ? "📍" : "📌"}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onRenameChatStart(t); }}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-[10px]"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteChat(t.id); }}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-[10px] text-rose-500"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <AIResourceDrawer
                open={resourceDrawerOpen}
                onClose={() => setResourceDrawerOpen(false)}
                topic={topic}
                subject={subject}
              />

              {/* Global Modals */}
              <Modal open={!!renameThreadId} onClose={() => setRenameThreadId("")} title="Rename Thread">
                <div className="space-y-6">
                  <input
                    id="rename-input"
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-sm font-bold focus:ring-2 ring-indigo-500/20"
                    onKeyDown={(e) => e.key === "Enter" && onRenameConfirm()}
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRenameThreadId("")}
                      className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onRenameConfirm}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Confirm Rename
                    </button>
                  </div>
                </div>
              </Modal>

              <Modal open={verifyGateOpen} onClose={() => setVerifyGateOpen(false)} title="Security Breach Detected">
                <div className="text-center space-y-6 py-4">
                  <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-xl">⚠️</div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black tracking-tight">Access Restricted</h4>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed px-4">
                      Advanced learning tools, cloud persistence, and high-level exports require a verified neural link (your email).
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link href="/login" className="py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all no-underline">
                      Secure Connection Now
                    </Link>
                    <button
                      onClick={() => setVerifyGateOpen(false)}
                      className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Continue in Sandbox Mode
                    </button>
                  </div>
                </div>
              </Modal>

              <Modal open={teacherGateOpen} onClose={() => setTeacherGateOpen(false)} title="Teacher Authorization">
                <div className="space-y-6 py-2">
                  <div className="flex items-center gap-4 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <div className="text-2xl">🎓</div>
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed">
                      Educator tools (Lesson Plans, Worksheets) require a verified teacher invitation code.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Access Key</label>
                    <input
                      type="text"
                      placeholder="ELORA-XXXX-XXXX"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-sm font-bold uppercase tracking-widest placeholder:text-slate-300 focus:ring-2 ring-indigo-500/20"
                      onKeyUp={(e) => {
                        if (e.key === 'Enter') {
                          validateAndActivateInvite(e.target.value).then(ok => {
                            if (ok) setTimeout(() => setTeacherGateOpen(false), 2000);
                          });
                        }
                      }}
                      id="teacher-code-input"
                    />
                    {teacherGateStatus && (
                      <div className={cn("text-[9px] font-black uppercase tracking-widest ml-2", teacherGateStatus.includes("✅") ? "text-emerald-500" : "text-rose-500")}>
                        {teacherGateStatus}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={async () => {
                      const input = document.getElementById("teacher-code-input");
                      if (input) {
                        const ok = await validateAndActivateInvite(input.value);
                        if (ok) setTimeout(() => setTeacherGateOpen(false), 2000);
                      }
                    }}
                    className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Verify Credentials
                  </button>
                  <p className="text-center text-[10px] font-medium text-slate-400">
                    Need a code? <a href="mailto:support@elora.ai" className="text-indigo-500 font-bold">Request Access</a>
                  </p>
                </div>
              </Modal>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Preview Notice */}
      {!verified && !dismissPreviewNotice && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-xl bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border border-white/20 p-2 pl-6 rounded-full flex items-center justify-between shadow-2xl z-50 ring-1 ring-white/10"
        >
          <div className="flex items-center gap-3">
            <span className="flex w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
              Limited Sandbox: <span className="opacity-60 font-medium">Messages won't save.</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 bg-white dark:bg-white text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest no-underline">
              Secure Link
            </Link>
            <button onClick={dismissPreview} className="p-2 text-slate-400 hover:text-white transition-opacity">
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
