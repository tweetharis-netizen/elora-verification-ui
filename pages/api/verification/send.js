export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const backend = (process.env.NEXT_PUBLIC_ELORA_BACKEND_URL || "https://elora-website.vercel.app").replace(/\/$/, "");

  try {
    const r = await fetch(`${backend}/api/verification/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {}),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok || !data?.ok) {
      return res.status(r.status || 500).json({
        ok: false,
        error: data?.error || "email_send_failed",
        retryAfter: data?.retryAfter,
      });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: "backend_unreachable" });
  }
}
