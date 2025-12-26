import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { getSession, getStored, setStored, STORAGE } from "../lib/session";

function useTheme() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = getStored(STORAGE.theme, "");
    const initial =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
        ? "dark"
        : "light";

    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    setStored(STORAGE.theme, initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    setStored(STORAGE.theme, next);
  };

  return { theme, toggle };
}

function EloraShell({ children }) {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  // session badge (guest/verified)
  const [session, setSession] = useState({ role: "", guest: false, verified: false });
  useEffect(() => {
    const s = getSession();
    setSession(s);
    const onFocus = () => setSession(getSession());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // hide-on-scroll navbar
  const [navVisible, setNavVisible] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY || 0;

    const THRESHOLD = 10;
    const HIDE_AFTER = 72;

    const onScroll = () => {
      const y = window.scrollY || 0;
      if (ticking.current) return;
      ticking.current = true;

      window.requestAnimationFrame(() => {
        const delta = y - lastY.current;

        if (y <= HIDE_AFTER) setNavVisible(true);
        else if (delta > THRESHOLD) setNavVisible(false);
        else if (delta < -THRESHOLD) setNavVisible(true);

        lastY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const homeFaqHref = useMemo(() => (router.pathname === "/" ? "#faq" : "/#faq"), [router.pathname]);
  const homeFeedbackHref = useMemo(() => (router.pathname === "/" ? "#feedback" : "/#feedback"), [router.pathname]);

  const badge = session.verified
    ? { text: "Verified", cls: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20" }
    : session.guest
    ? { text: "Guest", cls: "bg-amber-500/15 text-amber-200 border-amber-400/20" }
    : { text: "Unverified", cls: "bg-slate-500/10 text-slate-300 border-white/10" };

  return (
    <div className="min-h-screen">
      <header
        className={[
          "sticky top-0 z-30 backdrop-blur-xl border-b border-white/10",
          "bg-white/70 dark:bg-slate-950/50",
          "transition-transform duration-200 will-change-transform",
          navVisible ? "translate-y-0 shadow-sm" : "-translate-y-[110%] shadow-none",
        ].join(" ")}
      >
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shadow-lg shadow-indigo-500/20 border border-white/10">
              <Image src="/elora-logo.png" alt="Elora" width={36} height={36} priority />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold text-slate-900 dark:text-white">Elora</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                AI co-teacher for lessons, practice & parents.
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
              Home
            </Link>
            <Link
              href="/assistant"
              className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              Assistant
            </Link>
            <Link href={homeFaqHref} className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
              FAQ
            </Link>
            <Link
              href={homeFeedbackHref}
              className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              Feedback
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs border ${badge.cls}`}>
              {badge.text}
            </span>

            <button
              type="button"
              onClick={toggle}
              className="px-3 py-2 rounded-full text-sm border border-slate-900/10 dark:border-white/10 bg-white/60 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 hover:bg-white/90 dark:hover:bg-slate-950/70"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = "/verify")}
              className="px-4 py-2 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            >
              Sign in / Verify
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export default function MyApp({ Component, pageProps }) {
  return (
    <EloraShell>
      <Component {...pageProps} />
    </EloraShell>
  );
}
