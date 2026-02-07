export default function HeroScene() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/50 dark:bg-slate-950/35 backdrop-blur-xl shadow-2xl">
      <div className="absolute inset-0 elora-grain" />
      <div className="absolute inset-0 elora-vignette" />
      <div className="absolute -inset-24 bg-gradient-to-br from-indigo-500/25 via-sky-400/10 to-fuchsia-500/20 blur-3xl" />

      <svg
        viewBox="0 0 920 620"
        className="relative w-full h-auto"
        role="img"
        aria-label="Cinematic Elora scene"
      >
        <defs>
          <linearGradient id="g0" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(99,102,241,0.20)" />
            <stop offset="0.55" stopColor="rgba(56,189,248,0.10)" />
            <stop offset="1" stopColor="rgba(168,85,247,0.16)" />
          </linearGradient>
          <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#59c2ff" />
          </linearGradient>
          <linearGradient id="acc2" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#a855f7" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="920" height="620" fill="url(#g0)" />

        {/* atmospheric blooms */}
        <circle cx="150" cy="120" r="160" fill="rgba(99,102,241,0.14)" />
        <circle cx="820" cy="120" r="170" fill="rgba(56,189,248,0.10)" />
        <circle cx="520" cy="560" r="230" fill="rgba(168,85,247,0.08)" />

        {/* “character” core */}
        <g transform="translate(462 280)">
          <circle r="78" fill="url(#acc)" opacity="0.9" />
          <circle r="56" fill="rgba(255,255,255,0.14)" />
          <circle cx="-18" cy="-10" r="7" fill="rgba(255,255,255,0.85)" />
          <circle cx="12" cy="-8" r="7" fill="rgba(255,255,255,0.85)" />
          <path
            d="M-22 20 C-6 34, 6 34, 22 20"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* floating UI plates */}
        <g className="elora-float" transform="translate(560 86) rotate(2)">
          <rect width="292" height="150" rx="26" fill="rgba(255,255,255,0.22)" />
          <rect x="18" y="20" width="160" height="16" rx="8" fill="rgba(99,102,241,0.55)" />
          <rect x="18" y="54" width="242" height="12" rx="6" fill="rgba(255,255,255,0.22)" />
          <rect x="18" y="78" width="220" height="12" rx="6" fill="rgba(255,255,255,0.19)" />
          <rect x="18" y="102" width="182" height="12" rx="6" fill="rgba(255,255,255,0.17)" />
        </g>

        <g className="elora-float2" transform="translate(494 252) rotate(-4)">
          <rect width="286" height="140" rx="26" fill="rgba(15,23,42,0.22)" />
          <rect x="18" y="18" width="154" height="16" rx="8" fill="rgba(56,189,248,0.58)" />
          <rect x="18" y="52" width="236" height="12" rx="6" fill="rgba(255,255,255,0.18)" />
          <rect x="18" y="76" width="214" height="12" rx="6" fill="rgba(255,255,255,0.16)" />
          <rect x="18" y="100" width="170" height="12" rx="6" fill="rgba(255,255,255,0.14)" />
        </g>

        {/* ground */}
        <ellipse cx="460" cy="520" rx="330" ry="86" fill="rgba(0,0,0,0.10)" />
      </svg>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/55 dark:bg-slate-950/40 backdrop-blur-xl px-3 py-1.5 text-xs font-extrabold opacity-90">
          Options → clean output → export-ready
        </div>
      </div>
    </div>
  );
}
