// components/Navbar.js
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";

export default function Navbar() {
  const [session, setSession] = useState({
    verified: false,
    verifiedEmail: "",
    teacherAccess: false,
    teacherInviteCode: "",
  });

  useEffect(() => {
    setSession(getSession());
    const onStorage = () => setSession(getSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between px-4 py-3 md:px-5">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center overflow-hidden">
                {/* If you have a real logo image later, swap this for <Image /> */}
                <span className="text-white/90 text-sm font-semibold">E</span>
              </div>
              <span className="hidden sm:inline text-white font-semibold tracking-tight">
                Elora
              </span>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/assistant" className="hover:text-white transition-colors">
                Assistant
              </Link>
              <Link href="/help" className="hover:text-white transition-colors">
                Help
              </Link>
              <Link href="/settings" className="hover:text-white transition-colors">
                Settings
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div
                className={[
                  "hidden sm:inline-flex items-center rounded-full px-3 py-1 text-xs border",
                  session.verified
                    ? "bg-emerald-500/10 text-emerald-200 border-emerald-400/20"
                    : "bg-white/5 text-white/70 border-white/10",
                ].join(" ")}
                title={session.verifiedEmail ? `Verified: ${session.verifiedEmail}` : undefined}
              >
                {session.verified ? "Verified" : "Unverified"}
              </div>

              <Link
                href="/verify"
                className="inline-flex items-center justify-center rounded-full bg-indigo-500/90 hover:bg-indigo-500 text-white px-4 py-2 text-sm font-semibold shadow-[0_10px_25px_rgba(99,102,241,0.35)] transition-colors"
              >
                {session.verified ? "Manage" : "Verify"}
              </Link>

              {/* Mobile menu links (simple) */}
              <div className="md:hidden flex items-center gap-2">
                <Link
                  href="/assistant"
                  className="rounded-full border border-white/10 bg-white/5 text-white/80 px-3 py-2 text-xs hover:text-white hover:bg-white/10 transition-colors"
                >
                  Assistant
                </Link>
                <Link
                  href="/settings"
                  className="rounded-full border border-white/10 bg-white/5 text-white/80 px-3 py-2 text-xs hover:text-white hover:bg-white/10 transition-colors"
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
