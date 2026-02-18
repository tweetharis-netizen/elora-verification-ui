# PLAN.md — Elora AI Teaching Assistant

> **Scope**: This file governs work on `elora---ai-teaching-assistant` only.  
> All other folders are legacy/reference. No changes outside this folder without explicit approval.

---

## What is Elora?

Elora is a **B2B SaaS marketing landing page** for an AI-powered teaching assistant platform aimed at K-12 schools. The product pitch: reduce teacher admin workload (grading, lesson planning, attendance), personalize student learning via AI, and give parents transparent progress updates.

The current codebase is a **polished marketing site** — not the actual product app. It is a single-page React app designed to convert school administrators and teachers into demo bookings.

---

## Current Architecture

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | React 19 + TypeScript | Functional components only, no class components |
| **Build tool** | Vite 6 | Dev server on port 3000, `npm run dev` to start |
| **Styling** | Tailwind CSS **via CDN** (`<script src="https://cdn.tailwindcss.com">`) | Config injected inline in `index.html` |
| **Icons** | `lucide-react` 0.574 | Imported from esm.sh via importmap |
| **Fonts** | Inter (sans) + Playfair Display (serif) | Loaded from Google Fonts |
| **Routing** | None | Single page, no React Router |
| **State** | Local `useState` only | One interactive component: `ImpactCalculator` |
| **Backend / API** | None | Pure frontend, no API calls |
| **Auth** | None | No authentication layer |
| **DB** | None | No database |
| **Env vars** | `.env.local` with `GEMINI_API_KEY` | Exposed via `vite.config.ts` but **not used anywhere in the code** |

### Component Map

```
App.tsx
├── Navbar.tsx          — Fixed top nav, scroll-aware color change, mobile hamburger
├── Hero.tsx            — Full-bleed purple hero, product mockup, floating badges
├── LogoStrip.tsx       — "Trusted by" school name strip (text placeholders, no real logos)
├── ValueProps.tsx      — 3-column value proposition grid (Reduce workload / Personalize / Trust)
├── FeaturesGrid.tsx    — Bento-grid feature cards (AI co-pilot, Instant Updates, Analytics)
├── Testimonials.tsx    — Pastel testimonial cards in a masonry-style grid
├── ImpactCalculator.tsx — Interactive slider: students → hours saved (only stateful component)
├── CTA.tsx             — Final conversion section
└── Footer.tsx          — 5-column footer with nav links
```

---

## Safety & File-Change Rules

- **Before touching any file**, annotate it in this document under "Files Planned for Change".
- **KEEP** = small, safe edits (copy, minor style tweaks)
- **MODIFY** = structural or feature changes
- **REMOVE** = dead code only, requires explicit confirmation
- **No deletions or moves** without a note here and user confirmation.
- **No changes outside `elora---ai-teaching-assistant/`** without explicit approval.

---

## Files Planned for Change

*(This section will be populated before any work begins. Currently empty — discovery pass only.)*

| File | Status | Reason |
|---|---|---|
| — | — | No changes planned yet |

---

## Improvement Task List

### 🎨 UI/UX Polish

- [ ] **P1 — Hero CTA buttons are non-functional**: "Book a demo" and "Watch video" buttons have no `href` or `onClick`. Wire them up (even to `#` anchors or a modal placeholder).
- [ ] **P2 — LogoStrip has no real logos**: Text-only placeholders look unfinished. Replace with SVG wordmarks or styled logo blocks.
- [ ] **P3 — Navbar "Product" dropdown does nothing**: The `ChevronDown` button has no dropdown panel. Either add a dropdown or remove the chevron.
- [ ] **P4 — All nav links are dead `#` anchors**: Internal section links (`#solutions`, `#customers`, `#pricing`) don't scroll to real sections. Add `id` attributes to matching sections.
- [ ] **P5 — Hero product mockup is all grey skeleton**: The dashboard "screenshot" is entirely placeholder divs. Could be upgraded to a more realistic UI mockup.
- [ ] **P6 — LogoStrip has no scroll animation**: A marquee/ticker animation would feel more premium for a "trusted by" strip.
- [ ] **P7 — ImpactCalculator formula is inconsistent**: Monthly calc uses `* 4` but yearly uses `* 9` (school year months). Should be consistent and documented.
- [ ] **P8 — Footer copyright year is hardcoded 2024**: Should be dynamic (`new Date().getFullYear()`).
- [ ] **P9 — No mobile menu close-on-link-click**: Mobile nav stays open after tapping a link.
- [ ] **P10 — No scroll-to-top button**: Long page with no way to quickly return to top.

### 🏗️ Code Quality / Structure

- [ ] **Q1 — Tailwind loaded via CDN**: This is a dev-only pattern. For production, Tailwind should be installed as a PostCSS plugin. The CDN version is ~3x larger and can't be purged.
- [ ] **Q2 — Tailwind config is inline in `index.html`**: Should live in `tailwind.config.js` alongside the project.
- [ ] **Q3 — No `index.css` file**: Referenced in `index.html` (`<link rel="stylesheet" href="/index.css">`) but doesn't exist — this will 404.
- [ ] **Q4 — Magic numbers in ImpactCalculator**: `0.5` and `9` are unexplained constants. Extract to named constants with comments.
- [ ] **Q5 — Inline SVGs duplicated**: The Elora logo SVG path is copy-pasted in `Navbar.tsx` and `Footer.tsx`. Extract to a shared `<EloraLogo />` component.
- [ ] **Q6 — No shared `Button` component**: Every button is hand-styled inline. A `<Button variant="primary|ghost|outline">` component would reduce duplication.
- [ ] **Q7 — `GEMINI_API_KEY` in vite.config but unused**: Either wire it up or remove the dead config to avoid confusion.
- [ ] **Q8 — No TypeScript strict mode**: `tsconfig.json` should be reviewed for strictness settings.
- [ ] **Q9 — No `eslint` or `prettier` config**: No linting or formatting tooling present.

### ⚡ Performance / Reliability

- [ ] **R1 — External noise texture from `grainy-gradients.vercel.app`**: Hero background loads an image from a third-party URL. Should be self-hosted or replaced with a CSS-only grain effect.
- [ ] **R2 — No `<meta>` SEO tags**: `index.html` has a title but no description, OG tags, or Twitter cards.
- [ ] **R3 — No `favicon`**: No favicon defined.
- [ ] **R4 — Google Fonts loaded without `font-display: swap`**: Can cause layout shift. The `display=swap` param is already in the URL — just worth verifying it's working.
- [ ] **R5 — Tailwind CDN blocks render**: The CDN `<script>` tag is synchronous and blocks page rendering. PostCSS install would eliminate this.
- [ ] **R6 — `animate-pulse` and `animate-[bounce_4s_infinite]` run forever**: No `prefers-reduced-motion` media query respect.

### 🛠️ Developer Experience

- [ ] **D1 — No `README` with run instructions**: `README.md` exists but is minimal. Should include `npm install`, `npm run dev`, and env var setup.
- [ ] **D2 — No `.env.example`**: Developers don't know what env vars are needed.
- [ ] **D3 — No linting/formatting**: Add `eslint` + `prettier` with a basic config.
- [ ] **D4 — No component documentation**: No JSDoc or prop types on any component.
- [ ] **D5 — `metadata.json` purpose unclear**: A `metadata.json` exists at root with no explanation. Should be documented or removed if unused.

---

## Proposed First Steps (Awaiting Your Approval)

These are the changes I'd suggest tackling **first**, in order of impact vs. risk:

1. **Q3 (Critical bug)** — Create the missing `index.css` file. This is a silent 404 on every page load.
2. **P8 (Trivial)** — Fix hardcoded copyright year.
3. **Q5 (Low risk, high reuse)** — Extract shared `<EloraLogo />` component.
4. **P4 (UX)** — Add `id` attributes to sections so nav links work.
5. **P9 (UX)** — Close mobile menu on link click.

I will **not start any of these** until you confirm which items to proceed with.
