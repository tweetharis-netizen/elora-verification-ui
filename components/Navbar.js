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
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.3),0_0_30px_rgba(139,92,246,0.2)] px-4 py-3 lg:px-6 lg:py-3.5 transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_40px_rgba(139,92,246,0.3)] relative overflow-hidden">
          {/* Cinematic glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-transparent to-cyan-600/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          <Link href="/" className="group flex items-center gap-3 no-underline text-[inherit] relative z-10">
            <div className="relative">
              <div
                className={clsx(
                  "absolute -inset-3 rounded-3xl blur-2xl opacity-50 animate-pulse-glow",
                  "bg-gradient-to-br from-purple-600/30 via-pink-500/25 to-cyan-400/20",
                  "dark:from-purple-500/25 dark:via-pink-400/20 dark:to-cyan-300/15",
                  "group-hover:opacity-80 transition-opacity"
                )}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-800/90 via-slate-900/80 to-slate-800/90 backdrop-blur-xl px-4 py-2.5 shadow-xl shadow-purple-500/20 group-hover:shadow-2xl group-hover:shadow-purple-500/30 transition-all">
                <div className="w-10 h-10 rounded-2xl grid place-items-center bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-500 text-white font-black shadow-lg shadow-purple-500/40 group-hover:scale-110 transition-transform">
                  E
                </div>
                <div className="leading-tight">
                  <div className="font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 dark:from-cyan-200 dark:via-purple-200 dark:to-pink-200 font-[var(--font-brand)] drop-shadow-lg">
                    Elora
                  </div>
                  <div className="text-[10px] font-black text-cyan-400/90 uppercase tracking-wider">
                    Cinematic AI
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1" aria-label="Primary">
            {[
              { href: "/", label: "Home", icon: "🏠" },
              { href: "/story", label: "Story", icon: "📖" },
              { href: "/assistant", label: "Assistant", icon: "🤖" },
              { href: "/dashboard", label: "Dashboard", icon: "📊" },
              { href: "/help", label: "Help", icon: "❓" },
              { href: "/settings", label: "Settings", icon: "⚙️" },
            ].map((item) => (
              <Link
                key={item.href}
                className="group relative px-4 py-2.5 rounded-2xl text-sm font-black text-cyan-300/90 hover:text-white transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                href={item.href}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                  {item.label}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-cyan-600/10 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
