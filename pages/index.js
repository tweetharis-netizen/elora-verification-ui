import Head from "next/head";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../components/Modal";
import { getSession, refreshVerifiedFromServer, setGuest, setRole, setVerified } from "../lib/session";

const ROLE_COPY = {
  educator: {
    badge: "Invite-protected educator tools",
    title: "Plan less. Teach more.",
    subtitle:
      "Elora turns structured options into clean, export-ready lessons, worksheets, assessments, and slides — without prompt wrestling.",
    cta: "Open Educator Assistant",
  },
  student: {
    badge: "Guided learning mode",
    title: "Learn with guidance, not guesswork.",
    subtitle:
      "Step-by-step help that teaches thinking — not copying. Clear explanations, practice, and feedback loops.",
    cta: "Open Student Assistant",
  },
  parent: {
    badge: "Home support mode",
    title: "Support learning at home.",
    subtitle:
      "Understand what’s being taught and get simple, practical ways to help — without stress or overwhelm.",
    cta: "Open Parent Assistant",
  },
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function SceneArt() {
  // Fast: inline SVG + gradients, “Runway-ish” hero layer
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/50 dark:bg-slate-950/35 backdrop-blur-xl shadow-2xl">
      <div className="absolute inset-0 elora-grain" />
      <div className="absolute -inset-20 bg-gradient-to-br from-indigo-500/25 via-sky-400/10 to-fuchsia-500/20 blur-3xl" />
      <svg viewBox="0 0 920 620" className="relative w-full h-auto" role="img" aria-label="Elora hero scene">
        <defs>
          <linearGradient id="g0" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(99,102,241,0.20)" />
            <stop offset="0.55" stopColor="rgba(56,189,248,0.10)" />
            <stop offset="1" stopColor="rgba(168,85,247,0.16)" />
          </linearGradient>
          <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="920" height="620" fill="url(#g0)" />
        <circle cx="160" cy="120" r="140" fill="rgba(99,102,241,0.16)" />
        <circle cx="820" cy="120" r="160" fill="rgba(56,189,248,0.12)" />
        <circle cx="520" cy="560" r="220" fill="rgba(168,85,247,0.10)" />

        {/* “character” orb */}
        <g transform="translate(462 260)">
          <circle r="70" fill="url(#acc)" opacity="0.85" />
          <circle r="50" fill="rgba(255,255,255,0.18)" />
          <circle cx="-18" cy="-10" r="7" fill="rgba(255,255,255,0.85)" />
          <circle cx="12" cy="-8" r="7" fill="rgba(255,255,255,0.85)" />
          <path d="M-20 18 C-6 30, 6 30, 20 18" stroke="rgba(255,255,255,0.85)" strokeWidth="7" strokeLinecap="round" fill="none" />
        </g>

        {/* floating cards */}
        <g transform="translate(560 90) rotate(2)">
          <rect width="280" height="140" rx="24" fill="rgba(255,255,255,0.22)" />
          <rect x="18" y="20" width="150" height="16" rx="8" fill="rgba(99,102,241,0.50)" />
          <rect x="18" y="52" width="230" height="12" rx="6" fill="rgba(255,255,255,0.22)" />
          <rect x="18" y="74" width="210" height="12" rx="6" fill="rgba(255,255,255,0.19)" />
          <rect x="18" y="96" width="170" height="12" rx="6" fill="rgba(255,255,255,0.17)" />
        </g>

        <g transform="translate(500 250) rotate(-4)">
          <rect width="270" height="130" rx="24" fill="rgba(15,23,42,0.22)" />
          <rect x="18" y="18" width="150" height="16" rx="8" fill="rgba(56,189,248,0.55)" />
          <rect x="18" y="50" width="220" height="12" rx="6" fill="rgba(255,255,255,0.18)" />
          <rect x="18" y="72" width="200" height="12" rx="6" fill="rgba(255,255,255,0.16)" />
          <rect x="18" y="94" width="160" height="12" rx="6" fill="rgba(255,255,255,0.14)" />
        </g>

        {/* ground */}
        <ellipse cx="460" cy="520" rx="320" ry="80" fill="rgba(0,0,0,0.10)" />
      </svg>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl px-3 py-1.5 text-xs font-extrabold opacity-90">
          Options → clean output → export-ready
        </div>
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

    // Always check server truth before gating (no stale cache lies)
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
        <title>Elora — Plan less. Teach more.</title>
        <meta
          name="description"
          content="Elora is a premium education assistant with structured options for teachers, students, and parents."
        />
      </Head>

      <div className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 elora-grain" />
          <div className="absolute -top-24 left-0 right-0 h-[520px] bg-gradient-to-b from-black/10 via-transparent to-transparent dark:from-black/30" />
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl">
                <span className="text-sm font-extrabold opacity-90">{copy.badge}</span>
              </div>

              <h1 className="mt-6 font-black tracking-tight text-[clamp(2.4rem,4.2vw,4.2rem)] leading-[1.02]">
                <span className="font-serif">{copy.title}</span>
              </h1>

              <p className="mt-4 elora-muted text-[1.05rem] leading-relaxed max-w-xl">
                {copy.subtitle}
              </p>

              {/* Role selector */}
              <div className="mt-6 flex flex-wrap gap-2">
                {["educator", "student", "parent"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleState(r)}
                    className={cn(
                      "elora-btn",
                      role === r ? "elora-btn-primary" : ""
                    )}
                    type="button"
                  >
                    {r === "educator" ? "Teacher" : r === "student" ? "Student" : "Parent"}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button onClick={openAssistant} className="elora-btn elora-btn-primary" type="button">
                  {copy.cta}
                </button>
                <button
                  onClick={() => router.push("/help")}
                  className="elora-btn"
                  type="button"
                >
                  Quickstart
                </button>
              </div>

              <p className="mt-5 elora-muted text-sm max-w-xl">
                Verification unlocks exports (DOCX / PDF / PPTX). Educator tools can be invite-protected.
              </p>
            </div>

            {/* Right */}
            <div className="relative">
              <SceneArt />
            </div>
          </div>
        </div>
      </div>

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
