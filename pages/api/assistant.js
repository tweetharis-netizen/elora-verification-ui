import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";
import { isTeacherFromReq } from "@/lib/server/teacher";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function clampStr(v, max = 1200) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
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
- Do not include hashtags, decorative separators, or stylized formatting.

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
    const attempt = Number.isFinite(body.attempt) ? Number(body.attempt) : 0;
    const teacherInvite = clampStr(body.teacherInvite || "", 120);

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
        error:
          "Teacher tools are locked. Enter a Teacher Invite Code in Settings to activate Educator tools.",
      });
    }

    const sys = systemPrompt({ role, country, level, subject, topic, attempt, responseStyle });
    const user = userPrompt({ role, action, topic, message, options, attempt, customStyle });

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
  } catch (e) {
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
