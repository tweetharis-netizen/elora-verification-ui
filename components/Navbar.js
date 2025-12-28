// components/Navbar.js
import Link from "next/link";
import { useState, useEffect } from "react";
import { getSession, isTeacher } from "@/lib/session";
import Image from "next/image";

export default function Navbar({ theme, setTheme }) {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState({});

  useEffect(() => {
    setSession(getSession());
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 60);
      last = y;
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b border-white/10 transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Image
            src="/elora-logo.png"
            width={36}
            height={36}
            alt="Elora logo"
            className="rounded-md"
          />
          <Link href="/" className="text-xl font-semibold">
            Elora
          </Link>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <Link href="/assistant" className="hover:underline">
            Assistant
          </Link>
          <Link href="/settings" className="hover:underline">
            Settings
          </Link>

          {isTeacher() && (
            <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">
              Teacher
            </span>
          )}

          {session.verified ? (
            <span className="px-2 py-1 text-xs rounded bg-blue-600 text-white">
              Verified
            </span>
          ) : (
            <Link
              href="/verify"
              className="px-3 py-1 rounded-md bg-blue-500 text-white"
            >
              Verify
            </Link>
          )}
        </div>

        <button
          className="sm:hidden text-xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden flex flex-col bg-black/60 text-white p-4 space-y-2">
          <Link href="/">Home</Link>
          <Link href="/assistant">Assistant</Link>
          <Link href="/settings">Settings</Link>
        </div>
      )}
    </nav>
  );
}
