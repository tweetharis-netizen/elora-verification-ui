import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I’m Elora 👋 What would you like help with today?"
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 👇 THIS IS handleSend()
  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    setMessages(prev => [
      ...prev,
      { role: "user", content: userMessage }
    ]);

    // 🔒 Elora builds the REAL prompt here (user never sees this)
    const structuredPrompt = `
You are Elora, an expert AI assistant built to support educators.

User request:
"${userMessage}"

Respond with:
- Clear structure
- Classroom-ready output
- Practical examples
- Friendly but professional tone
- Focus on teaching effectiveness
`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: structuredPrompt })
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, I couldn’t generate a response."
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-1">Elora AI Assistant</h1>
        <p className="text-sm text-gray-500 mb-4">Role: Teacher</p>

        <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                msg.role === "assistant"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-indigo-500 text-white text-right"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Elora something..."
            className="flex-1 border rounded-lg px-4 py-2"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
