import nodemailer from "nodemailer";
import { signEmailVerificationToken } from "../../lib/server/emailVerification";

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function isValidEmail(email) {
  const s = String(email || "").trim();
  if (s.length < 3 || s.length > 254) return false;
  const at = s.indexOf("@");
  if (at <= 0 || at !== s.lastIndexOf("@")) return false;
  const dot = s.lastIndexOf(".");
  if (dot < at + 2 || dot === s.length - 1) return false;
  return true;
}

function getBaseUrl(req) {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || "https";
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  return `${proto}://${host}`;
}

function buildTransport() {
  const { ELORA_GMAIL_USER, ELORA_GMAIL_APP_PASSWORD } = process.env;

  if (ELORA_GMAIL_USER && ELORA_GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: ELORA_GMAIL_USER,
        pass: ELORA_GMAIL_APP_PASSWORD
      }
    });
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const email = String(req.body?.email || "").trim();
  const invite = String(req.body?.invite || "").trim();

  if (!isValidEmail(email)) return json(res, 400, { ok: false, error: "invalid_email" });

  const secret = process.env.ELORA_EMAIL_TOKEN_SECRET || process.env.SESSION_SECRET;
  if (!secret) return json(res, 500, { ok: false, error: "missing_secret" });

  const transporter = buildTransport();
  if (!transporter) {
    return json(res, 500, {
      ok: false,
      error: "missing_mail_config",
      hint: "Set ELORA_GMAIL_USER + ELORA_GMAIL_APP_PASSWORD in Vercel env vars."
    });
  }

  const baseUrl = getBaseUrl(req);
  const token = signEmailVerificationToken({ email, invite }, secret, 30 * 60);
  const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

  const from = process.env.ELORA_EMAIL_FROM || `Elora <${process.env.ELORA_GMAIL_USER}>`;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: "Verify your email for Elora",
      text: `Click to verify (expires in 30 min): ${verifyUrl}`,
      html: `
        <div style="font-family:Arial; padding:24px;">
          <h2>Verify your email for Elora</h2>
          <p>This link expires in 30 minutes.</p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 16px;background:#4f46e5;color:white;border-radius:10px;text-decoration:none;font-weight:700;">
            Verify Email
          </a>
        </div>
      `
    });
  } catch (err) {
    return json(res, 500, { ok: false, error: "send_failed", hint: String(err?.message || err) });
  }

  return json(res, 200, { ok: true });
}
