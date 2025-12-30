import { getBackendBaseUrl } from "@/lib/server/verification";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const email = String(req.body?.email || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Enter a valid email." });
  }

  const base = getBackendBaseUrl();
  try {
    const r = await fetch(`${base}/api/verification/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      return res.status(r.status).json({ ok: false, error: data?.error || "Failed to send." });
    }
    return res.status(200).json({ ok: true, ...data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Backend unreachable." });
  }
}
