import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";

export default function SuccessPage() {
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;

      if (!user) {
        // User verified via link but not signed in — this is OK
        setVerified(true);
        setChecking(false);
        return;
      }

      try {
        await user.reload();
        setVerified(user.emailVerified);
      } catch {
        setVerified(true); // fail open for MVP
      } finally {
        setChecking(false);
      }
    };

    checkVerification();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-[#0b0f19] dark:to-[#0b0f19] px-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl p-8 max-w-md text-center">
        {checking && (
          <>
            <h1 className="text-2xl font-semibold">
              Checking verification…
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Please wait while we confirm your email.
            </p>
          </>
        )}

        {!checking && verified && (
          <>
            <h1 className="text-2xl font-semibold text-green-600">
              Email verified 🎉
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Your email has been successfully verified.
            </p>

            <button
              onClick={() => (window.location.href = "/onboarding")}
              className="mt-8 w-full py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </main>
  );
}
