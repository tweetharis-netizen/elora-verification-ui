import { getBackendBaseUrl, getSessionTokenFromReq, requireVerified } from "@/lib/server/verification";

function readCode(req) {
  // Support BOTH:
  // - GET /api/teacher-invite?code=GENESIS2026
  // - POST /api/teacher-invite  { code: "GENESIS2026" }
  const fromQuery = Array.isArray(req?.query?.code) ? req.query.code[0] : req?.query?.code;
  const fromBody = req?.body?.code;
  return String(fromBody || fromQuery || "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Must be verified before teacher redemption.
  const status = await requireVerified(req, res);
  if (!status) return;

  const code = readCode(req);
  if (!code) return res.status(400).json({ ok: false, error: "missing_code" });

  const backend = getBackendBaseUrl();
  const sessionToken = getSessionTokenFromReq(req);
  if (!sessionToken) return res.status(401).json({ ok: false, error: "missing_session" });

  try {
    const r = await fetch(`${backend}/api/teacher/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });

    const data = await r.json().catch(() => null);

    if (!r.ok || !data?.ok) {
      const err = String(data?.error || "invalid_code");
      return res.status(r.status || 401).json({ ok: false, error: err });
    }

    return res.status(200).json({ ok: true, role: data?.role || "teacher" });
  } catch {
    return res.status(502).json({ ok: false, error: "backend_unreachable" });
  }
}
