import { useState } from "react";

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      sender: "elora",
      text: "Hi! I'm Elora 💙 I build lessons, worksheets, assessments and explain topics. Tell me what you need — or use the planner below 👇"
    }
  ]);

  const [role, setRole] = useState("Educator");
  const [country, setCountry] = useState("Singapore");
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("");

  const [input, setInput] = useState("");

  const sendToAPI = async (messageText, modeOverride) => {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role,
        country,
        level,
        subject,
        topic,
        mode: modeOverride || mode,
        message: messageText
      })
    });

    const data = await response.json();

    setMessages(prev => [
      ...prev,
      { sender: "elora", text: data.reply || "Something went wrong." }
    ]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();

    setMessages(prev => [...prev, { sender: "user", text: userMessage }]);

    await sendToAPI(userMessage);

    setInput("");
  };

  const handleStructuredGenerate = async (chosenMode) => {
    setMode(chosenMode);

    setMessages(prev => [
      ...prev,
      {
        sender: "user",
        text: `Generate: ${chosenMode} for ${country}, ${level}, ${subject}, topic: ${topic}`
      }
    ]);

    await sendToAPI("", chosenMode);
  };

  return (
    <div style={{ padding: "40px", display: "flex", gap: "30px" }}>
      {/* LEFT = CHAT */}
      <div style={{
        width: "55%",
        background: "white",
        borderRadius: "10px",
        padding: "20px"
      }}>
        <h2>Elora Assistant 💙</h2>
        <div style={{ height: "500px", overflowY: "auto", border: "1px solid #ddd", padding: "10px" }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                textAlign: m.sender === "user" ? "right" : "left",
                marginBottom: "12px"
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: m.sender === "user" ? "#6C63FF" : "#F2F2FF",
                  color: m.sender === "user" ? "white" : "black",
                  maxWidth: "70%"
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Elora anything..."
            style={{ flex: 1, padding: "10px" }}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>

      {/* RIGHT = CONTROL PANEL */}
      <div style={{
        width: "45%",
        background: "white",
        borderRadius: "10px",
        padding: "20px"
      }}>
        <h2>Teaching Planner</h2>

        <label>Role</label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option>Educator</option>
          <option>Student</option>
          <option>Parent</option>
        </select>

        <label>Country</label>
        <select value={country} onChange={e => setCountry(e.target.value)}>
          <option>Singapore</option>
          <option>USA</option>
          <option>UK</option>
          <option>Australia</option>
          <option>India</option>
          <option>Malaysia</option>
        </select>

        <label>Education Level</label>
        <input value={level} onChange={e => setLevel(e.target.value)} placeholder="e.g. Primary 5" />

        <label>Subject</label>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Math" />

        <label>Topic</label>
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions" />

        <h3>What do you want to create?</h3>

        <div style={{ display: "grid", gap: "10px" }}>
          <button onClick={() => handleStructuredGenerate("lesson")}>Plan a Lesson</button>
          <button onClick={() => handleStructuredGenerate("worksheet")}>Create Worksheet</button>
          <button onClick={() => handleStructuredGenerate("assessment")}>Generate Assessment</button>
          <button onClick={() => handleStructuredGenerate("slides")}>Design Slides</button>
          <button onClick={() => handleStructuredGenerate("explain")}>Explain Topic</button>
          <button onClick={() => handleStructuredGenerate("custom")}>Custom Task</button>
        </div>
      </div>
    </div>
  );
}
