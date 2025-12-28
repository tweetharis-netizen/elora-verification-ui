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
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const sync = () => {
      const mode = getTheme();
      const resolved = getResolvedTheme(mode);
      applyHtmlTheme(resolved);
      setScale(getFontScale());
    };

    sync();

    window.addEventListener("elora:session", sync);
    window.addEventListener("storage", (e) => {
      if (e.key === "elora_session") sync();
    });

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

  // Premium background that looks good in both themes
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950 transition-colors"
      style={fontStyle}
    >
      <Navbar />
      <main className="pt-16 px-2 sm:px-4 md:px-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
