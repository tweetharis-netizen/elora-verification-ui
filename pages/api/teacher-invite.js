import { getSessionTokenFromReq, fetchBackendStatus, getBackendBaseUrl } from "@/lib/server/verification";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const token = getSessionTokenFromReq(req);
  if (!token) return res.status(401).json({ ok: false, error: "missing_session" });

  // Ensure user is verified before redeeming teacher access (backend also checks).
  const status = await fetchBackendStatus(token);
  if (!status.verified) return res.status(403).json({ ok: false, error: "not_verified" });

  const code = String(req.body?.code || "").trim();

  try {
    const backend = getBackendBaseUrl();
    const r = await fetch(`${backend}/api/teacher/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });

    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.ok) {
      return res.status(r.status || 400).json({
        ok: false,
        error: data?.error || "invalid_code",
      });
    }

    const role = String(data?.role || "regular").toLowerCase();
    return res.status(200).json({ ok: true, role, teacher: role === "teacher" });
  } catch {
    return res.status(500).json({ ok: false, error: "backend_unreachable" });
  }
}
