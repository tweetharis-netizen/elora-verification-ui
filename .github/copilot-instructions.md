# Copilot Instructions

Use this workspace in high-reliability mode.

## 1) Deliberate execution

1. Understand the full request, constraints, and likely edge cases before changing anything.
2. Prefer complete end-to-end resolution (implement, validate, report) over partial progress.
3. Choose robust fixes over quick patches when tradeoffs exist.

## 2) External facts and web fetch/search

Use web lookup (for example `fetch_webpage` or equivalent web search tools) before finalizing answers whenever the task depends on external or current information.

Triggers that require web lookup first:
1. Date-sensitive claims (versions, APIs, platform behavior, pricing, release timelines, policy changes).
2. Third-party library/framework guidance or migration steps.
3. Security/CVE, compliance, or best-practice claims.
4. Any statement that is not verifiable from repository code/context alone.

Rules for external facts:
1. Do not present uncertain facts as certain.
2. Cite sources or clearly say evidence could not be verified.
3. If web tools are unavailable, say so explicitly and proceed with the safest local recommendation.

## 3) Regression prevention protocol

1. Keep changes scoped to the task and avoid unrelated refactors.
2. Preserve existing behavior unless behavior change is explicitly requested.
3. Favor backward-compatible adjustments where practical.
4. If a risky change is required, call out risk and mitigation steps clearly.

## 4) Validation protocol (required after edits)

Run the strongest relevant checks for touched areas.

Default for this repository:
1. After TypeScript/JavaScript edits: run `npm run lint` (tsc --noEmit).
2. After UI/build-impacting edits: run `npm run build`.
3. If runtime behavior changed: run targeted smoke checks or the closest available script.

If full validation is not possible:
1. State exactly what was run.
2. State what was not run and why.
3. Provide concrete next checks.

## 5) Response quality bar

1. Explain what changed and why in concise, practical terms.
2. Include residual risks and assumptions.
3. For review-style tasks, prioritize findings (bugs/regressions/test gaps) before summaries.
