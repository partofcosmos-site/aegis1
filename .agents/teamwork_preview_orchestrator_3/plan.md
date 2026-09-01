# Plan & Execution Roadmap — teamwork_preview_orchestrator_3

## Objective
Transform Savantix (Aegis) into an ultra-practical, production-grade study and institutional attendance operating system featuring historical academic record ingestion for The Bandhan School Aranghata (CBSE XI-Science), an intelligent attendance regulator AI with direct zero-cost Gemini Web bridging, dynamic daily insight regeneration, seamless cross-device cloud sync, and 2028 academic targets.

## Execution Phases

### Phase 0: Survey & Technical Mapping
- **Explorer 1**: Investigated `AttendanceTracker.tsx`, data structures, The Bandhan School Aranghata records, on-duty credits, math formulas, and Gemini AI Regulator bridge.
- **Explorer 2**: Investigated `Dashboard.tsx`, `InsightsPanel.tsx`, dynamic insight re-analysis, and real-time cloud sync in `cloudSyncService.ts` / `AppContext.tsx`.
- **Explorer 3**: Investigated `AIGateway.tsx`, Fast Model Roster, Socratic KaTeX derivations, Cosmos branding, and master test suite setup in `src/test/`.

### Phase 1: Implementation (Disjoint File Ownership)
- **Worker 1 (M1 & M2)**: Implemented `AttendanceTracker.tsx`, `AttendanceCalculator.tsx`, `attendanceRegulatorService.ts`, `attendance.ts` with exact ground truth (71 days held as of Sept 1 2026, 48 present, 23 absent, 10 on-duty IIT KGP credits, 28 holidays, 4 vacations, 4 exams, 1-click Gemini Regulator bridge).
- **Worker 2 (M3 & M4)**: Implemented "🔄 Re-analyze with Latest Logs" in `InsightsPanel.tsx` & `Dashboard.tsx`, startup state rehydration in `AppContext.tsx`, and real-time Firestore sync with zero data loss in `cloudSyncService.ts`.
- **Worker 3 (M5)**: Implemented 7-model Fast Launch Bar, Socratic KaTeX derivation drawer with `Alt+G` hotkey in `AIGateway.tsx`, and *"An initiative of Part of Cosmos"* branding with student identity protection in `Layout.tsx` & `App.tsx`.
- **Master Test Writer (M6)**: Built 62 comprehensive E2E unit tests across 9 test suites in `src/test/`.
- **Worker 4 (Polish)**: Declared `FOUNDER_EMAIL` in `ContactFeedback.tsx` and verified 0 `tsc` errors.

### Phase 2: Independent Review, Challenge & Forensic Audit (Iteration 1)
- **Reviewer 1**: APPROVE on M1 & M2.
- **Reviewer 2**: APPROVE on M3, M4, M5.
- **Challenger 1**: REQUEST_CHANGES (Identified falsy zero coercion `||` -> `??` in `computeLiveMetrics`).
- **Challenger 2**: APPROVE on multi-session log merging & cloud sync collisions.
- **Forensic Auditor**: CLEAN (0 integrity violations, clean build, authentic logic).

### Phase 3: Remediation & Timeline Update (Worker 5)
- **Worker 5**: Replaced `||` with `??` across `attendanceRegulatorService.ts`, and unified the 2-year Class 11–12 timeline (IPhO Gold Track priority / NSEP Nov 2026 / INPhO Jan 2027, Class 12 CBSE Boards March 2028, JEE Advanced May 2028, ISI & CMI May 2028).

### Phase 4: Final Re-verification (Iteration 2 — Gate PASS)
- **Challenger 1 Re-verification**: APPROVE (Falsy zero bugfix verified with 10,000 randomized property fuzzing iterations; 2028 IPhO roadmap verified; 62/62 tests passed in 48ms; clean Vite build).
- **Gate Verdict**: PASS across all criteria.
