// 📁 api/send-verification.js

import nodemailer from 'nodemailer';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Init Firebase Admin
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
    }),
  });
}

// CORS headers for fetch from frontend
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    const auth = getAuth();

    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        user = await auth.createUser({ email });
      } else {
        throw err;
      }
    }

    const link = await auth.generateEmailVerificationLink(email);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Elora" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email for Elora',
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px; line-height:1.6;">
          <h2 style="color: #6c63ff;">Welcome to Elora 👋</h2>
          <p>Click below to verify your email:</p>
          <a href="${link}" style="
            background:#6c63ff;color:white;padding:12px 20px;border-radius:6px;
            text-decoration:none;font-weight:bold;
          ">Verify Email</a>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-verification error:', err);
    return res.status(500).json({ error: err.message });
  }
}
