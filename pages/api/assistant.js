// pages/api/assistant.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      role,
      country,
      level,
      subject,
      topic,
      taskType,
      mode,
      message,
      userMessage,
    } = req.body || {};

    const finalTaskType = taskType || mode || "lesson";
    const question = (userMessage || message || "").trim();

    // Small helper to make headings
    const header = (text) => `### ${text}\n`;
    const bullet = (text) => `- ${text}\n`;

    let reply = "";

    // If user typed a custom question, answer it directly
    if (question) {
      reply += `**Here’s a clear way to respond to that question:**\n\n`;
      reply += `**Student question:** ${question}\n\n`;
      reply += header("1. Short explanation");
      reply += bullet(
        `Explain it in simple language that matches **${level || "the student’s level"}** and the **${subject || "subject"}**.`
      );
      reply += `\n`;
      reply += header("2. Example you can use");
      reply += bullet(
        `Give 1–2 concrete examples that fit **${topic || "this topic"}** so students can see it in action.`
      );
      reply += `\n`;
      reply += header("3. Check for understanding");
      reply += bullet(
        `Ask 1–2 quick questions to see if they understood (exit ticket style).`
      );
      reply += `\n`;
      reply += `You can tweak this answer in your own words so it sounds like you, but the structure above will keep it clear and student-friendly.`;
    } else {
      // No custom question – generate by task type
      const contextLine = `Role: ${role || "Educator"} · Country: ${
        country || "Your country"
      } · Level: ${level || "Your level"} · Subject: ${
        subject || "Your subject"
      } · Topic: ${topic || "Your topic"}`;

      if (finalTaskType === "lesson") {
        reply += `**Structured lesson plan for:** ${contextLine}\n\n`;
        reply += header("Lesson objectives");
        reply += bullet("Write 2–3 clear, student-friendly objectives.");
        reply += `\n`;
        reply += header("Warm-up / hook");
        reply += bullet(
          "1 short activity or question to activate prior knowledge."
        );
        reply += `\n`;
        reply += header("Main teaching points");
        reply += bullet("Key idea 1 with simple explanation + example.");
        reply += bullet("Key idea 2 with simple explanation + example.");
        reply += `\n`;
        reply += header("Guided practice");
        reply += bullet("2–4 questions you work through together.");
        reply += `\n`;
        reply += header("Independent practice");
        reply += bullet("4–8 practice questions with increasing difficulty.");
        reply += `\n`;
        reply += header("Exit ticket / reflection");
        reply += bullet("1–2 quick questions or reflection prompts.");
      } else if (finalTaskType === "worksheet") {
        reply += `**Worksheet for practice** — ${contextLine}\n\n`;
        reply += header("Section A: Core skills");
        reply += bullet("4–6 short questions on fundamentals.");
        reply += `\n`;
        reply += header("Section B: Application");
        reply += bullet("3–4 word problems or applied questions.");
        reply += `\n`;
        reply += header("Section C: Challenge");
        reply += bullet(
          "1–2 higher-order thinking questions for stronger students."
        );
        reply += `\n`;
        reply += header("Answer key");
        reply += bullet("Provide clear, step-by-step answers for each item.");
      } else if (finalTaskType === "assessment") {
        reply += `**Assessment outline** — ${contextLine}\n\n`;
        reply += header("Part A: Multiple choice");
        reply += bullet("6–10 MCQ focusing on key concepts.");
        reply += `\n`;
        reply += header("Part B: Short answer");
        reply += bullet("4–6 short-answer questions for understanding.");
        reply += `\n`;
        reply += header("Part C: Extended response / problem");
        reply += bullet(
          "1–2 longer questions that require explanation, reasoning or showing steps."
        );
        reply += `\n`;
        reply += header("Marking guide");
        reply += bullet(
          "Include marks for each question and brief notes on what earns full credit."
        );
      } else if (finalTaskType === "slides") {
        reply += `**Slides outline** — ${contextLine}\n\n`;
        reply += bullet("Slide 1: Title + lesson objectives.");
        reply += bullet("Slide 2: Starter / hook question.");
        reply += bullet("Slides 3–4: Key idea 1 with visuals + example.");
        reply += bullet("Slides 5–6: Key idea 2 with visuals + example.");
        reply += bullet("Slides 7–8: Guided practice questions.");
        reply += bullet("Slide 9: Common mistakes + tips.");
        reply += bullet("Slide 10: Exit ticket / summary.");
        reply += `\nYou can adjust the number of slides, but follow this flow so it feels structured and classroom-ready.`;
      } else {
        // Fallback generic
        reply += `I’m ready to help you create lessons, worksheets, assessments or explanations.\n\n`;
        reply += `You can either choose a task on the left or type a question below.`;
      }
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Assistant error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong inside Elora Assistant." });
  }
}
