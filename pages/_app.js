// pages/_app.js
import "@/styles/globals.css";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { getTheme, setTheme, getFontScale } from "@/lib/session";

function resolveTheme(mode) {
  const m = (mode || "system").toString().toLowerCase();
  if (m === "dark") return "dark";
  if (m === "light") return "light";
  // system
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function MyApp({ Component, pageProps }) {
  const [theme, setThemeState] = useState("system");

  const scale = useMemo(() => getFontScale(), []);

  useEffect(() => {
    const stored = getTheme();
    setThemeState(stored);

    const apply = (mode) => {
      const resolved = resolveTheme(mode);
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.documentElement.setAttribute("data-theme", mode);
    };

    apply(stored);

    // If user is on "System", react to OS theme changes.
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        const current = getTheme();
        if ((current || "system").toLowerCase() === "system") apply("system");
      };

      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);

      return () => {
        if (mq.removeEventListener) mq.removeEventListener("change", onChange);
        else if (mq.removeListener) mq.removeListener(onChange);
      };
    }
  }, []);

  const applyTheme = (mode) => {
    setTheme(mode);
    setThemeState(mode);
    const resolved = resolveTheme(mode);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.setAttribute("data-theme", mode);
  };

  return (
    <div className="min-h-screen transition-all" style={{ fontSize: `${scale}em` }}>
      <Navbar theme={theme} setTheme={applyTheme} />

      {/* Navbar is fixed; give enough top padding so it NEVER overlaps content */}
      <main className="pt-20 sm:pt-24 px-2 sm:px-4 md:px-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
