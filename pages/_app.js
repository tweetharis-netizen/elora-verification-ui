// pages/_app.js
import '@/styles/globals.css';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import {
  getTheme,
  setTheme,
  getFontScale,
  getSession,
  saveSession,
} from '@/lib/session';

function MyApp({ Component, pageProps }) {
  const [theme, setThemeState] = useState('system');

  useEffect(() => {
    const t = getTheme();
    setThemeState(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  const applyTheme = (mode) => {
    setTheme(mode);
    setThemeState(mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  };

  const scale = getFontScale();

  return (
    <div
      className={`min-h-screen transition-all`}
      style={{ fontSize: `${scale}em` }}
    >
      <Navbar theme={theme} setTheme={applyTheme} />
      <main className="pt-16 px-2 sm:px-4 md:px-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

export default MyApp;
