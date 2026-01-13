import crypto from "crypto";
import { getBackendBaseUrl, getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";
import { isTeacherFromReq } from "@/lib/server/teacher";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_CHECK_ATTEMPTS = 3;
const CHECK_ATTEMPTS_TTL_SECONDS = 6 * 60 * 60; // backend also enforces its own TTL; this is informational

function clampStr(v, max = 1200) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(String(input || "")).digest("hex");
}

function isGuestAllowedAction(action) {
  const disallowed = new Set(["assessment", "slides", "lesson", "worksheet"]);
  return !disallowed.has(action);
}

function systemPrompt({ role, country, level, subject, topic, attempt, responseStyle }) {
  return `You are Elora: a calm, professional teaching assistant for educators and learners.

Hard rules (important):
- Use plain, human-readable math. Example: "5 divided by 4 = 1.25" and (if helpful) "5/4".
- Do NOT output LaTeX/TeX (no \\frac, \\sqrt, \\times, \\( \\), $$, etc.).
- Do NOT use Markdown formatting (no headings starting with #, no **bold**, no code fences).
- Keep tone warm, non-intimidating, and clear for beginners.
- Avoid hedge words like "likely", "probably", "maybe" unless you truly lack information; if missing info, ask for it directly.
- Do not include decorative separators, stylized formatting, or hashtags.

Context:
Role: ${role}
Country: ${country}
Level: ${level}
Subject: ${subject}
Topic: ${topic}
Attempt: ${attempt}
Response style: ${responseStyle || "standard"}

Return plain text (no Markdown markers like #, **, backticks).
If you need structure, use short paragraphs, numbered steps like "1) ...", and simple bullet points using "-".`;
}

function checkModeSystemPrompt({ country, level, subject, attemptUsed, attemptsLeft, revealAllowed }) {
  return `You are Elora: a calm, professional teaching assistant.

Task: "Check my answer" for a STUDENT.

Hard rules (must follow):
- First, decide if the student's answer is correct or incorrect.
- If correct: say it is correct, then explain briefly how/why in plain language.
- If incorrect and revealAllowed is false: DO NOT reveal the final answer. Give a clear explanation of the mistake and 1-2 hints, then ask the student to try again.
- If incorrect and revealAllowed is true: you may reveal the final answer and show the full working clearly.
- Use plain, human-readable math. No LaTeX/TeX. No Markdown.
- Avoid hedge words like "likely", "probably", "maybe" unless the question is genuinely missing information.

Return ONLY valid JSON (no extra text) with this shape:
{
  "verdict": "correct" | "incorrect" | "need_info",
  "reply": "string",
  "final_answer": "string"
}

Constraints:
- If revealAllowed is false, final_answer must be an empty string.
- reply must not contain the final numeric answer when revealAllowed is false.

Context:
Country: ${country}
Level: ${level}
Subject: ${subject}
attemptUsed: ${attemptUsed}
attemptsLeft: ${attemptsLeft}
revealAllowed: ${revealAllowed ? "true" : "false"}`;
}

function userPrompt({ role, action, topic, message, options, attempt, customStyle }) {
  return `Action: ${action}
Role: ${role}
Topic: ${topic}
Attempt: ${attempt}

User message:
${message}

Constraints/options:
${options}

Extra request (optional):
${customStyle || ""}`;
}

function checkModeUserPrompt({ questionText, studentAnswerText }) {
  return `Question/problem (as stated by the student):
${questionText}

Student's proposed answer:
${studentAnswerText}

Now evaluate correctness and respond following the JSON rules.`;
}

function normalizeMathToPlainText(text) {
  if (!text) return "";
  let t = String(text);

  // Remove common TeX wrappers.
  t = t
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\$\$/g, "")
    .replace(/\$/g, "");

  // Fractions: \frac{a}{b}, \tfrac{a}{b}, \dfrac{a}{b} => a/b
  t = t.replace(/\\(?:dfrac|tfrac|frac)\{([^{}\n]+)\}\{([^{}\n]+)\}/g, (_m, a, b) => `${a}/${b}`);

  // Multiply: \times or \cdot => ×
  t = t.replace(/\\times/g, "×").replace(/\\cdot/g, "×");

  // \sqrt{a} => sqrt(a)
  t = t.replace(/\\sqrt\{([^{}\n]+)\}/g, (_m, a) => `sqrt(${a})`);

  // Remove stray backslashes left from TeX commands
  t = t.replace(/\\[a-zA-Z]+/g, "");

  // Clean up double spaces
  t = t.replace(/[ \t]{2,}/g, " ");

  // \left / \right add noise for beginners.
  t = t.replace(/\\left/g, "").replace(/\\right/g, "");

  return t;
}

function stripMarkdownToPlainText(text) {
  if (!text) return "";
  let t = String(text);

  // Remove fenced code blocks completely (they often come with Markdown noise).
  t = t.replace(/```[\s\S]*?```/g, "");

  // Remove inline code backticks
  t = t.replace(/`+/g, "");

  // Remove Markdown headings like "### Title"
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, "");

  // Remove bold/italic markers
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");
  t = t.replace(/_([^_]+)_/g, "$1");

  // Remove blockquote marker
  t = t.replace(/^\s*>\s?/gm, "");

  // Convert Markdown links [text](url) => text
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

  // Trim extra blank lines
  t = t.replace(/\n{3,}/g, "\n\n").trim();

  return t;
}

function extractExplicitAnswer(text) {
  const s = String(text || "").trim();

  const m1 = s.match(/(?:=|equals|equal to)\s*([-+]?\d+(?:\.\d+)?)(?!\S)/i);
  if (m1?.[1]) return { answer: m1[1], mode: "equals" };

  const m2 = s.match(/\b(?:answer\s*(?:is|=)|i\s*got|my\s*answer\s*(?:is|=|:))\s*([-+]?\d+(?:\.\d+)?)/i);
  if (m2?.[1]) return { answer: m2[1], mode: "stated" };

  return { answer: "", mode: "" };
}

function deriveProblemText(text) {
  const s = String(text || "").trim();

  const eq = s.match(/^(.+?)(?:=|equals|equal to)\s*[-+]?\d+(?:\.\d+)?\s*$/i);
  if (eq?.[1]) return eq[1].trim();

  return s;
}

function looksLikeMathQuestion(text) {
  const s = String(text || "").toLowerCase();
  if (!s) return false;

  const hasDigit = /\d/.test(s);
  const hasOp = /[+\-*/×÷]/.test(s);
  const hasMathWords = /(plus|minus|times|multiply|multiplied|divide|divided|sum|difference|product|quotient|fraction|percent|percentage|ratio)/.test(s);

  return hasDigit && (hasOp || hasMathWords);
}

function safeJsonFromModel(text) {
  const raw = String(text || "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = raw.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callBackendAttempts({ sessionToken, op, keyHash }) {
  if (!sessionToken) return null;

  const backend = getBackendBaseUrl();

  try {
    const r = await fetch(`${backend}/api/chat/attempts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "attempts",
        op,
        key: keyHash,
        maxAttempts: MAX_CHECK_ATTEMPTS,
        ttlSeconds: CHECK_ATTEMPTS_TTL_SECONDS,
      }),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.ok) return null;
    return data;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });

  try {
    const body = req.body || {};
    const role = clampStr(body.role || "student", 20);
    const country = clampStr(body.country || "Singapore", 40);
    const level = clampStr(body.level || "Secondary", 60);
    const subject = clampStr(body.subject || "General", 60);
    const topic = clampStr(body.topic || "General", 120);
    const action = clampStr(body.action || "explain", 40);
    const message = clampStr(body.message || "", 4000);
    const options = clampStr(body.options || "", 1400);

    const responseStyle = clampStr(body.responseStyle || body.style || "", 60);
    const customStyle = clampStr(body.customStyle || "", 700);

    const guest = Boolean(body.guest);
    const attemptFromClient = Number.isFinite(body.attempt) ? Number(body.attempt) : 0;

    if (!message) return res.status(400).json({ error: "Missing message." });

    if (guest && !isGuestAllowedAction(action)) {
      return res.status(403).json({
        error: "Guest mode is limited. Please verify to unlock assessments and slides.",
      });
    }

    // Ask backend about verification/session (cookie-backed truth)
    const sessionToken = getSessionTokenFromReq(req);
    const status = await fetchBackendStatus(sessionToken);

    const verified = Boolean(status?.verified);
    const teacher = isTeacherFromReq(req);

    // Educator mode is only available after verification.
    if (role === "educator" && !verified) {
      return res.status(403).json({ error: "Please verify your email to use Educator mode." });
    }

    // Teacher tools are locked behind a signed httpOnly teacher cookie.
    const teacherOnlyActions = new Set(["lesson", "worksheet", "assessment", "slides"]);
    if (teacherOnlyActions.has(action) && !teacher) {
      return res.status(403).json({
        error: "Teacher tools are locked. Enter a Teacher Invite Code in Settings to activate Educator tools.",
      });
    }

    // STUDENT "Check my answer" gate: do not reveal final answer until attempts are used.
    if (role === "student" && action === "check") {
      const { answer } = extractExplicitAnswer(message);

      if (!answer) {
        const attemptUsed = Math.max(0, Math.min(MAX_CHECK_ATTEMPTS, Math.floor(attemptFromClient) || 0));
        return res.status(200).json({
          reply:
            "I can check it — what answer did you get?\n\nReply in this format:\n- Your working (optional)\n- Your final answer (example: “10 + 5 = 14”)\n\nI’ll tell you if it’s correct and help you fix it if not.",
          attempt: attemptUsed,
        });
      }

      if (!looksLikeMathQuestion(message)) {
        const attemptUsed = Math.max(0, Math.min(MAX_CHECK_ATTEMPTS, Math.floor(attemptFromClient) || 0));
        return res.status(200).json({
          reply:
            "I can check it, but I need the full question.\n\nPlease send:\n1) The question\n2) Your answer\n\nExample: “What is 10 + 5? My answer is 14.”",
          attempt: attemptUsed,
        });
      }

      const problemText = deriveProblemText(message);
      const keyHash = sha256Hex(`check:v1:${subject}:${problemText}`);

      let attemptUsed = Math.max(0, Math.min(MAX_CHECK_ATTEMPTS, Math.floor(attemptFromClient) || 0));

      // Prefer server-tracked attempts when verified (prevents refresh bypass).
      if (verified && sessionToken) {
        const used = await callBackendAttempts({ sessionToken, op: "use", keyHash });
        if (typeof used?.count === "number") attemptUsed = Math.max(0, Math.min(MAX_CHECK_ATTEMPTS, used.count));
      } else {
        // Preview fallback: client-tracked only (not secure)
        attemptUsed = Math.max(0, Math.min(MAX_CHECK_ATTEMPTS, attemptUsed + 1));
      }

      const attemptsLeft = Math.max(0, MAX_CHECK_ATTEMPTS - attemptUsed);
      const revealAllowed = attemptUsed >= MAX_CHECK_ATTEMPTS;

      const sys = checkModeSystemPrompt({
        country,
        level,
        subject,
        attemptUsed,
        attemptsLeft,
        revealAllowed,
      });

      const user = checkModeUserPrompt({
        questionText: problemText,
        studentAnswerText: message,
      });

      const resp = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_REFERER || process.env.NEXT_PUBLIC_SITE_URL || "",
          "X-Title": "Elora Verification UI",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
          temperature: 0.2,
          max_tokens: 700,
        }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        const msg = data?.error?.message || data?.error || "AI request failed.";
        return res.status(500).json({ error: msg });
      }

      const raw = data?.choices?.[0]?.message?.content || "";
      const parsed = safeJsonFromModel(raw);

      let reply = "";
      if (parsed && typeof parsed === "object") {
        const verdict = String(parsed.verdict || "").toLowerCase();
        const modelReply = stripMarkdownToPlainText(normalizeMathToPlainText(parsed.reply || ""));
        const finalAnswer = stripMarkdownToPlainText(normalizeMathToPlainText(parsed.final_answer || ""));

        if (verdict === "correct") {
          reply = `✅ Correct.\n\n${modelReply || "Nice work — your method checks out."}`;
        } else if (verdict === "incorrect") {
          if (!revealAllowed) {
            reply =
              `❌ Not quite.\n\n${modelReply || "Let’s fix the mistake step by step."}\n\nTry again with your corrected final answer.`;
          } else {
            reply =
              `❌ Not quite.\n\n${modelReply || ""}\n\nFull answer:\n${finalAnswer || "Here is the correct final answer and working."}`;
          }
        } else {
          reply =
            modelReply ||
            "I’m missing part of the question. Please send the full question and your answer so I can check it.";
        }

        if (!revealAllowed) {
          reply = reply.replace(/^\s*(final\s+answer|answer)\s*:\s*.*$/gim, "").trim();
        }
      } else {
        const cleaned = stripMarkdownToPlainText(normalizeMathToPlainText(raw));
        reply = cleaned;
        if (!revealAllowed) {
          reply = reply.replace(/^\s*(final\s+answer|answer)\s*:\s*.*$/gim, "").trim();
        }
      }

      return res.status(200).json({ reply, attempt: attemptUsed });
    }

    // Default mode (all other actions)
    const sys = systemPrompt({ role, country, level, subject, topic, attempt: attemptFromClient, responseStyle });
    const user = userPrompt({ role, action, topic, message, options, attempt: attemptFromClient, customStyle });

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_REFERER || process.env.NEXT_PUBLIC_SITE_URL || "",
        "X-Title": "Elora Verification UI",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.4,
        max_tokens: 900,
      }),
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = data?.error?.message || data?.error || "AI request failed.";
      return res.status(500).json({ error: msg });
    }

    const replyRaw = data?.choices?.[0]?.message?.content || "";
    const reply = stripMarkdownToPlainText(normalizeMathToPlainText(replyRaw));

    return res.status(200).json({ reply });
  } catch {
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
