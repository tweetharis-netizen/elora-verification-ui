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
    case "verify":
    case "check":
      return `Output format (work verification):
- Verdict: Likely correct / Uncertain / Likely incorrect
- Checks:
  1) Correctness check (where it matches / first mistake)
  2) Reasoning check (is the method valid?)
  3) Assumptions/units check (if relevant)
- One next-step hint (only ONE)
- (Optional) Teacher note (1 short sentence, if helpful)`;
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
    case "custom":
      return `Output format (custom):
- Start with the main answer (1–2 lines).
- Then 3–7 short steps or bullets, if applicable.
- End with one quick check question when useful.`;
    case "explain":
    default:
      return `Output format (explain):
- One-sentence answer (simple)
- Steps: 3–7 short numbered steps
- Mini example (only if helpful; 2–4 lines)
- Quick check: 1 question (+ short answer)`;
  }
}

function systemPrompt({ role, country, level, subject, topic, attempt, responseStyle, action, customStyle }) {
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

  const customLine =
    mode === "custom" && String(customStyle || "").trim()
      ? `Custom style instructions:
${String(customStyle).trim()}`
      : "";

  return `You are Elora — a calm, professional teaching assistant for educators and learners.

Hard rules (must follow):
- Plain language by default. Use human-readable math (words first).
- Do NOT output LaTeX/TeX (no \\frac, \\sqrt, \\times, \\( \\), $$, etc.).
- Do NOT use Markdown formatting (no headings starting with #, no **bold**, no code fences).
- Keep it short and readable: 3–7 steps, each 1–2 lines. Avoid long paragraphs.
- Be warm and non-intimidating. No "as an AI model" disclaimers.

Context:
- User type: ${role}
- Country/curriculum: ${country}
- Level: ${level}
- Subject: ${subject}
- Topic: ${topic}
- Action: ${action}
- Attempt count: ${attempt}

${modeRules}
${customLine}

${actionTemplate(action)}

For work verification actions ("check" or "verify"):
- Always follow the work verification output format above.
- If unsure, say "Uncertain" and explain what information is missing.
- Only ONE next-step hint. No extra hints.

Return plain text only. Use simple bullets "-" and numbered steps "1)".`;
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

  // Remove \left / \right noise
  t = t.replace(/\\left/g, "").replace(/\\right/g, "");

  // Remove stray backslashes left from TeX commands
  t = t.replace(/\\[a-zA-Z]+/g, "");

  // Clean up spacing
  t = t.replace(/[ \t]{2,}/g, " ").trim();

  return t;
}

function stripMarkdownToPlainText(text) {
  if (!text) return "";
  let t = String(text);

  // Remove fenced code blocks
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

function firstSentence(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const m = t.match(/(.+?[.!?])(\s|$)/);
  return (m ? m[1] : t.split("\n")[0]).trim();
}

function splitSentences(text, max = 3) {
  const t = String(text || "").replace(/\n+/g, " ").trim();
  if (!t) return [];
  const parts = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  return parts.slice(0, max);
}

function pickHint(text) {
  const t = String(text || "").trim();
  if (!t) return "Try rewriting your steps carefully, then re-check the arithmetic/algebra.";
  const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
  const explicit = lines.find((l) => /next[- ]?step hint|hint:/i.test(l));
  if (explicit) {
    const cleaned = explicit
      .replace(/^(one\s+)?next[- ]?step hint\s*:\s*/i, "")
      .replace(/^hint\s*:\s*/i, "")
      .trim();
    return firstSentence(cleaned) || "Try checking the step where values were moved across the equals sign.";
  }
  return firstSentence(lines[lines.length - 1]) || "Try checking each operation you applied to both sides of the equation.";
}

function enforceWorkVerificationFormat(action, reply) {
  const a = String(action || "").toLowerCase();
  if (a !== "check" && a !== "verify") return String(reply || "").trim();

  const raw = String(reply || "").trim();
  if (!raw) {
    return [
      "Verdict: Uncertain",
      "Checks:",
      "1) Correctness check: I didn’t receive enough information to judge correctness.",
      "2) Reasoning check: Please include the student’s working/steps.",
      "3) Assumptions/units check: Include units/constraints if this is a word problem.",
      "One next-step hint: Paste the question and the student’s attempt, then I’ll check the first mistake.",
    ].join("\n");
  }

  const hasVerdict = /(^|\n)\s*Verdict\s*:/i.test(raw);

  // If already structured, keep it but enforce exactly ONE hint line.
  if (hasVerdict) {
    const lines = raw.split("\n");
    const out = [];
    let seenHint = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (
        /^\s*One\s+next-step\s+hint\s*:/i.test(line) ||
        /^\s*Next[- ]?step\s+hint\s*:/i.test(line) ||
        /^\s*Hint\s*:/i.test(line)
      ) {
        if (seenHint) continue;
        seenHint = true;

        const cleaned = line
          .replace(/^\s*Next[- ]?step\s+hint\s*:\s*/i, "One next-step hint: ")
          .replace(/^\s*Hint\s*:\s*/i, "One next-step hint: ")
          .trim();

        out.push(`One next-step hint: ${firstSentence(cleaned.replace(/^One next-step hint:\s*/i, ""))}`);
        continue;
      }

      if (seenHint && /hint/i.test(line)) continue;

      out.push(line);
    }

    if (!seenHint) out.push(`One next-step hint: ${pickHint(raw)}`);

    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  // Fallback: wrap into the correct structure.
  const sentences = splitSentences(raw, 3);
  const c1 = sentences[0] || firstSentence(raw) || "The attempt needs a closer check.";
  const c2 = sentences[1] || "I need the student’s steps and what method they used.";
  const c3 = sentences[2] || "If this is a word problem, units and assumptions matter.";

  const hint = pickHint(raw);

  const verdictGuess = /correct|right|works out|looks good/i.test(raw)
    ? "Likely correct"
    : /wrong|incorrect|mistake|doesn’t|does not|fails/i.test(raw)
    ? "Likely incorrect"
    : "Uncertain";

  return [
    `Verdict: ${verdictGuess}`,
    "Checks:",
    `1) Correctness check: ${firstSentence(c1)}`,
    `2) Reasoning check: ${firstSentence(c2)}`,
    `3) Assumptions/units check: ${firstSentence(c3)}`,
    `One next-step hint: ${firstSentence(hint)}`,
  ].join("\n");
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

    const sessionToken = getSessionTokenFromReq(req);
    const status = await fetchBackendStatus(sessionToken);

    const verified = Boolean(status?.verified);
    const accountRole = String(status?.role || (verified ? "regular" : "guest")).toLowerCase();
    const teacher = accountRole === "teacher";

    if (role === "educator" && !verified) {
      return res.status(403).json({ error: "Please verify your email to use Educator mode." });
    }

    const teacherOnlyActions = new Set(["lesson", "worksheet", "assessment", "slides", "verify"]);
    if (teacherOnlyActions.has(action) && !teacher) {
      return res.status(403).json({
        error: "Teacher tools are locked. Enter a Teacher Invite Code in Settings to unlock teacher tools.",
      });
    }

    const sys = systemPrompt({ role, country, level, subject, topic, attempt, responseStyle, action, customStyle });
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
    const replyClean = stripMarkdownToPlainText(normalizeMathToPlainText(replyRaw));
    const reply = enforceWorkVerificationFormat(action, replyClean);

    return res.status(200).json({ reply });
  } catch {
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
