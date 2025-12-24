import { useEffect, useState } from "react";
import Link from "next/link";

export default function EducatorDashboard() {
  const [role, setRole] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("eloraUserProfile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRole(parsed.role || "educator");
      } catch {}
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <h1 className="text-2xl font-semibold text-center">
          Educator Workspace
        </h1>
        <p className="mt-2 text-sm text-center text-gray-500">
          Role: <span className="font-semibold">{role}</span>
        </p>

        <div className="mt-6">
          <Link
            href="/assistant"
            className="block text-center bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Open Elora AI Assistant
          </Link>
        </div>

        <div className="mt-8 grid gap-3">
          <FeatureCard
            title="Lesson Planner"
            desc="Generate structured lesson plans."
            locked={false}
          />
          <FeatureCard
            title="Presentation Generator"
            desc="Turn topics into slides."
            locked={true}
          />
          <FeatureCard
            title="Assessment Builder"
            desc="Create quizzes and worksheets."
            locked={true}
          />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/onboarding"
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Change role
          </Link>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, desc, locked }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        locked ? "border-gray-200 opacity-70" : "border-indigo-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {locked && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
            Locked
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">{desc}</p>
    </div>
  );
}
