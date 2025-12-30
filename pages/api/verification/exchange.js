import { getBackendBaseUrl, makeSessionCookie } from "@/lib/server/verification";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const code = String(req.body?.code || "").trim();
  if (!code) return res.status(400).json({ ok: false, error: "Missing code" });

  const base = getBackendBaseUrl();
  try {
    const r = await fetch(`${base}/api/verification/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      return res.status(r.status).json({ ok: false, error: data?.error || "Exchange failed." });
    }

    const token = String(data?.sessionToken || "");
    if (!token) return res.status(500).json({ ok: false, error: "Backend did not return session token." });

    res.setHeader("Set-Cookie", makeSessionCookie(token));
    return res.status(200).json({ ok: true, verified: true, email: String(data.email || "") });
  } catch {
    return res.status(500).json({ ok: false, error: "Backend unreachable." });
  }
}
