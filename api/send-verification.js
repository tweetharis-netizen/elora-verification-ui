// 📁 File: pages/api/send-verification.js

import { getAuth } from 'firebase-admin/auth';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import nodemailer from 'nodemailer';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    })
  });
}

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const link = await getAuth().generateEmailVerificationLink(email);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `Elora <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Verify your email for Elora',
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; text-align: center;">
          <img src="https://elora-static.vercel.app/elora-logo.svg" alt="Elora Logo" width="50" style="margin-bottom: 1rem;" />
          <h2 style="color: #333;">Verify Your Email</h2>
          <p>Click the button below to verify your email address:</p>
          <a href="${link}" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; border-radius: 5px; text-decoration: none;">Verify Email</a>
          <p>If you didn’t request this, you can ignore this email.</p>
          <p style="color: #aaa; font-size: 12px; margin-top: 2rem;">&copy; 2026 Elora. All rights reserved.</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
