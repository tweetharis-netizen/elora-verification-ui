// pages/_app.js
import "../styles/globals.css";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { getTheme, getResolvedTheme, getFontScale } from "../lib/session";

function applyResolvedTheme(resolved) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function applyFontScale(scale) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--elora-font-scale", String(scale));
}

export default function App({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme-dependent UI
  const initialResolvedTheme = useMemo(() => {
    try {
      return getResolvedTheme();
    } catch {
      return "dark";
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    // Apply font scale
    applyFontScale(getFontScale());

    // Apply theme + listen for OS changes when theme=system
    const theme = getTheme();
    applyResolvedTheme(getResolvedTheme());

    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // Only react to OS changes if the user's setting is system
      if (getTheme() === "system") applyResolvedTheme(getResolvedTheme());
    };

    if (theme === "system") {
      if (mq.addEventListener) mq.addEventListener("change", handler);
      else mq.addListener(handler);
    }

    return () => {
      if (theme === "system") {
        if (mq.removeEventListener) mq.removeEventListener("change", handler);
        else mq.removeListener(handler);
      }
    };
  }, []);

  // Ensure the initial theme class is set even before effects run
  useEffect(() => {
    applyResolvedTheme(initialResolvedTheme);
  }, [initialResolvedTheme]);

  return (
    <div className="min-h-screen bg-elora">
      <Navbar />
      {/* Navbar is fixed, so we must offset content */}
      <main className="pt-[86px] px-4 pb-16">
        {/* mounted gate avoids theme flicker for components that read localStorage */}
        {mounted ? <Component {...pageProps} /> : <Component {...pageProps} />}
      </main>
    </div>
  );
}
