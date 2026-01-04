import { clearTeacherCookie } from "@/lib/server/teacher";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Clears the signed teacher cookie (and also clears any legacy value since name matches).
  res.setHeader("Set-Cookie", clearTeacherCookie());
  return res.status(200).json({ ok: true });
}
