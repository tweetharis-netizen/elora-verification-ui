// pages/index.js

import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import Navbar from "../components/Navbar";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState("Educator");

  const handleContinue = () => {
    router.push({
      pathname: "/assistant",
      query: { role },
    });
  };

  const handleGuest = () => {
    router.push({
      pathname: "/assistant",
      query: { role, guest: "true" },
    });
  };

  return (
    <>
      <Head>
        <title>Elora – AI assistant for lessons, practice & parents</title>
      </Head>

      <Navbar />

      <main className="hero-shell">
        <section className="hero">
          <div className="hero-left">
            <p className="hero-pill">Built for real classrooms, not just chat.</p>
            <h1 className="hero-title">Plan less. Teach more. Impact forever.</h1>
            <p className="hero-sub">
              Elora helps educators, students and parents design lessons, generate
              practice, and explain topics in a way that fits each syllabus and level.
            </p>

            <div className="role-section">
              <p className="role-label">Who are you?</p>

              <div className="role-cards">
                <button
                  className={`role-card ${role === "Educator" ? "selected" : ""}`}
                  onClick={() => setRole("Educator")}
                >
                  <span className="role-emoji">📚</span>
                  <span className="role-title">I&apos;m an Educator</span>
                  <span className="role-text">
                    Plan lessons, worksheets, assessments and slides.
                  </span>
                </button>

                <button
                  className={`role-card ${role === "Student" ? "selected" : ""}`}
                  onClick={() => setRole("Student")}
                >
                  <span className="role-emoji">🎓</span>
                  <span className="role-title">I&apos;m a Student</span>
                  <span className="role-text">
                    Homework help, revision plans and practice questions.
                  </span>
                </button>

                <button
                  className={`role-card ${role === "Parent" ? "selected" : ""}`}
                  onClick={() => setRole("Parent")}
                >
                  <span className="role-emoji">👨‍👩‍👧</span>
                  <span className="role-title">I&apos;m a Parent</span>
                  <span className="role-text">
                    Understand lessons and support learning at home.
                  </span>
                </button>
              </div>

              <div className="role-actions">
                <button className="primary-btn" onClick={handleContinue}>
                  Continue
                </button>
                <button className="ghost-btn" onClick={handleGuest}>
                  Try as Guest ✨
                </button>
              </div>

              <p className="guest-note">
                Guest mode is free and instant. Verified accounts unlock saving,
                exporting to Google Slides & Docs, and more.
              </p>
            </div>
          </div>

          <aside className="hero-right">
            <div className="profile-card">
              <p className="profile-label">Active teaching profile</p>
              <p className="profile-main">Singapore · Primary 5 · Math</p>
              <p className="profile-sub">
                Elora turns these choices into expert prompts so you don&apos;t
                have to.
              </p>

              <div className="profile-buttons">
                <button className="profile-btn primary">Plan a lesson</button>
                <button className="profile-btn">Create worksheet</button>
                <button className="profile-btn">Generate assessment</button>
                <button className="profile-btn">Design slides</button>
              </div>

              <p className="profile-foot">
                Works for educators, students, and parents. Designed to fit
                different countries and syllabuses over time.
              </p>
            </div>
          </aside>
        </section>

        <section className="faq-feedback">
          <div className="faq">
            <h2>Frequently Asked Questions</h2>
            <details>
              <summary>Do I need an account?</summary>
              <p>
                You can try Elora instantly as a guest. Accounts only unlock extra
                features like saving and exporting.
              </p>
            </details>
            <details>
              <summary>Who is Elora for?</summary>
              <p>
                Elora is built for educators, students and parents. It adapts its
                tone and suggestions depending on who is using it and what they
                are trying to do.
              </p>
            </details>
            <details>
              <summary>How is Elora different from normal AI chat?</summary>
              <p>
                Instead of making you guess the perfect prompt, Elora asks
                structured questions (country, level, subject, topic and goal)
                and then builds expert prompts for you in the background.
              </p>
            </details>
          </div>

          <div className="feedback">
            <h2>Help us make Elora better</h2>
            <p>
              This is an early prototype. Your feedback will directly shape how
              Elora grows for Genesis 2026.
            </p>
            <button
              className="primary-btn full"
              onClick={() => router.push("/feedback")}
            >
              Send Feedback
            </button>
            <p className="footnote">
              You can also share ideas for new features: slides, Google Docs,
              worksheets and more.
            </p>
          </div>
        </section>

        <footer className="footer">
          <p>© 2025 Elora. Built for schools. Made by Haris · Prototype for Genesis 2026.</p>
        </footer>
      </main>

      <style jsx>{`
        .hero-shell {
          min-height: 100vh;
          background: radial-gradient(
              circle at top left,
              rgba(129, 140, 248, 0.24),
              transparent 55%
            ),
            #f3f4ff;
          padding-bottom: 60px;
        }

        .hero {
          max-width: 1120px;
          margin: 0 auto;
          padding: 32px 20px 8px;
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2.7fr);
          gap: 36px;
        }

        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(79, 70, 229, 0.08);
          color: #4338ca;
          font-size: 12px;
          width: fit-content;
        }

        .hero-title {
          font-size: 36px;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .hero-sub {
          font-size: 15px;
          max-width: 480px;
          color: #4b5563;
        }

        .role-section {
          margin-top: 8px;
        }

        .role-label {
          font-weight: 600;
          margin-bottom: 10px;
        }

        .role-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .role-card {
          text-align: left;
          padding: 14px 14px 12px;
          border-radius: 18px;
          background: white;
          border: 1px solid rgba(148, 163, 184, 0.35);
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: border 0.15s ease, box-shadow 0.15s ease,
            transform 0.12s ease;
        }

        .role-card.selected {
          border-color: #4f46e5;
          box-shadow: 0 12px 30px rgba(79, 70, 229, 0.18);
          transform: translateY(-1px);
        }

        .role-emoji {
          font-size: 18px;
        }

        .role-title {
          font-weight: 600;
        }

        .role-text {
          font-size: 13px;
          color: #6b7280;
        }

        .role-actions {
          display: flex;
          gap: 12px;
          margin-top: 18px;
        }

        .primary-btn {
          border-radius: 999px;
          padding: 10px 22px;
          background: #4f46e5;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .primary-btn.full {
          width: 100%;
          text-align: center;
          justify-content: center;
        }

        .ghost-btn {
          border-radius: 999px;
          padding: 10px 22px;
          border: 1px solid #4f46e5;
          color: #4f46e5;
          font-weight: 500;
          font-size: 14px;
          background: transparent;
        }

        .guest-note {
          font-size: 12px;
          color: #6b7280;
          margin-top: 6px;
        }

        .hero-right {
          display: flex;
          align-items: center;
        }

        .profile-card {
          width: 100%;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
          padding: 20px 20px 18px;
        }

        .profile-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.13em;
          color: #6b7280;
        }

        .profile-main {
          margin-top: 6px;
          font-weight: 700;
        }

        .profile-sub {
          margin-top: 6px;
          font-size: 13px;
          color: #6b7280;
        }

        .profile-buttons {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .profile-btn {
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 13px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: #f9fafb;
        }

        .profile-btn.primary {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .profile-foot {
          margin-top: 10px;
          font-size: 12px;
          color: #6b7280;
        }

        .faq-feedback {
          max-width: 1120px;
          margin: 32px auto 0;
          padding: 0 20px;
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
          gap: 32px;
        }

        .faq h2,
        .feedback h2 {
          font-size: 20px;
          margin-bottom: 10px;
        }

        details {
          background: #ffffff;
          border-radius: 14px;
          padding: 10px 12px;
          margin-bottom: 8px;
          border: 1px solid rgba(148, 163, 184, 0.4);
        }

        summary {
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
        }

        details p {
          margin-top: 6px;
          font-size: 13px;
          color: #4b5563;
        }

        .feedback {
          background: #ffffff;
          border-radius: 18px;
          padding: 16px 16px 14px;
          border: 1px solid rgba(148, 163, 184, 0.4);
        }

        .feedback p {
          font-size: 13px;
          color: #4b5563;
        }

        .footnote {
          margin-top: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .footer {
          margin-top: 28px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: minmax(0, 1fr);
          }

          .hero-right {
            order: -1;
          }

          .role-cards {
            grid-template-columns: minmax(0, 1fr);
          }

          .faq-feedback {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </>
  );
}
