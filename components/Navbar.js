// components/Navbar.js
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getSession } from "@/lib/session";

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState({});

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();

    window.addEventListener("elora:session", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("storage", (e) => {
      if (e.key === "elora_session") sync();
    });

    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 60);
      last = y;
    };
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("elora:session", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const verified = Boolean(session.verified);
  const teacher = Boolean(session.teacher);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10 dark:border-white/10 transition-transform duration-300 ${
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
            priority
          />
          <Link href="/" className="text-xl font-extrabold text-slate-950 dark:text-white">
            Elora
          </Link>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <Link href="/" className="text-slate-800 dark:text-slate-200 hover:underline">
            Home
          </Link>
          <Link href="/assistant" className="text-slate-800 dark:text-slate-200 hover:underline">
            Assistant
          </Link>
          <Link href="/settings" className="text-slate-800 dark:text-slate-200 hover:underline">
            Settings
          </Link>

          {teacher ? (
            <span className="px-2 py-1 text-xs rounded-full bg-emerald-600/90 text-white font-bold">
              Teacher
            </span>
          ) : null}

          {verified ? (
            <span className="px-2 py-1 text-xs rounded-full bg-sky-600/90 text-white font-bold">
              Verified
            </span>
          ) : (
            <Link
              href="/verify"
              className="px-3 py-1 rounded-full bg-indigo-600 text-white font-extrabold hover:bg-indigo-700"
            >
              Verify
            </Link>
          )}
        </div>

        <button
          className="sm:hidden text-xl text-slate-900 dark:text-white"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden flex flex-col border-t border-white/10 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl text-slate-900 dark:text-white p-4 space-y-2">
          <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/assistant" onClick={() => setMenuOpen(false)}>Assistant</Link>
          <Link href="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
          {!verified ? (
            <Link href="/verify" onClick={() => setMenuOpen(false)} className="font-bold">
              Verify
            </Link>
          ) : null}
        </div>
      )}
    </nav>
  );
}
