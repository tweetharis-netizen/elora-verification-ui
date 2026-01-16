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

  const accountLabel = verified ? "Verified" : canLogout ? "Account" : "Guest";

  return (
    <header ref={navRef} className={clsx("elora-nav", hidden && "elora-nav--hidden")}>
      <div className="mx-auto max-w-[1120px] px-4 pt-4">
        <div className="elora-navbar">
          <Link href="/" className="flex items-center gap-3 no-underline text-[inherit]">
            <div className="w-9 h-9 rounded-xl grid place-items-center border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface2)_72%,transparent)] font-black">
              E
            </div>
            <div className="leading-tight">
              <div className="font-black">Elora</div>
              <div className="text-xs elora-muted">Education assistant</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6" aria-label="Primary">
            <Link className="elora-navlink" href="/">
              Home
            </Link>
            <Link className="elora-navlink" href="/assistant">
              Assistant
            </Link>
            <Link className="elora-navlink" href="/help">
              Help
            </Link>
            <Link className="elora-navlink" href="/settings">
              Settings
            </Link>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <div className="sm:hidden relative" ref={mobileRef}>
              <button
                className="elora-hamburger"
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Open menu"
              >
                <span className={dotClass} />
                Menu
                <span className="elora-hamburger-icon" aria-hidden="true" />
              </button>

              {mobileOpen && (
                <div className="elora-mobile-menu" role="menu" aria-label="Mobile navigation">
                  <Link className="elora-account-item" href="/" onClick={() => setMobileOpen(false)}>
                    Home
                  </Link>
                  <Link className="elora-account-item" href="/assistant" onClick={() => setMobileOpen(false)}>
                    Assistant
                  </Link>
                  <Link className="elora-account-item" href="/help" onClick={() => setMobileOpen(false)}>
                    Help
                  </Link>
                  <Link className="elora-account-item" href="/settings" onClick={() => setMobileOpen(false)}>
                    Settings
                  </Link>

                  <div className="elora-divider" />

                  {!verified && (
                    <Link className="elora-account-item" href="/verify" onClick={() => setMobileOpen(false)}>
                      Verify email
                    </Link>
                  )}

                  {canLogout && (
                    <>
                      <div className="elora-divider" />
                      <button
                        className="elora-account-item danger"
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
              <button className="elora-account" onClick={() => setAccountOpen((v) => !v)} type="button">
                <span className={dotClass} />
                {accountLabel}
              </button>

              {accountOpen && (
                <div className="elora-account-menu">
                  {!verified && (
                    <Link className="elora-account-item" href="/verify" onClick={() => setAccountOpen(false)}>
                      Verify email
                    </Link>
                  )}

                  <Link className="elora-account-item" href="/settings" onClick={() => setAccountOpen(false)}>
                    Preferences
                  </Link>

                  {canLogout && (
                    <>
                      <div className="elora-divider" />
                      <button
                        className="elora-account-item danger"
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

            {/* Desktop status chip (compact) */}
            <div className="hidden sm:flex">
              <span className="elora-chip" data-variant={verified ? "good" : "warn"}>
                {verified ? "Verified" : "Not verified"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
