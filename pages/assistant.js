import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Assistant() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // 🔐 VERIFICATION GUARD
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      if (!user.emailVerified) {
        router.replace("/verify");
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // ⏳ Prevent flash before redirect
  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 50 }}>Checking verification…</p>;
  }

  // ============================
  // Elora Guided Prompt Engine
  // ============================

  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState("");

  function handleGenerate() {
    const prompt = `
You are an expert education assistant.

Create a ${goal} for:
• Subject: ${subject}
• Education Level: ${level}
• Country syllabus: ${country}

Structure:
1. Learning objectives
2. Warm-up
3. Explanation
4. Guided practice
5. Independent practice
6. Assessment
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
            <p>Education level (e.g. Primary 6, Grade 8)</p>
            <input value={level} onChange={e => setLevel(e.target.value)} />
            <button onClick={() => setStep(2)}>Next</button>
          </>
        )}

        {step === 2 && (
          <>
            <p>Country syllabus</p>
            <input value={country} onChange={e => setCountry(e.target.value)} />
            <button onClick={() => setStep(3)}>Next</button>
          </>
        )}

        {step === 3 && (
          <>
            <p>What do you want to create?</p>
            <select value={goal} onChange={e => setGoal(e.target.value)}>
              <option value="">Select one</option>
              <option value="Lesson Plan">Lesson Plan</option>
              <option value="Worksheet">Worksheet</option>
              <option value="Assessment">Assessment</option>
              <option value="Concept Explanation">Explanation</option>
            </select>
            <button onClick={() => setStep(4)}>Next</button>
          </>
        )}

        {step === 4 && (
          <>
            <p>Generate your teaching guide</p>
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
    maxWidth: 520,
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
  },
  output: {
    background: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    whiteSpace: "pre-wrap"
  }
};
