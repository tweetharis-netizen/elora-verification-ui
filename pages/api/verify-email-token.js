import { verifyEmailVerificationToken } from "../../lib/server/emailVerification";

export default async function handler(req, res) {
  const { token } = req.query;
  const secret = process.env.SESSION_SECRET;

  if (!token) return res.status(400).json({ error: "Missing token" });

  const payload = verifyEmailVerificationToken(token, secret);
  if (!payload) return res.status(401).json({ error: "Invalid or expired token" });

  // Redirect to assistant or success page
  res.redirect(`/assistant?verified=true&email=${payload.email}`);
}
