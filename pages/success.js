import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-[#0b0f19] dark:to-[#0b0f19] px-4">
      <div
        className={`w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl p-8 text-center
        transition-all duration-700 ease-out
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="flex justify-center mb-4">
          <img src="/elora-logo.png" alt="Elora" className="h-14" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Email verified 🎉
        </h1>

        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Your email has been successfully verified.
        </p>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          You can now continue to Elora.
        </p>

        <button
          className="mt-8 w-full py-3 rounded-lg bg-indigo-600 text-white font-medium
          hover:bg-indigo-700 transition"
        >
          Continue to Elora
        </button>

        <p className="mt-6 text-xs text-gray-400">
          © 2026 Elora · Built for educators
        </p>
      </div>
    </main>
  );
}
