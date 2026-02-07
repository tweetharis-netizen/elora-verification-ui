import { useState } from "react";

export default function EducatorDashboard() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState("");

  async function sendRequest() {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "Educator",
        country: "Singapore",
        level: "Primary",
        subject: "Math",
        task: "lesson",
        topic: "Fractions",
        message: text
      }),
    });

    const data = await res.json();
    setResponse(data.reply);
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Educator Dashboard</h2>

      <textarea
        placeholder="Ask Elora anything..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", height: 120 }}
      />

      <button onClick={sendRequest} style={{ marginTop: 10 }}>
        Ask Elora
      </button>

      <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 15, marginTop: 20 }}>
        {response}
      </pre>
    </div>
  );
}
