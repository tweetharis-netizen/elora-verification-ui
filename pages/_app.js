import { useEffect, useState } from "react";
import "../styles/globals.css";

function EloraShell({ children }) {
  const [theme, setTheme] = useState("light");

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

  return (
    <div className="elora-shell">
      {/* Top nav */}
      <header className="elora-nav">
        <div className="elora-nav-inner">
          <div className="elora-nav-left">
            <div className="elora-logo-badge">
              <span className="elora-logo-letter">E</span>
            </div>
            <div>
              <div className="elora-nav-title">Elora</div>
              <div className="text-[0.78rem] text-slate-500 dark:text-slate-300">
                AI assistant for lessons, practice & parents.
              </div>
            </div>
          </div>

          <div className="elora-nav-right">
            <nav className="elora-nav-links hidden sm:flex">
              <a href="/" className="elora-nav-link">
                Home
              </a>
              <a href="/assistant" className="elora-nav-link">
                Assistant
              </a>
              <a href="/faq" className="elora-nav-link">
                FAQ
              </a>
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
