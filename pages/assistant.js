import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

/**
 * Elora Assistant (Guided Global Prompt Flow)
 * - Verification Guard (must be email verified)
 * - Country/Region picker with scrollbar
 * - Country-aware education level labels (Grade / Primary / Secondary / Year)
 * - No backend / no AI cost: generates a high-quality lesson plan locally
 */

const COUNTRY_OPTIONS = [
  // Asia
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Thailand",
  "Vietnam",
  "India",
  "China",
  "Japan",
  "South Korea",
  "Taiwan",
  "Hong Kong",
  "UAE",
  "Saudi Arabia",
  // Europe
  "United Kingdom",
  "Ireland",
  "France",
  "Germany",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Norway",
  // Americas
  "United States",
  "Canada",
  "Mexico",
  "Brazil",
  // Oceania
  "Australia",
  "New Zealand",
  // Africa
  "South Africa",
  "Nigeria",
  "Kenya",
  "Egypt",
];

function getLevelSystem(country) {
  const c = (country || "").toLowerCase();

  // Singapore style
  if (c.includes("singapore")) {
    return {
      systemName: "Singapore",
      label: "Choose level",
      options: [
        "Primary 1",
        "Primary 2",
        "Primary 3",
        "Primary 4",
        "Primary 5",
        "Primary 6",
        "Secondary 1",
        "Secondary 2",
        "Secondary 3",
        "Secondary 4",
        "Secondary 5",
        "JC 1",
        "JC 2",
        "ITE",
        "Polytechnic",
        "University",
      ],
    };
  }

  // US/Canada grade style
  if (c.includes("united states") || c.includes("canada")) {
    return {
      systemName: "Grade",
      label: "Choose grade",
      options: [
        "Kindergarten",
        "Grade 1",
        "Grade 2",
        "Grade 3",
        "Grade 4",
        "Grade 5",
        "Grade 6",
        "Grade 7",
        "Grade 8",
        "Grade 9",
        "Grade 10",
        "Grade 11",
        "Grade 12",
        "College / University",
      ],
    };
  }

  // UK year style
  if (c.includes("united kingdom") || c.includes("ireland")) {
    return {
      systemName: "Year",
      label: "Choose year",
      options: [
        "Year 1",
        "Year 2",
        "Year 3",
        "Year 4",
        "Year 5",
        "Year 6",
        "Year 7",
        "Year 8",
        "Year 9",
        "Year 10",
        "Year 11",
        "Year 12",
        "Year 13",
        "University",
      ],
    };
  }

  // Australia/NZ year-level-ish
  if (c.includes("australia") || c.includes("new zealand")) {
    return {
      systemName: "Year/Level",
      label: "Choose level",
      options: [
        "Foundation",
        "Year 1",
        "Year 2",
        "Year 3",
        "Year 4",
        "Year 5",
        "Year 6",
        "Year 7",
        "Year 8",
        "Year 9",
        "Year 10",
        "Year 11",
        "Year 12",
        "University",
      ],
    };
  }

  // Default (works globally)
  return {
    systemName: "Custom",
    label: "Choose level",
    options: [
      "Early Years",
      "Primary / Elementary",
      "Middle School",
      "Secondary / High School",
      "College / University",
      "Adult Learning",
    ],
  };
}

function safeTrim(s) {
  return (s || "").trim();
}

// ---------- Local “AI-like” generator (free, deterministic) ----------
function generateLessonPlan({ country, level, subject, topic, goal, durationMins }) {
  const c = safeTrim(country);
  const l = safeTrim(level);
  const s = safeTrim(subject);
  const t = safeTrim(topic);
  const g = safeTrim(goal);
  const d = durationMins || 60;

  const header = `Elora Lesson Output (Offline)\nCountry: ${c}\nLevel: ${l}\nSubject: ${s}\nTopic: ${t}\nGoal: ${g}\nDuration: ${d} minutes\n`;

  const isFractions = (s + " " + t).toLowerCase().includes("fraction");

  // A very strong default structure (works for any subject)
  const base = {
    objectives: [
      `Students can explain the key idea of "${t}" in their own words.`,
      `Students can solve at least 6 practice questions independently.`,
      `Students can justify their answers using correct vocabulary.`,
    ],
    warmup: [
      `Quick recap: Ask 3 short questions from the previous topic.`,
      `Activate prior knowledge: "Where do we see ${t} in real life?"`,
    ],
    explanation: [
      `Teach the concept using a simple model (diagram / example / story).`,
      `Show 2 worked examples (easy → medium).`,
      `Highlight common mistakes and how to avoid them.`,
    ],
    guidedPractice: [
      `Do 4 questions together: 2 easy + 2 medium.`,
      `Cold-call and ask “why” for one step in each solution.`,
    ],
    independentPractice: [
      `Worksheet set: 8 questions (mix of difficulty).`,
      `Extension: 2 challenge questions for fast finishers.`,
    ],
    assessment: [
      `Exit ticket: 3 questions (1 easy, 1 medium, 1 reasoning).`,
      `Success criteria: 2/3 correct + explanation sentence.`,
    ],
    differentiation: [
      `Support: visuals, sentence starters, smaller numbers.`,
      `Stretch: multi-step problems + explanation requirement.`,
    ],
  };

  // Upgrade specifically for Fractions (much better output for your demo)
  if (isFractions) {
    const upgraded = {
      objectives: [
        `Students can represent fractions using area models and number lines.`,
        `Students can identify equivalent fractions (e.g., 1/2 = 2/4).`,
        `Students can compare fractions with like and unlike denominators using reasoning.`,
      ],
      warmup: [
        `Show 3 shapes (circle/rectangle/bar). Ask: “What fraction is shaded?”`,
        `Quick mental starter: “Is 1/3 bigger or smaller than 1/2? Why?”`,
      ],
      explanation: [
        `1) Meaning of a fraction: part of a whole (equal parts).`,
        `2) Area models: divide into equal parts → shade → write fraction.`,
        `3) Number line: 0 to 1 split into equal intervals (fractions as positions).`,
        `4) Equivalent fractions: multiply/divide numerator & denominator by same number.`,
        `5) Comparing fractions: same denominator → compare numerators; otherwise use benchmarks (1/2, 1) or equivalent fractions.`,
      ],
      guidedPractice: [
        `Q1–Q2: Shade and write fractions from models.`,
        `Q3–Q4: Place fractions on a number line.`,
        `Q5–Q6: Find 2 equivalent fractions for each given fraction.`,
        `Teacher checks reasoning: “How do you know they are equivalent?”`,
      ],
      independentPractice: [
        `Set A (Core): 8 questions: shading, number line, equivalence.`,
        `Set B (Reasoning): 4 questions: “Which is bigger and why?”`,
        `Extension: Create your own fraction story problem and swap with a partner.`,
      ],
      assessment: [
        `Exit Ticket (3 items):`,
        `1) Shade 3/5 on a bar model.`,
        `2) Write 2 equivalent fractions for 2/3.`,
        `3) Compare 3/4 and 5/8 and explain your method.`,
      ],
      differentiation: [
        `Support: Use bar models only + keep denominators ≤ 8.`,
        `Stretch: Compare 3 fractions + justify using number line or equivalence.`,
      ],
    };

    return (
      header +
      `\n1) Learning Objectives\n- ${upgraded.objectives.join("\n- ")}\n` +
      `\n2) Warm-up (5–8 mins)\n- ${upgraded.warmup.join("\n- ")}\n` +
      `\n3) Teaching & Explanation (15–20 mins)\n- ${upgraded.explanation.join("\n- ")}\n` +
      `\n4) Guided Practice (15 mins)\n- ${upgraded.guidedPractice.join("\n- ")}\n` +
      `\n5) Independent Practice (15 mins)\n- ${upgraded.independentPractice.join("\n- ")}\n` +
      `\n6) Assessment (Exit Ticket) (5 mins)\n- ${upgraded.assessment.join("\n- ")}\n` +
      `\n7) Differentiation\n- ${upgraded.differentiation.join("\n- ")}\n`
    );
  }

  // Default plan for anything else
  return (
    header +
    `\n1) Learning Objectives\n- ${base.objectives.join("\n- ")}\n` +
    `\n2) Warm-up (5–8 mins)\n- ${base.warmup.join("\n- ")}\n` +
    `\n3) Teaching & Explanation (15–20 mins)\n- ${base.explanation.join("\n- ")}\n` +
    `\n4) Guided Practice (15 mins)\n- ${base.guidedPractice.join("\n- ")}\n` +
    `\n5) Independent Practice (15 mins)\n- ${base.independentPractice.join("\n- ")}\n` +
    `\n6) Assessment (Exit Ticket) (5 mins)\n- ${base.assessment.join("\n- ")}\n` +
    `\n7) Differentiation\n- ${base.differentiation.join("\n- ")}\n`
  );
}

export default function Assistant() {
  const router = useRouter();

  // 🔐 Verification Guard state
  const [authLoading, setAuthLoading] = useState(true);

  // Guided flow state
  const [step, setStep] = useState(0);

  const [countryQuery, setCountryQuery] = useState("");
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [durationMins, setDurationMins] = useState(60);

  const [output, setOutput] = useState("");

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
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const levelSystem = useMemo(() => getLevelSystem(country), [country]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((c) => c.toLowerCase().includes(q));
  }, [countryQuery]);

  function goNext() {
    setStep((s) => Math.min(s + 1, 5));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function resetAll() {
    setStep(0);
    setCountryQuery("");
    setCountry("");
    setLevel("");
    setSubject("");
    setTopic("");
    setGoal("");
    setDurationMins(60);
    setOutput("");
  }

  function canProceedFromStep(s) {
    if (s === 0) return !!country;
    if (s === 1) return !!level;
    if (s === 2) return !!subject;
    if (s === 3) return !!topic;
    if (s === 4) return !!goal;
    return true;
  }

  function handleGenerate() {
    const text = generateLessonPlan({
      country,
      level,
      subject,
      topic,
      goal,
      durationMins,
    });
    setOutput(text);
    setStep(5);
  }

  // ⏳ prevent flashing content before redirect
  if (authLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={{ margin: 0 }}>Checking verification…</h2>
          <p style={{ color: "#666" }}>Please wait.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ marginBottom: 10 }}>
          <h1 style={{ margin: 0 }}>Elora AI Assistant</h1>
          <div style={{ color: "#666" }}>Role: Teacher • Guided Global Flow</div>
        </div>

        {/* Step indicator */}
        <div style={styles.stepRow}>
          {["Country", "Level", "Subject", "Topic", "Goal", "Output"].map((label, i) => (
            <div
              key={label}
              style={{
                ...styles.stepPill,
                background: i === step ? "#4f46e5" : "#e5e7eb",
                color: i === step ? "#fff" : "#111827",
              }}
            >
              {i + 1}. {label}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div style={{ marginTop: 16 }}>
          {step === 0 && (
            <>
              <h3 style={styles.h3}>1) Choose your Country / Region</h3>
              <p style={styles.p}>
                This lets Elora use the correct school system (Primary/Secondary vs Grade vs Year).
              </p>

              <label style={styles.label}>Search country (optional)</label>
              <input
                style={styles.input}
                placeholder="Type to filter… e.g. Singapore"
                value={countryQuery}
                onChange={(e) => setCountryQuery(e.target.value)}
              />

              <label style={{ ...styles.label, marginTop: 10 }}>Select country (scroll list)</label>
              <select
                style={styles.selectList}
                size={8}
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  // Reset level if country changes
                  setLevel("");
                }}
              >
                <option value="" disabled>
                  — Select one —
                </option>
                {filteredCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div style={styles.navRow}>
                <button style={styles.btnGhost} onClick={resetAll}>
                  Reset
                </button>
                <button
                  style={{ ...styles.btn, opacity: canProceedFromStep(0) ? 1 : 0.5 }}
                  disabled={!canProceedFromStep(0)}
                  onClick={goNext}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h3 style={styles.h3}>2) Choose Education Level</h3>
              <p style={styles.p}>
                Based on <b>{country}</b>, we’ll use: <b>{levelSystem.systemName}</b>.
              </p>

              <label style={styles.label}>{levelSystem.label}</label>
              <select
                style={styles.select}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="">— Select one —</option>
                {levelSystem.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              <div style={styles.navRow}>
                <button style={styles.btnGhost} onClick={goBack}>
                  Back
                </button>
                <button
                  style={{ ...styles.btn, opacity: canProceedFromStep(1) ? 1 : 0.5 }}
                  disabled={!canProceedFromStep(1)}
                  onClick={goNext}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={styles.h3}>3) Subject</h3>
              <p style={styles.p}>Example: Math, English, Science, History</p>

              <label style={styles.label}>Subject</label>
              <input
                style={styles.input}
                placeholder="e.g. Math"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <div style={styles.navRow}>
                <button style={styles.btnGhost} onClick={goBack}>
                  Back
                </button>
                <button
                  style={{ ...styles.btn, opacity: canProceedFromStep(2) ? 1 : 0.5 }}
                  disabled={!canProceedFromStep(2)}
                  onClick={goNext}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 style={styles.h3}>4) Topic</h3>
              <p style={styles.p}>Example: Fractions, Photosynthesis, Persuasive Writing</p>

              <label style={styles.label}>Topic</label>
              <input
                style={styles.input}
                placeholder="e.g. Fractions"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />

              <div style={styles.navRow}>
                <button style={styles.btnGhost} onClick={goBack}>
                  Back
                </button>
                <button
                  style={{ ...styles.btn, opacity: canProceedFromStep(3) ? 1 : 0.5 }}
                  disabled={!canProceedFromStep(3)}
                  onClick={goNext}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 style={styles.h3}>5) What do you want Elora to create?</h3>
              <p style={styles.p}>Choose a goal. You can change it any time.</p>

              <label style={styles.label}>Goal</label>
              <select
                style={styles.select}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="">— Select one —</option>
                <option value="Lesson Plan">Lesson Plan</option>
                <option value="Worksheet">Worksheet</option>
                <option value="Assessment">Assessment</option>
                <option value="Concept Explanation">Concept Explanation</option>
              </select>

              <label style={{ ...styles.label, marginTop: 10 }}>Lesson duration (minutes)</label>
              <input
                style={styles.input}
                type="number"
                min={20}
                max={180}
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
              />

              <div style={styles.navRow}>
                <button style={styles.btnGhost} onClick={goBack}>
                  Back
                </button>
                <button
                  style={{ ...styles.btn, opacity: canProceedFromStep(4) ? 1 : 0.5 }}
                  disabled={!canProceedFromStep(4)}
                  onClick={handleGenerate}
                >
                  Generate
                </button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h3 style={styles.h3}>Output</h3>
              <p style={styles.p}>
                This is a strong offline “best practice” result (no AI costs). Next we can optionally connect
                a real model later.
              </p>

              <div style={styles.summaryBox}>
                <div><b>Country:</b> {country}</div>
                <div><b>Level:</b> {level}</div>
                <div><b>Subject:</b> {subject}</div>
                <div><b>Topic:</b> {topic}</div>
                <div><b>Goal:</b> {goal}</div>
              </div>

              <label style={styles.label}>Generated plan</label>
              <textarea style={styles.textarea} value={output} readOnly />

              <div style={styles.navRow}>
                <button style={styles.btnGhost} onClick={resetAll}>
                  Start Over
                </button>
                <button
                  style={styles.btn}
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                  }}
                >
                  Copy
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Simple clean styling ---
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    padding: 22,
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
  },
  stepRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  stepPill: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
  },
  h3: { margin: "10px 0 6px" },
  p: { margin: "0 0 12px", color: "#444" },
  label: { display: "block", fontSize: 12, color: "#555", marginBottom: 6 },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
  },
  select: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#fff",
  },
  selectList: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 260,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    outline: "none",
    background: "#fafafa",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 12,
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
  },
  summaryBox: {
    background: "#f3f4f6",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    color: "#111827",
    display: "grid",
    gap: 4,
  },
  navRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
  },
  btn: {
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    flex: 1,
  },
  btnGhost: {
    background: "#eef2ff",
    color: "#3730a3",
    border: "1px solid #c7d2fe",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    flex: 1,
  },
};
