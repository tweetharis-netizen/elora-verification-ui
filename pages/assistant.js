import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Modal from "../components/Modal";
import RoleIllustration from "../components/RoleIllustration";
import { getSession } from "../lib/session";

const COUNTRY_OPTIONS = [
  "Singapore",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "India",
  "Other"
];

// Country-aware level labels (the point of country selection)
const LEVELS_BY_COUNTRY = {
  Singapore: ["Primary (1–6)", "Secondary (1–2)", "Secondary (3–4)", "O-Level", "A-Level", "University", "Other"],
  "United States": [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8 (Middle School)",
    "Grade 9 (High School)",
    "Grade 10 (High School)",
    "Grade 11 (High School)",
    "Grade 12 (High School)",
    "AP / Advanced",
    "University",
    "Other"
  ],
  "United Kingdom": [
    "Year 1",
    "Year 2",
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Year 7",
    "Year 8",
    "Year 9",
    "GCSE (Year 10–11)",
    "A-Level (Year 12–13)",
    "University",
    "Other"
  ],
  Australia: ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "University", "Other"],
  Canada: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "University", "Other"],
  India: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "University", "Other"],
  Other: ["Primary / Elementary", "Middle School", "High School", "Pre-University", "University", "Other"]
};

const SUBJECT_OPTIONS = ["Math", "Science", "English", "Computer Science", "History", "Geography", "Other"];

const ROLE_QUICK_ACTIONS = {
  educator: [
    { id: "lesson", label: "Plan a lesson", hint: "Objectives, timings, checks, differentiation" },
    { id: "worksheet", label: "Create worksheet", hint: "Core → Application → Challenge + answers" },
    { id: "assessment", label: "Generate assessment", hint: "Marks, instructions, marking scheme" },
    { id: "slides", label: "Design slides", hint: "Slide titles + bullets" }
  ],
  student: [
    { id: "explain", label: "Explain it", hint: "Step-by-step + examples" },
    { id: "worksheet", label: "Give me practice", hint: "Short practice set + answers" },
    { id: "custom", label: "Custom request", hint: "Ask anything" }
  ],
  parent: [
    { id: "explain", label: "Explain it", hint: "Simple explanation + common mistakes" },
    { id: "worksheet", label: "Practice for my child", hint: "Core practice + answers" },
    { id: "custom", label: "Custom request", hint: "Ask anything" }
  ]
};

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function safeFilename(name) {
  return (name || "Elora-Export")
    .toString()
    .trim()
    .replace(/[^a-z0-9\\- _]/gi, "")
    .replace(/\\s+/g, "-")
    .slice(0, 80);
}

export default function AssistantPage() {
  const [session, setSession] = useState(() => getSession());

  // Keep session in sync (after verify/success pages etc)
  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const verified = session.verified;
  const guest = session.guest;

  const [role, setRole] = useState(session.role || "educator");
  const [country, setCountry] = useState("Singapore");
  const levelOptions = useMemo(() => LEVELS_BY_COUNTRY[country] || LEVELS_BY_COUNTRY.Other, [country]);
  const [level, setLevel] = useState(levelOptions[0]);
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("Introduction to fractions");
  const [action, setAction] = useState(ROLE_QUICK_ACTIONS[role][0]?.id || "lesson");

  const [messages, setMessages] = useState(() => [
    {
      from: "elora",
      text:
        "Hi! I’m **Elora**. Pick options on the left (that’s the hard part of prompting) and I’ll generate something clean you can actually use.\n\nIf you want, ask a question in the chat box for refinements."
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [verifyGateOpen, setVerifyGateOpen] = useState(false);

  // When country changes, ensure level stays valid (and feels localized)
  useEffect(() => {
    if (!levelOptions.includes(level)) setLevel(levelOptions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, levelOptions.join("|")]);

  // When role changes, default action and show relevant quick actions
  useEffect(() => {
    const first = ROLE_QUICK_ACTIONS[role]?.[0]?.id || "lesson";
    setAction
