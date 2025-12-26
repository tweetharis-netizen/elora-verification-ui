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

// Smooth hide-on-scroll navbar (production-grade: throttled + no flicker)
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

        // Ignore tiny scroll jitter
        if (Math.abs(delta) > 8) {
          const goingDown = delta > 0;
          // Keep navbar visible near the very top
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

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const hidden = useHideOnScroll();

  const [session, setSessionState] = useState(() => getSession());
  useEffect(() => {
    const sync = () => setSessionState(getSession());
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const isVerifyPage = useMemo(
    () => router.pathname === "/verify" || router.pathname === "/success",
    [router.pathname]
  );

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <header
        className={[
          "fixed top-0 left-0 right-0 z-40 transition-transform duration-300",
          hidden ? "-translate-y-full" : "translate-y-0"
        ].join(" ")}
      >
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-2xl border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl shadow-lg shadow-indigo-500/5">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              {/* Brand */}
              <Link href="/" className="flex items-center gap-3">
                {/* Logo: bigger + clearer, but not shouty */}
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
                <div className="leading-tight">
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    Elora
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    AI co-teacher for lessons, practice & parents.
                  </div>
                </div>
              </Link>

              {/* Nav links */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Link className="hover:text-slate-900 dark:hover:text-white" href="/">
                  Home
                </Link>
                <Link className="hover:text-slate-900 dark:hover:text-white" href="/assistant">
                  Assistant
                </Link>
                <Link className="hover:text-slate-900 dark:hover:text-white" href="/#faq">
                  FAQ
                </Link>
                <Link className="hover:text-slate-900 dark:hover:text-white" href="/#feedback">
                  Feedback
                </Link>
              </nav>

              {/* Right controls */}
              <div className="flex items-center gap-2">
                {/* Status pill */}
                {!session.verified ? (
                  <span className="hidden sm:inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-white/10 bg-white/45 dark:bg-slate-950/30 text-slate-700 dark:text-slate-200">
                    {session.guest ? "Guest (limited)" : "Unverified"}
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                    Verified ✓
                  </span>
                )}

                <button
                  onClick={toggle}
                  className="rounded-full px-4 py-2 text-sm font-bold border border-white/10 bg-white/50 dark:bg-slate-950/35 text-slate-900 dark:text-white hover:bg-white/70 dark:hover:bg-slate-950/50"
                >
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>

                {/* Keep a single Sign in/Verify button (navbar only) */}
                {!isVerifyPage ? (
                  <Link
                    href="/verify"
                    className="rounded-full px-5 py-2 text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                  >
                    Sign in / Verify
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page */}
      <main className="mx-auto max-w-6xl px-4 pt-28 pb-10">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
