import { clearSessionCookie, clearTeacherCookie } from "@/lib/server/verification";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  res.setHeader("Set-Cookie", [clearSessionCookie(), clearTeacherCookie()]);
  return res.status(200).json({ ok: true });
}
