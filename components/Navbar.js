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

    const onSession = () => {
      if (!mounted) return;
      setSession(getSession());
    };
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

  const verified = Boolean(session.verified);
  const canLogout = useMemo(() => hasSessionFn(), [session.verified, session.teacher, session.hasSession]);
  const teacher = Boolean(session.teacher);

  const dotClass = verified ? "elora-dot elora-dot-good" : "elora-dot";

  const accountLabel = verified ? "Verified" : canLogout ? "Not verified" : "Guest";

  return (
    <div className="elora-nav">
      <div className="mx-auto max-w-[1120px] px-4 pt-4">
        <div className="elora-navbar">
          <Link href="/" className="flex items-center gap-3 no-underline text-[inherit]">
            <div className="w-9 h-9 rounded-xl grid place-items-center bg-[color-mix(in_oklab,var(--surface)_72%,transparent)] font-black">
              E
            </div>
            <div className="leading-tight">
              <div className="font-black">Elora</div>
              <div className="text-xs text-[var(--muted)]">Verification + Assistant</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Link href="/verify" className="elora-navlink">
                Verify
              </Link>
              <Link href="/assistant" className="elora-navlink">
                Assistant
              </Link>
              <Link href="/settings" className="elora-navlink">
                Settings
              </Link>
              <Link href="/help" className="elora-navlink">
                Help
              </Link>
            </div>

            <div className="relative" ref={accountRef}>
              <button
                className="elora-account"
                onClick={() => setAccountOpen((v) => !v)}
                aria-label="Account menu"
              >
                <span className={dotClass} />
                <span className="text-sm font-semibold">{accountLabel}</span>
                {teacher ? (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-[color-mix(in_oklab,var(--text)_92%,white)]">
                    Teacher
                  </span>
                ) : null}
              </button>

              {accountOpen ? (
                <div className="elora-menu">
                  <div className="px-3 py-2 text-sm">
                    <div className="font-semibold">Account</div>
                    <div className="text-[var(--muted)]">
                      {verified ? "Email verified" : canLogout ? "Not verified yet" : "Browsing as guest"}
                    </div>
                  </div>
                  <div className="h-px bg-[var(--line)]" />
                  <Link href="/settings" className="elora-menuitem" onClick={() => setAccountOpen(false)}>
                    Settings
                  </Link>
                  <Link href="/help" className="elora-menuitem" onClick={() => setAccountOpen(false)}>
                    Help
                  </Link>
                  <Link href="/assistant" className="elora-menuitem" onClick={() => setAccountOpen(false)}>
                    Assistant
                  </Link>
                  <div className="h-px bg-[var(--line)]" />
                  {canLogout ? (
                    <button
                      className="elora-menuitem text-left w-full"
                      onClick={async () => {
                        setAccountOpen(false);
                        await logout();
                        setSession(getSession());
                      }}
                    >
                      Logout
                    </button>
                  ) : (
                    <Link href="/verify" className="elora-menuitem" onClick={() => setAccountOpen(false)}>
                      Verify email
                    </Link>
                  )}
                </div>
              ) : null}
            </div>

            <div className="relative md:hidden" ref={mobileRef}>
              <button className="elora-hamburger" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
                <span />
                <span />
                <span />
              </button>

              {mobileOpen ? (
                <div className="elora-menu right-0">
                  <Link href="/verify" className="elora-menuitem" onClick={() => setMobileOpen(false)}>
                    Verify
                  </Link>
                  <Link href="/assistant" className="elora-menuitem" onClick={() => setMobileOpen(false)}>
                    Assistant
                  </Link>
                  <Link href="/settings" className="elora-menuitem" onClick={() => setMobileOpen(false)}>
                    Settings
                  </Link>
                  <Link href="/help" className="elora-menuitem" onClick={() => setMobileOpen(false)}>
                    Help
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Desktop status chip (optional, compact) */}
            <div className="hidden sm:flex">
              <span className={clsx("elora-chip", verified ? "elora-chip-ok" : "")} data-variant={verified ? "good" : "neutral"}>
                {verified ? "Verified" : "Not verified"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
