import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";

function EloraShell({ children }) {
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [navVisible, setNavVisible] = useState(true);

  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  // Load theme once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("elora-theme");
    const preferred = saved || "light";
    setTheme(preferred);
    document.documentElement.setAttribute("data-theme", preferred);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("elora-theme", next);
      document.documentElement.setAttribute("data-theme", next);
    }
  };

  // Hide-on-scroll navbar (down = hide, up = show). Throttled via rAF, passive listener.
  useEffect(() => {
    if (typeof window === "undefined") return;

    lastScrollYRef.current = window.scrollY || 0;

    const THRESHOLD_PX = 10; // ignore tiny jitter
    const HIDE_AFTER_PX = 64; // don't hide while near top

    const onScroll = () => {
      const currentY = window.scrollY || 0;

      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const lastY = lastScrollYRef.current;
        const delta = currentY - lastY;

        // Always show near top
        if (currentY <= HIDE_AFTER_PX) {
          setNavVisible(true);
        } else if (delta > THRESHOLD_PX) {
          // scrolling down
          setNavVisible(false);
        } else if (delta < -THRESHOLD_PX) {
          // scrolling up
          setNavVisible(true);
        }

        lastScrollYRef.current = currentY;
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const homeFaqHref = useMemo(() => {
    return router.pathname === "/" ? "#faq" : "/#faq";
  }, [router.pathname]);

  const homeFeedbackHref = useMemo(() => {
    return router.pathname === "/" ? "#feedback" : "/#feedback";
  }, [router.pathname]);

  return (
    <div className="elora-shell">
      <Head>
        <title>Elora — AI teaching partner</title>
        <meta
          name="description"
          content="Elora is an AI teaching assistant for educators, students, and parents—lessons, worksheets, assessments, and explanations that fit your level and syllabus."
        />
        <link rel="icon" href="/elora-logo.png" />
      </Head>

      <header
        className={[
          "elora-nav",
          navVisible ? "elora-nav--visible" : "elora-nav--hidden",
        ].join(" ")}
      >
        <div className="elora-nav-inner">
          <div className="elora-nav-left">
            <div className="elora-logo-badge" aria-hidden="true">
              <Image
                src="/elora-logo.png"
                alt=""
                width={28}
                height={28}
                priority
              />
            </div>
            <div>
              <div className="elora-nav-title">Elora</div>
              <div className="text-[0.78rem] text-slate-500 dark:text-slate-300">
                AI co-teacher for lessons, practice & parents.
              </div>
            </div>
          </div>

          <div className="elora-nav-right">
            <nav className="elora-nav-links hidden sm:flex" aria-label="Primary">
              <Link href="/" className="elora-nav-link">
                Home
              </Link>
              <Link href="/assistant" className="elora-nav-link">
                Assistant
              </Link>
              <Link href={homeFaqHref} className="elora-nav-link">
                FAQ
              </Link>
              <Link href={homeFeedbackHref} className="elora-nav-link">
                Feedback
              </Link>
            </nav>

            <button
              type="button"
              className="elora-ghost-button"
              onClick={toggleTheme}
            >
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>

            <button
              type="button"
              className="elora-primary-button hidden sm:inline-flex"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/verify";
                }
              }}
            >
              Sign in / Verify
            </button>
          </div>
        </div>
      </header>

      <main className="elora-shell-main">{children}</main>
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
