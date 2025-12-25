// pages/api/assistant.js
//
// Single brain for:
// - Prompt builder (lesson / worksheet / assessment / slides)
// - Free chat with context
//
// NOTE: To actually use OpenAI, set OPENAI_API_KEY in Vercel project env vars.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    role,
    country,
    level,
    subject,
    topic,
    action = "lesson",
    message = "",
  } = req.body || {};

  const safeRole = role || "educator";
  const safeCountry = country || "Singapore";
  const safeLevel = level || "Primary (1–6)";
  const safeSubject = subject || "Math";
  const safeTopic = topic || "General teaching help";

  const profileSummary = `Role: ${safeRole}, Country: ${safeCountry}, Level: ${safeLevel}, Subject: ${safeSubject}, Topic: ${safeTopic}`;

  // This is what we return if the AI API fails or is not configured.
  const fallback = buildFallbackReply({
    profileSummary,
    action,
    message,
  });

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // No real AI key yet – still give a structured answer instead of crashing.
    return res.status(200).json({ reply: fallback, usedFallback: true });
  }

  try {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt({
      profileSummary,
      action,
      message,
    });

    const openAiReply = await callOpenAI(apiKey, systemPrompt, userPrompt);
    return res.status(200).json({
      reply: openAiReply || fallback,
      usedFallback: !openAiReply,
    });
  } catch (err) {
    console.error("Assistant error:", err);
    return res.status(200).json({ reply: fallback, usedFallback: true });
  }
}

function buildSystemPrompt() {
  return (
    "You are Elora, an AI teaching assistant built for real classrooms. " +
    "You help educators, students, and parents by generating clear, safe, " +
    "age-appropriate content: lesson plans, worksheets, assessments, slides " +
    "outlines, and explanations.\n\n" +
    "Requirements:\n" +
    "1) Always adapt to the given role (educator / student / parent).\n" +
    "2) Use the country and level to match syllabus style and difficulty.\n" +
    "3) When action = lesson, return a structured lesson plan with sections.\n" +
    "4) When action = worksheet, return practice questions with answers.\n" +
    "5) When action = assessment, return a short assessment plus marking guide.\n" +
    "6) When action = slides, return slide-by-slide bullet points.\n" +
    "7) When action = explain or chat, answer naturally but keep context in mind.\n" +
    "8) Keep formatting simple: use headings, bullet lists, and numbered steps.\n"
  );
}

function buildUserPrompt({ profileSummary, action, message }) {
  const baseContext =
    `Teaching profile:\n${profileSummary}\n\n` +
    `Action: ${action}\n`;

  if (!message || message.trim().length === 0) {
    // Structured generation from the left panel
    switch (action) {
      case "worksheet":
        return (
          baseContext +
          "Generate a printable worksheet with practice questions and answers. " +
          "Include a clear title, sections by difficulty, and an answer key."
        );
      case "assessment":
        return (
          baseContext +
          "Create a short assessment suitable for grading. Include marks per question " +
          "and a brief marking scheme."
        );
      case "slides":
        return (
          baseContext +
          "Design a lesson as a slide deck outline. Return slide-by-slide headings and bullet points. " +
          "Do NOT include slide numbers, just clear sections."
        );
      case "explain":
        return (
          baseContext +
          "Explain this topic in a way the learner can understand. Use simple language and examples."
        );
      case "custom":
        return (
          baseContext +
          "Create whatever would be most useful for this profile (lesson + quick practice), " +
          "even though the teacher did not specify exactly what they want."
        );
      case "lesson":
      default:
        return (
          baseContext +
          "Generate a complete lesson plan with objectives, warm-up, main explanation, " +
          "guided practice, independent practice, and exit ticket."
        );
    }
  }

  // Free-form chat question
  return (
    baseContext +
    "The user has this request or question. Answer directly, using the profile context.\n\n" +
    `User question: """${message.trim()}"""\n`
  );
}

async function callOpenAI(apiKey, systemPrompt, userPrompt) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    console.error("OpenAI HTTP error:", resp.status, await resp.text());
    return null;
  }

  const data = await resp.json();
  const content =
    data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message;
  if (!content) return null;
  return typeof content === "string" ? content : String(content);
}

function buildFallbackReply({ profileSummary, action, message }) {
  const base =
    `I don't currently have access to the live AI model, so I'll give you a manual template you can still use.\n\n` +
    `${profileSummary}\n\n`;

  if (!message || message.trim().length === 0) {
    if (action === "worksheet") {
      return (
        base +
        "Worksheet template:\n\n" +
        "1. Title & learning objective\n" +
        "2. 5–10 warm-up questions\n" +
        "3. 5 core practice questions\n" +
        "4. 3–5 challenge questions\n" +
        "5. Answer key\n"
      );
    }
    if (action === "assessment") {
      return (
        base +
        "Assessment template:\n\n" +
        "• Section A: 5 short questions (1–2 marks each)\n" +
        "• Section B: 3 structured questions (4–6 marks each)\n" +
        "• Marking scheme with expected answers\n"
      );
    }
    if (action === "slides") {
      return (
        base +
        "Slides outline template:\n\n" +
        "1. Title & objectives\n" +
        "2. Starter question / hook\n" +
        "3. Key idea 1 with example\n" +
        "4. Key idea 2 with example\n" +
        "5. Guided practice questions\n" +
        "6. Common mistakes & tips\n" +
        "7. Independent practice instructions\n" +
        "8. Exit ticket / summary\n"
      );
    }
    if (action === "explain" || action === "custom") {
      return (
        base +
        "Use this flow:\n\n" +
        "1. Start with a one-sentence summary.\n" +
        "2. Give a simple definition.\n" +
        "3. Add 1–2 concrete examples.\n" +
        "4. Highlight 2 common mistakes.\n" +
        "5. End with a short practice question and answer.\n"
      );
    }

    // default lesson plan
    return (
      base +
      "Lesson plan template:\n\n" +
      "1. Lesson title & learning objectives\n" +
      "2. Warm-up / hook\n" +
      "3. Main explanation (step-by-step)\n" +
      "4. Guided practice (do together)\n" +
      "5. Independent practice (students work alone)\n" +
      "6. Exit ticket / reflection\n"
    );
  }

  // Fallback for a free question
  return (
    base +
    "Here is a safe, structured way to respond to that question:\n\n" +
    `User question: "${message.trim()}"\n\n` +
    "1. Restate the question in simple terms.\n" +
    "2. Give a clear explanation using the level and subject.\n" +
    "3. Provide 1–2 short examples.\n" +
    "4. Suggest a quick practice task the user could try.\n"
  );
}
