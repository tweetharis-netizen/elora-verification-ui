import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState(null);

  function continueFlow() {
    if (!role) return alert("Please choose who you are 😊");
    localStorage.setItem("elora_role", role);
    localStorage.removeItem("elora_guest");
    router.push("/assistant");
  }

  function guestMode() {
    localStorage.setItem("elora_guest", "true");
    router.push("/assistant");
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Meet Elora 💙</h1>
        <p style={styles.subtitle}>
          A friendly AI built for Teachers, Students and Parents — helping learning become easier, faster and more fun.
        </p>

        <button style={styles.tryBtn} onClick={guestMode}>
          Try Elora Instantly (No email needed) ✨
        </button>
      </section>

      <section style={styles.section}>
        <h2>Who are you?</h2>

        <div style={styles.roles}>
          <RoleCard
            emoji="🍎"
            title="Educator"
            text="Create lessons, worksheets, slides and assessments"
            active={role === "educator"}
            onClick={() => setRole("educator")}
          />

          <RoleCard
            emoji="🎒"
            title="Student"
            text="Homework help, study support & practice tools"
            active={role === "student"}
            onClick={() => setRole("student")}
          />

          <RoleCard
            emoji="👨‍👩‍👧"
            title="Parent"
            text="Understand what your child is learning & support confidently"
            active={role === "parent"}
            onClick={() => setRole("parent")}
          />
        </div>

        <button onClick={continueFlow} style={styles.continueBtn}>
          Continue →
        </button>
      </section>

      <section style={styles.section}>
        <h2>Why Elora?</h2>
        <ul>
          <li>✨ Built specifically for education (not just random AI)</li>
          <li>📚 Understands teaching, studying & parenting needs</li>
          <li>🌍 Designed for real classrooms and real students</li>
          <li>🧠 Friendly, structured and safe learning experience</li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2>FAQ</h2>
        <FAQ q="Is Elora free?" a="Yes! All core features are free right now 😊" />
        <FAQ q="Do I need an account?" a="No. You can try instantly." />
        <FAQ q="Who is Elora for?" a="Teachers, Students and Parents everywhere." />
      </section>

      <footer style={styles.footer}>
        <p>Help us improve Elora 💬</p>
        <button
          style={styles.feedback}
          onClick={() =>
            window.open("mailto:elora.feedback.team@gmail.com", "_blank")
          }
        >
          Send Feedback
        </button>
      </footer>
    </div>
  );
}

function RoleCard({ emoji, title, text, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.roleCard,
        border: active ? "3px solid #6c63ff" : "1px solid #ddd",
      }}
    >
      <div style={{ fontSize: 35 }}>{emoji}</div>
      <b>{title}</b>
      <p style={{ color: "#777" }}>{text}</p>
    </div>
  );
}

function FAQ({ q, a }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <strong>{q}</strong>
      <p style={{ color: "#777" }}>{a}</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 40,
    background: "linear-gradient(180deg,#f3f6ff,#ffffff,#eff2ff)",
  },
  hero: {
    textAlign: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: 900,
  },
  subtitle: {
    maxWidth: 650,
    margin: "10px auto",
    color: "#555",
  },
  tryBtn: {
    marginTop: 12,
    border: "none",
    padding: "12px 18px",
    borderRadius: 14,
    background: "#6c63ff",
    color: "white",
    cursor: "pointer",
  },
  section: {
    marginTop: 40,
    background: "white",
    padding: 25,
    borderRadius: 18,
    boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  },
  roles: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 14,
  },
  roleCard: {
    padding: 20,
    borderRadius: 16,
    background: "#fafafa",
    cursor: "pointer",
    textAlign: "center",
  },
  continueBtn: {
    marginTop: 14,
    padding: 12,
    width: "100%",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "#111",
    color: "white",
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
  },
  feedback: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: "#111",
    color: "white",
    cursor: "pointer",
  },
};
