import { useEffect, useState } from "react";
import Link from "next/link";

export default function LearnerDashboard() {
  const [role, setRole] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("eloraUserProfile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRole(parsed.role || "learner");
      } catch {}
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <h1 className="text-2xl font-semibold text-center">
          Learning Space
        </h1>
        <p className="mt-2 text-sm text-center text-gray-500">
          Role: <span className="font-semibold">{role}</span>
        </p>

        <div className="mt-6">
          <Link
            href="/assistant"
            className="block text-center bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Ask Elora for Help
          </Link>
        </div>

        <div className="mt-8 grid gap-3">
          <FeatureCard
            title="Explain a Topic"
            desc="Clear explanations and examples."
          />
          <FeatureCard
            title="Practice Generator"
            desc="Guided practice without answer dumps."
          />
          <FeatureCard
            title="Hints Mode"
            desc="Step-by-step guidance only."
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

function FeatureCard({ title, desc }) {
  return (
    <div className="rounded-xl border border-indigo-200 p-4">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{desc}</p>
    </div>
  );
}
