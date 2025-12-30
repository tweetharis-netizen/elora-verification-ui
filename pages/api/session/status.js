import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";

export default async function handler(req, res) {
  const token = getSessionTokenFromReq(req);
  const status = await fetchBackendStatus(token);
  res.status(200).json(status);
}
