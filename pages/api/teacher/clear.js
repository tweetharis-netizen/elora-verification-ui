import { getBackendBaseUrl, getSessionTokenFromReq } from "@/lib/server/verification";
import { clearTeacherCookie } from "@/lib/server/teacher";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Always clear legacy teacher cookie too (safe cleanup).
  res.setHeader("Set-Cookie", clearTeacherCookie());

  const backend = getBackendBaseUrl();
  const sessionToken = getSessionTokenFromReq(req);

  // Best-effort: if no session, nothing to clear on backend.
  if (!sessionToken) return res.status(200).json({ ok: true });

  try {
    // Backend supports clearing teacher role by sending an empty code.
    const r = await fetch(`${backend}/api/teacher/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ code: "" }),
      cache: "no-store",
    });

    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.ok) {
      return res.status(200).json({ ok: true }); // don't hard-fail UX
    }

    return res.status(200).json({ ok: true, role: data?.role || "regular" });
  } catch {
    return res.status(200).json({ ok: true });
  }
}
