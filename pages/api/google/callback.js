import { google } from "googleapis";
import { serialize } from "cookie";

export default async function handler(req, res) {
  const code = req.query.code;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);

  res.setHeader("Set-Cookie", serialize("elora_google_token", JSON.stringify(tokens), {
    httpOnly: true,
    path: "/",
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7
  }));

  return res.redirect("/dashboard/educator");
}
