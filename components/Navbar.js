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

  const accountRef = useRef(null);
  const mobileRef = useRef(null);

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

  const canLogout = useMemo(() => hasSessionFn(), [session?.verified, session?.teacher, session?.hasSession]);
  const verified = Boolean(session?.verified);
  const teacher = Boolean(session?.teacher);

  // No yellow "warn" state in the navbar — only green when verified, neutral otherwise.
  const dotClass = verified ? "elora-dot elora-dot-good" : "elora-dot";

  const accountLabel = verified ? "Verified" : canLogout ? "Account" : "Guest";

  return (
    <div className="elora-nav">
      {/* Reduced top padding so the bar sits higher and steals less vertical space */}
      <div className="mx-auto max-w-[1120px] px-4 pt-2">
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
          <div className="hidden sm:flex items-center gap-6">
            <Link className="elora-navlink" href="/">Home</Link>
            <Link className="elora-navlink" href="/assistant">Assistant</Link>
            <Link className="elora-navlink" href="/help">Help</Link>
            <Link className="elora-navlink" href="/settings">Settings</Link>
          </div>

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

                  {teacher && (
                    <Link className="elora-account-item" href="/dashboard/educator" onClick={() => setMobileOpen(false)}>
                      Teacher tools
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

                  {teacher && (
                    <Link className="elora-account-item" href="/dashboard/educator" onClick={() => setAccountOpen(false)}>
                      Teacher tools
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

            {/* Removed extra desktop status chip to avoid duplicate “Guest / Not verified” UI */}
          </div>
        </div>
      </div>
    </div>
  );
}
