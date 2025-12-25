import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const token = JSON.parse(req.cookies.elora_google_token || "{}");
    if (!token.access_token) return res.status(401).json({ error: "Not Connected to Google" });

    const { title, content } = req.body;

    const auth = new google.auth.OAuth2();
    auth.setCredentials(token);

    const slides = google.slides({ version: "v1", auth });

    const pres = await slides.presentations.create({
      requestBody: { title }
    });

    await slides.presentations.batchUpdate({
      presentationId: pres.data.presentationId,
      requestBody: {
        requests: [{
          createShape: {
            objectId: "textBox_1",
            shapeType: "TEXT_BOX",
            elementProperties: { pageObjectId: pres.data.slides[0].objectId },
          }
        },
        {
          insertText: {
            objectId: "textBox_1",
            text: content
          }
        }]
      }
    });

    return res.status(200).json({
      success: true,
      url: `https://docs.google.com/presentation/d/${pres.data.presentationId}`
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to export Google Slides" });
  }
}
