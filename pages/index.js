// pages/index.js

import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState("educator");

  const roleLabel = useMemo(() => {
    if (role === "student") return "Student";
    if (role === "parent") return "Parent";
    return "Educator";
  }, [role]);

  const handleContinue = () => {
    router.push({
      pathname: "/assistant",
      query: { role },
    });
  };

  const handleGuest = () => {
    router.push({
      pathname: "/assistant",
      query: { role, guest: "1" },
    });
  };

  const scrollToId = (id) => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Head>
        <title>Elora — Plan less. Teach more.</title>
        <meta
          name="description"
          content="Elora is an AI teaching assistant for educators, students and parents—lesson plans, worksheets, assessments and explanations that fit your level and syllabus."
        />
      </Head>

      <main className="hero-shell">
        <section className="hero">
          <div className="hero-left">
            <p className="hero-pill">Built for real classrooms — not generic chat.</p>
            <h1 className="hero-title">Plan less. Teach more.</h1>
            <p className="hero-sub">
              Elora turns your role, level and topic into classroom-ready lessons,
              worksheets, assessments, and slide outlines — without the messy prompting.
            </p>

            <div className="role-cards" aria-label="Choose your role">
              <button
                type="button"
                className={`role-card ${role === "educator" ? "active" : ""}`}
                onClick={() => setRole("educator")}
              >
                <div className="role-title">I’m an Educator</div>
                <div className="role-sub">
                  Plan lessons, generate practice, build assessments, design slides.
                </div>
              </button>

              <button
                type="button"
                className={`role-card ${role === "student" ? "active" : ""}`}
                onClick={() => setRole("student")}
              >
                <div className="role-title">I’m a Student</div>
                <div className="role-sub">
                  Get explanations, worked examples, revision plans, and practice.
                </div>
              </button>

              <button
                type="button"
                className={`role-card ${role === "parent" ? "active" : ""}`}
                onClick={() => setRole("parent")}
              >
                <div className="role-title">I’m a Parent</div>
                <div className="role-sub">
                  Understand what your child is learning and how to help at home.
                </div>
              </button>
            </div>

            <div className="hero-cta">
              <button
                type="button"
                className="cta primary"
                onClick={handleContinue}
              >
                Continue as {roleLabel}
              </button>
              <button type="button" className="cta" onClick={handleGuest}>
                Try as guest
              </button>
            </div>

            <div className="hero-links">
              <button type="button" className="hero-link" onClick={() => scrollToId("faq")}>
                Read FAQ
              </button>
              <span className="dot">•</span>
              <button type="button" className="hero-link" onClick={() => scrollToId("feedback")}>
                Send feedback
              </button>
            </div>
          </div>

          <aside className="hero-right">
            <div className="profile-card">
              <p className="profile-label">Active teaching profile (example)</p>
              <p className="profile-main">Singapore · Primary 5 · Math</p>
              <p className="profile-sub">
                Elora turns these choices into expert prompts behind the scenes — you just choose and generate.
              </p>

              <div className="profile-buttons">
                <button
                  type="button"
                  className="profile-btn primary"
                  onClick={() => router.push({ pathname: "/assistant", query: { role, action: "lesson" } })}
                >
                  Plan a lesson
                </button>
                <button
                  type="button"
                  className="profile-btn"
                  onClick={() => router.push({ pathname: "/assistant", query: { role, action: "worksheet" } })}
                >
                  Create worksheet
                </button>
                <button
                  type="button"
                  className="profile-btn"
                  onClick={() => router.push({ pathname: "/assistant", query: { role, action: "assessment" } })}
                >
                  Generate assessment
                </button>
                <button
                  type="button"
                  className="profile-btn"
                  onClick={() => router.push({ pathname: "/assistant", query: { role, action: "slides" } })}
                >
                  Design slides
                </button>
              </div>

              <p className="profile-foot">
                Designed to fit real syllabuses over time — not one-size-fits-all prompts.
              </p>
            </div>
          </aside>
        </section>

        <section className="faq-feedback" id="faq">
          <div className="faq">
            <h2>Frequently Asked Questions</h2>

            <details>
              <summary>Do I need an account?</summary>
              <p>
                You can try Elora instantly as a guest. Accounts are only for extra
                features like saving and exporting.
              </p>
            </details>

            <details>
              <summary>Who is Elora for?</summary>
              <p>
                Elora is built for educators, students and parents. It adapts its
                output depending on the role, country/region, and education level.
              </p>
            </details>

            <details>
              <summary>How is Elora different from normal AI chat?</summary>
              <p>
                Normal chat is unstructured. Elora first collects a teaching profile
                (role, country, level, subject, topic, goal), then generates expert
                prompts automatically to produce lesson-ready results.
              </p>
            </details>

            <details>
              <summary>Can Elora match my country’s syllabus?</summary>
              <p>
                Elora adapts language and expectations when a country is specified (e.g., Singapore),
                and keeps explanations aligned to the level you choose.
              </p>
            </details>
          </div>

          <div className="feedback" id="feedback">
            <h2>Feedback</h2>
            <p>
              Elora is being built with real classrooms in mind. Tell me what you want next:
              export to Google Docs/Slides, worksheet formats, better question types, anything.
            </p>
            <button
              type="button"
              className="feedback-btn"
              onClick={() => {
                if (typeof window !== "undefined") {
                  const email = "mailto:feedback@elora.app?subject=Elora%20Feedback";
                  window.location.href = email;
                }
              }}
            >
              Send Feedback (email)
            </button>
            <p className="footnote">
              Prototype for Genesis 2026 — feedback helps prioritise what ships next.
            </p>
          </div>
        </section>

        <footer className="footer">
          <p>© 2025 Elora. Built for schools. Prototype for Genesis 2026.</p>
        </footer>
      </main>

      <style jsx>{`
        /* (unchanged styling; kept inline for now) */
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
          padding: 44px 20px 24px;
          display: grid;
          grid-template-columns: 1.2fr 0.85fr;
          gap: 26px;
        }

        .hero-left {
          padding-top: 12px;
        }

        .hero-pill {
          display: inline-flex;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(79, 70, 229, 0.08);
          border: 1px solid rgba(79, 70, 229, 0.18);
          color: #312e81;
          font-weight: 650;
          letter-spacing: 0.01em;
          font-size: 0.9rem;
        }

        .hero-title {
          margin-top: 14px;
          font-size: clamp(2.2rem, 4vw, 3.2rem);
          line-height: 1.06;
          font-weight: 800;
          color: #0f172a;
        }

        .hero-sub {
          margin-top: 12px;
          font-size: 1.05rem;
          line-height: 1.6;
          color: rgba(15, 23, 42, 0.78);
          max-width: 60ch;
        }

        .role-cards {
          margin-top: 18px;
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
          gap: 6px;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .role-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
        }

        .role-card.active {
          border-color: rgba(79, 70, 229, 0.55);
          box-shadow: 0 18px 38px rgba(79, 70, 229, 0.12);
        }

        .role-title {
          font-weight: 750;
          color: #0f172a;
          font-size: 1rem;
        }

        .role-sub {
          font-size: 0.92rem;
          line-height: 1.45;
          color: rgba(15, 23, 42, 0.72);
        }

        .hero-cta {
          margin-top: 18px;
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .cta {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          background: white;
          font-weight: 700;
          color: #0f172a;
          cursor: pointer;
        }

        .cta.primary {
          background: linear-gradient(90deg, #4f46e5, #7c3aed);
          color: white;
          border: none;
          box-shadow: 0 16px 34px rgba(79, 70, 229, 0.2);
        }

        .hero-links {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(15, 23, 42, 0.72);
          font-size: 0.92rem;
        }

        .hero-link {
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          color: rgba(79, 70, 229, 0.95);
          font-weight: 650;
        }

        .dot {
          opacity: 0.5;
        }

        .hero-right {
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding-top: 6px;
        }

        .profile-card {
          width: 100%;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.35);
          border-radius: 20px;
          padding: 18px 18px 16px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(10px);
        }

        .profile-label {
          text-transform: uppercase;
          font-size: 0.74rem;
          letter-spacing: 0.14em;
          color: rgba(15, 23, 42, 0.55);
          font-weight: 750;
        }

        .profile-main {
          margin-top: 10px;
          font-weight: 800;
          color: #0f172a;
          font-size: 1.08rem;
        }

        .profile-sub {
          margin-top: 8px;
          color: rgba(15, 23, 42, 0.7);
          line-height: 1.55;
          font-size: 0.96rem;
        }

        .profile-buttons {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .profile-btn {
          padding: 10px 10px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          background: white;
          cursor: pointer;
          font-weight: 700;
          color: #0f172a;
          font-size: 0.92rem;
        }

        .profile-btn.primary {
          background: rgba(79, 70, 229, 0.1);
          border-color: rgba(79, 70, 229, 0.35);
          color: #312e81;
        }

        .profile-foot {
          margin-top: 14px;
          font-size: 0.92rem;
          line-height: 1.5;
          color: rgba(15, 23, 42, 0.65);
        }

        .faq-feedback {
          max-width: 1120px;
          margin: 0 auto;
          padding: 24px 20px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 22px;
        }

        .faq,
        .feedback {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.35);
          border-radius: 20px;
          padding: 18px 18px 16px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        }

        h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #0f172a;
          font-weight: 850;
        }

        details {
          margin-top: 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.25);
          padding-top: 12px;
        }

        summary {
          cursor: pointer;
          font-weight: 750;
          color: #0f172a;
        }

        details p {
          margin: 10px 0 0;
          color: rgba(15, 23, 42, 0.72);
          line-height: 1.6;
        }

        .feedback p {
          margin-top: 10px;
          color: rgba(15, 23, 42, 0.72);
          line-height: 1.6;
        }

        .feedback-btn {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(90deg, #0ea5e9, #4f46e5);
          color: white;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 18px 40px rgba(14, 165, 233, 0.18);
        }

        .footnote {
          margin-top: 10px;
          font-size: 0.92rem;
          color: rgba(15, 23, 42, 0.62);
        }

        .footer {
          max-width: 1120px;
          margin: 0 auto;
          padding: 16px 20px 0;
          color: rgba(15, 23, 42, 0.55);
          font-size: 0.92rem;
        }

        @media (max-width: 980px) {
          .hero {
            grid-template-columns: 1fr;
          }
          .hero-right {
            justify-content: flex-start;
          }
          .faq-feedback {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 740px) {
          .role-cards {
            grid-template-columns: 1fr;
          }
          .profile-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
