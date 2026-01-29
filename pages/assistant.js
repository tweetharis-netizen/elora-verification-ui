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

const COUNTRIES = ["Singapore", "United States", "United Kingdom", "Australia", "Malaysia", "Other"];
const SUBJECTS = ["General", "Math", "Science", "English", "History", "Geography", "Computing"];

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

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

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
                <span className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-black shrink-0 border border-indigo-500/20">{idx + 1}</span>
                <p className="text-[15px] font-bold text-slate-700 dark:text-slate-100 leading-relaxed pt-1">{q.question}</p>
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
                        "group/opt p-4 rounded-2xl border-2 text-xs font-black transition-all text-left relative overflow-hidden",
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 text-white shadow-xl scale-[1.02]"
                          : "border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/50",
                        isCorrect && "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
                        isWrong && "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                      )}
                    >
                      <div className="relative z-10 flex items-center justify-between">
                        <span>{opt}</span>
                        {isCorrect && <span className="text-xl">✓</span>}
                        {isWrong && <span className="text-xl">✕</span>}
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
            className="mt-10 w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all"
          >
            Grade My Progress →
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 p-8 rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 text-center shadow-xl">
            <div className="text-5xl mb-4">{score === totalQuestions ? "🔥" : score > totalQuestions / 2 ? "⭐️" : "💪"}</div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Synced to Teacher</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              Session Result: {score} / {totalQuestions}
            </div>
            <div className="mt-2 h-2 bg-slate-100 dark:bg-white/5 rounded-full max-w-[200px] mx-auto overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${(score / totalQuestions) * 100}%` }} />
            </div>
            <p className="text-xs font-medium text-slate-500 mt-6 max-w-sm mx-auto leading-relaxed">
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

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 bg-white dark:bg-slate-950 shadow-2xl z-[100] border-l border-slate-200 dark:border-white/10 flex flex-col animate-reveal-right">
      <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Resource Lab</h3>
          <p className="text-[10px] text-indigo-500 font-bold">AI Recommended for you</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {recs.length === 0 && <p className="text-center text-xs text-slate-500 py-10">No specific resources found for this topic yet.</p>}
        {recs.map(v => (
          <a key={v.id} href={v.url} target="_blank" rel="noreferrer" className="block group">
            <div className="relative aspect-video rounded-xl overflow-hidden mb-2">
              <Image src={v.thumbnail} alt={v.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-[8px] font-bold text-white rounded">FREE</div>
            </div>
            <h4 className="text-[11px] font-black leading-tight text-slate-800 dark:text-slate-200 group-hover:text-indigo-500">{v.title}</h4>
            <div className="text-[9px] font-medium text-slate-500 mt-1">{v.channel} • {v.views} views</div>
          </a>
        ))}
      </div>
      <div className="p-6 bg-indigo-500/5 mt-auto">
        <p className="text-[10px] leading-tight text-slate-500 italic">"Study these to master {topic || 'your current topic'} faster." — Elora</p>
      </div>
    </div>
  );
};

export default function AssistantPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(true);

  const [session, setSession] = useState(() => getSession());
  const verified = Boolean(session?.verified);
  const teacher = Boolean(isTeacher());

  const canManageChats = verified;

  const [role, setRole] = useState(() => session?.role || "student");
  const [country, setCountry] = useState(() => session?.country || "Singapore");

  const countryLevels = useMemo(() => getCountryLevels(country), [country]);
  const [level, setLevel] = useState(() => session?.level || countryLevels[0] || "Primary 1");

  const [subject, setSubject] = useState(() => session?.subject || "General");
  const [topic, setTopic] = useState(() => session?.topic || "");
  const [constraints, setConstraints] = useState("");
  const [action, setAction] = useState(() => session?.action || "explain");
  const [contextMode, setContextMode] = useState("manual"); // 'manual' or 'auto'
  const [responseStyle, setResponseStyle] = useState("auto"); // 'fast', 'deep', 'auto'
  const [customStyleText, setCustomStyleText] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [vision, setVision] = useState("");
  const [classCode, setClassCode] = useState("");

  const [showResourceDrawer, setShowResourceDrawer] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Auto-configure from URL query (e.g. from Dashboard)
  useEffect(() => {
    if (!router.isReady) return;
    const { action: qAction, topic: qTopic } = router.query;

    if (qAction && typeof qAction === 'string') {
      const known = ROLE_QUICK_ACTIONS.educator.find(x => x.id === qAction) ||
        ROLE_QUICK_ACTIONS.student.find(x => x.id === qAction);
      if (known) {
        setAction(qAction);
      }
    }

    // Always check for overrides from URL or Joined Class
    if (router.query.topic) setTopic(router.query.topic);
    if (router.query.level) setLevel(router.query.level);
    if (router.query.subject) setSubject(router.query.subject);
    if (router.query.country) setCountry(router.query.country);
    if (router.query.vision) setVision(router.query.vision);
    if (router.query.classCode) setClassCode(router.query.classCode);

    // If URL didn't specify, fall back to Joined Class context
    if (session?.joinedClass) {
      if (!router.query.level) setLevel(session.joinedClass.level);
      if (!router.query.country) setCountry(session.joinedClass.country);
      if (!router.query.subject) setSubject(session.joinedClass.subject);
      if (!router.query.vision) setVision(session.joinedClass.vision || "");
      if (!router.query.classCode) setClassCode(session.joinedClass.code || "");
    }


    if (qTopic && typeof qTopic === 'string') {
      setTopic(qTopic);
      setTopicForSuggestions(qTopic);
    }
  }, [router.isReady, router.query]);

  // Threaded chat state
  const [chatUserKey, setChatUserKey] = useState(() => getChatUserKey(getSession()));
  const [activeChatId, setActiveChatIdState] = useState(() =>
    getActiveThreadId(getChatUserKey(getSession()))
  );
  const [threads, setThreads] = useState(() => listThreads(getChatUserKey(getSession())));

  const [messages, setMessages] = useState(() =>
    getThreadMessages(getChatUserKey(getSession()), getActiveThreadId(getChatUserKey(getSession())))
  );

  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const chatMenuRef = useRef(null);

  const activeMeta = useMemo(
    () => getThreadMeta(chatUserKey, activeChatId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatUserKey, activeChatId, threads]
  );

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [lastActionTime, setLastActionTime] = useState(Date.now());

  // Context awareness from URL
  useEffect(() => {
    if (!router.isReady) return;
    const { action, topic, class: className, subject, level } = router.query;

    if (action === 'lesson_plan' && className) {
      const contextPrompt = `Help me plan a ${subject || ''} lesson for Grade ${level || className} on "${topic || 'a new topic'}". Let's start with objectives and a 10-minute hook.`;
      setChatText(contextPrompt);
      // Automatically send if specific action is requested
      if (topic) {
        // We could trigger sendMessage here if we wanted fully hands-free
      }
    } else if (action === 'find_videos' && topic) {
      setChatText(`I need to find high-quality educational videos for my class on the topic: "${topic}".`);
    }
  }, [router.isReady, router.query]);
  const [topicForSuggestions, setTopicForSuggestions] = useState(() => String(session?.topic || ""));
  const starterSaltRef = useRef("ssr");

  // Hydration safety: only set the salt on the client
  useEffect(() => {
    starterSaltRef.current = `${Date.now()}-${Math.random()}`;
    setMounted(true);
  }, []);

  // Debounce topic so suggestions don't "flicker" while the user is typing.
  useEffect(() => {
    const t = setTimeout(() => setTopicForSuggestions(String(topic || "")), 450);
    return () => clearTimeout(t);
  }, [topic]);

  const starterSeed = useMemo(() => {
    // Stable for small UI changes, but changes when:
    // - page reloads (salt)
    // - user switches chat thread (activeChatId)
    // - user changes key settings (role/country/level/subject)
    // - topic changes after debounce
    return [
      "starter-v2",
      starterSaltRef.current,
      chatUserKey,
      activeChatId,
      role,
      country,
      level,
      subject,
      topicForSuggestions,
    ].join("|");
  }, [chatUserKey, activeChatId, role, country, level, subject, topicForSuggestions]);

  const starterPrompts = useMemo(
    () => pickStarterSuggestions({ seed: starterSeed, role, country, level, subject, topic: topicForSuggestions }),
    [starterSeed, role, country, level, subject, topicForSuggestions]
  );

  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);
  const [teacherGateCode, setTeacherGateCode] = useState("");
  const [teacherGateStatus, setTeacherGateStatus] = useState("");

  const listRef = useRef(null);

  const [stickToBottom, setStickToBottom] = useState(true);
  const [showJump, setShowJump] = useState(false);

  const [dismissPreviewNotice, setDismissPreviewNotice] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);

  const fileInputRef = useRef(null);
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachErr, setAttachErr] = useState("");

  const teacherOnlyBlocked = useMemo(() => {
    const teacherOnly = new Set(["lesson", "worksheet", "assessment", "slides"]);
    return teacherOnly.has(action) && !teacher;
  }, [action, teacher]);

  const refinementChips = useMemo(
    () => REFINEMENT_CHIPS[action] || REFINEMENT_CHIPS.explain,
    [action]
  );

  const hasEloraAnswer = useMemo(
    () => messages.some((m) => m?.from === "elora" && String(m?.text || "").trim()),
    [messages]
  );
  const canShowExports = verified && hasEloraAnswer;

  const pinnedThreads = useMemo(
    () => (canManageChats ? threads.filter((t) => t.pinned) : []),
    [threads, canManageChats]
  );
  const recentThreads = useMemo(
    () => (canManageChats ? threads.filter((t) => !t.pinned) : []),
    [threads, canManageChats]
  );

  // Close chat menu on outside click
  useEffect(() => {
    if (typeof window === "undefined") return;

    function onDown(e) {
      if (!chatMenuRef.current) return;
      if (!chatMenuRef.current.contains(e.target)) setChatMenuOpen(false);
    }

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  // Preferences panel open/close persistence
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(PREFS_OPEN_KEY);
      if (stored === "false") setPrefsOpen(false);
    } catch { }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PREFS_OPEN_KEY, prefsOpen ? "true" : "false");
    } catch { }
  }, [prefsOpen]);

  // Preview notice persistence
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
      /*
      await fetch("/api/session/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      */
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

    if (verified) {
      persistSessionPatch({ activeChatId: nextActive, messages: nextMsgs });
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
      setChatUserKey(userKey);

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

    setChatUserKey(nextKey);
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

      const currentSession = getSession();
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
        sentiment, // NEW
        timeSpent, // NEW
        vision, // PHASE 4
        classCode, // PHASE 4
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
        ...messages,
        { from: "elora", text: `⚠️ System Error: ${err.message || "Connection failed"}. This usually happens if the backend server is busy. Please try again in 5 seconds.`, ts: Date.now() },
      ];
      persistActiveMessages(next, { alsoSyncServer: true });
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
    const { id } = createThread(chatUserKey);
    setActiveChatIdState(id);
    setThreads(listThreads(chatUserKey));
    setMessages([]);
    setAttempt(0);
    setAttachedImage(null);
    setAttachErr("");
    setChatMenuOpen(false);
    persistSessionPatch({ activeChatId: id, messages: [] });
  }

  function onTogglePin() {
    if (!canManageChats) {
      setVerifyGateOpen(true);
      return;
    }
    togglePinThread(chatUserKey, activeChatId);
    setThreads(listThreads(chatUserKey));
  }

  function onOpenRename() {
    if (!canManageChats) {
      setVerifyGateOpen(true);
      return;
    }
    setRenameValue(String(activeMeta?.title || "New chat"));
    setRenameOpen(true);
    setChatMenuOpen(false);
  }

  function onDeleteChat(id) {
    if (!canManageChats) {
      setVerifyGateOpen(true);
      return;
    }
    const threadId = String(id || "").trim();
    if (!threadId) return;

    const meta = threads.find((t) => t.id === threadId);
    const label = meta?.title ? `"${meta.title}"` : "this chat";

    if (typeof window !== "undefined") {
      const ok = window.confirm(`Delete ${label}? This cannot be undone.`);
      if (!ok) return;
    }

    deleteThread(chatUserKey, threadId);

    const nextThreads = listThreads(chatUserKey);
    const nextActive = getActiveThreadId(chatUserKey);
    const nextMsgs = getThreadMessages(chatUserKey, nextActive);

    setThreads(nextThreads);
    setActiveChatIdState(nextActive);
    setMessages(nextMsgs);

    setAttempt(0);
    setAttachedImage(null);
    setAttachErr("");

    persistSessionPatch({ activeChatId: nextActive, messages: nextMsgs });
  }

  return (
    <>
      <Head>
        <title>Elora Assistant</title>
        <meta name="theme-color" content="#070b16" />
      </Head>

      <div className="elora-page min-h-screen bg-slate-50/50 dark:bg-slate-950/20 overflow-x-hidden">
        <div className="elora-container pt-4 lg:pt-8 pb-32 lg:pb-12">
          {/* Mobile Header - Compact */}
          <div className="lg:hidden flex items-center justify-between px-6 py-4 mb-4 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-3xl mx-4 sticky top-4 z-40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 grid place-items-center text-white font-black text-xs shrink-0">E</div>
              <div className="min-w-0">
                <h1 className="text-sm font-black text-slate-950 dark:text-white truncate uppercase tracking-widest">{activeMeta?.title || "Assistant"}</h1>
                <div className="text-[9px] font-bold text-indigo-500 uppercase">{contextMode === 'auto' ? 'Smart Auto' : `${country} • ${level}`}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResourceDrawer(true)}
                className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all outline-none shadow-lg shadow-indigo-500/20"
              >
                <span className="text-sm">🧪</span>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Resource Lab</span>
              </button>
              <button
                onClick={() => setPrefsOpen(!prefsOpen)}
                className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl hover:scale-105 active:scale-95 transition-all outline-none"
              >
                <span className="text-lg">⚙️</span>
              </button>
            </div>
          </div>

          <div className={cn("grid gap-8", prefsOpen ? "lg:grid-cols-[400px,1fr]" : "lg:grid-cols-1")}>

            {/* LEFT - Preferences Panel (Dynamic Drawer on Mobile) */}
            <div className={cn(
              "z-[60] fixed lg:sticky top-0 lg:top-[calc(var(--elora-nav-offset)+1rem)] left-0 w-full lg:w-auto h-full lg:h-fit transition-all duration-500 lg:duration-300",
              prefsOpen ? "translate-x-0 opacity-100" : "-translate-x-full lg:hidden opacity-0"
            )}>
              {/* Overlay for mobile tap-to-close */}
              <div
                className="lg:hidden absolute inset-0 bg-slate-950/40 backdrop-blur-sm -z-10"
                onClick={() => setPrefsOpen(false)}
              />

              <div className="w-[85%] sm:w-[400px] lg:w-full h-full lg:h-fit bg-white dark:bg-slate-900 lg:bg-white/70 lg:dark:bg-slate-950/30 border-r lg:border border-slate-200/60 dark:border-white/10 lg:rounded-[2.5rem] shadow-2xl p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-indigo-500">⚙️</span> Settings
                  </h1>
                  <button
                    type="button"
                    onClick={() => setPrefsOpen(false)}
                    className="h-8 w-8 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                    title="Close settings"
                  >
                    ✕
                  </button>
                </div>

                {/* Smart Setup Toggle */}
                <div className="p-1 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                  <div className="flex p-1 gap-1">
                    <button
                      onClick={() => setContextMode("auto")}
                      className={cn("flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", contextMode === "auto" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}
                    >
                      ✨ Smart Auto
                    </button>
                    <button
                      onClick={() => setContextMode("manual")}
                      className={cn("flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", contextMode === "manual" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}
                    >
                      🛠 Manual
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Mode & Response Section */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Response Goal</div>
                    <div className="grid grid-cols-3 gap-2">
                      {["Fast", "Deep", "Auto"].map(m => (
                        <button
                          key={m}
                          onClick={() => setResponseStyle(m.toLowerCase())}
                          className={cn(
                            "py-2 px-1 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                            responseStyle === m.toLowerCase()
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md scale-[1.05] z-10"
                              : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 hover:border-indigo-500/30"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {contextMode === "manual" && (
                    <div className="space-y-6 animate-reveal">
                      {/* Context Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Context</div>
                          <Link href="/settings?focus=role" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">Change Role</Link>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                            <div className="text-[10px] font-bold text-slate-400 mb-1">Role</div>
                            <div className="text-xs font-black text-slate-900 dark:text-white capitalize">{role}</div>
                          </div>
                          <div className="p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                            <select
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              className="w-full h-full bg-transparent border-none px-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-0 outline-none cursor-pointer"
                            >
                              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Level Section */}
                      <div className="space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Education Level</div>
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="w-full h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 px-4 text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer shadow-sm"
                        >
                          {countryLevels.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
                        </select>
                      </div>

                      {/* Subject & Topic */}
                      <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Learning Area</div>
                        <div className="grid gap-3">
                          <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer"
                          >
                            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Current topic (e.g. Fractions)"
                            className="w-full h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {contextMode === "auto" && (
                    <div className="p-8 text-center bg-indigo-500/5 rounded-[2rem] border border-dashed border-indigo-500/20 animate-reveal">
                      <div className="text-2xl mb-2">⚡️</div>
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Smart Engine Active</div>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Elora will automatically adapt to your query context.</p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Plan</div>
                    <div className="grid grid-cols-1 gap-2">
                      {(ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.student).map((a) => {
                        const active = action === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setAction(a.id)}
                            className={cn(
                              "relative group rounded-2xl border p-4 text-left transition-all duration-300",
                              active
                                ? "border-indigo-500/60 bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 scale-[1.02] z-10"
                                : "border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-white/10"
                            )}
                          >
                            <div className="text-sm font-black mb-1">{a.label}</div>
                            <div className={cn("text-[10px] font-medium leading-tight", active ? "text-indigo-100/80" : "text-slate-500")}>
                              {a.hint}
                            </div>
                            {active && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-white/40">✨</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const currentSession = getSession();
                      clearThread(chatUserKey, activeChatId);
                      setMessages([]);
                      setAttempt(0);
                      await persistSessionPatch({ activeChatId, messages: [] });
                      await clearServerChatIfVerified(currentSession);
                      setThreads(listThreads(chatUserKey));
                    }}
                    className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors border border-dashed border-slate-300 dark:border-white/10 hover:border-red-500/50"
                  >
                    Reset Current Conversation
                  </button>

                  {/* Mastery Tracker Mockup */}
                  <div className="p-5 rounded-[2rem] bg-slate-900 border border-white/5 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">📈</div>
                    <div className="relative z-10">
                      <div className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest mb-1 font-[var(--font-brand)]">Live Insights</div>
                      <h4 className="text-xs font-bold text-white mb-4">Topic Mastery</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase mb-1">
                            <span>Accuracy</span>
                            <span className="text-emerald-400">82%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 w-[82%]" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase mb-1">
                            <span>Speed</span>
                            <span className="text-amber-400">65%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 w-[65%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT - Chat Area */}
            <div className="lg:rounded-[3rem] border-y lg:border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 shadow-2xl p-0 lg:p-4 flex flex-col h-[96dvh] lg:h-[calc(100dvh-60px)] w-full max-w-[1600px] mx-auto">
              {/* Desktop Toolbar */}
              <div className="hidden lg:flex items-center justify-between gap-4 px-6 py-4 mb-4 border-b border-slate-200/30 dark:border-white/5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-[var(--font-brand)]">
                    Elora
                    <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-lg font-bold tracking-widest uppercase">Assistant</span>
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {!prefsOpen && (
                    <button
                      type="button"
                      onClick={() => setPrefsOpen(true)}
                      className="h-11 px-5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all"
                    >
                      Settings
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Thread Area */}
              <div className="mt-2 rounded-[2rem] border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 p-3 lg:p-6 flex-1 flex flex-col min-h-0 relative">

                {/* Chat History Header */}
                <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-200 dark:border-white/5 mb-4">
                  {canManageChats ? (
                    <div className="relative shrink min-w-0" ref={chatMenuRef}>
                      <button
                        type="button"
                        onClick={() => setChatMenuOpen((v) => !v)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-800 dark:text-white hover:bg-white dark:hover:bg-white/5 transition-colors border border-transparent min-w-0"
                      >
                        <span className="text-amber-500 shrink-0">{activeMeta?.pinned ? "★" : "☆"}</span>
                        <span className="truncate">{activeMeta?.title || "New chat"}</span>
                        <span className="text-slate-400 shrink-0 text-[10px]">▼</span>
                      </button>

                      {chatMenuOpen && (
                        <div className="absolute z-50 mt-2 w-[320px] max-w-[calc(100vw-4rem)] rounded-3xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 shadow-2xl overflow-hidden backdrop-blur-xl animate-reveal">
                          <div className="p-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Conversations</span>
                            <button onClick={onNewChat} className="text-[10px] font-black text-indigo-500 hover:text-indigo-600">+ NEW</button>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                            {threads.map(t => (
                              <div key={t.id} className={cn("group flex items-center rounded-2xl p-1", t.id === activeChatId ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5")}>
                                <button onClick={() => setActiveThreadAndLoad(t.id)} className="flex-1 text-left px-3 py-2 text-xs font-bold truncate">
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-slate-900 dark:text-white truncate">
                                      {t.title || "New Chat"}
                                    </div>
                                    <div className="text-[9px] font-medium text-slate-500">
                                      {t.messages?.length || 0} messages
                                    </div>
                                  </div>
                                </button>
                                <button onClick={() => onDeleteChat(t.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500">✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Preview Mode
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button onClick={onTogglePin} className="p-2 text-slate-400 hover:text-amber-500 transition-colors">★</button>
                    <button onClick={onOpenRename} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">✎</button>
                    <button onClick={onNewChat} title="New Chat" className="w-8 h-8 rounded-full bg-indigo-500 text-white grid place-items-center shadow-lg shadow-indigo-500/20 hover:scale-110 transition-transform">+</button>
                  </div>
                </div>

                {/* Messages Container */}
                <div
                  ref={listRef}
                  className="flex-1 min-h-[60vh] max-h-[calc(100vh-200px)] overflow-y-auto px-6 space-y-6 scroll-smooth pb-8"
                  onScroll={() => {
                    const el = listRef.current;
                    if (!el) return;
                    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
                    setStickToBottom(atBottom);
                    setShowJump(!atBottom);
                  }}
                >
                  {messages.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 text-3xl grid place-items-center mb-6 animate-float">👋</div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-[var(--font-brand)]">Hello! I'm Elora.</h3>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-xs">
                        I'm your personalized {role} assistant. How can I help you today?
                      </p>
                      <div className="mt-8 grid grid-cols-1 gap-2 w-full max-w-sm">
                        {mounted && starterPrompts.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setChatText(p)}
                            className="text-left p-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all text-xs font-bold"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, idx) => {
                    const isUser = m.from === "user";
                    const isSystem = m.from === "system";

                    // Parse for interactive quiz data
                    let quizData = null;
                    let display = m.text || "";
                    if (!isUser) {
                      const match = display.match(/<quiz_data>([\s\S]*?)<\/quiz_data>/i);
                      if (match) {
                        try {
                          let rawJson = match[1].trim();
                          // Strip markdown wrappers if AI includes them
                          rawJson = rawJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
                          quizData = JSON.parse(rawJson);
                          display = display.replace(match[0], "").trim();
                        } catch (e) {
                          console.error("Quiz parse error", e);
                        }
                      }
                    }

                    display = cleanAssistantText(display);
                    return (
                      <div key={idx} className={cn("flex w-full group animate-reveal mb-8 px-1 sm:px-4", isUser ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "relative p-8 sm:p-10 shadow-2xl transition-all duration-500 w-full max-w-[98%] sm:max-w-[95%]",
                          isUser
                            ? "bg-indigo-600 text-white rounded-[2.5rem] rounded-tr-none shadow-indigo-500/30 origin-right border border-white/10"
                            : "elora-glass dark:elora-glass-dark text-slate-800 dark:text-slate-100 rounded-[2.5rem] rounded-tl-none origin-left"
                        )}>
                          <div className="font-bold flex items-center gap-3 mb-4">
                            <div className={cn("w-3 h-3 rounded-full", isUser ? "bg-indigo-300 shadow-[0_0_8px_white]" : "bg-indigo-500")} />
                            <span className="text-[13px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                              {isUser ? "You" : "Elora"}
                            </span>
                          </div>

                          {/* Improved rendering for structured content (quizzes, lessons) */}
                          <div className={cn(
                            "whitespace-pre-wrap font-medium break-words leading-relaxed text-[14px]",
                            !isUser && "elora-markdown-view"
                          )}>
                            {display ? (display || "").split('\n').map((line, i) => {
                              // Basic markdown-like handling for bolding and lists
                              let content = line;

                              // Check for bold **text**
                              if (content.includes('**')) {
                                const parts = content.split('**');
                                return <p key={i} className="mb-1">{parts.map((p, j) => j % 2 === 1 ? <b key={j} className="text-indigo-600 dark:text-indigo-400 font-black">{p}</b> : p)}</p>;
                              }

                              // Check for list items
                              if (content.trim().startsWith('- ') || content.trim().startsWith('* ') || /^\d+\./.test(content.trim())) {
                                return <div key={i} className="pl-4 mb-2 relative"><span className="absolute left-0 text-indigo-500">•</span> {content.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '')}</div>;
                              }

                              return <p key={i} className={line.trim() ? "mb-2" : "h-2"}>{line}</p>;
                            }) : null}

                            {quizData && (
                              <InteractiveQuiz
                                data={quizData}
                                onComplete={(score, total) => {
                                  // In a real app, this would hit an API to update stats
                                  console.log(`Quiz complete: ${score}/${total}`);
                                }}
                              />
                            )}
                          </div>

                          {!isUser && (
                            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 pt-3">
                              <button
                                onClick={() => copyToClipboard(display, idx)}
                                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-indigo-500 transition-colors"
                              >
                                {copiedIdx === idx ? "✓ Copied" : "Copy"}
                              </button>
                              <div className="flex-1" />
                              <div className="flex gap-1">
                                {refinementChips.slice(0, 3).map(chip => (
                                  <button
                                    key={chip.id}
                                    onClick={() => applyRefinement(chip.id)}
                                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-slate-400 hover:text-indigo-500"
                                  >
                                    {chip.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {loading && (
                    <div className="flex justify-start pr-12 animate-reveal">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 rounded-3xl rounded-tl-none p-5 shadow-sm">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-indigo-500/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 bg-indigo-500/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 bg-indigo-500/60 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {showJump && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                    <button onClick={jumpToLatest} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform flex items-center gap-2">
                      <span>New Message Below</span>
                      <span className="text-lg">↓</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Composer - Floating Island */}
              <div className="mt-auto p-4 lg:p-6 sticky bottom-0 z-30 pointer-events-none">
                <div className="max-w-5xl mx-auto w-full pointer-events-auto">
                  {/* Tiny toolbar above input */}
                  <div className="flex items-center gap-2 px-4 py-2 mb-2 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1 shrink-0">
                      {["pdf", "docx", "pptx"].map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => exportLast(fmt)}
                          className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border transition-all",
                            messages.some(m => m.from === 'elora')
                              ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
                              : "bg-white/50 dark:bg-slate-900/50 text-slate-400 border-transparent opacity-50 backdrop-blur-md"
                          )}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 shrink-0" />
                    {searchMode && <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded-xl border border-emerald-500/20 shrink-0 animation-pulse">🌐 Web Active</span>}
                    <div className="flex-1" />
                    {attachErr && <span className="text-[8px] font-black text-red-500 shrink-0">{attachErr}</span>}
                  </div>

                  <div className="relative group p-1.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] flex items-end gap-2 ring-1 ring-indigo-500/5 focus-within:ring-indigo-500/20 transition-all">
                    <button onClick={() => fileInputRef.current?.click()} className="p-4 text-slate-400 hover:text-indigo-600 transition-colors" title="Attach file">
                      <span className="text-xl">📎</span>
                    </button>

                    <textarea
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder={contextMode === 'auto' ? "Ask Elora anything..." : `Discussing ${topic || subject}...`}
                      rows={1}
                      className="flex-1 bg-transparent border-none px-1 py-4 text-[16px] font-medium focus:ring-0 outline-none resize-none min-h-[44px] max-h-[200px] scrollbar-hide dark:text-white placeholder:text-slate-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendChat();
                        }
                      }}
                    />

                    <button
                      disabled={loading || (!chatText.trim() && !attachedImage)}
                      onClick={sendChat}
                      className="h-12 w-12 flex items-center justify-center rounded-[1.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 disabled:opacity-30 transition-all"
                    >
                      <span className="text-xl">➔</span>
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-4 px-4 opacity-50">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Elora Genesis v1.4</div>
                    <div className="h-1 w-1 rounded-full bg-slate-400" />
                    <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">Shaik Haris Era</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onPickImage(file);
        e.target.value = "";
      }} />

      {/* Modals */}
      <Modal open={renameOpen} title="Rename chat" onClose={() => setRenameOpen(false)}>
        <div className="space-y-4 p-2">
          <p className="text-sm font-medium text-slate-500">Give this conversation a clear name.</p>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="e.g., Algebra Review"
            autoFocus
          />
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                renameThread(chatUserKey, activeChatId, renameValue);
                setThreads(listThreads(chatUserKey));
                setRenameOpen(false);
              }}
              className="flex-1 h-12 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
            >
              Save Changes
            </button>
            <button onClick={() => setRenameOpen(false)} className="h-12 px-6 rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-sm">Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal open={verifyGateOpen} title="Unlock Elora Assistant" onClose={() => setVerifyGateOpen(false)}>
        <div className="space-y-6 text-center py-4">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] grid place-items-center mx-auto text-4xl mb-2">💎</div>
          <div className="space-y-2">
            <h3 className="text-xl font-black">Full Access Required</h3>
            <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">Verified Educator accounts gain access to lesson planning, worksheet generation, and unlimited thread exports.</p>
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <button onClick={() => router.push("/verify")} className="h-12 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">Verify My Email</button>
            <button onClick={() => { storeGuest(true); setSession(getSession()); setVerifyGateOpen(false); }} className="h-10 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Continue as Guest</button>
          </div>
        </div>
      </Modal>

      <Modal open={teacherGateOpen} title="Teacher Verification" onClose={() => setTeacherGateOpen(false)}>
        <div className="space-y-6 p-2">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Advanced educator tools are currently in a closed pilot.</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Invite Code</label>
            <input
              value={teacherGateCode}
              onChange={(e) => setTeacherGateCode(e.target.value)}
              className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="PRO-XXXX-XXXX"
            />
            {teacherGateStatus && <p className="text-[10px] font-bold text-indigo-500 ml-1">{teacherGateStatus}</p>}
          </div>
          <button
            onClick={async () => {
              const ok = await validateAndActivateInvite(teacherGateCode);
              if (ok) setTeacherGateOpen(false);
            }}
            className="w-full h-12 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
          >
            Enable Pro Tools
          </button>
        </div>
      </Modal>
      <AIResourceDrawer
        open={showResourceDrawer}
        onClose={() => setShowResourceDrawer(false)}
        topic={topic}
        subject={subject}
      />
    </>
  );
}
