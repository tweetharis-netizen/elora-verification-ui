import crypto from "crypto";

function base64urlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  return Buffer.from(input, "base64").toString();
}

export function signEmailVerificationToken(payload, secret, ttlSeconds = 3600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = { ...payload, exp };
  const data = base64urlEncode(JSON.stringify(body));
  const sig = base64urlEncode(
    crypto.createHmac("sha256", secret).update(data).digest()
  );
  return `${data}.${sig}`;
}

export function verifyEmailVerificationToken(token, secret) {
  if (!token || !secret) return null;
  const [data, sig] = token.split(".");
  const expectedSig = base64urlEncode(
    crypto.createHmac("sha256", secret).update(data).digest()
  );
  if (expectedSig !== sig) return null;
  const payload = JSON.parse(base64urlDecode(data));
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
