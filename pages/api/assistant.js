import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";
import { isTeacherFromReq } from "@/lib/server/teacher";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "6mb", // allow a compressed image data URL
    },
  },
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Keep stable + maintainable: a few simple helpers, no magic.
function clampStr(v, max = 1200) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function stripMarkdownToPlainText(text) {
  let t = String(text || "");
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

function normalizeMathToPlainText(text) {
  let t = String(text || "");

  // Remove common LaTeX markers defensively
  t = t.replace(/\$\$[\s\S]*?\$\$/g, (m) => m.replace(/\$/g, ""));
  t = t.replace(/\$([^$]+)\$/g, "$1");
  t = t.replace(/\\frac\s*{([^}]+)}\s*{([^}]+)}/g, "$1/$2");
  t = t.replace(/\\times/g, "×");
  t = t.replace(/\\div/g, "÷");
  t = t.replace(/\\cdot/g, "×");
  t = t.replace(/\\sqrt\s*{([^}]+)}/g, "sqrt($1)");
  t = t.replace(/\\left|\\right/g, "");
  t = t.replace(/\\\(|\\\)/g, "");
  t = t.replace(/\\\[|\\\]/g, "");
  t = t.replace(/\\text\s*{([^}]+)}/g, "$1");

  // Clean invisible tokens sometimes returned by models
  t = t.replace(/<\s*internal\s*>[\s\S]*?<\s*\/\s*internal\s*>/gi, "");
  t = t.replace(/<\s*internal\s*\/\s*>/gi, "");
  t = t.replace(/<\s*internal\s*>/gi, "");

  return t.trim();
}

function inferActionFromMessage(message, fallbackAction) {
  const t = String(message || "").toLowerCase();

  if (
    t.includes("check my answer") ||
    t.includes("is this correct") ||
    t.includes("is it correct") ||
    t.includes("am i correct") ||
    t.includes("did i get it right") ||
    t.includes("right or wrong") ||
    /\bmy answer\b/.test(t) ||
    /\banswer\s*:\s*/.test(t) ||
    /\b=\s*-?\d/.test(t)
  ) {
    return "check";
  }

  // Otherwise stick to chosen action.
  return String(fallbackAction || "explain");
}

function systemPrompt({ role, country, level, subject, topic, action, attempt, hasImage }) {
  return `You are Elora: a calm, professional teaching assistant.

Hard rules:
- Plain text only. No Markdown. No headings. No code blocks.
- No LaTeX/TeX. Do not output \\frac, \\sqrt, \\times, \\( \\), $$, etc.
- Use human-readable math: "5 divided by 4 = 1.25" (and optionally "5/4" if helpful).
- Be confident and direct. Do not say "likely", "maybe", "probably", or "I think".
- If you are missing a key detail, ask exactly ONE clarifying question.

User context:
Role: ${role}
Country: ${country}
Level: ${level}
Subject: ${subject}
Topic: ${topic}
Mode: ${action}
Attempt: ${attempt}
Has image: ${hasImage ? "yes" : "no"}

Student "check my answer" policy (critical):
- Your job is to decide whether the student's answer is correct or not.
- If correct: say "Correct ✅" and explain briefly (no extra questions).
- If incorrect:
  - Attempt 1-2: DO NOT reveal the final correct answer. Give hints + show what step to fix.
  - Attempt 3: You MAY reveal the final answer and show clean steps.
- Never evade. Always say correct/incorrect clearly.

Image policy:
- If an image is provided, start with ONE short sentence about what you see (e.g. "I can see a worksheet question about...").
- If the image is unreadable, ask for a clearer photo OR ask the user to type the key line(s). Only one question.`;
}

function userPrompt({ role, action, topic, message, attempt }) {
  const safeTopic = topic ? `Topic: ${topic}` : "Topic: (not specified)";

  const base =
    `Task:\n` +
    `${safeTopic}\n` +
    `User message:\n` +
    `${message}\n`;

  // Tight check-mode framing helps a lot.
  if (role === "student" && action === "check") {
    return (
      base +
      `\nInstructions:\n` +
      `- First line must be either "Correct ✅" or "Not quite ❌".\n` +
      `- Then give short steps.\n` +
      (attempt >= 3
        ? `- You may reveal the final answer now.\n`
        : `- Do NOT reveal the final answer. Give hints and the next step only.\n`)
    );
  }

  // Default explain mode
  return (
    base +
    `\nInstructions:\n` +
    `- Keep it clear and short.\n` +
    `- Prefer small numbered steps (1) 2) 3)).\n` +
    `- End with a quick check question if it helps.\n`
  );
}

function isTeacherOnlyAction(action) {
  return new Set(["lesson", "worksheet", "assessment", "slides"]).has(String(action || ""));
}

function looksLikeAnswerLeak(text) {
  const t = String(text || "").toLowerCase();
  if (!t) return false;

  // Common "final answer" phrasing or explicit equals.
  if (t.includes("the answer is") || t.includes("final answer") || t.includes("correct answer")) return true;

  // An equals with a number in assistant output can leak.
  if (/\b=\s*-?\d/.test(t)) return true;

  // A standalone numeric result line (very rough heuristic)
  const lines = t.split("\n").map((x) => x.trim()).filter(Boolean);
  if (lines.some((l) => l.length <= 24 && /^[\d\s().,+\-/*÷×=]+$/.test(l) && /\d/.test(l))) return true;

  return false;
}

async function callOpenRouter({ apiKey, messages }) {
  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Recommended by OpenRouter (safe even if ignored)
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://elora-verification-ui.vercel.app",
      "X-Title": "Elora",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 650,
      messages,
    }),
  });

  const data = await resp.json().catch(() => null);
  return { ok: resp.ok, status: resp.status, data };
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

    // Inputs (defensive)
    const role = clampStr(body.role || "student", 20);
    const country = clampStr(body.country || "Singapore", 40);
    const level = clampStr(body.level || "Secondary", 40);
    const subject = clampStr(body.subject || "General", 60);
    const topic = clampStr(body.topic || "", 120);

    const requestedAction = clampStr(body.action || "explain", 20);
    const message = clampStr(body.message || "", 2400);

    // Attempt: client may pass 1..3 for check
    const attempt = clampInt(body.attempt, 0, 3, 0);

    const imageDataUrl = clampStr(body.imageDataUrl || "", 6_000_000);
    const hasImage = Boolean(imageDataUrl && imageDataUrl.startsWith("data:image/"));

    if (!message && !hasImage) {
      return res.status(400).json({ error: "Missing message." });
    }

    // Ask backend about verification/session
    const sessionToken = getSessionTokenFromReq(req);
    const status = await fetchBackendStatus(sessionToken);

    const verified = Boolean(status?.verified);
    const teacher = Boolean(isTeacherFromReq(req));

    // Educator mode is only available after verification.
    if (role === "educator" && !verified) {
      return res.status(403).json({ error: "Please verify your email to use Educator mode." });
    }

    // Teacher-only tools locked behind teacher cookie
    const action = inferActionFromMessage(message, requestedAction);
    if (isTeacherOnlyAction(action) && !teacher) {
      return res.status(403).json({
        error: "Teacher tools are locked. Redeem a Teacher Invite Code in Settings to unlock them.",
      });
    }

    const sys = systemPrompt({ role, country, level, subject, topic, action, attempt, hasImage });
    const userText = userPrompt({ role, action, topic, message, attempt });

    // Build OpenRouter messages with optional image
    const userContent = hasImage
      ? [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ]
      : userText;

    // Primary call
    let { ok, data } = await callOpenRouter({
      apiKey,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userContent },
      ],
    });

    if (!ok) {
      const msg = data?.error?.message || data?.error || "AI request failed.";
      return res.status(500).json({ error: String(msg) });
    }

    let replyRaw = data?.choices?.[0]?.message?.content || "";
    let reply = stripMarkdownToPlainText(normalizeMathToPlainText(replyRaw));

    // Enforce attempt gating for Student+Check
    if (role === "student" && action === "check" && attempt > 0 && attempt < 3) {
      if (looksLikeAnswerLeak(reply)) {
        // One rewrite attempt: remove final answer / numeric result leakage
        const rewriteSys =
          sys +
          `\nRewrite rule:\n- Rewrite your previous reply so it contains NO final numeric answer and NO "the answer is". Keep only hints and next-step guidance.`;
        const rewriteUser = `Rewrite this response to follow the attempt policy strictly (no final answer):\n\n${reply}`;

        const second = await callOpenRouter({
          apiKey,
          messages: [
            { role: "system", content: rewriteSys },
            { role: "user", content: rewriteUser },
          ],
        });

        if (second.ok) {
          const r2 = second.data?.choices?.[0]?.message?.content || "";
          reply = stripMarkdownToPlainText(normalizeMathToPlainText(r2));
        } else {
          // Failsafe (still helpful, no leakage)
          reply =
            "Not quite ❌\n" +
            "I can’t reveal the final answer yet.\n\n" +
            "Here’s a hint:\n" +
            "- Recheck your first step carefully and write down what you did.\n" +
            "- Tell me your next step (not the final answer), and I’ll guide you.";
        }
      }
    }

    return res.status(200).json({ reply });
  } catch (e) {
    // Keep error simple (no secret leaks)
    return res.status(500).json({ error: "Assistant failed. Try again." });
  }
}
