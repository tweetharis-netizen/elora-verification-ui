import Head from "next/head";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../components/Modal";
import { getSession, refreshVerifiedFromServer, setGuest, setRole, setVerified } from "../lib/session";

const ROLE_COPY = {
  educator: {
    badge: "Built for real classrooms",
    title: "Lesson-ready materials in minutes.",
    subtitle:
      "Structured options that turn into clean, export-ready lessons, worksheets, quizzes, and slides — without prompt wrestling.",
    cta: "Try Elora",
  },
  student: {
    badge: "Guided learning",
    title: "Learn with guidance, not guesswork.",
    subtitle:
      "Step-by-step help that teaches thinking — practice, feedback, and clarity without shortcuts.",
    cta: "Open Student Assistant",
  },
  parent: {
    badge: "Home support",
    title: "Support learning at home.",
    subtitle:
      "Simple explanations and practical next steps — so you can help without stress or overwhelm.",
    cta: "Open Parent Assistant",
  },
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function RoleSegment({ role, onChange }) {
  const items = [
    { key: "educator", label: "Teacher" },
    { key: "student", label: "Student" },
    { key: "parent", label: "Parent" },
  ];

  return (
    <div className="elora-segmented" role="tablist" aria-label="Mode">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          role="tab"
          aria-selected={role === it.key ? "true" : "false"}
          className={cn(role === it.key ? "active" : "")}
          onClick={() => onChange(it.key)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="elora-card p-5 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -inset-24 bg-gradient-to-br from-indigo-500/15 via-sky-400/10 to-fuchsia-500/15 blur-3xl" />
        <div className="absolute inset-0 elora-grain" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black tracking-tight">Review & export</div>
            <div className="elora-muted text-xs mt-1">Teacher verification dashboard</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="elora-chip" data-variant="good">
              Verified
            </span>
            <span className="elora-chip" data-variant="warn">
              Needs review
            </span>
            <span className="elora-chip" data-variant="bad">
              Flagged
            </span>
          </div>
        </div>

        <div className="mt-5 elora-table">
          <div className="elora-row elora-row-head">
            <div>Student</div>
            <div>Assignment</div>
            <div>Status</div>
          </div>

          {[
            { s: "Aisha Tan", a: "Fractions Worksheet", v: "good", t: "Verified" },
            { s: "Marcus Lee", a: "Persuasive Writing", v: "warn", t: "Needs review" },
            { s: "Sofia Lim", a: "Photosynthesis Quiz", v: "good", t: "Verified" },
            { s: "Noah Chen", a: "Source Analysis", v: "bad", t: "Flagged" },
          ].map((r) => (
            <div key={`${r.s}-${r.a}`} className="elora-row">
              <div className="font-semibold truncate">{r.s}</div>
              <div className="elora-muted truncate">{r.a}</div>
              <div>
                <span className="elora-chip" data-variant={r.v}>
                  {r.t}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 elora-muted text-xs">Preview only — exports unlock after verification.</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [role, setRoleState] = useState("educator");
  const [gateOpen, setGateOpen] = useState(false);

  const copy = useMemo(() => ROLE_COPY[role] || ROLE_COPY.educator, [role]);

  const openAssistant = async () => {
    setRole(role);
    const status = await refreshVerifiedFromServer().catch(() => ({ verified: false }));
    const s = getSession();

    if (status?.verified || s.verified) {
      setGuest(false);
      router.push("/assistant");
      return;
    }

    setGateOpen(true);
  };

  const pickGuest = () => {
    setRole(role);
    setVerified(false);
    setGuest(true);
    setGateOpen(false);
    router.push("/assistant");
  };

  const pickVerify = () => {
    setRole(role);
    setGuest(false);
    setGateOpen(false);
    router.push("/verify");
  };

  return (
    <>
      <Head>
        <title>Elora — Education assistant</title>
        <meta
          name="description"
          content="Elora is a premium education assistant with structured options for teachers, students, and parents."
        />
      </Head>

      <section className="mx-auto px-4" style={{ maxWidth: "var(--elora-page-max)" }}>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl px-4 py-2">
              <span className="text-sm font-extrabold opacity-90">{copy.badge}</span>
            </div>

            <h1 className="mt-6 elora-h1 text-[clamp(2.4rem,4.2vw,4.1rem)]">{copy.title}</h1>

            <p className="mt-4 elora-muted text-[1.05rem] leading-relaxed max-w-xl">{copy.subtitle}</p>

            <div className="mt-6">
              <RoleSegment role={role} onChange={setRoleState} />
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button onClick={openAssistant} className="elora-btn elora-btn-primary" type="button">
                {copy.cta}
              </button>
              <button onClick={() => router.push("/help")} className="elora-btn elora-btn-ghost" type="button">
                How it works
              </button>
            </div>

            <p className="mt-5 elora-muted text-sm max-w-xl">
              Exports unlock after verification. Teacher tools can be invite-protected in Settings.
            </p>
          </div>

          {/* Right */}
          <div className="relative">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* Gate modal */}
      <Modal open={gateOpen} onClose={() => setGateOpen(false)} title="Verify to unlock exports">
        <div className="space-y-3">
          <p className="elora-muted">
            Guest mode is limited. Verification unlocks exports and higher-capacity workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button className="elora-btn elora-btn-primary" onClick={pickVerify} type="button">
              Verify email
            </button>
            <button className="elora-btn" onClick={pickGuest} type="button">
              Continue as guest
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
