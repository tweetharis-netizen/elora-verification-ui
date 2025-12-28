// pages/api/teacher-invite.js
export default function handler(req, res) {
  const { code } = req.query;
  const valid =
    process.env.ELORA_TEACHER_INVITE_CODES?.split(',') || [];
  if (valid.includes(code)) {
    return res.status(200).json({ ok: true });
  }
  return res.status(403).json({ error: 'Invalid invite code' });
}
