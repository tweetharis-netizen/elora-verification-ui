// pages/api/teacher-invite.js
export default function handler(req, res) {
  const raw = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
  const code = (raw || "").toString().trim();

  if (!code) {
    return res.status(400).json({ ok: false, error: "Missing invite code" });
  }

  const allowlist = (process.env.ELORA_TEACHER_INVITE_CODES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowlist.length === 0) {
    return res
      .status(500)
      .json({ ok: false, error: "Invite codes not configured on server" });
  }

  if (allowlist.includes(code)) {
    return res.status(200).json({ ok: true });
  }

  return res.status(403).json({ ok: false, error: "Invalid invite code" });
}
