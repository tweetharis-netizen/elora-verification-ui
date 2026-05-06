# Copilot Manual QA Checklist

This checklist is for manual browser QA of Elora Copilot after the v3.3 behavioral refinements.

## How to Run

1. Start the app:

```bash
npm run dev
```

2. Open the relevant route for the role you want to test.

### Copilot routes

- Student Copilot: `/student/copilot`
- Teacher Copilot: `/teacher/copilot`
- Parent Copilot: `/parent/copilot`

### Demo routes if you want an auth-free path

- Student demo shell: `/student/demo/copilot`
- Teacher demo shell: `/teacher/demo/copilot`
- Parent demo shell: `/parent/demo/copilot`

## Greeting & Personalization (v4)

Verify greeting and personalization flows for each role:

- Student: send "Hi" or "Hey" and confirm the assistant replies by name (if available), identifies itself as the student Copilot, and offers starter actions such as "Review a topic" or "Create a practice quiz".
- Teacher: say "Hi" and confirm the assistant replies like a colleague, references one context item when available (class or task), and offers starter actions like "Plan a lesson".
- Parent: say "Hi" and confirm the assistant replies by name, offers "Simplify a report" and lists 2–3 Home Actions when summarising.

Ensure greetings are short (1–2 sentences) and that guardrails around homework/data remain enforced.

If you are already signed in, use the protected routes. If you want a quick smoke test without auth, use the demo routes.

## Student Copilot QA

### 1) Basic homework help with guardrails

- Open Student Copilot.
- Attach a worksheet or mention a specific question like "I’m stuck on Q3".
- Make sure the situation is clearly homework or marked practice work.
- Ask: "I’m stuck on question 3 of this worksheet. Can you help me?"

Verify:

- The tone is brief, validating, and calm.
- The response follows the structure:
  - Quick Check
  - Let’s break it down
  - Your turn
- The explanation gives hints and scaffolding rather than a final answer.
- Any follow-up suggestion chips feel relevant and practical.

### 2) Practice explanation

- Ask: "Can you explain how to solve 2-step equations?"

Verify:

- The response is clear and step-by-step.
- It includes a short reflection prompt under Your turn.
- A worked example is allowed because this is practice, not marked homework.

### 3) Student mode behavior

Try each prompt below and check that the response feels nudged in the right direction:

- "I’m just trying to understand the big idea of photosynthesis" → exploratory
- "I tried solving it like this [paste attempt] but I got stuck" → details
- "I think the answer is X because Y. Am I right?" → dig_deeper
- "Can you quickly summarize this so I can review before my quiz?" → wrap_up
- "Please just tell me the answer to #5" while the task is homework → firmness

Verify:

- Exploratory feels broad and discovery-focused.
- Details feels more targeted and step-by-step.
- Dig_deeper asks about reasoning or assumptions.
- Wrap_up becomes concise and summary-oriented.
- Firmness refuses to give the direct answer and redirects to understanding the steps.

### 4) Suggestion suppression

- After a good answer, say: "Thanks, that’s all for now!"

Verify:

- The assistant does not show suggestion chips after the response.
- The main answer still renders normally.

## Teacher Copilot QA

### 1) Lesson plan generation

- Open Teacher Copilot.
- Ask: "Help me plan a 40-minute lesson on photosynthesis for grade 8."

Verify:

- The response is plug-and-play and practical.
- It clearly includes or strongly implies these sections:
  - Objectives
  - Warm-up
  - Main activity
  - Differentiation
  - Assessment / Exit ticket
- The content is concise enough to paste into a planning doc or LMS.

### 2) 3-tier differentiation quick action

- With the lesson in the conversation, click "3-tier differentiation".

Verify:

- The response starts with a short intro.
- Below / On / Above levels are clearly separated.
- Each tier has 1–2 concrete ideas, not a wall of text.
- An artifact appears in ArtifactStudio with a usable title and summary.

### 3) Rubric-like output

- Ask: "Create a short rubric for this task."

Verify:

- The response includes 3–4 criteria.
- It uses 3 levels, such as Emerging / Proficient / Advanced.
- It suggests a formative check or exit ticket.

### 4) Suggestion suppression

- After the teacher task is complete, say: "Thanks, I’m done planning for this lesson."

Verify:

- No extra suggestion chips appear.
- The reply remains concise and does not keep pushing follow-up chips.

## Parent Copilot QA

### 1) Simplify report + actions

- Open Parent Copilot.
- Paste or attach a noisy progress report.
- Click "Simplify + Actions".

Verify:

- The response includes these sections:
  - Big picture
  - Strengths
  - Things to work on
  - How you can help at home
- Home actions are concrete, time-bound, and low-friction.
- The language feels collaborative with school staff.

### 2) Jargon translation

- Include terms like "formative assessment", "IEP", or "504 plan" in the source report.

Verify:

- Each term is explained in plain language the first time it appears.
- The parent-facing explanation stays calm and readable.

### 3) Parent artifact in ArtifactStudio

- Confirm the Simplify + Actions flow creates an artifact.
- Open the artifact panel if needed.

Verify:

- The artifact title is useful.
- The summary is short and understandable.
- The content is something a parent could refer back to later.

### 4) Suggestion suppression

- After a clear answer, say: "Thanks, that explains it. That’s all."

Verify:

- No follow-up suggestion chips appear.
- The answer closes cleanly.

## Cross-Role Sanity Checks

- Switch between Student, Teacher, and Parent Copilot in the same browser session.
- Confirm artifacts do not leak between roles.
- Confirm the context chips still match the current role and attached materials.
- Confirm suggestion chips only appear when the user is still actively seeking next steps.

## Notes

- This checklist is meant for manual browser QA, not automated coverage.
- No QA-only runtime flag or logging helper was added in this pass.
- The automated suite already covers prompt behavior, suggestion suppression, artifact parsing, and quick-action text.

## Cross-Browser Layout Baseline

- Global styles use Tailwind preflight plus explicit reset in `src/index.css`:
  - `*, *::before, *::after { box-sizing: border-box; }`
  - `html, body, #root` use `margin: 0`, `padding: 0`, and `height: 100%`
- Copilot viewport locking supports both classic and dynamic viewport units for embedded contexts:
  - `100vh` fallback
  - `100dvh` minimum for modern browsers and iframe previews
- Copilot shell is expected to render consistently in full-screen and embedded views without hiding UI elements.

### Suggested viewport smoke sizes

- 1280x720 (desktop landscape)
- 1024x768 (tablet landscape)
- 768x1024 (tablet portrait)
- 390x844 (mobile portrait)
