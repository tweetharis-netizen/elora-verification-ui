export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const backend = (process.env.NEXT_PUBLIC_ELORA_BACKEND_URL || "https://elora-website.vercel.app").replace(/\/$/, "");

  try {
    const r = await fetch(`${backend}/api/verification/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {}),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok) return res.status(r.status).json({ ok: false, error: data?.error || "Failed" });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Backend unreachable" });
  }
}
