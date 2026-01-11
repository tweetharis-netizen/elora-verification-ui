import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";
import { isTeacherFromReq } from "@/lib/server/teacher";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function clampStr(v, max = 1200) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function clampInt(v, min = 0, max = 10) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function isGuestAllowedAction(action) {
  const disallowed = new Set(["assessment", "slides", "lesson", "worksheet"]);
  return !disallowed.has(action);
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

function deHedge(text) {
  if (!text) return "";
  let t = String(text);

  // Remove weak/uncertain filler words that make Elora sound unsure.
  // (We prefer asking a clarifying question instead.)
  t = t.replace(/\b(likely|probably|maybe)\b/gi, "");

  // Reduce "I think" style hedging without changing meaning too much.
  t = t.replace(/\bI think\b/gi, "I");

  // Clean spacing after removals.
  t = t.replace(/[ \t]{2,}/g, " ");
  t = t.replace(/\s+([,.;:!?])/g, "$1");
  t = t.replace(/\n{3,}/g, "\n\n").trim();

  return t;
}

function wantsRevealFromMessage(message) {
  const m = String(message || "").trim().toLowerCase();
  if (!m) return false;

  // Keep this broad but safe: only for student attempt>=3 behavior.
  return (
    /\b(yes|yep|yeah|reveal|show|give)\b/.test(m) &&
    /\b(answer|solution|full|everything|it)\b/.test(m)
  ) || /\b(final answer|full solution|reveal it|show me the answer|give me the answer)\b/.test(m);
}

function coerceHistoryMessages(rawMessages, latestUserText) {
  if (!Array.isArray(rawMessages)) return [];

  const latest = String(latestUserText || "").trim();
  const sliced = rawMessages.slice(-12); // small, stable context window

  const out = [];
  for (const item of sliced) {
    const from = item?.from === "user" ? "user" : item?.from === "elora" ? "assistant" : null;
    if (!from) continue;

    let content = clampStr(String(item?.text || ""), 900);
    content = stripMarkdownToPlainText(normalizeMathToPlainText(content));
    content = content.trim();
    if (!content) continue;

    // Avoid duplicating the newest user message (we add it in the final user prompt)
    if (from === "user" && latest && content.trim() === latest) continue;

    out.push({ role: from, content });
  }

  return out;
}

function systemPrompt({ role, country, level, subject, topic, attempt, responseStyle }) {
  const studentRules =
    role === "student"
      ? `
Student attempt rules (STRICT):
- Attempts 1–2 (Attempt value 0 or 1): Do NOT reveal the final answer. Give a hint + the next step only. Ask for the student's attempt/work.
- Attempt 3 (Attempt value 2): Still do NOT reveal the final answer. Ask: "Do you want the full solution + final answer now? Reply: 'Yes, reveal it.'"
- After attempt 3 (Attempt value 3+): Only reveal the full solution + final answer IF the user explicitly asks to reveal it (e.g. "Yes, reveal it", "show the full solution", "give me the answer"). Otherwise, ask the permission question again.
- If the student asks for the answer early (attempt 0–2), refuse politely and ask for their attempt first.`
      : "";

  return `You are Elora: a calm, professional teaching assistant for educators, students, and parents.

Hard rules (important):
- Be accurate. If you are missing a key detail or the question is ambiguous, ask ONE short clarifying question and stop.
- Do NOT guess. Do NOT invent facts.
- NEVER use uncertainty filler words like "likely", "probably", or "maybe". Either be confident, or ask a clarifying question.
- Use plain, human-readable math. Example: "5 divided by 4 = 1.25" and (if helpful) "5/4".
- Do NOT output LaTeX/TeX (no \\frac, \\sqrt, \\times, \\( \\), $$, etc.).
- Do NOT use Markdown formatting (no headings starting with #, no **bold**, no code fences).
- Keep tone warm, non-intimidating, and clear for beginners.

Output format:
- Start with 1 short sentence restating what the user asked.
- Then give short steps using: "1) ...", "2) ...".
- End with either a quick check question OR a single "Next step:" line.

Context:
Role: ${role}
Country: ${country}
Level: ${level}
Subject: ${subject}
Topic: ${topic}
Attempt: ${attempt}
Response style: ${responseStyle || "standard"}
${studentRules}

Return plain text only.`;
}

function userPrompt({ role, action, topic, message, options, attempt, customStyle, wantsReveal }) {
  return `Action: ${action}
Role: ${role}
Topic: ${topic}
Attempt: ${attempt}
Reveal intent: ${wantsReveal ? "YES" : "NO"}

User message:
${message}

Constraints/options:
${options}

Extra request (optional):
${customStyle || ""}`;
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
    const level = clampStr(body.level || "Secondary", 40);
    const subject = clampStr(body.subject || "General", 60);
    const topic = clampStr(body.topic || "General", 80);
    const action = clampStr(body.action || "explain", 40);

    const message = clampStr(body.message || "", 3000);
    const options = clampStr(body.options || "", 1400);

    const responseStyle = clampStr(body.responseStyle || body.style || "", 60);
    const customStyle = clampStr(body.customStyle || "", 600);

    const guest = Boolean(body.guest);
    const attempt = clampInt(body.attempt, 0, 6);

    if (!message) return res.status(400).json({ error: "Missing message." });

    if (guest && !isGuestAllowedAction(action)) {
      return res.status(403).json({
        error: "Guest mode is limited. Please verify to unlock assessments and slides.",
      });
    }

    // Ask backend about verification/session
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

    const wantsReveal = wantsRevealFromMessage(message);
    const history = coerceHistoryMessages(body.messages, message);

    const sys = systemPrompt({ role, country, level, subject, topic, attempt, responseStyle });
    const user = userPrompt({ role, action, topic, message, options, attempt, customStyle, wantsReveal });

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
        messages: [{ role: "system", content: sys }, ...history, { role: "user", content: user }],
        temperature: 0.25, // lower = fewer hallucinations
        max_tokens: 900,
      }),
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = data?.error?.message || data?.error || "AI request failed.";
      return res.status(500).json({ error: msg });
    }

    const replyRaw = data?.choices?.[0]?.message?.content || "";
    let reply = stripMarkdownToPlainText(normalizeMathToPlainText(replyRaw));
    reply = deHedge(reply);

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
