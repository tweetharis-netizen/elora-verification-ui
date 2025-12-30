import { Document, Packer, Paragraph, TextRun } from "docx";
import { requireVerified } from "@/lib/server/verification";

function clampStr(v, max = 200000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

export default async function handler(req, res) {
  const ok = await requireVerified(req, res);
  if (!ok) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const title = clampStr(req.body?.title || "Elora Export", 120);
    const content = clampStr(req.body?.content || "", 200000);

    const paragraphs = [];
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 36 })],
      })
    );
    paragraphs.push(new Paragraph(""));

    for (const lineRaw of content.split("\n")) {
      const line = lineRaw.replace(/\r/g, "");
      if (!line.trim()) {
        paragraphs.push(new Paragraph(""));
        continue;
      }
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: line })] }));
    }

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title.replace(/[^a-z0-9 _-]/gi, "").replace(/\s+/g, "-").slice(0, 60) || "Elora-Export"}.docx"`
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    return res.status(200).send(buffer);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to generate DOCX." });
  }
}
