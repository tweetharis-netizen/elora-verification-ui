import "@/styles/globals.css";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { hydrateUI } from "@/lib/session";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    hydrateUI();
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
