import { useEffect, useState } from "react";

export default function AssistantPage() {
  const [role, setRole] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "elora", text: "Hi! I’m Elora. How can I help you today?" },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("eloraUserProfile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRole(parsed.role);
      } catch {}
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          message: input,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { from: "elora", text: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          from: "elora",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 flex flex-col">
        <h1 className="text-xl font-semibold text-center">
          Elora AI Assistant
        </h1>
        <p className="text-sm text-center text-gray-500">
          Role: <span className="font-semibold">{role}</span>
        </p>

        <div className="mt-4 flex-1 overflow-y-auto space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl max-w-[80%] ${
                m.from === "user"
                  ? "ml-auto bg-indigo-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Elora something..."
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
