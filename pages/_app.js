// pages/_app.js
import "@/styles/globals.css";
import { useEffect } from "react";
import { hydrateUI } from "@/lib/session";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    hydrateUI();
  }, []);

  return <Component {...pageProps} />;
}
