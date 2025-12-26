import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [show, setShow] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastY) {
        setShow(false); // scrolling down
      } else {
        setShow(true); // scrolling up
      }
      setLastY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastY]);

  return (
    <>
      <nav className={`nav ${show ? "visible" : "hidden"}`}>
        <div className="content">
          <div className="left">
            <img src="/logo.png" className="logo" alt="Elora" />
            <span className="brand">Elora</span>
          </div>

          <div className="right">
            <Link href="/">Home</Link>
            <Link href="/assistant">Assistant</Link>
            <Link href="/faq">FAQ</Link>
            <button className="verify">Sign in / Verify</button>
          </div>
        </div>
      </nav>

      <style jsx>{`
        .nav {
          position: sticky;
          top: 0;
          width: 100%;
          z-index: 9999;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          transition: transform 0.35s ease;
        }

        .hidden {
          transform: translateY(-100%);
        }

        .visible {
          transform: translateY(0%);
        }

        .content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
        }

        .left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo {
          height: 36px;
          width: 36px;
          border-radius: 50%;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        }

        .brand {
          font-weight: 700;
          font-size: 18px;
        }

        .right {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        a {
          font-size: 15px;
        }

        .verify {
          background: #4f46e5;
          color: white;
          padding: 8px 16px;
          border-radius: 999px;
        }
      `}</style>
    </>
  );
}
