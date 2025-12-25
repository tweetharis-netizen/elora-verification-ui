import { NextResponse } from "next/server";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { role, country, level, subject, topic, mode, message } = req.body;

    // BASIC FAIL-SAFE
    const fallbackMessage =
      "Hi! I'm Elora 😊 I can help you plan lessons, create worksheets, build assessments, explain topics, and soon — generate Google Slides & Docs.";

    // If no message & no mode context
    if (!message && !mode) {
      return res.status(200).json({
        reply: fallbackMessage
      });
    }

    // Build structured system intelligence
    const systemContext = `
You are Elora — an AI Assistant designed for Education.
You ALWAYS:
• adapt to country curriculum
• respect education level
• choose classroom-friendly language
• stay structured, useful and practical
• think like a REAL teacher or student helper

Current profile context:
Role: ${role || "Not specified"}
Country: ${country || "Unknown"}
Level: ${level || "Unknown"}
Subject: ${subject || "Unknown"}
Topic: ${topic || "Unknown"}

If something important is missing,
ASK ONE CLEAR QUESTION instead of guessing.
`;

    // Build intelligent task instructions
    let taskInstruction = "";

    switch (mode) {
      case "lesson":
        taskInstruction = `
Create a COMPLETE lesson plan.
Include:
• learning objective
• introduction / hook
• teaching explanation
• guided practice
• independent practice
• differentiation ideas
• assessment
• exit ticket
• duration estimate
`;
        break;

      case "worksheet":
        taskInstruction = `
Create a printable worksheet.
Include:
• progressively challenging questions
• answers separate at bottom
• student friendly format
`;
        break;

      case "assessment":
        taskInstruction = `
Create an assessment test.
Include:
• mix of easy / medium / hard
• marking scheme
• common mistakes
• grading guidance
`;
        break;

      case "slides":
        taskInstruction = `
Create lesson content in SLIDE format.
Use:
Slide 1 — Title
Slide 2 — Objective
Slide 3+ — Teaching points
Last — Summary
`;
        break;

      case "explain":
        taskInstruction = `
Explain the topic in a simple way.
Then:
• give examples
• give practice questions
• give answers
`;
        break;

      case "custom":
      default:
        taskInstruction = "Help the user as best as possible.";
    }

    const finalPrompt = `
${systemContext}

USER REQUEST:
${message || "User clicked generate button based on selected options."}

TASK MODE:
${mode}

DO THIS NOW:
${taskInstruction}
`;

    // 🚨 IMPORTANT
    // If you're using OpenAI / Anthropic / anything — call it here.
    // For now we will simulate response so UI works fully.

    return res.status(200).json({
      reply: `✨ Elora is working with the following understanding:

Role: ${role || "Unknown"}
Country: ${country || "Unknown"}
Level: ${level || "Unknown"}
Subject: ${subject || "Unknown"}
Topic: ${topic || "Unknown"}
Mode: ${mode || "Not chosen"}

Here is what I would do next:

${taskInstruction}

Soon this will call a REAL AI engine — but the structure is ready.`
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}
