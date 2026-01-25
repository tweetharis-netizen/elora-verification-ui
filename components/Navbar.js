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

  const canLogout = useMemo(
    () => hasSessionFn(),
    // best-effort memo; session updates via elora:session events
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.verified, session?.teacher, session?.hasSession]
  );

  const verified = Boolean(session?.verified);

  const dotClass = verified
    ? "elora-dot elora-dot-good"
    : canLogout
      ? "elora-dot elora-dot-warn"
      : "elora-dot";

  const accountLabel = verified ? "Dashboard" : canLogout ? "Account" : "Menu";

  return (
    <header
      ref={navRef}
      className={clsx(
        "sticky top-0 z-40 transition-all duration-500 pointer-events-none",
        hidden && "-translate-y-full opacity-0"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 pointer-events-auto">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-4 py-2.5 lg:px-5 lg:py-3 transition-all duration-300 hover:border-indigo-500/30 dark:hover:border-indigo-400/30">
          <Link href="/" className="group flex items-center gap-3 no-underline text-[inherit]">
            <div className="relative">
              <div
                className={clsx(
                  "absolute -inset-2 rounded-2xl blur-xl opacity-40",
                  "bg-gradient-to-br from-indigo-500/40 via-fuchsia-500/25 to-sky-400/30",
                  "dark:from-indigo-400/30 dark:via-fuchsia-400/20 dark:to-sky-300/25",
                  "group-hover:opacity-60 transition-opacity"
                )}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-2 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-3 py-2 shadow-sm shadow-slate-900/5 dark:shadow-black/20">
                <div className="w-9 h-9 rounded-2xl grid place-items-center bg-gradient-to-br from-indigo-600 via-indigo-500 to-fuchsia-500 text-white font-black shadow-md shadow-indigo-500/30">
                  E
                </div>
                <div className="leading-tight">
                  <div className="font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-700 to-fuchsia-700 dark:from-white dark:via-indigo-200 dark:to-fuchsia-200">
                    Elora
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    AI learning assistant
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-2" aria-label="Primary">
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
                className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
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
                className="flex items-center gap-2 rounded-xl border border-white/20 dark:border-slate-800/70 bg-white/10 dark:bg-slate-900/70 px-3 py-2 text-sm font-semibold text-white dark:text-slate-200 shadow-sm backdrop-blur-md"
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Open menu"
              >
                <span className={clsx(dotClass, "h-2 w-2 rounded-full")} />
                Menu
                <span className="relative block h-3 w-4">
                  <span className="absolute inset-x-0 top-0 h-[2px] rounded-full bg-current" aria-hidden="true" />
                  <span className="absolute inset-x-0 top-1.5 h-[2px] rounded-full bg-current" aria-hidden="true" />
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-current" aria-hidden="true" />
                </span>
              </button>

              {mobileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-2xl shadow-slate-900/15 dark:shadow-black/40 backdrop-blur-xl p-2 space-y-1" role="menu" aria-label="Mobile navigation">
                  <Link className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" href="/" onClick={() => setMobileOpen(false)}>
                    Home
                  </Link>
                  <Link className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" href="/story" onClick={() => setMobileOpen(false)}>
                    Story
                  </Link>
                  <Link className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" href="/assistant" onClick={() => setMobileOpen(false)}>
                    Assistant
                  </Link>
                  <Link className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" href="/dashboard" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  <Link className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" href="/help" onClick={() => setMobileOpen(false)}>
                    Help
                  </Link>
                  <Link className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" href="/settings" onClick={() => setMobileOpen(false)}>
                    Settings
                  </Link>

                  <div className="h-px bg-slate-200/80 dark:bg-slate-800/80 my-1" />

                  {!verified && (
                    <Link className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800" href="/verify" onClick={() => setMobileOpen(false)}>
                      Verify email
                    </Link>
                  )}

                  {canLogout && (
                    <>
                      <div className="h-px bg-slate-200/80 dark:bg-slate-800/80 my-1" />
                      <button
                        className="w-full text-left rounded-xl px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={async () => {
                          setMobileOpen(false);
                          await logout();
                          if (typeof window !== "undefined") window.location.href = "/";
                        }}
                        type="button"
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
                className="flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm shadow-slate-900/5 dark:shadow-black/20 hover:border-indigo-300/70 dark:hover:border-indigo-700/60 hover:shadow-md transition-all"
                onClick={() => setAccountOpen((v) => !v)}
                type="button"
              >
                <span className={clsx(dotClass, "h-2 w-2 rounded-full")} />
                {accountLabel}
                <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">▾</span>
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 shadow-2xl shadow-slate-900/10 dark:shadow-black/30 backdrop-blur-xl p-2 space-y-1">
                  {!verified && (
                    <Link className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800" href="/verify" onClick={() => setAccountOpen(false)}>
                      Verify email
                    </Link>
                  )}

                  <Link className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" href="/settings" onClick={() => setAccountOpen(false)}>
                    Settings
                  </Link>

                  {canLogout && (
                    <>
                      <div className="h-px bg-slate-200/80 dark:bg-slate-800/80 my-1" />
                      <button
                        className="w-full text-left rounded-xl px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={async () => {
                          setAccountOpen(false);
                          await logout();
                          if (typeof window !== "undefined") window.location.href = "/";
                        }}
                        type="button"
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
