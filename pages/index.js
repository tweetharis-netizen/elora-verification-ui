import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState(null);

  function continueNormal() {
    if (!selectedRole) return alert("Please choose a role first 😊");

    router.push(`/onboarding?role=${selectedRole}`);
  }

  function continueGuest() {
    if (!selectedRole) return alert("Please choose a role first 😊");

    router.push(`/onboarding?role=${selectedRole}&guest=1`);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Elora</h1>
        <p style={styles.subtitle}>
          Your AI Assistant for Education — built for Educators, Students, and Parents.
        </p>

        {/* ROLE SECTION */}
        <h3 style={styles.sectionTitle}>Choose your role</h3>

        <div style={styles.roles}>
          {/* EDUCATOR */}
          <div
            style={{
              ...styles.roleCard,
              border:
                selectedRole === "educator" ? "2px solid #5b5bf7" : "1px solid #ddd",
            }}
            onClick={() => setSelectedRole("educator")}
          >
            <span style={styles.emoji}>🎓</span>
            <h4>Educator</h4>
            <p style={styles.roleText}>
              Plan lessons, worksheets, assessments, slides and more.
            </p>
          </div>

          {/* STUDENT */}
          <div
            style={{
              ...styles.roleCard,
              border:
                selectedRole === "student" ? "2px solid #5b5bf7" : "1px solid #ddd",
            }}
            onClick={() => setSelectedRole("student")}
          >
            <span style={styles.emoji}>📘</span>
            <h4>Student</h4>
            <p style={styles.roleText}>
              Homework help, study guidance and practice tools.
            </p>
          </div>

          {/* PARENT */}
          <div
            style={{
              ...styles.roleCard,
              border:
                selectedRole === "parent" ? "2px solid #5b5bf7" : "1px solid #ddd",
            }}
            onClick={() => setSelectedRole("parent")}
          >
            <span style={styles.emoji}>👨‍👩‍👧</span>
            <h4>Parent</h4>
            <p style={styles.roleText}>
              Understand lessons, support learning at home.
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={styles.buttonArea}>
          <button style={styles.primaryBtn} onClick={continueNormal}>
            Continue
          </button>

          <button style={styles.secondaryBtn} onClick={continueGuest}>
            Try as Guest
          </button>
        </div>

        <p style={{ color: "#777", fontSize: 12, marginTop: 14 }}>
          Guest mode has limited features and does not save progress.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    padding: 28,
    borderRadius: 14,
    boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 10,
    fontWeight: 700,
  },
  roles: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 12,
  },
  roleCard: {
    padding: 12,
    borderRadius: 10,
    cursor: "pointer",
    background: "#fafafa",
    transition: "0.2s",
  },
  emoji: {
    fontSize: 28,
  },
  roleText: {
    fontSize: 12,
    color: "#666",
  },
  buttonArea: {
    marginTop: 22,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  primaryBtn: {
    background: "#5b5bf7",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: 10,
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "#fff",
    color: "#5b5bf7",
    border: "1px solid #5b5bf7",
    padding: "12px",
    borderRadius: 10,
    cursor: "pointer",
  },
};
