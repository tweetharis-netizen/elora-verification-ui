import { requireVerified } from "@/lib/server/verification";

export default async function handler(req, res) {
  const ok = await requireVerified(req, res);
  if (!ok) return;

  // Keep existing interface; route callers to main export endpoint if needed
  return res.status(200).json({ ok: true });
}
