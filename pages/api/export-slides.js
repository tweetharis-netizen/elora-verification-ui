import PptxGenJS from "pptxgenjs";

function clampStr(v, max = 120000) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length <= max ? s : s.slice(0, max);
}

function splitOutlineToSlides(text) {
  // Accept either artifact-driven UI or plain markdown:
  // We try to split by headings; fallback to chunking.
  const lines = (text || "").split("\n").map((l) => l.replace(/\r/g, ""));
  const slides = [];
  let current = { title: "Slide", bullets: [] };

  const push = () => {
    if (current.title || current.bullets.length) slides.push(current);
    current = { title: "Slide", bullets: [] };
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^#{1,6}\s+/.test(line)) {
      push();
      current.title = line.replace(/^#{1,6}\s+/, "").trim() || "Slide";
      continue;
    }

    if (/^Slide\s*\d+[:\-]/i.test(line)) {
      push();
      current.title = line.replace(/^Slide\s*\d+[:\-]\s*/i, "").trim() || "Slide";
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      current.bullets.push(line.replace(/^[-*]\s+/, "").trim());
      continue;
    }

    // Default: treat as bullet
    current.bullets.push(line);
  }

  push();

  // Keep sane limits
  return slides.filter((s) => s.title || s.bullets.length).slice(0, 14);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const title = clampStr(req.body?.title || "Elora Slides", 120);
    const content = clampStr(req.body?.content || "", 120000);

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Elora";

    const outlineSlides = splitOutlineToSlides(content);

    // Title slide
    let s0 = pptx.addSlide();
    s0.addText(title, { x: 0.8, y: 1.6, w: 11.7, h: 0.8, fontSize: 36, bold: true });

    // Content slides
    for (const s of outlineSlides) {
      const slide = pptx.addSlide();
      slide.addText(s.title || "Slide", { x: 0.7, y: 0.5, w: 12, h: 0.6, fontSize: 28, bold: true });

      const bullets = (s.bullets || []).slice(0, 8).map((b) => b.trim()).filter(Boolean);
      const text = bullets.length ? bullets.map((b) => `• ${b}`).join("\n") : "• (Add content)";

      slide.addText(text, {
        x: 0.9,
        y: 1.3,
        w: 12.0,
        h: 5.2,
        fontSize: 18,
        valign: "top"
      });
    }

    const buf = await pptx.write("nodebuffer");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title.replace(/[^a-z0-9 _-]/gi, "").replace(/\s+/g, "-").slice(0, 60) || "Elora-Slides"}.pptx"`
    );

    return res.status(200).send(buf);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to generate PPTX." });
  }
}
