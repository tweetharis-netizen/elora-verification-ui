import { requireVerified } from "@/lib/server/verification";
import { signTeacherCookiePayload, makeTeacherCookie, clearTeacherCookie } from "@/lib/server/teacher";

function normalizeCodes(raw) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function readCode(req) {
  // Support BOTH:
  // - GET /api/teacher-invite?code=GENESIS2026   (used by assistant/success)
  // - POST /api/teacher-invite  { code: "GENESIS2026" } (used by settings)
  const fromQuery = Array.isArray(req?.query?.code) ? req.query.code[0] : req?.query?.code;
  const body = req?.body;
  const fromBody =
    typeof body === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(body);
            return parsed?.code;
          } catch {
            return "";
          }
        })()
      : body?.code;

  return String(fromBody || fromQuery || "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const allowList = normalizeCodes(process.env.TEACHER_INVITE_CODES);
  if (!allowList.length) {
    return res.status(500).json({ ok: false, error: "teacher_invites_not_configured" });
  }

  const codeRaw = readCode(req);
  const codesToTry = normalizeCodes(codeRaw);
  if (!codesToTry.length) {
    return res.status(400).json({ ok: false, error: "missing_code" });
  }

  // Teacher access is only meaningful for verified users.
  const verification = await requireVerified(req, res);
  if (!verification) return; // requireVerified already responded

  const ok = codesToTry.some((c) => allowList.includes(c));
  if (!ok) {
    res.setHeader("Set-Cookie", clearTeacherCookie());
    return res.status(401).json({ ok: false, error: "invalid_code" });
  }

  const secret = process.env.ELORA_TEACHER_COOKIE_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    return res.status(500).json({ ok: false, error: "teacher_cookie_secret_missing" });
  }

  const token = signTeacherCookiePayload(
    { teacher: true, email: verification.email },
    secret,
    60 * 60 * 24 * 30
  );

  res.setHeader("Set-Cookie", makeTeacherCookie(token));
  return res.status(200).json({ ok: true, teacher: true });
}
