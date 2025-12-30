import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession, refreshVerifiedFromServer } from "@/lib/session";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 dark:bg-white/5 grid place-items-center">
        <span className="font-black tracking-tight">E</span>
      </div>
      <div className="leading-tight">
        <div className="font-black tracking-tight text-[1.05rem]">Elora</div>
        <div className="text-xs opacity-70 -mt-0.5">Education assistant</div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("elora:session", sync);
    refreshVerifiedFromServer().finally(sync);
    return () => window.removeEventListener("elora:session", sync);
  }, []);

  const items = [
    { href: "/", label: "Home" },
    { href: "/assistant", label: "Assistant" },
    { href: "/help", label: "Help" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="elora-nav">
      <div className="mx-auto" style={{ maxWidth: "var(--elora-page-max)" }}>
        <div className="px-4 pt-4">
          <div className="elora-navbar">
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="text-sm font-semibold opacity-80 hover:opacity-100 transition"
                >
                  {it.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {session.verified ? (
                <span className="elora-pill">Verified</span>
              ) : (
                <Link href="/verify" className="elora-btn elora-btn-primary">
                  Verify
                </Link>
              )}

              <button
                className="md:hidden elora-btn"
                onClick={() => setOpen((v) => !v)}
                type="button"
              >
                Menu
              </button>
            </div>
          </div>

          {open ? (
            <div className="mt-3 elora-card p-3 md:hidden">
              <div className="flex flex-col gap-2">
                {items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5"
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
