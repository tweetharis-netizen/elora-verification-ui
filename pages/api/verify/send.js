import nodemailer from "nodemailer";
import crypto from "crypto";

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signToken(payload, secret, ttlSeconds) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(body))}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${sig}`;
}

function getBaseUrl(req) {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] || "https").toString();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").toString();
  return `${proto}://${host}`.replace(/\/$/, "");
}

function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    const { email, pendingInvite } = req.body || {};
    const cleaned = String(email || "").trim().toLowerCase();
    if (!isEmailLike(cleaned)) return res.status(400).json({ error: "invalid_email" });

    const host = process.env.EMAIL_SMTP_HOST;
    const port = Number(process.env.EMAIL_SMTP_PORT || "465");
    const secure = String(process.env.EMAIL_SMTP_SECURE || "true") === "true";
    const user = process.env.EMAIL_SMTP_USER;
    const pass = process.env.EMAIL_SMTP_PASS;
    const from = process.env.EMAIL_FROM || user;
    const secret = process.env.ELORA_VERIFY_SECRET;

    const missing = [];
    if (!host) missing.push("EMAIL_SMTP_HOST");
    if (!user) missing.push("EMAIL_SMTP_USER");
    if (!pass) missing.push("EMAIL_SMTP_PASS");
    if (!from) missing.push("EMAIL_FROM");
    if (!secret) missing.push("ELORA_VERIFY_SECRET");
    if (missing.length) return res.status(500).json({ error: "missing_env", missing });

    const token = signToken(
      { email: cleaned, invite: pendingInvite || null },
      secret,
      60 * 30 // 30 minutes
    );

    const baseUrl = getBaseUrl(req);
    const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: cleaned,
      subject: "Verify your email for Elora",
      text: `Verify your email (expires in 30 minutes):\n${verifyUrl}`,
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111">
          <h2 style="margin:0 0 12px">Verify your email for Elora</h2>
          <p style="margin:0 0 16px">Click below to verify and unlock exports.</p>
          <p style="margin:0 0 24px">
            <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">
              Verify Email
            </a>
          </p>
          <p style="margin:0;color:#555">This link expires in 30 minutes.</p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("verify/send", err);
    return res.status(500).json({ error: "send_failed" });
  }
}
