import { Document, Packer, Paragraph, TextRun } from "docx";

function clampStr(v, max = 200000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function toParagraphsFromMarkdownish(text) {
  const lines = (text || "").split("\n");
  const paras = [];

  for (const raw of lines) {
    const line = raw.replace(/\r/g, "").trimEnd();

    if (!line.trim()) {
      paras.push(new Paragraph({ children: [new TextRun(" ")] }));
      continue;
    }

    // Basic bullets
    if (/^[-*]\s+/.test(line)) {
      paras.push(
        new Paragraph({
          children: [new TextRun(line.replace(/^[-*]\s+/, ""))],
          bullet: { level: 0 }
        })
      );
      continue;
    }

    // Basic numbered
    if (/^\d+\.\s+/.test(line)) {
      paras.push(
        new Paragraph({
          children: [new TextRun(line.replace(/^\d+\.\s+/, ""))],
          numbering: { reference: "num", level: 0 }
        })
      );
      continue;
    }

    // Headings (markdown)
    if (/^#{1,6}\s+/.test(line)) {
      const h = line.replace(/^#{1,6}\s+/, "").trim();
      paras.push(
        new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 30 })],
          spacing: { after: 200 }
        })
      );
      continue;
    }

    // Default paragraph
    paras.push(
      new Paragraph({
        children: [new TextRun(line)]
      })
    );
  }

  return paras;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const title = clampStr(req.body?.title || "Elora Export", 120);
    const content = clampStr(req.body?.content || "", 200000);

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: title, bold: true, size: 34 })],
              spacing: { after: 250 }
            }),
            ...toParagraphsFromMarkdownish(content)
          ]
        }
      ]
    });

    const buf = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title.replace(/[^a-z0-9 _-]/gi, "").replace(/\s+/g, "-").slice(0, 60) || "Elora-Export"}.docx"`
    );

    return res.status(200).send(buf);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to generate DOCX." });
  }
}
