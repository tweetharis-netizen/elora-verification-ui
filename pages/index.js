// pages/index.js
import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState(null);

  const selectRole = (value) => setRole(value);

  const continueFlow = () => {
    if (!role) return alert("Please select a role to continue.");
    localStorage.setItem("elora_role", role);
    localStorage.removeItem("elora_guest");
    router.push("/onboarding");
  };

  const guestMode = () => {
    localStorage.setItem("elora_guest", "true");
    localStorage.removeItem("elora_role");
    router.push("/assistant");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, rgba(240,242,255,1) 0%, rgba(248,249,255,1) 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          background: "white",
          borderRadius: "22px",
          padding: "40px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.08)",
        }}
      >
        {/* HEADER */}
        <h1 style={{ textAlign: "center", fontSize: "36px", marginBottom: "10px" }}>
          Elora
        </h1>
        <p style={{ textAlign: "center", color: "#555", marginBottom: "30px" }}>
          Your AI Companion for Education — Created for Teachers, Students, and Parents.
        </p>

        {/* ROLE SELECT */}
        <h3 style={{ textAlign: "center", marginBottom: "15px" }}>
          Choose your role
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <RoleCard
            label="Educator"
            description="Plan lessons, worksheets, assessments and more."
            icon="🎓"
            active={role === "educator"}
            onClick={() => selectRole("educator")}
          />

          <RoleCard
            label="Student"
            description="Homework help, study guidance and practice tools."
            icon="📘"
            active={role === "student"}
            onClick={() => selectRole("student")}
          />

          <RoleCard
            label="Parent"
            description="Understand lessons and support learning at home."
            icon="👨‍👩‍👧"
            active={role === "parent"}
            onClick={() => selectRole("parent")}
          />
        </div>

        <button
          onClick={continueFlow}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: "none",
            background: "#635BFF",
            color: "white",
            fontSize: "17px",
            cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          Continue
        </button>

        <button
          onClick={guestMode}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "12px",
            background: "white",
            border: "2px solid #635BFF",
            color: "#635BFF",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Try as Guest
        </button>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#777" }}>
          Guest mode has limited features and does not save progress.
        </p>

        {/* DIVIDER */}
        <hr style={{ margin: "30px 0", opacity: 0.3 }} />

        {/* FAQ SECTION */}
        <h3>FAQ</h3>
        <FAQ q="What is Elora?" a="Elora is an AI assistant designed to help teachers create lessons, help students study smarter, and help parents support learning." />
        <FAQ q="Is it free?" a="Yes. Elora is currently free while in development. Some future premium features may come later." />
        <FAQ q="Do I need an account?" a="Educators require verification to unlock advanced tools. Guest mode is free with limited access." />

        {/* FOOTER */}
        <div style={{ marginTop: "25px" }}>
          <h3>Give Feedback</h3>
          <p style={{ color: "#666" }}>
            Help us improve Elora. Tell us what to build next!
          </p>
          <button
            onClick={() =>
              window.open("mailto:elora.feedback.team@gmail.com", "_blank")
            }
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              background: "#111",
              color: "white",
              cursor: "pointer",
            }}
          >
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ label, description, icon, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "20px",
        borderRadius: "14px",
        border: active ? "3px solid #635BFF" : "1px solid #ddd",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: "30px", marginBottom: "8px" }}>{icon}</div>
      <strong>{label}</strong>
      <p style={{ fontSize: "13px", color: "#666" }}>{description}</p>
    </div>
  );
}

function FAQ({ q, a }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <strong>{q}</strong>
      <p style={{ marginTop: "3px", color: "#666" }}>{a}</p>
    </div>
  );
}
