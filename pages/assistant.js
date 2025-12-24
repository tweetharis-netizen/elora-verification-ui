import { useState } from "react";
import { useRouter } from "next/router";

export default function Assistant() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState("");

  function handleGenerate() {
    const prompt = `
You are an expert teacher assistant.

Create a ${subject} lesson for:
- Education level: ${level}
- Country syllabus: ${country}
- Teaching goal: ${goal}

Structure the response as:
1. Learning Objectives
2. Warm-up Activity
3. Main Explanation
4. Guided Practice
5. Independent Practice
6. Assessment / Exit Ticket
`;

    setResult(prompt.trim());
    setStep(5);
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Elora AI Assistant</h1>
        <p style={{ color: "#666" }}>Guided Lesson Builder</p>

        {step === 0 && (
          <>
            <p>What subject are you teaching?</p>
            <input value={subject} onChange={e => setSubject(e.target.value)} />
            <button onClick={() => setStep(1)}>Next</button>
          </>
        )}

        {step === 1 && (
          <>
            <p>Education level (e.g. Primary 4, Grade 6, Secondary 2)</p>
            <input value={level} onChange={e => setLevel(e.target.value)} />
            <button onClick={() => setStep(2)}>Next</button>
          </>
        )}

        {step === 2 && (
          <>
            <p>Country syllabus (e.g. Singapore, UK, US)</p>
            <input value={country} onChange={e => setCountry(e.target.value)} />
            <button onClick={() => setStep(3)}>Next</button>
          </>
        )}

        {step === 3 && (
          <>
            <p>What do you want to create?</p>
            <select value={goal} onChange={e => setGoal(e.target.value)}>
              <option value="">Select one</option>
              <option value="Lesson plan">Lesson Plan</option>
              <option value="Worksheet">Worksheet</option>
              <option value="Assessment">Assessment</option>
              <option value="Explanation">Concept Explanation</option>
            </select>
            <button onClick={() => setStep(4)}>Next</button>
          </>
        )}

        {step === 4 && (
          <>
            <p>Ready to generate your teaching guide?</p>
            <button onClick={handleGenerate}>Generate</button>
          </>
        )}

        {step === 5 && (
          <>
            <h3>Your Structured Teaching Prompt</h3>
            <pre style={styles.output}>{result}</pre>
            <button onClick={() => setStep(0)}>Start Over</button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb"
  },
  card: {
    width: "100%",
    maxWidth: 500,
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
  },
  output: {
    background: "#f0f0f0",
    padding: 12,
    whiteSpace: "pre-wrap",
    borderRadius: 8
  }
};
