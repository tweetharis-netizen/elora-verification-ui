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

  const backend = String(process.env.NEXT_PUBLIC_ELORA_BACKEND_URL || "").replace(/\/$/, "");
  if (!backend) return json(res, 500, { ok: false, error: "backend_not_configured" });

  const cookies = parseCookies(req.headers.cookie);
  const sessionJwt = cookies.elora_session || "";
  const teacherCookie = cookies.elora_teacher || "";

  if (!sessionJwt) return json(res, 200, { ok: true, verified: false, teacher: false });

  try {
    const r = await fetch(`${backend}/api/verification/status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${sessionJwt}` },
    });

    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.ok) return json(res, 200, { ok: true, verified: false, teacher: false });

    const verified = !!data.verified;
    const email = typeof data.email === "string" ? data.email : null;

    const teacher = verified && teacherCookie === "1";

    return json(res, 200, { ok: true, verified, email, teacher });
  } catch {
    return json(res, 200, { ok: true, verified: false, teacher: false });
  }
}
