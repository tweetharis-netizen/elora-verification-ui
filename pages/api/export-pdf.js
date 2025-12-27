import PDFDocument from "pdfkit";

function clampStr(v, max = 200000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const title = clampStr(req.body?.title || "Elora Export", 120);
    const content = clampStr(req.body?.content || "", 200000);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title.replace(/[^a-z0-9 _-]/gi, "").replace(/\s+/g, "-").slice(0, 60) || "Elora-Export"}.pdf"`
    );

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 54, bottom: 54, left: 54, right: 54 }
    });

    doc.pipe(res);

    doc.fontSize(18).text(title, { underline: false });
    doc.moveDown(1);

    doc.fontSize(11);

    const lines = content.split("\n");
    for (const raw of lines) {
      const line = raw.replace(/\r/g, "");
      if (!line.trim()) {
        doc.moveDown(0.6);
        continue;
      }

      // Simple bullet rendering
      if (/^[-*]\s+/.test(line.trim())) {
        doc.text(`• ${line.trim().replace(/^[-*]\s+/, "")}`);
      } else {
        doc.text(line);
      }
    }

    doc.end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to generate PDF." });
  }
}
