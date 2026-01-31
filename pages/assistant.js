import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
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
    { id: "curriculum", label: "Topic Roadmap", hint: "See journey ahead ✨" },
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
      `Draft a ${safeLevel} ${safeSubject} lesson on "${safeTopic}" using I Do / We Do / You Do, including key questions to ask and common misconceptions to watch for.`,
      `Create a 10-minute Do Now + 25-minute main task + 5-minute exit ticket for ${safeLevel} ${safeSubject} on "${safeTopic}", with printable prompts.`,
      `Generate a quick formative check for "${safeTopic}": 6 questions (2 easy, 2 medium, 2 stretch) with answers and what each question diagnoses.`,
      `Write teacher feedback comments for 3 common student errors on "${safeTopic}" (one sentence each) plus a targeted next step for improvement.`,
      `Build a rubric for ${safeSubject} work on "${safeTopic}" (4 bands) with concrete descriptors and a sample "Band 3" exemplar answer.`,
      `Differentiate "${safeTopic}" for 3 groups (support / core / challenge): provide 3 tasks per group and a short teacher script for transitions.`,
      `Make a mini-quiz (8 questions) on "${safeTopic}" aligned to ${safeLevel} ${safeSubject} in ${safeCountry}, with a mark scheme and reteach plan based on results.`,
      `Turn "${safeTopic}" into a worked example set: 1 fully-worked example + 3 gradually harder practice questions + a self-check answer key.`,
    ];
  },
  parent: ({ country, level, subject, topic }) => {
    const safeCountry = country || "our country";
    const safeLevel = level || "my child's level";
    const safeSubject = subject || "schoolwork";
    const safeTopic = topic || "what they're learning this week";

    return [
      `Explain "${safeTopic}" in plain parent-friendly language, then give me a 2-minute "car ride explanation" I can say to my child at ${safeLevel}.`,
      `Give me 3 at-home mini-activities to support ${safeSubject} on "${safeTopic}" (10 minutes each, no printing, uses common household items).`,
      `Write 6 gentle conversation starters about "${safeTopic}" that feel supportive (not like a test) — good for dinner or bedtime chats.`,
      `Create a simple checklist I can use to help with ${safeSubject} homework on "${safeTopic}" without taking over (what to ask, what not to say).`,
      `Draft a calm "frustration reset" script for when homework gets tense, plus 3 options to step back while still keeping progress moving.`,
      `Make a 1-week routine for ${safeLevel} (${safeCountry}) to build confidence in ${safeSubject}: 3 short sessions tied to "${safeTopic}" with specific steps.`,
      `Give me 5 praise phrases that reward effort and strategy during "${safeTopic}" practice (and 3 follow-up questions that encourage thinking).`,
      `Turn "${safeTopic}" into a quick real-life example I can use at home, then give me 3 questions to check understanding in a low-pressure way.`,
    ];
  },
  student: ({ level, subject, topic }) => {
    const safeLevel = level || "my level";
    const safeSubject = subject || "my subject";
    const safeTopic = topic || "a topic I'm stuck on";

    return [
      `Teach me "${safeTopic}" for ${safeSubject} at ${safeLevel} in 4 short steps, then ask me 2 quick check questions (wait for my answers).`,
      `Make me a 20-minute study sprint for "${safeTopic}": warm-up → 2 focused drills → 1 mixed question → quick recap.`,
      `Give me 6 practice questions on "${safeTopic}" at ${safeLevel} and mark them one-by-one after I answer each (no spoilers).`,
      `I'll paste my working for "${safeTopic}". First highlight what I did correctly, then show the first wrong step and how to fix it.`,
      `Help me revise "${safeTopic}" for an exam: 5-bullet summary, 3 "must know" rules, and 3 exam-style questions with a marking guide.`,
      `Create a 7-day spaced revision plan for "${safeTopic}" with tiny daily tasks (5–10 minutes) and a self-test on day 7.`,
      `Explain my mistake: I'll paste a wrong answer about "${safeTopic}" — tell me the misconception and give 2 similar questions to practice.`,
      `Make a "teach-back" script so I can explain "${safeTopic}" to a friend in 60 seconds, then quiz me with 3 short questions.`,
    ];
  },
};

function stableHashToUint32(input) {
  const s = String(input || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let x = state;
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
  let cleanedText = stripInternalTags(text || "");
  cleanedText = cleanedText.replace(/```[\s\S]*?```/g, "");
  cleanedText = cleanedText.replace(/`+/g, "");
  cleanedText = cleanedText.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  cleanedText = cleanedText.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleanedText = cleanedText.replace(/\*([^*]+)\*/g, "$1");
  cleanedText = cleanedText.replace(/__([^_]+)__/g, "$1");
  cleanedText = cleanedText.replace(/_([^_]+)_/g, "$1");
  cleanedText = cleanedText.replace(/^\s*>\s?/gm, "");
  cleanedText = cleanedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  cleanedText = cleanedText.replace(/^\s*([-*_])\1\1+\s*$/gm, "");
  cleanedText = cleanedText.replace(/<quiz_data>[\s\S]*?<\/quiz_data>/gi, "");
  cleanedText = cleanedText.replace(/\n{3,}/g, "\n\n").trim();
  return cleanedText;
}

function inferActionFromMessage(text) {
  const messageText = String(text || "").toLowerCase();
  if (!messageText.trim()) return null;

  if (
    messageText.includes("check my answer") ||
    messageText.includes("is this correct") ||
    messageText.includes("is it correct") ||
    messageText.includes("am i correct") ||
    messageText.includes("did i get it right") ||
    messageText.includes("right or wrong") ||
    messageText.includes("correct or not") ||
    /\bmy answer\b/.test(messageText) ||
    /\banswer\s*:\s*/.test(messageText) ||
    /\b=\s*-?\d/.test(messageText)
  ) {
    return "check";
  }

  if (messageText.includes("lesson plan")) return "lesson";
  if (messageText.includes("worksheet")) return "worksheet";
  if (messageText.includes("assessment") || messageText.includes("test") || messageText.includes("quiz")) return "assessment";
  if (messageText.includes("slides") || messageText.includes("powerpoint")) return "slides";

  return null;
}

function getCountryLevels(country) {
  const countryStr = String(country || "").toLowerCase();

  if (countryStr.includes("singapore")) {
    return [
      "Primary School",
      "Secondary School",
      "Junior College / Pre-U",
      "Polytechnic / ITE",
      "University",
    ];
  }

  if (countryStr.includes("united states") || countryStr === "us" || countryStr.includes("usa")) {
    return [
      "Elementary School",
      "Middle School",
      "High School",
      "College / University",
    ];
  }

  if (countryStr.includes("united kingdom") || countryStr.includes("uk") || countryStr.includes("britain") || countryStr.includes("england")) {
    return [
      "Primary School",
      "Secondary School",
      "Sixth Form / College",
      "University",
    ];
  }

  if (countryStr.includes("australia")) {
    return [
      "Primary School",
      "Secondary School",
      "University / TAFE",
    ];
  }

  if (countryStr.includes("malaysia")) {
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
    let correctCount = 0;
    const submissionDetails = data.questions.map(q => ({
      question: q.question,
      studentAnswer: answers[q.id],
      correctAnswer: q.answer,
      isCorrect: answers[q.id] === q.answer
    }));

    data.questions.forEach(q => {
      if (answers[q.id] === q.answer) correctCount++;
    });

    setScore(correctCount);
    setSubmitted(true);

    const currentSession = getSession();
    const submission = {
      id: `sub_${Date.now()}`,
      studentName: currentSession.email?.split('@')[0] || "Guest Student",
      quizTitle: data.title || "Quick Knowledge Check",
      score: correctCount,
      total: totalQuestions,
      details: submissionDetails,
      timestamp: new Date().toISOString()
    };

    if (!currentSession.classroom) currentSession.classroom = {};
    if (!currentSession.classroom.submissions) currentSession.classroom.submissions = [];
    currentSession.classroom.submissions = [submission, ...currentSession.classroom.submissions];
    saveSession(currentSession);

    if (onComplete) onComplete(correctCount, totalQuestions);
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 p-8 rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 text-center shadow-xl"
          >
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
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (open) {
      setRecommendations(getRecommendations(subject, topic));
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
        {recommendations.length === 0 && <p className="text-center text-xs text-slate-500 py-10">No specific resources found for this topic yet.</p>}
        {recommendations.map(video => (
          <a key={video.id} href={video.url} target="_blank" rel="noreferrer" className="block group">
            <div className="relative aspect-video rounded-xl overflow-hidden mb-2">
              <Image src={video.thumbnail} alt={video.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-[8px] font-bold text-white rounded">FREE</div>
            </div>
            <h4 className="text-[11px] font-black leading-tight text-slate-800 dark:text-slate-200 group-hover:text-indigo-500">{video.title}</h4>
            <div className="text-[9px] font-medium text-slate-500 mt-1">{video.channel} • {video.views} views</div>
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
  const [contextMode, setContextMode] = useState("manual");
  const [responseStyle, setResponseStyle] = useState("auto");
  const [customStyleText, setCustomStyleText] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [vision, setVision] = useState("");
  const [classCode, setClassCode] = useState("");

  const [showResourceDrawer, setShowResourceDrawer] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Auto-configure from URL query (e.g. from Dashboard)
  useEffect(() => {
    if (!router.isReady) return;
    const { action: queryAction, topic: queryTopic } = router.query;

    if (queryAction && typeof queryAction === 'string') {
      const known = ROLE_QUICK_ACTIONS.educator.find(x => x.id === queryAction) ||
        ROLE_QUICK_ACTIONS.student.find(x => x.id === queryAction);
      if (known) {
        setAction(queryAction);
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

    if (queryTopic && typeof queryTopic === 'string') {
      setTopic(queryTopic);
    }
  }, [router.isReady, router.query, session?.joinedClass]);

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
    [chatUserKey, activeChatId, threads]
  );

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [chatText, setChatText] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [lastActionTime, setLastActionTime] = useState(Date.now());

  const [topicForSuggestions, setTopicForSuggestions] = useState(() => String(session?.topic || ""));
  const starterSaltRef = useRef("ssr");

  // Hydration safety: only set salt on client
  useEffect(() => {
    starterSaltRef.current = `${Date.now()}-${Math.random()}`;
    setMounted(true);
  }, []);

  // Debounce topic so suggestions don't "flicker" while user is typing.
  useEffect(() => {
    const timeoutId = setTimeout(() => setTopicForSuggestions(String(topic || "")), 450);
    return () => clearTimeout(timeoutId);
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

    function handleMouseDown(event) {
      if (!chatMenuRef.current) return;
      if (!chatMenuRef.current.contains(event.target)) setChatMenuOpen(false);
    }

    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
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
  }, [country]);

  // Session events
  useEffect(() => {
    function handleSessionEvent() {
      const currentSession = getSession();
      setSession(currentSession);
      setRole(currentSession?.role || "student");
      setCountry(currentSession?.country || "Singapore");

      const allowed = getCountryLevels(currentSession?.country || "Singapore");
      const nextLevel = allowed.includes(currentSession?.level) ? currentSession.level : allowed[0] || "Primary 1";
      setLevel(nextLevel);

      setSubject(currentSession?.subject || "General");
      setTopic(currentSession?.topic || "");
      setAction(currentSession?.action || "explain");
    }

    if (typeof window !== "undefined") {
      window.addEventListener("elora:session", handleSessionEvent);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("elora:session", handleSessionEvent);
      }
    };
  }, []);

  useEffect(() => {
    if (!(role === "student" && action === "check")) {
      setAttempt(0);
    }
  }, [role, action]);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    if (stickToBottom) element.scrollTop = element.scrollHeight;
  }, [messages, loading, stickToBottom]);

  function jumpToLatest() {
    const element = listRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
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
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
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
    let isMounted = true;

    (async () => {
      await refreshVerifiedFromServer();
      if (!isMounted) return;

      const currentSession = getSession();
      setSession(currentSession);
      setRole(currentSession?.role || "student");

      const allowed = getCountryLevels(currentSession?.country || "Singapore");
      setLevel(allowed.includes(currentSession?.level) ? currentSession.level : allowed[0] || "Primary 1");

      const userKey = getChatUserKey(currentSession);
      setChatUserKey(userKey);

      syncThreadsState(userKey);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // When verification/email changes, switch identity (guest chats stay separate from verified)
  useEffect(() => {
    const currentSession = getSession();
    const nextKey = getChatUserKey(currentSession);
    if (nextKey === chatUserKey) return;

    setChatUserKey(nextKey);
    syncThreadsState(nextKey);
    setAttempt(0);
    setAttachedImage(null);
    setAttachErr("");
    setChatMenuOpen(false);
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
  }, [role, country, level, subject, topic, action]);

  // Session Heartbeat for activeMinutes tracking
  useEffect(() => {
    const timer = setInterval(() => {
      const currentSession = getSession();
      if (!currentSession.usage) currentSession.usage = { activeMinutes: 0 };
      currentSession.usage.activeMinutes = (Number(currentSession.usage.activeMinutes) || 0) + 1;
      currentSession.usage.lastActive = new Date().toISOString();
      saveSession(currentSession);
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
      const currentSession = getSession();
      if (!currentSession.usage) currentSession.usage = { messagesSent: 0, subjects: [], streak: 0 };
      currentSession.usage.messagesSent = (Number(currentSession.usage.messagesSent) || 0) + 1;

      // Update subjects explored
      if (subject && !Array.isArray(currentSession.usage.subjects)) currentSession.usage.subjects = [];
      if (subject && !currentSession.usage.subjects.includes(subject)) {
        currentSession.usage.subjects.push(subject);
      }

      // Update session log (limited to last 50 for storage size)
      if (!Array.isArray(currentSession.usage.sessionLog)) currentSession.usage.sessionLog = [];
      const logEntry = { ts: new Date().toISOString(), subject: subject || "General", action: action };
      currentSession.usage.sessionLog = [logEntry, ...currentSession.usage.sessionLog].slice(0, 50);

      // Update last active
      currentSession.usage.lastActive = new Date().toISOString();

      // Update streak
      currentSession.usage.streak = Math.max(Number(currentSession.usage.streak) || 0, 1);

      saveSession(currentSession);
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

      const currentTimeSpent = (Date.now() - lastActionTime) / 1000;
      const sentiment = (attemptNext > 1 || currentTimeSpent > 60) ? "supportive" : "standard";

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
        timeSpent: currentTimeSpent,
        vision,
        classCode,
        message: userText,
        messages: Array.isArray(baseMessages) ? baseMessages : messages,
        teacherRules: currentSession.classroom?.teacherRules || ""
      };

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      const baseMsgs = Array.isArray(baseMessages) ? baseMessages : messages;

      if (!response.ok) {
        const err = data?.error || data?.message || "Request failed.";
        if (String(err).toLowerCase().includes("verify")) setVerifyGateOpen(true);

        const next = [...baseMsgs, { from: "elora", text: `Error: ${String(err)}`, ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: true });
        setLoading(false);
        return;
      }

      const outRaw = data?.reply || data?.text || data?.answer || "";
      if (!outRaw) {
        // Fallback if engine returns empty but OK
        const next = [...baseMsgs, { from: "elora", text: "I'm sorry, I couldn't generate a response. Please try rephrasing.", ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: true });
        setLoading(false);
        return;
      }
      const out = cleanAssistantText(outRaw);
      const next = [...baseMsgs, { from: "elora", text: out, ts: Date.now() }];

      persistActiveMessages(next, { alsoSyncServer: true });

      if (role === "student" && action === "check") {
        setAttempt((currentAttempt) => currentAttempt + 1);
      }

      setAttachedImage(null);
      setAttachErr("");
    } catch (err) {
      console.error("AI Assistant Error:", err);
      const next = [
        ...messages,
        { from: "elora", text: `⚠️ System Error: ${err.message || "Connection failed"}. This usually happens if backend server is busy. Please try again in 5 seconds.`, ts: Date.now() },
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

    setLoading(true);
    setAttachErr("");

    const inferred = inferActionFromMessage(trimmed);
    if (inferred === "check" && action !== "check") {
      setAction("check");
      setAttempt(0);
      await persistSessionPatch({ action: "check" });
    }

    const userMsg = { from: "user", text: trimmed || "(image)", ts: Date.now() };

    // Use functional update to ensure we have absolute latest messages
    setMessages((prevMessages) => {
      const next = [...prevMessages, userMsg];
      persistActiveMessages(next, { alsoSyncServer: true });

      // Delay actual call slightly to ensure state has settled
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

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const contentType = String(response.headers.get("content-type") || "");
      if (!response.ok || contentType.includes("application/json")) {
        let err = `Export failed (HTTP ${response.status}).`;
        let responseData = null;
        try {
          responseData = await response.json();
        } catch { }
        const code = String(responseData?.error || responseData?.message || "").trim();
        if (response.status === 403 || code === "not_verified") {
          setVerifyGateOpen(true);
          err = "Export blocked: verify your email to unlock exports.";
        } else if (code) {
          err = `Export failed: ${code}`;
        }
        const next = [...messages, { from: "elora", text: err, ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: false });
        return;
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        const next = [...messages, { from: "elora", text: "Export failed: empty file returned.", ts: Date.now() }];
        persistActiveMessages(next, { alsoSyncServer: false });
        return;
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = type === "pptx" ? "elora.pptx" : type === "docx" ? "elora.docx" : "elora.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      const next = [...messages, { from: "elora", text: "Export failed due to a network error. Try again.", ts: Date.now() }];
      persistActiveMessages(next, { alsoSyncServer: false });
    }
  }

  async function applyRefinement(chipId) {
    const refinementMap = {
      simpler: "Make it simpler and more beginner-friendly.",
      example: "Add one clear example that matches topic.",
      steps: "Show steps clearly (short).",
      check: "Give one quick check question at the end.",
      diff: "Add differentiation: easier + harder extension.",
      timing: "Add a simple timeline with approximate minutes.",
      resources: "Add a short list of materials/resources.",
      easier: "Make it easier while keeping same topic.",
      harder: "Make it harder and add a challenge question.",
      answers: "Add a teacher answer key after questions.",
      rubric: "Add a short marking guide/rubric.",
      shorter: "Make it shorter and more direct.",
      markscheme: "Include a clear marking scheme.",
      variants: "Add two variants (A/B) with same skills tested.",
      outline: "Tighten slide outline into clear sections.",
      hooks: "Add 1-2 engaging hooks or questions for start.",
      examples: "Add more examples that students can relate to.",
      notes: "Add short teacher notes for each section.",
      "more-steps": "Add more steps and explain reasoning clearly.",
    };

    const refinementText = refinementMap[chipId] || "Improve answer.";

    const userMsg = { from: "user", text: refinementText, ts: Date.now() };
    const nextMessages = [...messages, userMsg];

    persistActiveMessages(nextMessages, { alsoSyncServer: true });
    await callElora({ messageOverride: refinementText, baseMessages: nextMessages });
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
      const activationResult = await activateTeacher(trimmed);
      if (!activationResult?.ok) {
        setTeacherGateStatus("Invalid code.");
        return false;
      }

      await refreshVerifiedFromServer();
      const currentSession = getSession();
      setSession(currentSession);

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
      const processedImage = await compressImageToDataUrl(file);
      setAttachedImage(processedImage);
    } catch (error) {
      const errorCode = String(error?.message || "");
      setAttachErr(
        errorCode === "image_too_large"
          ? "That image is too large to send. Try a closer crop."
          : "Couldn't attach that image. Try again."
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

    const threadMeta = threads.find((t) => t.id === threadId);
    const label = threadMeta?.title ? `"${threadMeta.title}"` : "this chat";

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Delete ${label}? This cannot be undone.`);
      if (!confirmed) return;
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
                      {["Fast", "Deep", "Auto"].map(mode => (
                        <button
                          key={mode}
                          onClick={() => setResponseStyle(mode.toLowerCase())}
                          className={cn(
                            "py-2 px-1 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                            responseStyle === mode.toLowerCase()
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md scale-[1.05] z-10"
                              : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 hover:border-indigo-500/30"
                          )}
                        >
                          {mode}
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
                              {COUNTRIES.map((countryOption) => <option key={countryOption} value={countryOption}>{countryOption}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Education Level</div>
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="w-full h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 px-4 text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer shadow-sm"
                        >
                          {countryLevels.map((levelOption) => <option key={levelOption} value={levelOption}>{levelOption}</option>)}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Learning Area</div>
                        <div className="grid gap-3">
                          <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer"
                          >
                            {SUBJECTS.map((subjectOption) => <option key={subjectOption} value={subjectOption}>{subjectOption}</option>)}
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

                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Plan</div>
                    <div className="grid grid-cols-1 gap-2">
                      {(ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.student).map((actionOption) => {
                        const isActive = action === actionOption.id;
                        return (
                          <button
                            key={actionOption.id}
                            type="button"
                            onClick={() => setAction(actionOption.id)}
                            className={cn(
                              "relative group rounded-2xl border p-4 text-left transition-all duration-300",
                              isActive
                                ? "border-indigo-500/60 bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 scale-[1.02] z-10"
                                : "border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-white/10"
                            )}
                          >
                            <div className="text-sm font-black mb-1">{actionOption.label}</div>
                            <div className={cn("text-[10px] font-medium leading-tight", isActive ? "text-indigo-100/80" : "text-slate-500")}>
                              {actionOption.hint}
                            </div>
                            {isActive && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-white/40">✨</div>}
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
                      onClick={() => setChatMenuOpen((currentValue) => !currentValue)}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-800 dark:text-white hover:bg-white dark:hover:bg-white/5 transition-colors border border-transparent min-w-0"
                    >
                      <span className="text-amber-500 shrink-0">{activeMeta?.pinned ? "★" : "☆"}</span>
                      <span className="truncate">{activeMeta?.title || "New chat"}</span>
                      <span className="text-slate-400 shrink-0 text-[10px]">▼</span>
                    </button>

                    {chatMenuOpen && (
                      <div className="absolute z-50 mt-2 w-[320px] max-w-[calc(100vw-4rem)] rounded-3xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 shadow-2xl overflow-hidden backdrop-blur-xl animate-reveal">
                          <div className="p-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conversations</div>
                            <div className="flex gap-2">
                              <LockedFeatureOverlay isVerified={verified}>
                                <button
                                  type="button"
                                  onClick={onNewChat}
                                  className="h-7 px-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-colors"
                                >
                                  + New
                                </button>
                              </LockedFeatureOverlay>
                              <button
                                type="button"
                                onClick={() => setChatMenuOpen(false)}
                                className="w-7 h-7 rounded-xl border border-slate-200 dark:border-white/5 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Pinned Threads */}
                          {pinnedThreads.length > 0 && (
                            <div className="p-3 border-b border-slate-100 dark:border-white/5">
                              <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-2">Pinned</div>
                              <div className="space-y-2">
                                {pinnedThreads.map((thread) => (
                                  <button
                                    key={thread.id}
                                    type="button"
                                    onClick={() => setActiveThreadAndLoad(thread.id)}
                                    className={cn(
                                      "w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                                      thread.id === activeChatId
                                        ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                                        : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="truncate">{thread.title}</span>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setActiveThreadAndLoad(thread.id);
                                            onOpenRename();
                                          }}
                                          className="w-5 h-5 rounded border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800 text-[8px] hover:text-indigo-500 transition-colors"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setActiveThreadAndLoad(thread.id);
                                            onTogglePin();
                                          }}
                                          className="w-5 h-5 rounded border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800 text-[8px] hover:text-amber-500 transition-colors"
                                        >
                                          {thread.pinned ? "📌" : "📍"}
                                        </button>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="p-3">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Recent</div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {recentThreads.map((thread) => (
                                <button
                                  key={thread.id}
                                  type="button"
                                  onClick={() => setActiveThreadAndLoad(thread.id)}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                                    thread.id === activeChatId
                                      ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                                        : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="truncate">{thread.title}</span>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setActiveThreadAndLoad(thread.id);
                                            onOpenRename();
                                          }}
                                          className="w-5 h-5 rounded border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800 text-[8px] hover:text-indigo-500 transition-colors"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setActiveThreadAndLoad(thread.id);
                                            onTogglePin();
                                          }}
                                          className="w-5 h-5 rounded border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800 text-[8px] hover:text-amber-500 transition-colors"
                                        >
                                          {thread.pinned ? "📌" : "📍"}
                                        </button>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-slate-500 px-3 py-2">
                      <Link href="/verify" className="text-indigo-600 hover:underline">Verify email</Link> to manage conversations
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {canManageChats && (
                      <div className="flex items-center gap-1">
                        <LockedFeatureOverlay isVerified={verified}>
                          <button
                            type="button"
                            onClick={onTogglePin}
                            className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                            title={activeMeta?.pinned ? "Unpin conversation" : "Pin conversation"}
                          >
                            <span className="text-lg">{activeMeta?.pinned ? "📌" : "📍"}</span>
                          </button>
                        </LockedFeatureOverlay>
                      </div>
                    )}
                    <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {messages.filter(m => m?.from !== "system").length} messages
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-2" ref={listRef} onScroll={() => {
                  const element = listRef.current;
                  if (!element) return;
                  const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
                  setStickToBottom(isAtBottom);
                  setShowJump(!isAtBottom && messages.length > 3);
                }}>
                  <div className="space-y-4 pb-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">👋</div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Start a conversation</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                          Ask me anything about your learning journey. I'm here to help with explanations, practice, and guidance.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <div key={msg.ts || idx} className={cn("group animate-reveal", msg.from === "elora" ? "items-start" : "items-end")}>
                          <div className={cn("max-w-[80%] rounded-3xl p-4 shadow-xl relative", 
                            msg.from === "elora" 
                              ? "bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-500/10 dark:to-slate-900 border border-indigo-100 dark:border-indigo-500/20 text-slate-800 dark:text-white" 
                              : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border border-indigo-500 ml-auto"
                          )}>
                            {msg.from === "elora" && (
                              <div className="absolute -top-2 -left-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-black text-white">E</div>
                            )}
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              {msg.from === "elora" && attachedImage && (
                                <div className="mb-3">
                                  <img src={attachedImage.dataUrl} alt="Attached" className="rounded-xl max-w-full" />
                                </div>
                              )}
                              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {msg.text}
                              </div>
                              
                              {/* Quiz Detection and Rendering */}
                              {msg.from === "elora" && msg.text.includes("<quiz_data>") && (
                                <div className="mt-4">
                                  {(() => {
                                    try {
                                      const quizMatch = msg.text.match(/<quiz_data>([\s\S]*?)<\/quiz_data>/);
                                      const quizData = quizMatch ? JSON.parse(quizMatch[1]) : null;
                                      return quizData ? <InteractiveQuiz data={quizData} onComplete={(score, total) => {
                                        const resultMsg = { from: "elora", text: `📊 Quiz completed! Score: ${score}/${total}. Keep up the great work!`, ts: Date.now() };
                                        setMessages((prevMessages) => [...prevMessages, resultMsg]);
                                      }} /> : null;
                                    } catch {
                                      return null;
                                    }
                                  })()}
                                </div>
                              )}

                              {msg.from === "elora" && (
                                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-200/20 dark:border-white/5">
                                  <div className="flex items-center gap-2">
                                    <LockedFeatureOverlay isVerified={verified}>
                                      <button
                                        type="button"
                                        onClick={() => exportLast("pdf")}
                                        className="text-[8px] px-2 py-1 bg-white/20 dark:bg-white/5 rounded-lg hover:bg-white/30 transition-colors"
                                      >
                                        PDF
                                      </button>
                                    </LockedFeatureOverlay>
                                    <LockedFeatureOverlay isVerified={verified}>
                                      <button
                                        type="button"
                                        onClick={() => exportLast("docx")}
                                        className="text-[8px] px-2 py-1 bg-white/20 dark:bg-white/5 rounded-lg hover:bg-white/30 transition-colors"
                                      >
                                        DOCX
                                      </button>
                                    </LockedFeatureOverlay>
                                    <LockedFeatureOverlay isVerified={verified}>
                                      <button
                                        type="button"
                                        onClick={() => exportLast("pptx")}
                                        className="text-[8px] px-2 py-1 bg-white/20 dark:bg-white/5 rounded-lg hover:bg-white/30 transition-colors"
                                      >
                                        PPTX
                                      </button>
                                    </LockedFeatureOverlay>
                                  </div>
                                </div>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(msg.text, idx)}
                                    className={cn(
                                      "text-[8px] px-2 py-1 bg-white/20 dark:bg-white/5 rounded-lg transition-all",
                                      copiedIdx === idx ? "bg-emerald-500 text-white" : "hover:bg-white/30"
                                    )}
                                  >
                                    {copiedIdx === idx ? "✓ Copied" : "📋 Copy"}
                                  </button>
                                </div>
                              )}
                            </div>

                            {msg.from === "user" && (
                              <div className="text-[8px] opacity-60 text-right mt-1">
                                {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    )}

                    {loading && (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="ml-2">Elora is thinking...</span>
                      </div>
                    )}
                  </div>

                  {/* Jump to Latest Button */}
                  {showJump && (
                    <button
                      type="button"
                      onClick={jumpToLatest}
                      className="fixed bottom-24 right-8 p-3 bg-indigo-600 text-white rounded-full shadow-xl hover:scale-110 transition-all z-30"
                    >
                      ↓
                    </button>
                  )}
                </div>

                {/* Refinement Chips */}
                {hasEloraAnswer && !loading && (
                  <div className="mt-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">Refine Response</div>
                    <div className="flex flex-wrap gap-2">
                      {refinementChips.map((chip) => (
                        <LockedFeatureOverlay key={chip.id} isVerified={verified}>
                          <button
                            type="button"
                            onClick={() => applyRefinement(chip.id)}
                            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all"
                          >
                            {chip.label}
                          </button>
                        </LockedFeatureOverlay>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Input */}
                <div className="mt-4 space-y-3">
                  {attachErr && (
                    <div className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800">
                      {attachErr}
                    </div>
                  )}

                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          value={chatText}
                          onChange={(e) => setChatText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendChat();
                            }
                          }}
                          placeholder={teacherOnlyBlocked ? "This action requires teacher verification" : "Ask me anything..."}
                          disabled={teacherOnlyBlocked}
                          className={cn(
                            "w-full h-12 resize-none rounded-2xl border-2 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium placeholder:text-slate-400 focus:outline-none transition-all",
                            teacherOnlyBlocked
                              ? "border-rose-200 dark:border-rose-800 text-slate-400 cursor-not-allowed"
                              : "border-slate-200 dark:border-white/5 text-slate-900 dark:text-white focus:border-indigo-500/50"
                          )}
                          rows={1}
                        />
                        {chatText.length > 0 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">
                            {chatText.length}
                          </div>
                        )}
                      </div>

                      <LockedFeatureOverlay isVerified={verified}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-12 px-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center justify-center"
                          title="Attach image"
                        >
                          📎
                        </button>
                      </LockedFeatureOverlay>

                      <LockedFeatureOverlay isVerified={verified}>
                        <button
                          type="button"
                          onClick={sendChat}
                          disabled={!chatText.trim() && !attachedImage || loading || teacherOnlyBlocked}
                          className={cn(
                            "h-12 px-6 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
                            loading || teacherOnlyBlocked
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-500/20"
                          )}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending...
                            </div>
                          ) : (
                            "Send"
                          )}
                        </button>
                      </LockedFeatureOverlay>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onPickImage(file);
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Preview Notice */}
                  {!verified && !dismissPreviewNotice && (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm rounded-2xl" />
                      <div className="relative p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">🚀</div>
                          <div className="flex-1">
                            <div className="text-sm font-black text-amber-800 dark:text-amber-200 mb-1">Preview Mode</div>
                            <p className="text-xs text-amber-600 dark:text-amber-300 leading-relaxed">
                              You're using Elora in preview mode. <Link href="/verify" className="underline font-bold">Verify your email</Link> to unlock full features including exports, conversation management, and more.
                            </p>
                          </div>
                          <button
                            onClick={dismissPreview}
                            className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-700 transition-colors flex items-center justify-center text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Resource Drawer */}
          <AIResourceDrawer 
            open={showResourceDrawer} 
            onClose={() => setShowResourceDrawer(false)} 
            topic={topic} 
            subject={subject} 
          />

          {/* Verification Gate Modal */}
          <Modal open={verifyGateOpen} onClose={() => setVerifyGateOpen(false)}>
            <div className="text-center p-8 max-w-sm">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Verify Your Email</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                This feature requires email verification. It's quick and unlocks all of Elora's capabilities.
              </p>
              <div className="space-y-3">
                <Link
                    href="/verify"
                    className="block w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                >
                  Verify Email →
                </Link>
                <button
                  type="button"
                  onClick={() => setVerifyGateOpen(false)}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </Modal>

          {/* Teacher Gate Modal */}
          <Modal open={teacherGateOpen} onClose={() => setTeacherGateOpen(false)}>
            <div className="text-center p-8 max-w-sm">
              <div className="text-4xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Teacher Access Required</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                This feature is designed for educators. Enter your teacher invite code or verify your educator account.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={teacherGateCode}
                  onChange={(e) => setTeacherGateCode(e.target.value)}
                  placeholder="Enter teacher code"
                  className="w-full h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
                {teacherGateStatus && (
                  <div className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800">
                    {teacherGateStatus}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateAndActivateInvite(teacherGateCode)) {
                        setTeacherGateOpen(false);
                        setTeacherGateCode("");
                        setTeacherGateStatus("");
                      }
                    }}
                    className="py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherGateOpen(false)}
                    className="py-3 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Modal>

          {/* Rename Modal */}
          <Modal open={renameOpen} onClose={() => setRenameOpen(false)}>
            <div className="text-center p-8 max-w-sm">
              <div className="text-4xl mb-4">✏️</div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Rename Conversation</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Conversation title"
                  className="w-full h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-4 text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      renameThread(chatUserKey, activeChatId, renameValue);
                      setThreads(listThreads(chatUserKey));
                      setRenameOpen(false);
                      setRenameValue("");
                    }}
                    className="py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenameOpen(false)}
                    className="py-3 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
}
