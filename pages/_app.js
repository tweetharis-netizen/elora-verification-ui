import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { getSession, getStored, setStored, STORAGE } from "../lib/session";

function useTheme() {
  const [theme, setTheme] = useState(() => getStored(STORAGE.theme, "dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setStored(STORAGE.theme, next);
  };

  return { theme, toggle };
}

function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY || 0;

    const onScroll = () => {
      const y = window.scrollY || 0;
      if (ticking.current) return;
      ticking.current = true;

      window.requestAnimationFrame(() => {
        const delta = y - lastY.current;

        if (Math.abs(delta) > 8) {
          const goingDown = delta > 0;
          if (y < 40) setHidden(false);
          else setHidden(goingDown);
        }

        lastY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}

function NavLink({ href, children, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const hidden = useHideOnScroll();

  const [session, setSessionState] = useState(() => getSession());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sync = () => setSessionState(getSession());
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [router.pathname]);

  const isVerifyPage = useMemo(
    () => router.pathname === "/verify" || router.pathname === "/success",
    [router.pathname]
  );

  const statusLabel = useMemo(() => {
    if (session.verified) {
      if (session.teacherInvite) return "Teacher ✓";
      return "Verified ✓";
    }
    if (session.guest) return "Guest (limited)";
    return "Unverified";
  }, [session]);

  return (
    <div className="min-h-screen">
      <header
        className={[
          "fixed top-0 left-0 right-0 z-40 transition-transform duration-300",
          hidden ? "-translate-y-full" : "translate-y-0",
        ].join(" ")}
      >
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-2xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl shadow-lg shadow-indigo-500/5">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              {/* Brand */}
              <Link href="/" className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/15 border border-white/10 bg-white/60 dark:bg-slate-950/30 flex items-center justify-center">
                  <Image
                    src="/elora-logo.png"
                    alt="Elora"
                    width={42}
                    height={42}
                    priority
                    className="object-contain"
                  />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                    Elora
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    Plan less. Teach more. Impact forever.
                  </div>
                </div>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-6">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/assistant">Assistant</NavLink>
                <NavLink href="/#faq">FAQ</NavLink>
                <NavLink href="/#feedback">Feedback</NavLink>
              </nav>

              {/* Right controls */}
              <div className="flex items-center gap-2">
                {/* Status pill */}
                <span className="hidden sm:inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-white/10 bg-white/45 dark:bg-slate-950/30 text-slate-700 dark:text-slate-200">
                  {statusLabel}
                </span>

                <button
                  onClick={toggle}
                  className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-bold border border-white/10 bg-white/50 dark:bg-slate-950/35 text-slate-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-950/50"
                >
                  {theme === "dark" ? "Light" : "Dark"}
                </button>

                {/* IMPORTANT: Hide this if already verified */}
                {!isVerifyPage && !session.verified ? (
                  <Link
                    href="/verify"
                    className="hidden sm:inline-flex rounded-full px-5 py-2 text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                  >
                    Sign in / Verify
                  </Link>
                ) : null}

                {/* Mobile menu button */}
                <button
                  type="button"
                  className="md:hidden rounded-full px-4 py-2 text-sm font-extrabold border border-white/10 bg-white/50 dark:bg-slate-950/35 text-slate-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-950/50"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Open menu"
                  aria-expanded={menuOpen ? "true" : "false"}
                >
                  {menuOpen ? "Close" : "Menu"}
                </button>
              </div>
            </div>

            {/* Mobile menu panel */}
            {menuOpen ? (
              <div className="md:hidden border-t border-white/10 px-4 py-3">
                <div className="flex flex-col gap-3">
                  <NavLink href="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
                  <NavLink href="/assistant" onClick={() => setMenuOpen(false)}>Assistant</NavLink>
                  <NavLink href="/#faq" onClick={() => setMenuOpen(false)}>FAQ</NavLink>
                  <NavLink href="/#feedback" onClick={() => setMenuOpen(false)}>Feedback</NavLink>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={toggle}
                      className="rounded-full px-4 py-2 text-sm font-bold border border-white/10 bg-white/50 dark:bg-slate-950/35 text-slate-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-950/50"
                    >
                      {theme === "dark" ? "Light mode" : "Dark mode"}
                    </button>

                    {!isVerifyPage && !session.verified ? (
                      <Link
                        href="/verify"
                        className="rounded-full px-4 py-2 text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                      >
                        Sign in / Verify
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-28 pb-10">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
