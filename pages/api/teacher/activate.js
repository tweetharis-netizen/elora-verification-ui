import { getBackendBaseUrl, getSessionTokenFromReq, requireVerified } from "@/lib/server/verification";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Must be verified before teacher redemption.
  const status = await requireVerified(req, res);
  if (!status) return;

  const code = String(req.body?.code || "").trim();
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
    });

    const data = await r.json().catch(() => null);

    if (!r.ok || !data?.ok) {
      // Normalize a few common backend errors to the frontend vocabulary.
      const err = String(data?.error || "invalid_invite");
      const mapped =
        err === "invalid_code"
          ? "invalid_invite"
          : err === "teacher_invites_not_configured"
          ? "invite_not_configured"
          : err;
      return res.status(r.status || 400).json({ ok: false, error: mapped });
    }

    // Backend persisted role in KV; frontend will reflect it via /api/session/status.
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false, error: "backend_unreachable" });
  }
}
