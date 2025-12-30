import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSession, refreshVerifiedFromServer } from "@/lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/10 dark:bg-white/5 grid place-items-center">
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
    window.addEventListener("storage", sync);

    // Also refresh server truth once on mount
    refreshVerifiedFromServer().finally(sync);

    return () => {
      window.removeEventListener("elora:session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const items = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/assistant", label: "Assistant" },
      { href: "/help", label: "Help" },
      { href: "/settings", label: "Settings" },
    ],
    []
  );

  return (
    <header className="elora-nav">
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="elora-navbar">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="shrink-0">
              <Logo />
            </Link>

            {/* Desktop nav */}
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
                className="md:hidden elora-iconbtn"
                aria-label="Open menu"
                onClick={() => setOpen((v) => !v)}
              >
                <span className="block h-0.5 w-5 bg-current rounded-full" />
                <span className="block h-0.5 w-5 bg-current rounded-full mt-1.5 opacity-80" />
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={cn("md:hidden overflow-hidden transition-all", open ? "max-h-64 mt-3" : "max-h-0")}>
            <div className="pt-2 pb-2 border-t border-white/10 dark:border-white/10 flex flex-col gap-2">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className="px-2 py-2 rounded-xl text-sm font-semibold opacity-85 hover:opacity-100 hover:bg-white/10 dark:hover:bg-white/5"
                >
                  {it.label}
                </Link>
              ))}
              {!session.verified ? (
                <Link
                  href="/verify"
                  onClick={() => setOpen(false)}
                  className="px-2 py-2 rounded-xl text-sm font-semibold bg-white/10 dark:bg-white/5 border border-white/10"
                >
                  Verify to unlock exports
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
