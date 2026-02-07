import { requireVerified } from "@/lib/server/verification";

export default async function handler(req, res) {
  const ok = await requireVerified(req, res);
  if (!ok) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Existing behavior preserved (placeholder)
  return res.status(200).json({ ok: true });
}
