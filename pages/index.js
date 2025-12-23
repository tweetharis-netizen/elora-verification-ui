import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const sendVerification = async () => {
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch(
        "https://elora-website.vercel.app/api/send-verification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("✅ Verification email sent. Check your inbox.");
    } catch (err) {
      setStatus("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "40px", fontFamily: "serif" }}>
      <h1>Verify Your Email</h1>
      <p>Elora • Your AI Teaching Assistant</p>

      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ marginRight: "10px" }}
      />

      <button onClick={sendVerification} disabled={loading}>
        {loading ? "Sending..." : "Send Verification"}
      </button>

      {status && <p>{status}</p>}

      <footer style={{ marginTop: "40px" }}>
        © 2026 Elora. All rights reserved.
      </footer>
    </main>
  );
}
