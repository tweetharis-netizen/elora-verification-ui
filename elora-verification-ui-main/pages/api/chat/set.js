import { getSessionTokenFromReq, getBackendBaseUrl } from "@/lib/server/verification";

// Simple mock AI logic for standalone mode
function generateMockResponse(prompt) {
  const p = prompt.toLowerCase();
  
  if (p.includes("quiz")) {
    return "I can certainly help with a quiz! Here's a quick one to test your knowledge:\n\n**Question 1:** What is the powerhouse of the cell?\nA) Nucleus\nB) Mitochondria\nC) Ribosome\n\nReply with your answer!";
  }
  
  if (p.includes("explain")) {
    return "Here's a simple explanation: Imagine the concept as a building block. When you put many together, they form a structure. Is there a specific part you'd like me to elaborate on?";
  }
  
  if (p.includes("plan") || p.includes("lesson")) {
    return "I've drafted a lesson plan for you:\n\n**Objective:** Understand key concepts.\n**Warm-up (5 min):** Quick discussion.\n**Main Activity (20 min):** Group work.\n**Plenary (5 min):** Review.\n\nWould you like to add any resources to this?";
  }

  return "I'm Elora, your AI learning assistant. I'm currently running in **Demo Mode**, so I can't access my full brain, but I'm here to help demonstrate the interface! Try asking for a 'quiz' or 'explanation'.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const token = getSessionTokenFromReq(req);
  // In demo mode, we might not have a token, but let's be lenient
  // if (!token) { ... } 

  const backend = getBackendBaseUrl();
  const { messages, prompt } = req.body;
  const userMessage = prompt || (messages && messages[messages.length - 1]?.text) || "";

  // Try backend first (if configured)
  try {
    if (backend && backend !== "http://localhost:3000") { // Avoid self-loop if misconfigured
        const r = await fetch(`${backend}/api/chat/set`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body || {}),
        });

        if (r.ok) {
            const data = await r.json();
            return res.status(200).json(data);
        }
    }
  } catch (e) {
    // Backend failed, fall through to mock
  }

  // Fallback: Mock AI Response
  // Simulate network delay for realism
  await new Promise(r => setTimeout(r, 1000));

  const replyText = generateMockResponse(userMessage);

  res.status(200).json({
    ok: true,
    reply: {
      from: "elora",
      text: replyText,
      ts: Date.now()
    }
  });
}
