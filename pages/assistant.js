import { useEffect, useState } from "react";

export default function Assistant() {
  const [role, setRole] = useState("student");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "elora", text: "Hi! I’m Elora. How can I help you today?" }
  ]);

  useEffect(() => {
    const stored = localStorage.getItem("eloraUserProfile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRole(parsed.role || "student");
      } catch {}
    }
  }, []);

  function getEloraResponse(message) {
    const lower = message.toLowerCase();

    // TEACHER MODE
    if (role === "teacher") {
      if (lower.includes("lesson") || lower.includes("plan")) {
        return `Here’s a simple lesson structure you can use:

• Learning Objective  
• Warm-up question  
• Main concept explanation  
• Guided practice  
• Independent practice  
• Exit ticket  

Tell me the subject and level, and I’ll tailor it.`;
      }

      if (lower.includes("fraction")) {
        return `For fractions, start with real-life examples (pizza, sharing).
Use visuals, then move to number representation.
Would you like activities or worksheets next?`;
      }

      return `I can help with lesson planning, explanations, activities, and assessments.
What are you teaching?`;
    }

    // STUDENT MODE
    if (lower.includes("answer")) {
      return `I can help guide you, but I won’t give direct answers.
Tell me what part you’re stuck on.`;
    }

    if (lower.includes("fraction")) {
      return `A fraction shows parts of a whole.
For example, 1/2 means one part out of two equal parts.
Want a visual example?`;
    }

    return `I can explain concepts, give hints, or help you practice.
What topic are you learning?`;
  }

  function handleSend() {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    const eloraMsg = { from: "elora", text: getEloraResponse(input) };

    setMessages([...messages, userMsg, eloraMsg]);
    setInput("");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xl">
        <h1 className="text-xl font-semibold text-center">Elora AI Assistant</h1>
        <p className="text-sm text-center text-gray-500 mb-4">
          Role: {role}
        </p>

        <div className="space-y-3 mb-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl text-sm ${
                m.from === "user"
                  ? "bg-indigo-600 text-white text-right"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-xl px-3 py-2 text-sm"
            placeholder="Ask Elora something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={handleSend}
            className="bg-indigo-600 text-white px-4 rounded-xl"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
