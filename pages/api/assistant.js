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
      mode,
      message,
      history = []
    } = req.body;

    // SAFETY FALLBACK
    const fallback = "I'm here to help with education. Can you clarify what you’d like to do? (lesson, worksheet, assessment, explanation)";

    // Build strong system intelligence
    let systemContext = `
You are Elora — an elite AI assistant built for education.
You always:
• Think logically
• Explain clearly
• Act like a professional assistant, not just a chatbot

ROLES:
Teacher → structured, classroom ready, professional tone
Student → helpful, kind, supportive tutor tone
Parent → empathetic, explains clearly, supportive tone

CONTEXT FACTORS:
Country: ${country || "Not provided"}
Level: ${level || "Not provided"}
Subject: ${subject || "Not provided"}
Topic: ${topic || "Not provided"}

MODES:
Lesson → provide structured lesson
Worksheet → questions + answers
Assessment → exam style
Slides → bullet-point structured content
Explain → tutoring style explanation
Conversation → natural assistant chat
`;

    // Decide brain behavior
    let taskInstruction = "";

    if (mode === "lesson") {
      taskInstruction = `
Create a full TEACHING LESSON.
Must include:
• Objective
• Hook / starter
• Key explanations
• Examples
• Guided practice
• Independent practice
• Exit ticket
• Teacher tips
`;
    } 
    else if (mode === "worksheet") {
      taskInstruction = `
Create a printable worksheet.
Must include:
• 10–15 questions
• Increasing difficulty
• Answer key
`;
    } 
    else if (mode === "assessment") {
      taskInstruction = `
Create an exam style test.
Must include:
• Mixed question types
• Clear marking scheme
`;
    } 
    else if (mode === "slides") {
      taskInstruction = `
Create lesson slides structure.
Must include:
• Slide titles
• Bullet points
• Speaker notes
`;
    } 
    else if (mode === "explain") {
      taskInstruction = `
Explain like a world-class tutor.
Use:
• Simple language
• Steps
• Examples
`;
    } 
    else {
      taskInstruction = `
You are now in CONVERSATION MODE.
Answer naturally. Understand context. Be helpful.
`;
    }

    const finalPrompt = `
${systemContext}

Task:
${taskInstruction}

User asked:
"${message}"

REMEMBER:
• Be helpful
• Be smart
• Never repeat same thing twice
• If user asks WHY, explain reasoning
• If confused, ask a clarifying question
`;

    // ----- MODEL (uses OpenAI compatible endpoints) -----
    // If using OpenAI:
    // Requires process.env.OPENAI_API_KEY in Vercel env

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        Authorization:`Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model:"gpt-4o-mini",
        messages:[
          ...history,
          { role:"system", content: finalPrompt }
        ]
      })
    });

    const data = await completion.json();

    if (!data?.choices?.[0]?.message?.content) {
      return res.status(200).json({ reply: fallback });
    }

    return res.status(200).json({
      reply: data.choices[0].message.content
    });

  } catch (err) {
    console.log("Assistant error", err);
    return res.status(500).json({
      reply: "Something went wrong — but it's not your fault. Please try again."
    });
  }
}
