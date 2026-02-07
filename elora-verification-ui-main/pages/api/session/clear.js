import { clearSessionCookie } from "@/lib/server/verification";
import { clearTeacherCookie } from "@/lib/server/teacher";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Clear verification + teacher cookies in one shot.
  res.setHeader("Set-Cookie", [clearSessionCookie(), clearTeacherCookie()]);
  return res.status(200).json({ ok: true });
}
