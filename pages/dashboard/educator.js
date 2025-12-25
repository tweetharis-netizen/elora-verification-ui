import { useState } from "react";

export default function EducatorDashboard() {
  const [role, setRole] = useState("Educator");
  const [country, setCountry] = useState("Singapore");
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("");
  const [message, setMessage] = useState("");
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateWithElora() {
    try {
      setLoading(true);
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          country,
          level,
          subject,
          topic,
          mode,
          message,
        }),
      });

      const data = await res.json();
      setAiText(data.reply || "No response generated.");
    } catch (err) {
      console.error(err);
      setAiText("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function exportDoc() {
    const res = await fetch("/api/export/doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Elora Lesson Plan",
        content: aiText,
      }),
    });

    const data = await res.json();
    if (data?.url) window.open(data.url, "_blank");
    else alert("Please connect Google first.");
  }

  async function exportSlides() {
    const res = await fetch("/api/export/slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Elora Slides",
        content: aiText,
      }),
    });

    const data = await res.json();
    if (data?.url) window.open(data.url, "_blank");
    else alert("Please connect Google first.");
  }

  function connectGoogle() {
    window.location.href = "/api/google/auth";
  }

  return (
    <div style={{ padding: "40px", display: "flex", gap: "30px" }}>
      {/* LEFT PANEL */}
      <div
        style={{
          width: "35%",
          padding: "25px",
          borderRadius: "16px",
          background: "white",
          boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
        }}
      >
        <h3>TEACHING PROFILE</h3>

        <div style={{ marginTop: "15px" }}>
          <label>Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option>Singapore</option>
            <option>USA</option>
            <option>UK</option>
            <option>Australia</option>
          </select>
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Select level...</option>
            <option>Primary</option>
            <option>Lower Secondary</option>
            <option>Upper Secondary / O-Level</option>
            <option>Junior College</option>
          </select>
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Select subject...</option>
            <option>Math</option>
            <option>Science</option>
            <option>English</option>
            <option>History</option>
            <option>Geography</option>
            <option>Computer Science</option>
          </select>
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g Fractions, Photosynthesis..."
          />
        </div>

        <div style={{ marginTop: "15px" }}>
          <label>What do you want Elora to create?</label>

          <div style={{ display: "grid", gap: "8px", marginTop: "5px" }}>
            {[
              "Plan a lesson",
              "Create worksheet",
              "Generate assessment",
              "Design lesson slides",
              "Explain a topic",
              "Custom request",
            ].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: mode === m ? "2px solid #6C63FF" : "1px solid #ddd",
                  background: mode === m ? "#f2f0ff" : "white",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generateWithElora}
          style={{
            marginTop: "20px",
            background: "#6C63FF",
            color: "white",
            padding: "12px",
            width: "100%",
            borderRadius: "10px",
          }}
        >
          {loading ? "Thinking..." : "Generate with Elora"}
        </button>

        <p style={{ marginTop: "10px", fontSize: "13px", color: "#555" }}>
          Elora builds structured prompts using your settings — you just click.
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          width: "65%",
          background: "white",
          padding: "25px",
          borderRadius: "16px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
        }}
      >
        <h3>Elora Assistant 💙</h3>

        <div
          style={{
            height: "550px",
            overflowY: "auto",
            padding: "15px",
            borderRadius: "12px",
            background: "#f7f8ff",
          }}
        >
          {aiText ? (
            <p style={{ whiteSpace: "pre-line" }}>{aiText}</p>
          ) : (
            <p>Hi teacher 🍎! I’m Elora. I can help you create lessons, worksheets, assessments, slides, or explain topics.</p>
          )}
        </div>

        {/* EXPORT BUTTONS */}
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <button
            onClick={connectGoogle}
            style={{
              padding: "10px 14px",
              background: "#4285F4",
              color: "white",
              borderRadius: "8px",
            }}
          >
            Connect Google
          </button>

          <button
            onClick={exportDoc}
            style={{
              padding: "10px 14px",
              background: "#34A853",
              color: "white",
              borderRadius: "8px",
            }}
          >
            Export Google Doc
          </button>

          <button
            onClick={exportSlides}
            style={{
              padding: "10px 14px",
              background: "#F4B400",
              color: "white",
              borderRadius: "8px",
            }}
          >
            Export Google Slides
          </button>
        </div>
      </div>
    </div>
  );
}
