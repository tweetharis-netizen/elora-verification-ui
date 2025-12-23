import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";

export default function SuccessPage() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;

      if (!user) {
        setStatus("not-signed-in");
        return;
      }

      try {
        // 🔑 THIS IS THE KEY FIX
        await user.reload();

        if (user.emailVerified) {
          setStatus("verified");
        } else {
          setStatus("not-verified");
        }
      } catch (err) {
        console.error("Verification check failed:", err);
        setStatus("error");
      }
    };

    checkVerification();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-[#0b0f19] dark:to-[#0b0f19] px-4">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl p-8 max-w-md text-center">
        {status === "checking" && (
          <>
            <h1 className="text-2xl font-semibold">
              Checking verification…
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Please wait while we confirm your email.
            </p>
          </>
        )}

        {status === "verified" && (
          <>
            <h1 className="text-2xl font-semibold text-green-600">
              Email verified 🎉
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Your email has been verified successfully.
            </p>

            <button
              onClick={() => (window.location.href = "/onboarding")}
              className="mt-8 w-full py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
            >
              Continue
            </button>
          </>
        )}

        {status === "not-verified" && (
          <>
            <h1 className="text-2xl font-semibold">
              Email not verified
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Please click the verification link in your email.
            </p>
          </>
        )}

        {status === "not-signed-in" && (
          <>
            <h1 className="text-2xl font-semibold">
              Session expired
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Please return to verification and try again.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-semibold text-red-600">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Please refresh the page.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
