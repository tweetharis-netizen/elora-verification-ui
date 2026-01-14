import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";
import { isTeacherFromReq } from "@/lib/server/teacher";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function clampStr(v, max = 2000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function isGuestAllowedAction(action) {
  const disallowed = new Set(["assessment", "slides", "lesson", "worksheet"]);
  return !disallowed.has(action);
}

function inferActionFromMessage(message) {
  const s = String(message || "").toLowerCase();
  const signals = [
    "check my answer",
    "is this correct",
    "is it correct",
    "am i right",
    "did i do it right",
    "is my answer correct",
    "is my answer right",
    "correct?",
    "right?",
  ];
  if (signals.some((k) => s.includes(k))) return "check";
  if (s.includes("=") && s.includes("?")) return "check";
  return null;
}

function hasUserProvidedAnswer(message) {
  const s = String(message || "");
  const t = s.toLowerCase();
  return (
    /(^|\s)(i got|my answer|answer is|i think it is|i think it's|i got:|result is)\b/i.test(s) ||
    s.includes("=") ||
    (/(\b\d+(\.\d+)?\b)/.test(s) && /\b(correct|right)\b/i.test(t))
  );
}

function systemPrompt({ role, country, level, subject, topic, action, attemptIndex, responseStyle, userHasAnswer }) {
  const base = `You are Elora: a calm, professional teaching assistant for educators and learners.

Non-negotiable output rules:
- Output must be plain text (no Markdown, no headings, no bold, no code blocks).
- Do NOT output LaTeX/TeX (no \\frac, \\sqrt, \\times, \\( \\), $$, etc.).
- Use human-readable math and words. Example: "5 divided by 4 equals 1.25" and (only if helpful) "5/4".
- Avoid hedge-words like "likely", "maybe", "probably". If you truly need missing info, ask 1 short clarifying question.
- Keep it short, clear, and non-intimidating for beginners.

Personalization context:
Role: ${role}
Country: ${country}
Level: ${level}
Subject: ${subject}
Topic: ${topic || "(not provided)"}
Action: ${action}
Response style: ${responseStyle || "standard"}`;

  if (role === "student" && action === "check") {
    const attemptLine = `Attempt: ${attemptIndex + 1} of 3`;
    const checkRules = `Special rules for "Check my answer" (student):
- First determine whether the student's answer is correct.
- If the student's answer is correct: say "Correct" (or equivalent) then give a short explanation.
- If the student's answer is incorrect:
  - If Attempt is 1 or 2: do NOT give the final numeric answer or the final result. Instead, explain the mistake and give 1–2 hints and the next step they should do.
  - If Attempt is 3: you may give the final correct answer and explain it clearly.
- Do NOT ask "What answer did you get?" if the student already provided their answer (${userHasAnswer ? "they DID provide it" : "they did NOT provide it"}).
- End with one short question that helps the student continue (example: "Want to try again with that hint?").`;

    return `${base}

${attemptLine}

${checkRules}`;
  }

  if (role === "educator") {
    return `${base}

Teacher rules:
- Make outputs classroom-ready and organized.
- Use short sections with clear labels (in plain text, no Markdown).`;
  }

  if (role === "parent") {
    return `${base}

Parent rules:
- Explain without jargon.
- Give practical steps for what to say/do at home.`;
  }

  return `${base}

Student rules:
- Keep steps short and clear.
- Prefer 3–6 bullet-like lines (but still plain text, no Markdown bullets if possible).`;
}

function normalizeMathToPlainText(text) {
  if (!text) return "";
  let t = String(text);

  t = t.replace(/\\times/g, "×");
  t = t.replace(/\\cdot/g, "·");
  t = t.replace(/\\div/g, "÷");

  t = t.replace(/\$\$[\s\S]*?\$\$/g, (m) => m.replace(/\$\$/g, ""));
  t = t.replace(/\$[^$]+\$/g, (m) => m.replace(/\$/g, ""));

  t = t.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, "");

  t = t.replace(/\r/g, "");
  t = t.replace(/[ \t]+\n/g, "\n");
  t = t.replace(/\n{3,}/g, "\n\n");

  return t.trim();
}

function stripMarkdownToPlainText(text) {
  if (!text) return "";
  let t = String(text);

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

  t = t.replace(/\n{3,}/g, "\n\n").trim();

  return t;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY || "";
  if (!openrouterKey) {
    return res.status(500).json({ error: "Server misconfigured (missing OPENROUTER_API_KEY)." });
  }

  try {
    const sessionToken = getSessionTokenFromReq(req);
    const status = await fetchBackendStatus(sessionToken);

    const verified = Boolean(status?.verified);
    const serverRole = String(status?.role || "guest");
    const email = String(status?.email || "");

    const role = clampStr(req.body?.role || "student", 32).toLowerCase();
    const country = clampStr(req.body?.country || "Singapore", 64);
    const level = clampStr(req.body?.level || "Secondary", 64);
    const subject = clampStr(req.body?.subject || "General", 64);
    const topic = clampStr(req.body?.topic || "", 160);

    let action = clampStr(req.body?.action || "explain", 32).toLowerCase();
    const responseStyle = clampStr(req.body?.responseStyle || "standard", 32);

    const message = clampStr(req.body?.message || "", 4000);
    if (!message) return res.status(400).json({ error: "Missing message." });

    if (!action || action === "explain") {
      const inferred = inferActionFromMessage(message);
      if (inferred) action = inferred;
    }

    const teacher = isTeacherFromReq(req);

    if (role === "educator" && !verified) {
      return res.status(403).json({ error: "Please verify your email to use Educator mode." });
    }

    const teacherOnlyActions = new Set(["lesson", "worksheet", "assessment", "slides"]);
    if (teacherOnlyActions.has(action) && !teacher) {
      return res.status(403).json({
        error:
          "Teacher tools are locked. Enter a Teacher Invite Code in Settings to unlock teacher-only tools.",
      });
    }

    if (!verified && !isGuestAllowedAction(action)) {
      return res.status(403).json({
        error: "This action requires verification (and teacher access if applicable).",
      });
    }

    const attemptIndex = clampInt(req.body?.attempt, 0, 2, 0);
    const userHasAnswer = hasUserProvidedAnswer(message);

    const sys = systemPrompt({
      role,
      country,
      level,
      subject,
      topic,
      action,
      attemptIndex,
      responseStyle,
      userHasAnswer,
    });

    const history = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const lastFew = history.slice(-10).map((m) => ({
      role: m?.from === "user" ? "user" : "assistant",
      content: clampStr(m?.text || "", 1800),
    }));

    const payload = {
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        ...lastFew,
        { role: "user", content: message },
      ],
      temperature: 0.25,
      max_tokens: 900,
    };

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost",
        "X-Title": "Elora",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = data?.error?.message || data?.error || "AI request failed.";
      return res.status(500).json({ error: String(msg) });
    }

    const replyRaw = data?.choices?.[0]?.message?.content || "";
    const reply = stripMarkdownToPlainText(normalizeMathToPlainText(replyRaw));

    return res.status(200).json({
      reply,
      meta: {
        verified,
        serverRole,
        email,
        teacher,
        actionUsed: action,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
