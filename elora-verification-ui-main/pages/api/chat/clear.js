import { getSessionTokenFromReq, getBackendBaseUrl } from "@/lib/server/verification";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const token = getSessionTokenFromReq(req);
  if (!token) {
    res.status(401).json({ ok: false, error: "missing_session" });
    return;
  }

  const backend = getBackendBaseUrl();

  try {
    const r = await fetch(`${backend}/api/chat/clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await r.json().catch(() => null);
    res.status(r.status).json(data || { ok: false, error: "bad_response" });
  } catch {
    res.status(502).json({ ok: false, error: "backend_unreachable" });
  }
}
