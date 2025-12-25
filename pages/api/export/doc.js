import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const token = JSON.parse(req.cookies.elora_google_token || "{}");
    if (!token.access_token) return res.status(401).json({ error: "Not Connected to Google" });

    const { title, content } = req.body;

    const auth = new google.auth.OAuth2();
    auth.setCredentials(token);

    const docs = google.docs({ version: "v1", auth });

    const doc = await docs.documents.create({
      requestBody: { title }
    });

    await docs.documents.batchUpdate({
      documentId: doc.data.documentId,
      requestBody: {
        requests: [{
          insertText: {
            location: { index: 1 },
            text: content
          }
        }]
      }
    });

    return res.status(200).json({
      success: true,
      url: `https://docs.google.com/document/d/${doc.data.documentId}`
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to export Google Doc" });
  }
}
