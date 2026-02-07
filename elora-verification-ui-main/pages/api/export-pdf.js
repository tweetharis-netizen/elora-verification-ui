import { requireVerified } from "@/lib/server/verification";

// pdfkit is CommonJS in many environments; Next/Vercel bundling can vary.
// This wrapper makes it work regardless of default export behavior.
const PDFKit = require("pdfkit");
const PDFDocument = PDFKit?.default || PDFKit;

function clampStr(v, max = 200000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function safeFilename(name) {
  const cleaned = String(name || "")
    .replace(/[^a-z0-9 _-]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return cleaned || "Elora-Export";
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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename(title)}.pdf"`);

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 54, bottom: 54, left: 54, right: 54 },
    });

    // Stream directly to the response.
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
      if (/^[-*]\s+/.test(line.trim())) {
        doc.text(`• ${line.trim().replace(/^[-*]\s+/, "")}`);
      } else {
        doc.text(line);
      }
    }

    doc.end();
  } catch (e) {
    // If headers were already sent (stream started), end the response cleanly.
    try {
      if (!res.headersSent) res.status(500).json({ error: "Failed to generate PDF." });
      else res.end();
    } catch {}
  }
}
