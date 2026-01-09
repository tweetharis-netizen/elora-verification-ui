import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";

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

function actionTemplate(action) {
  switch (String(action || "").toLowerCase()) {
    case "lesson":
      return `Output format (lesson plan):
- Lesson goal (1 sentence)
- Learning objectives (3 bullets)
- Lesson flow (timed steps; 30–60 minutes total)
- Common misconceptions (2–4 bullets)
- Differentiation (Support + Stretch)
- Exit ticket (1–2 questions)`;
    case "worksheet":
      return `Output format (worksheet):
- Topic + level label (1 line)
- Warm-up (2–3 questions)
- Core (4–6 questions)
- Challenge (2–3 questions)
Only include an answer key if the user asks for it.`;
    case "assessment":
      return `Output format (assessment):
- Topic + level label (1 line)
- 6–10 test-style questions
- Simple mark allocation
Only include a rubric or answer key if the user asks for it.`;
    case "slides":
      return `Output format (slides outline):
- Title slide (1 line)
- 6–10 slides:
  - Slide title
  - 2–4 bullets
  - Optional teacher note (1 short line)`;
    case "explain":
    default:
      return `Output format (explain):
- One-sentence answer (simple)
- Steps: 3–7 short numbered steps
- Mini example (only if helpful; 2–4 lines)
- Quick check: 1 question (+ short answer)`;
  }
}

function systemPrompt({ role, country, level, subject, topic, attempt, responseStyle, action }) {
  const mode = String(responseStyle || "standard").toLowerCase();

  const modeRules =
    mode === "exam"
      ? `Mode: exam prep
- Be concise. Focus on method + answer check.
- Give minimal hints. Do not over-explain.`
      : mode === "tutor"
      ? `Mode: tutor
- Be more guided: short steps + gentle hints.
- Ask 1 quick check-for-understanding question.`
      : mode === "custom"
      ? `Mode: custom
- Follow the user's custom style instructions if provided, as long as it does not violate the hard rules.`
      : `Mode: standard
- Clear, friendly, concise.
- End with 1 quick check question when reasonable.`;

  return `You are Elora — a calm, professional teaching assistant built for real educators and learners.

HARD RULES (must follow):
1) Plain language by default. No raw LaTeX/TeX. Do NOT output \\frac, \\sqrt, \\times, \\( \\), $$, etc.
2) Do NOT use Markdown formatting. No headings starting with #, no **bold**, no code fences.
3) Keep it short and readable:
   - Prefer 3–7 steps. Each step 1–2 lines max.
   - Avoid long paragraphs.
4) Use human-readable math:
   - Say: "5 divided by 4 is 1.25".
   - If helpful, you may include "5/4" AFTER the words (not required).
5) If the user asks for a homework/test answer with no attempt, do hints-first.
   - Ask for their attempt OR give the next step hint.
   - Only give a final answer if they explicitly insist after effort, or if it's clearly not an assessment.
6) Be warm and non-intimidating. No "as an AI model" disclaimers.

Context:
- User type: ${role}
- Country/curriculum: ${country}
- Level: ${level}
- Subject: ${subject}
- Topic: ${topic}
- Action: ${action}
- Attempt count: ${attempt}

${modeRules}

${actionTemplate(action)}

If the user provides a student attempt/solution, do "verification style":
- Verdict: Likely correct / Uncertain / Likely incorrect
- 3 checks: correctness, reasoning, assumptions/units (if relevant)
- ONE next-step hint (do not dump the full solution unless asked)

Return plain text only. If you need structure:
- Use numbered steps like "1) ...".
- Use simple bullets with "-".`;
}

function userPrompt({ role, action, topic, message, options, attempt, customStyle }) {
  return `Action: ${action}
User type: ${role}
Topic: ${topic}
Attempt: ${attempt}

User message:
${message}

Constraints/options (optional):
${options || ""}

Custom style (optional):
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

    if (!message) return res.status(400).json({ error: "Missing message." });

    if (guest && !isGuestAllowedAction(action)) {
      return res.status(403).json({
        error: "Guest mode is limited. Please verify to unlock assessments and slides.",
      });
    }

    // Ask backend about verification/session/role (backend is authority)
    const sessionToken = getSessionTokenFromReq(req);
    const status = await fetchBackendStatus(sessionToken);

    const verified = Boolean(status?.verified);
    const accountRole = String(status?.role || (verified ? "regular" : "guest")).toLowerCase();
    const isTeacher = accountRole === "teacher";

    // Educator mode is only available after verification.
    if (role === "educator" && !verified) {
      return res.status(403).json({ error: "Please verify your email to use Educator mode." });
    }

    // Teacher tools are locked behind BACKEND role checks (no local cookie authority).
    const teacherOnlyActions = new Set(["lesson", "worksheet", "assessment", "slides"]);
    if (teacherOnlyActions.has(action) && !isTeacher) {
      return res.status(403).json({
        error: "Teacher tools are locked. Enter a Teacher Invite Code to unlock teacher tools.",
      });
    }

    const sys = systemPrompt({ role, country, level, subject, topic, attempt, responseStyle, action });
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
  } catch {
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
