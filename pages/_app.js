import "@/styles/globals.css";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { hydrateUI } from "@/lib/session";
import { Inter, Fraunces, Outfit } from "next/font/google";

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

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--elora-font-outfit",
});

/**
 * Prevent demo confusion: Vercel preview deployment URLs (hashes) are a different domain,
 * so cookies won't carry over. We always redirect *.vercel.app previews to the canonical
 * production URL (NEXT_PUBLIC_SITE_URL).
 *
 * This does NOT affect localhost or future custom domains.
 */
function maybeRedirectToCanonical() {
  if (typeof window === "undefined") return false;

  const canonical = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (!canonical) return false;

  let canonicalHost = "";
  let canonicalOrigin = "";
  try {
    const u = new URL(canonical);
    canonicalHost = u.host;
    canonicalOrigin = u.origin;
  } catch {
    return false;
  }

  const currentHost = window.location.host;

  // Never redirect local dev
  if (
    currentHost.includes("localhost") ||
    currentHost.startsWith("127.0.0.1") ||
    currentHost.startsWith("0.0.0.0")
  ) {
    return false;
  }

  // Already on canonical
  if (currentHost === canonicalHost) return false;

  // Only redirect Vercel preview domains -> canonical Vercel prod domain
  const isVercelHost = currentHost.endsWith(".vercel.app");
  const canonicalIsVercel = canonicalHost.endsWith(".vercel.app");
  if (!isVercelHost || !canonicalIsVercel) return false;

  const nextUrl =
    canonicalOrigin + window.location.pathname + window.location.search + window.location.hash;

  // Use replace so "Back" doesn't return to the preview URL
  window.location.replace(nextUrl);
  return true;
}

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
    // If user opened a Vercel preview URL, immediately redirect to the canonical demo URL.
    const redirected = maybeRedirectToCanonical();
    if (redirected) return;

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
    <div className={`${inter.variable} ${fraunces.variable} ${outfit.variable} elora-shell relative`}>
      {/* Cinematic atmosphere layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full filter blur-3xl animate-float" />
        </div>
      </div>
      
      <div className="relative z-10">
        <Navbar />
        <main className="elora-main">
          <Component {...pageProps} />
        </main>
      </div>
    </div>
  );
}
