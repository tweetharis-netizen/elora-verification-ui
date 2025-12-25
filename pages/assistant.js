import { useEffect, useState } from "react";

export default function Assistant() {
  const [role, setRole] = useState("guest");
  const [guest, setGuest] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const storedRole = localStorage.getItem("elora_role");
    const guestFlag = localStorage.getItem("elora_guest");
    if (storedRole) setRole(storedRole);
    if (guestFlag) setGuest(true);

    setMessages([
      {
        from: "ai",
        text:
          storedRole === "educator"
            ? "Hello teacher 🍎! I'm Elora. I can help create lessons, worksheets, assessments and explain topics."
            : storedRole === "student"
            ? "Hi student 🎒! I'm Elora. Ask me anything about schoolwork, exams, or learning 😊"
            : storedRole === "parent"
            ? "Hi parent 👨‍👩‍👧! I can help you understand what your child is learning and how to support them."
            : "Hi! I'm Elora 💙 — a friendly education assistant. How can I help?"
      },
    ]);
  }, []);

  function sendMessage() {
    if (!input.trim()) return;

    const userText = input;
    setMessages((m) => [...m, { from: "user", text: userText }]);
    setInput("");

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text:
            role === "educator"
              ? "Great question! As a teacher tool, I can:\n• Generate lessons\n• Build worksheets\n• Create assessments\n• Explain topics for you to teach\nSoon I will also generate Google Slides & Docs automatically ✨"
              : role === "student"
              ? "Let’s learn together! I’ll help explain step-by-step, practice with you, and make studying easier 😊"
              : role === "parent"
              ? "I’ll help you understand topics simply, and guide how to support your child ❤️"
              : "I’m here to help with learning, teaching, and support!"
        },
      ]);
    }, 600);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>Elora Assistant 💙</h2>
        {guest && (
          <p style={{ color: "#777" }}>
            You are using Guest Mode — no verification needed.  
            Teachers with invites will unlock powerful tools soon ✨
          </p>
        )}

        <div style={styles.chat}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                alignSelf: m.from === "user" ? "flex-end" : "flex-start",
                background: m.from === "user" ? "#6c63ff" : "#f4f4ff",
                color: m.from === "user" ? "white" : "#333",
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
    maxWidth: 700,
    background: "white",
    padding: 20,
    borderRadius: 18,
    boxShadow: "0 30px 80px rgba(0,0,0,0.1)",
  },
  chat: {
    height: 420,
    overflowY: "auto",
    borderRadius: 12,
    border: "1px solid #ddd",
    padding: 10,
    marginTop: 10,
    display: "flex",
    gap: 6,
    flexDirection: "column",
  },
  message: {
    padding: 10,
    borderRadius: 12,
    maxWidth: "80%",
  },
  row: { display: "flex", gap: 10, marginTop: 10 },
  input: {
    flex: 1,
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 10,
  },
  send: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    background: "#6c63ff",
    color: "white",
  },
};
