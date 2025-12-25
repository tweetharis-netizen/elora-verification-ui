import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const auth = getAuth();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/verify");
        return;
      }

      if (!user.emailVerified) {
        router.replace("/verify");
        return;
      }

      setChecking(false);
    });

    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <div style={styles.page}>
        <p style={{ color: "#555" }}>Checking your account…</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Elora</h1>
        <p style={styles.subtitle}>
          AI built for education — personalized for Educators, Students, and Parents.
        </p>

        <div style={styles.roles}>
          <button
            style={styles.roleButton}
            onClick={() => router.push("/onboarding?role=educator")}
          >
            🎓 I am an Educator
          </button>

          <button
            style={styles.roleButton}
            onClick={() => router.push("/onboarding?role=student")}
          >
            📘 I am a Student
          </button>

          <button
            style={styles.roleButton}
            onClick={() => router.push("/onboarding?role=parent")}
          >
            👨‍👩‍👧 I am a Parent
          </button>
        </div>

        <div style={styles.footer}>
          <button
            style={styles.link}
            onClick={() => alert("FAQ page coming soon")}
          >
            FAQ
          </button>
          <button
            style={styles.link}
            onClick={() => alert("Feedback system coming soon")}
          >
            Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "#ffffff",
    padding: 32,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: 800,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 24,
  },
  roles: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 26,
  },
  roleButton: {
    padding: "14px 16px",
    fontSize: 16,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "#5b5bf7",
    color: "#fff",
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
  },
  link: {
    background: "none",
    border: "none",
    color: "#5b5bf7",
    cursor: "pointer",
    fontSize: 14,
  },
};
