# Elora Repo Interrogation Snapshot (Summarized)

Date: 2026-04-09  
Scope: Read-only architecture scan (no code edits)

## 1) Executive Summary

This repo is a role-based React + TypeScript frontend with an Express + SQLite backend. The main role experiences (Student, Teacher, Parent) are routed in a central app router, wrapped by role-specific shell layouts, and powered by a typed client/service layer with demo fallback data.

Current Copilot/assistant surfaces are real and distributed across dedicated Copilot pages plus dashboard-level actions (nudges, suggestions, practice generation). Auth is currently demo-oriented and localStorage-backed, with good structural seams for introducing real account/session handling.

Two named touchpoints were validated:
- Student "Message from your parent" toast exists (nudge-driven flow).
- Parent "Get Conversation Starters" modal does not appear to exist by that exact feature/name; closest existing flow is a "Send a Nudge" modal plus messages/tips surfaces.

## 2) Repo Map

- src
  - React app: routes, pages, role shells, shared UI, hooks, services, demo datasets.
- server
  - Express routes/controllers, middleware, DB access, notification factory.
- api
  - Serverless-compatible entry surface for deployment/runtime integration.
- public
  - Static assets.
- Root config/scripts
  - vite, tsconfig, vercel, diagnostics/check scripts.

## 3) Routing and Role Surfaces

Primary route wiring:
- src/App.tsx

Role shell layouts:
- src/components/layout/StudentShellLayout.tsx
- src/components/layout/TeacherShellLayout.tsx
- src/components/layout/ParentShellLayout.tsx
- Shared header: src/components/DashboardHeader.tsx

Primary role pages:
- Student
  - src/pages/StudentDashboardPage.tsx
  - src/pages/StudentCopilotPage.tsx
  - src/pages/StudentClassroomPage.tsx
  - src/pages/StudentGamePage.tsx
- Teacher
  - src/pages/TeacherDashboardPage.tsx
  - src/pages/TeacherCopilotPage.tsx
  - src/pages/TeacherPracticePage.tsx
  - src/pages/TeacherClassroomPage.tsx
- Parent
  - src/pages/ParentDashboardPage.tsx
  - src/pages/ParentCopilotPage.tsx
  - src/pages/ParentClassroomPage.tsx

Notes:
- Protected routing exists and role pages are generally mounted inside shell layouts.
- Student and Parent dashboard pages include embedded/local-shell guard logic for standalone usage paths.

## 4) Data Models and Mock Layer

Primary typed service/model surface:
- src/services/dataService.ts

Representative model families in use:
- Student: StudentAssignment, StudentDashboardData, StudentStreak, ParentNudge
- Teacher: TeacherClass, TeacherStat, TeacherInsight, TeacherReviewWorkItem
- Parent: ParentChild, ParentChildSummary, ParentInsight
- Practice/Game: GameQuestion, GamePack, QuestionResult, GameSession

Mock/demo data sources:
- src/demo/demoStudentScenarioA.ts
- src/demo/demoTeacherScenarioA.ts
- src/demo/demoParentScenarioA.ts
- Legacy/compat mock passthrough surface: src/services/mockData.ts

Backend role API surfaces:
- server/routes/students.routes.ts
- server/routes/teacher.routes.ts
- server/routes/parents.routes.ts

Patterns observed:
- API-first typed calls with page-level demo fallback.
- Bulk fetch and client-side shaping/filtering common.
- Status values like not_started, in_progress, submitted, overdue appear across layers.
- No clear first-class frontend pagination pattern in inspected service contracts.

## 5) Assistant/Copilot Hooks

Shared assistant UI/types:
- src/components/Copilot/CopilotShared.tsx

Role Copilot pages:
- src/pages/StudentCopilotPage.tsx
- src/pages/TeacherCopilotPage.tsx
- src/pages/ParentCopilotPage.tsx

AI request wrapper:
- src/services/askElora.ts

Intent/helper logic:
- src/lib/parentIntentHandler.ts
- src/services/studentSuggestionService.ts
- src/services/classSuggestionService.ts

Validated named touchpoints:
- Student "Message from your parent" toast
  - Present in src/pages/StudentDashboardPage.tsx
  - Backed by nudge state/load/read handling and periodic refresh pattern.
- Parent "Get Conversation Starters" modal
  - Not found by exact feature/name in inspected src tree.
  - Closest existing experience in src/pages/ParentDashboardPage.tsx is "Send a Nudge" modal and messages/tips-oriented surfaces.

## 6) Auth and Account Model (Current State)

Auth context:
- src/auth/AuthContext.tsx

Current behavior:
- Demo-first auth model with role-based CurrentUser state.
- Local persistence key is used for current user state.
- Role switching/demo entry surfaces exist via:
  - src/components/DemoRoleSwitcher.tsx
  - src/components/FloatingExperienceController.tsx

Routing guard seam:
- src/components/ProtectedRoute.tsx

Interpretation:
- Structure supports introducing true account/session auth without major route architecture changes.

## 7) Layout/Theme and Token Sources

Primary token/theme sources:
- src/index.css
- src/lib/roleTheme.ts

Reusable dashboard primitives:
- src/components/ClassSummaryCard.tsx
- src/components/NotificationsPopover.tsx
- src/components/ui/SectionStates.tsx
- src/components/DashboardHeader.tsx

Observation:
- Core tokens are centralized, but some page-level hardcoded values still exist.

## 8) Gaps and Confirmed Absences

- No explicit ParentWeeklySummary interface was identified in scanned type surfaces.
- No explicit StudentWorkItem interface was identified; equivalent task structures appear page-derived.
- No exact "Get Conversation Starters" modal found by that name/string.

## 9) Implementation Readiness: Conversation/Thread Persistence

Recommended incremental schema/type additions:
- Add optional conversationId/threadId on shared chat message model in:
  - src/components/Copilot/CopilotShared.tsx
- Add assistant thread pointer metadata in user/session boundary types in:
  - src/auth/AuthContext.tsx
- Add per-child/per-class summary linkage fields in:
  - src/services/dataService.ts

Recommended backend expansion:
- Add conversation/history tables (per role/user/context).
- Add role-scoped history APIs adjacent to current role endpoints.
- Keep demo fallback paths active until backend rollout is complete.

Low-friction rollout path:
1. Add optional frontend fields first (non-breaking).
2. Start writing IDs/history when backend available.
3. Backfill read paths and add per-role thread selection UX.
4. Remove temporary fallback behavior once stable.

## 10) Verification

- Read-only inspection completed.
- No source code refactor or feature edits were performed.
- This file is a documentation artifact for PM/Designer/engineering handoff.
