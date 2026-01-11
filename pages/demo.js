import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getSession, isTeacher, refreshVerifiedFromServer } from "../lib/session";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Chip({ variant, children }) {
  const styles =
    variant === "good"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : variant === "warn"
      ? "border-amber-400/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
      : "border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/25 text-slate-700 dark:text-slate-200";

  const dot =
    variant === "good"
      ? "bg-emerald-400"
      : variant === "warn"
      ? "bg-amber-400"
      : "bg-slate-300 dark:bg-white/30";

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold", styles)}>
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {children}
    </span>
  );
}

function DemoCard({ title, desc, children }) {
  return (
    <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
      <div className="text-lg font-black text-slate-950 dark:text-white">{title}</div>
      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{desc}</div>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export default function Demo() {
  const router = useRouter();

  const [session, setSession] = useState(() => getSession());
  const verified = Boolean(session?.verified);
  const teacher = Boolean(isTeacher());

  useEffect(() => {
    let mounted = true;
    refreshVerifiedFromServer().then(() => {
      if (!mounted) return;
      setSession(getSession());
    });
    return () => {
      mounted = false;
    };
  }, []);

  const nextSteps = useMemo(() => {
    if (!verified) {
      return [
        { label: "Verify email", href: "/verify", note: "Unlock educator mode + exports" },
        { label: "Open Assistant", href: "/assistant", note: "Plain-language explanations" },
      ];
    }
    if (!teacher) {
      return [
        { label: "Open Assistant", href: "/assistant", note: "Enter a Teacher Invite Code to unlock tools" },
        { label: "Help (demo script)", href: "/help", note: "5–7 minute run-through" },
      ];
    }
    return [
      { label: "Open Assistant", href: "/assistant", note: "Teacher tools unlocked" },
      { label: "Help (demo script)", href: "/help", note: "Follow the 5 steps live" },
    ];
  }, [verified, teacher]);

  return (
    <>
      <Head>
        <title>Elora — Genesis Demo</title>
      </Head>

      <div className="elora-page">
        <div className="elora-container">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-slate-950 dark:text-white">Genesis Demo</h1>
              <p className="mt-2 text-slate-700 dark:text-slate-300 max-w-2xl">
                This page is the judge-friendly launchpad. It shows what to do next based on verification + role.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip variant={verified ? "good" : "warn"}>{verified ? "Verified" : "Not verified"}</Chip>
              <Chip variant={teacher ? "good" : "neutral"}>{teacher ? "Teacher mode" : "Teacher tools locked"}</Chip>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <DemoCard
              title="The point"
              desc="Elora is a calm teaching assistant: verifies student work and explains concepts in human language, in a structure teachers can reuse."
            />

            <DemoCard
              title="What judges should notice"
              desc="Verification persists after refresh. Teacher tools are invite-gated and enforced. The assistant is readable and not intimidating."
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <DemoCard title="Next steps" desc="Click these in order. This is the fastest clean demo.">
              <div className="grid gap-3">
                {nextSteps.map((s) => (
                  <button
                    key={s.href}
                    type="button"
                    onClick={() => router.push(s.href)}
                    className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-5 py-4 text-left hover:bg-white dark:hover:bg-slate-950/35"
                  >
                    <div className="text-sm font-extrabold text-slate-950 dark:text-white">{s.label}</div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{s.note}</div>
                  </button>
                ))}
              </div>
            </DemoCard>

            <DemoCard title="Fast demo route" desc="If time is tight, do this:">
              <ol className="mt-2 grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                <li>
                  <b>1)</b> Verify email
                </li>
                <li>
                  <b>2)</b> Assistant → Teacher code → unlock
                </li>
                <li>
                  <b>3)</b> Verify student work demo
                </li>
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/verify")}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
                >
                  Go to Verify
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/assistant")}
                  className="rounded-full border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 px-4 py-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/35"
                >
                  Go to Assistant
                </button>
              </div>
            </DemoCard>
          </div>
        </div>
      </div>
    </>
  );
}
