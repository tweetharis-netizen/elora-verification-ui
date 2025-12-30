import "@/styles/globals.css";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { hydrateUI } from "@/lib/session";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    hydrateUI();
  }, []);

  return (
    <div className="elora-shell">
      <Navbar />
      <main className="elora-main">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
