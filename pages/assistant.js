import { useState } from "react";

export default function Assistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMessage = input;
    setMessages((m) => [...m, { from: "user", text: userMessage }]);
    setInput("");

    setMessages((m) => [
      ...m,
      { from: "ai", text: "Thinking like a helpful teacher assistant..." },
    ]);

    // Fake AI reply for now (works offline)
    setTimeout(() => {
      setMessages((m) => [
        ...m.slice(0, -1),
        {
          from: "ai",
          text:
            "Here's how I can help!\n" +
            "- Explain concepts\n" +
            "- Help with schoolwork\n" +
            "- Support learning ❤️",
        },
      ]);
    }, 900);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>Elora Assistant 💙</h2>
        <p style={{ color: "#666" }}>
          Free to use. Verification only needed for saving, exporting, or
          advanced tools.
        </p>

        <div style={styles.chatBox}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                background: m.from === "user" ? "#6C63FF" : "#f4f4ff",
                color: m.from === "user" ? "white" : "#333",
                alignSelf: m.from === "user" ? "flex-end" : "flex-start",
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div style={styles.row}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Elora anything…"
            style={styles.input}
          />
          <button onClick={sendMessage} style={styles.send}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef0ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 650,
    background: "white",
    padding: 25,
    borderRadius: 18,
    boxShadow: "0 25px 80px rgba(0,0,0,0.1)",
  },
  chatBox: {
    height: 380,
    border: "1px solid #ddd",
    borderRadius: 14,
    padding: 12,
    overflowY: "auto",
    marginTop: 12,
    marginBottom: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  message: {
    padding: 10,
    borderRadius: 12,
    maxWidth: "85%",
    whiteSpace: "pre-line",
  },
  row: {
    display: "flex",
    gap: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ccc",
  },
  send: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "none",
    background: "#6C63FF",
    color: "white",
    cursor: "pointer",
  },
};
