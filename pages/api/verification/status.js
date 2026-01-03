import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";

export default async function handler(req, res) {
  const token = getSessionTokenFromReq(req);
  const status = await fetchBackendStatus(token);

  // Backwards-compatible shape for any old UI code that calls /api/verification/status
  res.status(200).json({
    ok: true,
    verified: Boolean(status.verified),
    email: status.email || "",
    role: status.role || (status.verified ? "regular" : "guest"),
    teacher: String(status.role || "").toLowerCase() === "teacher",
  });
}
