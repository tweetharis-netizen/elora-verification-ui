import { useState } from "react";

export default function OnboardingPage() {
  const [role, setRole] = useState(null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-[#0b0f19] dark:to-[#0b0f19] px-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold">
          Welcome to Elora
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Built to empower educators
        </p>

        <div className="mt-8 space-y-3">
          <RoleButton
            label="Teacher / Educator"
            description="Create lessons, presentations, and assessments"
            selected={role === "teacher"}
            onClick={() => setRole("teacher")}
          />

          <RoleButton
            label="Tutor"
            description="Support students with guided explanations"
            selected={role === "tutor"}
            onClick={() => setRole("tutor")}
          />

          <RoleButton
            label="Student"
            description="Learn, revise, and get help understanding topics"
            selected={role === "student"}
            onClick={() => setRole("student")}
          />

          <RoleButton
            label="Parent"
            description="Support your child’s learning journey"
            selected={role === "parent"}
            onClick={() => setRole("parent")}
          />
        </div>

        <button
          disabled={!role}
          onClick={() => alert(`Selected role: ${role}`)}
          className={`mt-8 w-full py-3 rounded-lg font-medium transition ${
            role
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </main>
  );
}

function RoleButton({ label, description, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition ${
        selected
          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-indigo-400"
      }`}
    >
      <div className="font-medium">{label}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {description}
      </div>
    </button>
  );
}
