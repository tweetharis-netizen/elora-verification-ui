// pages/_app.js
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "../styles/globals.css";
import { getTheme, getResolvedTheme, getFontScale } from "../lib/session";

function applyThemeToHtml() {
  if (typeof document === "undefined") return;

  const resolved = getResolvedTheme();
  const root = document.documentElement;

  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  root.setAttribute("data-theme", getTheme());
}

function applyFontScale() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const scale = getFontScale();
  root.style.fontSize = `${Math.round(scale * 100)}%`;
}

export default function App({ Component, pageProps }) {
  const [, force] = useState(0);

  useEffect(() => {
    const sync = () => {
      applyThemeToHtml();
      applyFontScale();
      force((n) => n + 1);
    };

    sync();

    if (typeof window === "undefined") return;

    const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const onMedia = () => sync();

    if (mq && mq.addEventListener) mq.addEventListener("change", onMedia);
    else if (mq && mq.addListener) mq.addListener(onMedia);

    window.addEventListener("elora:session", sync);
    window.addEventListener("focus", sync);

    return () => {
      if (mq && mq.removeEventListener) mq.removeEventListener("change", onMedia);
      else if (mq && mq.removeListener) mq.removeListener(onMedia);

      window.removeEventListener("elora:session", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return (
    <>
      <Navbar />
      <div className="appContent">
        <Component {...pageProps} />
      </div>
    </>
  );
}
