# Orchestration Plan: Savantix (Aegis) Production Polish & Expansion

## Objective
Deliver a rock-solid, production-grade enhancement to Savantix (Aegis) covering:
1. Contact & Community Feedback Hub (Free endpoint/mailto fallback, categories, validation, toasts).
2. Distraction-Free YouTube Focus Engine (100% reliability, zero unavailable screens, postMessage control without iframe reloads, <200ms auto-skip).
3. Production UI/UX Refinement (chart sizing warnings eliminated, mobile layout overflow fixes, responsive breakpoints, crisp STEM tools rendering).
4. Automated Health Verification & MCP Navigation (TypeScript zero-error compilation, clean Vite build, BrowserOS MCP navigation verified with 0 console errors).
All under a strict **Zero Data Loss Guarantee** for existing localStorage and Firestore study sessions, goals, streaks, and profile targets.

## Methodology & Milestones

### Phase 0: Survey & Architecture Discovery
- Spawn 3 parallel Explorers:
  - `explorer_1`: Survey Navigation, Layout, and Contact Hub integration points (`src/components/Navigation.tsx`, `src/components/Layout.tsx`, `src/App.tsx`, routes).
  - `explorer_2`: Survey YouTube Focus Player & Audio integration (`src/components/YouTubeFocusPlayer.tsx` or audio engine, Pomodoro timer interaction, video ID catalog).
  - `explorer_3`: Survey UI/UX, Chart components (Recharts ResponsiveContainer setups), Mobile layout breakpoints, STEM tools (`src/components/STEMSolver.tsx`, `FormulaPalette.tsx`, `Scratchpad.tsx`, etc.), and persistence layer (`src/context/AppContext.tsx`).

### Phase 1: Implementation Track
- **M1 (Contact Hub)**: Dedicated Contact & Feedback page/modal with category selection (Bug Report, Feature Request, Academic Collaboration, General Inquiry), free client-side endpoint (Formsubmit/Web3Forms/Formspree + mailto fallback), validation & toasts.
- **M2 (YouTube Engine Polish)**: Curated evergreen track library, postMessage API play/pause without iframe reloads during Pomodoro ticks, sub-200ms auto-fallback on error.
- **M3 (UI/UX Refinement)**: Fix Recharts sizing warnings (explicit dimensions or proper ResponsiveContainer wrapper checks), mobile overflow fixes, responsive breakpoints, crisp STEM tool styling.

### Phase 2: Testing, Review, Challenge & Audit Track
- **E2E & Unit Test Writing**: Comprehensive test coverage via `teamwork_preview_test_writer`.
- **Independent Reviews**: 2 Reviewers reviewing code quality, responsiveness, and contract conformance.
- **Adversarial Verification**: 2 Challengers testing edge cases, network fallbacks, and mobile views.
- **Forensic Audit**: `teamwork_preview_auditor` verifying genuine implementation and Zero Data Loss compliance.
- **Live MCP Verification**: Validating all routes via BrowserOS MCP with 0 console errors.

## Acceptance Criteria
- [ ] TypeScript compilation (`tsc --noEmit`) passes with 0 errors.
- [ ] Vite production build completes cleanly.
- [ ] BrowserOS live navigation across all tabs/routes with 0 console errors.
- [ ] All existing localStorage and Firestore study logs, goals, and user profile targets remain completely intact.
