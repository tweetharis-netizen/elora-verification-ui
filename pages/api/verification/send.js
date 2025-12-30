// pages/api/verification/send.js
import nodemailer from "nodemailer";
import crypto from "crypto";

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}
function sign(payload, secret) {
  const json = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", secret).update(json).digest("base64url");
  return `${b64url(json)}.${sig}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const { email } = req.body || {};
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Enter a valid email." });
  }

  const SITE = process.env.NEXT_PUBLIC_SITE_URL;
  const SECRET = process.env.VERIFY_TOKEN_SECRET;

  if (!SITE || !SECRET) {
    return res.status(500).json({ ok: false, error: "Missing NEXT_PUBLIC_SITE_URL or VERIFY_TOKEN_SECRET in env." });
  }

  const token = sign(
    {
      email,
      exp: Date.now() + 15 * 60 * 1000, // 15 minutes
      nonce: crypto.randomBytes(12).toString("hex")
    },
    SECRET
  );

  const link = `${SITE.replace(/\/$/, "")}/verify?token=${encodeURIComponent(token)}`;

  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: Number(process.env.EMAIL_SMTP_PORT || 465),
    secure: String(process.env.EMAIL_SMTP_SECURE || "true") === "true",
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS
    }
  });

  const from = process.env.EMAIL_FROM || process.env.EMAIL_SMTP_USER;

  await transport.sendMail({
    from: `Elora <${from}>`,
    to: email,
    subject: "Verify your email for Elora",
    text: `Verify your email for Elora:\n\n${link}\n\nThis link expires in 15 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2>Welcome to Elora</h2>
        <p>Please verify your email to continue.</p>
        <p>
          <a href="${link}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#6c63ff;color:white;text-decoration:none;font-weight:700">
            Verify Email
          </a>
        </p>
        <p style="color:#666;font-size:12px">This link expires in 15 minutes.</p>
      </div>
    `
  });

  return res.status(200).json({ ok: true });
}
