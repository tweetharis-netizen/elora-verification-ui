import nodemailer from 'nodemailer';

/**
 * Sends an email using the SMTP settings in .env
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text?: string, html?: string }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: parseInt(process.env.EMAIL_SMTP_PORT || '465'),
    secure: process.env.EMAIL_SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return info;
}
