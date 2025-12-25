import PptxGenJS from "pptxgenjs";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { title, slides } = req.body;
    const pptx = new PptxGenJS();

    slides.forEach(slideData => {
      const slide = pptx.addSlide();
      slide.addText(slideData.title, {
        x: 0.5,
        y: 0.3,
        fontSize: 28,
        bold: true,
      });

      slide.addText(slideData.points.join("\n"), {
        x: 0.5,
        y: 1.2,
        fontSize: 18,
      });
    });

    const buffer = await pptx.write("nodebuffer");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", 'attachment; filename="Elora-Slides.pptx"');
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate slides" });
  }
}
