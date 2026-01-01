import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSession, logout, refreshVerifiedFromServer } from "@/lib/session";

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

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose();
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [ref, onClose]);
}

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const accountRef = useRef(null);

  useOutsideClose(accountRef, () => setOpenAccount(false));

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

  const statusLabel = session.verified ? "Verified" : "Not verified";

  const doLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <header className="elora-nav">
      <div className="mx-auto" style={{ maxWidth: "var(--elora-page-max)" }}>
        <div className="px-4 pt-4">
          <div className="elora-navbar">
            <Link href="/" className="shrink-0" aria-label="Elora Home">
              <Logo />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {items.map((it) => (
                <Link key={it.href} href={it.href} className="elora-navlink">
                  {it.label}
                </Link>
              ))}
            </nav>

            {/* Right side: single Account control (reduces clutter) */}
            <div className="flex items-center gap-3">
              <div className="relative" ref={accountRef}>
                <button
                  className="elora-account"
                  type="button"
                  onClick={() => setOpenAccount((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={openAccount ? "true" : "false"}
                >
                  <span
                    className={
                      session.verified ? "elora-dot elora-dot-good" : "elora-dot elora-dot-warn"
                    }
                    aria-hidden="true"
                  />
                  Account
                </button>

                {openAccount ? (
                  <div className="elora-account-menu" role="menu" aria-label="Account menu">
                    <div className="px-3 py-2 text-xs elora-muted">{statusLabel}</div>
                    <div className="elora-divider" style={{ margin: 0 }} />

                    {!session.verified ? (
                      <Link
                        href="/verify"
                        className="elora-account-item"
                        role="menuitem"
                        onClick={() => setOpenAccount(false)}
                      >
                        Verify email
                      </Link>
                    ) : null}

                    <Link
                      href="/settings"
                      className="elora-account-item"
                      role="menuitem"
                      onClick={() => setOpenAccount(false)}
                    >
                      Settings
                    </Link>

                    <button
                      className="elora-account-item danger"
                      type="button"
                      role="menuitem"
                      onClick={doLogout}
                    >
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                className="md:hidden elora-btn"
                onClick={() => setOpenMenu((v) => !v)}
                type="button"
              >
                Menu
              </button>
            </div>
          </div>

          {openMenu ? (
            <div className="mt-3 elora-card p-3 md:hidden">
              <div className="flex flex-col gap-2">
                {items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpenMenu(false)}
                    className="px-3 py-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5"
                  >
                    {it.label}
                  </Link>
                ))}

                {!session.verified ? (
                  <Link
                    href="/verify"
                    onClick={() => setOpenMenu(false)}
                    className="px-3 py-2 rounded-xl elora-btn elora-btn-primary"
                    style={{ justifyContent: "center" }}
                  >
                    Verify email
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={doLogout}
                  className="px-3 py-2 rounded-xl elora-btn elora-btn-danger"
                  style={{ justifyContent: "center" }}
                >
                  Log out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
