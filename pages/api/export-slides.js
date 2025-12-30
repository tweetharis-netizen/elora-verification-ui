import pptxgen from "pptxgenjs";
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
    const title = clampStr(req.body?.title || "Elora Slides", 120);
    const content = clampStr(req.body?.content || "", 200000);

    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Elora";

    // Simple: split by blank lines into slides
    const blocks = content
      .split(/\n\s*\n/g)
      .map((b) => b.trim())
      .filter(Boolean);

    if (blocks.length === 0) blocks.push(content || " ");

    blocks.slice(0, 25).forEach((block, idx) => {
      const slide = pptx.addSlide();
      slide.addText(idx === 0 ? title : `Slide ${idx + 1}`, {
        x: 0.6, y: 0.4, w: 12.2, h: 0.6,
        fontFace: "Aptos Display",
        fontSize: 26,
        bold: true,
      });
      slide.addText(block, {
        x: 0.7, y: 1.3, w: 12.0, h: 5.2,
        fontFace: "Aptos",
        fontSize: 16,
        color: "1f2937",
      });
    });

    const file = await pptx.write("nodebuffer");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title.replace(/[^a-z0-9 _-]/gi, "").replace(/\s+/g, "-").slice(0, 60) || "Elora-Slides"}.pptx"`
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    return res.status(200).send(file);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to generate slides." });
  }
}
