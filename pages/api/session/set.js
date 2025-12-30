import { makeSessionCookie } from "@/lib/server/verification";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = String(req.body?.token || "");
  if (!token) return res.status(400).json({ error: "Missing token" });

  res.setHeader("Set-Cookie", makeSessionCookie(token));
  return res.status(200).json({ ok: true });
}
