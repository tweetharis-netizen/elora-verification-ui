export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { prompt } = req.body;

  // TEMPORARY FREE LOGIC (no OpenAI cost yet)
  // This keeps Elora usable while you decide models later
  if (!prompt || prompt.length < 20) {
    return res.json({
      reply:
        "Tell me a little more about what you want to teach, and I’ll help you design it properly.",
    });
  }

  // Simple deterministic response (replace later with AI)
  return res.json({
    reply: `
Here is a structured lesson outline you can use:

1. Learning Objective
2. Warm-up question
3. Main explanation
4. Guided practice
5. Independent activity
6. Exit ticket / assessment

If you want, I can now:
• Turn this into slides
• Create worksheets
• Align it to your country’s syllabus
• Differentiate for weaker or advanced learners
`,
  });
}
