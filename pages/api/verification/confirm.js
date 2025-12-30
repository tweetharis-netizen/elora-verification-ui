import { getBackendBaseUrl } from "@/lib/server/verification";

export default function handler(req, res) {
  const token = String(req.query?.token || "");
  if (!token) return res.redirect("/verify?error=invalid");

  const base = getBackendBaseUrl();
  return res.redirect(`${base}/api/verification/confirm?token=${encodeURIComponent(token)}`);
}
