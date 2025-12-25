// pages/api/assistant.js
//
// Backend for Elora Assistant.
// Turns structured options (role, country, level, subject, topic, task, message)
// into a single prompt and optionally calls OpenAI.
//
// If OPENAI_API_KEY is NOT set, Elora will fall back to a built-in
// template generator so the prototype still works.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { role, country, level, subject, topic, mode, message, guest } =
      req.body || {};

    const safeRole = role || "educator";
    const safeCountry = country || "Unknown country";
    const safeLevel = level || "General level";
    const safeSubject = subject || "General subject";
    const safeTopic = topic || "General topic";
    const safeMode = mode || "lesson";
    const userMessage =
      (message && String(message).trim()) ||
      buildDefaultPrompt({
        role: safeRole,
        country: safeCountry,
        level: safeLevel,
        subject: safeSubject,
        topic: safeTopic,
        mode: safeMode,
      });

    const profileSummary = `Role: ${safeRole}, Country: ${safeCountry}, Level: ${safeLevel}, Subject: ${safeSubject}, Topic: ${safeTopic}, Task: ${safeMode}, Guest mode: ${
      guest ? "yes" : "no"
    }`;

    const openaiKey = process.env.OPENAI_API_KEY;

    // If no key -> smart offline template so demo always works
    if (!openaiKey) {
      const offline = buildOfflineReply({
        role: safeRole,
        country: safeCountry,
        level: safeLevel,
        subject: safeSubject,
        topic: safeTopic,
        mode: safeMode,
        message: userMessage,
      });
      return res.status(200).json({
        ok: true,
        engine: "offline-template",
        profile: profileSummary,
        message: offline,
      });
    }

    const systemPrompt =
      "You are Elora, an AI teaching assistant designed for schools. " +
      "You always structure your answers clearly for teachers, students or parents. " +
      "Use the provided profile (country, level, subject, topic, task type) to make your answer specific and practical. " +
      "Avoid asking the user to write long prompts; instead, make decisions for them and offer concrete content.";

    const body = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Teaching profile:\n" +
            profileSummary +
            "\n\nRequest:\n" +
            userMessage +
            "\n\nPlease answer in clear sections with headings and bullet points where helpful.",
        },
      ],
      temperature: 0.5,
      max_tokens: 900,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      const fallback = buildOfflineReply({
        role: safeRole,
        country: safeCountry,
        level: safeLevel,
        subject: safeSubject,
        topic: safeTopic,
        mode: safeMode,
        message: userMessage,
      });
      return res.status(200).json({
        ok: false,
        engine: "offline-fallback",
        profile: profileSummary,
        message:
          fallback +
          "\n\n(Elora note: The live AI engine is not configured yet. This is a smart template response.)",
      });
    }

    const data = await response.json();
    const aiMessage =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    if (!aiMessage) {
      const fallback = buildOfflineReply({
        role: safeRole,
        country: safeCountry,
        level: safeLevel,
        subject: safeSubject,
        topic: safeTopic,
        mode: safeMode,
        message: userMessage,
      });
      return res.status(200).json({
        ok: false,
        engine: "offline-empty",
        profile: profileSummary,
        message: fallback,
      });
    }

    return res.status(200).json({
      ok: true,
      engine: "openai",
      profile: profileSummary,
      message: aiMessage.trim(),
    });
  } catch (err) {
    console.error("Unexpected error in /api/assistant:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
      message:
        "Something went wrong inside Elora. Please try again in a moment.",
    });
  }
}

function buildDefaultPrompt({ role, country, level, subject, topic, mode }) {
  const roleLabel = roleLabelFor(role);

  const base =
    `You are helping a ${roleLabel} from ${country}. ` +
    `The class level is ${level}, subject is ${subject}, topic is "${topic}".`;

  switch (mode) {
    case "worksheet":
      return (
        base +
        " Create a printable student worksheet with 10–15 questions of mixed difficulty, with answers at the end."
      );
    case "assessment":
      return (
        base +
        " Design a short assessment (quiz/test) with marking scheme and clear rubrics."
      );
    case "slides":
      return (
        base +
        " Outline a set of 8–12 lesson slides with slide titles and bullet points for each slide."
      );
    case "explain":
      return (
        base +
        " Explain this topic step-by-step in very simple language, with worked examples."
      );
    default:
      return (
        base +
        " Plan a complete lesson including objectives, warm-up, main teaching, guided practice, independent practice, and exit ticket."
      );
  }
}

function roleLabelFor(role) {
  if (!role) return "teacher";
  if (role === "student") return "student";
  if (role === "parent") return "parent";
  return "teacher";
}

function buildOfflineReply({ role, country, level, subject, topic, mode }) {
  const header = `Here is a ${
    mode || "lesson"
  } plan for ${level || "your class"} (${
    subject || "subject"
  }) on "${topic || "this topic"}" in ${country || "your syllabus"}.\n\n`;

  const lessonSections =
    "- **Learning objectives**: 2–3 clear goals written in student-friendly language.\n" +
    "- **Warm-up (5–10 min)**: Quick review question or discussion to activate prior knowledge.\n" +
    "- **Concept launch**: Short explanation with 1–2 simple examples.\n" +
    "- **Guided practice**: Work through a few questions together with the class.\n" +
    "- **Independent practice**: Students try questions on their own while you circulate.\n" +
    "- **Exit ticket**: 2–3 quick questions to check understanding at the end.";

  if (mode === "worksheet") {
    return (
      header +
      "Worksheet structure:\n" +
      "- 3 easy questions to build confidence.\n" +
      "- 5 medium questions to check understanding.\n" +
      "- 2 challenge questions for stronger students.\n" +
      "- Space for working on each question.\n" +
      "- Answer key on a separate page so you can share or keep it private."
    );
  }

  if (mode === "assessment") {
    return (
      header +
      "Assessment outline:\n" +
      "- 5 short-answer questions testing key ideas.\n" +
      "- 3 structured questions that require showing working.\n" +
      "- 1 challenge / real-world problem.\n" +
      "- Simple marking scheme (1–4 marks per question) with notes on common mistakes."
    );
  }

  if (mode === "slides") {
    return (
      header +
      "Suggested slides:\n" +
      "1. **Title & objectives**\n" +
      "2. **Starter question / hook**\n" +
      "3. **Key idea 1** with example\n" +
      "4. **Key idea 2** with example\n" +
      "5. **Guided practice questions**\n" +
      "6. **Common mistakes & tips**\n" +
      "7. **Independent practice instructions**\n" +
      "8. **Exit ticket / summary**"
    );
  }

  if (mode === "explain") {
    return (
      header +
      "Explanation structure:\n" +
      "- Start with a simple definition.\n" +
      "- Give a real-life analogy students can recognise.\n" +
      "- Show 2 worked examples, step-by-step.\n" +
      "- Add 3 quick practice questions for the student to try.\n" +
      "- Finish with a short summary of the key idea."
    );
  }

  // Default: lesson plan
  return (
    header +
    "Lesson outline:\n" +
    lessonSections +
    "\n\nTip: You can ask Elora to turn this into a worksheet, assessment or slide deck in the next message."
  );
}
