import "../styles/globals.css";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import { getTheme, getFontScale } from "../lib/session";

function resolveTheme(mode) {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyThemeAndScale() {
  const mode = getTheme();
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = resolved;

  const scale = getFontScale();
  document.documentElement.style.setProperty("--elora-font-scale", String(scale));
}

export default function App({ Component, pageProps }) {
  useEffect(() => {
    applyThemeAndScale();

    const sync = () => applyThemeAndScale();
    window.addEventListener("elora:session", sync);

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => {
      if (getTheme() === "system") applyThemeAndScale();
    };
    mq.addEventListener?.("change", onSystem);

    return () => {
      window.removeEventListener("elora:session", sync);
      mq.removeEventListener?.("change", onSystem);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050b1c] via-[#070f26] to-[#030713]">
      <Navbar />
      {/* fixed navbar: keep content below it */}
      <main className="pt-[88px]">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
