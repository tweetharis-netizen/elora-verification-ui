import crypto from "crypto";

function base64urlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecodeToString(input) {
  const normalized = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLen);
  return Buffer.from(padded, "base64").toString("utf8");
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function signEmailVerificationToken(payload, secret, ttlSeconds = 30 * 60) {
  if (!secret) throw new Error("Missing secret");
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
    v: 1
  };
  const encoded = base64urlEncode(JSON.stringify(body));
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest();
  return `${encoded}.${base64urlEncode(sig)}`;
}

export function verifyEmailVerificationToken(token, secret) {
  if (!secret) throw new Error("Missing secret");
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return null;
  const [encoded, sigB64] = parts;

  const expectedSig = crypto.createHmac("sha256", secret).update(encoded).digest();
  const expectedSigB64 = base64urlEncode(expectedSig);

  if (!timingSafeEqual(expectedSigB64, sigB64)) return null;

  let payload;
  try {
    payload = JSON.parse(base64urlDecodeToString(encoded));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload?.exp || payload.exp < now) return null;

  return payload;
}
