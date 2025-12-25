import "../styles/globals.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // <-- IMPORTANT

  // Routes that DO NOT require verification
  const publicRoutes = ["/verify", "/success"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // While Firebase is checking user → DON'T redirect
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}
      >
        Verifying your account…
      </div>
    );
  }

  // If user is NOT logged in OR NOT verified → force /verify
  if (!publicRoutes.includes(router.pathname)) {
    if (!user || !user.emailVerified) {
      router.replace("/verify");
      return null;
    }
  }

  return <Component {...pageProps} />;
}
