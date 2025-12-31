function json(res, code, payload) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function parseCookies(cookieHeader) {
  const out = {};
  const raw = String(cookieHeader || "");
  raw.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx < 0) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) return;
    out[k] = decodeURIComponent(v);
  });
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { ok: false, error: "method_not_allowed" });

  const backend = (process.env.NEXT_PUBLIC_ELORA_BACKEND_URL || "").replace(/\/$/, "");
  if (!backend) return json(res, 500, { ok: false, error: "missing_backend_url" });

  const cookies = parseCookies(req.headers.cookie);
  const sessionJwt = cookies.elora_session || "";

  if (!sessionJwt) return json(res, 200, { ok: true, verified: false });

  try {
    const r = await fetch(`${backend}/api/verification/status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${sessionJwt}` },
    });

    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.ok) return json(res, 200, { ok: true, verified: false });

    return json(res, 200, {
      ok: true,
      verified: !!data.verified,
      email: data.email || null,
    });
  } catch {
    return json(res, 200, { ok: true, verified: false });
  }
}
