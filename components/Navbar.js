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

    // Keep verified badge reasonably fresh (localStorage-based session)
    const onFocus = () => setSession(getSession());

    window.addEventListener("scroll", onScroll);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="backdrop-blur-xl border-b border-white/10 bg-white/60 dark:bg-slate-950/45">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 bg-white/50 dark:bg-slate-950/30">
                <Image
                  src="/elora-logo.png"
                  width={40}
                  height={40}
                  alt="Elora logo"
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <span className="hidden sm:inline text-lg font-black tracking-tight text-slate-950 dark:text-white">
                Elora
              </span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-5 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <Link href="/" className="hover:opacity-90">
              Home
            </Link>
            <Link href="/assistant" className="hover:opacity-90">
              Assistant
            </Link>
            <Link href="/help" className="hover:opacity-90">
              Help
            </Link>
            <Link href="/settings" className="hover:opacity-90">
              Settings
            </Link>

            {isTeacher() && (
              <span className="px-2.5 py-1 text-xs rounded-full border border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 font-extrabold">
                Teacher
              </span>
            )}

            {session.verified ? (
              <span className="px-2.5 py-1 text-xs rounded-full border border-indigo-400/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200 font-extrabold">
                Verified
              </span>
            ) : (
              <Link
                href="/verify"
                className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/20"
              >
                Verify
              </Link>
            )}
          </div>

          <button
            className="sm:hidden h-10 w-10 rounded-xl border border-white/10 bg-white/50 dark:bg-slate-950/35 text-slate-900 dark:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden px-4 pb-4">
            <div className="rounded-2xl border border-white/10 bg-white/65 dark:bg-slate-950/55 backdrop-blur-xl p-4">
              <div className="flex flex-col space-y-3 text-sm font-semibold text-slate-900 dark:text-white">
                <Link href="/" onClick={() => setMenuOpen(false)} className="hover:opacity-90">
                  Home
                </Link>
                <Link href="/assistant" onClick={() => setMenuOpen(false)} className="hover:opacity-90">
                  Assistant
                </Link>
                <Link href="/help" onClick={() => setMenuOpen(false)} className="hover:opacity-90">
                  Help
                </Link>
                <Link href="/settings" onClick={() => setMenuOpen(false)} className="hover:opacity-90">
                  Settings
                </Link>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  {isTeacher() ? (
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-200">
                      Teacher
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Standard
                    </span>
                  )}

                  {session.verified ? (
                    <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-200">
                      Verified
                    </span>
                  ) : (
                    <Link
                      href="/verify"
                      onClick={() => setMenuOpen(false)}
                      className="text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl"
                    >
                      Verify
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
