import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState(null);

  const continueFlow = () => {
    if (!role) return alert("Please choose a role 😊");
    localStorage.setItem("elora_role", role);
    localStorage.removeItem("elora_guest");
    router.push("/assistant");
  };

  const guestMode = () => {
    localStorage.setItem("elora_guest", "true");
    router.push("/assistant");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HERO */}
        <h1 style={styles.title}>Elora</h1>
        <p style={styles.subtitle}>
          A friendly AI assistant built to support Educators, Students & Parents 💙
        </p>

        {/* ROLE SELECT */}
        <h3 style={styles.sectionTitle}>Who are you?</h3>

        <div style={styles.roles}>
          <RoleCard
            emoji="🍎"
            label="Educator"
            text="Create lessons, worksheets and assessments"
            active={role === "educator"}
            onClick={() => setRole("educator")}
          />
          <RoleCard
            emoji="🎒"
            label="Student"
            text="Homework help & smarter studying"
            active={role === "student"}
            onClick={() => setRole("student")}
          />
          <RoleCard
            emoji="👨‍👩‍👧"
            label="Parent"
            text="Understand and support learning at home"
            active={role === "parent"}
            onClick={() => setRole("parent")}
          />
        </div>

        <button style={styles.primaryBtn} onClick={continueFlow}>
          Continue →
        </button>

        <button style={styles.guestBtn} onClick={guestMode}>
          Try Elora as Guest ✨
        </button>

        <p style={styles.note}>
          Guest mode is free, instant and does not require email.
        </p>

        <hr style={{ margin: "25px 0", opacity: 0.4 }} />

        {/* FAQ */}
        <h2>FAQ</h2>
        <FAQ
          q="Do I need an account?"
          a="Nope! You can try Elora instantly. Accounts only unlock extra features."
        />
        <FAQ
          q="Is Elora free?"
          a="Yes! And premium features may come later — for now it's free!"
        />
        <FAQ
          q="Who is Elora for?"
          a="Educators, Students and Parents. Elora adapts to your needs 😊"
        />

        {/* FEEDBACK */}
        <div style={{ marginTop: 20 }}>
          <h3>Help us improve Elora 💬</h3>
          <button
            onClick={() =>
              window.open("mailto:elora.feedback.team@gmail.com", "_blank")
            }
            style={styles.feedbackBtn}
          >
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ emoji, label, text, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.roleCard,
        border: active ? "3px solid #6C63FF" : "1px solid #ddd",
      }}
    >
      <div style={{ fontSize: 35 }}>{emoji}</div>
      <b>{label}</b>
      <p style={{ color: "#666", fontSize: 13 }}>{text}</p>
    </div>
  );
}

function FAQ({ q, a }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <b>{q}</b>
      <p style={{ marginTop: 3, color: "#666" }}>{a}</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f3f6ff 0%, #ffffff 50%, #eef1ff 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  container: {
    width: "100%",
    maxWidth: 780,
    background: "white",
    borderRadius: 22,
    padding: 35,
    boxShadow: "0 40px 100px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: 42,
    fontWeight: 900,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 25,
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: 15,
  },
  roles: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 12,
    marginBottom: 20,
  },
  roleCard: {
    padding: 18,
    borderRadius: 16,
    background: "#fafafa",
    textAlign: "center",
    cursor: "pointer",
  },
  primaryBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    background: "#6C63FF",
    color: "white",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    marginBottom: 10,
  },
  guestBtn: {
    width: "100%",
    padding: 13,
    borderRadius: 12,
    background: "white",
    border: "2px solid #6C63FF",
    color: "#6C63FF",
    fontSize: 15,
    cursor: "pointer",
  },
  note: {
    textAlign: "center",
    fontSize: 12,
    color: "#777",
    marginTop: 6,
  },
  feedbackBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "#111",
    color: "white",
    cursor: "pointer",
  },
};
