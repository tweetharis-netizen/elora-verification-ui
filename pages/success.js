import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";

export default function SuccessPage({ user }) {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (user && user.emailVerified) {
      setVerified(true);
    }
  }, [user]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-[#0b0f19] dark:to-[#0b0f19] px-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl p-8 max-w-md text-center">
        <h1 className="text-2xl font-semibold">
          {verified ? "Email verified 🎉" : "Checking verification…"}
        </h1>

        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {verified
            ? "Your email has been verified successfully."
            : "Please wait while we confirm your email."}
        </p>

        {verified && (
          <button
            onClick={() => (window.location.href = "/onboarding")}
            className="mt-8 w-full py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            Continue
          </button>
        )}
      </div>
    </main>
  );
}
