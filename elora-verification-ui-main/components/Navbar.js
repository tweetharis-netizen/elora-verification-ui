import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSession, hasSession as hasSessionFn, logout, refreshVerifiedFromServer } from "@/lib/session";

function clsx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function Navbar() {
  const [session, setSession] = useState(() => getSession());
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  const navRef = useRef(null);
  const accountRef = useRef(null);
  const mobileRef = useRef(null);
  const lastYRef = useRef(0);

  // Keep session state fresh (and close menus on outside click)
  useEffect(() => {
    let mounted = true;

    const onSession = () => mounted && setSession(getSession());
    window.addEventListener("elora:session", onSession);

    refreshVerifiedFromServer().then(() => {
      if (mounted) setSession(getSession());
    });

    const onClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false);
    };
    window.addEventListener("mousedown", onClickOutside);

    return () => {
      mounted = false;
      window.removeEventListener("elora:session", onSession);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  // Auto-hide navbar when scrolling down, show on scroll up.
  useEffect(() => {
    if (typeof window === "undefined") return;

    lastYRef.current = window.scrollY || 0;

    const onScroll = () => {
      const y = window.scrollY || 0;

      // Always show near top of page
      if (y < 12) {
        if (hidden) setHidden(false);
        lastYRef.current = y;
        return;
      }

      const dy = y - lastYRef.current;

      // Small threshold so trackpads still trigger it.
      if (dy > 6 && !hidden) setHidden(true);
      if (dy < -6 && hidden) setHidden(false);

      lastYRef.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden]);

  // Measure navbar height and set a CSS var so pages never get blocked.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = navRef.current;
    if (!el) return;

    const apply = () => {
      const rect = el.getBoundingClientRect();
      const h = Math.max(0, Math.ceil(rect.height));
      document.documentElement.style.setProperty("--elora-nav-offset", `${h}px`);
    };

    apply();

    const ro = window.ResizeObserver ? new ResizeObserver(apply) : null;
    ro?.observe(el);

    window.addEventListener("resize", apply);
    return () => {
      ro?.disconnect?.();
      window.removeEventListener("resize", apply);
    };
  }, []);

  const verified = Boolean(session?.verified);

  return (
    <header
      ref={navRef}
      className={clsx(
        "sticky top-0 z-40 transition-opacity duration-150 pointer-events-none",
        hidden && "opacity-0"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 pointer-events-auto" role="navigation" aria-label="Primary">
        <div className="flex items-center justify-between gap-4 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2">
            <Link href="/" className="flex items-center gap-2 no-underline text-[inherit]">
              <div className="w-6 h-6 rounded grid place-items-center bg-neutral-900 text-white font-semibold text-xs">
                E
              </div>
              <div className="leading-tight">
                <div className="font-semibold tracking-tight text-neutral-900 dark:text-white">
                  Elora
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1" aria-label="Primary links">
              {[
                { href: "/", label: "Home" },
                { href: "/story", label: "Story" },
                { href: "/assistant", label: "Assistant" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/help", label: "Help" },
                { href: "/settings", label: "Settings" },
              ].map((item) => (
                <Link
                  key={item.href}
                  className="px-3 py-2 rounded text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Mobile hamburger */}
              <div className="sm:hidden relative" ref={mobileRef}>
                <button
                  className="flex items-center gap-2 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
                  type="button"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label="Open menu"
                  aria-pressed={mobileOpen}
                >
                  Menu
                  <span className="relative block h-3 w-4">
                    <span className="absolute inset-x-0 top-0 h-[2px] rounded bg-current" aria-hidden="true" />
                    <span className="absolute inset-x-0 top-1.5 h-[2px] rounded bg-current" aria-hidden="true" />
                    <span className="absolute inset-x-0 bottom-0 h-[2px] rounded bg-current" aria-hidden="true" />
                  </span>
                </button>

                {mobileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 space-y-2" role="menu" aria-label="Mobile navigation">
                    <Link className="block rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white" href="/" onClick={() => setMobileOpen(false)}>
                      Home
                    </Link>
                  <Link className="block rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white" href="/story" onClick={() => setMobileOpen(false)}>
                    Story
                  </Link>
                  <Link className="block rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white" href="/assistant" onClick={() => setMobileOpen(false)}>
                    Assistant
                  </Link>
                  <Link className="block rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white" href="/dashboard" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  <Link className="block rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white" href="/help" onClick={() => setMobileOpen(false)}>
                    Help
                  </Link>
                  <Link className="block rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white" href="/settings" onClick={() => setMobileOpen(false)}>
                    Settings
                  </Link>

                  <div className="h-px bg-neutral-200/80 dark:bg-neutral-800/80 my-2" />

                  {!verified && (
                    <Link className="block rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white" href="/verify" onClick={() => setMobileOpen(false)}>
                      Verify email
                    </Link>
                  )}

                  {verified && (
                    <>
                      <div className="h-px bg-neutral-200/80 dark:bg-neutral-800/80 my-2" />
                      <button
                        className="w-full text-left rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                        onClick={async () => {
                          setMobileOpen(false);
                          await logout();
                          if (typeof window !== "undefined") window.location.href = "/";
                        }}
                        type="button"
                        aria-pressed="false"
                      >
                        Log out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Account dropdown (desktop) */}
            <div className="hidden sm:block relative" ref={accountRef}>
              <button
                className="flex items-center gap-2 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
                onClick={() => setAccountOpen((v) => !v)}
                type="button"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-pressed={accountOpen}
              >
                Account
                <span className="text-neutral-400 dark:text-neutral-500" aria-hidden="true">▾</span>
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 space-y-2">
                  {!verified && (
                    <Link className="block rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white" href="/verify" onClick={() => setAccountOpen(false)}>
                      Verify email
                    </Link>
                  )}

                  <Link className="block rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white" href="/settings" onClick={() => setAccountOpen(false)}>
                    Settings
                  </Link>

                  {verified && (
                    <>
                      <div className="h-px bg-neutral-200/80 dark:bg-neutral-800/80 my-2" />
                      <button
                        className="w-full text-left rounded px-3 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                        onClick={async () => {
                          setAccountOpen(false);
                          await logout();
                          if (typeof window !== "undefined") window.location.href = "/";
                        }}
                        type="button"
                        aria-pressed="false"
                      >
                        Log out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="hidden sm:flex" />
          </div>
        </div>
      </div>
    </header>
  );
}
