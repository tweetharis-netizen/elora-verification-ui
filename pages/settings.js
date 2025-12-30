// pages/settings.js
import Navbar from "@/Navbar";
import { useEffect, useState } from "react";
import { getTheme, setTheme, getFontScale, setFontScale, hydrateUI } from "@/lib/session";

export default function SettingsPage() {
  const [theme, setThemeState] = useState(() => getTheme());
  const [scale, setScale] = useState(() => getFontScale());

  useEffect(() => {
    hydrateUI();
  }, []);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container" style={{ display: "grid", gap: 18 }}>
          <div className="card" style={{ padding: 22 }}>
            <h2 style={{ marginTop: 0 }}>Personalization / Appearance</h2>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 800 }}>Theme</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="btn"
                  onClick={() => { setTheme("system"); setThemeState("system"); }}
                  style={{ borderColor: theme === "system" ? "rgba(123,123,255,0.7)" : undefined }}
                >
                  System
                </button>
                <button
                  className="btn"
                  onClick={() => { setTheme("dawn"); setThemeState("dawn"); }}
                  style={{ borderColor: theme === "dawn" ? "rgba(123,123,255,0.7)" : undefined }}
                >
                  Dawn
                </button>
                <button
                  className="btn"
                  onClick={() => { setTheme("dark"); setThemeState("dark"); }}
                  style={{ borderColor: theme === "dark" ? "rgba(123,123,255,0.7)" : undefined }}
                >
                  Dark
                </button>
              </div>

              <div style={{ marginTop: 10, fontWeight: 800 }}>Font size</div>
              <div className="muted">Make Elora comfortable to read.</div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="range"
                  min="0.85"
                  max="1.40"
                  step="0.01"
                  value={scale}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setScale(v);
                    setFontScale(v); // <- this now changes the whole site
                  }}
                  style={{ width: "min(520px, 100%)" }}
                />
                <div style={{ fontWeight: 800 }}>{scale.toFixed(2)}×</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
