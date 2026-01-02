import { getSessionTokenFromReq, fetchBackendStatus } from "@/lib/server/verification";
import { isTeacherFromReq } from "@/lib/server/teacher";

export default async function handler(req, res) {
  const token = getSessionTokenFromReq(req);
  const status = await fetchBackendStatus(token);
  const teacher = isTeacherFromReq(req);

  res.status(200).json({
    ...status,
    teacher,
    hasSession: Boolean(token),
  });
}
