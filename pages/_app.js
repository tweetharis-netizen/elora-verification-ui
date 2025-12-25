import "../styles/globals.css";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Listen to Firebase auth ONE TIME
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ⏳ Nice loading state instead of redirecting wrongly
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        Loading Elora…
      </div>
    );
  }

  // ❌ IMPORTANT DIFFERENCE
  // We DO NOT force redirect to /verify anymore
  // Verification is handled inside the /verify + /success flow and later features only.

  return <Component {...pageProps} user={user} />;
}
