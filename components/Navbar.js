// components/Navbar.js

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;

      // scroll down → hide
      if (currentY > lastY && currentY > 40) {
        setVisible(false);
      } else {
        // scroll up → show
        setVisible(true);
      }

      setLastY(currentY);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  return (
    <>
      <header className={`elora-nav ${visible ? "nav-show" : "nav-hide"}`}>
        <div className="nav-inner">
          <div className="nav-left">
            <img
              src="/elora-logo.png"
              alt="Elora logo"
              className="nav-logo"
            />
            <span className="nav-brand">Elora</span>
          </div>

          <nav className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/assistant">Assistant</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/feedback">Feedback</Link>
          </nav>

          <div className="nav-actions">
            <button className="nav-auth">Sign in / Verify</button>
          </div>
        </div>
      </header>

      <style jsx>{`
        .elora-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          width: 100%;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
          transition: transform 0.32s ease, box-shadow 0.2s ease;
        }

        .nav-show {
          transform: translateY(0);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.03);
        }

        .nav-hide {
          transform: translateY(-100%);
          box-shadow: none;
        }

        .nav-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-logo {
          width: 36px;
          height: 36px;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(79, 70, 229, 0.25);
        }

        .nav-brand {
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.02em;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 18px;
          font-size: 14px;
        }

        .nav-links :global(a) {
          color: #1f2933;
          opacity: 0.8;
        }

        .nav-links :global(a:hover) {
          opacity: 1;
        }

        .nav-actions .nav-auth {
          border-radius: 999px;
          padding: 7px 16px;
          background: #4f46e5;
          color: #ffffff;
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .nav-inner {
            padding: 8px 16px;
            gap: 12px;
          }
          .nav-links {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
