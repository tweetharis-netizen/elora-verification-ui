import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";

export default async function handler(req, res) {
  const token = getSessionTokenFromReq(req);
  const status = await fetchBackendStatus(token);

  const accountRole = String(status.role || (status.verified ? "regular" : "guest")).toLowerCase();
  const teacher = accountRole === "teacher";

  res.status(200).json({
    ok: true,
    verified: Boolean(status.verified),
    email: status.email || "",
    // Backwards-compatible field name (server-side role, NOT UI persona role)
    role: accountRole,
    // Preferred explicit name (avoids collision with UI persona role)
    accountRole,
    teacher,
    hasSession: Boolean(token),
  });
}
