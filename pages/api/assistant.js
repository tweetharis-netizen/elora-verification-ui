// pages/api/assistant.js
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";

function clampStr(v, max = 4000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function normRole(r) {
  const x = String(r || "").toLowerCase();
  if (["educator", "student", "parent"].includes(x)) return x;
  return "student";
}

function normAction(a) {
  const x = String(a || "").toLowerCase();
  return x || "explain";
}

function parseInviteCodes() {
  return String(process.env.TEACHER_INVITE_CODES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isTeacherInviteValid(code) {
  const codes = parseInviteCodes();
  if (!codes.length) return true;
  return codes.includes(String(code || "").trim());
}

function isGuestAllowedAction(action) {
  // Preserve your current gating intent
  const disallowed = new Set(["assessment", "slides"]);
  return !disallowed.has(action);
}

function systemPrompt({ role, country, level, subject, topic, attempt }) {
  return `You are Elora, a premium education assistant.

You must be clear for beginners and adapt to the user's level.

Hard rules:
- Do NOT output LaTeX/TeX (no \\frac, \\sqrt, \\times, \\( \\), $$, etc.).
- Write math in plain text a beginner can read (examples: 5/4, 1 1/4, sqrt(2), x^2, 3 × 4).
- Keep answers structured and calm. Prefer short paragraphs and bullet points.
- Avoid jargon unless the user asks.

Tutor behavior (especially for students):
- Ask a quick checking question if needed.
- Give small hints first, then steps, then a final worked example.
- If Attempt is 1: hint-heavy.
- If Attempt is 2: more guidance.
- If Attempt is 3: show full method + a similar practice question.

Context:
Role: ${role}
Country: ${country}
Level: ${level}
Subject: ${subject}
Topic: ${topic}
Attempt: ${attempt}

Return clean, structured output in Markdown.`;
}

function userPrompt({ role, action, topic, message, options, attempt }) {
  return `Action: ${action}
Role: ${role}
Topic: ${topic}
Attempt: ${attempt}

User message:
${message}

Constraints/options:
${options}`;
}

// Final safety net: if the model ever leaks TeX, turn it into readable plain text.
// We *prefer* preventing TeX via the system prompt, but we never want users seeing "\\frac{5}{4}".
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

  // Roots: \sqrt{a} => sqrt(a)
  t = t.replace(/\\sqrt\{([^{}\n]+)\}/g, (_m, a) => `sqrt(${a})`);

  // Common operators.
  t = t
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈");

  // \left / \right add noise for beginners.
  t = t.replace(/\\left/g, "").replace(/\\right/g, "");

  return t;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing OPENROUTER_API_KEY." });

  try {
    const body = req.body || {};
    const role = normRole(body.role);
    const action = normAction(body.action);

    const country = clampStr(body.country, 80);
    const level = clampStr(body.level, 80);
    const subject = clampStr(body.subject, 80);
    const topic = clampStr(body.topic, 180);

    const message = clampStr(body.message || "", 4000);
    const options = clampStr(body.options || "", 1400);

    const guest = Boolean(body.guest);
    const teacherInvite = clampStr(body.teacherInvite || "", 120);
    const attempt = Math.max(0, Math.min(3, Number(body.attempt) || 0));

    // SERVER TRUTH: verification comes from cookie->backend status
    const token = getSessionTokenFromReq(req);
    const status = await fetchBackendStatus(token);
    const verified = Boolean(status?.verified);

    if (guest && !isGuestAllowedAction(action)) {
      return res.status(403).json({
        error: "Guest mode is limited. Please verify to unlock assessments and slides.",
      });
    }

    if (role === "educator") {
      const codes = parseInviteCodes();
      if (codes.length) {
        if (!verified) {
          return res.status(403).json({ error: "Please verify your email to use Educator mode." });
        }
        if (!isTeacherInviteValid(teacherInvite)) {
          return res.status(403).json({ error: "Educator tools require a valid Teacher Invite." });
        }
      }
    }

    const sys = systemPrompt({ role, country, level, subject, topic, attempt });
    const user = userPrompt({ role, action, topic, message, options, attempt });

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://elora.vercel.app",
        "X-Title": process.env.OPENROUTER_TITLE || "Elora",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.3,
        max_tokens: guest ? 900 : 1600,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      console.error("OpenRouter error:", data);
      return res.status(500).json({ error: "AI request failed." });
    }

    const replyRaw =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "";

    const reply = normalizeMathToPlainText(replyRaw);

    return res.status(200).json({ reply });
  } catch (e) {
    console.error("assistant api error", e);
    return res.status(500).json({ error: "AI request failed." });
  }
}
