import { useState } from "react";

export default function EmailVerificationForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const sendVerificationEmail = async () => {
    try {
      const res = await fetch(`/api/send-verification?email=${email}`);
      const data = await res.json();

      if (data.success) {
        setStatus("Email sent! Please check your inbox.");
      } else {
        setStatus(data.error || "Something went wrong.");
      }
    } catch (err) {
      setStatus("An error occurred while sending the email.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-4 text-indigo-600">Elora</h1>
        <p className="text-center text-gray-600 mb-6">
          Enter your email to receive a verification link.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={sendVerificationEmail}
          className="w-full bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 transition"
        >
          Send Verification Link
        </button>
        {status && (
          <p className="text-center text-sm mt-4 text-gray-700">{status}</p>
        )}
      </div>
    </div>
  );
}
