// components/Navbar.js
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getSession, isTeacher } from "@/lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState({});

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();

    let last = 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      setHidden(y > last && y > 72);
      last = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("focus", sync);
    window.addEventListener("elora:session", sync);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("focus", sync);
      window.removeEventListener("elora:session", sync);
    };
  }, []);

  const verified = Boolean(session.verified);
  const teacher = isTeacher();

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300",
        hidden ? "-translate-y-full" : "translate-y-0",
        "border-b border-white/10",
        "bg-white/65 dark:bg-slate-950/55 backdrop-blur-xl",
        "shadow-lg shadow-slate-900/5 dark:shadow-black/30"
      )}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-3 sm:px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="sr-only">Elora</span>
            <Image
              src="/elora-logo.png"
              width={40}
              height={40}
              alt="Elora logo"
              className="rounded-xl"
              priority
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/assistant"
            className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white"
          >
            Assistant
          </Link>
          <Link
            href="/settings"
            className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white"
          >
            Settings
          </Link>

          <div className="flex items-center gap-2">
            {teacher ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
                Teacher
              </span>
            ) : null}

            {verified ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border border-sky-400/30 bg-sky-500/10 text-sky-800 dark:text-sky-200">
                Verified
              </span>
            ) : (
              <Link
                href="/verify"
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
              >
                Verify
              </Link>
            )}
          </div>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/55 dark:bg-slate-950/45 text-slate-900 dark:text-white"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {menuOpen ? (
        <div className="md:hidden px-3 pb-3">
          <div className="rounded-2xl border border-white/10 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl p-3 space-y-2 shadow-lg shadow-slate-900/5 dark:shadow-black/30">
            <Link
              href="/"
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-white/70 dark:hover:bg-slate-950/60"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/assistant"
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-white/70 dark:hover:bg-slate-950/60"
              onClick={() => setMenuOpen(false)}
            >
              Assistant
            </Link>
            <Link
              href="/settings"
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-white/70 dark:hover:bg-slate-950/60"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>

            <div className="pt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {teacher ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
                    Teacher
                  </span>
                ) : null}
                {verified ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border border-sky-400/30 bg-sky-500/10 text-sky-800 dark:text-sky-200">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border border-white/10 bg-white/50 dark:bg-slate-950/45 text-slate-700 dark:text-slate-200">
                    Unverified
                  </span>
                )}
              </div>

              {!verified ? (
                <Link
                  href="/verify"
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Verify
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
