import { useState } from "react";

export default function EducatorDashboard() {
  const [aiText, setAiText] = useState("");

  async function download(file, body) {
    const res = await fetch(`/api/${file}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      file === "export-slides"
        ? "Elora-Slides.pptx"
        : file === "export-worksheet"
        ? "Elora-Worksheet.docx"
        : "Elora-Lesson.docx";

    a.click();
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Elora Educator Dashboard</h1>

      <textarea
        value={aiText}
        onChange={(e) => setAiText(e.target.value)}
        placeholder="Elora generated lesson / worksheet / slides content will appear here…"
        style={{
          width: "100%",
          height: 250,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 20,
        }}
      />

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() =>
            download("export-docx", {
              title: "Elora Lesson Plan",
              content: aiText,
            })
          }
        >
          Download Lesson (.docx)
        </button>

        <button
          onClick={() =>
            download("export-worksheet", {
              title: "Elora Worksheet",
              questions: aiText.split("\n").slice(0, 10),
            })
          }
        >
          Download Worksheet (.docx)
        </button>

        <button
          onClick={() =>
            download("export-slides", {
              title: "Elora Slides",
              slides: [
                {
                  title: "Lesson Overview",
                  points: aiText.split("\n").slice(0, 5),
                },
                {
                  title: "Key Learning Points",
                  points: aiText.split("\n").slice(5, 10),
                },
              ],
            })
          }
        >
          Download Slides (.pptx)
        </button>
      </div>
    </div>
  );
}
