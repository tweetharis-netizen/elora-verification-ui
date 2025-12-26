export default function RoleIllustration({ role = "educator" }) {
  const common = "w-full h-32 rounded-xl overflow-hidden";

  if (role === "student") {
    return (
      <div className={common}>
        <svg viewBox="0 0 420 180" className="w-full h-full">
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0" stopColor="#93c5fd" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <rect width="420" height="180" fill="url(#g1)" opacity="0.55" />
          <circle cx="335" cy="60" r="42" fill="#fff" opacity="0.45" />
          <rect x="48" y="110" width="250" height="14" rx="7" fill="#0f172a" opacity="0.18" />
          <rect x="48" y="132" width="190" height="14" rx="7" fill="#0f172a" opacity="0.14" />
          <circle cx="100" cy="80" r="24" fill="#0f172a" opacity="0.22" />
          <rect x="132" y="64" width="180" height="60" rx="14" fill="#ffffff" opacity="0.35" />
          <rect x="152" y="82" width="130" height="10" rx="5" fill="#0f172a" opacity="0.18" />
          <rect x="152" y="100" width="90" height="10" rx="5" fill="#0f172a" opacity="0.12" />
        </svg>
      </div>
    );
  }

  if (role === "parent") {
    return (
      <div className={common}>
        <svg viewBox="0 0 420 180" className="w-full h-full">
          <defs>
            <linearGradient id="g2" x1="0" x2="1">
              <stop offset="0" stopColor="#fdba74" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <rect width="420" height="180" fill="url(#g2)" opacity="0.52" />
          <circle cx="80" cy="88" r="22" fill="#0f172a" opacity="0.22" />
          <circle cx="145" cy="96" r="16" fill="#0f172a" opacity="0.2" />
          <rect x="175" y="70" width="200" height="70" rx="18" fill="#ffffff" opacity="0.35" />
          <rect x="195" y="92" width="150" height="12" rx="6" fill="#0f172a" opacity="0.16" />
          <rect x="195" y="112" width="110" height="12" rx="6" fill="#0f172a" opacity="0.12" />
          <circle cx="340" cy="56" r="40" fill="#fff" opacity="0.35" />
        </svg>
      </div>
    );
  }

  // educator default
  return (
    <div className={common}>
      <svg viewBox="0 0 420 180" className="w-full h-full">
        <defs>
          <linearGradient id="g3" x1="0" x2="1">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <rect width="420" height="180" fill="url(#g3)" opacity="0.55" />
        <rect x="210" y="45" width="180" height="95" rx="16" fill="#0f172a" opacity="0.25" />
        <rect x="228" y="70" width="110" height="10" rx="5" fill="#fff" opacity="0.5" />
        <rect x="228" y="92" width="140" height="10" rx="5" fill="#fff" opacity="0.35" />
        <rect x="228" y="114" width="90" height="10" rx="5" fill="#fff" opacity="0.28" />
        <circle cx="120" cy="85" r="26" fill="#0f172a" opacity="0.22" />
        <rect x="52" y="132" width="160" height="12" rx="6" fill="#0f172a" opacity="0.12" />
      </svg>
    </div>
  );
}
