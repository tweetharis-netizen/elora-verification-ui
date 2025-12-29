// components/Navbar.js
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
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
      const y = window.scrollY;
      setHidden(y > last && y > 80);
      last = y;
    };

    window.addEventListener("scroll", onScroll);
    window.addEventListener("elora:session", sync);
    window.addEventListener("focus", sync);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("elora:session", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const verified = !!session.verified;
  const teacher = isTeacher();

  const NavLinks = ({ onClick }) => (
    <>
      <Link href="/" onClick={onClick} className="hover:opacity-90">
        Home
      </Link>
      <Link href="/assistant" onClick={onClick} className="hover:opacity-90">
        Assistant
      </Link>
      <Link href="/help" onClick={onClick} className="hover:opacity-90">
        Help
      </Link>
      <Link href="/settings" onClick={onClick} className="hover:opacity-90">
        Settings
      </Link>
    </>
  );

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300",
        hidden ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="backdrop-blur-xl border-b border-white/10 bg-white/65 dark:bg-slate-950/55">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 bg-white/60 dark:bg-slate-950/30">
              <Image
                src="/elora-logo.png"
                width={64}
                height={64}
                alt="Elora"
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <span className="hidden sm:inline text-lg font-black text-slate-950 dark:text-white tracking-tight">
              Elora
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-5 text-sm font-bold text-slate-800 dark:text-slate-200">
            <NavLinks />
          </div>

          <div className="flex items-center gap-2">
            {teacher ? (
              <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                Teacher ✓
              </span>
            ) : null}

            {verified ? (
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-extrabold border border-indigo-400/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200">
                Verified
              </span>
            ) : (
              <Link
                href="/verify"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
              >
                Verify
              </Link>
            )}

            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 bg-white/55 dark:bg-slate-950/35 text-slate-900 dark:text-white"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="md:hidden px-4 pb-4">
            <div className="rounded-2xl border border-white/10 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl p-4">
              <div className="flex flex-col gap-3 text-sm font-bold text-slate-900 dark:text-white">
                <NavLinks onClick={() => setMenuOpen(false)} />
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  {teacher ? (
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-200">
                      Teacher ✓
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Standard
                    </span>
                  )}
                  {verified ? (
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
        ) : null}
      </div>
    </nav>
  );
}
