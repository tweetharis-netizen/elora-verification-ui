import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";
import { isTeacherFromReq } from "@/lib/server/teacher";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "6mb",
    },
  },
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Memory rules:
 * - We accept `body.messages` from the UI (thread history).
 * - We include a trimmed + sanitized version of that history in the model call
 *   so the assistant "remembers what the user is talking about" within a chat.
 * - We still enforce the Student+Check attempt-gating rules (no answer reveal until attempt 3).
 */
const MAX_HISTORY_MESSAGES = 16; // small + safe for latency/cost
const MAX_HISTORY_CHARS_PER_MESSAGE = 900;

function clampStr(v, max = 2400) {
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

  return String(fallbackAction || "explain");
}

function isTeacherOnlyAction(action) {
  return new Set(["lesson", "worksheet", "assessment", "slides"]).has(String(action || ""));
}

function looksLikeAnswerLeak(text) {
  const t = String(text || "").toLowerCase();
  if (!t) return false;
  if (t.includes("the answer is") || t.includes("final answer") || t.includes("correct answer")) return true;
  if (/\b=\s*-?\d/.test(t)) return true;

  const lines = t
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  if (lines.some((l) => l.length <= 24 && /^[\d\s().,+\-/*÷×=]+$/.test(l) && /\d/.test(l))) return true;

  return false;
}

/**
 * Deterministic math checker (for "Check my answer").
 * Stable scope (demo-ready):
 * - arithmetic with + - * / (and × ÷), parentheses
 * - decimals
 * - simple fractions in input (e.g., 5/4)
 * - percentages in student answer or expression (e.g., 20% => 0.2)
 *
 * Returns null if it can't safely determine correctness.
 */
function tryDeterministicCheck(message) {
  const raw = String(message || "").trim();
  if (!raw) return null;

  // Only do deterministic check if the user provided an answer.
  // Pattern 1: "expression = answer"
  const eqIdx = raw.lastIndexOf("=");
  let exprStr = "";
  let ansStr = "";

  if (eqIdx !== -1) {
    exprStr = raw.slice(0, eqIdx).trim();
    ansStr = raw.slice(eqIdx + 1).trim();
  } else {
    // Pattern 2: "my answer is ___" or "answer: ___"
    const m = raw.match(/\b(my answer is|answer\s*:)\s*([^\n\r]+)$/i);
    if (m) {
      ansStr = String(m[2] || "").trim();
      // Try to find an expression earlier in the string (best-effort)
      exprStr = raw.slice(0, m.index).trim();
    }
  }

  // If no answer found, we don't "solve" in check mode.
  if (!ansStr) return null;

  // If expression is empty, try to extract something that looks like an expression from the message.
  if (!exprStr) {
    // Pull the first chunk with digits/operators
    const m = raw.match(/([\d\s().,+\-/*÷×%]+)\s*(?:=|$)/);
    exprStr = m ? String(m[1] || "").trim() : "";
  }

  if (!exprStr) return null;

  const exprVal = safeEvalExpression(exprStr);
  const ansVal = parseNumericValue(ansStr);

  if (exprVal == null || ansVal == null) return null;

  const ok = nearlyEqual(exprVal, ansVal);

  return { ok, exprVal, ansVal, exprStr, ansStr };
}

function nearlyEqual(a, b) {
  const A = Number(a);
  const B = Number(b);
  if (!Number.isFinite(A) || !Number.isFinite(B)) return false;
  const diff = Math.abs(A - B);
  const scale = Math.max(1, Math.abs(A), Math.abs(B));
  return diff <= 1e-9 * scale;
}

function parseNumericValue(s) {
  const t = String(s || "").trim();
  if (!t) return null;

  // Strip trailing punctuation
  const cleaned = t.replace(/[.,;:!?]+$/g, "").trim();

  // Percent
  if (/%$/.test(cleaned)) {
    const n = parseNumericValue(cleaned.replace(/%$/, "").trim());
    if (n == null) return null;
    return n / 100;
  }

  // Mixed number: "1 1/2"
  const mixed = cleaned.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    if (!Number.isFinite(whole) || !Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    return whole + sign * (num / den);
  }

  // Fraction: "5/4"
  const frac = cleaned.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (frac) {
    const num = Number(frac[1]);
    const den = Number(frac[2]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return num / den;
  }

  // Plain number
  const n = Number(cleaned.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return n;
}

/**
 * Safe expression evaluator: + - * / parentheses, decimals, fractions as "a/b", and %.
 * No variables, no functions, no exponents.
 */
function safeEvalExpression(expr) {
  const cleaned = String(expr || "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return null;

  // Tokenize
  const tokens = tokenize(cleaned);
  if (!tokens) return null;

  // Shunting-yard to RPN
  const rpn = toRpn(tokens);
  if (!rpn) return null;

  // Evaluate RPN
  const val = evalRpn(rpn);
  if (!Number.isFinite(val)) return null;
  return val;
}

function tokenize(s) {
  const tokens = [];
  let i = 0;

  const isDigit = (c) => c >= "0" && c <= "9";

  while (i < s.length) {
    const c = s[i];

    if (c === " ") {
      i += 1;
      continue;
    }

    if (c === "(" || c === ")") {
      tokens.push({ type: "paren", value: c });
      i += 1;
      continue;
    }

    if (c === "+" || c === "-" || c === "*" || c === "/") {
      tokens.push({ type: "op", value: c });
      i += 1;
      continue;
    }

    // number, possibly with decimal, fraction, percent
    if (isDigit(c) || c === ".") {
      let j = i;
      while (j < s.length && (isDigit(s[j]) || s[j] === ".")) j += 1;

      // fraction support: 12/5
      if (j < s.length && s[j] === "/") {
        j += 1;
        while (j < s.length && (isDigit(s[j]) || s[j] === ".")) j += 1;
      }

      // percent: 20%
      if (j < s.length && s[j] === "%") j += 1;

      tokens.push({ type: "num", value: s.slice(i, j) });
      i = j;
      continue;
    }

    return null;
  }

  return tokens;
}

function precedence(op) {
  if (op === "*" || op === "/") return 2;
  if (op === "+" || op === "-") return 1;
  return 0;
}

function toRpn(tokens) {
  const output = [];
  const ops = [];

  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];

    if (t.type === "num") {
      output.push(t);
      continue;
    }

    if (t.type === "op") {
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.type === "op" && precedence(top.value) >= precedence(t.value)) {
          output.push(ops.pop());
        } else {
          break;
        }
      }
      ops.push(t);
      continue;
    }

    if (t.type === "paren" && t.value === "(") {
      ops.push(t);
      continue;
    }

    if (t.type === "paren" && t.value === ")") {
      let found = false;
      while (ops.length) {
        const top = ops.pop();
        if (top.type === "paren" && top.value === "(") {
          found = true;
          break;
        }
        output.push(top);
      }
      if (!found) return null;
      continue;
    }

    return null;
  }

  while (ops.length) {
    const top = ops.pop();
    if (top.type === "paren") return null;
    output.push(top);
  }

  return output;
}

function parseNumToken(v) {
  const raw = String(v || "").trim();
  if (!raw) return null;

  // percent
  if (raw.endsWith("%")) {
    const n = parseNumToken(raw.slice(0, -1));
    return n == null ? null : n / 100;
  }

  // fraction
  const frac = raw.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const a = Number(frac[1]);
    const b = Number(frac[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
    return a / b;
  }

  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

function evalRpn(rpn) {
  const stack = [];

  for (const t of rpn) {
    if (t.type === "num") {
      const n = parseNumToken(t.value);
      if (n == null) return NaN;
      stack.push(n);
      continue;
    }

    if (t.type === "op") {
      if (stack.length < 2) return NaN;
      const b = stack.pop();
      const a = stack.pop();
      if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;

      if (t.value === "+") stack.push(a + b);
      else if (t.value === "-") stack.push(a - b);
      else if (t.value === "*") stack.push(a * b);
      else if (t.value === "/") stack.push(a / b);
      else return NaN;

      continue;
    }

    return NaN;
  }

  if (stack.length !== 1) return NaN;
  return stack[0];
}

function formatFinalNumber(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n);
  // Prefer clean integers when possible
  if (Number.isInteger(x)) return String(x);
  // Otherwise reasonable decimals
  return String(Number(x.toFixed(6))).replace(/\.0+$/, "");
}

function systemPrompt({ role, country, level, subject, topic, action, attempt, hasImage }) {
  const base =
    `You are Elora, a premium teaching assistant.\n` +
    `Style rules:\n` +
    `- Be calm, professional, and very clear.\n` +
    `- Use plain language by default.\n` +
    `- Do NOT output raw LaTeX unless the user explicitly asks.\n` +
    `- For math, write like a teacher: "5 divided by 4 is 1.25".\n` +
    `- Keep steps short and readable.\n` +
    `- Never say "likely", "maybe", or "it seems" when checking correctness; be decisive when you can.\n` +
    `- If user message is ambiguous, ask ONE clarifying question, not many.\n\n` +
    `Context:\n` +
    `- Role: ${role}\n` +
    `- Country: ${country}\n` +
    `- Level: ${level}\n` +
    `- Subject: ${subject}\n` +
    (topic ? `- Topic: ${topic}\n` : "") +
    `- Mode: ${action}\n` +
    (hasImage ? `- The user attached an image. Use it.\n` : "");

  if (role === "student" && action === "check") {
    const gate =
      `\nAttempt policy for "Check my answer":\n` +
      `- Attempt is ${attempt}.\n` +
      `- If attempt is 1 or 2: DO NOT reveal the final numeric answer. Give hints and the next step only.\n` +
      `- If attempt is 3: You may reveal the final answer.\n` +
      `- Always say whether the student's answer is correct or not.\n`;
    return base + gate;
  }

  if (role === "educator") {
    return (
      base +
      `\nEducator tone:\n` +
      `- Classroom-ready language.\n` +
      `- Provide structure (bullet points/headings) but keep it clean.\n`
    );
  }

  if (role === "parent") {
    return (
      base +
      `\nParent tone:\n` +
      `- Avoid jargon.\n` +
      `- Give practical ways to help at home.\n`
    );
  }

  return base;
}

function userPrompt({ role, action, topic, message, attempt }) {
  const t = topic ? `Topic: ${topic}\n` : "";
  if (role === "student" && action === "check") {
    return (
      `Check my answer.\n` +
      `Attempt: ${attempt}\n` +
      t +
      `Student message:\n${message}\n\n` +
      `Rules:\n` +
      `- First line: "Correct ✅" OR "Not quite ❌".\n` +
      `- If attempt 1 or 2: hints only, no final answer.\n` +
      `- If attempt 3: show the correct answer + short steps.\n`
    );
  }

  if (action === "lesson") return `${t}Create a lesson plan:\n${message}`;
  if (action === "worksheet") return `${t}Create a worksheet:\n${message}`;
  if (action === "assessment") return `${t}Create an assessment:\n${message}`;
  if (action === "slides") return `${t}Design a slide deck:\n${message}`;

  return `${t}${message}`;
}

async function callOpenRouter({ apiKey, messages }) {
  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      temperature: 0.4,
      messages,
    }),
  });

  const data = await resp.json().catch(() => null);
  return { ok: resp.ok, status: resp.status, data };
}

function sanitizeHistoryText(text) {
  // Keep it plain + safe, but don't over-strip meaning.
  const cleaned = stripMarkdownToPlainText(normalizeMathToPlainText(text || ""));
  return clampStr(cleaned, MAX_HISTORY_CHARS_PER_MESSAGE);
}

function buildConversationMessages({
  history,
  currentMessage,
  sys,
  userContent,
}) {
  const out = [{ role: "system", content: sys }];

  const raw = Array.isArray(history) ? history : [];
  let trimmed = raw.slice(-MAX_HISTORY_MESSAGES);

  // Avoid duplicating the user's latest message (UI often includes it already)
  if (trimmed.length) {
    const last = trimmed[trimmed.length - 1];
    if (last && last.from === "user") {
      const lastText = clampStr(String(last.text || ""), 2400);
      if (lastText && lastText === String(currentMessage || "")) {
        trimmed = trimmed.slice(0, -1);
      }
    }
  }

  for (const m of trimmed) {
    const from = m?.from === "elora" ? "assistant" : "user";
    const text = sanitizeHistoryText(m?.text || "");
    if (!text) continue;
    out.push({ role: from, content: text });
  }

  out.push({ role: "user", content: userContent });
  return out;
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
    const country = clampStr(body.country || "Singapore", 60);
    const level = clampStr(body.level || "Primary 1", 60);
    const subject = clampStr(body.subject || "General", 60);
    const topic = clampStr(body.topic || "", 120);

    const requestedAction = clampStr(body.action || "explain", 20);
    const message = clampStr(body.message || "", 2400);

    const attempt = clampInt(body.attempt, 0, 3, 0);

    const imageDataUrl = clampStr(body.imageDataUrl || "", 6_000_000);
    const hasImage = Boolean(imageDataUrl && imageDataUrl.startsWith("data:image/"));

    const history = Array.isArray(body.messages) ? body.messages : [];

    if (!message && !hasImage) {
      return res.status(400).json({ error: "Missing message." });
    }

    // Auth status (server truth)
    const sessionToken = getSessionTokenFromReq(req);
    const status = await fetchBackendStatus(sessionToken);

    const verified = Boolean(status?.verified);
    const teacher = Boolean(isTeacherFromReq(req));

    // Educator mode requires verification
    if (role === "educator" && !verified) {
      return res.status(403).json({ error: "Please verify your email to use Educator mode." });
    }

    const action = inferActionFromMessage(message, requestedAction);

    // Teacher-only tools require teacher cookie
    if (isTeacherOnlyAction(action) && !teacher) {
      return res.status(403).json({
        error: "Teacher tools are locked. Redeem a Teacher Invite Code in Settings to unlock them.",
      });
    }

    // Deterministic checker: only for Student + Check + no image
    if (role === "student" && action === "check" && !hasImage) {
      const det = tryDeterministicCheck(message);
      if (det) {
        if (det.ok) {
          const reply =
            `Correct ✅\n` +
            `You evaluated "${det.exprStr}" correctly.\n` +
            `Your answer matches the result.`;
          return res.status(200).json({ reply });
        }

        // Incorrect
        if (attempt >= 3) {
          const final = formatFinalNumber(det.exprVal);
          const reply =
            `Not quite ❌\n` +
            `On attempt 3, here’s the correct result:\n` +
            `${det.exprStr} = ${final}\n\n` +
            `Steps:\n` +
            `1) Follow order of operations (brackets, then ×/÷, then +/−).\n` +
            `2) Compute carefully and compare with your answer.\n`;
          return res.status(200).json({ reply });
        }

        // Attempt 1–2: do not reveal final answer
        const reply =
          `Not quite ❌\n` +
          `Hint (no final answer yet):\n` +
          `1) Re-check the order of operations.\n` +
          `2) Do one operation at a time and write the intermediate result.\n` +
          `3) Then compare with the answer you wrote.\n\n` +
          `Try again and send your updated answer like this:\n` +
          `${det.exprStr} = ?`;
        return res.status(200).json({ reply });
      }

      // If we couldn't deterministically check, fall through to model (but still attempt-gated).
    }

    const sys = systemPrompt({ role, country, level, subject, topic, action, attempt, hasImage });
    const userText = userPrompt({ role, action, topic, message, attempt });

    // OpenRouter image content is only supported on a user message.
    const userContent = hasImage
      ? [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ]
      : userText;

    const convo = buildConversationMessages({
      history,
      currentMessage: message,
      sys,
      userContent,
    });

    let { ok, data } = await callOpenRouter({
      apiKey,
      messages: convo,
    });

    if (!ok) {
      const msg = data?.error?.message || data?.error || "AI request failed.";
      return res.status(500).json({ error: String(msg) });
    }

    let replyRaw = data?.choices?.[0]?.message?.content || "";
    let reply = stripMarkdownToPlainText(normalizeMathToPlainText(replyRaw));

    // Attempt gating for Student+Check (model path only)
    if (role === "student" && action === "check" && attempt > 0 && attempt < 3) {
      if (looksLikeAnswerLeak(reply)) {
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
          reply =
            "Not quite ❌\n" +
            "I can’t reveal the final answer yet.\n\n" +
            "Hint:\n" +
            "1) Re-check your first step.\n" +
            "2) Send your next step (not the final answer), and I’ll guide you.";
        }
      }
    }

    return res.status(200).json({ reply });
  } catch {
    return res.status(500).json({ error: "Assistant failed. Try again." });
  }
}
