import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getSession, refreshVerifiedFromServer, logout } from "@/lib/session";

function useOutsideClick(ref, handler) {
  useEffect(() => {
    function onDown(e) {
      if (!ref.current) return;
      if (ref.current.contains(e.target)) return;
      handler?.();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, handler]);
}

function useEscape(handler) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") handler?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handler]);
}

export default function Navbar() {
  const [openMobile, setOpenMobile] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);
  const [s, setS] = useState(() => getSession());
  const accountRef = useRef(null);

  useOutsideClick(accountRef, () => setOpenAccount(false));
  useEscape(() => {
    setOpenAccount(false);
    setOpenMobile(false);
  });

  useEffect(() => {
    const sync = () => setS(getSession());
    sync();

    refreshVerifiedFromServer().finally(sync);

    window.addEventListener("elora:session", sync);
    return () => window.removeEventListener("elora:session", sync);
  }, []);

  async function doLogout() {
    setOpenAccount(false);
    setOpenMobile(false);
    await logout();
    window.location.href = "/";
  }

  const navItems = [
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
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="elora-logoMark" aria-hidden="true">
                <Image
                  src="/elora-logo.png"
                  alt=""
                  fill
                  sizes="40px"
                  priority
                  className="object-cover"
                />
              </div>
              <div className="leading-tight">
                <div className="font-black tracking-tight text-[1.05rem]">Elora</div>
                <div className="text-xs opacity-70 -mt-0.5">Education assistant</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="text-sm font-semibold opacity-80 hover:opacity-100 transition"
                >
                  {it.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {/* A) Verify shows when unverified; pill shows when verified */}
              {s.verified ? (
                <span
                  className="elora-pill"
                  title={s.verifiedEmail ? `Verified as ${s.verifiedEmail}` : "Verified"}
                >
                  <span className="elora-dot elora-dot-good" aria-hidden="true" />
                  Verified
                </span>
              ) : (
                <Link href="/verify" className="elora-btn elora-btn-primary">
                  Verify
                </Link>
              )}

              {/* Account dropdown */}
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  className="elora-btn elora-btn-ghost hidden sm:inline-flex"
                  aria-expanded={openAccount ? "true" : "false"}
                  onClick={() => setOpenAccount((v) => !v)}
                >
                  Account
                </button>

                {openAccount ? (
                  <div className="elora-menu" role="menu" aria-label="Account">
                    <Link
                      href="/settings"
                      className="elora-menu-item"
                      role="menuitem"
                      onClick={() => setOpenAccount(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/help"
                      className="elora-menu-item"
                      role="menuitem"
                      onClick={() => setOpenAccount(false)}
                    >
                      Help
                    </Link>
                    <div className="elora-menu-divider" />
                    <button
                      type="button"
                      className="elora-menu-item danger"
                      onClick={doLogout}
                      role="menuitem"
                    >
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Mobile menu */}
              <button
                className="md:hidden elora-btn elora-btn-ghost"
                onClick={() => setOpenMobile((v) => !v)}
                type="button"
                aria-expanded={openMobile ? "true" : "false"}
              >
                {openMobile ? "Close" : "Menu"}
              </button>
            </div>
          </div>

          {openMobile ? (
            <div className="mt-3 elora-card p-3 md:hidden">
              <div className="flex flex-col gap-1">
                {navItems.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpenMobile(false)}
                    className="px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {it.label}
                  </Link>
                ))}
                <div className="my-1 h-px bg-[var(--line)]" />
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={doLogout}
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
