function json(res, code, payload) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "method_not_allowed" });

  const backend = (process.env.NEXT_PUBLIC_ELORA_BACKEND_URL || "").replace(/\/$/, "");
  if (!backend) return json(res, 500, { ok: false, error: "missing_backend_url" });

  const email = String(req.body?.email || "").trim();
  if (!email) return json(res, 400, { ok: false, error: "missing_email" });

  try {
    const r = await fetch(`${backend}/api/verification/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await r.json().catch(() => null);

    // Always return consistent JSON shape to the UI
    if (!r.ok || !data?.ok) {
      return json(res, r.status || 400, {
        ok: false,
        error: data?.error || "send_failed",
        retryAfter: data?.retryAfter ?? null,
      });
    }

    return json(res, 200, data);
  } catch {
    return json(res, 502, { ok: false, error: "backend_unreachable" });
  }
}
