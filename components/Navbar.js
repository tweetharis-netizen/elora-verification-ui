// components/Navbar.js
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getSession, isTeacher } from "@/lib/session";

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
  const teacher = isTeacher();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {/* Always readable: dark glass bar */}
      <div className="backdrop-blur-xl bg-slate-950/70 border-b border-white/10">
        <div className="mx-auto max-w-6xl flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Image
              src="/elora-logo.png"
              width={34}
              height={34}
              alt="Elora logo"
              className="rounded-md"
              priority
            />
            <Link href="/" className="text-xl font-extrabold text-white">
              Elora
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <Link href="/" className="text-slate-200 hover:text-white">
              Home
            </Link>
            <Link href="/assistant" className="text-slate-200 hover:text-white">
              Assistant
            </Link>
            <Link href="/settings" className="text-slate-200 hover:text-white">
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
            className="sm:hidden text-xl text-white"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden flex flex-col border-t border-white/10 text-white p-4 space-y-2">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link href="/assistant" onClick={() => setMenuOpen(false)}>
              Assistant
            </Link>
            <Link href="/settings" onClick={() => setMenuOpen(false)}>
              Settings
            </Link>
            {!verified ? (
              <Link
                href="/verify"
                onClick={() => setMenuOpen(false)}
                className="font-bold"
              >
                Verify
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </nav>
  );
}
