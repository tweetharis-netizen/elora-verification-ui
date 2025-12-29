import nodemailer from "nodemailer";
import { signEmailVerificationToken } from "../../lib/server/emailVerification";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const secret = process.env.SESSION_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const token = signEmailVerificationToken({ email }, secret, 3600);
  const verifyUrl = `${appUrl}/verify?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your email for Elora",
    html: `
      <div style="font-family:Arial,sans-serif;padding:20px">
        <h2>Welcome to Elora</h2>
        <p>Please verify your email to continue.</p>
        <a href="${verifyUrl}"
           style="background:#4f46e5;color:#fff;padding:12px 18px;border-radius:8px;
                  text-decoration:none;display:inline-block;">Verify Email</a>
        <p style="margin-top:20px;font-size:14px;color:#666;">
          This link expires in 60 minutes.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email" });
  }
}
