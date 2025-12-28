// pages/_app.js
import "@/styles/globals.css";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { getFontScale, getResolvedTheme, getTheme } from "@/lib/session";

function applyHtmlTheme(resolved) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export default function MyApp({ Component, pageProps }) {
  const [resolvedTheme, setResolvedTheme] = useState("dark");
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const sync = () => {
      const mode = getTheme();
      const resolved = getResolvedTheme(mode);
      setResolvedTheme(resolved);
      setScale(getFontScale());
      applyHtmlTheme(resolved);
    };

    sync();

    // Same-tab updates when session changes
    window.addEventListener("elora:session", sync);

    // Cross-tab updates
    window.addEventListener("storage", (e) => {
      if (e.key === "elora_session") sync();
    });

    // System theme changes (only relevant when themeMode === "system")
    const mql =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => sync();
    if (mql && mql.addEventListener) mql.addEventListener("change", onSystem);
    else if (mql && mql.addListener) mql.addListener(onSystem);

    return () => {
      window.removeEventListener("elora:session", sync);
      if (mql && mql.removeEventListener) mql.removeEventListener("change", onSystem);
      else if (mql && mql.removeListener) mql.removeListener(onSystem);
    };
  }, []);

  const fontStyle = useMemo(() => ({ fontSize: `${scale}em` }), [scale]);

  return (
    <div className="min-h-screen transition-colors" style={fontStyle}>
      <Navbar />
      <main className="pt-16 px-2 sm:px-4 md:px-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
