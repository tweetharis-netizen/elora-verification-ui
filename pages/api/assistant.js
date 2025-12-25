export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { role, country, level, subject, task, topic, message } = req.body;

    const basePrompt = `
You are Elora AI — a teaching assistant that builds lesson plans, worksheets, slides, assessments and learning explanations.
You ALWAYS answer based on the user's role and preferences.

Role: ${role || "Unknown"}
Country: ${country || "Unknown"}
Level: ${level || "Unknown"}
Subject: ${subject || "Unknown"}
Task: ${task || "General Help"}
Topic: ${topic || "Not Specified"}

If task = lesson → produce a structured lesson plan.
If task = worksheet → produce questions + answers.
If task = assessment → produce exam style questions.
If task = slides → produce structured slide bullet points.
If a custom question is asked, answer naturally while staying contextual.

User asked:
${message}
`;

    return res.status(200).json({ reply: basePrompt });

  } catch (err) {
    console.error("Assistant Error:", err);
    return res.status(500).json({ error: "Assistant crashed unexpectedly" });
  }
}
