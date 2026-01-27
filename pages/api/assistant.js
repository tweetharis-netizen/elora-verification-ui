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

function normalizeHistoryMessages(input, opts) {
  const role = String(opts?.role || "student");
  const action = String(opts?.action || "explain");
  const attempt = Number(opts?.attempt || 0);
  const currentUserText = String(opts?.currentUserText || "");

  const arr = Array.isArray(input) ? input : [];
  if (!arr.length) return [];

  // Keep only the last N turns to control tokens
  const maxItems = 12;
  const recent = arr.slice(-maxItems);

  const out = [];
  for (const m of recent) {
    const fromRaw = String(m?.from || m?.role || "").toLowerCase();
    const raw = String(m?.text || m?.content || "").trim();
    if (!raw) continue;

    const kind = fromRaw === "elora" || fromRaw === "assistant" ? "assistant" : "user";

    // Student Check attempt policy: for attempts 1–2, do NOT include assistant text in history
    if (role === "student" && action === "check" && attempt < 3 && kind === "assistant") {
      continue;
    }

    // Avoid double-including the current user message (we add it as the final user turn)
    if (kind === "user" && currentUserText && raw === currentUserText) {
      continue;
    }

    // Clean and clamp hard
    const clean = stripMarkdownToPlainText(raw).slice(0, 1600).trim();
    if (!clean) continue;

    out.push({ role: kind, content: clean });
  }

  return out;
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

  const lines = t.split("\n").map((x) => x.trim()).filter(Boolean);
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

  return { ok, exprStr: exprStr.replace(/\s+/g, " ").trim(), exprVal, ansVal };
}

function nearlyEqual(a, b) {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const diff = Math.abs(x - y);
  const scale = Math.max(1, Math.abs(x), Math.abs(y));
  return diff <= 1e-9 * scale;
}

function parseNumericValue(s) {
  const raw = String(s || "").trim();
  if (!raw) return null;

  // Handle percent like "20%" => 0.2
  const pct = raw.match(/^(-?\d+(?:\.\d+)?)\s*%$/);
  if (pct) {
    const n = Number(pct[1]);
    if (!Number.isFinite(n)) return null;
    return n / 100;
  }

  // Handle fraction like "5/4"
  const frac = raw.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const n = Number(frac[1]);
    const d = Number(frac[2]);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
    return n / d;
  }

  const num = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(num)) return null;
  return num;
}

function tokenizeExpression(expr) {
  const s = String(expr || "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[–—]/g, "-");

  const tokens = [];
  let i = 0;

  const isDigit = (c) => c >= "0" && c <= "9";
  const isOp = (c) => c === "+" || c === "-" || c === "*" || c === "/";

  while (i < s.length) {
    const c = s[i];

    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }

    if (c === "(" || c === ")") {
      tokens.push({ type: "paren", value: c });
      i++;
      continue;
    }

    if (isOp(c)) {
      tokens.push({ type: "op", value: c });
      i++;
      continue;
    }

    // Number / fraction / percent
    if (isDigit(c) || c === ".") {
      let j = i;
      while (j < s.length && (isDigit(s[j]) || s[j] === "." || s[j] === ",")) j++;
      let numStr = s.slice(i, j).replace(/,/g, "");

      // Fraction support: "12/5"
      if (j < s.length && s[j] === "/") {
        let k = j + 1;
        while (k < s.length && (isDigit(s[k]) || s[k] === ",")) k++;
        const denStr = s.slice(j + 1, k).replace(/,/g, "");
        if (!denStr) return null;
        const num = Number(numStr);
        const den = Number(denStr);
        if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
        tokens.push({ type: "num", value: num / den });
        i = k;
        continue;
      }

      let num = Number(numStr);
      if (!Number.isFinite(num)) return null;

      // Percent support: "20%"
      if (j < s.length && s[j] === "%") {
        num = num / 100;
        j++;
      }

      tokens.push({ type: "num", value: num });
      i = j;
      continue;
    }

    // Any other char => unsafe / unsupported
    return null;
  }

  // Handle unary minus: convert "-x" into "0 - x" where appropriate
  const fixed = [];
  for (let idx = 0; idx < tokens.length; idx++) {
    const t = tokens[idx];
    if (t.type === "op" && t.value === "-") {
      const prev = fixed[fixed.length - 1];
      const isUnary = !prev || (prev.type === "op") || (prev.type === "paren" && prev.value === "(");
      if (isUnary) {
        fixed.push({ type: "num", value: 0 });
        fixed.push({ type: "op", value: "-" });
        continue;
      }
    }
    fixed.push(t);
  }

  return fixed;
}

function toRpn(tokens) {
  const out = [];
  const ops = [];

  const prec = (op) => (op === "+" || op === "-" ? 1 : op === "*" || op === "/" ? 2 : 0);

  for (const t of tokens) {
    if (t.type === "num") {
      out.push(t);
      continue;
    }

    if (t.type === "op") {
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.type === "op" && prec(top.value) >= prec(t.value)) {
          out.push(ops.pop());
          continue;
        }
        break;
      }
      ops.push(t);
      continue;
    }

    if (t.type === "paren" && t.value === "(") {
      ops.push(t);
      continue;
    }

    if (t.type === "paren" && t.value === ")") {
      while (ops.length && !(ops[ops.length - 1].type === "paren" && ops[ops.length - 1].value === "(")) {
        out.push(ops.pop());
      }
      if (!ops.length) return null;
      ops.pop(); // remove "("
      continue;
    }

    return null;
  }

  while (ops.length) {
    const t = ops.pop();
    if (t.type === "paren") return null;
    out.push(t);
  }

  return out;
}

function evalRpn(rpn) {
  const st = [];
  for (const t of rpn) {
    if (t.type === "num") {
      st.push(t.value);
      continue;
    }
    if (t.type === "op") {
      const b = st.pop();
      const a = st.pop();
      if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
      if (t.value === "+") st.push(a + b);
      else if (t.value === "-") st.push(a - b);
      else if (t.value === "*") st.push(a * b);
      else if (t.value === "/") {
        if (b === 0) return null;
        st.push(a / b);
      } else return null;
      continue;
    }
    return null;
  }
  if (st.length !== 1) return null;
  const v = st[0];
  if (!Number.isFinite(v)) return null;
  return v;
}

function safeEvalExpression(expr) {
  const tokens = tokenizeExpression(expr);
  if (!tokens) return null;
  const rpn = toRpn(tokens);
  if (!rpn) return null;
  return evalRpn(rpn);
}

function formatFinalNumber(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n);
  if (Math.abs(x - Math.round(x)) < 1e-12) return String(Math.round(x));
  const s = x.toString();
  if (s.length <= 12) return s;
  return x.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function systemPrompt({ role, country, level, subject, topic, action, attempt, hasImage, teacherRules, sentiment }) {
  const who =
    role === "educator"
      ? [
        "1. You are Elora, a Cinematic, High-Perception AI Learning Assistant.",
        `- Educator Preference (STRICT): ${teacherRules || "Follow standard Elora pedagogical guidelines."}`,
      ].join("\n")
      : role === "parent"
        ? "You are Elora, a warm, practical helper for parents supporting learning at home."
        : [
          "You are Elora, a multi-modal tutor for students.",
          sentiment === "supportive"
            ? "CRITICAL: Student seems frustrated or stuck. Shift to a GENTLE, COACHING tone. Use encouraging phrases, break things down more than usual, and offer a short 'brain break' if they want."
            : "Keep a steady, professional, and encouraging tutor persona."
        ].join("\n");

  const style = [
    "Default style rules:",
    "- Use plain language. Keep it calm, clear, and structured.",
    "- No raw LaTeX by default. Use human-readable math (e.g., '5 divided by 4 is 1.25').",
    "- If you must show math, use simple inline forms like 5/4 or 1.25.",
    "- Avoid saying 'likely' or sounding uncertain unless you truly cannot know.",
    "- If information is missing, ask ONE short clarifying question, otherwise make a reasonable assumption and state it briefly.",
  ].join("\n");

  const checkPolicy =
    role === "student" && action === "check"
      ? [
        "Student Check Policy:",
        "- You are checking the student's answer.",
        "- If attempt is 1 or 2: do NOT reveal the final answer. Give hints and ask them to try again.",
        "- If attempt is 3: you may reveal the final answer and explain clearly.",
      ].join("\n")
      : "";

  const ctx = [
    `Context:`,
    `Country syllabus naming: ${country}`,
    `Level: ${level}`,
    `Subject: ${subject}`,
    topic ? `Topic: ${topic}` : null,
    hasImage ? "The user attached an image. Describe what you see briefly, then answer." : null,
  ]
    .filter(Boolean)
    .join("\n");

  const actionGuide =
    action === "lesson"
      ? "Output format: objectives, timings, steps, checks for understanding, differentiation."
      : action === "worksheet"
        ? "Output format: student questions + optional teacher answers if teacher requested."
        : (action === "assessment" || action === "quiz")
          ? [
            "Output format: A very brief (1-sentence) intro, then the <quiz_data> JSON block.",
            "Rules: ONLY MCQ format. Clear title. 3-5 questions.",
            "JSON Structure: { \"title\": \"Quiz Title\", \"questions\": [ { \"id\": 1, \"question\": \"text\", \"type\": \"mcq\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"answer\": \"Correct Option\" } ] }",
            "Do NOT include a marking scheme or long text below the block unless requested. Hide data inside <quiz_data> tag."
          ].join("\n")
          : action === "slides"
            ? "Output format: slide titles + bullet content + short speaker notes."
            : action === "study"
              ? "Output format: a realistic plan with small steps."
              : action === "coach"
                ? "Output format: what to say/do at home, and a simple routine."
                : action === "message"
                  ? "Output format: a draft message with polite tone."
                  : action === "check"
                    ? "Output format: verdict first (Correct/Not quite), then a short explanation/hints."
                    : "Output format: short steps and one example if helpful.";

  return [who, style, checkPolicy, ctx, actionGuide].filter(Boolean).join("\n\n");
}

function userPrompt({ role, action, topic, message, attempt }) {
  const prefix =
    role === "educator"
      ? "Teacher request:"
      : role === "parent"
        ? "Parent request:"
        : "Student request:";

  const checkNote =
    role === "student" && action === "check"
      ? `Attempt: ${attempt || 0}/3. Follow the attempt policy strictly.`
      : "";

  const topicLine = topic ? `Topic focus: ${topic}` : "";

  return [prefix, checkNote, topicLine, message].filter(Boolean).join("\n");
}

async function callOpenRouter({ apiKey, messages }) {
  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages,
      temperature: 0.2,
      max_tokens: 900,
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

    const prompt = systemPrompt({ role, country, level, subject, topic, action, attempt, hasImage: !!imageDataUrl, teacherRules: body.teacherRules, sentiment: body.sentiment });
    const userText = userPrompt({ role, action, topic, message, attempt });

    const historyMessages = normalizeHistoryMessages(body?.messages, {
      role,
      action,
      attempt,
      currentUserText: message,
    });

    const userContent = hasImage
      ? [
        { type: "text", text: userText },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ]
      : userText;

    let { ok, data } = await callOpenRouter({
      apiKey,
      messages: [
        { role: "system", content: sys },
        ...historyMessages,
        { role: "user", content: userContent },
      ],
    });

    if (!ok) {
      const msg = data?.error?.message || data?.error || "AI request failed.";
      return res.status(500).json({ error: String(msg) });
    }

    let replyRaw = data?.choices?.[0]?.message?.content || "";

    // Only strip markdown if it's a standard text explanation.
    // We WANT markdown for quizzes, worksheets, lessons etc.
    const isStructured = isTeacherOnlyAction(action) || action === "quiz" || action === "assessment";
    let reply = isStructured
      ? normalizeMathToPlainText(replyRaw)
      : stripMarkdownToPlainText(normalizeMathToPlainText(replyRaw));

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
