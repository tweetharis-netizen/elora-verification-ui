import crypto from "crypto";

function b64urlToJson(part) {
  const padded = part.replace(/-/g, "+").replace(/_/g, "/");
  const buf = Buffer.from(padded + "===".slice((padded.length + 3) % 4), "base64");
  return JSON.parse(buf.toString("utf8"));
}

function constantTimeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifyToken(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("bad_token");

  const [h, p, s] = parts;
  const header = b64urlToJson(h);
  if (!header || header.alg !== "HS256") throw new Error("bad_alg");

  const toSign = `${h}.${p}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(toSign)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (!constantTimeEqual(expected, s)) throw new Error("bad_sig");

  const payload = b64urlToJson(p);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) throw new Error("expired");
  if (!payload.email) throw new Error("no_email");
  return payload;
}

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const token = req.query?.token;
  const secret = process.env.ELORA_VERIFY_SECRET;
  if (!secret) return res.status(500).json({ error: "missing_secret" });

  try {
    const payload = verifyToken(token, secret);
    return res.status(200).json({
      ok: true,
      email: String(payload.email).toLowerCase(),
      invite: payload.invite || null,
    });
  } catch (e) {
    return res.status(400).json({ ok: false, error: "invalid_or_expired" });
  }
}
