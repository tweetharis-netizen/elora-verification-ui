import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const code = req.query.code;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    return res.status(200).json({
      success: true,
      message: "Google connected successfully",
      tokens
    });

  } catch (err) {
    console.error("Google OAuth Error:", err);
    return res.status(500).json({ error: "Google OAuth Failed" });
  }
}
