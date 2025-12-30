import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getSession, isVerified, isTeacher } from "../lib/session";

export default function Navbar() {
  const [session, setSession] = useState(getSession());

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("elora:session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("elora:session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const verified = isVerified();
  const teacher = isTeacher();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto max-w-6xl px-4">
        <div className="mt-4 flex h-16 items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <Image
                src="/elora-logo.png"
                alt="Elora"
                fill
                className="object-contain p-2"
                priority
              />
            </div>
            <span className="sr-only">Elora</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm text-white/80 sm:flex">
            <Link className="hover:text-white" href="/assistant">Assistant</Link>
            <Link className="hover:text-white" href="/help">Help</Link>
            <Link className="hover:text-white" href="/settings">Settings</Link>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`hidden rounded-full border px-3 py-1 text-xs sm:inline-flex ${
                teacher
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                  : verified
                    ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
                    : "border-white/10 bg-white/5 text-white/70"
              }`}
            >
              {teacher ? "Educator" : verified ? "Verified" : "Unverified"}
            </span>

            <Link
              href="/verify"
              className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-400"
            >
              Verify
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
