// pages/_app.js
import "@/styles/globals.css";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  getTheme,
  setTheme,
  getFontScale,
  getSession,
  saveSession,
} from "@/lib/session";

function resolveTheme(mode) {
  const m = (mode || "system").toString().toLowerCase();
  if (m === "dark") return "dark";
  if (m === "light") return "light";
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function MyApp({ Component, pageProps }) {
  const [theme, setThemeState] = useState("system");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const stored = getTheme();
    setThemeState(stored);

    const apply = (mode) => {
      const resolved = resolveTheme(mode);
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.documentElement.setAttribute("data-theme", mode);
    };

    apply(stored);

    // System theme changes
    const mq = typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    const onThemeChange = () => {
      const current = getTheme();
      if ((current || "system").toLowerCase() === "system") apply("system");
    };

    if (mq) {
      if (mq.addEventListener) mq.addEventListener("change", onThemeChange);
      else if (mq.addListener) mq.addListener(onThemeChange);
    }

    // Auth sync: Only Firebase-confirmed users are "verified".
    const unsub = onAuthStateChanged(auth, (user) => {
      const s = getSession();

      if (user && user.email) {
        s.email = user.email;
        s.verified = true;
        s.guest = false;
        s.verifiedAt = new Date().toISOString();
        saveSession(s);
      } else {
        // If they had "verified" from old fake logic, remove it.
        if (s.verified) {
          s.verified = false;
          delete s.verifiedAt;
          saveSession(s);
        }
      }

      setTick((n) => n + 1); // force rerender so Navbar reflects changes
    });

    const onSession = () => setTick((n) => n + 1);
    window.addEventListener("elora:session", onSession);

    return () => {
      if (mq) {
        if (mq.removeEventListener) mq.removeEventListener("change", onThemeChange);
        else if (mq.removeListener) mq.removeListener(onThemeChange);
      }
      unsub();
      window.removeEventListener("elora:session", onSession);
    };
  }, []);

  const applyTheme = (mode) => {
    setTheme(mode);
    setThemeState(mode);
    const resolved = resolveTheme(mode);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.setAttribute("data-theme", mode);
    setTick((n) => n + 1);
  };

  const scale = getFontScale();

  return (
    <div className="min-h-screen transition-all" style={{ fontSize: `${scale}em` }} key={tick}>
      <Navbar theme={theme} setTheme={applyTheme} />
      {/* fixed navbar -> enough padding so it never blocks content */}
      <main className="pt-20 sm:pt-24 px-2 sm:px-4 md:px-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
