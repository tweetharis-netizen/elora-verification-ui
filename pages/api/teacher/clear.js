import { getBackendBaseUrl, getSessionTokenFromReq } from "@/lib/server/verification";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const backend = getBackendBaseUrl();
  const sessionToken = getSessionTokenFromReq(req);

  // Best-effort: clear teacher role on backend.
  // If there’s no session token, we still return ok (UI will refresh state to non-teacher).
  if (!sessionToken) {
    return res.status(200).json({ ok: true });
  }

  try {
    const r = await fetch(`${backend}/api/teacher/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ code: "" }), // empty code => clear teacher role (backend behavior)
      cache: "no-store",
    });

    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.ok) {
      return res.status(200).json({ ok: true }); // do not hard-fail logout/clear flows
    }

    return res.status(200).json({ ok: true, role: data?.role || "regular" });
  } catch {
    return res.status(200).json({ ok: true });
  }
}
