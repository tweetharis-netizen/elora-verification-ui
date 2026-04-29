# Student Copilot Phase 1: Threading, Guardrails & Low-Anxiety Learning

## Overview

This PR implements **Student Copilot Phase 1**, establishing a focused learning companion that drives structured, anxiety-free support for students. It introduces:

1. **Weekly Subject Threading** – Primary organizational unit for student conversations
2. **Server-Side Guardrails** – Auto-detection of struggle patterns (3+ wrong attempts, negative self-talk)
3. **UI Enforcement** – 2 freeform-message rule to prevent unstructured chat and surface concrete actions
4. **Warmup Responder** – Easy practice examples for concept recovery after repeated failures

---

## Key Features & Architecture

### 1. Database & Core Models

**New Tables:**
- `student_conversations` – Weekly subject threads with rolling summaries
- `student_conversation_messages` – Message log with metadata for intent/source/tags

**Schema Highlights:**
- `threadType`: Enum of `weekly_subject` | `checkpoint` | `free_study`
- `summary`: TEXT field for rolling AI summary (updated on each message)
- Metadata JSON support for tracking attempt counts, self-talk flags, task/topic links

### 2. Server-Side Implementation

#### New Endpoints
- **POST** `/api/student/copilot/conversations/:id/messages`
  - Auto-detects and flags guardrails: `wrongAttemptsCount`, `requireWarmup`, `negativeSelfTalkDetected`
  - Returns guardrail metadata in response for UI to act on
  - Inline summarizer updates conversation summary on each message

- **POST** `/api/student/copilot/conversations/:id/summarize`
  - Explicit summarizer endpoint (future: can swap to LLM-based)
  - Collects recent user asks and assistant guidance

- **GET** `/api/student/copilot/conversations/:id/warmup?conceptId={id}`
  - Returns pre-made easy practice example for concept recovery
  - Supports concept-keyed warmups (algebra-factorisation, fractions, etc.) + fallback

#### Guardrail Logic (server/controllers/students.ts)

```typescript
// After 3+ wrong attempts on same concept → requireWarmup = true
// Detected by metadata.attempt.conceptId + outcome = 'wrong'

// Negative self-talk detection
const negativePatterns = ["i'm stupid", "i can't", "i suck", ...];
// If detected → negativeSelfTalkDetected = true
// UI should acknowledge emotion, offer short break, no new tasks
```

### 3. UI Implementation

#### ActionProposalModal (src/components/StudentCopilot/ActionProposalModal.tsx)
- Surfaces after 2 consecutive freeform messages
- Offers 3 concrete actions:
  1. **Tackle nearest task** – Links to overdue/due-soon assignment
  2. **10-minute sprint** – Quick drill with Copilot guidance
  3. **Review weak area** – Targeted practice on known struggle topic
- Low-anxiety design: encourages choice without shaming

#### StudentCopilotPage Updates
- **Freeform tracking**: `consecutiveFreeformCount` state
- **isFreeformMessage()** helper: detects messages that don't use quick-action chips
- **Reset logic**: Freeform count resets to 0 when student picks a chip or action
- **Guardrail integration**: Displays server flags (warmup hint, self-talk acknowledgment) in future iterations

### 4. Testing

**Smoke Test** (scripts/test-student-copilot-guardrails.mts)
- ✅ Creates test conversation
- ✅ Posts 3 wrong attempts with metadata
- ✅ Validates `wrongAttemptsCount >= 3` triggers `requireWarmup = true`
- ✅ Verifies warmup examples available for concept
- **Run**: `npx tsx scripts/test-student-copilot-guardrails.mts`

---

## Files Changed

### Backend
- `server/controllers/students.ts`
  - Added `appendStudentCopilotMessage` guardrail detection
  - Added `summarizeStudentCopilotConversation` endpoint
  - Added `getWarmupExample` endpoint with concept-keyed warmup library
  
- `server/routes/students.routes.ts`
  - Wired summarizer route
  - Wired warmup endpoint

- `server/database.ts` – _(pre-existing)_
  - `student_conversations` table
  - `student_conversation_messages` table
  - Indexes on (student_id, week_key, subject) and (conversation_id, created_at)

### Frontend (Client)
- `src/pages/StudentCopilotPage.tsx`
  - Added `consecutiveFreeformCount` state
  - Added `showActionProposal` state
  - Added `isFreeformMessage()` helper
  - Added guardrail-aware `handleSend()` logic
  - Added `handleSelectTask()`, `handleSelectSprint()`, `handleSelectTopic()` handlers
  - Integrated `<ActionProposalModal />`

- `src/components/StudentCopilot/ActionProposalModal.tsx` _(new)_
  - Modal UI for concrete action proposal
  - Low-anxiety design with 3 prominent options
  - Icon + copy for clarity

- `src/services/dataService.ts`
  - Added `summarizeStudentConversation()` client helper

- `src/lib/llm/types.ts`
  - Added `StudentCopilotConversation` interface
  - Added `StudentCopilotConversationMessage` interface

### Testing
- `scripts/test-student-copilot-guardrails.mts` _(new)_
  - Smoke test for wrong-attempts guardrail logic

---

## Validation

### Lint & Type Checks
- ✅ `npm run lint` – TypeScript 5.8.2 passes with no errors

### Smoke Tests
- ✅ Wrong-attempts detection (3 attempts → requireWarmup)
- ✅ Warmup examples keyed by concept
- ✅ DB cleanup (test isolation)

---

## Low-Anxiety Design Principles Applied

1. **No shame framing**: Overdue tasks use "restart" not "failed"
2. **Warmup on struggle**: After 3 wrong attempts → offer easy example, not harder drill
3. **Self-talk acknowledgment**: If student says "I'm stupid" → acknowledge emotion, offer break
4. **Structured guidance**: 2 freeform-message rule prevents aimless chat; surfaces concrete next steps
5. **Actionable copilot**: Every exchange has a clear intent (explain, practice, sprint, review)

---

## Future Roadmap (Post-Phase-1)

1. **Arena Integration**: Wire practice questions into student threads with attempt tracking
2. **Dashboard Deep-Link**: Top Tasks feed → direct entry to subject-week thread with linked context
3. **LLM-Based Summarizer**: Replace simple summarizer with Gemini/GPT for richer context priming
4. **Shared Table Migration**: Migrate from interim `student_*` tables to unified `copilot_*` with roleScope
5. **Extended Guardrails**:
   - Milestone celebration after 5-day streak
   - "You've been working 45 min, take a break" nudge
   - Peer context ("others find this topic tricky too")

---

## How to Review

1. **Backend Logic**: Check [server/controllers/students.ts](server/controllers/students.ts#L468-L540) for guardrail detection
2. **Warmup Library**: Check [server/controllers/students.ts](server/controllers/students.ts#L541-L595) warmup examples
3. **UI State**: Check [src/pages/StudentCopilotPage.tsx](src/pages/StudentCopilotPage.tsx#L260-L280) freeform tracking
4. **Modal Design**: Check [src/components/StudentCopilot/ActionProposalModal.tsx](src/components/StudentCopilot/ActionProposalModal.tsx)
5. **Test**: Run `npx tsx scripts/test-student-copilot-guardrails.mts`

---

## Deployment Notes

- **DB Migration**: Tables created automatically on server start (no manual migration needed for SQLite)
- **No Breaking Changes**: Uses interim `student_*` tables; Teacher Copilot unaffected
- **Backward Compatible**: Existing student conversations not affected
- **Feature Flag Ready**: `showActionProposal` modal can be gated by environment var if needed

---

## Checklist

- [x] Database schema defined and applied
- [x] Server API routes implemented + tested
- [x] Shared TypeScript types added
- [x] UI page components created with guardrail logic
- [x] Warmup responder endpoint + examples
- [x] Smoke test implemented & passing
- [x] Lint & type checks passing
- [x] Low-anxiety design principles applied
- [x] Feature branch created
- [x] PR description written

---

## Questions / Notes for Reviewers

1. **Warmup examples scope**: Currently 4 concepts + fallback. Should we expand or use LLM to generate?
2. **Summary update frequency**: Currently updates inline on every message. Consider async batch if performance issue.
3. **Freeform threshold**: Currently 2 consecutive. A/B test to find optimal UX balance?
4. **Mobile modal**: ActionProposalModal slides from bottom on mobile. Any UX concerns?

