import { useState } from "react";

export default function Home() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    role: "Teacher",
    country: "",
    level: "",
    subject: "",
    goal: "",
  });

  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hi! I’m Elora 👋 Let’s build the perfect lesson together.",
    },
  ]);

  const [loading, setLoading] = useState(false);

  function updateForm(key, value) {
    setForm({ ...form, [key]: value });
  }

  async function handleSend() {
    setLoading(true);

    const structuredPrompt = `
You are Elora, an elite AI education assistant.

User Profile:
- Role: ${form.role}
- Country: ${form.country}
- Education Level: ${form.level}
- Subject: ${form.subject}

Task:
${form.goal}

Requirements:
- Follow ${form.country} curriculum norms if applicable
- Use correct terminology for the education level
- Be clear, structured, and classroom-ready
- Include examples and assessments where relevant
`;

    try {
      const res = await fetch("/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: structuredPrompt }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { from: "user", text: form.goal },
        { from: "ai", text: data.reply || "I’m here to help — try refining the goal." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "Sorry, something went wrong. Please try again." },
      ]);
    }

    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Elora AI Assistant</h2>
        <p style={{ opacity: 0.7 }}>Role: {form.role}</p>

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              background: m.from === "ai" ? "#f3f4f6" : "#4f46e5",
              color: m.from === "ai" ? "#000" : "#fff",
              alignSelf: m.from === "ai" ? "flex-start" : "flex-end",
            }}
          >
            {m.text}
          </div>
        ))}

        <div style={styles.form}>
          <input
            placeholder="Country (e.g. Singapore)"
            onChange={(e) => updateForm("country", e.target.value)}
          />
          <input
            placeholder="Education level (e.g. Primary 6)"
            onChange={(e) => updateForm("level", e.target.value)}
          />
          <input
            placeholder="Subject (e.g. Math)"
            onChange={(e) => updateForm("subject", e.target.value)}
          />
          <textarea
            placeholder="What do you want to create or teach?"
            rows={3}
            onChange={(e) => updateForm("goal", e.target.value)}
          />

          <button onClick={handleSend} disabled={loading}>
            {loading ? "Thinking..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f9fafb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "420px",
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
  },
  message: {
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "8px",
    fontSize: "14px",
    maxWidth: "90%",
  },
  form: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
};
