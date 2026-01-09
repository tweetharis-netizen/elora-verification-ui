import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import {
  activateTeacher,
  getSession,
  refreshVerifiedFromServer,
  setGuest as storeGuest,
  setRole as storeRole,
} from "../lib/session";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Chip({ children, variant = "neutral" }) {
  const styles =
    variant === "good"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : variant === "warn"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
      : variant === "accent"
      ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200"
      : "border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 text-slate-700 dark:text-slate-200";

  return <span className={cn("rounded-full px-3 py-1 text-xs font-extrabold border", styles)}>{children}</span>;
}

function PreviewCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-5">
      <div className="text-sm font-black text-slate-950 dark:text-white">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function DemoPage() {
  const [session, setSession] = useState(() => getSession());
  const verified = Boolean(session?.verified);
  const teacher = Boolean(session?.teacher);

  const [verifyGateOpen, setVerifyGateOpen] = useState(false);
  const [teacherGateOpen, setTeacherGateOpen] = useState(false);

  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("");

  const [teacherGateCode, setTeacherGateCode] = useState("");
  const [teacherGateStatus, setTeacherGateStatus] = useState("");

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        await refreshVerifiedFromServer();
      } finally {
        const s = getSession();
        if (!mounted) return;
        setSession(s);
      }
    }

    refresh();

    const onSession = () => setSession(getSession());
    window.addEventListener("elora:session", onSession);
    window.addEventListener("storage", onSession);
    return () => {
      mounted = false;
      window.removeEventListener("elora:session", onSession);
      window.removeEventListener("storage", onSession);
    };
  }, []);

  const nextSteps = useMemo(() => {
    const items = [];
    if (!verified) items.push("Verify your email to unlock persistent sessions and exports.");
    if (verified && !teacher) items.push("Enter a teacher invite code to unlock teacher tools.");
    items.push("Open Assistant and ask a question in plain language.");
    return items;
  }, [verified, teacher]);

  async function doVerifySend() {
    const email = verifyEmail.trim();
    if (!email) return;

    setVerifyStatus("Sending…");

    try {
      const r = await fetch("/api/verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "Failed to send verification email.");
      setVerifyStatus("Sent! Check your inbox.");
    } catch (e) {
      setVerifyStatus(String(e?.message || e));
    }
  }

  async function doTeacherRedeem() {
    setTeacherGateStatus("");
    const code = teacherGateCode.trim();
    if (!code) {
      setTeacherGateStatus("Enter a code.");
      return false;
    }

    try {
      const ok = await activateTeacher(code);
      if (!ok) {
        setTeacherGateStatus("Invalid code.");
        return false;
      }

      await refreshVerifiedFromServer();
      const s = getSession();
      setSession(s);

      setTeacherGateStatus("Teacher tools unlocked ✅");
      return true;
    } catch {
      setTeacherGateStatus("Could not validate right now. Try again.");
      return false;
    }
  }

  return (
    <>
      <Head>
        <title>Elora Demo</title>
      </Head>

      <div className="elora-page">
        <div className="elora-container">
          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/20 shadow-xl shadow-slate-900/5 dark:shadow-black/20 p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-3xl font-black text-slate-950 dark:text-white">Elora</h1>
                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 max-w-[56ch]">
                    A professional but warm teaching assistant that helps educators verify student work and give clear,
                    human explanations.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Chip variant={verified ? "good" : "warn"}>{verified ? "Verified" : "Not verified"}</Chip>
                  <Chip variant={teacher ? "accent" : "neutral"}>{teacher ? "Teacher mode" : "Standard mode"}</Chip>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <PreviewCard title="What judges should see in 5 minutes">
                  <ol className="list-decimal ml-5 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                    {nextSteps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </PreviewCard>

                <PreviewCard title="Quick actions">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setVerifyGateOpen(true)}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500 transition"
                    >
                      Verify email
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        storeRole("educator");
                        setSession(getSession());
                      }}
                      className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-950/25"
                    >
                      Set role: Teacher
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        storeRole("student");
                        setSession(getSession());
                      }}
                      className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-950/25"
                    >
                      Set role: Student
                    </button>

                    <button
                      type="button"
                      onClick={() => setTeacherGateOpen(true)}
                      className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-950/25"
                    >
                      Unlock teacher tools
                    </button>
                  </div>
                </PreviewCard>
              </div>
            </div>

            <div className="grid gap-4">
              <PreviewCard title="Assistant preview">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-950/25 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                    “Explain why 5 divided by 4 is 1.25, like I’m 13.”
                  </div>

                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-600 text-white px-4 py-3 text-sm">
                    5 divided by 4 means: split 5 into 4 equal parts. Each part is 1, and you have 1 left over. The leftover
                    is 1 out of 4, which is 0.25. So 1 + 0.25 = 1.25.
                  </div>
                </div>
              </PreviewCard>

              <PreviewCard title="Status">
                <div className="flex flex-wrap gap-2">
                  <Chip variant={verified ? "good" : "warn"}>{verified ? "Verified" : "Not verified"}</Chip>
                  <Chip variant={teacher ? "accent" : "neutral"}>{teacher ? "Teacher mode enabled" : "Teacher tools locked"}</Chip>
                </div>
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                  (Status comes from session + server refresh on load.)
                </div>
              </PreviewCard>
            </div>
          </div>
        </div>
      </div>

      {/* Verify gate modal */}
      <Modal open={verifyGateOpen} title="Verify to continue" onClose={() => setVerifyGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Verification unlocks exports and persistent sessions. For demo: use a real email you can access.
        </div>

        <div className="mt-4">
          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Email</label>
          <input
            value={verifyEmail}
            onChange={(e) => setVerifyEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={doVerifySend}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500 transition"
            >
              Send link
            </button>

            <button
              type="button"
              onClick={async () => {
                storeGuest(true);
                setSession(getSession());
                setVerifyGateOpen(false);
              }}
              className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-950/25"
            >
              Continue as guest
            </button>
          </div>

          {verifyStatus ? <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">{verifyStatus}</div> : null}
        </div>
      </Modal>

      {/* Teacher gate modal */}
      <Modal open={teacherGateOpen} title="Unlock Teacher Tools" onClose={() => setTeacherGateOpen(false)}>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Lesson plans, worksheets, assessments, and slides are locked behind a Teacher Invite Code.
        </div>

        <div className="mt-4">
          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Invite code</label>
          <input
            value={teacherGateCode}
            onChange={(e) => setTeacherGateCode(e.target.value)}
            placeholder="e.g. GENESIS2026"
            className="mt-2 w-full rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const ok = await doTeacherRedeem();
                if (ok) setTeacherGateOpen(false);
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500 transition"
            >
              Unlock
            </button>

            <button
              type="button"
              onClick={() => setTeacherGateOpen(false)}
              className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/15 px-4 py-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-950/25"
            >
              Cancel
            </button>
          </div>

          {teacherGateStatus ? (
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">{teacherGateStatus}</div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
