import { useState } from "react";

export default function Home() {
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [intent, setIntent] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    setResponse("");

    const structuredPrompt = `
You are Elora, an elite AI teaching assistant.

Country: ${country}
Education Level: ${level}
Subject: ${subject}
Task: ${intent}

Additional notes from teacher:
${customNote || "None"}

Generate a professional, classroom-ready response.
`;

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: structuredPrompt }),
      });

      const data = await res.json();
      setResponse(data.reply || "No response received.");
    } catch (err) {
      setResponse("Sorry, something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Elora AI Assistant</h1>
        <p style={styles.subtitle}>Personalised Teaching Support</p>

        {/* Country */}
        <select style={styles.select} onChange={(e) => setCountry(e.target.value)}>
          <option value="">Select Country</option>
          <option>Singapore</option>
          <option>United States</option>
          <option>United Kingdom</option>
          <option>Australia</option>
          <option>Other / Custom</option>
        </select>

        {/* Level */}
        <select style={styles.select} onChange={(e) => setLevel(e.target.value)}>
          <option value="">Select Education Level</option>
          <option>Primary / Elementary</option>
          <option>Secondary / Middle School</option>
          <option>High School</option>
          <option>Junior College / Pre-University</option>
          <option>University</option>
          <option>Adult / Professional</option>
        </select>

        {/* Subject */}
        <select style={styles.select} onChange={(e) => setSubject(e.target.value)}>
          <option value="">Select Subject</option>
          <option>Mathematics</option>
          <option>Science</option>
          <option>English / Language</option>
          <option>Humanities</option>
          <option>Computer Science</option>
          <option>Other</option>
        </select>

        {/* Intent */}
        <select style={styles.select} onChange={(e) => setIntent(e.target.value)}>
          <option value="">What do you want to do?</option>
          <option>Plan a lesson</option>
          <option>Create assessment questions</option>
          <option>Explain a concept</option>
          <option>Design activities</option>
          <option>Remedial support</option>
          <option>High-ability / enrichment</option>
        </select>

        {/* Custom */}
        <textarea
          style={styles.textarea}
          placeholder="Anything Elora should know? (optional)"
          onChange={(e) => setCustomNote(e.target.value)}
        />

        <button style={styles.button} onClick={handleSend} disabled={loading}>
          {loading ? "Thinking..." : "Generate"}
        </button>

        {response && (
          <div style={styles.response}>
            <strong>Elora:</strong>
            <p>{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb",
  },
  card: {
    width: "420px",
    padding: "24px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  title: { marginBottom: "4px" },
  subtitle: { marginBottom: "16px", color: "#555" },
  select: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    height: "80px",
    borderRadius: "6px",
    marginBottom: "12px",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#5b5cf6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  response: {
    marginTop: "16px",
    background: "#f0f2ff",
    padding: "12px",
    borderRadius: "8px",
  },
};
