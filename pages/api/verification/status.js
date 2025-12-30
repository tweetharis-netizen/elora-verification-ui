function parseCookie(cookieHeader) {
  const out = {};
  const s = String(cookieHeader || "");
  s.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

export default async function handler(req, res) {
  const backend = (process.env.NEXT_PUBLIC_ELORA_BACKEND_URL || "https://elora-website.vercel.app").replace(/\/$/, "");
  const cookies = parseCookie(req.headers.cookie || "");
  const session = cookies.elora_session || "";

  if (!session) return res.status(200).json({ ok: true, verified: false });

  try {
    const r = await fetch(`${backend}/api/verification/status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${session}` },
    });
    const data = await r.json().catch(() => null);
    return res.status(200).json({ ok: true, verified: !!data?.verified, email: data?.email || null });
  } catch {
    return res.status(200).json({ ok: true, verified: false });
  }
}
