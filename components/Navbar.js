import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("elora-theme") === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  function toggleTheme() {
    const newMode = !dark;
    setDark(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("elora-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("elora-theme", "light");
    }
  }

  return (
    <nav className="navbar p-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <img src="/elora-logo.png" width="36" className="logo" />
        <span className="font-bold text-lg">Elora</span>
      </div>

      <div className="flex gap-4">
        <Link href="/">Home</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/feedback">Feedback</Link>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-full border"
        >
          {dark ? "Light Mode ☀️" : "Dark Mode 🌙"}
        </button>
      </div>
    </nav>
  );
}
