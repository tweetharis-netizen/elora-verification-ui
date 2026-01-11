import { Document, Packer, Paragraph, TextRun } from "docx";
import { requireVerified } from "@/lib/server/verification";

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
    if (/^[-*]\s+/.test(line.trim())) {
      paras.push(
        new Paragraph({
          children: [new TextRun(line.trim().replace(/^[-*]\s+/, ""))],
          bullet: { level: 0 },
        })
      );
      continue;
    }

    // Numbered list lines: keep as plain text to avoid DOCX numbering config issues
    if (/^\d+\.\s+/.test(line.trim())) {
      paras.push(
        new Paragraph({
          children: [new TextRun(line.trim())],
        })
      );
      continue;
    }

    // Headings (markdown)
    if (/^#{1,6}\s+/.test(line.trim())) {
      const h = line.trim().replace(/^#{1,6}\s+/, "").trim();
      paras.push(
        new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 30 })],
          spacing: { after: 200 },
        })
      );
      continue;
    }

    // Default paragraph
    paras.push(
      new Paragraph({
        children: [new TextRun(line)],
      })
    );
  }

  return paras;
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

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: title, bold: true, size: 34 })],
              spacing: { after: 250 },
            }),
            ...toParagraphsFromMarkdownish(content),
          ],
        },
      ],
    });

    const buf = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${
        title
          .replace(/[^a-z0-9 _-]/gi, "")
          .replace(/\s+/g, "-")
          .slice(0, 60) || "Elora-Export"
      }.docx"`
    );

    return res.status(200).send(buf);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to generate DOCX." });
  }
}
