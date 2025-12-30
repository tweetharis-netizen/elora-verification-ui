// pages/api/verification/confirm.js
import crypto from "crypto";

function verifyToken(token, secret) {
  const [payloadB64, sig] = (token || "").split(".");
  if (!payloadB64 || !sig) return { ok: false };

  const json = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expected = crypto.createHmac("sha256", secret).update(json).digest("base64url");
  if (expected !== sig) return { ok: false };

  const payload = JSON.parse(json);
  if (!payload?.email || !payload?.exp) return { ok: false };
  if (Date.now() > payload.exp) return { ok: false, reason: "expired", email: payload.email };

  return { ok: true, email: payload.email };
}

export default function handler(req, res) {
  const SECRET = process.env.VERIFY_TOKEN_SECRET;
  if (!SECRET) return res.status(500).send("Missing VERIFY_TOKEN_SECRET");

  const { token } = req.query;
  const out = verifyToken(token, SECRET);

  if (!out.ok) {
    return res.redirect(`/verify?error=${encodeURIComponent(out.reason || "invalid")}`);
  }

  // We redirect to /verified to set localStorage on client (most reliable UI “remember”)
  return res.redirect(`/verified?email=${encodeURIComponent(out.email)}`);
}
