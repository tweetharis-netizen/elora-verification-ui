import { requireVerified } from "@/lib/server/verification";
import { signTeacherCookiePayload, makeTeacherCookie } from "@/lib/server/teacher";

function normalizeCodes(raw) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Must be verified first.
  const verification = await requireVerified(req, res);
  if (!verification) return; // requireVerified already responded 403

  const code = String(req.body?.code || "").trim();
  if (!code) return res.status(400).json({ ok: false, error: "missing_code" });

  const allowList = normalizeCodes(process.env.TEACHER_INVITE_CODES);
  if (!allowList.length) {
    return res.status(500).json({ ok: false, error: "invite_not_configured" });
  }

  if (!allowList.includes(code)) {
    return res.status(401).json({ ok: false, error: "invalid_invite" });
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
  return res.status(200).json({ ok: true });
}
