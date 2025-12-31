import Head from "next/head";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Modal from "@/components/Modal";
import HeroScene from "@/components/HeroScene";
import {
  getSession,
  refreshVerifiedFromServer,
  setGuest,
  setRole,
  setVerified,
} from "@/lib/session";

const ROLE_COPY = {
  educator: {
    kicker: "Invite-protected educator tools",
    title: "Plan less. Teach more.",
    subtitle:
      "Elora turns structured options into clean, export-ready lessons, worksheets, assessments, and slides — without prompt wrestling.",
    cta: "Open Educator Assistant",
  },
  student: {
    kicker: "Guided learning mode",
    title: "Learn with guidance, not guesswork.",
    subtitle:
      "Step-by-step help that teaches thinking — not copying. Clear explanations, practice, and feedback loops.",
    cta: "Open Student Assistant",
  },
  parent: {
    kicker: "Home support mode",
    title: "Support learning at home.",
    subtitle:
      "Understand what’s being taught and get simple, practical ways to help — without stress or overwhelm.",
    cta: "Open Parent Assistant",
  },
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function HomePage() {
  const router = useRouter();
  const [role, setRoleState] = useState("educator");
  const [gateOpen, setGateOpen] = useState(false);

  const copy = useMemo(() => ROLE_COPY[role] || ROLE_COPY.educator, [role]);

  const openAssistant = async () => {
    setRole(role);

    // Server truth (no stale local lies)
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

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 elora-grain" />
          <div className="absolute -top-24 left-0 right-0 h-[640px] bg-gradient-to-b from-black/10 via-transparent to-transparent dark:from-black/35" />
        </div>

        <div className="mx-auto px-4" style={{ maxWidth: "var(--elora-page-max)" }}>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="elora-kicker">{copy.kicker}</div>

              <h1 className="mt-6 text-[clamp(2.6rem,4.6vw,4.3rem)] elora-h1">
                {copy.title}
              </h1>

              <p className="mt-4 elora-muted text-[1.06rem] leading-relaxed max-w-xl">
                {copy.subtitle}
              </p>

              {/* Role selector */}
              <div className="mt-6 flex flex-wrap gap-2">
                {["educator", "student", "parent"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleState(r)}
                    className={cn("elora-btn", role === r ? "elora-btn-primary" : "")}
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
                <button onClick={() => router.push("/help")} className="elora-btn" type="button">
                  Quickstart
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="elora-card p-4">
                  <div className="font-black">Structured</div>
                  <div className="elora-muted text-sm mt-1">Pick options → get clean output.</div>
                </div>
                <div className="elora-card p-4">
                  <div className="font-black">Export-ready</div>
                  <div className="elora-muted text-sm mt-1">DOCX / PDF / PPTX formats.</div>
                </div>
                <div className="elora-card p-4">
                  <div className="font-black">Trustworthy</div>
                  <div className="elora-muted text-sm mt-1">Calm UX, minimal motion.</div>
                </div>
              </div>

              <p className="mt-5 elora-muted text-sm max-w-xl">
                Verification unlocks exports. Educator tools can be invite-protected.
              </p>
            </div>

            <div className="relative">
              <HeroScene />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mt-14">
        <div className="mx-auto px-4" style={{ maxWidth: "var(--elora-page-max)" }}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="elora-kicker">What you get</div>
              <h2 className="mt-5 text-[clamp(1.7rem,2.6vw,2.2rem)] elora-h1">
                Cinematic clarity.
                <br />
                Classroom results.
              </h2>
              <p className="mt-3 elora-muted leading-relaxed">
                Elora is designed to feel calm, premium, and fast — with output that looks like a teacher made it.
              </p>
            </div>

            <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
              <div className="elora-card p-6">
                <div className="font-black text-lg">Lesson plans</div>
                <p className="mt-2 elora-muted">
                  Objectives, timings, checks for understanding, differentiation.
                </p>
              </div>
              <div className="elora-card p-6">
                <div className="font-black text-lg">Worksheets</div>
                <p className="mt-2 elora-muted">
                  Student + teacher versions, aligned to level and topic.
                </p>
              </div>
              <div className="elora-card p-6">
                <div className="font-black text-lg">Assessments</div>
                <p className="mt-2 elora-muted">
                  Marks, rubric, and marking scheme (teacher mode).
                </p>
              </div>
              <div className="elora-card p-6">
                <div className="font-black text-lg">Slides</div>
                <p className="mt-2 elora-muted">
                  Clean deck structure and classroom pacing built in.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 elora-card p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="font-black text-lg">Ready to try it?</div>
                <div className="elora-muted mt-1">
                  Start in guest mode or verify to unlock exports.
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="elora-btn elora-btn-primary" type="button" onClick={openAssistant}>
                  Open Assistant
                </button>
                <button className="elora-btn" type="button" onClick={() => router.push("/verify")}>
                  Verify email
                </button>
              </div>
            </div>
          </div>

          <footer className="mt-10 elora-muted text-xs">
            © {new Date().getFullYear()} Elora — calm, premium, export-ready learning support.
          </footer>
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
