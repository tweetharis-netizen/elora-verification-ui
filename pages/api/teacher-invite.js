import {
  requireVerified,
  makeTeacherCookie,
  clearTeacherCookie,
} from "@/lib/server/verification";

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

  // Must be verified first
  const v = await requireVerified(req, res);
  if (!v?.verified) return;

  const code = String(req.body?.code || "").trim();
  const codes = normalizeCodes(process.env.TEACHER_INVITE_CODES);

  // allow clearing teacher access (empty code)
  if (!code) {
    res.setHeader("Set-Cookie", clearTeacherCookie());
    return res.status(200).json({ ok: true, teacher: false });
  }

  // Reject user pasting the full env list
  if (code.includes(",")) {
    return res.status(400).json({
      ok: false,
      error: "enter_single_code",
    });
  }

  if (!codes.length) {
    res.setHeader("Set-Cookie", clearTeacherCookie());
    return res.status(500).json({
      ok: false,
      error: "teacher_invites_not_configured",
    });
  }

  const ok = codes.includes(code);

  if (!ok) {
    res.setHeader("Set-Cookie", clearTeacherCookie());
    return res.status(401).json({ ok: false, error: "invalid_code" });
  }

  res.setHeader("Set-Cookie", makeTeacherCookie());
  return res.status(200).json({ ok: true, teacher: true });
}
