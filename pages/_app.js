import "@/styles/globals.css";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { hydrateUI } from "@/lib/session";
import { Inter, Fraunces } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--elora-font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--elora-font-serif",
});

function applyThemeAndScale() {
  if (typeof window === "undefined") return;

  const theme = window.localStorage.getItem("elora_theme") || "system";
  const fontScaleRaw = window.localStorage.getItem("elora_fontScale");
  const fontScale = fontScaleRaw ? Number(fontScaleRaw) : 1;
  const scale = Number.isFinite(fontScale) ? Math.min(1.4, Math.max(0.85, fontScale)) : 1;

  // Resolve theme against system if needed
  const systemDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  document.documentElement.dataset.theme = resolved;
  // Tailwind darkMode uses class
  document.documentElement.classList.toggle("dark", resolved === "dark");

  // Global font scaling (CSS uses --elora-font-scale)
  document.documentElement.style.setProperty("--elora-font-scale", String(scale));
}

export default function App({ Component, pageProps }) {
  useEffect(() => {
    applyThemeAndScale();
    hydrateUI();

    const onStorageOrSession = () => applyThemeAndScale();
    window.addEventListener("storage", onStorageOrSession);
    window.addEventListener("elora:session", onStorageOrSession);

    // Keep system theme responsive when theme=system
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMq = () => applyThemeAndScale();
    mq?.addEventListener?.("change", onMq);

    return () => {
      window.removeEventListener("storage", onStorageOrSession);
      window.removeEventListener("elora:session", onStorageOrSession);
      mq?.removeEventListener?.("change", onMq);
    };
  }, []);

  return (
    <div className={`${inter.variable} ${fraunces.variable} elora-shell`}>
      <Navbar />
      <main className="elora-main">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
