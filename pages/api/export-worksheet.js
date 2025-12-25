import { Document, Packer, Paragraph, HeadingLevel } from "docx";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { title, questions } = req.body;

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: title || "Elora Worksheet",
              heading: HeadingLevel.HEADING1,
            }),
            ...questions.map(
              (q, i) =>
                new Paragraph({
                  text: `${i + 1}. ${q}`,
                })
            ),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", 'attachment; filename="Elora-Worksheet.docx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate worksheet" });
  }
}
