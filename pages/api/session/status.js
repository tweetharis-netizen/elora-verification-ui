import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";

export default async function handler(req, res) {
  const token = getSessionTokenFromReq(req);
  const status = await fetchBackendStatus(token);

  res.status(200).json({
    ok: true,
    verified: Boolean(status.verified),
    email: status.email || "",
    role: status.role || (status.verified ? "regular" : "guest"),
    hasSession: Boolean(token),
  });
}
