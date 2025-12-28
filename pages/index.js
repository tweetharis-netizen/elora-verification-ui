import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import Modal from "../components/Modal";
import RoleIllustration from "../components/RoleIllustration";
import { getSession, setGuest, setRole, setVerified } from "../lib/session";

const ROLES = [
  {
    id: "educator",
    title: "I’m an Educator",
    desc: "Plan lessons, generate worksheets, create assessments, design slides.",
  },
  {
    id: "student",
    title: "I’m a Student",
    desc: "Get explanations, worked examples, practice, and revision help.",
  },
  {
    id: "parent",
    title: "I’m a Parent",
    desc: "Understand what your child is learning and how to help at home.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [role, setRoleState] = useState("educator");
  const [gateOpen, setGateOpen] = useState(false);

  const safeNav = async (path) => {
    try {
      await router.push(path);
    } catch {
      // Hard fallback (prevents “button does nothing”)
      window.location.href = path;
    }
  };

  const continueFlow = async () => {
    setRole(role);

    const s = getSession();
    if (s.verified) {
      setGuest(false);
      await safeNav("/assistant");
      return;
    }

    setGateOpen(true);
  };

  const pickGuest = async () => {
    // Ensure state is committed BEFORE navigation
    setRole(role);
    setVerified(false);
    setGuest(true);
    setGateOpen(false);

    // Next tick improves reliability in some browsers/devices
    await new Promise((r) => setTimeout(r, 0));
    await safeNav("/assistant");
  };

  const pickVerify = async () => {
    setRole(role);
    setGuest(false);
    setGateOpen(false);
    await safeNav("/verify");
  };

  return (
    <>
      <Head>
        <title>Elora — Plan less. Teach more.</title>
        <meta
          name="description"
          content="Elora is an AI teaching assistant that fixes the prompting problem with structured options for educators, students, and parents."
        />
      </Head>

      <div className="py-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl shadow-lg shadow-slate-900/5 dark:shadow-black/30">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Built for real classrooms — not generic chat.
            </span>
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight text-slate-950 dark:text-white">
            Plan less. Teach more.
          </h1>

          <p className="mt-4 text-base md:text-lg text-slate-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Elora solves the <span className="font-semibold">prompting problem</span> by giving you structured options
            (role, level, subject, goals) and generating classroom-ready output — with chat for refinements when needed.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleState(r.id)}
              className={[
                "text-left rounded-2xl p-4 border backdrop-blur-xl transition shadow-lg shadow-slate-900/5 dark:shadow-black/30",
                role === r.id
                  ? "border-indigo-500/50 bg-white/75 dark:bg-slate-950/55"
                  : "border-white/10 bg-white/55 dark:bg-slate-950/40 hover:bg-white/75 dark:hover:bg-slate-950/55",
              ].join(" ")}
            >
              <RoleIllustration role={r.id} />
              <div className="mt-3">
                <div className="text-lg font-extrabold text-slate-950 dark:text-white">{r.title}</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{r.desc}</div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                    role === r.id
                      ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200"
                      : "border-white/10 bg-white/40 dark:bg-slate-950/30 text-slate-700 dark:text-slate-200",
                  ].join(" ")}
                >
                  Selected
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={continueFlow}
            className="w-full sm:w-auto px-6 py-3 rounded-full font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={pickGuest}
            className="w-full sm:w-auto px-6 py-3 rounded-full font-bold border border-white/10 bg-white/55 dark:bg-slate-950/40 text-slate-900 dark:text-white hover:bg-white/75 dark:hover:bg-slate-950/55 shadow-lg shadow-slate-900/5 dark:shadow-black/30"
          >
            Try as Guest (limited)
          </button>
        </div>
      </div>

      <Modal open={gateOpen} title="Verify to unlock Elora" onClose={() => setGateOpen(false)}>
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          To unlock full features (assessments, slide generation, exports), please verify your email.
          You can still try a limited guest preview.
        </p>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={pickVerify}
            className="w-full px-5 py-3 rounded-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            Verify
          </button>
          <button
            type="button"
            onClick={pickGuest}
            className="w-full px-5 py-3 rounded-xl font-bold border border-white/10 bg-white/70 dark:bg-slate-950/40 text-slate-900 dark:text-white hover:bg-white/90 dark:hover:bg-slate-950/60 shadow-lg shadow-slate-900/5 dark:shadow-black/30"
          >
            Continue as Guest (limited)
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Guest limits: no assessments, no slides, no exports.
        </div>
      </Modal>
    </>
  );
}
